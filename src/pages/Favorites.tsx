import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { Heart } from 'lucide-react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import SeriesCard from '@/components/SeriesCard';
import { mockSeries } from '@/data/mock';
import { useAppStore } from '@/store/useAppStore';

const Favorites = () => {
  const { t } = useTranslation();
  const { favorites } = useAppStore();

  const favSeries = mockSeries.filter(s => favorites.includes(s._id));

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="pt-24 pb-12">
        <div className="container mx-auto px-4">
          <h1 className="text-2xl md:text-3xl font-display font-bold text-foreground mb-6 flex items-center gap-2">
            <Heart className="w-7 h-7 text-primary" />
            {t('nav.favorites')}
          </h1>

          {favSeries.length === 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-20"
            >
              <Heart className="w-16 h-16 text-muted mx-auto mb-4" />
              <p className="text-muted-foreground text-lg">{t('search.noResults')}</p>
            </motion.div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {favSeries.map((s, i) => (
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

export default Favorites;
