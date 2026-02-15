import { useTranslation } from 'react-i18next';
import { useEffect, useState } from 'react';
import HeroBanner from '@/components/HeroBanner';
import SectionRow from '@/components/SectionRow';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import RamadanLights from '@/components/RamadanLights';
import RamadanBanner from '@/components/RamadanBanner';
import ContinueWatching from '@/components/ContinueWatching';
import Recommendations from '@/components/Recommendations';
import { mockSeries } from '@/data/mock';
import { genres } from '@/data/mock';
import { useLocale } from '@/hooks/useLocale';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { supabase } from '@/integrations/supabase/client';
import type { Tables } from '@/integrations/supabase/types';

type DbSeries = Tables<'series'>;

// Adapter: map DB series to the shape our components expect
const mapSeries = (s: DbSeries) => ({
  _id: s.id,
  title_ar: s.title_ar,
  title_en: s.title_en,
  slug: s.slug,
  description_ar: s.description_ar || '',
  description_en: s.description_en || '',
  posterImage: s.poster_image || '',
  backdropImage: s.backdrop_image || '',
  releaseYear: s.release_year,
  genre: s.genre || [],
  tags: s.tags || [],
  rating: Number(s.rating) || 0,
  totalViews: s.total_views || 0,
  isTrending: s.is_trending || false,
  createdAt: s.created_at,
});

const Index = () => {
  const { t } = useTranslation();
  const { getGenreLabel } = useLocale();
  const [allSeries, setAllSeries] = useState(mockSeries);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSeries = async () => {
      const { data } = await supabase
        .from('series')
        .select('id, title_ar, title_en, slug, description_ar, description_en, poster_image, backdrop_image, release_year, genre, tags, rating, total_views, is_trending, created_at')
        .order('created_at', { ascending: false });

      if (data && data.length > 0) {
        setAllSeries(data.map(mapSeries));
      }
      // If no DB data, keep mock data as fallback
      setLoading(false);
    };
    fetchSeries();
  }, []);

  const trending = allSeries.filter(s => s.isTrending);
  const popular = [...allSeries].sort((a, b) => b.totalViews - a.totalViews);
  const latest = [...allSeries].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  const heroSeries = trending[0] || allSeries[0];

  return (
    <div className="min-h-screen bg-background">
      <RamadanLights />
      <Navbar />
      <RamadanBanner />
      <main>
        <HeroBanner series={heroSeries} />

        <ContinueWatching />
        <Recommendations />

        {trending.length > 0 && (
          <SectionRow title={t('home.trending')} series={trending} viewAllLink="/browse?filter=trending" />
        )}

        <SectionRow title={t('home.popular')} series={popular} viewAllLink="/browse?sort=views" />
        <SectionRow title={t('home.latest')} series={latest} viewAllLink="/browse?sort=latest" />

        {/* Genre Grid */}
        <section className="py-14">
          <div className="container mx-auto px-4">
            <div className="flex items-center gap-3 mb-8">
              <div className="w-1 h-7 rounded-full bg-primary" />
              <h2 className="text-xl md:text-2xl font-display font-bold text-foreground">
                {t('home.categories')}
              </h2>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-7 gap-3">
              {genres.map((genre, i) => (
                <motion.div key={genre.id} initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: i * 0.04 }}>
                  <Link
                    to={`/browse?genre=${genre.id}`}
                    className="group block p-5 rounded-xl bg-secondary/60 ring-1 ring-border/50 text-center hover:ring-primary/40 hover:bg-surface-hover hover:shadow-[0_4px_20px_hsl(var(--primary)/0.1)] transition-all duration-300"
                  >
                    <span className="text-sm font-semibold text-secondary-foreground group-hover:text-primary transition-colors duration-200">
                      {getGenreLabel(genre)}
                    </span>
                  </Link>
                </motion.div>
              ))}
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
};

export default Index;
