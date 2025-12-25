import React from 'react';
import { GitBranch, Layers } from 'lucide-react';

/**
 * Visual indicator for split or grouped parts
 */
const SplitIndicator = ({ row }) => {
  if (row._isGrouped) {
    return (
      <span 
        className="inline-flex items-center gap-1 text-xs text-teal bg-seaform/20 px-2 py-0.5 rounded cursor-help"
        title={`Grouped ${row._groupCount} identical parts: ${row._originalLabels}`}
      >
        <Layers size={12} />
        ×{row._groupCount}
      </span>
    );
  }
  
  if (row._isSplit) {
    return (
      <span 
        className="inline-flex items-center gap-1 text-xs text-goldenBell bg-goldenBell/10 px-2 py-0.5 rounded cursor-help"
        title={`Split from: ${row._splitFrom} (${row._splitIndex}/${row._splitCount})`}
      >
        <GitBranch size={12} />
        {row._splitIndex}/{row._splitCount}
      </span>
    );
  }
  
  return null;
};

export default SplitIndicator;
