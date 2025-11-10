# Cloudinary Setup Instructions

This project uses Cloudinary for image and audio storage, with Firebase Firestore for storing the URLs. The implementation uses client-side direct uploads for better performance and user experience.

## 1. Sign Up for Cloudinary

If you don't already have a Cloudinary account, sign up for a free account here:
[https://cloudinary.com/](https://cloudinary.com/)

## 2. Get Your Cloudinary Credentials

Once you've signed up and logged in, navigate to your Cloudinary Dashboard. You will find your:
- **Cloud Name**
- **API Key**

## 3. Update Your `.env` File

Create or update a `.env` file in the root of your project with the following variables. Replace the placeholder values with your actual Cloudinary credentials.

```env
VITE_CLOUDINARY_CLOUD_NAME=474587774762476
VITE_CLOUDINARY_API_KEY=your_api_key
VITE_CLOUDINARY_UPLOAD_PRESET=ml_default
```

**Important Notes:**
- `VITE_CLOUDINARY_CLOUD_NAME` has been pre-filled with the value you provided: `474587774762476`.
- The `VITE_` prefix is crucial for Vite to expose these environment variables to your client-side code.
- **API Secret is NOT needed** for client-side uploads using unsigned presets.
- **Never commit your `.env` file to version control.** Ensure your `.gitignore` file includes `.env`.

## 4. Configure an Unsigned Upload Preset (Required)

For client-side direct uploads, you **must** create an unsigned upload preset.

1. Go to your Cloudinary Dashboard.
2. Navigate to **Settings** (the gear icon).
3. Select **Upload** from the left sidebar.
4. Scroll down to **Upload presets** and click **Add upload preset**.
5. Set the **Signing Mode** to `Unsigned`.
6. Give it a descriptive name, e.g., `ml_default`.
7. Configure any desired upload options:
   - **Folder**: You can set a default folder for uploads
   - **Resource Type**: Set to "Auto" to handle both images and videos
   - **Quality**: Set to "Auto" for automatic optimization
8. Save the preset.

The `cloudinary.ts` file in this project is configured to use an upload preset named `ml_default`. If you name your preset differently, update the `VITE_CLOUDINARY_UPLOAD_PRESET` value in your `.env` file.

## 5. Restart Your Development Server

After updating your `.env` file, make sure to restart your development server (`npm run dev` or `yarn dev`) for the new environment variables to take effect.

## 6. Test the Integration

Once configured, you can test the integration by:
1. Going to any management section (Wallpapers, Audio, Books, etc.)
2. Uploading an image or audio file
3. The file should upload to Cloudinary and the URL should be stored in Firebase Firestore

## Troubleshooting

- **"Cloudinary config missing keys" error**: Check that your `.env` file has all required variables and restart the dev server.
- **Upload fails**: Verify your upload preset is set to "Unsigned" mode.
- **Files not appearing**: Check the browser console for any error messages.

## Features

### Hybrid Storage System
- **Images**: Uploaded to Cloudinary, URLs stored in Firebase Firestore
- **Audio**: Uploaded to Cloudinary, URLs stored in Firebase Firestore
- **Fallback**: If Cloudinary fails, falls back to Firebase Storage
- **Deletion**: Automatically deletes files from Cloudinary when records are deleted

### Supported File Types
- **Images**: JPG, PNG, GIF, WebP, SVG
- **Audio**: MP3, WAV, M4A, AAC, OGG, FLAC

### Optimized URLs
- Automatic quality optimization
- Format conversion (auto WebP/AVIF)
- Responsive image sizing
- CDN delivery

## Updated Services

All the following services now use Cloudinary:

1. **WallpaperService** - Image uploads
2. **AudioService** - Audio file uploads and series cover images
3. **BookService** - Book cover images and chapter audio
4. **SlideService** - Slide images
5. **AIAudioService** - Audio file uploads

## Usage

The upload service automatically handles:
- File validation
- Cloudinary upload
- URL generation
- Error handling
- Fallback to Firebase Storage

```typescript
import { uploadService } from './services';

// Upload image
const result = await uploadService.uploadImage(file, 'folder/path');
if (result.success) {
  console.log('Image URL:', result.url);
}

// Upload audio
const audioResult = await uploadService.uploadAudio(file, 'audio/folder');
if (audioResult.success) {
  console.log('Audio URL:', audioResult.url);
}
```

## Benefits

1. **Better Performance**: CDN delivery and optimization
2. **Cost Effective**: Cloudinary's generous free tier
3. **Automatic Optimization**: Images and audio are automatically optimized
4. **Reliability**: Fallback to Firebase Storage if needed
5. **Easy Management**: Centralized upload service
6. **Hybrid Approach**: Best of both worlds

## Migration

Existing Firebase Storage files will continue to work. New uploads will use Cloudinary. The system automatically detects the source and handles deletion appropriately.

---

This setup will enable the application to seamlessly upload and manage images and audio files via Cloudinary, with their links stored in Firebase Firestore.