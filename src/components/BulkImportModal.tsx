import React, { useState, useRef } from 'react';
import Modal from './Modal';
import { BulkImportEntry, BulkImportResult, parseBulkImportCSV, importCardsInBulk, generateImportTemplate, downloadFile } from '../lib/bulkOperations';
import { useErrorHandler } from '../hooks/useErrorHandler';

interface BulkImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImportComplete: (result: BulkImportResult) => void;
}

export default function BulkImportModal({ isOpen, onClose, onImportComplete }: BulkImportModalProps) {
  const [step, setStep] = useState<'upload' | 'preview' | 'importing' | 'complete'>('upload');
  const [, setCsvContent] = useState('');
  const [parsedEntries, setParsedEntries] = useState<BulkImportEntry[]>([]);
  const [importResult, setImportResult] = useState<BulkImportResult | null>(null);
  const [importProgress, setImportProgress] = useState({ processed: 0, total: 0 });
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { handleError, handleSuccess } = useErrorHandler({ context: 'Bulk Import' });

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.name.toLowerCase().endsWith('.csv')) {
      handleError(new Error('Please select a CSV file'), 'Invalid file type');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      setCsvContent(content);

      try {
        const entries = parseBulkImportCSV(content);
        setParsedEntries(entries);
        setStep('preview');
      } catch (error) {
        handleError(error, 'Failed to parse CSV file');
      }
    };

    reader.readAsText(file);
  };

  const handleStartImport = async () => {
    setStep('importing');
    setImportProgress({ processed: 0, total: parsedEntries.length });

    try {
      const result = await importCardsInBulk(parsedEntries, (processed, total) => {
        setImportProgress({ processed, total });
      });

      setImportResult(result);
      setStep('complete');
      onImportComplete(result);

      if (result.successful > 0) {
        handleSuccess(`Successfully imported ${result.successful} cards`);
      }
    } catch (error) {
      handleError(error, 'Failed to import cards');
      setStep('preview');
    }
  };

  const handleDownloadTemplate = () => {
    const template = generateImportTemplate();
    downloadFile(template, 'mtg-collection-import-template.csv', 'text/csv');
  };

  const handleClose = () => {
    setStep('upload');
    setCsvContent('');
    setParsedEntries([]);
    setImportResult(null);
    setImportProgress({ processed: 0, total: 0 });
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    onClose();
  };

  const renderUploadStep = () => (
    <div className="space-y-4">
      <div className="text-sm text-gray-600">
        <p className="mb-2">Import cards from a CSV file. The CSV should have the following columns:</p>
        <ul className="list-disc list-inside space-y-1 text-xs">
          <li><strong>Card Name</strong> (required) - The name of the card</li>
          <li><strong>Set Code</strong> (optional) - 3-letter set code (e.g., M21, WAR)</li>
          <li><strong>Quantity</strong> (required) - Number of copies</li>
          <li><strong>Condition</strong> (optional) - NM, LP, MP, HP, or DMG (defaults to NM)</li>
          <li><strong>Foil</strong> (optional) - true/false (defaults to false)</li>
          <li><strong>Notes</strong> (optional) - Any additional notes</li>
        </ul>
      </div>

      <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
        <input
          ref={fileInputRef}
          type="file"
          accept=".csv"
          onChange={handleFileUpload}
          className="hidden"
        />
        <button
          onClick={() => fileInputRef.current?.click()}
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-blue-700 bg-blue-100 hover:bg-blue-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM6.293 6.707a1 1 0 010-1.414l3-3a1 1 0 011.414 0l3 3a1 1 0 01-1.414 1.414L11 5.414V13a1 1 0 11-2 0V5.414L7.707 6.707a1 1 0 01-1.414 0z" clipRule="evenodd" />
          </svg>
          Choose CSV File
        </button>
        <p className="mt-2 text-sm text-gray-500">Or drag and drop a CSV file here</p>
      </div>

      <div className="text-center">
        <button
          onClick={handleDownloadTemplate}
          className="inline-flex items-center px-3 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
          </svg>
          Download Template
        </button>
      </div>
    </div>
  );

  const renderPreviewStep = () => (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h4 className="text-lg font-medium">Preview Import</h4>
        <span className="text-sm text-gray-500">{parsedEntries.length} cards to import</span>
      </div>

      <div className="max-h-64 overflow-y-auto border border-gray-200 rounded-md">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50 sticky top-0">
            <tr>
              <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Card</th>
              <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Set</th>
              <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Qty</th>
              <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Condition</th>
              <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Foil</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {parsedEntries.slice(0, 50).map((entry, index) => (
              <tr key={index} className="hover:bg-gray-50">
                <td className="px-3 py-2 text-sm text-gray-900">{entry.cardName}</td>
                <td className="px-3 py-2 text-sm text-gray-500">{entry.setCode || '-'}</td>
                <td className="px-3 py-2 text-sm text-gray-500">{entry.quantity}</td>
                <td className="px-3 py-2 text-sm text-gray-500">{entry.condition}</td>
                <td className="px-3 py-2 text-sm text-gray-500">{entry.foil ? 'Yes' : 'No'}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {parsedEntries.length > 50 && (
          <div className="p-3 text-center text-sm text-gray-500 bg-gray-50">
            ... and {parsedEntries.length - 50} more cards
          </div>
        )}
      </div>

      <div className="flex justify-between">
        <button
          onClick={() => setStep('upload')}
          className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          Back
        </button>
        <button
          onClick={handleStartImport}
          className="px-4 py-2 border border-transparent rounded-md text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          Start Import
        </button>
      </div>
    </div>
  );

  const renderImportingStep = () => (
    <div className="space-y-4 text-center">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
      <h4 className="text-lg font-medium">Importing Cards...</h4>
      <div className="w-full bg-gray-200 rounded-full h-2">
        <div
          className="bg-blue-600 h-2 rounded-full transition-all duration-300"
          style={{ width: `${(importProgress.processed / importProgress.total) * 100}%` }}
        ></div>
      </div>
      <p className="text-sm text-gray-600">
        {importProgress.processed} of {importProgress.total} cards processed
      </p>
    </div>
  );

  const renderCompleteStep = () => (
    <div className="space-y-4">
      <div className="text-center">
        <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100">
          <svg className="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h4 className="mt-2 text-lg font-medium">Import Complete</h4>
      </div>

      {importResult && (
        <div className="bg-gray-50 rounded-lg p-4">
          <div className="grid grid-cols-2 gap-4 text-center">
            <div>
              <div className="text-2xl font-bold text-green-600">{importResult.successful}</div>
              <div className="text-sm text-gray-600">Successful</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-red-600">{importResult.failed}</div>
              <div className="text-sm text-gray-600">Failed</div>
            </div>
          </div>

          {importResult.errors.length > 0 && (
            <div className="mt-4">
              <h5 className="text-sm font-medium text-gray-900 mb-2">Errors:</h5>
              <div className="max-h-32 overflow-y-auto text-xs text-red-600 space-y-1">
                {importResult.errors.slice(0, 10).map((error, index) => (
                  <div key={index}>
                    {error.entry.cardName}: {error.error}
                  </div>
                ))}
                {importResult.errors.length > 10 && (
                  <div className="text-gray-500">
                    ... and {importResult.errors.length - 10} more errors
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      <div className="text-center">
        <button
          onClick={handleClose}
          className="px-4 py-2 border border-transparent rounded-md text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          Close
        </button>
      </div>
    </div>
  );

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Bulk Import Cards" size="lg">
      {step === 'upload' && renderUploadStep()}
      {step === 'preview' && renderPreviewStep()}
      {step === 'importing' && renderImportingStep()}
      {step === 'complete' && renderCompleteStep()}
    </Modal>
  );
}