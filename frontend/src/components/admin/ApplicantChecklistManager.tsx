import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Typography,
  Paper,
  LinearProgress,
  Chip,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Checkbox,
  Divider,
  Grid,
  Card,
  CardContent,
} from '@mui/material';
import {
  CheckCircle,
  Assignment,
  HourglassEmpty,
  PersonAdd,
  Warning,
} from '@mui/icons-material';
import api from '../../services/api';
import { ChecklistTemplate } from '../../types/checklist';

interface ChecklistInstance {
  id: string;
  status: string;
  startDate: string;
  completedDate?: string;
  totalItems: number;
  completedItems: number;
  progressPercent: number;
  template?: {
    id: string;
    name: string;
    description?: string;
    estimatedDuration?: number;
    items?: ChecklistItem[];
  };
  completions?: ChecklistItemCompletion[];
  assignedTo?: {
    id: string;
    firstName: string;
    lastName: string;
  };
}

interface ChecklistItem {
  id: string;
  title: string;
  description?: string;
  order: number;
  required: boolean;
  assignedRole?: string;
}

interface ChecklistItemCompletion {
  id: string;
  itemId: string;
  completed: boolean;
  completedAt?: string;
  completedBy?: {
    firstName: string;
    lastName: string;
  };
  item?: ChecklistItem;
}

interface ApplicantChecklistManagerProps {
  applicantId: string;
  applicantName: string;
  applicantStatus: string;
  onUpdate?: () => void;
}

const ApplicantChecklistManager: React.FC<ApplicantChecklistManagerProps> = ({
  applicantId,
  applicantName,
  applicantStatus,
  onUpdate,
}) => {
  const [checklist, setChecklist] = useState<ChecklistInstance | null>(null);
  const [templates, setTemplates] = useState<ChecklistTemplate[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');
  const [assignDialogOpen, setAssignDialogOpen] = useState(false);
  const [finalizeDialogOpen, setFinalizeDialogOpen] = useState(false);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>('');
  const [finalizeData, setFinalizeData] = useState({
    password: '',
    department: '',
    weeklyHours: 45,
    startDate: new Date().toISOString().split('T')[0],
  });

  useEffect(() => {
    loadChecklist();
    loadTemplates();
  }, [applicantId]);

  const loadChecklist = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/onboarding/applicants/${applicantId}/checklist`);
      setChecklist(response.data);
    } catch (error: any) {
      if (error.response?.status !== 404) {
        console.error('Error loading checklist:', error);
      }
      setChecklist(null);
    } finally {
      setLoading(false);
    }
  };

  const loadTemplates = async () => {
    try {
      const response = await api.get('/checklists/templates');
      const desktopTemplates = response.data.filter(
        (t: ChecklistTemplate) => t.category === 'ONBOARDING_DESKTOP' && t.isActive !== false
      );
      setTemplates(desktopTemplates);
    } catch (error) {
      console.error('Error loading templates:', error);
    }
  };

  const handleAssignChecklist = async () => {
    if (!selectedTemplateId) {
      setError('Bitte wählen Sie eine Vorlage aus');
      return;
    }

    try {
      setLoading(true);
      await api.post(`/onboarding/applicants/${applicantId}/assign-checklist`, {
        templateId: selectedTemplateId,
      });
      await loadChecklist();
      setAssignDialogOpen(false);
      setSelectedTemplateId('');
      onUpdate?.();
    } catch (error: any) {
      console.error('Error assigning checklist:', error);
      setError(error.response?.data?.error || 'Fehler beim Zuweisen der Checkliste');
    } finally {
      setLoading(false);
    }
  };

  const handleFinalizeOnboarding = async () => {
    if (!finalizeData.password || finalizeData.password.length < 8) {
      setError('Passwort muss mindestens 8 Zeichen lang sein');
      return;
    }

    try {
      setLoading(true);
      await api.post(`/onboarding/applicants/${applicantId}/finalize-onboarding`, finalizeData);
      setFinalizeDialogOpen(false);
      onUpdate?.();
      setError('');
      alert('✅ Onboarding erfolgreich abgeschlossen! Mitarbeiter-Account wurde erstellt.');
    } catch (error: any) {
      console.error('Error finalizing onboarding:', error);
      setError(error.response?.data?.error || 'Fehler beim Abschließen des Onboardings');
    } finally {
      setLoading(false);
    }
  };

  const canFinalizeOnboarding = () => {
    return (
      applicantStatus === 'HIRED' &&
      checklist &&
      checklist.completedItems === checklist.totalItems &&
      checklist.totalItems > 0
    );
  };

  if (loading && !checklist) {
    return <Typography>Lädt Checkliste...</Typography>;
  }

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h6">🖥️ Onboarding Desktop Checkliste</Typography>
        {!checklist && (
          <Button
            variant="contained"
            size="small"
            onClick={() => setAssignDialogOpen(true)}
            disabled={applicantStatus !== 'HIRED'}
          >
            Checkliste zuweisen
          </Button>
        )}
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>
          {error}
        </Alert>
      )}

      {applicantStatus !== 'HIRED' && !checklist && (
        <Alert severity="info" sx={{ mb: 2 }}>
          Checklisten können nur für Bewerber mit Status "Eingestellt" (HIRED) zugewiesen werden.
        </Alert>
      )}

      {!checklist ? (
        <Paper sx={{ p: 3, textAlign: 'center' }}>
          <Assignment sx={{ fontSize: 60, color: 'text.disabled', mb: 2 }} />
          <Typography variant="body1" color="text.secondary" gutterBottom>
            Keine Checkliste zugewiesen
          </Typography>
          {applicantStatus === 'HIRED' && (
            <Button
              variant="outlined"
              onClick={() => setAssignDialogOpen(true)}
              sx={{ mt: 2 }}
            >
              Checkliste zuweisen
            </Button>
          )}
        </Paper>
      ) : (
        <>
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Grid container spacing={2}>
                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle2" color="text.secondary">
                    Vorlage
                  </Typography>
                  <Typography variant="body1" fontWeight="medium">
                    {checklist.template?.name || 'Unbekannte Vorlage'}
                  </Typography>
                  {checklist.template?.description && (
                    <Typography variant="body2" color="text.secondary">
                      {checklist.template.description}
                    </Typography>
                  )}
                </Grid>
                <Grid item xs={12} md={6}>
                  <Box sx={{ textAlign: 'right' }}>
                    <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                      Status
                    </Typography>
                    <Chip
                      icon={
                        checklist.status === 'COMPLETED' ? (
                          <CheckCircle />
                        ) : (
                          <HourglassEmpty />
                        )
                      }
                      label={
                        checklist.status === 'COMPLETED'
                          ? 'Abgeschlossen'
                          : 'In Bearbeitung'
                      }
                      color={checklist.status === 'COMPLETED' ? 'success' : 'warning'}
                    />
                  </Box>
                </Grid>
              </Grid>

              <Box sx={{ mt: 3 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <Typography variant="body2">Fortschritt</Typography>
                  <Typography variant="body2" fontWeight="medium">
                    {checklist.completedItems} / {checklist.totalItems} Aufgaben
                  </Typography>
                </Box>
                <LinearProgress
                  variant="determinate"
                  value={checklist.progressPercent}
                  sx={{ height: 8, borderRadius: 1 }}
                />
                <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block' }}>
                  {checklist.progressPercent.toFixed(0)}% abgeschlossen
                </Typography>
              </Box>
            </CardContent>
          </Card>

          {/* Checklist Items */}
          <Paper>
            <List>
              {checklist.template?.items?.map((item, index) => {
                const completion = checklist.completions?.find((c) => c.itemId === item.id);
                const isCompleted = completion?.completed || false;

                return (
                  <React.Fragment key={item.id}>
                    <ListItem>
                      <ListItemIcon>
                        <Checkbox
                          edge="start"
                          checked={isCompleted}
                          disabled
                          icon={<CheckCircle color="disabled" />}
                          checkedIcon={<CheckCircle color="success" />}
                        />
                      </ListItemIcon>
                      <ListItemText
                        primary={
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Typography
                              variant="body1"
                              sx={{
                                textDecoration: isCompleted ? 'line-through' : 'none',
                                color: isCompleted ? 'text.secondary' : 'text.primary',
                              }}
                            >
                              {item.title}
                            </Typography>
                            {item.required && (
                              <Chip label="Pflicht" size="small" color="error" variant="outlined" />
                            )}
                          </Box>
                        }
                        secondary={
                          <>
                            {item.description && (
                              <Typography variant="body2" color="text.secondary">
                                {item.description}
                              </Typography>
                            )}
                            {isCompleted && completion?.completedAt && (
                              <Typography variant="caption" color="success.main">
                                ✓ Abgeschlossen am{' '}
                                {new Date(completion.completedAt).toLocaleDateString('de-CH')}
                                {completion.completedBy &&
                                  ` von ${completion.completedBy.firstName} ${completion.completedBy.lastName}`}
                              </Typography>
                            )}
                          </>
                        }
                      />
                    </ListItem>
                    {index < checklist.template!.items!.length - 1 && <Divider />}
                  </React.Fragment>
                );
              })}
            </List>
          </Paper>

          {/* Finalize Button */}
          {canFinalizeOnboarding() && (
            <Box sx={{ mt: 3, p: 2, bgcolor: 'success.lighter', borderRadius: 1 }}>
              <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2 }}>
                <CheckCircle color="success" />
                <Box sx={{ flex: 1 }}>
                  <Typography variant="subtitle1" fontWeight="medium" gutterBottom>
                    Onboarding bereit zum Abschluss
                  </Typography>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    Alle Aufgaben wurden abgeschlossen. Sie können jetzt den Mitarbeiter-Account
                    erstellen und das Onboarding finalisieren.
                  </Typography>
                  <Button
                    variant="contained"
                    color="success"
                    startIcon={<PersonAdd />}
                    onClick={() => setFinalizeDialogOpen(true)}
                    sx={{ mt: 2 }}
                  >
                    Onboarding abschließen & Account erstellen
                  </Button>
                </Box>
              </Box>
            </Box>
          )}

          {checklist.completedItems < checklist.totalItems && (
            <Alert severity="warning" sx={{ mt: 3 }}>
              <Typography variant="body2">
                <strong>Hinweis:</strong> Alle Aufgaben müssen abgeschlossen sein, bevor der
                Bewerber zum Mitarbeiter finalisiert werden kann. Bitte über die Checklisten-Ansicht
                die Aufgaben abhaken.
              </Typography>
            </Alert>
          )}
        </>
      )}

      {/* Assign Checklist Dialog */}
      <Dialog open={assignDialogOpen} onClose={() => setAssignDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Onboarding Desktop Checkliste zuweisen</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" paragraph>
            Wählen Sie eine Checklisten-Vorlage für {applicantName}:
          </Typography>
          {templates.length === 0 ? (
            <Alert severity="warning">
              Keine Desktop-Checklisten-Vorlagen verfügbar. Bitte erstellen Sie zuerst eine
              Vorlage im Desktop-Tab.
            </Alert>
          ) : (
            <TextField
              fullWidth
              select
              label="Checklisten-Vorlage"
              value={selectedTemplateId}
              onChange={(e) => setSelectedTemplateId(e.target.value)}
              margin="normal"
              required
            >
              {templates.map((template) => (
                <MenuItem key={template.id} value={template.id}>
                  {template.name}
                  {template.description && (
                    <Typography variant="caption" color="text.secondary" sx={{ ml: 1 }}>
                      - {template.description}
                    </Typography>
                  )}
                </MenuItem>
              ))}
            </TextField>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAssignDialogOpen(false)}>Abbrechen</Button>
          <Button
            variant="contained"
            onClick={handleAssignChecklist}
            disabled={!selectedTemplateId || loading}
          >
            Zuweisen
          </Button>
        </DialogActions>
      </Dialog>

      {/* Finalize Onboarding Dialog */}
      <Dialog open={finalizeDialogOpen} onClose={() => setFinalizeDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Onboarding abschließen & Mitarbeiter-Account erstellen</DialogTitle>
        <DialogContent>
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}
          <Alert severity="info" sx={{ mb: 2 }}>
            Ein neuer User-Account und Mitarbeiter-Datensatz wird für <strong>{applicantName}</strong>{' '}
            erstellt. Der Bewerber erhält eine E-Mail mit den Zugangsdaten.
          </Alert>

          <TextField
            fullWidth
            type="password"
            label="Temporäres Passwort"
            value={finalizeData.password}
            onChange={(e) => setFinalizeData({ ...finalizeData, password: e.target.value })}
            margin="normal"
            required
            helperText="Mind. 8 Zeichen. Benutzer wird aufgefordert, das Passwort beim ersten Login zu ändern."
          />

          <TextField
            fullWidth
            label="Abteilung"
            value={finalizeData.department}
            onChange={(e) => setFinalizeData({ ...finalizeData, department: e.target.value })}
            margin="normal"
          />

          <TextField
            fullWidth
            type="number"
            label="Wochenstunden"
            value={finalizeData.weeklyHours}
            onChange={(e) =>
              setFinalizeData({ ...finalizeData, weeklyHours: parseInt(e.target.value) })
            }
            margin="normal"
            inputProps={{ min: 1, max: 50 }}
          />

          <TextField
            fullWidth
            type="date"
            label="Startdatum"
            value={finalizeData.startDate}
            onChange={(e) => setFinalizeData({ ...finalizeData, startDate: e.target.value })}
            margin="normal"
            InputLabelProps={{ shrink: true }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setFinalizeDialogOpen(false)}>Abbrechen</Button>
          <Button
            variant="contained"
            color="success"
            onClick={handleFinalizeOnboarding}
            disabled={loading || !finalizeData.password}
          >
            Account erstellen & Abschließen
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ApplicantChecklistManager;
