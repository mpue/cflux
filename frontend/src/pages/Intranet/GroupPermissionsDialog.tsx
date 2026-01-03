import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  FormControl,
  FormLabel,
  FormGroup,
  FormControlLabel,
  Checkbox,
  Select,
  MenuItem,
  Box,
  Typography,
  Chip,
  CircularProgress,
  Alert,
} from '@mui/material';
import { userGroupService, UserGroup } from '../../services/userGroup.service';
import { documentNodeService, DocumentNodeGroupPermission } from '../../services/documentNode.service';

interface GroupPermissionsDialogProps {
  open: boolean;
  onClose: () => void;
  nodeId: string;
  nodeTitle: string;
  onSaved?: () => void;
}

interface PermissionState {
  userGroupId: string;
  permissionLevel: 'READ' | 'WRITE' | 'ADMIN';
}

const GroupPermissionsDialog: React.FC<GroupPermissionsDialogProps> = ({
  open,
  onClose,
  nodeId,
  nodeTitle,
  onSaved,
}) => {
  const [availableGroups, setAvailableGroups] = useState<UserGroup[]>([]);
  const [currentPermissions, setCurrentPermissions] = useState<DocumentNodeGroupPermission[]>([]);
  const [selectedPermissions, setSelectedPermissions] = useState<Map<string, 'READ' | 'WRITE' | 'ADMIN'>>(new Map());
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      loadData();
    }
  }, [open, nodeId]);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [groups, permissions] = await Promise.all([
        userGroupService.getAll(false),
        documentNodeService.getGroupPermissions(nodeId),
      ]);
      
      setAvailableGroups(groups);
      setCurrentPermissions(permissions);
      
      // Initialize selected permissions map
      const permissionsMap = new Map<string, 'READ' | 'WRITE' | 'ADMIN'>();
      permissions.forEach(p => {
        permissionsMap.set(p.userGroupId, p.permissionLevel);
      });
      setSelectedPermissions(permissionsMap);
    } catch (err: any) {
      console.error('Error loading group permissions:', err);
      setError(err.response?.data?.message || 'Fehler beim Laden der Berechtigungen');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleGroup = (groupId: string) => {
    const newPermissions = new Map(selectedPermissions);
    if (newPermissions.has(groupId)) {
      newPermissions.delete(groupId);
    } else {
      newPermissions.set(groupId, 'READ');
    }
    setSelectedPermissions(newPermissions);
  };

  const handleChangePermissionLevel = (groupId: string, level: 'READ' | 'WRITE' | 'ADMIN') => {
    const newPermissions = new Map(selectedPermissions);
    newPermissions.set(groupId, level);
    setSelectedPermissions(newPermissions);
  };

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    try {
      const permissions = Array.from(selectedPermissions.entries()).map(([userGroupId, permissionLevel]) => ({
        userGroupId,
        permissionLevel,
      }));

      await documentNodeService.setGroupPermissions(nodeId, { permissions });
      onSaved?.();
      onClose();
    } catch (err: any) {
      console.error('Error saving group permissions:', err);
      setError(err.response?.data?.message || 'Fehler beim Speichern der Berechtigungen');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>
        Gruppenberechtigungen für "{nodeTitle}"
      </DialogTitle>
      <DialogContent>
        {loading ? (
          <Box display="flex" justifyContent="center" p={3}>
            <CircularProgress />
          </Box>
        ) : error ? (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        ) : (
          <>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Wählen Sie die Gruppen aus, die Zugriff auf dieses Element haben sollen, und legen Sie die Berechtigungsstufe fest.
            </Typography>
            
            <FormControl component="fieldset" variant="standard" fullWidth>
              <FormLabel component="legend">Berechtigte Gruppen</FormLabel>
              <FormGroup>
                {availableGroups.map((group) => {
                  const isSelected = selectedPermissions.has(group.id);
                  const permissionLevel = selectedPermissions.get(group.id);
                  
                  return (
                    <Box
                      key={group.id}
                      sx={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        py: 1,
                        borderBottom: '1px solid',
                        borderColor: 'divider',
                      }}
                    >
                      <Box sx={{ display: 'flex', alignItems: 'center', flex: 1 }}>
                        <FormControlLabel
                          control={
                            <Checkbox
                              checked={isSelected}
                              onChange={() => handleToggleGroup(group.id)}
                            />
                          }
                          label={
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              <Chip
                                label={group.name}
                                size="small"
                                sx={{
                                  backgroundColor: group.color || '#1976d2',
                                  color: '#fff',
                                }}
                              />
                              {group.description && (
                                <Typography variant="caption" color="text.secondary">
                                  {group.description}
                                </Typography>
                              )}
                            </Box>
                          }
                        />
                      </Box>
                      
                      {isSelected && (
                        <FormControl size="small" sx={{ minWidth: 120 }}>
                          <Select
                            value={permissionLevel}
                            onChange={(e) => handleChangePermissionLevel(group.id, e.target.value as 'READ' | 'WRITE' | 'ADMIN')}
                          >
                            <MenuItem value="READ">Lesen</MenuItem>
                            <MenuItem value="WRITE">Schreiben</MenuItem>
                            <MenuItem value="ADMIN">Admin</MenuItem>
                          </Select>
                        </FormControl>
                      )}
                    </Box>
                  );
                })}
              </FormGroup>
            </FormControl>

            <Box sx={{ mt: 2 }}>
              <Typography variant="caption" color="text.secondary">
                <strong>Lesen:</strong> Anzeigen von Inhalten<br />
                <strong>Schreiben:</strong> Lesen + Bearbeiten von Inhalten<br />
                <strong>Admin:</strong> Schreiben + Verwalten von Berechtigungen
              </Typography>
            </Box>
          </>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={saving}>
          Abbrechen
        </Button>
        <Button
          onClick={handleSave}
          variant="contained"
          disabled={loading || saving}
          startIcon={saving && <CircularProgress size={20} />}
        >
          Speichern
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default GroupPermissionsDialog;
