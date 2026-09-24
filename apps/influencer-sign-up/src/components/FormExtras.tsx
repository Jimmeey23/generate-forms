import { useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion, type Variants } from 'framer-motion';
import { MapPin, Phone, Clock, Quote, Star, ArrowUp, ArrowUpRight } from 'lucide-react';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@project/components/ui/accordion';
import { HERO_IMAGES } from '@/lib/constants';
import { cityFor } from '@/lib/signupDetails';
import { CLASS_FORMAT_INFO, FAQS, KEY_BENEFITS, MARQUEE_FORMATS, METHOD_FEATURES, NEXT_STEPS, REVIEWS_FEEDS, STUDIO_INFO, type City } from '@/lib/formContent';

const EASE = [0.16, 1, 0.3, 1] as const;
const rise: Variants = { hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0, transition: { duration: 0.7, ease: EASE } } };
const stagger: Variants = { hidden: {}, show: { transition: { staggerChildren: 0.07 } } };
const inView = { initial: 'hidden', whileInView: 'show', viewport: { once: true, margin: '-60px' } } as const;
const BRAND_BLUE = '#7FD3F7';
const ALL_FORMATS = ['Barre', 'Strength Lab', 'powerCycle'];
const DISPLAY_FONT = { fontFamily: "'Playfair Display', serif" };
// Fades marquee edges into the page so strips sit inside the column instead of ending abruptly.
const EDGE_FADE = { maskImage: 'linear-gradient(to right, transparent, black 8%, black 92%, transparent)', WebkitMaskImage: 'linear-gradient(to right, transparent, black 8%, black 92%, transparent)' };

type Review = { name: string; text: string; meta: string; rating: number };
type MomenceReview = { id: number; comment: string; grade: number; reviewerName: string; sessionName?: string | null; teacherFullName?: string | null };

/** Landing-page sections beneath a generated form; they share the form's column so everything lines up. */
export default function FormExtras({ studios, classFormats, signupType }: { studios: string[]; classFormats: string[]; signupType: 'kids' | 'free' | 'paid' }) {
  const cities = useMemo(() => [...new Set(studios.map(cityFor))] as City[], [studios]);
  const city: City = cities.length === 1 ? cities[0] : 'mumbai';
  const offered = cities.includes('mumbai') ? ALL_FORMATS : ['Barre'];
  const formats = (classFormats.length ? classFormats : offered).filter((format) => CLASS_FORMAT_INFO[format]);
  const studioInfo = studios.map((studio) => STUDIO_INFO[studio]).filter(Boolean);
  const reviewCity = cities.find((option) => REVIEWS_FEEDS[option]) || city;
  const reviews = useReviews(reviewCity);
  const sentinel = useRef<HTMLDivElement>(null);
  const [showCta, setShowCta] = useState(false);

  // The floating CTA appears once the form has scrolled out of view (a scroll check also catches jumps back to the top).
  useEffect(() => {
    let frame = 0;
    const update = () => { cancelAnimationFrame(frame); frame = requestAnimationFrame(() => setShowCta((sentinel.current?.getBoundingClientRect().top ?? 1) < 0)); };
    update();
    window.addEventListener('scroll', update, { passive: true });
    window.addEventListener('resize', update);
    return () => { cancelAnimationFrame(frame); window.removeEventListener('scroll', update); window.removeEventListener('resize', update); };
  }, []);

  let step = 0;
  const next = () => String(++step).padStart(2, '0');

  return (
    <div className="text-foreground">
      <div ref={sentinel} />
      <FormatMarquee formats={cities.includes('mumbai') ? MARQUEE_FORMATS.mumbai : MARQUEE_FORMATS.bengaluru} />

      <Section index={next()} eyebrow="The Method" title={<>Engineered to <Accent>reshape</Accent> you in 57 minutes.</>}
        lede="The proven advantages that make Physique 57 India the preferred choice for fast, visible results and sustainable transformation.">
        <motion.div {...inView} variants={stagger} className="grid gap-4 sm:grid-cols-3">
          {METHOD_FEATURES.map((feature) => (
            <motion.article key={feature.tag} variants={rise} className="group overflow-hidden rounded-2xl border border-border/50 bg-card/60">
              <div className="aspect-[4/3] overflow-hidden">
                <img src={feature.image} alt="" loading="lazy" className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105" />
              </div>
              <div className="p-5">
                <Eyebrow>{feature.tag}</Eyebrow>
                <h3 className="mt-2 text-[15px] font-semibold leading-snug">{feature.title}</h3>
                <p className="mt-1.5 text-[13px] leading-relaxed text-muted-foreground">{feature.body}</p>
              </div>
            </motion.article>
          ))}
        </motion.div>
      </Section>

      <Section index={next()} eyebrow="Key Benefits" title={<>Why members <Accent>stay</Accent>.</>}>
        <motion.ul {...inView} variants={stagger} className="grid gap-x-10 sm:grid-cols-2">
          {KEY_BENEFITS.map((benefit) => (
            <motion.li key={benefit.title} variants={rise} className="flex gap-4 border-t border-border/50 py-5">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full" style={{ background: 'rgba(127,211,247,0.1)', color: BRAND_BLUE }}>
                <benefit.icon className="h-4 w-4" aria-hidden />
              </span>
              <div>
                <h3 className="text-[15px] font-semibold leading-snug">{benefit.title}</h3>
                <p className="mt-1 text-[13px] leading-relaxed text-muted-foreground">{benefit.body}</p>
              </div>
            </motion.li>
          ))}
        </motion.ul>
      </Section>

      <PhotoMarquee />

      {signupType !== 'kids' && (
        <Section index={next()} eyebrow="Class Formats" title={<>Find your <Accent>format</Accent>.</>}
          lede={formats.length === 1 ? `This experience is built around ${formats[0]}.` : 'Every format carries the same Physique 57 method, tuned for a different kind of challenge.'}>
          <motion.div {...inView} variants={stagger} className="space-y-4">
            {formats.map((key) => {
              const format = CLASS_FORMAT_INFO[key];
              return (
                <motion.article key={key} variants={rise} className="group grid overflow-hidden rounded-2xl border border-border/50 bg-card/60 sm:grid-cols-[2fr_3fr]">
                  <div className="aspect-[16/10] overflow-hidden sm:aspect-auto">
                    <img src={format.image} alt="" loading="lazy" className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105" />
                  </div>
                  <div className="p-6">
                    <div className="flex flex-wrap items-baseline justify-between gap-2">
                      <h3 className="text-2xl tracking-tight" style={DISPLAY_FONT}>{format.name}</h3>
                      <span className="text-[11px] font-medium uppercase tracking-[0.2em] text-muted-foreground">{format.duration}</span>
                    </div>
                    <p className="mt-3 text-[13px] leading-relaxed text-muted-foreground">{format.description}</p>
                    <dl className="mt-5 grid gap-x-6 gap-y-3 border-t border-border/50 pt-4 text-[13px] sm:grid-cols-2">
                      <Fact label="Level" value={format.intensity} />
                      <Fact label="Best for" value={format.bestFor} />
                      <Fact label="Equipment" value={format.equipment} wide />
                    </dl>
                  </div>
                </motion.article>
              );
            })}
          </motion.div>
        </Section>
      )}

      <Section index={next()} eyebrow="Your First Visit" title={<>What happens <Accent>next</Accent>.</>}
        lede="From your first click to your first shake, every step is designed to feel curated, clear, and high-touch.">
        <motion.ol {...inView} variants={stagger} className="grid gap-4 sm:grid-cols-2">
          {NEXT_STEPS.map((item, index) => (
            <motion.li key={item.title} variants={rise} className="rounded-2xl border border-border/50 bg-card/60 p-6">
              <span className="text-3xl leading-none" style={{ ...DISPLAY_FONT, color: BRAND_BLUE }}>0{index + 1}</span>
              <h3 className="mt-4 text-[15px] font-semibold leading-snug">{item.title}</h3>
              <p className="mt-1.5 text-[13px] leading-relaxed text-muted-foreground">{item.body}</p>
            </motion.li>
          ))}
        </motion.ol>
      </Section>

      {studioInfo.length > 0 && (
        <Section index={next()} eyebrow="Studio Locations" title={<>{studioInfo.length > 1 ? 'Choose your' : 'Your'} <Accent>studio</Accent>.</>}
          lede="Each location carries the same Physique 57 method, with its own neighbourhood energy and format mix.">
          <motion.div {...inView} variants={stagger} className={`grid gap-4 ${studioInfo.length > 1 ? 'sm:grid-cols-2' : ''}`}>
            {studioInfo.map((studio) => (
              <motion.article key={studio.name} variants={rise} className={`overflow-hidden rounded-2xl border border-border/50 bg-card/60 ${studioInfo.length === 1 ? 'sm:grid sm:grid-cols-2' : ''}`}>
                <iframe title={`Map to ${studio.name}`} src={`https://www.google.com/maps?q=${encodeURIComponent(studio.address)}&output=embed`}
                  className={`h-44 w-full border-0 opacity-90 grayscale-[0.4] ${studioInfo.length === 1 ? 'sm:h-full sm:min-h-64' : ''}`} loading="lazy" referrerPolicy="no-referrer-when-downgrade" />
                <div className="p-6">
                  <h3 className="text-xl tracking-tight" style={DISPLAY_FONT}>{studio.name}</h3>
                  <p className="mt-0.5 text-[13px] text-muted-foreground">{studio.neighborhood}</p>
                  <dl className="mt-5 space-y-3 text-[13px]">
                    <StudioFact icon={MapPin} label="Address" value={studio.address} />
                    <StudioFact icon={Clock} label="Hours" value={studio.hours} />
                    <StudioFact icon={Phone} label="Phone" value={<a href={`tel:+91${studio.phone.replace(/\s/g, '')}`} className="hover:underline">{studio.phone}</a>} />
                  </dl>
                  <a href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(studio.address)}`} target="_blank" rel="noreferrer"
                    className="mt-5 inline-flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.2em] transition-colors hover:text-[#7FD3F7]">
                    Directions <ArrowUpRight className="h-3.5 w-3.5" />
                  </a>
                </div>
              </motion.article>
            ))}
          </motion.div>
        </Section>
      )}

      {/* Only cities with a live Momence feed show reviews; each is labelled with its own city. */}
      {reviews.length > 0 && <Reviews city={reviewCity} reviews={reviews} index={next()} />}

      <Section index={next()} eyebrow="Questions" title={<>Frequently <Accent>asked</Accent>.</>}>
        <Faqs cities={cities.length ? cities : ['mumbai']} />
      </Section>

      <AnimatePresence>
        {showCta && (
          <motion.button type="button" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 24 }} transition={{ duration: 0.35, ease: EASE }}
            className="fixed bottom-5 left-1/2 z-40 inline-flex h-12 -translate-x-1/2 items-center gap-2 rounded-full px-6 text-[12px] font-semibold uppercase tracking-[0.18em] text-black shadow-[0_12px_40px_rgba(127,211,247,0.35)]"
            style={{ background: BRAND_BLUE }}>
            <ArrowUp className="h-4 w-4" /> Reserve your spot
          </motion.button>
        )}
      </AnimatePresence>
    </div>
  );
}

function Accent({ children }: { children: React.ReactNode }) {
  return <em className="italic" style={{ color: BRAND_BLUE }}>{children}</em>;
}

function Eyebrow({ children }: { children: React.ReactNode }) {
  return <p className="text-[10px] font-semibold uppercase tracking-[0.3em]" style={{ color: BRAND_BLUE }}>{children}</p>;
}

function Section({ index, eyebrow, title, lede, children }: { index: string; eyebrow: string; title: React.ReactNode; lede?: string; children: React.ReactNode }) {
  return (
    <section className="border-t border-border/40 py-16 sm:py-20">
      <motion.header {...inView} variants={rise} className="mb-10 grid gap-4 sm:grid-cols-[auto_1fr] sm:gap-8">
        <span className="text-[11px] font-medium tabular-nums tracking-[0.2em] text-muted-foreground sm:pt-2">{index}</span>
        <div className="max-w-xl">
          <Eyebrow>{eyebrow}</Eyebrow>
          <h2 className="mt-3 text-3xl leading-[1.1] tracking-tight sm:text-4xl" style={DISPLAY_FONT}>{title}</h2>
          {lede && <p className="mt-4 text-sm leading-relaxed text-muted-foreground">{lede}</p>}
        </div>
      </motion.header>
      {children}
    </section>
  );
}

function FormatMarquee({ formats }: { formats: string[] }) {
  return (
    <div className="mt-10 overflow-hidden py-5" style={EDGE_FADE} aria-label={`Class formats: ${formats.join(', ')}`}>
      <div className="flex w-max animate-marquee whitespace-nowrap text-lg italic text-foreground/80 sm:text-xl" style={DISPLAY_FONT} aria-hidden>
        {[0, 1].map((copy) => (
          <div key={copy} className="flex items-center">
            {[...formats, ...formats].map((format, index) => (
              <span key={`${format}-${index}`} className="flex items-center">
                <span className="px-6">{format}</span>
                <span className="h-1 w-1 shrink-0 rounded-full" style={{ background: BRAND_BLUE }} />
              </span>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

function PhotoMarquee() {
  return (
    <div className="marquee-pause overflow-hidden border-t border-border/40 py-10" style={EDGE_FADE} aria-hidden>
      <div className="flex w-max animate-marquee-slow gap-3">
        {[0, 1].map((copy) => (
          <div key={copy} className="flex gap-3">
            {HERO_IMAGES.map((image) => (
              <img key={`${copy}-${image}`} src={image} alt="" loading="lazy" className="h-36 w-56 rounded-xl object-cover sm:h-44 sm:w-72" />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

function Fact({ label, value, wide }: { label: string; value: string; wide?: boolean }) {
  return (
    <div className={wide ? 'sm:col-span-2' : ''}>
      <dt className="text-[10px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">{label}</dt>
      <dd className="mt-1 text-foreground/90">{value}</dd>
    </div>
  );
}

function StudioFact({ icon: Icon, label, value }: { icon: React.ElementType; label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-start gap-3">
      <Icon className="mt-0.5 h-3.5 w-3.5 shrink-0" style={{ color: BRAND_BLUE }} aria-hidden />
      <div>
        <dt className="sr-only">{label}</dt>
        <dd className="leading-relaxed">{value}</dd>
      </div>
    </div>
  );
}

/** Live reviews from the city's Momence reviews widget; empty when the city has no feed or the request fails. */
function useReviews(city: City) {
  const [reviews, setReviews] = useState<Review[]>([]);
  const feed = REVIEWS_FEEDS[city];
  useEffect(() => {
    setReviews([]);
    if (!feed) return;
    let cancelled = false;
    fetch(feed, { headers: { Accept: 'application/json' } })
      .then((response) => (response.ok ? response.json() : Promise.reject(new Error(String(response.status)))))
      .then((data) => {
        const rows: MomenceReview[] = Array.isArray(data) ? data : Array.isArray(data?.payload) ? data.payload : [];
        if (cancelled) return;
        setReviews(rows.filter((row) => row.comment?.trim() && row.grade >= 4).map((row) => ({
          name: row.reviewerName, text: row.comment.trim(), rating: row.grade,
          meta: [row.sessionName?.trim(), row.teacherFullName?.trim() && `with ${row.teacherFullName.trim()}`].filter(Boolean).join(' · '),
        })));
      })
      .catch(() => undefined);
    return () => { cancelled = true; };
  }, [feed]);
  return reviews;
}

function Reviews({ city, reviews, index }: { city: City; reviews: Review[]; index: string }) {
  return (
    <Section index={index} eyebrow={`Loved by ${city === 'bengaluru' ? 'Bengaluru' : 'Mumbai'}`} title={<>What our <Accent>community</Accent> says.</>}>
      <div className="marquee-pause overflow-hidden" style={EDGE_FADE}>
        <div className="flex w-max animate-marquee-reverse gap-4">
          {[0, 1].map((copy) => (
            <div key={copy} className="flex gap-4">
              {reviews.map((review, reviewIndex) => (
                <figure key={`${copy}-${reviewIndex}`} className="flex w-72 shrink-0 flex-col rounded-2xl border border-border/50 bg-card/60 p-6 sm:w-80">
                  <div className="flex items-center justify-between">
                    <Quote className="h-5 w-5" style={{ color: BRAND_BLUE }} aria-hidden />
                    <div className="flex gap-0.5" aria-label={`${review.rating} out of 5 stars`}>
                      {Array.from({ length: review.rating }).map((_, star) => <Star key={star} className="h-3.5 w-3.5 fill-current" style={{ color: BRAND_BLUE }} />)}
                    </div>
                  </div>
                  <blockquote className="mt-4 line-clamp-5 flex-1 text-[13px] leading-relaxed">{review.text}</blockquote>
                  <figcaption className="mt-5 border-t border-border/50 pt-4">
                    <p className="text-[13px] font-semibold">{review.name}</p>
                    {review.meta && <p className="mt-0.5 text-[11px] text-muted-foreground">{review.meta}</p>}
                  </figcaption>
                </figure>
              ))}
            </div>
          ))}
        </div>
      </div>
    </Section>
  );
}

function Faqs({ cities }: { cities: City[] }) {
  const [city, setCity] = useState<City>(cities[0]);
  const categories = FAQS[city];
  const [category, setCategory] = useState(0);
  const active = categories[Math.min(category, categories.length - 1)];
  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center gap-2">
        {cities.length > 1 && cities.map((option) => (
          <Pill key={option} selected={city === option} onClick={() => { setCity(option); setCategory(0); }} strong>
            {option === 'mumbai' ? 'Mumbai' : 'Bengaluru'}
          </Pill>
        ))}
        {cities.length > 1 && <span className="mx-1 h-5 w-px bg-border" aria-hidden />}
        {categories.map((option, optionIndex) => (
          <Pill key={option.title} selected={optionIndex === category} onClick={() => setCategory(optionIndex)}>{option.title}</Pill>
        ))}
      </div>
      <AnimatePresence mode="wait">
        <motion.div key={`${city}-${active.title}`} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.25 }}>
          <Accordion type="single" collapsible className="border-t border-border/50">
            {active.items.map((item) => (
              <AccordionItem key={item.q} value={item.q} className="border-border/50">
                <AccordionTrigger className="py-5 text-left text-[15px] font-medium hover:no-underline">{item.q}</AccordionTrigger>
                <AccordionContent className="pb-5 text-[13px] leading-relaxed text-muted-foreground">{item.a}</AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

function Pill({ selected, onClick, strong, children }: { selected: boolean; onClick: () => void; strong?: boolean; children: React.ReactNode }) {
  return (
    <button type="button" aria-pressed={selected} onClick={onClick}
      className={`rounded-full border px-4 py-1.5 text-[12px] transition-colors ${strong ? 'font-semibold uppercase tracking-[0.15em]' : 'font-medium'} ${selected ? 'border-transparent text-black' : 'border-border/60 text-muted-foreground hover:text-foreground'}`}
      style={selected ? { background: BRAND_BLUE } : undefined}>
      {children}
    </button>
  );
}
