// Database types and interfaces

export interface User {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'editor' | 'viewer';
  status: 'active' | 'inactive' | 'suspended';
  avatar?: string;
  phone?: string;
  lastLogin?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Book {
  id: string;
  title: string;
  author: string;
  description: string;
  category: 'spiritual' | 'educational' | 'philosophy' | 'meditation';
  language: 'hindi' | 'english' | 'both';
  status: 'published' | 'draft' | 'archived';
  coverImage: string;
  chapters: Chapter[];
  totalChapters: number;
  readCount: number;
  rating: number;
  featured: boolean;
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

export interface Chapter {
  id: string;
  bookId: string;
  title: string;
  content: string;
  chapterNumber: number;
  audioUrl?: string;
  duration?: number;
  status: 'published' | 'draft';
  textAlignment?: 'left' | 'center' | 'right' | 'justify';
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

export interface AudioContent {
  id: string;
  title: string;
  description: string;
  category: 'bhajan' | 'ai';
  seriesId?: string;
  audioUrl: string;
  textContent: string;
  duration: number;
  status: 'published' | 'draft' | 'archived';
  featured: boolean;
  playCount: number;
  language: 'hindi' | 'english';
  tags: string[];
  textAlignment?: 'left' | 'center' | 'right' | 'justify';
  createdAt: string;
  updatedAt: string;
}

export interface AudioSeries {
  id: string;
  title: string;
  description: string;
  category: 'bhajan' | 'ai';
  coverImage: string;
  totalAudios: number;
  status: 'active' | 'inactive';
  createdAt: string;
  updatedAt: string;
}

export interface Wallpaper {
  id: string;
  title: string;
  description: string;
  imageUrl: string;
  category: 'spiritual' | 'nature' | 'abstract' | 'quotes';
  tags: string[];
  resolution: string;
  downloadCount: number;
  featured: boolean;
  status: 'published' | 'draft' | 'archived';
  createdAt: string;
  updatedAt: string;
}

export interface CalendarEvent {
  id: string;
  title: string;
  description?: string;
  date: string; // Day as string: "15"
  month: string; // Month abbreviation: "DEC", "JAN", "FEB", etc.
  year: number; // Year as number: 2025
  type: string; // Event type - can be custom (e.g., "Fast", "Festival", "Anniversary", "Ceremony", etc.)
  // Legacy fields for backward compatibility
  time?: string;
  location?: string;
  attendees?: number;
  status?: 'scheduled' | 'ongoing' | 'completed' | 'cancelled';
  priority?: 'low' | 'medium' | 'high';
  category?: 'meeting' | 'event' | 'deadline' | 'reminder';
  createdBy?: string;
  createdAt: string;
  updatedAt: string;
}

export interface SlideContent {
  id: string;
  title: {
    hindi: string;
    english: string;
  };
  description: {
    hindi: string;
    english: string;
  };
  bookName: {
    hindi: string;
    english: string;
  };
  imageUrl: string;
  status: 'draft' | 'published' | 'archived';
  featured: boolean;
  category: 'spiritual' | 'educational' | 'promotional' | 'announcement';
  priority: number;
  viewCount: number;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

// Middle slides: image-only carousel for "middle" section
export interface MiddleSlide {
  id: string;
  title: {
    hindi: string;
    english: string;
  };
  description: {
    hindi: string;
    english: string;
  };
  imageUrl: {
    hindi: string;
    english: string;
  };
  status: 'draft' | 'published' | 'archived';
  featured: boolean;
  priority: number; // lower number shows first
  linkUrl?: string;
  createdAt: string;
  updatedAt: string;
}

export interface DashboardStats {
  totalUsers: number;
  totalBooks: number;
  totalAudios: number;
  totalWallpapers: number;
  totalEvents: number;
  totalSlides: number;
  activeUsers: number;
  monthlyGrowth: number;
}

// API Response types
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  success: boolean;
  data: T[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
}

// Filter and query types
export interface QueryFilters {
  page?: number;
  limit?: number;
  search?: string;
  status?: string;
  category?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface DateRange {
  start: string;
  end: string;
}

export interface YouTubeVideo {
  id: string;
  title: string;
  description?: string;
  videoUrl: string;
  videoId: string; // Extracted YouTube video ID
  thumbnailUrl: string; // YouTube thumbnail URL
  category?: 'spiritual' | 'educational' | 'music' | 'talks' | 'other';
  tags: string[];
  featured: boolean;
  status: 'published' | 'draft' | 'archived';
  viewCount: number;
  createdAt: string;
  updatedAt: string;
}