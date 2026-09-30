import { useState } from 'react';
import { Button } from '@project/components/ui/button';
import { Input } from '@project/components/ui/input';
import { Label } from '@project/components/ui/label';
import { Switch } from '@project/components/ui/switch';
import { Trash2, Plus, Wand2, CalendarPlus, Users, MapPin } from 'lucide-react';
import { toast } from 'sonner';
import type { SlotBooking } from '@/lib/api';
import {
  formatSlotDate, formatSlotTime, generateSlots, newSlotKey, sortDrafts, todayIso, type SlotDraft,
} from '@/lib/slots';

export { sortDrafts };
export type { SlotDraft };

export function SlotBuilder({
  booking, onBookingChange, slots, onSlotsChange,
}: {
  booking: SlotBooking;
  onBookingChange: (next: SlotBooking) => void;
  slots: SlotDraft[];
  onSlotsChange: (next: SlotDraft[]) => void;
}) {
  const today = todayIso();
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
    key: newSlotKey(), date: genDates[0] || today, startTime: genStart, endTime: '', label: '', location: '', note: '', capacity: genCapacity, bookedCount: 0,
  }]));

  const generate = () => {
    const { created, error } = generateSlots(
      { dates: genDates, startTime: genStart, endTime: genEnd, intervalMinutes: genInterval, durationMinutes: genDuration, capacity: genCapacity },
      slots,
    );
    if (error) { toast.error(error); return; }
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
            <div className="flex items-center justify-between">
              <Label className="text-xs text-muted-foreground">Waitlist when full</Label>
              <Switch checked={booking.allowWaitlist} onCheckedChange={(v) => patchBooking({ allowWaitlist: v })} />
            </div>
            <div className="flex items-center justify-between">
              <Label className="text-xs text-muted-foreground">Allow repeat bookings</Label>
              <Switch checked={booking.allowDuplicateEmail} onCheckedChange={(v) => patchBooking({ allowDuplicateEmail: v })} />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label className="text-xs text-muted-foreground">Opens</Label>
                <Input type="datetime-local" value={booking.opensAt} onChange={(e) => patchBooking({ opensAt: e.target.value })} className="h-8 text-[11px]" />
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Closes</Label>
                <Input type="datetime-local" value={booking.closesAt} onChange={(e) => patchBooking({ closesAt: e.target.value })} className="h-8 text-[11px]" />
              </div>
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">Cutoff before a slot (min)</Label>
              <Input inputMode="numeric" value={booking.cutoffMinutes || ''} placeholder="0"
                onChange={(e) => patchBooking({ cutoffMinutes: Number(e.target.value.replace(/\D/g, '')) || 0 })} className="h-8 text-sm" />
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
