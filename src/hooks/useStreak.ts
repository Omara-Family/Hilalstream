import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAppStore } from '@/store/useAppStore';

interface StreakData {
  currentStreak: number;
  longestStreak: number;
  lastWatchDate: string | null;
}

export const useStreak = () => {
  const { user, isAuthenticated } = useAppStore();
  const [streak, setStreak] = useState<StreakData>({ currentStreak: 0, longestStreak: 0, lastWatchDate: null });
  const [loading, setLoading] = useState(true);

  const fetchStreak = async () => {
    if (!user) { setLoading(false); return; }
    const { data } = await supabase
      .from('profiles')
      .select('current_streak, longest_streak, last_watch_date')
      .eq('id', user.id)
      .single();
    if (data) {
      setStreak({
        currentStreak: data.current_streak ?? 0,
        longestStreak: data.longest_streak ?? 0,
        lastWatchDate: data.last_watch_date,
      });
    }
    setLoading(false);
  };

  const recordWatch = async () => {
    if (!user) return;

    const today = new Date().toISOString().slice(0, 10);
    const { data: profile } = await supabase
      .from('profiles')
      .select('current_streak, longest_streak, last_watch_date')
      .eq('id', user.id)
      .single();

    if (!profile) return;

    const lastDate = profile.last_watch_date;
    if (lastDate === today) return; // already recorded today

    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().slice(0, 10);

    let newStreak = 1;
    if (lastDate === yesterdayStr) {
      newStreak = (profile.current_streak ?? 0) + 1;
    }

    const newLongest = Math.max(newStreak, profile.longest_streak ?? 0);

    await supabase
      .from('profiles')
      .update({
        current_streak: newStreak,
        longest_streak: newLongest,
        last_watch_date: today,
      })
      .eq('id', user.id);

    setStreak({ currentStreak: newStreak, longestStreak: newLongest, lastWatchDate: today });
  };

  useEffect(() => {
    fetchStreak();
  }, [isAuthenticated, user?.id]);

  return { ...streak, loading, recordWatch, refetch: fetchStreak };
};
