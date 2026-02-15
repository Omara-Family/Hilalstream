import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Sparkles } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAppStore } from '@/store/useAppStore';
import SectionRow from './SectionRow';
import type { Series } from '@/types';

interface RecommendationSection {
  reason: string;
  source_title_ar?: string;
  source_title_en?: string;
  source_slug?: string;
  series: any[];
}

const mapDbSeries = (s: any): Series => ({
  _id: s.id,
  title_ar: s.title_ar,
  title_en: s.title_en,
  slug: s.slug,
  description_ar: s.description_ar || '',
  description_en: s.description_en || '',
  posterImage: s.poster_image || '',
  backdropImage: s.backdrop_image || '',
  releaseYear: s.release_year,
  genre: s.genre || [],
  tags: s.tags || [],
  rating: Number(s.rating) || 0,
  totalViews: s.total_views || 0,
  isTrending: s.is_trending || false,
  createdAt: s.created_at,
});

const Recommendations = () => {
  const { i18n } = useTranslation();
  const isAr = i18n.language === 'ar';
  const { user } = useAppStore();
  const [sections, setSections] = useState<RecommendationSection[]>([]);

  useEffect(() => {
    if (!user) return;

    const fetchRecs = async () => {
      try {
        const { data, error } = await supabase.functions.invoke('recommendations');
        if (error) {
          console.error('Recommendations error:', error);
          return;
        }
        if (data?.sections) setSections(data.sections);
      } catch (e) {
        console.error('Recommendations fetch failed:', e);
      }
    };

    fetchRecs();
  }, [user]);

  if (!user || sections.length === 0) return null;

  return (
    <>
      {sections.map((section, idx) => {
        const mapped = section.series.map(mapDbSeries);
        if (mapped.length === 0) return null;

        let title: string;
        if (section.reason === 'because_you_watched') {
          const sourceTitle = isAr ? section.source_title_ar : section.source_title_en;
          title = isAr
            ? `✨ لأنك شاهدت "${sourceTitle}"`
            : `✨ Because you watched "${sourceTitle}"`;
        } else if (section.reason === 'recommended') {
          title = isAr ? '🎯 مُقترح لك' : '🎯 Recommended for You';
        } else {
          title = isAr ? '🔥 الأكثر شعبية' : '🔥 Most Popular';
        }

        return (
          <SectionRow
            key={`rec-${idx}`}
            title={title}
            series={mapped}
          />
        );
      })}
    </>
  );
};

export default Recommendations;
