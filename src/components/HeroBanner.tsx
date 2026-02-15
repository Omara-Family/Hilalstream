import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { Play, Info, Star, ChevronLeft, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useState, useEffect, useCallback } from 'react';
import type { Series } from '@/types';
import { useLocale } from '@/hooks/useLocale';
import heroBg from '@/assets/hero-bg.jpg';

interface HeroBannerProps {
  series?: Series;
  allSeries?: Series[];
}

const HeroBanner = ({ series, allSeries }: HeroBannerProps) => {
  const { t } = useTranslation();
  const { getTitle, getDescription } = useLocale();

  const list = allSeries && allSeries.length > 0 ? allSeries : series ? [series] : [];
  const [currentIndex, setCurrentIndex] = useState(0);

  const current = list[currentIndex];
  const bgImage = current?.backdropImage || heroBg;
  const title = current ? getTitle(current) : 'HilalStream';
  const desc = current
    ? getDescription(current)
    : 'شاهد أفضل المسلسلات العربية والتركية بجودة عالية';

  const goNext = useCallback(() => {
    if (list.length <= 1) return;
    setCurrentIndex((prev) => (prev + 1) % list.length);
  }, [list.length]);

  const goPrev = useCallback(() => {
    if (list.length <= 1) return;
    setCurrentIndex((prev) => (prev - 1 + list.length) % list.length);
  }, [list.length]);

  // Auto-rotate every 8 seconds
  useEffect(() => {
    if (list.length <= 1) return;
    const timer = setInterval(goNext, 8000);
    return () => clearInterval(timer);
  }, [goNext, list.length]);

  return (
    <section className="relative h-[75vh] md:h-[90vh] flex items-end overflow-hidden">
      {/* Background */}
      <AnimatePresence mode="wait">
        <motion.div
          key={currentIndex}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.6 }}
          className="absolute inset-0"
        >
          <img
            src={bgImage}
            alt={title}
            className="w-full h-full object-cover"
            style={{ imageRendering: 'auto' }}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-background via-background/50 to-background/20" />
          <div className="absolute inset-0 bg-gradient-to-r from-background/90 via-background/30 to-transparent" />
          <div className="absolute bottom-0 inset-x-0 h-32 bg-gradient-to-t from-background to-transparent" />
        </motion.div>
      </AnimatePresence>

      {/* Ambient glow */}
      <div className="absolute bottom-20 start-10 w-96 h-96 rounded-full bg-primary/5 blur-[120px] pointer-events-none" />

      {/* Navigation Arrows */}
      {list.length > 1 && (
        <>
          <button
            onClick={goPrev}
            className="absolute top-1/2 -translate-y-1/2 start-4 z-20 w-11 h-11 rounded-full bg-black/40 hover:bg-black/70 backdrop-blur-sm flex items-center justify-center text-white transition-all duration-200 hover:scale-110"
            aria-label="Previous"
          >
            <ChevronLeft className="w-6 h-6 rtl:rotate-180" />
          </button>
          <button
            onClick={goNext}
            className="absolute top-1/2 -translate-y-1/2 end-4 z-20 w-11 h-11 rounded-full bg-black/40 hover:bg-black/70 backdrop-blur-sm flex items-center justify-center text-white transition-all duration-200 hover:scale-110"
            aria-label="Next"
          >
            <ChevronRight className="w-6 h-6 rtl:rotate-180" />
          </button>
        </>
      )}

      {/* Dots indicator */}
      {list.length > 1 && (
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-20 flex items-center gap-2">
          {list.map((_, i) => (
            <button
              key={i}
              onClick={() => setCurrentIndex(i)}
              className={`h-2 rounded-full transition-all duration-300 ${i === currentIndex ? 'w-8 bg-primary' : 'w-2 bg-white/40 hover:bg-white/70'}`}
              aria-label={`Go to slide ${i + 1}`}
            />
          ))}
        </div>
      )}

      {/* Content */}
      <div className="relative container mx-auto px-4 pb-20 md:pb-28">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentIndex}
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.5, ease: "easeOut" }}
            className="max-w-2xl"
          >
            {current?.isTrending && (
              <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/15 ring-1 ring-primary/30 text-primary text-sm font-semibold mb-5 backdrop-blur-sm">
                🔥 {t('hero.trending')}
              </span>
            )}

            <h1 className="text-5xl md:text-7xl font-display font-black text-foreground leading-[1.1] mb-5 tracking-tight">
              {title}
            </h1>

            {current && (
              <div className="flex items-center gap-3 mb-5 text-sm text-muted-foreground">
                <span className="flex items-center gap-1 text-primary font-semibold">
                  <Star className="w-4 h-4 fill-primary" />
                  {current.rating.toFixed(1)}
                </span>
                <span className="w-1 h-1 rounded-full bg-muted-foreground/50" />
                <span>{current.releaseYear}</span>
                <span className="w-1 h-1 rounded-full bg-muted-foreground/50" />
                <span>{current.genre?.slice(0, 2).join(' · ')}</span>
              </div>
            )}

            <p className="text-base md:text-lg text-secondary-foreground/80 line-clamp-3 mb-8 max-w-lg leading-relaxed">
              {desc}
            </p>

            <div className="flex flex-wrap gap-3">
              {current && (
                <Link
                  to={`/watch/${current.slug}/1`}
                  className="inline-flex items-center gap-2.5 px-8 py-3.5 rounded-xl bg-primary text-primary-foreground font-bold text-base hover:shadow-[0_0_30px_hsl(var(--primary)/0.3)] transition-all duration-300 hover:scale-[1.02] active:scale-[0.98]"
                >
                  <Play className="w-5 h-5 fill-primary-foreground" />
                  {t('hero.watch')}
                </Link>
              )}
              {current && (
                <Link
                  to={`/series/${current.slug}`}
                  className="inline-flex items-center gap-2.5 px-8 py-3.5 rounded-xl bg-secondary/80 backdrop-blur-sm ring-1 ring-border text-secondary-foreground font-bold text-base hover:bg-surface-hover hover:ring-primary/30 transition-all duration-300"
                >
                  <Info className="w-5 h-5" />
                  {t('hero.details')}
                </Link>
              )}
            </div>
          </motion.div>
        </AnimatePresence>
      </div>
    </section>
  );
};

export default HeroBanner;
