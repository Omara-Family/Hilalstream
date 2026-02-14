import { useTranslation } from 'react-i18next';

export const useLocale = () => {
  const { i18n } = useTranslation();
  const isArabic = i18n.language === 'ar';

  const getTitle = (item: { title_ar: string; title_en: string }) =>
    isArabic ? item.title_ar : item.title_en;

  const getDescription = (item: { description_ar: string; description_en: string }) =>
    isArabic ? item.description_ar : item.description_en;

  const getGenreLabel = (genre: { label_ar: string; label_en: string }) =>
    isArabic ? genre.label_ar : genre.label_en;

  const formatViews = (views: number) => {
    if (views >= 1000000) return `${(views / 1000000).toFixed(1)}M`;
    if (views >= 1000) return `${(views / 1000).toFixed(0)}K`;
    return views.toString();
  };

  return { isArabic, getTitle, getDescription, getGenreLabel, formatViews };
};
