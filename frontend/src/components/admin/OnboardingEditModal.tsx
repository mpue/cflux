import React, { useState, useEffect } from 'react';
import { onboardingService } from '../../services/onboardingService';
import { OnboardingTask, OnboardingTaskStatus, OnboardingProgress } from '../../types/onboarding';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  LinearProgress,
  Chip,
  IconButton,
  Select,
  MenuItem,
  TextField,
  Divider,
  CircularProgress,
} from '@mui/material';
import { Close, CheckCircle, Warning, Schedule, PlayArrow } from '@mui/icons-material';

interface OnboardingEditModalProps {
  open: boolean;
  employeeId: string;
  employeeName: string;
  onClose: () => void;
  onUpdated: () => void;
}

const statusLabels: Record<OnboardingTaskStatus, string> = {
  [OnboardingTaskStatus.NOT_STARTED]: 'Nicht begonnen',
  [OnboardingTaskStatus.IN_PROGRESS]: 'In Bearbeitung',
  [OnboardingTaskStatus.COMPLETED]: 'Abgeschlossen',
  [OnboardingTaskStatus.OVERDUE]: 'Überfällig',
};

const statusColors: Record<OnboardingTaskStatus, 'default' | 'primary' | 'success' | 'error' | 'warning'> = {
  [OnboardingTaskStatus.NOT_STARTED]: 'default',
  [OnboardingTaskStatus.IN_PROGRESS]: 'primary',
  [OnboardingTaskStatus.COMPLETED]: 'success',
  [OnboardingTaskStatus.OVERDUE]: 'error',
};

const statusIcons: Record<OnboardingTaskStatus, React.ReactElement> = {
  [OnboardingTaskStatus.NOT_STARTED]: <Schedule fontSize="small" />,
  [OnboardingTaskStatus.IN_PROGRESS]: <PlayArrow fontSize="small" />,
  [OnboardingTaskStatus.COMPLETED]: <CheckCircle fontSize="small" />,
  [OnboardingTaskStatus.OVERDUE]: <Warning fontSize="small" />,
};

const OnboardingEditModal: React.FC<OnboardingEditModalProps> = ({
  open,
  employeeId,
  employeeName,
  onClose,
  onUpdated,
}) => {
  const [progress, setProgress] = useState<OnboardingProgress | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);

  useEffect(() => {
    if (open && employeeId) {
      loadProgress();
    }
  }, [open, employeeId]);

  const loadProgress = async () => {
    try {
      setLoading(true);
      const data = await onboardingService.getProgress(employeeId);
      setProgress(data);
    } catch (error) {
      console.error('Error loading progress:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (taskId: string, newStatus: OnboardingTaskStatus) => {
    try {
      setSaving(taskId);
      await onboardingService.updateTaskStatus(taskId, newStatus);
      await loadProgress();
      onUpdated();
    } catch (error) {
      console.error('Error updating task status:', error);
    } finally {
      setSaving(null);
    }
  };

  const getProgressColor = (percentage: number): 'success' | 'primary' | 'warning' | 'error' => {
    if (percentage >= 80) return 'success';
    if (percentage >= 50) return 'primary';
    if (percentage >= 30) return 'warning';
    return 'error';
  };

  const groupedTasks = progress?.tasks.reduce((acc, task) => {
    const cat = task.category || 'Allgemein';
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(task);
    return acc;
  }, {} as Record<string, OnboardingTask[]>) || {};

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Box>
          <Typography variant="h6">Onboarding: {employeeName}</Typography>
          {progress && (
            <Typography variant="body2" color="textSecondary">
              {progress.completedTasks} von {progress.totalTasks} Aufgaben abgeschlossen
            </Typography>
          )}
        </Box>
        <IconButton onClick={onClose} size="small">
          <Close />
        </IconButton>
      </DialogTitle>

      <DialogContent dividers>
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
            <CircularProgress />
          </Box>
        ) : progress ? (
          <>
            {/* Progress bar */}
            <Box sx={{ mb: 3 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                <Typography variant="body2">Gesamtfortschritt</Typography>
                <Typography variant="body2" fontWeight={600}>
                  {Math.round(progress.progressPercentage)}%
                </Typography>
              </Box>
              <LinearProgress
                variant="determinate"
                value={progress.progressPercentage}
                color={getProgressColor(progress.progressPercentage)}
                sx={{ height: 10, borderRadius: 5 }}
              />
              <Box sx={{ display: 'flex', gap: 2, mt: 1 }}>
                {progress.overdueTasks > 0 && (
                  <Chip
                    icon={<Warning />}
                    label={`${progress.overdueTasks} überfällig`}
                    color="error"
                    size="small"
                  />
                )}
              </Box>
            </Box>

            {/* Tasks grouped by category */}
            {Object.entries(groupedTasks).map(([category, tasks]) => (
              <Box key={category} sx={{ mb: 3 }}>
                <Typography variant="subtitle1" fontWeight={600} sx={{ mb: 1 }}>
                  {category}
                </Typography>
                <Divider sx={{ mb: 1.5 }} />
                {tasks.map((task) => (
                  <Box
                    key={task.id}
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 2,
                      py: 1.5,
                      px: 2,
                      mb: 1,
                      borderRadius: 1,
                      bgcolor: task.status === OnboardingTaskStatus.COMPLETED
                        ? 'success.50'
                        : task.status === OnboardingTaskStatus.OVERDUE
                          ? 'error.50'
                          : 'grey.50',
                      border: '1px solid',
                      borderColor: task.status === OnboardingTaskStatus.COMPLETED
                        ? 'success.200'
                        : task.status === OnboardingTaskStatus.OVERDUE
                          ? 'error.200'
                          : 'grey.200',
                    }}
                  >
                    <Box sx={{ flex: 1 }}>
                      <Typography
                        variant="body2"
                        fontWeight={500}
                        sx={{
                          textDecoration: task.status === OnboardingTaskStatus.COMPLETED ? 'line-through' : 'none',
                          opacity: task.status === OnboardingTaskStatus.COMPLETED ? 0.7 : 1,
                        }}
                      >
                        {task.title}
                      </Typography>
                      {task.description && (
                        <Typography variant="caption" color="textSecondary">
                          {task.description}
                        </Typography>
                      )}
                      <Box sx={{ display: 'flex', gap: 1, mt: 0.5 }}>
                        {task.dueDate && (
                          <Typography variant="caption" color="textSecondary">
                            Fällig: {new Date(task.dueDate).toLocaleDateString('de-DE')}
                          </Typography>
                        )}
                        {task.assignedTo && (
                          <Typography variant="caption" color="textSecondary">
                            • Zugewiesen: {task.assignedTo.firstName} {task.assignedTo.lastName}
                          </Typography>
                        )}
                      </Box>
                    </Box>

                    <Select
                      size="small"
                      value={task.status}
                      onChange={(e) => handleStatusChange(task.id, e.target.value as OnboardingTaskStatus)}
                      disabled={saving === task.id}
                      sx={{ minWidth: 170 }}
                      renderValue={(value) => (
                        <Chip
                          icon={statusIcons[value as OnboardingTaskStatus]}
                          label={statusLabels[value as OnboardingTaskStatus]}
                          color={statusColors[value as OnboardingTaskStatus]}
                          size="small"
                          sx={{ cursor: 'pointer' }}
                        />
                      )}
                    >
                      {Object.values(OnboardingTaskStatus).map((s) => (
                        <MenuItem key={s} value={s}>
                          <Chip
                            icon={statusIcons[s]}
                            label={statusLabels[s]}
                            color={statusColors[s]}
                            size="small"
                          />
                        </MenuItem>
                      ))}
                    </Select>
                  </Box>
                ))}
              </Box>
            ))}

            {progress.tasks.length === 0 && (
              <Box sx={{ textAlign: 'center', py: 4 }}>
                <Typography color="textSecondary">
                  Keine Aufgaben für diesen Mitarbeiter vorhanden.
                </Typography>
              </Box>
            )}
          </>
        ) : (
          <Typography color="error">Fehler beim Laden der Daten.</Typography>
        )}
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose}>Schliessen</Button>
      </DialogActions>
    </Dialog>
  );
};

export default OnboardingEditModal;
