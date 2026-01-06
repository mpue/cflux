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
  useMediaQuery,
  useTheme,
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

  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const isTablet = useMediaQuery(theme.breakpoints.down('md'));

  // Shorten title for mobile devices
  const getDisplayTitle = () => {
    if (!isMobile) return title;
    const shortTitles: { [key: string]: string } = {
      'Dashboard': 'Home',
      'Zeiterfassung': 'Zeit',
      'Projekte': 'Proj',
      'Berichte': 'Report',
      'Einstellungen': 'Setup',
      'Administrationsbereich': 'Admin',
      'Abwesenheiten': 'Urlaub',
    };
    return shortTitles[title] || title.substring(0, 10);
  };

  return (
    <AppBar position="static" elevation={1}>
      <Toolbar 
        sx={{ 
          gap: isMobile ? 0.5 : 1,
          padding: isMobile ? '8px 8px' : '8px 16px',
          minHeight: isMobile ? '56px !important' : '64px',
        }}
      >
        {showLogo && logoSrc && (
          <Box 
            component="img" 
            src={logoSrc} 
            alt="Logo" 
            sx={{ 
              height: isMobile ? 32 : 40, 
              mr: isMobile ? 0.5 : 2 
            }} 
          />
        )}
        <Typography 
          variant={isMobile ? 'subtitle1' : 'h6'} 
          component="div" 
          sx={{ 
            flexGrow: 1,
            fontSize: isMobile ? '0.9rem' : '1.25rem',
            fontWeight: isMobile ? 600 : 500,
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
          }}
        >
          {getDisplayTitle()}
        </Typography>

        {!isMobile && (
          <Typography variant="body2" sx={{ mr: 1, fontWeight: 500, display: { xs: 'none', sm: 'block' } }}>
            {currentTime || displayTime}
          </Typography>
        )}

        {/* Main Action Buttons - Only show most important on mobile */}
        {onPdfReport && !isMobile && (
          <Tooltip title="PDF-Bericht">
            <IconButton color="inherit" onClick={onPdfReport} size={isMobile ? 'small' : 'medium'}>
              <PdfIcon fontSize={isMobile ? 'small' : 'medium'} />
            </IconButton>
          </Tooltip>
        )}

        <Tooltip title="Genehmigungen">
          <IconButton color="inherit" onClick={() => navigateTo('/my-approvals')} size={isMobile ? 'small' : 'medium'}>
            <NotificationsIcon fontSize={isMobile ? 'small' : 'medium'} />
          </IconButton>
        </Tooltip>

        <Tooltip title="Nachrichten">
          <IconButton color="inherit" onClick={() => navigateTo('/messages')} size={isMobile ? 'small' : 'medium'}>
            <Badge badgeContent={unreadMessagesCount} color="error">
              <MessageIcon fontSize={isMobile ? 'small' : 'medium'} />
            </Badge>
          </IconButton>
        </Tooltip>

        {!isMobile && (
          <Tooltip title="Dashboard">
            <IconButton color="inherit" onClick={() => navigateTo('/dashboard')} size={isMobile ? 'small' : 'medium'}>
              <DashboardIcon fontSize={isMobile ? 'small' : 'medium'} />
            </IconButton>
          </Tooltip>
        )}

        {/* More Menu */}
        <Tooltip title="Mehr">
          <IconButton color="inherit" onClick={handleMoreMenuOpen} size={isMobile ? 'small' : 'medium'}>
            <MoreIcon fontSize={isMobile ? 'small' : 'medium'} />
          </IconButton>
        </Tooltip>

        <Menu
          anchorEl={moreMenuAnchor}
          open={Boolean(moreMenuAnchor)}
          onClose={handleMoreMenuClose}
          PaperProps={{
            sx: {
              maxHeight: isMobile ? '70vh' : '80vh',
              width: isMobile ? '90vw' : 'auto',
              maxWidth: isMobile ? '320px' : '400px',
            }
          }}
        >
          {isMobile && (
            <MenuItem onClick={() => navigateTo('/dashboard')}>
              <DashboardIcon sx={{ mr: 1 }} />
              Dashboard
            </MenuItem>
          )}
          {onPdfReport && isMobile && (
            <MenuItem onClick={() => { onPdfReport(); handleMoreMenuClose(); }}>
              <PdfIcon sx={{ mr: 1 }} />
              PDF-Bericht
            </MenuItem>
          )}
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
          <IconButton 
            onClick={handleProfileMenuOpen} 
            color="inherit"
            size={isMobile ? 'small' : 'medium'}
          >
            <Avatar sx={{ 
              width: isMobile ? 28 : 32, 
              height: isMobile ? 28 : 32, 
              bgcolor: 'secondary.main',
              fontSize: isMobile ? '0.75rem' : '1rem',
            }}>
              {user?.firstName?.[0]}{user?.lastName?.[0]}
            </Avatar>
          </IconButton>
        </Tooltip>

        <Menu
          anchorEl={anchorEl}
          open={Boolean(anchorEl)}
          onClose={handleMenuClose}
          PaperProps={{
            sx: {
              width: isMobile ? '90vw' : 'auto',
              maxWidth: isMobile ? '300px' : '400px',
            }
          }}
        >
          <MenuItem disabled>
            <Box>
              <Typography variant={isMobile ? 'body2' : 'body1'} fontWeight="bold">
                {user?.firstName} {user?.lastName}
              </Typography>
              <Typography variant="caption" color="text.secondary" sx={{ wordBreak: 'break-all' }}>
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
