import { useEffect, useState, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Textarea } from '@/components/ui/textarea';
import { Plus, Pencil, Trash2, Loader2, Upload } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

type ProgramForm = {
  title_ar: string; title_en: string; slug: string;
  description_ar: string; description_en: string;
  poster_image: string; backdrop_image: string;
  release_year: number; genre: string; tags: string; rating: number;
};

const emptyForm: ProgramForm = {
  title_ar: '', title_en: '', slug: '', description_ar: '', description_en: '',
  poster_image: '', backdrop_image: '', release_year: new Date().getFullYear(),
  genre: '', tags: '', rating: 0,
};

export default function AdminPrograms() {
  const { t, i18n } = useTranslation();
  const isAr = i18n.language === 'ar';
  const [programs, setPrograms] = useState<any[]>([]);
  const [open, setOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState<ProgramForm>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState<'poster' | 'backdrop' | null>(null);
  const posterRef = useRef<HTMLInputElement>(null);
  const backdropRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const resizeImage = (file: File, maxWidth: number, maxHeight: number, quality = 0.92): Promise<Blob> => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        let { width, height } = img;
        if (width < maxWidth && maxWidth >= 1920) {
          const scale = maxWidth / width;
          width = maxWidth;
          height = Math.round(height * scale);
        } else if (width > maxWidth) {
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
      const path = `programs/${Date.now()}-${type}.jpg`;
      const { error } = await supabase.storage.from('posters').upload(path, optimized, {
        upsert: true, contentType: 'image/jpeg',
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
    const { data } = await supabase.from('programs').select('*').order('created_at', { ascending: false });
    if (data) setPrograms(data);
  };

  useEffect(() => { load(); }, []);

  const openCreate = () => { setEditId(null); setForm(emptyForm); setOpen(true); };
  const openEdit = (p: any) => {
    setEditId(p.id);
    setForm({
      title_ar: p.title_ar, title_en: p.title_en, slug: p.slug,
      description_ar: p.description_ar ?? '', description_en: p.description_en ?? '',
      poster_image: p.poster_image ?? '', backdrop_image: p.backdrop_image ?? '',
      release_year: p.release_year, genre: (p.genre ?? []).join(', '),
      tags: (p.tags ?? []).join(', '), rating: p.rating ?? 0,
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
        ? await supabase.from('programs').update(payload).eq('id', editId)
        : await supabase.from('programs').insert(payload);
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

  const deleteProgram = async () => {
    if (!deleteId) return;
    const { error } = await supabase.from('programs').delete().eq('id', deleteId);
    if (error) {
      toast({ title: t('common.error'), description: error.message, variant: 'destructive' });
    } else {
      toast({ title: t('admin.deleted') }); setDeleteId(null); load();
    }
  };

  const f = (key: keyof ProgramForm, value: string | number) => setForm(p => ({ ...p, [key]: value }));

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-foreground">{isAr ? 'إدارة البرامج' : 'Programs Management'}</h2>
        <Button onClick={openCreate}><Plus className="h-4 w-4 me-2" />{isAr ? 'إضافة برنامج' : 'Add Program'}</Button>
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
            {programs.map(p => (
              <TableRow key={p.id}>
                <TableCell className="font-medium">{p.title_en}</TableCell>
                <TableCell>{p.title_ar}</TableCell>
                <TableCell>{p.release_year}</TableCell>
                <TableCell>{p.rating}</TableCell>
                <TableCell>{(p.total_views ?? 0).toLocaleString()}</TableCell>
                <TableCell>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="icon" onClick={() => openEdit(p)}><Pencil className="h-4 w-4" /></Button>
                    <Button variant="ghost" size="icon" onClick={() => setDeleteId(p.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto bg-card">
          <DialogHeader>
            <DialogTitle>{editId ? (isAr ? 'تعديل البرنامج' : 'Edit Program') : (isAr ? 'برنامج جديد' : 'New Program')}</DialogTitle>
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
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)} disabled={saving}>{t('common.cancel')}</Button>
            <Button onClick={save} disabled={saving}>{saving ? '...' : (editId ? t('admin.updated') : t('admin.created'))}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteId} onOpenChange={(o) => !o && setDeleteId(null)}>
        <AlertDialogContent className="bg-card">
          <AlertDialogHeader>
            <AlertDialogTitle>{isAr ? 'حذف البرنامج؟' : 'Delete Program?'}</AlertDialogTitle>
            <AlertDialogDescription>{isAr ? 'سيتم حذف البرنامج وجميع حلقاته نهائياً.' : 'This will permanently delete the program and all its episodes.'}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('common.cancel')}</AlertDialogCancel>
            <AlertDialogAction onClick={deleteProgram} className="bg-destructive text-destructive-foreground">{t('common.delete')}</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
