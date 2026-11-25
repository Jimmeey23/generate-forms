import { useEffect, useState, type FormEvent } from 'react';
import { CheckCircle2, Loader2, Plus, Trash2, XCircle } from 'lucide-react';
import { Button } from '@project/components/ui/button';
import { Input } from '@project/components/ui/input';
import { Label } from '@project/components/ui/label';
import SignaturePad from '@/components/SignaturePad';
import { BRAND_LOGO_DARK, CENTERS } from '@/lib/constants';
import { getHostedSessions, signupKidsHosted, type KidsHostedChild, type KidsHostedResult, type MomenceSession } from '@/lib/api';

const IST = { timeZone: 'Asia/Kolkata' } as const;
const sessionLabel = (s: MomenceSession) => {
  const when = new Date(s.startsAt).toLocaleString('en-IN', { ...IST, weekday: 'short', day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit' });
  const spots = s.spotsLeft == null ? '' : s.spotsLeft === 0 ? ' · Full' : ` · ${s.spotsLeft} left`;
  return `${s.name} · ${when}${s.teacherName ? ` · ${s.teacherName}` : ''}${spots}`;
};
const EMPTY_CHILD: KidsHostedChild = { name: '', dateOfBirth: '' };
const MIN_AGE = 8;
const MAX_AGE = 12;
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
// Age in whole years on today's date, from a YYYY-MM-DD string.
function ageFrom(dob: string): number | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dob);
  if (!m) return null;
  const now = new Date();
  let age = now.getFullYear() - Number(m[1]);
  if (now.getMonth() + 1 < Number(m[2]) || (now.getMonth() + 1 === Number(m[2]) && now.getDate() < Number(m[3]))) age -= 1;
  return age;
}

export default function KidsHostedSignup() {
  const [center, setCenter] = useState(CENTERS[0]);
  const [sessions, setSessions] = useState<MomenceSession[]>([]);
  const [loadingSessions, setLoadingSessions] = useState(true);
  const [sessionsError, setSessionsError] = useState('');
  const [sessionId, setSessionId] = useState('');
  const [parent, setParent] = useState({ firstName: '', lastName: '', email: '', phone: '' });
  const [children, setChildren] = useState<KidsHostedChild[]>([{ ...EMPTY_CHILD }]);
  const [signature, setSignature] = useState('');
  const [waiverAccepted, setWaiverAccepted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState<KidsHostedResult | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoadingSessions(true); setSessions([]); setSessionId(''); setSessionsError('');
    getHostedSessions({ center })
      .then(({ sessions: found }) => { if (!cancelled) setSessions(found); })
      .catch((e) => { if (!cancelled) setSessionsError(e instanceof Error ? e.message : 'Could not load hosted classes'); })
      .finally(() => { if (!cancelled) setLoadingSessions(false); });
    return () => { cancelled = true; };
  }, [center]);

  const selected = sessions.find((s) => String(s.id) === sessionId) || null;
  const updateChild = (index: number, key: keyof KidsHostedChild, value: string) =>
    setChildren((list) => list.map((child, i) => (i === index ? { ...child, [key]: value } : child)));

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setError('');
    const kids = children.filter((c) => c.name.trim());
    if (!selected) return setError('Please choose a hosted class.');
    if (!parent.firstName.trim() || !parent.lastName.trim() || !parent.email.trim() || !parent.phone.trim()) return setError('Please fill in all parent details.');
    if (!kids.length) return setError('Please add at least one child.');
    if (kids.some((c) => ageFrom(c.dateOfBirth) == null)) return setError("Please enter each child's full date of birth.");
    const outOfRange = kids.find((c) => { const age = ageFrom(c.dateOfBirth)!; return age < MIN_AGE || age > MAX_AGE; });
    if (outOfRange) return setError(`${outOfRange.name.trim()} must be between ${MIN_AGE} and ${MAX_AGE} years old to sign up.`);
    if (selected.spotsLeft != null && selected.spotsLeft < kids.length) return setError(`Only ${selected.spotsLeft} place${selected.spotsLeft === 1 ? '' : 's'} left in this class.`);
    if (!signature) return setError('Please sign the waiver.');
    if (!waiverAccepted) return setError('Please accept the waiver.');
    setSubmitting(true);
    try {
      setResult(await signupKidsHosted({ center, sessionId: selected.id, ...parent, children: kids, signatureRealSignature: signature, waiverAccepted }));
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Sign-up failed');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="sticky top-0 z-20 border-b border-border/60 bg-background/90 backdrop-blur">
        <div className="mx-auto flex max-w-3xl items-center justify-between gap-4 px-5 py-4">
          <img src={BRAND_LOGO_DARK} alt="Physique 57" className="h-9" />
          <span className="text-[11px] uppercase tracking-[.18em] text-muted-foreground">Kids hosted class</span>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-5 py-8 md:py-12">
        <section className="mb-8 rounded-3xl border border-border/60 bg-card/70 p-6 md:p-8">
          <p className="text-xs font-bold uppercase tracking-[.22em] text-primary">Complimentary</p>
          <h1 className="mt-2 text-3xl font-bold md:text-4xl" style={{ fontFamily: "'Playfair Display', serif" }}>Kids hosted class sign-up</h1>
          <p className="mt-3 text-sm leading-relaxed text-muted-foreground">For children aged {MIN_AGE}–{MAX_AGE}. Pick a hosted class, add your children, and sign the waiver. Every child is booked into the class free of charge.</p>
        </section>

        {result ? (
          <section className="rounded-3xl border border-border bg-card p-6 md:p-8">
            <h2 className="text-2xl font-bold">{result.allBooked ? "You're all booked!" : 'Some bookings need attention'}</h2>
            {selected && <p className="mt-1 text-sm text-muted-foreground">{sessionLabel(selected)}</p>}
            <ul className="mt-6 space-y-3">
              {result.children.map((child, i) => (
                <li key={i} className="flex items-start gap-3 text-sm">
                  {child.booked ? <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-400" /> : <XCircle className="h-5 w-5 shrink-0 text-red-400" />}
                  <span><strong>{child.name}</strong> — {child.booked ? 'booked' : `not booked: ${child.error}`}</span>
                </li>
              ))}
            </ul>
            {!result.allBooked && <p className="mt-5 text-sm text-muted-foreground">Please contact the studio to finish the remaining bookings.</p>}
          </section>
        ) : (
          <form onSubmit={submit} className="space-y-6 rounded-3xl border border-border bg-card p-6 md:p-8">
            <div className="grid gap-5 sm:grid-cols-2">
              <div>
                <Label className="mb-2 block text-xs uppercase tracking-wider">Studio *</Label>
                <select className="h-10 w-full rounded-md border border-border bg-background px-3 text-sm" value={center} onChange={(e) => setCenter(e.target.value)}>
                  {CENTERS.map((c) => <option key={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <Label className="mb-2 block text-xs uppercase tracking-wider">Hosted class *</Label>
                <select className="h-10 w-full rounded-md border border-border bg-background px-3 text-sm" value={sessionId} onChange={(e) => setSessionId(e.target.value)} disabled={loadingSessions || !sessions.length}>
                  <option value="">{loadingSessions ? 'Loading…' : sessions.length ? 'Select a class…' : 'No hosted classes available'}</option>
                  {sessions.map((s) => <option key={s.id} value={s.id} disabled={s.spotsLeft === 0}>{sessionLabel(s)}</option>)}
                </select>
                {sessionsError && <p className="mt-2 text-xs text-red-300">{sessionsError}</p>}
              </div>
            </div>

            <div>
              <h2 className="mb-3 text-sm font-bold uppercase tracking-wider">Parent / guardian</h2>
              <div className="grid gap-5 sm:grid-cols-2">
                <Field label="First name *" value={parent.firstName} onChange={(v) => setParent((p) => ({ ...p, firstName: v }))} />
                <Field label="Last name *" value={parent.lastName} onChange={(v) => setParent((p) => ({ ...p, lastName: v }))} />
                <Field label="Email *" type="email" value={parent.email} onChange={(v) => setParent((p) => ({ ...p, email: v }))} />
                <Field label="Phone *" type="tel" value={parent.phone} onChange={(v) => setParent((p) => ({ ...p, phone: v }))} />
              </div>
            </div>

            <div>
              <h2 className="mb-3 text-sm font-bold uppercase tracking-wider">Children</h2>
              <div className="space-y-4">
                {children.map((child, i) => (
                  <div key={i} className="grid items-end gap-4 sm:grid-cols-[1fr_260px_80px_auto]">
                    <Field label={`Child ${i + 1} full name *`} value={child.name} onChange={(v) => updateChild(i, 'name', v)} />
                    <DobPicker value={child.dateOfBirth} onChange={(v) => updateChild(i, 'dateOfBirth', v)} />
                    <AgeField dob={child.dateOfBirth} />
                    <Button type="button" variant="ghost" disabled={children.length === 1} onClick={() => setChildren((list) => list.filter((_, j) => j !== i))} aria-label="Remove child"><Trash2 className="h-4 w-4" /></Button>
                  </div>
                ))}
              </div>
              {children.length < 10 && (
                <Button type="button" variant="outline" className="mt-4" onClick={() => setChildren((list) => [...list, { ...EMPTY_CHILD }])}><Plus className="mr-2 h-4 w-4" />Add another child</Button>
              )}
            </div>

            <div>
              <Label className="mb-2 block text-xs uppercase tracking-wider">Parent signature *</Label>
              <SignaturePad value={signature} onChange={setSignature} />
              <label className="mt-4 flex items-start gap-3 text-sm text-muted-foreground">
                <input type="checkbox" className="mt-1" checked={waiverAccepted} onChange={(e) => setWaiverAccepted(e.target.checked)} />
                I am the parent or legal guardian of the children above and accept the Physique 57 waiver on their behalf.
              </label>
            </div>

            {error && <p className="rounded-xl bg-red-500/10 p-3 text-sm text-red-300">{error}</p>}
            <Button type="submit" disabled={submitting} className="h-12 w-full">
              {submitting ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Booking your children…</> : 'Sign up for free'}
            </Button>
          </form>
        )}
      </main>
    </div>
  );
}

function Field({ label, value, onChange, type = 'text' }: { label: string; value: string; onChange: (value: string) => void; type?: string }) {
  return (
    <div>
      <Label className="mb-2 block text-xs uppercase tracking-wider">{label}</Label>
      <Input type={type} value={value} onChange={(e) => onChange(e.target.value)} />
    </div>
  );
}

// Day / month / year dropdowns: jumping straight to a year beats paging a calendar month by month.
// Years are limited to those that can give an age between MIN_AGE and MAX_AGE.
function DobPicker({ value, onChange }: { value: string; onChange: (value: string) => void }) {
  const [y = '', mo = '', d = ''] = value ? value.split('-') : [];
  const [parts, setParts] = useState({ y, mo, d });
  const thisYear = new Date().getFullYear();
  const years = Array.from({ length: MAX_AGE - MIN_AGE + 2 }, (_, k) => String(thisYear - MIN_AGE - k));
  const daysInMonth = parts.y && parts.mo ? new Date(Number(parts.y), Number(parts.mo), 0).getDate() : 31;
  const set = (key: 'y' | 'mo' | 'd', v: string) => {
    const next = { ...parts, [key]: v };
    if (next.y && next.mo && Number(next.d) > new Date(Number(next.y), Number(next.mo), 0).getDate()) next.d = '';
    setParts(next);
    onChange(next.y && next.mo && next.d ? `${next.y}-${next.mo}-${next.d}` : '');
  };
  const cls = 'h-10 rounded-md border border-border bg-background px-2 text-sm';
  return (
    <div>
      <Label className="mb-2 block text-xs uppercase tracking-wider">Date of birth *</Label>
      <div className="grid grid-cols-[1fr_1.2fr_1.3fr] gap-2">
        <select aria-label="Day" className={cls} value={parts.d} onChange={(e) => set('d', e.target.value)}>
          <option value="">Day</option>
          {Array.from({ length: daysInMonth }, (_, k) => String(k + 1).padStart(2, '0')).map((v) => <option key={v} value={v}>{Number(v)}</option>)}
        </select>
        <select aria-label="Month" className={cls} value={parts.mo} onChange={(e) => set('mo', e.target.value)}>
          <option value="">Month</option>
          {MONTHS.map((name, k) => <option key={name} value={String(k + 1).padStart(2, '0')}>{name}</option>)}
        </select>
        <select aria-label="Year" className={cls} value={parts.y} onChange={(e) => set('y', e.target.value)}>
          <option value="">Year</option>
          {years.map((v) => <option key={v}>{v}</option>)}
        </select>
      </div>
    </div>
  );
}

function AgeField({ dob }: { dob: string }) {
  const age = ageFrom(dob);
  const invalid = age != null && (age < MIN_AGE || age > MAX_AGE);
  return (
    <div>
      <Label className="mb-2 block text-xs uppercase tracking-wider">Age</Label>
      <Input readOnly tabIndex={-1} value={age == null ? '' : String(age)} aria-invalid={invalid} className={invalid ? 'border-red-500 text-red-300' : ''} />
    </div>
  );
}
