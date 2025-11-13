/**
 * Cloudflare R2 Upload Utility
 * Handles image uploads to R2 storage
 */

import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import crypto from 'crypto';
import fetch from 'node-fetch';

// Initialize R2 client (S3-compatible)
const r2Client = new S3Client({
  region: 'auto',
  endpoint: process.env.R2_ENDPOINT,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
  },
});

/**
 * Download image from URL and upload to R2
 * @param {string} imageUrl - Source image URL
 * @param {string} propertyId - Property ID for organizing files
 * @param {number} index - Image index
 * @returns {Promise<string>} - R2 public URL
 */
export async function uploadImageToR2(imageUrl, propertyId, index = 0) {
  try {
    // Download image
    const response = await fetch(imageUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to download image: ${response.status}`);
    }

    const imageBuffer = await response.buffer();
    const contentType = response.headers.get('content-type') || 'image/jpeg';

    // Generate unique filename
    const hash = crypto.createHash('md5').update(imageUrl).digest('hex');
    const extension = contentType.split('/')[1] || 'jpg';
    const filename = `properties/${propertyId}/${index}-${hash}.${extension}`;

    // Upload to R2
    const command = new PutObjectCommand({
      Bucket: process.env.R2_BUCKET_NAME,
      Key: filename,
      Body: imageBuffer,
      ContentType: contentType,
      CacheControl: 'public, max-age=31536000',
    });

    await r2Client.send(command);

    // Return URL to our API proxy endpoint
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const publicUrl = `${appUrl}/api/images/${filename}`;

    return publicUrl;

  } catch (error) {
    console.error(`Failed to upload image to R2:`, error.message);
    throw error;
  }
}

/**
 * Upload multiple images for a property
 * @param {string[]} imageUrls - Array of source image URLs
 * @param {string} propertyId - Property ID
 * @returns {Promise<string[]>} - Array of R2 URLs
 */
export async function uploadPropertyImages(imageUrls, propertyId) {
  const uploadPromises = imageUrls.map((url, index) =>
    uploadImageToR2(url, propertyId, index).catch(error => {
      console.error(`Failed to upload image ${index}:`, error.message);
      return null; // Return null for failed uploads
    })
  );

  const results = await Promise.all(uploadPromises);

  // Filter out failed uploads
  return results.filter(url => url !== null);
}
