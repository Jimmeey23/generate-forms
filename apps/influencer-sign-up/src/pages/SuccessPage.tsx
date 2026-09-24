import { useEffect } from 'react';
import { Button } from '@project/components/ui/button';
import { CheckCircle2, Instagram, CalendarCheck, MapPin, Dumbbell, Clock3, UserRound } from 'lucide-react';
import { motion } from 'framer-motion';
import { BRAND_LOGO_DARK, HERO_IMAGES } from '@/lib/constants';
import { cityFor, loadSignupDetails } from '@/lib/signupDetails';
import confetti from 'canvas-confetti';

const MOMENCE_LINKS: Record<string, { url: string; label: string }> = {
  bengaluru: { url: 'https://momence.com/u/physique-57-bengaluru-0MU0AA', label: 'Book a Class — Bengaluru' },
  mumbai: { url: 'https://momence.com/u/physique-57-india-fffoSp', label: 'Book a Class — Mumbai' },
};
const FORMAT_BACKGROUNDS: Record<string, string> = { Barre: HERO_IMAGES[1], 'Strength Lab': HERO_IMAGES[5], powerCycle: HERO_IMAGES[7] };
const CONFETTI_COLORS = ['#a855f7', '#06b6d4', '#f97316', '#ffffff'];

function celebrate() {
  const shared = { colors: CONFETTI_COLORS, disableForReducedMotion: true };
  confetti({ ...shared, particleCount: 120, spread: 90, startVelocity: 45, origin: { x: 0.5, y: 0.6 } });
  const end = Date.now() + 1600;
  const frame = () => {
    confetti({ ...shared, particleCount: 4, angle: 60, spread: 60, origin: { x: 0, y: 0.75 } });
    confetti({ ...shared, particleCount: 4, angle: 120, spread: 60, origin: { x: 1, y: 0.75 } });
    if (Date.now() < end) requestAnimationFrame(frame);
  };
  requestAnimationFrame(frame);
}

function formatSessionTime(startsAt: string) {
  return new Date(startsAt).toLocaleString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', hour: 'numeric', minute: '2-digit', timeZone: 'Asia/Kolkata' });
}

export default function SuccessPage() {
  const details = loadSignupDetails();
  const center = details?.center || '';
  const city = cityFor(center);
  const booked = Boolean(details?.booked);
  const session = details?.session;
  const classType = details?.classType || '';
  const momence = MOMENCE_LINKS[city] || MOMENCE_LINKS.mumbai;
  const bgImage = FORMAT_BACKGROUNDS[classType] || HERO_IMAGES[5];
  const name = details?.firstName?.trim();
  const isKids = details?.signupType === 'kids';

  useEffect(() => { celebrate(); }, []);

  const note = booked
    ? `${isKids && details?.childName ? `${details.childName}'s` : 'Your'} spot${classType ? ` in ${classType}` : ''}${center ? ` at ${center}` : ''} is confirmed${details?.paid ? ' and your payment is complete' : ''}. We can’t wait to see you in class.`
    : `Thank you for signing up${details?.formTitle ? ` for ${details.formTitle}` : ''}. The team${center ? ` at ${center}` : ''} will reach out shortly with everything you need${classType ? ` for your first ${classType} class` : ''}.`;
  const facts = [
    center && { icon: MapPin, label: 'Studio', value: center },
    classType && { icon: Dumbbell, label: 'Class', value: session?.name || classType },
    session?.startsAt && { icon: Clock3, label: 'When', value: formatSessionTime(session.startsAt) },
    session?.teacherName && { icon: UserRound, label: 'Instructor', value: session.teacherName },
    isKids && details?.childName && { icon: UserRound, label: 'Junior', value: details.childName },
  ].filter(Boolean) as { icon: React.ElementType; label: string; value: string }[];

  return (
    <div className="min-h-screen relative overflow-hidden flex items-center justify-center py-10">
      <div className="absolute inset-0">
        <motion.img src={bgImage} alt="" className="w-full h-full object-cover"
          initial={{ scale: 1.12 }} animate={{ scale: 1 }} transition={{ duration: 6, ease: 'easeOut' }} />
        <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />
      </div>

      <div className="relative z-10 w-full max-w-lg mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="bg-card/95 backdrop-blur-md rounded-3xl shadow-2xl p-8 md:p-12 text-center border border-border/50"
        >
          <motion.img
            src={BRAND_LOGO_DARK}
            alt="Physique 57"
            className="h-12 mx-auto mb-8"
            initial={{ opacity: 0, scale: 0.7, rotateY: -90 }}
            animate={{ opacity: 1, scale: 1, rotateY: 0 }}
            transition={{ type: 'spring', stiffness: 120, damping: 14 }}
          />

          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', stiffness: 200, delay: 0.15 }}
            className="relative mx-auto mb-6 w-20 h-20"
          >
            <div className="w-20 h-20 rounded-full bg-emerald-50 flex items-center justify-center">
              <CheckCircle2 className="w-10 h-10 text-emerald-500" />
            </div>
            <motion.div className="absolute inset-0 rounded-full border-2 border-emerald-300/40"
              initial={{ scale: 1, opacity: 1 }} animate={{ scale: 1.6, opacity: 0 }}
              transition={{ repeat: Infinity, duration: 2, ease: 'easeOut' }} />
            <motion.div className="absolute inset-0 rounded-full border-2 border-emerald-300/30"
              initial={{ scale: 1, opacity: 1 }} animate={{ scale: 2, opacity: 0 }}
              transition={{ repeat: Infinity, duration: 2, ease: 'easeOut', delay: 0.5 }} />
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="text-3xl md:text-4xl font-bold tracking-tight mb-3"
            style={{ fontFamily: "'Playfair Display', serif" }}
          >
            {booked ? "You're Booked" : "You're In"}{name ? `, ${name}` : ''}!
          </motion.h1>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="text-muted-foreground leading-relaxed mb-7"
          >
            {note}
          </motion.p>

          {facts.length > 0 && (
            <motion.dl initial="hidden" animate="show" variants={{ show: { transition: { staggerChildren: 0.08, delayChildren: 0.5 } } }}
              className="grid gap-2 mb-7 text-left">
              {facts.map((fact) => (
                <motion.div key={fact.label} variants={{ hidden: { opacity: 0, x: -12 }, show: { opacity: 1, x: 0 } }}
                  className="flex items-center gap-3 rounded-xl border border-border/50 bg-muted/30 px-4 py-3">
                  <fact.icon className="w-4 h-4 shrink-0 text-purple-400" />
                  <dt className="text-[11px] uppercase tracking-wider text-muted-foreground w-20 shrink-0">{fact.label}</dt>
                  <dd className="text-sm font-medium min-w-0">{fact.value}</dd>
                </motion.div>
              ))}
            </motion.dl>
          )}

          {!booked && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.7 }} className="mb-6">
              <Button asChild size="lg" className="w-full gap-2 rounded-xl h-12 text-sm font-semibold tracking-wider uppercase">
                <a href={momence.url} target="_blank" rel="noopener noreferrer">
                  <CalendarCheck className="w-4 h-4" />
                  {momence.label}
                </a>
              </Button>
            </motion.div>
          )}

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8 }}
            className="grid grid-cols-2 gap-3"
          >
            <a
              href="https://www.instagram.com/physique57india/"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 p-3 rounded-xl border border-border bg-muted/30 hover:bg-accent/50 transition-colors text-sm"
            >
              <Instagram className="w-4 h-4 text-pink-500" />
              <span className="font-medium">Follow Us</span>
            </a>
            <a
              href="https://www.physique57india.com"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 p-3 rounded-xl border border-border bg-muted/30 hover:bg-accent/50 transition-colors text-sm"
            >
              <span className="font-medium">physique57india.com</span>
            </a>
          </motion.div>
        </motion.div>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1 }}
          className="text-center text-white/40 text-xs mt-6"
        >
          © {new Date().getFullYear()} Physique 57 · All rights reserved
        </motion.p>
      </div>
    </div>
  );
}
