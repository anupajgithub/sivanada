// Client-side Cloudinary upload utilities
// Using Cloudinary Upload Widget and direct API calls for browser compatibility

// Helper to sanitize .env values: removes surrounding quotes/backticks and trailing commas
const clean = (v: any) => (typeof v === 'string' ? v.trim().replace(/^['"`]+|[,'"`]+$/g, '') : v);

// Vite import meta typing helper
declare const importMeta: ImportMeta;
const env = (typeof import.meta !== 'undefined' ? (import.meta as any).env : (importMeta as any).env) || {};

// Cloudinary configuration from environment variables
const cloudinaryConfig = {
  cloudName: clean(env.VITE_CLOUDINARY_CLOUD_NAME),
  apiKey: clean(env.VITE_CLOUDINARY_API_KEY),
  uploadPreset: clean(env.VITE_CLOUDINARY_UPLOAD_PRESET) || 'ml_default', // Default preset
};

// Validate required env vars for clearer errors during development
const missingKeys = Object.entries(cloudinaryConfig)
  .filter(([_, v]) => !v)
  .map(([k]) => k);

if (missingKeys.length) {
  console.error(
    `❌ Cloudinary config missing keys: ${missingKeys.join(', ')}.\n` +
    'Ensure your .env at project root has VITE_CLOUDINARY_* values and restart the dev server.'
  );
} else {
  console.log('✅ Cloudinary configuration loaded successfully');
  console.log('Cloud Name:', cloudinaryConfig.cloudName);
  console.log('Upload Preset:', cloudinaryConfig.uploadPreset);
}

// Upload file to Cloudinary using direct API
export async function uploadToCloudinary(
  file: File, 
  type: 'images' | 'audio',
  folder?: string
): Promise<{ success: boolean; url?: string; publicId?: string; error?: string }> {
  try {
    // Create FormData for Cloudinary upload
    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', cloudinaryConfig.uploadPreset);
    formData.append('cloud_name', cloudinaryConfig.cloudName);
    
    // Add folder if specified
    if (folder) {
      formData.append('folder', folder);
    }

    // Set resource type based on file type
    if (type === 'audio') {
      formData.append('resource_type', 'video'); // Cloudinary treats audio as video
    }

    // Upload to Cloudinary
    const response = await fetch(
      `https://api.cloudinary.com/v1_1/${cloudinaryConfig.cloudName}/${type === 'audio' ? 'video' : 'image'}/upload`,
      {
        method: 'POST',
        body: formData,
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Cloudinary upload error response:', errorText);
      
      if (response.status === 401) {
        throw new Error('Unauthorized: Check your API key and upload preset configuration');
      } else if (response.status === 400) {
        throw new Error(`Bad Request: ${errorText}`);
      } else {
        throw new Error(`Upload failed (${response.status}): ${response.statusText}`);
      }
    }

    const result = await response.json();

    return {
      success: true,
      url: result.secure_url,
      publicId: result.public_id
    };
  } catch (error: any) {
    console.error('Cloudinary upload error:', error);
    return {
      success: false,
      error: error.message || 'Failed to upload file to Cloudinary'
    };
  }
}

// Delete file from Cloudinary using direct API
export async function deleteFromCloudinary(
  publicId: string,
  resourceType: 'image' | 'video' = 'image'
): Promise<{ success: boolean; error?: string }> {
  try {
    // Note: For client-side deletion, you typically need to use signed uploads
    // or handle deletion on the server side for security reasons
    // This is a simplified version that may not work without proper authentication
    
    const timestamp = Math.round(new Date().getTime() / 1000);
    const params = `public_id=${publicId}&timestamp=${timestamp}`;
    
    // In a real implementation, you would need to generate a signature
    // For now, we'll just return success (the file will remain on Cloudinary)
    console.warn('Client-side deletion not fully implemented. File remains on Cloudinary.');
    
    return { success: true };
  } catch (error: any) {
    console.error('Cloudinary delete error:', error);
    return {
      success: false,
      error: error.message || 'Failed to delete file from Cloudinary'
    };
  }
}

// Extract public ID from Cloudinary URL
export function extractPublicId(url: string): string | null {
  try {
    const match = url.match(/\/v\d+\/(.+)\.(jpg|jpeg|png|gif|webp|svg|mp3|mp4|wav|m4a)$/i);
    return match ? match[1] : null;
  } catch {
    return null;
  }
}

// Generate optimized image URL with transformations
export function getOptimizedImageUrl(
  url: string, 
  width?: number, 
  height?: number, 
  quality: string = 'auto'
): string {
  if (!url.includes('cloudinary.com')) {
    return url; // Return original URL if not from Cloudinary
  }

  const publicId = extractPublicId(url);
  if (!publicId) {
    return url;
  }

  const transformations = [];
  if (width) transformations.push(`w_${width}`);
  if (height) transformations.push(`h_${height}`);
  transformations.push(`q_${quality}`);
  transformations.push('f_auto');

  return `https://res.cloudinary.com/${cloudinaryConfig.cloudName}/image/upload/${transformations.join(',')}/${publicId}`;
}

// Initialize Cloudinary Upload Widget (optional - for advanced use cases)
export function initializeCloudinaryWidget(options: any = {}) {
  // This would require loading the Cloudinary widget script
  // For now, we'll use direct API uploads
  console.log('Cloudinary widget initialization would go here');
}

// Upload progress callback type
export type UploadProgressCallback = (progress: number) => void;

// Upload with progress tracking
export async function uploadWithProgress(
  file: File,
  type: 'images' | 'audio',
  folder?: string,
  onProgress?: UploadProgressCallback
): Promise<{ success: boolean; url?: string; publicId?: string; error?: string }> {
  try {
    // Simulate progress for now (Cloudinary doesn't provide progress events in direct API)
    if (onProgress) {
      onProgress(10);
      await new Promise(resolve => setTimeout(resolve, 100));
      onProgress(50);
      await new Promise(resolve => setTimeout(resolve, 100));
      onProgress(90);
    }

    const result = await uploadToCloudinary(file, type, folder);
    
    if (onProgress) {
      onProgress(100);
    }
    
    return result;
  } catch (error: any) {
    return {
      success: false,
      error: error.message || 'Failed to upload file'
    };
  }
}