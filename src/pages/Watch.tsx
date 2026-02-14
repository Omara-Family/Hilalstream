import { useParams, Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useState } from 'react';
import { motion } from 'framer-motion';
import { Download, ChevronLeft, ChevronRight, Monitor, ArrowLeft } from 'lucide-react';
import Navbar from '@/components/Navbar';
import { mockSeries, mockEpisodes } from '@/data/mock';
import { useLocale } from '@/hooks/useLocale';

const Watch = () => {
  const { seriesSlug, episodeNumber } = useParams<{ seriesSlug: string; episodeNumber: string }>();
  const { t } = useTranslation();
  const { getTitle } = useLocale();
  const navigate = useNavigate();
  const [activeServer, setActiveServer] = useState(0);

  const series = mockSeries.find(s => s.slug === seriesSlug);
  const epNum = parseInt(episodeNumber || '1');

  if (!series) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">Series not found</p>
      </div>
    );
  }

  const episodes = mockEpisodes
    .filter(ep => ep.seriesId === series._id)
    .sort((a, b) => a.episodeNumber - b.episodeNumber);

  const currentEp = episodes.find(ep => ep.episodeNumber === epNum);
  if (!currentEp) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">Episode not found</p>
      </div>
    );
  }

  const hasPrev = epNum > 1;
  const hasNext = episodes.some(ep => ep.episodeNumber === epNum + 1);
  const videoUrl = currentEp.videoServers[activeServer]?.url;

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="pt-16">
        {/* Player */}
        <div className="bg-card">
          <div className="container mx-auto px-0 md:px-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="relative w-full aspect-video bg-muted rounded-none md:rounded-lg overflow-hidden"
            >
              {videoUrl ? (
                <iframe
                  src={videoUrl}
                  className="w-full h-full"
                  allowFullScreen
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  title={getTitle(currentEp)}
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                  No video available
                </div>
              )}
            </motion.div>
          </div>
        </div>

        {/* Controls */}
        <div className="container mx-auto px-4 py-6">
          {/* Title */}
          <div className="flex items-start justify-between gap-4 mb-6">
            <div>
              <Link to={`/series/${series.slug}`} className="flex items-center gap-1 text-sm text-muted-foreground hover:text-primary mb-2">
                <ArrowLeft className="w-4 h-4" />
                {getTitle(series)}
              </Link>
              <h1 className="text-xl md:text-2xl font-display font-bold text-foreground">
                {t('series.episode')} {currentEp.episodeNumber} - {getTitle(currentEp)}
              </h1>
            </div>
          </div>

          {/* Server Switcher */}
          <div className="mb-6">
            <h3 className="text-sm font-semibold text-muted-foreground mb-2 flex items-center gap-2">
              <Monitor className="w-4 h-4" />
              {t('watch.selectServer')}
            </h3>
            <div className="flex flex-wrap gap-2">
              {currentEp.videoServers.map((server, i) => (
                <button
                  key={i}
                  onClick={() => setActiveServer(i)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    activeServer === i
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-secondary text-secondary-foreground hover:bg-surface-hover'
                  }`}
                >
                  {server.name}
                </button>
              ))}
            </div>
          </div>

          {/* Navigation + Download */}
          <div className="flex flex-wrap items-center gap-3">
            {hasPrev && (
              <button
                onClick={() => navigate(`/watch/${series.slug}/${epNum - 1}`)}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-secondary text-secondary-foreground hover:bg-surface-hover transition-colors text-sm"
              >
                <ChevronLeft className="w-4 h-4" />
                {t('watch.prevEpisode')}
              </button>
            )}
            {hasNext && (
              <button
                onClick={() => navigate(`/watch/${series.slug}/${epNum + 1}`)}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground hover:opacity-90 transition-opacity text-sm"
              >
                {t('watch.nextEpisode')}
                <ChevronRight className="w-4 h-4" />
              </button>
            )}
            {currentEp.downloadUrl && (
              <a
                href={currentEp.downloadUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-secondary text-secondary-foreground hover:bg-surface-hover transition-colors text-sm"
              >
                <Download className="w-4 h-4" />
                {t('watch.download')}
              </a>
            )}
          </div>

          {/* Episode List */}
          <div className="mt-8">
            <h3 className="text-lg font-display font-bold text-foreground mb-3">{t('series.episodes')}</h3>
            <div className="grid gap-2">
              {episodes.map(ep => (
                <Link
                  key={ep._id}
                  to={`/watch/${series.slug}/${ep.episodeNumber}`}
                  className={`flex items-center gap-3 p-3 rounded-lg transition-colors ${
                    ep.episodeNumber === epNum
                      ? 'bg-primary/10 ring-1 ring-primary/30'
                      : 'bg-card hover:bg-surface-hover'
                  }`}
                >
                  <span className={`text-sm font-bold ${ep.episodeNumber === epNum ? 'text-primary' : 'text-muted-foreground'}`}>
                    {ep.episodeNumber}
                  </span>
                  <span className="text-sm text-foreground">
                    {t('series.episode')} {ep.episodeNumber}
                  </span>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Watch;
