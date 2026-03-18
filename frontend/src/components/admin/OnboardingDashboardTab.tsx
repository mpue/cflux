import React, { useState, useEffect } from 'react';
import { onboardingService } from '../../services/onboardingService';
import { OnboardingDashboardItem } from '../../types/onboarding';
import OnboardingEditModal from './OnboardingEditModal';
import {
  Typography,
  Paper,
  Grid,
  Box,
  LinearProgress,
  Card,
  CardContent,
  Chip,
  Button,
  CircularProgress,
} from '@mui/material';
import { Warning, CheckCircle, People, Assignment, Error, Description } from '@mui/icons-material';

interface OnboardingDashboardTabProps {
  onNavigate?: (subtab: string) => void;
}

const OnboardingDashboardTab: React.FC<OnboardingDashboardTabProps> = ({ onNavigate }) => {
  const [dashboard, setDashboard] = useState<OnboardingDashboardItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [editEmployee, setEditEmployee] = useState<{ id: string; name: string } | null>(null);

  useEffect(() => {
    loadDashboard();
  }, []);

  const loadDashboard = async () => {
    try {
      setLoading(true);
      const data = await onboardingService.getDashboard();
      setDashboard(data);
    } catch (error) {
      console.error('Error loading dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  const getProgressColor = (percentage: number) => {
    if (percentage >= 80) return 'success';
    if (percentage >= 50) return 'primary';
    if (percentage >= 30) return 'warning';
    return 'error';
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 400 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h5" component="h2">
          Onboarding Dashboard
        </Typography>
        <Button variant="outlined" onClick={loadDashboard}>
          Aktualisieren
        </Button>
      </Box>

      <Grid container spacing={3}>
        {/* Summary Cards */}
        <Grid item xs={12} md={4}>
          <Card sx={{ height: '100%', bgcolor: 'info.light', color: 'info.contrastText' }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                <Description />
                <Typography variant="body2">Vorlagen</Typography>
              </Box>
              <Typography variant="body2" sx={{ mb: 2 }}>
                Checklisten zu Onboardings hinzufügen und Schulungen neuen Mitarbeitenden zuordnen.
              </Typography>
              <Button
                variant="contained"
                size="small"
                sx={{ bgcolor: 'white', color: 'info.dark', '&:hover': { bgcolor: 'grey.100' } }}
                onClick={() => onNavigate?.('templates')}
              >
                Zu den Vorlagen
              </Button>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={4}>
          <Card sx={{ height: '100%', bgcolor: 'primary.light', color: 'primary.contrastText' }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                <People />
                <Typography variant="body2">Aktive Onboardings</Typography>
              </Box>
              <Typography variant="h3">{dashboard.length}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={4}>
          <Card sx={{ height: '100%', bgcolor: 'success.light', color: 'success.contrastText' }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                <CheckCircle />
                <Typography variant="body2">Abgeschlossene Aufgaben</Typography>
              </Box>
              <Typography variant="h3">
                {dashboard.reduce((sum, item) => sum + item.progress.completedTasks, 0)}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={4}>
          <Card sx={{ height: '100%', bgcolor: 'error.light', color: 'error.contrastText' }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                <Error />
                <Typography variant="body2">Überfällige Aufgaben</Typography>
              </Box>
              <Typography variant="h3">
                {dashboard.reduce((sum, item) => sum + item.progress.overdueTasks, 0)}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        {/* Employee Progress */}
        {dashboard.map((item) => (
          <Grid item xs={12} md={6} lg={4} key={item.employee.id}>
            <Paper 
              onDoubleClick={() => setEditEmployee({
                id: item.employee.id,
                name: `${item.employee.firstName} ${item.employee.lastName}`
              })}
              sx={{ 
                p: 3, 
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                cursor: 'pointer',
                transition: 'transform 0.2s, box-shadow 0.2s',
                '&:hover': {
                  transform: 'translateY(-4px)',
                  boxShadow: 4,
                },
              }}
            >
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                <Box sx={{ flex: 1 }}>
                  <Typography variant="h6" sx={{ mb: 0.5 }}>
                    {item.employee.firstName} {item.employee.lastName}
                  </Typography>
                  <Typography variant="body2" color="textSecondary" sx={{ mb: 0.5 }}>
                    {item.employee.position}
                  </Typography>
                  {item.employee.startDate && (
                    <Typography variant="caption" color="textSecondary">
                      Start: {new Date(item.employee.startDate).toLocaleDateString('de-DE')}
                    </Typography>
                  )}
                </Box>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5, alignItems: 'flex-end' }}>
                  {item.progress.overdueTasks > 0 && (
                    <Chip
                      icon={<Warning />}
                      label={`${item.progress.overdueTasks} überfällig`}
                      color="error"
                      size="small"
                    />
                  )}
                  {item.progress.progressPercentage === 100 && (
                    <Chip icon={<CheckCircle />} label="Abgeschlossen" color="success" size="small" />
                  )}
                </Box>
              </Box>

              <Box sx={{ mb: 2, flexGrow: 1 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                  <Typography variant="body2" color="textSecondary">
                    Fortschritt
                  </Typography>
                  <Typography variant="body2" color="textSecondary">
                    {item.progress.completedTasks} / {item.progress.totalTasks} Aufgaben
                  </Typography>
                </Box>
                <LinearProgress
                  variant="determinate"
                  value={item.progress.progressPercentage}
                  color={getProgressColor(item.progress.progressPercentage)}
                  sx={{ height: 10, borderRadius: 5 }}
                />
                <Typography variant="caption" color="textSecondary" sx={{ mt: 0.5, display: 'block' }}>
                  {Math.round(item.progress.progressPercentage)}% abgeschlossen
                </Typography>
              </Box>
            </Paper>
          </Grid>
        ))}

        {dashboard.length === 0 && (
          <Grid item xs={12}>
            <Paper sx={{ p: 6, textAlign: 'center' }}>
              <Assignment sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
              <Typography variant="h6" color="textSecondary" gutterBottom>
                Keine aktiven Onboarding-Prozesse
              </Typography>
              <Typography variant="body2" color="textSecondary" paragraph>
                Es gibt derzeit keine Mitarbeiter im Onboarding-Prozess.
              </Typography>
              <Button variant="contained" onClick={() => onNavigate?.('applicants')}>
                Zu den Bewerbern
              </Button>
            </Paper>
          </Grid>
        )}
      </Grid>

      {editEmployee && (
        <OnboardingEditModal
          open={!!editEmployee}
          employeeId={editEmployee.id}
          employeeName={editEmployee.name}
          onClose={() => setEditEmployee(null)}
          onUpdated={loadDashboard}
        />
      )}
    </Box>
  );
};

export default OnboardingDashboardTab;
