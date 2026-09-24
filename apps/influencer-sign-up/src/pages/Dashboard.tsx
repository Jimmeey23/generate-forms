import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@project/components/ui/button';
import { Badge } from '@project/components/ui/badge';
import { Skeleton } from '@project/components/ui/skeleton';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from '@project/components/ui/alert-dialog';
import { Plus, Eye, Share2, Trash2, BarChart3, ArrowLeft, Copy, Check, Sparkles } from 'lucide-react';
import { getForms, deleteForm, updateForm, GetFormsOutputType } from '@/lib/api';
import { toast } from 'sonner';
import { getTheme } from '@/lib/colors';
import { BRAND_LOGO } from '@/lib/constants';
import { format } from 'date-fns';
import { motion } from 'framer-motion';

type FormItem = GetFormsOutputType['forms'][0];

export default function Dashboard() {
  const [forms, setForms] = useState<FormItem[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

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
            <img src={BRAND_LOGO} alt="Physique 57" className="h-8 brightness-0 invert" />
            <div className="h-5 w-px bg-border/50" />
            <span className="font-semibold text-lg">My Forms</span>
          </div>
          <Button onClick={() => navigate('/')} className="gap-2" style={{ background: 'linear-gradient(135deg, #a855f7, #7c3aed)' }}>
            <Plus className="w-4 h-4" /> New Form
          </Button>
        </div>
      </nav>

      <div className="container mx-auto px-4 py-8 relative z-10">
        {loading ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => <Skeleton key={i} className="h-48 rounded-2xl" />)}
          </div>
        ) : forms.length === 0 ? (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
            className="text-center py-20">
            <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4"
              style={{ background: 'rgba(168,85,247,0.1)', border: '1px solid rgba(168,85,247,0.15)' }}>
              <Sparkles className="w-8 h-8" style={{ color: '#a855f7' }} />
            </div>
            <h2 className="text-xl font-semibold mb-2">No forms yet</h2>
            <p className="text-muted-foreground mb-6">Create your first Physique 57 form with AI</p>
            <Button onClick={() => navigate('/')} style={{ background: 'linear-gradient(135deg, #a855f7, #7c3aed)' }}>Create Form</Button>
          </motion.div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {forms.map((form, i) => (
              <motion.div key={form.id} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
                <FormCard
                  form={form}
                  onDelete={handleDelete}
                  onPublish={handlePublish}
                  onView={() => navigate(`/form/${form.id}/preview`)}
                  onSubmissions={() => navigate(`/form/${form.id}/submissions`)}
                />
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
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
  const theme = getTheme(form.themeColor);
  const shareUrl = form.shareUrl || `${window.location.origin}/f/${form.slug}`;

  const copyLink = () => {
    navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    toast.success('Link copied!');
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="border border-border/60 rounded-2xl bg-card overflow-hidden hover:shadow-lg transition-all hover:border-purple-500/20 group">
      <div className="h-1.5" style={{ background: `linear-gradient(90deg, #a855f7, #06b6d4)` }} />
      <div className="p-5">
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-base truncate">{form.title}</h3>
            <p className="text-sm text-muted-foreground truncate mt-0.5">{form.description}</p>
          </div>
          <Badge variant={form.status === 'Published' ? 'default' : 'secondary'}
            className={`ml-2 shrink-0 ${form.status === 'Published' ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/20' : ''}`}
            style={form.status === 'Published' ? { background: 'rgba(34,197,94,0.1)', color: '#22c55e', border: '1px solid rgba(34,197,94,0.2)' } : {}}>
            {form.status}
          </Badge>
        </div>
        <div className="flex items-center gap-4 text-xs text-muted-foreground mb-4">
          <span className="flex items-center gap-1"><BarChart3 className="w-3.5 h-3.5" />{form.submissionCount} responses</span>
          {form.createdAt && <span>{format(new Date(form.createdAt), 'MMM d, yyyy')}</span>}
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={onView} className="gap-1.5 flex-1 border-border/50 hover:border-purple-500/30">
            <Eye className="w-3.5 h-3.5" /> View
          </Button>
          {form.status === 'Published' ? (
            <Button variant="outline" size="sm" onClick={copyLink} className="gap-1.5 flex-1 border-border/50 hover:border-cyan-500/30">
              {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              {copied ? 'Copied' : 'Share'}
            </Button>
          ) : (
            <Button variant="outline" size="sm" onClick={() => onPublish(form.id)} className="gap-1.5 flex-1 border-border/50 hover:border-emerald-500/30">
              <Share2 className="w-3.5 h-3.5" /> Publish
            </Button>
          )}
          <Button variant="outline" size="sm" onClick={onSubmissions} className="gap-1.5 border-border/50">
            <BarChart3 className="w-3.5 h-3.5" />
          </Button>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive">
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
        </div>
      </div>
    </div>
  );
}
