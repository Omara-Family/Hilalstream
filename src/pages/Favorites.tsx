import { useTranslation } from 'react-i18next';
import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Heart } from 'lucide-react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import SeriesCard from '@/components/SeriesCard';
import { useAppStore } from '@/store/useAppStore';
import { supabase } from '@/integrations/supabase/client';
import { mockSeries } from '@/data/mock';
import type { Series } from '@/types';

const mapDbSeries = (s: any): Series => ({
  _id: s.id, title_ar: s.title_ar, title_en: s.title_en, slug: s.slug,
  description_ar: s.description_ar || '', description_en: s.description_en || '',
  posterImage: s.poster_image || '', backdropImage: s.backdrop_image || '',
  releaseYear: s.release_year, genre: s.genre || [], tags: s.tags || [],
  rating: Number(s.rating) || 0, totalViews: s.total_views || 0,
  isTrending: s.is_trending || false, createdAt: s.created_at,
});

const Favorites = () => {
  const { t } = useTranslation();
  const { favorites, user } = useAppStore();
  const [favSeries, setFavSeries] = useState<Series[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      if (user && favorites.length > 0) {
        const { data } = await supabase
          .from('series')
          .select('id, title_ar, title_en, slug, description_ar, description_en, poster_image, backdrop_image, release_year, genre, tags, rating, total_views, is_trending, created_at')
          .in('id', favorites);
        if (data && data.length > 0) {
          setFavSeries(data.map(mapDbSeries));
          setLoading(false);
          return;
        }
      }
      // Fallback to mock
      setFavSeries(mockSeries.filter(s => favorites.includes(s._id)));
      setLoading(false);
    };
    fetch();
  }, [favorites, user]);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="pt-24 pb-12">
        <div className="container mx-auto px-4">
          <h1 className="text-2xl md:text-3xl font-display font-bold text-foreground mb-6 flex items-center gap-2">
            <Heart className="w-7 h-7 text-primary" />{t('nav.favorites')}
          </h1>
          {favSeries.length === 0 ? (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-20">
              <Heart className="w-16 h-16 text-muted mx-auto mb-4" />
              <p className="text-muted-foreground text-lg">{t('search.noResults')}</p>
            </motion.div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {favSeries.map((s, i) => <SeriesCard key={s._id} series={s} index={i} />)}
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Favorites;
