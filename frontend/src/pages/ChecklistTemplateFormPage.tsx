import React, { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Box,
  Paper,
  TextField,
  Button,
  MenuItem,
  IconButton,
  Card,
  CardContent,
  Grid,
  FormControlLabel,
  Checkbox,
  Divider,
  Autocomplete,
  Chip,
} from '@mui/material';
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  Save as SaveIcon,
  ArrowBack as ArrowBackIcon,
} from '@mui/icons-material';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import AppNavbar from '../components/AppNavbar';
import api from '../services/api';
import {
  ChecklistType,
  ChecklistItemType,
  CreateTemplateDto,
  CreateTemplateItemDto,
  ChecklistTemplate,
  ChecklistItem,
} from '../types/checklist';

interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
}

interface TemplateItemForm extends Partial<CreateTemplateItemDto> {
  tempId: string;
}

const ChecklistTemplateFormPage: React.FC = () => {
  const navigate = useNavigate();
  const { logout } = useAuth();
  const { id } = useParams<{ id: string }>();
  const isEditMode = !!id;

  const [formData, setFormData] = useState<CreateTemplateDto>({
    name: '',
    description: '',
    type: ChecklistType.CUSTOM,
    category: '',
    estimatedDuration: undefined,
    responsibleRole: '',
  });

  const [items, setItems] = useState<TemplateItemForm[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [users, setUsers] = useState<User[]>([]);

  useEffect(() => {
    api.get('/users').then((res) => setUsers(res.data)).catch(() => {});
    if (isEditMode) {
      loadTemplate();
    }
  }, [id]);

  const loadTemplate = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/checklists/templates/${id}`);
      const template: ChecklistTemplate = response.data;
      
      setFormData({
        name: template.name,
        description: template.description || '',
        type: template.type,
        category: template.category || '',
        estimatedDuration: template.estimatedDuration || undefined,
        responsibleRole: template.responsibleRole || '',
      });

      if (template.items) {
        setItems(
          template.items.map((item: ChecklistItem) => ({
            tempId: item.id,
            title: item.title,
            description: item.description || '',
            order: item.order,
            itemType: item.itemType,
            required: item.required,
            assignedRole: item.assignedRole || '',
            dueAfterDays: item.dueAfterDays || undefined,
            externalLink: item.externalLink || '',
            notifyUserIds: item.notifyUsers?.map((u) => u.id) || [],
          }))
        );
      }
    } catch (error) {
      console.error('Error loading template:', error);
      alert('Fehler beim Laden der Vorlage');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: keyof CreateTemplateDto, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const addItem = () => {
    const newItem: TemplateItemForm = {
      tempId: `temp-${Date.now()}`,
      title: '',
      description: '',
      order: items.length,
      itemType: ChecklistItemType.CHECKBOX,
      required: false,
      assignedRole: '',
      externalLink: '',
      notifyUserIds: [],
    };
    setItems([...items, newItem]);
  };

  const updateItem = (tempId: string, field: keyof TemplateItemForm, value: any) => {
    setItems((prev) =>
      prev.map((item) => (item.tempId === tempId ? { ...item, [field]: value } : item))
    );
  };

  const removeItem = (tempId: string) => {
    setItems((prev) => prev.filter((item) => item.tempId !== tempId));
  };

  const moveItem = (index: number, direction: 'up' | 'down') => {
    const newItems = [...items];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    
    if (targetIndex < 0 || targetIndex >= newItems.length) return;
    
    [newItems[index], newItems[targetIndex]] = [newItems[targetIndex], newItems[index]];
    
    // Update order numbers
    newItems.forEach((item, idx) => {
      item.order = idx;
    });
    
    setItems(newItems);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim()) {
      alert('Bitte geben Sie einen Namen für die Vorlage ein');
      return;
    }

    if (items.length === 0) {
      alert('Bitte fügen Sie mindestens einen Punkt zur Checkliste hinzu');
      return;
    }

    setSaving(true);
    try {
      // Create or update template
      let templateId = id;
      if (isEditMode) {
        await api.put(`/checklists/templates/${id}`, formData);
      } else {
        const templateResponse = await api.post('/checklists/templates', formData);
        templateId = templateResponse.data.id;
      }

      // Create/update items
      for (const item of items) {
        const itemData: CreateTemplateItemDto = {
          templateId: templateId!,
          title: item.title!,
          description: item.description,
          order: item.order!,
          itemType: item.itemType!,
          required: item.required,
          assignedRole: item.assignedRole,
          dueAfterDays: item.dueAfterDays,
          externalLink: item.externalLink || undefined,
          notifyUserIds: item.notifyUserIds || [],
        };

        if (item.tempId.startsWith('temp-')) {
          // New item - create it
          await api.post('/checklists/templates/items', itemData);
        } else {
          // Existing item - update it
          await api.put(`/checklists/templates/items/${item.tempId}`, {
            title: item.title,
            description: item.description,
            order: item.order,
            itemType: item.itemType,
            required: item.required,
            assignedRole: item.assignedRole,
            dueAfterDays: item.dueAfterDays,
            externalLink: item.externalLink || undefined,
            notifyUserIds: item.notifyUserIds || [],
          });
        }
      }

      alert(isEditMode ? 'Vorlage erfolgreich aktualisiert!' : 'Vorlage erfolgreich erstellt!');
      navigate('/checklists');
    } catch (error: any) {
      console.error('Error saving template:', error);
      alert(error.response?.data?.error || 'Fehler beim Speichern der Vorlage');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <>
        <AppNavbar title={isEditMode ? 'Vorlage bearbeiten' : 'Neue Vorlage'} onLogout={logout} />
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
      <AppNavbar title={isEditMode ? 'Vorlage bearbeiten' : 'Neue Vorlage'} onLogout={logout} />
      <Container maxWidth="lg">
      <Box sx={{ py: 4 }}>
        <Box sx={{ mb: 3, display: 'flex', alignItems: 'center', gap: 2 }}>
          <IconButton onClick={() => navigate('/checklists')}>
            <ArrowBackIcon />
          </IconButton>
          <Typography variant="h4">
            {isEditMode ? 'Checklisten-Vorlage bearbeiten' : 'Neue Checklisten-Vorlage'}
          </Typography>
        </Box>

        <form onSubmit={handleSubmit}>
          <Paper sx={{ p: 3, mb: 3 }}>
            <Typography variant="h6" gutterBottom>
              Vorlage-Details
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Name *"
                  value={formData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  required
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  select
                  label="Typ *"
                  value={formData.type}
                  onChange={(e) => handleInputChange('type', e.target.value)}
                  required
                >
                  <MenuItem value={ChecklistType.ONBOARDING}>Onboarding</MenuItem>
                  <MenuItem value={ChecklistType.OFFBOARDING}>Offboarding</MenuItem>
                  <MenuItem value={ChecklistType.AUDIT}>Audit</MenuItem>
                  <MenuItem value={ChecklistType.MAINTENANCE}>Wartung</MenuItem>
                  <MenuItem value={ChecklistType.PROJECT}>Projekt</MenuItem>
                  <MenuItem value={ChecklistType.CUSTOM}>Individuell</MenuItem>
                </TextField>
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  multiline
                  rows={3}
                  label="Beschreibung"
                  value={formData.description}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                />
              </Grid>
              <Grid item xs={12} md={4}>
                <TextField
                  fullWidth
                  label="Kategorie"
                  value={formData.category}
                  onChange={(e) => handleInputChange('category', e.target.value)}
                />
              </Grid>
              <Grid item xs={12} md={4}>
                <TextField
                  fullWidth
                  type="number"
                  label="Geschätzte Dauer (Minuten)"
                  value={formData.estimatedDuration || ''}
                  onChange={(e) => handleInputChange('estimatedDuration', e.target.value ? parseInt(e.target.value) : undefined)}
                />
              </Grid>
              <Grid item xs={12} md={4}>
                <TextField
                  fullWidth
                  label="Verantwortliche Rolle"
                  value={formData.responsibleRole}
                  onChange={(e) => handleInputChange('responsibleRole', e.target.value)}
                />
              </Grid>
            </Grid>
          </Paper>

          <Paper sx={{ p: 3, mb: 3 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h6">Checklisten-Punkte</Typography>
              <Button
                variant="outlined"
                startIcon={<AddIcon />}
                onClick={addItem}
              >
                Punkt hinzufügen
              </Button>
            </Box>

            {items.length === 0 ? (
              <Box sx={{ textAlign: 'center', py: 4, color: 'text.secondary' }}>
                <Typography>Noch keine Punkte hinzugefügt</Typography>
                <Typography variant="body2">
                  Klicken Sie auf "Punkt hinzufügen", um loszulegen
                </Typography>
              </Box>
            ) : (
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                {items.map((item, index) => (
                  <Card key={item.tempId} variant="outlined">
                    <CardContent>
                      <Grid container spacing={2}>
                        <Grid item xs={12} md={6}>
                          <TextField
                            fullWidth
                            label="Titel *"
                            value={item.title}
                            onChange={(e) => updateItem(item.tempId, 'title', e.target.value)}
                            required
                          />
                        </Grid>
                        <Grid item xs={12} md={6}>
                          <TextField
                            fullWidth
                            select
                            label="Typ *"
                            value={item.itemType}
                            onChange={(e) => updateItem(item.tempId, 'itemType', e.target.value)}
                            required
                          >
                            <MenuItem value={ChecklistItemType.CHECKBOX}>Checkbox</MenuItem>
                            <MenuItem value={ChecklistItemType.TEXT}>Text</MenuItem>
                            <MenuItem value={ChecklistItemType.DATE}>Datum</MenuItem>
                            <MenuItem value={ChecklistItemType.NUMBER}>Zahl</MenuItem>
                            <MenuItem value={ChecklistItemType.SELECT}>Auswahl</MenuItem>
                            <MenuItem value={ChecklistItemType.FILE_UPLOAD}>Datei-Upload</MenuItem>
                            <MenuItem value={ChecklistItemType.SIGNATURE}>Unterschrift</MenuItem>
                            <MenuItem value={ChecklistItemType.PHOTO}>Foto</MenuItem>
                          </TextField>
                        </Grid>
                        <Grid item xs={12}>
                          <TextField
                            fullWidth
                            multiline
                            rows={2}
                            label="Beschreibung"
                            value={item.description}
                            onChange={(e) => updateItem(item.tempId, 'description', e.target.value)}
                          />
                        </Grid>
                        <Grid item xs={12}>
                          <TextField
                            fullWidth
                            label="Externer Link (optional)"
                            placeholder="https://wiki.firma.ch/beispiel"
                            value={item.externalLink || ''}
                            onChange={(e) => updateItem(item.tempId, 'externalLink', e.target.value)}
                            helperText="Wird bei der Abarbeitung als klickbarer Link angezeigt"
                          />
                        </Grid>
                        <Grid item xs={12} md={4}>
                          <TextField
                            fullWidth
                            label="Zugewiesene Rolle"
                            value={item.assignedRole}
                            onChange={(e) => updateItem(item.tempId, 'assignedRole', e.target.value)}
                          />
                        </Grid>
                        <Grid item xs={12} md={4}>
                          <TextField
                            fullWidth
                            type="number"
                            label="Fällig nach Tagen"
                            value={item.dueAfterDays || ''}
                            onChange={(e) => updateItem(item.tempId, 'dueAfterDays', e.target.value ? parseInt(e.target.value) : undefined)}
                          />
                        </Grid>
                        <Grid item xs={12} md={4}>
                          <FormControlLabel
                            control={
                              <Checkbox
                                checked={item.required || false}
                                onChange={(e) => updateItem(item.tempId, 'required', e.target.checked)}
                              />
                            }
                            label="Pflichtfeld"
                          />
                        </Grid>
                        <Grid item xs={12}>
                          <Autocomplete
                            multiple
                            options={users}
                            getOptionLabel={(u) => `${u.firstName} ${u.lastName} (${u.email})`}
                            value={users.filter((u) => (item.notifyUserIds || []).includes(u.id))}
                            onChange={(_, selected) =>
                              updateItem(item.tempId, 'notifyUserIds', selected.map((u) => u.id))
                            }
                            renderTags={(value, getTagProps) =>
                              value.map((u, i) => (
                                <Chip
                                  {...getTagProps({ index: i })}
                                  key={u.id}
                                  label={`${u.firstName} ${u.lastName}`}
                                  size="small"
                                />
                              ))
                            }
                            renderInput={(params) => (
                              <TextField
                                {...params}
                                label="Nachricht an (ICS-Benachrichtigung bei Zuweisung)"
                                placeholder="Personen auswählen..."
                                helperText="Diese Personen erhalten eine ICS-Kalendereinladung, wenn die Checkliste zugewiesen wird"
                              />
                            )}
                          />
                        </Grid>
                        <Grid item xs={12}>
                          <Box sx={{ display: 'flex', gap: 1 }}>
                            <Button
                              size="small"
                              onClick={() => moveItem(index, 'up')}
                              disabled={index === 0}
                            >
                              ↑ Nach oben
                            </Button>
                            <Button
                              size="small"
                              onClick={() => moveItem(index, 'down')}
                              disabled={index === items.length - 1}
                            >
                              ↓ Nach unten
                            </Button>
                            <Box sx={{ flex: 1 }} />
                            <IconButton
                              color="error"
                              onClick={() => removeItem(item.tempId)}
                            >
                              <DeleteIcon />
                            </IconButton>
                          </Box>
                        </Grid>
                      </Grid>
                    </CardContent>
                  </Card>
                ))}
              </Box>
            )}
          </Paper>

          <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
            <Button
              variant="outlined"
              onClick={() => navigate('/checklists')}
            >
              Abbrechen
            </Button>
            <Button
              type="submit"
              variant="contained"
              startIcon={<SaveIcon />}
              disabled={saving}
            >
              {saving ? 'Wird gespeichert...' : isEditMode ? 'Aktualisieren' : 'Erstellen'}
            </Button>
          </Box>
        </form>
      </Box>
    </Container>
    </>
  );
};

export default ChecklistTemplateFormPage;
