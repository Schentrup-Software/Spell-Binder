import { useState, useEffect, useRef, useCallback } from 'react';
import { 
  getCardImageUrl, 
  getCardImageFallback, 
  optimizeImageUrl,
  cacheImageSuccess,
  cacheImageFailure,
  getResponsiveSizeClasses
} from '../lib/imageUtils';
import { Card } from '../lib/types';

interface CardImageProps {
  card?: Card;
  imageUrl?: string;
  cardName: string;
  className?: string;
  size?: 'small' | 'medium' | 'large' | 'xl';
  quality?: 'low' | 'medium' | 'high';
  fallbackUrl?: string;
  lazy?: boolean;
  priority?: boolean;
}

export default function CardImage({ 
  card,
  imageUrl, 
  cardName, 
  className = '', 
  size = 'medium',
  quality = 'medium',
  fallbackUrl,
  lazy = true,
  priority = false
}: CardImageProps) {
  const [imageError, setImageError] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [imageSrc, setImageSrc] = useState<string | undefined>();
  const [hasIntersected, setHasIntersected] = useState(!lazy || priority);
  const imgRef = useRef<HTMLImageElement>(null);
  const observerRef = useRef<IntersectionObserver | null>(null);
  
  // Get responsive size classes from utility
  const responsiveSizeClasses = getResponsiveSizeClasses(size);

  // Determine the best image source based on available options
  const getBestImageSource = useCallback(() => {
    if (card) {
      return getCardImageUrl(card, quality) || imageUrl;
    }
    return imageUrl;
  }, [card, imageUrl, quality]);

  // Get fallback image source
  const getFallbackSource = useCallback(() => {
    if (fallbackUrl) {
      return fallbackUrl;
    }
    
    if (card) {
      return getCardImageFallback(card, imageSrc);
    }
    
    return undefined;
  }, [fallbackUrl, card, imageSrc]);

  // Initialize image source
  useEffect(() => {
    const bestSource = getBestImageSource();
    setImageSrc(bestSource);
    setImageError(false);
    setIsLoading(!!bestSource);
  }, [getBestImageSource]);

  // Handle image loading error with intelligent fallback
  const handleError = useCallback(() => {
    const fallbackSource = getFallbackSource();
    
    if (fallbackSource && imageSrc !== fallbackSource) {
      console.log(`Image failed for ${cardName}, trying fallback: ${fallbackSource}`);
      setImageSrc(fallbackSource);
      setIsLoading(true);
      setImageError(false);
    } else {
      console.log(`All image sources failed for ${cardName}`);
      setImageError(true);
      setIsLoading(false);
    }
  }, [getFallbackSource, imageSrc, cardName]);
  
  // Handle image load success
  const handleLoad = useCallback(() => {
    setIsLoading(false);
    setImageError(false);
    
    // Cache successful loads using utility function
    if (imageSrc) {
      cacheImageSuccess(imageSrc);
    }
  }, [imageSrc]);

  // Handle image error and cache failure
  const handleErrorWithCache = useCallback(() => {
    if (imageSrc) {
      cacheImageFailure(imageSrc);
    }
    handleError();
  }, [imageSrc, handleError]);

  // Intersection Observer for lazy loading
  useEffect(() => {
    if (!lazy || priority || hasIntersected) return;
    
    const currentRef = imgRef.current;
    if (!currentRef) return;
    
    observerRef.current = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            setHasIntersected(true);
            if (observerRef.current) {
              observerRef.current.disconnect();
            }
          }
        });
      },
      {
        rootMargin: '50px', // Start loading when image is 50px from viewport
        threshold: 0.01
      }
    );
    
    observerRef.current.observe(currentRef);
    
    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, [lazy, priority, hasIntersected]);
  
  // Placeholder component
  const renderPlaceholder = () => (
    <div 
      className={`flex items-center justify-center bg-gradient-to-br from-gray-100 to-gray-200 rounded-lg border-2 border-gray-300 ${responsiveSizeClasses} ${className}`}
      title={cardName}
    >
      <div className="text-center p-2 max-w-full">
        <div className="text-gray-600 text-xs sm:text-sm font-medium truncate max-w-full mb-1">
          {cardName}
        </div>
        <div className="text-xs text-gray-400">
          {imageError ? 'Image unavailable' : 'Loading...'}
        </div>
        {imageError && (
          <div className="mt-2">
            <svg className="w-6 h-6 mx-auto text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
        )}
      </div>
    </div>
  );

  // Don't render image until it has intersected (for lazy loading)
  if (lazy && !hasIntersected && !priority) {
    return (
      <div ref={imgRef} className={`${responsiveSizeClasses} ${className}`}>
        {renderPlaceholder()}
      </div>
    );
  }
  
  // If no image source available or error occurred, show placeholder
  if (!imageSrc || imageError) {
    return renderPlaceholder();
  }
  
  const optimizedImageUrl = optimizeImageUrl(imageSrc, quality, size);
  
  // Display the card image with loading state and optimizations
  return (
    <div className={`relative ${responsiveSizeClasses} ${className}`}>
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100 rounded-lg">
          <div className="w-6 h-6 sm:w-8 sm:h-8 border-2 sm:border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
      )}
      <img
        ref={imgRef}
        src={optimizedImageUrl}
        alt={cardName}
        title={cardName}
        loading={priority ? 'eager' : 'lazy'}
        decoding="async"
        className={`
          rounded-lg shadow-sm w-full h-full object-contain bg-white
          ${isLoading ? 'opacity-0' : 'opacity-100'} 
          transition-opacity duration-300 ease-in-out
          hover:shadow-md transition-shadow duration-200
        `}
        onError={handleErrorWithCache}
        onLoad={handleLoad}
        style={{
          imageRendering: quality === 'low' ? 'auto' : 'crisp-edges'
        }}
      />
    </div>
  );
}