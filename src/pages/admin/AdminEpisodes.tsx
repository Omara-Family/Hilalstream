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

type SeriesOption = { id: string; title_en: string };
type EpisodeForm = {
  series_id: string; episode_number: number; title_ar: string;
  title_en: string; video_servers: string; download_url: string;
};

const emptyForm: EpisodeForm = {
  series_id: '', episode_number: 1, title_ar: '', title_en: '',
  video_servers: '[]', download_url: '',
};

export default function AdminEpisodes() {
  const { t } = useTranslation();
  const [episodes, setEpisodes] = useState<any[]>([]);
  const [seriesOptions, setSeriesOptions] = useState<SeriesOption[]>([]);
  const [filterSeries, setFilterSeries] = useState<string>('all');
  const [open, setOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState<EpisodeForm>(emptyForm);
  const { toast } = useToast();

  const loadSeries = async () => {
    const { data } = await supabase.from('series').select('id, title_en').order('title_en');
    if (data) setSeriesOptions(data);
  };

  const loadEpisodes = async () => {
    let query = supabase.from('episodes').select('*, series:series_id(title_en)').order('episode_number');
    if (filterSeries && filterSeries !== 'all') query = query.eq('series_id', filterSeries);
    const { data } = await query;
    if (data) setEpisodes(data);
  };

  useEffect(() => { loadSeries(); }, []);
  useEffect(() => { loadEpisodes(); }, [filterSeries]);

  const openCreate = () => { setEditId(null); setForm(emptyForm); setOpen(true); };
  const openEdit = (ep: any) => {
    setEditId(ep.id);
    setForm({
      series_id: ep.series_id, episode_number: ep.episode_number,
      title_ar: ep.title_ar ?? '', title_en: ep.title_en ?? '',
      video_servers: JSON.stringify(ep.video_servers ?? [], null, 2),
      download_url: ep.download_url ?? '',
    });
    setOpen(true);
  };

  const save = async () => {
    let servers;
    try { servers = JSON.parse(form.video_servers); } catch {
      toast({ title: t('admin.invalidJson'), description: t('admin.videoServersJsonError'), variant: 'destructive' });
      return;
    }
    const payload = {
      series_id: form.series_id, episode_number: form.episode_number,
      title_ar: form.title_ar, title_en: form.title_en,
      video_servers: servers, download_url: form.download_url || null,
    };
    const { error } = editId
      ? await supabase.from('episodes').update(payload).eq('id', editId)
      : await supabase.from('episodes').insert(payload);
    if (error) {
      toast({ title: t('common.error'), description: error.message, variant: 'destructive' });
    } else {
      toast({ title: editId ? t('admin.updated') : t('admin.created') });
      setOpen(false); loadEpisodes();
    }
  };

  const deleteEpisode = async () => {
    if (!deleteId) return;
    const { error } = await supabase.from('episodes').delete().eq('id', deleteId);
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
        <h2 className="text-2xl font-bold text-foreground">{t('admin.episodesManagement')}</h2>
        <Button onClick={openCreate}><Plus className="h-4 w-4 me-2" />{t('admin.addEpisode')}</Button>
      </div>

      <div className="w-64">
        <Select value={filterSeries} onValueChange={setFilterSeries}>
          <SelectTrigger><SelectValue placeholder={t('admin.filterBySeries')} /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t('admin.allSeries')}</SelectItem>
            {seriesOptions.map(s => <SelectItem key={s.id} value={s.id}>{s.title_en}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      <div className="rounded-md border border-border overflow-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t('admin.series')}</TableHead>
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
                <TableCell className="font-medium">{(ep.series as any)?.title_en ?? '—'}</TableCell>
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
            <DialogTitle>{editId ? t('admin.editEpisode') : t('admin.newEpisode')}</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-sm text-muted-foreground">{t('admin.series')}</label>
              <Select value={form.series_id} onValueChange={v => f('series_id', v)}>
                <SelectTrigger><SelectValue placeholder={t('admin.selectSeries')} /></SelectTrigger>
                <SelectContent>
                  {seriesOptions.map(s => <SelectItem key={s.id} value={s.id}>{s.title_en}</SelectItem>)}
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
            <AlertDialogTitle>{t('admin.deleteEpisode')}</AlertDialogTitle>
            <AlertDialogDescription>{t('admin.deleteEpisodeDesc')}</AlertDialogDescription>
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
