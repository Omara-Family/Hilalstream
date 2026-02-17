import { useParams, Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useState, useEffect, useRef, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Download, ChevronLeft, ChevronRight, Monitor, ArrowLeft, Maximize, SkipForward } from 'lucide-react';
import Navbar from '@/components/Navbar';
import EpisodeReviews from '@/components/EpisodeReviews';
import WatchPartyChat from '@/components/WatchPartyChat';
import { removePopAdScript, allowPopAdScript } from '@/lib/popAd';
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

const WatchProgram = () => {
  const { programSlug, episodeNumber } = useParams<{ programSlug: string; episodeNumber: string }>();
  const { t } = useTranslation();
  const { getTitle, isArabic } = useLocale();
  const navigate = useNavigate();
  const [activeServer, setActiveServer] = useState(0);
  const [program, setProgram] = useState<Series | null>(null);
  const [episodes, setEpisodes] = useState<Episode[]>([]);
  const [loading, setLoading] = useState(true);
  const playerContainerRef = useRef<HTMLDivElement>(null);

  const epNum = parseInt(episodeNumber || '1');

  useEffect(() => {
    removePopAdScript();
    return () => { allowPopAdScript(); };
  }, []);

  useEffect(() => {
    const fetch = async () => {
      setLoading(true);
      const { data: dbProgram } = await supabase
        .from('programs').select('*').eq('slug', programSlug!).maybeSingle();

      if (dbProgram) {
        setProgram(mapDbProgram(dbProgram));
        const { data: dbEps } = await supabase
          .from('program_episodes').select('*').eq('program_id', dbProgram.id)
          .order('episode_number', { ascending: true });
        setEpisodes(dbEps ? dbEps.map(mapDbEpisode) : []);
      }
      setLoading(false);
    };
    fetch();
    setActiveServer(0);
  }, [programSlug]);

  useEffect(() => {
    if (!loading && episodes.length > 0) {
      const ep = episodes.find(e => e.episodeNumber === epNum);
      if (ep && ep._id.length > 10) {
        supabase.rpc('increment_program_episode_views', { _episode_id: ep._id }).then(() => {});
      }
    }
  }, [epNum, loading, episodes]);

  const toggleFullscreen = useCallback(() => {
    if (!playerContainerRef.current) return;
    if (document.fullscreenElement) document.exitFullscreen();
    else playerContainerRef.current.requestFullscreen();
  }, []);

  const hasNextRef = useRef(false);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.target as HTMLElement).tagName === 'INPUT' || (e.target as HTMLElement).tagName === 'TEXTAREA') return;
      switch (e.key.toLowerCase()) {
        case 'f': e.preventDefault(); toggleFullscreen(); break;
        case 'n':
          if (hasNextRef.current) { e.preventDefault(); navigate(`/watch-program/${programSlug}/${epNum + 1}`); }
          break;
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [toggleFullscreen, navigate, programSlug, epNum]);

  if (loading) return <div className="min-h-screen bg-background flex items-center justify-center"><div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" /></div>;
  if (!program) return <div className="min-h-screen bg-background flex items-center justify-center"><p className="text-muted-foreground">Program not found</p></div>;

  const currentEp = episodes.find(ep => ep.episodeNumber === epNum);
  if (!currentEp) return <div className="min-h-screen bg-background flex items-center justify-center"><p className="text-muted-foreground">Episode not found</p></div>;

  const hasPrev = epNum > 1;
  const hasNext = episodes.some(ep => ep.episodeNumber === epNum + 1);
  hasNextRef.current = hasNext;
  const videoUrl = currentEp.videoServers[activeServer]?.url;

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="pt-16">
        <div className="bg-card">
          <div className="container mx-auto px-0 md:px-4">
            <motion.div ref={playerContainerRef} initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="relative w-full aspect-video bg-muted rounded-none md:rounded-lg overflow-hidden group">
              {videoUrl ? (
                <iframe src={videoUrl} className="w-full h-full" allowFullScreen allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" title={getTitle(currentEp)} />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-muted-foreground">No video available</div>
              )}
              {/* Mobile: always visible. Desktop: show on hover */}
              <div className="absolute bottom-3 left-3 right-3 md:bottom-4 md:left-auto md:right-4 flex items-center justify-between md:justify-end gap-2 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity z-10">
                <button onClick={toggleFullscreen} className="p-3 md:p-2 rounded-xl md:rounded-lg bg-background/80 text-foreground hover:bg-background/90 active:scale-95 transition-all backdrop-blur-sm touch-manipulation">
                  <Maximize className="w-6 h-6 md:w-5 md:h-5" />
                </button>
                {hasNext && (
                  <button onClick={() => navigate(`/watch-program/${program.slug}/${epNum + 1}`)} className="px-4 py-3 md:px-3 md:py-2 rounded-xl md:rounded-lg bg-primary/90 text-primary-foreground hover:bg-primary active:scale-95 transition-all backdrop-blur-sm flex items-center gap-1.5 text-sm font-medium touch-manipulation">
                    <SkipForward className="w-5 h-5 md:w-4 md:h-4" /> {t('watch.nextEpisode')}
                  </button>
                )}
              </div>
            </motion.div>
          </div>
        </div>

        <div className="container mx-auto px-4 py-6">
          <div className="flex items-start justify-between gap-4 mb-6">
            <div>
              <Link to={`/program/${program.slug}`} className="flex items-center gap-1 text-sm text-muted-foreground hover:text-primary mb-2">
                <ArrowLeft className="w-4 h-4" />{getTitle(program)}
              </Link>
              <h1 className="text-xl md:text-2xl font-display font-bold text-foreground">
                {t('series.episode')} {currentEp.episodeNumber} - {getTitle(currentEp)}
              </h1>
            </div>
          </div>

          <div className="mb-6">
            <h3 className="text-sm font-semibold text-muted-foreground mb-2 flex items-center gap-2"><Monitor className="w-4 h-4" />{t('watch.selectServer')}</h3>
            <div className="flex flex-wrap gap-2">
              {currentEp.videoServers.map((server, i) => (
                <button key={i} onClick={() => setActiveServer(i)} className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${activeServer === i ? 'bg-primary text-primary-foreground' : 'bg-secondary text-secondary-foreground hover:bg-surface-hover'}`}>
                  {server.name}
                </button>
              ))}
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {hasPrev && <button onClick={() => navigate(`/watch-program/${program.slug}/${epNum - 1}`)} className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-secondary text-secondary-foreground hover:bg-surface-hover transition-colors text-sm"><ChevronLeft className="w-4 h-4" />{t('watch.prevEpisode')}</button>}
            {hasNext && <button onClick={() => navigate(`/watch-program/${program.slug}/${epNum + 1}`)} className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground hover:opacity-90 transition-opacity text-sm">{t('watch.nextEpisode')}<ChevronRight className="w-4 h-4" /></button>}
            {currentEp.downloadUrl && <a href={currentEp.downloadUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-secondary text-secondary-foreground hover:bg-surface-hover transition-colors text-sm"><Download className="w-4 h-4" />{t('watch.download')} <span className="text-xs text-muted-foreground">({isArabic ? 'متعدد الجودات' : 'Multi-quality'})</span></a>}
          </div>

          <div className="mt-8">
            <h3 className="text-lg font-display font-bold text-foreground mb-3">{t('series.episodes')}</h3>
            <div className="grid gap-2">
              {episodes.map(ep => (
                <Link key={ep._id} to={`/watch-program/${program.slug}/${ep.episodeNumber}`} className={`flex items-center gap-3 p-3 rounded-lg transition-colors ${ep.episodeNumber === epNum ? 'bg-primary/10 ring-1 ring-primary/30' : 'bg-card hover:bg-surface-hover'}`}>
                  <span className={`text-sm font-bold ${ep.episodeNumber === epNum ? 'text-primary' : 'text-muted-foreground'}`}>{ep.episodeNumber}</span>
                  <span className="text-sm text-foreground">{t('series.episode')} {ep.episodeNumber}</span>
                </Link>
              ))}
            </div>
          </div>

          {/* Reviews */}
          <EpisodeReviews episodeId={currentEp._id} programId={program._id} />
        </div>

        {/* Watch Party */}
        <WatchPartyChat seriesSlug={program.slug} episodeNumber={epNum} episodeId={currentEp._id} />
      </main>
    </div>
  );
};

export default WatchProgram;
