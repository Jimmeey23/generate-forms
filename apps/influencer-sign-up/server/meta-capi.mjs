import { createHash } from 'node:crypto';
const sha = (value) => createHash('sha256').update(String(value).trim().toLowerCase()).digest('hex');
export async function sendMetaCapi({ eventName, eventId, eventSourceUrl, user = {}, customData = {}, request }) {
  const pixelId = process.env.VITE_META_PIXEL_ID?.trim(); const token = process.env.META_CONVERSIONS_API_ACCESS_TOKEN?.trim();
  if (!pixelId || !token) return { configured: false };
  const data = {}; if (user.email) data.em = [sha(user.email)]; if (user.phone) data.ph = [sha(String(user.phone).replace(/\D/g, ''))]; if (user.firstName) data.fn = [sha(user.firstName)]; if (user.lastName) data.ln = [sha(user.lastName)]; if (user.externalId) data.external_id = [sha(user.externalId)]; if (user.fbp) data.fbp = user.fbp; if (user.fbc) data.fbc = user.fbc;
  const forwarded = request?.get('x-forwarded-for')?.split(',')[0]?.trim(); if (forwarded) data.client_ip_address = forwarded; if (request?.get('user-agent')) data.client_user_agent = request.get('user-agent');
  const body = { data: [{ event_name: eventName, event_time: Math.floor(Date.now() / 1000), event_id: eventId, action_source: 'website', event_source_url: eventSourceUrl, user_data: data, custom_data: { value: 1, currency: 'INR', ...customData } }] };
  const response = await fetch(`https://graph.facebook.com/v21.0/${pixelId}/events?access_token=${encodeURIComponent(token)}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
  if (!response.ok) throw new Error(`Meta CAPI failed (${response.status}): ${(await response.text()).slice(0, 200)}`); return { configured: true };
}
