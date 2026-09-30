import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@project/components/ui/button';
import { Input } from '@project/components/ui/input';
import { Label } from '@project/components/ui/label';
import { Loader2, ArrowRight, Sparkles, Zap, Share2, BarChart3, ChevronRight, Check, MapPin, Gift, CreditCard, Baby, Shuffle, Image as ImageIcon, Tag } from 'lucide-react';
import { generateForm, getMomenceSessions, saveFormSlots, DEFAULT_SLOT_BOOKING, type MomenceSession, type SlotBooking } from '@/lib/api';
import SlotWizard from '@/components/SlotWizard';
import BuilderRail, { type RailSection } from '@/components/BuilderRail';
import HeroPicker from '@/components/HeroPicker';
import { sortDrafts, toSlotInput, type SlotDraft } from '@/lib/slots';
import { toast } from 'sonner';
import { BRAND_LOGO_DARK, HERO_IMAGES } from '@/lib/constants';
import { motion, AnimatePresence, MotionConfig, type Variants } from 'framer-motion';

type SignupType = 'kids' | 'free' | 'paid';

const SIGNUP_FLOWS: { value: SignupType; label: string; desc: string; icon: React.ElementType }[] = [
  { value: 'free', label: 'Free signup', desc: 'Complimentary first class', icon: Gift },
  { value: 'paid', label: 'Paid signup', desc: 'Checkout, then auto-book', icon: CreditCard },
  { value: 'kids', label: 'Kids / Juniors', desc: 'Parent-signed waiver', icon: Baby },
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

const UTM_FIELDS = [
  { key: 'source' as const, label: 'Source', placeholder: 'maia_sethna' },
  { key: 'channel' as const, label: 'Channel', placeholder: 'open_house' },
  { key: 'campaign' as const, label: 'Campaign', placeholder: 'open_house' },
];

const fieldClass = 'h-11 bg-muted/30 border-border/50 focus:border-purple-500/40 transition-colors text-sm';
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
  // UTMs track the campaign names until the organiser edits one.
  const [utm, setUtm] = useState({ source: '', channel: '', campaign: '' });
  const [utmTouched, setUtmTouched] = useState(false);
  const [activeSection, setActiveSection] = useState('type');
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
  const slotsReady = !slotBooking.enabled || slotDrafts.length > 0;
  const canGenerate = Boolean(influencer.trim() || eventTitle.trim()) && studios.length > 0 && paidReady && slotsReady;

  // One source of truth for the rail and the page body, so the two can never disagree.
  const isKids = signupType === 'kids';
  const sectionMeta: (RailSection & { hint: string })[] = [
    { id: 'type', phase: 'Campaign', title: 'Form type', hint: 'What happens after someone signs up', done: true },
    { id: 'campaign', phase: 'Campaign', title: 'Partner & event', hint: 'Whose name is on this form', done: Boolean(influencer.trim() || eventTitle.trim()) },
    { id: 'studios', phase: 'Experience', title: 'Studios', hint: 'Where guests can go', done: studios.length > 0 },
    ...(isKids ? [] : [{ id: 'formats', phase: 'Experience', title: 'Class formats', hint: 'Shapes the copy, images and class list', done: effectiveFormats.length > 0, optional: true } as RailSection & { hint: string }]),
    // Only paid forms must pin a class, so for every other flow this is an optional extra.
    { id: 'booking', phase: 'Experience', title: 'Class booking', hint: signupType === 'paid' ? 'Required for paid signups' : 'Optional auto-booking', done: signupType === 'paid' ? paidReady : Boolean(sessionId), optional: signupType !== 'paid', warn: signupType === 'paid' && !paidReady },
    { id: 'slots', phase: 'Experience', title: 'Time slots', hint: 'Let guests book a slot with its own cap', done: slotBooking.enabled && slotDrafts.length > 0, optional: !slotBooking.enabled, warn: slotBooking.enabled && slotDrafts.length === 0 },
    { id: 'hero', phase: 'Appearance & tracking', title: 'Hero image', hint: 'The image that leads the form', done: Boolean(heroImage), optional: true },
    { id: 'tracking', phase: 'Appearance & tracking', title: 'Limits & tracking', hint: 'Sign-up cap and UTM tags', done: Boolean(submissionLimit || utmTouched), optional: true },
  ];
  const sectionIds = sectionMeta.map((section) => section.id).join(',');

  // Highlight whichever section is nearest the top of the viewport.
  useEffect(() => {
    const ids = sectionIds.split(',');
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries.filter((entry) => entry.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)[0];
        if (visible) setActiveSection(visible.target.id.replace('section-', ''));
      },
      { rootMargin: '-96px 0px -55% 0px', threshold: 0 },
    );
    for (const id of ids) {
      const element = document.getElementById(`section-${id}`);
      if (element) observer.observe(element);
    }
    return () => observer.disconnect();
  }, [sectionIds]);

  const jumpTo = (id: string) => {
    document.getElementById(`section-${id}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
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
      if (slotBooking.enabled && !slotDrafts.length) {
        toast.error('Add at least one time slot, or switch time slots off.');
        return;
      }
      const { form } = await generateForm({ prompt, creatorEmail: '', signupType, targetStudios: studios, sessionId, sessionStudio: sessionId ? sessionStudio : '', classFormats: effectiveFormats, submissionLimit: Number(submissionLimit) || 0, eventDate, eventTime, eventVenue: eventVenue.trim(), heroImage, utmSource: effectiveUtm.source, utmChannel: effectiveUtm.channel, utmCampaign: effectiveUtm.campaign, slotBooking: slotBooking.enabled ? slotBooking : undefined });
      // Slots live in their own table, so they are written once the form exists.
      if (slotBooking.enabled && slotDrafts.length) {
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
        <motion.div className="absolute -top-60 right-[-10%] w-[700px] h-[700px] rounded-full opacity-[0.07]"
          style={{ background: 'radial-gradient(circle, #a855f7 0%, transparent 70%)' }}
          animate={{ x: [0, -60, 0], y: [0, 40, 0] }} transition={{ duration: 18, repeat: Infinity, ease: 'easeInOut' }} />
        <motion.div className="absolute bottom-[-15%] left-[-10%] w-[600px] h-[600px] rounded-full opacity-[0.06]"
          style={{ background: 'radial-gradient(circle, #06b6d4 0%, transparent 70%)' }}
          animate={{ x: [0, 70, 0], y: [0, -30, 0] }} transition={{ duration: 22, repeat: Infinity, ease: 'easeInOut' }} />
        <motion.div className="absolute top-[40%] left-[45%] w-[420px] h-[420px] rounded-full opacity-[0.04]"
          style={{ background: 'radial-gradient(circle, #f97316 0%, transparent 70%)' }}
          animate={{ x: [0, -40, 30, 0], y: [0, 30, -20, 0] }} transition={{ duration: 26, repeat: Infinity, ease: 'easeInOut' }} />
      </div>

      {/* Nav */}
      <nav className="relative z-50 border-b border-border/30 bg-background/80 backdrop-blur-md">
        <div className="container mx-auto h-16 flex items-center justify-between px-4">
          <motion.div className="flex items-center gap-3" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}>
            <img src={BRAND_LOGO_DARK} alt="Physique 57" className="h-10 w-auto" />
            <div className="h-5 w-px bg-border/50" />
            <span className="text-xs font-medium tracking-wider uppercase text-muted-foreground">Lead Capture</span>
          </motion.div>
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1, duration: 0.6, ease: EASE }}>
          <Button variant="outline" onClick={() => navigate('/dashboard')} className="text-sm gap-2 border-border/50 hover:border-primary/40 font-semibold text-[#03c4ff] shadow-none">
            <BarChart3 className="w-3.5 h-3.5" /> My Forms
          </Button>
          </motion.div>
        </div>
      </nav>

      <main className="relative z-10 container mx-auto px-4 md:px-6 py-10 md:py-14">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <motion.header initial="hidden" animate="show" variants={stagger}
            className="flex flex-col md:flex-row md:items-end md:justify-between gap-6 mb-8 md:mb-10">
            <div>
              <motion.div variants={rise} className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full mb-4 text-[11px] font-medium tracking-wider uppercase"
                style={{ background: 'rgba(168,85,247,0.08)', border: '1px solid rgba(168,85,247,0.15)', color: 'rgba(168,85,247,0.9)' }}>
                <motion.span animate={{ rotate: [0, 18, -8, 0] }} transition={{ duration: 2.4, repeat: Infinity, repeatDelay: 2 }}><Sparkles className="w-3 h-3" /></motion.span> Instant AI Generation
              </motion.div>
              <motion.h1 variants={stagger} className="text-3xl md:text-4xl lg:text-5xl font-bold tracking-tight leading-[1.1]" style={{ fontFamily: "'Playfair Display', serif" }}>
                {['Create', 'branded'].map((word) => <motion.span key={word} variants={rise} className="inline-block mr-[0.25em]">{word}</motion.span>)}
                {['sign-up', 'forms'].map((word) => (
                  <motion.span key={word} variants={rise} className="inline-block mr-[0.25em] bg-clip-text text-transparent bg-[length:200%_auto]"
                    style={{ backgroundImage: 'linear-gradient(135deg, #a855f7, #06b6d4, #a855f7)' }}
                    animate={{ backgroundPosition: ['0% 50%', '100% 50%', '0% 50%'] }} transition={{ backgroundPosition: { duration: 6, repeat: Infinity, ease: 'linear' } }}>
                    {word}
                  </motion.span>
                ))}
              </motion.h1>
            </div>
            <motion.p variants={rise} className="text-muted-foreground text-sm md:text-base max-w-md leading-relaxed">
              Enter influencer or event details and get a fully branded Physique 57 form with Momence integration & UTM tracking.
            </motion.p>
          </motion.header>

          {/* Builder */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
            {/* Section index */}
            <div className="hidden lg:block lg:col-span-2">
              <div className="sticky top-6 rounded-2xl bg-card/50 border border-border/40 p-4">
                <BuilderRail sections={sectionMeta} activeId={activeSection} onJump={jumpTo} />
              </div>
            </div>

            {/* Form builder */}
            <motion.section initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15, duration: 0.6, ease: EASE }}
              className="lg:col-span-6 rounded-2xl bg-card/70 border border-border/40 overflow-hidden">
              <motion.div className="h-1 bg-[length:200%_100%]" style={{ backgroundImage: 'linear-gradient(90deg, #a855f7, #06b6d4, #f97316, #a855f7)' }}
                animate={{ backgroundPosition: ['0% 0%', '200% 0%'] }} transition={{ duration: 8, repeat: Infinity, ease: 'linear' }} />
              <div className="p-5 md:p-7 space-y-9">
                {sectionMeta.map((meta, index) => (
                  <Section key={meta.id} id={meta.id} index={index + 1} title={meta.title} hint={meta.hint}
                    action={meta.id === 'studios'
                      ? <SelectAll clearLabel="Reset" allSelected={studios.length === ALL_STUDIOS.length} onToggle={(all) => setStudios(all ? [...ALL_STUDIOS] : [ALL_STUDIOS[0]])} />
                      : meta.id === 'formats'
                        ? <SelectAll allSelected={availableFormats.every((format) => effectiveFormats.includes(format))} onToggle={(all) => setFormats(all ? [...availableFormats] : [])} />
                        : undefined}>
                    {meta.id === 'type' && (
                      <>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3" role="radiogroup" aria-label="Signup flow">
                          {SIGNUP_FLOWS.map((option) => (
                            <OptionTile key={option.value} group="flow" selected={signupType === option.value} onSelect={() => setSignupType(option.value)}>
                              <option.icon className="w-4 h-4 mb-3" style={{ color: signupType === option.value ? '#a855f7' : undefined }} />
                              <span className="block text-sm font-semibold">{option.label}</span>
                              <span className="block text-xs text-muted-foreground mt-0.5">{option.desc}</span>
                            </OptionTile>
                          ))}
                        </div>
                      </>
                    )}
                    {meta.id === 'campaign' && (
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
                              <Input id="event-date" type="date" value={eventDate} onChange={(e) => setEventDate(e.target.value)} className={`${fieldClass} [color-scheme:dark]`} />
                            </div>
                            <div>
                              <Label htmlFor="event-time" className={labelClass}>Start time</Label>
                              <Input id="event-time" type="time" value={eventTime} onChange={(e) => setEventTime(e.target.value)} className={`${fieldClass} [color-scheme:dark]`} />
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
                    {meta.id === 'studios' && (
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
                    {meta.id === 'formats' && (
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
                    {meta.id === 'booking' && (
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
                                    className={`${fieldClass} w-40 shrink-0 rounded-md border px-2 [color-scheme:dark]`}>
                                    {studios.map((studio) => <option key={studio} value={studio}>{shortStudio(studio)}</option>)}
                                  </select>
                                )}
                              </div>
                            ) : (
                              <div className="relative">
                                <select id="momence-class" value={selectedKey} onChange={(e) => chooseSession(e.target.value)} disabled={sessionsState === 'loading'}
                                  className={`${fieldClass} w-full rounded-md border px-3 pr-9 appearance-none [color-scheme:dark] disabled:opacity-60`}>
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
                    {meta.id === 'slots' && (
                      <>
                        <SlotWizard booking={slotBooking} onBookingChange={setSlotBooking} slots={slotDrafts} onSlotsChange={setSlotDrafts}
                          fieldClass={fieldClass} labelClass={labelClass} defaultDate={eventDate} />
                      </>
                    )}
                    {meta.id === 'hero' && (
                      <HeroPicker images={heroPool} value={heroImage} onChange={setHeroImage} />
                    )}
                    {meta.id === 'tracking' && (
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
                                className="text-[11px] font-semibold uppercase tracking-wider text-purple-400 hover:text-purple-300 transition-colors">
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
                  </Section>
                ))}
              </div>
            </motion.section>

            {/* Summary + preview */}
            <motion.aside initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3, duration: 0.6, ease: EASE }}
              className="lg:col-span-4 space-y-5 lg:sticky lg:top-6 self-start">
              <div className="rounded-2xl bg-card/70 border border-border/40 p-5 md:p-6">
                <div className="flex items-center gap-2 mb-5">
                  <div className="w-2 h-2 rounded-full animate-pulse" style={{ background: '#22c55e', boxShadow: '0 0 8px rgba(34,197,94,0.5)' }} />
                  <span className="text-xs text-muted-foreground font-medium tracking-wide uppercase">New Form</span>
                </div>
                <dl className="grid grid-cols-2 gap-3 mb-6">
                  <SummaryItem label="Partner" value={influencer.trim() || '—'} span />
                  <SummaryItem label="Event" value={eventTitle.trim() || '—'} span />
                  <SummaryItem label="Flow" value={flow.label} />
                  <SummaryItem label="City" value={cities.join(' + ') || '—'} />
                  <SummaryItem label="Studios" value={studioSummary} span />
                  <SummaryItem label="Formats" value={effectiveFormats.join(', ') || 'Any'} span />
                  <SummaryItem label="When" value={eventDate ? new Date(`${eventDate}T${eventTime || '00:00'}`).toLocaleString('en-IN', { day: 'numeric', month: 'short', ...(eventTime ? { hour: 'numeric', minute: '2-digit' } : {}) }) : '—'} />
                  <SummaryItem label="Limit" value={submissionLimit ? `${submissionLimit} sign-ups` : 'Unlimited'} />
                  <SummaryItem label="Hero" value={heroImage ? 'Chosen' : 'Auto'} />
                  <SummaryItem label="Slots" value={slotBooking.enabled ? `${slotDrafts.length} · ${slotDrafts.reduce((sum, slot) => sum + (Number(slot.capacity) || 0), 0)} spots` : 'Off'} />
                  <SummaryItem label="Class" value={selectedSession ? `${sessionDay(selectedSession)} ${sessionTime(selectedSession)}` : sessionId || (signupType === 'paid' ? 'Required' : 'None')} />
                </dl>
                <motion.div whileHover={canGenerate ? { scale: 1.02 } : undefined} whileTap={canGenerate ? { scale: 0.98 } : undefined}>
                  <Button onClick={handleGenerate} disabled={loading || !canGenerate}
                    className="relative w-full h-12 gap-2 rounded-xl text-sm tracking-wider uppercase font-extrabold text-[#ffffff] shadow-lg hover:shadow-xl transition-shadow overflow-hidden"
                    size="lg" style={{ background: 'linear-gradient(135deg, #a855f7, #7c3aed)', border: 'none' }}>
                    {canGenerate && !loading && (
                      <motion.span aria-hidden className="absolute inset-y-0 w-1/3 -skew-x-12 bg-gradient-to-r from-transparent via-white/25 to-transparent"
                        initial={{ left: '-40%' }} animate={{ left: '140%' }} transition={{ duration: 1.6, repeat: Infinity, repeatDelay: 1.2, ease: 'easeInOut' }} />
                    )}
                    <span className="relative flex items-center gap-2">
                      {loading ? <><Loader2 className="w-4 h-4 animate-spin" />Generating...</> : <>Generate Form<ArrowRight className="w-4 h-4" /></>}
                    </span>
                  </Button>
                </motion.div>
                <p className="text-center text-[10px] mt-3 tracking-wider uppercase text-foreground opacity-[0.35]">
                  Powered by AI · Instant generation
                </p>
              </div>
              <div className="rounded-2xl bg-card/70 border border-border/40 p-5">
                {heroImage ? (
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <span className="flex items-center gap-1.5 text-[10px] uppercase tracking-[0.25em] text-muted-foreground/50 font-medium">
                        <ImageIcon className="w-3 h-3" /> Hero
                      </span>
                      <button type="button" onClick={() => jumpTo('hero')}
                        className="text-[10px] font-semibold uppercase tracking-wider text-purple-400 hover:text-purple-300 transition-colors">
                        Change
                      </button>
                    </div>
                    <div className="relative w-full aspect-[16/10] rounded-xl overflow-hidden shadow-2xl"
                      style={{ border: '1px solid rgba(168,85,247,0.15)' }}>
                      <img src={heroImage} alt="" className="absolute inset-0 w-full h-full object-cover" />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-black/5" />
                    </div>
                  </div>
                ) : (
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <span className="flex items-center gap-1.5 text-[10px] uppercase tracking-[0.25em] text-muted-foreground/50 font-medium">
                        <ImageIcon className="w-3 h-3" /> Hero
                      </span>
                      <button type="button" onClick={() => jumpTo('hero')}
                        className="text-[10px] font-semibold uppercase tracking-wider text-purple-400 hover:text-purple-300 transition-colors">
                        Choose
                      </button>
                    </div>
                    <div className="relative w-full aspect-[16/10] rounded-xl overflow-hidden"
                      style={{ border: '1px dashed rgba(255,255,255,0.12)' }}>
                      <img src={heroPool[0]} alt="" className="absolute inset-0 w-full h-full object-cover opacity-30" />
                      <div className="absolute inset-0 flex items-center justify-center px-6 text-center">
                        <p className="text-xs text-muted-foreground leading-relaxed">
                          We pick one of {heroPool.length} images unless you choose.
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </motion.aside>

            {/* Features */}
            {[
              { icon: <Zap className="w-5 h-5" />, title: 'Instant Forms', desc: 'Enter influencer/event details — get a branded form with all required fields, hero images & layouts.', accent: '#a855f7' },
              { icon: <Share2 className="w-5 h-5" />, title: 'Momence Integration', desc: 'Every submission pushes leads to Momence with full UTM tracking for Mumbai & Bengaluru studios.', accent: '#06b6d4' },
              { icon: <BarChart3 className="w-5 h-5" />, title: 'Track Everything', desc: 'View every submission with full details — name, email, phone, center, class type & UTM data.', accent: '#f97316' },
            ].map((f, i) => (
              <motion.div key={f.title} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 + i * 0.1, duration: 0.6, ease: EASE }}
                whileHover={{ y: -4 }}
                className="lg:col-span-4 flex gap-4 p-5 rounded-2xl bg-card/40 border border-border/30 hover:bg-card/70 hover:border-border/60 transition-colors">
                <div className="w-10 h-10 shrink-0 rounded-xl flex items-center justify-center" style={{ background: `${f.accent}15`, color: f.accent }}>
                  {f.icon}
                </div>
                <div>
                  <h3 className="font-semibold mb-1 text-sm">{f.title}</h3>
                  <p className="text-muted-foreground text-sm leading-relaxed">{f.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </main>

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

function Section({ id, index, title, hint, action, children }: { id: string; index: number; title: string; hint: string; action?: React.ReactNode; children: React.ReactNode }) {
  return (
    <section id={`section-${id}`} className="scroll-mt-24">
      <div className="flex items-baseline gap-3 mb-4 pb-3 border-b border-border/30">
        <span className="text-xs font-bold tabular-nums" style={{ color: '#a855f7' }}>{String(index).padStart(2, '0')}</span>
        <h2 className="text-sm font-semibold uppercase tracking-wider">{title}</h2>
        <span className="ml-auto text-xs text-muted-foreground/70 hidden sm:inline text-right">{hint}</span>
        {action}
      </div>
      {children}
    </section>
  );
}

function OptionTile({ group, selected, onSelect, disabled, flush, multi, children }: { group: string; selected: boolean; onSelect: () => void; disabled?: boolean; flush?: boolean; multi?: boolean; children: React.ReactNode }) {
  return (
    <motion.button type="button" role={multi ? 'checkbox' : 'radio'} aria-checked={selected} aria-disabled={disabled} disabled={disabled} onClick={onSelect}
      whileHover={disabled ? undefined : { y: -2 }} whileTap={disabled ? undefined : { scale: 0.98 }}
      className={`group relative text-left rounded-xl border transition-colors ${flush ? '' : 'p-4 pr-8'} ${disabled ? 'opacity-40 cursor-not-allowed border-border/40 bg-muted/10' : selected ? 'border-purple-500/60' : 'border-border/50 bg-muted/20 hover:border-border hover:bg-muted/40'}`}>
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
            <Check className="w-3.5 h-3.5" style={{ color: '#a855f7' }} />
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
      className="text-[11px] font-semibold uppercase tracking-wider text-purple-400 hover:text-purple-300 transition-colors">
      {allSelected ? clearLabel : 'Select all'}
    </button>
  );
}

function SummaryItem({ label, value, span }: { label: string; value: string; span?: boolean }) {
  return (
    <div className={`rounded-lg bg-muted/20 border border-border/30 px-3 py-2.5 min-w-0 ${span ? 'col-span-2' : ''}`}>
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

