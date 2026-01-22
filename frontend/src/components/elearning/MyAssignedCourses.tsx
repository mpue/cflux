import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  Chip,
  LinearProgress,
  Button,
  Alert,
} from '@mui/material';
import {
  Event as EventIcon,
  CheckCircle as CompleteIcon,
  PlayArrow as StartIcon,
  Schedule as InProgressIcon,
  Warning as WarningIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';

interface Assignment {
  id: string;
  dueDate?: string;
  notes?: string;
  assignedAt: string;
  course: {
    id: string;
    title: string;
    description?: string;
    duration?: number;
    category?: {
      name: string;
      color?: string;
    };
  };
  assignedBy: {
    firstName: string;
    lastName: string;
  };
  enrollments: Array<{
    id: string;
    status: string;
    progressPercent: number;
    completedAt?: string;
  }>;
}

const MyAssignedCourses: React.FC = () => {
  const navigate = useNavigate();
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadAssignments();
  }, []);

  const loadAssignments = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await api.get('/elearning/assignments/my');
      setAssignments(response.data);
    } catch (err: any) {
      console.error('Error loading assignments:', err);
      setError(err.response?.data?.error || 'Fehler beim Laden der zugewiesenen Kurse');
    } finally {
      setLoading(false);
    }
  };

  const getDaysUntilDue = (dueDate: string) => {
    const due = new Date(dueDate);
    const now = new Date();
    const diff = Math.ceil((due.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    return diff;
  };

  const getDueDateColor = (dueDate?: string) => {
    if (!dueDate) return 'default';
    const days = getDaysUntilDue(dueDate);
    if (days < 0) return 'error';
    if (days <= 3) return 'error';
    if (days <= 7) return 'warning';
    return 'success';
  };

  const getStatusIcon = (enrollment?: Assignment['enrollments'][0]) => {
    if (!enrollment) return <StartIcon />;
    if (enrollment.status === 'COMPLETED') return <CompleteIcon />;
    if (enrollment.status === 'IN_PROGRESS') return <InProgressIcon />;
    return <StartIcon />;
  };

  const getStatusLabel = (enrollment?: Assignment['enrollments'][0]) => {
    if (!enrollment) return 'Nicht gestartet';
    if (enrollment.status === 'COMPLETED') return 'Abgeschlossen';
    if (enrollment.status === 'IN_PROGRESS') return 'In Bearbeitung';
    return 'Nicht gestartet';
  };

  const getStatusColor = (enrollment?: Assignment['enrollments'][0]) => {
    if (!enrollment) return 'default';
    if (enrollment.status === 'COMPLETED') return 'success';
    if (enrollment.status === 'IN_PROGRESS') return 'primary';
    return 'default';
  };

  const sortedAssignments = [...assignments].sort((a, b) => {
    // Sort by: overdue first, then by due date, then by assigned date
    const enrollmentA = a.enrollments[0];
    const enrollmentB = b.enrollments[0];

    // Completed courses go to the end
    if (enrollmentA?.status === 'COMPLETED' && enrollmentB?.status !== 'COMPLETED') return 1;
    if (enrollmentA?.status !== 'COMPLETED' && enrollmentB?.status === 'COMPLETED') return -1;

    // Sort by due date
    if (a.dueDate && b.dueDate) {
      return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
    }
    if (a.dueDate && !b.dueDate) return -1;
    if (!a.dueDate && b.dueDate) return 1;

    // Sort by assigned date
    return new Date(b.assignedAt).getTime() - new Date(a.assignedAt).getTime();
  });

  if (loading) {
    return (
      <Box sx={{ p: 3 }}>
        <Typography>Laden...</Typography>
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error">{error}</Alert>
      </Box>
    );
  }

  if (assignments.length === 0) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="info">
          Ihnen wurden noch keine Kurse zugewiesen.
        </Alert>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h5" gutterBottom>
        Meine zugewiesenen Kurse
      </Typography>

      <Grid container spacing={3} sx={{ mt: 1 }}>
        {sortedAssignments.map((assignment) => {
          const enrollment = assignment.enrollments[0];
          const isOverdue =
            assignment.dueDate &&
            new Date(assignment.dueDate) < new Date() &&
            enrollment?.status !== 'COMPLETED';

          return (
            <Grid item xs={12} md={6} lg={4} key={assignment.id}>
              <Card
                sx={{
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  position: 'relative',
                  border: isOverdue ? '2px solid' : undefined,
                  borderColor: isOverdue ? 'error.main' : undefined,
                }}
              >
                {isOverdue && (
                  <Box
                    sx={{
                      position: 'absolute',
                      top: 0,
                      right: 0,
                      bgcolor: 'error.main',
                      color: 'white',
                      px: 2,
                      py: 0.5,
                      borderBottomLeftRadius: 8,
                    }}
                  >
                    <WarningIcon sx={{ fontSize: 16, mr: 0.5, verticalAlign: 'middle' }} />
                    Überfällig
                  </Box>
                )}

                <CardContent sx={{ flexGrow: 1 }}>
                  <Typography variant="h6" gutterBottom>
                    {assignment.course.title}
                  </Typography>

                  {assignment.course.description && (
                    <Typography
                      variant="body2"
                      color="text.secondary"
                      sx={{
                        mb: 2,
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        display: '-webkit-box',
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical',
                      }}
                    >
                      {assignment.course.description}
                    </Typography>
                  )}

                  <Box sx={{ mb: 2 }}>
                    <Chip
                      label={getStatusLabel(enrollment)}
                      color={getStatusColor(enrollment)}
                      icon={getStatusIcon(enrollment)}
                      size="small"
                      sx={{ mb: 1 }}
                    />

                    {assignment.course.category && (
                      <Chip
                        label={assignment.course.category.name}
                        size="small"
                        sx={{
                          mb: 1,
                          ml: 1,
                          bgcolor: assignment.course.category.color || undefined,
                        }}
                      />
                    )}
                  </Box>

                  {enrollment && enrollment.status !== 'COMPLETED' && (
                    <Box sx={{ mb: 2 }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                        <Typography variant="body2" color="text.secondary">
                          Fortschritt
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {Math.round(enrollment.progressPercent || 0)}%
                        </Typography>
                      </Box>
                      <LinearProgress
                        variant="determinate"
                        value={enrollment.progressPercent || 0}
                        sx={{ height: 8, borderRadius: 1 }}
                      />
                    </Box>
                  )}

                  {assignment.dueDate && (
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                      <EventIcon sx={{ fontSize: 18, mr: 1, color: 'text.secondary' }} />
                      <Typography variant="body2" color="text.secondary">
                        Fällig:{' '}
                      </Typography>
                      <Chip
                        label={new Date(assignment.dueDate).toLocaleDateString('de-DE')}
                        size="small"
                        color={getDueDateColor(assignment.dueDate)}
                        sx={{ ml: 1 }}
                      />
                    </Box>
                  )}

                  {assignment.course.duration && (
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                      Dauer: ca. {Math.round(assignment.course.duration / 60)} Minuten
                    </Typography>
                  )}

                  <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                    Zugewiesen von: {assignment.assignedBy.firstName}{' '}
                    {assignment.assignedBy.lastName}
                  </Typography>

                  {assignment.notes && (
                    <Alert severity="info" sx={{ mt: 2 }}>
                      <Typography variant="body2">{assignment.notes}</Typography>
                    </Alert>
                  )}
                </CardContent>

                <Box sx={{ p: 2, pt: 0 }}>
                  <Button
                    fullWidth
                    variant={enrollment ? 'outlined' : 'contained'}
                    startIcon={getStatusIcon(enrollment)}
                    onClick={() => navigate(`/courses/${assignment.course.id}`)}
                  >
                    {enrollment?.status === 'COMPLETED'
                      ? 'Kurs ansehen'
                      : enrollment?.status === 'IN_PROGRESS'
                      ? 'Weiter lernen'
                      : 'Kurs starten'}
                  </Button>
                </Box>
              </Card>
            </Grid>
          );
        })}
      </Grid>
    </Box>
  );
};

export default MyAssignedCourses;
