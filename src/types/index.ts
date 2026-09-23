export type UserRole = 'user' | 'admin';
export type SubscriptionStatus = 'active' | 'inactive' | 'expired' | 'pending';
export type PlanId = 'basic' | 'standard' | 'premium';
export type BillingCycle = 'monthly' | 'yearly';

export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  photoURL?: string;
  role: UserRole;
  subscriptionStatus: SubscriptionStatus;
  planId?: PlanId;
  billingCycle?: BillingCycle;
  subscriptionExpiresAt?: string;
  createdAt: string;
}

export interface Plan {
  id: PlanId;
  nameAr: string;
  taglineAr: string;
  monthlyPrice: number;
  yearlyPrice: number;
  quality: string;
  screens: number;
  featuresAr: string[];
  highlighted?: boolean;
}

export type MediaType = 'live' | 'movie' | 'episode';

export interface Category {
  id: string;
  nameAr: string;
  slug: string;
}

export interface StreamSource {
  providerId: string;
  url: string;
  label?: string;
  mimeType?: string;
  drmKey?: string;
  quality?: '1080p' | '720p' | '480p' | 'auto';
  headers?: Record<string, string>;
}

export interface LiveChannel {
  id: string;
  titleAr: string;
  descriptionAr: string;
  logoUrl: string;
  categoryId: string;
  streamSources: StreamSource[];
  isFeatured: boolean;
  createdAt: string;
}

export interface Movie {
  id: string;
  titleAr: string;
  descriptionAr: string;
  posterUrl: string;
  bannerUrl: string;
  categoryId: string;
  releaseYear: number;
  durationMinutes: number;
  rating: number;
  streamSources: StreamSource[];
  isFeatured: boolean;
  createdAt: string;
}

export interface Episode {
  id: string;
  seriesId: string;
  seasonNumber: number;
  episodeNumber: number;
  titleAr: string;
  descriptionAr: string;
  thumbnailUrl: string;
  durationMinutes: number;
  streamSources: StreamSource[];
  createdAt: string;
}

export interface Series {
  id: string;
  titleAr: string;
  descriptionAr: string;
  posterUrl: string;
  bannerUrl: string;
  categoryId: string;
  releaseYear: number;
  totalSeasons: number;
  rating: number;
  isFeatured: boolean;
  createdAt: string;
}

export interface WatchHistory {
  id: string;
  mediaId: string;
  mediaType: MediaType;
  titleAr: string;
  posterUrl: string;
  watchedDurationSeconds: number;
  totalDurationSeconds: number;
  lastWatchedAt: string;
}

export interface FavoriteItem {
  id: string;
  mediaId: string;
  mediaType: MediaType;
  titleAr: string;
  posterUrl: string;
  addedAt: string;
}
