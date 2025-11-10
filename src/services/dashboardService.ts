import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { DashboardStats, ApiResponse } from '../types';

class DashboardService {
  // Get comprehensive dashboard statistics
  async getDashboardStats(): Promise<ApiResponse<DashboardStats>> {
    try {
      const [
        usersSnapshot,
        booksSnapshot,
        audiosSnapshot,
        wallpapersSnapshot,
        eventsSnapshot,
        slidesSnapshot
      ] = await Promise.all([
        getDocs(collection(db, 'users')),
        getDocs(collection(db, 'books')),
        getDocs(collection(db, 'audio_contents')),
        getDocs(collection(db, 'wallpapers')),
        getDocs(collection(db, 'calendar_events')),
        getDocs(collection(db, 'slide_contents'))
      ]);

      // Get active users
      const activeUsersSnapshot = await getDocs(
        query(collection(db, 'users'), where('status', '==', 'active'))
      );

      // Calculate monthly growth (simplified - comparing this month vs last month)
      const now = new Date();
      const thisMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
      const lastMonth = `${now.getFullYear()}-${String(now.getMonth()).padStart(2, '0')}`;

      const thisMonthUsers = usersSnapshot.docs.filter(doc => 
        doc.data().createdAt?.startsWith(thisMonth)
      ).length;

      const lastMonthUsers = usersSnapshot.docs.filter(doc => 
        doc.data().createdAt?.startsWith(lastMonth)
      ).length;

      const monthlyGrowth = lastMonthUsers > 0 
        ? ((thisMonthUsers - lastMonthUsers) / lastMonthUsers) * 100 
        : 0;

      const stats: DashboardStats = {
        totalUsers: usersSnapshot.size,
        totalBooks: booksSnapshot.size,
        totalAudios: audiosSnapshot.size,
        totalWallpapers: wallpapersSnapshot.size,
        totalEvents: eventsSnapshot.size,
        totalSlides: slidesSnapshot.size,
        activeUsers: activeUsersSnapshot.size,
        monthlyGrowth: Math.round(monthlyGrowth * 100) / 100
      };

      return {
        success: true,
        data: stats
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Failed to get dashboard statistics'
      };
    }
  }

  // Get recent activity
  async getRecentActivity(limit: number = 10): Promise<ApiResponse<{
    type: 'user' | 'book' | 'audio' | 'wallpaper' | 'event' | 'slide';
    action: 'created' | 'updated' | 'deleted';
    title: string;
    timestamp: string;
    userId: string;
  }[]>> {
    try {
      // This is a simplified version. In a real app, you'd have a dedicated
      // activity log collection or use Cloud Functions to track activities
      const activities: any[] = [];

      // Get recent users
      const recentUsers = await getDocs(
        query(collection(db, 'users'))
      );

      recentUsers.docs.slice(0, 5).forEach(doc => {
        const data = doc.data();
        activities.push({
          type: 'user',
          action: 'created',
          title: `New user: ${data.name}`,
          timestamp: data.createdAt,
          userId: doc.id
        });
      });

      // Get recent events
      const recentEvents = await getDocs(
        query(collection(db, 'calendar_events'))
      );

      recentEvents.docs.slice(0, 5).forEach(doc => {
        const data = doc.data();
        activities.push({
          type: 'event',
          action: 'created',
          title: `New event: ${data.title}`,
          timestamp: data.createdAt,
          userId: data.createdBy || 'system'
        });
      });

      // Sort by timestamp and limit
      activities.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
      
      return {
        success: true,
        data: activities.slice(0, limit)
      };
    } catch (error: any) {
      return {
        success: false,
        data: [],
        error: error.message || 'Failed to get recent activity'
      };
    }
  }

  // Get content statistics by category
  async getContentStats(): Promise<ApiResponse<{
    books: { [key: string]: number };
    audios: { [key: string]: number };
    wallpapers: { [key: string]: number };
    slides: { [key: string]: number };
  }>> {
    try {
      const [booksSnapshot, audiosSnapshot, wallpapersSnapshot, slidesSnapshot] = await Promise.all([
        getDocs(collection(db, 'books')),
        getDocs(collection(db, 'audio_contents')),
        getDocs(collection(db, 'wallpapers')),
        getDocs(collection(db, 'slide_contents'))
      ]);

      // Count by categories
      const bookStats: { [key: string]: number } = {};
      booksSnapshot.docs.forEach(doc => {
        const category = doc.data().category || 'other';
        bookStats[category] = (bookStats[category] || 0) + 1;
      });

      const audioStats: { [key: string]: number } = {};
      audiosSnapshot.docs.forEach(doc => {
        const category = doc.data().category || 'other';
        audioStats[category] = (audioStats[category] || 0) + 1;
      });

      const wallpaperStats: { [key: string]: number } = {};
      wallpapersSnapshot.docs.forEach(doc => {
        const category = doc.data().category || 'other';
        wallpaperStats[category] = (wallpaperStats[category] || 0) + 1;
      });

      const slideStats: { [key: string]: number } = {};
      slidesSnapshot.docs.forEach(doc => {
        const category = doc.data().category || 'other';
        slideStats[category] = (slideStats[category] || 0) + 1;
      });

      return {
        success: true,
        data: {
          books: bookStats,
          audios: audioStats,
          wallpapers: wallpaperStats,
          slides: slideStats
        }
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Failed to get content statistics'
      };
    }
  }

  // Get monthly analytics data
  async getMonthlyAnalytics(): Promise<ApiResponse<{
    labels: string[];
    users: number[];
    content: number[];
    events: number[];
  }>> {
    try {
      const now = new Date();
      const months = [];
      const userData = [];
      const contentData = [];
      const eventData = [];

      // Get last 6 months of data
      for (let i = 5; i >= 0; i--) {
        const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        months.push(date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }));

        // Count users created in this month
        const usersSnapshot = await getDocs(
          query(collection(db, 'users'))
        );
        const monthUsers = usersSnapshot.docs.filter(doc => 
          doc.data().createdAt?.startsWith(monthKey)
        ).length;
        userData.push(monthUsers);

        // Count content created in this month (books + audios + wallpapers + slides)
        const [booksSnapshot, audiosSnapshot, wallpapersSnapshot, slidesSnapshot] = await Promise.all([
          getDocs(collection(db, 'books')),
          getDocs(collection(db, 'audio_contents')),
          getDocs(collection(db, 'wallpapers')),
          getDocs(collection(db, 'slide_contents'))
        ]);

        const monthContent = 
          booksSnapshot.docs.filter(doc => doc.data().createdAt?.startsWith(monthKey)).length +
          audiosSnapshot.docs.filter(doc => doc.data().createdAt?.startsWith(monthKey)).length +
          wallpapersSnapshot.docs.filter(doc => doc.data().createdAt?.startsWith(monthKey)).length +
          slidesSnapshot.docs.filter(doc => doc.data().createdAt?.startsWith(monthKey)).length;
        contentData.push(monthContent);

        // Count events created in this month
        const eventsSnapshot = await getDocs(
          query(collection(db, 'calendar_events'))
        );
        const monthEvents = eventsSnapshot.docs.filter(doc => 
          doc.data().createdAt?.startsWith(monthKey)
        ).length;
        eventData.push(monthEvents);
      }

      return {
        success: true,
        data: {
          labels: months,
          users: userData,
          content: contentData,
          events: eventData
        }
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Failed to get monthly analytics'
      };
    }
  }

  // Get system health status
  async getSystemHealth(): Promise<ApiResponse<{
    status: 'healthy' | 'warning' | 'error';
    uptime: number;
    lastBackup: string;
    storage: {
      used: number;
      total: number;
      percentage: number;
    };
    performance: {
      responseTime: number;
      errorRate: number;
    };
  }>> {
    try {
      // This is a mock implementation. In a real app, you'd have actual monitoring
      const health = {
        status: 'healthy' as const,
        uptime: 99.9,
        lastBackup: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(), // 24 hours ago
        storage: {
          used: 2.4, // GB
          total: 10, // GB
          percentage: 24
        },
        performance: {
          responseTime: 120, // ms
          errorRate: 0.01 // 0.01%
        }
      };

      return {
        success: true,
        data: health
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Failed to get system health'
      };
    }
  }

  // Get top content by views/downloads
  async getTopContent(): Promise<ApiResponse<{
    books: Array<{ id: string; title: string; readCount: number }>;
    audios: Array<{ id: string; title: string; playCount: number }>;
    wallpapers: Array<{ id: string; title: string; downloadCount: number }>;
    slides: Array<{ id: string; title: string; viewCount: number }>;
  }>> {
    try {
      const [booksSnapshot, audiosSnapshot, wallpapersSnapshot, slidesSnapshot] = await Promise.all([
        getDocs(collection(db, 'books')),
        getDocs(collection(db, 'audio_contents')),
        getDocs(collection(db, 'wallpapers')),
        getDocs(collection(db, 'slide_contents'))
      ]);

      // Get top books by read count
      const topBooks = booksSnapshot.docs
        .map(doc => ({ id: doc.id, ...doc.data() }))
        .sort((a: any, b: any) => (b.readCount || 0) - (a.readCount || 0))
        .slice(0, 5)
        .map((book: any) => ({
          id: book.id,
          title: book.title,
          readCount: book.readCount || 0
        }));

      // Get top audios by play count
      const topAudios = audiosSnapshot.docs
        .map(doc => ({ id: doc.id, ...doc.data() }))
        .sort((a: any, b: any) => (b.playCount || 0) - (a.playCount || 0))
        .slice(0, 5)
        .map((audio: any) => ({
          id: audio.id,
          title: audio.title,
          playCount: audio.playCount || 0
        }));

      // Get top wallpapers by download count
      const topWallpapers = wallpapersSnapshot.docs
        .map(doc => ({ id: doc.id, ...doc.data() }))
        .sort((a: any, b: any) => (b.downloadCount || 0) - (a.downloadCount || 0))
        .slice(0, 5)
        .map((wallpaper: any) => ({
          id: wallpaper.id,
          title: wallpaper.title,
          downloadCount: wallpaper.downloadCount || 0
        }));

      // Get top slides by view count
      const topSlides = slidesSnapshot.docs
        .map(doc => ({ id: doc.id, ...doc.data() }))
        .sort((a: any, b: any) => (b.viewCount || 0) - (a.viewCount || 0))
        .slice(0, 5)
        .map((slide: any) => ({
          id: slide.id,
          title: slide.title.english || slide.title.hindi,
          viewCount: slide.viewCount || 0
        }));

      return {
        success: true,
        data: {
          books: topBooks,
          audios: topAudios,
          wallpapers: topWallpapers,
          slides: topSlides
        }
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Failed to get top content'
      };
    }
  }
}

export const dashboardService = new DashboardService();