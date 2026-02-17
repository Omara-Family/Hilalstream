import { useState, useEffect, useRef } from 'react';
import { Bell } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { supabase } from '@/integrations/supabase/client';
import { useAppStore } from '@/store/useAppStore';
import { Link } from 'react-router-dom';

interface Notification {
  id: string;
  title_en: string;
  title_ar: string;
  message_en: string;
  message_ar: string;
  type: string;
  is_read: boolean;
  link: string | null;
  created_at: string;
}

const NotificationBell = () => {
  const { i18n } = useTranslation();
  const isAr = i18n.language === 'ar';
  const { user } = useAppStore();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const unreadCount = notifications.filter(n => !n.is_read).length;

  useEffect(() => {
    if (!user) return;

    const fetchNotifications = async () => {
      const { data } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(20);
      if (data) setNotifications(data as Notification[]);
    };

    fetchNotifications();

    // Realtime subscription
    const channel = supabase
      .channel('user-notifications')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'notifications',
        filter: `user_id=eq.${user.id}`,
      }, (payload) => {
        setNotifications(prev => [payload.new as Notification, ...prev]);
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [user]);

  // Close on click outside
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const markAllRead = async () => {
    if (!user || unreadCount === 0) return;
    await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('user_id', user.id)
      .eq('is_read', false);
    setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
  };

  const timeAgo = (date: string) => {
    const diff = Date.now() - new Date(date).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return isAr ? 'الآن' : 'now';
    if (mins < 60) return isAr ? `${mins} د` : `${mins}m`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return isAr ? `${hrs} س` : `${hrs}h`;
    const days = Math.floor(hrs / 24);
    return isAr ? `${days} ي` : `${days}d`;
  };

  if (!user) return null;

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => { setOpen(!open); if (!open) markAllRead(); }}
        className="p-2 rounded-lg text-muted-foreground hover:text-primary transition-colors relative"
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -end-0.5 w-4.5 h-4.5 bg-destructive text-destructive-foreground text-[10px] font-bold rounded-full flex items-center justify-center min-w-[18px] h-[18px]">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className="absolute end-0 top-full mt-2 w-80 max-h-96 overflow-y-auto rounded-xl bg-card border border-border shadow-2xl shadow-black/30 z-50"
          >
            <div className="p-3 border-b border-border flex items-center justify-between">
              <h3 className="text-sm font-semibold text-foreground">
                {isAr ? 'الإشعارات' : 'Notifications'}
              </h3>
              {unreadCount > 0 && (
                <button onClick={markAllRead} className="text-xs text-primary hover:underline">
                  {isAr ? 'قراءة الكل' : 'Mark all read'}
                </button>
              )}
            </div>

            {notifications.length === 0 ? (
              <div className="p-6 text-center text-muted-foreground text-sm">
                {isAr ? 'لا توجد إشعارات' : 'No notifications yet'}
              </div>
            ) : (
              <div className="divide-y divide-border/50">
                {notifications.map(n => (
                  <div
                    key={n.id}
                    className={`p-3 hover:bg-secondary/50 transition-colors ${!n.is_read ? 'bg-primary/5' : ''}`}
                  >
                    {n.link ? (
                      <Link to={n.link} onClick={() => setOpen(false)} className="block">
                        <p className="text-sm font-medium text-foreground">{isAr ? n.title_ar : n.title_en}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">{isAr ? n.message_ar : n.message_en}</p>
                      </Link>
                    ) : (
                      <>
                        <p className="text-sm font-medium text-foreground">{isAr ? n.title_ar : n.title_en}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">{isAr ? n.message_ar : n.message_en}</p>
                      </>
                    )}
                    <p className="text-[10px] text-muted-foreground/60 mt-1">{timeAgo(n.created_at)}</p>
                  </div>
                ))}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default NotificationBell;
