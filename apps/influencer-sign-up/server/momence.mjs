import { createHmac, randomUUID } from 'node:crypto';
import Stripe from 'stripe';

const API_BASE = 'https://api.momence.com/api/v2';
const DASHBOARD_BASE = 'https://momence.com/_api/primary';
const HOSTS = { mumbai: 13752, bengaluru: 33905 };
const LOCATIONS = {
  'Kwality House, Kemps Corner': { id: 9030, account: 'mumbai' },
  'Supreme HQ, Bandra': { id: 29821, account: 'mumbai' },
  'Kenkere House, Bengaluru': { id: 22116, account: 'bengaluru' },
  'The Studio by Copper & Cloves, Bengaluru': { id: 36372, account: 'bengaluru' },
  'Plash Pilates, Bengaluru': { id: 383332, account: 'bengaluru', homeLocationId: 22116 },
  'Sadashivnagar, Bengaluru': { id: 383332, account: 'bengaluru', homeLocationId: 22116 },
};
const MEMBERSHIPS = {
  mumbai: { free: 33609, paid: 240932, price: 1943, label: 'Newcomers 2 For 1' },
  22116: { paid: 654474, price: 709, product: 'prod_UykA65J7aUXlLe', label: 'Bengaluru Intro Pack' },
  36372: { paid: 548528, price: 945, product: 'prod_UykBa2v6q915IL', label: 'Bengaluru Intro Pack' },
  383332: { paid: 111528, price: 1418, priceId: 'price_1SvY3sFDEp8YEMWaXio0FOx8', label: 'Bengaluru Intro Pack' },
};
const PLASH_SCHEDULE_LOCATION_IDS = [287883, 36372];
const PAYMENT_METHODS = { mumbai: 4578, bengaluru: 5801 };
// Granted at zero price so free sign-ups can be booked into a paid class format (Strength Lab, powerCycle).
const FREE_PAID_FORMAT_MEMBERSHIP_ID = 97981;
const tokenCache = new Map();
let dashboardCookies = null;
let stripeClient = null;

function required(name) {
  const value = process.env[name]?.trim();
  if (!value) throw new Error(`Missing server environment variable: ${name}`);
  return value;
}
export function locationConfig(center) {
  const config = LOCATIONS[String(center || '').trim()];
  if (!config) throw new Error('Please choose a supported Physique 57 studio.');
  return { ...config, center, hostId: HOSTS[config.account], homeLocationId: config.homeLocationId || config.id };
}
function envSuffix(account) { return account === 'bengaluru' ? '_BLR' : ''; }
async function getToken(account) {
  const cached = tokenCache.get(account);
  if (cached?.expiresAt > Date.now() + 30000) return cached.token;
  const suffix = envSuffix(account);
  const basic = Buffer.from(`${required(`MOMENCE_CLIENT_ID${suffix}`)}:${required(`MOMENCE_CLIENT_SECRET${suffix}`)}`).toString('base64');
  const response = await fetch(`${API_BASE}/auth/token`, { method: 'POST', headers: { Authorization: `Basic ${basic}`, 'Content-Type': 'application/x-www-form-urlencoded', Accept: 'application/json' }, body: new URLSearchParams({ grant_type: 'password', username: required(`MOMENCE_USERNAME${suffix}`), password: required(`MOMENCE_PASSWORD${suffix}`), scope: 'public-api-v2' }) });
  if (!response.ok) throw new Error(`Momence authentication failed (${response.status}).`);
  const data = await response.json();
  const token = data.accessToken || data.access_token;
  tokenCache.set(account, { token, expiresAt: data.accessTokenExpiresAt ? new Date(data.accessTokenExpiresAt).getTime() : Date.now() + 30 * 60000 });
  return token;
}
async function momence(path, init, account) {
  const response = await fetch(`${API_BASE}${path}`, { ...init, headers: { Accept: 'application/json', 'Content-Type': 'application/json', Authorization: `Bearer ${await getToken(account)}`, ...(init?.headers || {}) } });
  const text = await response.text();
  if (!response.ok) throw new Error(`Momence request failed (${response.status}): ${text.slice(0, 300)}`);
  return text ? JSON.parse(text) : {};
}
function base32Decode(secret) {
  const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567'; let bits = '';
  for (const char of secret.replace(/=+$/, '').toUpperCase()) { const index = alphabet.indexOf(char); if (index >= 0) bits += index.toString(2).padStart(5, '0'); }
  const bytes = []; for (let i = 0; i + 8 <= bits.length; i += 8) bytes.push(parseInt(bits.slice(i, i + 8), 2));
  return Buffer.from(bytes);
}
function totp(secret) {
  const counter = Math.floor(Date.now() / 30000); const buffer = Buffer.alloc(8); buffer.writeUInt32BE(Math.floor(counter / 2 ** 32), 0); buffer.writeUInt32BE(counter % 2 ** 32, 4);
  const hash = createHmac('sha1', base32Decode(secret)).update(buffer).digest(); const offset = hash.at(-1) & 15;
  return String((((hash[offset] & 127) << 24) | (hash[offset + 1] << 16) | (hash[offset + 2] << 8) | hash[offset + 3]) % 1000000).padStart(6, '0');
}
function cookiePairs(headers) { return (headers.getSetCookie?.() || []).map((value) => value.split(';')[0]).join('; '); }
let dashboardLogin = null;
// Parallel requests share one login: Momence rejects a TOTP code that is reused within its 30-second window.
function getDashboardCookies(force = false) {
  if (!force && dashboardCookies?.expiresAt > Date.now()) return Promise.resolve(dashboardCookies.value);
  dashboardLogin ||= loginToDashboard().finally(() => { dashboardLogin = null; });
  return dashboardLogin;
}
async function loginToDashboard() {
  const deviceData = { browser: 'Mozilla/5.0', screen: { width: 1440, height: 900 } };
  const login = await fetch('https://api.momence.com/auth/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email: required('MOMENCE_LOGIN_EMAIL'), password: required('MOMENCE_LOGIN_PASSWORD'), deviceData }) });
  if (!login.ok) throw new Error(`Momence dashboard login failed (${login.status}).`);
  const loginCookies = cookiePairs(login.headers);
  const mfa = await fetch('https://api.momence.com/auth/mfa/totp/verify', { method: 'POST', headers: { 'Content-Type': 'application/json', Cookie: loginCookies }, body: JSON.stringify({ token: totp(required('MOMENCE_TOTP_SECRET')), deviceData, trustDevice: true }) });
  if (!mfa.ok) throw new Error(`Momence dashboard MFA failed (${mfa.status}).`);
  dashboardCookies = { value: [loginCookies, cookiePairs(mfa.headers)].filter(Boolean).join('; '), expiresAt: Date.now() + 20 * 60 * 60000 };
  return dashboardCookies.value;
}
async function dashboard(path, init = {}, retryAuth = true, transientRetries = 2) {
  const cookies = await getDashboardCookies(!retryAuth);
  const csrf = cookies.split('; ').find((v) => v.startsWith('csrf_token='))?.slice(11);
  const response = await fetch(`${DASHBOARD_BASE}${path}`, { ...init, headers: { Accept: 'application/json', 'Content-Type': 'application/json', Cookie: cookies, Origin: 'https://momence.com', 'X-App': 'dashboard', ...(csrf ? { 'X-CSRF-Token': csrf } : {}), ...(init.headers || {}) } });
  if (response.status === 401 && retryAuth) return dashboard(path, init, false, transientRetries);
  const text = await response.text();
  if ([502, 503, 504].includes(response.status) && transientRetries > 0) {
    console.warn(`Momence dashboard ${response.status} for ${init.method || 'GET'} ${path}; retrying.`);
    await new Promise((resolve) => setTimeout(resolve, (3 - transientRetries) * 750));
    return dashboard(path, init, retryAuth, transientRetries - 1);
  }
  if (!response.ok) {
    const detail = response.headers.get('content-type')?.includes('application/json') ? text.slice(0, 300) : 'Momence returned an unavailable service page.';
    throw new Error(`Momence dashboard request failed (${response.status}) for ${init.method || 'GET'} ${path}: ${detail}`);
  }
  return text ? JSON.parse(text) : {};
}
async function readonly(path, retry = true) {
  const cookies = await getDashboardCookies(!retry);
  const response = await fetch(`https://momence.com/_api/readonly${path}`, { headers: { Accept: 'application/json', Cookie: cookies, Origin: 'https://momence.com', 'X-App': 'dashboard' } });
  if (response.status === 401 && retry) return readonly(path, false);
  const text = await response.text(); if (!response.ok) throw new Error(`Momence schedule request failed (${response.status}): ${text.slice(0, 300)}`);
  return text ? JSON.parse(text) : {};
}
function cleanName(value) { return String(value || '').normalize('NFKC').replace(/[^\p{L}\p{M}\s]/gu, ' ').replace(/\s+/g, ' ').trim(); }
export async function createMember(input, config) {
  const body = { firstName: cleanName(input.firstName), lastName: cleanName(input.lastName), email: String(input.email).trim(), phoneNumber: String(input.phone || '').replace(/\s/g, ''), homeLocationId: config.homeLocationId };
  if (!body.firstName || !body.lastName) throw new Error('Please enter first and last name using letters.');
  return momence('/host/members', { method: 'POST', body: JSON.stringify(body) }, config.account);
}
async function signWaivers(memberId, realSignature, config, ids = ['waiver', 'membership-waiver'], requireAll = false) {
  let waivers = [];
  for (let attempt = 1; attempt <= 5; attempt += 1) { const result = await dashboard(`/host/${config.hostId}/members/${memberId}/waivers`); waivers = result.waivers || []; if (ids.every((id) => waivers.some((w) => w.id === id && (w.signatureKey || w.signatureStatus?.toLowerCase() === 'signed')))) break; if (attempt < 5) await new Promise((r) => setTimeout(r, attempt * 1000)); }
  const available = waivers.filter((w) => w.type === 'predefined' && ids.includes(w.id));
  if (!available.length || (requireAll && available.length !== ids.length)) throw new Error('The required Momence waivers were not available.');
  for (const waiver of available) { if (waiver.signatureStatus?.toLowerCase() === 'signed') continue; const signUrl = `https://momence.com/dashboard/${config.hostId}/crm/${memberId}/waivers/${waiver.id}/sign?signature=${encodeURIComponent(waiver.signatureKey)}&returnTo=/dashboard/${config.hostId}/crm/${memberId}`; await dashboard(`/public/hosts/${config.hostId}/members/${memberId}/waivers/${waiver.id}/sign?signatureKey=${encodeURIComponent(waiver.signatureKey)}`, { method: 'POST', headers: { Referer: signUrl, 'X-Origin': signUrl, 'X-Idempotence-Key': randomUUID() }, body: JSON.stringify({ realSignature }) }); }
  return available.length;
}
async function grantMembership(memberId, config, membershipId, paid = false) {
  const body = { memberId, homeLocationId: config.homeLocationId, items: [{ id: '1', type: 'subscription', membershipId, attemptedPriceInCurrency: paid ? String(Math.round((MEMBERSHIPS[config.id] || MEMBERSHIPS.mumbai).price / 1.05)) : '0' }], paymentMethods: [paid ? { id: '1', type: 'custom', customPaymentMethodId: PAYMENT_METHODS[config.account], note: 'Paid via Stripe Checkout' } : { id: '1', type: 'free' }] };
  return momence('/host/checkout', { method: 'POST', body: JSON.stringify(body) }, config.account);
}
async function bookWithMembership(memberId, sessionId, config, membershipId) {
  const compatible = await momence('/host/checkout/compatible-memberships', { method: 'POST', body: JSON.stringify({ memberId, homeLocationId: config.homeLocationId, items: [{ id: '1', type: 'session', sessionId }] }) }, config.account);
  const boughtId = compatible.items?.find((item) => !item.incompatibility && item.boughtMembership?.membership?.id === membershipId)?.boughtMembership?.id;
  if (!boughtId) throw new Error('No compatible active membership was found for this class.');
  await dashboard(`/host/${config.hostId}/auto-book/member/${memberId}/session/${sessionId}`, { method: 'POST', headers: { Referer: `https://momence.com/dashboard/${config.hostId}/sessions/${sessionId}`, 'X-Origin': `https://momence.com/dashboard/${config.hostId}/sessions/${sessionId}`, 'X-Idempotence-Key': randomUUID() }, body: JSON.stringify({ autoCheckin: false, membershipIds: [boughtId], addToWaitlist: false, isCapacityOverriden: false, isAgeRestrictionOverridden: false }) });
}
// Free sign-ups on a paid class format are comped with the zero-price complimentary membership,
// then booked with it. An already-granted one is reused; a free booking is the last resort.
async function grantComplimentaryMembership(memberId, config) {
  // The public API only accepts `subscription` or `session` items; a membership is granted as a
  // zero-price subscription item, not the dashboard's `membership` shape.
  const body = { memberId, homeLocationId: config.homeLocationId, items: [{ id: '1', type: 'subscription', membershipId: FREE_PAID_FORMAT_MEMBERSHIP_ID, quantity: 1, attemptedPriceInCurrency: '0' }], paymentMethods: [{ id: '1', type: 'free' }] };
  return momence('/host/checkout', { method: 'POST', body: JSON.stringify(body) }, config.account);
}
async function compatibleBoughtMembershipId(memberId, sessionId, config, membershipId) {
  const compatible = await momence('/host/checkout/compatible-memberships', { method: 'POST', body: JSON.stringify({ memberId, homeLocationId: config.homeLocationId, items: [{ id: '1', type: 'session', sessionId }] }) }, config.account);
  return (compatible.items || []).find((item) => !item.incompatibility && item.boughtMembership?.membership?.id === membershipId)?.boughtMembership?.id || null;
}
async function bookComplimentary(memberId, sessionId, config) {
  let boughtId = await compatibleBoughtMembershipId(memberId, sessionId, config, FREE_PAID_FORMAT_MEMBERSHIP_ID);
  if (!boughtId) {
    try { await grantComplimentaryMembership(memberId, config); }
    catch (error) { if (!/already/i.test(String(error?.message || error))) throw error; }
    boughtId = await compatibleBoughtMembershipId(memberId, sessionId, config, FREE_PAID_FORMAT_MEMBERSHIP_ID);
  }
  if (boughtId) return bookWithBoughtMembership(memberId, sessionId, config, boughtId);
  console.warn(`Complimentary membership ${FREE_PAID_FORMAT_MEMBERSHIP_ID} is not usable for session ${sessionId}; booking free instead.`);
  await momence(`/host/sessions/${sessionId}/bookings/free`, { method: 'POST', body: JSON.stringify({ memberId }) }, config.account);
}
async function bookWithBoughtMembership(memberId, sessionId, config, boughtMembershipId) {
  await dashboard(`/host/${config.hostId}/auto-book/member/${memberId}/session/${sessionId}`, { method: 'POST', headers: { Referer: `https://momence.com/dashboard/${config.hostId}/sessions/${sessionId}`, 'X-Origin': `https://momence.com/dashboard/${config.hostId}/sessions/${sessionId}`, 'X-Idempotence-Key': randomUUID() }, body: JSON.stringify({ autoCheckin: false, membershipIds: [boughtMembershipId], addToWaitlist: false, isCapacityOverriden: false, isAgeRestrictionOverridden: false }) });
}
function matchesClassFormat(name, classType) {
  const value = String(name || '').toLowerCase();
  if (classType === 'powerCycle') return value.includes('cycle') || value.includes('spin');
  if (classType === 'Strength Lab') return value.includes('strength') || value.includes('lab');
  return value.includes('barre') && !value.includes('cardio');
}
function normalizeSession(session, center, hosted) {
  return { id: session.id, name: session.name, startsAt: session.startsAt, endsAt: session.endsAt, durationInMinutes: session.durationInMinutes, capacity: session.capacity ?? null, bookingCount: session.bookingCount || 0, spotsLeft: session.capacity == null ? null : Math.max(0, session.capacity - (session.bookingCount || 0)), teacherName: session.teacher ? `${session.teacher.firstName || ''} ${session.teacher.lastName || ''}`.trim() : '', locationName: session.inPersonLocation?.name || center, hosted: Boolean(hosted) };
}
// Hosted (private) sessions are listed under their own session type and are not part of the public
// schedule, so they are fetched separately and shown whatever class format the form is built for.
async function fetchSessions(config, center, end, hosted) {
  const now = new Date();
  if (config.id === 383332) {
    // Plash classes are scheduled under the Bengaluru partner locations and identified by name, as in the Momence dashboard.
    const pageSize = 100;
    const rowsFound = [];
    for (let page = 0; page < 10; page += 1) {
      const params = new URLSearchParams({ sortBy: 'startsAt', sortOrder: 'ASC', dateFrom: now.toISOString(), page: String(page), pageSize: String(pageSize), query: 'plash', timeZone: 'Asia/Kolkata', grouped: 'false' });
      for (const id of PLASH_SCHEDULE_LOCATION_IDS) params.append('locationIds[]', String(id));
      params.append('status[]', 'published'); params.append('status[]', 'unpublished');
      if (hosted) params.append('types[]', 'private');
      const result = await readonly(`/host/33905/sessions?${params}`);
      const rows = Array.isArray(result) ? result : Array.isArray(result.payload) ? result.payload : (result.payload?.sessions || result.sessions || []);
      rowsFound.push(...rows.filter((session) => new Date(session.startsAt) < end));
      if (rows.length < pageSize || rows.some((session) => new Date(session.startsAt) >= end)) break;
    }
    return rowsFound;
  }
  const params = new URLSearchParams({ page: '0', pageSize: '200', sortBy: 'startsAt', sortOrder: 'ASC', locationId: String(config.id), startAfter: now.toISOString(), startBefore: end.toISOString(), includeCancelled: 'false', includeChildLocations: 'true' });
  if (hosted) params.append('types[]', 'private');
  const result = await momence(`/host/sessions?${params}`, {}, config.account);
  return result.payload || [];
}
export async function listSessions(center, classType, daysAhead = 30) {
  const config = locationConfig(center);
  const end = new Date(Date.now() + Math.min(60, Math.max(1, daysAhead)) * 86400000);
  const [scheduled, hostedRows] = await Promise.all([
    fetchSessions(config, center, end, false),
    // A host account without private sessions returns an error rather than an empty list.
    fetchSessions(config, center, end, true).catch((error) => { console.warn(`Hosted session lookup failed for ${center}:`, error?.message || error); return []; }),
  ]);
  const hostedIds = new Set(hostedRows.map((session) => session.id));
  const excluded = ['physique 57', 'p57', 'studio juniors'];
  const open = scheduled
    .filter((session) => !session.isCancelled && !hostedIds.has(session.id) && !excluded.some((term) => String(session.name || '').toLowerCase().includes(term)) && !/hosted/i.test(String(session.name || '')) && matchesClassFormat(session.name, classType))
    .map((session) => normalizeSession(session, center, false));
  // Hosted classes are one-off events, so they are offered regardless of the form's class format.
  const hosted = hostedRows
    .filter((session) => !session.isCancelled)
    .map((session) => normalizeSession(session, center, true));
  return [...open, ...hosted].sort((a, b) => String(a.startsAt).localeCompare(String(b.startsAt)));
}
// Booking rules differ for hosted classes, so the flag is re-checked server side rather than trusted
// from the browser or from a form built days earlier.
export async function isHostedSession(sessionId, config) {
  try {
    const end = new Date(Date.now() + 120 * 86400000);
    const rows = await fetchSessions(config, config.center, end, true);
    return rows.some((session) => Number(session.id) === Number(sessionId));
  } catch (error) {
    console.warn(`Could not verify hosted status for session ${sessionId}:`, error?.message || error);
    return false;
  }
}
// Hosted classes carry no membership requirement: the seat is booked at no charge.
async function bookHosted(memberId, sessionId, config) {
  try {
    await momence(`/host/sessions/${sessionId}/bookings/free`, { method: 'POST', body: JSON.stringify({ memberId }) }, config.account);
  } catch (error) {
    console.warn(`Free booking failed for hosted session ${sessionId}; retrying through checkout:`, error?.message || error);
    await momence('/host/checkout', { method: 'POST', body: JSON.stringify({ memberId, homeLocationId: config.homeLocationId, items: [{ id: '1', type: 'session', sessionId: Number(sessionId), quantity: 1, attemptedPriceInCurrency: '0' }], paymentMethods: [{ id: '1', type: 'free' }] }) }, config.account);
  }
}
function validateCustomerFields(values, requiresShoeSize) {
  const requiredFields = ['emergencyContactInfo', 'medicalHistory'];
  if (values.gender === 'Female') requiredFields.push('pregnancyStatus', 'postNatalStatus');
  if (requiresShoeSize) requiredFields.push('euShoeSize');
  for (const key of requiredFields) if (!String(values[key] || '').trim()) throw new Error('Required profile details are missing.');
  const emergency = String(values.emergencyContactInfo || '').replace(/\D/g, '');
  if (!/^[0-9]{7,15}$/.test(emergency)) throw new Error('Emergency Contact Info must be a phone number.');
}
async function saveCustomerFields(memberId, values) {
  const ids = { fitnessGoal: 8149, emergencyContactInfo: 8251, pregnancyStatus: 8252, medicalHistory: 8253, postNatalStatus: 8254, gender: 16549, euShoeSize: 17139, howDidHear: 19050 };
  const mapped = {}; for (const [key, id] of Object.entries(ids)) { let value = String(values[key] || '').trim(); if (key === 'emergencyContactInfo') value = value.replace(/\D/g, ''); if (value) mapped[String(id)] = value; }
  await dashboard('/host/13752/customer-fields/data', { method: 'POST', body: JSON.stringify({ memberId, values: mapped }) });
}
export async function signupAdult(input, form) {
  // The profile and booking are completed on the class-selection step, so signup only creates the
  // Momence member and signs the waivers. Nothing is booked or charged until the guest fills in
  // their required customer fields and confirms a class.
  const config = locationConfig(form.targetStudio || input.center);
  const created = await createMember(input, config);
  await signWaivers(created.memberId, input.signatureRealSignature, config);
  const plan = config.account === 'mumbai' ? MEMBERSHIPS.mumbai : MEMBERSHIPS[config.id];
  return { memberId: created.memberId, config, plan, paymentRequired: false, scheduleRequiresPayment: false, booked: false, sessionId: form.sessionId ? String(form.sessionId) : '' };
}
function splitChild(name, parentLastName) { const parts = cleanName(name).split(' ').filter(Boolean); return { firstName: parts[0] || '', lastName: parts.slice(1).join(' ') || cleanName(parentLastName) }; }
export async function signupKid(input, form) {
  const config = locationConfig(form.targetStudio || input.center); const parent = await createMember(input, config); const child = splitChild(input.childName, input.lastName);
  const crm = `https://momence.com/dashboard/${config.hostId}/crm/${parent.memberId}`;
  const result = await dashboard(`/host/${config.hostId}/customers/${parent.memberId}/children`, { method: 'POST', headers: { Referer: crm, 'X-Origin': crm }, body: JSON.stringify({ autoGenerateEmail: true, email: '', ...child, customerFields: [{ id: 6592, value: input.childDateOfBirth }] }) });
  const childId = result.memberId || result.id || result.payload?.memberId || result.payload?.id || result.child?.memberId || result.child?.id;
  if (!childId) throw new Error('Momence did not return a member id for the child account.');
  await signWaivers(parent.memberId, input.signatureRealSignature, config, ['waiver', 'membership-waiver']);
  await signWaivers(childId, input.signatureRealSignature, config, ['child-waiver'], true);
  if (form.sessionId) await momence(`/host/sessions/${Number(form.sessionId)}/bookings/free`, { method: 'POST', body: JSON.stringify({ memberId: childId }) }, config.account);
  return { memberId: childId, parentMemberId: parent.memberId, booked: Boolean(form.sessionId) };
}
function stripe() { if (!stripeClient) stripeClient = new Stripe(required('STRIPE_SECRET_KEY')); return stripeClient; }
export async function createPaidCheckout({ memberId, form, origin }) {
  const config = locationConfig(form.targetStudio); const plan = config.account === 'mumbai' ? MEMBERSHIPS.mumbai : MEMBERSHIPS[config.id]; const sessionId = Number(form.sessionId);
  if (!sessionId) throw new Error('Paid signup forms require a Momence session ID.');
  const metadata = { memberId: String(memberId), sessionId: String(sessionId), homeLocationId: String(config.id), membershipId: String(plan.paid), formId: String(form.id) };
  const line = plan.priceId ? { price: plan.priceId, quantity: 1 } : { quantity: 1, price_data: { currency: 'inr', unit_amount: plan.price * 100, ...(plan.product ? { product: plan.product } : { product_data: { name: plan.label, description: 'Physique 57 India introductory membership.' } }) } };
  const checkout = await stripe().checkout.sessions.create({ mode: 'payment', client_reference_id: `${memberId}:${sessionId}`, success_url: `${origin}/payment-confirmation?checkout_session_id={CHECKOUT_SESSION_ID}`, cancel_url: form.cancelUrl || `${origin}/f/${form.slug}?payment=cancelled`, metadata, payment_intent_data: { metadata }, line_items: [line] });
  return checkout.url;
}
export async function selectClassAndContinue({ memberId, sessionId, center, classType, signupType, customerFields, origin }) {
  const config = locationConfig(center); const requiresShoeSize = /cycle|spin/i.test(classType || '');
  validateCustomerFields(customerFields || {}, requiresShoeSize); await saveCustomerFields(Number(memberId), customerFields || {});
  if (await isHostedSession(Number(sessionId), config)) {
    await bookHosted(Number(memberId), Number(sessionId), config);
    return { booked: true, checkoutUrl: null, memberId: Number(memberId), sessionId: Number(sessionId), hosted: true };
  }
  const freePaidFormat = signupType === 'free' && config.account === 'mumbai' && /strength|cycle/i.test(classType || '');
  if (freePaidFormat) {
    await bookComplimentary(Number(memberId), Number(sessionId), config);
    return { booked: true, checkoutUrl: null, memberId: Number(memberId), sessionId: Number(sessionId) };
  }
  const requiresPayment = signupType === 'paid' || config.account === 'bengaluru' || /strength|cycle/i.test(classType || '');
  if (requiresPayment) {
    const query = new URLSearchParams({ center, classType, signupType: signupType || 'paid' }).toString();
    const checkoutUrl = await createPaidCheckout({ memberId: Number(memberId), form: { id: 'schedule', slug: '', targetStudio: center, sessionId: String(sessionId), cancelUrl: `${origin}/classes/${memberId}?${query}` }, origin });
    return { booked: false, checkoutUrl };
  }
  const plan = MEMBERSHIPS.mumbai;
  const compatible = await momence('/host/checkout/compatible-memberships', { method: 'POST', body: JSON.stringify({ memberId: Number(memberId), homeLocationId: config.homeLocationId, items: [{ id: '1', type: 'session', sessionId: Number(sessionId) }] }) }, config.account);
  const hasOpenBarre = compatible.items?.some((item) => !item.incompatibility && item.boughtMembership?.membership?.id === plan.free);
  if (!hasOpenBarre) await grantMembership(Number(memberId), config, plan.free, false);
  await bookWithMembership(Number(memberId), Number(sessionId), config, plan.free);
  return { booked: true, checkoutUrl: null, memberId: Number(memberId), sessionId: Number(sessionId) };
}
export async function fulfillCheckout(checkoutSessionId) {
  const checkout = await stripe().checkout.sessions.retrieve(checkoutSessionId); if (checkout.payment_status !== 'paid' && checkout.status !== 'complete') throw new Error('Stripe Checkout session is not paid yet.');
  const { memberId, sessionId, homeLocationId, membershipId, formId } = checkout.metadata || {}; const config = Object.values(LOCATIONS).find((value) => value.id === Number(homeLocationId));
  if (!config || !memberId || !sessionId || !membershipId) throw new Error('Stripe Checkout metadata is incomplete.');
  const full = { ...config, id: Number(homeLocationId), hostId: HOSTS[config.account], homeLocationId: config.homeLocationId || config.id };
  try { await grantMembership(Number(memberId), full, Number(membershipId), true); } catch (error) { if (!String(error).toLowerCase().includes('already')) throw error; }
  try { await bookWithMembership(Number(memberId), Number(sessionId), full, Number(membershipId)); } catch (error) { if (!/already booked|already-used|purchase-limit/i.test(String(error))) throw error; }
  return { memberId: Number(memberId), sessionId: Number(sessionId), formId };
}
export async function handleStripeWebhook(rawBody, signature) {
  const event = stripe().webhooks.constructEvent(rawBody, signature, required('STRIPE_WEBHOOK_SECRET'));
  if (event.type === 'checkout.session.completed' || event.type === 'checkout.session.async_payment_succeeded') {
    await fulfillCheckout(event.data.object.id);
    return { received: true, fulfilled: true };
  }
  return { received: true, fulfilled: false };
}
