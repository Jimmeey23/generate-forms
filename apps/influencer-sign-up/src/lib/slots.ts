// Shared time-slot helpers. Used by the new-form wizard, the form builder sidebar,
// and the guest-facing picker so all three agree on formatting and generation.

// One editable slot row. `id` is present once the slot exists server-side;
// `bookedCount` is read-only and blocks destructive edits.
export type SlotDraft = {
  key: string;
  id?: string;
  date: string;
  startTime: string;
  endTime: string;
  label: string;
  location: string;
  note: string;
  capacity: number;
  bookedCount: number;
};

const pad = (n: number) => String(n).padStart(2, '0');

export const toMinutes = (time: string) => {
  const [h, m] = String(time || '').split(':').map(Number);
  return Number.isFinite(h) && Number.isFinite(m) ? h * 60 + m : NaN;
};

export const fromMinutes = (total: number) => `${pad(Math.floor(total / 60) % 24)}:${pad(total % 60)}`;

export const newSlotKey = () => `slot_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;

export const sortDrafts = (drafts: SlotDraft[]) =>
  [...drafts].sort((a, b) => (a.date === b.date ? a.startTime.localeCompare(b.startTime) : a.date.localeCompare(b.date)));

export const todayIso = () => new Date().toISOString().slice(0, 10);

// 24h "HH:MM" as stored, rendered in the 12h form guests expect.
export function formatSlotTime(time: string): string {
  const [h, m] = String(time || '').split(':');
  const hour = Number(h);
  if (!Number.isFinite(hour)) return time || '';
  const suffix = hour >= 12 ? 'PM' : 'AM';
  const display = hour % 12 === 0 ? 12 : hour % 12;
  return `${display}:${m ?? '00'} ${suffix}`;
}

export function formatSlotDate(date: string): string {
  const parsed = new Date(`${date}T00:00:00`);
  if (Number.isNaN(parsed.getTime())) return date;
  return parsed.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' });
}

export type GenerateParams = {
  dates: string[];
  startTime: string;
  endTime: string;
  intervalMinutes: number;
  durationMinutes: number;
  capacity: number;
};

// Returns the slots to add, or an error message explaining why none were produced.
// Slots already present (same date + start time) are skipped rather than duplicated.
export function generateSlots(params: GenerateParams, existingSlots: SlotDraft[]): { created: SlotDraft[]; error?: string } {
  const start = toMinutes(params.startTime);
  const end = toMinutes(params.endTime);
  const interval = Math.floor(Number(params.intervalMinutes) || 0);
  const duration = Math.floor(Number(params.durationMinutes) || 0) || interval;
  const dates = params.dates.filter(Boolean);

  if (!dates.length) return { created: [], error: 'Add at least one date.' };
  if (!Number.isFinite(start) || !Number.isFinite(end)) return { created: [], error: 'Enter a valid start and end time.' };
  if (end <= start) return { created: [], error: 'The end time must be after the start time.' };
  if (interval < 5) return { created: [], error: 'The interval must be at least 5 minutes.' };

  const seen = new Set(existingSlots.map((slot) => `${slot.date} ${slot.startTime}`));
  const created: SlotDraft[] = [];
  for (const date of dates) {
    // A slot is only generated if it fits entirely before the end time.
    for (let t = start; t + duration <= end; t += interval) {
      const startTime = fromMinutes(t);
      if (seen.has(`${date} ${startTime}`)) continue;
      seen.add(`${date} ${startTime}`);
      created.push({
        key: newSlotKey(), date, startTime, endTime: fromMinutes(t + duration),
        label: '', location: '', note: '', capacity: Math.max(1, Math.floor(Number(params.capacity) || 1)), bookedCount: 0,
      });
    }
  }
  if (!created.length) return { created: [], error: 'No new slots fit that range — they may already exist.' };
  return { created };
}

// Shape the API expects when saving a form's slots.
export const toSlotInput = (slot: SlotDraft) => ({
  date: slot.date, startTime: slot.startTime, endTime: slot.endTime || undefined,
  label: slot.label, location: slot.location, note: slot.note, capacity: slot.capacity,
});
