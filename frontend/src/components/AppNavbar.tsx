import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useModules } from '../contexts/ModuleContext';
import { useShortcuts, ShortcutItem } from '../contexts/ShortcutsContext';
import { useTheme as useCustomTheme } from '../contexts/ThemeContext';
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
  Brightness4 as DarkModeIcon,
  Brightness7 as LightModeIcon,
  PictureAsPdf as PdfIcon,
  PermMedia as MediaIcon,
  HealthAndSafety as EHSIcon,
  School as SchoolIcon,
  ChecklistRtl as ChecklistIcon,
  CalendarMonth as CalendarIcon,
  PushPin as PinIcon,
} from '@mui/icons-material';

const MODULE_ICONS: Record<string, React.ElementType> = {
  calendar: CalendarIcon,
  money: MoneyIcon,
  incident: IncidentIcon,
  ehs: EHSIcon,
  intranet: IntranetIcon,
  media: MediaIcon,
  school: SchoolIcon,
  checklist: ChecklistIcon,
};

const MORE_MODULES: ShortcutItem[] = [
  { key: 'calendar', label: 'Kalender', route: '/calendar', icon: 'calendar' },
  { key: 'travel_expenses', label: 'Reisekosten', route: '/travel-expenses', icon: 'money' },
  { key: 'incidents', label: 'Incidents', route: '/incidents', icon: 'incident' },
  { key: 'ehs', label: 'EHS Dashboard', route: '/ehs-dashboard', icon: 'ehs' },
  { key: 'ehs', label: 'EHS Todos', route: '/ehs-todos', icon: 'ehs' },
  { key: 'intranet', label: 'Dokumente', route: '/admin?tab=dokumente', icon: 'intranet' },
  { key: 'media', label: 'Medien', route: '/media', icon: 'media' },
  { key: 'elearning', label: 'E-Learning', route: '/elearning', icon: 'school' },
  { key: 'checklists', label: 'Checklisten', route: '/checklists', icon: 'checklist' },
];

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
  const { modules, hasModuleAccess } = useModules();
  const { theme, toggleTheme } = useCustomTheme();
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

  const hasAnyAdminModule = (): boolean => {
    // Liste der Module, die als "Admin/Verwaltungs"-Module gelten
    // E-Learning und Dashboard zählen NICHT dazu
    const adminModules = [
      'users', 'user_groups', 'locations', 'departments',
      'time_tracking', 'absences', 'projects', 'invoices',
      'customers', 'suppliers', 'orders', 'articles',
      'inventory', 'devices', 'cost_centers', 'reminders',
      'zeitmodelle', 'incidents', 'media', 'intranet', 'checklists', 'dokumente'
    ];
    
    return modules.some(module => 
      adminModules.includes(module.key) && module.permissions?.canView
    );
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

  // ---- Modul-Shortcuts (aus dem ShortcutsContext, persistiert im localStorage) ----
  const { shortcuts, isPinned, openPinMenu } = useShortcuts();

  // Rechtsklick auf einen Modul-Eintrag: "Mehr"-Menü schließen und Pin-Menü öffnen.
  const openShortcutMenu = (e: React.MouseEvent, item: ShortcutItem) => {
    handleMoreMenuClose();
    openPinMenu(e, item);
  };

  const muiTheme = useTheme();
  const isMobile = useMediaQuery(muiTheme.breakpoints.down('sm'));
  const isTablet = useMediaQuery(muiTheme.breakpoints.down('md'));

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

        {hasModuleAccess('workflow') && (
          <Tooltip title="Genehmigungen">
            <IconButton color="inherit" onClick={() => navigateTo('/my-approvals')} size={isMobile ? 'small' : 'medium'}>
              <NotificationsIcon fontSize={isMobile ? 'small' : 'medium'} />
            </IconButton>
          </Tooltip>
        )}

        {hasModuleAccess('messages') && (
          <Tooltip title="Nachrichten">
            <IconButton color="inherit" onClick={() => navigateTo('/messages')} size={isMobile ? 'small' : 'medium'}>
              <Badge badgeContent={unreadMessagesCount} color="error">
                <MessageIcon fontSize={isMobile ? 'small' : 'medium'} />
              </Badge>
            </IconButton>
          </Tooltip>
        )}

        {!isMobile && (
          <Tooltip title="Dashboard">
            <IconButton color="inherit" onClick={() => navigateTo('/dashboard')} size={isMobile ? 'small' : 'medium'}>
              <DashboardIcon fontSize={isMobile ? 'small' : 'medium'} />
            </IconButton>
          </Tooltip>
        )}

        {/* Angeheftete Modul-Shortcuts */}
        {shortcuts
          .filter((s) => s.source === 'admin' || hasModuleAccess(s.key))
          .map((s) => {
            const Icon = MODULE_ICONS[s.icon];
            return (
              <Tooltip key={s.route} title={s.label}>
                <IconButton
                  color="inherit"
                  onClick={() => navigateTo(s.route)}
                  onContextMenu={(e) => openPinMenu(e, s)}
                  size={isMobile ? 'small' : 'medium'}
                >
                  {Icon ? (
                    <Icon fontSize={isMobile ? 'small' : 'medium'} />
                  ) : (
                    <Box component="span" sx={{ fontSize: isMobile ? '1rem' : '1.25rem', lineHeight: 1 }}>
                      {s.icon}
                    </Box>
                  )}
                </IconButton>
              </Tooltip>
            );
          })}

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
          {MORE_MODULES.filter((m) => hasModuleAccess(m.key)).map((m) => {
            const Icon = MODULE_ICONS[m.icon] || DashboardIcon;
            return (
              <MenuItem
                key={m.route}
                onClick={() => navigateTo(m.route)}
                onContextMenu={(e) => openShortcutMenu(e, m)}
              >
                <Icon sx={{ mr: 1 }} />
                {m.label}
                {isPinned(m.route) && <PinIcon sx={{ ml: 'auto', pl: 1, fontSize: 16, opacity: 0.6 }} />}
              </MenuItem>
            );
          })}
          {(user?.role === 'ADMIN' || hasAnyAdminModule()) && (
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
          <MenuItem onClick={() => navigateTo('/profile')}>
            <PersonIcon sx={{ mr: 1 }} />
            Profil
          </MenuItem>
          <MenuItem onClick={() => { toggleTheme(); handleMenuClose(); }}>
            {theme === 'light' ? (
              <DarkModeIcon sx={{ mr: 1 }} />
            ) : (
              <LightModeIcon sx={{ mr: 1 }} />
            )}
            {theme === 'light' ? 'Dark Mode' : 'Light Mode'}
          </MenuItem>
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
