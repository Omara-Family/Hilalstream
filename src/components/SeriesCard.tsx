import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Star, Eye, Play } from 'lucide-react';
import type { Series } from '@/types';
import { useLocale } from '@/hooks/useLocale';

interface SeriesCardProps {
  series: Series;
  index?: number;
}

const SeriesCard = ({ series, index = 0 }: SeriesCardProps) => {
  const { getTitle, formatViews } = useLocale();

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05, duration: 0.4 }}
    >
      <Link to={`/series/${series.slug}`} className="group block">
        <div className="relative aspect-[2/3] rounded-xl overflow-hidden bg-surface ring-1 ring-border/50 transition-all duration-500 group-hover:ring-primary/40 group-hover:shadow-[0_8px_40px_hsl(var(--primary)/0.15)]">
          <img
            src={series.posterImage}
            alt={getTitle(series)}
            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
            loading="lazy"
          />

          {/* Permanent bottom gradient */}
          <div className="absolute inset-0 bg-gradient-to-t from-black via-black/30 to-transparent" />

          {/* Hover overlay with play icon */}
          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-all duration-300 flex items-center justify-center">
            <div className="w-12 h-12 rounded-full bg-primary/90 flex items-center justify-center scale-75 group-hover:scale-100 transition-transform duration-300 shadow-lg">
              <Play className="w-5 h-5 text-primary-foreground fill-primary-foreground ms-0.5" />
            </div>
          </div>

          {/* Trending badge */}
          {series.isTrending && (
            <div className="absolute top-2.5 start-2.5 px-2.5 py-1 rounded-full bg-primary text-primary-foreground text-[10px] font-bold uppercase tracking-wider shadow-md">
              🔥 Trending
            </div>
          )}

          {/* Rating pill */}
          <div className="absolute top-2.5 end-2.5 flex items-center gap-1 px-2 py-1 rounded-full glass text-xs font-semibold text-primary">
            <Star className="w-3 h-3 fill-primary" />
            {series.rating.toFixed(1)}
          </div>

          {/* Bottom info */}
          <div className="absolute bottom-0 inset-x-0 p-3.5">
            <h3 className="font-display font-bold text-sm text-white line-clamp-2 leading-snug group-hover:text-primary transition-colors duration-300">
              {getTitle(series)}
            </h3>
            <div className="flex items-center gap-2 mt-1.5 text-[11px] text-white/60">
              <span className="font-medium">{series.releaseYear}</span>
              <span className="w-1 h-1 rounded-full bg-white/40" />
              <span className="flex items-center gap-1">
                <Eye className="w-3 h-3" />
                {formatViews(series.totalViews)}
              </span>
            </div>
          </div>
        </div>
      </Link>
    </motion.div>
  );
};

export default SeriesCard;