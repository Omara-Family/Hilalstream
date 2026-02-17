import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import { Award, Flame, Eye, Star, Heart, MessageSquare, Trophy, X } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAppStore } from '@/store/useAppStore';
import { useStreak } from '@/hooks/useStreak';

export interface Badge {
  id: string;
  icon: React.ReactNode;
  title_en: string;
  title_ar: string;
  desc_en: string;
  desc_ar: string;
  color: string;
  condition: (stats: UserStats) => boolean;
}

interface UserStats {
  currentStreak: number;
  longestStreak: number;
  totalWatched: number;
  totalFavorites: number;
  totalComments: number;
  totalReviews: number;
}

const BADGES: Badge[] = [
  {
    id: 'first_watch', icon: <Eye className="w-5 h-5" />,
    title_en: 'First Watch', title_ar: 'أول مشاهدة',
    desc_en: 'Watch your first episode', desc_ar: 'شاهد أول حلقة',
    color: 'text-blue-400', condition: (s) => s.totalWatched >= 1,
  },
  {
    id: 'binge_watcher', icon: <Eye className="w-5 h-5" />,
    title_en: 'Binge Watcher', title_ar: 'مشاهد نهم',
    desc_en: 'Watch 10 episodes', desc_ar: 'شاهد 10 حلقات',
    color: 'text-purple-400', condition: (s) => s.totalWatched >= 10,
  },
  {
    id: 'streak_3', icon: <Flame className="w-5 h-5" />,
    title_en: '3-Day Streak', title_ar: 'سلسلة 3 أيام',
    desc_en: 'Maintain a 3-day watching streak', desc_ar: 'حافظ على سلسلة مشاهدة 3 أيام',
    color: 'text-orange-400', condition: (s) => s.longestStreak >= 3,
  },
  {
    id: 'streak_7', icon: <Flame className="w-5 h-5" />,
    title_en: 'Weekly Warrior', title_ar: 'محارب الأسبوع',
    desc_en: 'Maintain a 7-day streak', desc_ar: 'حافظ على سلسلة 7 أيام',
    color: 'text-primary', condition: (s) => s.longestStreak >= 7,
  },
  {
    id: 'streak_30', icon: <Trophy className="w-5 h-5" />,
    title_en: 'Monthly Master', title_ar: 'سيد الشهر',
    desc_en: '30-day watching streak', desc_ar: 'سلسلة مشاهدة 30 يوم',
    color: 'text-yellow-400', condition: (s) => s.longestStreak >= 30,
  },
  {
    id: 'collector', icon: <Heart className="w-5 h-5" />,
    title_en: 'Collector', title_ar: 'جامع',
    desc_en: 'Add 5 series to favorites', desc_ar: 'أضف 5 مسلسلات للمفضلة',
    color: 'text-pink-400', condition: (s) => s.totalFavorites >= 5,
  },
  {
    id: 'critic', icon: <Star className="w-5 h-5" />,
    title_en: 'Critic', title_ar: 'ناقد',
    desc_en: 'Write 3 reviews', desc_ar: 'اكتب 3 مراجعات',
    color: 'text-primary', condition: (s) => s.totalReviews >= 3,
  },
  {
    id: 'social', icon: <MessageSquare className="w-5 h-5" />,
    title_en: 'Social Butterfly', title_ar: 'فراشة اجتماعية',
    desc_en: 'Post 5 comments', desc_ar: 'انشر 5 تعليقات',
    color: 'text-green-400', condition: (s) => s.totalComments >= 5,
  },
];

export const useBadges = () => {
  const { user } = useAppStore();
  const { currentStreak, longestStreak } = useStreak();
  const [earnedBadges, setEarnedBadges] = useState<string[]>([]);
  const [stats, setStats] = useState<UserStats>({
    currentStreak: 0, longestStreak: 0,
    totalWatched: 0, totalFavorites: 0, totalComments: 0, totalReviews: 0,
  });

  useEffect(() => {
    if (!user) return;

    const fetchStats = async () => {
      const [watchedRes, favsRes, commentsRes, reviewsRes, badgesRes] = await Promise.all([
        supabase.from('continue_watching').select('id', { count: 'exact', head: true }).eq('user_id', user.id),
        supabase.from('favorites').select('id', { count: 'exact', head: true }).eq('user_id', user.id),
        supabase.from('comments').select('id', { count: 'exact', head: true }).eq('user_id', user.id),
        supabase.from('reviews').select('id', { count: 'exact', head: true }).eq('user_id', user.id),
        supabase.from('user_badges').select('badge_id').eq('user_id', user.id),
      ]);

      const newStats: UserStats = {
        currentStreak,
        longestStreak,
        totalWatched: watchedRes.count || 0,
        totalFavorites: favsRes.count || 0,
        totalComments: commentsRes.count || 0,
        totalReviews: reviewsRes.count || 0,
      };
      setStats(newStats);
      setEarnedBadges(badgesRes.data?.map(b => b.badge_id) || []);

      // Check for new badges to award
      for (const badge of BADGES) {
        if (badge.condition(newStats) && !badgesRes.data?.some(b => b.badge_id === badge.id)) {
          await supabase.from('user_badges').insert({ user_id: user.id, badge_id: badge.id });
          setEarnedBadges(prev => [...prev, badge.id]);
        }
      }
    };

    fetchStats();
  }, [user?.id, currentStreak, longestStreak]);

  return { badges: BADGES, earnedBadges, stats };
};

interface BadgesDisplayProps {
  showAll?: boolean;
}

const BadgesDisplay = ({ showAll = false }: BadgesDisplayProps) => {
  const { i18n } = useTranslation();
  const isAr = i18n.language === 'ar';
  const { badges, earnedBadges, stats } = useBadges();
  const [selectedBadge, setSelectedBadge] = useState<Badge | null>(null);

  const displayed = showAll ? badges : badges.filter(b => earnedBadges.includes(b.id));

  if (!showAll && displayed.length === 0) return null;

  return (
    <div>
      <div className="flex items-center gap-3 mb-4">
        <div className="w-1 h-7 rounded-full bg-primary" />
        <h3 className="text-lg font-display font-bold text-foreground">
          {isAr ? 'الشارات والإنجازات' : 'Badges & Achievements'}
        </h3>
        <span className="text-xs text-muted-foreground ms-auto">
          {earnedBadges.length}/{badges.length}
        </span>
      </div>

      <div className="grid grid-cols-4 sm:grid-cols-8 gap-3">
        {displayed.map((badge, i) => {
          const earned = earnedBadges.includes(badge.id);
          return (
            <motion.button
              key={badge.id}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.05 }}
              onClick={() => setSelectedBadge(badge)}
              className={`flex flex-col items-center gap-1 p-3 rounded-xl border transition-all ${
                earned
                  ? 'bg-card border-primary/30 hover:border-primary/60 shadow-sm'
                  : 'bg-card/30 border-border/30 opacity-40 grayscale hover:opacity-60'
              }`}
            >
              <div className={earned ? badge.color : 'text-muted-foreground'}>{badge.icon}</div>
              <span className="text-[10px] font-medium text-foreground text-center leading-tight">
                {isAr ? badge.title_ar : badge.title_en}
              </span>
            </motion.button>
          );
        })}
      </div>

      {/* Badge detail modal */}
      <AnimatePresence>
        {selectedBadge && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
            onClick={() => setSelectedBadge(null)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={e => e.stopPropagation()}
              className="bg-card border border-border rounded-2xl p-6 max-w-xs w-full mx-4 text-center"
            >
              <button onClick={() => setSelectedBadge(null)} className="absolute top-3 end-3 text-muted-foreground hover:text-foreground">
                <X className="w-4 h-4" />
              </button>
              <div className={`inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary/10 border border-primary/20 mb-4 ${earnedBadges.includes(selectedBadge.id) ? selectedBadge.color : 'text-muted-foreground grayscale'}`}>
                {selectedBadge.icon}
              </div>
              <h4 className="text-lg font-bold text-foreground mb-1">
                {isAr ? selectedBadge.title_ar : selectedBadge.title_en}
              </h4>
              <p className="text-sm text-muted-foreground mb-3">
                {isAr ? selectedBadge.desc_ar : selectedBadge.desc_en}
              </p>
              {earnedBadges.includes(selectedBadge.id) ? (
                <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-semibold">
                  <Award className="w-3 h-3" /> {isAr ? 'مكتسبة!' : 'Earned!'}
                </span>
              ) : (
                <span className="text-xs text-muted-foreground">{isAr ? 'لم تكتسب بعد' : 'Not yet earned'}</span>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default BadgesDisplay;
