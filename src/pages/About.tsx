import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { useTranslation } from 'react-i18next';

const About = () => {
  const { t } = useTranslation();
  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navbar />
      <main className="container mx-auto px-4 pt-24 pb-16 max-w-3xl">
        <h1 className="text-3xl font-display font-bold text-gradient-gold mb-8">{t('footer.about')}</h1>
        <div className="prose prose-invert max-w-none space-y-4 text-muted-foreground leading-relaxed">
          <p>HilalStream is a community-driven platform dedicated to bringing you the best Arabic series and entertainment content. Our mission is to make quality Arabic content accessible to everyone, everywhere.</p>
          <p>We curate a wide selection of series across genres — from drama and romance to action and comedy — so there's always something for you to enjoy.</p>
          <p>Whether you're catching up on the latest trending shows or discovering hidden gems, HilalStream is your go-to destination for Arabic entertainment.</p>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default About;
