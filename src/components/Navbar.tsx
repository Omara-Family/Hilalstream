import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Search, Heart, Menu, X, Globe, LogOut, Shield, User } from 'lucide-react';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAppStore } from '@/store/useAppStore';
import { useStreak } from '@/hooks/useStreak';
import StreakBadge from '@/components/StreakBadge';
import ThemeToggle from '@/components/ThemeToggle';
import NotificationBell from '@/components/NotificationBell';

const Navbar = () => {
  const { t, i18n } = useTranslation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const navigate = useNavigate();
  const { isAuthenticated, logout, isAdmin } = useAppStore();
  const { currentStreak, longestStreak } = useStreak();

  const toggleLang = () => {
    i18n.changeLanguage(i18n.language === 'ar' ? 'en' : 'ar');
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
      setSearchOpen(false);
      setSearchQuery('');
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const navLinks = [
    { to: '/', label: t('nav.home') },
    { to: '/browse', label: t('nav.browse') },
    { to: '/favorites', label: t('nav.favorites') },
  ];

  return (
    <nav className="fixed top-0 inset-x-0 z-50 glass">
      <div className="container mx-auto flex items-center justify-between h-16 px-4">
        <Link to="/" className="flex items-center gap-2">
          <span className="text-2xl font-display font-bold text-gradient-gold">☪ HilalStream</span>
        </Link>

        <div className="hidden md:flex items-center gap-6">
          {navLinks.map(link => (
            <Link key={link.to} to={link.to} className="text-sm font-medium text-secondary-foreground hover:text-primary transition-colors">{link.label}</Link>
          ))}
        </div>

        <div className="flex items-center gap-3">
          <button onClick={() => setSearchOpen(!searchOpen)} className="p-2 rounded-lg text-muted-foreground hover:text-primary transition-colors">
            <Search className="w-5 h-5" />
          </button>
          <ThemeToggle />
          <button onClick={toggleLang} className="p-2 rounded-lg text-muted-foreground hover:text-primary transition-colors flex items-center gap-1">
            <Globe className="w-5 h-5" />
            <span className="text-xs font-medium">{i18n.language === 'ar' ? 'EN' : 'عربي'}</span>
          </button>
          <NotificationBell />
          <Link to="/favorites" className="hidden md:flex p-2 rounded-lg text-muted-foreground hover:text-primary transition-colors">
            <Heart className="w-5 h-5" />
          </Link>

          {isAuthenticated ? (
            <>
              <div className="hidden md:flex">
                <StreakBadge currentStreak={currentStreak} longestStreak={longestStreak} />
              </div>
              <Link to="/profile" className="hidden md:flex items-center gap-1 px-3 py-2 rounded-lg text-sm text-muted-foreground hover:text-primary transition-colors">
                <User className="w-4 h-4" />
              </Link>
              {isAdmin && (
                <Link to="/admin" className="hidden md:flex items-center gap-1 px-3 py-2 rounded-lg text-sm text-primary hover:opacity-80 transition-opacity">
                  <Shield className="w-4 h-4" />
                  Admin
                </Link>
              )}
              <button onClick={handleLogout} className="hidden md:flex items-center gap-1 px-3 py-2 rounded-lg text-sm text-muted-foreground hover:text-primary transition-colors">
                <LogOut className="w-4 h-4" />
                {t('nav.logout')}
              </button>
            </>
          ) : (
            <Link to="/login" className="hidden md:flex px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-semibold hover:opacity-90 transition-opacity">
              {t('nav.login')}
            </Link>
          )}

          <button onClick={() => setMobileOpen(!mobileOpen)} className="md:hidden p-2 rounded-lg text-muted-foreground">
            {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      <AnimatePresence>
        {searchOpen && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden border-t border-border">
            <form onSubmit={handleSearch} className="container mx-auto px-4 py-3">
              <input autoFocus value={searchQuery} onChange={e => setSearchQuery(e.target.value)} placeholder={t('search.placeholder')} className="w-full bg-secondary rounded-lg px-4 py-3 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary" />
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {mobileOpen && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="md:hidden overflow-hidden border-t border-border">
            <div className="container mx-auto px-4 py-4 flex flex-col gap-3">
              {navLinks.map(link => (
                <Link key={link.to} to={link.to} onClick={() => setMobileOpen(false)} className="text-sm font-medium text-secondary-foreground hover:text-primary py-2">{link.label}</Link>
              ))}
              {isAuthenticated ? (
                <>
                  <div className="flex items-center gap-2 py-2">
                    <StreakBadge currentStreak={currentStreak} longestStreak={longestStreak} />
                  </div>
                  <Link to="/profile" onClick={() => setMobileOpen(false)} className="flex items-center gap-2 text-sm font-medium text-secondary-foreground hover:text-primary py-2">
                    <User className="w-4 h-4" />
                    الملف الشخصي
                  </Link>
                  {isAdmin && (
                    <Link to="/admin" onClick={() => setMobileOpen(false)} className="flex items-center gap-2 text-sm font-medium text-primary py-2">
                      <Shield className="w-4 h-4" />
                      Admin
                    </Link>
                  )}
                  <button onClick={() => { handleLogout(); setMobileOpen(false); }} className="text-sm font-medium text-muted-foreground py-2 text-start">{t('nav.logout')}</button>
                </>
              ) : (
                <Link to="/login" onClick={() => setMobileOpen(false)} className="text-sm font-medium text-primary py-2">{t('nav.login')}</Link>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
};

export default Navbar;
