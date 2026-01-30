import React, { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Box,
  Tab,
  Tabs,
  Paper,
  Grid,
  Card,
  CardContent,
  Button,
  Chip,
  LinearProgress,
} from '@mui/material';
import {
  Add as AddIcon,
  CheckCircle as CheckCircleIcon,
  Assignment as AssignmentIcon,
  Schedule as ScheduleIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import AppNavbar from '../components/AppNavbar';
import api from '../services/api';
import {
  ChecklistInstance,
  ChecklistTemplate,
  ChecklistStatus,
  ChecklistStatistics,
} from '../types/checklist';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`checklist-tabpanel-${index}`}
      aria-labelledby={`checklist-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ py: 3 }}>{children}</Box>}
    </div>
  );
}

const ChecklistsPage: React.FC = () => {
  const navigate = useNavigate();
  const { logout } = useAuth();
  const [tabValue, setTabValue] = useState(0);
  const [myInstances, setMyInstances] = useState<ChecklistInstance[]>([]);
  const [assignedInstances, setAssignedInstances] = useState<ChecklistInstance[]>([]);
  const [templates, setTemplates] = useState<ChecklistTemplate[]>([]);
  const [statistics, setStatistics] = useState<ChecklistStatistics | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [myInstancesRes, assignedRes, templatesRes, statsRes] = await Promise.all([
        api.get('/checklists/instances/my'),
        api.get('/checklists/instances/assigned'),
        api.get('/checklists/templates?isActive=true'),
        api.get('/checklists/statistics'),
      ]);

      setMyInstances(myInstancesRes.data);
      setAssignedInstances(assignedRes.data);
      setTemplates(templatesRes.data);
      setStatistics(statsRes.data);
    } catch (error) {
      console.error('Error loading checklist data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
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

  const getTypeLabel = (type: string): string => {
    const typeMap: Record<string, string> = {
      ONBOARDING: 'Onboarding',
      OFFBOARDING: 'Offboarding',
      AUDIT: 'Audit',
      MAINTENANCE: 'Wartung',
      PROJECT: 'Projekt',
      CUSTOM: 'Benutzerdefiniert',
    };
    return typeMap[type] || type;
  };

  if (loading) {
    return (
      <>
        <AppNavbar title="Checklisten" onLogout={logout} />
        <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
          <LinearProgress />
        </Container>
      </>
    );
  }

  return (
    <>
      <AppNavbar title="Checklisten" onLogout={logout} />
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1">
          Checklisten
        </Typography>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Button
            variant="outlined"
            startIcon={<AddIcon />}
            onClick={() => navigate('/checklists/templates/new')}
          >
            Vorlage erstellen
          </Button>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => navigate('/checklists/instances/new')}
          >
            Checkliste erstellen
          </Button>
        </Box>
      </Box>

      {/* Statistics Cards */}
      {statistics && (
        <Grid container spacing={2} sx={{ mb: 3 }}>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                  <AssignmentIcon color="primary" sx={{ mr: 1 }} />
                  <Typography variant="h6">{statistics.totalInstances}</Typography>
                </Box>
                <Typography variant="body2" color="text.secondary">
                  Gesamt Checklisten
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                  <ScheduleIcon color="warning" sx={{ mr: 1 }} />
                  <Typography variant="h6">{statistics.inProgressInstances}</Typography>
                </Box>
                <Typography variant="body2" color="text.secondary">
                  In Bearbeitung
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                  <CheckCircleIcon color="success" sx={{ mr: 1 }} />
                  <Typography variant="h6">{statistics.completedInstances}</Typography>
                </Box>
                <Typography variant="body2" color="text.secondary">
                  Abgeschlossen
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                  <AssignmentIcon color="error" sx={{ mr: 1 }} />
                  <Typography variant="h6">{statistics.overdueInstances}</Typography>
                </Box>
                <Typography variant="body2" color="text.secondary">
                  Überfällig
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      {/* Tabs */}
      <Paper sx={{ mb: 3 }}>
        <Tabs value={tabValue} onChange={handleTabChange} aria-label="checklist tabs">
          <Tab label={`Meine Checklisten (${myInstances.length})`} />
          <Tab label={`Zugewiesen (${assignedInstances.length})`} />
          <Tab label={`Vorlagen (${templates.length})`} />
        </Tabs>
      </Paper>

      {/* My Instances Tab */}
      <TabPanel value={tabValue} index={0}>
        <Grid container spacing={2}>
          {myInstances.length === 0 ? (
            <Grid item xs={12}>
              <Paper sx={{ p: 3, textAlign: 'center' }}>
                <Typography variant="body1" color="text.secondary">
                  Keine Checklisten vorhanden
                </Typography>
              </Paper>
            </Grid>
          ) : (
            myInstances.map((instance) => (
              <Grid item xs={12} md={6} key={instance.id}>
                <Card
                  sx={{ cursor: 'pointer', '&:hover': { boxShadow: 3 } }}
                  onClick={() => navigate(`/checklists/instances/${instance.id}`)}
                >
                  <CardContent>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                      <Typography variant="h6">{instance.template?.name}</Typography>
                      <Chip
                        label={getStatusLabel(instance.status)}
                        color={getStatusColor(instance.status)}
                        size="small"
                      />
                    </Box>
                    <LinearProgress
                      variant="determinate"
                      value={instance.progressPercent}
                      sx={{ mb: 1 }}
                    />
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                      {instance.completedItems} von {instance.totalItems} Aufgaben abgeschlossen
                    </Typography>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 2 }}>
                      <Typography variant="caption" color="text.secondary">
                        Gestartet: {new Date(instance.startDate).toLocaleDateString('de-CH')}
                      </Typography>
                      {instance.targetEndDate && (
                        <Typography variant="caption" color="text.secondary">
                          Fällig: {new Date(instance.targetEndDate).toLocaleDateString('de-CH')}
                        </Typography>
                      )}
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            ))
          )}
        </Grid>
      </TabPanel>

      {/* Assigned Instances Tab */}
      <TabPanel value={tabValue} index={1}>
        <Grid container spacing={2}>
          {assignedInstances.length === 0 ? (
            <Grid item xs={12}>
              <Paper sx={{ p: 3, textAlign: 'center' }}>
                <Typography variant="body1" color="text.secondary">
                  Keine zugewiesenen Checklisten vorhanden
                </Typography>
              </Paper>
            </Grid>
          ) : (
            assignedInstances.map((instance) => (
              <Grid item xs={12} md={6} key={instance.id}>
                <Card
                  sx={{ cursor: 'pointer', '&:hover': { boxShadow: 3 } }}
                  onClick={() => navigate(`/checklists/instances/${instance.id}`)}
                >
                  <CardContent>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                      <Box>
                        <Typography variant="h6">{instance.template?.name}</Typography>
                        <Typography variant="body2" color="text.secondary">
                          {instance.user?.firstName} {instance.user?.lastName}
                        </Typography>
                      </Box>
                      <Chip
                        label={getStatusLabel(instance.status)}
                        color={getStatusColor(instance.status)}
                        size="small"
                      />
                    </Box>
                    <LinearProgress
                      variant="determinate"
                      value={instance.progressPercent}
                      sx={{ mb: 1 }}
                    />
                    <Typography variant="body2" color="text.secondary">
                      {instance.completedItems} von {instance.totalItems} Aufgaben abgeschlossen
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            ))
          )}
        </Grid>
      </TabPanel>

      {/* Templates Tab */}
      <TabPanel value={tabValue} index={2}>
        <Grid container spacing={2}>
          {templates.length === 0 ? (
            <Grid item xs={12}>
              <Paper sx={{ p: 3, textAlign: 'center' }}>
                <Typography variant="body1" color="text.secondary">
                  Keine Vorlagen vorhanden
                </Typography>
              </Paper>
            </Grid>
          ) : (
            templates.map((template) => (
              <Grid item xs={12} md={6} key={template.id}>
                <Card>
                  <CardContent>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                      <Typography variant="h6">{template.name}</Typography>
                      <Box sx={{ display: 'flex', gap: 1 }}>
                        <Chip label={getTypeLabel(template.type)} size="small" color="primary" />
                        <Button
                          size="small"
                          variant="outlined"
                          startIcon={<AssignmentIcon />}
                          onClick={() => navigate(`/checklists/templates/${template.id}/edit`)}
                        >
                          Bearbeiten
                        </Button>
                      </Box>
                    </Box>
                    {template.description && (
                      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                        {template.description}
                      </Typography>
                    )}
                    <Box sx={{ display: 'flex', gap: 2 }}>
                      <Typography variant="body2" color="text.secondary">
                        {template._count?.items || 0} Aufgaben
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {template._count?.instances || 0} Instanzen
                      </Typography>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            ))
          )}
        </Grid>
      </TabPanel>
      </Container>
    </>
  );
};

export default ChecklistsPage;
