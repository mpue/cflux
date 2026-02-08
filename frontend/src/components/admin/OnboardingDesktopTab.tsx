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
  Card,
  CardContent,
  Grid,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Computer as ComputerIcon,
  CheckCircle as CheckCircleIcon,
  Info as InfoIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import {
  ChecklistTemplate,
  ChecklistType,
  CreateTemplateDto,
} from '../../types/checklist';

interface OnboardingDesktopTabProps {
  onUpdate?: () => void;
}

const OnboardingDesktopTab: React.FC<OnboardingDesktopTabProps> = ({ onUpdate }) => {
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
    category: 'ONBOARDING_DESKTOP',
    estimatedDuration: undefined,
    responsibleRole: 'HR',
  });

  useEffect(() => {
    loadTemplates();
  }, []);

  const loadTemplates = async () => {
    setLoading(true);
    try {
      const response = await api.get('/checklists/templates');
      // Filter for ONBOARDING_DESKTOP category
      const desktopTemplates = response.data.filter(
        (t: ChecklistTemplate) => t.category === 'ONBOARDING_DESKTOP'
      );
      setTemplates(desktopTemplates);
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
        category: template.category || 'ONBOARDING_DESKTOP',
        estimatedDuration: template.estimatedDuration,
        responsibleRole: template.responsibleRole || 'HR',
      });
    } else {
      setEditingTemplate(null);
      setFormData({
        name: '',
        description: '',
        type: ChecklistType.ONBOARDING,
        category: 'ONBOARDING_DESKTOP',
        estimatedDuration: undefined,
        responsibleRole: 'HR',
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

      // Ensure category is set to ONBOARDING_DESKTOP
      const dataToSave = {
        ...formData,
        category: 'ONBOARDING_DESKTOP',
      };

      if (editingTemplate) {
        await api.put(`/checklists/templates/${editingTemplate.id}`, dataToSave);
      } else {
        await api.post('/checklists/templates', dataToSave);
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

  return (
    <Box>
      {/* Info Card */}
      <Card sx={{ mb: 3, bgcolor: 'info.lighter' }}>
        <CardContent>
          <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2 }}>
            <InfoIcon color="info" sx={{ mt: 0.5 }} />
            <Box>
              <Typography variant="h6" gutterBottom>
                Onboarding Desktop Checklisten
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Diese Checklisten werden für jeden neuen Bewerber verwendet, der eingestellt wurde.
                Sobald ein Bewerber den Status "HIRED" erhält, kann ihm eine Desktop-Checkliste
                zugewiesen werden. Wenn alle Aufgaben der Checkliste abgeschlossen sind, kann der
                Bewerber zum Mitarbeiter finalisiert werden und erhält einen User-Account.
              </Typography>
            </Box>
          </Box>
        </CardContent>
      </Card>

      {/* Statistics */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <ComputerIcon color="primary" sx={{ fontSize: 40 }} />
                <Box>
                  <Typography variant="h4">{templates.length}</Typography>
                  <Typography variant="body2" color="text.secondary">
                    Aktive Vorlagen
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <CheckCircleIcon color="success" sx={{ fontSize: 40 }} />
                <Box>
                  <Typography variant="h4">
                    {templates.reduce((sum, t) => sum + (t._count?.items || 0), 0)}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Gesamt Aufgaben
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Templates Table */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h5">Desktop Checklisten-Vorlagen</Typography>
        <Button variant="contained" startIcon={<AddIcon />} onClick={() => handleOpenDialog()}>
          Neue Vorlage
        </Button>
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
              <TableCell>Beschreibung</TableCell>
              <TableCell>Aufgaben</TableCell>
              <TableCell>Instanzen</TableCell>
              <TableCell>Dauer (Min)</TableCell>
              <TableCell>Verantwortlich</TableCell>
              <TableCell>Status</TableCell>
              <TableCell align="right">Aktionen</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={8} align="center">
                  Lädt...
                </TableCell>
              </TableRow>
            ) : templates.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} align="center">
                  <Box sx={{ py: 4 }}>
                    <ComputerIcon sx={{ fontSize: 60, color: 'text.disabled', mb: 2 }} />
                    <Typography variant="body1" color="text.secondary">
                      Noch keine Desktop-Checklisten-Vorlagen vorhanden.
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                      Erstellen Sie eine Vorlage, um mit dem Onboarding zu beginnen.
                    </Typography>
                    <Button variant="contained" startIcon={<AddIcon />} onClick={() => handleOpenDialog()}>
                      Erste Vorlage erstellen
                    </Button>
                  </Box>
                </TableCell>
              </TableRow>
            ) : (
              templates.map((template) => (
                <TableRow key={template.id} hover>
                  <TableCell>
                    <Typography variant="body1" fontWeight="medium">
                      {template.name}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" color="text.secondary" noWrap sx={{ maxWidth: 300 }}>
                      {template.description || '-'}
                    </Typography>
                  </TableCell>
                  <TableCell>{template._count?.items || 0}</TableCell>
                  <TableCell>{template._count?.instances || 0}</TableCell>
                  <TableCell>{template.estimatedDuration || '-'}</TableCell>
                  <TableCell>{template.responsibleRole || '-'}</TableCell>
                  <TableCell>
                    <Chip
                      label={template.isActive ? 'Aktiv' : 'Inaktiv'}
                      color={template.isActive ? 'success' : 'default'}
                      size="small"
                    />
                  </TableCell>
                  <TableCell align="right">
                    <IconButton
                      size="small"
                      onClick={() => navigate(`/checklists/templates/${template.id}/edit`)}
                      title="Details bearbeiten"
                    >
                      <EditIcon fontSize="small" />
                    </IconButton>
                    <IconButton
                      size="small"
                      onClick={() => handleDelete(template.id)}
                      title="Löschen"
                      color="error"
                    >
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
        <DialogTitle>{editingTemplate ? 'Vorlage bearbeiten' : 'Neue Desktop-Checklisten-Vorlage'}</DialogTitle>
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
            placeholder="z.B. IT-Einrichtung Desktop-Arbeitsplatz"
          />
          <TextField
            fullWidth
            label="Beschreibung"
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            margin="normal"
            multiline
            rows={3}
            placeholder="Beschreiben Sie die Checkliste..."
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
            select
            label="Verantwortliche Rolle"
            value={formData.responsibleRole}
            onChange={(e) => setFormData({ ...formData, responsibleRole: e.target.value })}
            margin="normal"
          >
            <MenuItem value="HR">HR</MenuItem>
            <MenuItem value="IT">IT</MenuItem>
            <MenuItem value="Admin">Admin</MenuItem>
            <MenuItem value="Vorgesetzter">Vorgesetzter</MenuItem>
          </TextField>
          <Alert severity="info" sx={{ mt: 2 }}>
            Nach dem Erstellen der Vorlage können Sie Aufgaben über den Bearbeiten-Button hinzufügen.
          </Alert>
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

export default OnboardingDesktopTab;
