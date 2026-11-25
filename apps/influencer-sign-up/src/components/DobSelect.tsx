import { useEffect, useState, type CSSProperties } from 'react';
import { MONTHS } from '@/lib/age';

// Day / month / year dropdowns: jumping straight to a year beats paging a calendar month by month.
// Years run from (today - minAge) back to (today - maxAge - 1), newest first.
export default function DobSelect({ value, onChange, minAge = 0, maxAge = 100, selectClassName = '', selectStyle, invalid = false }: {
  value: string; onChange: (value: string) => void; minAge?: number; maxAge?: number;
  selectClassName?: string; selectStyle?: CSSProperties; invalid?: boolean;
}) {
  const split = (v: string) => { const [y = '', mo = '', d = ''] = v ? v.split('-') : []; return { y, mo, d }; };
  const [parts, setParts] = useState(() => split(value));
  // Follow outside resets (form cleared); partial picks stay local until the date is complete.
  useEffect(() => { if (value) setParts(split(value)); }, [value]);
  const thisYear = new Date().getFullYear();
  const years = Array.from({ length: maxAge - minAge + 2 }, (_, k) => String(thisYear - minAge - k));
  const daysInMonth = parts.y && parts.mo ? new Date(Number(parts.y), Number(parts.mo), 0).getDate() : 31;
  const set = (key: 'y' | 'mo' | 'd', v: string) => {
    const next = { ...parts, [key]: v };
    if (next.y && next.mo && Number(next.d) > new Date(Number(next.y), Number(next.mo), 0).getDate()) next.d = '';
    setParts(next);
    onChange(next.y && next.mo && next.d ? `${next.y}-${next.mo}-${next.d}` : '');
  };
  const cls = `h-11 w-full rounded-md border px-2 text-sm ${selectClassName}`;
  const style = { ...selectStyle, ...(invalid ? { borderColor: 'rgb(239 68 68)' } : {}) };
  return (
    <div className="grid grid-cols-[1fr_1.2fr_1.3fr] gap-2">
      <select aria-label="Day" className={cls} style={style} value={parts.d} onChange={(e) => set('d', e.target.value)}>
        <option value="">Day</option>
        {Array.from({ length: daysInMonth }, (_, k) => String(k + 1).padStart(2, '0')).map((v) => <option key={v} value={v}>{Number(v)}</option>)}
      </select>
      <select aria-label="Month" className={cls} style={style} value={parts.mo} onChange={(e) => set('mo', e.target.value)}>
        <option value="">Month</option>
        {MONTHS.map((name, k) => <option key={name} value={String(k + 1).padStart(2, '0')}>{name}</option>)}
      </select>
      <select aria-label="Year" className={cls} style={style} value={parts.y} onChange={(e) => set('y', e.target.value)}>
        <option value="">Year</option>
        {years.map((v) => <option key={v}>{v}</option>)}
      </select>
    </div>
  );
}
