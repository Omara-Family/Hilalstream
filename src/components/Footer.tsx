import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

const Footer = () => {
  const { t } = useTranslation();

  return (
    <footer className="border-t border-border bg-card mt-16">
      <div className="container mx-auto px-4 py-12">
        <div className="flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="text-center md:text-start">
            <Link to="/" className="text-xl font-display font-bold text-gradient-gold">
              ☪ HilalStream
            </Link>
            <p className="text-sm text-muted-foreground mt-2 max-w-xs">
              {t('footer.rights')} © {new Date().getFullYear()} HilalStream
            </p>
          </div>
          <div className="flex gap-6 text-sm text-muted-foreground">
            <Link to="/about" className="hover:text-primary transition-colors">{t('footer.about')}</Link>
            <Link to="/contact" className="hover:text-primary transition-colors">{t('footer.contact')}</Link>
            <Link to="/privacy" className="hover:text-primary transition-colors">{t('footer.privacy')}</Link>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
