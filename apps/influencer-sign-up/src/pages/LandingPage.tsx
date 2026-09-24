import { useState, useEffect, useRef, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@project/components/ui/button';
import { Input } from '@project/components/ui/input';
import { Label } from '@project/components/ui/label';
import { Textarea } from '@project/components/ui/textarea';
import { Loader2, ArrowRight, Sparkles, Zap, Share2, BarChart3, ChevronLeft, ChevronRight, Check, MapPin, Gift, CreditCard, Baby, Shuffle } from 'lucide-react';
import { generateForm } from '@/lib/api';
import { toast } from 'sonner';
import { BRAND_LOGO, HERO_IMAGES } from '@/lib/constants';
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

type ClassFormat = '' | 'Barre' | 'Strength Lab' | 'powerCycle';

// Indexes into HERO_IMAGES that picture each format; the server picks form heroes from the same sets.
const CLASS_FORMATS: { value: Exclude<ClassFormat, ''>; desc: string; images: number[] }[] = [
  { value: 'Barre', desc: 'Signature interval overload', images: [1, 2, 8] },
  { value: 'Strength Lab', desc: 'Targeted weight training', images: [3, 4, 5, 6] },
  { value: 'powerCycle', desc: 'High-intensity rhythm ride', images: [0, 7] },
];
const formatsForStudio = (studio: string) => (/bengaluru/i.test(studio) ? ['Barre'] : CLASS_FORMATS.map((f) => f.value));

const EASE = [0.16, 1, 0.3, 1] as const;
const stagger: Variants = { hidden: {}, show: { transition: { staggerChildren: 0.08, delayChildren: 0.1 } } };
const rise: Variants = { hidden: { opacity: 0, y: 18 }, show: { opacity: 1, y: 0, transition: { duration: 0.6, ease: EASE } } };

const fieldClass = 'h-11 bg-muted/30 border-border/50 focus:border-purple-500/40 transition-colors text-sm';
const labelClass = 'text-[11px] uppercase tracking-wider mb-2 block font-bold text-muted-foreground';

export default function LandingPage() {
  const [influencer, setInfluencer] = useState('');
  const [eventTitle, setEventTitle] = useState('');
  const [eventDetails, setEventDetails] = useState('');
  const [signupType, setSignupType] = useState<SignupType>('free');
  const [targetStudio, setTargetStudio] = useState('Kwality House, Kemps Corner');
  const [sessionId, setSessionId] = useState('');
  const [classFormat, setClassFormat] = useState<ClassFormat>('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const availableFormats = formatsForStudio(targetStudio);
  const effectiveFormat: ClassFormat = signupType === 'kids' || !availableFormats.includes(classFormat) ? '' : classFormat;
  const carouselImages = useMemo(() => effectiveFormat ? CLASS_FORMATS.find((f) => f.value === effectiveFormat)!.images.map((index) => HERO_IMAGES[index]) : HERO_IMAGES, [effectiveFormat]);

  const city = STUDIOS_BY_CITY.find((group) => group.studios.includes(targetStudio))?.city || 'Mumbai';
  const flow = SIGNUP_FLOWS.find((option) => option.value === signupType)!;
  const canGenerate = Boolean(influencer.trim() || eventTitle.trim()) && (signupType !== 'paid' || /^\d+$/.test(sessionId.trim()));

  const handleGenerate = async () => {
    if (!influencer.trim() && !eventTitle.trim()) {
      toast.error('Please enter an influencer name or event title');
      return;
    }
    setLoading(true);
    try {
      const prompt = [influencer.trim() && `Influencer/Partner: ${influencer.trim()}`, eventTitle.trim() && `Event: ${eventTitle.trim()}`, eventDetails.trim() && `Details: ${eventDetails.trim()}`].filter(Boolean).join(' | ');
      if (signupType === 'paid' && !/^\d+$/.test(sessionId.trim())) {
        toast.error('Paid signups require a valid Momence session ID');
        return;
      }
      const { form } = await generateForm({ prompt, creatorEmail: '', signupType, targetStudio, sessionId: sessionId.trim(), classFormat: effectiveFormat });
      toast.success('Form created!');
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
            <img src={BRAND_LOGO} alt="Physique 57" className="h-7 brightness-0 invert" />
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

          {/* Bento grid */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
            {/* Form builder */}
            <motion.section initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15, duration: 0.6, ease: EASE }}
              className="lg:col-span-8 rounded-2xl bg-card/70 border border-border/40 overflow-hidden">
              <motion.div className="h-1 bg-[length:200%_100%]" style={{ backgroundImage: 'linear-gradient(90deg, #a855f7, #06b6d4, #f97316, #a855f7)' }}
                animate={{ backgroundPosition: ['0% 0%', '200% 0%'] }} transition={{ duration: 8, repeat: Infinity, ease: 'linear' }} />
              <motion.div className="p-5 md:p-7 space-y-8" initial="hidden" animate="show" variants={stagger}>
                <FormSection step="01" title="Campaign" hint="Who is this form for?">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label className={labelClass}>Influencer / Partner Name *</Label>
                      <Input value={influencer} onChange={(e) => setInfluencer(e.target.value)} placeholder="e.g. Maia Sethna, Shilpa Shetty" className={fieldClass} />
                    </div>
                    <div>
                      <Label className={labelClass}>Event Title</Label>
                      <Input value={eventTitle} onChange={(e) => setEventTitle(e.target.value)} placeholder="e.g. Open House, Exclusive Barre Class" className={fieldClass} />
                    </div>
                    <div className="md:col-span-2">
                      <Label className={labelClass}>Event Details (optional)</Label>
                      <Textarea value={eventDetails} onChange={(e) => setEventDetails(e.target.value)} placeholder="Venue, date, time, any special notes..."
                        rows={3} className="resize-none bg-muted/30 border-border/50 focus:border-purple-500/40 transition-colors text-sm" />
                    </div>
                  </div>
                </FormSection>

                <FormSection step="02" title="Signup flow" hint="What happens after submit">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3" role="radiogroup" aria-label="Signup flow">
                    {SIGNUP_FLOWS.map((option) => (
                      <OptionTile key={option.value} group="flow" selected={signupType === option.value} onSelect={() => setSignupType(option.value)}>
                        <option.icon className="w-4 h-4 mb-3" style={{ color: signupType === option.value ? '#a855f7' : undefined }} />
                        <span className="block text-sm font-semibold">{option.label}</span>
                        <span className="block text-xs text-muted-foreground mt-0.5">{option.desc}</span>
                      </OptionTile>
                    ))}
                  </div>
                </FormSection>

                <FormSection step="03" title="Studio" hint="Routes leads to the right Momence account">
                  <div className="space-y-4">
                    {STUDIOS_BY_CITY.map((group) => (
                      <div key={group.city}>
                        <span className="flex items-center gap-1.5 text-[11px] uppercase tracking-wider text-muted-foreground/70 mb-2">
                          <MapPin className="w-3 h-3" /> {group.city}
                        </span>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3" role="radiogroup" aria-label={`${group.city} studios`}>
                          {group.studios.map((studio) => (
                            <OptionTile key={studio} group="studio" selected={targetStudio === studio} onSelect={() => setTargetStudio(studio)}>
                              <span className="block text-sm font-semibold leading-snug">{studio.replace(/, Bengaluru$/, '')}</span>
                            </OptionTile>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </FormSection>

                <FormSection step="04" title="Class format" hint={signupType === 'kids' ? 'Not used for Juniors forms' : 'Optional · shapes the form, images & class list'}>
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-3" role="radiogroup" aria-label="Class format">
                    <OptionTile group="format" selected={effectiveFormat === ''} onSelect={() => setClassFormat('')} disabled={signupType === 'kids'}>
                      <Shuffle className="w-4 h-4 mb-3 text-muted-foreground" />
                      <span className="block text-sm font-semibold">Any format</span>
                      <span className="block text-xs text-muted-foreground mt-0.5">Guest picks in the form</span>
                    </OptionTile>
                    {CLASS_FORMATS.map((option) => {
                      const unavailable = signupType === 'kids' || !availableFormats.includes(option.value);
                      return (
                        <OptionTile key={option.value} group="format" selected={effectiveFormat === option.value} onSelect={() => setClassFormat(option.value)} disabled={unavailable} flush>
                          <div className="relative h-16 overflow-hidden rounded-t-[11px]">
                            <img src={HERO_IMAGES[option.images[0]]} alt="" className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
                            <div className="absolute inset-0 bg-gradient-to-t from-card via-card/40 to-transparent" />
                          </div>
                          <div className="px-4 pb-4 -mt-2 relative">
                            <span className="block text-sm font-semibold">{option.value}</span>
                            <span className="block text-xs text-muted-foreground mt-0.5">{unavailable && signupType !== 'kids' ? 'Not at this studio' : option.desc}</span>
                          </div>
                        </OptionTile>
                      );
                    })}
                  </div>
                </FormSection>

                <FormSection step="05" title="Class booking" hint={signupType === 'paid' ? 'Required for paid signups' : 'Optional auto-booking'}>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-start">
                    <div>
                      <Label className={labelClass}>Momence Session ID {signupType === 'paid' ? '*' : '(optional)'}</Label>
                      <Input inputMode="numeric" value={sessionId} onChange={(e) => setSessionId(e.target.value.replace(/\D/g, ''))}
                        placeholder={signupType === 'paid' ? 'Required for payment and booking' : 'Auto-book after signup'} className={fieldClass} />
                    </div>
                    <p className="text-xs text-muted-foreground leading-relaxed md:pt-7">
                      Free and paid forms auto-book this exact class after signup. Paid forms require it.
                    </p>
                  </div>
                </FormSection>
              </motion.div>
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
                  <SummaryItem label="City" value={city} />
                  <SummaryItem label="Studio" value={targetStudio} span />
                  <SummaryItem label="Format" value={effectiveFormat || 'Any'} />
                  <SummaryItem label="Session" value={sessionId || (signupType === 'paid' ? 'Required' : 'None')} />
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
                <ImageCarousel images={carouselImages} label={effectiveFormat ? `${effectiveFormat} heroes` : 'Hero Images'} />
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

function FormSection({ step, title, hint, children }: { step: string; title: string; hint: string; children: React.ReactNode }) {
  return (
    <motion.section variants={rise}>
      <div className="flex items-baseline gap-3 mb-4 pb-3 border-b border-border/30">
        <span className="text-xs font-bold tabular-nums" style={{ color: '#a855f7' }}>{step}</span>
        <h2 className="text-sm font-semibold uppercase tracking-wider">{title}</h2>
        <span className="ml-auto text-xs text-muted-foreground/70 hidden sm:inline">{hint}</span>
      </div>
      {children}
    </motion.section>
  );
}

function OptionTile({ group, selected, onSelect, disabled, flush, children }: { group: string; selected: boolean; onSelect: () => void; disabled?: boolean; flush?: boolean; children: React.ReactNode }) {
  return (
    <motion.button type="button" role="radio" aria-checked={selected} aria-disabled={disabled} disabled={disabled} onClick={onSelect}
      whileHover={disabled ? undefined : { y: -2 }} whileTap={disabled ? undefined : { scale: 0.98 }}
      className={`group relative text-left rounded-xl border transition-colors ${flush ? '' : 'p-4 pr-8'} ${disabled ? 'opacity-40 cursor-not-allowed border-border/40 bg-muted/10' : selected ? 'border-purple-500/60' : 'border-border/50 bg-muted/20 hover:border-border hover:bg-muted/40'}`}>
      {selected && !disabled && (
        <motion.span layoutId={`tile-${group}`} className="absolute inset-0 rounded-[11px] bg-purple-500/[0.1] ring-1 ring-purple-500/40"
          transition={{ type: 'spring', stiffness: 420, damping: 34 }} />
      )}
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

/* ── Image Carousel ── */
function ImageCarousel({ images, label }: { images: string[]; label: string }) {
  const [current, setCurrent] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval>>();

  useEffect(() => {
    setCurrent(0);
    intervalRef.current = setInterval(() => setCurrent((p) => (p + 1) % images.length), 3500);
    return () => clearInterval(intervalRef.current);
  }, [images]);

  const go = (dir: 1 | -1) => {
    setCurrent((p) => (p + dir + images.length) % images.length);
    clearInterval(intervalRef.current);
    intervalRef.current = setInterval(() => setCurrent((p) => (p + 1) % images.length), 3500);
  };

  const resetInterval = () => {
    clearInterval(intervalRef.current);
    intervalRef.current = setInterval(() => setCurrent((p) => (p + 1) % images.length), 3500);
  };

  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-3">
        <span className="text-[10px] uppercase tracking-[0.25em] text-muted-foreground/50 font-medium">{label}</span>
        <span className="text-[10px] text-muted-foreground/30 tabular-nums">{current + 1} / {images.length}</span>
      </div>

      <div className="relative group">
        <div className="relative w-full aspect-[16/10] rounded-xl overflow-hidden shadow-2xl"
          style={{ border: '1px solid rgba(168,85,247,0.15)', boxShadow: '0 12px 48px rgba(168,85,247,0.06), 0 4px 16px rgba(0,0,0,0.3)' }}>
          <AnimatePresence mode="wait">
            <motion.img key={current} src={images[current % images.length]} alt=""
              className="absolute inset-0 w-full h-full object-cover"
              initial={{ opacity: 0, scale: 1.06 }} animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.98 }} transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }} />
          </AnimatePresence>
          <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-black/5" />

          <button onClick={() => go(-1)}
            className="absolute left-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full backdrop-blur-xl flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-200 hover:scale-110"
            style={{ background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.15)' }}>
            <ChevronLeft className="w-4 h-4 text-white" />
          </button>
          <button onClick={() => go(1)}
            className="absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full backdrop-blur-xl flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-200 hover:scale-110"
            style={{ background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.15)' }}>
            <ChevronRight className="w-4 h-4 text-white" />
          </button>
        </div>

        {/* Thumbnail strip */}
        <div className="flex items-center gap-2 mt-3">
          {images.map((img, i) => (
            <button key={i} onClick={() => { setCurrent(i); resetInterval(); }}
              className="relative flex-1 aspect-[3/2] rounded-lg overflow-hidden transition-all duration-300"
              style={{
                opacity: i === current ? 1 : 0.35,
                border: i === current ? '2px solid rgba(168,85,247,0.5)' : '1px solid rgba(255,255,255,0.06)',
                transform: i === current ? 'scale(1)' : 'scale(0.95)',
                boxShadow: i === current ? '0 0 12px rgba(168,85,247,0.15)' : 'none',
              }}>
              <img src={img} alt="" className="w-full h-full object-cover" />
              {i === current && (
                <motion.div className="absolute bottom-0 left-0 right-0 h-0.5"
                  style={{ background: 'linear-gradient(90deg, #a855f7, #06b6d4)' }}
                  initial={{ scaleX: 0, originX: 0 }} animate={{ scaleX: 1 }}
                  transition={{ duration: 3.5, ease: 'linear' }} />
              )}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
