import { Flame, Award } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import { useState } from 'react';

interface StreakBadgeProps {
  currentStreak: number;
  longestStreak: number;
}

const StreakBadge = ({ currentStreak, longestStreak }: StreakBadgeProps) => {
  const { t } = useTranslation();
  const [showTooltip, setShowTooltip] = useState(false);
  const isRamadanStreak = currentStreak >= 7;

  if (currentStreak === 0) return null;

  return (
    <div className="relative">
      <button
        onMouseEnter={() => setShowTooltip(true)}
        onMouseLeave={() => setShowTooltip(false)}
        onClick={() => setShowTooltip(!showTooltip)}
        className="flex items-center gap-1 px-2 py-1.5 rounded-lg transition-colors hover:bg-secondary"
      >
        <motion.div
          animate={currentStreak >= 3 ? { scale: [1, 1.2, 1] } : {}}
          transition={{ repeat: Infinity, duration: 1.5 }}
        >
          <Flame className={`w-5 h-5 ${isRamadanStreak ? 'text-primary' : 'text-orange-500'}`} />
        </motion.div>
        <span className="text-sm font-bold text-foreground">{currentStreak}</span>
        {isRamadanStreak && (
          <Award className="w-4 h-4 text-primary" />
        )}
      </button>

      <AnimatePresence>
        {showTooltip && (
          <motion.div
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 4 }}
            className="absolute top-full mt-2 right-0 rtl:right-auto rtl:left-0 z-50 bg-card border border-border rounded-xl shadow-lg p-3 min-w-[200px]"
          >
            <div className="flex items-center gap-2 mb-2">
              <Flame className="w-5 h-5 text-orange-500" />
              <span className="font-semibold text-foreground">{t('streak.title')}</span>
            </div>
            <div className="space-y-1 text-sm text-muted-foreground">
              <div className="flex justify-between">
                <span>{t('streak.current')}</span>
                <span className="font-bold text-foreground">{currentStreak} {t('streak.days')}</span>
              </div>
              <div className="flex justify-between">
                <span>{t('streak.longest')}</span>
                <span className="font-bold text-foreground">{longestStreak} {t('streak.days')}</span>
              </div>
            </div>
            {isRamadanStreak && (
              <div className="mt-2 pt-2 border-t border-border flex items-center gap-1.5 text-xs text-primary font-medium">
                <Award className="w-3.5 h-3.5" />
                {t('streak.ramadanBadge')}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default StreakBadge;
