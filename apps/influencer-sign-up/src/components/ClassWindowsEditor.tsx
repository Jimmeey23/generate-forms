import { Button } from '@project/components/ui/button';
import { Input } from '@project/components/ui/input';
import { Label } from '@project/components/ui/label';
import { Plus, Trash2 } from 'lucide-react';
import type { ClassWindow } from '@/lib/api';
import { todayIso } from '@/lib/slots';

// Builder for a Class Windows form: one or more date + time ranges, and the full class price
// the pricing tiers are worked from (first class free, second 50%, full price after).
export default function ClassWindowsEditor({
  windows, onChange, fullPrice, onFullPriceChange, fieldClass = '', labelClass = '', defaultDate = '',
}: {
  windows: ClassWindow[];
  onChange: (next: ClassWindow[]) => void;
  fullPrice: string;
  onFullPriceChange: (next: string) => void;
  fieldClass?: string;
  labelClass?: string;
  defaultDate?: string;
}) {
  const patch = (index: number, value: Partial<ClassWindow>) => onChange(windows.map((w, i) => (i === index ? { ...w, ...value } : w)));
  const add = () => {
    const last = windows[windows.length - 1];
    onChange([...windows, { date: last?.date || defaultDate || todayIso(), startTime: last?.startTime || '07:00', endTime: last?.endTime || '10:00' }]);
  };
  const price = Number(fullPrice) || 0;

  return (
    <div className="space-y-5">
      <p className="text-sm text-muted-foreground">
        Add the time windows guests can book from. Every class — any format — that starts inside a window at the guest’s studio is offered.
      </p>
      <div className="space-y-3">
        {windows.map((w, index) => {
          const invalid = Boolean(w.startTime && w.endTime && w.endTime <= w.startTime);
          return (
            <div key={index} className="rounded-xl neu-raised-sm p-3">
              <div className="grid grid-cols-[1fr_auto] gap-3 sm:grid-cols-[2fr_1fr_1fr_auto] items-end">
                <div className="col-span-2 sm:col-span-1">
                  <Label className={labelClass}>Date</Label>
                  <Input type="date" value={w.date} onChange={(e) => patch(index, { date: e.target.value })} className={fieldClass} />
                </div>
                <div>
                  <Label className={labelClass}>From</Label>
                  <Input type="time" value={w.startTime} onChange={(e) => patch(index, { startTime: e.target.value })} className={fieldClass} />
                </div>
                <div>
                  <Label className={labelClass}>To</Label>
                  <Input type="time" value={w.endTime} onChange={(e) => patch(index, { endTime: e.target.value })} className={fieldClass} />
                </div>
                <Button variant="ghost" size="sm" className="h-11 px-2" aria-label="Remove window" onClick={() => onChange(windows.filter((_, i) => i !== index))}>
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
              {invalid && <p className="mt-2 text-xs text-red-400">The end time must be after the start time.</p>}
            </div>
          );
        })}
        <Button variant="outline" className="w-full gap-1.5 neu-pressable" onClick={add}>
          <Plus className="w-4 h-4" /> Add a time window
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-start">
        <div>
          <Label htmlFor="window-price" className={labelClass}>Full class price (₹, incl. GST)</Label>
          <Input id="window-price" inputMode="numeric" value={fullPrice} placeholder="e.g. 1500"
            onChange={(e) => onFullPriceChange(e.target.value.replace(/\D/g, '').slice(0, 6))} className={fieldClass} />
        </div>
        <p className="text-xs text-muted-foreground leading-relaxed md:pt-7">
          Per person (matched by email or phone): 1st class free · 2nd class {price ? `₹${Math.round(price / 2)}` : '50% off'} · every class after {price ? `₹${price}` : 'full price'}.
        </p>
      </div>
    </div>
  );
}
