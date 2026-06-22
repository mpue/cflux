import React, { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Box,
  Paper,
  TextField,
  Button,
  MenuItem,
  Grid,
  IconButton,
  Autocomplete,
} from '@mui/material';
import {
  Save as SaveIcon,
  ArrowBack as ArrowBackIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import AppNavbar from '../components/AppNavbar';
import api from '../services/api';
import {
  ChecklistTemplate,
  CreateInstanceDto,
} from '../types/checklist';

interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
}

interface Project {
  id: string;
  name: string;
}

const ChecklistInstanceFormPage: React.FC = () => {
  const navigate = useNavigate();
  const { logout } = useAuth();

  const [templates, setTemplates] = useState<ChecklistTemplate[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [formData, setFormData] = useState<CreateInstanceDto>({
    templateId: '',
    userId: '',
    assignedToId: undefined,
    responsibleIds: [],
    startDate: new Date().toISOString().split('T')[0],
    targetEndDate: undefined,
    notes: '',
    projectId: undefined,
  });

  const [selectedTemplate, setSelectedTemplate] = useState<ChecklistTemplate | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [templatesRes, usersRes, projectsRes] = await Promise.all([
        api.get('/checklists/templates?isActive=true'),
        api.get('/users'),
        api.get('/projects'),
      ]);

      setTemplates(templatesRes.data);
      setUsers(usersRes.data);
      setProjects(projectsRes.data);
    } catch (error) {
      console.error('Error loading data:', error);
      alert('Fehler beim Laden der Daten');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: keyof CreateInstanceDto, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleTemplateChange = (templateId: string) => {
    handleInputChange('templateId', templateId);
    const template = templates.find((t) => t.id === templateId);
    setSelectedTemplate(template || null);

    // Auto-calculate target end date if template has estimated duration
    if (template?.estimatedDuration && formData.startDate) {
      const startDate = new Date(formData.startDate);
      const durationDays = Math.ceil(template.estimatedDuration / (60 * 24)); // Convert minutes to days
      const targetDate = new Date(startDate);
      targetDate.setDate(targetDate.getDate() + durationDays);
      handleInputChange('targetEndDate', targetDate.toISOString().split('T')[0]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.templateId) {
      alert('Bitte wählen Sie eine Vorlage aus');
      return;
    }

    if (!formData.userId) {
      alert('Bitte wählen Sie einen Mitarbeiter aus');
      return;
    }

    setSaving(true);
    try {
      // Convert date strings to ISO DateTime format
      const dataToSend = {
        ...formData,
        startDate: formData.startDate ? new Date(formData.startDate).toISOString() : new Date().toISOString(),
        targetEndDate: formData.targetEndDate ? new Date(formData.targetEndDate).toISOString() : undefined,
      };
      const response = await api.post('/checklists/instances', dataToSend);
      alert('Checkliste erfolgreich erstellt!');
      navigate(`/checklists/${response.data.id}`);
    } catch (error: any) {
      console.error('Error creating instance:', error);
      alert(error.response?.data?.error || 'Fehler beim Erstellen der Checkliste');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <>
        <AppNavbar title="Neue Checkliste" onLogout={logout} />
        <Container>
          <Box sx={{ py: 4, textAlign: 'center' }}>
            <Typography>Wird geladen...</Typography>
          </Box>
        </Container>
      </>
    );
  }

  return (
    <>
      <AppNavbar title="Neue Checkliste" onLogout={logout} />
      <Container maxWidth="md">
      <Box sx={{ py: 4 }}>
        <Box sx={{ mb: 3, display: 'flex', alignItems: 'center', gap: 2 }}>
          <IconButton onClick={() => navigate('/checklists')}>
            <ArrowBackIcon />
          </IconButton>
          <Typography variant="h4">Neue Checkliste erstellen</Typography>
        </Box>

        <form onSubmit={handleSubmit}>
          <Paper sx={{ p: 3, mb: 3 }}>
            <Grid container spacing={3}>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  select
                  label="Vorlage *"
                  value={formData.templateId}
                  onChange={(e) => handleTemplateChange(e.target.value)}
                  required
                  helperText={
                    selectedTemplate
                      ? `${selectedTemplate.description || ''} ${
                          selectedTemplate.estimatedDuration
                            ? `(ca. ${Math.ceil(selectedTemplate.estimatedDuration / 60)} Stunden)`
                            : ''
                        }`
                      : 'Wählen Sie eine Checklisten-Vorlage'
                  }
                >
                  {templates.map((template) => (
                    <MenuItem key={template.id} value={template.id}>
                      {template.name} ({template.type})
                      {template._count && ` - ${template._count.items} Punkte`}
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>

              <Grid item xs={12}>
                <Autocomplete
                  options={users}
                  getOptionLabel={(user) => `${user.firstName} ${user.lastName} (${user.email})`}
                  value={users.find((u) => u.id === formData.userId) || null}
                  onChange={(_, newValue) => handleInputChange('userId', newValue?.id || '')}
                  renderInput={(params) => (
                    <TextField {...params} label="Für wen (Betroffener Mitarbeiter) *" required helperText="Für welchen Mitarbeiter ist diese Checkliste?" />
                  )}
                />
              </Grid>

              <Grid item xs={12}>
                <Autocomplete
                  options={users}
                  getOptionLabel={(user) => `${user.firstName} ${user.lastName} (${user.email})`}
                  value={users.find((u) => u.id === formData.assignedToId) || null}
                  onChange={(_, newValue) => {
                    handleInputChange('assignedToId', newValue?.id || undefined);
                    // Hauptverantwortlichen aus den weiteren Verantwortlichen entfernen
                    if (newValue) {
                      handleInputChange(
                        'responsibleIds',
                        (formData.responsibleIds || []).filter((id) => id !== newValue.id)
                      );
                    }
                  }}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      label="Hauptverantwortlich – wer führt aus? (optional)"
                      helperText="Z.B. die HR-Person, die diese Checkliste abarbeitet"
                    />
                  )}
                />
              </Grid>

              <Grid item xs={12}>
                <Autocomplete
                  multiple
                  options={users.filter((u) => u.id !== formData.assignedToId)}
                  getOptionLabel={(user) => `${user.firstName} ${user.lastName} (${user.email})`}
                  value={users.filter((u) => (formData.responsibleIds || []).includes(u.id))}
                  onChange={(_, newValue) =>
                    handleInputChange('responsibleIds', newValue.map((u) => u.id))
                  }
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      label="Weitere Verantwortliche (optional)"
                      helperText="Erhalten ebenfalls Kalendertermin und E-Mail-Einladung"
                    />
                  )}
                />
              </Grid>

              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  type="date"
                  label="Startdatum"
                  value={formData.startDate}
                  onChange={(e) => handleInputChange('startDate', e.target.value)}
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>

              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  type="date"
                  label="Ziel-Enddatum (optional)"
                  value={formData.targetEndDate || ''}
                  onChange={(e) => handleInputChange('targetEndDate', e.target.value || undefined)}
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>

              <Grid item xs={12}>
                <TextField
                  fullWidth
                  select
                  label="Projekt (optional)"
                  value={formData.projectId || ''}
                  onChange={(e) => handleInputChange('projectId', e.target.value || undefined)}
                >
                  <MenuItem value="">
                    <em>Kein Projekt</em>
                  </MenuItem>
                  {projects.map((project) => (
                    <MenuItem key={project.id} value={project.id}>
                      {project.name}
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>

              <Grid item xs={12}>
                <TextField
                  fullWidth
                  multiline
                  rows={4}
                  label="Notizen (optional)"
                  value={formData.notes}
                  onChange={(e) => handleInputChange('notes', e.target.value)}
                  placeholder="Zusätzliche Informationen oder Hinweise zur Checkliste..."
                />
              </Grid>
            </Grid>
          </Paper>

          <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
            <Button variant="outlined" onClick={() => navigate('/checklists')}>
              Abbrechen
            </Button>
            <Button
              type="submit"
              variant="contained"
              startIcon={<SaveIcon />}
              disabled={saving || !formData.templateId || !formData.userId}
            >
              {saving ? 'Wird erstellt...' : 'Checkliste erstellen'}
            </Button>
          </Box>
        </form>
      </Box>
    </Container>
    </>
  );
};

export default ChecklistInstanceFormPage;
