import React, { useState, useEffect } from 'react';
import {
  Container,
  Grid,
  Card,
  CardContent,
  Typography,
  Button,
  Box,
  Chip,
  TextField,
  MenuItem,
  CircularProgress,
  Alert,
} from '@mui/material';
import {
  School as SchoolIcon,
  Assessment as AssessmentIcon,
  WorkspacePremium as CertificateIcon,
  TrendingUp as TrendingUpIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import AppNavbar from '../components/AppNavbar';
import api from '../services/api';

interface Course {
  id: string;
  title: string;
  description: string;
  courseType: string;
  status: string;
  thumbnailUrl?: string;
  duration?: number;
  level?: string;
  category?: {
    name: string;
    color?: string;
  };
  createdBy: {
    firstName: string;
    lastName: string;
  };
  _count: {
    lessons: number;
    enrollments: number;
  };
}

interface LearningStats {
  totalCourses: number;
  completedCourses: number;
  inProgressCourses: number;
  averageScore: number;
  certificatesEarned: number;
  completionRate: number;
}

const ELearningPage: React.FC = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [courses, setCourses] = useState<Course[]>([]);
  const [learningStats, setLearningStats] = useState<LearningStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [typeFilter, setTypeFilter] = useState<string>('');

  useEffect(() => {
    fetchData();
  }, [statusFilter, typeFilter]);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams();
      if (statusFilter) params.append('status', statusFilter);
      if (typeFilter) params.append('courseType', typeFilter);

      const [coursesRes, statsRes] = await Promise.all([
        api.get(`/elearning/courses?${params.toString()}`),
        api.get('/elearning/analytics/my'),
      ]);

      setCourses(coursesRes.data);
      setLearningStats(statsRes.data);
    } catch (err: any) {
      console.error('Error fetching e-learning data:', err);
      setError(err.response?.data?.error || 'Fehler beim Laden der Daten');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PUBLISHED':
        return 'success';
      case 'DRAFT':
        return 'default';
      case 'ARCHIVED':
        return 'error';
      default:
        return 'default';
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'MANDATORY':
        return 'Pflicht';
      case 'OPTIONAL':
        return 'Freiwillig';
      case 'CERTIFICATION':
        return 'Zertifikat';
      case 'ONBOARDING':
        return 'Onboarding';
      default:
        return type;
    }
  };

  if (loading) {
    return (
      <>
        <AppNavbar title="E-Learning" onLogout={logout} />
        <Container sx={{ mt: 4, display: 'flex', justifyContent: 'center' }}>
          <CircularProgress />
        </Container>
      </>
    );
  }

  return (
    <>
      <AppNavbar title="E-Learning" onLogout={logout} />
      <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <SchoolIcon sx={{ fontSize: 40, color: 'primary.main' }} />
          <Typography variant="h4" component="h1">
            E-Learning Kurse
          </Typography>
        </Box>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {/* Learning Stats */}
      {learningStats && (
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <SchoolIcon color="primary" sx={{ fontSize: 40 }} />
                  <Box>
                    <Typography variant="h4">{learningStats.totalCourses}</Typography>
                    <Typography variant="body2" color="text.secondary">
                      Kurse Total
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <AssessmentIcon color="success" sx={{ fontSize: 40 }} />
                  <Box>
                    <Typography variant="h4">{learningStats.completedCourses}</Typography>
                    <Typography variant="body2" color="text.secondary">
                      Abgeschlossen
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <TrendingUpIcon color="info" sx={{ fontSize: 40 }} />
                  <Box>
                    <Typography variant="h4">{learningStats.averageScore.toFixed(1)}%</Typography>
                    <Typography variant="body2" color="text.secondary">
                      Ø Score
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <CertificateIcon color="warning" sx={{ fontSize: 40 }} />
                  <Box>
                    <Typography variant="h4">{learningStats.certificatesEarned}</Typography>
                    <Typography variant="body2" color="text.secondary">
                      Zertifikate
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      {/* Filters */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6} md={3}>
              <TextField
                fullWidth
                select
                label="Status"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <MenuItem value="">Alle</MenuItem>
                <MenuItem value="PUBLISHED">Veröffentlicht</MenuItem>
                <MenuItem value="DRAFT">Entwurf</MenuItem>
                <MenuItem value="ARCHIVED">Archiviert</MenuItem>
              </TextField>
            </Grid>

            <Grid item xs={12} sm={6} md={3}>
              <TextField
                fullWidth
                select
                label="Typ"
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
              >
                <MenuItem value="">Alle</MenuItem>
                <MenuItem value="MANDATORY">Pflichtschulung</MenuItem>
                <MenuItem value="OPTIONAL">Freiwillig</MenuItem>
                <MenuItem value="CERTIFICATION">Zertifizierung</MenuItem>
                <MenuItem value="ONBOARDING">Onboarding</MenuItem>
              </TextField>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Course Grid */}
      <Grid container spacing={3}>
        {courses.map((course) => (
          <Grid item xs={12} sm={6} md={4} key={course.id}>
            <Card
              sx={{
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                cursor: 'pointer',
                '&:hover': {
                  boxShadow: 6,
                  transform: 'translateY(-4px)',
                  transition: 'all 0.3s',
                },
              }}
              onClick={() => navigate(`/elearning/courses/${course.id}`)}
            >
              {course.thumbnailUrl && (
                <Box
                  component="img"
                  src={course.thumbnailUrl}
                  alt={course.title}
                  sx={{
                    height: 180,
                    objectFit: 'cover',
                  }}
                />
              )}
              {!course.thumbnailUrl && (
                <Box
                  sx={{
                    height: 180,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    bgcolor: course.category?.color || 'grey.200',
                  }}
                >
                  <SchoolIcon sx={{ fontSize: 80, color: 'white' }} />
                </Box>
              )}

              <CardContent sx={{ flexGrow: 1 }}>
                <Box sx={{ mb: 2 }}>
                  <Typography variant="h6" component="h2" gutterBottom>
                    {course.title}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                    {course.description?.substring(0, 120)}
                    {course.description && course.description.length > 120 && '...'}
                  </Typography>
                </Box>

                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 2 }}>
                  <Chip
                    label={getTypeLabel(course.courseType)}
                    size="small"
                    color={course.courseType === 'MANDATORY' ? 'error' : 'default'}
                  />
                  <Chip
                    label={course.status}
                    size="small"
                    color={getStatusColor(course.status) as any}
                  />
                  {course.category && (
                    <Chip
                      label={course.category.name}
                      size="small"
                      sx={{
                        bgcolor: course.category.color || 'grey.300',
                        color: 'white',
                      }}
                    />
                  )}
                  {course.level && <Chip label={course.level} size="small" />}
                </Box>

                <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 'auto' }}>
                  <Typography variant="caption" color="text.secondary">
                    {course._count.lessons} Lektionen
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {course._count.enrollments} Teilnehmer
                  </Typography>
                  {course.duration && (
                    <Typography variant="caption" color="text.secondary">
                      {course.duration} Min.
                    </Typography>
                  )}
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {courses.length === 0 && (
        <Card>
          <CardContent>
            <Typography variant="body1" color="text.secondary" align="center">
              Keine Kurse gefunden
            </Typography>
          </CardContent>
        </Card>
      )}
      </Container>
    </>
  );
};

export default ELearningPage;
