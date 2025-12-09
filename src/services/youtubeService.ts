import { 
  collection, 
  doc, 
  getDocs, 
  getDoc, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  where, 
  orderBy, 
  limit as fbLimit,
  startAfter,
  QueryDocumentSnapshot
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { YouTubeVideo, ApiResponse, PaginatedResponse, QueryFilters } from '../types';

class YouTubeService {
  private collectionName = 'youtubeVideos';

  // Extract YouTube video ID from URL
  private extractVideoId(url: string): string | null {
    if (!url || typeof url !== 'string') {
      return null;
    }

    // Clean the URL
    url = url.trim();
    
    // Handle various YouTube URL formats
    const patterns = [
      // Standard watch URL: https://www.youtube.com/watch?v=VIDEO_ID
      /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/,
      // With other parameters: https://www.youtube.com/watch?v=VIDEO_ID&feature=share
      /youtube\.com\/watch\?.*v=([^&\n?#]+)/,
      // Short URL: https://youtu.be/VIDEO_ID
      /youtu\.be\/([^&\n?#]+)/,
      // Embed URL: https://www.youtube.com/embed/VIDEO_ID
      /youtube\.com\/embed\/([^&\n?#]+)/,
      // Mobile URL: https://m.youtube.com/watch?v=VIDEO_ID
      /m\.youtube\.com\/watch\?v=([^&\n?#]+)/,
      // Just the video ID (if user pastes only the ID)
      /^([a-zA-Z0-9_-]{11})$/,
    ];
    
    for (const pattern of patterns) {
      const match = url.match(pattern);
      if (match && match[1] && match[1].length === 11) {
        return match[1];
      }
    }
    
    return null;
  }

  // Get YouTube thumbnail URL from video ID
  // Try maxresdefault first, fallback to hqdefault if not available
  private getThumbnailUrl(videoId: string): string {
    // Use hqdefault as it's more reliable (available for most videos)
    // maxresdefault might not exist for all videos
    return `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;
  }
  
  // Get all possible thumbnail URLs for fallback
  public getThumbnailUrls(videoId: string): string[] {
    return [
      `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`,
      `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`,
      `https://img.youtube.com/vi/${videoId}/mqdefault.jpg`,
      `https://img.youtube.com/vi/${videoId}/sddefault.jpg`,
      `https://img.youtube.com/vi/${videoId}/default.jpg`
    ];
  }

  // Get all videos with filters
  async getVideos(filters: QueryFilters = {}): Promise<PaginatedResponse<YouTubeVideo>> {
    try {
      const {
        page = 1,
        limit = 50,
        search,
        status,
        category,
        sortBy = 'createdAt',
        sortOrder = 'desc'
      } = filters;

      let q = query(collection(db, this.collectionName));

      // Apply filters
      if (status && status !== 'all') {
        q = query(q, where('status', '==', status));
      }

      if (category && category !== 'all') {
        q = query(q, where('category', '==', category));
      }

      // No server-side sort or offset pagination to avoid composite index issues
      q = query(q, fbLimit(limit));

      const querySnapshot = await getDocs(q);
      let videos = querySnapshot.docs.map(doc => {
        const data = doc.data() as YouTubeVideo;
        // Ensure thumbnailUrl exists - generate from videoId if missing
        if (!data.thumbnailUrl && data.videoId) {
          data.thumbnailUrl = this.getThumbnailUrl(data.videoId);
        }
        return { id: doc.id, ...data };
      }) as YouTubeVideo[];

      // Apply search filter (client-side)
      if (search) {
        const searchLower = search.toLowerCase();
        videos = videos.filter(video => 
          video.title.toLowerCase().includes(searchLower) ||
          (video.description && video.description.toLowerCase().includes(searchLower)) ||
          video.tags.some(tag => tag.toLowerCase().includes(searchLower))
        );
      }

      // Client-side sort
      videos = videos.sort((a, b) => {
        const aVal = (a as any)[sortBy] ?? '';
        const bVal = (b as any)[sortBy] ?? '';
        if (sortBy === 'createdAt' || sortBy === 'updatedAt') {
          const cmp = new Date(aVal).getTime() - new Date(bVal).getTime();
          return sortOrder === 'desc' ? -cmp : cmp;
        }
        const cmp = String(aVal).localeCompare(String(bVal));
        return sortOrder === 'desc' ? -cmp : cmp;
      });

      // Get total count for pagination
      const totalSnapshot = await getDocs(query(collection(db, this.collectionName)));
      const totalCount = totalSnapshot.size;

      return { success: true, data: videos, total: totalCount, page, limit, hasMore: videos.length === limit };
    } catch (error: any) {
      return {
        success: false,
        data: [],
        total: 0,
        page: 1,
        limit: 50,
        hasMore: false,
        error: error?.message || 'Failed to load videos',
      } as any;
    }
  }

  // Get video by ID
  async getVideo(id: string): Promise<ApiResponse<YouTubeVideo>> {
    try {
      const docSnap = await getDoc(doc(db, this.collectionName, id));

      if (docSnap.exists()) {
        const videoData = docSnap.data() as YouTubeVideo;
        // Ensure thumbnailUrl exists - generate from videoId if missing
        if (!videoData.thumbnailUrl && videoData.videoId) {
          videoData.thumbnailUrl = this.getThumbnailUrl(videoData.videoId);
        }
        return {
          success: true,
          data: {
            id: docSnap.id,
            ...videoData
          } as YouTubeVideo
        };
      } else {
        return {
          success: false,
          error: 'Video not found'
        };
      }
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Failed to get video'
      };
    }
  }

  // Create new video
  async createVideo(videoData: Omit<YouTubeVideo, 'id' | 'createdAt' | 'updatedAt' | 'videoId' | 'thumbnailUrl'>): Promise<ApiResponse<YouTubeVideo>> {
    try {
      console.log('youtubeService.createVideo called with:', videoData);
      
      // Extract video ID and generate thumbnail URL
      const videoId = this.extractVideoId(videoData.videoUrl);
      console.log('Extracted video ID:', videoId);
      
      if (!videoId) {
        console.error('Failed to extract video ID from URL:', videoData.videoUrl);
        return {
          success: false,
          error: 'Invalid YouTube URL. Please provide a valid YouTube video URL (e.g., https://www.youtube.com/watch?v=VIDEO_ID or https://youtu.be/VIDEO_ID)'
        };
      }

      const thumbnailUrl = this.getThumbnailUrl(videoId);
      console.log('Generated thumbnail URL:', thumbnailUrl);

      const now = new Date().toISOString();
      const uid = (await import('../lib/firebase')).auth.currentUser?.uid || null;
      const newVideo: any = {
        ...videoData,
        videoId,
        thumbnailUrl,
        viewCount: 0,
        tags: videoData.tags || [],
        createdAt: now,
        updatedAt: now,
        createdBy: uid,
      };

      console.log('Creating document in Firestore collection:', this.collectionName);
      console.log('Firebase db object:', db);
      console.log('Collection name:', this.collectionName);
      console.log('Data to save:', JSON.stringify(newVideo, null, 2));
      
      let docRef;
      try {
        docRef = await addDoc(collection(db, this.collectionName), newVideo);
        console.log('✅ Document created successfully in Firestore!');
        console.log('Document ID:', docRef.id);
        console.log('Document path:', docRef.path);
      } catch (firestoreError: any) {
        console.error('❌ Firestore error:', firestoreError);
        console.error('Error code:', firestoreError.code);
        console.error('Error message:', firestoreError.message);
        throw firestoreError;
      }
      
      const createdVideo = {
        id: docRef.id,
        ...newVideo
      } as YouTubeVideo;
      
      console.log('Returning created video:', createdVideo);
      
      return {
        success: true,
        data: createdVideo,
        message: 'Video created successfully'
      };
    } catch (error: any) {
      console.error('Error in createVideo:', error);
      return {
        success: false,
        error: error.message || 'Failed to create video'
      };
    }
  }

  // Update video
  async updateVideo(id: string, updates: Partial<YouTubeVideo>): Promise<ApiResponse<YouTubeVideo>> {
    try {
      // If video URL is being updated, extract new video ID and thumbnail
      if (updates.videoUrl) {
        const videoId = this.extractVideoId(updates.videoUrl);
        if (!videoId) {
          return {
            success: false,
            error: 'Invalid YouTube URL. Please provide a valid YouTube video URL.'
          };
        }
        updates.videoId = videoId;
        updates.thumbnailUrl = this.getThumbnailUrl(videoId);
      }

      const updateData = { ...updates, updatedAt: new Date().toISOString() };

      await updateDoc(doc(db, this.collectionName, id), updateData);
      const updatedDoc = await getDoc(doc(db, this.collectionName, id));
      
      if (updatedDoc.exists()) {
        return {
          success: true,
          data: {
            id: updatedDoc.id,
            ...updatedDoc.data()
          } as YouTubeVideo,
          message: 'Video updated successfully'
        };
      } else {
        return {
          success: false,
          error: 'Video not found after update'
        };
      }
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Failed to update video'
      };
    }
  }

  // Delete video
  async deleteVideo(id: string): Promise<ApiResponse<null>> {
    try {
      await deleteDoc(doc(db, this.collectionName, id));

      return {
        success: true,
        message: 'Video deleted successfully'
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Failed to delete video'
      };
    }
  }

  // Get featured videos
  async getFeaturedVideos(limit: number = 10): Promise<ApiResponse<YouTubeVideo[]>> {
    try {
      const q = query(
        collection(db, this.collectionName),
        where('featured', '==', true),
        where('status', '==', 'published'),
        fbLimit(limit)
      );
      const querySnapshot = await getDocs(q);
      const videos = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as YouTubeVideo[];

      return { success: true, data: videos };
    } catch (error: any) {
      return {
        success: false,
        data: [],
        error: error.message || 'Failed to get featured videos'
      };
    }
  }
}

export const youtubeService = new YouTubeService();

