import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Skeleton } from '@project/components/ui/skeleton';
import { getForm, submitForm, GetFormOutputType } from '@/lib/api';
import { toast } from 'sonner';
import FormRenderer from '@/components/FormRenderer';
import { setFormMetaTags, resetMetaTags } from '@/lib/setMetaTags';

type FormData = NonNullable<GetFormOutputType['form']>;

export default function FormFill() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const [form, setForm] = useState<FormData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    return () => resetMetaTags();
  }, []);

  useEffect(() => {
    if (!slug) return;
    getForm({ slug })
      .then(({ form }) => {
        setForm(form as FormData);
        if (form) {
          setFormMetaTags({
            title: form.metadataTitle || form.title || 'Physique 57 Signature Experience',
            description: form.metadataDescription || form.description || '',
            image: (form as any).heroImage || undefined,
            logo: form.logoUrl || undefined,
            url: window.location.href,
          });
        }
        setLoading(false);
      })
      .catch(() => {
        setError(true);
        setLoading(false);
      });
  }, [slug]);

  const handleSubmit = async (responses: Record<string, any>) => {
    if (!form) return;
    setSubmitting(true);
    try {
      const result = await submitForm({
        formId: form.id,
        responses,
        utmSource: form.utmSource || '',
        utmChannel: form.utmChannel || '',
        utmCampaign: form.utmCampaign || '',
      });
      if (result.checkoutUrl) {
        window.location.assign(result.checkoutUrl);
        return;
      }
      if (form.signupType === 'free' && !form.sessionId && result.signup?.memberId) {
        const query = new URLSearchParams({ center: form.targetStudio || responses.center, classType: responses.classType || 'Barre' });
        navigate(`/classes/${result.signup.memberId}?${query}`);
        return;
      }
      const center = (responses.center || '').toString().toLowerCase();
      const city = center.includes('bengaluru') || center.includes('copper') || center.includes('kenkere')
        ? 'bengaluru' : 'mumbai';
      navigate('/success', { state: { city } });
    } catch {
      toast.error('Failed to submit. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-full max-w-3xl px-4 space-y-4">
          <Skeleton className="h-80 rounded-2xl" />
          <Skeleton className="h-64 rounded-2xl" />
        </div>
      </div>
    );
  }

  if (error || !form || form.status !== 'Published') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <h2 className="text-xl font-semibold mb-2 text-foreground">Form unavailable</h2>
          <p className="text-muted-foreground">This form is no longer accepting responses.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background py-8 px-4">
      <div className="max-w-3xl mx-auto">
        <FormRenderer
          form={{
            title: form.title,
            description: form.description,
            themeColor: form.themeColor,
            layout: form.layout || 'stacked',
            heroImage: form.heroImage,
            heroPositionX: form.heroPositionX ?? 50,
            heroPositionY: form.heroPositionY ?? 50,
            heroScale: form.heroScale || 1,
            accentColor: form.accentColor || '#00f5a0',
            heroHeight: form.heroHeight || 520,
            heroWidth: form.heroWidth || 48,
            fields: form.fields as any,
            hashtag: form.hashtag || '',
            hashtagSize: form.hashtagSize || 'sm',
            hashtagStyle: form.hashtagStyle || 'neon',
            hashtagPosition: form.hashtagPosition || 'left',
            logoPosition: form.logoPosition || 'left',
            logoSize: form.logoSize || 'lg',
            logoInvert: form.logoInvert !== false,
            logoUrl: form.logoUrl,
            formWidth: form.formWidth || 480,
            formMinHeight: form.formMinHeight || 0,
            formBorderRadius: form.formBorderRadius ?? 16,
            formPadding: form.formPadding ?? 40,
            boldLabels: form.boldLabels || false,
          }}
          onSubmit={handleSubmit}
          submitting={submitting}
        />
      </div>
    </div>
  );
}
