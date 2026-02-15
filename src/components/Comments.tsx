import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageSquare, Send, Trash2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAppStore } from '@/store/useAppStore';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { formatDistanceToNow } from 'date-fns';
import { ar, enUS } from 'date-fns/locale';
import { useLocale } from '@/hooks/useLocale';

interface Comment {
  id: string;
  content: string;
  created_at: string;
  user_id: string;
  profile?: { name: string; avatar_url: string | null };
}

const Comments = ({ episodeId }: { episodeId: string }) => {
  const { t, i18n } = useTranslation();
  const { isArabic } = useLocale();
  const { user } = useAppStore();
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [loading, setLoading] = useState(true);
  const [posting, setPosting] = useState(false);

  const fetchComments = async () => {
    const { data } = await supabase
      .from('comments')
      .select('id, content, created_at, user_id')
      .eq('episode_id', episodeId)
      .order('created_at', { ascending: false });

    if (data) {
      // Fetch profiles for comment authors
      const userIds = [...new Set(data.map(c => c.user_id))];
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, name, avatar_url')
        .in('id', userIds);

      const profileMap = new Map(profiles?.map(p => [p.id, p]) || []);
      setComments(data.map(c => ({
        ...c,
        profile: profileMap.get(c.user_id) || { name: 'User', avatar_url: null },
      })));
    }
    setLoading(false);
  };

  useEffect(() => {
    if (episodeId.length > 10) fetchComments();
    else setLoading(false);
  }, [episodeId]);

  const handlePost = async () => {
    if (!newComment.trim() || !user || posting) return;
    setPosting(true);
    const { error } = await supabase.from('comments').insert({
      episode_id: episodeId,
      user_id: user.id,
      content: newComment.trim(),
    });
    if (!error) {
      setNewComment('');
      await fetchComments();
    }
    setPosting(false);
  };

  const handleDelete = async (commentId: string) => {
    await supabase.from('comments').delete().eq('id', commentId);
    setComments(prev => prev.filter(c => c.id !== commentId));
  };

  const dateFnsLocale = isArabic ? ar : enUS;

  return (
    <div className="mt-8">
      <h3 className="text-lg font-display font-bold text-foreground mb-4 flex items-center gap-2">
        <MessageSquare className="w-5 h-5 text-primary" />
        {t('comments.title')} ({comments.length})
      </h3>

      {user ? (
        <div className="flex gap-3 mb-6">
          <Avatar className="h-9 w-9 shrink-0">
            <AvatarFallback className="bg-primary/20 text-primary text-sm">
              {user.email?.[0]?.toUpperCase() || 'U'}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 flex gap-2">
            <input
              value={newComment}
              onChange={e => setNewComment(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handlePost()}
              placeholder={t('comments.placeholder')}
              className="flex-1 bg-secondary text-foreground rounded-lg px-4 py-2 text-sm border border-border focus:outline-none focus:ring-1 focus:ring-primary placeholder:text-muted-foreground"
            />
            <button
              onClick={handlePost}
              disabled={!newComment.trim() || posting}
              className="px-3 py-2 rounded-lg bg-primary text-primary-foreground hover:opacity-90 transition-opacity disabled:opacity-50"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
        </div>
      ) : (
        <p className="text-sm text-muted-foreground mb-4">{t('comments.loginRequired')}</p>
      )}

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-16 bg-secondary/50 rounded-lg animate-pulse" />
          ))}
        </div>
      ) : comments.length === 0 ? (
        <p className="text-sm text-muted-foreground">{t('comments.empty')}</p>
      ) : (
        <AnimatePresence>
          <div className="space-y-3">
            {comments.map(comment => (
              <motion.div
                key={comment.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="flex gap-3 p-3 rounded-lg bg-card"
              >
                <Avatar className="h-8 w-8 shrink-0">
                  <AvatarFallback className="bg-secondary text-muted-foreground text-xs">
                    {comment.profile?.name?.[0]?.toUpperCase() || 'U'}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-sm font-medium text-foreground">{comment.profile?.name || 'User'}</span>
                    <span className="text-xs text-muted-foreground">
                      {formatDistanceToNow(new Date(comment.created_at), { addSuffix: true, locale: dateFnsLocale })}
                    </span>
                  </div>
                  <p className="text-sm text-secondary-foreground">{comment.content}</p>
                </div>
                {user && user.id === comment.user_id && (
                  <button onClick={() => handleDelete(comment.id)} className="text-muted-foreground hover:text-destructive transition-colors shrink-0 self-start">
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </motion.div>
            ))}
          </div>
        </AnimatePresence>
      )}
    </div>
  );
};

export default Comments;
