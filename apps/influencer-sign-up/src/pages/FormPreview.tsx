import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@project/components/ui/button';
import { Badge } from '@project/components/ui/badge';
import { Input } from '@project/components/ui/input';
import { Label } from '@project/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@project/components/ui/select';
import { Skeleton } from '@project/components/ui/skeleton';
import { Slider } from '@project/components/ui/slider';
import { Switch } from '@project/components/ui/switch';
import {
  ArrowLeft, Share2, Copy, Check, ExternalLink, Pencil, Trash2,
  Plus, GripVertical, Settings2, Image as ImageIcon, Save, Layout, Hash, Type,
  Palette, SlidersHorizontal,
} from 'lucide-react';
import { getForm, updateForm, GetFormOutputType } from '@/lib/api';
import { toast } from 'sonner';
import { HERO_IMAGES } from '@/lib/constants';
import FormRenderer from '@/components/FormRenderer';
import { FieldEditorDialog } from '@/components/FieldEditor';

type FormData = NonNullable<GetFormOutputType['form']>;
type Field = { id: string; type: string; label: string; placeholder?: string; required?: boolean; helperText?: string; options?: string[]; gridCol?: string };

const LAYOUT_OPTIONS = [
  { value: 'stacked', label: 'Stacked', desc: 'Hero on top, form below' },
  { value: 'split', label: 'Split', desc: 'Image left, form right' },
  { value: 'cinematic', label: 'Cinematic', desc: 'Full-bleed hero banner' },
  { value: 'minimal', label: 'Minimal', desc: 'Clean, no hero image' },
  { value: 'hero-overlay', label: 'Overlay', desc: 'Form floats on hero' },
  { value: 'card-float', label: 'Card Float', desc: 'Card on hero background' },
];

const HASHTAG_SIZES = [
  { value: 'xs', label: 'XS' }, { value: 'sm', label: 'SM' }, { value: 'md', label: 'MD' }, { value: 'lg', label: 'LG' }, { value: 'xl', label: 'XL' },
];

const HASHTAG_STYLES = [
  { value: 'neon', label: 'Neon Glow' }, { value: 'solid', label: 'Solid' }, { value: 'outline', label: 'Outline' }, { value: 'gradient', label: 'Gradient' },
];

const LOGO_SIZES = [
  { value: 'xs', label: 'XS' }, { value: 'sm', label: 'SM' }, { value: 'md', label: 'MD' }, { value: 'lg', label: 'LG' }, { value: 'xl', label: 'XL' },
];

const POSITION_OPTIONS = [
  { value: 'left', label: 'Left' }, { value: 'center', label: 'Center' }, { value: 'right', label: 'Right' },
];

export default function FormPreview() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [form, setForm] = useState<FormData | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [editingField, setEditingField] = useState<Field | null>(null);
  const [fieldDialogOpen, setFieldDialogOpen] = useState(false);
  const [isNew, setIsNew] = useState(false);
  const [saving, setSaving] = useState(false);

  // Content
  const [editTitle, setEditTitle] = useState('');
  const [editDesc, setEditDesc] = useState('');
  const [editTheme, setEditTheme] = useState('midnight');
  const [editLayout, setEditLayout] = useState('stacked');
  const [editFields, setEditFields] = useState<Field[]>([]);

  // Hero
  const [editHero, setEditHero] = useState('');
  const [editHeroPosX, setEditHeroPosX] = useState(50);
  const [editHeroPosY, setEditHeroPosY] = useState(50);
  const [editHeroHeight, setEditHeroHeight] = useState(520);
  const [editHeroWidth, setEditHeroWidth] = useState(48);

  // Logo
  const [editLogoPosition, setEditLogoPosition] = useState('center');
  const [editLogoSize, setEditLogoSize] = useState('lg');
  const [editLogoInvert, setEditLogoInvert] = useState(true);

  // Hashtag
  const [editHashtagSize, setEditHashtagSize] = useState('sm');
  const [editHashtagStyle, setEditHashtagStyle] = useState('neon');
  const [editHashtagPosition, setEditHashtagPosition] = useState('left');

  // Global styling
  const [editFormWidth, setEditFormWidth] = useState(480);
  const [editFormMinHeight, setEditFormMinHeight] = useState(0);
  const [editFormBorderRadius, setEditFormBorderRadius] = useState(16);
  const [editFormPadding, setEditFormPadding] = useState(40);
  const [editBoldLabels, setEditBoldLabels] = useState(false);

  // UTM
  const [editUtmSource, setEditUtmSource] = useState('');
  const [editUtmChannel, setEditUtmChannel] = useState('');
  const [editUtmCampaign, setEditUtmCampaign] = useState('');

  useEffect(() => {
    if (!id) return;
    getForm({ id }).then(({ form: f }) => {
      if (!f) { setLoading(false); return; }
      setForm(f as FormData);
      setEditTitle(f.title);
      setEditDesc(f.description);
      setEditTheme(f.themeColor);
      setEditLayout(f.layout || 'stacked');
      setEditHero(f.heroImage);
      setEditHeroPosX((f as any).heroPositionX ?? 50);
      setEditHeroPosY((f as any).heroPositionY ?? 50);
      setEditHeroHeight((f as any).heroHeight || 420);
      setEditHeroWidth((f as any).heroWidth || 48);
      setEditLogoPosition((f as any).logoPosition || 'center');
      setEditLogoSize((f as any).logoSize || 'lg');
      setEditLogoInvert((f as any).logoInvert !== false);
      setEditHashtagSize((f as any).hashtagSize || 'sm');
      setEditHashtagStyle((f as any).hashtagStyle || 'neon');
      setEditHashtagPosition((f as any).hashtagPosition || 'center');
      setEditFormWidth((f as any).formWidth || 480);
      setEditFormMinHeight((f as any).formMinHeight || 0);
      setEditFormBorderRadius((f as any).formBorderRadius ?? 16);
      setEditFormPadding((f as any).formPadding ?? 40);
      setEditBoldLabels((f as any).boldLabels || false);
      setEditUtmSource(f.utmSource);
      setEditUtmChannel(f.utmChannel);
      setEditUtmCampaign(f.utmCampaign);
      setEditFields(f.fields as Field[]);
      setLoading(false);
    });
  }, [id]);

  const handlePublish = async () => {
    if (!form) return;
    await updateForm({ id: form.id, status: 'Published' });
    setForm({ ...form, status: 'Published' });
    toast.success('Form published!');
  };

  const handleSave = async () => {
    if (!form) return;
    setSaving(true);
    await updateForm({
      id: form.id, title: editTitle, description: editDesc, themeColor: editTheme,
      heroImage: editHero, heroPositionX: editHeroPosX, heroPositionY: editHeroPosY,
      heroHeight: editHeroHeight, heroWidth: editHeroWidth,
      layout: editLayout, fields: editFields,
      utmSource: editUtmSource, utmChannel: editUtmChannel, utmCampaign: editUtmCampaign,
      hashtagSize: editHashtagSize, hashtagStyle: editHashtagStyle, hashtagPosition: editHashtagPosition,
      logoPosition: editLogoPosition, logoSize: editLogoSize, logoInvert: editLogoInvert,
      formWidth: editFormWidth, formMinHeight: editFormMinHeight,
      formBorderRadius: editFormBorderRadius, formPadding: editFormPadding,
      boldLabels: editBoldLabels,
    });
    setForm({
      ...form, title: editTitle, description: editDesc, themeColor: editTheme,
      heroImage: editHero, layout: editLayout, fields: editFields,
      utmSource: editUtmSource, utmChannel: editUtmChannel, utmCampaign: editUtmCampaign,
    });
    setSaving(false);
    setEditMode(false);
    toast.success('Form saved!');
  };

  const copyLink = () => {
    if (!form) return;
    navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    toast.success('Link copied!');
    setTimeout(() => setCopied(false), 2000);
  };

  const deleteField = (fid: string) => setEditFields((prev) => prev.filter((f) => f.id !== fid));
  const openEditField = (field: Field) => { setEditingField(field); setIsNew(false); setFieldDialogOpen(true); };
  const openAddField = () => { setEditingField(null); setIsNew(true); setFieldDialogOpen(true); };
  const saveField = (field: Field) => {
    if (isNew) setEditFields((prev) => [...prev, field]);
    else setEditFields((prev) => prev.map((f) => (f.id === field.id ? field : f)));
    setFieldDialogOpen(false);
  };

  if (loading) return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="w-full max-w-3xl px-4 space-y-4"><Skeleton className="h-12 w-3/4" /><Skeleton className="h-64 rounded-2xl" /></div>
    </div>
  );

  if (!form) return <div className="min-h-screen flex items-center justify-center"><p className="text-muted-foreground">Form not found</p></div>;

  const shareUrl = form.shareUrl || `${window.location.origin}/f/${form.slug}`;
  const previewForm = editMode
    ? {
        title: editTitle, description: editDesc, themeColor: editTheme, layout: editLayout,
        heroImage: editHero, heroPositionX: editHeroPosX, heroPositionY: editHeroPosY,
        heroScale: form.heroScale || 1, accentColor: form.accentColor || '#00f5a0', logoUrl: form.logoUrl,
        heroHeight: editHeroHeight, heroWidth: editHeroWidth,
        fields: editFields, hashtag: (form as any).hashtag || '',
        hashtagSize: editHashtagSize, hashtagStyle: editHashtagStyle, hashtagPosition: editHashtagPosition,
        logoPosition: editLogoPosition, logoSize: editLogoSize, logoInvert: editLogoInvert,
        formWidth: editFormWidth, formMinHeight: editFormMinHeight,
        formBorderRadius: editFormBorderRadius, formPadding: editFormPadding, boldLabels: editBoldLabels,
      }
    : {
        title: form.title, description: form.description, themeColor: form.themeColor,
        layout: form.layout, heroImage: form.heroImage,
        heroPositionX: (form as any).heroPositionX ?? 50, heroPositionY: (form as any).heroPositionY ?? 50,
        heroScale: form.heroScale || 1, accentColor: form.accentColor || '#00f5a0', logoUrl: form.logoUrl,
        heroHeight: (form as any).heroHeight || 420, heroWidth: (form as any).heroWidth || 48,
        fields: form.fields, hashtag: (form as any).hashtag || '',
        hashtagSize: (form as any).hashtagSize || 'sm', hashtagStyle: (form as any).hashtagStyle || 'neon',
        hashtagPosition: (form as any).hashtagPosition || 'center',
        logoPosition: (form as any).logoPosition || 'center', logoSize: (form as any).logoSize || 'lg',
        logoInvert: (form as any).logoInvert !== false,
        formWidth: (form as any).formWidth || 480, formMinHeight: (form as any).formMinHeight || 0,
        formBorderRadius: (form as any).formBorderRadius ?? 16, formPadding: (form as any).formPadding ?? 40,
        boldLabels: (form as any).boldLabels || false,
      };

  const showHeroWidth = editLayout === 'split';

  return (
    <div className="min-h-screen bg-background">
      {/* Toolbar */}
      <div className="bg-card border-b border-border sticky top-0 z-50">
        <div className="container mx-auto px-4 h-14 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={() => navigate('/dashboard')}><ArrowLeft className="w-4 h-4 mr-1" /> Back</Button>
            <Badge variant={form.status === 'Published' ? 'default' : 'secondary'}>{form.status}</Badge>
          </div>
          <div className="flex items-center gap-2">
            <Button variant={editMode ? 'default' : 'outline'} size="sm" onClick={() => editMode ? handleSave() : setEditMode(true)} className="gap-1.5" disabled={saving}>
              {editMode ? <><Save className="w-3.5 h-3.5" />{saving ? 'Saving...' : 'Save Changes'}</> : <><Pencil className="w-3.5 h-3.5" /> Edit</>}
            </Button>
            {editMode && <Button variant="outline" size="sm" onClick={() => setEditMode(false)}>Cancel</Button>}
            {form.status === 'Published' ? (
              <>
                <Button variant="outline" size="sm" onClick={copyLink} className="gap-1.5">
                  {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}{copied ? 'Copied!' : 'Copy Link'}
                </Button>
                <Button size="sm" onClick={() => window.open(shareUrl, '_blank')} className="gap-1.5"><ExternalLink className="w-3.5 h-3.5" /> Open</Button>
              </>
            ) : (
              <Button size="sm" onClick={handlePublish} className="gap-1.5"><Share2 className="w-3.5 h-3.5" /> Publish</Button>
            )}
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8 flex flex-col lg:flex-row gap-6">
        {/* Edit sidebar */}
        {editMode && (
          <div className="lg:w-80 shrink-0 space-y-3 lg:max-h-[calc(100vh-7rem)] lg:overflow-y-auto lg:sticky lg:top-20 pb-8">
            {/* Content */}
            <SidebarCard title="Content" icon={<Type className="w-4 h-4" />}>
              <div><Label className="text-xs text-muted-foreground">Title</Label><Input value={editTitle} onChange={(e) => setEditTitle(e.target.value)} className="h-9" /></div>
              <div><Label className="text-xs text-muted-foreground">Description</Label><Input value={editDesc} onChange={(e) => setEditDesc(e.target.value)} className="h-9" /></div>
              <div>
                <Label className="text-xs text-muted-foreground">Theme</Label>
                <Select value={editTheme} onValueChange={setEditTheme}>
                  <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                  <SelectContent>{['midnight', 'ocean', 'ember', 'forest', 'royal'].map((t) => <SelectItem key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </SidebarCard>

            {/* Logo */}
            <SidebarCard title="Logo" icon={<Palette className="w-4 h-4" />}>
              <div>
                <Label className="text-xs text-muted-foreground">Size</Label>
                <div className="flex gap-1.5 mt-1">
                  {LOGO_SIZES.map(s => (
                    <button key={s.value} onClick={() => setEditLogoSize(s.value)}
                      className={`flex-1 py-1.5 rounded-lg text-xs font-medium border-2 transition-all ${editLogoSize === s.value ? 'border-primary bg-accent/50' : 'border-border hover:border-primary/40'}`}>
                      {s.label}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Position</Label>
                <div className="flex gap-1.5 mt-1">
                  {POSITION_OPTIONS.map(p => (
                    <button key={p.value} onClick={() => setEditLogoPosition(p.value)}
                      className={`flex-1 py-1.5 rounded-lg text-xs font-medium border-2 transition-all ${editLogoPosition === p.value ? 'border-primary bg-accent/50' : 'border-border hover:border-primary/40'}`}>
                      {p.label}
                    </button>
                  ))}
                </div>
              </div>
              <div className="flex items-center justify-between">
                <Label className="text-xs text-muted-foreground">Invert (white logo)</Label>
                <Switch checked={editLogoInvert} onCheckedChange={setEditLogoInvert} />
              </div>
            </SidebarCard>

            {/* Hashtag */}
            <SidebarCard title="Hashtag Badge" icon={<Hash className="w-4 h-4" />}>
              <div>
                <Label className="text-xs text-muted-foreground">Size</Label>
                <div className="flex gap-1.5 mt-1">
                  {HASHTAG_SIZES.map(s => (
                    <button key={s.value} onClick={() => setEditHashtagSize(s.value)}
                      className={`flex-1 py-1.5 rounded-lg text-xs font-medium border-2 transition-all ${editHashtagSize === s.value ? 'border-primary bg-accent/50' : 'border-border hover:border-primary/40'}`}>
                      {s.label}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Style</Label>
                <Select value={editHashtagStyle} onValueChange={setEditHashtagStyle}>
                  <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                  <SelectContent>{HASHTAG_STYLES.map(s => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Position</Label>
                <div className="flex gap-1.5 mt-1">
                  {POSITION_OPTIONS.map(p => (
                    <button key={p.value} onClick={() => setEditHashtagPosition(p.value)}
                      className={`flex-1 py-1.5 rounded-lg text-xs font-medium border-2 transition-all ${editHashtagPosition === p.value ? 'border-primary bg-accent/50' : 'border-border hover:border-primary/40'}`}>
                      {p.label}
                    </button>
                  ))}
                </div>
              </div>
            </SidebarCard>

            {/* Layout */}
            <SidebarCard title="Layout" icon={<Layout className="w-4 h-4" />}>
              <div className="grid grid-cols-2 gap-2">
                {LAYOUT_OPTIONS.map((l) => (
                  <button key={l.value} onClick={() => setEditLayout(l.value)} className={`p-3 rounded-lg border-2 text-left transition-all ${editLayout === l.value ? 'border-primary bg-accent/50' : 'border-border hover:border-primary/40'}`}>
                    <span className="text-xs font-semibold block">{l.label}</span>
                    <span className="text-[10px] text-muted-foreground leading-tight">{l.desc}</span>
                  </button>
                ))}
              </div>
            </SidebarCard>

            {/* Hero Image */}
            <SidebarCard title="Hero Image" icon={<ImageIcon className="w-4 h-4" />}>
              <div className="grid grid-cols-3 gap-1.5">
                <button onClick={() => setEditHero('')} className={`aspect-square rounded-lg border-2 flex items-center justify-center text-xs text-muted-foreground transition-all ${!editHero ? 'border-primary bg-accent/50' : 'border-border hover:border-primary/40'}`}>None</button>
                {HERO_IMAGES.map((img, i) => (
                  <button key={i} onClick={() => setEditHero(img)} className={`aspect-square rounded-lg overflow-hidden border-2 transition-all ${editHero === img ? 'border-primary ring-2 ring-primary/20' : 'border-transparent hover:border-border'}`}>
                    <img src={img} alt="" className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
              {editHero && (
                <>
                  <div>
                    <Label className="text-xs text-muted-foreground">Horizontal Position: {editHeroPosX}%</Label>
                    <Slider value={[editHeroPosX]} onValueChange={([v]) => setEditHeroPosX(v)} min={0} max={100} step={1} className="mt-2" />
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground">Vertical Position: {editHeroPosY}%</Label>
                    <Slider value={[editHeroPosY]} onValueChange={([v]) => setEditHeroPosY(v)} min={0} max={100} step={1} className="mt-2" />
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground">Height: {editHeroHeight}px</Label>
                    <Slider value={[editHeroHeight]} onValueChange={([v]) => setEditHeroHeight(v)} min={200} max={800} step={10} className="mt-2" />
                  </div>
                  {showHeroWidth && (
                    <div>
                      <Label className="text-xs text-muted-foreground">Image Width: {editHeroWidth}%</Label>
                      <Slider value={[editHeroWidth]} onValueChange={([v]) => setEditHeroWidth(v)} min={25} max={75} step={1} className="mt-2" />
                    </div>
                  )}
                </>
              )}
            </SidebarCard>

            {/* Global Styling */}
            <SidebarCard title="Form Styling" icon={<SlidersHorizontal className="w-4 h-4" />}>
              <div>
                <Label className="text-xs text-muted-foreground">Form Max Width: {editFormWidth}px</Label>
                <Slider value={[editFormWidth]} onValueChange={([v]) => setEditFormWidth(v)} min={320} max={800} step={10} className="mt-2" />
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Min Height: {editFormMinHeight || 'Auto'}px</Label>
                <Slider value={[editFormMinHeight]} onValueChange={([v]) => setEditFormMinHeight(v)} min={0} max={1200} step={20} className="mt-2" />
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Border Radius: {editFormBorderRadius}px</Label>
                <Slider value={[editFormBorderRadius]} onValueChange={([v]) => setEditFormBorderRadius(v)} min={0} max={40} step={1} className="mt-2" />
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Padding: {editFormPadding}px</Label>
                <Slider value={[editFormPadding]} onValueChange={([v]) => setEditFormPadding(v)} min={12} max={80} step={2} className="mt-2" />
              </div>
              <div className="flex items-center justify-between">
                <Label className="text-xs text-muted-foreground">Bold Labels</Label>
                <Switch checked={editBoldLabels} onCheckedChange={setEditBoldLabels} />
              </div>
            </SidebarCard>

            {/* UTM */}
            <SidebarCard title="UTM Parameters" icon={<Settings2 className="w-4 h-4" />}>
              <div><Label className="text-xs text-muted-foreground">Source</Label><Input value={editUtmSource} onChange={(e) => setEditUtmSource(e.target.value)} placeholder="maia_sethna" className="h-8 text-sm" /></div>
              <div><Label className="text-xs text-muted-foreground">Channel</Label><Input value={editUtmChannel} onChange={(e) => setEditUtmChannel(e.target.value)} placeholder="partner_maia_sethna" className="h-8 text-sm" /></div>
              <div><Label className="text-xs text-muted-foreground">Campaign</Label><Input value={editUtmCampaign} onChange={(e) => setEditUtmCampaign(e.target.value)} placeholder="maia_sethna" className="h-8 text-sm" /></div>
            </SidebarCard>

            {/* Fields */}
            <SidebarCard title="Fields" action={<Button variant="outline" size="sm" onClick={openAddField} className="gap-1 h-7 text-xs"><Plus className="w-3 h-3" /> Add</Button>}>
              <div className="space-y-1 max-h-72 overflow-y-auto">
                {editFields.map((field) => (
                  <div key={field.id} className="flex items-center gap-1.5 px-2 py-1.5 rounded-lg bg-muted/50 text-sm group">
                    <GripVertical className="w-3 h-3 text-muted-foreground/50 shrink-0" />
                    <span className="flex-1 truncate text-xs">{field.label}</span>
                    <Badge variant="outline" className="text-[10px] h-5 px-1.5">{field.gridCol === 'half' ? '½' : '1'}</Badge>
                    <Button variant="ghost" size="sm" className="h-5 w-5 p-0 opacity-0 group-hover:opacity-100" onClick={() => openEditField(field)}><Pencil className="w-2.5 h-2.5" /></Button>
                    <Button variant="ghost" size="sm" className="h-5 w-5 p-0 opacity-0 group-hover:opacity-100 text-destructive" onClick={() => deleteField(field.id)}><Trash2 className="w-2.5 h-2.5" /></Button>
                  </div>
                ))}
              </div>
            </SidebarCard>
          </div>
        )}

        {/* Form preview */}
        <div className={`flex-1 w-full ${editMode ? 'max-w-4xl' : 'max-w-3xl mx-auto'}`}>
          <FormRenderer form={previewForm} preview />
        </div>
      </div>

      <FieldEditorDialog field={editingField} open={fieldDialogOpen} onClose={() => setFieldDialogOpen(false)} onSave={saveField} />
    </div>
  );
}

function SidebarCard({ title, icon, action, children }: { title: string; icon?: React.ReactNode; action?: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="bg-card border border-border rounded-xl p-4 space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-sm flex items-center gap-2">{icon}{title}</h3>
        {action}
      </div>
      {children}
    </div>
  );
}
