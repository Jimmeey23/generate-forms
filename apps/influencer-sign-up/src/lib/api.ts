import type { Attribution } from './tracking';

export type FormRecord = {
  id: string; title: string; description: string; slug: string; fields: any[]; themeColor: string; layout: string;
  heroImage: string; utmSource: string; utmChannel: string; utmCampaign: string; status: string;
  submissionCount: number; createdAt: string; shareUrl: string; hashtag: string; heroPosition: string;
  heroPositionX: number; heroPositionY: number; heroHeight: number; heroWidth: number; hashtagSize: string;
  hashtagStyle: string; hashtagPosition: string; logoPosition: string; logoSize: string; logoInvert: boolean;
  logoUrl: string; influencerName: string; eventName: string; metadataTitle: string; metadataDescription: string;
  formWidth: number; formMinHeight: number; formBorderRadius: number; formPadding: number; boldLabels: boolean;
  accentColor: string; heroScale: number;
  signupType: 'kids' | 'free' | 'paid'; targetStudio: string; sessionId: string; classFormat: string;
  targetStudios: string[]; classFormats: string[]; eventDate: string; eventTime: string; eventVenue: string;
};
export type SubmissionRecord = { id: string; responses: Record<string, any>; submitterEmail: string; submittedAt: string };
export type GetFormOutputType = { form: FormRecord | null };
export type GetFormsOutputType = { forms: FormRecord[] };
export type GetSubmissionsOutputType = { submissions: SubmissionRecord[] };

async function request<T>(url: string, init?: RequestInit): Promise<T> {
  const response = await fetch(url, { ...init, headers: { 'Content-Type': 'application/json', ...(init?.headers || {}) } });
  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    throw new Error(body.error || `Request failed with status ${response.status}`);
  }
  return response.json();
}

export const generateForm = (input: { prompt: string; creatorEmail?: string; signupType: 'kids' | 'free' | 'paid'; targetStudios: string[]; sessionId?: string; classFormats?: string[]; eventDate?: string; eventTime?: string; eventVenue?: string }) => request<{ form: FormRecord }>('/api/generate-form', { method: 'POST', body: JSON.stringify(input) });
export const getForms = (input: { creatorEmail?: string }) => request<GetFormsOutputType>(`/api/forms${input.creatorEmail ? `?creatorEmail=${encodeURIComponent(input.creatorEmail)}` : ''}`);
export const getForm = (input: { id?: string; slug?: string }) => request<GetFormOutputType>(`/api/forms/${encodeURIComponent(input.id || input.slug || '')}${input.slug ? '?by=slug' : ''}`);
export const updateForm = (input: { id: string; [key: string]: any }) => {
  const { id, ...body } = input;
  return request<{ success: boolean }>(`/api/forms/${encodeURIComponent(id)}`, { method: 'PATCH', body: JSON.stringify(body) });
};
export const deleteForm = (input: { id: string }) => request<{ success: boolean }>(`/api/forms/${encodeURIComponent(input.id)}`, { method: 'DELETE' });
export const getSubmissions = (input: { formId: string }) => request<GetSubmissionsOutputType>(`/api/forms/${encodeURIComponent(input.formId)}/submissions`);
export const submitForm = (input: { formId: string; responses: Record<string, any>; utmSource?: string; utmChannel?: string; utmCampaign?: string; attribution?: Omit<Attribution, 'fbp' | 'fbc'> }) => {
  const { formId, ...body } = input;
  return request<{ success: boolean; submissionId: string; webhookStatus: string; checkoutUrl?: string | null; signup?: { memberId: number; booked?: boolean } }>(`/api/forms/${encodeURIComponent(formId)}/submissions`, { method: 'POST', body: JSON.stringify(body) });
};
export const confirmPayment = (checkoutSessionId: string) => request<{ success: boolean; booking: { memberId: number; sessionId: number } }>(`/api/payments/confirm?checkout_session_id=${encodeURIComponent(checkoutSessionId)}`);
export type MomenceSession = { id: number; name: string; startsAt: string; endsAt: string; durationInMinutes: number; capacity: number | null; bookingCount: number; spotsLeft: number | null; teacherName: string; locationName: string };
export const getMomenceSessions = (input: { center: string; classType: string }) => request<{ sessions: MomenceSession[] }>(`/api/momence/sessions?center=${encodeURIComponent(input.center)}&classType=${encodeURIComponent(input.classType)}`);
export const selectMomenceClass = (input: { memberId: number; sessionId: number; center: string; classType: string; customerFields: Record<string, string> }) => request<{ booked: boolean; checkoutUrl?: string | null; memberId?: number; sessionId?: number }>('/api/momence/select-class', { method: 'POST', body: JSON.stringify(input) });
