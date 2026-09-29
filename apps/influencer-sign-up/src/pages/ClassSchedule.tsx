import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { Clock3, Loader2, MapPin, UserRound, X } from 'lucide-react';
import { Button } from '@project/components/ui/button';
import { Input } from '@project/components/ui/input';
import { Label } from '@project/components/ui/label';
import { BRAND_LOGO_DARK } from '@/lib/constants';
import { getMomenceSessions, selectMomenceClass, type MomenceSession } from '@/lib/api';
import { updateSignupDetails } from '@/lib/signupDetails';

const EMPTY_FIELDS = { fitnessGoal: '', emergencyContactInfo: '', pregnancyStatus: '', medicalHistory: '', postNatalStatus: '', gender: '', euShoeSize: '', howDidHear: '' };
const IST = { timeZone: 'Asia/Kolkata' } as const;

const dayLabel = (startsAt: string) => new Date(startsAt).toLocaleDateString('en-IN', { ...IST, weekday: 'long', day: 'numeric', month: 'long' });
const timeLabel = (startsAt: string) => new Date(startsAt).toLocaleTimeString('en-IN', { ...IST, hour: 'numeric', minute: '2-digit' });
const fullLabel = (startsAt: string) => new Date(startsAt).toLocaleString('en-IN', { ...IST, weekday: 'short', day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit' });

export default function ClassSchedule() {
  const { memberId = '' } = useParams();
  const [search] = useSearchParams();
  const navigate = useNavigate();
  const center = search.get('center') || '';
  const initialClassType = search.get('classType') || 'Barre';
  const signupType = search.get('signupType') === 'free' ? 'free' : 'paid';
  // A class pinned on the form skips the list: the guest only completes their profile.
  const pinnedSessionId = Number(search.get('sessionId')) || 0;
  // Forms built for one class format only offer that format's classes.
  const studioOptions = /kenkere|copper|plash|bengaluru/i.test(center) ? ['Barre'] : ['Barre', 'Strength Lab', 'powerCycle'];
  const lockedFormats = (search.get('format') || '').split(',').filter((format) => studioOptions.includes(format));
  const classOptions = lockedFormats.length ? lockedFormats : studioOptions;

  const [classType, setClassType] = useState(classOptions.includes(initialClassType) ? initialClassType : classOptions[0]);
  const [sessions, setSessions] = useState<MomenceSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selected, setSelected] = useState<MomenceSession | null>(null);
  const [fields, setFields] = useState(EMPTY_FIELDS);
  const [booking, setBooking] = useState(false);
  const [fieldError, setFieldError] = useState('');

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setSessions([]);
    setError('');
    getMomenceSessions({ center, classType })
      .then(({ sessions: found }) => {
        if (cancelled) return;
        setSessions(found);
        if (pinnedSessionId) setSelected(found.find((session) => session.id === pinnedSessionId) || null);
      })
      .catch((e) => { if (!cancelled) setError(e instanceof Error ? e.message : 'Could not load classes'); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [center, classType]);

  const grouped = useMemo(() => sessions.reduce<Record<string, MomenceSession[]>>((all, session) => {
    (all[dayLabel(session.startsAt)] ||= []).push(session);
    return all;
  }, {}), [sessions]);

  // The pinned class is fixed, so its list is never shown and it cannot be dismissed.
  const pinned = pinnedSessionId > 0;
  const pinnedMissing = pinned && !loading && !selected;

  const update = (key: keyof typeof EMPTY_FIELDS, value: string) => setFields((current) => ({ ...current, [key]: value }));

  const submit = async () => {
    if (!selected) return;
    setBooking(true);
    setFieldError('');
    try {
      const result = await selectMomenceClass({ memberId: Number(memberId), sessionId: selected.id, center, classType, signupType, customerFields: fields });
      updateSignupDetails({ classType, session: { name: selected.name, startsAt: selected.startsAt, endsAt: selected.endsAt, teacherName: selected.teacherName, locationName: selected.locationName, durationInMinutes: selected.durationInMinutes } });
      if (result.checkoutUrl) { window.location.assign(result.checkoutUrl); return; }
      // Only a confirmed Momence booking reaches the confirmation screen.
      if (!result.booked) throw new Error('Momence did not confirm this booking. Please pick another class or contact the studio.');
      updateSignupDetails({ booked: true });
      navigate('/success');
    } catch (e) {
      setFieldError(e instanceof Error ? e.message : 'Could not book this class.');
    } finally {
      setBooking(false);
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="sticky top-0 z-20 border-b border-border/60 bg-background/90 backdrop-blur">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-5 py-4">
          <img src={BRAND_LOGO_DARK} alt="Physique 57" className="h-9" />
          <span className="text-[11px] uppercase tracking-[.18em] text-muted-foreground">Step 2 of 2 · {pinned ? 'Complete your profile' : 'Choose your class'}</span>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-5 py-8 md:py-12">
        <section className="mb-8 rounded-3xl border border-border/60 bg-card/70 p-6 md:p-8">
          {center && <p className="text-xs font-bold uppercase tracking-[.22em] text-primary">{center}</p>}
          <h1 className="mt-2 text-3xl font-bold md:text-4xl" style={{ fontFamily: "'Playfair Display', serif" }}>{pinned ? 'Complete your profile' : 'Choose your class'}</h1>
          <p className="mt-3 max-w-2xl text-sm leading-relaxed text-muted-foreground">
            {pinned
              ? 'Your class is reserved for this event. Fill in the details below and we will confirm your spot — any introductory payment is shown before booking.'
              : 'Pick any available class below. We collect a few profile details next, and any introductory payment is shown before your spot is confirmed. Hosted classes are always complimentary.'}
          </p>
          {!pinned && classOptions.length > 1 && (
            <div className="mt-6 flex flex-wrap gap-2" role="group" aria-label="Class format">
              {classOptions.map((option) => (
                <button key={option} type="button" onClick={() => setClassType(option)}
                  className={`rounded-full border px-4 py-2 text-sm font-semibold transition ${classType === option ? 'border-primary bg-primary text-primary-foreground' : 'border-border bg-background text-muted-foreground hover:text-foreground'}`}>
                  {option}
                </button>
              ))}
            </div>
          )}
        </section>

        {loading && <div className="flex justify-center py-24"><Loader2 className="h-9 w-9 animate-spin text-primary" /></div>}
        {pinnedMissing && !error && (
          <div className="rounded-2xl border border-amber-500/30 bg-amber-500/10 p-5 text-sm text-amber-200">
            The class reserved for this event is no longer listed. Please pick another class below, or contact the studio.
          </div>
        )}
        {!loading && error && <div className="rounded-2xl border border-red-500/30 bg-red-500/10 p-5 text-sm text-red-300">{error}</div>}
        {!loading && !error && sessions.length === 0 && !pinned && (
          <div className="rounded-2xl border border-dashed border-border p-12 text-center text-sm text-muted-foreground">
            No upcoming {classType} classes are currently available at this studio.
          </div>
        )}

        <div className="space-y-8">
          {(!pinned || pinnedMissing) && Object.entries(grouped).map(([day, items]) => (
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
                        <h3 className="text-base font-bold">
                          {session.name}
                          {session.hosted && <span className="ml-2 rounded-full border border-primary/40 bg-primary/10 px-2 py-0.5 align-middle text-[10px] font-semibold uppercase tracking-wider text-primary">Hosted</span>}
                        </h3>
                        <div className="mt-2.5 flex flex-wrap gap-x-4 gap-y-2 text-sm text-muted-foreground">
                          <span className="flex items-center gap-1.5"><Clock3 className="h-4 w-4" />{timeLabel(session.startsAt)}</span>
                          {session.teacherName && <span className="flex items-center gap-1.5"><UserRound className="h-4 w-4" />{session.teacherName}</span>}
                          <span className="flex items-center gap-1.5"><MapPin className="h-4 w-4" />{session.locationName || center}</span>
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

      {selected && (
        <div className={pinned ? 'mx-auto max-w-5xl px-5 pb-16' : 'fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm'} {...(pinned ? {} : { role: 'dialog', 'aria-modal': true })}>
          <div className={`w-full rounded-3xl border border-border bg-card p-6 md:p-8 ${pinned ? '' : 'max-h-[92vh] max-w-2xl overflow-y-auto'}`}>
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-bold uppercase tracking-widest text-primary">Complete your profile</p>
                <h2 className="mt-2 text-2xl font-bold">Required before booking</h2>
                <p className="mt-1 text-sm text-muted-foreground">{selected.name} · {fullLabel(selected.startsAt)}{selected.teacherName ? ` · ${selected.teacherName}` : ''}</p>
                {selected.hosted && <p className="mt-1 text-sm text-primary">Hosted class · complimentary, no membership or payment needed.</p>}
              </div>
              {!pinned && <button onClick={() => setSelected(null)} aria-label="Close"><X /></button>}
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
              {booking ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Saving details and booking…</> : 'Confirm class booking'}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

function Field({ label, value, onChange, placeholder }: { label: string; value: string; onChange: (value: string) => void; placeholder?: string }) {
  return (
    <div>
      <Label className="mb-2 block text-xs uppercase tracking-wider">{label}</Label>
      <Input value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} />
    </div>
  );
}

function SelectField({ label, value, options, onChange }: { label: string; value: string; options: string[]; onChange: (value: string) => void }) {
  return (
    <div>
      <Label className="mb-2 block text-xs uppercase tracking-wider">{label}</Label>
      <select className="h-10 w-full rounded-md border border-border bg-background px-3 text-sm" value={value} onChange={(e) => onChange(e.target.value)}>
        <option value="">Select…</option>
        {options.map((option) => <option key={option}>{option}</option>)}
      </select>
    </div>
  );
}
