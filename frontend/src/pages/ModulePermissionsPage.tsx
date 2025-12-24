import React, { useEffect, useState } from 'react';
import {
  Container,
  Paper,
  Typography,
  Box,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Checkbox,
  Alert,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Button,
  Chip,
} from '@mui/material';
import {
  Security as SecurityIcon,
  Save as SaveIcon,
} from '@mui/icons-material';
import moduleService, { Module, ModuleAccess } from '../services/module.service';
import { userGroupService, UserGroup } from '../services/userGroup.service';

const ModulePermissionsPage: React.FC<{ embedded?: boolean }> = ({ embedded = false }) => {
  const [modules, setModules] = useState<Module[]>([]);
  const [userGroups, setUserGroups] = useState<UserGroup[]>([]);
  const [selectedGroupId, setSelectedGroupId] = useState<string>('');
  const [moduleAccess, setModuleAccess] = useState<ModuleAccess[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    loadInitialData();
  }, []);

  useEffect(() => {
    if (selectedGroupId) {
      loadGroupAccess();
    }
  }, [selectedGroupId]);

  const loadInitialData = async () => {
    try {
      setLoading(true);
      const [modulesData, groupsData] = await Promise.all([
        moduleService.getAllModules(),
        userGroupService.getAll(),
      ]);
      setModules(modulesData);
      setUserGroups(groupsData);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Fehler beim Laden der Daten');
      console.error('Error loading data:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadGroupAccess = async () => {
    try {
      const access = await moduleService.getModuleAccessByGroup(selectedGroupId);
      setModuleAccess(access);
      setHasChanges(false);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Fehler beim Laden der Berechtigungen');
      console.error('Error loading access:', err);
    }
  };

  const getAccessForModule = (moduleId: string): ModuleAccess | undefined => {
    return moduleAccess.find((access) => access.moduleId === moduleId);
  };

  const handlePermissionChange = async (
    moduleId: string,
    permission: 'canView' | 'canCreate' | 'canEdit' | 'canDelete',
    value: boolean
  ) => {
    const existingAccess = getAccessForModule(moduleId);

    if (existingAccess) {
      // Update existing access
      const updatedAccess = moduleAccess.map((access) =>
        access.moduleId === moduleId
          ? { ...access, [permission]: value }
          : access
      );
      setModuleAccess(updatedAccess);
    } else {
      // Create new access entry
      const newAccess: ModuleAccess = {
        id: `temp-${moduleId}`,
        moduleId,
        userGroupId: selectedGroupId,
        canView: permission === 'canView' ? value : false,
        canCreate: permission === 'canCreate' ? value : false,
        canEdit: permission === 'canEdit' ? value : false,
        canDelete: permission === 'canDelete' ? value : false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      setModuleAccess([...moduleAccess, newAccess]);
    }
    setHasChanges(true);
  };

  const handleSaveAll = async () => {
    try {
      setError(null);
      setSuccess(null);

      for (const access of moduleAccess) {
        const permissions = {
          canView: access.canView,
          canCreate: access.canCreate,
          canEdit: access.canEdit,
          canDelete: access.canDelete,
        };

        if (access.id.startsWith('temp-')) {
          // Create new access
          if (access.canView) {
            await moduleService.grantModuleAccess(
              access.moduleId,
              selectedGroupId,
              permissions
            );
          }
        } else {
          // Update existing access
          if (!access.canView) {
            // If canView is false, remove the access entirely
            await moduleService.revokeModuleAccess(access.id);
          } else {
            await moduleService.updateModuleAccess(access.id, permissions);
          }
        }
      }

      setSuccess('Berechtigungen erfolgreich gespeichert');
      setHasChanges(false);
      await loadGroupAccess();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Fehler beim Speichern der Berechtigungen');
      console.error('Error saving permissions:', err);
    }
  };

  if (loading) {
    return (
      <Box sx={{ p: 3 }}>
        <Typography>Lade Daten...</Typography>
      </Box>
    );
  }

  const content = (
    <>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <SecurityIcon sx={{ fontSize: 40, color: 'primary.main' }} />
          <Typography variant="h4" component="h1">
            Modulberechtigungen
          </Typography>
        </Box>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {success && (
        <Alert severity="success" sx={{ mb: 3 }} onClose={() => setSuccess(null)}>
          {success}
        </Alert>
      )}

      <Paper sx={{ p: 3, mb: 3 }}>
        <FormControl fullWidth>
          <InputLabel>Benutzergruppe auswählen</InputLabel>
          <Select
            value={selectedGroupId}
            onChange={(e) => setSelectedGroupId(e.target.value)}
            label="Benutzergruppe auswählen"
          >
            {userGroups.map((group) => (
              <MenuItem key={group.id} value={group.id}>
                {group.name}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </Paper>

      {selectedGroupId && (
        <>
          <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 2 }}>
            <Button
              variant="contained"
              startIcon={<SaveIcon />}
              onClick={handleSaveAll}
              disabled={!hasChanges}
            >
              Alle Änderungen speichern
            </Button>
          </Box>

          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Modul</TableCell>
                  <TableCell align="center">Ansehen</TableCell>
                  <TableCell align="center">Erstellen</TableCell>
                  <TableCell align="center">Bearbeiten</TableCell>
                  <TableCell align="center">Löschen</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {modules.map((module) => {
                  const access = getAccessForModule(module.id);
                  return (
                    <TableRow key={module.id}>
                      <TableCell>
                        <Box>
                          <Typography variant="body1" fontWeight="medium">
                            {module.name}
                          </Typography>
                          <Box sx={{ display: 'flex', gap: 1, mt: 0.5 }}>
                            <Chip label={module.key} size="small" variant="outlined" />
                            {module.route && (
                              <Chip label={module.route} size="small" color="primary" variant="outlined" />
                            )}
                          </Box>
                        </Box>
                      </TableCell>
                      <TableCell align="center">
                        <Checkbox
                          checked={access?.canView || false}
                          onChange={(e) =>
                            handlePermissionChange(module.id, 'canView', e.target.checked)
                          }
                        />
                      </TableCell>
                      <TableCell align="center">
                        <Checkbox
                          checked={access?.canCreate || false}
                          onChange={(e) =>
                            handlePermissionChange(module.id, 'canCreate', e.target.checked)
                          }
                          disabled={!access?.canView}
                        />
                      </TableCell>
                      <TableCell align="center">
                        <Checkbox
                          checked={access?.canEdit || false}
                          onChange={(e) =>
                            handlePermissionChange(module.id, 'canEdit', e.target.checked)
                          }
                          disabled={!access?.canView}
                        />
                      </TableCell>
                      <TableCell align="center">
                        <Checkbox
                          checked={access?.canDelete || false}
                          onChange={(e) =>
                            handlePermissionChange(module.id, 'canDelete', e.target.checked)
                          }
                          disabled={!access?.canView}
                        />
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </TableContainer>
        </>
      )}
    </>
  );

  return embedded ? content : <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>{content}</Container>;
};

export default ModulePermissionsPage;
