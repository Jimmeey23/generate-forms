import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckCircle2, Loader2 } from 'lucide-react';
import { confirmPayment } from '@/lib/api';
import { updateSignupDetails } from '@/lib/signupDetails';

export default function PaymentConfirmation() {
  const sessionId = new URLSearchParams(window.location.search).get('checkout_session_id') || '';
  const navigate = useNavigate();
  const [state, setState] = useState<'loading' | 'error'>('loading');
  const [message, setMessage] = useState('Confirming your payment and reserving your class…');
  useEffect(() => {
    if (!sessionId) { setState('error'); setMessage('The checkout confirmation is missing.'); return; }
    confirmPayment(sessionId)
      .then(() => {
        updateSignupDetails({ booked: true, paid: true });
        navigate('/success', { replace: true });
      })
      .catch((error) => { setState('error'); setMessage(error instanceof Error ? error.message : 'We could not confirm the booking.'); });
  }, [sessionId, navigate]);
  return <main className="min-h-screen bg-background flex items-center justify-center p-6"><section className="w-full max-w-lg rounded-2xl border border-border bg-card p-10 text-center shadow-2xl">{state === 'loading' ? <Loader2 className="mx-auto h-12 w-12 animate-spin text-primary" /> : <CheckCircle2 className="mx-auto h-14 w-14 text-red-400" />}<h1 className="mt-6 text-3xl font-bold">{state === 'loading' ? 'Completing your booking' : 'Booking needs attention'}</h1><p className="mt-3 text-muted-foreground">{message}</p>{state === 'error' && <p className="mt-4 text-sm text-muted-foreground">Your payment record is safe. Please contact the studio team with your payment confirmation.</p>}</section></main>;
}
