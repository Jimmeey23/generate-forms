import { useState, useEffect } from 'react';
import { Button } from '@project/components/ui/button';
import { Input } from '@project/components/ui/input';
import { Label } from '@project/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@project/components/ui/select';
import { Switch } from '@project/components/ui/switch';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@project/components/ui/dialog';
import { Plus, X } from 'lucide-react';

type Field = {
  id: string;
  type: string;
  label: string;
  placeholder?: string;
  required?: boolean;
  helperText?: string;
  options?: string[];
  gridCol?: string;
};

const FIELD_TYPES = [
  { value: 'text', label: 'Text' },
  { value: 'email', label: 'Email' },
  { value: 'tel', label: 'Phone' },
  { value: 'number', label: 'Number' },
  { value: 'textarea', label: 'Text Area' },
  { value: 'date', label: 'Date Picker' },
  { value: 'select', label: 'Dropdown' },
  { value: 'radio', label: 'Radio Buttons' },
  { value: 'checkbox', label: 'Checkboxes' },
  { value: 'url', label: 'URL' },
  { value: 'rating', label: 'Rating' },
  { value: 'terms', label: 'Terms & Conditions' },
];

const hasOptions = (type: string) => ['select', 'radio', 'checkbox'].includes(type);

export function FieldEditorDialog({ field, open, onClose, onSave }: { field: Field | null; open: boolean; onClose: () => void; onSave: (field: Field) => void }) {
  const [form, setForm] = useState<Field>({ id: `field_${Date.now()}`, type: 'text', label: '', required: false, gridCol: 'full' });
  const [newOption, setNewOption] = useState('');

  useEffect(() => {
    if (open) {
      setForm(field || { id: `field_${Date.now()}`, type: 'text', label: '', required: false, gridCol: 'full' });
      setNewOption('');
    }
  }, [open, field]);

  const update = (patch: Partial<Field>) => setForm((prev) => ({ ...prev, ...patch }));
  const addOption = () => { if (!newOption.trim()) return; update({ options: [...(form.options || []), newOption.trim()] }); setNewOption(''); };
  const removeOption = (idx: number) => update({ options: (form.options || []).filter((_, i) => i !== idx) });

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader><DialogTitle>{field ? 'Edit Field' : 'Add Field'}</DialogTitle></DialogHeader>
        <div className="space-y-4">
          <div>
            <Label className="text-xs text-muted-foreground">Label</Label>
            <Input value={form.label} onChange={(e) => update({ label: e.target.value })} placeholder="Field label" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs text-muted-foreground">Type</Label>
              <Select value={form.type} onValueChange={(v) => update({ type: v })}>
                <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                <SelectContent>{FIELD_TYPES.map((t) => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">Width</Label>
              <Select value={form.gridCol || 'full'} onValueChange={(v) => update({ gridCol: v })}>
                <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="half">Half Width</SelectItem>
                  <SelectItem value="full">Full Width</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div>
            <Label className="text-xs text-muted-foreground">Placeholder</Label>
            <Input value={form.placeholder || ''} onChange={(e) => update({ placeholder: e.target.value })} className="h-9" />
          </div>
          <div>
            <Label className="text-xs text-muted-foreground">Helper Text</Label>
            <Input value={form.helperText || ''} onChange={(e) => update({ helperText: e.target.value })} className="h-9" />
          </div>
          <div className="flex items-center justify-between">
            <Label className="text-sm">Required</Label>
            <Switch checked={form.required || false} onCheckedChange={(v) => update({ required: v })} />
          </div>
          {hasOptions(form.type) && (
            <div>
              <Label className="text-xs text-muted-foreground">Options</Label>
              <div className="space-y-1.5 mt-1">
                {(form.options || []).map((opt, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <span className="text-sm flex-1 px-2 py-1 bg-muted rounded">{opt}</span>
                    <Button variant="ghost" size="sm" onClick={() => removeOption(i)}><X className="w-3.5 h-3.5" /></Button>
                  </div>
                ))}
                <div className="flex gap-2">
                  <Input value={newOption} onChange={(e) => setNewOption(e.target.value)} placeholder="Add option" onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addOption(); } }} className="h-9" />
                  <Button variant="outline" size="sm" onClick={addOption} className="shrink-0"><Plus className="w-3.5 h-3.5" /></Button>
                </div>
              </div>
            </div>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={() => { if (form.label.trim()) onSave(form); }} disabled={!form.label.trim()}>{field ? 'Save' : 'Add Field'}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
