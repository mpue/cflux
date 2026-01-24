import React, { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  Typography,
  Box,
  LinearProgress,
  List,
  ListItem,
  ListItemText,
  Chip,
  Button,
  Divider,
  CircularProgress,
} from '@mui/material';
import { CheckCircle, Warning, Assignment } from '@mui/icons-material';
import { onboardingService } from '../../services/onboardingService';
import { OnboardingProgress, OnboardingTaskStatus } from '../../types/onboarding';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

interface OnboardingWidgetProps {
  employeeId?: string;
}

const OnboardingWidget: React.FC<OnboardingWidgetProps> = ({ employeeId }) => {
  const [progress, setProgress] = useState<OnboardingProgress | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { user } = useAuth();

  useEffect(() => {
    if (employeeId) {
      loadProgress();
    }
  }, [employeeId]);

  const loadProgress = async () => {
    if (!employeeId) return;

    try {
      setLoading(true);
      const data = await onboardingService.getProgress(employeeId);
      setProgress(data);
    } catch (error) {
      console.error('Error loading onboarding progress:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: OnboardingTaskStatus) => {
    switch (status) {
      case OnboardingTaskStatus.COMPLETED:
        return 'success';
      case OnboardingTaskStatus.IN_PROGRESS:
        return 'primary';
      case OnboardingTaskStatus.OVERDUE:
        return 'error';
      default:
        return 'default';
    }
  };

  const getStatusLabel = (status: OnboardingTaskStatus) => {
    switch (status) {
      case OnboardingTaskStatus.COMPLETED:
        return 'Erledigt';
      case OnboardingTaskStatus.IN_PROGRESS:
        return 'In Bearbeitung';
      case OnboardingTaskStatus.OVERDUE:
        return 'Überfällig';
      case OnboardingTaskStatus.NOT_STARTED:
        return 'Offen';
      default:
        return status;
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent>
          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 200 }}>
            <CircularProgress />
          </Box>
        </CardContent>
      </Card>
    );
  }

  if (!progress) {
    return (
      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Mein Onboarding
          </Typography>
          <Typography color="textSecondary">Keine Onboarding-Informationen verfügbar</Typography>
        </CardContent>
      </Card>
    );
  }

  const upcomingTasks = progress.tasks
    .filter(
      (task) =>
        task.status !== OnboardingTaskStatus.COMPLETED &&
        (!task.dueDate || new Date(task.dueDate) > new Date())
    )
    .sort((a, b) => {
      if (!a.dueDate) return 1;
      if (!b.dueDate) return -1;
      return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
    })
    .slice(0, 5);

  return (
    <Card>
      <CardContent>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Assignment />
            Mein Onboarding
          </Typography>
          {progress.overdueTasks > 0 && (
            <Chip icon={<Warning />} label={`${progress.overdueTasks} überfällig`} color="error" size="small" />
          )}
        </Box>

        {/* Progress Bar */}
        <Box sx={{ mb: 3 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
            <Typography variant="body2" color="textSecondary">
              Gesamtfortschritt
            </Typography>
            <Typography variant="body2" color="textSecondary">
              {progress.completedTasks} / {progress.totalTasks} Aufgaben
            </Typography>
          </Box>
          <LinearProgress
            variant="determinate"
            value={progress.progressPercentage}
            color={progress.progressPercentage === 100 ? 'success' : 'primary'}
            sx={{ height: 8, borderRadius: 4 }}
          />
          <Typography variant="caption" color="textSecondary" sx={{ mt: 0.5, display: 'block' }}>
            {Math.round(progress.progressPercentage)}% abgeschlossen
          </Typography>
        </Box>

        <Divider sx={{ mb: 2 }} />

        {/* Upcoming Tasks */}
        {upcomingTasks.length > 0 ? (
          <>
            <Typography variant="subtitle2" gutterBottom>
              Anstehende Aufgaben
            </Typography>
            <List dense>
              {upcomingTasks.map((task) => (
                <ListItem key={task.id} sx={{ px: 0 }}>
                  <ListItemText
                    primary={task.title}
                    secondary={
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5 }}>
                        <Chip label={getStatusLabel(task.status)} color={getStatusColor(task.status)} size="small" />
                        {task.dueDate && (
                          <Typography variant="caption" color="textSecondary">
                            Fällig: {new Date(task.dueDate).toLocaleDateString('de-DE')}
                          </Typography>
                        )}
                      </Box>
                    }
                  />
                </ListItem>
              ))}
            </List>
          </>
        ) : progress.progressPercentage === 100 ? (
          <Box sx={{ textAlign: 'center', py: 2 }}>
            <CheckCircle color="success" sx={{ fontSize: 48, mb: 1 }} />
            <Typography variant="h6" color="success.main">
              Onboarding abgeschlossen!
            </Typography>
            <Typography variant="body2" color="textSecondary">
              Herzlich willkommen im Team!
            </Typography>
          </Box>
        ) : (
          <Typography variant="body2" color="textSecondary" sx={{ py: 2, textAlign: 'center' }}>
            Keine anstehenden Aufgaben
          </Typography>
        )}

        {/* View All Button */}
        {progress.totalTasks > 5 && (
          <Button
            fullWidth
            variant="outlined"
            size="small"
            sx={{ mt: 2 }}
            onClick={() => navigate('/onboarding/my-tasks')}
          >
            Alle Aufgaben anzeigen ({progress.totalTasks})
          </Button>
        )}
      </CardContent>
    </Card>
  );
};

export default OnboardingWidget;
