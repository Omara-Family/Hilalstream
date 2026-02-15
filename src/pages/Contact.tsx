import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { useTranslation } from 'react-i18next';
import { Mail } from 'lucide-react';

const Contact = () => {
  const { t } = useTranslation();
  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navbar />
      <main className="container mx-auto px-4 pt-24 pb-16 max-w-3xl">
        <h1 className="text-3xl font-display font-bold text-gradient-gold mb-8">{t('footer.contact')}</h1>
        <div className="space-y-6 text-muted-foreground leading-relaxed">
          <p>We'd love to hear from you! Whether you have a question, suggestion, or just want to say hello, feel free to reach out.</p>
          <div className="flex items-center gap-3 p-4 rounded-lg bg-card border border-border/50">
            <Mail className="w-5 h-5 text-primary" />
            <a href="mailto:contact@hilalstream.com" className="text-primary hover:underline">contact@hilalstream.com</a>
          </div>
          <p>We typically respond within 24-48 hours. Thank you for being part of the HilalStream community!</p>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Contact;
