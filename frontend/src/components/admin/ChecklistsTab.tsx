import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
  Alert,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Visibility as VisibilityIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import {
  ChecklistTemplate,
  ChecklistType,
  CreateTemplateDto,
  UpdateTemplateDto,
} from '../../types/checklist';

interface ChecklistsTabProps {
  onUpdate?: () => void;
}

const ChecklistsTab: React.FC<ChecklistsTabProps> = ({ onUpdate }) => {
  const navigate = useNavigate();
  const [templates, setTemplates] = useState<ChecklistTemplate[]>([]);
  const [loading, setLoading] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<ChecklistTemplate | null>(null);
  const [error, setError] = useState<string>('');
  const [formData, setFormData] = useState<Partial<CreateTemplateDto>>({
    name: '',
    description: '',
    type: ChecklistType.ONBOARDING,
    category: '',
    estimatedDuration: undefined,
    responsibleRole: '',
  });

  useEffect(() => {
    loadTemplates();
  }, []);

  const loadTemplates = async () => {
    setLoading(true);
    try {
      const response = await api.get('/checklists/templates');
      setTemplates(response.data);
    } catch (error) {
      console.error('Error loading templates:', error);
      setError('Fehler beim Laden der Vorlagen');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDialog = (template?: ChecklistTemplate) => {
    if (template) {
      setEditingTemplate(template);
      setFormData({
        name: template.name,
        description: template.description || '',
        type: template.type,
        category: template.category || '',
        estimatedDuration: template.estimatedDuration,
        responsibleRole: template.responsibleRole || '',
      });
    } else {
      setEditingTemplate(null);
      setFormData({
        name: '',
        description: '',
        type: ChecklistType.ONBOARDING,
        category: '',
        estimatedDuration: undefined,
        responsibleRole: '',
      });
    }
    setDialogOpen(true);
    setError('');
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setEditingTemplate(null);
    setError('');
  };

  const handleSave = async () => {
    try {
      if (!formData.name || !formData.type) {
        setError('Name und Typ sind erforderlich');
        return;
      }

      if (editingTemplate) {
        await api.put(`/checklists/templates/${editingTemplate.id}`, formData);
      } else {
        await api.post('/checklists/templates', formData);
      }

      await loadTemplates();
      handleCloseDialog();
      onUpdate?.();
    } catch (error: any) {
      console.error('Error saving template:', error);
      setError(error.response?.data?.error || 'Fehler beim Speichern');
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Möchten Sie diese Vorlage wirklich deaktivieren?')) {
      return;
    }

    try {
      await api.delete(`/checklists/templates/${id}`);
      await loadTemplates();
      onUpdate?.();
    } catch (error) {
      console.error('Error deleting template:', error);
      setError('Fehler beim Löschen der Vorlage');
    }
  };

  const getTypeLabel = (type: ChecklistType): string => {
    const typeMap: Record<ChecklistType, string> = {
      [ChecklistType.ONBOARDING]: 'Onboarding',
      [ChecklistType.OFFBOARDING]: 'Offboarding',
      [ChecklistType.AUDIT]: 'Audit',
      [ChecklistType.MAINTENANCE]: 'Wartung',
      [ChecklistType.PROJECT]: 'Projekt',
      [ChecklistType.CUSTOM]: 'Benutzerdefiniert',
    };
    return typeMap[type];
  };

  const getTypeColor = (type: ChecklistType) => {
    const colorMap: Record<ChecklistType, 'primary' | 'secondary' | 'success' | 'warning' | 'error' | 'info'> = {
      [ChecklistType.ONBOARDING]: 'success',
      [ChecklistType.OFFBOARDING]: 'warning',
      [ChecklistType.AUDIT]: 'info',
      [ChecklistType.MAINTENANCE]: 'primary',
      [ChecklistType.PROJECT]: 'secondary',
      [ChecklistType.CUSTOM]: 'default' as any,
    };
    return colorMap[type] || 'default';
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h5">Checklisten-Vorlagen</Typography>
        <Box>
          <Button
            variant="outlined"
            startIcon={<VisibilityIcon />}
            onClick={() => navigate('/checklists')}
            sx={{ mr: 1 }}
          >
            Zur Übersicht
          </Button>
          <Button variant="contained" startIcon={<AddIcon />} onClick={() => handleOpenDialog()}>
            Neue Vorlage
          </Button>
        </Box>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>
          {error}
        </Alert>
      )}

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Name</TableCell>
              <TableCell>Typ</TableCell>
              <TableCell>Kategorie</TableCell>
              <TableCell>Items</TableCell>
              <TableCell>Instanzen</TableCell>
              <TableCell>Status</TableCell>
              <TableCell align="right">Aktionen</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={7} align="center">
                  Lädt...
                </TableCell>
              </TableRow>
            ) : templates.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} align="center">
                  Keine Vorlagen vorhanden
                </TableCell>
              </TableRow>
            ) : (
              templates.map((template) => (
                <TableRow key={template.id} hover>
                  <TableCell>
                    <Typography variant="body1" fontWeight="medium">
                      {template.name}
                    </Typography>
                    {template.description && (
                      <Typography variant="body2" color="text.secondary">
                        {template.description}
                      </Typography>
                    )}
                  </TableCell>
                  <TableCell>
                    <Chip label={getTypeLabel(template.type)} color={getTypeColor(template.type)} size="small" />
                  </TableCell>
                  <TableCell>{template.category || '-'}</TableCell>
                  <TableCell>{template._count?.items || 0}</TableCell>
                  <TableCell>{template._count?.instances || 0}</TableCell>
                  <TableCell>
                    <Chip label={template.isActive ? 'Aktiv' : 'Inaktiv'} color={template.isActive ? 'success' : 'default'} size="small" />
                  </TableCell>
                  <TableCell align="right">
                    <IconButton
                      size="small"
                      onClick={() => navigate(`/checklists/templates/${template.id}/edit`)}
                      title="Bearbeiten"
                    >
                      <EditIcon fontSize="small" />
                    </IconButton>
                    <IconButton size="small" onClick={() => handleDelete(template.id)} title="Löschen" color="error">
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle>{editingTemplate ? 'Vorlage bearbeiten' : 'Neue Vorlage erstellen'}</DialogTitle>
        <DialogContent>
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}
          <TextField
            fullWidth
            label="Name"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            margin="normal"
            required
          />
          <TextField
            fullWidth
            label="Beschreibung"
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            margin="normal"
            multiline
            rows={3}
          />
          <TextField
            fullWidth
            select
            label="Typ"
            value={formData.type}
            onChange={(e) => setFormData({ ...formData, type: e.target.value as ChecklistType })}
            margin="normal"
            required
          >
            <MenuItem value={ChecklistType.ONBOARDING}>Onboarding</MenuItem>
            <MenuItem value={ChecklistType.OFFBOARDING}>Offboarding</MenuItem>
            <MenuItem value={ChecklistType.AUDIT}>Audit</MenuItem>
            <MenuItem value={ChecklistType.MAINTENANCE}>Wartung</MenuItem>
            <MenuItem value={ChecklistType.PROJECT}>Projekt</MenuItem>
            <MenuItem value={ChecklistType.CUSTOM}>Benutzerdefiniert</MenuItem>
          </TextField>
          <TextField
            fullWidth
            label="Kategorie"
            value={formData.category}
            onChange={(e) => setFormData({ ...formData, category: e.target.value })}
            margin="normal"
            placeholder="z.B. IT, HR, Admin"
          />
          <TextField
            fullWidth
            label="Geschätzte Dauer (Minuten)"
            type="number"
            value={formData.estimatedDuration || ''}
            onChange={(e) =>
              setFormData({
                ...formData,
                estimatedDuration: e.target.value ? parseInt(e.target.value) : undefined,
              })
            }
            margin="normal"
          />
          <TextField
            fullWidth
            label="Verantwortliche Rolle"
            value={formData.responsibleRole}
            onChange={(e) => setFormData({ ...formData, responsibleRole: e.target.value })}
            margin="normal"
            placeholder="z.B. IT, HR, Vorgesetzter"
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Abbrechen</Button>
          <Button variant="contained" onClick={handleSave}>
            {editingTemplate ? 'Speichern' : 'Erstellen'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ChecklistsTab;
