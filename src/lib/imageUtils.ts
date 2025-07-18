/**
 * Image utilities for Spell Binder
 * Handles image optimization, caching, and URL generation
 */

import { Card } from './types';

// Image cache for storing loaded image URLs
const imageCache = new Map<string, boolean>();
const failedImageCache = new Set<string>();

/**
 * Get the best available image URL for a card
 * @param card The card object
 * @param quality Desired image quality
 * @returns Optimized image URL or undefined
 */
export function getCardImageUrl(card: Card, quality: 'low' | 'medium' | 'high' = 'medium'): string | undefined {
  // Priority: local file > image_uri > image_uri_small
  if (card.image_file) {
    const baseUrl = `http://localhost:8090/api/files/cards/${card.id}/${card.image_file}`;
    return optimizeImageUrl(baseUrl, quality);
  }
  
  if (card.image_uri) {
    return card.image_uri;
  }
  
  if (card.image_uri_small) {
    return card.image_uri_small;
  }
  
  return undefined;
}

/**
 * Get fallback image URL for a card
 * @param card The card object
 * @param currentUrl The current image URL that failed
 * @returns Fallback image URL or undefined
 */
export function getCardImageFallback(card: Card, currentUrl?: string): string | undefined {
  // If current URL is the main image_uri, try small
  if (currentUrl === card.image_uri && card.image_uri_small) {
    return card.image_uri_small;
  }
  
  // If current URL is the small image_uri, try main
  if (currentUrl === card.image_uri_small && card.image_uri) {
    return card.image_uri;
  }
  
  // If we haven't tried the URIs yet and we're failing on the file
  if (currentUrl?.includes('/api/files/cards/')) {
    return card.image_uri || card.image_uri_small;
  }
  
  return undefined;
}

/**
 * Optimize image URL with quality parameters
 * @param url The base image URL
 * @param quality Desired quality level
 * @param size Optional size hint
 * @returns Optimized URL
 */
export function optimizeImageUrl(
  url: string, 
  quality: 'low' | 'medium' | 'high' = 'medium',
  size?: 'small' | 'medium' | 'large' | 'xl'
): string {
  if (!url) return url;
  
  // Only optimize PocketBase file URLs
  if (!url.includes('/api/files/cards/')) {
    return url;
  }
  
  let width = 300; // default medium quality
  
  // Adjust width based on quality and size
  switch (quality) {
    case 'low':
      width = size === 'small' ? 150 : 200;
      break;
    case 'medium':
      width = size === 'small' ? 200 : 
             size === 'large' || size === 'xl' ? 400 : 300;
      break;
    case 'high':
      width = size === 'small' ? 300 : 
             size === 'large' ? 600 : 
             size === 'xl' ? 800 : 400;
      break;
  }
  
  // Add thumbnail parameter for PocketBase
  return `${url}?thumb=${width}x0`;
}

/**
 * Check if an image URL has been cached as loaded
 * @param url The image URL
 * @returns True if the image is cached
 */
export function isImageCached(url: string): boolean {
  return imageCache.has(url);
}

/**
 * Mark an image URL as successfully loaded
 * @param url The image URL
 */
export function cacheImageSuccess(url: string): void {
  imageCache.set(url, true);
  failedImageCache.delete(url); // Remove from failed cache if it was there
}

/**
 * Check if an image URL has failed to load
 * @param url The image URL
 * @returns True if the image has failed to load
 */
export function hasImageFailed(url: string): boolean {
  return failedImageCache.has(url);
}

/**
 * Mark an image URL as failed to load
 * @param url The image URL
 */
export function cacheImageFailure(url: string): void {
  failedImageCache.add(url);
  imageCache.delete(url); // Remove from success cache if it was there
}

/**
 * Clear image cache (useful for testing or memory management)
 */
export function clearImageCache(): void {
  imageCache.clear();
  failedImageCache.clear();
}

/**
 * Preload an image to improve perceived performance
 * @param url The image URL to preload
 * @returns Promise that resolves when image is loaded
 */
export function preloadImage(url: string): Promise<void> {
  return new Promise((resolve, reject) => {
    if (isImageCached(url)) {
      resolve();
      return;
    }
    
    if (hasImageFailed(url)) {
      reject(new Error('Image previously failed to load'));
      return;
    }
    
    const img = new Image();
    
    img.onload = () => {
      cacheImageSuccess(url);
      resolve();
    };
    
    img.onerror = () => {
      cacheImageFailure(url);
      reject(new Error('Failed to load image'));
    };
    
    img.src = url;
  });
}

/**
 * Get responsive image sizes for different breakpoints
 * @param size The base size
 * @returns Object with responsive size classes
 */
export function getResponsiveSizeClasses(size: 'small' | 'medium' | 'large' | 'xl') {
  const sizeClasses = {
    small: 'w-16 h-22 xs:w-20 xs:h-28 sm:w-24 sm:h-32',
    medium: 'w-24 h-32 xs:w-28 xs:h-40 sm:w-36 sm:h-48 md:w-40 md:h-52',
    large: 'w-32 h-44 xs:w-36 xs:h-48 sm:w-48 sm:h-64 md:w-52 md:h-72',
    xl: 'w-40 h-56 xs:w-48 xs:h-64 sm:w-64 sm:h-88 md:w-72 md:h-96'
  };
  
  return sizeClasses[size];
}

/**
 * Generate srcset for responsive images
 * @param baseUrl The base image URL
 * @param sizes Array of sizes to generate
 * @returns srcset string
 */
export function generateSrcSet(baseUrl: string, sizes: number[] = [200, 300, 400, 600]): string {
  if (!baseUrl.includes('/api/files/cards/')) {
    return baseUrl;
  }
  
  return sizes
    .map(size => `${baseUrl}?thumb=${size}x0 ${size}w`)
    .join(', ');
}