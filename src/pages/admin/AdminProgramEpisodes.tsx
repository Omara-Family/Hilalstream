import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Textarea } from '@/components/ui/textarea';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

type ProgramOption = { id: string; title_en: string };
type EpisodeForm = {
  program_id: string; episode_number: number; title_ar: string;
  title_en: string; video_servers: string; download_url: string;
};

const emptyForm: EpisodeForm = {
  program_id: '', episode_number: 1, title_ar: '', title_en: '',
  video_servers: '[]', download_url: '',
};

export default function AdminProgramEpisodes() {
  const { t, i18n } = useTranslation();
  const isAr = i18n.language === 'ar';
  const [episodes, setEpisodes] = useState<any[]>([]);
  const [programOptions, setProgramOptions] = useState<ProgramOption[]>([]);
  const [filterProgram, setFilterProgram] = useState<string>('all');
  const [open, setOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState<EpisodeForm>(emptyForm);
  const { toast } = useToast();

  const loadPrograms = async () => {
    const { data } = await supabase.from('programs').select('id, title_en').order('title_en');
    if (data) setProgramOptions(data);
  };

  const loadEpisodes = async () => {
    let query = supabase.from('program_episodes').select('*, program:program_id(title_en)').order('episode_number');
    if (filterProgram && filterProgram !== 'all') query = query.eq('program_id', filterProgram);
    const { data } = await query;
    if (data) setEpisodes(data);
  };

  useEffect(() => { loadPrograms(); }, []);
  useEffect(() => { loadEpisodes(); }, [filterProgram]);

  const openCreate = () => { setEditId(null); setForm(emptyForm); setOpen(true); };
  const openEdit = (ep: any) => {
    setEditId(ep.id);
    setForm({
      program_id: ep.program_id, episode_number: ep.episode_number,
      title_ar: ep.title_ar ?? '', title_en: ep.title_en ?? '',
      video_servers: JSON.stringify(ep.video_servers ?? [], null, 2),
      download_url: ep.download_url ?? '',
    });
    setOpen(true);
  };

  const notifyFavoriteUsers = async (programId: string, episodeNumber: number, titleEn: string, titleAr: string) => {
    try {
      const { data: program } = await supabase.from('programs').select('title_en, title_ar, slug').eq('id', programId).single();
      if (!program) return;
      await supabase.functions.invoke('notify-new-episode', {
        body: {
          series_id: programId,
          series_title_en: program.title_en,
          series_title_ar: program.title_ar,
          series_slug: program.slug,
          episode_number: episodeNumber,
          episode_title_en: titleEn,
          episode_title_ar: titleAr,
        },
      });
    } catch (err) {
      console.error('Notification error:', err);
    }
  };

  const save = async () => {
    let servers;
    try { servers = JSON.parse(form.video_servers); } catch {
      toast({ title: t('admin.invalidJson'), description: t('admin.videoServersJsonError'), variant: 'destructive' });
      return;
    }
    const payload = {
      program_id: form.program_id, episode_number: form.episode_number,
      title_ar: form.title_ar, title_en: form.title_en,
      video_servers: servers, download_url: form.download_url || null,
    };
    const isNew = !editId;
    const { error } = isNew
      ? await supabase.from('program_episodes').insert(payload)
      : await supabase.from('program_episodes').update(payload).eq('id', editId);
    if (error) {
      toast({ title: t('common.error'), description: error.message, variant: 'destructive' });
    } else {
      toast({ title: isNew ? t('admin.created') : t('admin.updated') });
      if (isNew) {
        notifyFavoriteUsers(form.program_id, form.episode_number, form.title_en, form.title_ar);
      }
      setOpen(false); loadEpisodes();
    }
  };

  const deleteEpisode = async () => {
    if (!deleteId) return;
    const { error } = await supabase.from('program_episodes').delete().eq('id', deleteId);
    if (error) {
      toast({ title: t('common.error'), description: error.message, variant: 'destructive' });
    } else {
      toast({ title: t('admin.deleted') }); setDeleteId(null); loadEpisodes();
    }
  };

  const f = (key: keyof EpisodeForm, value: string | number) => setForm(p => ({ ...p, [key]: value }));

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-foreground">{isAr ? 'إدارة حلقات البرامج' : 'Program Episodes Management'}</h2>
        <Button onClick={openCreate}><Plus className="h-4 w-4 me-2" />{isAr ? 'إضافة حلقة' : 'Add Episode'}</Button>
      </div>

      <div className="w-64">
        <Select value={filterProgram} onValueChange={setFilterProgram}>
          <SelectTrigger><SelectValue placeholder={isAr ? 'فلتر حسب البرنامج' : 'Filter by program'} /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{isAr ? 'كل البرامج' : 'All Programs'}</SelectItem>
            {programOptions.map(p => <SelectItem key={p.id} value={p.id}>{p.title_en}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      <div className="rounded-md border border-border overflow-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{isAr ? 'البرنامج' : 'Program'}</TableHead>
              <TableHead>{t('admin.epNumber')}</TableHead>
              <TableHead>{t('admin.titleEn')}</TableHead>
              <TableHead>{t('admin.titleAr')}</TableHead>
              <TableHead>{t('admin.views')}</TableHead>
              <TableHead className="w-24">{t('admin.actions')}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {episodes.map(ep => (
              <TableRow key={ep.id}>
                <TableCell className="font-medium">{(ep.program as any)?.title_en ?? '—'}</TableCell>
                <TableCell>{ep.episode_number}</TableCell>
                <TableCell>{ep.title_en}</TableCell>
                <TableCell>{ep.title_ar}</TableCell>
                <TableCell>{(ep.views ?? 0).toLocaleString()}</TableCell>
                <TableCell>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="icon" onClick={() => openEdit(ep)}><Pencil className="h-4 w-4" /></Button>
                    <Button variant="ghost" size="icon" onClick={() => setDeleteId(ep.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
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
            <DialogTitle>{editId ? (isAr ? 'تعديل الحلقة' : 'Edit Episode') : (isAr ? 'حلقة جديدة' : 'New Episode')}</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-sm text-muted-foreground">{isAr ? 'البرنامج' : 'Program'}</label>
              <Select value={form.program_id} onValueChange={v => f('program_id', v)}>
                <SelectTrigger><SelectValue placeholder={isAr ? 'اختر برنامج' : 'Select program'} /></SelectTrigger>
                <SelectContent>
                  {programOptions.map(p => <SelectItem key={p.id} value={p.id}>{p.title_en}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <label className="text-sm text-muted-foreground">{t('admin.epNumber')}</label>
              <Input type="number" value={form.episode_number} onChange={e => f('episode_number', parseInt(e.target.value))} />
            </div>
            <div className="space-y-1">
              <label className="text-sm text-muted-foreground">{t('admin.titleEn')}</label>
              <Input value={form.title_en} onChange={e => f('title_en', e.target.value)} />
            </div>
            <div className="space-y-1">
              <label className="text-sm text-muted-foreground">{t('admin.titleAr')}</label>
              <Input value={form.title_ar} onChange={e => f('title_ar', e.target.value)} />
            </div>
            <div className="space-y-1">
              <label className="text-sm text-muted-foreground">{t('admin.downloadUrl')}</label>
              <Input value={form.download_url} onChange={e => f('download_url', e.target.value)} />
            </div>
            <div className="col-span-2 space-y-1">
              <label className="text-sm text-muted-foreground">{t('admin.videoServers')}</label>
              <Textarea rows={5} className="font-mono text-sm" value={form.video_servers} onChange={e => f('video_servers', e.target.value)} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>{t('common.cancel')}</Button>
            <Button onClick={save}>{editId ? t('admin.updated') : t('admin.created')}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteId} onOpenChange={(o) => !o && setDeleteId(null)}>
        <AlertDialogContent className="bg-card">
          <AlertDialogHeader>
            <AlertDialogTitle>{isAr ? 'حذف الحلقة؟' : 'Delete Episode?'}</AlertDialogTitle>
            <AlertDialogDescription>{isAr ? 'لا يمكن التراجع عن هذا الإجراء.' : 'This action cannot be undone.'}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('common.cancel')}</AlertDialogCancel>
            <AlertDialogAction onClick={deleteEpisode} className="bg-destructive text-destructive-foreground">{t('common.delete')}</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
