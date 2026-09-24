export type Attribution = { utmSource: string; utmMedium: string; utmCampaign: string; utmTerm: string; utmContent: string; gclid: string; fbclid: string; referrer: string; landingPage: string; abVariant: string };

const ATTRIBUTION_KEY = 'p57_attribution';

/** Lead-source details saved with each submission and passed to Momence; nothing is sent to ad platforms. */
export function captureAttribution(isBengaluru = false): Attribution {
  const params = new URLSearchParams(window.location.search);
  let stored: Partial<Attribution> = {};
  try { stored = JSON.parse(localStorage.getItem(ATTRIBUTION_KEY) || '{}'); } catch { stored = {}; }
  const result: Attribution = {
    utmSource: params.get('utm_source') || stored.utmSource || '',
    utmMedium: params.get('utm_medium') || stored.utmMedium || '',
    utmCampaign: params.get('utm_campaign') || stored.utmCampaign || (isBengaluru ? 'bengaluru-landing' : ''),
    utmTerm: params.get('utm_term') || stored.utmTerm || '',
    utmContent: params.get('utm_content') || stored.utmContent || '',
    gclid: params.get('gclid') || stored.gclid || '',
    fbclid: params.get('fbclid') || stored.fbclid || '',
    referrer: stored.referrer || document.referrer || '',
    landingPage: stored.landingPage || window.location.href,
    abVariant: params.get('ab_variant') || stored.abVariant || (isBengaluru ? 'bengaluru-first-class-offer' : ''),
  };
  try { localStorage.setItem(ATTRIBUTION_KEY, JSON.stringify(result)); } catch { /* storage blocked: attribution still sent for this submission */ }
  return result;
}
