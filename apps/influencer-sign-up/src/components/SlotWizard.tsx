import { useState, useEffect } from 'react';
import { Button } from '@project/components/ui/button';
import { Input } from '@project/components/ui/input';
import { Label } from '@project/components/ui/label';
import { Switch } from '@project/components/ui/switch';
import { Trash2, Wand2, CalendarPlus, Users, Plus, Clock } from 'lucide-react';
import { toast } from 'sonner';
import type { SlotBooking } from '@/lib/api';
import { formatSlotDate, formatSlotTime, generateSlots, newSlotKey, sortDrafts, todayIso, type SlotDraft } from '@/lib/slots';

// Slot scheduling for the new-form wizard. Styled to match the dark builder shell,
// so it takes the page's field/label classes rather than hardcoding its own.
export default function SlotWizard({
  booking, onBookingChange, slots, onSlotsChange, fieldClass, labelClass, defaultDate,
}: {
  booking: SlotBooking;
  onBookingChange: (next: SlotBooking) => void;
  slots: SlotDraft[];
  onSlotsChange: (next: SlotDraft[]) => void;
  fieldClass: string;
  labelClass: string;
  defaultDate?: string;
}) {
  const [genDates, setGenDates] = useState<string[]>([defaultDate || todayIso()]);
  const [genStart, setGenStart] = useState('09:30');
  const [genEnd, setGenEnd] = useState('12:30');
  const [genInterval, setGenInterval] = useState(20);
  const [genDuration, setGenDuration] = useState(20);
  const [genCapacity, setGenCapacity] = useState(booking.defaultCapacity || 6);

  // Follow the event date the organiser picked in step 01, until they edit the dates here.
  const [datesTouched, setDatesTouched] = useState(false);
  useEffect(() => {
    if (!datesTouched && defaultDate) setGenDates([defaultDate]);
  }, [defaultDate, datesTouched]);

  const patchBooking = (patch: Partial<SlotBooking>) => onBookingChange({ ...booking, ...patch });
  const patchSlot = (key: string, patch: Partial<SlotDraft>) =>
    onSlotsChange(slots.map((slot) => (slot.key === key ? { ...slot, ...patch } : slot)));
  const editDates = (next: string[]) => { setDatesTouched(true); setGenDates(next); };

  const generate = () => {
    const { created, error } = generateSlots(
      { dates: genDates, startTime: genStart, endTime: genEnd, intervalMinutes: genInterval, durationMinutes: genDuration, capacity: genCapacity },
      slots,
    );
    if (error) { toast.error(error); return; }
    onSlotsChange(sortDrafts([...slots, ...created]));
    toast.success(`${created.length} slot${created.length === 1 ? '' : 's'} added.`);
  };

  const addBlank = () => onSlotsChange(sortDrafts([...slots, {
    key: newSlotKey(), date: genDates[0] || todayIso(), startTime: genStart, endTime: '', label: '', capacity: genCapacity, bookedCount: 0,
  }]));

  const totalCapacity = slots.reduce((sum, slot) => sum + (Number(slot.capacity) || 0), 0);

  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between gap-4 rounded-xl border border-border/50 bg-muted/20 p-4">
        <div>
          <span className="block text-sm font-semibold">Let guests book a time slot</span>
          <span className="block text-xs text-muted-foreground mt-0.5">
            Guests pick from a schedule you define. Each slot stops accepting sign-ups once it hits its cap.
          </span>
        </div>
        <Switch checked={booking.enabled} onCheckedChange={(v) => patchBooking({ enabled: v })} className="mt-0.5 shrink-0" />
      </div>

      {booking.enabled && (
        <div className="space-y-5">
          {/* ── Generator ── */}
          <div className="rounded-xl border border-border/50 p-4 space-y-4">
            <div className="flex items-center gap-1.5 text-xs uppercase tracking-wider font-bold text-muted-foreground">
              <Wand2 className="w-3.5 h-3.5" />Build the schedule
            </div>

            <div>
              <Label className={labelClass}>Dates</Label>
              <div className="space-y-2">
                {genDates.map((date, index) => (
                  <div key={index} className="flex gap-2">
                    <Input type="date" value={date} onChange={(e) => editDates(genDates.map((d, i) => (i === index ? e.target.value : d)))}
                      className={`${fieldClass} [color-scheme:dark]`} />
                    {genDates.length > 1 && (
                      <Button variant="ghost" size="sm" className="h-11 px-3 shrink-0" onClick={() => editDates(genDates.filter((_, i) => i !== index))}>
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                ))}
                <Button variant="outline" size="sm" className="h-9 gap-1.5 text-xs" onClick={() => editDates([...genDates, genDates[genDates.length - 1] || todayIso()])}>
                  <CalendarPlus className="w-3.5 h-3.5" />Add another date
                </Button>
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div>
                <Label htmlFor="slot-start" className={labelClass}>First slot</Label>
                <Input id="slot-start" type="time" value={genStart} onChange={(e) => setGenStart(e.target.value)} className={`${fieldClass} [color-scheme:dark]`} />
              </div>
              <div>
                <Label htmlFor="slot-end" className={labelClass}>Ends by</Label>
                <Input id="slot-end" type="time" value={genEnd} onChange={(e) => setGenEnd(e.target.value)} className={`${fieldClass} [color-scheme:dark]`} />
              </div>
              <div>
                <Label htmlFor="slot-interval" className={labelClass}>Every (min)</Label>
                <Input id="slot-interval" inputMode="numeric" value={genInterval} onChange={(e) => setGenInterval(Number(e.target.value.replace(/\D/g, '')) || 0)} className={fieldClass} />
              </div>
              <div>
                <Label htmlFor="slot-duration" className={labelClass}>Length (min)</Label>
                <Input id="slot-duration" inputMode="numeric" value={genDuration} onChange={(e) => setGenDuration(Number(e.target.value.replace(/\D/g, '')) || 0)} className={fieldClass} />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 items-start">
              <div>
                <Label htmlFor="slot-capacity" className={labelClass}>Spots per slot</Label>
                <Input id="slot-capacity" inputMode="numeric" value={genCapacity}
                  onChange={(e) => { const n = Number(e.target.value.replace(/\D/g, '')) || 0; setGenCapacity(n); patchBooking({ defaultCapacity: Math.max(1, n) }); }}
                  className={fieldClass} />
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed md:pt-7">
                {genInterval > 0 && genCapacity > 0
                  ? `A slot every ${genInterval} min, ${genCapacity} guest${genCapacity === 1 ? '' : 's'} each.`
                  : 'Set an interval and a capacity to generate the grid.'}
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              <Button size="sm" className="h-9 gap-1.5 text-xs" onClick={generate}><Wand2 className="w-3.5 h-3.5" />Generate slots</Button>
              <Button variant="outline" size="sm" className="h-9 gap-1.5 text-xs" onClick={addBlank}><Plus className="w-3.5 h-3.5" />Add one slot</Button>
              {slots.length > 0 && (
                <Button variant="ghost" size="sm" className="h-9 text-xs text-muted-foreground" onClick={() => onSlotsChange([])}>Clear all</Button>
              )}
            </div>
          </div>

          {/* ── Generated slots ── */}
          {slots.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className={labelClass}>
                  {slots.length} slot{slots.length === 1 ? '' : 's'} · {totalCapacity} total spots
                </Label>
              </div>
              <div className="max-h-64 overflow-y-auto rounded-xl border border-border/50 divide-y divide-border/40">
                {sortDrafts(slots).map((slot) => (
                  <div key={slot.key} className="flex items-center gap-2 p-2.5">
                    <Clock className="w-3.5 h-3.5 shrink-0 text-muted-foreground" />
                    <span className="text-xs font-medium w-32 shrink-0">{formatSlotDate(slot.date)}</span>
                    <span className="text-xs w-20 shrink-0">{formatSlotTime(slot.startTime)}</span>
                    <Input value={slot.label} onChange={(e) => patchSlot(slot.key, { label: e.target.value })}
                      placeholder="Optional label" className="h-8 text-xs flex-1 min-w-0 bg-muted/20 border-border/40" />
                    <div className="flex items-center gap-1 shrink-0">
                      <Users className="w-3 h-3 text-muted-foreground" />
                      <Input inputMode="numeric" value={slot.capacity}
                        onChange={(e) => patchSlot(slot.key, { capacity: Number(e.target.value.replace(/\D/g, '')) || 0 })}
                        className="h-8 w-14 text-xs bg-muted/20 border-border/40" />
                    </div>
                    <Button variant="ghost" size="sm" className="h-8 px-2 shrink-0" onClick={() => onSlotsChange(slots.filter((s) => s.key !== slot.key))}>
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── Wording shown to guests ── */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <Label htmlFor="slot-heading" className={labelClass}>Section heading</Label>
              <Input id="slot-heading" value={booking.heading} onChange={(e) => patchBooking({ heading: e.target.value })}
                placeholder="Pick your time slot" className={fieldClass} />
            </div>
            <div>
              <Label htmlFor="slot-helper" className={labelClass}>Helper text (optional)</Label>
              <Input id="slot-helper" value={booking.helperText} onChange={(e) => patchBooking({ helperText: e.target.value })}
                placeholder="Arrive 10 minutes early" className={fieldClass} />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <label className="flex items-center justify-between gap-3 rounded-lg border border-border/40 px-3 py-2.5 cursor-pointer">
              <span className="text-xs">Slot is required</span>
              <Switch checked={booking.required} onCheckedChange={(v) => patchBooking({ required: v })} />
            </label>
            <label className="flex items-center justify-between gap-3 rounded-lg border border-border/40 px-3 py-2.5 cursor-pointer">
              <span className="text-xs">Show spots remaining</span>
              <Switch checked={booking.showRemaining} onCheckedChange={(v) => patchBooking({ showRemaining: v })} />
            </label>
          </div>
        </div>
      )}
    </div>
  );
}
