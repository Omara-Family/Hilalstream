import { useSearchParams, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Search as SearchIcon, Filter } from 'lucide-react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import SeriesCard from '@/components/SeriesCard';
import { mockSeries, genres } from '@/data/mock';
import { useLocale } from '@/hooks/useLocale';

const Browse = () => {
  const { t } = useTranslation();
  const { getGenreLabel } = useLocale();
  const [searchParams] = useSearchParams();
  const [query, setQuery] = useState(searchParams.get('q') || '');
  const [selectedGenre, setSelectedGenre] = useState(searchParams.get('genre') || '');
  const [selectedYear, setSelectedYear] = useState(searchParams.get('year') || '');

  const years = useMemo(() => {
    const uniqueYears = [...new Set(mockSeries.map(s => s.releaseYear))].sort((a, b) => b - a);
    return uniqueYears;
  }, []);

  const filtered = useMemo(() => {
    let result = [...mockSeries];

    if (query.trim()) {
      const q = query.toLowerCase();
      result = result.filter(
        s => s.title_ar.includes(q) || s.title_en.toLowerCase().includes(q)
      );
    }

    if (selectedGenre) {
      result = result.filter(s => s.genre.includes(selectedGenre));
    }

    if (selectedYear) {
      result = result.filter(s => s.releaseYear === parseInt(selectedYear));
    }

    return result;
  }, [query, selectedGenre, selectedYear]);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="pt-24 pb-12">
        <div className="container mx-auto px-4">
          <h1 className="text-2xl md:text-3xl font-display font-bold text-foreground mb-6">
            {query ? `${t('search.results')} "${query}"` : t('nav.browse')}
          </h1>

          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-3 mb-8">
            <div className="relative flex-1 max-w-md">
              <SearchIcon className="absolute start-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                value={query}
                onChange={e => setQuery(e.target.value)}
                placeholder={t('search.placeholder')}
                className="w-full ps-10 pe-4 py-3 rounded-lg bg-secondary text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary text-sm"
              />
            </div>

            <select
              value={selectedGenre}
              onChange={e => setSelectedGenre(e.target.value)}
              className="px-4 py-3 rounded-lg bg-secondary text-secondary-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="">{t('search.allGenres')}</option>
              {genres.map(g => (
                <option key={g.id} value={g.id}>{getGenreLabel(g)}</option>
              ))}
            </select>

            <select
              value={selectedYear}
              onChange={e => setSelectedYear(e.target.value)}
              className="px-4 py-3 rounded-lg bg-secondary text-secondary-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="">{t('search.allYears')}</option>
              {years.map(y => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
          </div>

          {/* Results */}
          {filtered.length === 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-20"
            >
              <p className="text-muted-foreground text-lg">{t('search.noResults')}</p>
            </motion.div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
              {filtered.map((s, i) => (
                <SeriesCard key={s._id} series={s} index={i} />
              ))}
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Browse;
