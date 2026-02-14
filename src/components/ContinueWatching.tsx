import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Play } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAppStore } from '@/store/useAppStore';
import { useLocale } from '@/hooks/useLocale';

interface ContinueItem {
  episodeId: string;
  episodeNumber: number;
  seriesTitle_ar: string;
  seriesTitle_en: string;
  seriesSlug: string;
  posterImage: string;
  updatedAt: string;
}

const ContinueWatching = () => {
  const { t } = useTranslation();
  const { user } = useAppStore();
  const { getTitle } = useLocale();
  const [items, setItems] = useState<ContinueItem[]>([]);

  useEffect(() => {
    if (!user) return;

    const fetchContinue = async () => {
      const { data } = await supabase
        .from('continue_watching')
        .select('episode_id, updated_at')
        .eq('user_id', user.id)
        .order('updated_at', { ascending: false })
        .limit(10);

      if (!data || data.length === 0) return;

      // Get episode details
      const episodeIds = data.map(d => d.episode_id);
      const { data: episodes } = await supabase
        .from('episodes')
        .select('id, episode_number, series_id')
        .in('id', episodeIds);

      if (!episodes) return;

      const seriesIds = [...new Set(episodes.map(e => e.series_id))];
      const { data: seriesList } = await supabase
        .from('series')
        .select('id, title_ar, title_en, slug, poster_image')
        .in('id', seriesIds);

      if (!seriesList) return;

      const seriesMap = Object.fromEntries(seriesList.map(s => [s.id, s]));
      const episodeMap = Object.fromEntries(episodes.map(e => [e.id, e]));

      const mapped: ContinueItem[] = data
        .filter(d => episodeMap[d.episode_id] && seriesMap[episodeMap[d.episode_id].series_id])
        .map(d => {
          const ep = episodeMap[d.episode_id];
          const s = seriesMap[ep.series_id];
          return {
            episodeId: d.episode_id,
            episodeNumber: ep.episode_number,
            seriesTitle_ar: s.title_ar,
            seriesTitle_en: s.title_en,
            seriesSlug: s.slug,
            posterImage: s.poster_image || '',
            updatedAt: d.updated_at || '',
          };
        });

      setItems(mapped);
    };

    fetchContinue();
  }, [user]);

  if (!user || items.length === 0) return null;

  return (
    <section className="py-8">
      <div className="container mx-auto px-4">
        <h2 className="text-xl md:text-2xl font-display font-bold text-foreground mb-5">
          {t('home.continueWatching', 'متابعة المشاهدة')}
        </h2>
        <div className="flex gap-4 overflow-x-auto scrollbar-hide pb-2">
          {items.map(item => (
            <Link
              key={item.episodeId}
              to={`/watch/${item.seriesSlug}/${item.episodeNumber}`}
              className="flex-shrink-0 w-[160px] md:w-[200px] group"
            >
              <div className="relative aspect-[2/3] rounded-lg overflow-hidden bg-muted mb-2">
                {item.posterImage && (
                  <img src={item.posterImage} alt={getTitle(item as any)} className="w-full h-full object-cover" />
                )}
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <Play className="w-10 h-10 text-white" />
                </div>
              </div>
              <p className="text-sm font-semibold text-foreground truncate">
                {getTitle({ title_ar: item.seriesTitle_ar, title_en: item.seriesTitle_en } as any)}
              </p>
              <p className="text-xs text-muted-foreground">
                {t('series.episode')} {item.episodeNumber}
              </p>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
};

export default ContinueWatching;
