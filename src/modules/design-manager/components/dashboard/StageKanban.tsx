/**
 * Stage Kanban Component
 * Kanban board with columns for each design stage
 */

import { useState } from 'react';
import { Link } from 'react-router-dom';
import { cn } from '@/shared/lib/utils';
import type { DesignItem, DesignStage } from '../../types';
import { STAGE_LABELS, STAGE_ICONS } from '../../utils/formatting';
import { STAGE_ORDER, canAdvanceToStage } from '../../utils/stage-gate';
import { DesignItemCard } from '../design-item/DesignItemCard';
import { StageGateCheck } from '../stage-gate/StageGateCheck';
import { transitionStage } from '../../services/firestore';
import { useAuth } from '@/shared/hooks';

export interface StageKanbanProps {
  items: DesignItem[];
  projectId: string;
}

export function StageKanban({ items, projectId }: StageKanbanProps) {
  const { user } = useAuth();
  const [draggedItem, setDraggedItem] = useState<DesignItem | null>(null);
  const [targetStage, setTargetStage] = useState<DesignStage | null>(null);
  const [showGateCheck, setShowGateCheck] = useState(false);
  const [pendingItem, setPendingItem] = useState<DesignItem | null>(null);

  // Group items by stage
  const itemsByStage = STAGE_ORDER.reduce((acc, stage) => {
    acc[stage] = items.filter(item => item.currentStage === stage);
    return acc;
  }, {} as Record<DesignStage, DesignItem[]>);

  const handleDragStart = (e: React.DragEvent, item: DesignItem) => {
    setDraggedItem(item);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent, stage: DesignStage) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setTargetStage(stage);
  };

  const handleDragLeave = () => {
    setTargetStage(null);
  };

  const handleDrop = async (e: React.DragEvent, stage: DesignStage) => {
    e.preventDefault();
    setTargetStage(null);

    if (!draggedItem || draggedItem.currentStage === stage) {
      setDraggedItem(null);
      return;
    }

    // Check if gate allows advancement
    const gateCheck = canAdvanceToStage(draggedItem, stage);
    
    if (gateCheck.canAdvance) {
      // Direct transition
      try {
        await transitionStage(
          projectId,
          draggedItem.id,
          stage,
          user?.email || '',
          'Moved via kanban'
        );
      } catch (err) {
        console.error('Failed to transition stage:', err);
      }
    } else {
      // Show gate check modal
      setPendingItem(draggedItem);
      setShowGateCheck(true);
    }

    setDraggedItem(null);
  };

  const handleAdvance = async (
    item: DesignItem, 
    stage: DesignStage, 
    overrideNote?: string
  ) => {
    try {
      await transitionStage(
        projectId,
        item.id,
        stage,
        user?.email || '',
        overrideNote || 'Moved via kanban',
        !!overrideNote
      );
    } catch (err) {
      console.error('Failed to transition stage:', err);
    }
    setShowGateCheck(false);
    setPendingItem(null);
  };

  return (
    <>
      <div className="flex gap-4 overflow-x-auto pb-4">
        {STAGE_ORDER.map((stage) => (
          <div
            key={stage}
            className={cn(
              'flex-shrink-0 w-72 bg-gray-50 rounded-lg',
              targetStage === stage && 'ring-2 ring-[#0A7C8E] ring-offset-2'
            )}
            onDragOver={(e) => handleDragOver(e, stage)}
            onDragLeave={handleDragLeave}
            onDrop={(e) => handleDrop(e, stage)}
          >
            {/* Column Header */}
            <div className="p-3 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-lg">{STAGE_ICONS[stage]}</span>
                  <h3 className="font-medium text-gray-900 text-sm">
                    {STAGE_LABELS[stage]}
                  </h3>
                </div>
                <span className="text-xs bg-gray-200 text-gray-600 px-2 py-0.5 rounded-full">
                  {itemsByStage[stage].length}
                </span>
              </div>
            </div>

            {/* Column Content */}
            <div className="p-2 space-y-2 min-h-[200px]">
              {itemsByStage[stage].length === 0 ? (
                <div className="text-center text-sm text-gray-400 py-8">
                  No items
                </div>
              ) : (
                itemsByStage[stage].map((item) => (
                  <div
                    key={item.id}
                    draggable
                    onDragStart={(e) => handleDragStart(e, item)}
                    className={cn(
                      'cursor-grab active:cursor-grabbing',
                      draggedItem?.id === item.id && 'opacity-50'
                    )}
                  >
                    <Link to={`item/${item.id}`}>
                      <DesignItemCard item={item} compact />
                    </Link>
                  </div>
                ))
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Stage Gate Check Modal */}
      {showGateCheck && pendingItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div 
            className="absolute inset-0 bg-black/50" 
            onClick={() => {
              setShowGateCheck(false);
              setPendingItem(null);
            }}
          />
          <div className="relative max-w-md w-full mx-4">
            <StageGateCheck
              item={pendingItem}
              onAdvance={handleAdvance}
              onCancel={() => {
                setShowGateCheck(false);
                setPendingItem(null);
              }}
              allowOverride
            />
          </div>
        </div>
      )}
    </>
  );
}

export default StageKanban;
