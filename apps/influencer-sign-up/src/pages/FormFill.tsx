import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Skeleton } from '@project/components/ui/skeleton';
import { getForm, submitForm, GetFormOutputType } from '@/lib/api';
import { toast } from 'sonner';
import FormRenderer from '@/components/FormRenderer';
import FormExtras from '@/components/FormExtras';
import { setFormMetaTags, resetMetaTags } from '@/lib/setMetaTags';
import { captureAttribution } from '@/lib/attribution';
import { cityFor, saveSignupDetails } from '@/lib/signupDetails';

type FormData = NonNullable<GetFormOutputType['form']>;

// Older forms predate the saved studio list, so fall back to the studio field's options.
function formStudios(form: FormData): string[] {
  if (form.targetStudios?.length) return form.targetStudios;
  if (form.targetStudio) return [form.targetStudio];
  const centerField = (form.fields as { id: string; options?: string[] }[]).find((field) => field.id === 'center');
  return centerField?.options || [];
}

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
          captureAttribution((form.targetStudios || [form.targetStudio]).every((studio) => cityFor(studio) === 'bengaluru'));
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
    const center = String(form.targetStudio || responses.center || '');
    const classType = String(responses.classType || form.classFormats?.[0] || '');
    const attribution = captureAttribution(cityFor(center) === 'bengaluru');
    try {
      const result = await submitForm({
        formId: form.id,
        responses,
        utmSource: form.utmSource || '',
        utmChannel: form.utmChannel || '',
        utmCampaign: form.utmCampaign || '',
        attribution,
      });
      const booked = Boolean(result.signup?.booked);
      saveSignupDetails({ firstName: String(responses.firstName || ''), center, classType, signupType: form.signupType, formTitle: form.title, childName: responses.childName, booked });
      if (result.checkoutUrl) {
        window.location.assign(result.checkoutUrl);
        return;
      }
      // Guests not auto-booked (no class, or the class is at another studio) choose one now.
      if (form.signupType !== 'kids' && !booked && result.signup?.memberId) {
        const query = new URLSearchParams({ center, classType: classType || 'Barre' });
        if (form.classFormats?.length) query.set('format', form.classFormats.join(','));
        navigate(`/classes/${result.signup.memberId}?${query}`);
        return;
      }
      navigate('/success');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to submit. Please try again.');
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
    <div className="relative min-h-screen overflow-x-clip bg-background">
      {/* Soft brand glow behind the form */}
      <div aria-hidden className="pointer-events-none absolute inset-x-0 top-0 h-[720px]"
        style={{ background: 'radial-gradient(60% 50% at 50% 0%, rgba(127,211,247,0.10), transparent 70%)' }} />
      {/* One column for the form and every section beneath it, so edges line up. */}
      <main className="relative mx-auto max-w-4xl px-4 pb-24 pt-6 sm:px-6 sm:pt-10">
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
        <FormExtras studios={formStudios(form)} classFormats={form.classFormats || []} signupType={form.signupType} />
      </main>
    </div>
  );
}
