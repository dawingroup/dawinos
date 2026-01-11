import { useEffect, useMemo, useState } from 'react';
import { Pin, PinOff } from 'lucide-react';
import { MAIN_NAVIGATION, type NavItem } from '@/integration/constants/navigation.constants';
import { ScrollArea } from '@/core/components/ui/scroll-area';
import { Button } from '@/core/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/core/components/ui/tooltip';
import { cn } from '@/shared/lib/utils';
import { NavigationMenu } from '@/core/components/navigation/NavigationMenu';
import { useSidebar, useAuth } from '@/integration/store';

export interface UnifiedSidebarProps {
  items?: NavItem[];
  className?: string;
  collapsed?: boolean;
  onNavigate?: () => void;
}

export function UnifiedSidebar({ 
  items = MAIN_NAVIGATION, 
  className,
  collapsed = false,
  onNavigate,
}: UnifiedSidebarProps) {
  const { isPinned, expandedItems, togglePin } = useSidebar();
  const { displayName } = useAuth();
  const [localExpanded, setLocalExpanded] = useState<string[]>(expandedItems);

  const isCollapsed = collapsed;

  useEffect(() => {
    setLocalExpanded(expandedItems);
  }, [expandedItems]);

  const onToggleExpanded = (id: string) => {
    setLocalExpanded((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  };

  const filtered = useMemo(() => {
    return items;
  }, [items]);

  return (
    <aside
      className={cn(
        'border-r bg-background h-screen flex flex-col',
        isCollapsed ? 'w-16' : 'w-64',
        'transition-all duration-200',
        className
      )}
    >
      {/* Header */}
      <div className={cn(
        'h-14 flex items-center border-b shrink-0',
        isCollapsed ? 'justify-center px-2' : 'justify-between px-4'
      )}>
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center text-primary-foreground font-bold text-sm">
            D
          </div>
          {!isCollapsed && (
            <div>
              <div className="text-sm font-semibold">DawinOS</div>
              <div className="text-xs text-muted-foreground">v2.0</div>
            </div>
          )}
        </div>
        {!isCollapsed && (
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                onClick={() => togglePin?.()}
              >
                {isPinned ? (
                  <Pin className="h-3.5 w-3.5" />
                ) : (
                  <PinOff className="h-3.5 w-3.5 text-muted-foreground" />
                )}
              </Button>
            </TooltipTrigger>
            <TooltipContent side="right">
              {isPinned ? 'Unpin sidebar' : 'Pin sidebar'}
            </TooltipContent>
          </Tooltip>
        )}
      </div>

      {/* Navigation */}
      <ScrollArea className="flex-1">
        <div className={cn('py-3', isCollapsed ? 'px-2' : 'px-3')}>
          <NavigationMenu
            items={filtered}
            expandedItems={localExpanded}
            onToggleExpanded={onToggleExpanded}
            collapsed={isCollapsed}
            onNavigate={onNavigate}
          />
        </div>
      </ScrollArea>

      {/* User section */}
      {!isCollapsed && (
        <div className="p-3 border-t shrink-0">
          <div className="flex items-center gap-2 p-2 rounded-lg bg-muted/50">
            <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-sm font-medium">
              {displayName?.[0]?.toUpperCase() || 'U'}
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-sm font-medium truncate">{displayName || 'User'}</div>
              <div className="text-xs text-muted-foreground">Staff</div>
            </div>
          </div>
        </div>
      )}
    </aside>
  );
}
