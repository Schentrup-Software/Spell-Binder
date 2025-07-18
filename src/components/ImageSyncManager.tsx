/**
 * Image Sync Manager Component
 * Provides UI for managing card image synchronization
 */

import { useState } from 'react';
import { useImageSync } from '../hooks/useImageSync';

interface ImageSyncManagerProps {
  className?: string;
  showProgress?: boolean;
  autoSync?: boolean;
}

export default function ImageSyncManager({ 
  className = '', 
  showProgress = true
}: ImageSyncManagerProps) {
  const { syncStatus, isLoading, error, triggerImageSync, refreshStatus } = useImageSync();
  const [lastSyncResult, setLastSyncResult] = useState<string | null>(null);

  const handleSyncClick = async () => {
    setLastSyncResult(null);
    const result = await triggerImageSync();
    
    if (result.success) {
      setLastSyncResult(
        `Successfully processed ${result.processed || 0} images. ` +
        `${result.failed || 0} failed, ${result.skipped || 0} skipped.`
      );
    } else {
      setLastSyncResult(`Sync failed: ${result.error}`);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'success':
        return 'text-green-600 bg-green-100';
      case 'in_progress':
        return 'text-blue-600 bg-blue-100';
      case 'failed':
        return 'text-red-600 bg-red-100';
      case 'partial':
        return 'text-yellow-600 bg-yellow-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  const formatLastSync = (lastSync: string | null) => {
    if (!lastSync) return 'Never';
    
    try {
      const date = new Date(lastSync);
      return date.toLocaleString();
    } catch {
      return 'Unknown';
    }
  };

  return (
    <div className={`bg-white rounded-lg shadow-sm border border-gray-200 p-6 ${className}`}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">Image Synchronization</h3>
        <button
          onClick={refreshStatus}
          className="text-sm text-gray-500 hover:text-gray-700 transition-colors"
          title="Refresh status"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
        </button>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}

      {syncStatus && (
        <div className="space-y-4">
          {/* Status Overview */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900">
                {syncStatus.total_with_images}
              </div>
              <div className="text-sm text-gray-500">Images Downloaded</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900">
                {syncStatus.total_needing_images}
              </div>
              <div className="text-sm text-gray-500">Images Needed</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900">
                {syncStatus.completion_percentage}%
              </div>
              <div className="text-sm text-gray-500">Complete</div>
            </div>
            <div className="text-center">
              <div className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(syncStatus.status)}`}>
                {syncStatus.status.replace('_', ' ').toUpperCase()}
              </div>
              <div className="text-sm text-gray-500 mt-1">Status</div>
            </div>
          </div>

          {/* Progress Bar */}
          {showProgress && (
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${syncStatus.completion_percentage}%` }}
              />
            </div>
          )}

          {/* Last Sync Info */}
          <div className="text-sm text-gray-600">
            <span className="font-medium">Last sync:</span> {formatLastSync(syncStatus.last_sync)}
            {syncStatus.records_processed > 0 && (
              <span className="ml-2">
                ({syncStatus.records_processed} images processed)
              </span>
            )}
          </div>

          {/* Sync Button */}
          <div className="flex items-center justify-between">
            <button
              onClick={handleSyncClick}
              disabled={isLoading || syncStatus.status === 'in_progress'}
              className={`
                px-4 py-2 rounded-md font-medium text-sm transition-colors
                ${isLoading || syncStatus.status === 'in_progress'
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  : 'bg-blue-600 text-white hover:bg-blue-700'
                }
              `}
            >
              {isLoading || syncStatus.status === 'in_progress' ? (
                <div className="flex items-center">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                  Syncing...
                </div>
              ) : (
                'Start Image Sync'
              )}
            </button>

            {syncStatus.total_needing_images === 0 && (
              <span className="text-sm text-green-600 font-medium">
                ✓ All images downloaded
              </span>
            )}
          </div>

          {/* Last Sync Result */}
          {lastSyncResult && (
            <div className={`p-3 rounded-md text-sm ${
              lastSyncResult.includes('failed') 
                ? 'bg-red-50 text-red-700 border border-red-200'
                : 'bg-green-50 text-green-700 border border-green-200'
            }`}>
              {lastSyncResult}
            </div>
          )}
        </div>
      )}

      {!syncStatus && !error && (
        <div className="text-center py-8">
          <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
          <p className="text-sm text-gray-500">Loading sync status...</p>
        </div>
      )}
    </div>
  );
}