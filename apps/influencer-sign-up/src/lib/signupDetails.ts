import type { MomenceSession } from './api';

export type SignupDetails = {
  firstName: string; center: string; classType: string; signupType: 'kids' | 'free' | 'paid';
  formTitle: string; childName?: string; session?: Pick<MomenceSession, 'name' | 'startsAt' | 'teacherName'> | null;
  booked?: boolean; paid?: boolean;
};

const KEY = 'p57_last_signup';

export const cityFor = (center: string) => (/bengaluru|copper|kenkere|plash|sadashivnagar/i.test(center) ? 'bengaluru' : 'mumbai');

/** Kept in sessionStorage so the thank-you page survives the Stripe Checkout round trip. */
export function saveSignupDetails(details: SignupDetails) {
  try { sessionStorage.setItem(KEY, JSON.stringify(details)); } catch { /* thank-you page falls back to generic copy */ }
}

export function updateSignupDetails(patch: Partial<SignupDetails>) {
  const current = loadSignupDetails();
  if (current) saveSignupDetails({ ...current, ...patch });
}

export function loadSignupDetails(): SignupDetails | null {
  try { return JSON.parse(sessionStorage.getItem(KEY) || 'null'); } catch { return null; }
}
