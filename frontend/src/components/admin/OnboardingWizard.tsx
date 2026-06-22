import React, { useState, useEffect } from 'react';
import { onboardingService } from '../../services/onboardingService';
import { Employee } from '../../types/onboarding';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  IconButton,
  Stepper,
  Step,
  StepLabel,
  TextField,
  MenuItem,
  RadioGroup,
  FormControlLabel,
  Radio,
  Autocomplete,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Checkbox,
  Chip,
  Alert,
  CircularProgress,
  Divider,
} from '@mui/material';
import { Close, CheckCircle } from '@mui/icons-material';

interface OnboardingWizardProps {
  open: boolean;
  onClose: () => void;
  onCreated: () => void;
}

interface ChecklistTemplateLite {
  id: string;
  name: string;
  description?: string;
  type: string;
  isActive: boolean;
  _count?: { items: number };
}

const steps = ['Mitarbeiter', 'Hauptverantwortlicher', 'Checklisten', 'Zusammenfassung'];

const emptyNewEmployee = {
  firstName: '',
  lastName: '',
  email: '',
  position: '',
  department: '',
};

const OnboardingWizard: React.FC<OnboardingWizardProps> = ({ open, onClose, onCreated }) => {
  const [activeStep, setActiveStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [employees, setEmployees] = useState<Employee[]>([]);
  const [templates, setTemplates] = useState<ChecklistTemplateLite[]>([]);

  // Step 1: employee
  const [employeeMode, setEmployeeMode] = useState<'existing' | 'new'>('existing');
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [newEmployee, setNewEmployee] = useState({ ...emptyNewEmployee });

  // Step 2: tutor (Hauptverantwortlicher) + weitere Verantwortliche
  const [tutor, setTutor] = useState<Employee | null>(null);
  const [responsibles, setResponsibles] = useState<Employee[]>([]);

  // Step 3: checklists
  const [selectedTemplateIds, setSelectedTemplateIds] = useState<string[]>([]);
  const [targetEndDate, setTargetEndDate] = useState('');
  const [notes, setNotes] = useState('');

  // Reset and load data when opened
  useEffect(() => {
    if (!open) return;
    setActiveStep(0);
    setError(null);
    setEmployeeMode('existing');
    setSelectedEmployee(null);
    setNewEmployee({ ...emptyNewEmployee });
    setTutor(null);
    setResponsibles([]);
    setSelectedTemplateIds([]);
    setTargetEndDate('');
    setNotes('');

    const load = async () => {
      setLoading(true);
      try {
        const [emps, tpls] = await Promise.all([
          onboardingService.getAllEmployees({ isActive: true }),
          onboardingService.getChecklistTemplates({ isActive: true }),
        ]);
        setEmployees(emps);
        setTemplates(tpls);
      } catch (e: any) {
        setError(e?.response?.data?.details || e?.message || 'Fehler beim Laden der Daten');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [open]);

  const employeeName = (e: Employee | null) =>
    e ? `${e.firstName} ${e.lastName}${e.position ? ` (${e.position})` : ''}` : '';

  const toggleTemplate = (id: string) => {
    setSelectedTemplateIds((prev) =>
      prev.includes(id) ? prev.filter((t) => t !== id) : [...prev, id]
    );
  };

  const isStepValid = (step: number): boolean => {
    switch (step) {
      case 0:
        if (employeeMode === 'existing') return !!selectedEmployee;
        return (
          newEmployee.firstName.trim() !== '' &&
          newEmployee.lastName.trim() !== '' &&
          newEmployee.email.trim() !== ''
        );
      case 1:
        return !!tutor;
      case 2:
        return selectedTemplateIds.length > 0;
      default:
        return true;
    }
  };

  const handleNext = () => {
    setError(null);
    setActiveStep((s) => Math.min(s + 1, steps.length - 1));
  };

  const handleBack = () => {
    setError(null);
    setActiveStep((s) => Math.max(s - 1, 0));
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    setError(null);
    try {
      await onboardingService.startOnboarding({
        employeeId: employeeMode === 'existing' ? selectedEmployee?.id : undefined,
        newEmployee: employeeMode === 'new' ? { ...newEmployee } : undefined,
        tutorEmployeeId: tutor!.id,
        responsibleEmployeeIds: responsibles
          .filter((r) => r.id !== tutor!.id)
          .map((r) => r.id),
        templateIds: selectedTemplateIds,
        targetEndDate: targetEndDate || undefined,
        notes: notes || undefined,
      });
      onCreated();
      onClose();
    } catch (e: any) {
      setError(e?.response?.data?.details || e?.message || 'Onboarding konnte nicht gestartet werden');
    } finally {
      setSubmitting(false);
    }
  };

  const selectedTemplates = templates.filter((t) => selectedTemplateIds.includes(t.id));

  const renderStepContent = () => {
    switch (activeStep) {
      case 0:
        return (
          <Box>
            <RadioGroup
              row
              value={employeeMode}
              onChange={(e) => setEmployeeMode(e.target.value as 'existing' | 'new')}
              sx={{ mb: 2 }}
            >
              <FormControlLabel value="existing" control={<Radio />} label="Bestehenden Mitarbeiter wählen" />
              <FormControlLabel value="new" control={<Radio />} label="Neuen Mitarbeiter anlegen" />
            </RadioGroup>

            {employeeMode === 'existing' ? (
              <Autocomplete
                options={employees}
                value={selectedEmployee}
                onChange={(_e, val) => setSelectedEmployee(val)}
                getOptionLabel={(opt) => employeeName(opt)}
                isOptionEqualToValue={(opt, val) => opt.id === val.id}
                renderInput={(params) => (
                  <TextField {...params} label="Mitarbeiter" placeholder="Mitarbeiter suchen…" />
                )}
              />
            ) : (
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <Box sx={{ display: 'flex', gap: 2 }}>
                  <TextField
                    label="Vorname"
                    required
                    fullWidth
                    value={newEmployee.firstName}
                    onChange={(e) => setNewEmployee({ ...newEmployee, firstName: e.target.value })}
                  />
                  <TextField
                    label="Nachname"
                    required
                    fullWidth
                    value={newEmployee.lastName}
                    onChange={(e) => setNewEmployee({ ...newEmployee, lastName: e.target.value })}
                  />
                </Box>
                <TextField
                  label="E-Mail"
                  type="email"
                  required
                  fullWidth
                  value={newEmployee.email}
                  onChange={(e) => setNewEmployee({ ...newEmployee, email: e.target.value })}
                />
                <Box sx={{ display: 'flex', gap: 2 }}>
                  <TextField
                    label="Position"
                    fullWidth
                    value={newEmployee.position}
                    onChange={(e) => setNewEmployee({ ...newEmployee, position: e.target.value })}
                  />
                  <TextField
                    label="Abteilung"
                    fullWidth
                    value={newEmployee.department}
                    onChange={(e) => setNewEmployee({ ...newEmployee, department: e.target.value })}
                  />
                </Box>
              </Box>
            )}
          </Box>
        );

      case 1:
        return (
          <Box>
            <Typography variant="body2" color="textSecondary" sx={{ mb: 2 }}>
              Wählen Sie den Hauptverantwortlichen (Tutor), dem die Checklisten für diesen Mitarbeiter
              zugewiesen werden.
            </Typography>
            <Autocomplete
              options={employees.filter((e) => e.id !== selectedEmployee?.id)}
              value={tutor}
              onChange={(_e, val) => {
                setTutor(val);
                // Tutor darf nicht zusätzlich in der Liste der weiteren Verantwortlichen stehen
                if (val) setResponsibles((prev) => prev.filter((r) => r.id !== val.id));
              }}
              getOptionLabel={(opt) => employeeName(opt)}
              isOptionEqualToValue={(opt, val) => opt.id === val.id}
              renderInput={(params) => (
                <TextField {...params} label="Hauptverantwortlicher (Tutor)" placeholder="Mitarbeiter suchen…" />
              )}
            />

            <Typography variant="body2" color="textSecondary" sx={{ mt: 3, mb: 2 }}>
              Optional: Weitere Verantwortliche, die ebenfalls für die Checklisten zuständig sind.
              Sie erhalten den Kalendertermin und die E-Mail-Einladung.
            </Typography>
            <Autocomplete
              multiple
              options={employees.filter(
                (e) => e.id !== selectedEmployee?.id && e.id !== tutor?.id
              )}
              value={responsibles}
              onChange={(_e, val) => setResponsibles(val)}
              getOptionLabel={(opt) => employeeName(opt)}
              isOptionEqualToValue={(opt, val) => opt.id === val.id}
              renderInput={(params) => (
                <TextField {...params} label="Weitere Verantwortliche" placeholder="Mitarbeiter suchen…" />
              )}
            />
          </Box>
        );

      case 2:
        return (
          <Box>
            <Typography variant="body2" color="textSecondary" sx={{ mb: 1 }}>
              Wählen Sie eine oder mehrere Checklisten aus, die für dieses Onboarding gestartet werden.
            </Typography>
            {templates.length === 0 ? (
              <Alert severity="info">Keine aktiven Checklisten-Vorlagen vorhanden.</Alert>
            ) : (
              <List sx={{ maxHeight: 280, overflow: 'auto', border: 1, borderColor: 'divider', borderRadius: 1 }}>
                {templates.map((tpl) => (
                  <ListItem key={tpl.id} disablePadding>
                    <ListItemButton onClick={() => toggleTemplate(tpl.id)} dense>
                      <ListItemIcon sx={{ minWidth: 40 }}>
                        <Checkbox edge="start" checked={selectedTemplateIds.includes(tpl.id)} tabIndex={-1} disableRipple />
                      </ListItemIcon>
                      <ListItemText
                        primary={
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            {tpl.name}
                            <Chip label={tpl.type} size="small" variant="outlined" />
                            {tpl._count?.items != null && (
                              <Chip label={`${tpl._count.items} Punkte`} size="small" />
                            )}
                          </Box>
                        }
                        secondary={tpl.description}
                      />
                    </ListItemButton>
                  </ListItem>
                ))}
              </List>
            )}

            <Divider sx={{ my: 2 }} />
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <TextField
                label="Zieldatum (optional)"
                type="date"
                InputLabelProps={{ shrink: true }}
                value={targetEndDate}
                onChange={(e) => setTargetEndDate(e.target.value)}
                sx={{ maxWidth: 240 }}
              />
              <TextField
                label="Notizen (optional)"
                multiline
                minRows={2}
                fullWidth
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </Box>
          </Box>
        );

      case 3:
        return (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
            <Box>
              <Typography variant="overline" color="textSecondary">
                Mitarbeiter
              </Typography>
              <Typography>
                {employeeMode === 'existing'
                  ? employeeName(selectedEmployee)
                  : `${newEmployee.firstName} ${newEmployee.lastName} (neu)`}
              </Typography>
            </Box>
            <Box>
              <Typography variant="overline" color="textSecondary">
                Hauptverantwortlicher
              </Typography>
              <Typography>{employeeName(tutor)}</Typography>
            </Box>
            {responsibles.filter((r) => r.id !== tutor?.id).length > 0 && (
              <Box>
                <Typography variant="overline" color="textSecondary">
                  Weitere Verantwortliche
                </Typography>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mt: 0.5 }}>
                  {responsibles
                    .filter((r) => r.id !== tutor?.id)
                    .map((r) => (
                      <Chip key={r.id} label={employeeName(r)} variant="outlined" />
                    ))}
                </Box>
              </Box>
            )}
            <Box>
              <Typography variant="overline" color="textSecondary">
                Checklisten ({selectedTemplates.length})
              </Typography>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mt: 0.5 }}>
                {selectedTemplates.map((t) => (
                  <Chip key={t.id} label={t.name} icon={<CheckCircle />} color="primary" variant="outlined" />
                ))}
              </Box>
            </Box>
            {targetEndDate && (
              <Box>
                <Typography variant="overline" color="textSecondary">
                  Zieldatum
                </Typography>
                <Typography>{targetEndDate}</Typography>
              </Box>
            )}
            {notes && (
              <Box>
                <Typography variant="overline" color="textSecondary">
                  Notizen
                </Typography>
                <Typography>{notes}</Typography>
              </Box>
            )}
          </Box>
        );

      default:
        return null;
    }
  };

  return (
    <Dialog open={open} onClose={submitting ? undefined : onClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        Neues Onboarding starten
        <IconButton onClick={onClose} disabled={submitting} size="small">
          <Close />
        </IconButton>
      </DialogTitle>
      <DialogContent dividers>
        <Stepper activeStep={activeStep} alternativeLabel sx={{ mb: 3 }}>
          {steps.map((label) => (
            <Step key={label}>
              <StepLabel>{label}</StepLabel>
            </Step>
          ))}
        </Stepper>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
            <CircularProgress />
          </Box>
        ) : (
          renderStepContent()
        )}
      </DialogContent>
      <DialogActions sx={{ px: 3, py: 2 }}>
        <Button onClick={onClose} disabled={submitting} color="inherit">
          Abbrechen
        </Button>
        <Box sx={{ flex: 1 }} />
        {activeStep > 0 && (
          <Button onClick={handleBack} disabled={submitting}>
            Zurück
          </Button>
        )}
        {activeStep < steps.length - 1 ? (
          <Button variant="contained" onClick={handleNext} disabled={loading || !isStepValid(activeStep)}>
            Weiter
          </Button>
        ) : (
          <Button
            variant="contained"
            color="success"
            onClick={handleSubmit}
            disabled={submitting}
            startIcon={submitting ? <CircularProgress size={18} color="inherit" /> : <CheckCircle />}
          >
            Onboarding starten
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
};

export default OnboardingWizard;
