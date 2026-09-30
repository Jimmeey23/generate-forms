import { Check } from 'lucide-react';

export type WizardStep = { id: string; title: string; done: boolean; optional?: boolean; warn?: boolean };

// Compact horizontal stepper. Only steps already reached are clickable, so the
// wizard never jumps someone past a decision the next step depends on.
export default function WizardSteps({ steps, current, furthest, onJump }: {
  steps: WizardStep[];
  current: number;
  furthest: number;
  onJump: (index: number) => void;
}) {
  return (
    <ol className="flex flex-wrap items-center justify-center gap-1.5" aria-label="Progress">
      {steps.map((step, index) => {
        const active = index === current;
        const reachable = index <= furthest;
        const complete = index < current && step.done;
        return (
          <li key={step.id} className="flex items-center gap-1.5 shrink-0">
            <button type="button" disabled={!reachable} onClick={() => onJump(index)}
              aria-current={active ? 'step' : undefined}
              title={step.title}
              className={`flex items-center gap-2 rounded-full py-1.5 transition-shadow disabled:opacity-40 disabled:cursor-not-allowed ${active ? 'pl-1.5 pr-3' : 'px-1.5'}`}
              style={active ? { boxShadow: 'inset 3px 3px 7px hsl(var(--neu-dark) / 0.4), inset -3px -3px 7px hsl(var(--neu-light) / 0.9)' } : undefined}>
              <span className="w-5 h-5 shrink-0 rounded-full flex items-center justify-center text-[10px] font-bold tabular-nums"
                style={{
                  background: complete ? 'hsl(var(--primary))' : active ? 'hsl(var(--primary) / 0.15)' : 'transparent',
                  color: complete ? '#fff' : active ? 'hsl(var(--primary))' : 'hsl(var(--muted-foreground))',
                  border: complete || active ? 'none' : `1px solid ${step.warn ? 'hsl(28 85% 48%)' : 'hsl(var(--border))'}`,
                }}>
                {complete ? <Check className="w-3 h-3" strokeWidth={3} /> : index + 1}
              </span>
              {active && (
                <span className="text-xs whitespace-nowrap font-semibold" style={{ color: 'hsl(var(--primary))' }}>
                  {step.title}
                </span>
              )}
            </button>
            {index < steps.length - 1 && <span aria-hidden className="w-2.5 h-px bg-border shrink-0" />}
          </li>
        );
      })}
    </ol>
  );
}
