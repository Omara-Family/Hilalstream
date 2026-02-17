import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ChevronRight, Search, Heart, Flame, Play, Globe } from 'lucide-react';

interface Step {
  title_en: string;
  title_ar: string;
  desc_en: string;
  desc_ar: string;
  icon: React.ReactNode;
}

const STEPS: Step[] = [
  {
    title_en: 'Welcome to HilalStream!',
    title_ar: 'مرحباً بك في هلال ستريم!',
    desc_en: 'Your home for the best Arabic and global series. Let us show you around!',
    desc_ar: 'وجهتك لأفضل المسلسلات العربية والعالمية. دعنا نعرّفك على الموقع!',
    icon: <Play className="w-6 h-6" />,
  },
  {
    title_en: 'Browse & Discover',
    title_ar: 'تصفح واكتشف',
    desc_en: 'Use the Browse page to filter by genre, year, or search for your favorite series.',
    desc_ar: 'استخدم صفحة التصفح للفلترة حسب النوع أو السنة أو البحث عن مسلسلك المفضل.',
    icon: <Search className="w-6 h-6" />,
  },
  {
    title_en: 'Save Favorites',
    title_ar: 'احفظ المفضلة',
    desc_en: 'Tap the heart icon on any series to add it to your favorites list for quick access.',
    desc_ar: 'اضغط على أيقونة القلب على أي مسلسل لإضافته إلى قائمة المفضلة.',
    icon: <Heart className="w-6 h-6" />,
  },
  {
    title_en: 'Earn Streaks & Badges',
    title_ar: 'اكسب السلاسل والشارات',
    desc_en: 'Watch daily to build your streak! Earn badges for milestones and achievements.',
    desc_ar: 'شاهد يومياً لبناء سلسلتك! اكسب شارات عند تحقيق الإنجازات.',
    icon: <Flame className="w-6 h-6" />,
  },
  {
    title_en: 'Switch Languages',
    title_ar: 'تبديل اللغة',
    desc_en: 'Use the globe icon in the navbar to switch between Arabic and English anytime.',
    desc_ar: 'استخدم أيقونة الكرة الأرضية في شريط التنقل للتبديل بين العربية والإنجليزية.',
    icon: <Globe className="w-6 h-6" />,
  },
];

const OnboardingTour = () => {
  const { i18n } = useTranslation();
  const isAr = i18n.language === 'ar';
  const [show, setShow] = useState(false);
  const [step, setStep] = useState(0);

  useEffect(() => {
    const seen = localStorage.getItem('hilal-onboarding-done');
    if (!seen) {
      // Delay to let page load
      const timer = setTimeout(() => setShow(true), 1500);
      return () => clearTimeout(timer);
    }
  }, []);

  const dismiss = () => {
    setShow(false);
    localStorage.setItem('hilal-onboarding-done', 'true');
  };

  const next = () => {
    if (step < STEPS.length - 1) {
      setStep(step + 1);
    } else {
      dismiss();
    }
  };

  const current = STEPS[step];

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm"
        >
          <motion.div
            key={step}
            initial={{ opacity: 0, y: 30, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
            className="bg-card border border-border rounded-2xl p-8 max-w-md w-full mx-4 text-center relative overflow-hidden"
          >
            {/* Progress bar */}
            <div className="absolute top-0 inset-x-0 h-1 bg-secondary">
              <motion.div
                className="h-full bg-primary"
                initial={{ width: 0 }}
                animate={{ width: `${((step + 1) / STEPS.length) * 100}%` }}
                transition={{ duration: 0.3 }}
              />
            </div>

            {/* Close button */}
            <button onClick={dismiss} className="absolute top-4 end-4 text-muted-foreground hover:text-foreground transition-colors">
              <X className="w-5 h-5" />
            </button>

            {/* Step dots */}
            <div className="flex items-center justify-center gap-2 mb-6 mt-2">
              {STEPS.map((_, i) => (
                <div key={i} className={`w-2 h-2 rounded-full transition-all ${i === step ? 'bg-primary w-6' : i < step ? 'bg-primary/50' : 'bg-muted'}`} />
              ))}
            </div>

            {/* Icon */}
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.1, type: 'spring', stiffness: 200 }}
              className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary/10 border border-primary/20 text-primary mb-5"
            >
              {current.icon}
            </motion.div>

            {/* Content */}
            <h2 className="text-xl font-display font-bold text-foreground mb-2">
              {isAr ? current.title_ar : current.title_en}
            </h2>
            <p className="text-sm text-muted-foreground leading-relaxed mb-6 max-w-sm mx-auto">
              {isAr ? current.desc_ar : current.desc_en}
            </p>

            {/* Actions */}
            <div className="flex items-center justify-center gap-3">
              <button onClick={dismiss} className="px-4 py-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
                {isAr ? 'تخطي' : 'Skip'}
              </button>
              <button
                onClick={next}
                className="inline-flex items-center gap-1.5 px-6 py-2.5 rounded-xl bg-primary text-primary-foreground font-semibold text-sm hover:opacity-90 transition-opacity"
              >
                {step === STEPS.length - 1
                  ? (isAr ? 'ابدأ المشاهدة!' : "Let's Go!")
                  : (isAr ? 'التالي' : 'Next')}
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default OnboardingTour;
