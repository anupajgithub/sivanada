import { uploadToCloudinary, deleteFromCloudinary, extractPublicId } from '../lib/cloudinary';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { storage } from '../lib/firebase';

export interface UploadResult {
  success: boolean;
  url?: string;
  error?: string;
}

export interface DeleteResult {
  success: boolean;
  error?: string;
}

class UploadService {
  private useCloudinary = true; // Set to false to use Firebase Storage instead

  /**
   * Upload image file to Cloudinary
   */
  async uploadImage(file: File, folder?: string): Promise<UploadResult> {
    if (this.useCloudinary) {
      const result = await uploadToCloudinary(file, 'images', folder);
      if (result.success && result.url) {
        return { success: true, url: result.url };
      }
      // Cloudinary failed — fallback to Firebase Storage
      const fb = await this.uploadToFirebase(file, 'images', folder);
      if (!fb.success && result.error && !fb.error) {
        fb.error = result.error;
      }
      return fb;
    } else {
      // Fallback to Firebase Storage
      return this.uploadToFirebase(file, 'images', folder);
    }
  }

  /**
   * Upload audio file to Cloudinary
   */
  async uploadAudio(file: File, folder?: string): Promise<UploadResult> {
    if (this.useCloudinary) {
      const result = await uploadToCloudinary(file, 'audio', folder);
      if (result.success && result.url) {
        return { success: true, url: result.url };
      }
      // Cloudinary failed — fallback to Firebase Storage
      const fb = await this.uploadToFirebase(file, 'audio', folder);
      if (!fb.success && result.error && !fb.error) {
        fb.error = result.error;
      }
      return fb;
    } else {
      // Fallback to Firebase Storage
      return this.uploadToFirebase(file, 'audio', folder);
    }
  }

  /**
   * Delete image from Cloudinary
   */
  async deleteImage(url: string): Promise<DeleteResult> {
    if (this.useCloudinary && url.includes('cloudinary.com')) {
      const publicId = extractPublicId(url);
      if (publicId) {
        const result = await deleteFromCloudinary(publicId, 'image');
        return {
          success: result.success,
          error: result.error
        };
      }
    } else if (url.includes('firebasestorage.googleapis.com')) {
      // Fallback to Firebase Storage deletion
      return this.deleteFromFirebase(url);
    }
    
    return { success: true }; // If URL is external, consider it deleted
  }

  /**
   * Delete audio from Cloudinary
   */
  async deleteAudio(url: string): Promise<DeleteResult> {
    if (this.useCloudinary && url.includes('cloudinary.com')) {
      const publicId = extractPublicId(url);
      if (publicId) {
        const result = await deleteFromCloudinary(publicId, 'video');
        return {
          success: result.success,
          error: result.error
        };
      }
    } else if (url.includes('firebasestorage.googleapis.com')) {
      // Fallback to Firebase Storage deletion
      return this.deleteFromFirebase(url);
    }
    
    return { success: true }; // If URL is external, consider it deleted
  }

  /**
   * Upload file to Firebase Storage (fallback method)
   */
  private async uploadToFirebase(file: File, type: 'images' | 'audio', folder?: string): Promise<UploadResult> {
    try {
      const fileName = `${Date.now()}_${file.name}`;
      const storagePath = folder ? `${folder}/${fileName}` : `${type}/${fileName}`;
      const storageRef = ref(storage, storagePath);
      
      const snapshot = await uploadBytes(storageRef, file);
      const downloadURL = await getDownloadURL(snapshot.ref);
      
      return {
        success: true,
        url: downloadURL
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Failed to upload file to Firebase Storage'
      };
    }
  }

  /**
   * Delete file from Firebase Storage (fallback method)
   */
  private async deleteFromFirebase(url: string): Promise<DeleteResult> {
    try {
      // Extract the path from Firebase Storage URL
      const urlParts = url.split('/o/');
      if (urlParts.length === 2) {
        const path = decodeURIComponent(urlParts[1].split('?')[0]);
        const storageRef = ref(storage, path);
        await deleteObject(storageRef);
      }
      
      return { success: true };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Failed to delete file from Firebase Storage'
      };
    }
  }

  /**
   * Check if URL is from Cloudinary
   */
  isCloudinaryUrl(url: string): boolean {
    return url.includes('cloudinary.com');
  }

  /**
   * Check if URL is from Firebase Storage
   */
  isFirebaseUrl(url: string): boolean {
    return url.includes('firebasestorage.googleapis.com');
  }

  /**
   * Get file type from URL
   */
  getFileType(url: string): 'image' | 'audio' | 'unknown' {
    const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg'];
    const audioExtensions = ['.mp3', '.wav', '.m4a', '.aac', '.ogg', '.flac'];
    
    const urlLower = url.toLowerCase();
    
    if (imageExtensions.some(ext => urlLower.includes(ext))) {
      return 'image';
    } else if (audioExtensions.some(ext => urlLower.includes(ext))) {
      return 'audio';
    }
    
    return 'unknown';
  }
}

export const uploadService = new UploadService();
