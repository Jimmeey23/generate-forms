import { Button } from '@project/components/ui/button';
import { Check, Shuffle } from 'lucide-react';

// Replaces the decorative carousel: these images are the actual choice, and the one
// picked here is the hero the generated form ships with.
export default function HeroPicker({ images, value, onChange }: {
  images: string[];
  value: string;
  onChange: (image: string) => void;
}) {
  const selected = value && images.includes(value) ? value : '';

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-3">
        <p className="text-xs text-muted-foreground leading-relaxed">
          {selected ? 'This image leads the form and its link previews.' : `Pick one of the ${images.length} images, or let us choose for you.`}
        </p>
        <Button variant="outline" size="sm" className="h-8 gap-1.5 text-xs shrink-0"
          onClick={() => onChange(images[Math.floor(Math.random() * images.length)])}>
          <Shuffle className="w-3.5 h-3.5" />Surprise me
        </Button>
      </div>

      <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
        {images.map((image) => {
          const isSelected = image === selected;
          return (
            <button key={image} type="button" onClick={() => onChange(isSelected ? '' : image)}
              aria-pressed={isSelected}
              className="relative aspect-[3/2] rounded-lg overflow-hidden transition-all duration-200 hover:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-500"
              style={{
                opacity: isSelected ? 1 : 0.55,
                border: isSelected ? '2px solid hsl(var(--primary))' : '1px solid hsl(var(--border))',
                boxShadow: isSelected ? '0 0 0 3px hsl(var(--primary) / 0.18)' : 'none',
              }}>
              <img src={image} alt="" loading="lazy" className="w-full h-full object-cover" />
              {isSelected && (
                <span className="absolute top-1.5 right-1.5 w-5 h-5 rounded-full flex items-center justify-center"
                  style={{ background: 'hsl(var(--primary))' }}>
                  <Check className="w-3 h-3 text-white" strokeWidth={3} />
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
