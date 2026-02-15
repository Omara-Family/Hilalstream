import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Heart } from 'lucide-react';

const Footer = () => {
  const { t } = useTranslation();

  return (
    <footer className="relative border-t border-border/50 bg-card/50 backdrop-blur-sm mt-16">
      {/* Top gradient line */}
      <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-primary/40 to-transparent" />

      <div className="container mx-auto px-4 py-14">
        <div className="flex flex-col md:flex-row justify-between items-center gap-8">
          <div className="text-center md:text-start">
            <Link to="/" className="text-2xl font-display font-bold text-gradient-gold inline-block">
              ☪ HilalStream
            </Link>
            <p className="text-sm text-muted-foreground mt-3 max-w-xs leading-relaxed">
              {t('footer.rights')} © {new Date().getFullYear()} HilalStream
            </p>
          </div>

          <div className="flex flex-wrap justify-center gap-8 text-sm text-muted-foreground">
            <Link to="/about" className="hover:text-primary transition-colors duration-200">{t('footer.about')}</Link>
            <Link to="/contact" className="hover:text-primary transition-colors duration-200">{t('footer.contact')}</Link>
            <Link to="/privacy" className="hover:text-primary transition-colors duration-200">{t('footer.privacy')}</Link>
            <Link to="/terms" className="hover:text-primary transition-colors duration-200">{t('footer.terms')}</Link>
          </div>
        </div>

        <div className="mt-10 pt-6 border-t border-border/30 flex items-center justify-center gap-1.5 text-xs text-muted-foreground/60">
          <span>Made with</span>
          <Heart className="w-3 h-3 fill-primary text-primary" />
          <span>for the community</span>
        </div>
      </div>
    </footer>
  );
};

export default Footer;