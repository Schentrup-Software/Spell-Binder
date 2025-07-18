import { useState } from 'react';
import Modal from './Modal';
import { exportCollection, downloadFile } from '../lib/bulkOperations';
import { useErrorHandler } from '../hooks/useErrorHandler';

interface BulkExportModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function BulkExportModal({ isOpen, onClose }: BulkExportModalProps) {
  const [format, setFormat] = useState<'csv' | 'json'>('csv');
  const [isExporting, setIsExporting] = useState(false);
  const { handleError, handleSuccess } = useErrorHandler({ context: 'Bulk Export' });

  const handleExport = async () => {
    setIsExporting(true);
    
    try {
      const data = await exportCollection(format);
      const timestamp = new Date().toISOString().split('T')[0];
      const filename = `spell-binder-${timestamp}.${format}`;
      const mimeType = format === 'csv' ? 'text/csv' : 'application/json';
      
      downloadFile(data, filename, mimeType);
      handleSuccess(`Collection exported as ${filename}`);
      onClose();
    } catch (error) {
      handleError(error, 'Failed to export collection');
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Export Collection" size="md">
      <div className="space-y-4">
        <div>
          <p className="text-sm text-gray-600 mb-4">
            Export your entire collection to a file. You can choose between CSV format (for spreadsheets) 
            or JSON format (for data processing).
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Export Format
          </label>
          <div className="space-y-2">
            <label className="flex items-center">
              <input
                type="radio"
                name="format"
                value="csv"
                checked={format === 'csv'}
                onChange={(e) => setFormat(e.target.value as 'csv' | 'json')}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
              />
              <span className="ml-2 text-sm text-gray-700">
                CSV (Comma Separated Values)
              </span>
            </label>
            <p className="ml-6 text-xs text-gray-500">
              Best for importing into spreadsheet applications like Excel or Google Sheets
            </p>
            
            <label className="flex items-center">
              <input
                type="radio"
                name="format"
                value="json"
                checked={format === 'json'}
                onChange={(e) => setFormat(e.target.value as 'csv' | 'json')}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
              />
              <span className="ml-2 text-sm text-gray-700">
                JSON (JavaScript Object Notation)
              </span>
            </label>
            <p className="ml-6 text-xs text-gray-500">
              Best for data processing and includes additional metadata
            </p>
          </div>
        </div>

        <div className="bg-blue-50 rounded-lg p-3">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h4 className="text-sm font-medium text-blue-800">Export Information</h4>
              <div className="mt-1 text-xs text-blue-700">
                <p>The export will include:</p>
                <ul className="list-disc list-inside mt-1 space-y-1">
                  <li>Card names, sets, and details</li>
                  <li>Quantities and conditions</li>
                  <li>Acquisition dates and notes</li>
                  <li>Estimated values (if available)</li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        <div className="flex justify-end space-x-3 pt-4">
          <button
            type="button"
            onClick={onClose}
            disabled={isExporting}
            className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleExport}
            disabled={isExporting}
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
          >
            {isExporting ? (
              <>
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Exporting...
              </>
            ) : (
              <>
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
                Export Collection
              </>
            )}
          </button>
        </div>
      </div>
    </Modal>
  );
}