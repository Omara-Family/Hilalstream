import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useRef } from 'react';
import { motion } from 'framer-motion';
import ProgramCard from './ProgramCard';
import type { Series } from '@/types';

interface ProgramRowProps {
  title: string;
  programs: Series[];
}

const ProgramRow = ({ title, programs }: ProgramRowProps) => {
  const { i18n } = useTranslation();
  const scrollRef = useRef<HTMLDivElement>(null);
  const isRtl = i18n.language === 'ar';

  const scroll = (dir: 'left' | 'right') => {
    if (!scrollRef.current) return;
    const amount = 300;
    const scrollAmount = dir === 'left' ? -amount : amount;
    scrollRef.current.scrollBy({ left: isRtl ? -scrollAmount : scrollAmount, behavior: 'smooth' });
  };

  if (programs.length === 0) return null;

  return (
    <section className="py-10">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-1 h-7 rounded-full bg-primary" />
            <h2 className="text-xl md:text-2xl font-display font-bold text-foreground">{title}</h2>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => scroll('left')} className="p-2 rounded-full bg-secondary/80 ring-1 ring-border hover:bg-surface-hover hover:ring-primary/30 transition-all duration-200">
              <ChevronLeft className="w-4 h-4 text-secondary-foreground" />
            </button>
            <button onClick={() => scroll('right')} className="p-2 rounded-full bg-secondary/80 ring-1 ring-border hover:bg-surface-hover hover:ring-primary/30 transition-all duration-200">
              <ChevronRight className="w-4 h-4 text-secondary-foreground" />
            </button>
          </div>
        </div>
        <div ref={scrollRef} className="flex gap-4 overflow-x-auto scrollbar-hide pb-4">
          {programs.map((p, i) => (
            <div key={p._id} className="flex-shrink-0 w-[155px] md:w-[195px]">
              <ProgramCard program={p} index={i} />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default ProgramRow;
