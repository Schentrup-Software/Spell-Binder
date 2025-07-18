/**
 * Custom hook for managing image synchronization
 * Provides functionality to trigger image downloads and monitor progress
 */

import { useState, useEffect, useCallback } from 'react';

interface ImageSyncStatus {
  total_needing_images: number;
  total_with_images: number;
  status: 'not_started' | 'in_progress' | 'success' | 'failed' | 'partial';
  last_sync: string | null;
  records_processed: number;
  completion_percentage: number;
}

interface ImageSyncResult {
  success: boolean;
  message?: string;
  processed?: number;
  failed?: number;
  skipped?: number;
  error?: string;
}

export function useImageSync() {
  const [syncStatus, setSyncStatus] = useState<ImageSyncStatus | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch current sync status
  const fetchSyncStatus = useCallback(async () => {
    try {
      const response = await fetch('http://localhost:8090/api/sync/images/progress');
      const data = await response.json();
      
      if (data.success) {
        setSyncStatus(data.progress);
        setError(null);
      } else {
        setError(data.error || 'Failed to fetch sync status');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error occurred');
    }
  }, []);

  // Trigger image synchronization
  const triggerImageSync = useCallback(async (): Promise<ImageSyncResult> => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await fetch('http://localhost:8090/api/sync/images', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      const data = await response.json();
      
      if (data.success) {
        // Refresh status after successful sync
        await fetchSyncStatus();
        return {
          success: true,
          message: data.message,
          processed: data.processed,
          failed: data.failed,
          skipped: data.skipped,
        };
      } else {
        setError(data.error || 'Image sync failed');
        return {
          success: false,
          error: data.error || 'Image sync failed',
        };
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      setError(errorMessage);
      return {
        success: false,
        error: errorMessage,
      };
    } finally {
      setIsLoading(false);
    }
  }, [fetchSyncStatus]);

  // Auto-refresh status periodically when sync is in progress
  useEffect(() => {
    let intervalId: number | null = null;
    
    if (syncStatus?.status === 'in_progress') {
      intervalId = setInterval(fetchSyncStatus, 2000); // Check every 2 seconds
    }
    
    return () => {
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, [syncStatus?.status, fetchSyncStatus]);

  // Initial status fetch
  useEffect(() => {
    fetchSyncStatus();
  }, [fetchSyncStatus]);

  return {
    syncStatus,
    isLoading,
    error,
    triggerImageSync,
    refreshStatus: fetchSyncStatus,
  };
}

/**
 * Hook for managing individual card image loading
 */
export function useCardImage() {
  const [isLoading, setIsLoading] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [loadedUrl, setLoadedUrl] = useState<string | null>(null);

  const preloadImage = useCallback(async (url: string) => {
    if (!url) return false;
    
    setIsLoading(true);
    setHasError(false);
    
    try {
      const img = new Image();
      
      return new Promise<boolean>((resolve) => {
        img.onload = () => {
          setLoadedUrl(url);
          setIsLoading(false);
          resolve(true);
        };
        
        img.onerror = () => {
          setHasError(true);
          setIsLoading(false);
          resolve(false);
        };
        
        img.src = url;
      });
    } catch (error) {
      setHasError(true);
      setIsLoading(false);
      return false;
    }
  }, []);

  const resetState = useCallback(() => {
    setIsLoading(false);
    setHasError(false);
    setLoadedUrl(null);
  }, []);

  return {
    isLoading,
    hasError,
    loadedUrl,
    preloadImage,
    resetState,
  };
}