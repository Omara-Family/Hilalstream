import { useParams, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { Star, Eye, Heart, Play, Calendar, Film } from 'lucide-react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import SeriesCard from '@/components/SeriesCard';
import { mockSeries, mockEpisodes, genres } from '@/data/mock';
import { useLocale } from '@/hooks/useLocale';
import { useAppStore } from '@/store/useAppStore';

const SeriesDetail = () => {
  const { slug } = useParams<{ slug: string }>();
  const { t } = useTranslation();
  const { getTitle, getDescription, formatViews, getGenreLabel } = useLocale();
  const { favorites, toggleFavorite } = useAppStore();

  const series = mockSeries.find(s => s.slug === slug);
  if (!series) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground text-lg">Series not found</p>
      </div>
    );
  }

  const episodes = mockEpisodes
    .filter(ep => ep.seriesId === series._id)
    .sort((a, b) => a.episodeNumber - b.episodeNumber);

  const related = mockSeries
    .filter(s => s._id !== series._id && s.genre.some(g => series.genre.includes(g)))
    .slice(0, 4);

  const isFav = favorites.includes(series._id);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      {/* Backdrop */}
      <div className="relative h-[50vh] md:h-[60vh]">
        <img src={series.backdropImage} alt={getTitle(series)} className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/70 to-transparent" />
      </div>

      <main className="container mx-auto px-4 -mt-48 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col md:flex-row gap-8"
        >
          {/* Poster */}
          <div className="flex-shrink-0 w-48 md:w-64 mx-auto md:mx-0">
            <img
              src={series.posterImage}
              alt={getTitle(series)}
              className="w-full rounded-lg shadow-2xl"
            />
          </div>

          {/* Info */}
          <div className="flex-1">
            <h1 className="text-3xl md:text-4xl font-display font-black text-foreground mb-3">
              {getTitle(series)}
            </h1>

            <div className="flex flex-wrap items-center gap-4 mb-4 text-sm text-muted-foreground">
              <span className="flex items-center gap-1 text-primary">
                <Star className="w-4 h-4 fill-primary" />
                {series.rating}
              </span>
              <span className="flex items-center gap-1">
                <Calendar className="w-4 h-4" />
                {series.releaseYear}
              </span>
              <span className="flex items-center gap-1">
                <Eye className="w-4 h-4" />
                {formatViews(series.totalViews)} {t('series.views')}
              </span>
              <span className="flex items-center gap-1">
                <Film className="w-4 h-4" />
                {episodes.length} {t('series.episodes')}
              </span>
            </div>

            <div className="flex flex-wrap gap-2 mb-4">
              {series.genre.map(g => {
                const genreObj = genres.find(x => x.id === g);
                return (
                  <span key={g} className="px-3 py-1 rounded-full bg-secondary text-xs text-secondary-foreground">
                    {genreObj ? getGenreLabel(genreObj) : g}
                  </span>
                );
              })}
            </div>

            <p className="text-secondary-foreground leading-relaxed mb-6 max-w-2xl">
              {getDescription(series)}
            </p>

            <div className="flex flex-wrap gap-3">
              {episodes.length > 0 && (
                <Link
                  to={`/watch/${series.slug}/1`}
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-primary text-primary-foreground font-bold hover:opacity-90 transition-opacity"
                >
                  <Play className="w-5 h-5" />
                  {t('hero.watch')}
                </Link>
              )}
              <button
                onClick={() => toggleFavorite(series._id)}
                className={`inline-flex items-center gap-2 px-6 py-3 rounded-lg font-bold transition-colors ${
                  isFav
                    ? 'bg-primary/20 text-primary'
                    : 'bg-secondary text-secondary-foreground hover:bg-surface-hover'
                }`}
              >
                <Heart className={`w-5 h-5 ${isFav ? 'fill-primary' : ''}`} />
                {isFav ? t('series.removeFavorite') : t('series.addFavorite')}
              </button>
            </div>
          </div>
        </motion.div>

        {/* Episodes */}
        <section className="mt-12">
          <h2 className="text-xl font-display font-bold text-foreground mb-4">{t('series.episodes')}</h2>
          {episodes.length === 0 ? (
            <p className="text-muted-foreground">{t('series.noEpisodes')}</p>
          ) : (
            <div className="grid gap-3">
              {episodes.map((ep, i) => (
                <motion.div
                  key={ep._id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.05 }}
                >
                  <Link
                    to={`/watch/${series.slug}/${ep.episodeNumber}`}
                    className="flex items-center gap-4 p-4 rounded-lg bg-card hover:bg-surface-hover transition-colors group"
                  >
                    <div className="flex-shrink-0 w-10 h-10 rounded-full bg-secondary flex items-center justify-center group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                      <span className="text-sm font-bold">{ep.episodeNumber}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-foreground">
                        {t('series.episode')} {ep.episodeNumber} - {getTitle(ep)}
                      </h3>
                      <p className="text-xs text-muted-foreground flex items-center gap-2 mt-0.5">
                        <Eye className="w-3 h-3" />
                        {formatViews(ep.views)} {t('series.views')}
                      </p>
                    </div>
                    <Play className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" />
                  </Link>
                </motion.div>
              ))}
            </div>
          )}
        </section>

        {/* Related */}
        {related.length > 0 && (
          <section className="mt-12">
            <h2 className="text-xl font-display font-bold text-foreground mb-4">{t('series.related')}</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              {related.map((s, i) => (
                <SeriesCard key={s._id} series={s} index={i} />
              ))}
            </div>
          </section>
        )}
      </main>
      <Footer />
    </div>
  );
};

export default SeriesDetail;
