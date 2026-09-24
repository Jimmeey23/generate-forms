import { useEffect, useRef } from 'react';

export default function SignaturePad({ value, onChange }: { value?: string; onChange: (value: string) => void }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const drawing = useRef(false);
  const paths = useRef<number[][]>([]);
  const current = useRef<number[]>([]);
  const last = useRef<{ x: number; y: number } | null>(null);

  useEffect(() => {
    const resize = () => {
      const canvas = canvasRef.current; const wrap = wrapRef.current;
      if (!canvas || !wrap) return;
      const ratio = window.devicePixelRatio || 1;
      canvas.width = Math.floor(wrap.clientWidth * ratio); canvas.height = Math.floor(wrap.clientHeight * ratio);
      canvas.style.width = `${wrap.clientWidth}px`; canvas.style.height = `${wrap.clientHeight}px`;
      canvas.getContext('2d')?.setTransform(ratio, 0, 0, ratio, 0, 0);
      paths.current = []; onChange('');
    };
    resize(); window.addEventListener('resize', resize); return () => window.removeEventListener('resize', resize);
  }, []);

  const point = (event: React.PointerEvent<HTMLCanvasElement>) => { const rect = canvasRef.current!.getBoundingClientRect(); return { x: event.clientX - rect.left, y: event.clientY - rect.top }; };
  const begin = (event: React.PointerEvent<HTMLCanvasElement>) => { event.currentTarget.setPointerCapture(event.pointerId); drawing.current = true; const p = point(event); current.current = [p.x, p.y, p.x, p.y]; paths.current.push(current.current); last.current = p; };
  const move = (event: React.PointerEvent<HTMLCanvasElement>) => { if (!drawing.current || !last.current) return; const next = point(event); const ctx = canvasRef.current?.getContext('2d'); if (!ctx) return; ctx.lineCap = 'round'; ctx.lineJoin = 'round'; ctx.strokeStyle = '#f8fafc'; ctx.lineWidth = 2.4; ctx.beginPath(); ctx.moveTo(last.current.x, last.current.y); ctx.lineTo(next.x, next.y); ctx.stroke(); current.current.push(next.x, next.y); last.current = next; };
  const end = () => { if (!drawing.current) return; drawing.current = false; last.current = null; onChange(JSON.stringify(paths.current.map((path) => path.map((n) => Number(n.toFixed(4)))))); };
  const clear = () => { const canvas = canvasRef.current; canvas?.getContext('2d')?.clearRect(0, 0, canvas.width, canvas.height); paths.current = []; onChange(''); };
  return <div ref={wrapRef} className="relative h-32 w-full overflow-hidden rounded-lg border" style={{ background: 'hsl(var(--form-surface))', borderColor: value ? 'var(--form-accent)' : 'hsl(var(--form-border))' }}>
    <canvas ref={canvasRef} className="block h-full w-full touch-none cursor-crosshair" aria-label="Signature drawing area" onPointerDown={begin} onPointerMove={move} onPointerUp={end} onPointerCancel={end} onPointerLeave={end} />
    <button type="button" onClick={clear} className="absolute bottom-2 right-2 rounded bg-black/50 px-2 py-1 text-[10px] uppercase tracking-widest text-white/70">Clear</button>
  </div>;
}
