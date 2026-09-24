import dotenv from 'dotenv';
import express from 'express';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { readFile } from 'node:fs/promises';
import { createClient } from '@supabase/supabase-js';
import WebSocket from 'ws';
import { createPaidCheckout, fulfillCheckout, handleStripeWebhook, listSessions, selectClassAndContinue, signupAdult, signupKid } from './momence.mjs';
import { sendMetaCapi } from './meta-capi.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, '../../../.env') });
dotenv.config({ path: path.resolve(__dirname, '../.env'), override: true });
const port = Number(process.env.PORT || 8787);
if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
  console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY. Copy .env.example to .env and configure both values.');
  process.exit(1);
}
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
  realtime: { transport: WebSocket },
});
const asyncRoute = (handler) => async (req, res) => {
  try { await handler(req, res); }
  catch (error) { console.error(error); res.status(500).json({ error: error instanceof Error ? error.message : 'Unexpected server error' }); }
};
const app = express();
app.post('/api/stripe/webhook', express.raw({ type: 'application/json' }), asyncRoute(async (req, res) => {
  const signature = req.get('stripe-signature');
  if (!signature) return res.status(400).json({ error: 'Missing Stripe signature header.' });
  res.json(await handleStripeWebhook(req.body, signature));
}));
app.use(express.json({ limit: '1mb' }));
app.post('/api/tracking/meta-capi', asyncRoute(async (req, res) => {
  const allowed = new Set(['Lead', 'WaiverSigned', 'CompleteRegistration', 'ClassBooked']);
  if (!allowed.has(req.body?.eventName) || !String(req.body?.eventId || '').trim()) return res.status(400).json({ error: 'Invalid tracking event' });
  res.json({ success: true, ...(await sendMetaCapi({ ...req.body, request: req })) });
}));

const HERO_IMAGES = [
  'https://images.fillout.com/orgid-616887/flowpublicid-7ksdzxvvc1/widgetid-default/s9wMadXfeYFPAp7MyaEAgr/pasted-image-1782902048664-tp5ozxot.jpg',
  'https://images.fillout.com/orgid-616887/flowpublicid-7ksdzxvvc1/widgetid-default/cJjjjDeBebwXRDrFVfFJaK/pasted-image-1782902048703-ofe6memh.jpg',
  'https://images.fillout.com/orgid-616887/flowpublicid-7ksdzxvvc1/widgetid-default/mmUCR2FxaR9Fb3jCAhurPv/pasted-image-1782902048717-7wv8yd0j.jpg',
  'https://images.fillout.com/orgid-616887/flowpublicid-7ksdzxvvc1/widgetid-default/u9jU9DNCjvonekiUXxBbJH/pasted-image-1782902048729-6njfv4g9.jpg',
  'https://images.fillout.com/orgid-616887/flowpublicid-7ksdzxvvc1/widgetid-default/oMkb6DjugzjG797U55LBVM/pasted-image-1782902048752-etw407bk.jpg',
  'https://images.fillout.com/orgid-616887/flowpublicid-7ksdzxvvc1/widgetid-default/58qNnJL3EL4MF62HQEs6yA/pasted-image-1782902048768-i04s9o55.jpg',
  'https://images.fillout.com/orgid-616887/flowpublicid-7ksdzxvvc1/widgetid-default/61eCRLbFKFPwoowdwvvaH2/pasted-image-1782902048789-09kcsqk1.jpg',
  'https://images.fillout.com/orgid-616887/flowpublicid-7ksdzxvvc1/widgetid-default/n3WfwNPSpc7hXetukVhWZc/pasted-image-1782902048806-m84p5gkd.jpg',
  'https://images.fillout.com/orgid-616887/flowpublicid-7ksdzxvvc1/widgetid-default/hE8EfAKjgiatvJCWPRN311/pasted-image-1782902134354-vxs5bt0r.jpg',
];
// Indexes into HERO_IMAGES that picture each class format.
const FORMAT_HERO_INDEXES = { Barre: [1, 2, 8], 'Strength Lab': [3, 4, 5, 6], powerCycle: [0, 7] };
const CLASS_FORMATS = Object.keys(FORMAT_HERO_INDEXES);
const BRAND_LOGO = 'https://images.fillout.com/orgid-66954/flowpublicid-uxjuax2dbd/widgetid-default/jART4M3Yb27Pc9DpgJCpz5/pasted-image-1782902048740-lg84b5zl.png';
const ACCENT_COLORS = ['#00f5a0', '#60a5fa', '#c084fc', '#fb7185', '#fbbf24', '#22d3ee'];
const TEMPLATE_FIELDS = [
  { id: 'firstName', type: 'text', label: 'First Name', placeholder: 'Enter your first name', required: true, gridCol: 'half', helperText: '' },
  { id: 'lastName', type: 'text', label: 'Last Name', placeholder: 'Enter your last name', required: true, gridCol: 'half' },
  { id: 'email', type: 'email', label: 'Email Address', placeholder: 'your@email.com', required: true, gridCol: 'half', helperText: "We'll send your booking confirmation here" },
  { id: 'phone', type: 'tel', label: 'Phone Number', placeholder: '+91 98765 43210', required: true, gridCol: 'half', helperText: 'Include country code for WhatsApp updates' },
  { id: 'center', type: 'select', label: 'Preferred Studio', placeholder: 'Choose your studio', required: true, gridCol: 'full', helperText: 'Select the location nearest to you', options: ['Kwality House, Kemps Corner', 'Supreme HQ, Bandra', 'Kenkere House, Bengaluru', 'The Studio by Copper & Cloves, Bengaluru', 'Plash Pilates, Bengaluru'] },
  { id: 'classType', type: 'select', label: 'Class Format', placeholder: 'Choose a class', required: true, gridCol: 'full', helperText: 'Not sure? Try our signature Barre class', options: ['Barre', 'Strength Lab', 'powerCycle'] },
  { id: 'terms', type: 'terms', label: 'I agree to the Terms & Conditions and Privacy Policy of Physique 57', required: true, gridCol: 'full' },
];
const SIGNATURE_FIELDS = [
  { id: 'signatureName', type: 'text', label: 'Signature name', placeholder: 'Enter your full legal name', required: true, gridCol: 'full' },
  { id: 'signatureRealSignature', type: 'signature', label: 'Drawn signature', required: true, gridCol: 'full', helperText: 'Sign with your finger, stylus, trackpad, or mouse.' },
  { id: 'waiverAccepted', type: 'terms', label: 'I have read, signed, and accept the waiver and Physique 57 India privacy terms.', required: true, gridCol: 'full' },
];
function fieldsForSignupType(signupType, targetStudio, classFormat = '') {
  const studio = String(targetStudio || FALLBACK_CENTER);
  const adult = TEMPLATE_FIELDS.filter((field) => !['center', 'terms'].includes(field.id)).map((field) => field.id === 'classType' ? { ...field, options: classFormat ? [classFormat] : getClassOptions(studio), ...(classFormat ? { helperText: `This form is for ${classFormat} classes` } : {}) } : field);
  const common = [...adult.slice(0, 4), { id: 'center', type: 'select', label: 'Studio', required: true, gridCol: 'full', options: [studio] }];
  if (signupType === 'kids') return [
    ...common,
    { id: 'childName', type: 'text', label: "Child's full name", required: true, gridCol: 'full' },
    { id: 'childAge', type: 'number', label: "Child's age", required: true, gridCol: 'half', min: 5, max: 17 },
    { id: 'childDateOfBirth', type: 'date', label: "Child's date of birth", required: true, gridCol: 'half' },
    { id: 'batch', type: 'text', label: 'Preferred Juniors class / batch', placeholder: 'Optional preference', required: false, gridCol: 'full' },
    ...SIGNATURE_FIELDS.map((field) => field.id === 'signatureName' ? { ...field, label: 'Parent/guardian signature name' } : field),
  ];
  return [...common, adult.find((field) => field.id === 'classType'), ...SIGNATURE_FIELDS].filter(Boolean);
}
function getClassOptions(studio) {
  const value = String(studio || '').toLowerCase();
  if (value.includes('kenkere') || value.includes('copper') || value.includes('plash') || value.includes('bengaluru')) return ['Barre'];
  return ['Barre', 'Strength Lab', 'powerCycle'];
}
function extractName(prompt) {
  const match = prompt.match(/(?:influencer|partner)[:\s]+([^|]+)/i);
  if (match) return match[1].trim();
  const eventMatch = prompt.match(/(?:event)[:\s]+([^|]+)/i);
  return eventMatch ? eventMatch[1].trim() : prompt.split('|')[0].replace(/^(influencer|partner|event)[:\s]*/i, '').trim();
}
function extractPromptValue(prompt, label) {
  const match = prompt.match(new RegExp(`${label}:\\s*([^|]+)`, 'i'));
  return match?.[1]?.trim() || '';
}
function hashString(value) {
  let hash = 2166136261;
  for (let index = 0; index < value.length; index += 1) hash = Math.imul(hash ^ value.charCodeAt(index), 16777619);
  return hash >>> 0;
}
function normalizeFields(rawFields) {
  const fields = Array.isArray(rawFields) ? rawFields : [];
  return fields.map((field) => {
    if (field?.id !== 'center') return field;
    const options = Array.isArray(field.options) ? field.options : [];
    if (options.includes('Plash Pilates, Bengaluru')) return field;
    return { ...field, options: [...options.filter((option) => option !== 'Sadashivnagar, Bengaluru'), 'Plash Pilates, Bengaluru'] };
  });
}
function normalizeTitle(value) {
  const title = String(value || '');
  const legacy = title.match(/^(.*?)\s*[×x]\s*Physique 57$/i);
  return legacy ? `Physique 57 x ${legacy[1].trim()}` : title;
}
function slugify(value) {
  return String(value || 'physique-57').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 48) || 'physique-57';
}
async function createUniqueSlug(label) {
  const base = slugify(label);
  const { data, error } = await supabase.from('forms').select('slug').like('slug', `${base}%`);
  if (error) throw error;
  const existing = new Set((data || []).map((row) => row.slug));
  if (!existing.has(base)) return base;
  let suffix = 2;
  while (existing.has(`${base}-${suffix}`)) suffix += 1;
  return `${base}-${suffix}`;
}
function publicForm(record, req) {
  const data = record.form_data || {};
  const fields = normalizeFields(Array.isArray(data) ? data : data.fields);
  const title = normalizeTitle(record.title);
  const appUrl = (process.env.APP_URL || `${req.protocol}://${req.get('host')}`).replace(/\/$/, '');
  return {
    id: record.id, title, description: record.description || '', slug: record.slug || '', fields,
    themeColor: 'midnight', layout: 'stacked', heroImage: data.heroImage || '', utmSource: data.utmSource || '',
    utmChannel: data.utmChannel || '', utmCampaign: data.utmCampaign || '', status: record.status || 'Draft', submissionCount: record.submission_count || 0,
    createdAt: record.created_at || '', shareUrl: `${appUrl}/f/${record.slug || ''}`, hashtag: data.hashtag || '', heroPosition: data.heroPosition || 'center',
    heroPositionX: data.heroPositionX ?? 50, heroPositionY: data.heroPositionY ?? 50, heroScale: data.heroScale ?? 1,
    accentColor: data.accentColor || '#00f5a0', heroHeight: data.heroHeight || 520, heroWidth: data.heroWidth || 48,
    hashtagSize: data.hashtagSize || 'sm', hashtagStyle: data.hashtagStyle || 'neon', hashtagPosition: data.hashtagPosition || 'left', logoPosition: data.logoPosition || 'left',
    logoSize: data.logoSize || 'lg', logoInvert: false, logoUrl: data.logoUrl || BRAND_LOGO,
    influencerName: data.influencerName || '', eventName: data.eventName || '', metadataTitle: normalizeTitle(data.metadataTitle || title),
    metadataDescription: data.metadataDescription || record.description || '', formWidth: data.formWidth || 480, formMinHeight: data.formMinHeight || 0,
    formBorderRadius: data.formBorderRadius ?? 16, formPadding: data.formPadding ?? 40, boldLabels: data.boldLabels || false,
    signupType: data.signupType || 'free', targetStudio: data.targetStudio || '', sessionId: data.sessionId || '', classFormat: data.classFormat || '',
  };
}

app.get('/api/health', asyncRoute(async (_req, res) => {
  const { error } = await supabase.from('forms').select('id').limit(1);
  if (error) throw error;
  res.json({ ok: true });
}));
app.post('/api/generate-form', asyncRoute(async (req, res) => {
  if (typeof req.body.prompt !== 'string' || !req.body.prompt.trim()) return res.status(400).json({ error: 'prompt is required' });
  const prompt = req.body.prompt.trim();
  const campaignName = extractName(prompt);
  const influencerName = extractPromptValue(prompt, 'Influencer/Partner');
  const eventName = extractPromptValue(prompt, 'Event');
  const details = extractPromptValue(prompt, 'Details');
  const signupType = ['kids', 'free', 'paid'].includes(req.body.signupType) ? req.body.signupType : 'free';
  const targetStudio = String(req.body.targetStudio || FALLBACK_CENTER).trim();
  const sessionId = String(req.body.sessionId || '').trim();
  if (signupType === 'paid' && !/^\d+$/.test(sessionId)) return res.status(400).json({ error: 'Paid signup forms require a valid Momence session ID.' });
  const requestedFormat = String(req.body.classFormat || '').trim();
  if (requestedFormat && (!CLASS_FORMATS.includes(requestedFormat) || !getClassOptions(targetStudio).includes(requestedFormat))) return res.status(400).json({ error: `${requestedFormat} is not offered at ${targetStudio}.` });
  const classFormat = signupType === 'kids' ? '' : requestedFormat;
  const influencerSlug = campaignName.toLowerCase().replace(/\s+/g, '_') || 'general';
  const seed = hashString(prompt.toLowerCase());
  const experienceName = eventName || `${influencerName || campaignName} Signature Experience`;
  const partnerName = influencerName || eventName || campaignName;
  const title = `Physique 57 x ${partnerName}${eventName && influencerName ? ` — ${eventName}` : ''}`;
  const peopleCopy = influencerName ? ` with ${influencerName}` : '';
  const experienceKind = classFormat ? `Physique 57 ${classFormat}` : 'signature Physique 57';
  const description = details || `Join ${experienceName}${peopleCopy} for a ${experienceKind} experience designed to move, challenge, and connect.`;
  const metadataDescription = `${experienceName}${peopleCopy} — reserve your place for this ${experienceKind} experience.`;
  const heroPool = classFormat ? FORMAT_HERO_INDEXES[classFormat].map((index) => HERO_IMAGES[index]) : HERO_IMAGES;
  const formData = { fields: fieldsForSignupType(signupType, targetStudio, classFormat), signupType, targetStudio, sessionId, classFormat, layout: 'stacked', heroImage: heroPool[(seed >>> 4) % heroPool.length], heroPosition: 'center', heroPositionX: 35 + ((seed >>> 8) % 31), heroPositionY: 35 + ((seed >>> 13) % 31), heroScale: 1 + ((seed >>> 18) % 16) / 100, heroHeight: 520, heroWidth: 48, accentColor: ACCENT_COLORS[(seed >>> 22) % ACCENT_COLORS.length], formWidth: 480, formMinHeight: 0, formBorderRadius: 16, formPadding: 40, boldLabels: false, logoUrl: BRAND_LOGO, logoPosition: 'left', logoSize: 'lg', logoInvert: false, influencerName, eventName, metadataTitle: title, metadataDescription, utmSource: influencerSlug, utmChannel: `${prompt.toLowerCase().includes('instagram') ? 'social' : 'influencer'}_${influencerSlug}`, utmCampaign: influencerSlug, hashtag: (eventName || influencerName || campaignName).replace(/[^a-z0-9]/gi, ''), hashtagSize: 'sm', hashtagStyle: 'neon', hashtagPosition: 'left' };
  const slug = await createUniqueSlug(eventName || influencerName || campaignName);
  const { data, error } = await supabase.from('forms').insert({ title, description, slug, form_data: formData, theme_color: 'midnight', status: 'Draft', creator_email: req.body.creatorEmail || '' }).select().single();
  if (error) throw error;
  res.status(201).json({ form: publicForm(data, req) });
}));
app.get('/api/forms', asyncRoute(async (req, res) => {
  let query = supabase.from('forms').select('*').order('created_at', { ascending: false }).limit(100);
  if (req.query.creatorEmail) query = query.eq('creator_email', req.query.creatorEmail);
  const { data, error } = await query;
  if (error) throw error;
  res.json({ forms: data.map((record) => publicForm(record, req)) });
}));
app.get('/api/forms/:identifier', asyncRoute(async (req, res) => {
  const { data, error } = await supabase.from('forms').select('*').eq(req.query.by === 'slug' ? 'slug' : 'id', req.params.identifier).maybeSingle();
  if (error) throw error;
  res.json({ form: data ? publicForm(data, req) : null });
}));
app.patch('/api/forms/:id', asyncRoute(async (req, res) => {
  const { data: existing, error: readError } = await supabase.from('forms').select('*').eq('id', req.params.id).single();
  if (readError) throw readError;
  const update = {};
  if (req.body.status !== undefined) update.status = req.body.status;
  if (req.body.title !== undefined) update.title = req.body.title;
  if (req.body.description !== undefined) update.description = req.body.description;
  if (req.body.themeColor !== undefined) update.theme_color = req.body.themeColor;
  const formData = { ...(existing.form_data || {}) };
  const dataKeys = ['fields', 'heroImage', 'heroPositionX', 'heroPositionY', 'heroHeight', 'heroWidth', 'layout', 'formWidth', 'formMinHeight', 'formBorderRadius', 'formPadding', 'boldLabels', 'utmSource', 'utmChannel', 'utmCampaign', 'hashtagSize', 'hashtagStyle', 'hashtagPosition', 'logoPosition', 'logoSize', 'logoInvert'];
  let changed = false;
  for (const key of dataKeys) if (req.body[key] !== undefined) { formData[key] = req.body[key]; changed = true; }
  if (changed) update.form_data = formData;
  const { error } = await supabase.from('forms').update(update).eq('id', req.params.id);
  if (error) throw error;
  res.json({ success: true });
}));
app.delete('/api/forms/:id', asyncRoute(async (req, res) => {
  const { error } = await supabase.from('forms').delete().eq('id', req.params.id);
  if (error) throw error;
  res.json({ success: true });
}));
app.get('/api/forms/:id/submissions', asyncRoute(async (req, res) => {
  const { data, error } = await supabase.from('form_submissions').select('*').eq('form_id', req.params.id).order('submitted_at', { ascending: false }).limit(500);
  if (error) throw error;
  res.json({ submissions: data.map((row) => ({ id: row.id, responses: row.response_data || {}, submitterEmail: row.submitter_email || '', submittedAt: row.submitted_at || '' })) });
}));

const CENTER_CONFIG = {
  'kwality house, kemps corner': { hostId: process.env.MOMENCE_MUMBAI_HOST_ID, token: process.env.MOMENCE_LEAD_WEBHOOK_TOKEN_MUMBAI || process.env.MOMENCE_MUMBAI_TOKEN, city: 'mumbai' },
  'supreme hq, bandra': { hostId: process.env.MOMENCE_MUMBAI_HOST_ID, token: process.env.MOMENCE_LEAD_WEBHOOK_TOKEN_MUMBAI || process.env.MOMENCE_MUMBAI_TOKEN, city: 'mumbai' },
  'courtside, mumbai': { hostId: process.env.MOMENCE_MUMBAI_HOST_ID, token: process.env.MOMENCE_LEAD_WEBHOOK_TOKEN_MUMBAI || process.env.MOMENCE_MUMBAI_TOKEN, city: 'mumbai' },
  'kenkere house, bengaluru': { hostId: process.env.MOMENCE_BENGALURU_HOST_ID, token: process.env.MOMENCE_LEAD_WEBHOOK_TOKEN_BENGALURU || process.env.MOMENCE_BENGALURU_TOKEN, city: 'bengaluru' },
  'the studio by copper & cloves, bengaluru': { hostId: process.env.MOMENCE_BENGALURU_HOST_ID, token: process.env.MOMENCE_LEAD_WEBHOOK_TOKEN_BENGALURU || process.env.MOMENCE_BENGALURU_TOKEN, city: 'bengaluru' },
  'sadashivnagar, bengaluru': { hostId: process.env.MOMENCE_BENGALURU_HOST_ID, token: process.env.MOMENCE_LEAD_WEBHOOK_TOKEN_BENGALURU || process.env.MOMENCE_BENGALURU_TOKEN, city: 'bengaluru' },
  'plash pilates, bengaluru': { hostId: process.env.MOMENCE_BENGALURU_HOST_ID, token: process.env.MOMENCE_LEAD_WEBHOOK_TOKEN_BENGALURU || process.env.MOMENCE_BENGALURU_TOKEN, city: 'bengaluru' },
};
const FALLBACK_CENTER = 'Kwality House, Kemps Corner';
// Momence lead source IDs are per host account. Partner studios keep their own source;
// otherwise the form type picks the source (Bengaluru has no dedicated kids source).
const LEAD_SOURCE_IDS = {
  mumbai: { kids: 212426, free: 14729, paid: 14729 }, // Physique Kids / Influencer Sign-up
  bengaluru: { kids: 11606, free: 11606, paid: 11606 }, // Influencer Marketing
};
const CENTER_SOURCE_IDS = {
  'the studio by copper & cloves, bengaluru': 92183, // the Studio by Copper + Cloves
  'plash pilates, bengaluru': 263443, // Plash Pilates
};
function leadSourceId(center, city, signupType) {
  return CENTER_SOURCE_IDS[center] || LEAD_SOURCE_IDS[city]?.[signupType] || LEAD_SOURCE_IDS[city]?.free;
}
const ATTRIBUTION_KEYS = ['utmSource', 'utmMedium', 'utmCampaign', 'utmTerm', 'utmContent', 'gclid', 'fbclid', 'referrer', 'landingPage', 'abVariant'];
function cleanAttribution(input, city) {
  const source = input && typeof input === 'object' ? input : {};
  const result = Object.fromEntries(ATTRIBUTION_KEYS.map((key) => [key, String(source[key] || '').trim().slice(0, 500)]));
  if (city === 'bengaluru') {
    result.utmCampaign ||= 'bengaluru-landing';
    result.abVariant ||= 'bengaluru-first-class-offer';
  }
  return result;
}
async function isDuplicateSubmission(formId, email, phone) {
  const checks = [];
  if (email) checks.push(supabase.from('form_submissions').select('id', { count: 'exact', head: true }).eq('form_id', formId).ilike('submitter_email', email.replace(/[\\%_]/g, '\\$&')));
  if (phone) checks.push(supabase.from('form_submissions').select('id', { count: 'exact', head: true }).eq('form_id', formId).eq('phone', phone));
  const results = await Promise.all(checks);
  for (const { error, count } of results) { if (error) throw error; if (count) return true; }
  return false;
}
function formatPhone(phone) {
  let value = String(phone || '').replace(/\D/g, '').replace(/^0+/, '');
  if (value.startsWith('91') && value.length === 12) value = value.slice(2);
  return value.length === 10 ? `+91${value}` : (value ? `+${value}` : '');
}
app.post('/api/forms/:id/submissions', asyncRoute(async (req, res) => {
  const responses = req.body.responses || {};
  const { data: form, error: formError } = await supabase.from('forms').select('*').eq('id', req.params.id).single();
  if (formError) throw formError;
  const formData = form.form_data || {};
  if (!responses.signatureRealSignature || !responses.waiverAccepted) return res.status(400).json({ error: 'A drawn signature and waiver acceptance are required.' });
  const rawCenter = String(responses.center || '').trim();
  const centerKey = CENTER_CONFIG[rawCenter.toLowerCase()] ? rawCenter.toLowerCase() : FALLBACK_CENTER.toLowerCase();
  const config = CENTER_CONFIG[centerKey];
  const attribution = cleanAttribution(req.body.attribution, config.city);
  const utmSource = formData.utmSource || req.body.utmSource || attribution.utmSource;
  const utmChannel = formData.utmChannel || req.body.utmChannel || '';
  const utmCampaign = formData.utmCampaign || req.body.utmCampaign || attribution.utmCampaign;
  const email = String(responses.email || '').trim();
  const phone = formatPhone(responses.phone);
  if (await isDuplicateSubmission(req.params.id, email, phone)) return res.status(409).json({ error: 'You have already signed up for this form with this email or phone number.', duplicate: true });
  const { data: submission, error } = await supabase.from('form_submissions').insert({ form_id: req.params.id, response_data: responses, submitter_email: email, first_name: responses.firstName || '', last_name: responses.lastName || '', phone, center: rawCenter, class_type: responses.classType || '', utm_source: utmSource, utm_campaign: utmCampaign, utm_channel: utmChannel, utm_medium: attribution.utmMedium, utm_term: attribution.utmTerm, utm_content: attribution.utmContent, gclid: attribution.gclid, fbclid: attribution.fbclid, referrer: attribution.referrer, landing_page: attribution.landingPage, ab_variant: attribution.abVariant }).select('id').single();
  if (error) throw error;
  const { error: countError } = await supabase.rpc('increment_form_submission_count', { target_form_id: req.params.id });
  if (countError) console.error('Submission saved, but count update failed:', countError.message);
  const operationalForm = { id: form.id, slug: form.slug, signupType: formData.signupType || 'free', targetStudio: formData.targetStudio || rawCenter, sessionId: formData.sessionId || '' };
  const sourceId = leadSourceId(centerKey, config.city, operationalForm.signupType);
  let webhookStatus = 'NOT_CONFIGURED';
  if (config.hostId && config.token && sourceId) {
    const payload = { token: config.token, firstName: String(responses.firstName || '').trim(), lastName: String(responses.lastName || '.').trim() || '.', email, phoneNumber: phone, center: rawCenter || FALLBACK_CENTER, type: String(responses.classType || '').trim(), channel: utmChannel, sourceId, utm_medium: attribution.utmMedium, utm_term: attribution.utmTerm, utm_content: attribution.utmContent, gclid: attribution.gclid, fbclid: attribution.fbclid, referrer: attribution.referrer, landing_page: attribution.landingPage, ab_variant: attribution.abVariant };
    if (config.city === 'mumbai') Object.assign(payload, { utm_source: utmSource, utm_campaign: utmCampaign });
    else Object.assign(payload, { source: utmSource, campaign: utmCampaign });
    for (let attempt = 1; attempt <= 3; attempt += 1) {
      try {
        const response = await fetch(`https://api.momence.com/integrations/customer-leads/${config.hostId}/collect`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
        webhookStatus = response.ok ? `SUCCESS_HTTP_${response.status}` : `ERROR_HTTP_${response.status}_${(await response.text()).slice(0, 100)}`;
        if (response.ok) break;
      } catch (webhookError) { webhookStatus = `ERROR_${webhookError instanceof Error ? webhookError.message : 'unknown'}`; }
      if (attempt < 3) await new Promise((resolve) => setTimeout(resolve, 1000 * attempt));
    }
  }
  // The lead is recorded first so the studio can follow up even if later Momence profile,
  // waiver, membership, or booking operations need manual recovery.
  const signup = operationalForm.signupType === 'kids' ? await signupKid(responses, operationalForm) : await signupAdult(responses, operationalForm);
  let checkoutUrl = null;
  if (signup.paymentRequired) checkoutUrl = await createPaidCheckout({ memberId: signup.memberId, form: operationalForm, origin: (process.env.APP_URL || `${req.protocol}://${req.get('host')}`).replace(/\/$/, '') });
  res.status(201).json({ success: true, submissionId: submission.id, webhookStatus, signup, checkoutUrl });
}));

app.get('/api/payments/confirm', asyncRoute(async (req, res) => {
  const checkoutSessionId = String(req.query.checkout_session_id || '').trim();
  if (!checkoutSessionId) return res.status(400).json({ error: 'checkout_session_id is required' });
  res.json({ success: true, booking: await fulfillCheckout(checkoutSessionId) });
}));

app.get('/api/momence/sessions', asyncRoute(async (req, res) => {
  const center = String(req.query.center || '').trim();
  const classType = String(req.query.classType || 'Barre').trim();
  res.json({ sessions: await listSessions(center, classType, Number(req.query.daysAhead || 30)) });
}));

app.post('/api/momence/select-class', asyncRoute(async (req, res) => {
  const { memberId, sessionId, center, classType, customerFields } = req.body || {};
  if (!Number(memberId) || !Number(sessionId)) return res.status(400).json({ error: 'memberId and sessionId are required' });
  const origin = (process.env.APP_URL || `${req.protocol}://${req.get('host')}`).replace(/\/$/, '');
  res.json(await selectClassAndContinue({ memberId, sessionId, center, classType, customerFields, origin }));
}));

const distPath = path.resolve(__dirname, '../dist');
app.use(express.static(distPath));
const escapeAttribute = (value) => String(value || '').replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
app.get('/f/:slug', asyncRoute(async (req, res) => {
  const { data, error } = await supabase.from('forms').select('*').eq('slug', req.params.slug).maybeSingle();
  if (error) throw error;
  const html = await readFile(path.join(distPath, 'index.html'), 'utf8');
  if (!data) return res.status(404).send(html);
  const form = publicForm(data, req);
  const title = escapeAttribute(form.metadataTitle || form.title);
  const description = escapeAttribute(form.metadataDescription || form.description);
  const image = escapeAttribute(form.heroImage);
  const logo = escapeAttribute(form.logoUrl);
  const url = escapeAttribute(form.shareUrl);
  const metadata = `<title>${title}</title><meta name="description" content="${description}"><meta property="og:title" content="${title}"><meta property="og:description" content="${description}"><meta property="og:type" content="website"><meta property="og:url" content="${url}"><meta property="og:image" content="${image}"><meta name="twitter:card" content="summary_large_image"><meta name="twitter:title" content="${title}"><meta name="twitter:description" content="${description}"><meta name="twitter:image" content="${image}"><link rel="icon" href="${logo}">`;
  res.send(html.replace(/<title>.*?<\/title>/, '').replace('</head>', `${metadata}</head>`));
}));
app.get('*', (_req, res) => res.sendFile(path.join(distPath, 'index.html')));
if (!process.env.VERCEL) app.listen(port, () => console.log(`Supabase API listening on http://localhost:${port}`));

export default app;
