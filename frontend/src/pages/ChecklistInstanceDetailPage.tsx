import React, { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Box,
  Paper,
  Button,
  Chip,
  LinearProgress,
  List,
  ListItem,
  ListItemText,
  Checkbox,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  IconButton,
  Divider,
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon,
  Edit as EditIcon,
  CheckCircle as CheckCircleIcon,
  Cancel as CancelIcon,
  OpenInNew as OpenInNewIcon,
} from '@mui/icons-material';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import AppNavbar from '../components/AppNavbar';
import api from '../services/api';
import {
  ChecklistInstance,
  ChecklistItemCompletion,
  ChecklistItemType,
  ChecklistStatus,
  CompleteItemDto,
} from '../types/checklist';

const ChecklistInstanceDetailPage: React.FC = () => {
  const navigate = useNavigate();
  const { logout } = useAuth();
  const { id } = useParams<{ id: string }>();
  const [instance, setInstance] = useState<ChecklistInstance | null>(null);
  const [loading, setLoading] = useState(true);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [selectedCompletion, setSelectedCompletion] = useState<ChecklistItemCompletion | null>(null);
  const [completionData, setCompletionData] = useState<Partial<CompleteItemDto>>({});

  useEffect(() => {
    loadInstance();
  }, [id]);

  const loadInstance = async () => {
    if (!id) return;
    setLoading(true);
    try {
      const response = await api.get(`/checklists/instances/${id}`);
      setInstance(response.data);
    } catch (error) {
      console.error('Error loading instance:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleComplete = async (completion: ChecklistItemCompletion) => {
    if (!instance) return;

    try {
      await api.post('/checklists/items/complete', {
        instanceId: instance.id,
        itemId: completion.itemId,
        completed: !completion.completed,
      });
      await loadInstance();
    } catch (error) {
      console.error('Error toggling completion:', error);
    }
  };

  const handleEditItem = (completion: ChecklistItemCompletion) => {
    setSelectedCompletion(completion);
    setCompletionData({
      instanceId: instance?.id,
      itemId: completion.itemId,
      completed: completion.completed,
      textValue: completion.textValue || '',
      numberValue: completion.numberValue || 0,
      dateValue: completion.dateValue || '',
      boolValue: completion.boolValue || false,
      comment: completion.comment || '',
    });
    setEditDialogOpen(true);
  };

  const handleSaveCompletion = async () => {
    if (!selectedCompletion || !instance) return;

    try {
      await api.post('/checklists/items/complete', completionData);
      setEditDialogOpen(false);
      await loadInstance();
    } catch (error) {
      console.error('Error saving completion:', error);
    }
  };

  const getStatusColor = (status: ChecklistStatus): 'default' | 'primary' | 'success' | 'error' | 'warning' => {
    switch (status) {
      case ChecklistStatus.COMPLETED:
        return 'success';
      case ChecklistStatus.IN_PROGRESS:
        return 'primary';
      case ChecklistStatus.OVERDUE:
        return 'error';
      case ChecklistStatus.CANCELLED:
        return 'default';
      default:
        return 'warning';
    }
  };

  const getStatusLabel = (status: ChecklistStatus): string => {
    switch (status) {
      case ChecklistStatus.NOT_STARTED:
        return 'Nicht gestartet';
      case ChecklistStatus.IN_PROGRESS:
        return 'In Bearbeitung';
      case ChecklistStatus.COMPLETED:
        return 'Abgeschlossen';
      case ChecklistStatus.CANCELLED:
        return 'Abgebrochen';
      case ChecklistStatus.OVERDUE:
        return 'Überfällig';
      default:
        return status;
    }
  };

  const renderItemInput = (completion: ChecklistItemCompletion) => {
    if (!completion.item) return null;

    switch (completion.item.itemType) {
      case ChecklistItemType.CHECKBOX:
        return (
          <Checkbox
            checked={completion.completed}
            onChange={() => handleToggleComplete(completion)}
            color="primary"
          />
        );
      case ChecklistItemType.TEXT:
        return completion.textValue ? (
          <Typography variant="body2" color="text.secondary">
            {completion.textValue}
          </Typography>
        ) : null;
      case ChecklistItemType.NUMBER:
        return completion.numberValue !== null ? (
          <Typography variant="body2" color="text.secondary">
            {completion.numberValue}
          </Typography>
        ) : null;
      case ChecklistItemType.DATE:
        return completion.dateValue ? (
          <Typography variant="body2" color="text.secondary">
            {new Date(completion.dateValue).toLocaleDateString('de-CH')}
          </Typography>
        ) : null;
      default:
        return null;
    }
  };

  if (loading || !instance) {
    return (
      <>
        <AppNavbar title="Checkliste" onLogout={logout} />
        <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
          <LinearProgress />
        </Container>
      </>
    );
  }

  return (
    <>
      <AppNavbar title={instance.template?.name || 'Checkliste'} onLogout={logout} />
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
        <IconButton onClick={() => navigate('/checklists')} sx={{ mr: 2 }}>
          <ArrowBackIcon />
        </IconButton>
        <Typography variant="h4" component="h1" sx={{ flexGrow: 1 }}>
          {instance.template?.name}
        </Typography>
        <Chip label={getStatusLabel(instance.status)} color={getStatusColor(instance.status)} />
      </Box>

      {/* Info Card */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          Information
        </Typography>
        <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 2 }}>
          <Box>
            <Typography variant="body2" color="text.secondary">
              Mitarbeiter
            </Typography>
            <Typography variant="body1">
              {instance.user?.firstName} {instance.user?.lastName}
            </Typography>
          </Box>
          {instance.assignedTo && (
            <Box>
              <Typography variant="body2" color="text.secondary">
                Zugewiesen an
              </Typography>
              <Typography variant="body1">
                {instance.assignedTo.firstName} {instance.assignedTo.lastName}
              </Typography>
            </Box>
          )}
          <Box>
            <Typography variant="body2" color="text.secondary">
              Startdatum
            </Typography>
            <Typography variant="body1">
              {new Date(instance.startDate).toLocaleDateString('de-CH')}
            </Typography>
          </Box>
          {instance.targetEndDate && (
            <Box>
              <Typography variant="body2" color="text.secondary">
                Zieldatum
              </Typography>
              <Typography variant="body1">
                {new Date(instance.targetEndDate).toLocaleDateString('de-CH')}
              </Typography>
            </Box>
          )}
        </Box>

        {/* Progress */}
        <Box sx={{ mt: 3 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
            <Typography variant="body2" color="text.secondary">
              Fortschritt
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {instance.completedItems} / {instance.totalItems} ({instance.progressPercent}%)
            </Typography>
          </Box>
          <LinearProgress variant="determinate" value={instance.progressPercent} />
        </Box>

        {instance.notes && (
          <Box sx={{ mt: 2 }}>
            <Typography variant="body2" color="text.secondary">
              Notizen
            </Typography>
            <Typography variant="body1">{instance.notes}</Typography>
          </Box>
        )}
      </Paper>

      {/* Checklist Items */}
      <Paper sx={{ p: 3 }}>
        <Typography variant="h6" gutterBottom>
          Aufgaben
        </Typography>
        <List>
          {instance.completions?.map((completion, index) => (
            <React.Fragment key={completion.id}>
              {index > 0 && <Divider />}
              <ListItem
                secondaryAction={
                  <Box sx={{ display: 'flex', gap: 1 }}>
                    {completion.completed && <CheckCircleIcon color="success" />}
                    <IconButton edge="end" onClick={() => handleEditItem(completion)}>
                      <EditIcon />
                    </IconButton>
                  </Box>
                }
              >
                <Box sx={{ display: 'flex', alignItems: 'flex-start', width: '100%' }}>
                  {completion.item?.itemType === ChecklistItemType.CHECKBOX && (
                    <Checkbox
                      checked={completion.completed}
                      onChange={() => handleToggleComplete(completion)}
                      sx={{ mt: -1, mr: 1 }}
                    />
                  )}
                  <ListItemText
                    primary={
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Typography
                          variant="body1"
                          sx={{
                            textDecoration: completion.completed ? 'line-through' : 'none',
                          }}
                        >
                          {completion.item?.title}
                          {completion.item?.required && (
                            <Chip label="Pflicht" size="small" color="error" sx={{ ml: 1 }} />
                          )}
                        </Typography>
                      </Box>
                    }
                    secondary={
                      <Box>
                        {completion.item?.description && (
                          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                            {completion.item.description}
                          </Typography>
                        )}
                        {completion.item?.externalLink && (
                          <Box sx={{ mt: 0.5 }}>
                            <Button
                              size="small"
                              variant="outlined"
                              startIcon={<OpenInNewIcon />}
                              href={completion.item.externalLink}
                              target="_blank"
                              rel="noopener noreferrer"
                              sx={{ textTransform: 'none' }}
                            >
                              Link öffnen
                            </Button>
                          </Box>
                        )}
                        {renderItemInput(completion)}
                        {completion.comment && (
                          <Typography
                            variant="body2"
                            color="text.secondary"
                            sx={{ mt: 1, fontStyle: 'italic' }}
                          >
                            Kommentar: {completion.comment}
                          </Typography>
                        )}
                        {completion.completedAt && (
                          <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5 }}>
                            Abgeschlossen am{' '}
                            {new Date(completion.completedAt).toLocaleString('de-CH')}
                            {completion.completedBy &&
                              ` von ${completion.completedBy.firstName} ${completion.completedBy.lastName}`}
                          </Typography>
                        )}
                      </Box>
                    }
                  />
                </Box>
              </ListItem>
            </React.Fragment>
          ))}
        </List>
      </Paper>

      {/* Edit Item Dialog */}
      <Dialog open={editDialogOpen} onClose={() => setEditDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Aufgabe bearbeiten</DialogTitle>
        <DialogContent>
          {selectedCompletion && (
            <Box sx={{ mt: 2 }}>
              <Typography variant="h6" gutterBottom>
                {selectedCompletion.item?.title}
              </Typography>
              {selectedCompletion.item?.description && (
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  {selectedCompletion.item.description}
                </Typography>
              )}
              {selectedCompletion.item?.externalLink && (
                <Box sx={{ mb: 1 }}>
                  <Button
                    size="small"
                    variant="outlined"
                    startIcon={<OpenInNewIcon />}
                    href={selectedCompletion.item.externalLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    sx={{ textTransform: 'none' }}
                  >
                    Link öffnen
                  </Button>
                </Box>
              )}

              {selectedCompletion.item?.itemType === ChecklistItemType.TEXT && (
                <TextField
                  fullWidth
                  label="Text"
                  multiline
                  rows={3}
                  value={completionData.textValue || ''}
                  onChange={(e) =>
                    setCompletionData({ ...completionData, textValue: e.target.value })
                  }
                  sx={{ mt: 2 }}
                />
              )}

              {selectedCompletion.item?.itemType === ChecklistItemType.NUMBER && (
                <TextField
                  fullWidth
                  label="Zahl"
                  type="number"
                  value={completionData.numberValue || 0}
                  onChange={(e) =>
                    setCompletionData({
                      ...completionData,
                      numberValue: parseFloat(e.target.value),
                    })
                  }
                  sx={{ mt: 2 }}
                />
              )}

              {selectedCompletion.item?.itemType === ChecklistItemType.DATE && (
                <TextField
                  fullWidth
                  label="Datum"
                  type="date"
                  value={completionData.dateValue || ''}
                  onChange={(e) =>
                    setCompletionData({ ...completionData, dateValue: e.target.value })
                  }
                  InputLabelProps={{ shrink: true }}
                  sx={{ mt: 2 }}
                />
              )}

              <TextField
                fullWidth
                label="Kommentar"
                multiline
                rows={2}
                value={completionData.comment || ''}
                onChange={(e) => setCompletionData({ ...completionData, comment: e.target.value })}
                sx={{ mt: 2 }}
              />

              <FormControl fullWidth sx={{ mt: 2 }}>
                <InputLabel>Status</InputLabel>
                <Select
                  value={completionData.completed ? 'completed' : 'incomplete'}
                  onChange={(e) =>
                    setCompletionData({
                      ...completionData,
                      completed: e.target.value === 'completed',
                    })
                  }
                >
                  <MenuItem value="incomplete">Nicht abgeschlossen</MenuItem>
                  <MenuItem value="completed">Abgeschlossen</MenuItem>
                </Select>
              </FormControl>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditDialogOpen(false)}>Abbrechen</Button>
          <Button variant="contained" onClick={handleSaveCompletion}>
            Speichern
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
    </>
  );
};

export default ChecklistInstanceDetailPage;
