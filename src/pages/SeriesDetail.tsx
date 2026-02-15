import { useParams, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useEffect, useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { Star, Eye, Heart, Play, Calendar, Film, Upload, ImagePlus } from 'lucide-react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import SeriesCard from '@/components/SeriesCard';
import { mockSeries, mockEpisodes, genres } from '@/data/mock';
import { useLocale } from '@/hooks/useLocale';
import { useAppStore } from '@/store/useAppStore';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import type { Series, Episode } from '@/types';

const mapDbSeries = (s: any): Series => ({
  _id: s.id,
  title_ar: s.title_ar,
  title_en: s.title_en,
  slug: s.slug,
  description_ar: s.description_ar || '',
  description_en: s.description_en || '',
  posterImage: s.poster_image || '',
  backdropImage: s.backdrop_image || '',
  releaseYear: s.release_year,
  genre: s.genre || [],
  tags: s.tags || [],
  rating: Number(s.rating) || 0,
  totalViews: s.total_views || 0,
  isTrending: s.is_trending || false,
  createdAt: s.created_at,
});

const mapDbEpisode = (ep: any): Episode => ({
  _id: ep.id,
  seriesId: ep.series_id,
  episodeNumber: ep.episode_number,
  title_ar: ep.title_ar || '',
  title_en: ep.title_en || '',
  videoServers: Array.isArray(ep.video_servers) ? ep.video_servers : [],
  downloadUrl: ep.download_url,
  views: ep.views || 0,
  createdAt: ep.created_at,
});

const SeriesDetail = () => {
  const { slug } = useParams<{ slug: string }>();
  const { t } = useTranslation();
  const { getTitle, getDescription, formatViews, getGenreLabel } = useLocale();
  const { favorites, toggleFavorite } = useAppStore();
  const [series, setSeries] = useState<Series | null>(null);
  const [episodes, setEpisodes] = useState<Episode[]>([]);
  const [related, setRelated] = useState<Series[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const posterInputRef = useRef<HTMLInputElement>(null);
  const backdropInputRef = useRef<HTMLInputElement>(null);

  const handleImageUpload = async (file: File, type: 'poster' | 'backdrop') => {
    if (!series) return;
    setUploading(true);
    try {
      const ext = file.name.split('.').pop();
      const path = `${series._id}/${type}.${ext}`;
      
      const { error: uploadError } = await supabase.storage
        .from('posters')
        .upload(path, file, { upsert: true });
      
      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('posters')
        .getPublicUrl(path);

      const updateCol = type === 'poster' ? 'poster_image' : 'backdrop_image';
      const { error: dbError } = await supabase
        .from('series')
        .update({ [updateCol]: publicUrl })
        .eq('id', series._id);

      if (dbError) throw dbError;

      setSeries(prev => prev ? {
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
      // Try DB first
      const { data: dbSeries } = await supabase
        .from('series')
        .select('id, title_ar, title_en, slug, description_ar, description_en, poster_image, backdrop_image, release_year, genre, tags, rating, total_views, is_trending, created_at')
        .eq('slug', slug!)
        .maybeSingle();

      if (dbSeries) {
        const s = mapDbSeries(dbSeries);
        setSeries(s);

        const { data: dbEps } = await supabase
          .from('episodes')
          .select('*')
          .eq('series_id', dbSeries.id)
          .order('episode_number', { ascending: true });
        setEpisodes(dbEps ? dbEps.map(mapDbEpisode) : []);

        // Related by genre
        const { data: relData } = await supabase
          .from('series')
          .select('id, title_ar, title_en, slug, poster_image, backdrop_image, release_year, genre, tags, rating, total_views, is_trending, created_at, description_ar, description_en')
          .neq('id', dbSeries.id)
          .overlaps('genre', dbSeries.genre || [])
          .limit(4);
        setRelated(relData ? relData.map(mapDbSeries) : []);
      } else {
        // Fallback to mock
        const mock = mockSeries.find(s => s.slug === slug);
        setSeries(mock || null);
        if (mock) {
          setEpisodes(mockEpisodes.filter(ep => ep.seriesId === mock._id).sort((a, b) => a.episodeNumber - b.episodeNumber));
          setRelated(mockSeries.filter(s => s._id !== mock._id && s.genre.some(g => mock.genre.includes(g))).slice(0, 4));
        }
      }
      setLoading(false);
    };
    fetch();
  }, [slug]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!series) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground text-lg">Series not found</p>
      </div>
    );
  }

  const isFav = favorites.includes(series._id);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="relative h-[50vh] md:h-[60vh] group/backdrop">
        <img src={series.backdropImage} alt={getTitle(series)} className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/70 to-transparent" />
        <button
          onClick={() => backdropInputRef.current?.click()}
          disabled={uploading}
          className="absolute top-4 ltr:right-4 rtl:left-4 flex items-center gap-2 px-4 py-2 rounded-lg bg-black/60 hover:bg-black/80 text-white text-sm font-medium opacity-0 group-hover/backdrop:opacity-100 transition-opacity cursor-pointer z-20"
        >
          <Upload className="w-4 h-4" />
          {uploading ? '...' : 'تغيير الخلفية'}
        </button>
        <input ref={backdropInputRef} type="file" accept="image/*" className="hidden" onChange={e => { if (e.target.files?.[0]) handleImageUpload(e.target.files[0], 'backdrop'); }} />
      </div>

      <main className="container mx-auto px-4 -mt-48 relative z-10">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col md:flex-row gap-8">
          <div className="flex-shrink-0 w-48 md:w-64 mx-auto md:mx-0 relative group/poster">
            <img src={series.posterImage} alt={getTitle(series)} className="w-full rounded-lg shadow-2xl" />
            <button
              onClick={() => posterInputRef.current?.click()}
              disabled={uploading}
              className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-black/60 rounded-lg opacity-0 group-hover/poster:opacity-100 transition-opacity cursor-pointer"
            >
              <ImagePlus className="w-8 h-8 text-white" />
              <span className="text-white text-xs font-medium">{uploading ? '...' : 'تغيير البوستر'}</span>
            </button>
            <input ref={posterInputRef} type="file" accept="image/*" className="hidden" onChange={e => { if (e.target.files?.[0]) handleImageUpload(e.target.files[0], 'poster'); }} />
          </div>
          <div className="flex-1">
            <h1 className="text-3xl md:text-4xl font-display font-black text-foreground mb-3">{getTitle(series)}</h1>
            <div className="flex flex-wrap items-center gap-4 mb-4 text-sm text-muted-foreground">
              <span className="flex items-center gap-1 text-primary"><Star className="w-4 h-4 fill-primary" />{series.rating}</span>
              <span className="flex items-center gap-1"><Calendar className="w-4 h-4" />{series.releaseYear}</span>
              <span className="flex items-center gap-1"><Eye className="w-4 h-4" />{formatViews(series.totalViews)} {t('series.views')}</span>
              <span className="flex items-center gap-1"><Film className="w-4 h-4" />{episodes.length} {t('series.episodes')}</span>
            </div>
            <div className="flex flex-wrap gap-2 mb-4">
              {series.genre.map(g => {
                const genreObj = genres.find(x => x.id === g);
                return <span key={g} className="px-3 py-1 rounded-full bg-secondary text-xs text-secondary-foreground">{genreObj ? getGenreLabel(genreObj) : g}</span>;
              })}
            </div>
            <p className="text-secondary-foreground leading-relaxed mb-6 max-w-2xl">{getDescription(series)}</p>
            <div className="flex flex-wrap gap-3">
              {episodes.length > 0 && (
                <Link to={`/watch/${series.slug}/1`} className="inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-primary text-primary-foreground font-bold hover:opacity-90 transition-opacity">
                  <Play className="w-5 h-5" />{t('hero.watch')}
                </Link>
              )}
              <button onClick={() => toggleFavorite(series._id)} className={`inline-flex items-center gap-2 px-6 py-3 rounded-lg font-bold transition-colors ${isFav ? 'bg-primary/20 text-primary' : 'bg-secondary text-secondary-foreground hover:bg-surface-hover'}`}>
                <Heart className={`w-5 h-5 ${isFav ? 'fill-primary' : ''}`} />
                {isFav ? t('series.removeFavorite') : t('series.addFavorite')}
              </button>
            </div>
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
                  <Link to={`/watch/${series.slug}/${ep.episodeNumber}`} className="flex items-center gap-4 p-4 rounded-lg bg-card hover:bg-surface-hover transition-colors group">
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

        {related.length > 0 && (
          <section className="mt-12">
            <h2 className="text-xl font-display font-bold text-foreground mb-4">{t('series.related')}</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              {related.map((s, i) => <SeriesCard key={s._id} series={s} index={i} />)}
            </div>
          </section>
        )}
      </main>
      <Footer />
    </div>
  );
};

export default SeriesDetail;
