import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@project/components/ui/button';
import { Input } from '@project/components/ui/input';
import { Label } from '@project/components/ui/label';
import { Loader2, ArrowRight, ChevronLeft, Sparkles, Zap, Share2, BarChart3, ChevronRight, Check, MapPin, Gift, CreditCard, Baby, Shuffle, Image as ImageIcon, Tag, CalendarClock, Plus, Pencil, Trash2, GripVertical, Wand2 } from 'lucide-react';
import { generateForm, describeForm, getMomenceSessions, saveFormSlots, DEFAULT_SLOT_BOOKING, type MomenceSession, type SlotBooking } from '@/lib/api';
import SlotWizard from '@/components/SlotWizard';
import WizardSteps, { type WizardStep } from '@/components/WizardSteps';
import HeroPicker from '@/components/HeroPicker';
import { sortDrafts, toSlotInput, type SlotDraft } from '@/lib/slots';
import { FieldEditorDialog } from '@/components/FieldEditor';
import { toast } from 'sonner';
import { BRAND_LOGO, HERO_IMAGES } from '@/lib/constants';
import { motion, AnimatePresence, MotionConfig, type Variants } from 'framer-motion';

import type { SignupType } from '@/lib/api';

const SIGNUP_FLOWS: { value: SignupType; label: string; desc: string; icon: React.ElementType }[] = [
  { value: 'free', label: 'Free signup', desc: 'Complimentary first class', icon: Gift },
  { value: 'paid', label: 'Paid signup', desc: 'Checkout, then auto-book', icon: CreditCard },
  { value: 'kids', label: 'Kids / Juniors', desc: 'Parent-signed waiver', icon: Baby },
  { value: 'slots', label: 'Slot Bookings', desc: 'Book a time slot, no class', icon: CalendarClock },
];

const STUDIOS_BY_CITY: { city: string; studios: string[] }[] = [
  { city: 'Mumbai', studios: ['Kwality House, Kemps Corner', 'Supreme HQ, Bandra'] },
  { city: 'Bengaluru', studios: ['Kenkere House, Bengaluru', 'The Studio by Copper & Cloves, Bengaluru', 'Plash Pilates, Bengaluru'] },
];

const ALL_STUDIOS = STUDIOS_BY_CITY.flatMap((group) => group.studios);

// Juniors photography; adult hero pools exclude these.
const KIDS_HERO_INDEXES = [17, 18, 19, 20];

type ClassFormat = 'Barre' | 'Strength Lab' | 'powerCycle';

// Indexes into HERO_IMAGES that picture each format; the server picks form heroes from the same sets.
const CLASS_FORMATS: { value: ClassFormat; desc: string; images: number[] }[] = [
  { value: 'Barre', desc: 'Signature interval overload', images: [1, 2, 8, 9, 10, 11] },
  { value: 'Strength Lab', desc: 'Targeted weight training', images: [3, 4, 5, 6, 15, 16] },
  { value: 'powerCycle', desc: 'High-intensity rhythm ride', images: [0, 7, 12, 13, 14] },
];
const formatsForStudio = (studio: string): ClassFormat[] => (/bengaluru/i.test(studio) ? ['Barre'] : CLASS_FORMATS.map((f) => f.value));
// Mirrors the server's slug rule, so what the builder shows is what gets saved.
type BuilderField = { id: string; type: string; label: string; placeholder?: string; required?: boolean; helperText?: string; options?: string[]; gridCol?: string };

const utmSlug = (value: string) => value.toLowerCase().trim().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '');
const toggle = <T,>(list: T[], value: T) => (list.includes(value) ? list.filter((item) => item !== value) : [...list, value]);
const IST = { timeZone: 'Asia/Kolkata' } as const;
type StudioSession = MomenceSession & { studio: string; format: ClassFormat };
const shortStudio = (studio: string) => studio.split(',')[0];
const sessionKey = (session: StudioSession) => `${session.studio}|${session.id}`;
const sessionDay = (session: StudioSession) => new Date(session.startsAt).toLocaleDateString('en-IN', { ...IST, weekday: 'short', day: 'numeric', month: 'short' });
const sessionTime = (session: StudioSession) => new Date(session.startsAt).toLocaleTimeString('en-IN', { ...IST, hour: 'numeric', minute: '2-digit' });

const EASE = [0.16, 1, 0.3, 1] as const;
const stagger: Variants = { hidden: {}, show: { transition: { staggerChildren: 0.08, delayChildren: 0.1 } } };
const rise: Variants = { hidden: { opacity: 0, y: 18 }, show: { opacity: 1, y: 0, transition: { duration: 0.6, ease: EASE } } };

const FIELD_TYPE_LABELS: Record<string, string> = {
  text: 'Text', email: 'Email', tel: 'Phone', number: 'Number', textarea: 'Long text',
  date: 'Date', datetime: 'Date & time', select: 'Dropdown', radio: 'Radio buttons',
  checkbox: 'Checkboxes', multiselect: 'Multi-select', url: 'URL', rating: 'Rating',
  readonly: 'Read-only text', terms: 'Terms',
};

const UTM_FIELDS = [
  { key: 'source' as const, label: 'Source', placeholder: 'maia_sethna' },
  { key: 'channel' as const, label: 'Channel', placeholder: 'open_house' },
  { key: 'campaign' as const, label: 'Campaign', placeholder: 'open_house' },
];

const fieldClass = 'h-11 neu-inset border-0 focus-visible:ring-2 focus-visible:ring-primary/40 transition-shadow text-sm';
const labelClass = 'text-[11px] uppercase tracking-wider mb-2 block font-bold text-muted-foreground';

export default function LandingPage() {
  const [influencer, setInfluencer] = useState('');
  const [eventTitle, setEventTitle] = useState('');
  const [eventDate, setEventDate] = useState('');
  const [eventTime, setEventTime] = useState('');
  const [eventVenue, setEventVenue] = useState('');
  const [signupType, setSignupType] = useState<SignupType>('free');
  const [studios, setStudios] = useState<string[]>(['Kwality House, Kemps Corner']);
  const [formats, setFormats] = useState<ClassFormat[]>([]);
  // Selected class as `${studio}|${sessionId}`; Momence classes belong to one studio.
  const [selectedKey, setSelectedKey] = useState('');
  const [manualId, setManualId] = useState('');
  const [submissionLimit, setSubmissionLimit] = useState('');
  const [slotBooking, setSlotBooking] = useState<SlotBooking>(DEFAULT_SLOT_BOOKING);
  const [slotDrafts, setSlotDrafts] = useState<SlotDraft[]>([]);
  const [heroImage, setHeroImage] = useState('');
  // Extra questions the organiser adds on top of the flow's built-in fields.
  const [customFields, setCustomFields] = useState<BuilderField[]>([]);
  const [editingField, setEditingField] = useState<BuilderField | null>(null);
  const [fieldDialogOpen, setFieldDialogOpen] = useState(false);
  const [fieldIsNew, setFieldIsNew] = useState(false);
  const [describeText, setDescribeText] = useState('');
  const [describing, setDescribing] = useState(false);
  // UTMs track the campaign names until the organiser edits one.
  const [utm, setUtm] = useState({ source: '', channel: '', campaign: '' });
  const [utmTouched, setUtmTouched] = useState(false);
  const [stepIndex, setStepIndex] = useState(0);
  const [furthestStep, setFurthestStep] = useState(0);
  const [manualStudio, setManualStudio] = useState('');
  const [sessions, setSessions] = useState<StudioSession[]>([]);
  const [sessionsState, setSessionsState] = useState<'idle' | 'loading' | 'ready' | 'error'>('idle');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const availableFormats = useMemo(() => CLASS_FORMATS.map((f) => f.value).filter((format) => studios.some((studio) => formatsForStudio(studio).includes(format))), [studios]);
  const effectiveFormats = useMemo(() => (signupType === 'kids' ? [] : availableFormats.filter((format) => formats.includes(format))), [signupType, formats, availableFormats]);
  const formatKey = effectiveFormats.join(',');
  const heroPool = useMemo(() => signupType === 'kids' ? KIDS_HERO_INDEXES.map((index) => HERO_IMAGES[index])
    : effectiveFormats.length ? CLASS_FORMATS.filter((f) => effectiveFormats.includes(f.value)).flatMap((f) => f.images).map((index) => HERO_IMAGES[index])
    : HERO_IMAGES.filter((_, index) => !KIDS_HERO_INDEXES.includes(index)), [formatKey, signupType]);
  const studioKey = studios.join('|');

  // Changing the flow or formats swaps the image pool; drop a pick that is no longer in it.
  useEffect(() => {
    setHeroImage((current) => (current && heroPool.includes(current) ? current : ''));
  }, [heroPool]);

  const autoUtm = useMemo(() => {
    const host = utmSlug(influencer);
    const event = utmSlug(eventTitle);
    return { source: host || event, channel: event || host, campaign: event || host };
  }, [influencer, eventTitle]);
  const effectiveUtm = utmTouched ? utm : autoUtm;

  // Only the formats the form is built for, so the class list matches what guests can pick.
  useEffect(() => {
    let cancelled = false;
    setSessions([]);
    setSessionsState('loading');
    const requests = studios.flatMap((studio) => {
      const studioFormats = formatsForStudio(studio);
      const wanted = effectiveFormats.length ? studioFormats.filter((format) => effectiveFormats.includes(format)) : studioFormats;
      return wanted.map((classType) => getMomenceSessions({ center: studio, classType })
        .then(({ sessions }) => sessions.map((session) => ({ ...session, studio, format: classType }))));
    });
    Promise.all(requests)
      .then((results) => {
        if (cancelled) return;
        const merged = [...new Map(results.flat().map((session) => [sessionKey(session), session])).values()]
          .sort((a, b) => a.startsAt.localeCompare(b.startsAt));
        setSessions(merged);
        setSessionsState('ready');
        setSelectedKey((current) => (merged.some((session) => sessionKey(session) === current) ? current : ''));
      })
      .catch(() => { if (!cancelled) setSessionsState('error'); });
    return () => { cancelled = true; };
  }, [studioKey, formatKey]);

  const sessionsByDay = useMemo(() => sessions.reduce<Record<string, StudioSession[]>>((days, session) => { (days[sessionDay(session)] ||= []).push(session); return days; }, {}), [sessions]);
  const selectedSession = sessions.find((session) => sessionKey(session) === selectedKey);
  const manualBooking = sessionsState === 'error';
  const sessionId = manualBooking ? manualId : selectedSession ? String(selectedSession.id) : '';
  const sessionStudio = manualBooking ? (studios.includes(manualStudio) ? manualStudio : studios[0]) : selectedSession?.studio || '';
  // The class never fills the event date/time; the hero shows only what the organiser types.
  // Picking a class pins the form to that class's studio and format, so guests land pre-selected.
  const chooseSession = (key: string) => {
    setSelectedKey(key);
    const session = sessions.find((item) => sessionKey(item) === key);
    if (!session) return;
    setStudios([session.studio]);
    if (signupType !== 'kids' && !session.hosted) setFormats([session.format]);
  };

  const cities = STUDIOS_BY_CITY.filter((group) => group.studios.some((studio) => studios.includes(studio))).map((group) => group.city);
  const studioSummary = studios.length === ALL_STUDIOS.length ? 'All studios' : studios.length === 1 ? studios[0] : `${studios.length} studios`;
  const flow = SIGNUP_FLOWS.find((option) => option.value === signupType)!;
  const paidReady = signupType !== 'paid' || /^\d+$/.test(sessionId);
  const slotsReady = (!slotBooking.enabled && signupType !== 'slots') || slotDrafts.length > 0;
  const canGenerate = Boolean(influencer.trim() || eventTitle.trim()) && studios.length > 0 && paidReady && slotsReady;

  // One source of truth for the rail and the page body, so the two can never disagree.
  const isKids = signupType === 'kids';
  const isSlotForm = signupType === 'slots';
  const sectionMeta: (WizardStep & { hint: string })[] = [
    { id: 'type', title: 'Form type', hint: 'What happens after someone signs up', done: true },
    { id: 'campaign', title: 'Partner & event', hint: 'Whose name is on this form', done: Boolean(influencer.trim() || eventTitle.trim()) },
    // A slot form's schedule is its subject, so it leads the Experience phase.
    ...(isSlotForm ? [{ id: 'slots', title: 'Time slots', hint: 'The schedule guests book from', done: slotDrafts.length > 0, warn: slotDrafts.length === 0 } as WizardStep & { hint: string }] : []),
    { id: 'studios', title: 'Studios', hint: 'Where guests can go', done: studios.length > 0 },
    ...(isKids || isSlotForm ? [] : [{ id: 'formats', title: 'Class formats', hint: 'Shapes the copy, images and class list', done: effectiveFormats.length > 0, optional: true } as WizardStep & { hint: string }]),
    // Slot forms never touch Momence classes.
    ...(isSlotForm ? [] : [{ id: 'booking', title: 'Class booking', hint: signupType === 'paid' ? 'Required for paid signups' : 'Optional auto-booking', done: signupType === 'paid' ? paidReady : Boolean(sessionId), optional: signupType !== 'paid', warn: signupType === 'paid' && !paidReady } as WizardStep & { hint: string }]),
    ...(isSlotForm ? [] : [{ id: 'slots', title: 'Time slots', hint: 'Let guests book a slot with its own cap', done: slotBooking.enabled && slotDrafts.length > 0, optional: !slotBooking.enabled, warn: slotBooking.enabled && slotDrafts.length === 0 } as WizardStep & { hint: string }]),
    { id: 'fields', title: 'Extra questions', hint: 'Add your own fields on top of the standard ones', done: customFields.length > 0, optional: true },
    { id: 'hero', title: 'Hero image', hint: 'The image that leads the form', done: Boolean(heroImage), optional: true },
    { id: 'tracking', title: 'Limits & tracking', hint: 'Sign-up cap and UTM tags', done: Boolean(submissionLimit || utmTouched), optional: true },
  ];
  // The review step always closes the wizard.
  const steps: (WizardStep & { hint: string })[] = [
    ...sectionMeta,
    { id: 'review', title: 'Review', hint: 'Check everything, then create the form', done: canGenerate },
  ];
  const stepCount = steps.length;
  // Switching form type can remove steps, so never leave the index past the end.
  const safeIndex = Math.min(stepIndex, stepCount - 1);
  const step = steps[safeIndex];

  // Each step only blocks on what it is responsible for.
  const stepBlocker = (id: string): string => {
    if (id === 'campaign' && !influencer.trim() && !eventTitle.trim()) return 'Enter a partner name or an event title to continue.';
    if (id === 'studios' && !studios.length) return 'Choose at least one studio.';
    if (id === 'booking' && !paidReady) return 'Paid signups need a Momence class.';
    if (id === 'slots' && !slotsReady) return 'Add at least one time slot.';
    return '';
  };
  const blocker = stepBlocker(step.id);

  const goTo = (index: number) => {
    const next = Math.max(0, Math.min(index, stepCount - 1));
    setStepIndex(next);
    setFurthestStep((current) => Math.max(current, next));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };
  const goNext = () => { if (!blocker) goTo(safeIndex + 1); };
  const goBack = () => goTo(safeIndex - 1);

  // Text to form: fills in the type, names and extra questions, then hands over to the wizard.
  const handleDescribe = async () => {
    const text = describeText.trim();
    if (text.length < 8) { toast.error('Describe the form in a sentence or two.'); return; }
    setDescribing(true);
    try {
      const draft = await describeForm({ description: text });
      if (draft.signupType && ['free', 'paid', 'kids', 'slots'].includes(draft.signupType)) {
        chooseSignupType(draft.signupType as SignupType);
      }
      if (draft.title && !eventTitle.trim()) setEventTitle(draft.title);
      if (draft.fields.length) {
        setCustomFields(draft.fields.map((field: any, index: number) => ({ ...field, id: `custom_${Date.now()}_${index}` })));
      }
      toast.success(
        draft.fields.length ? `Added ${draft.fields.length} question${draft.fields.length === 1 ? '' : 's'}.` : 'No extra questions found in that description.',
        { description: draft.engine === 'parser' ? draft.note : undefined },
      );
      setDescribeText('');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Could not read that description.');
    } finally {
      setDescribing(false);
    }
  };

  // Slot Bookings always books slots; every other flow leaves the toggle where it was.
  const chooseSignupType = (next: SignupType) => {
    setSignupType(next);
    if (next === 'slots') {
      setSlotBooking((current) => ({ ...current, enabled: true }));
      setSelectedKey('');
      setFormats([]);
    }
  };
  const jumpTo = (id: string) => {
    const index = steps.findIndex((item) => item.id === id);
    if (index >= 0) goTo(index);
  };

  const handleGenerate = async () => {
    if (!influencer.trim() && !eventTitle.trim()) {
      toast.error('Please enter an influencer name or event title');
      return;
    }
    setLoading(true);
    try {
      const prompt = [influencer.trim() && `Influencer/Partner: ${influencer.trim()}`, eventTitle.trim() && `Event: ${eventTitle.trim()}`].filter(Boolean).join(' | ');
      if (!paidReady) {
        toast.error('Paid signups need a Momence class');
        return;
      }
      if (!slotsReady) {
        toast.error(signupType === 'slots'
          ? 'A Slot Bookings form needs at least one time slot.'
          : 'Add at least one time slot, or switch time slots off.');
        return;
      }
      const { form } = await generateForm({ prompt, creatorEmail: '', signupType, targetStudios: studios, sessionId, sessionStudio: sessionId ? sessionStudio : '', classFormats: effectiveFormats, submissionLimit: Number(submissionLimit) || 0, eventDate, eventTime, eventVenue: eventVenue.trim(), heroImage, customFields, utmSource: effectiveUtm.source, utmChannel: effectiveUtm.channel, utmCampaign: effectiveUtm.campaign, slotBooking: slotBooking.enabled || signupType === 'slots' ? slotBooking : undefined });
      // Slots live in their own table, so they are written once the form exists.
      if (slotDrafts.length && (slotBooking.enabled || signupType === 'slots')) {
        try {
          await saveFormSlots({ formId: form.id, slots: sortDrafts(slotDrafts).map(toSlotInput) });
        } catch (error) {
          toast.error(error instanceof Error ? error.message : 'Form created, but the time slots could not be saved. Add them from the form editor.');
        }
      }
      toast.success('Form created!', form.sheetUrl
        ? { description: 'Submissions will be saved to a public Google Sheet.', action: { label: 'Open Sheet', onClick: () => window.open(form.sheetUrl, '_blank') }, duration: 10000 }
        : undefined);
      navigate(`/form/${form.id}/preview`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to generate form. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <MotionConfig reducedMotion="user">
    <div className="min-h-screen bg-background relative overflow-hidden">
      {/* Drifting ambient glow */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <motion.div className="absolute -top-60 right-[-10%] w-[700px] h-[700px] rounded-full opacity-[0.10]"
          style={{ background: 'radial-gradient(circle, #a855f7 0%, transparent 70%)' }}
          animate={{ x: [0, -60, 0], y: [0, 40, 0] }} transition={{ duration: 18, repeat: Infinity, ease: 'easeInOut' }} />
        <motion.div className="absolute bottom-[-15%] left-[-10%] w-[600px] h-[600px] rounded-full opacity-[0.09]"
          style={{ background: 'radial-gradient(circle, #06b6d4 0%, transparent 70%)' }}
          animate={{ x: [0, 70, 0], y: [0, -30, 0] }} transition={{ duration: 22, repeat: Infinity, ease: 'easeInOut' }} />
        <motion.div className="absolute top-[40%] left-[45%] w-[420px] h-[420px] rounded-full opacity-[0.07]"
          style={{ background: 'radial-gradient(circle, #f97316 0%, transparent 70%)' }}
          animate={{ x: [0, -40, 30, 0], y: [0, 30, -20, 0] }} transition={{ duration: 26, repeat: Infinity, ease: 'easeInOut' }} />
      </div>

      {/* Nav */}
      <nav className="relative z-50 border-b border-border bg-background/80 backdrop-blur-md">
        <div className="container mx-auto h-16 flex items-center justify-between px-4">
          <motion.div className="flex items-center gap-3" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}>
            <img src={BRAND_LOGO} alt="Physique 57" className="h-10 w-auto" />
            <div className="h-5 w-px bg-border/50" />
            <span className="text-xs font-medium tracking-wider uppercase text-muted-foreground">Lead Capture</span>
          </motion.div>
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1, duration: 0.6, ease: EASE }}>
          <Button variant="outline" onClick={() => navigate('/dashboard')} className="text-sm gap-2 font-semibold neu-raised-sm neu-pressable border-0">
            <BarChart3 className="w-3.5 h-3.5" /> My Forms
          </Button>
          </motion.div>
        </div>
      </nav>

      <main className="relative z-10 container mx-auto px-4 md:px-6 py-10 md:py-14">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <header className="max-w-3xl mx-auto mb-6 text-center">
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight" style={{ fontFamily: "'Playfair Display', serif" }}>
              Create a sign-up form
            </h1>
            <p className="text-muted-foreground text-sm mt-1.5">
              Answer a few questions and get a branded Physique 57 form with Momence tracking.
            </p>
          </header>

          {/* Wizard */}
          <div className="max-w-3xl mx-auto">
            <div className="mb-5">
              <WizardSteps steps={steps} current={safeIndex} furthest={furthestStep} onJump={goTo} />
            </div>

            <motion.section initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, ease: EASE }}
              className="rounded-2xl neu-raised overflow-hidden">
              <div className="h-1" style={{ background: 'linear-gradient(90deg, #8b5cf6, #0891b2)' }} />

              <div className="p-5 md:p-8">
                <header className="mb-6">
                  <p className="text-[11px] uppercase tracking-wider font-bold text-muted-foreground mb-1">
                    Step {safeIndex + 1} of {stepCount}
                  </p>
                  <h2 className="text-xl font-semibold">{step.title}</h2>
                  <p className="text-sm text-muted-foreground mt-1">{step.hint}</p>
                </header>

                {/* Only the current step is on screen. */}
                <AnimatePresence mode="wait">
                  <motion.div key={step.id}
                    initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -12 }}
                    transition={{ duration: 0.22, ease: EASE }}>
                    {step.id === 'studios' && (
                      <div className="flex justify-end mb-3">
                        <SelectAll clearLabel="Reset" allSelected={studios.length === ALL_STUDIOS.length} onToggle={(all) => setStudios(all ? [...ALL_STUDIOS] : [ALL_STUDIOS[0]])} />
                      </div>
                    )}
                    {step.id === 'formats' && (
                      <div className="flex justify-end mb-3">
                        <SelectAll allSelected={availableFormats.every((format) => effectiveFormats.includes(format))} onToggle={(all) => setFormats(all ? [...availableFormats] : [])} />
                      </div>
                    )}
                {step.id === 'type' && (
                  <>
                    <div className="rounded-xl neu-inset p-4 mb-5">
                      <label htmlFor="describe" className="flex items-center gap-1.5 text-[11px] uppercase tracking-wider font-bold text-muted-foreground mb-2">
                        <Wand2 className="w-3.5 h-3.5" /> Describe it instead
                      </label>
                      <textarea id="describe" value={describeText} onChange={(e) => setDescribeText(e.target.value)} rows={3}
                        placeholder="Open house on the 14th. Ask for their t-shirt size (S/M/L), which classes they want to try, and any injuries."
                        className="w-full rounded-lg bg-transparent px-3 py-2 text-sm outline-none resize-none border border-border focus-visible:ring-2 focus-visible:ring-primary/40" />
                      <div className="flex flex-wrap items-center justify-between gap-3 mt-2">
                        <p className="text-xs text-muted-foreground">We fill in the type and questions. You can change anything after.</p>
                        <Button size="sm" onClick={handleDescribe} disabled={describing} className="gap-1.5 shrink-0 neu-pressable">
                          {describing ? <><Loader2 className="w-3.5 h-3.5 animate-spin" />Reading...</> : <><Wand2 className="w-3.5 h-3.5" />Build it</>}
                        </Button>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3" role="radiogroup" aria-label="Signup flow">
                      {SIGNUP_FLOWS.map((option) => (
                        <OptionTile key={option.value} group="flow" selected={signupType === option.value} onSelect={() => chooseSignupType(option.value)}>
                          <option.icon className="w-4 h-4 mb-3" style={{ color: signupType === option.value ? '#a855f7' : undefined }} />
                          <span className="block text-sm font-semibold">{option.label}</span>
                          <span className="block text-xs text-muted-foreground mt-0.5">{option.desc}</span>
                        </OptionTile>
                      ))}
                    </div>
                  </>
                )}
                {step.id === 'campaign' && (
                  <>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label className={labelClass}>Influencer / Partner Name *</Label>
                        <Input value={influencer} onChange={(e) => setInfluencer(e.target.value)} placeholder="e.g. Maia Sethna, Shilpa Shetty" className={fieldClass} />
                      </div>
                      <div>
                        <Label className={labelClass}>Event Title</Label>
                        <Input value={eventTitle} onChange={(e) => setEventTitle(e.target.value)} placeholder="e.g. Open House, Exclusive Barre Class" className={fieldClass} />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="event-date" className={labelClass}>Event date</Label>
                          <Input id="event-date" type="date" value={eventDate} onChange={(e) => setEventDate(e.target.value)} className={`${fieldClass}`} />
                        </div>
                        <div>
                          <Label htmlFor="event-time" className={labelClass}>Start time</Label>
                          <Input id="event-time" type="time" value={eventTime} onChange={(e) => setEventTime(e.target.value)} className={`${fieldClass}`} />
                        </div>
                      </div>
                      <div>
                        <Label htmlFor="event-venue" className={labelClass}>Venue details</Label>
                        <div className="relative">
                          <MapPin className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                          <Input id="event-venue" value={eventVenue} onChange={(e) => setEventVenue(e.target.value)} placeholder="Defaults to the studio · e.g. Rooftop, Supreme HQ" className={`${fieldClass} pl-9`} />
                        </div>
                      </div>
                    </div>
                  </>
                )}
                {step.id === 'studios' && (
                  <>
                    <div className="space-y-4">
                      {STUDIOS_BY_CITY.map((group) => (
                        <div key={group.city}>
                          <span className="flex items-center gap-1.5 text-[11px] uppercase tracking-wider text-muted-foreground/70 mb-2">
                            <MapPin className="w-3 h-3" /> {group.city}
                          </span>
                          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3" role="group" aria-label={`${group.city} studios`}>
                            {group.studios.map((studio) => (
                              <OptionTile key={studio} group="studio" multi selected={studios.includes(studio)}
                                onSelect={() => setStudios((current) => (current.includes(studio) && current.length === 1 ? current : toggle(current, studio)))}>
                                <span className="block text-sm font-semibold leading-snug">{studio.replace(/, Bengaluru$/, '')}</span>
                              </OptionTile>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </>
                )}
                {step.id === 'formats' && (
                  <>
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3" role="group" aria-label="Class formats">
                      <OptionTile group="format" multi selected={effectiveFormats.length === 0} onSelect={() => setFormats([])}>
                        <Shuffle className="w-4 h-4 mb-3 text-muted-foreground" />
                        <span className="block text-sm font-semibold">Any format</span>
                        <span className="block text-xs text-muted-foreground mt-0.5">Guest picks in the form</span>
                      </OptionTile>
                      {CLASS_FORMATS.map((option) => {
                        const unavailable = !availableFormats.includes(option.value);
                        return (
                          <OptionTile key={option.value} group="format" multi selected={effectiveFormats.includes(option.value)} onSelect={() => setFormats((current) => toggle(current.filter((format) => availableFormats.includes(format)), option.value))} disabled={unavailable} flush>
                            <div className="relative h-16 overflow-hidden rounded-t-[11px]">
                              <img src={HERO_IMAGES[option.images[0]]} alt="" className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
                              <div className="absolute inset-0 bg-gradient-to-t from-card via-card/40 to-transparent" />
                            </div>
                            <div className="px-4 pb-4 -mt-2 relative">
                              <span className="block text-sm font-semibold">{option.value}</span>
                              <span className="block text-xs text-muted-foreground mt-0.5">{unavailable ? 'Not at these studios' : option.desc}</span>
                            </div>
                          </OptionTile>
                        );
                      })}
                    </div>
                  </>
                )}
                {step.id === 'booking' && (
                  <>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-start">
                      <div>
                        <Label htmlFor="momence-class" className={labelClass}>Momence class {signupType === 'paid' ? '*' : '(optional)'}</Label>
                        {manualBooking ? (
                          <div className="flex gap-2">
                            <Input id="momence-class" inputMode="numeric" value={manualId} onChange={(e) => setManualId(e.target.value.replace(/\D/g, ''))}
                              placeholder="Couldn't load classes · enter session ID" className={fieldClass} />
                            {studios.length > 1 && (
                              <select aria-label="Studio for this class" value={sessionStudio} onChange={(e) => setManualStudio(e.target.value)}
                                className={`${fieldClass} w-40 shrink-0 rounded-md border px-2`}>
                                {studios.map((studio) => <option key={studio} value={studio}>{shortStudio(studio)}</option>)}
                              </select>
                            )}
                          </div>
                        ) : (
                          <div className="relative">
                            <select id="momence-class" value={selectedKey} onChange={(e) => chooseSession(e.target.value)} disabled={sessionsState === 'loading'}
                              className={`${fieldClass} w-full rounded-md border px-3 pr-9 appearance-none disabled:opacity-60`}>
                              <option value="">{sessionsState === 'loading' ? 'Loading classes from Momence…' : sessions.length ? (signupType === 'paid' ? 'Select a class' : 'No pre-booking · guest picks later') : 'No upcoming classes found'}</option>
                              {Object.entries(sessionsByDay).map(([day, items]) => (
                                <optgroup key={day} label={day}>
                                  {items.map((session) => (
                                    <option key={sessionKey(session)} value={sessionKey(session)} disabled={session.spotsLeft === 0}>
                                      {session.hosted ? '★ Hosted · ' : ''}{sessionTime(session)} · {session.name}{studios.length > 1 ? ` · ${shortStudio(session.studio)}` : ''}{session.teacherName ? ` · ${session.teacherName}` : ''}{session.spotsLeft != null ? ` · ${session.spotsLeft === 0 ? 'Full' : `${session.spotsLeft} left`}` : ''}
                                    </option>
                                  ))}
                                </optgroup>
                              ))}
                            </select>
                            {sessionsState === 'loading'
                              ? <Loader2 className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 animate-spin text-muted-foreground" />
                              : <ChevronRight className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 rotate-90 text-muted-foreground" />}
                          </div>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground leading-relaxed md:pt-7">
                        {manualBooking
                          ? 'Momence classes could not be loaded right now. You can still paste a session ID.'
                          : `Next 30 days of ${effectiveFormats.length ? effectiveFormats.join(' & ') : 'every'} classes at ${studios.length > 1 ? `all ${studios.length} selected studios` : shortStudio(studios[0])}.`}
                        {' '}
                        {studios.length > 1
                          ? 'Guests who choose this class’s studio are auto-booked into it; guests at the other studios pick a class after signing up.'
                          : 'Guests are auto-booked into the chosen class after signup. Selecting a class pins the form to its studio and format.'}
                      </p>
                    </div>
                  </>
                )}
                {step.id === 'slots' && (
                  <>
                    <SlotWizard booking={slotBooking} onBookingChange={setSlotBooking} slots={slotDrafts} onSlotsChange={setSlotDrafts}
                      fieldClass={fieldClass} labelClass={labelClass} defaultDate={eventDate} alwaysOn={isSlotForm} />
                  </>
                )}
                {step.id === 'fields' && (
                  <div className="space-y-3">
                    {customFields.length === 0 && (
                      <p className="text-sm text-muted-foreground">
                        The standard contact fields are added for you. Add anything else you need to ask.
                      </p>
                    )}
                    {customFields.map((field, index) => (
                      <div key={field.id} className="flex items-center gap-3 rounded-xl neu-raised-sm px-3 py-2.5">
                        <GripVertical className="w-4 h-4 shrink-0 text-muted-foreground" />
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium truncate">{field.label}</p>
                          <p className="text-[11px] text-muted-foreground">
                            {FIELD_TYPE_LABELS[field.type] || field.type}
                            {field.required ? ' · required' : ''}
                            {field.options?.length ? ` · ${field.options.length} options` : ''}
                          </p>
                        </div>
                        <Button variant="ghost" size="sm" className="h-8 px-2" aria-label={`Edit ${field.label}`}
                          onClick={() => { setEditingField(field); setFieldIsNew(false); setFieldDialogOpen(true); }}>
                          <Pencil className="w-3.5 h-3.5" />
                        </Button>
                        <Button variant="ghost" size="sm" className="h-8 px-2" aria-label={`Remove ${field.label}`}
                          onClick={() => setCustomFields(customFields.filter((_, i) => i !== index))}>
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    ))}
                    <Button variant="outline" className="w-full gap-1.5 neu-pressable"
                      onClick={() => { setEditingField(null); setFieldIsNew(true); setFieldDialogOpen(true); }}>
                      <Plus className="w-4 h-4" /> Add a question
                    </Button>
                  </div>
                )}

                {step.id === 'hero' && (
                  <HeroPicker images={heroPool} value={heroImage} onChange={setHeroImage} />
                )}
                {step.id === 'tracking' && (
                  <div className="space-y-5">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-start">
                      <div>
                        <Label htmlFor="submission-limit" className={labelClass}>Sign-up limit</Label>
                        <Input id="submission-limit" inputMode="numeric" value={submissionLimit}
                          onChange={(e) => setSubmissionLimit(e.target.value.replace(/\D/g, '').slice(0, 5))}
                          placeholder="Leave blank for unlimited" className={fieldClass} />
                      </div>
                      <p className="text-xs text-muted-foreground leading-relaxed md:pt-7">
                        {submissionLimit
                          ? `The form stops accepting responses after ${submissionLimit} sign-ups.`
                          : 'The form accepts responses until you unpublish it.'}
                      </p>
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="flex items-center gap-1.5 text-[11px] uppercase tracking-wider font-bold text-muted-foreground">
                          <Tag className="w-3 h-3" /> UTM tags
                        </span>
                        {utmTouched && (
                          <button type="button" onClick={() => { setUtmTouched(false); setUtm({ source: '', channel: '', campaign: '' }); }}
                            className="text-[11px] font-semibold uppercase tracking-wider text-primary hover:opacity-70 transition-opacity">
                            Back to automatic
                          </button>
                        )}
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        {UTM_FIELDS.map((utmField) => (
                          <div key={utmField.key}>
                            <Label htmlFor={`utm-${utmField.key}`} className={labelClass}>{utmField.label}</Label>
                            <Input id={`utm-${utmField.key}`} value={effectiveUtm[utmField.key]}
                              onChange={(e) => { setUtmTouched(true); setUtm({ ...effectiveUtm, [utmField.key]: utmSlug(e.target.value) }); }}
                              placeholder={utmField.placeholder} className={fieldClass} />
                          </div>
                        ))}
                      </div>
                      <p className="text-xs text-muted-foreground leading-relaxed mt-2">
                        {utmTouched
                          ? 'Set by hand. Every submission is tagged with these.'
                          : 'Built from the partner and event names as you type. Edit any field to take over.'}
                      </p>
                    </div>
                  </div>
                )}

                    {step.id === 'review' && (
                      <div className="space-y-5">
                        <dl className="grid grid-cols-2 gap-3">
                          <SummaryItem label="Partner" value={influencer.trim() || '—'} span />
                          <SummaryItem label="Event" value={eventTitle.trim() || '—'} span />
                          <SummaryItem label="Form type" value={flow.label} />
                          <SummaryItem label="City" value={cities.join(' + ') || '—'} />
                          <SummaryItem label="Studios" value={studioSummary} span />
                          {!isSlotForm && <SummaryItem label="Formats" value={effectiveFormats.join(', ') || 'Any'} span />}
                          <SummaryItem label="When" value={eventDate ? new Date(`${eventDate}T${eventTime || '00:00'}`).toLocaleString('en-IN', { day: 'numeric', month: 'short', ...(eventTime ? { hour: 'numeric', minute: '2-digit' } : {}) }) : '—'} />
                          <SummaryItem label="Limit" value={submissionLimit ? `${submissionLimit} sign-ups` : 'Unlimited'} />
                          <SummaryItem label="Hero" value={heroImage ? 'Chosen' : 'Auto'} />
                          <SummaryItem label="Slots" value={slotBooking.enabled || isSlotForm ? `${slotDrafts.length} · ${slotDrafts.reduce((sum, slot) => sum + (Number(slot.capacity) || 0), 0)} spots` : 'Off'} />
                          {!isSlotForm && <SummaryItem label="Class" value={selectedSession ? `${sessionDay(selectedSession)} ${sessionTime(selectedSession)}` : sessionId || (signupType === 'paid' ? 'Required' : 'None')} span />}
                        </dl>

                        <div className="rounded-xl neu-inset p-3">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-[10px] uppercase tracking-[0.25em] text-muted-foreground font-medium">Hero</span>
                            <button type="button" onClick={() => jumpTo('hero')}
                              className="text-[10px] font-semibold uppercase tracking-wider text-primary hover:opacity-70 transition-opacity">
                              {heroImage ? 'Change' : 'Choose'}
                            </button>
                          </div>
                          <div className="relative w-full aspect-[16/6] rounded-lg overflow-hidden">
                            <img src={heroImage || heroPool[0]} alt=""
                              className="absolute inset-0 w-full h-full object-cover" style={{ opacity: heroImage ? 1 : 0.3 }} />
                            {!heroImage && (
                              <div className="absolute inset-0 flex items-center justify-center">
                                <p className="text-xs text-muted-foreground">We pick one of {heroPool.length} images unless you choose.</p>
                              </div>
                            )}
                          </div>
                        </div>

                        <motion.div whileHover={canGenerate ? { scale: 1.01 } : undefined} whileTap={canGenerate ? { scale: 0.99 } : undefined}>
                          <Button onClick={handleGenerate} disabled={loading || !canGenerate}
                            className="relative w-full h-12 gap-2 rounded-xl text-sm tracking-wider uppercase font-extrabold text-white neu-pressable overflow-hidden disabled:opacity-50"
                            size="lg" style={{ background: 'linear-gradient(135deg, #8b5cf6, #6d28d9)', border: 'none' }}>
                            <span className="relative flex items-center gap-2">
                              {loading ? <><Loader2 className="w-4 h-4 animate-spin" />Creating your form...</> : <>Create form<ArrowRight className="w-4 h-4" /></>}
                            </span>
                          </Button>
                        </motion.div>
                        {!canGenerate && (
                          <p className="text-center text-xs text-muted-foreground">
                            Some steps still need attention. Use the steps above to go back.
                          </p>
                        )}
                      </div>
                    )}
                  </motion.div>
                </AnimatePresence>
              </div>

              {/* Step controls */}
              <div className="flex items-center justify-between gap-3 border-t border-border px-5 md:px-8 py-4">
                <Button variant="ghost" onClick={goBack} disabled={safeIndex === 0} className="gap-1.5">
                  <ChevronLeft className="w-4 h-4" /> Back
                </Button>
                <p className="text-xs text-center min-w-0 flex-1" style={{ color: blocker ? 'hsl(28 85% 40%)' : 'hsl(var(--muted-foreground))' }}>
                  {blocker || (step.id === 'review' ? 'Ready to create' : `${stepCount - safeIndex - 1} step${stepCount - safeIndex - 1 === 1 ? '' : 's'} to go`)}
                </p>
                {step.id === 'review' ? <span className="w-[86px]" /> : (
                  <Button onClick={goNext} disabled={Boolean(blocker)} className="gap-1.5 neu-pressable">
                    Next <ArrowRight className="w-4 h-4" />
                  </Button>
                )}
              </div>
            </motion.section>
          </div>

        </div>
      </main>

      <FieldEditorDialog field={editingField} open={fieldDialogOpen} onClose={() => setFieldDialogOpen(false)}
        onSave={(field) => {
          setCustomFields((current) => (fieldIsNew ? [...current, field] : current.map((item) => (item.id === field.id ? field : item))));
          setFieldDialogOpen(false);
        }} />

      {/* Footer */}
      <footer className="relative z-10 py-6" style={{ borderTop: '1px solid rgba(168,85,247,0.08)' }}>
        <p className="text-center text-[11px] tracking-[0.2em] text-muted-foreground/40 uppercase">
          © {new Date().getFullYear()} Physique 57 · All Rights Reserved
        </p>
      </footer>
    </div>
    </MotionConfig>
  );
}


function OptionTile({ group, selected, onSelect, disabled, flush, multi, children }: { group: string; selected: boolean; onSelect: () => void; disabled?: boolean; flush?: boolean; multi?: boolean; children: React.ReactNode }) {
  return (
    <motion.button type="button" role={multi ? 'checkbox' : 'radio'} aria-checked={selected} aria-disabled={disabled} disabled={disabled} onClick={onSelect}
      whileHover={disabled ? undefined : { y: -2 }} whileTap={disabled ? undefined : { scale: 0.98 }}
      className={`group relative text-left rounded-xl transition-shadow ${flush ? '' : 'p-4 pr-8'} ${disabled ? 'opacity-40 cursor-not-allowed neu-inset' : selected ? 'neu-inset ring-2 ring-primary/50' : 'neu-raised-sm neu-pressable'}`}>
      <AnimatePresence>
        {selected && !disabled && (
          // Single-choice groups slide one highlight between tiles; multi-select tiles fade their own.
          <motion.span key="highlight" layoutId={multi ? undefined : `tile-${group}`} className="absolute inset-0 rounded-[11px] bg-purple-500/[0.1] ring-1 ring-purple-500/40"
            initial={multi ? { opacity: 0, scale: 0.96 } : false} animate={{ opacity: 1, scale: 1 }} exit={multi ? { opacity: 0, scale: 0.96 } : undefined}
            transition={{ type: 'spring', stiffness: 420, damping: 34 }} />
        )}
      </AnimatePresence>
      <AnimatePresence>
        {selected && !disabled && (
          <motion.span key="check" className="absolute top-3 right-3 z-10" initial={{ scale: 0, rotate: -45 }} animate={{ scale: 1, rotate: 0 }} exit={{ scale: 0 }}>
            <Check className="w-3.5 h-3.5" style={{ color: 'hsl(var(--primary))' }} />
          </motion.span>
        )}
      </AnimatePresence>
      <span className="relative block">{children}</span>
    </motion.button>
  );
}

function SelectAll({ allSelected, onToggle, clearLabel = 'Clear' }: { allSelected: boolean; onToggle: (selectAll: boolean) => void; clearLabel?: string }) {
  return (
    <button type="button" onClick={() => onToggle(!allSelected)}
      className="text-[11px] font-semibold uppercase tracking-wider text-primary hover:opacity-70 transition-opacity">
      {allSelected ? clearLabel : 'Select all'}
    </button>
  );
}

function SummaryItem({ label, value, span }: { label: string; value: string; span?: boolean }) {
  return (
    <div className={`rounded-lg neu-inset px-3 py-2.5 min-w-0 ${span ? 'col-span-2' : ''}`}>
      <dt className="text-[10px] uppercase tracking-wider text-muted-foreground/70">{label}</dt>
      <dd className="text-sm font-medium mt-0.5 overflow-hidden">
        <AnimatePresence mode="wait" initial={false}>
          <motion.span key={value} className="block truncate" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.18 }}>
            {value}
          </motion.span>
        </AnimatePresence>
      </dd>
    </div>
  );
}

