import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Textarea } from '@/components/ui/textarea';
import { Plus, Pencil, Trash2 } from 'lucide-react';
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

export default function AdminSeries() {
  const { t } = useTranslation();
  const [series, setSeries] = useState<DbSeries[]>([]);
  const [open, setOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState<SeriesForm>(emptyForm);
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  const load = async () => {
    const { data } = await supabase.from('series').select('*').order('created_at', { ascending: false });
    if (data) setSeries(data);
  };

  useEffect(() => { load(); }, []);

  const openCreate = () => { setEditId(null); setForm(emptyForm); setOpen(true); };
  const openEdit = (s: DbSeries) => {
    setEditId(s.id);
    setForm({
      title_ar: s.title_ar, title_en: s.title_en, slug: s.slug,
      description_ar: s.description_ar ?? '', description_en: s.description_en ?? '',
      poster_image: s.poster_image ?? '', backdrop_image: s.backdrop_image ?? '',
      release_year: s.release_year, genre: (s.genre ?? []).join(', '),
      tags: (s.tags ?? []).join(', '), rating: s.rating ?? 0,
    });
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

  const f = (key: keyof SeriesForm, value: string | number) => setForm(p => ({ ...p, [key]: value }));

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
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto bg-card">
          <DialogHeader>
            <DialogTitle>{editId ? t('admin.editSeries') : t('admin.newSeries')}</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-4">
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
              <Input value={form.poster_image} onChange={e => f('poster_image', e.target.value)} />
            </div>
            <div className="space-y-1">
              <label className="text-sm text-muted-foreground">{t('admin.backdropUrl')}</label>
              <Input value={form.backdrop_image} onChange={e => f('backdrop_image', e.target.value)} />
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
