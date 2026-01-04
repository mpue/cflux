import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useModules } from '../contexts/ModuleContext';
import { getUnreadCount } from '../services/message.service';
import {
  AppBar,
  Toolbar,
  Typography,
  IconButton,
  Badge,
  Box,
  Button,
  Menu,
  MenuItem,
  Avatar,
  Divider,
  Tooltip,
} from '@mui/material';
import {
  Notifications as NotificationsIcon,
  Message as MessageIcon,
  AttachMoney as MoneyIcon,
  Warning as IncidentIcon,
  MenuBook as IntranetIcon,
  Dashboard as DashboardIcon,
  AdminPanelSettings as AdminIcon,
  Logout as LogoutIcon,
  Person as PersonIcon,
  MoreVert as MoreIcon,
  PictureAsPdf as PdfIcon,
  PermMedia as MediaIcon,
} from '@mui/icons-material';

interface AppNavbarProps {
  title?: string;
  currentTime?: string;
  onLogout?: () => void;
  showLogo?: boolean;
  logoSrc?: string;
  onPdfReport?: () => void;
}

const AppNavbar: React.FC<AppNavbarProps> = ({ 
  title = 'Zeiterfassung',
  currentTime,
  onLogout,
  showLogo = false,
  logoSrc,
  onPdfReport
}) => {
  const { user, logout } = useAuth();
  const { modules } = useModules();
  const navigate = useNavigate();
  const [unreadMessagesCount, setUnreadMessagesCount] = useState<number>(0);
  const [displayTime, setDisplayTime] = useState<string>(new Date().toLocaleTimeString('de-DE'));
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [moreMenuAnchor, setMoreMenuAnchor] = useState<null | HTMLElement>(null);

  useEffect(() => {
    loadUnreadCount();
    const timer = setInterval(() => {
      setDisplayTime(new Date().toLocaleTimeString('de-DE'));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const loadUnreadCount = async () => {
    try {
      const count = await getUnreadCount();
      setUnreadMessagesCount(count);
    } catch (error) {
      console.error('Error loading unread count:', error);
    }
  };

  const handleLogout = () => {
    if (onLogout) {
      onLogout();
    } else {
      logout();
      navigate('/login');
    }
  };

  const handleProfileMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleMoreMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setMoreMenuAnchor(event.currentTarget);
  };

  const handleMoreMenuClose = () => {
    setMoreMenuAnchor(null);
  };

  const navigateTo = (path: string) => {
    navigate(path);
    handleMenuClose();
    handleMoreMenuClose();
  };

  return (
    <AppBar position="static" elevation={1}>
      <Toolbar sx={{ gap: 1 }}>
        {showLogo && logoSrc && (
          <Box component="img" src={logoSrc} alt="Logo" sx={{ height: 40, mr: 2 }} />
        )}
        <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
          {title}
        </Typography>

        <Typography variant="body1" sx={{ mr: 2, fontWeight: 500 }}>
          {currentTime || displayTime}
        </Typography>

        {/* Main Action Buttons */}
        {onPdfReport && (
          <Tooltip title="PDF-Bericht">
            <IconButton color="inherit" onClick={onPdfReport}>
              <PdfIcon />
            </IconButton>
          </Tooltip>
        )}

        <Tooltip title="Genehmigungen">
          <IconButton color="inherit" onClick={() => navigateTo('/my-approvals')}>
            <NotificationsIcon />
          </IconButton>
        </Tooltip>

        <Tooltip title="Nachrichten">
          <IconButton color="inherit" onClick={() => navigateTo('/messages')}>
            <Badge badgeContent={unreadMessagesCount} color="error">
              <MessageIcon />
            </Badge>
          </IconButton>
        </Tooltip>

        <Tooltip title="Dashboard">
          <IconButton color="inherit" onClick={() => navigateTo('/dashboard')}>
            <DashboardIcon />
          </IconButton>
        </Tooltip>

        {/* More Menu */}
        <Tooltip title="Mehr">
          <IconButton color="inherit" onClick={handleMoreMenuOpen}>
            <MoreIcon />
          </IconButton>
        </Tooltip>

        <Menu
          anchorEl={moreMenuAnchor}
          open={Boolean(moreMenuAnchor)}
          onClose={handleMoreMenuClose}
        >
          <MenuItem onClick={() => navigateTo('/travel-expenses')}>
            <MoneyIcon sx={{ mr: 1 }} />
            Reisekosten
          </MenuItem>
          <MenuItem onClick={() => navigateTo('/incidents')}>
            <IncidentIcon sx={{ mr: 1 }} />
            Incidents
          </MenuItem>
          <MenuItem onClick={() => navigateTo('/intranet')}>
            <IntranetIcon sx={{ mr: 1 }} />
            Intranet
          </MenuItem>
          <MenuItem onClick={() => navigateTo('/media')}>
            <MediaIcon sx={{ mr: 1 }} />
            Medien
          </MenuItem>
          {(user?.role === 'ADMIN' || modules.length > 0) && (
            <>
              <Divider />
              <MenuItem onClick={() => navigateTo('/admin')}>
                <AdminIcon sx={{ mr: 1 }} />
                {user?.role === 'ADMIN' ? 'Admin Panel' : 'Verwaltung'}
              </MenuItem>
            </>
          )}
        </Menu>

        {/* User Profile Menu */}
        <Tooltip title="Profil">
          <IconButton onClick={handleProfileMenuOpen} color="inherit">
            <Avatar sx={{ width: 32, height: 32, bgcolor: 'secondary.main' }}>
              {user?.firstName?.[0]}{user?.lastName?.[0]}
            </Avatar>
          </IconButton>
        </Tooltip>

        <Menu
          anchorEl={anchorEl}
          open={Boolean(anchorEl)}
          onClose={handleMenuClose}
        >
          <MenuItem disabled>
            <Box>
              <Typography variant="body2" fontWeight="bold">
                {user?.firstName} {user?.lastName}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {user?.email}
              </Typography>
            </Box>
          </MenuItem>
          <Divider />
          <MenuItem onClick={handleLogout}>
            <LogoutIcon sx={{ mr: 1 }} />
            Abmelden
          </MenuItem>
        </Menu>
      </Toolbar>
    </AppBar>
  );
};

export default AppNavbar;
