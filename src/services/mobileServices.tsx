import { bookService } from './bookService';
import { audioService } from './audioService';
import { aiAudioService } from './aiAudioService';
import { dashboardService } from './dashboardService';
import { calendarService } from './calendarService';
import { uploadService } from './uploadService';
import { db } from '../lib/firebase';
import { collection, doc, getDoc, getDocs, query, where } from 'firebase/firestore';
import { wallpaperService } from './wallpaperService';
import { slideService } from './slideService';
import { middleSlideService } from './middleSlideService';

// Read-only data fetchers for the Expo app (except updating user's display name)
// All methods return plain JS objects safe for mobile consumption

export const mobileServices = {
  // Aggregate home screen content
  async getHomeData() {
    const [slides, featuredWallpapers, featuredBooks, featuredAudios, upcomingEvents] = await Promise.all([
      slideService.getFeaturedSlides(20),
      wallpaperService.getFeaturedWallpapers(20),
      bookService.getFeaturedBooks(12),
      audioService.getFeaturedAudio(12),
      calendarService.getUpcomingEvents(20),
    ]);

    return {
      slides: slides.success ? slides.data : [],
      wallpapers: featuredWallpapers.success ? featuredWallpapers.data : [],
      books: featuredBooks.success ? featuredBooks.data : [],
      audios: featuredAudios.success ? featuredAudios.data : [],
      events: upcomingEvents.success ? upcomingEvents.data : [],
    };
  },

  // Books (read-only, published only)
  async getBooks(limit: number = 100) {
    const res = await bookService.getBooks({ status: 'published', limit, sortBy: 'createdAt', sortOrder: 'desc' } as any);
    return res.success ? res.data : [];
  },

  // Audios (read-only, published only)
  async getAudios(limit: number = 100) {
    const res = await audioService.getAudioContent({ status: 'published', limit, sortBy: 'createdAt', sortOrder: 'desc' } as any);
    return res.success ? res.data : [];
  },

  // Wallpapers (read-only, published only)
  async getWallpapers(limit: number = 100) {
    const res = await wallpaperService.getWallpapers({ status: 'published', limit, sortBy: 'createdAt', sortOrder: 'desc' } as any);
    return res.success ? res.data : [];
  },

  // Slides (read-only, published only)
  async getSlides(limit: number = 100) {
    const res = await slideService.getSlides({ status: 'published', limit, sortBy: 'priority', sortOrder: 'asc' } as any);
    return res.success ? res.data : [];
  },

  // Middle slides (images-only, published only)
  async getMiddleSlides(limit: number = 100) {
    const res = await middleSlideService.getMiddleSlides({ status: 'published', limit, sortBy: 'priority', sortOrder: 'asc' } as any);
    return res.success ? res.data : [];
  },

  // Calendar upcoming
  async getUpcomingEvents(limit: number = 50) {
    const res = await calendarService.getUpcomingEvents(limit);
    return res.success ? res.data : [];
  },

  // AI Audio: categories -> chapters -> items (read-only, published only)
  async getAIAudioTree() {
    const res = await aiAudioService.getAllCategoriesWithContent();
    const cats = (res.success && res.data ? res.data : []) as any[];
    // Filter to Published only and normalize
    return cats
      .filter((c) => (c.status || 'Draft') === 'Published')
      .map((c) => ({
        id: c.id,
        name: c.name,
        description: c.description || '',
        status: c.status,
        imageUrl: c.imageUrl || '',
        chapters: (c.chapters || [])
          .map((ch: any) => ({
            id: ch.id,
            categoryId: ch.categoryId,
            title: ch.title,
            description: ch.description || '',
            order: ch.order || 0,
            audioItems: (ch.audioItems || [])
              .filter((it: any) => (it.status || 'Draft') === 'Published')
              .map((it: any) => ({
                id: it.id,
                title: it.title,
                text: it.text || '',
                audioUrl: it.audioUrl || '',
                duration: it.duration || '',
                status: it.status,
                order: it.order || 0,
              })),
          })),
      }));
  },

  // AI Audio: single category with chapters/items (read-only, published only)
  async getAIAudioCategory(categoryId: string) {
    const res = await aiAudioService.getCategoryWithContent(categoryId);
    if (!res.success || !res.data) return null;
    const c: any = res.data;
    if ((c.status || 'Draft') !== 'Published') return null;
    return {
      id: c.id,
      name: c.name,
      description: c.description || '',
      status: c.status,
      imageUrl: c.imageUrl || '',
      chapters: (c.chapters || []).map((ch: any) => ({
        id: ch.id,
        categoryId: ch.categoryId,
        title: ch.title,
        description: ch.description || '',
        order: ch.order || 0,
        audioItems: (ch.audioItems || [])
          .filter((it: any) => (it.status || 'Draft') === 'Published')
          .map((it: any) => ({
            id: it.id,
            title: it.title,
            text: it.text || '',
            audioUrl: it.audioUrl || '',
            duration: it.duration || '',
            status: it.status,
            order: it.order || 0,
          })),
      })),
    };
  },

  // AI Audio: single chapter with items (read-only, published only)
  async getAIAudioChapter(chapterId: string) {
    const chRes = await aiAudioService.getChapterById(chapterId);
    if (!chRes.success || !chRes.data) return null;
    const itemsRes = await aiAudioService.getAudioItemsByChapter(chapterId);
    const ch: any = chRes.data;
    const items = (itemsRes.success && itemsRes.data ? itemsRes.data : []) as any[];
    return {
      id: ch.id,
      categoryId: ch.categoryId,
      title: ch.title,
      description: ch.description || '',
      order: ch.order || 0,
      audioItems: items
        .filter((it: any) => (it.status || 'Draft') === 'Published')
        .map((it: any) => ({
          id: it.id,
          title: it.title,
          text: it.text || '',
          audioUrl: it.audioUrl || '',
          duration: it.duration || '',
          status: it.status,
          order: it.order || 0,
        })),
    };
  },

  // Single item getters (read-only)
  async getBook(id: string) {
    const res = await bookService.getBook(id);
    return res.success ? res.data : null;
  },
  async getAudio(id: string) {
    const res = await audioService.getAudio(id);
    return res.success ? res.data : null;
  },
  async getWallpaper(id: string) {
    const res = await wallpaperService.getWallpaper(id);
    return res.success ? res.data : null;
  },
  async getSlide(id: string) {
    const res = await slideService.getSlide(id);
    return res.success ? res.data : null;
  },

  // User profile (read-only)
  async getUserProfile(userId: string) {
    const ref = doc(db, 'users', userId);
    const snap = await getDoc(ref);
    if (!snap.exists()) return null;
    const data = snap.data() || {};
    return { id: snap.id, name: data.name || '', email: data.email || '', avatar: data.avatar || '' };
  },

  // Only allowed mutation from mobile: update display name
  async updateUserName(userId: string, name: string) {
    // Keep dependency-free here to avoid re-exporting full admin services
    const ref = doc(db, 'users', userId);
    const snap = await getDoc(ref);
    if (!snap.exists()) return { success: false, error: 'User not found' } as const;
    // Use modular update to avoid importing updateDoc directly here; small inline import
    const { updateDoc } = await import('firebase/firestore');
    await updateDoc(ref, { name, updatedAt: new Date().toISOString() });
    return { success: true } as const;
  },
};
