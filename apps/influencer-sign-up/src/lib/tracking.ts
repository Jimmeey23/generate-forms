export type Attribution = { utmSource: string; utmMedium: string; utmCampaign: string; utmTerm: string; utmContent: string; gclid: string; fbclid: string; referrer: string; landingPage: string; abVariant: string; fbp: string; fbc: string };
export type FunnelStage = 'lead' | 'waiver' | 'signup' | 'classBooked';
type FunnelUser = { email?: string; phone?: string; firstName?: string; lastName?: string; externalId?: string };
type FunnelState = { ids: Record<FunnelStage, string>; fired: FunnelStage[]; user: FunnelUser; params: Record<string, unknown> };
type TrackerWindow = Window & { dataLayer?: any[]; gtag?: (...args: any[]) => void; fbq?: (...args: any[]) => void; snaptr?: (...args: any[]) => void };

const ATTRIBUTION_KEY = 'p57_attribution';
const FUNNEL_KEY = 'p57_funnel';
const STAGES: FunnelStage[] = ['lead', 'waiver', 'signup', 'classBooked'];
// Meta standard events go through fbq('track'); everything else must use fbq('trackCustom').
const EVENT_MAP = {
  lead: { ga: 'generate_lead', meta: 'Lead', metaStandard: true, snap: 'SIGN_UP' },
  waiver: { ga: 'waiver_signed', meta: 'WaiverSigned', metaStandard: false, snap: 'CUSTOM_EVENT_1' },
  signup: { ga: 'sign_up', meta: 'CompleteRegistration', metaStandard: true, snap: 'PURCHASE' },
  classBooked: { ga: 'class_booked', meta: 'ClassBooked', metaStandard: false, snap: 'CUSTOM_EVENT_2' },
} as const;

function cookie(name: string) { return document.cookie.split('; ').find((part) => part.startsWith(`${name}=`))?.slice(name.length + 1) || ''; }
function readJson<T>(storage: Storage, key: string): Partial<T> { try { return JSON.parse(storage.getItem(key) || '{}'); } catch { return {}; } }
function writeJson(storage: Storage, key: string, value: unknown) { try { storage.setItem(key, JSON.stringify(value)); } catch { /* storage blocked: tracking still fires, just without persistence */ } }

export function captureAttribution(isBengaluru = false): Attribution {
  const params = new URLSearchParams(window.location.search);
  const stored = readJson<Attribution>(localStorage, ATTRIBUTION_KEY);
  const fbclid = params.get('fbclid') || stored.fbclid || '';
  const result: Attribution = {
    utmSource: params.get('utm_source') || stored.utmSource || '',
    utmMedium: params.get('utm_medium') || stored.utmMedium || '',
    utmCampaign: params.get('utm_campaign') || stored.utmCampaign || (isBengaluru ? 'bengaluru-landing' : ''),
    utmTerm: params.get('utm_term') || stored.utmTerm || '',
    utmContent: params.get('utm_content') || stored.utmContent || '',
    gclid: params.get('gclid') || stored.gclid || '',
    fbclid,
    referrer: stored.referrer || document.referrer || '',
    landingPage: stored.landingPage || window.location.href,
    abVariant: params.get('ab_variant') || stored.abVariant || (isBengaluru ? 'bengaluru-first-class-offer' : ''),
    fbp: cookie('_fbp') || stored.fbp || '',
    fbc: cookie('_fbc') || stored.fbc || (fbclid ? `fb.1.${Date.now()}.${fbclid}` : ''),
  };
  writeJson(localStorage, ATTRIBUTION_KEY, result);
  return result;
}

function funnelState(): FunnelState {
  const stored = readJson<FunnelState>(sessionStorage, FUNNEL_KEY);
  const ids = { ...(stored.ids || {}) } as Record<FunnelStage, string>;
  for (const stage of STAGES) ids[stage] ||= `${stage}_${crypto.randomUUID()}`;
  return { ids, fired: stored.fired || [], user: stored.user || {}, params: stored.params || {} };
}

/** Starts a fresh funnel for a new signup so each person gets their own deduplication IDs. */
export function startFunnel(user: FunnelUser, params: Record<string, unknown>) {
  const ids = Object.fromEntries(STAGES.map((stage) => [stage, `${stage}_${crypto.randomUUID()}`]));
  writeJson(sessionStorage, FUNNEL_KEY, { ids, fired: [], user, params });
}

/**
 * Fires a funnel stage once per signup on GA4/GTM, Google Ads, Meta Pixel, Snap and Meta CAPI.
 * The Pixel and CAPI share one event ID so Meta deduplicates them.
 */
export async function trackFunnelEvent(stage: FunnelStage, extraParams: Record<string, unknown> = {}) {
  const state = funnelState();
  if (state.fired.includes(stage)) return;
  writeJson(sessionStorage, FUNNEL_KEY, { ...state, fired: [...state.fired, stage] });
  const win = window as TrackerWindow; const names = EVENT_MAP[stage]; const eventId = state.ids[stage];
  const attribution = readJson<Attribution>(localStorage, ATTRIBUTION_KEY);
  const params = { ...state.params, ...extraParams };
  const payload = { ...params, event_id: eventId };
  win.dataLayer ||= []; win.dataLayer.push({ event: names.ga, ...payload });
  win.gtag?.('event', names.ga, payload);
  win.fbq?.(names.metaStandard ? 'track' : 'trackCustom', names.meta, { ...params, value: 1, currency: 'INR' }, { eventID: eventId });
  win.snaptr?.('track', names.snap, payload);
  await fetch('/api/tracking/meta-capi', { method: 'POST', headers: { 'Content-Type': 'application/json' }, keepalive: true, body: JSON.stringify({ eventName: names.meta, eventId, eventSourceUrl: window.location.href, user: { ...state.user, fbp: attribution.fbp, fbc: attribution.fbc }, customData: params }) }).catch(() => undefined);
}

export function initializeTracking() {
  const win = window as TrackerWindow;
  const inject = (src: string) => { const script = document.createElement('script'); script.async = true; script.src = src; document.head.appendChild(script); };
  const gtm = import.meta.env.VITE_GTM_ID;
  if (gtm) { win.dataLayer ||= []; win.dataLayer.push({ 'gtm.start': Date.now(), event: 'gtm.js' }); inject(`https://www.googletagmanager.com/gtm.js?id=${gtm}`); }
  const ga = import.meta.env.VITE_GA_MEASUREMENT_ID; const ads = import.meta.env.VITE_GOOGLE_ADS_ID;
  if (ga || ads) {
    inject(`https://www.googletagmanager.com/gtag/js?id=${ga || ads}`);
    win.dataLayer ||= [];
    // gtag.js only reads the real `arguments` object, not an array.
    win.gtag = function gtag() { win.dataLayer!.push(arguments); };
    win.gtag('js', new Date()); if (ga) win.gtag('config', ga); if (ads) win.gtag('config', ads);
  }
  const pixel = import.meta.env.VITE_META_PIXEL_ID;
  if (pixel && !win.fbq) {
    const fbq: any = (...args: any[]) => fbq.callMethod ? fbq.callMethod(...args) : fbq.queue.push(args);
    fbq.queue = []; fbq.loaded = true; fbq.version = '2.0'; fbq.push = fbq; win.fbq = fbq;
    inject('https://connect.facebook.net/en_US/fbevents.js'); win.fbq('init', pixel); win.fbq('track', 'PageView');
  }
  const snap = import.meta.env.VITE_SNAP_PIXEL_ID;
  if (snap && !win.snaptr) {
    const snaptr: any = (...args: any[]) => snaptr.handleRequest ? snaptr.handleRequest(...args) : snaptr.queue.push(args);
    snaptr.queue = []; win.snaptr = snaptr;
    inject('https://sc-static.net/scevent.min.js'); win.snaptr('init', snap); win.snaptr('track', 'PAGE_VIEW');
  }
}
