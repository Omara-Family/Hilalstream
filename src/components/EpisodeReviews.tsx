import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { Star, Send, Trash2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAppStore } from '@/store/useAppStore';
import { toast } from '@/hooks/use-toast';

interface Review {
  id: string;
  user_id: string;
  rating: number;
  review_text: string;
  created_at: string;
  user_name?: string;
}

interface EpisodeReviewsProps {
  episodeId: string;
  seriesId?: string;
  programId?: string;
}

const EpisodeReviews = ({ episodeId, seriesId, programId }: EpisodeReviewsProps) => {
  const { i18n } = useTranslation();
  const isAr = i18n.language === 'ar';
  const { user } = useAppStore();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [myRating, setMyRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [reviewText, setReviewText] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [myReview, setMyReview] = useState<Review | null>(null);

  useEffect(() => {
    const fetchReviews = async () => {
      const { data } = await supabase
        .from('reviews')
        .select('*')
        .eq('episode_id', episodeId)
        .order('created_at', { ascending: false });

      if (data) {
        // Fetch user names
        const userIds = [...new Set(data.map(r => r.user_id))];
        const { data: profiles } = await supabase
          .from('profiles')
          .select('id, name')
          .in('id', userIds);

        const nameMap = new Map(profiles?.map(p => [p.id, p.name]) || []);
        const enriched = data.map(r => ({ ...r, user_name: nameMap.get(r.user_id) || (isAr ? 'مستخدم' : 'User') }));
        setReviews(enriched);

        if (user) {
          const mine = enriched.find(r => r.user_id === user.id);
          if (mine) {
            setMyReview(mine);
            setMyRating(mine.rating);
            setReviewText(mine.review_text || '');
          }
        }
      }
    };
    fetchReviews();
  }, [episodeId, user?.id]);

  const handleSubmit = async () => {
    if (!user || myRating === 0) return;
    setSubmitting(true);

    const payload = {
      user_id: user.id,
      episode_id: episodeId,
      series_id: seriesId || null,
      program_id: programId || null,
      rating: myRating,
      review_text: reviewText.trim().slice(0, 500),
    };

    if (myReview) {
      const { error } = await supabase
        .from('reviews')
        .update({ rating: myRating, review_text: payload.review_text })
        .eq('id', myReview.id);
      if (error) {
        toast({ title: '❌', description: error.message, variant: 'destructive' });
      } else {
        toast({ title: '✅', description: isAr ? 'تم تحديث التقييم' : 'Review updated' });
        setReviews(prev => prev.map(r => r.id === myReview.id ? { ...r, rating: myRating, review_text: payload.review_text } : r));
        setMyReview({ ...myReview, rating: myRating, review_text: payload.review_text });
      }
    } else {
      const { data, error } = await supabase
        .from('reviews')
        .insert(payload)
        .select()
        .single();
      if (error) {
        toast({ title: '❌', description: error.message, variant: 'destructive' });
      } else if (data) {
        toast({ title: '✅', description: isAr ? 'تم إضافة التقييم' : 'Review added' });
        const { data: profile } = await supabase.from('profiles').select('name').eq('id', user.id).single();
        const newReview = { ...data, user_name: profile?.name || '' };
        setReviews(prev => [newReview, ...prev]);
        setMyReview(newReview);
      }
    }
    setSubmitting(false);
  };

  const handleDelete = async () => {
    if (!myReview) return;
    await supabase.from('reviews').delete().eq('id', myReview.id);
    setReviews(prev => prev.filter(r => r.id !== myReview.id));
    setMyReview(null);
    setMyRating(0);
    setReviewText('');
    toast({ title: '🗑️', description: isAr ? 'تم حذف التقييم' : 'Review deleted' });
  };

  const avgRating = reviews.length > 0 ? (reviews.reduce((s, r) => s + r.rating, 0) / reviews.length).toFixed(1) : '0.0';

  const StarButton = ({ value, interactive = false }: { value: number; interactive?: boolean }) => {
    const active = interactive ? (hoverRating || myRating) >= value : false;
    return (
      <button
        type="button"
        disabled={!interactive}
        onMouseEnter={() => interactive && setHoverRating(value)}
        onMouseLeave={() => interactive && setHoverRating(0)}
        onClick={() => interactive && setMyRating(value)}
        className={`transition-colors ${interactive ? 'cursor-pointer' : 'cursor-default'}`}
      >
        <Star className={`w-5 h-5 ${active ? 'text-primary fill-primary' : 'text-muted-foreground/30'}`} />
      </button>
    );
  };

  return (
    <section className="mt-8">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-1 h-7 rounded-full bg-primary" />
        <h3 className="text-lg font-display font-bold text-foreground">
          {isAr ? 'التقييمات والمراجعات' : 'Ratings & Reviews'}
        </h3>
        <div className="flex items-center gap-1 ms-auto">
          <Star className="w-4 h-4 text-primary fill-primary" />
          <span className="text-sm font-bold text-foreground">{avgRating}</span>
          <span className="text-xs text-muted-foreground">({reviews.length})</span>
        </div>
      </div>

      {/* Submit review */}
      {user ? (
        <div className="bg-card/50 rounded-xl border border-border/50 p-4 mb-4">
          <p className="text-sm font-medium text-foreground mb-2">
            {myReview ? (isAr ? 'تعديل تقييمك' : 'Edit your review') : (isAr ? 'أضف تقييمك' : 'Add your review')}
          </p>
          <div className="flex items-center gap-1 mb-3">
            {[1, 2, 3, 4, 5].map(v => <StarButton key={v} value={v} interactive />)}
            {myRating > 0 && <span className="text-sm text-primary font-bold ms-2">{myRating}/5</span>}
          </div>
          <textarea
            value={reviewText}
            onChange={e => setReviewText(e.target.value)}
            maxLength={500}
            rows={2}
            placeholder={isAr ? 'اكتب مراجعتك (اختياري)...' : 'Write your review (optional)...'}
            className="w-full bg-secondary/50 rounded-lg px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 resize-none border border-transparent focus:border-primary/30"
          />
          <div className="flex items-center gap-2 mt-2">
            <button
              onClick={handleSubmit}
              disabled={myRating === 0 || submitting}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium disabled:opacity-50 hover:opacity-90 transition-opacity"
            >
              <Send className="w-3.5 h-3.5" />
              {submitting ? '...' : myReview ? (isAr ? 'تحديث' : 'Update') : (isAr ? 'إرسال' : 'Submit')}
            </button>
            {myReview && (
              <button onClick={handleDelete} className="p-2 rounded-lg text-destructive hover:bg-destructive/10 transition-colors">
                <Trash2 className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      ) : (
        <p className="text-sm text-muted-foreground mb-4">
          {isAr ? 'سجّل دخولك لإضافة تقييم' : 'Login to add a review'}
        </p>
      )}

      {/* Reviews list */}
      <div className="space-y-3">
        {reviews.map((review, i) => (
          <motion.div
            key={review.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            className="bg-card/30 rounded-lg p-3 border border-border/30"
          >
            <div className="flex items-center justify-between mb-1">
              <span className="text-sm font-semibold text-foreground">{review.user_name}</span>
              <div className="flex items-center gap-0.5">
                {[1, 2, 3, 4, 5].map(v => (
                  <Star key={v} className={`w-3 h-3 ${v <= review.rating ? 'text-primary fill-primary' : 'text-muted-foreground/20'}`} />
                ))}
              </div>
            </div>
            {review.review_text && (
              <p className="text-sm text-muted-foreground">{review.review_text}</p>
            )}
            <p className="text-[10px] text-muted-foreground/50 mt-1">
              {new Date(review.created_at).toLocaleDateString(isAr ? 'ar' : 'en')}
            </p>
          </motion.div>
        ))}
        {reviews.length === 0 && (
          <p className="text-sm text-muted-foreground text-center py-4">
            {isAr ? 'لا توجد تقييمات بعد. كن أول من يقيّم!' : 'No reviews yet. Be the first!'}
          </p>
        )}
      </div>
    </section>
  );
};

export default EpisodeReviews;
