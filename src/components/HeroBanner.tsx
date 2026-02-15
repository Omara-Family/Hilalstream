import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { Play, Info, Star } from 'lucide-react';
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
    <section className="relative h-[75vh] md:h-[90vh] flex items-end overflow-hidden">
      {/* Background with Ken Burns effect */}
      <div className="absolute inset-0">
        <motion.img
          src={bgImage}
          alt={title}
          className="w-full h-full object-cover"
          initial={{ scale: 1.1 }}
          animate={{ scale: 1 }}
          transition={{ duration: 12, ease: "easeOut" }}
        />
        {/* Multi-layer gradients for depth */}
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/50 to-background/20" />
        <div className="absolute inset-0 bg-gradient-to-r from-background/90 via-background/30 to-transparent" />
        <div className="absolute bottom-0 inset-x-0 h-32 bg-gradient-to-t from-background to-transparent" />
      </div>

      {/* Ambient glow behind content */}
      <div className="absolute bottom-20 start-10 w-96 h-96 rounded-full bg-primary/5 blur-[120px] pointer-events-none" />

      {/* Content */}
      <div className="relative container mx-auto px-4 pb-20 md:pb-28">
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="max-w-2xl"
        >
          {series?.isTrending && (
            <motion.span
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 }}
              className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/15 ring-1 ring-primary/30 text-primary text-sm font-semibold mb-5 backdrop-blur-sm"
            >
              🔥 {t('hero.trending')}
            </motion.span>
          )}

          <h1 className="text-5xl md:text-7xl font-display font-black text-foreground leading-[1.1] mb-5 tracking-tight">
            {title}
          </h1>

          {/* Meta info */}
          {series && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
              className="flex items-center gap-3 mb-5 text-sm text-muted-foreground"
            >
              <span className="flex items-center gap-1 text-primary font-semibold">
                <Star className="w-4 h-4 fill-primary" />
                {series.rating.toFixed(1)}
              </span>
              <span className="w-1 h-1 rounded-full bg-muted-foreground/50" />
              <span>{series.releaseYear}</span>
              <span className="w-1 h-1 rounded-full bg-muted-foreground/50" />
              <span>{series.genre?.slice(0, 2).join(' · ')}</span>
            </motion.div>
          )}

          <p className="text-base md:text-lg text-secondary-foreground/80 line-clamp-3 mb-8 max-w-lg leading-relaxed">
            {desc}
          </p>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="flex flex-wrap gap-3"
          >
            {series && (
              <Link
                to={`/watch/${series.slug}/1`}
                className="inline-flex items-center gap-2.5 px-8 py-3.5 rounded-xl bg-primary text-primary-foreground font-bold text-base hover:shadow-[0_0_30px_hsl(var(--primary)/0.3)] transition-all duration-300 hover:scale-[1.02] active:scale-[0.98]"
              >
                <Play className="w-5 h-5 fill-primary-foreground" />
                {t('hero.watch')}
              </Link>
            )}
            {series && (
              <Link
                to={`/series/${series.slug}`}
                className="inline-flex items-center gap-2.5 px-8 py-3.5 rounded-xl bg-secondary/80 backdrop-blur-sm ring-1 ring-border text-secondary-foreground font-bold text-base hover:bg-surface-hover hover:ring-primary/30 transition-all duration-300"
              >
                <Info className="w-5 h-5" />
                {t('hero.details')}
              </Link>
            )}
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
};

export default HeroBanner;