/**
 * BOQ Import Page
 */

import React, { useState, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { PageHeader } from '../components/layout/PageHeader';
import { 
  Upload, 
  FileSpreadsheet, 
  Loader2, 
  CheckCircle2, 
  AlertCircle,
  X,
  FileText,
  FileUp,
  FileSearch,
  Sparkles,
  Database,
  Check
} from 'lucide-react';
import { useBOQParsing } from '../hooks/useBOQParsing';

// Parsing stages with descriptions
const PARSING_STAGES = [
  { id: 'upload', label: 'Uploading', description: 'Uploading file to server', icon: FileUp },
  { id: 'analyze', label: 'Analyzing', description: 'Analyzing file structure', icon: FileSearch },
  { id: 'extract', label: 'Extracting', description: 'Extracting BOQ items with AI', icon: Sparkles },
  { id: 'match', label: 'Matching', description: 'Matching to material library', icon: Database },
  { id: 'complete', label: 'Complete', description: 'Ready for review', icon: Check },
];

const BOQImport: React.FC = () => {
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [isDragging, setIsDragging] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  
  const [isImporting, setIsImporting] = useState(false);
  const [importSuccess, setImportSuccess] = useState(false);
  
  const {
    activeJob,
    isProcessing,
    isUploading,
    progress,
    parsedItems,
    error,
    startParsing,
    importItems,
    clearActiveJob,
  } = useBOQParsing({ projectId: projectId || '' });

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      handleFileSelect(files[0]);
    }
  }, []);

  const handleFileSelect = (file: File) => {
    const validExtensions = ['.xlsx', '.xls', '.csv', '.pdf'];
    const extension = '.' + file.name.split('.').pop()?.toLowerCase();
    
    if (!validExtensions.includes(extension)) {
      alert('Please upload a valid BOQ file (.xlsx, .xls, .csv, or .pdf)');
      return;
    }
    
    setSelectedFile(file);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleFileSelect(files[0]);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) return;
    
    try {
      await startParsing(selectedFile);
    } catch (err) {
      console.error('Upload failed:', err);
    }
  };

  const handleClear = () => {
    setSelectedFile(null);
    clearActiveJob();
    setImportSuccess(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleImport = async () => {
    console.log('handleImport called, parsedItems:', parsedItems);
    
    if (!parsedItems || parsedItems.length === 0) {
      console.error('No parsed items to import');
      alert('No items to import. Please parse a BOQ file first.');
      return;
    }
    
    setIsImporting(true);
    try {
      console.log('Calling importItems with', parsedItems.length, 'items');
      const importedIds = await importItems(parsedItems);
      console.log('Import result:', importedIds);
      
      if (importedIds && importedIds.length > 0) {
        setImportSuccess(true);
        // Navigate to project after short delay
        setTimeout(() => {
          navigate(`/advisory/matflow/projects/${projectId}`);
        }, 1500);
      } else {
        console.warn('Import returned empty or no IDs');
        alert('Import completed but no items were imported. Check console for details.');
      }
    } catch (err) {
      console.error('Import failed:', err);
      alert(`Import failed: ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      setIsImporting(false);
    }
  };

  // Determine current stage based on progress
  const getCurrentStage = () => {
    if (!activeJob && !isUploading) return -1;
    if (isUploading) return 0;
    if (!activeJob) return -1;
    
    if (activeJob.status === 'completed') return 4;
    if (activeJob.status === 'failed') return -1;
    
    // Map progress percentage to stages
    if (progress < 15) return 1; // Analyzing
    if (progress < 60) return 2; // Extracting
    if (progress < 90) return 3; // Matching
    return 3;
  };

  const currentStage = getCurrentStage();

  const getStatusMessage = () => {
    if (!activeJob && !isUploading) return null;
    if (isUploading) return 'Uploading file...';
    if (!activeJob) return null;
    
    switch (activeJob.status) {
      case 'pending':
        return 'Preparing to parse...';
      case 'processing':
        const stage = PARSING_STAGES[currentStage];
        return stage ? `${stage.description}...` : `Processing... ${progress}%`;
      case 'completed':
        return `Successfully parsed ${parsedItems.length} items!`;
      case 'failed':
        return error || 'Parsing failed';
      default:
        return activeJob.status;
    }
  };

  return (
    <div>
      <PageHeader
        title="Import BOQ"
        description="Upload and parse Bill of Quantities from Excel or PDF"
        breadcrumbs={[
          { label: 'MatFlow', href: '/advisory/matflow' },
          { label: 'Projects', href: '/advisory/matflow/projects' },
          { label: 'Project', href: `/advisory/matflow/projects/${projectId}` },
          { label: 'Import BOQ' },
        ]}
      />
      
      <div className="p-6 max-w-3xl">
        {/* Error Message */}
        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-red-700 font-medium">Upload Error</p>
              <p className="text-red-600 text-sm">{error}</p>
            </div>
          </div>
        )}

        {/* Upload Area */}
        <div
          className={`bg-white rounded-lg border-2 border-dashed p-12 text-center transition-colors ${
            isDragging 
              ? 'border-amber-500 bg-amber-50' 
              : selectedFile 
                ? 'border-green-300 bg-green-50' 
                : 'border-gray-200 hover:border-gray-300'
          }`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept=".xlsx,.xls,.csv,.pdf"
            onChange={handleInputChange}
            className="hidden"
          />
          
          {!selectedFile ? (
            <>
              <Upload className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Upload BOQ File</h3>
              <p className="text-gray-500 mb-4">Drag and drop or click to upload</p>
              <button
                onClick={() => fileInputRef.current?.click()}
                className="px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700"
              >
                Select File
              </button>
              <p className="text-sm text-gray-400 mt-4">Supported: .xlsx, .xls, .csv, .pdf</p>
            </>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-center gap-3">
                <FileSpreadsheet className="w-10 h-10 text-green-600" />
                <div className="text-left">
                  <p className="font-medium text-gray-900">{selectedFile.name}</p>
                  <p className="text-sm text-gray-500">
                    {(selectedFile.size / 1024).toFixed(1)} KB
                  </p>
                </div>
                {!isProcessing && !activeJob && (
                  <button
                    onClick={handleClear}
                    className="p-1 text-gray-400 hover:text-gray-600"
                  >
                    <X className="w-5 h-5" />
                  </button>
                )}
              </div>
              
              {/* Enhanced Progress UI */}
              {(isProcessing || isUploading || activeJob?.status === 'completed') && (
                <div className="w-full max-w-md mx-auto space-y-4">
                  {/* Stage Indicators */}
                  <div className="flex items-center justify-between">
                    {PARSING_STAGES.map((stage, index) => {
                      const StageIcon = stage.icon;
                      const isActive = currentStage === index;
                      const isComplete = currentStage > index || activeJob?.status === 'completed';
                      const isFailed = activeJob?.status === 'failed' && currentStage === index;
                      
                      return (
                        <div key={stage.id} className="flex flex-col items-center">
                          <div className={`
                            w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300
                            ${isComplete ? 'bg-green-100 text-green-600' :
                              isActive ? 'bg-amber-100 text-amber-600' :
                              isFailed ? 'bg-red-100 text-red-600' :
                              'bg-gray-100 text-gray-400'}
                          `}>
                            {isActive && !isComplete ? (
                              <Loader2 className="w-5 h-5 animate-spin" />
                            ) : isComplete ? (
                              <CheckCircle2 className="w-5 h-5" />
                            ) : isFailed ? (
                              <AlertCircle className="w-5 h-5" />
                            ) : (
                              <StageIcon className="w-5 h-5" />
                            )}
                          </div>
                          <span className={`text-xs mt-1 font-medium ${
                            isComplete ? 'text-green-600' :
                            isActive ? 'text-amber-600' :
                            isFailed ? 'text-red-600' :
                            'text-gray-400'
                          }`}>
                            {stage.label}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                  
                  {/* Connecting Lines */}
                  <div className="relative -mt-12 mx-5">
                    <div className="absolute top-5 left-0 right-0 h-0.5 bg-gray-200" />
                    <div 
                      className="absolute top-5 left-0 h-0.5 bg-green-500 transition-all duration-500"
                      style={{ width: `${Math.min(100, (currentStage / 4) * 100)}%` }}
                    />
                  </div>
                  
                  {/* Progress Bar */}
                  <div className="pt-4">
                    <div className="flex justify-between text-xs text-gray-500 mb-1">
                      <span>{getStatusMessage()}</span>
                      <span>{activeJob?.status === 'completed' ? '100%' : `${progress}%`}</span>
                    </div>
                    <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                      <div 
                        className={`h-full transition-all duration-300 ${
                          activeJob?.status === 'completed' ? 'bg-green-500' :
                          activeJob?.status === 'failed' ? 'bg-red-500' :
                          'bg-amber-500'
                        }`}
                        style={{ width: `${activeJob?.status === 'completed' ? 100 : progress}%` }}
                      />
                    </div>
                  </div>
                  
                  {/* Parsed Items Preview */}
                  {activeJob?.status === 'completed' && parsedItems.length > 0 && (
                    <div className="bg-green-50 rounded-lg p-3 text-sm">
                      <div className="flex items-center gap-2 text-green-700 font-medium">
                        <CheckCircle2 className="w-4 h-4" />
                        Parsing Complete!
                      </div>
                      <p className="text-green-600 mt-1">
                        Found {parsedItems.length} BOQ items ready for import.
                      </p>
                    </div>
                  )}
                  
                  {/* Error Display */}
                  {activeJob?.status === 'failed' && (
                    <div className="bg-red-50 rounded-lg p-3 text-sm">
                      <div className="flex items-center gap-2 text-red-700 font-medium">
                        <AlertCircle className="w-4 h-4" />
                        Parsing Failed
                      </div>
                      <p className="text-red-600 mt-1">
                        {error || 'An error occurred during parsing. Please try again.'}
                      </p>
                    </div>
                  )}
                </div>
              )}
              
              {/* Actions */}
              <div className="flex items-center justify-center gap-3 pt-2">
                {!activeJob && (
                  <button
                    onClick={handleUpload}
                    disabled={isUploading}
                    className="px-6 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 disabled:opacity-50 flex items-center gap-2"
                  >
                    {isUploading ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Uploading...
                      </>
                    ) : (
                      <>
                        <Upload className="w-4 h-4" />
                        Start Parsing
                      </>
                    )}
                  </button>
                )}
                
                {activeJob?.status === 'completed' && parsedItems.length > 0 && !importSuccess && (
                  <button
                    onClick={handleImport}
                    disabled={isImporting}
                    className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 flex items-center gap-2"
                  >
                    {isImporting ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Importing {parsedItems.length} items...
                      </>
                    ) : (
                      <>
                        <Database className="w-4 h-4" />
                        Import {parsedItems.length} Items to BOQ
                      </>
                    )}
                  </button>
                )}
                
                {importSuccess && (
                  <div className="flex items-center gap-2 text-green-600 font-medium">
                    <CheckCircle2 className="w-5 h-5" />
                    Successfully imported! Redirecting...
                  </div>
                )}
                
                {(activeJob?.status === 'completed' || activeJob?.status === 'failed') && (
                  <button
                    onClick={handleClear}
                    className="px-4 py-2 text-gray-600 hover:text-gray-800"
                  >
                    Upload Another
                  </button>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Instructions */}
        <div className="mt-6 bg-blue-50 rounded-lg border border-blue-200 p-4">
          <h4 className="font-medium text-blue-900 mb-2 flex items-center gap-2">
            <FileText className="w-4 h-4" />
            BOQ Format Guidelines
          </h4>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>• Excel files should have headers: Item No, Description, Unit, Qty, Rate, Amount</li>
            <li>• Multiple sheets are supported - BOQ items will be extracted from all sheets</li>
            <li>• PDF files will be processed using AI extraction (may take longer)</li>
            <li>• Items will be matched to materials in your library automatically</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default BOQImport;
