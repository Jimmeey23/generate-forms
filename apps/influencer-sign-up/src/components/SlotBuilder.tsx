import { useState } from 'react';
import { Button } from '@project/components/ui/button';
import { Input } from '@project/components/ui/input';
import { Label } from '@project/components/ui/label';
import { Switch } from '@project/components/ui/switch';
import { Trash2, Plus, Wand2, CalendarPlus, Users } from 'lucide-react';
import { toast } from 'sonner';
import type { SlotBooking } from '@/lib/api';
import { formatSlotDate, formatSlotTime } from './SlotPicker';

// One editable row in the builder. `id` is present once the slot exists server-side;
// `bookedCount` is read-only and blocks destructive edits.
export type SlotDraft = {
  key: string;
  id?: string;
  date: string;
  startTime: string;
  endTime: string;
  label: string;
  capacity: number;
  bookedCount: number;
};

const pad = (n: number) => String(n).padStart(2, '0');
const toMinutes = (time: string) => {
  const [h, m] = time.split(':').map(Number);
  return Number.isFinite(h) && Number.isFinite(m) ? h * 60 + m : NaN;
};
const fromMinutes = (total: number) => `${pad(Math.floor(total / 60) % 24)}:${pad(total % 60)}`;
const newKey = () => `slot_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;

export const sortDrafts = (drafts: SlotDraft[]) =>
  [...drafts].sort((a, b) => (a.date === b.date ? a.startTime.localeCompare(b.startTime) : a.date.localeCompare(b.date)));

export function SlotBuilder({
  booking, onBookingChange, slots, onSlotsChange,
}: {
  booking: SlotBooking;
  onBookingChange: (next: SlotBooking) => void;
  slots: SlotDraft[];
  onSlotsChange: (next: SlotDraft[]) => void;
}) {
  const today = new Date().toISOString().slice(0, 10);
  const [genDates, setGenDates] = useState<string[]>([today]);
  const [genStart, setGenStart] = useState('09:30');
  const [genEnd, setGenEnd] = useState('12:30');
  const [genInterval, setGenInterval] = useState(20);
  const [genDuration, setGenDuration] = useState(20);
  const [genCapacity, setGenCapacity] = useState(booking.defaultCapacity || 6);

  const patchBooking = (patch: Partial<SlotBooking>) => onBookingChange({ ...booking, ...patch });
  const patchSlot = (key: string, patch: Partial<SlotDraft>) =>
    onSlotsChange(slots.map((slot) => (slot.key === key ? { ...slot, ...patch } : slot)));

  const removeSlot = (slot: SlotDraft) => {
    if (slot.bookedCount > 0) { toast.error('That slot already has sign-ups and cannot be removed.'); return; }
    onSlotsChange(slots.filter((s) => s.key !== slot.key));
  };

  const addBlank = () => onSlotsChange(sortDrafts([...slots, {
    key: newKey(), date: genDates[0] || today, startTime: genStart, endTime: '', label: '', capacity: genCapacity, bookedCount: 0,
  }]));

  const generate = () => {
    const start = toMinutes(genStart);
    const end = toMinutes(genEnd);
    const interval = Math.floor(Number(genInterval) || 0);
    const dates = genDates.filter(Boolean);
    if (!dates.length) { toast.error('Add at least one date.'); return; }
    if (!Number.isFinite(start) || !Number.isFinite(end)) { toast.error('Enter a valid start and end time.'); return; }
    if (end <= start) { toast.error('The end time must be after the start time.'); return; }
    if (interval < 5) { toast.error('The interval must be at least 5 minutes.'); return; }

    const existing = new Set(slots.map((slot) => `${slot.date} ${slot.startTime}`));
    const created: SlotDraft[] = [];
    for (const date of dates) {
      // A slot is only generated if it fits entirely before the end time.
      for (let t = start; t + (Number(genDuration) || interval) <= end; t += interval) {
        const startTime = fromMinutes(t);
        if (existing.has(`${date} ${startTime}`)) continue;
        existing.add(`${date} ${startTime}`);
        created.push({
          key: newKey(), date, startTime,
          endTime: fromMinutes(t + (Number(genDuration) || interval)),
          label: '', capacity: Math.max(1, Math.floor(Number(genCapacity) || 1)), bookedCount: 0,
        });
      }
    }
    if (!created.length) { toast.error('No new slots fit that range — they may already exist.'); return; }
    onSlotsChange(sortDrafts([...slots, ...created]));
    toast.success(`${created.length} slot${created.length === 1 ? '' : 's'} generated.`);
  };

  const clearUnbooked = () => {
    const kept = slots.filter((slot) => slot.bookedCount > 0);
    if (kept.length === slots.length) { toast.error('Every slot already has sign-ups.'); return; }
    onSlotsChange(kept);
  };

  const totalCapacity = slots.reduce((sum, slot) => sum + (Number(slot.capacity) || 0), 0);
  const totalBooked = slots.reduce((sum, slot) => sum + slot.bookedCount, 0);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <Label className="text-sm">Time slot sign-ups</Label>
          <p className="text-[11px] text-muted-foreground">Guests pick a slot; each slot has its own cap.</p>
        </div>
        <Switch checked={booking.enabled} onCheckedChange={(v) => patchBooking({ enabled: v })} />
      </div>

      {booking.enabled && (
        <div className="space-y-4 pt-1">
          <div className="space-y-2">
            <div>
              <Label className="text-xs text-muted-foreground">Section heading</Label>
              <Input value={booking.heading} onChange={(e) => patchBooking({ heading: e.target.value })} placeholder="Pick your time slot" className="h-8 text-sm" />
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">Helper text</Label>
              <Input value={booking.helperText} onChange={(e) => patchBooking({ helperText: e.target.value })} placeholder="Arrive 10 minutes early" className="h-8 text-sm" />
            </div>
            <div className="flex items-center justify-between">
              <Label className="text-xs text-muted-foreground">Slot is required</Label>
              <Switch checked={booking.required} onCheckedChange={(v) => patchBooking({ required: v })} />
            </div>
            <div className="flex items-center justify-between">
              <Label className="text-xs text-muted-foreground">Show spots remaining</Label>
              <Switch checked={booking.showRemaining} onCheckedChange={(v) => patchBooking({ showRemaining: v })} />
            </div>
          </div>

          {/* ── Generator ── */}
          <div className="rounded-lg border border-border p-3 space-y-2.5">
            <div className="flex items-center gap-1.5 text-xs font-medium"><Wand2 className="w-3.5 h-3.5" />Generate slots</div>

            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Dates</Label>
              {genDates.map((date, index) => (
                <div key={index} className="flex gap-1.5">
                  <Input type="date" value={date} onChange={(e) => setGenDates(genDates.map((d, i) => (i === index ? e.target.value : d)))} className="h-8 text-sm" />
                  {genDates.length > 1 && (
                    <Button variant="ghost" size="sm" className="h-8 px-2 shrink-0" onClick={() => setGenDates(genDates.filter((_, i) => i !== index))}>
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  )}
                </div>
              ))}
              <Button variant="outline" size="sm" className="h-7 gap-1.5 text-xs w-full" onClick={() => setGenDates([...genDates, genDates[genDates.length - 1] || today])}>
                <CalendarPlus className="w-3 h-3" />Add date
              </Button>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div><Label className="text-xs text-muted-foreground">Start</Label><Input type="time" value={genStart} onChange={(e) => setGenStart(e.target.value)} className="h-8 text-sm" /></div>
              <div><Label className="text-xs text-muted-foreground">End</Label><Input type="time" value={genEnd} onChange={(e) => setGenEnd(e.target.value)} className="h-8 text-sm" /></div>
              <div><Label className="text-xs text-muted-foreground">Every (min)</Label><Input type="number" min={5} value={genInterval} onChange={(e) => setGenInterval(Number(e.target.value))} className="h-8 text-sm" /></div>
              <div><Label className="text-xs text-muted-foreground">Length (min)</Label><Input type="number" min={5} value={genDuration} onChange={(e) => setGenDuration(Number(e.target.value))} className="h-8 text-sm" /></div>
              <div className="col-span-2"><Label className="text-xs text-muted-foreground">Capacity per slot</Label><Input type="number" min={1} value={genCapacity} onChange={(e) => { setGenCapacity(Number(e.target.value)); patchBooking({ defaultCapacity: Math.max(1, Number(e.target.value) || 1) }); }} className="h-8 text-sm" /></div>
            </div>

            <div className="flex gap-1.5">
              <Button size="sm" className="h-7 gap-1.5 text-xs flex-1" onClick={generate}><Wand2 className="w-3 h-3" />Generate</Button>
              <Button variant="outline" size="sm" className="h-7 gap-1.5 text-xs" onClick={addBlank}><Plus className="w-3 h-3" />One slot</Button>
            </div>
          </div>

          {/* ── Slot list ── */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <Label className="text-xs text-muted-foreground">{slots.length} slot{slots.length === 1 ? '' : 's'} · {totalBooked}/{totalCapacity} booked</Label>
              {slots.length > 0 && <Button variant="ghost" size="sm" className="h-6 px-2 text-[11px]" onClick={clearUnbooked}>Clear empty</Button>}
            </div>
            <div className="max-h-72 overflow-y-auto space-y-1.5 pr-0.5">
              {sortDrafts(slots).map((slot) => (
                <div key={slot.key} className="rounded-lg border border-border p-2 space-y-1.5">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[11px] font-medium">
                      {formatSlotDate(slot.date)} · {formatSlotTime(slot.startTime)}
                    </span>
                    <span className="flex items-center gap-2">
                      <span className="flex items-center gap-1 text-[10px] text-muted-foreground"><Users className="w-3 h-3" />{slot.bookedCount}/{slot.capacity}</span>
                      <Button variant="ghost" size="sm" className="h-6 px-1.5" onClick={() => removeSlot(slot)} disabled={slot.bookedCount > 0}>
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </span>
                  </div>
                  <div className="grid grid-cols-4 gap-1.5">
                    <Input type="date" value={slot.date} disabled={slot.bookedCount > 0} onChange={(e) => patchSlot(slot.key, { date: e.target.value })} className="h-7 text-[11px] col-span-2" />
                    <Input type="time" value={slot.startTime} disabled={slot.bookedCount > 0} onChange={(e) => patchSlot(slot.key, { startTime: e.target.value })} className="h-7 text-[11px]" />
                    <Input type="time" value={slot.endTime} onChange={(e) => patchSlot(slot.key, { endTime: e.target.value })} className="h-7 text-[11px]" />
                    <Input value={slot.label} onChange={(e) => patchSlot(slot.key, { label: e.target.value })} placeholder="Custom label (optional)" className="h-7 text-[11px] col-span-3" />
                    <Input type="number" min={slot.bookedCount} value={slot.capacity} onChange={(e) => patchSlot(slot.key, { capacity: Math.max(slot.bookedCount, Number(e.target.value) || 0) })} className="h-7 text-[11px]" />
                  </div>
                </div>
              ))}
              {slots.length === 0 && <p className="text-[11px] text-muted-foreground py-2">No slots yet. Generate a grid or add one by hand.</p>}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
