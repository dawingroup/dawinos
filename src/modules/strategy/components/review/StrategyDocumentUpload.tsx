// ============================================================================
// STRATEGY DOCUMENT UPLOAD COMPONENT
// DawinOS v2.0 - CEO Strategy Command
// Upload and parse business strategy documents for review
// ============================================================================

import React, { useState, useCallback, useRef } from 'react';
import {
  Upload,
  FileText,
  File,
  X,
  Loader2,
  CheckCircle2,
  Sparkles,
  AlertCircle,
} from 'lucide-react';
import type { UploadedStrategyDocument } from '../../types/strategy.types';

export interface StrategyDocumentUploadProps {
  onDocumentUploaded: (doc: UploadedStrategyDocument, parsedContent?: string) => void;
  onAnalyzeDocument?: (content: string) => void;
  existingDocument?: UploadedStrategyDocument;
  isAnalyzing?: boolean;
}

export const StrategyDocumentUpload: React.FC<StrategyDocumentUploadProps> = ({
  onDocumentUploaded,
  onAnalyzeDocument,
  existingDocument,
  isAnalyzing = false,
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isManualEntry, setIsManualEntry] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [extractedText, setExtractedText] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const ACCEPTED_TYPES = [
    'application/pdf',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/msword',
    'text/plain',
    'text/markdown',
  ];
  const ACCEPTED_EXTENSIONS = ['.pdf', '.docx', '.doc', '.txt', '.md'];
  const MAX_SIZE_MB = 25;

  const validateFile = (file: File): string | null => {
    const ext = '.' + file.name.split('.').pop()?.toLowerCase();
    if (!ACCEPTED_EXTENSIONS.includes(ext) && !ACCEPTED_TYPES.includes(file.type)) {
      return 'Invalid file type. Please upload PDF, Word, or text documents.';
    }
    if (file.size > MAX_SIZE_MB * 1024 * 1024) {
      return `File is too large. Maximum size is ${MAX_SIZE_MB}MB.`;
    }
    return null;
  };

  const extractTextFromFile = async (file: File): Promise<string> => {
    // For text files, read directly
    if (file.type === 'text/plain' || file.type === 'text/markdown' || file.name.endsWith('.txt') || file.name.endsWith('.md')) {
      return await file.text();
    }
    // For PDF/DOCX, we'll send the text content to the backend for parsing
    // For now, prompt user to paste content if binary format
    return '';
  };

  const handleFile = useCallback(async (file: File) => {
    setError(null);
    const validationError = validateFile(file);
    if (validationError) {
      setError(validationError);
      return;
    }
    setSelectedFile(file);

    // Try to extract text
    const text = await extractTextFromFile(file);
    if (text) {
      setExtractedText(text);
    }
  }, []);

  const handleUpload = async () => {
    if (!selectedFile) return;

    setIsUploading(true);
    setError(null);

    try {
      const doc: UploadedStrategyDocument = {
        fileName: selectedFile.name,
        fileUrl: URL.createObjectURL(selectedFile),
        fileSize: selectedFile.size,
        mimeType: selectedFile.type,
        uploadedAt: new Date().toISOString(),
        parsedContent: extractedText || undefined,
      };

      onDocumentUploaded(doc, extractedText || undefined);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed');
    } finally {
      setIsUploading(false);
    }
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      handleFile(files[0]);
    }
  }, [handleFile]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  // Show existing document
  if (existingDocument && !selectedFile) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between p-4 bg-green-50 border border-green-200 rounded-lg">
          <div className="flex items-center gap-3">
            <CheckCircle2 className="w-5 h-5 text-green-600" />
            <div>
              <p className="font-medium text-green-900">{existingDocument.fileName}</p>
              <p className="text-sm text-green-700">
                {formatFileSize(existingDocument.fileSize)} — Uploaded {new Date(existingDocument.uploadedAt).toLocaleDateString()}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {onAnalyzeDocument && existingDocument.parsedContent && (
              <button
                onClick={() => onAnalyzeDocument(existingDocument.parsedContent!)}
                disabled={isAnalyzing}
                className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-purple-700 bg-purple-100 rounded-lg hover:bg-purple-200 disabled:opacity-50"
              >
                {isAnalyzing ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Sparkles className="w-4 h-4" />
                )}
                {isAnalyzing ? 'Analyzing...' : 'Re-Analyze with AI'}
              </button>
            )}
            <button
              onClick={() => setSelectedFile(null)}
              className="p-1.5 text-gray-400 hover:text-gray-600 rounded"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Upload Zone */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-all ${
          isDragging
            ? 'border-blue-500 bg-blue-50'
            : 'border-gray-300 hover:border-gray-400 hover:bg-gray-50'
        }`}
      >
        <Upload className={`w-12 h-12 mx-auto mb-4 ${isDragging ? 'text-blue-500' : 'text-gray-400'}`} />
        <p className="text-sm font-medium text-gray-900 mb-1">
          Upload your current Business Strategy & Plan
        </p>
        <p className="text-xs text-gray-500 mb-3">
          Drop files here or click to browse
        </p>
        <p className="text-xs text-gray-400">
          Supported: PDF, Word (.docx), Text (.txt, .md) — Max {MAX_SIZE_MB}MB
        </p>
        <input
          ref={fileInputRef}
          type="file"
          onChange={(e) => e.target.files && handleFile(e.target.files[0])}
          accept={ACCEPTED_EXTENSIONS.join(',')}
          className="hidden"
        />
      </div>

      {/* Error */}
      {error && (
        <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          {error}
        </div>
      )}

      {/* Selected File Preview */}
      {selectedFile && (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {selectedFile.type === 'application/pdf' ? (
                <FileText className="w-8 h-8 text-red-500" />
              ) : (
                <File className="w-8 h-8 text-blue-500" />
              )}
              <div>
                <p className="font-medium text-gray-900">{selectedFile.name}</p>
                <p className="text-sm text-gray-500">{formatFileSize(selectedFile.size)}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  setSelectedFile(null);
                  setExtractedText('');
                  setError(null);
                }}
                className="p-2 text-gray-400 hover:text-gray-600"
              >
                <X className="w-4 h-4" />
              </button>
              <button
                onClick={handleUpload}
                disabled={isUploading}
                className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                {isUploading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Uploading...
                  </>
                ) : (
                  <>
                    <Upload className="w-4 h-4" />
                    Upload & Start Review
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Text content paste area for binary files */}
          {!extractedText && (selectedFile.type === 'application/pdf' || selectedFile.name.endsWith('.docx')) && (
            <div className="mt-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Paste document content for AI analysis (optional)
              </label>
              <textarea
                value={extractedText}
                onChange={(e) => setExtractedText(e.target.value)}
                placeholder="For best AI analysis, paste the text content of your strategy document here. This enables Claude to analyze and provide recommendations..."
                rows={6}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm resize-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          )}
        </div>
      )}

      {/* Manual text entry option */}
      {!selectedFile && !existingDocument && !isManualEntry && (
        <div className="text-center">
          <p className="text-sm text-gray-500 mb-2">or</p>
          <button
            onClick={() => setIsManualEntry(true)}
            className="text-sm text-blue-600 hover:text-blue-700 font-medium"
          >
            Paste strategy content manually
          </button>
        </div>
      )}

      {/* Manual Entry Area */}
      {isManualEntry && !selectedFile && !existingDocument && (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Paste your strategy document content
          </label>
          <textarea
            value={extractedText}
            onChange={(e) => setExtractedText(e.target.value)}
            placeholder="Paste the full text content of your business strategy and plan here for AI analysis..."
            rows={10}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm resize-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
          <div className="flex items-center gap-2 mt-3">
            <button
              onClick={() => {
                if (!extractedText.trim()) return;
                const doc: UploadedStrategyDocument = {
                  fileName: 'manual-entry.txt',
                  fileUrl: '',
                  fileSize: extractedText.length,
                  mimeType: 'text/plain',
                  uploadedAt: new Date().toISOString(),
                  parsedContent: extractedText,
                };
                onDocumentUploaded(doc, extractedText);
                setIsManualEntry(false);
              }}
              disabled={!extractedText.trim()}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              <Upload className="w-4 h-4" />
              Start Review
            </button>
            <button
              onClick={() => {
                setIsManualEntry(false);
                setExtractedText('');
              }}
              className="px-3 py-2 text-sm text-gray-600 hover:text-gray-800"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default StrategyDocumentUpload;
