import { useTranslation } from 'react-i18next';
import HeroBanner from '@/components/HeroBanner';
import SectionRow from '@/components/SectionRow';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { mockSeries } from '@/data/mock';
import { genres } from '@/data/mock';
import { useLocale } from '@/hooks/useLocale';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';

const Index = () => {
  const { t } = useTranslation();
  const { getGenreLabel } = useLocale();

  const trending = mockSeries.filter(s => s.isTrending);
  const popular = [...mockSeries].sort((a, b) => b.totalViews - a.totalViews);
  const latest = [...mockSeries].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  const heroSeries = trending[0];

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main>
        <HeroBanner series={heroSeries} />

        <SectionRow
          title={t('home.trending')}
          series={trending}
          viewAllLink="/browse?filter=trending"
        />

        <SectionRow
          title={t('home.popular')}
          series={popular}
          viewAllLink="/browse?sort=views"
        />

        <SectionRow
          title={t('home.latest')}
          series={latest}
          viewAllLink="/browse?sort=latest"
        />

        {/* Genre Grid */}
        <section className="py-12">
          <div className="container mx-auto px-4">
            <h2 className="text-xl md:text-2xl font-display font-bold text-foreground mb-6">
              {t('home.categories')}
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-7 gap-3">
              {genres.map((genre, i) => (
                <motion.div
                  key={genre.id}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: i * 0.05 }}
                >
                  <Link
                    to={`/browse?genre=${genre.id}`}
                    className="block p-4 rounded-lg bg-secondary text-center hover:bg-surface-hover hover:ring-1 hover:ring-primary/30 transition-all"
                  >
                    <span className="text-sm font-semibold text-secondary-foreground">
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
