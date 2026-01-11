/**
 * CommandPalette Component
 * Global search and quick navigation with Cmd+K shortcut
 */

import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Search,
  Star,
  Clock,
  ArrowRight,
  Command,
  CornerDownLeft,
} from 'lucide-react';
import * as LucideIcons from 'lucide-react';
import { cn } from '@/shared/lib/utils';
import {
  Dialog,
  DialogContent,
} from '@/core/components/ui/dialog';
import { Input } from '@/core/components/ui/input';
import { ScrollArea } from '@/core/components/ui/scroll-area';

export interface CommandItem {
  id: string;
  label: string;
  description?: string;
  path: string;
  icon?: string;
  category: 'navigation' | 'action' | 'recent' | 'favorite';
  keywords?: string[];
}

interface CommandPaletteProps {
  items: CommandItem[];
  recentItems?: string[];
  favoriteItems?: string[];
  onAddFavorite?: (id: string) => void;
  onRemoveFavorite?: (id: string) => void;
  onSelect?: () => void;
}

export function CommandPalette({
  items,
  recentItems = [],
  favoriteItems = [],
  onAddFavorite,
  onRemoveFavorite,
  onSelect,
}: CommandPaletteProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

  // Handle keyboard shortcut
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if ((e.key === 'k' && (e.metaKey || e.ctrlKey)) || e.key === '/') {
        e.preventDefault();
        setOpen((prev) => !prev);
      }
    };

    document.addEventListener('keydown', down);
    return () => document.removeEventListener('keydown', down);
  }, []);

  // Reset state when dialog opens
  useEffect(() => {
    if (open) {
      setQuery('');
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 0);
    }
  }, [open]);

  const getIcon = (iconName?: string) => {
    if (!iconName) return null;
    const Icon = (LucideIcons as unknown as Record<string, React.ComponentType<{ className?: string }>>)[iconName];
    return Icon ? <Icon className="h-4 w-4" /> : null;
  };

  // Filter and sort items
  const filteredItems = useMemo(() => {
    const lowerQuery = query.toLowerCase().trim();
    
    if (!lowerQuery) {
      // Show favorites first, then recent, then all navigation
      const favorites = items.filter(item => favoriteItems.includes(item.id));
      const recent = items.filter(item => recentItems.includes(item.id) && !favoriteItems.includes(item.id));
      const others = items.filter(item => !favoriteItems.includes(item.id) && !recentItems.includes(item.id));
      
      return [
        ...favorites.map(item => ({ ...item, category: 'favorite' as const })),
        ...recent.map(item => ({ ...item, category: 'recent' as const })),
        ...others.slice(0, 10),
      ];
    }

    return items
      .filter(item => {
        const searchText = [
          item.label,
          item.description,
          ...(item.keywords || []),
        ].join(' ').toLowerCase();
        return searchText.includes(lowerQuery);
      })
      .slice(0, 15);
  }, [items, query, recentItems, favoriteItems]);

  // Keyboard navigation
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex(prev => Math.min(prev + 1, filteredItems.length - 1));
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex(prev => Math.max(prev - 1, 0));
        break;
      case 'Enter':
        e.preventDefault();
        if (filteredItems[selectedIndex]) {
          navigate(filteredItems[selectedIndex].path);
          setOpen(false);
          onSelect?.();
        }
        break;
      case 'Escape':
        setOpen(false);
        break;
    }
  }, [filteredItems, selectedIndex, navigate]);

  const handleSelect = (item: CommandItem) => {
    navigate(item.path);
    setOpen(false);
    onSelect?.();
  };

  const toggleFavorite = (e: React.MouseEvent, item: CommandItem) => {
    e.stopPropagation();
    if (favoriteItems.includes(item.id)) {
      onRemoveFavorite?.(item.id);
    } else {
      onAddFavorite?.(item.id);
    }
  };

  // Group items by category for display
  const groupedItems = useMemo(() => {
    const groups: Record<string, CommandItem[]> = {
      favorite: [],
      recent: [],
      navigation: [],
      action: [],
    };

    filteredItems.forEach(item => {
      groups[item.category]?.push(item);
    });

    return groups;
  }, [filteredItems]);

  return (
    <>
      {/* Trigger Button */}
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 px-3 py-1.5 text-sm text-muted-foreground bg-muted/50 hover:bg-muted rounded-lg border border-border/50 transition-colors"
      >
        <Search className="h-4 w-4" />
        <span className="hidden sm:inline">Search...</span>
        <kbd className="hidden sm:inline-flex items-center gap-0.5 px-1.5 py-0.5 text-xs bg-background rounded border">
          <Command className="h-3 w-3" />
          <span>K</span>
        </kbd>
      </button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="p-0 gap-0 max-w-xl overflow-hidden">
          {/* Search Input */}
          <div className="flex items-center gap-3 px-4 py-3 border-b">
            <Search className="h-5 w-5 text-muted-foreground shrink-0" />
            <Input
              ref={inputRef}
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setSelectedIndex(0);
              }}
              onKeyDown={handleKeyDown}
              placeholder="Search pages, actions..."
              className="border-0 p-0 h-auto text-base focus-visible:ring-0 shadow-none"
            />
          </div>

          {/* Results */}
          <ScrollArea className="max-h-[400px]">
            <div className="p-2">
              {filteredItems.length === 0 ? (
                <div className="py-8 text-center text-muted-foreground">
                  <Search className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p>No results found</p>
                </div>
              ) : (
                <>
                  {/* Favorites Section */}
                  {groupedItems.favorite.length > 0 && (
                    <div className="mb-2">
                      <div className="px-2 py-1.5 text-xs font-medium text-muted-foreground flex items-center gap-1">
                        <Star className="h-3 w-3" />
                        Favorites
                      </div>
                      {groupedItems.favorite.map((item, index) => (
                        <CommandItemRow
                          key={item.id}
                          item={item}
                          selected={index === selectedIndex}
                          isFavorite={favoriteItems.includes(item.id)}
                          onSelect={() => handleSelect(item)}
                          onToggleFavorite={(e) => toggleFavorite(e, item)}
                          getIcon={getIcon}
                        />
                      ))}
                    </div>
                  )}

                  {/* Recent Section */}
                  {groupedItems.recent.length > 0 && (
                    <div className="mb-2">
                      <div className="px-2 py-1.5 text-xs font-medium text-muted-foreground flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        Recent
                      </div>
                      {groupedItems.recent.map((item, index) => {
                        const actualIndex = groupedItems.favorite.length + index;
                        return (
                          <CommandItemRow
                            key={item.id}
                            item={item}
                            selected={actualIndex === selectedIndex}
                            isFavorite={favoriteItems.includes(item.id)}
                            onSelect={() => handleSelect(item)}
                            onToggleFavorite={(e) => toggleFavorite(e, item)}
                            getIcon={getIcon}
                          />
                        );
                      })}
                    </div>
                  )}

                  {/* Navigation Items */}
                  {groupedItems.navigation.length > 0 && (
                    <div>
                      {(groupedItems.favorite.length > 0 || groupedItems.recent.length > 0) && (
                        <div className="px-2 py-1.5 text-xs font-medium text-muted-foreground">
                          Pages
                        </div>
                      )}
                      {groupedItems.navigation.map((item, index) => {
                        const actualIndex = groupedItems.favorite.length + groupedItems.recent.length + index;
                        return (
                          <CommandItemRow
                            key={item.id}
                            item={item}
                            selected={actualIndex === selectedIndex}
                            isFavorite={favoriteItems.includes(item.id)}
                            onSelect={() => handleSelect(item)}
                            onToggleFavorite={(e) => toggleFavorite(e, item)}
                            getIcon={getIcon}
                          />
                        );
                      })}
                    </div>
                  )}
                </>
              )}
            </div>
          </ScrollArea>

          {/* Footer */}
          <div className="flex items-center justify-between px-4 py-2 border-t bg-muted/30 text-xs text-muted-foreground">
            <div className="flex items-center gap-4">
              <span className="flex items-center gap-1">
                <kbd className="px-1 py-0.5 bg-background rounded border text-[10px]">↑</kbd>
                <kbd className="px-1 py-0.5 bg-background rounded border text-[10px]">↓</kbd>
                navigate
              </span>
              <span className="flex items-center gap-1">
                <CornerDownLeft className="h-3 w-3" />
                select
              </span>
            </div>
            <span className="flex items-center gap-1">
              <kbd className="px-1 py-0.5 bg-background rounded border text-[10px]">esc</kbd>
              close
            </span>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

interface CommandItemRowProps {
  item: CommandItem;
  selected: boolean;
  isFavorite: boolean;
  onSelect: () => void;
  onToggleFavorite: (e: React.MouseEvent) => void;
  getIcon: (name?: string) => React.ReactNode;
}

function CommandItemRow({
  item,
  selected,
  isFavorite,
  onSelect,
  onToggleFavorite,
  getIcon,
}: CommandItemRowProps) {
  return (
    <button
      onClick={onSelect}
      className={cn(
        'w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left transition-colors group',
        selected ? 'bg-accent text-accent-foreground' : 'hover:bg-muted'
      )}
    >
      <span className="text-muted-foreground shrink-0">
        {getIcon(item.icon)}
      </span>
      <div className="flex-1 min-w-0">
        <div className="font-medium truncate">{item.label}</div>
        {item.description && (
          <div className="text-xs text-muted-foreground truncate">{item.description}</div>
        )}
      </div>
      <button
        onClick={onToggleFavorite}
        className={cn(
          'p-1 rounded opacity-0 group-hover:opacity-100 transition-opacity',
          isFavorite ? 'text-yellow-500 opacity-100' : 'text-muted-foreground hover:text-foreground'
        )}
      >
        <Star className={cn('h-3.5 w-3.5', isFavorite && 'fill-current')} />
      </button>
      <ArrowRight className="h-4 w-4 text-muted-foreground shrink-0" />
    </button>
  );
}

export default CommandPalette;
