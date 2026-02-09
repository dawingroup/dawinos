// ============================================================================
// DashboardLayout COMPONENT
// DawinOS v2.0 - CEO Strategy Command Module
// Main layout wrapper for executive dashboard pages
// ============================================================================

import React, { useState, useCallback } from 'react';
import {
  Box,
  AppBar,
  Toolbar,
  Typography,
  IconButton,
  Drawer,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  ListItemButton,
  Divider,
  useTheme,
  useMediaQuery,
  Avatar,
  Menu,
  MenuItem,
  Badge,
  Tooltip,
} from '@mui/material';
import {
  Menu as MenuIcon,
  Dashboard as DashboardIcon,
  Flag as StrategyIcon,
  TrackChanges as OKRIcon,
  Speed as KPIIcon,
  Analytics as AnalyticsIcon,
  Notifications as NotificationsIcon,
  Settings as SettingsIcon,
  Refresh as RefreshIcon,
  CalendarToday as CalendarIcon,
  Business as BusinessIcon,
  ChevronLeft as ChevronLeftIcon,
} from '@mui/icons-material';
import { useNavigate, useLocation, Outlet } from 'react-router-dom';
import { useAuth } from '../../../shared/hooks/useAuth';

const DRAWER_WIDTH = 260;

interface NavItem {
  id: string;
  label: string;
  icon: React.ReactNode;
  path: string;
  badge?: number;
}

const NAV_ITEMS: NavItem[] = [
  { id: 'overview', label: 'Executive Overview', icon: <DashboardIcon />, path: '/strategy/dashboard' },
  { id: 'strategy', label: 'Strategic Plans', icon: <StrategyIcon />, path: '/strategy/plans' },
  { id: 'review', label: 'Strategy Review', icon: <BusinessIcon />, path: '/strategy/plans/review/new' },
  { id: 'okrs', label: 'OKRs', icon: <OKRIcon />, path: '/strategy/okrs' },
  { id: 'kpis', label: 'KPIs & Scorecards', icon: <KPIIcon />, path: '/strategy/kpis' },
  { id: 'analytics', label: 'Performance Analytics', icon: <AnalyticsIcon />, path: '/strategy/analytics' },
];

export const DashboardLayout: React.FC = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  
  const [drawerOpen, setDrawerOpen] = useState(!isMobile);
  const [userMenuAnchor, setUserMenuAnchor] = useState<null | HTMLElement>(null);
  const [notificationsAnchor, setNotificationsAnchor] = useState<null | HTMLElement>(null);
  
  // Get current fiscal year and quarter (Uganda fiscal year starts July 1)
  const now = new Date();
  const fiscalYear = now.getMonth() >= 6 ? now.getFullYear() + 1 : now.getFullYear();
  const fiscalQuarter = Math.ceil(((now.getMonth() - 6 + 12) % 12 + 1) / 3);
  
  const handleNavigation = useCallback((path: string) => {
    navigate(path);
    if (isMobile) {
      setDrawerOpen(false);
    }
  }, [navigate, isMobile]);
  
  const isActivePath = (path: string) => location.pathname === path;
  
  const drawer = (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Drawer Header */}
      <Box
        sx={{
          p: 2,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          borderBottom: 1,
          borderColor: 'divider',
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <BusinessIcon color="primary" />
          <Box>
            <Typography variant="subtitle1" fontWeight="bold" noWrap>
              CEO Command
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Strategy & Performance
            </Typography>
          </Box>
        </Box>
        {isMobile && (
          <IconButton onClick={() => setDrawerOpen(false)} size="small">
            <ChevronLeftIcon />
          </IconButton>
        )}
      </Box>
      
      {/* Fiscal Period Indicator */}
      <Box sx={{ px: 2, py: 1.5, bgcolor: 'primary.light', color: 'primary.contrastText' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <CalendarIcon fontSize="small" />
          <Typography variant="body2" fontWeight="medium">
            FY{fiscalYear} Q{fiscalQuarter}
          </Typography>
        </Box>
      </Box>
      
      {/* Navigation Items */}
      <List sx={{ flex: 1, py: 1 }}>
        {NAV_ITEMS.map((item) => (
          <ListItem key={item.id} disablePadding>
            <ListItemButton
              selected={isActivePath(item.path)}
              onClick={() => handleNavigation(item.path)}
              sx={{
                mx: 1,
                borderRadius: 1,
                '&.Mui-selected': {
                  bgcolor: 'primary.main',
                  color: 'primary.contrastText',
                  '&:hover': {
                    bgcolor: 'primary.dark',
                  },
                  '& .MuiListItemIcon-root': {
                    color: 'inherit',
                  },
                },
              }}
            >
              <ListItemIcon sx={{ minWidth: 40 }}>
                {item.badge ? (
                  <Badge badgeContent={item.badge} color="error">
                    {item.icon}
                  </Badge>
                ) : (
                  item.icon
                )}
              </ListItemIcon>
              <ListItemText primary={item.label} />
            </ListItemButton>
          </ListItem>
        ))}
      </List>
      
      {/* Footer Info */}
      <Divider />
      <Box sx={{ p: 2 }}>
        <Typography variant="caption" color="text.secondary">
          Organization
        </Typography>
        <Typography variant="body2" fontWeight="medium" noWrap>
          Dawin Group
        </Typography>
      </Box>
    </Box>
  );
  
  return (
    <Box sx={{ display: 'flex', minHeight: '100vh' }}>
      {/* App Bar */}
      <AppBar
        position="fixed"
        elevation={1}
        sx={{
          width: { md: `calc(100% - ${drawerOpen ? DRAWER_WIDTH : 0}px)` },
          ml: { md: `${drawerOpen ? DRAWER_WIDTH : 0}px` },
          bgcolor: 'background.paper',
          color: 'text.primary',
          transition: theme.transitions.create(['width', 'margin'], {
            easing: theme.transitions.easing.sharp,
            duration: theme.transitions.duration.leavingScreen,
          }),
        }}
      >
        <Toolbar>
          <IconButton
            edge="start"
            onClick={() => setDrawerOpen(!drawerOpen)}
            sx={{ mr: 2 }}
          >
            <MenuIcon />
          </IconButton>
          
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            {NAV_ITEMS.find(item => isActivePath(item.path))?.label || 'Dashboard'}
          </Typography>
          
          {/* Quick Actions */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Tooltip title="Refresh Data">
              <IconButton>
                <RefreshIcon />
              </IconButton>
            </Tooltip>
            
            <Tooltip title="Notifications">
              <IconButton onClick={(e: React.MouseEvent<HTMLButtonElement>) => setNotificationsAnchor(e.currentTarget)}>
                <Badge badgeContent={3} color="error">
                  <NotificationsIcon />
                </Badge>
              </IconButton>
            </Tooltip>
            
            <Tooltip title="Settings">
              <IconButton onClick={() => navigate('/strategy/settings')}>
                <SettingsIcon />
              </IconButton>
            </Tooltip>
            
            <Divider orientation="vertical" flexItem sx={{ mx: 1 }} />
            
            <Tooltip title={user?.displayName || 'User'}>
              <IconButton onClick={(e: React.MouseEvent<HTMLButtonElement>) => setUserMenuAnchor(e.currentTarget)}>
                <Avatar
                  src={user?.photoURL || undefined}
                  sx={{ width: 32, height: 32 }}
                >
                  {user?.displayName?.charAt(0) || 'U'}
                </Avatar>
              </IconButton>
            </Tooltip>
          </Box>
        </Toolbar>
      </AppBar>
      
      {/* Navigation Drawer */}
      <Box
        component="nav"
        sx={{ width: { md: drawerOpen ? DRAWER_WIDTH : 0 }, flexShrink: { md: 0 } }}
      >
        {isMobile ? (
          <Drawer
            variant="temporary"
            open={drawerOpen}
            onClose={() => setDrawerOpen(false)}
            ModalProps={{ keepMounted: true }}
            sx={{
              '& .MuiDrawer-paper': {
                boxSizing: 'border-box',
                width: DRAWER_WIDTH,
              },
            }}
          >
            {drawer}
          </Drawer>
        ) : (
          <Drawer
            variant="persistent"
            open={drawerOpen}
            sx={{
              '& .MuiDrawer-paper': {
                boxSizing: 'border-box',
                width: DRAWER_WIDTH,
                borderRight: 1,
                borderColor: 'divider',
              },
            }}
          >
            {drawer}
          </Drawer>
        )}
      </Box>
      
      {/* Main Content */}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: 3,
          width: { md: `calc(100% - ${drawerOpen ? DRAWER_WIDTH : 0}px)` },
          mt: '64px',
          minHeight: 'calc(100vh - 64px)',
          bgcolor: 'grey.50',
          transition: theme.transitions.create(['width', 'margin'], {
            easing: theme.transitions.easing.sharp,
            duration: theme.transitions.duration.leavingScreen,
          }),
        }}
      >
        <Outlet />
      </Box>
      
      {/* User Menu */}
      <Menu
        anchorEl={userMenuAnchor}
        open={Boolean(userMenuAnchor)}
        onClose={() => setUserMenuAnchor(null)}
      >
        <MenuItem onClick={() => { setUserMenuAnchor(null); navigate('/profile'); }}>
          Profile
        </MenuItem>
        <MenuItem onClick={() => { setUserMenuAnchor(null); navigate('/strategy/settings'); }}>
          Settings
        </MenuItem>
        <Divider />
        <MenuItem onClick={() => { setUserMenuAnchor(null); }}>
          Sign Out
        </MenuItem>
      </Menu>
      
      {/* Notifications Menu */}
      <Menu
        anchorEl={notificationsAnchor}
        open={Boolean(notificationsAnchor)}
        onClose={() => setNotificationsAnchor(null)}
        PaperProps={{
          sx: { width: 320, maxHeight: 400 },
        }}
      >
        <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
          <Typography variant="subtitle1" fontWeight="bold">
            Notifications
          </Typography>
        </Box>
        <MenuItem>
          <Box>
            <Typography variant="body2">
              KPI "Revenue Growth" is below target
            </Typography>
            <Typography variant="caption" color="text.secondary">
              2 hours ago
            </Typography>
          </Box>
        </MenuItem>
        <MenuItem>
          <Box>
            <Typography variant="body2">
              Q{fiscalQuarter} OKR review due in 5 days
            </Typography>
            <Typography variant="caption" color="text.secondary">
              1 day ago
            </Typography>
          </Box>
        </MenuItem>
        <Divider />
        <MenuItem onClick={() => { setNotificationsAnchor(null); navigate('/notifications'); }}>
          <Typography variant="body2" color="primary">
            View All Notifications
          </Typography>
        </MenuItem>
      </Menu>
    </Box>
  );
};

export default DashboardLayout;
