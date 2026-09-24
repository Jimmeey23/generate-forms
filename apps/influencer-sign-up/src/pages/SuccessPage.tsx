import { useLocation } from 'react-router-dom';
import { Button } from '@project/components/ui/button';
import { CheckCircle2, Instagram, CalendarCheck } from 'lucide-react';
import { motion } from 'framer-motion';
import { BRAND_LOGO, HERO_IMAGES } from '@/lib/constants';

const MOMENCE_LINKS: Record<string, { url: string; label: string }> = {
  bengaluru: { url: 'https://momence.com/u/physique-57-bengaluru-0MU0AA', label: 'Book a Class — Bengaluru' },
  mumbai: { url: 'https://momence.com/u/physique-57-india-fffoSp', label: 'Book a Class — Mumbai' },
};

export default function SuccessPage() {
  const location = useLocation();
  const city: string = (location.state as any)?.city || 'mumbai';
  const momence = MOMENCE_LINKS[city] || MOMENCE_LINKS.mumbai;
  const bgImage = HERO_IMAGES[5];

  return (
    <div className="min-h-screen relative overflow-hidden flex items-center justify-center">
      <div className="absolute inset-0">
        <img src={bgImage} alt="" className="w-full h-full object-cover" />
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
            src={BRAND_LOGO}
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
            className="relative mx-auto mb-6"
          >
            <div className="w-20 h-20 rounded-full bg-emerald-50 flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-10 h-10 text-emerald-500" />
            </div>
            <motion.div
              className="absolute inset-0 w-20 h-20 rounded-full border-2 border-emerald-300/40 mx-auto"
              initial={{ scale: 1, opacity: 1 }}
              animate={{ scale: 1.6, opacity: 0 }}
              transition={{ repeat: Infinity, duration: 2, ease: 'easeOut' }}
            />
            <motion.div
              className="absolute inset-0 w-20 h-20 rounded-full border-2 border-emerald-300/30 mx-auto"
              initial={{ scale: 1, opacity: 1 }}
              animate={{ scale: 2, opacity: 0 }}
              transition={{ repeat: Infinity, duration: 2, ease: 'easeOut', delay: 0.5 }}
            />
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="text-3xl md:text-4xl font-bold tracking-tight mb-3"
            style={{ fontFamily: "'Playfair Display', serif" }}
          >
            You're In!
          </motion.h1>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="text-muted-foreground leading-relaxed mb-8"
          >
            Thank you for signing up. We'll send you a confirmation with all the details shortly. Get ready to transform your body!
          </motion.p>

          <motion.div
            initial={{ scaleX: 0 }}
            animate={{ scaleX: 1 }}
            transition={{ delay: 0.5, duration: 0.4 }}
            className="h-px bg-border mb-8"
          />

          {/* Book a class CTA */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.55 }}
            className="mb-6"
          >
            <Button asChild size="lg" className="w-full gap-2 rounded-xl h-12 text-sm font-semibold tracking-wider uppercase">
              <a href={momence.url} target="_blank" rel="noopener noreferrer">
                <CalendarCheck className="w-4 h-4" />
                {momence.label}
              </a>
            </Button>
          </motion.div>

          {/* Quick links */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
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
          transition={{ delay: 0.8 }}
          className="text-center text-white/40 text-xs mt-6"
        >
          © {new Date().getFullYear()} Physique 57 · All rights reserved
        </motion.p>
      </div>
    </div>
  );
}
