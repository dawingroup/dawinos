import { Scissors, RefreshCw } from 'lucide-react';

interface QuickActionsProps {
  onStartClipping: () => void;
  onSyncNow: () => void;
}

export default function QuickActions({ onStartClipping, onSyncNow }: QuickActionsProps) {
  return (
    <div className="bg-white border-b px-4 py-3 flex gap-2">
      <button
        onClick={onStartClipping}
        className="flex-1 flex items-center justify-center gap-2 bg-primary text-white py-2 px-4 rounded-lg font-medium text-sm hover:bg-blue-700 transition-colors"
      >
        <Scissors className="w-4 h-4" />
        Start Clipping
      </button>
      
      <button
        onClick={onSyncNow}
        className="flex items-center justify-center gap-2 bg-gray-100 text-gray-700 py-2 px-4 rounded-lg font-medium text-sm hover:bg-gray-200 transition-colors"
        title="Sync now"
      >
        <RefreshCw className="w-4 h-4" />
      </button>
    </div>
  );
}
