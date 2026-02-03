import React from 'react';
import { Bell, Search, Menu, MessageSquare } from 'lucide-react';
import { Button } from '@/core/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/core/components/ui/dropdown-menu';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/core/components/ui/tooltip';
import { ModuleSwitcher } from '@/core/components/navigation/ModuleSwitcher';
import { useNotifications, useAuth } from '@/integration/store';
import { useNavigate } from 'react-router-dom';
import { signOut } from 'firebase/auth';
import { auth } from '@/shared/services/firebase';
import { useFeatureFlag } from '@/shared/hooks/useFeatureFlag';
import { subscribeToUnreadCount } from '@/modules/whatsapp/services/whatsappService';

export interface TopNavBarProps {
  currentModule?: any;
  onOpenNotifications?: () => void;
  onOpenSearch?: () => void;
  onMenuClick?: () => void;
}

export function TopNavBar({ 
  currentModule, 
  onOpenNotifications,
  onOpenSearch,
  onMenuClick,
}: TopNavBarProps) {
  const navigate = useNavigate();
  const { unreadCount } = useNotifications();
  const { displayName, email } = useAuth();
  const whatsappEnabled = useFeatureFlag('WHATSAPP_ENABLED');
  const [waUnread, setWaUnread] = React.useState(0);

  React.useEffect(() => {
    if (!whatsappEnabled) return;
    return subscribeToUnreadCount(setWaUnread);
  }, [whatsappEnabled]);

  const handleLogout = async () => {
    await signOut(auth);
    navigate('/login');
  };

  return (
    <header className="h-14 border-b bg-background flex items-center justify-between px-4 shrink-0">
      <div className="flex items-center gap-3">
        {/* Mobile menu button */}
        <Button
          variant="ghost"
          size="icon"
          className="md:hidden"
          onClick={onMenuClick}
        >
          <Menu className="h-5 w-5" />
        </Button>

        <ModuleSwitcher value={currentModule} />
      </div>

      <div className="flex items-center gap-2">
        {/* Search button */}
        <Tooltip>
          <TooltipTrigger asChild>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={onOpenSearch}
              className="hidden sm:flex"
            >
              <Search className="h-4 w-4 mr-2" />
              <span className="hidden md:inline">Search</span>
              <kbd className="hidden lg:inline-flex ml-2 pointer-events-none h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground">
                ⌘K
              </kbd>
            </Button>
          </TooltipTrigger>
          <TooltipContent>Search (⌘K)</TooltipContent>
        </Tooltip>

        {/* Mobile search */}
        <Button
          variant="ghost"
          size="icon"
          className="sm:hidden"
          onClick={onOpenSearch}
        >
          <Search className="h-5 w-5" />
        </Button>

        {/* WhatsApp */}
        {whatsappEnabled && (
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => navigate('/whatsapp')}
                className="relative"
              >
                <MessageSquare className="h-5 w-5" />
                {waUnread > 0 && (
                  <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-green-600 text-[10px] font-medium text-white flex items-center justify-center">
                    {waUnread > 9 ? '9+' : waUnread}
                  </span>
                )}
              </Button>
            </TooltipTrigger>
            <TooltipContent>WhatsApp Messages</TooltipContent>
          </Tooltip>
        )}

        {/* Notifications */}
        <Tooltip>
          <TooltipTrigger asChild>
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={onOpenNotifications}
              className="relative"
            >
              <Bell className="h-5 w-5" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-destructive text-[10px] font-medium text-destructive-foreground flex items-center justify-center">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </Button>
          </TooltipTrigger>
          <TooltipContent>Notifications</TooltipContent>
        </Tooltip>

        {/* User menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="rounded-full">
              <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-sm font-medium">
                {displayName?.[0]?.toUpperCase() || email?.[0]?.toUpperCase() || 'U'}
              </div>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>
              <div className="flex flex-col space-y-1">
                <p className="text-sm font-medium">{displayName || 'User'}</p>
                <p className="text-xs text-muted-foreground truncate">{email}</p>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => navigate('/profile')}>
              Profile
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => navigate('/admin/settings')}>
              Settings
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleLogout} className="text-destructive">
              Sign out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
