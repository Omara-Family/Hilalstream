import { useEffect, useState, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Textarea } from '@/components/ui/textarea';
import { Plus, Pencil, Trash2, Sparkles, Loader2, Copy, Check, Upload } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import type { DbSeries } from '@/lib/api';

type SeriesForm = {
  title_ar: string; title_en: string; slug: string;
  description_ar: string; description_en: string;
  poster_image: string; backdrop_image: string;
  release_year: number; genre: string; tags: string; rating: number;
};

const emptyForm: SeriesForm = {
  title_ar: '', title_en: '', slug: '', description_ar: '', description_en: '',
  poster_image: '', backdrop_image: '', release_year: new Date().getFullYear(),
  genre: '', tags: '', rating: 0,
};

type AiTask = 'seo' | 'improve_description' | 'social_caption' | 'suggest_tags';

export default function AdminSeries() {
  const { t, i18n } = useTranslation();
  const isAr = i18n.language === 'ar';
  const [series, setSeries] = useState<DbSeries[]>([]);
  const [open, setOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState<SeriesForm>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [aiLoading, setAiLoading] = useState<AiTask | null>(null);
  const [aiResult, setAiResult] = useState<any>(null);
  const [copied, setCopied] = useState<string | null>(null);
  const [uploading, setUploading] = useState<'poster' | 'backdrop' | null>(null);
  const posterRef = useRef<HTMLInputElement>(null);
  const backdropRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const resizeImage = (file: File, maxWidth: number, maxHeight: number, quality = 0.92): Promise<Blob> => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        let { width, height } = img;
        // Only upscale if image is smaller than target AND it's a backdrop
        // For posters, only downscale
        if (width < maxWidth && maxWidth >= 1920) {
          // Upscale small backdrops to minimum 1920px
          const scale = maxWidth / width;
          width = maxWidth;
          height = Math.round(height * scale);
        } else if (width > maxWidth) {
          // Downscale large images
          const scale = maxWidth / width;
          width = maxWidth;
          height = Math.round(height * scale);
        }
        if (height > maxHeight) {
          const scale = maxHeight / height;
          height = maxHeight;
          width = Math.round(width * scale);
        }
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d')!;
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        ctx.drawImage(img, 0, 0, width, height);
        canvas.toBlob(
          (blob) => blob ? resolve(blob) : reject(new Error('Canvas toBlob failed')),
          'image/jpeg',
          quality
        );
      };
      img.onerror = () => reject(new Error('Failed to load image'));
      img.src = URL.createObjectURL(file);
    });
  };

  const handleUpload = async (file: File, type: 'poster' | 'backdrop') => {
    setUploading(type);
    try {
      const maxW = type === 'backdrop' ? 1920 : 800;
      const maxH = type === 'backdrop' ? 1080 : 1200;
      const quality = type === 'backdrop' ? 0.95 : 0.92;
      const optimized = await resizeImage(file, maxW, maxH, quality);
      const path = `${Date.now()}-${type}.jpg`;
      const { error } = await supabase.storage.from('posters').upload(path, optimized, {
        upsert: true,
        contentType: 'image/jpeg',
      });
      if (error) throw error;
      const { data: { publicUrl } } = supabase.storage.from('posters').getPublicUrl(path);
      f(type === 'poster' ? 'poster_image' : 'backdrop_image', publicUrl);
      toast({ title: isAr ? 'تم رفع وتحسين الصورة ✓' : 'Image optimized & uploaded ✓' });
    } catch (e: any) {
      toast({ title: isAr ? 'فشل الرفع' : 'Upload failed', description: e.message, variant: 'destructive' });
    } finally {
      setUploading(null);
    }
  };

  const load = async () => {
    const { data } = await supabase.from('series').select('*').order('created_at', { ascending: false });
    if (data) setSeries(data);
  };

  useEffect(() => { load(); }, []);

  const openCreate = () => { setEditId(null); setForm(emptyForm); setAiResult(null); setOpen(true); };
  const openEdit = (s: DbSeries) => {
    setEditId(s.id);
    setForm({
      title_ar: s.title_ar, title_en: s.title_en, slug: s.slug,
      description_ar: s.description_ar ?? '', description_en: s.description_en ?? '',
      poster_image: s.poster_image ?? '', backdrop_image: s.backdrop_image ?? '',
      release_year: s.release_year, genre: (s.genre ?? []).join(', '),
      tags: (s.tags ?? []).join(', '), rating: s.rating ?? 0,
    });
    setAiResult(null);
    setOpen(true);
  };

  const save = async () => {
    if (saving) return;
    setSaving(true);
    try {
      const payload = {
        title_ar: form.title_ar, title_en: form.title_en, slug: form.slug,
        description_ar: form.description_ar, description_en: form.description_en,
        poster_image: form.poster_image, backdrop_image: form.backdrop_image,
        release_year: form.release_year, rating: form.rating,
        genre: form.genre.split(',').map(s => s.trim()).filter(Boolean),
        tags: form.tags.split(',').map(s => s.trim()).filter(Boolean),
      };
      const { error } = editId
        ? await supabase.from('series').update(payload).eq('id', editId)
        : await supabase.from('series').insert(payload);
      if (error) {
        toast({ title: t('common.error'), description: error.message, variant: 'destructive' });
      } else {
        toast({ title: editId ? t('admin.updated') : t('admin.created') });
        setOpen(false); load();
      }
    } finally {
      setSaving(false);
    }
  };

  const deleteSeries = async () => {
    if (!deleteId) return;
    const { error } = await supabase.from('series').delete().eq('id', deleteId);
    if (error) {
      toast({ title: t('common.error'), description: error.message, variant: 'destructive' });
    } else {
      toast({ title: t('admin.deleted') }); setDeleteId(null); load();
    }
  };

  const runAi = async (task: AiTask) => {
    if (aiLoading) return;
    if (!form.title_en && !form.title_ar) {
      toast({ title: isAr ? 'أدخل عنوان المسلسل أولاً' : 'Enter a series title first', variant: 'destructive' });
      return;
    }
    setAiLoading(task);
    setAiResult(null);
    try {
      const { data, error } = await supabase.functions.invoke('admin-ai', {
        body: {
          task,
          context: {
            title_en: form.title_en,
            title_ar: form.title_ar,
            description_en: form.description_en,
            description_ar: form.description_ar,
            genre: form.genre,
            tags: form.tags,
          },
        },
      });
      if (error) throw error;
      if (data?.error) {
        toast({ title: 'AI Error', description: data.error, variant: 'destructive' });
      } else {
        setAiResult({ task, ...data.result });
      }
    } catch (e: any) {
      toast({ title: 'AI Error', description: e.message || 'Failed', variant: 'destructive' });
    } finally {
      setAiLoading(null);
    }
  };

  const applyAiResult = (key: string, value: string) => {
    if (key === 'description_en') setForm(p => ({ ...p, description_en: value }));
    else if (key === 'description_ar') setForm(p => ({ ...p, description_ar: value }));
    else if (key === 'tags') setForm(p => ({ ...p, tags: value }));
    toast({ title: isAr ? 'تم التطبيق ✓' : 'Applied ✓' });
  };

  const copyText = (key: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(key);
    setTimeout(() => setCopied(null), 2000);
  };

  const f = (key: keyof SeriesForm, value: string | number) => setForm(p => ({ ...p, [key]: value }));

  const aiButtons: { task: AiTask; label: string; icon: string }[] = [
    { task: 'seo', label: isAr ? '🔍 توليد SEO' : '🔍 Generate SEO', icon: '🔍' },
    { task: 'improve_description', label: isAr ? '✍️ تحسين الوصف' : '✍️ Improve Description', icon: '✍️' },
    { task: 'social_caption', label: isAr ? '📱 كابشن سوشال' : '📱 Social Caption', icon: '📱' },
    { task: 'suggest_tags', label: isAr ? '🏷️ اقتراح تاغات' : '🏷️ Suggest Tags', icon: '🏷️' },
  ];

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-foreground">{t('admin.seriesManagement')}</h2>
        <Button onClick={openCreate}><Plus className="h-4 w-4 me-2" />{t('admin.addSeries')}</Button>
      </div>

      <div className="rounded-md border border-border overflow-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t('admin.titleEn')}</TableHead>
              <TableHead>{t('admin.titleAr')}</TableHead>
              <TableHead>{t('admin.year')}</TableHead>
              <TableHead>{t('admin.rating')}</TableHead>
              <TableHead>{t('admin.views')}</TableHead>
              <TableHead className="w-24">{t('admin.actions')}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {series.map(s => (
              <TableRow key={s.id}>
                <TableCell className="font-medium">{s.title_en}</TableCell>
                <TableCell>{s.title_ar}</TableCell>
                <TableCell>{s.release_year}</TableCell>
                <TableCell>{s.rating}</TableCell>
                <TableCell>{(s.total_views ?? 0).toLocaleString()}</TableCell>
                <TableCell>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="icon" onClick={() => openEdit(s)}><Pencil className="h-4 w-4" /></Button>
                    <Button variant="ghost" size="icon" onClick={() => setDeleteId(s.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto bg-card">
          <DialogHeader>
            <DialogTitle>{editId ? t('admin.editSeries') : t('admin.newSeries')}</DialogTitle>
          </DialogHeader>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Form fields */}
            <div className="lg:col-span-2 grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-sm text-muted-foreground">{t('admin.titleEn')}</label>
                <Input value={form.title_en} onChange={e => f('title_en', e.target.value)} />
              </div>
              <div className="space-y-1">
                <label className="text-sm text-muted-foreground">{t('admin.titleAr')}</label>
                <Input value={form.title_ar} onChange={e => f('title_ar', e.target.value)} />
              </div>
              <div className="space-y-1">
                <label className="text-sm text-muted-foreground">{t('admin.slug')}</label>
                <Input value={form.slug} onChange={e => f('slug', e.target.value)} />
              </div>
              <div className="space-y-1">
                <label className="text-sm text-muted-foreground">{t('admin.year')}</label>
                <Input type="number" value={form.release_year} onChange={e => f('release_year', parseInt(e.target.value))} />
              </div>
              <div className="space-y-1 col-span-2">
                <label className="text-sm text-muted-foreground">{t('admin.descEn')}</label>
                <Textarea value={form.description_en} onChange={e => f('description_en', e.target.value)} />
              </div>
              <div className="space-y-1 col-span-2">
                <label className="text-sm text-muted-foreground">{t('admin.descAr')}</label>
                <Textarea value={form.description_ar} onChange={e => f('description_ar', e.target.value)} />
              </div>
              <div className="space-y-1">
                <label className="text-sm text-muted-foreground">{t('admin.posterUrl')}</label>
                <div className="flex gap-2">
                  <Input value={form.poster_image} onChange={e => f('poster_image', e.target.value)} className="flex-1" />
                  <Button type="button" variant="outline" size="icon" onClick={() => posterRef.current?.click()} disabled={uploading === 'poster'}>
                    {uploading === 'poster' ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                  </Button>
                </div>
                <input ref={posterRef} type="file" accept="image/*" className="hidden" onChange={e => { if (e.target.files?.[0]) handleUpload(e.target.files[0], 'poster'); }} />
                {form.poster_image && <img src={form.poster_image} alt="" className="h-16 w-12 object-cover rounded mt-1" />}
              </div>
              <div className="space-y-1">
                <label className="text-sm text-muted-foreground">{t('admin.backdropUrl')}</label>
                <div className="flex gap-2">
                  <Input value={form.backdrop_image} onChange={e => f('backdrop_image', e.target.value)} className="flex-1" />
                  <Button type="button" variant="outline" size="icon" onClick={() => backdropRef.current?.click()} disabled={uploading === 'backdrop'}>
                    {uploading === 'backdrop' ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                  </Button>
                </div>
                <input ref={backdropRef} type="file" accept="image/*" className="hidden" onChange={e => { if (e.target.files?.[0]) handleUpload(e.target.files[0], 'backdrop'); }} />
                {form.backdrop_image && <img src={form.backdrop_image} alt="" className="h-12 w-20 object-cover rounded mt-1" />}
              </div>
              <div className="space-y-1">
                <label className="text-sm text-muted-foreground">{t('admin.genre')}</label>
                <Input value={form.genre} onChange={e => f('genre', e.target.value)} />
              </div>
              <div className="space-y-1">
                <label className="text-sm text-muted-foreground">{t('admin.tags')}</label>
                <Input value={form.tags} onChange={e => f('tags', e.target.value)} />
              </div>
              <div className="space-y-1">
                <label className="text-sm text-muted-foreground">{t('admin.rating')}</label>
                <Input type="number" step="0.1" min="0" max="10" value={form.rating} onChange={e => f('rating', parseFloat(e.target.value))} />
              </div>
            </div>

            {/* AI Assistant Panel */}
            <div className="space-y-3">
              <div className="flex items-center gap-2 mb-2">
                <Sparkles className="h-5 w-5 text-primary" />
                <h3 className="text-sm font-bold text-foreground">
                  {isAr ? 'مساعد AI' : 'AI Assistant'}
                </h3>
              </div>
              <div className="grid grid-cols-1 gap-2">
                {aiButtons.map(({ task, label }) => (
                  <Button
                    key={task}
                    variant="outline"
                    size="sm"
                    className="justify-start text-xs"
                    disabled={!!aiLoading}
                    onClick={() => runAi(task)}
                  >
                    {aiLoading === task ? <Loader2 className="h-3 w-3 me-2 animate-spin" /> : null}
                    {label}
                  </Button>
                ))}
              </div>

              {/* AI Results */}
              {aiResult && (
                <div className="mt-3 p-3 rounded-lg bg-secondary border border-border space-y-3 text-xs">
                  <p className="text-primary font-semibold text-xs">
                    {isAr ? '✨ نتائج AI' : '✨ AI Results'}
                  </p>
                  {Object.entries(aiResult).map(([key, value]) => {
                    if (key === 'task') return null;
                    const displayValue = Array.isArray(value) ? (value as string[]).join(', ') : String(value);
                    const canApply = ['description_en', 'description_ar', 'tags'].includes(key);
                    return (
                      <div key={key} className="space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="font-medium text-muted-foreground">{key}</span>
                          <div className="flex gap-1">
                            <button
                              onClick={() => copyText(key, displayValue)}
                              className="p-1 rounded hover:bg-accent transition-colors"
                              title="Copy"
                            >
                              {copied === key ? <Check className="h-3 w-3 text-green-500" /> : <Copy className="h-3 w-3 text-muted-foreground" />}
                            </button>
                            {canApply && (
                              <button
                                onClick={() => applyAiResult(key, displayValue)}
                                className="px-2 py-0.5 rounded bg-primary text-primary-foreground text-[10px] hover:opacity-90"
                              >
                                {isAr ? 'طبّق' : 'Apply'}
                              </button>
                            )}
                          </div>
                        </div>
                        <p className="text-foreground bg-background p-2 rounded text-[11px] leading-relaxed break-words">
                          {displayValue}
                        </p>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)} disabled={saving}>{t('common.cancel')}</Button>
            <Button onClick={save} disabled={saving}>{saving ? '...' : (editId ? t('admin.updated') : t('admin.created'))}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteId} onOpenChange={(o) => !o && setDeleteId(null)}>
        <AlertDialogContent className="bg-card">
          <AlertDialogHeader>
            <AlertDialogTitle>{t('admin.deleteSeries')}</AlertDialogTitle>
            <AlertDialogDescription>{t('admin.deleteSeriesDesc')}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('common.cancel')}</AlertDialogCancel>
            <AlertDialogAction onClick={deleteSeries} className="bg-destructive text-destructive-foreground">{t('common.delete')}</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
