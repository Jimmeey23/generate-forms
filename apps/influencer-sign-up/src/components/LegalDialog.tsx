import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@project/components/ui/dialog';
import {
  bengaluruTermsDocument, bengaluruWaiverDocument, kidsWaiverDocument, membershipWaiverDocument,
  privacyDocument, termsDocument, waiverDocument, type LegalDocument,
} from '@/lib/legalContent';

export type LegalKind = 'waiver' | 'privacy' | 'terms';
export type LegalContext = { city: 'mumbai' | 'bengaluru'; kids: boolean };

const TITLES: Record<LegalKind, string> = { waiver: 'Waiver', privacy: 'Privacy Policy', terms: 'Terms and Conditions' };

/** Same document choice as the reference site's /waiver, /privacy and /terms pages. */
export function legalDocuments(kind: LegalKind, { city, kids }: LegalContext): LegalDocument[] {
  if (kind === 'privacy') return [privacyDocument];
  if (kind === 'terms') return [city === 'bengaluru' ? bengaluruTermsDocument : termsDocument];
  if (kids) return [kidsWaiverDocument];
  return city === 'bengaluru' ? [bengaluruWaiverDocument] : [waiverDocument, membershipWaiverDocument];
}

export default function LegalDialog({ kind, context, dark, onClose }: { kind: LegalKind | null; context: LegalContext; dark: boolean; onClose: () => void }) {
  const documents = kind ? legalDocuments(kind, context) : [];
  return (
    <Dialog open={Boolean(kind)} onOpenChange={(open) => { if (!open) onClose(); }}>
      {/* The dialog renders outside the form, so it carries the form theme class itself. */}
      <DialogContent className={`max-h-[85vh] max-w-2xl overflow-y-auto border-0 p-0 sm:rounded-2xl [&>button]:z-20 [&>button]:opacity-80 ${dark ? '' : 'form-light'}`}
        style={{ background: 'hsl(var(--form-card))', color: 'hsl(var(--form-text))' }}>
        <DialogHeader className="sticky top-0 z-10 border-b px-6 py-5 pr-14 text-left backdrop-blur"
          style={{ background: 'hsl(var(--form-card) / 0.92)', borderColor: 'hsl(var(--form-border))' }}>
          <DialogTitle className="text-2xl tracking-tight" style={{ fontFamily: "'Playfair Display', serif" }}>{kind ? TITLES[kind] : ''}</DialogTitle>
          <DialogDescription style={{ color: 'hsl(var(--form-text-muted))' }}>
            {context.city === 'bengaluru' ? 'Physique 57 Bengaluru' : 'Physique 57 India'}{context.kids && kind === 'waiver' ? ' · Juniors' : ''}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-10 px-6 pb-8 pt-2">
          {documents.map((document) => (
            <article key={document.title}>
              {documents.length > 1 && <h3 className="text-lg font-semibold">{document.title}</h3>}
              <p className="mt-1 text-sm" style={{ color: 'hsl(var(--form-text-secondary))' }}>{document.subtitle}</p>
              <p className="mt-1 text-[11px] uppercase tracking-[0.15em]" style={{ color: 'hsl(var(--form-text-muted))' }}>{document.updated}</p>
              {document.sections.map((section, index) => (
                <section key={`${section.title}-${index}`} className="mt-6">
                  {section.title && <h4 className="text-[11px] font-semibold uppercase tracking-[0.2em]" style={{ color: 'hsl(var(--form-text-secondary))' }}>{section.title}</h4>}
                  <div className="mt-2 space-y-3 text-sm leading-relaxed" style={{ color: 'hsl(var(--form-text-secondary))' }}>
                    {section.paragraphs.map((paragraph, paragraphIndex) => <p key={paragraphIndex}>{paragraph}</p>)}
                  </div>
                </section>
              ))}
            </article>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}

// Phrases in consent labels that open a legal document.
const LEGAL_PHRASES: [RegExp, LegalKind][] = [
  [/terms (?:&|and) conditions/i, 'terms'],
  [/privacy (?:terms|policy)/i, 'privacy'],
  [/waiver/i, 'waiver'],
];

/** Splits a consent label into text and links to the waiver, privacy and terms documents it mentions. */
export function linkLegalPhrases(label: string, open: (kind: LegalKind) => void, dark = true): React.ReactNode[] {
  const pattern = new RegExp(LEGAL_PHRASES.map(([regex]) => `(${regex.source})`).join('|'), 'gi');
  const parts: React.ReactNode[] = [];
  let last = 0;
  for (const match of label.matchAll(pattern)) {
    const kind = LEGAL_PHRASES.find(([regex]) => regex.test(match[0]))![1];
    parts.push(label.slice(last, match.index));
    parts.push(
      <button key={`${kind}-${match.index}`} type="button"
        // Opening a document must not tick the consent checkbox the label belongs to.
        onClick={(event) => { event.preventDefault(); event.stopPropagation(); open(kind); }}
        className="font-semibold underline underline-offset-2 hover:opacity-80" style={{ color: dark ? 'var(--form-accent)' : '#0369a1' }}>
        {match[0]}
      </button>,
    );
    last = (match.index ?? 0) + match[0].length;
  }
  parts.push(label.slice(last));
  return parts;
}
