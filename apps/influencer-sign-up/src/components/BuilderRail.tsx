import { Check } from 'lucide-react';

// `optional` sections carry a working default, so they never count against progress
// and show a quiet dot rather than a tick the organiser did not earn.
export type RailSection = { id: string; phase: string; title: string; done: boolean; optional?: boolean; warn?: boolean };

// Index for the form builder. Sections come from the same array the page renders,
// so the rail can never list a step the page is not showing.
export default function BuilderRail({ sections, activeId, onJump }: {
  sections: RailSection[];
  activeId: string;
  onJump: (id: string) => void;
}) {
  const phases = sections.reduce<{ phase: string; items: RailSection[] }[]>((groups, section) => {
    const last = groups[groups.length - 1];
    if (last && last.phase === section.phase) last.items.push(section);
    else groups.push({ phase: section.phase, items: [section] });
    return groups;
  }, []);

  const required = sections.filter((section) => !section.optional);
  const doneCount = required.filter((section) => section.done).length;

  return (
    <nav aria-label="Form builder sections" className="space-y-5">
      <div>
        <div className="flex items-baseline justify-between mb-2">
          <span className="text-[11px] uppercase tracking-wider font-bold text-muted-foreground">Progress</span>
          <span className="text-[11px] tabular-nums text-muted-foreground/70">{doneCount}/{required.length}</span>
        </div>
        <div className="h-1 rounded-full neu-inset overflow-hidden">
          <div className="h-full rounded-full transition-[width] duration-500"
            style={{ width: `${required.length ? (doneCount / required.length) * 100 : 0}%`, background: 'linear-gradient(90deg, #a855f7, #06b6d4)' }} />
        </div>
      </div>

      {phases.map((group) => (
        <div key={group.phase}>
          <h3 className="text-[11px] uppercase tracking-wider font-bold text-muted-foreground/60 mb-2">{group.phase}</h3>
          <ul className="space-y-0.5">
            {group.items.map((section) => {
              const active = section.id === activeId;
              return (
                <li key={section.id}>
                  <button type="button" onClick={() => onJump(section.id)}
                    aria-current={active ? 'step' : undefined}
                    className="group w-full flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-left transition-colors hover:bg-muted/30"
                    style={active ? { background: 'hsl(var(--primary) / 0.12)' } : undefined}>
                    <span className="w-4 h-4 shrink-0 rounded-full flex items-center justify-center transition-colors"
                      style={{
                        background: section.done && !section.optional ? 'hsl(var(--primary))' : 'transparent',
                        border: section.done && !section.optional
                          ? 'none'
                          : `1px solid ${section.warn ? 'hsl(28 85% 48%)' : 'hsl(var(--border))'}`,
                      }}>
                      {section.done && !section.optional && <Check className="w-2.5 h-2.5 text-white" strokeWidth={3} />}
                      {section.optional && <span className="w-1 h-1 rounded-full bg-muted-foreground/40" />}
                    </span>
                    <span className="text-xs truncate transition-colors"
                      style={{ color: active ? 'hsl(var(--primary))' : undefined, fontWeight: active ? 600 : 400 }}>
                      {section.title}
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </nav>
  );
}
