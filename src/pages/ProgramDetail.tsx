import { useParams, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useEffect, useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { Star, Eye, Play, Calendar, Film, Upload, ImagePlus } from 'lucide-react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { useLocale } from '@/hooks/useLocale';
import { useAppStore } from '@/store/useAppStore';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import type { Series, Episode } from '@/types';

const mapDbProgram = (s: any): Series => ({
  _id: s.id, title_ar: s.title_ar, title_en: s.title_en, slug: s.slug,
  description_ar: s.description_ar || '', description_en: s.description_en || '',
  posterImage: s.poster_image || '', backdropImage: s.backdrop_image || '',
  releaseYear: s.release_year, genre: s.genre || [], tags: s.tags || [],
  rating: Number(s.rating) || 0, totalViews: s.total_views || 0,
  isTrending: s.is_trending || false, createdAt: s.created_at,
});

const mapDbEpisode = (ep: any): Episode => ({
  _id: ep.id, seriesId: ep.program_id, episodeNumber: ep.episode_number,
  title_ar: ep.title_ar || '', title_en: ep.title_en || '',
  videoServers: Array.isArray(ep.video_servers) ? ep.video_servers : [],
  downloadUrl: ep.download_url, views: ep.views || 0, createdAt: ep.created_at,
});

const ProgramDetail = () => {
  const { slug } = useParams<{ slug: string }>();
  const { t } = useTranslation();
  const { getTitle, getDescription, formatViews } = useLocale();
  const [program, setProgram] = useState<Series | null>(null);
  const [episodes, setEpisodes] = useState<Episode[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const isAdmin = useAppStore((s) => s.isAdmin);
  const posterInputRef = useRef<HTMLInputElement>(null);
  const backdropInputRef = useRef<HTMLInputElement>(null);

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

  const handleImageUpload = async (file: File, type: 'poster' | 'backdrop') => {
    if (!program) return;
    setUploading(true);
    try {
      const maxW = type === 'backdrop' ? 1920 : 800;
      const maxH = type === 'backdrop' ? 1080 : 1200;
      const quality = type === 'backdrop' ? 0.95 : 0.92;
      const optimized = await resizeImage(file, maxW, maxH, quality);
      const path = `programs/${program._id}/${type}.jpg`;

      const { error: uploadError } = await supabase.storage
        .from('posters')
        .upload(path, optimized, { upsert: true, contentType: 'image/jpeg' });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('posters')
        .getPublicUrl(path);

      const updateCol = type === 'poster' ? 'poster_image' : 'backdrop_image';
      const { error: dbError } = await supabase
        .from('programs')
        .update({ [updateCol]: publicUrl })
        .eq('id', program._id);

      if (dbError) throw dbError;

      setProgram(prev => prev ? {
        ...prev,
        ...(type === 'poster' ? { posterImage: publicUrl } : { backdropImage: publicUrl })
      } : null);

      toast.success(type === 'poster' ? 'تم تحديث صورة البوستر' : 'تم تحديث صورة الخلفية');
    } catch (err: any) {
      toast.error(err.message || 'فشل رفع الصورة');
    } finally {
      setUploading(false);
    }
  };

  useEffect(() => {
    const fetch = async () => {
      setLoading(true);
      const { data: dbProgram } = await supabase
        .from('programs')
        .select('*')
        .eq('slug', slug!)
        .maybeSingle();

      if (dbProgram) {
        setProgram(mapDbProgram(dbProgram));
        const { data: dbEps } = await supabase
          .from('program_episodes')
          .select('*')
          .eq('program_id', dbProgram.id)
          .order('episode_number', { ascending: true });
        setEpisodes(dbEps ? dbEps.map(mapDbEpisode) : []);
      }
      setLoading(false);
    };
    fetch();
  }, [slug]);

  if (loading) {
    return <div className="min-h-screen bg-background flex items-center justify-center"><div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" /></div>;
  }

  if (!program) {
    return <div className="min-h-screen bg-background flex items-center justify-center"><p className="text-muted-foreground text-lg">Program not found</p></div>;
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="relative h-[50vh] md:h-[60vh] group/backdrop">
        <img src={program.backdropImage} alt={getTitle(program)} className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/70 to-transparent" />
        {isAdmin && (
          <>
            <button
              onClick={() => backdropInputRef.current?.click()}
              disabled={uploading}
              className="absolute bottom-4 ltr:right-4 rtl:left-4 flex items-center gap-2 px-4 py-2 rounded-lg bg-black/60 hover:bg-black/80 text-white text-sm font-medium transition-colors cursor-pointer z-20"
            >
              <Upload className="w-4 h-4" />
              {uploading ? '...' : 'تغيير الخلفية'}
            </button>
            <input ref={backdropInputRef} type="file" accept="image/*" className="hidden" onChange={e => { if (e.target.files?.[0]) handleImageUpload(e.target.files[0], 'backdrop'); }} />
          </>
        )}
      </div>

      <main className="container mx-auto px-4 -mt-48 relative z-10">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col md:flex-row gap-8">
          <div className="flex-shrink-0 w-48 md:w-64 mx-auto md:mx-0 relative group/poster">
            <img src={program.posterImage} alt={getTitle(program)} className="w-full rounded-lg shadow-2xl" />
            {isAdmin && (
              <>
                <button
                  onClick={() => posterInputRef.current?.click()}
                  disabled={uploading}
                  className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-black/60 rounded-lg opacity-0 group-hover/poster:opacity-100 transition-opacity cursor-pointer"
                >
                  <ImagePlus className="w-8 h-8 text-white" />
                  <span className="text-white text-xs font-medium">{uploading ? '...' : 'تغيير البوستر'}</span>
                </button>
                <input ref={posterInputRef} type="file" accept="image/*" className="hidden" onChange={e => { if (e.target.files?.[0]) handleImageUpload(e.target.files[0], 'poster'); }} />
              </>
            )}
          </div>
          <div className="flex-1">
            <h1 className="text-3xl md:text-4xl font-display font-black text-foreground mb-3">{getTitle(program)}</h1>
            <div className="flex flex-wrap items-center gap-4 mb-4 text-sm text-muted-foreground">
              <span className="flex items-center gap-1 text-primary"><Star className="w-4 h-4 fill-primary" />{program.rating}</span>
              <span className="flex items-center gap-1"><Calendar className="w-4 h-4" />{program.releaseYear}</span>
              <span className="flex items-center gap-1"><Eye className="w-4 h-4" />{formatViews(program.totalViews)} {t('series.views')}</span>
              <span className="flex items-center gap-1"><Film className="w-4 h-4" />{episodes.length} {t('series.episodes')}</span>
            </div>
            <p className="text-secondary-foreground leading-relaxed mb-6 max-w-2xl">{getDescription(program)}</p>
            {episodes.length > 0 && (
              <Link to={`/watch-program/${program.slug}/1`} className="inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-primary text-primary-foreground font-bold hover:opacity-90 transition-opacity">
                <Play className="w-5 h-5" />{t('hero.watch')}
              </Link>
            )}
          </div>
        </motion.div>

        <section className="mt-12">
          <h2 className="text-xl font-display font-bold text-foreground mb-4">{t('series.episodes')}</h2>
          {episodes.length === 0 ? (
            <p className="text-muted-foreground">{t('series.noEpisodes')}</p>
          ) : (
            <div className="grid gap-3">
              {episodes.map((ep, i) => (
                <motion.div key={ep._id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }}>
                  <Link to={`/watch-program/${program.slug}/${ep.episodeNumber}`} className="flex items-center gap-4 p-4 rounded-lg bg-card hover:bg-surface-hover transition-colors group">
                    <div className="flex-shrink-0 w-10 h-10 rounded-full bg-secondary flex items-center justify-center group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                      <span className="text-sm font-bold">{ep.episodeNumber}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-foreground">{t('series.episode')} {ep.episodeNumber} - {getTitle(ep)}</h3>
                      <p className="text-xs text-muted-foreground flex items-center gap-2 mt-0.5"><Eye className="w-3 h-3" />{formatViews(ep.views)} {t('series.views')}</p>
                    </div>
                    <Play className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" />
                  </Link>
                </motion.div>
              ))}
            </div>
          )}
        </section>
      </main>
      <Footer />
    </div>
  );
};

export default ProgramDetail;