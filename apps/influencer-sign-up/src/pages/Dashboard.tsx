import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@project/components/ui/button';
import { Badge } from '@project/components/ui/badge';
import { Skeleton } from '@project/components/ui/skeleton';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from '@project/components/ui/alert-dialog';
import { Plus, Eye, Share2, Trash2, BarChart3, ArrowLeft, Copy, Check, Sparkles, Sheet, LayoutGrid, List, Table2, Search } from 'lucide-react';
import { Input } from '@project/components/ui/input';
import { getForms, deleteForm, updateForm, GetFormsOutputType } from '@/lib/api';
import { toast } from 'sonner';
import { BRAND_LOGO } from '@/lib/constants';
import { format } from 'date-fns';
import { motion } from 'framer-motion';

type FormItem = GetFormsOutputType['forms'][0];

type ViewMode = 'grid' | 'list' | 'table';
const VIEWS: { value: ViewMode; label: string; icon: React.ElementType }[] = [
  { value: 'grid', label: 'Cards', icon: LayoutGrid },
  { value: 'list', label: 'List', icon: List },
  { value: 'table', label: 'Table', icon: Table2 },
];
const VIEW_KEY = 'p57.dashboard.view';

// A form's own accent, so the dashboard mirrors what the guest sees.
const accentOf = (form: FormItem) => form.accentColor || '#7c3aed';

const statusStyle = (status: string) =>
  status === 'Published'
    ? { background: 'rgba(22,163,74,0.12)', color: '#15803d', border: '1px solid rgba(22,163,74,0.25)' }
    : status === 'Closed'
      ? { background: 'rgba(220,38,38,0.1)', color: '#b91c1c', border: '1px solid rgba(220,38,38,0.22)' }
      : { background: 'rgba(100,116,139,0.12)', color: '#475569', border: '1px solid rgba(100,116,139,0.25)' };

export default function Dashboard() {
  const [forms, setForms] = useState<FormItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'All' | 'Draft' | 'Published' | 'Closed'>('All');
  // The chosen view is a per-browser convenience, so a failed read must not break the page.
  const [view, setView] = useState<ViewMode>(() => {
    try {
      const saved = localStorage.getItem(VIEW_KEY);
      return saved === 'list' || saved === 'table' ? saved : 'grid';
    } catch { return 'grid'; }
  });
  const navigate = useNavigate();

  const changeView = (next: ViewMode) => {
    setView(next);
    try { localStorage.setItem(VIEW_KEY, next); } catch { /* private mode */ }
  };

  const visible = forms.filter((form) => {
    if (statusFilter !== 'All' && form.status !== statusFilter) return false;
    const needle = query.trim().toLowerCase();
    if (!needle) return true;
    return `${form.title} ${form.description} ${form.slug}`.toLowerCase().includes(needle);
  });

  useEffect(() => {
    getForms({}).then(({ forms }) => {
      setForms(forms);
      setLoading(false);
    });
  }, []);

  const handleDelete = async (id: string) => {
    setForms((prev) => prev.filter((f) => f.id !== id));
    await deleteForm({ id });
    toast.success('Form deleted');
  };

  const handlePublish = async (id: string) => {
    await updateForm({ id, status: 'Published' });
    setForms((prev) => prev.map((f) => (f.id === id ? { ...f, status: 'Published' } : f)));
    toast.success('Form published!');
  };

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      {/* Ambient blobs */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute -top-40 -right-40 w-[500px] h-[500px] rounded-full opacity-[0.05]"
          style={{ background: 'radial-gradient(circle, #a855f7 0%, transparent 70%)' }} />
        <div className="absolute -bottom-40 -left-40 w-[400px] h-[400px] rounded-full opacity-[0.04]"
          style={{ background: 'radial-gradient(circle, #06b6d4 0%, transparent 70%)' }} />
      </div>

      <nav className="border-b border-border/50 bg-background/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => navigate('/')}>
              <ArrowLeft className="w-4 h-4" />
            </Button>
            <img src={BRAND_LOGO} alt="Physique 57" className="h-10 w-auto" />
            <div className="h-5 w-px bg-border/50" />
            <span className="font-semibold text-lg">My Forms</span>
          </div>
          <Button onClick={() => navigate('/')} className="gap-2 neu-pressable" style={{ background: 'linear-gradient(135deg, #8b5cf6, #6d28d9)' }}>
            <Plus className="w-4 h-4" /> New form
          </Button>
        </div>
      </nav>

      <div className="container mx-auto px-4 py-8 relative z-10">
        {/* Toolbar */}
        {!loading && forms.length > 0 && (
          <div className="flex flex-wrap items-center gap-3 mb-6">
            <div className="relative flex-1 min-w-[200px] max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search forms"
                aria-label="Search forms" className="h-10 pl-9 neu-inset border-0" />
            </div>

            <div className="flex items-center gap-1 rounded-xl neu-inset p-1" role="group" aria-label="Filter by status">
              {(['All', 'Draft', 'Published', 'Closed'] as const).map((value) => (
                <button key={value} type="button" onClick={() => setStatusFilter(value)}
                  aria-pressed={statusFilter === value}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-shadow ${statusFilter === value ? 'neu-raised-sm text-foreground' : 'text-muted-foreground hover:text-foreground'}`}>
                  {value}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-1 rounded-xl neu-inset p-1 ml-auto" role="group" aria-label="View mode">
              {VIEWS.map((option) => (
                <button key={option.value} type="button" onClick={() => changeView(option.value)}
                  aria-pressed={view === option.value} title={option.label}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-shadow ${view === option.value ? 'neu-raised-sm text-foreground' : 'text-muted-foreground hover:text-foreground'}`}>
                  <option.icon className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">{option.label}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {loading ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => <Skeleton key={i} className="h-48 rounded-2xl" />)}
          </div>
        ) : forms.length === 0 ? (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center py-20">
            <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4 neu-raised">
              <Sparkles className="w-8 h-8" style={{ color: 'hsl(var(--primary))' }} />
            </div>
            <h2 className="text-xl font-semibold mb-2">No forms yet</h2>
            <p className="text-muted-foreground mb-6">Describe what you need and the builder writes the form.</p>
            <Button onClick={() => navigate('/')} className="neu-pressable" style={{ background: 'linear-gradient(135deg, #8b5cf6, #6d28d9)' }}>Create a form</Button>
          </motion.div>
        ) : visible.length === 0 ? (
          <div className="text-center py-16">
            <h2 className="text-lg font-semibold mb-1">Nothing matches</h2>
            <p className="text-muted-foreground text-sm mb-4">No form matches "{query || statusFilter}".</p>
            <Button variant="outline" onClick={() => { setQuery(''); setStatusFilter('All'); }}>Clear filters</Button>
          </div>
        ) : view === 'grid' ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {visible.map((form, i) => (
              <motion.div key={form.id} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: Math.min(i, 8) * 0.04 }}>
                <FormCard form={form} onDelete={handleDelete} onPublish={handlePublish}
                  onView={() => navigate(`/form/${form.id}/preview`)}
                  onSubmissions={() => navigate(`/form/${form.id}/submissions`)} />
              </motion.div>
            ))}
          </div>
        ) : view === 'list' ? (
          <div className="space-y-2.5">
            {visible.map((form) => (
              <div key={form.id} className="flex items-center gap-4 rounded-xl neu-raised px-4 py-3">
                <span aria-hidden className="w-1.5 h-10 rounded-full shrink-0" style={{ background: accentOf(form) }} />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-sm truncate">{form.title}</h3>
                    <Badge className="shrink-0 text-[10px]" style={statusStyle(form.status)}>{form.status}</Badge>
                  </div>
                  <p className="text-xs text-muted-foreground truncate">{form.description}</p>
                </div>
                <span className="hidden sm:flex items-center gap-1 text-xs text-muted-foreground shrink-0">
                  <BarChart3 className="w-3.5 h-3.5" />
                  {form.submissionCount}{form.submissionLimit > 0 ? `/${form.submissionLimit}` : ''}
                </span>
                {form.createdAt && (
                  <span className="hidden md:inline text-xs text-muted-foreground shrink-0">{format(new Date(form.createdAt), 'MMM d, yyyy')}</span>
                )}
                <div className="flex items-center gap-1 shrink-0">
                  <Button variant="ghost" size="sm" onClick={() => navigate(`/form/${form.id}/preview`)} aria-label={`Open ${form.title}`}><Eye className="w-3.5 h-3.5" /></Button>
                  <Button variant="ghost" size="sm" onClick={() => navigate(`/form/${form.id}/submissions`)} aria-label={`Responses for ${form.title}`}><BarChart3 className="w-3.5 h-3.5" /></Button>
                  <DeleteFormButton form={form} onDelete={handleDelete} />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="rounded-xl neu-raised overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border text-left">
                    <th scope="col" className="px-4 py-3 font-semibold">Form</th>
                    <th scope="col" className="px-4 py-3 font-semibold">Status</th>
                    <th scope="col" className="px-4 py-3 font-semibold text-right">Responses</th>
                    <th scope="col" className="px-4 py-3 font-semibold">Created</th>
                    <th scope="col" className="px-4 py-3 font-semibold text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {visible.map((form) => (
                    <tr key={form.id} className="border-b border-border/60 last:border-0">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2.5 min-w-0">
                          <span aria-hidden className="w-2 h-2 rounded-full shrink-0" style={{ background: accentOf(form) }} />
                          <span className="truncate font-medium max-w-[280px]">{form.title}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3"><Badge className="text-[10px]" style={statusStyle(form.status)}>{form.status}</Badge></td>
                      <td className="px-4 py-3 text-right tabular-nums">
                        {form.submissionCount}{form.submissionLimit > 0 ? `/${form.submissionLimit}` : ''}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground whitespace-nowrap">
                        {form.createdAt ? format(new Date(form.createdAt), 'MMM d, yyyy') : '—'}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-1">
                          <Button variant="ghost" size="sm" onClick={() => navigate(`/form/${form.id}/preview`)} aria-label={`Open ${form.title}`}><Eye className="w-3.5 h-3.5" /></Button>
                          <Button variant="ghost" size="sm" onClick={() => navigate(`/form/${form.id}/submissions`)} aria-label={`Responses for ${form.title}`}><BarChart3 className="w-3.5 h-3.5" /></Button>
                          <DeleteFormButton form={form} onDelete={handleDelete} />
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// Shared by the list and table views, which have no room for a full button row.
function DeleteFormButton({ form, onDelete }: { form: FormItem; onDelete: (id: string) => void }) {
  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive" aria-label={`Delete ${form.title}`}>
          <Trash2 className="w-3.5 h-3.5" />
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete form?</AlertDialogTitle>
          <AlertDialogDescription>This will permanently delete "{form.title}" and all its submissions.</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={() => onDelete(form.id)}>Delete</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

function FormCard({
  form, onDelete, onPublish, onView, onSubmissions,
}: {
  form: FormItem;
  onDelete: (id: string) => void;
  onPublish: (id: string) => void;
  onView: () => void;
  onSubmissions: () => void;
}) {
  const [copied, setCopied] = useState(false);
  const shareUrl = form.shareUrl || `${window.location.origin}/f/${form.slug}`;

  const copyLink = () => {
    navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    toast.success('Link copied!');
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="rounded-2xl neu-raised overflow-hidden h-full">
      <div className="h-1.5" style={{ background: accentOf(form) }} />
      <div className="p-5">
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-base truncate">{form.title}</h3>
            <p className="text-sm text-muted-foreground truncate mt-0.5">{form.description}</p>
          </div>
          <Badge className="ml-2 shrink-0" style={statusStyle(form.status)}>{form.status}</Badge>
        </div>
        <div className="flex items-center gap-4 text-xs text-muted-foreground mb-4">
          <span className={`flex items-center gap-1${form.submissionLimit > 0 && form.submissionCount >= form.submissionLimit ? ' text-amber-400' : ''}`}><BarChart3 className="w-3.5 h-3.5" />{form.submissionCount}{form.submissionLimit > 0 ? `/${form.submissionLimit}` : ''} responses</span>
          {form.createdAt && <span>{format(new Date(form.createdAt), 'MMM d, yyyy')}</span>}
          {form.sheetUrl && <a href={form.sheetUrl} target="_blank" rel="noreferrer" className="flex items-center gap-1 hover:text-foreground"><Sheet className="w-3.5 h-3.5" />Sheet</a>}
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={onView} className="gap-1.5 flex-1 neu-pressable">
            <Eye className="w-3.5 h-3.5" /> View
          </Button>
          {form.status === 'Published' ? (
            <Button variant="outline" size="sm" onClick={copyLink} className="gap-1.5 flex-1 neu-pressable">
              {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              {copied ? 'Copied' : 'Share'}
            </Button>
          ) : (
            <Button variant="outline" size="sm" onClick={() => onPublish(form.id)} className="gap-1.5 flex-1 neu-pressable">
              <Share2 className="w-3.5 h-3.5" /> Publish
            </Button>
          )}
          <Button variant="outline" size="sm" onClick={onSubmissions} className="gap-1.5">
            <BarChart3 className="w-3.5 h-3.5" />
          </Button>
          <DeleteFormButton form={form} onDelete={onDelete} />
        </div>
      </div>
    </div>
  );
}
