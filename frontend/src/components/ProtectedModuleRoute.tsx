import React from 'react';
import { Navigate } from 'react-router-dom';
import { Box, Typography, Paper } from '@mui/material';
import { Lock as LockIcon } from '@mui/icons-material';
import { useModules } from '../contexts/ModuleContext';
import { useAuth } from '../contexts/AuthContext';

interface ProtectedModuleRouteProps {
  moduleKey: string;
  requiredPermission?: 'canView' | 'canCreate' | 'canEdit' | 'canDelete';
  children: React.ReactNode;
}

/**
 * Component to protect routes based on module permissions
 * Usage: <ProtectedModuleRoute moduleKey="time_tracking" requiredPermission="canEdit">
 */
const ProtectedModuleRoute: React.FC<ProtectedModuleRouteProps> = ({
  moduleKey,
  requiredPermission = 'canView',
  children,
}) => {
  const { user } = useAuth();
  const { modules, loading, hasModuleAccess, canCreate, canEdit, canDelete } = useModules();

  // Wait for modules to load
  if (loading) {
    return (
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          minHeight: '400px',
        }}
      >
        <Typography>Lade Berechtigungen...</Typography>
      </Box>
    );
  }

  // Redirect to login if not authenticated
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // Check if user has the required permission
  let hasPermission = false;

  if (user.role === 'ADMIN') {
    hasPermission = true;
  } else {
    switch (requiredPermission) {
      case 'canView':
        hasPermission = hasModuleAccess(moduleKey);
        break;
      case 'canCreate':
        hasPermission = canCreate(moduleKey);
        break;
      case 'canEdit':
        hasPermission = canEdit(moduleKey);
        break;
      case 'canDelete':
        hasPermission = canDelete(moduleKey);
        break;
      default:
        hasPermission = hasModuleAccess(moduleKey);
    }
  }

  // Show access denied message if user doesn't have permission
  if (!hasPermission) {
    return (
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          minHeight: '400px',
          p: 3,
        }}
      >
        <Paper
          sx={{
            p: 4,
            maxWidth: 500,
            textAlign: 'center',
          }}
        >
          <LockIcon sx={{ fontSize: 64, color: 'error.main', mb: 2 }} />
          <Typography variant="h5" gutterBottom>
            Zugriff verweigert
          </Typography>
          <Typography color="text.secondary">
            Sie haben keine Berechtigung, auf dieses Modul zuzugreifen.
            Bitte wenden Sie sich an Ihren Administrator.
          </Typography>
        </Paper>
      </Box>
    );
  }

  // Render children if user has permission
  return <>{children}</>;
};

export default ProtectedModuleRoute;
