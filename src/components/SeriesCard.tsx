import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Star, Eye } from 'lucide-react';
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
        <div className="relative aspect-[2/3] rounded-lg overflow-hidden bg-surface">
          <img
            src={series.posterImage}
            alt={getTitle(series)}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
            loading="lazy"
          />
          {/* Overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-background via-background/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

          {/* Trending badge */}
          {series.isTrending && (
            <div className="absolute top-2 start-2 px-2 py-1 rounded bg-primary text-primary-foreground text-xs font-bold">
              🔥
            </div>
          )}

          {/* Rating */}
          <div className="absolute top-2 end-2 flex items-center gap-1 px-2 py-1 rounded glass text-xs font-medium text-primary">
            <Star className="w-3 h-3 fill-primary" />
            {series.rating}
          </div>

          {/* Bottom info */}
          <div className="absolute bottom-0 inset-x-0 p-3 bg-gradient-to-t from-background to-transparent">
            <h3 className="font-display font-bold text-sm text-foreground line-clamp-2">
              {getTitle(series)}
            </h3>
            <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
              <span>{series.releaseYear}</span>
              <span>•</span>
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
