import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@project/components/ui/button';
import { Input } from '@project/components/ui/input';
import { Label } from '@project/components/ui/label';
import { Textarea } from '@project/components/ui/textarea';
import { Loader2, ArrowRight, Sparkles, Zap, Share2, BarChart3, ChevronLeft, ChevronRight } from 'lucide-react';
import { generateForm } from '@/lib/api';
import { toast } from 'sonner';
import { BRAND_LOGO, HERO_IMAGES } from '@/lib/constants';
import { motion, AnimatePresence } from 'framer-motion';

export default function LandingPage() {
  const [influencer, setInfluencer] = useState('');
  const [eventTitle, setEventTitle] = useState('');
  const [eventDetails, setEventDetails] = useState('');
  const [signupType, setSignupType] = useState<'kids' | 'free' | 'paid'>('free');
  const [targetStudio, setTargetStudio] = useState('Kwality House, Kemps Corner');
  const [sessionId, setSessionId] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

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
      const { form } = await generateForm({ prompt, creatorEmail: '', signupType, targetStudio, sessionId: sessionId.trim() });
      toast.success('Form created!');
      navigate(`/form/${form.id}/preview`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to generate form. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      {/* Subtle ambient glow */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-60 right-[-10%] w-[700px] h-[700px] rounded-full opacity-[0.06]"
          style={{ background: 'radial-gradient(circle, #a855f7 0%, transparent 70%)' }} />
        <div className="absolute bottom-[-15%] left-[-10%] w-[600px] h-[600px] rounded-full opacity-[0.05]"
          style={{ background: 'radial-gradient(circle, #06b6d4 0%, transparent 70%)' }} />
      </div>

      {/* Nav */}
      <nav className="relative z-50 border-b border-border/30 bg-background/80 backdrop-blur-md">
        <div className="container mx-auto h-16 flex items-center justify-between px-4 py-10">
          <motion.div className="flex items-center gap-3" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}>
            <img src={BRAND_LOGO} alt="Physique 57" className="h-8 brightness-0 invert" />
            <div className="h-5 w-px bg-border/50" />
            <span className="text-xs font-medium tracking-wider uppercase text-muted-foreground">Lead Capture</span>
          </motion.div>
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 }}>
            <Button variant="outline" onClick={() => navigate('/dashboard')} className="text-sm gap-2 border-border/50 hover:border-primary/40 font-semibold text-[#03c4ff] shadow-none">
              <BarChart3 className="w-3.5 h-3.5" /> My Forms
            </Button>
          </motion.div>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative z-10 flex-1">
        <div className="container mx-auto px-4 md:px-6 lg:px-8 py-10 md:py-16 lg:py-20">
          <div className="w-full max-w-7xl mx-auto flex flex-col lg:flex-row items-center gap-10 lg:gap-16">
            {/* Left — copy + carousel */}
            <div className="flex-1 text-center lg:text-left min-w-0">
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}
                className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full mb-6 text-xs font-medium tracking-wider uppercase"
                style={{ background: 'rgba(168,85,247,0.08)', border: '1px solid rgba(168,85,247,0.15)', color: 'rgba(168,85,247,0.9)' }}>
                <Sparkles className="w-3 h-3" /> Instant AI Generation
              </motion.div>

              <motion.h1 initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1, duration: 0.7 }}
                className="text-4xl md:text-5xl lg:text-[3.5rem] font-bold tracking-tight leading-[1.1] mb-5"
                style={{ fontFamily: "'Playfair Display', serif" }}>
                Create branded<br />
                <span className="bg-clip-text text-transparent" style={{ backgroundImage: 'linear-gradient(135deg, #a855f7, #06b6d4)' }}>sign-up forms</span><br />
                in seconds
              </motion.h1>

              <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.25 }}
                className="text-muted-foreground text-base md:text-lg max-w-lg mx-auto lg:mx-0 leading-relaxed mb-10">
                Enter influencer or event details and get a fully branded Physique 57 form with Momence integration & UTM tracking.
              </motion.p>

              {/* Image carousel */}
              <ImageCarousel />
            </div>

            {/* Right — form card */}
            <motion.div initial={{ opacity: 0, y: 24, scale: 0.97 }} animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ delay: 0.2, duration: 0.6 }}
              className="w-full lg:w-[460px] shrink-0">
              <div className="relative">
                {/* Glow */}
                <div className="absolute -inset-2 rounded-3xl opacity-20 blur-3xl"
                  style={{ background: 'linear-gradient(135deg, rgba(168,85,247,0.2), rgba(6,182,212,0.2))' }} />
                <div className="relative bg-card rounded-2xl shadow-2xl overflow-hidden"
                  style={{ border: '1px solid rgba(168,85,247,0.12)' }}>
                  {/* Accent bar */}
                  <div className="h-1" style={{ background: 'linear-gradient(90deg, #a855f7, #06b6d4, #f97316)' }} />
                  <div className="p-7 md:p-9">
                    <div className="flex items-center gap-2 mb-7">
                      <div className="w-2 h-2 rounded-full animate-pulse"
                        style={{ background: '#22c55e', boxShadow: '0 0 8px rgba(34,197,94,0.5)' }} />
                      <span className="text-xs text-muted-foreground font-medium tracking-wide uppercase">New Form</span>
                    </div>

                    <div className="space-y-6">
                      <div>
                        <Label className="text-xs uppercase tracking-wider mb-2 block font-extrabold text-primary">Influencer / Partner Name *</Label>
                        <Input value={influencer} onChange={(e) => setInfluencer(e.target.value)}
                          placeholder="e.g. Maia Sethna, Shilpa Shetty"
                          className="h-12 bg-muted/30 border-border/50 focus:border-purple-500/40 transition-colors text-xs" />
                      </div>
                      <div>
                        <Label className="text-xs uppercase tracking-wider mb-2 block font-extrabold text-primary">Event Title</Label>
                        <Input value={eventTitle} onChange={(e) => setEventTitle(e.target.value)}
                          placeholder="e.g. Open House, Exclusive Barre Class"
                          className="h-12 bg-muted/30 border-border/50 focus:border-cyan-500/40 transition-colors text-xs" />
                      </div>
                      <div>
                        <Label className="text-xs uppercase tracking-wider mb-2 block font-extrabold text-primary">Event Details (optional)</Label>
                        <Textarea value={eventDetails} onChange={(e) => setEventDetails(e.target.value)}
                          placeholder="Venue, date, time, any special notes..."
                          rows={4} className="resize-none bg-muted/30 border-border/50 focus:border-orange-500/40 transition-colors text-xs" />
                      </div>
                      <div>
                        <Label className="text-xs uppercase tracking-wider mb-2 block font-extrabold text-primary">Signup flow *</Label>
                        <select value={signupType} onChange={(e) => setSignupType(e.target.value as 'kids' | 'free' | 'paid')} className="h-12 w-full rounded-md bg-muted/30 border border-border/50 px-3 text-xs">
                          <option value="kids">Kids / Juniors signup</option><option value="free">Regular free signup</option><option value="paid">Paid signup</option>
                        </select>
                      </div>
                      <div>
                        <Label className="text-xs uppercase tracking-wider mb-2 block font-extrabold text-primary">Studio *</Label>
                        <select value={targetStudio} onChange={(e) => setTargetStudio(e.target.value)} className="h-12 w-full rounded-md bg-muted/30 border border-border/50 px-3 text-xs">
                          {['Kwality House, Kemps Corner','Supreme HQ, Bandra','Kenkere House, Bengaluru','The Studio by Copper & Cloves, Bengaluru','Sadashivnagar, Bengaluru'].map((studio) => <option key={studio}>{studio}</option>)}
                        </select>
                      </div>
                      <div>
                        <Label className="text-xs uppercase tracking-wider mb-2 block font-extrabold text-primary">Momence Session ID {signupType === 'paid' ? '*' : '(optional)'}</Label>
                        <Input inputMode="numeric" value={sessionId} onChange={(e) => setSessionId(e.target.value.replace(/\D/g, ''))} placeholder={signupType === 'paid' ? 'Required for payment and booking' : 'Auto-book after signup'} className="h-12 bg-muted/30 border-border/50 text-xs" />
                        <p className="mt-1.5 text-[10px] text-muted-foreground">Free and paid forms auto-book this exact class after signup. Paid forms require it.</p>
                      </div>
                    </div>

                    <div className="pt-7">
                      <Button onClick={handleGenerate}
                        disabled={loading || (!influencer.trim() && !eventTitle.trim())}
                        className="w-full h-14 gap-2 rounded-xl text-sm tracking-wider uppercase relative overflow-hidden font-extrabold text-[#ffffff] shadow-lg hover:shadow-xl transition-shadow"
                        size="lg"
                        style={{ background: 'linear-gradient(135deg, #a855f7, #7c3aed)', border: 'none' }}>
                        <div className="relative z-10 flex items-center gap-2">
                          {loading ? <><Loader2 className="w-4 h-4 animate-spin" />Generating...</> : <>Generate Form<ArrowRight className="w-4 h-4" /></>}
                        </div>
                      </Button>
                      <p className="text-center text-[10px] mt-4 tracking-wider uppercase text-foreground opacity-[0.35]">
                        Powered by AI · Instant generation
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="relative z-10 py-16 md:py-20">
        <div className="container mx-auto px-4">
          <motion.div initial={{ opacity: 0, y: 12 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
            className="text-center mb-12">
            <span className="text-xs uppercase tracking-[0.3em] font-medium px-4 py-1.5 rounded-full inline-block mb-4"
              style={{ color: 'rgba(6,182,212,0.8)', background: 'rgba(6,182,212,0.08)', border: '1px solid rgba(6,182,212,0.15)' }}>
              How it works
            </span>
          </motion.div>
          <div className="grid md:grid-cols-3 gap-5 max-w-4xl mx-auto">
            {[
              { icon: <Zap className="w-5 h-5" />, title: 'Instant Forms', desc: 'Enter influencer/event details — get a branded form with all required fields, hero images & layouts.', num: '01', accent: '#a855f7' },
              { icon: <Share2 className="w-5 h-5" />, title: 'Momence Integration', desc: 'Every submission pushes leads to Momence with full UTM tracking for Mumbai & Bengaluru studios.', num: '02', accent: '#06b6d4' },
              { icon: <BarChart3 className="w-5 h-5" />, title: 'Track Everything', desc: 'View every submission with full details — name, email, phone, center, class type & UTM data.', num: '03', accent: '#f97316' },
            ].map((f, i) => (
              <motion.div key={i} initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="group relative p-6 rounded-2xl bg-card/50 transition-all hover:bg-card overflow-hidden"
                style={{ border: `1px solid rgba(${f.accent === '#a855f7' ? '168,85,247' : f.accent === '#06b6d4' ? '6,182,212' : '249,115,22'},0.15)` }}>
                <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity"
                  style={{ background: `radial-gradient(circle at top right, ${f.accent}08 0%, transparent 60%)` }} />
                <span className="absolute top-5 right-5 text-[40px] font-bold leading-none opacity-[0.06]"
                  style={{ fontFamily: "'Playfair Display', serif" }}>{f.num}</span>
                <div className="relative z-10">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-4 transition-colors"
                    style={{ background: `${f.accent}15`, color: f.accent }}>
                    {f.icon}
                  </div>
                  <h3 className="font-semibold mb-1.5 text-sm">{f.title}</h3>
                  <p className="text-muted-foreground text-sm leading-relaxed">{f.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 py-6" style={{ borderTop: '1px solid rgba(168,85,247,0.08)' }}>
        <p className="text-center text-[11px] tracking-[0.2em] text-muted-foreground/40 uppercase">
          © {new Date().getFullYear()} Physique 57 · All Rights Reserved
        </p>
      </footer>
    </div>
  );
}

/* ── Image Carousel ── */
function ImageCarousel() {
  const [current, setCurrent] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval>>();

  useEffect(() => {
    intervalRef.current = setInterval(() => setCurrent((p) => (p + 1) % HERO_IMAGES.length), 3500);
    return () => clearInterval(intervalRef.current);
  }, []);

  const go = (dir: 1 | -1) => {
    setCurrent((p) => (p + dir + HERO_IMAGES.length) % HERO_IMAGES.length);
    clearInterval(intervalRef.current);
    intervalRef.current = setInterval(() => setCurrent((p) => (p + 1) % HERO_IMAGES.length), 3500);
  };

  const resetInterval = () => {
    clearInterval(intervalRef.current);
    intervalRef.current = setInterval(() => setCurrent((p) => (p + 1) % HERO_IMAGES.length), 3500);
  };

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="mt-2 w-full">
      <div className="flex items-center justify-between mb-3">
        <span className="text-[10px] uppercase tracking-[0.25em] text-muted-foreground/50 font-medium">Hero Images</span>
        <span className="text-[10px] text-muted-foreground/30 tabular-nums">{current + 1} / {HERO_IMAGES.length}</span>
      </div>

      <div className="relative group">
        <div className="relative w-full aspect-[21/9] rounded-2xl overflow-hidden shadow-2xl"
          style={{ border: '1px solid rgba(168,85,247,0.15)', boxShadow: '0 12px 48px rgba(168,85,247,0.06), 0 4px 16px rgba(0,0,0,0.3)' }}>
          <AnimatePresence mode="wait">
            <motion.img key={current} src={HERO_IMAGES[current]} alt=""
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
          {HERO_IMAGES.map((img, i) => (
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
    </motion.div>
  );
}
