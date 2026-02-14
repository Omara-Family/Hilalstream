import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { Play, Info } from 'lucide-react';
import { motion } from 'framer-motion';
import type { Series } from '@/types';
import { useLocale } from '@/hooks/useLocale';
import heroBg from '@/assets/hero-bg.jpg';

interface HeroBannerProps {
  series?: Series;
}

const HeroBanner = ({ series }: HeroBannerProps) => {
  const { t } = useTranslation();
  const { getTitle, getDescription } = useLocale();

  const bgImage = series?.backdropImage || heroBg;
  const title = series ? getTitle(series) : 'HilalStream';
  const desc = series
    ? getDescription(series)
    : 'شاهد أفضل المسلسلات العربية والتركية بجودة عالية';

  return (
    <section className="relative h-[70vh] md:h-[85vh] flex items-end overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0">
        <img
          src={bgImage}
          alt={title}
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/60 to-background/30" />
        <div className="absolute inset-0 bg-gradient-to-r from-background/80 to-transparent" />
      </div>

      {/* Content */}
      <div className="relative container mx-auto px-4 pb-16 md:pb-24">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7 }}
          className="max-w-2xl"
        >
          {series?.isTrending && (
            <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-primary/20 text-primary text-sm font-semibold mb-4">
              🔥 {t('hero.trending')}
            </span>
          )}
          <h1 className="text-4xl md:text-6xl font-display font-black text-foreground leading-tight mb-4">
            {title}
          </h1>
          <p className="text-base md:text-lg text-secondary-foreground line-clamp-3 mb-8 max-w-lg">
            {desc}
          </p>
          <div className="flex flex-wrap gap-3">
            {series && (
              <Link
                to={`/watch/${series.slug}/1`}
                className="inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-primary text-primary-foreground font-bold hover:opacity-90 transition-opacity"
              >
                <Play className="w-5 h-5" />
                {t('hero.watch')}
              </Link>
            )}
            {series && (
              <Link
                to={`/series/${series.slug}`}
                className="inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-secondary text-secondary-foreground font-bold hover:bg-surface-hover transition-colors"
              >
                <Info className="w-5 h-5" />
                {t('hero.details')}
              </Link>
            )}
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default HeroBanner;
