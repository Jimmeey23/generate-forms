import { useEffect, useState } from 'react';
import { CheckCircle2, Loader2 } from 'lucide-react';
import { confirmPayment } from '@/lib/api';
import confetti from 'canvas-confetti';

export default function PaymentConfirmation() {
  const sessionId = new URLSearchParams(window.location.search).get('checkout_session_id') || '';
  const [state, setState] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('Confirming your payment and reserving your class…');
  useEffect(() => { if (!sessionId) { setState('error'); setMessage('The checkout confirmation is missing.'); return; } confirmPayment(sessionId).then(() => { setState('success'); setMessage('Payment confirmed and your place is booked.'); const colors = ['#a855f7', '#06b6d4', '#f97316', '#ffffff']; confetti({ particleCount: 90, angle: 60, spread: 70, origin: { x: 0, y: 0.72 }, colors }); confetti({ particleCount: 90, angle: 120, spread: 70, origin: { x: 1, y: 0.72 }, colors }); }).catch((error) => { setState('error'); setMessage(error instanceof Error ? error.message : 'We could not confirm the booking.'); }); }, [sessionId]);
  return <main className="min-h-screen bg-background flex items-center justify-center p-6"><section className="w-full max-w-lg rounded-2xl border border-border bg-card p-10 text-center shadow-2xl">{state === 'loading' ? <Loader2 className="mx-auto h-12 w-12 animate-spin text-primary" /> : <CheckCircle2 className={`mx-auto h-14 w-14 ${state === 'success' ? 'text-emerald-400' : 'text-red-400'}`} />}<h1 className="mt-6 text-3xl font-bold">{state === 'loading' ? 'Completing your booking' : state === 'success' ? 'You’re confirmed' : 'Booking needs attention'}</h1><p className="mt-3 text-muted-foreground">{message}</p>{state === 'error' && <p className="mt-4 text-sm text-muted-foreground">Your payment record is safe. Please contact the studio team with your payment confirmation.</p>}</section></main>;
}
