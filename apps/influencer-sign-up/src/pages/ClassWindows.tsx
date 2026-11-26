import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { Clock3, Loader2, MapPin, UserRound, X } from 'lucide-react';
import { Button } from '@project/components/ui/button';
import { BRAND_LOGO_DARK } from '@/lib/constants';
import { bookClassWindow, cancelPendingClassWindow, getClassWindows, type ClassWindowsInfo, type MomenceSession } from '@/lib/api';
import { formatSlotDate, formatSlotTime } from '@/lib/slots';
import { updateSignupDetails } from '@/lib/signupDetails';
import { EMPTY_FIELDS, Field, SelectField } from './ClassSchedule';

const IST = { timeZone: 'Asia/Kolkata' } as const;
const dayLabel = (startsAt: string) => new Date(startsAt).toLocaleDateString('en-IN', { ...IST, weekday: 'long', day: 'numeric', month: 'long' });
const timeLabel = (startsAt: string) => new Date(startsAt).toLocaleTimeString('en-IN', { ...IST, hour: 'numeric', minute: '2-digit' });
const fullLabel = (startsAt: string) => new Date(startsAt).toLocaleString('en-IN', { ...IST, weekday: 'short', day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit' });
const rupees = (amount: number) => `₹${amount.toLocaleString('en-IN')}`;

// Guests land here after signing a Class Windows form and pick any class inside its windows.
// The price shown comes from the server, which counts the guest's confirmed bookings.
export default function ClassWindows() {
  const { submissionId = '' } = useParams();
  const [search] = useSearchParams();
  const navigate = useNavigate();
  const [info, setInfo] = useState<ClassWindowsInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selected, setSelected] = useState<MomenceSession | null>(null);
  const [fields, setFields] = useState(EMPTY_FIELDS);
  const [booking, setBooking] = useState(false);
  const [fieldError, setFieldError] = useState('');

  useEffect(() => {
    let cancelled = false;
    // Returning from an abandoned Stripe checkout frees the class for another attempt.
    const ready = search.get('payment') === 'cancelled' ? cancelPendingClassWindow(submissionId).catch(() => undefined) : Promise.resolve();
    ready
      .then(() => getClassWindows(submissionId))
      .then((result) => { if (!cancelled) setInfo(result); })
      .catch((e) => { if (!cancelled) setError(e instanceof Error ? e.message : 'Could not load classes'); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [submissionId]);

  const grouped = useMemo(() => (info?.sessions || []).reduce<Record<string, MomenceSession[]>>((all, session) => {
    (all[dayLabel(session.startsAt)] ||= []).push(session);
    return all;
  }, {}), [info]);

  const update = (key: keyof typeof EMPTY_FIELDS, value: string) => setFields((current) => ({ ...current, [key]: value }));

  const submit = async () => {
    if (!selected) return;
    setBooking(true);
    setFieldError('');
    try {
      const result = await bookClassWindow({ submissionId, sessionId: selected.id, customerFields: fields });
      updateSignupDetails({ session: { name: selected.name, startsAt: selected.startsAt, endsAt: selected.endsAt, teacherName: selected.teacherName, locationName: selected.locationName, durationInMinutes: selected.durationInMinutes } });
      if (result.checkoutUrl) { window.location.assign(result.checkoutUrl); return; }
      if (!result.booked) throw new Error('Momence did not confirm this booking. Please pick another class or contact the studio.');
      updateSignupDetails({ booked: true });
      navigate('/success');
    } catch (e) {
      setFieldError(e instanceof Error ? e.message : 'Could not book this class.');
    } finally {
      setBooking(false);
    }
  };

  const priceNote = info && (info.amountInr === 0
    ? 'Your first class is on us — complimentary.'
    : info.tier === 1
      ? `Welcome back! Your second class is half price: ${rupees(info.amountInr)} (usually ${rupees(info.fullPrice)}).`
      : `This class is ${rupees(info.amountInr)}.`);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="sticky top-0 z-20 border-b border-border/60 bg-background/90 backdrop-blur">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-5 py-4">
          <img src={BRAND_LOGO_DARK} alt="Physique 57" className="h-9" />
          <span className="text-[11px] uppercase tracking-[.18em] text-muted-foreground">Step 2 of 2 · Choose your class</span>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-5 py-8 md:py-12">
        <section className="mb-8 rounded-3xl border border-border/60 bg-card/70 p-6 md:p-8">
          {info?.center && <p className="text-xs font-bold uppercase tracking-[.22em] text-primary">{info.center}</p>}
          <h1 className="mt-2 text-3xl font-bold md:text-4xl" style={{ fontFamily: "'Playfair Display', serif" }}>Choose your class</h1>
          <p className="mt-3 max-w-2xl text-sm leading-relaxed text-muted-foreground">
            Every class scheduled in {info?.formTitle ? <>the <span className="text-foreground">{info.formTitle}</span> windows</> : 'these windows'} is open to you. Pick one below.
          </p>
          {priceNote && <p className="mt-4 inline-block rounded-full border border-primary/40 bg-primary/10 px-4 py-1.5 text-sm font-semibold text-primary">{priceNote}</p>}
          {info && info.windows.length > 0 && (
            <div className="mt-5 flex flex-wrap gap-2">
              {info.windows.map((w) => (
                <span key={`${w.date}${w.startTime}${w.endTime}`} className="rounded-full border border-border bg-background px-3 py-1 text-xs text-muted-foreground">
                  {formatSlotDate(w.date)} · {formatSlotTime(w.startTime)}–{formatSlotTime(w.endTime)}
                </span>
              ))}
            </div>
          )}
          <p className="mt-4 text-xs text-muted-foreground">First class free · second class 50% off · full price after that.</p>
        </section>

        {loading && <div className="flex justify-center py-24"><Loader2 className="h-9 w-9 animate-spin text-primary" /></div>}
        {!loading && error && <div className="rounded-2xl border border-red-500/30 bg-red-500/10 p-5 text-sm text-red-300">{error}</div>}
        {!loading && !error && info && info.sessions.length === 0 && (
          <div className="rounded-2xl border border-dashed border-border p-12 text-center text-sm text-muted-foreground">
            No upcoming classes are scheduled in these time windows right now.
          </div>
        )}

        <div className="space-y-8">
          {Object.entries(grouped).map(([day, items]) => (
            <section key={day}>
              <div className="mb-4 flex items-center gap-3">
                <h2 className="text-base font-semibold uppercase tracking-wider">{day}</h2>
                <span className="h-px flex-1 bg-border" />
                <span className="text-xs text-muted-foreground">{items.length} class{items.length === 1 ? '' : 'es'}</span>
              </div>
              <div className="grid gap-3">
                {items.map((session) => {
                  const full = session.spotsLeft === 0;
                  return (
                    <article key={session.id}
                      className={`flex flex-col gap-4 rounded-2xl border p-5 transition sm:flex-row sm:items-center ${full ? 'border-border/40 bg-card/40 opacity-60' : 'border-border/60 bg-card/70 hover:border-primary/40'}`}>
                      <div className="flex-1">
                        <h3 className="text-base font-bold">{session.name}</h3>
                        <div className="mt-2.5 flex flex-wrap gap-x-4 gap-y-2 text-sm text-muted-foreground">
                          <span className="flex items-center gap-1.5"><Clock3 className="h-4 w-4" />{timeLabel(session.startsAt)}</span>
                          {session.teacherName && <span className="flex items-center gap-1.5"><UserRound className="h-4 w-4" />{session.teacherName}</span>}
                          <span className="flex items-center gap-1.5"><MapPin className="h-4 w-4" />{session.locationName || info?.center}</span>
                        </div>
                        {session.spotsLeft != null && (
                          <p className={`mt-2.5 text-xs ${session.spotsLeft > 0 && session.spotsLeft <= 3 ? 'text-amber-400' : 'text-muted-foreground'}`}>
                            {full ? 'No places left' : `${session.spotsLeft} place${session.spotsLeft === 1 ? '' : 's'} remaining`}
                          </p>
                        )}
                      </div>
                      <Button disabled={full} onClick={() => setSelected(session)} className="h-11 shrink-0 px-7">{full ? 'Class full' : 'Select class'}</Button>
                    </article>
                  );
                })}
              </div>
            </section>
          ))}
        </div>
      </main>

      {selected && info && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm" role="dialog" aria-modal>
          <div className="max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-3xl border border-border bg-card p-6 md:p-8">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-bold uppercase tracking-widest text-primary">Complete your profile</p>
                <h2 className="mt-2 text-2xl font-bold">Required before booking</h2>
                <p className="mt-1 text-sm text-muted-foreground">{selected.name} · {fullLabel(selected.startsAt)}{selected.teacherName ? ` · ${selected.teacherName}` : ''}</p>
                <p className="mt-1 text-sm text-primary">{info.amountInr === 0 ? 'Complimentary — no payment needed.' : `${info.tierLabel}: ${rupees(info.amountInr)}, paid securely on the next step.`}</p>
              </div>
              <button onClick={() => setSelected(null)} aria-label="Close"><X /></button>
            </div>

            <div className="mt-7 grid gap-5 sm:grid-cols-2">
              <Field label="Fitness goal" value={fields.fitnessGoal} onChange={(v) => update('fitnessGoal', v)} />
              <Field label="Emergency contact number *" value={fields.emergencyContactInfo} onChange={(v) => update('emergencyContactInfo', v)} />
              <SelectField label="Gender" value={fields.gender} options={['Female', 'Male', 'Non-binary', 'Prefer not to say']} onChange={(v) => update('gender', v)} />
              {fields.gender === 'Female' && (
                <>
                  <SelectField label="Are you currently pregnant? *" value={fields.pregnancyStatus} options={['No', 'Yes']} onChange={(v) => update('pregnancyStatus', v)} />
                  <SelectField label="Post Natal *" value={fields.postNatalStatus} options={['No', 'Yes', 'Not applicable']} onChange={(v) => update('postNatalStatus', v)} />
                </>
              )}
              <Field label="Medical history *" value={fields.medicalHistory} onChange={(v) => update('medicalHistory', v)} placeholder="Type None if not applicable" />
              {/cycle|spin/i.test(selected.name) && <Field label="EU shoe size *" value={fields.euShoeSize} onChange={(v) => update('euShoeSize', v)} />}
              <Field label="How did you hear about us?" value={fields.howDidHear} onChange={(v) => update('howDidHear', v)} />
            </div>

            {fieldError && <p className="mt-5 rounded-xl bg-red-500/10 p-3 text-sm text-red-300">{fieldError}</p>}
            <Button onClick={submit} disabled={booking} className="mt-7 h-12 w-full">
              {booking ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Saving details and booking…</>
                : info.amountInr === 0 ? 'Confirm free class' : `Continue to pay ${rupees(info.amountInr)}`}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
