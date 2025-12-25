/**
 * Cutlist Processor Page
 * Wrapper page for the Cutlist Processor module
 * 
 * This currently renders the existing App component functionality.
 * In a full migration, this would import from the cutlist-processor module.
 */

export default function CutlistProcessorPage() {
  return (
    <div className="h-full">
      <div className="mb-4">
        <h1 className="text-2xl font-bold text-gray-900">Cutlist Processor</h1>
        <p className="text-gray-600 mt-1">
          Upload CSV, optimize cutting patterns, and generate workshop outputs.
        </p>
      </div>
      
      {/* 
        TODO: During full migration, replace this with the actual Cutlist module component.
        For now, the existing functionality remains in App.jsx and will be
        integrated once routing is fully set up.
      */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <p className="text-gray-600">
          The Cutlist Processor module will be fully integrated here after routing setup.
          Currently, the existing functionality is available at the root URL.
        </p>
        <a 
          href="/" 
          className="inline-flex items-center gap-1 text-sm font-medium text-[#872E5C] hover:text-[#6a2449] mt-4"
        >
          Go to Current Cutlist Processor →
        </a>
      </div>
    </div>
  );
}
