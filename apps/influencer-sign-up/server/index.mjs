import dotenv from 'dotenv';
import express from 'express';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { readFile } from 'node:fs/promises';
import { createClient } from '@supabase/supabase-js';
import WebSocket from 'ws';

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
const app = express();
app.use(express.json({ limit: '1mb' }));
const asyncRoute = (handler) => async (req, res) => {
  try { await handler(req, res); }
  catch (error) { console.error(error); res.status(500).json({ error: error instanceof Error ? error.message : 'Unexpected server error' }); }
};

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
const BRAND_LOGO = 'https://images.fillout.com/orgid-66954/flowpublicid-uxjuax2dbd/widgetid-default/jART4M3Yb27Pc9DpgJCpz5/pasted-image-1782902048740-lg84b5zl.png';
const ACCENT_COLORS = ['#00f5a0', '#60a5fa', '#c084fc', '#fb7185', '#fbbf24', '#22d3ee'];
const TEMPLATE_FIELDS = [
  { id: 'firstName', type: 'text', label: 'First Name', placeholder: 'Enter your first name', required: true, gridCol: 'half', helperText: '' },
  { id: 'lastName', type: 'text', label: 'Last Name', placeholder: 'Enter your last name', required: true, gridCol: 'half' },
  { id: 'email', type: 'email', label: 'Email Address', placeholder: 'your@email.com', required: true, gridCol: 'half', helperText: "We'll send your booking confirmation here" },
  { id: 'phone', type: 'tel', label: 'Phone Number', placeholder: '+91 98765 43210', required: true, gridCol: 'half', helperText: 'Include country code for WhatsApp updates' },
  { id: 'center', type: 'select', label: 'Preferred Studio', placeholder: 'Choose your studio', required: true, gridCol: 'full', helperText: 'Select the location nearest to you', options: ['Kwality House, Kemps Corner', 'Supreme HQ, Bandra', 'Kenkere House, Bengaluru', 'The Studio by Copper & Cloves, Bengaluru', 'Sadashivnagar, Bengaluru'] },
  { id: 'classType', type: 'select', label: 'Class Format', placeholder: 'Choose a class', required: true, gridCol: 'full', helperText: 'Not sure? Try our signature Barre class', options: ['Barre', 'Strength Lab', 'powerCycle'] },
  { id: 'terms', type: 'terms', label: 'I agree to the Terms & Conditions and Privacy Policy of Physique 57', required: true, gridCol: 'full' },
];
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
    return options.includes('Sadashivnagar, Bengaluru') ? field : { ...field, options: [...options, 'Sadashivnagar, Bengaluru'] };
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
  const influencerSlug = campaignName.toLowerCase().replace(/\s+/g, '_') || 'general';
  const seed = hashString(prompt.toLowerCase());
  const experienceName = eventName || `${influencerName || campaignName} Signature Experience`;
  const partnerName = influencerName || eventName || campaignName;
  const title = `Physique 57 x ${partnerName}${eventName && influencerName ? ` — ${eventName}` : ''}`;
  const peopleCopy = influencerName ? ` with ${influencerName}` : '';
  const description = details || `Join ${experienceName}${peopleCopy} for a signature Physique 57 experience designed to move, challenge, and connect.`;
  const metadataDescription = `${experienceName}${peopleCopy} — reserve your place for this Physique 57 signature experience.`;
  const formData = { fields: TEMPLATE_FIELDS, layout: 'stacked', heroImage: HERO_IMAGES[(seed >>> 4) % HERO_IMAGES.length], heroPosition: 'center', heroPositionX: 35 + ((seed >>> 8) % 31), heroPositionY: 35 + ((seed >>> 13) % 31), heroScale: 1 + ((seed >>> 18) % 16) / 100, heroHeight: 520, heroWidth: 48, accentColor: ACCENT_COLORS[(seed >>> 22) % ACCENT_COLORS.length], formWidth: 480, formMinHeight: 0, formBorderRadius: 16, formPadding: 40, boldLabels: false, logoUrl: BRAND_LOGO, logoPosition: 'left', logoSize: 'lg', logoInvert: false, influencerName, eventName, metadataTitle: title, metadataDescription, utmSource: influencerSlug, utmChannel: `${prompt.toLowerCase().includes('instagram') ? 'social' : 'influencer'}_${influencerSlug}`, utmCampaign: influencerSlug, hashtag: (eventName || influencerName || campaignName).replace(/[^a-z0-9]/gi, ''), hashtagSize: 'sm', hashtagStyle: 'neon', hashtagPosition: 'left' };
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
  'kwality house, kemps corner': { hostId: process.env.MOMENCE_MUMBAI_HOST_ID, token: process.env.MOMENCE_MUMBAI_TOKEN, sourceId: process.env.MOMENCE_MUMBAI_SOURCE_ID, city: 'mumbai' },
  'supreme hq, bandra': { hostId: process.env.MOMENCE_MUMBAI_HOST_ID, token: process.env.MOMENCE_MUMBAI_TOKEN, sourceId: process.env.MOMENCE_MUMBAI_SOURCE_ID, city: 'mumbai' },
  'courtside, mumbai': { hostId: process.env.MOMENCE_MUMBAI_HOST_ID, token: process.env.MOMENCE_MUMBAI_TOKEN, sourceId: process.env.MOMENCE_MUMBAI_SOURCE_ID, city: 'mumbai' },
  'kenkere house, bengaluru': { hostId: process.env.MOMENCE_BENGALURU_HOST_ID, token: process.env.MOMENCE_BENGALURU_TOKEN, sourceId: process.env.MOMENCE_BENGALURU_SOURCE_ID, city: 'bengaluru' },
  'the studio by copper & cloves, bengaluru': { hostId: process.env.MOMENCE_BENGALURU_HOST_ID, token: process.env.MOMENCE_BENGALURU_TOKEN, sourceId: process.env.MOMENCE_BENGALURU_SOURCE_ID, city: 'bengaluru' },
  'sadashivnagar, bengaluru': { hostId: process.env.MOMENCE_BENGALURU_HOST_ID, token: process.env.MOMENCE_BENGALURU_TOKEN, sourceId: process.env.MOMENCE_BENGALURU_SOURCE_ID, city: 'bengaluru' },
};
const FALLBACK_CENTER = 'Kwality House, Kemps Corner';
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
  const utmSource = formData.utmSource || req.body.utmSource || '';
  const utmChannel = formData.utmChannel || req.body.utmChannel || '';
  const utmCampaign = formData.utmCampaign || req.body.utmCampaign || '';
  const { data: submission, error } = await supabase.from('form_submissions').insert({ form_id: req.params.id, response_data: responses, submitter_email: responses.email || '', first_name: responses.firstName || '', last_name: responses.lastName || '', phone: responses.phone || '', center: responses.center || '', class_type: responses.classType || '', utm_source: utmSource, utm_campaign: utmCampaign, utm_channel: utmChannel }).select('id').single();
  if (error) throw error;
  const { error: countError } = await supabase.rpc('increment_form_submission_count', { target_form_id: req.params.id });
  if (countError) console.error('Submission saved, but count update failed:', countError.message);
  const rawCenter = String(responses.center || '').trim();
  const config = CENTER_CONFIG[rawCenter.toLowerCase()] || CENTER_CONFIG[FALLBACK_CENTER.toLowerCase()];
  let webhookStatus = 'NOT_CONFIGURED';
  if (config.hostId && config.token && config.sourceId) {
    const payload = { token: config.token, firstName: String(responses.firstName || '').trim(), lastName: String(responses.lastName || '.').trim() || '.', email: String(responses.email || '').trim(), phoneNumber: formatPhone(responses.phone), center: rawCenter || FALLBACK_CENTER, type: String(responses.classType || '').trim(), channel: utmChannel, sourceId: config.sourceId };
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
  res.status(201).json({ success: true, submissionId: submission.id, webhookStatus });
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
