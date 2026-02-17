import { useParams, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Star, Eye, Play, Calendar, Film } from 'lucide-react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { useLocale } from '@/hooks/useLocale';
import { supabase } from '@/integrations/supabase/client';
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
      <div className="relative h-[50vh] md:h-[60vh]">
        <img src={program.backdropImage} alt={getTitle(program)} className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/70 to-transparent" />
      </div>

      <main className="container mx-auto px-4 -mt-48 relative z-10">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col md:flex-row gap-8">
          <div className="flex-shrink-0 w-48 md:w-64 mx-auto md:mx-0">
            <img src={program.posterImage} alt={getTitle(program)} className="w-full rounded-lg shadow-2xl" />
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
