import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { useTranslation } from 'react-i18next';

const Terms = () => {
  const { t } = useTranslation();
  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navbar />
      <main className="container mx-auto px-4 pt-24 pb-16 max-w-3xl">
        <h1 className="text-3xl font-display font-bold text-gradient-gold mb-8">{t('footer.terms')}</h1>
        <div className="space-y-6 text-muted-foreground leading-relaxed">
          <section>
            <h2 className="text-xl font-semibold text-foreground mb-3">Acceptance of Terms</h2>
            <p>By accessing and using HilalStream, you agree to be bound by these Terms of Service. If you do not agree, please do not use the platform.</p>
          </section>
          <section>
            <h2 className="text-xl font-semibold text-foreground mb-3">Use of Service</h2>
            <p>HilalStream is provided for personal, non-commercial use. You may not reproduce, distribute, or create derivative works from any content on this platform without permission.</p>
          </section>
          <section>
            <h2 className="text-xl font-semibold text-foreground mb-3">User Accounts</h2>
            <p>You are responsible for maintaining the confidentiality of your account credentials. You agree to notify us immediately of any unauthorized access to your account.</p>
          </section>
          <section>
            <h2 className="text-xl font-semibold text-foreground mb-3">Content</h2>
            <p>All content available on HilalStream is for streaming purposes only. Unauthorized downloading, copying, or redistribution of content is strictly prohibited.</p>
          </section>
          <section>
            <h2 className="text-xl font-semibold text-foreground mb-3">Limitation of Liability</h2>
            <p>HilalStream is provided "as is" without warranties of any kind. We are not liable for any damages arising from the use of our platform.</p>
          </section>
          <section>
            <h2 className="text-xl font-semibold text-foreground mb-3">Changes to Terms</h2>
            <p>We reserve the right to modify these terms at any time. Continued use of HilalStream after changes constitutes acceptance of the new terms.</p>
          </section>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Terms;
