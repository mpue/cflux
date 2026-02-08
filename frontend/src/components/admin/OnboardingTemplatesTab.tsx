import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Grid,
  Card,
  CardContent,
  CardActions,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  IconButton,
  Chip,
  Tabs,
  Tab,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormControlLabel,
  Switch,
  Alert,
  CircularProgress,
  Typography,
} from '@mui/material';
import {
  Add,
  Edit,
  Assignment,
  School,
  Schedule,
} from '@mui/icons-material';
import { trainingService } from '../../services/onboardingService';
import { TrainingCatalog } from '../../types/onboarding';
import ChecklistsTab from './ChecklistsTab';

interface OnboardingTemplatesTabProps {
  onUpdate?: () => void;
}

type TabValue = 'checklists' | 'trainings';

const OnboardingTemplatesTab: React.FC<OnboardingTemplatesTabProps> = ({ onUpdate }) => {
  const [activeTab, setActiveTab] = useState<TabValue>('checklists');
  const [trainings, setTrainings] = useState<TrainingCatalog[]>([]);
  const [selectedTraining, setSelectedTraining] = useState<TrainingCatalog | null>(null);
  const [loading, setLoading] = useState(false);
  const [trainingDialogOpen, setTrainingDialogOpen] = useState(false);

  const [trainingForm, setTrainingForm] = useState({
    title: '',
    description: '',
    type: 'COMPANY_INTRO',
    autoAssignForPositions: [] as string[],
    daysAfterStart: undefined as number | undefined,
    isRecurring: false,
    recurringMonths: undefined as number | undefined,
  });

  useEffect(() => {
    if (activeTab === 'trainings') {
      loadTrainings();
    }
  }, [activeTab]);

  const loadTrainings = async () => {
    setLoading(true);
    try {
      const data = await trainingService.getAllCatalog({ isActive: true });
      setTrainings(data);
    } catch (error) {
      console.error('Error loading trainings:', error);
    } finally {
      setLoading(false);
    }
  };

  // ==================== TRAINING HANDLERS ====================

  const handleCreateTraining = async () => {
    try {
      await trainingService.createCatalog(trainingForm);
      setTrainingDialogOpen(false);
      resetTrainingForm();
      loadTrainings();
      onUpdate?.();
    } catch (error) {
      console.error('Error creating training:', error);
    }
  };

  const handleEditTraining = async (training: TrainingCatalog) => {
    setSelectedTraining(training);
    setTrainingForm({
      title: training.title,
      description: training.description || '',
      type: training.type,
      autoAssignForPositions: training.autoAssignForPositions || [],
      daysAfterStart: training.daysAfterStart || undefined,
      isRecurring: training.isRecurring,
      recurringMonths: training.recurringMonths || undefined,
    });
    setTrainingDialogOpen(true);
  };

  const handleUpdateTraining = async () => {
    if (!selectedTraining) return;
    try {
      await trainingService.updateCatalog(selectedTraining.id, trainingForm);
      setTrainingDialogOpen(false);
      resetTrainingForm();
      setSelectedTraining(null);
      loadTrainings();
      onUpdate?.();
    } catch (error) {
      console.error('Error updating training:', error);
    }
  };

  const resetTrainingForm = () => {
    setTrainingForm({
      title: '',
      description: '',
      type: 'COMPANY_INTRO',
      autoAssignForPositions: [],
      daysAfterStart: undefined,
      isRecurring: false,
      recurringMonths: undefined,
    });
  };

  // ==================== RENDER ====================

  const renderTrainingsTab = () => (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h6" gutterBottom>
            Schulungen
          </Typography>
          <Typography variant="body2" color="textSecondary">
            Ordnen Sie Schulungen zu, die automatisch neuen Mitarbeitern zugewiesen werden
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={() => {
            setSelectedTraining(null);
            resetTrainingForm();
            setTrainingDialogOpen(true);
          }}
        >
          Neue Schulung
        </Button>
      </Box>

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
          <CircularProgress />
        </Box>
      ) : trainings.length === 0 ? (
        <Alert severity="info">
          Noch keine Schulungen vorhanden. Erstellen Sie Ihre erste Schulung!
        </Alert>
      ) : (
        <Grid container spacing={3}>
          {trainings.map((training) => (
            <Grid item xs={12} md={6} lg={4} key={training.id}>
              <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                <CardContent sx={{ flexGrow: 1 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                    <Typography variant="h6" gutterBottom>
                      {training.title}
                    </Typography>
                    <Chip
                      icon={<School />}
                      label={training.type}
                      size="small"
                      color="secondary"
                      variant="outlined"
                    />
                  </Box>

                  {training.description && (
                    <Typography variant="body2" color="textSecondary" paragraph>
                      {training.description}
                    </Typography>
                  )}

                  <Box sx={{ mt: 2 }}>
                    {training.autoAssignForPositions && training.autoAssignForPositions.length > 0 && (
                      <Box sx={{ mb: 1 }}>
                        <Typography variant="caption" color="textSecondary" gutterBottom display="block">
                          Auto-Zuweisung für Positionen:
                        </Typography>
                        <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
                          {training.autoAssignForPositions.map((pos, idx) => (
                            <Chip key={idx} label={pos} size="small" />
                          ))}
                        </Box>
                      </Box>
                    )}

                    {training.daysAfterStart && (
                      <Typography variant="body2" color="textSecondary" sx={{ mt: 1 }}>
                        <Schedule fontSize="small" sx={{ verticalAlign: 'middle', mr: 0.5 }} />
                        {training.daysAfterStart} Tage nach Starttag
                      </Typography>
                    )}

                    {training.isRecurring && (
                      <Chip
                        label={`Wiederkehrend alle ${training.recurringMonths} Monate`}
                        size="small"
                        color="info"
                        sx={{ mt: 1 }}
                      />
                    )}
                  </Box>
                </CardContent>

                <CardActions sx={{ justifyContent: 'flex-end', px: 2, pb: 2 }}>
                  <IconButton size="small" onClick={() => handleEditTraining(training)}>
                    <Edit fontSize="small" />
                  </IconButton>
                </CardActions>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}
    </Box>
  );

  return (
    <Box>
      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs value={activeTab} onChange={(_, newValue) => setActiveTab(newValue)}>
          <Tab icon={<Assignment />} label="Checklisten" value="checklists" />
          <Tab icon={<School />} label="Schulungen" value="trainings" />
        </Tabs>
      </Box>

      {activeTab === 'checklists' && <ChecklistsTab onUpdate={onUpdate} />}
      {activeTab === 'trainings' && renderTrainingsTab()}

      {/* Training Create/Edit Dialog */}
      <Dialog
        open={trainingDialogOpen}
        onClose={() => {
          setTrainingDialogOpen(false);
          setSelectedTraining(null);
        }}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          {selectedTraining ? 'Schulung bearbeiten' : 'Neue Schulung'}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
            <TextField
              label="Titel"
              fullWidth
              required
              value={trainingForm.title}
              onChange={(e) => setTrainingForm({ ...trainingForm, title: e.target.value })}
            />
            <TextField
              label="Beschreibung"
              fullWidth
              multiline
              rows={3}
              value={trainingForm.description}
              onChange={(e) => setTrainingForm({ ...trainingForm, description: e.target.value })}
            />
            <FormControl fullWidth>
              <InputLabel>Typ</InputLabel>
              <Select
                value={trainingForm.type}
                label="Typ"
                onChange={(e) => setTrainingForm({ ...trainingForm, type: e.target.value })}
              >
                <MenuItem value="COMPANY_INTRO">Firmeneinfühung</MenuItem>
                <MenuItem value="PRODUCT">Produkt</MenuItem>
                <MenuItem value="COMPLIANCE">Compliance</MenuItem>
                <MenuItem value="SOFTWARE">Software</MenuItem>
                <MenuItem value="SAFETY">Sicherheit</MenuItem>
                <MenuItem value="TECHNICAL">Technisch</MenuItem>
              </Select>
            </FormControl>
            <TextField
              label="Tage nach Start"
              type="number"
              fullWidth
              value={trainingForm.daysAfterStart || ''}
              onChange={(e) =>
                setTrainingForm({
                  ...trainingForm,
                  daysAfterStart: e.target.value ? parseInt(e.target.value) : undefined,
                })
              }
              helperText="Automatische Zuweisung X Tage nach Startdatum"
            />
            <FormControlLabel
              control={
                <Switch
                  checked={trainingForm.isRecurring}
                  onChange={(e) => setTrainingForm({ ...trainingForm, isRecurring: e.target.checked })}
                />
              }
              label="Wiederkehrend"
            />
            {trainingForm.isRecurring && (
              <TextField
                label="Wiederkehrend alle (Monate)"
                type="number"
                fullWidth
                value={trainingForm.recurringMonths || ''}
                onChange={(e) =>
                  setTrainingForm({
                    ...trainingForm,
                    recurringMonths: e.target.value ? parseInt(e.target.value) : undefined,
                  })
                }
              />
            )}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => {
              setTrainingDialogOpen(false);
              setSelectedTraining(null);
            }}
          >
            Abbrechen
          </Button>
          <Button
            variant="contained"
            onClick={selectedTraining ? handleUpdateTraining : handleCreateTraining}
          >
            {selectedTraining ? 'Aktualisieren' : 'Erstellen'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default OnboardingTemplatesTab;
