import { useEffect, useState } from 'react';
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
  series_id: string;
  episode_number: number;
  title_ar: string;
  title_en: string;
  video_servers: string;
  download_url: string;
};

const emptyForm: EpisodeForm = {
  series_id: '', episode_number: 1, title_ar: '', title_en: '',
  video_servers: '[]', download_url: '',
};

export default function AdminEpisodes() {
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
    if (filterSeries && filterSeries !== 'all') {
      query = query.eq('series_id', filterSeries);
    }
    const { data } = await query;
    if (data) setEpisodes(data);
  };

  useEffect(() => { loadSeries(); }, []);
  useEffect(() => { loadEpisodes(); }, [filterSeries]);

  const openCreate = () => { setEditId(null); setForm(emptyForm); setOpen(true); };
  const openEdit = (ep: any) => {
    setEditId(ep.id);
    setForm({
      series_id: ep.series_id,
      episode_number: ep.episode_number,
      title_ar: ep.title_ar ?? '',
      title_en: ep.title_en ?? '',
      video_servers: JSON.stringify(ep.video_servers ?? [], null, 2),
      download_url: ep.download_url ?? '',
    });
    setOpen(true);
  };

  const save = async () => {
    let servers;
    try { servers = JSON.parse(form.video_servers); } catch {
      toast({ title: 'Invalid JSON', description: 'Video servers must be valid JSON', variant: 'destructive' });
      return;
    }

    const payload = {
      series_id: form.series_id,
      episode_number: form.episode_number,
      title_ar: form.title_ar,
      title_en: form.title_en,
      video_servers: servers,
      download_url: form.download_url || null,
    };

    const { error } = editId
      ? await supabase.from('episodes').update(payload).eq('id', editId)
      : await supabase.from('episodes').insert(payload);

    if (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: editId ? 'Updated' : 'Created' });
      setOpen(false);
      loadEpisodes();
    }
  };

  const deleteEpisode = async () => {
    if (!deleteId) return;
    const { error } = await supabase.from('episodes').delete().eq('id', deleteId);
    if (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Deleted' });
      setDeleteId(null);
      loadEpisodes();
    }
  };

  const f = (key: keyof EpisodeForm, value: string | number) => setForm(p => ({ ...p, [key]: value }));

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-foreground">Episodes Management</h2>
        <Button onClick={openCreate}><Plus className="h-4 w-4 mr-2" />Add Episode</Button>
      </div>

      <div className="w-64">
        <Select value={filterSeries} onValueChange={setFilterSeries}>
          <SelectTrigger><SelectValue placeholder="Filter by series" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Series</SelectItem>
            {seriesOptions.map(s => (
              <SelectItem key={s.id} value={s.id}>{s.title_en}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="rounded-md border border-border overflow-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Series</TableHead>
              <TableHead>Ep #</TableHead>
              <TableHead>Title (EN)</TableHead>
              <TableHead>Title (AR)</TableHead>
              <TableHead>Views</TableHead>
              <TableHead className="w-24">Actions</TableHead>
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
            <DialogTitle>{editId ? 'Edit Episode' : 'New Episode'}</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-sm text-muted-foreground">Series</label>
              <Select value={form.series_id} onValueChange={v => f('series_id', v)}>
                <SelectTrigger><SelectValue placeholder="Select series" /></SelectTrigger>
                <SelectContent>
                  {seriesOptions.map(s => (
                    <SelectItem key={s.id} value={s.id}>{s.title_en}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <label className="text-sm text-muted-foreground">Episode Number</label>
              <Input type="number" value={form.episode_number} onChange={e => f('episode_number', parseInt(e.target.value))} />
            </div>
            <div className="space-y-1">
              <label className="text-sm text-muted-foreground">Title (EN)</label>
              <Input value={form.title_en} onChange={e => f('title_en', e.target.value)} />
            </div>
            <div className="space-y-1">
              <label className="text-sm text-muted-foreground">Title (AR)</label>
              <Input value={form.title_ar} onChange={e => f('title_ar', e.target.value)} />
            </div>
            <div className="space-y-1">
              <label className="text-sm text-muted-foreground">Download URL</label>
              <Input value={form.download_url} onChange={e => f('download_url', e.target.value)} />
            </div>
            <div className="col-span-2 space-y-1">
              <label className="text-sm text-muted-foreground">Video Servers (JSON)</label>
              <Textarea rows={5} className="font-mono text-sm" value={form.video_servers} onChange={e => f('video_servers', e.target.value)} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button onClick={save}>{editId ? 'Update' : 'Create'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteId} onOpenChange={(o) => !o && setDeleteId(null)}>
        <AlertDialogContent className="bg-card">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Episode?</AlertDialogTitle>
            <AlertDialogDescription>This action cannot be undone.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={deleteEpisode} className="bg-destructive text-destructive-foreground">Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
