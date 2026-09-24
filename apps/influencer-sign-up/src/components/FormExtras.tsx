import { useEffect, useMemo, useState } from 'react';
import { motion, type Variants } from 'framer-motion';
import { MapPin, Phone, Clock, Quote, Star, ArrowUp } from 'lucide-react';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@project/components/ui/accordion';
import { HERO_IMAGES } from '@/lib/constants';
import { cityFor } from '@/lib/signupDetails';
import { CLASS_FORMAT_INFO, FAQS, KEY_BENEFITS, MARQUEE_FORMATS, METHOD_FEATURES, NEXT_STEPS, REVIEWS_FEEDS, STUDIO_INFO, type City } from '@/lib/formContent';

const EASE = [0.16, 1, 0.3, 1] as const;
const rise: Variants = { hidden: { opacity: 0, y: 24 }, show: { opacity: 1, y: 0, transition: { duration: 0.7, ease: EASE } } };
const stagger: Variants = { hidden: {}, show: { transition: { staggerChildren: 0.08 } } };
const inView = { initial: 'hidden', whileInView: 'show', viewport: { once: true, margin: '-80px' } } as const;
const BRAND_BLUE = '#7FD3F7';
const ALL_FORMATS = ['Barre', 'Strength Lab', 'powerCycle'];

type Review = { name: string; text: string; meta: string; rating: number };
type MomenceReview = { id: number; comment: string; grade: number; reviewerName: string; sessionName?: string | null; teacherFullName?: string | null };

/** Landing-page sections shown beneath a generated form: marquee strips, method, benefits, formats, studios, reviews and FAQs. */
export default function FormExtras({ studios, classFormats, signupType }: { studios: string[]; classFormats: string[]; signupType: 'kids' | 'free' | 'paid' }) {
  const cities = useMemo(() => [...new Set(studios.map(cityFor))] as City[], [studios]);
  const city: City = cities.length === 1 ? cities[0] : 'mumbai';
  const offered = cities.includes('mumbai') ? ALL_FORMATS : ['Barre'];
  const formats = (classFormats.length ? classFormats : offered).filter((format) => CLASS_FORMAT_INFO[format]);
  const scrollToForm = () => window.scrollTo({ top: 0, behavior: 'smooth' });

  return (
    <div className="mt-16 text-foreground">
      <FormatMarquee formats={cities.includes('mumbai') ? MARQUEE_FORMATS.mumbai : MARQUEE_FORMATS.bengaluru} />

      <Section eyebrow="The Physique 57 Method & Key Benefits" title={<>Engineered to <em className="italic" style={{ color: BRAND_BLUE }}>reshape</em> you in 57 minutes.</>}
        lede="The proven advantages that make Physique 57 India the preferred choice for fast, visible results and sustainable transformation.">
        <motion.div {...inView} variants={stagger} className="grid md:grid-cols-3 gap-5">
          {METHOD_FEATURES.map((feature) => (
            <motion.article key={feature.tag} variants={rise} className="group overflow-hidden rounded-3xl border border-border/60 bg-card">
              <div className="aspect-[4/3] overflow-hidden">
                <img src={feature.image} alt="" loading="lazy" className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105" />
              </div>
              <div className="p-6">
                <p className="text-[10px] font-bold uppercase tracking-[0.3em]" style={{ color: BRAND_BLUE }}>{feature.tag}</p>
                <h3 className="mt-2 text-lg font-bold leading-tight">{feature.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{feature.body}</p>
              </div>
            </motion.article>
          ))}
        </motion.div>
        <p className="mt-14 mb-6 border-t border-border/60 pt-14 text-xs font-bold uppercase tracking-[0.3em]" style={{ color: BRAND_BLUE }}>Key Benefits</p>
        <motion.div {...inView} variants={stagger} className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {KEY_BENEFITS.map((benefit) => (
            <motion.div key={benefit.title} variants={rise} whileHover={{ y: -4 }} className="rounded-2xl border border-border/60 bg-card p-6">
              <div className="flex h-11 w-11 items-center justify-center rounded-full" style={{ background: 'rgba(127,211,247,0.12)', color: BRAND_BLUE }}>
                <benefit.icon className="h-5 w-5" aria-hidden />
              </div>
              <h3 className="mt-4 text-base font-bold leading-tight">{benefit.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{benefit.body}</p>
            </motion.div>
          ))}
        </motion.div>
      </Section>

      <PhotoMarquee />

      {signupType !== 'kids' && (
        <Section eyebrow="Class Formats" title={<>Find your <em className="italic" style={{ color: BRAND_BLUE }}>format</em>.</>}
          lede={formats.length === 1 ? `This experience is built around ${formats[0]}.` : 'Every format carries the same Physique 57 method, tuned for a different kind of challenge.'}>
          <motion.div {...inView} variants={stagger} className={`grid gap-5 ${formats.length === 1 ? 'md:grid-cols-1' : formats.length === 2 ? 'md:grid-cols-2' : 'md:grid-cols-3'}`}>
            {formats.map((key) => {
              const format = CLASS_FORMAT_INFO[key];
              return (
                <motion.article key={key} variants={rise} className={`group overflow-hidden rounded-3xl border border-border/60 bg-card ${formats.length === 1 ? 'md:grid md:grid-cols-2' : ''}`}>
                  <div className={`overflow-hidden ${formats.length === 1 ? 'aspect-[4/3] md:aspect-auto' : 'aspect-[4/3]'}`}>
                    <img src={format.image} alt="" loading="lazy" className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105" />
                  </div>
                  <div className="p-6 md:p-7">
                    <h3 className="text-2xl font-bold tracking-tight" style={{ fontFamily: "'Playfair Display', serif" }}>{format.name}</h3>
                    <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{format.description}</p>
                    <dl className="mt-5 grid grid-cols-2 gap-3 text-xs">
                      <FormatFact label="Duration" value={format.duration} />
                      <FormatFact label="Level" value={format.intensity} />
                      <FormatFact label="Best for" value={format.bestFor} wide />
                      <FormatFact label="Equipment" value={format.equipment} wide />
                    </dl>
                  </div>
                </motion.article>
              );
            })}
          </motion.div>
        </Section>
      )}

      <Section tone="muted" eyebrow="Your First Visit" title={<>What Happens <em className="italic" style={{ color: BRAND_BLUE }}>Next</em>.</>}
        lede="From your first click to your first shake, every step is designed to feel curated, clear, and high-touch.">
        <motion.ol {...inView} variants={stagger} className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {NEXT_STEPS.map((step, index) => (
            <motion.li key={step.title} variants={rise} className="rounded-2xl border border-border/60 bg-card p-6">
              <span className="text-4xl leading-none" style={{ fontFamily: "'Playfair Display', serif", color: BRAND_BLUE }}>0{index + 1}</span>
              <h3 className="mt-3 text-lg font-bold leading-tight">{step.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{step.body}</p>
            </motion.li>
          ))}
        </motion.ol>
      </Section>

      <Section eyebrow="Studio Locations" title={<>{studios.length > 1 ? 'Choose Your' : 'Your'} <em className="italic" style={{ color: BRAND_BLUE }}>Studio</em>.</>}
        lede="Each location carries the same Physique 57 method, with its own neighbourhood energy and format mix.">
        <motion.div {...inView} variants={stagger} className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {studios.map((studio) => STUDIO_INFO[studio]).filter(Boolean).map((studio) => (
            <motion.article key={studio.name} variants={rise} className="overflow-hidden rounded-3xl border border-border/60 bg-card">
              <iframe title={`Map to ${studio.name}`} src={`https://www.google.com/maps?q=${encodeURIComponent(studio.address)}&output=embed`}
                className="h-48 w-full border-0 grayscale-[0.3]" loading="lazy" referrerPolicy="no-referrer-when-downgrade" />
              <div className="p-6">
                <h3 className="text-xl font-bold tracking-tight" style={{ fontFamily: "'Playfair Display', serif" }}>{studio.name}</h3>
                <p className="mt-1 text-sm text-muted-foreground">{studio.neighborhood}</p>
                <dl className="mt-5 space-y-3 text-sm">
                  <StudioFact icon={MapPin} label="Address" value={studio.address} />
                  <StudioFact icon={Clock} label="Hours" value={studio.hours} />
                  <StudioFact icon={Phone} label="Phone" value={<a href={`tel:+91${studio.phone.replace(/\s/g, '')}`} className="hover:underline">{studio.phone}</a>} />
                </dl>
                <a href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(studio.address)}`} target="_blank" rel="noreferrer"
                  className="mt-5 inline-flex h-10 items-center rounded-full border border-border px-5 text-xs font-bold uppercase tracking-[0.15em] transition-colors hover:border-[#7FD3F7]">
                  Directions
                </a>
              </div>
            </motion.article>
          ))}
        </motion.div>
      </Section>

      {/* Only cities with a live Momence feed show reviews; each is labelled with its own city. */}
      <Reviews city={cities.find((option) => REVIEWS_FEEDS[option]) || city} />

      <Section eyebrow="Questions" title={<>Frequently <em className="italic" style={{ color: BRAND_BLUE }}>asked</em>.</>}>
        <Faqs cities={cities} />
      </Section>

      <div className="flex justify-center pb-16">
        <motion.button type="button" onClick={scrollToForm} whileHover={{ y: -2 }} whileTap={{ scale: 0.97 }}
          className="inline-flex h-12 items-center gap-2 rounded-full px-7 text-sm font-bold uppercase tracking-[0.15em] text-black" style={{ background: BRAND_BLUE }}>
          <ArrowUp className="h-4 w-4" /> Reserve your spot
        </motion.button>
      </div>
    </div>
  );
}

function Section({ eyebrow, title, lede, tone, children }: { eyebrow: string; title: React.ReactNode; lede?: string; tone?: 'muted'; children: React.ReactNode }) {
  return (
    <section className={tone === 'muted' ? 'bg-card/40 border-y border-border/40' : ''}>
      <div className="mx-auto max-w-6xl px-5 py-20 sm:px-6 lg:py-24">
        <motion.div {...inView} variants={rise} className="mb-12 max-w-2xl">
          <p className="mb-4 text-xs font-bold uppercase tracking-[0.3em]" style={{ color: BRAND_BLUE }}>{eyebrow}</p>
          <h2 className="text-4xl leading-[1.05] tracking-tight md:text-5xl" style={{ fontFamily: "'Playfair Display', serif" }}>{title}</h2>
          {lede && <p className="mt-5 text-base leading-relaxed text-muted-foreground">{lede}</p>}
        </motion.div>
        {children}
      </div>
    </section>
  );
}

function FormatMarquee({ formats }: { formats: string[] }) {
  return (
    <div className="overflow-hidden border-y border-white/10 bg-white py-5 text-black" aria-label={`Class formats: ${formats.join(', ')}`}>
      <div className="flex w-max animate-marquee whitespace-nowrap text-3xl italic md:text-4xl" style={{ fontFamily: "'Playfair Display', serif" }} aria-hidden>
        {[0, 1].map((copy) => (
          <div key={copy} className="flex items-center gap-12 pr-12">
            {[...formats, ...formats].map((format, index) => (
              <span key={`${format}-${index}`} className="flex items-center gap-12">
                <span className="h-2 w-2 shrink-0 rounded-full" style={{ background: BRAND_BLUE }} />
                {format}
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
    <div className="marquee-pause overflow-hidden py-2" aria-hidden>
      <div className="flex w-max animate-marquee-slow gap-3">
        {[0, 1].map((copy) => (
          <div key={copy} className="flex gap-3">
            {HERO_IMAGES.map((image) => (
              <img key={`${copy}-${image}`} src={image} alt="" loading="lazy" className="h-48 w-72 rounded-2xl object-cover md:h-64 md:w-96" />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

function FormatFact({ label, value, wide }: { label: string; value: string; wide?: boolean }) {
  return (
    <div className={`rounded-xl border border-border/50 bg-muted/20 p-3 ${wide ? 'col-span-2' : ''}`}>
      <dt className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground">{label}</dt>
      <dd className="mt-1 text-foreground">{value}</dd>
    </div>
  );
}

function StudioFact({ icon: Icon, label, value }: { icon: React.ElementType; label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-start gap-3">
      <Icon className="mt-0.5 h-4 w-4 shrink-0" style={{ color: BRAND_BLUE }} aria-hidden />
      <div>
        <dt className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground">{label}</dt>
        <dd>{value}</dd>
      </div>
    </div>
  );
}

/** Live reviews from the city's Momence reviews widget; the section hides itself when there are none. */
function Reviews({ city }: { city: City }) {
  const [reviews, setReviews] = useState<Review[]>([]);
  const feed = REVIEWS_FEEDS[city];
  useEffect(() => {
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
  if (!reviews.length) return null;
  return (
    <Section tone="muted" eyebrow={`Loved by ${city === 'bengaluru' ? 'Bengaluru' : 'Mumbai'}`} title="What our community says">
      <div className="marquee-pause -mx-5 overflow-hidden sm:-mx-6">
        <div className="flex w-max animate-marquee-reverse gap-5 px-5">
          {[0, 1].map((copy) => (
            <div key={copy} className="flex gap-5">
              {reviews.map((review, index) => (
                <figure key={`${copy}-${index}`} className="flex w-80 shrink-0 flex-col rounded-3xl border border-border/60 bg-card p-6 md:w-96">
                  <Quote className="h-6 w-6" style={{ color: BRAND_BLUE }} aria-hidden />
                  <div className="mt-3 flex gap-0.5" aria-label={`${review.rating} out of 5 stars`}>
                    {Array.from({ length: review.rating }).map((_, star) => <Star key={star} className="h-4 w-4 fill-current" style={{ color: BRAND_BLUE }} />)}
                  </div>
                  <blockquote className="mt-3 line-clamp-6 flex-1 text-sm leading-relaxed">{review.text}</blockquote>
                  <figcaption className="mt-5 border-t border-border/50 pt-4">
                    <p className="text-sm font-bold">{review.name}</p>
                    {review.meta && <p className="mt-0.5 text-xs text-muted-foreground">{review.meta}</p>}
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
  const [city, setCity] = useState<City>(cities[0] || 'mumbai');
  const categories = FAQS[city];
  return (
    <div>
      {cities.length > 1 && (
        <div className="mb-8 inline-flex rounded-full border border-border/60 p-1" role="tablist" aria-label="Choose your city">
          {cities.map((option) => (
            <button key={option} type="button" role="tab" aria-selected={city === option} onClick={() => setCity(option)}
              className={`rounded-full px-5 py-2 text-xs font-bold uppercase tracking-[0.15em] transition-colors ${city === option ? 'text-black' : 'text-muted-foreground hover:text-foreground'}`}
              style={city === option ? { background: BRAND_BLUE } : undefined}>
              {option === 'mumbai' ? 'Mumbai' : 'Bengaluru'}
            </button>
          ))}
        </div>
      )}
      <div className="grid gap-10 lg:grid-cols-2">
        {categories.map((category) => (
          <div key={category.title}>
            <h3 className="mb-2 text-xs font-bold uppercase tracking-[0.25em] text-muted-foreground">{category.title}</h3>
            <Accordion type="single" collapsible>
              {category.items.map((item) => (
                <AccordionItem key={item.q} value={item.q} className="border-border/60">
                  <AccordionTrigger className="text-left text-sm font-semibold hover:no-underline">{item.q}</AccordionTrigger>
                  <AccordionContent className="text-sm leading-relaxed text-muted-foreground">{item.a}</AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>
        ))}
      </div>
    </div>
  );
}
