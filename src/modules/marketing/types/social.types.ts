/**
 * Social Media Types
 * Type definitions for social media management
 */

import { Timestamp } from 'firebase/firestore';
import { SocialPlatform, PostType } from './campaign.types';

// ============================================
// Social Media Post Types
// ============================================

export type PostStatus = 'draft' | 'scheduled' | 'published' | 'failed';
export type MediaType = 'image' | 'video' | 'carousel' | 'story' | 'reel';

export interface SocialMediaPost {
  id: string;
  companyId: string;

  // Post Details
  title: string;
  content: string;
  platforms: SocialPlatform[];

  // Media
  mediaUrls: string[];
  mediaType: MediaType;

  // Scheduling
  status: PostStatus;
  scheduledFor?: Timestamp;
  publishedAt?: Timestamp;

  // Engagement tracking per platform
  platformPosts: PlatformPost[];

  // Campaign linkage
  campaignId?: string;
  campaignName?: string;

  // Tags & Categories
  tags: string[];
  category?: string;

  // Metadata
  createdBy: string;
  createdByName: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

// ============================================
// Platform-Specific Post Data
// ============================================

export interface PlatformPost {
  platform: SocialPlatform;
  platformPostId?: string;
  status: PostStatus;
  publishedAt?: Timestamp;
  failureReason?: string;

  // Platform-specific metrics
  impressions?: number;
  reach?: number;
  likes?: number;
  comments?: number;
  shares?: number;
  clicks?: number;
  saves?: number;

  // Platform-specific data
  permalink?: string;
  thumbnailUrl?: string;
}

// ============================================
// Form & Filter Types
// ============================================

export interface SocialPostFormData {
  title: string;
  content: string;
  platforms: SocialPlatform[];
  mediaUrls: string[];
  mediaType: MediaType;
  scheduledFor?: Date;
  campaignId?: string;
  tags: string[];
  category?: string;
}

export interface SocialPostFilters {
  status?: PostStatus;
  platforms?: SocialPlatform[];
  campaignId?: string;
  search?: string;
  tags?: string[];
  dateFrom?: Date;
  dateTo?: Date;
}

// ============================================
// Calendar View Types
// ============================================

export type CalendarView = 'month' | 'week' | 'day';

export interface CalendarEvent {
  id: string;
  postId: string;
  title: string;
  date: Date;
  platforms: SocialPlatform[];
  status: PostStatus;
}
