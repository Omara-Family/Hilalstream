import { useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useState, useMemo, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Search as SearchIcon, ArrowUpDown } from 'lucide-react';
import { SkeletonRow } from '@/components/Skeleton';
import Navbar from '@/components/Navbar';
import RamadanLights from '@/components/RamadanLights';
import RamadanBanner from '@/components/RamadanBanner';
import Footer from '@/components/Footer';
import SeriesCard from '@/components/SeriesCard';
import { mockSeries, genres } from '@/data/mock';
import { initPopAd } from '@/lib/popAd';
import { useLocale } from '@/hooks/useLocale';
import { supabase } from '@/integrations/supabase/client';
import type { Series } from '@/types';

type SortOption = 'newest' | 'rating' | 'year' | 'views';

const mapDbSeries = (s: any): Series => ({
  _id: s.id, title_ar: s.title_ar, title_en: s.title_en, slug: s.slug,
  description_ar: s.description_ar || '', description_en: s.description_en || '',
  posterImage: s.poster_image || '', backdropImage: s.backdrop_image || '',
  releaseYear: s.release_year, genre: s.genre || [], tags: s.tags || [],
  rating: Number(s.rating) || 0, totalViews: s.total_views || 0,
  isTrending: s.is_trending || false, createdAt: s.created_at,
});

const Browse = () => {
  const { t, i18n } = useTranslation();
  const { getGenreLabel } = useLocale();
  const isAr = i18n.language === 'ar';
  const [searchParams] = useSearchParams();
  const [query, setQuery] = useState(searchParams.get('q') || '');
  const [selectedGenre, setSelectedGenre] = useState(searchParams.get('genre') || '');
  const [selectedYear, setSelectedYear] = useState(searchParams.get('year') || '');
  const [sortBy, setSortBy] = useState<SortOption>('newest');
const [allSeries, setAllSeries] = useState<Series[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchResults, setSearchResults] = useState<Series[] | null>(null);

  useEffect(() => { initPopAd(); }, []);

  useEffect(() => {
    const fetchAll = async () => {
      const { data } = await supabase
        .from('series')
        .select('id, title_ar, title_en, slug, description_ar, description_en, poster_image, backdrop_image, release_year, genre, tags, rating, total_views, is_trending, created_at')
        .order('created_at', { ascending: false });
      if (data && data.length > 0) {
        setAllSeries(data.map(mapDbSeries));
      } else {
        setAllSeries(mockSeries);
      }
      setLoading(false);
    };
    fetchAll();
  }, []);

  useEffect(() => {
    if (!query.trim()) { setSearchResults(null); return; }
    const doSearch = async () => {
      const { data } = await supabase.rpc('search_series', { _query: query.trim(), _limit: 50, _offset: 0 });
      if (data && data.length > 0) {
        setSearchResults(data.map(mapDbSeries));
      } else {
        const q = query.toLowerCase();
        setSearchResults(allSeries.filter(s => s.title_ar.includes(q) || s.title_en.toLowerCase().includes(q)));
      }
    };
    const timer = setTimeout(doSearch, 300);
    return () => clearTimeout(timer);
  }, [query, allSeries]);

  const years = useMemo(() => [...new Set(allSeries.map(s => s.releaseYear))].sort((a, b) => b - a), [allSeries]);

  const filtered = useMemo(() => {
    let result = searchResults || allSeries;
    if (selectedGenre) result = result.filter(s => s.genre.some(g => g.toLowerCase() === selectedGenre.toLowerCase()));
    if (selectedYear) result = result.filter(s => s.releaseYear === parseInt(selectedYear));

    const sorted = [...result];
    switch (sortBy) {
      case 'rating': sorted.sort((a, b) => b.rating - a.rating); break;
      case 'year': sorted.sort((a, b) => b.releaseYear - a.releaseYear); break;
      case 'views': sorted.sort((a, b) => b.totalViews - a.totalViews); break;
      default: sorted.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    }
    return sorted;
  }, [searchResults, allSeries, selectedGenre, selectedYear, sortBy]);

  const sortOptions: { value: SortOption; label: string }[] = [
    { value: 'newest', label: isAr ? 'الأحدث' : 'Newest' },
    { value: 'rating', label: isAr ? 'التقييم' : 'Rating' },
    { value: 'year', label: isAr ? 'السنة' : 'Year' },
    { value: 'views', label: isAr ? 'المشاهدات' : 'Views' },
  ];

  return (
    <div className="min-h-screen bg-background">
      <RamadanLights />
      <Navbar />
      <RamadanBanner />
      <main className="pt-24 pb-12">
        <div className="container mx-auto px-4">
          <h1 className="text-2xl md:text-3xl font-display font-bold text-foreground mb-6">
            {query ? `${t('search.results')} "${query}"` : t('nav.browse')}
          </h1>

          {/* Search + Year + Sort row */}
          <div className="flex flex-col sm:flex-row gap-3 mb-4">
            <div className="relative flex-1 max-w-md">
              <SearchIcon className="absolute start-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input value={query} onChange={e => setQuery(e.target.value)} placeholder={t('search.placeholder')} className="w-full ps-10 pe-4 py-3 rounded-lg bg-secondary text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary text-sm" />
            </div>
            <select value={selectedYear} onChange={e => setSelectedYear(e.target.value)} className="px-4 py-3 rounded-lg bg-secondary text-secondary-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary">
              <option value="">{t('search.allYears')}</option>
              {years.map(y => <option key={y} value={y}>{y}</option>)}
            </select>
            <div className="flex items-center gap-2 px-4 py-3 rounded-lg bg-secondary text-secondary-foreground text-sm">
              <ArrowUpDown className="w-4 h-4 text-muted-foreground shrink-0" />
              <select value={sortBy} onChange={e => setSortBy(e.target.value as SortOption)} className="bg-transparent focus:outline-none">
                {sortOptions.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </div>
          </div>

          {/* Genre chips */}
          <div className="flex flex-wrap gap-2 mb-8">
            <button
              onClick={() => setSelectedGenre('')}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                !selectedGenre
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-secondary text-secondary-foreground hover:bg-accent'
              }`}
            >
              {isAr ? 'الكل' : 'All'}
            </button>
            {genres.map(g => (
              <button
                key={g.id}
                onClick={() => setSelectedGenre(selectedGenre === g.id ? '' : g.id)}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                  selectedGenre === g.id
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-secondary text-secondary-foreground hover:bg-accent'
                }`}
              >
                {getGenreLabel(g)}
              </button>
            ))}
          </div>

          {loading ? (
            <>
              <SkeletonRow />
              <SkeletonRow />
              <SkeletonRow />
            </>
          ) : filtered.length === 0 ? (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-20">
              <p className="text-muted-foreground text-lg">{t('search.noResults')}</p>
            </motion.div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
              {filtered.map((s, i) => <SeriesCard key={s._id} series={s} index={i} />)}
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Browse;
