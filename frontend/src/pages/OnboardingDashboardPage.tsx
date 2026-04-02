import React, { useState, useEffect } from 'react';
import { onboardingService } from '../services/onboardingService';
import { OnboardingDashboardItem } from '../types/onboarding';
import OnboardingEditModal from '../components/admin/OnboardingEditModal';
import {
  Container,
  Typography,
  Paper,
  Grid,
  Box,
  LinearProgress,
  Card,
  CardContent,
  Chip,
  Button,
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { Warning, CheckCircle, DoneAll } from '@mui/icons-material';

const OnboardingDashboardPage: React.FC = () => {
  const [dashboard, setDashboard] = useState<OnboardingDashboardItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [editEmployee, setEditEmployee] = useState<{ id: string; name: string } | null>(null);
  const navigate = useNavigate();

  const handleMarkAsOnboarded = async (employeeId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!window.confirm('Mitarbeiter als onboarded markieren? Er wird aus der Dashboard-Liste entfernt.')) return;
    try {
      await onboardingService.markAsOnboarded(employeeId);
      loadDashboard();
    } catch (error) {
      console.error('Error marking as onboarded:', error);
    }
  };

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
      <Container>
        <Typography>Laden...</Typography>
      </Container>
    );
  }

  return (
    <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1">
          Onboarding Dashboard
        </Typography>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Button variant="outlined" onClick={() => navigate('/admin/onboarding/applicants')}>
            Bewerber
          </Button>
          <Button variant="outlined" onClick={() => navigate('/admin/onboarding/employees')}>
            Mitarbeiter
          </Button>
        </Box>
      </Box>

      <Grid container spacing={3}>
        {/* Summary Cards */}
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Aktive Onboardings
              </Typography>
              <Typography variant="h4">{dashboard.length}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Abgeschlossene Aufgaben
              </Typography>
              <Typography variant="h4">
                {dashboard.reduce((sum, item) => sum + item.progress.completedTasks, 0)}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={4}>
          <Card sx={{ bgcolor: 'error.light', color: 'error.contrastText' }}>
            <CardContent>
              <Typography gutterBottom>Überfällige Aufgaben</Typography>
              <Typography variant="h4">
                {dashboard.reduce((sum, item) => sum + item.progress.overdueTasks, 0)}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        {/* Employee Progress */}
        {dashboard.map((item) => (
          <Grid item xs={12} md={6} key={item.employee.id}>
            <Paper
              onDoubleClick={() => setEditEmployee({
                id: item.employee.id,
                name: `${item.employee.firstName} ${item.employee.lastName}`
              })}
              sx={{ p: 3, cursor: 'pointer', '&:hover': { boxShadow: 4 } }}
            >
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Box>
                  <Typography variant="h6">
                    {item.employee.firstName} {item.employee.lastName}
                  </Typography>
                  <Typography variant="body2" color="textSecondary">
                    {item.employee.position}
                  </Typography>
                  {item.employee.startDate && (
                    <Typography variant="caption" color="textSecondary">
                      Start: {new Date(item.employee.startDate).toLocaleDateString('de-DE')}
                    </Typography>
                  )}
                </Box>
                <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
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

              <Box sx={{ mb: 1 }}>
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
              </Box>

              <Box sx={{ mt: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="caption" color="textSecondary">
                  {Math.round(item.progress.progressPercentage)}% abgeschlossen
                </Typography>
                <Button
                  size="small"
                  variant="outlined"
                  color="success"
                  startIcon={<DoneAll />}
                  onClick={(e) => handleMarkAsOnboarded(item.employee.id, e)}
                >
                  Als onboarded markieren
                </Button>
              </Box>
            </Paper>
          </Grid>
        ))}

        {dashboard.length === 0 && (
          <Grid item xs={12}>
            <Paper sx={{ p: 4, textAlign: 'center' }}>
              <Typography variant="h6" color="textSecondary">
                Keine aktiven Onboarding-Prozesse
              </Typography>
              <Button variant="contained" sx={{ mt: 2 }} onClick={() => navigate('/admin/onboarding/applicants')}>
                Bewerber anzeigen
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
    </Container>
  );
};

export default OnboardingDashboardPage;
