import { useState, useRef, useEffect, createContext, useContext } from 'react';
import { Button } from '@project/components/ui/button';
import { Label } from '@project/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@project/components/ui/select';
import { Checkbox } from '@project/components/ui/checkbox';
import { RadioGroup, RadioGroupItem } from '@project/components/ui/radio-group';
import { Calendar } from '@project/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@project/components/ui/popover';
import {
  Loader2, Star, ArrowRight, CalendarIcon, ChevronDown,
  Sun, Moon, Dumbbell, Bike, Users, UserCheck, Zap, Flame, Award,
} from 'lucide-react';
import { getTheme } from '@/lib/colors';
import { BRAND_LOGO } from '@/lib/constants';
import { motion, AnimatePresence } from 'framer-motion';
import { format } from 'date-fns';

export type FormField = {
  id: string;
  type: string;
  label: string;
  placeholder?: string;
  required?: boolean;
  helperText?: string;
  options?: string[];
  gridCol?: 'half' | 'full';
  min?: number;
  max?: number;
};

export type FormDataType = {
  title: string;
  description: string;
  themeColor: string;
  layout?: string;
  heroImage?: string;
  heroPositionX?: number;
  heroPositionY?: number;
  heroScale?: number;
  accentColor?: string;
  heroHeight?: number;
  heroWidth?: number;
  hashtag?: string;
  hashtagSize?: string;
  hashtagStyle?: string;
  hashtagPosition?: string;
  logoPosition?: string;
  logoSize?: string;
  logoInvert?: boolean;
  logoUrl?: string;
  formWidth?: number;
  formMinHeight?: number;
  formBorderRadius?: number;
  formPadding?: number;
  boldLabels?: boolean;
  fields: FormField[];
};

const ThemeCtx = createContext<{ dark: boolean; toggle: () => void }>({ dark: true, toggle: () => {} });
const useFormTheme = () => useContext(ThemeCtx);
const ValuesCtx = createContext<Record<string, any>>({});

const COUNTRY_CODES = [
  { code: '+91', flag: '🇮🇳', name: 'India' },
  { code: '+1', flag: '🇺🇸', name: 'US' },
  { code: '+44', flag: '🇬🇧', name: 'UK' },
  { code: '+971', flag: '🇦🇪', name: 'UAE' },
  { code: '+65', flag: '🇸🇬', name: 'Singapore' },
  { code: '+61', flag: '🇦🇺', name: 'Australia' },
  { code: '+49', flag: '🇩🇪', name: 'Germany' },
  { code: '+33', flag: '🇫🇷', name: 'France' },
  { code: '+81', flag: '🇯🇵', name: 'Japan' },
  { code: '+86', flag: '🇨🇳', name: 'China' },
  { code: '+82', flag: '🇰🇷', name: 'S. Korea' },
  { code: '+55', flag: '🇧🇷', name: 'Brazil' },
  { code: '+39', flag: '🇮🇹', name: 'Italy' },
  { code: '+34', flag: '🇪🇸', name: 'Spain' },
  { code: '+60', flag: '🇲🇾', name: 'Malaysia' },
  { code: '+66', flag: '🇹🇭', name: 'Thailand' },
  { code: '+852', flag: '🇭🇰', name: 'Hong Kong' },
  { code: '+62', flag: '🇮🇩', name: 'Indonesia' },
];

const CLASS_FORMAT_META: Record<string, { icon: React.ElementType; desc: string; accent: string }> = {
  'Barre': { icon: Award, desc: 'Proprietary interval overload technique', accent: 'from-pink-500/20 to-purple-500/20' },
  'Strength Lab': { icon: Dumbbell, desc: 'Targeted weight training', accent: 'from-orange-500/20 to-red-500/20' },
  'powerCycle': { icon: Bike, desc: 'High-intensity rhythm cycling', accent: 'from-cyan-500/20 to-blue-500/20' },
};

function getFilteredClassOptions(center: string, allOptions: string[]): string[] {
  const c = (center || '').toLowerCase();
  if (c.includes('kwality')) return allOptions.filter(o => o === 'Barre' || o === 'Strength Lab' || o === 'powerCycle');
  if (c.includes('supreme')) return allOptions.filter(o => o === 'Barre' || o === 'powerCycle');
  if (c.includes('kenkere') || c.includes('copper') || c.includes('sadashivnagar')) return allOptions.filter(o => o === 'Barre');
  return allOptions;
}

export default function FormRenderer({ form, preview, onSubmit, submitting }: {
  form: FormDataType; preview?: boolean;
  onSubmit?: (responses: Record<string, any>) => void; submitting?: boolean;
}) {
  const [values, setValues] = useState<Record<string, any>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isDark, setIsDark] = useState(true);
  const theme = getTheme(form.themeColor);
  const layout = form.layout || 'cinematic';

  const setValue = (id: string, value: any) => {
    setValues((prev) => {
      const next = { ...prev, [id]: value };
      if (id === 'center') {
        const classField = form.fields.find(f => f.id === 'classType');
        if (classField) {
          const allowed = getFilteredClassOptions(value, classField.options || []);
          if (next.classType && !allowed.includes(next.classType)) next.classType = '';
        }
      }
      return next;
    });
    if (errors[id]) setErrors((prev) => ({ ...prev, [id]: '' }));
  };

  const validate = () => {
    const errs: Record<string, string> = {};
    form.fields.forEach((f) => {
      if (f.required) {
        const v = values[f.id];
        if (v === undefined || v === '' || v === false || (Array.isArray(v) && v.length === 0)) errs[f.id] = 'This field is required';
      }
    });
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (preview) return;
    if (!validate()) return;
    onSubmit?.(values);
  };

  const props: LayoutProps = { form, theme, values, errors, setValue, onSubmit: handleSubmit, preview, submitting };
  const layoutEl = layout === 'split' ? <SplitLayout {...props} />
    : layout === 'cinematic' ? <CinematicLayout {...props} />
    : layout === 'minimal' ? <MinimalLayout {...props} />
    : layout === 'hero-overlay' ? <HeroOverlayLayout {...props} />
    : layout === 'card-float' ? <CardFloatLayout {...props} />
    : <StackedLayout {...props} />;

  return (
    <ThemeCtx.Provider value={{ dark: isDark, toggle: () => setIsDark(d => !d) }}>
      <ValuesCtx.Provider value={values}>
        <div className={isDark ? '' : 'form-light'} style={{ '--form-accent': form.accentColor || '#00f5a0' } as React.CSSProperties}>{layoutEl}</div>
      </ValuesCtx.Provider>
    </ThemeCtx.Provider>
  );
}

type LayoutProps = {
  form: FormDataType; theme: ReturnType<typeof getTheme>;
  values: Record<string, any>; errors: Record<string, string>;
  setValue: (id: string, v: any) => void; onSubmit: (e: React.FormEvent) => void;
  preview?: boolean; submitting?: boolean;
};

/* ── Helper: hero object-position from X/Y sliders ── */
function heroPos(form: FormDataType): string {
  const x = form.heroPositionX ?? 50;
  const y = form.heroPositionY ?? 50;
  return `${x}% ${y}%`;
}

/* ── Animated Brand Logo ── */
function BrandLogo({ onDarkBg = true, size = 'md', position = 'center', invert, logoUrl }: { onDarkBg?: boolean; size?: string; position?: string; invert?: boolean; logoUrl?: string }) {
  const sizeMap: Record<string, string> = { xs: 'h-6 md:h-7', sm: 'h-8 md:h-9', md: 'h-10 md:h-12', lg: 'h-16 md:h-20', xl: 'h-20 md:h-24' };
  const sizeClass = sizeMap[size] || sizeMap.md;
  const shouldInvert = invert !== undefined ? invert : onDarkBg;
  const alignClass = position === 'left' ? 'justify-start' : position === 'right' ? 'justify-end' : 'justify-center';
  return (
    <motion.div className={`flex ${alignClass}`}
      initial={{ opacity: 0, y: -20, scale: 0.85 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}>
      <motion.img src={logoUrl || BRAND_LOGO} alt="Physique 57"
        className={`${sizeClass} drop-shadow-2xl ${shouldInvert ? 'brightness-0 invert' : ''}`}
        animate={{
          filter: shouldInvert
            ? ['brightness(0) invert(1) drop-shadow(0 0 12px rgba(255,255,255,0.3))', 'brightness(0) invert(1) drop-shadow(0 0 20px rgba(255,255,255,0.5))', 'brightness(0) invert(1) drop-shadow(0 0 12px rgba(255,255,255,0.3))']
            : ['drop-shadow(0 0 8px rgba(0,0,0,0.1))', 'drop-shadow(0 0 16px rgba(0,0,0,0.2))', 'drop-shadow(0 0 8px rgba(0,0,0,0.1))'],
        }}
        transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
      />
    </motion.div>
  );
}

/* ── Hashtag Badge ── */
const HASHTAG_SIZE_CLASSES: Record<string, string> = {
  xs: 'text-[10px] px-2 py-0.5', sm: 'text-xs px-3 py-1', md: 'text-sm px-4 py-1.5', lg: 'text-base px-5 py-2', xl: 'text-lg px-6 py-2.5',
};

function getHashtagStyles(style: string): React.CSSProperties {
  switch (style) {
    case 'solid': return { color: '#fff', background: 'rgba(255,255,255,0.15)', border: '1px solid rgba(255,255,255,0.3)' };
    case 'outline': return { color: 'rgba(255,255,255,0.8)', background: 'transparent', border: '1.5px solid rgba(255,255,255,0.4)' };
    case 'gradient': return { color: '#fff', background: 'linear-gradient(135deg, rgba(0,255,136,0.2), rgba(100,149,237,0.2))', border: '1px solid rgba(255,255,255,0.2)' };
    default: return { color: 'var(--form-accent)', background: 'color-mix(in srgb, var(--form-accent) 8%, transparent)', border: '1px solid color-mix(in srgb, var(--form-accent) 28%, transparent)', textShadow: '0 0 10px color-mix(in srgb, var(--form-accent) 55%, transparent)', boxShadow: '0 0 14px color-mix(in srgb, var(--form-accent) 14%, transparent)' };
  }
}

function HashtagBadge({ tag, size = 'sm', badgeStyle = 'neon', position = 'center' }: { tag: string; size?: string; badgeStyle?: string; position?: string }) {
  if (!tag) return null;
  const align = position === 'left' ? 'text-left' : position === 'right' ? 'text-right' : 'text-center';
  return (
    <div className={`${align} mt-3`}>
      <motion.span initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.6 }}
        className={`inline-block font-semibold tracking-wider rounded-full ${HASHTAG_SIZE_CLASSES[size] || HASHTAG_SIZE_CLASSES.sm}`}
        style={getHashtagStyles(badgeStyle)}>
        #{tag}
      </motion.span>
    </div>
  );
}

/* ── Theme Toggle ── */
function ThemeToggle() {
  const { dark, toggle } = useFormTheme();
  return (
    <motion.button type="button" onClick={toggle} whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}
      className="absolute top-4 right-4 z-30 w-9 h-9 rounded-full flex items-center justify-center backdrop-blur-md bg-white/10 hover:bg-white/20 transition-colors">
      <AnimatePresence mode="wait">
        {dark ? (
          <motion.div key="sun" initial={{ rotate: -90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: 90, opacity: 0 }} transition={{ duration: 0.2 }}><Sun className="w-4 h-4 text-white/80" /></motion.div>
        ) : (
          <motion.div key="moon" initial={{ rotate: 90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: -90, opacity: 0 }} transition={{ duration: 0.2 }}><Moon className="w-4 h-4 text-black/80" /></motion.div>
        )}
      </AnimatePresence>
    </motion.button>
  );
}

function FieldsGrid({ fields, values, errors, setValue, bold }: { fields: FormField[]; values: Record<string, any>; errors: Record<string, string>; setValue: (id: string, v: any) => void; bold?: boolean }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-5 gap-y-6">
      {fields.map((field, i) => (
        <motion.div key={field.id} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 * i + 0.3, duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
          className={field.gridCol === 'half' ? 'col-span-1' : 'md:col-span-2'}>
          <FieldRenderer field={field} value={values[field.id]} onChange={(v) => setValue(field.id, v)} error={errors[field.id]} bold={bold} />
        </motion.div>
      ))}
    </div>
  );
}

function SubmitBtn({ submitting }: { submitting?: boolean }) {
  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }}>
      <Button type="submit" disabled={submitting}
        className="w-full gap-2.5 h-14 text-sm rounded-xl font-semibold tracking-[0.2em] uppercase transition-all duration-300 shadow-lg hover:shadow-xl"
        style={{ background: 'var(--form-accent)', color: '#050505' }}>
        {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <ArrowRight className="w-4 h-4" />}
        {submitting ? 'Submitting...' : 'Sign Up Now'}
      </Button>
    </motion.div>
  );
}

function Footer() {
  return <p className="text-center text-[11px] pt-4 tracking-[0.15em]" style={{ color: 'hsl(var(--form-text-muted))' }}>© {new Date().getFullYear()} PHYSIQUE 57 · ALL RIGHTS RESERVED</p>;
}

/* ── FormSection: wraps the form with global style overrides ── */
function FormSection({ form, onSubmit, values, errors, setValue, submitting, children }: { form: FormDataType; onSubmit: (e: React.FormEvent) => void; values: Record<string, any>; errors: Record<string, string>; setValue: (id: string, v: any) => void; submitting?: boolean; children?: React.ReactNode }) {
  const pad = form.formPadding ?? 40;
  const br = form.formBorderRadius ?? 12;
  return (
    <form onSubmit={onSubmit} className="space-y-8" style={{ padding: `${pad}px`, borderRadius: `${br}px`, minHeight: form.formMinHeight ? `${form.formMinHeight}px` : undefined }}>
      <FieldsGrid fields={form.fields} values={values} errors={errors} setValue={setValue} bold={form.boldLabels} />
      <SubmitBtn submitting={submitting} />
      <Footer />
      {children}
    </form>
  );
}

/* ═══ LAYOUTS ═══ */
function StackedLayout({ form, theme, values, errors, setValue, onSubmit, submitting }: LayoutProps) {
  const br = form.formBorderRadius ?? 16;
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.7 }}
      className="overflow-hidden shadow-2xl relative"
      style={{ background: 'hsl(var(--form-card))', border: '1px solid hsl(var(--form-border))', borderRadius: `${br}px` }}>
      <ThemeToggle />
      {form.heroImage ? (
        <div className="relative overflow-hidden" style={{ height: `${form.heroHeight || 420}px` }}>
          <motion.img src={form.heroImage} alt="" className="w-full h-full"
            style={{ objectFit: 'cover', objectPosition: heroPos(form) }}
            initial={{ scale: Math.max(1.15, form.heroScale || 1) }} animate={{ scale: form.heroScale || 1 }} transition={{ duration: 2, ease: [0.16, 1, 0.3, 1] }} />
          <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-black/10" />
          <div className="absolute inset-0 flex flex-col items-center justify-end p-8 pb-12 text-center">
            <BrandLogo onDarkBg size={form.logoSize || 'lg'} position={form.logoPosition} invert={form.logoInvert} logoUrl={form.logoUrl} />
            <motion.h1 initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
              className="text-3xl md:text-4xl font-bold tracking-tight mt-5 text-white" style={{ fontFamily: "'Playfair Display', serif" }}>{form.title}</motion.h1>
            {form.description && <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }}
              className="mt-2 text-white/55 text-sm md:text-base max-w-lg leading-relaxed tracking-wide">{form.description}</motion.p>}
            <HashtagBadge tag={form.hashtag || ''} size={form.hashtagSize} badgeStyle={form.hashtagStyle} position={form.hashtagPosition} />
          </div>
        </div>
      ) : (
        <div className={`bg-gradient-to-br ${theme.gradient} p-14 text-white text-center relative`}>
          <BrandLogo onDarkBg size={form.logoSize || 'lg'} position={form.logoPosition} invert={form.logoInvert} logoUrl={form.logoUrl} />
          <h1 className="text-3xl md:text-4xl font-bold mt-5" style={{ fontFamily: "'Playfair Display', serif" }}>{form.title}</h1>
          {form.description && <p className="mt-3 text-white/55 text-base max-w-lg mx-auto tracking-wide">{form.description}</p>}
          <HashtagBadge tag={form.hashtag || ''} size={form.hashtagSize} badgeStyle={form.hashtagStyle} position={form.hashtagPosition} />
        </div>
      )}
      <FormSection form={form} onSubmit={onSubmit} values={values} errors={errors} setValue={setValue} submitting={submitting} />
    </motion.div>
  );
}

function SplitLayout({ form, theme, values, errors, setValue, onSubmit, submitting }: LayoutProps) {
  const br = form.formBorderRadius ?? 16;
  const heroW = form.heroWidth ?? 48;
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.6 }}
      className="overflow-hidden shadow-2xl relative"
      style={{ background: 'hsl(var(--form-card))', border: '1px solid hsl(var(--form-border))', borderRadius: `${br}px` }}>
      <ThemeToggle />
      <div className="flex flex-col lg:flex-row min-h-[700px]">
        <div className="relative min-h-[340px] lg:min-h-0 overflow-hidden" style={{ width: undefined, flex: `0 0 ${heroW}%` }}>
          {form.heroImage ? (
            <>
              <motion.img src={form.heroImage} alt="" className="w-full h-full absolute inset-0"
                style={{ objectFit: 'cover', objectPosition: heroPos(form) }}
                initial={{ scale: Math.max(1.15, form.heroScale || 1) }} animate={{ scale: form.heroScale || 1 }} transition={{ duration: 2 }} />
              <div className="absolute inset-0 bg-gradient-to-r from-black/30 via-black/40 to-black/70 hidden lg:block" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/40 to-black/10 lg:hidden" />
            </>
          ) : <div className={`absolute inset-0 bg-gradient-to-br ${theme.gradient}`} />}
          <div className="relative z-10 flex flex-col items-center justify-center h-full p-8 text-white text-center">
            <BrandLogo onDarkBg size={form.logoSize || 'lg'} position={form.logoPosition} invert={form.logoInvert} logoUrl={form.logoUrl} />
            <h1 className="text-2xl md:text-3xl font-bold mt-5 leading-tight" style={{ fontFamily: "'Playfair Display', serif" }}>{form.title}</h1>
            {form.description && <p className="mt-3 text-white/50 text-sm max-w-xs leading-relaxed tracking-wide">{form.description}</p>}
            <HashtagBadge tag={form.hashtag || ''} size={form.hashtagSize} badgeStyle={form.hashtagStyle} position={form.hashtagPosition} />
          </div>
        </div>
        <div className="flex-1 flex flex-col justify-center">
          <div className="max-w-lg mx-auto w-full">
            <FormSection form={form} onSubmit={onSubmit} values={values} errors={errors} setValue={setValue} submitting={submitting} />
          </div>
        </div>
      </div>
    </motion.div>
  );
}

function CinematicLayout({ form, theme, values, errors, setValue, onSubmit, submitting }: LayoutProps) {
  const br = form.formBorderRadius ?? 16;
  return (
    <div className="relative">
      <div className="relative overflow-hidden" style={{ height: `${form.heroHeight || 420}px`, borderTopLeftRadius: `${br}px`, borderTopRightRadius: `${br}px` }}>
        <ThemeToggle />
        {form.heroImage ? (
          <>
            <motion.img src={form.heroImage} alt="" className="w-full h-full"
              style={{ objectFit: 'cover', objectPosition: heroPos(form) }}
              initial={{ scale: Math.max(1.2, form.heroScale || 1) }} animate={{ scale: form.heroScale || 1 }} transition={{ duration: 2.5 }} />
            <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent" />
          </>
        ) : <div className={`absolute inset-0 bg-gradient-to-br ${theme.gradient}`} />}
        <div className="absolute bottom-0 left-0 right-0 p-8 md:p-10 text-white">
          <BrandLogo onDarkBg size={form.logoSize || 'lg'} position={form.logoPosition} invert={form.logoInvert} logoUrl={form.logoUrl} />
          <h1 className="text-3xl md:text-5xl font-bold mt-4 tracking-tight" style={{ fontFamily: "'Playfair Display', serif" }}>{form.title}</h1>
          {form.description && <p className="mt-3 text-white/50 text-base max-w-lg tracking-wide">{form.description}</p>}
          <HashtagBadge tag={form.hashtag || ''} size={form.hashtagSize} badgeStyle={form.hashtagStyle} position={form.hashtagPosition} />
        </div>
      </div>
      <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3, duration: 0.6 }}
        className="shadow-2xl relative z-10"
        style={{ background: 'hsl(var(--form-card))', border: '1px solid hsl(var(--form-border))', borderTop: 'none', borderBottomLeftRadius: `${br}px`, borderBottomRightRadius: `${br}px` }}>
        <FormSection form={form} onSubmit={onSubmit} values={values} errors={errors} setValue={setValue} submitting={submitting} />
      </motion.div>
    </div>
  );
}

function MinimalLayout({ form, values, errors, setValue, onSubmit, submitting }: LayoutProps) {
  const { dark } = useFormTheme();
  const br = form.formBorderRadius ?? 16;
  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}
      className="overflow-hidden shadow-2xl relative"
      style={{ background: 'hsl(var(--form-card))', border: '1px solid hsl(var(--form-border))', borderRadius: `${br}px` }}>
      <ThemeToggle />
      <div className="p-8 md:p-12 pb-6 text-center">
        <BrandLogo onDarkBg={dark} size={form.logoSize || 'lg'} position={form.logoPosition} invert={form.logoInvert} logoUrl={form.logoUrl} />
        <motion.h1 initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
          className="text-3xl md:text-4xl font-bold mt-6 tracking-tight"
          style={{ fontFamily: "'Playfair Display', serif", color: 'hsl(var(--form-text))' }}>{form.title}</motion.h1>
        {form.description && <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}
          className="mt-3 text-sm md:text-base max-w-lg mx-auto leading-relaxed tracking-wide"
          style={{ color: 'hsl(var(--form-text-secondary))' }}>{form.description}</motion.p>}
        <HashtagBadge tag={form.hashtag || ''} size={form.hashtagSize} badgeStyle={form.hashtagStyle} position={form.hashtagPosition} />
        <div className="h-px w-20 mx-auto mt-7" style={{ background: 'hsl(var(--form-border))' }} />
      </div>
      <FormSection form={form} onSubmit={onSubmit} values={values} errors={errors} setValue={setValue} submitting={submitting} />
    </motion.div>
  );
}

/* ── NEW: Hero Overlay layout ── */
function HeroOverlayLayout({ form, theme, values, errors, setValue, onSubmit, submitting }: LayoutProps) {
  const br = form.formBorderRadius ?? 16;
  const fw = form.formWidth ?? 480;
  return (
    <div className="relative overflow-hidden" style={{ borderRadius: `${br}px`, minHeight: '700px' }}>
      <ThemeToggle />
      {form.heroImage ? (
        <>
          <motion.img src={form.heroImage} alt="" className="absolute inset-0 w-full h-full"
            style={{ objectFit: 'cover', objectPosition: heroPos(form) }}
            initial={{ scale: Math.max(1.15, form.heroScale || 1) }} animate={{ scale: form.heroScale || 1 }} transition={{ duration: 2.5 }} />
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
        </>
      ) : <div className={`absolute inset-0 bg-gradient-to-br ${theme.gradient}`} />}
      <div className="relative z-10 flex flex-col items-center justify-center min-h-[700px] py-12 px-4">
        <BrandLogo onDarkBg size={form.logoSize || 'lg'} position={form.logoPosition} invert={form.logoInvert} logoUrl={form.logoUrl} />
        <h1 className="text-3xl md:text-4xl font-bold mt-5 text-white text-center tracking-tight" style={{ fontFamily: "'Playfair Display', serif" }}>{form.title}</h1>
        {form.description && <p className="mt-2 text-white/50 text-center max-w-md">{form.description}</p>}
        <HashtagBadge tag={form.hashtag || ''} size={form.hashtagSize} badgeStyle={form.hashtagStyle} position={form.hashtagPosition} />
        <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
          className="mt-8 w-full" style={{ maxWidth: `${fw}px` }}>
          <div className="backdrop-blur-xl rounded-2xl" style={{ background: 'hsl(var(--form-card) / 0.85)', border: '1px solid hsl(var(--form-border))' }}>
            <FormSection form={form} onSubmit={onSubmit} values={values} errors={errors} setValue={setValue} submitting={submitting} />
          </div>
        </motion.div>
      </div>
    </div>
  );
}

/* ── NEW: Card Float layout ── */
function CardFloatLayout({ form, theme, values, errors, setValue, onSubmit, submitting }: LayoutProps) {
  const br = form.formBorderRadius ?? 16;
  const fw = form.formWidth ?? 520;
  return (
    <div className="relative overflow-hidden" style={{ borderRadius: `${br}px`, minHeight: '700px' }}>
      <ThemeToggle />
      {form.heroImage ? (
        <>
          <motion.img src={form.heroImage} alt="" className="absolute inset-0 w-full h-full"
            style={{ objectFit: 'cover', objectPosition: heroPos(form) }}
            initial={{ scale: Math.max(1.1, form.heroScale || 1) }} animate={{ scale: form.heroScale || 1 }} transition={{ duration: 2 }} />
          <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/40 to-transparent" />
        </>
      ) : <div className={`absolute inset-0 bg-gradient-to-br ${theme.gradient}`} />}
      <div className="relative z-10 flex flex-col lg:flex-row min-h-[700px]">
        <div className="flex-1 flex flex-col justify-center p-8 md:p-12 text-white">
          <BrandLogo onDarkBg size={form.logoSize || 'lg'} position="left" invert={form.logoInvert} logoUrl={form.logoUrl} />
          <h1 className="text-3xl md:text-5xl font-bold mt-6 tracking-tight leading-tight" style={{ fontFamily: "'Playfair Display', serif" }}>{form.title}</h1>
          {form.description && <p className="mt-4 text-white/50 text-base max-w-sm leading-relaxed">{form.description}</p>}
          <HashtagBadge tag={form.hashtag || ''} size={form.hashtagSize} badgeStyle={form.hashtagStyle} position="left" />
        </div>
        <div className="lg:flex-none flex items-center justify-center p-6 lg:p-10" style={{ width: undefined }}>
          <motion.div initial={{ opacity: 0, x: 40 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.3, duration: 0.6 }}
            className="w-full shadow-2xl rounded-2xl" style={{ maxWidth: `${fw}px`, background: 'hsl(var(--form-card) / 0.92)', border: '1px solid hsl(var(--form-border))', backdropFilter: 'blur(20px)' }}>
            <FormSection form={form} onSubmit={onSubmit} values={values} errors={errors} setValue={setValue} submitting={submitting} />
          </motion.div>
        </div>
      </div>
    </div>
  );
}

/* ═══ COUNTRY CODE PICKER ═══ */
function CountryCodePicker({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const selected = COUNTRY_CODES.find(c => c.code === value) || COUNTRY_CODES[0];
  useEffect(() => {
    const h = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);
  return (
    <div ref={ref} className="relative">
      <button type="button" onClick={() => setOpen(!open)}
        className="flex items-center gap-1.5 h-11 px-3 rounded-l-lg text-sm shrink-0 transition-colors"
        style={{ background: 'hsl(var(--form-surface))', border: '1px solid hsl(var(--form-border))' }}>
        <span className="text-lg leading-none">{selected.flag}</span>
        <span className="text-xs font-medium" style={{ color: 'hsl(var(--form-text-secondary))' }}>{selected.code}</span>
        <ChevronDown className="w-3 h-3" style={{ color: 'hsl(var(--form-text-muted))' }} />
      </button>
      {open && (
        <div className="absolute top-full left-0 mt-1 w-56 rounded-xl shadow-2xl z-50 max-h-56 overflow-y-auto py-1"
          style={{ background: 'hsl(var(--form-dropdown-bg))', border: '1px solid hsl(var(--form-border))' }}>
          {COUNTRY_CODES.map(c => (
            <button key={c.code} type="button" onClick={() => { onChange(c.code); setOpen(false); }}
              className="w-full flex items-center gap-3 px-3 py-2 text-sm transition-colors hover:opacity-80"
              style={{ background: c.code === value ? 'hsl(var(--form-surface-hover))' : 'transparent' }}>
              <span className="text-lg">{c.flag}</span>
              <span className="flex-1 text-left" style={{ color: 'hsl(var(--form-text))' }}>{c.name}</span>
              <span className="text-xs" style={{ color: 'hsl(var(--form-text-muted))' }}>{c.code}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

/* ═══ PHONE INPUT ═══ */
function PhoneInput({ field, value, onChange, error }: { field: FormField; value: any; onChange: (v: any) => void; error?: string }) {
  const [cc, setCc] = useState('+91');
  const num = typeof value === 'string' ? value.replace(/^\+\d+\s*/, '') : '';
  return (
    <div className="space-y-1.5">
      <Label className="text-xs font-medium uppercase tracking-wider" style={{ color: 'hsl(var(--form-text-secondary))' }}>
        {field.label}{field.required && <span className="text-red-400 ml-0.5">*</span>}
      </Label>
      <div className="flex">
        <CountryCodePicker value={cc} onChange={(c) => { setCc(c); if (num) onChange(`${c} ${num}`); }} />
        <input type="tel" placeholder={field.placeholder || '98765 43210'} value={num}
          onChange={e => onChange(e.target.value ? `${cc} ${e.target.value}` : '')}
          className="h-11 flex-1 rounded-r-lg border-l-0 px-3 text-sm outline-none transition-colors"
          style={{ background: 'hsl(var(--form-surface))', border: `1px solid hsl(var(--form-${error ? 'error' : 'border'}))`, borderLeft: 'none', color: 'hsl(var(--form-text))' }} />
      </div>
      {field.helperText && <p className="text-[11px]" style={{ color: 'hsl(var(--form-text-muted))' }}>{field.helperText}</p>}
      {error && <p className="text-xs" style={{ color: 'hsl(var(--form-error))' }}>{error}</p>}
    </div>
  );
}

/* ═══ CLASS TYPE PICKER ═══ */
function ClassTypePicker({ field, value, onChange, error }: { field: FormField; value: any; onChange: (v: any) => void; error?: string }) {
  const formValues = useContext(ValuesCtx);
  const allOptions = field.options || [];
  const options = getFilteredClassOptions(formValues.center || '', allOptions);
  return (
    <div className="space-y-2">
      <Label className="text-xs font-medium uppercase tracking-wider" style={{ color: 'hsl(var(--form-text-secondary))' }}>
        {field.label}{field.required && <span className="text-red-400 ml-0.5">*</span>}
      </Label>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-2.5">
        {options.map(opt => {
          const meta = CLASS_FORMAT_META[opt];
          const Icon = meta?.icon || Zap;
          const sel = value === opt;
          return (
            <motion.button key={opt} type="button" whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
              onClick={() => onChange(opt)} className="relative rounded-xl p-3.5 text-left transition-all overflow-hidden group"
              style={{ background: sel ? 'hsl(var(--form-surface-hover))' : 'hsl(var(--form-surface))', border: `2px solid ${sel ? 'hsl(var(--form-text))' : 'hsl(var(--form-border))'}` }}>
              {meta && <div className={`absolute inset-0 bg-gradient-to-br ${meta.accent} opacity-0 group-hover:opacity-100 transition-opacity ${sel ? 'opacity-100' : ''}`} />}
              <div className="relative z-10">
                <Icon className="w-5 h-5 mb-2" style={{ color: sel ? 'hsl(var(--form-text))' : 'hsl(var(--form-text-secondary))' }} />
                <div className="text-sm font-semibold leading-tight" style={{ color: 'hsl(var(--form-text))' }}>{opt}</div>
                {meta && <div className="text-[10px] mt-1 leading-snug" style={{ color: 'hsl(var(--form-text-muted))' }}>{meta.desc}</div>}
              </div>
              {sel && <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="absolute top-2 right-2 w-4 h-4 rounded-full flex items-center justify-center text-[10px]"
                style={{ background: 'hsl(var(--form-text))', color: 'hsl(var(--form-card))' }}>✓</motion.div>}
            </motion.button>
          );
        })}
      </div>
      {field.helperText && <p className="text-[11px]" style={{ color: 'hsl(var(--form-text-muted))' }}>{field.helperText}</p>}
      {error && <p className="text-xs" style={{ color: 'hsl(var(--form-error))' }}>{error}</p>}
    </div>
  );
}

/* ═══ FIELD RENDERER ═══ */
function FieldRenderer({ field, value, onChange, error, bold }: { field: FormField; value: any; onChange: (v: any) => void; error?: string; bold?: boolean }) {
  if (field.type === 'tel') return <PhoneInput field={field} value={value} onChange={onChange} error={error} />;
  if (field.id === 'classType' && field.type === 'select') return <ClassTypePicker field={field} value={value} onChange={onChange} error={error} />;

  const labelClass = `text-xs uppercase tracking-wider ${bold ? 'font-bold' : 'font-medium'}`;

  if (field.type === 'terms') {
    return (
      <div className="space-y-1">
        <div className="flex items-start gap-3 py-3 px-4 rounded-xl" style={{ background: 'hsl(var(--form-surface))', border: '1px solid hsl(var(--form-border))' }}>
          <Checkbox id={field.id} checked={!!value} onCheckedChange={c => onChange(!!c)} className="mt-0.5" />
          <Label htmlFor={field.id} className="text-sm font-normal leading-relaxed cursor-pointer" style={{ color: 'hsl(var(--form-text-secondary))' }}>
            {field.label} <span className="text-red-400">*</span>
          </Label>
        </div>
        {error && <p className="text-xs" style={{ color: 'hsl(var(--form-error))' }}>{error}</p>}
      </div>
    );
  }

  if (field.type === 'date') {
    const d = value ? new Date(value) : undefined;
    return (
      <div className="space-y-1.5">
        <Label className={labelClass} style={{ color: 'hsl(var(--form-text-secondary))' }}>{field.label}{field.required && <span className="text-red-400 ml-0.5">*</span>}</Label>
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" className="w-full justify-start text-left font-normal h-11"
              style={{ background: 'hsl(var(--form-surface))', border: `1px solid hsl(var(--form-${error ? 'error' : 'border'}))`, color: d ? 'hsl(var(--form-text))' : 'hsl(var(--form-placeholder))' }}>
              <CalendarIcon className="mr-2 h-4 w-4" style={{ color: 'hsl(var(--form-text-muted))' }} />
              {d ? format(d, 'PPP') : (field.placeholder || 'Pick a date')}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start" style={{ background: 'hsl(var(--form-dropdown-bg))', border: '1px solid hsl(var(--form-border))' }}>
            <Calendar mode="single" selected={d} onSelect={day => onChange(day ? day.toISOString().split('T')[0] : '')} />
          </PopoverContent>
        </Popover>
        {field.helperText && <p className="text-[11px]" style={{ color: 'hsl(var(--form-text-muted))' }}>{field.helperText}</p>}
        {error && <p className="text-xs" style={{ color: 'hsl(var(--form-error))' }}>{error}</p>}
      </div>
    );
  }

  const inputStyle = {
    background: 'hsl(var(--form-surface))',
    border: `1px solid hsl(var(--form-${error ? 'error' : 'border'}))`,
    color: 'hsl(var(--form-text))',
  };

  return (
    <div className="space-y-1.5">
      <Label className={labelClass} style={{ color: 'hsl(var(--form-text-secondary))' }}>
        {field.label}{field.required && <span className="text-red-400 ml-0.5">*</span>}
      </Label>
      {(field.type === 'text' || field.type === 'email' || field.type === 'url' || field.type === 'number') ? (
        <input type={field.type} placeholder={field.placeholder} value={value || ''} onChange={e => onChange(e.target.value)}
          className="h-11 w-full rounded-lg px-3 text-sm outline-none transition-colors placeholder:opacity-30" style={inputStyle} />
      ) : field.type === 'textarea' ? (
        <textarea placeholder={field.placeholder} value={value || ''} rows={3} onChange={e => onChange(e.target.value)}
          className="w-full rounded-lg px-3 py-2 text-sm outline-none transition-colors resize-none placeholder:opacity-30" style={inputStyle} />
      ) : field.type === 'select' ? (
        <Select value={value || ''} onValueChange={onChange}>
          <SelectTrigger className="h-11" style={inputStyle}><SelectValue placeholder={field.placeholder || 'Select...'} /></SelectTrigger>
          <SelectContent style={{ background: 'hsl(var(--form-dropdown-bg))', border: '1px solid hsl(var(--form-border))' }}>
            {field.options?.map(opt => <SelectItem key={opt} value={opt}>{opt}</SelectItem>)}
          </SelectContent>
        </Select>
      ) : field.type === 'radio' ? (
        <RadioGroup value={value || ''} onValueChange={onChange} className="space-y-1.5">
          {field.options?.map(opt => (
            <div key={opt} className="flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-colors"
              style={{ background: 'hsl(var(--form-surface))', border: '1px solid hsl(var(--form-border))' }}>
              <RadioGroupItem value={opt} id={`${field.id}-${opt}`} />
              <Label htmlFor={`${field.id}-${opt}`} className="cursor-pointer font-normal flex-1 text-sm" style={{ color: 'hsl(var(--form-text-secondary))' }}>{opt}</Label>
            </div>
          ))}
        </RadioGroup>
      ) : field.type === 'rating' || field.type === 'scale' ? (
        <RatingInput value={value || 0} max={field.max || 5} onChange={onChange} />
      ) : (
        <input placeholder={field.placeholder} value={value || ''} onChange={e => onChange(e.target.value)}
          className="h-11 w-full rounded-lg px-3 text-sm outline-none transition-colors placeholder:opacity-30" style={inputStyle} />
      )}
      {field.helperText && <p className="text-[11px] leading-relaxed" style={{ color: 'hsl(var(--form-text-muted))' }}>{field.helperText}</p>}
      {error && <p className="text-xs" style={{ color: 'hsl(var(--form-error))' }}>{error}</p>}
    </div>
  );
}

function RatingInput({ value, max, onChange }: { value: number; max: number; onChange: (v: number) => void }) {
  const [hover, setHover] = useState(0);
  return (
    <div className="flex gap-1">
      {Array.from({ length: max }, (_, i) => i + 1).map(n => (
        <button key={n} type="button" onMouseEnter={() => setHover(n)} onMouseLeave={() => setHover(0)} onClick={() => onChange(n)} className="p-0.5 transition-transform hover:scale-110">
          <Star className="w-7 h-7" style={{ color: n <= (hover || value) ? 'hsl(var(--form-text))' : 'hsl(var(--form-border))', fill: n <= (hover || value) ? 'currentColor' : 'none' }} />
        </button>
      ))}
    </div>
  );
}
