export interface Series {
  _id: string;
  title_ar: string;
  title_en: string;
  slug: string;
  description_ar: string;
  description_en: string;
  posterImage: string;
  backdropImage: string;
  releaseYear: number;
  genre: string[];
  tags: string[];
  rating: number;
  totalViews: number;
  isTrending: boolean;
  createdAt: string;
}

export interface Episode {
  _id: string;
  seriesId: string;
  episodeNumber: number;
  title_ar: string;
  title_en: string;
  videoServers: { name: string; url: string }[];
  downloadUrl?: string;
  downloadLinks?: { quality: string; url: string }[];
  views: number;
  createdAt: string;
}

export interface User {
  _id: string;
  name: string;
  email: string;
  role: 'admin' | 'editor' | 'user';
  favorites: string[];
}
