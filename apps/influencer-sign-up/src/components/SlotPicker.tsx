import { Label } from '@project/components/ui/label';
import { Clock, Users, CalendarDays } from 'lucide-react';
import { motion } from 'framer-motion';
import type { FormSlot } from '@/lib/api';

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

export function slotSummary(slot: Pick<FormSlot, 'date' | 'startTime' | 'endTime' | 'label'>): string {
  if (slot.label) return slot.label;
  const range = slot.endTime ? `${formatSlotTime(slot.startTime)} - ${formatSlotTime(slot.endTime)}` : formatSlotTime(slot.startTime);
  return `${formatSlotDate(slot.date)}, ${range}`;
}

type Props = {
  slots: FormSlot[];
  value: string;
  onChange: (slotId: string) => void;
  heading: string;
  helperText?: string;
  required?: boolean;
  showRemaining?: boolean;
  error?: string;
  loading?: boolean;
  bold?: boolean;
};

export default function SlotPicker({ slots, value, onChange, heading, helperText, required, showRemaining = true, error, loading, bold }: Props) {
  const labelClass = `text-xs uppercase tracking-wider ${bold ? 'font-bold' : 'font-medium'}`;

  // Slots arrive ordered by date then time; group them so multi-day events read as a schedule.
  const days: { date: string; slots: FormSlot[] }[] = [];
  for (const slot of slots) {
    const last = days[days.length - 1];
    if (last && last.date === slot.date) last.slots.push(slot);
    else days.push({ date: slot.date, slots: [slot] });
  }

  return (
    <div className="space-y-3">
      <Label className={labelClass} style={{ color: 'hsl(var(--form-text-secondary))' }}>
        {heading}{required && <span className="text-red-400 ml-0.5">*</span>}
      </Label>

      {loading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-[74px] rounded-xl animate-pulse" style={{ background: 'hsl(var(--form-surface))' }} />
          ))}
        </div>
      ) : slots.length === 0 ? (
        <p className="text-sm py-4 px-4 rounded-xl" style={{ color: 'hsl(var(--form-text-muted))', background: 'hsl(var(--form-surface))', border: '1px solid hsl(var(--form-border))' }}>
          No time slots have been published for this form yet.
        </p>
      ) : (
        <div className="space-y-4">
          {days.map((day) => (
            <div key={day.date} className="space-y-2">
              {days.length > 1 && (
                <div className="flex items-center gap-1.5 text-[11px] uppercase tracking-wider" style={{ color: 'hsl(var(--form-text-muted))' }}>
                  <CalendarDays className="w-3 h-3" />{formatSlotDate(day.date)}
                </div>
              )}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                {day.slots.map((slot) => {
                  const full = slot.remaining <= 0;
                  const selected = value === slot.id;
                  const low = !full && slot.remaining <= 2;
                  return (
                    <motion.button
                      key={slot.id}
                      type="button"
                      disabled={full}
                      whileHover={full ? undefined : { scale: 1.02 }}
                      whileTap={full ? undefined : { scale: 0.97 }}
                      onClick={() => onChange(slot.id)}
                      className="relative flex flex-col items-center justify-center rounded-xl py-3 px-2 transition-all"
                      style={{
                        background: full ? 'hsl(var(--form-surface))' : selected ? 'hsl(var(--form-surface-hover))' : 'hsl(var(--form-surface))',
                        border: `2px solid ${selected ? 'hsl(var(--form-text))' : 'hsl(var(--form-border))'}`,
                        opacity: full ? 0.45 : 1,
                        cursor: full ? 'not-allowed' : 'pointer',
                      }}
                    >
                      <Clock className="w-3.5 h-3.5 mb-1" style={{ color: selected ? 'hsl(var(--form-text))' : 'hsl(var(--form-text-muted))' }} />
                      <span className="text-sm font-semibold leading-tight text-center" style={{ color: 'hsl(var(--form-text))' }}>
                        {slot.label || formatSlotTime(slot.startTime)}
                      </span>
                      {!slot.label && slot.endTime && (
                        <span className="text-[10px]" style={{ color: 'hsl(var(--form-text-muted))' }}>to {formatSlotTime(slot.endTime)}</span>
                      )}
                      {showRemaining && (
                        <span className="flex items-center gap-1 text-[10px] mt-0.5 font-medium"
                          style={{ color: full ? 'hsl(var(--form-error))' : low ? '#e08b3a' : 'hsl(var(--form-text-muted))' }}>
                          <Users className="w-2.5 h-2.5" />{full ? 'Full' : `${slot.remaining} left`}
                        </span>
                      )}
                      {selected && (
                        <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }}
                          className="absolute top-1.5 right-1.5 w-4 h-4 rounded-full flex items-center justify-center text-[10px]"
                          style={{ background: 'hsl(var(--form-text))', color: 'hsl(var(--form-card))' }}>✓</motion.div>
                      )}
                    </motion.button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}

      {helperText && <p className="text-[11px]" style={{ color: 'hsl(var(--form-text-muted))' }}>{helperText}</p>}
      {error && <p className="text-xs" style={{ color: 'hsl(var(--form-error))' }}>{error}</p>}
    </div>
  );
}
