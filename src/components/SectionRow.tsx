import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useRef } from 'react';
import SeriesCard from './SeriesCard';
import type { Series } from '@/types';

interface SectionRowProps {
  title: string;
  series: Series[];
  viewAllLink?: string;
}

const SectionRow = ({ title, series, viewAllLink }: SectionRowProps) => {
  const { t, i18n } = useTranslation();
  const scrollRef = useRef<HTMLDivElement>(null);
  const isRtl = i18n.language === 'ar';

  const scroll = (dir: 'left' | 'right') => {
    if (!scrollRef.current) return;
    const amount = 300;
    const scrollAmount = dir === 'left' ? -amount : amount;
    scrollRef.current.scrollBy({ left: isRtl ? -scrollAmount : scrollAmount, behavior: 'smooth' });
  };

  return (
    <section className="py-8">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-xl md:text-2xl font-display font-bold text-foreground">{title}</h2>
          <div className="flex items-center gap-2">
            {viewAllLink && (
              <Link to={viewAllLink} className="text-sm text-primary hover:underline">
                {t('home.viewAll')}
              </Link>
            )}
            <button onClick={() => scroll('left')} className="p-1.5 rounded-full bg-secondary hover:bg-surface-hover transition-colors">
              <ChevronLeft className="w-4 h-4 text-secondary-foreground" />
            </button>
            <button onClick={() => scroll('right')} className="p-1.5 rounded-full bg-secondary hover:bg-surface-hover transition-colors">
              <ChevronRight className="w-4 h-4 text-secondary-foreground" />
            </button>
          </div>
        </div>
        <div
          ref={scrollRef}
          className="flex gap-4 overflow-x-auto scrollbar-hide pb-2"
        >
          {series.map((s, i) => (
            <div key={s._id} className="flex-shrink-0 w-[160px] md:w-[200px]">
              <SeriesCard series={s} index={i} />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default SectionRow;
