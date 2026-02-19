import { useParams, Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useState, useEffect, useRef, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Download, ChevronLeft, ChevronRight, Monitor, ArrowLeft } from 'lucide-react';
import Navbar from '@/components/Navbar';
import Comments from '@/components/Comments';
import EpisodeReviews from '@/components/EpisodeReviews';
import WatchPartyChat from '@/components/WatchPartyChat';
import { mockSeries, mockEpisodes } from '@/data/mock';
import { removePopAdScript, allowPopAdScript } from '@/lib/popAd';
import { useLocale } from '@/hooks/useLocale';
import { supabase } from '@/integrations/supabase/client';
import { useAppStore } from '@/store/useAppStore';
import { useStreak } from '@/hooks/useStreak';
import { toast } from '@/hooks/use-toast';
import type { Series, Episode } from '@/types';

const mapDbSeries = (s: any): Series => ({
  _id: s.id, title_ar: s.title_ar, title_en: s.title_en, slug: s.slug,
  description_ar: s.description_ar || '', description_en: s.description_en || '',
  posterImage: s.poster_image || '', backdropImage: s.backdrop_image || '',
  releaseYear: s.release_year, genre: s.genre || [], tags: s.tags || [],
  rating: Number(s.rating) || 0, totalViews: s.total_views || 0,
  isTrending: s.is_trending || false, createdAt: s.created_at,
});

const mapDbEpisode = (ep: any): Episode => ({
  _id: ep.id, seriesId: ep.series_id, episodeNumber: ep.episode_number,
  title_ar: ep.title_ar || '', title_en: ep.title_en || '',
  videoServers: Array.isArray(ep.video_servers) ? ep.video_servers : [],
  downloadUrl: ep.download_url, views: ep.views || 0, createdAt: ep.created_at,
  downloadLinks: Array.isArray(ep.download_links) ? ep.download_links : [],
});

const Watch = () => {
  const { seriesSlug, episodeNumber } = useParams<{ seriesSlug: string; episodeNumber: string }>();
  const { t } = useTranslation();
  const { getTitle, isArabic } = useLocale();
  const navigate = useNavigate();
  const { user } = useAppStore();
  const { recordWatch } = useStreak();
  const [activeServer, setActiveServer] = useState(0);
  const [series, setSeries] = useState<Series | null>(null);
  const [episodes, setEpisodes] = useState<Episode[]>([]);
  const [loading, setLoading] = useState(true);
  const [showNextOverlay, setShowNextOverlay] = useState(false);
  const playerContainerRef = useRef<HTMLDivElement>(null);

  const epNum = parseInt(episodeNumber || '1');

  // Remove popunder ad script on Watch page, restore on leave
  useEffect(() => {
    removePopAdScript();
    return () => { allowPopAdScript(); };
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const { data: dbSeries, error: seriesError } = await supabase
          .from('series')
          .select('id, title_ar, title_en, slug, description_ar, description_en, poster_image, backdrop_image, release_year, genre, tags, rating, total_views, is_trending, created_at')
          .eq('slug', seriesSlug || '')
          .maybeSingle();

        if (seriesError) {
          console.error('Error fetching series:', seriesError);
        }

        if (dbSeries) {
          setSeries(mapDbSeries(dbSeries));
          const { data: dbEps, error: epsError } = await supabase
            .from('episodes').select('*').eq('series_id', dbSeries.id)
            .order('episode_number', { ascending: true });
          if (epsError) console.error('Error fetching episodes:', epsError);
          setEpisodes(dbEps ? dbEps.map(mapDbEpisode) : []);
        } else {
          const mock = mockSeries.find(s => s.slug === seriesSlug);
          setSeries(mock || null);
          if (mock) setEpisodes(mockEpisodes.filter(ep => ep.seriesId === mock._id).sort((a, b) => a.episodeNumber - b.episodeNumber));
        }
      } catch (err) {
        console.error('Unexpected error loading watch page:', err);
        // Fallback to mock data
        const mock = mockSeries.find(s => s.slug === seriesSlug);
        setSeries(mock || null);
        if (mock) setEpisodes(mockEpisodes.filter(ep => ep.seriesId === mock._id).sort((a, b) => a.episodeNumber - b.episodeNumber));
      } finally {
        setLoading(false);
      }
    };
    fetchData();
    setActiveServer(0);
  }, [seriesSlug]);

  // Increment views + save continue watching + record streak when episode changes
  useEffect(() => {
    if (!loading && episodes.length > 0) {
      const ep = episodes.find(e => e.episodeNumber === epNum);
      if (ep) recordWatch();
      if (ep && ep._id.length > 10) {
        // Only call for real DB episodes (UUIDs)
        supabase.rpc('increment_episode_views', { _episode_id: ep._id }).then(() => {});
        
        // Save continue watching progress
        if (user) {
          supabase
            .from('continue_watching')
            .upsert(
              { user_id: user.id, episode_id: ep._id, progress_seconds: 0, updated_at: new Date().toISOString() },
              { onConflict: 'user_id,episode_id' }
            )
            .then(() => {});
        }
      }
    }
  }, [epNum, loading, episodes, user]);

  // Keyboard shortcuts
  const toggleFullscreen = useCallback(() => {
    const container = playerContainerRef.current;
    if (!container) return;
    
    // Try fullscreen on the iframe first (works better on mobile)
    const iframe = container.querySelector('iframe');
    const target = iframe || container;
    
    if (document.fullscreenElement) {
      document.exitFullscreen().catch(() => {});
    } else {
      // Try standard fullscreen API, then webkit fallback for iOS
      if (target.requestFullscreen) {
        target.requestFullscreen().catch(() => {
          // Fallback to container
          container.requestFullscreen?.().catch(() => {});
        });
      } else if ((target as any).webkitEnterFullscreen) {
        (target as any).webkitEnterFullscreen();
      } else if ((target as any).webkitRequestFullscreen) {
        (target as any).webkitRequestFullscreen();
      }
    }
  }, []);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.target as HTMLElement).tagName === 'INPUT' || (e.target as HTMLElement).tagName === 'TEXTAREA') return;
      switch (e.key.toLowerCase()) {
        case 'f':
          e.preventDefault();
          toggleFullscreen();
          break;
        case 'n':
          if (hasNextRef.current) {
            e.preventDefault();
            navigate(`/watch/${seriesSlug}/${epNum + 1}`);
          }
          break;
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [toggleFullscreen, navigate, seriesSlug, epNum]);

  // We need a ref for hasNext so the keyboard handler stays current
  const hasNextRef = useRef(false);

  if (loading) {
    return <div className="min-h-screen bg-background flex items-center justify-center"><div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" /></div>;
  }
  if (!series) {
    return <div className="min-h-screen bg-background flex items-center justify-center"><p className="text-muted-foreground">Series not found</p></div>;
  }

  const currentEp = episodes.find(ep => ep.episodeNumber === epNum);
  if (!currentEp) {
    return <div className="min-h-screen bg-background flex items-center justify-center"><p className="text-muted-foreground">Episode not found</p></div>;
  }

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
            </motion.div>
          </div>
        </div>


        <div className="container mx-auto px-4 py-6">
          <div className="flex items-start justify-between gap-4 mb-6">
            <div>
              <Link to={`/series/${series.slug}`} className="flex items-center gap-1 text-sm text-muted-foreground hover:text-primary mb-2">
                <ArrowLeft className="w-4 h-4" />{getTitle(series)}
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
            {hasPrev && <button onClick={() => navigate(`/watch/${series.slug}/${epNum - 1}`)} className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-secondary text-secondary-foreground hover:bg-surface-hover transition-colors text-sm"><ChevronLeft className="w-4 h-4" />{t('watch.prevEpisode')}</button>}
            {hasNext && <button onClick={() => navigate(`/watch/${series.slug}/${epNum + 1}`)} className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground hover:opacity-90 transition-opacity text-sm">{t('watch.nextEpisode')}<ChevronRight className="w-4 h-4" /></button>}
            {currentEp.downloadLinks && currentEp.downloadLinks.length > 0 ? (
              <>
                {currentEp.downloadLinks.map((link: any, i: number) => (
                  <a key={i} href={link.url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-secondary text-secondary-foreground hover:bg-surface-hover transition-colors text-sm">
                    <Download className="w-4 h-4" />{t('watch.download')} <span className="text-xs font-bold text-primary">{link.quality}</span>
                  </a>
                ))}
                {!currentEp.downloadUrl && (
                  <span className="text-xs text-muted-foreground self-center">({isArabic ? 'متعدد الجودات' : 'Multi-quality'})</span>
                )}
              </>
            ) : currentEp.downloadUrl ? (
              <a href={currentEp.downloadUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-secondary text-secondary-foreground hover:bg-surface-hover transition-colors text-sm"><Download className="w-4 h-4" />{t('watch.download')}</a>
            ) : null}
          </div>

          <div className="mt-8">
            <h3 className="text-lg font-display font-bold text-foreground mb-3">{t('series.episodes')}</h3>
            <div className="grid gap-2">
              {episodes.map(ep => (
                <Link key={ep._id} to={`/watch/${series.slug}/${ep.episodeNumber}`} className={`flex items-center gap-3 p-3 rounded-lg transition-colors ${ep.episodeNumber === epNum ? 'bg-primary/10 ring-1 ring-primary/30' : 'bg-card hover:bg-surface-hover'}`}>
                  <span className={`text-sm font-bold ${ep.episodeNumber === epNum ? 'text-primary' : 'text-muted-foreground'}`}>{ep.episodeNumber}</span>
                  <span className="text-sm text-foreground">{t('series.episode')} {ep.episodeNumber}</span>
                </Link>
              ))}
            </div>
          </div>

          {/* Reviews Section */}
          <EpisodeReviews episodeId={currentEp._id} seriesId={series._id} />

          {/* Comments Section */}
          <Comments episodeId={currentEp._id} />
        </div>

        {/* Watch Party */}
        <WatchPartyChat seriesSlug={series.slug} episodeNumber={epNum} episodeId={currentEp._id} />
      </main>
    </div>
  );
};

export default Watch;
