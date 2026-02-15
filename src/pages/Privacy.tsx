import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { useTranslation } from 'react-i18next';

const Privacy = () => {
  const { t } = useTranslation();
  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navbar />
      <main className="container mx-auto px-4 pt-24 pb-16 max-w-3xl">
        <h1 className="text-3xl font-display font-bold text-gradient-gold mb-8">{t('footer.privacy')}</h1>
        <div className="space-y-6 text-muted-foreground leading-relaxed">
          <section>
            <h2 className="text-xl font-semibold text-foreground mb-3">Information We Collect</h2>
            <p>We collect information you provide when creating an account, such as your name and email address. We also collect usage data to improve your experience on our platform.</p>
          </section>
          <section>
            <h2 className="text-xl font-semibold text-foreground mb-3">How We Use Your Information</h2>
            <p>Your information is used to personalize your experience, provide recommendations, and maintain your favorites and watch history. We do not sell your personal data to third parties.</p>
          </section>
          <section>
            <h2 className="text-xl font-semibold text-foreground mb-3">Cookies</h2>
            <p>We use cookies and similar technologies to remember your preferences, language settings, and to keep you signed in.</p>
          </section>
          <section>
            <h2 className="text-xl font-semibold text-foreground mb-3">Data Security</h2>
            <p>We implement industry-standard security measures to protect your personal information. However, no method of transmission over the internet is 100% secure.</p>
          </section>
          <section>
            <h2 className="text-xl font-semibold text-foreground mb-3">Contact</h2>
            <p>If you have any questions about this Privacy Policy, please contact us at contact@hilalstream.com.</p>
          </section>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Privacy;
