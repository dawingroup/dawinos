/**
 * DetailDrawer Component
 * Slide-out drawer for displaying read-only/auto-populated content
 * Used to decongest main views while keeping details accessible
 */

import { useEffect, useRef } from 'react';
import { X, ChevronRight } from 'lucide-react';
import { cn } from '@/shared/lib/utils';

interface DetailDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  width?: 'sm' | 'md' | 'lg' | 'xl';
}

const widthClasses = {
  sm: 'max-w-sm',
  md: 'max-w-md',
  lg: 'max-w-lg',
  xl: 'max-w-xl',
};

export function DetailDrawer({
  isOpen,
  onClose,
  title,
  subtitle,
  children,
  width = 'md',
}: DetailDrawerProps) {
  const drawerRef = useRef<HTMLDivElement>(null);

  // Handle escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  // Prevent body scroll when drawer is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/30 transition-opacity"
        onClick={onClose}
      />

      {/* Drawer */}
      <div
        ref={drawerRef}
        className={cn(
          'relative w-full bg-white shadow-xl flex flex-col transform transition-transform duration-300 ease-out',
          widthClasses[width],
          isOpen ? 'translate-x-0' : 'translate-x-full'
        )}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 bg-gray-50">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
            {subtitle && (
              <p className="text-sm text-gray-500">{subtitle}</p>
            )}
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4">
          {children}
        </div>
      </div>
    </div>
  );
}

// Trigger button component for consistency
interface DrawerTriggerProps {
  label: string;
  sublabel?: string;
  icon?: React.ReactNode;
  onClick: () => void;
  variant?: 'default' | 'card' | 'compact';
  badge?: string | number;
}

export function DrawerTrigger({
  label,
  sublabel,
  icon,
  onClick,
  variant = 'default',
  badge,
}: DrawerTriggerProps) {
  if (variant === 'card') {
    return (
      <button
        onClick={onClick}
        className="w-full bg-white border border-gray-200 rounded-lg p-4 hover:border-gray-300 hover:shadow-sm transition-all text-left group"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {icon && <span className="text-gray-400 group-hover:text-gray-600">{icon}</span>}
            <div>
              <p className="font-medium text-gray-900">{label}</p>
              {sublabel && <p className="text-sm text-gray-500">{sublabel}</p>}
            </div>
          </div>
          <div className="flex items-center gap-2">
            {badge !== undefined && (
              <span className="px-2 py-0.5 bg-gray-100 text-gray-600 text-xs font-medium rounded-full">
                {badge}
              </span>
            )}
            <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-gray-600" />
          </div>
        </div>
      </button>
    );
  }

  if (variant === 'compact') {
    return (
      <button
        onClick={onClick}
        className="inline-flex items-center gap-1 text-sm text-[#0A7C8E] hover:text-[#0A7C8E]/80 font-medium"
      >
        {label}
        <ChevronRight className="w-4 h-4" />
      </button>
    );
  }

  // Default variant
  return (
    <button
      onClick={onClick}
      className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-700 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors"
    >
      {icon}
      {label}
      {badge !== undefined && (
        <span className="px-1.5 py-0.5 bg-gray-200 text-gray-600 text-xs font-medium rounded">
          {badge}
        </span>
      )}
      <ChevronRight className="w-4 h-4 text-gray-400" />
    </button>
  );
}

export default DetailDrawer;
