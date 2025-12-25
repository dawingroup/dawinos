import React, { useState, useRef } from 'react';
import { Upload, FileSpreadsheet, AlertCircle, CheckCircle, Cloud, GitBranch } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { parseCSV } from '../utils/csvParser';

const FileUpload = ({ onFileUpload, disabled }) => {
  const { user, getGoogleAccessToken } = useAuth();
  const [dragActive, setDragActive] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [parseStats, setParseStats] = useState(null);
  const fileInputRef = useRef(null);

  // Handle local file upload
  const handleFileSelect = async (file) => {
    if (!file) return;
    
    if (file.type !== 'text/csv' && !file.name.endsWith('.csv')) {
      setError('Please select a CSV file');
      return;
    }

    setUploading(true);
    setError(null);
    setSuccess(null);
    setParseStats(null);

    try {
      const text = await file.text();
      console.log('Raw CSV text:', text.substring(0, 500) + '...');
      
      // Use new csvParser with multi-part label support
      const result = parseCSV(text, { expandMultiPart: true });
      const data = result.rows;
      const stats = result.stats;
      
      console.log('Parsed CSV data:', data);
      console.log('Parse stats:', stats);
      
      if (data.length === 0) {
        throw new Error('CSV file appears to be empty or no valid rows found');
      }

      setParseStats(stats);
      
      // Build success message with split info
      let successMsg = `Successfully loaded ${data.length} rows from ${file.name}`;
      if (stats.splitRows > 0) {
        successMsg += ` (${stats.splitRows} parts expanded from multi-part labels)`;
      }
      
      setSuccess(successMsg);
      onFileUpload(data, file.name);
    } catch (err) {
      console.error('Error processing file:', err);
      setError(`Error processing file: ${err.message}`);
    } finally {
      setUploading(false);
    }
  };

  // Handle drag and drop
  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelect(e.dataTransfer.files[0]);
    }
  };

  // Handle file input change
  const handleInputChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      handleFileSelect(e.target.files[0]);
    }
  };

  // Open Google Drive Picker
  const openDrivePicker = () => {
    if (!user) {
      setError('Please sign in to access Google Drive');
      return;
    }

    const accessToken = getGoogleAccessToken();
    console.log('Opening Drive Picker with token:', accessToken ? 'Token present' : 'No token');
    
    if (!accessToken) {
      setError('Google Drive access not available. Please sign out and sign in again.');
      return;
    }

    // Load Google Picker API
    const loadPicker = () => {
      if (window.gapi && window.gapi.client) {
        window.gapi.load('picker', () => {
          console.log('Google Picker API loaded');
          createPicker(accessToken);
        });
      } else {
        console.log('Loading Google API...');
        const script = document.createElement('script');
        script.src = 'https://apis.google.com/js/api.js';
        script.onload = () => {
          console.log('Google API script loaded');
          window.gapi.load('picker', () => {
            console.log('Google Picker API loaded');
            createPicker(accessToken);
          });
        };
        script.onerror = () => {
          setError('Failed to load Google Picker API');
        };
        document.head.appendChild(script);
      }
    };

    loadPicker();
  };

  const createPicker = (accessToken) => {
    try {
      console.log('Creating picker with API key:', import.meta.env.VITE_GOOGLE_API_KEY ? 'Key present' : 'No key');
      
      // Create a view that shows all files, filtered to CSV
      const docsView = new window.google.picker.DocsView()
        .setIncludeFolders(true)
        .setMimeTypes('text/csv,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      
      const picker = new window.google.picker.PickerBuilder()
        .addView(docsView)
        .addView(new window.google.picker.DocsUploadView())
        .setOAuthToken(accessToken)
        .setDeveloperKey(import.meta.env.VITE_GOOGLE_API_KEY)
        .setCallback(handlePickerCallback)
        .setTitle('Select a CSV file from Google Drive')
        .build();
      
      picker.setVisible(true);
      console.log('Picker should be visible now');
    } catch (error) {
      console.error('Error creating picker:', error);
      setError(`Failed to create Google Drive picker: ${error.message}`);
    }
  };

  const handlePickerCallback = async (data) => {
    if (data.action === window.google.picker.Action.PICKED) {
      const file = data.docs[0];
      setUploading(true);
      setError(null);
      setSuccess(null);
      setParseStats(null);

      try {
        // Download file content from Google Drive
        const response = await fetch(`https://www.googleapis.com/drive/v3/files/${file.id}?alt=media`, {
          headers: {
            'Authorization': `Bearer ${getGoogleAccessToken()}`
          }
        });

        if (!response.ok) {
          throw new Error('Failed to download file from Google Drive');
        }

        const text = await response.text();
        
        // Use new csvParser with multi-part label support
        const result = parseCSV(text, { expandMultiPart: true });
        const rows = result.rows;
        const stats = result.stats;
        
        if (rows.length === 0) {
          throw new Error('CSV file appears to be empty');
        }

        setParseStats(stats);
        
        let successMsg = `Successfully loaded ${rows.length} rows from ${file.name}`;
        if (stats.splitRows > 0) {
          successMsg += ` (${stats.splitRows} parts expanded from multi-part labels)`;
        }
        
        setSuccess(successMsg);
        onFileUpload(rows, file.name);
      } catch (err) {
        console.error('Error downloading from Drive:', err);
        setError(`Error downloading file: ${err.message}`);
      } finally {
        setUploading(false);
      }
    }
  };

  return (
    <div className="space-y-4">
      {/* Hidden file input - moved outside the drag area */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".csv"
        onChange={handleInputChange}
        disabled={disabled || uploading}
        className="hidden"
      />
      
      {/* Drag and Drop Area */}
      <div
        className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors cursor-pointer ${
          dragActive
            ? 'border-boysenberry bg-boysenberry/5'
            : disabled
            ? 'border-gray-200 bg-gray-50'
            : 'border-gray-300 hover:border-boysenberry/50'
        }`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
      >
        <div className="space-y-2">
          <div className="flex justify-center">
            {uploading ? (
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-boysenberry"></div>
            ) : (
              <FileSpreadsheet className="h-10 w-10 text-gray-400" />
            )}
          </div>
          
          <div>
            <p className="text-base font-medium text-gray-900">
              {uploading ? 'Processing file...' : 'Drag & Drop CSV File'}
            </p>
            <p className="text-sm text-gray-500">
              or click to browse local files
            </p>
          </div>
        </div>
      </div>

      {/* Action Buttons - separate from drag area */}
      <div className="flex justify-center space-x-4">
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={disabled || uploading}
          className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Upload className="h-4 w-4 mr-2" />
          Browse Files
        </button>

        {user && (
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              openDrivePicker();
            }}
            disabled={disabled || uploading}
            className="inline-flex items-center px-4 py-2 border border-teal rounded-md shadow-sm text-sm font-medium text-teal bg-seaform/10 hover:bg-seaform/20 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Cloud className="h-4 w-4 mr-2" />
            Google Drive
          </button>
        )}
      </div>

      {/* Parse Stats */}
      {parseStats && parseStats.splitRows > 0 && (
        <div className="bg-goldenBell/10 border border-goldenBell/30 rounded-lg p-3">
          <div className="flex items-center gap-2 text-sm text-goldenBell-dark">
            <GitBranch size={16} />
            <span>
              <strong>{parseStats.splitRows}</strong> parts were expanded from multi-part labels 
              (original: {parseStats.originalRows} rows → processed: {parseStats.totalRows} rows)
            </span>
          </div>
        </div>
      )}

      {/* Status Messages */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center space-x-2">
            <AlertCircle className="h-5 w-5 text-red-600" />
            <span className="text-red-800">{error}</span>
          </div>
        </div>
      )}

      {success && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-center space-x-2">
            <CheckCircle className="h-5 w-5 text-green-600" />
            <span className="text-green-800">{success}</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default FileUpload;
