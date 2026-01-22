import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  LinearProgress,
  Alert,
  CircularProgress,
  Tabs,
  Tab,
  Paper,
  Button,
  IconButton,
} from '@mui/material';
import {
  TrendingUp as TrendingUpIcon,
  School as SchoolIcon,
  People as PeopleIcon,
  CheckCircle as CheckCircleIcon,
  Schedule as ScheduleIcon,
  Warning as WarningIcon,
  Download as DownloadIcon,
  EmojiEvents as CertificateIcon,
} from '@mui/icons-material';
import api from '../../services/api';

interface AdminAnalytics {
  overview: {
    totalCourses: number;
    totalEnrollments: number;
    activeUsers: number;
    completedEnrollments: number;
    completionRate: number;
  };
  enrollmentsByStatus: Array<{
    status: string;
    count: number;
  }>;
  coursesWithRates: Array<{
    id: string;
    title: string;
    courseType: string;
    totalEnrollments: number;
    completedCount: number;
    completionRate: number;
  }>;
  recentCompletions: Array<{
    id: string;
    user: {
      firstName: string;
      lastName: string;
      email: string;
    };
    course: {
      title: string;
      courseType: string;
    };
    completedAt: string;
    score?: number;
  }>;
  quizPerformance: {
    totalAttempts: number;
    passedAttempts: number;
    failedAttempts: number;
    passRate: number;
    averageScore: number;
  };
}

interface ComplianceReport {
  totalComplianceCourses: number;
  totalUsers: number;
  overallComplianceRate: number;
  courses: Array<{
    courseId: string;
    courseTitle: string;
    courseType: string;
    isComplianceCourse: boolean;
    totalUsers: number;
    enrolledUsers: number;
    completedUsers: number;
    inProgressUsers: number;
    usersNotEnrolled: number;
    overdueUsers: number;
    complianceRate: number;
    enrollments: Array<{
      userId: string;
      userName: string;
      email: string;
      status: string;
      progressPercent: number;
      enrolledAt: string;
      completedAt?: string;
      expiresAt?: string;
      isOverdue: boolean;
    }>;
  }>;
}

const AnalyticsReports: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState(0);
  const [analytics, setAnalytics] = useState<AdminAnalytics | null>(null);
  const [complianceReport, setComplianceReport] = useState<ComplianceReport | null>(null);
  const [certificates, setCertificates] = useState<Array<{
    enrollmentId: string;
    certificateUrl: string;
    certificateIssuedAt: string;
    completedAt?: string;
    score?: number;
    user: {
      firstName: string;
      lastName: string;
      email: string;
    };
    course: {
      title: string;
      courseType: string;
    };
  }>>([]);

  useEffect(() => {
    loadData();
  }, [activeTab]);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);

      if (activeTab === 0) {
        const response = await api.get('/elearning/analytics/admin');
        setAnalytics(response.data);
      } else if (activeTab === 1) {
        const response = await api.get('/elearning/analytics/compliance');
        setComplianceReport(response.data);
      } else if (activeTab === 2) {
        const response = await api.get('/elearning/certificates');
        setCertificates(response.data);
      }
    } catch (err: any) {
      console.error('Error loading analytics:', err);
      setError(err.response?.data?.error || 'Fehler beim Laden der Analytics');
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadCertificate = async (enrollmentId: string, courseName: string, userName: string) => {
    try {
      const response = await api.get(`/elearning/certificates/${enrollmentId}/download`, {
        responseType: 'blob',
      });

      // Create blob link to download
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `Zertifikat - ${courseName} - ${userName}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.parentNode?.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (err: any) {
      console.error('Error downloading certificate:', err);
      setError('Fehler beim Herunterladen des Zertifikats');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'COMPLETED':
        return 'success';
      case 'IN_PROGRESS':
        return 'primary';
      case 'NOT_STARTED':
        return 'default';
      default:
        return 'default';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'COMPLETED':
        return 'Abgeschlossen';
      case 'IN_PROGRESS':
        return 'In Bearbeitung';
      case 'NOT_STARTED':
        return 'Nicht begonnen';
      default:
        return status;
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      <Tabs value={activeTab} onChange={(e, newValue) => setActiveTab(newValue)} sx={{ mb: 3 }}>
        <Tab label="Übersicht" icon={<TrendingUpIcon />} iconPosition="start" />
        <Tab label="Compliance Report" icon={<WarningIcon />} iconPosition="start" />
        <Tab label="Zertifikate" icon={<CertificateIcon />} iconPosition="start" />
      </Tabs>

      {/* Overview Tab */}
      {activeTab === 0 && analytics && (
        <>
          {/* Overview Cards */}
          <Grid container spacing={3} sx={{ mb: 3 }}>
            <Grid item xs={12} sm={6} md={3}>
              <Card>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <Box>
                      <Typography variant="body2" color="text.secondary">
                        Kurse
                      </Typography>
                      <Typography variant="h4">{analytics.overview.totalCourses}</Typography>
                    </Box>
                    <SchoolIcon sx={{ fontSize: 48, color: 'primary.main', opacity: 0.3 }} />
                  </Box>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} sm={6} md={3}>
              <Card>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <Box>
                      <Typography variant="body2" color="text.secondary">
                        Einschreibungen
                      </Typography>
                      <Typography variant="h4">{analytics.overview.totalEnrollments}</Typography>
                    </Box>
                    <PeopleIcon sx={{ fontSize: 48, color: 'info.main', opacity: 0.3 }} />
                  </Box>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} sm={6} md={3}>
              <Card>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <Box>
                      <Typography variant="body2" color="text.secondary">
                        Aktive Benutzer
                      </Typography>
                      <Typography variant="h4">{analytics.overview.activeUsers}</Typography>
                    </Box>
                    <PeopleIcon sx={{ fontSize: 48, color: 'success.main', opacity: 0.3 }} />
                  </Box>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} sm={6} md={3}>
              <Card>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <Box>
                      <Typography variant="body2" color="text.secondary">
                        Abschlussrate
                      </Typography>
                      <Typography variant="h4">
                        {Math.round(analytics.overview.completionRate)}%
                      </Typography>
                    </Box>
                    <CheckCircleIcon sx={{ fontSize: 48, color: 'warning.main', opacity: 0.3 }} />
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          </Grid>

          {/* Quiz Performance */}
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Quiz Performance
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6} md={3}>
                  <Typography variant="body2" color="text.secondary">
                    Gesamt Versuche
                  </Typography>
                  <Typography variant="h5">{analytics.quizPerformance.totalAttempts}</Typography>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <Typography variant="body2" color="text.secondary">
                    Bestanden
                  </Typography>
                  <Typography variant="h5" color="success.main">
                    {analytics.quizPerformance.passedAttempts}
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <Typography variant="body2" color="text.secondary">
                    Nicht Bestanden
                  </Typography>
                  <Typography variant="h5" color="error.main">
                    {analytics.quizPerformance.failedAttempts}
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <Typography variant="body2" color="text.secondary">
                    Bestehensquote
                  </Typography>
                  <Typography variant="h5">{analytics.quizPerformance.passRate}%</Typography>
                </Grid>
              </Grid>
            </CardContent>
          </Card>

          {/* Course Completion Rates */}
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Kurs Abschlussraten
              </Typography>
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Kurs</TableCell>
                      <TableCell>Typ</TableCell>
                      <TableCell align="right">Einschreibungen</TableCell>
                      <TableCell align="right">Abgeschlossen</TableCell>
                      <TableCell align="right">Rate</TableCell>
                      <TableCell>Fortschritt</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {analytics.coursesWithRates.map((course) => (
                      <TableRow key={course.id}>
                        <TableCell>{course.title}</TableCell>
                        <TableCell>
                          <Chip
                            label={course.courseType}
                            size="small"
                            color={course.courseType === 'MANDATORY' ? 'error' : 'default'}
                          />
                        </TableCell>
                        <TableCell align="right">{course.totalEnrollments}</TableCell>
                        <TableCell align="right">{course.completedCount}</TableCell>
                        <TableCell align="right">{course.completionRate}%</TableCell>
                        <TableCell>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <LinearProgress
                              variant="determinate"
                              value={course.completionRate}
                              sx={{ flexGrow: 1, height: 6, borderRadius: 3 }}
                            />
                          </Box>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </CardContent>
          </Card>

          {/* Recent Completions */}
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Neueste Abschlüsse
              </Typography>
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Benutzer</TableCell>
                      <TableCell>Kurs</TableCell>
                      <TableCell>Typ</TableCell>
                      <TableCell>Abgeschlossen am</TableCell>
                      <TableCell>Score</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {analytics.recentCompletions.map((completion) => (
                      <TableRow key={completion.id}>
                        <TableCell>
                          <Typography variant="body2">
                            {completion.user.firstName} {completion.user.lastName}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {completion.user.email}
                          </Typography>
                        </TableCell>
                        <TableCell>{completion.course.title}</TableCell>
                        <TableCell>
                          <Chip label={completion.course.courseType} size="small" />
                        </TableCell>
                        <TableCell>
                          {new Date(completion.completedAt).toLocaleDateString('de-DE')}
                        </TableCell>
                        <TableCell>
                          {completion.score ? `${Math.round(completion.score)}%` : '-'}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </CardContent>
          </Card>
        </>
      )}

      {/* Compliance Report Tab */}
      {activeTab === 1 && complianceReport && (
        <>
          {/* Overview Cards */}
          <Grid container spacing={3} sx={{ mb: 3 }}>
            <Grid item xs={12} sm={4}>
              <Card>
                <CardContent>
                  <Typography variant="body2" color="text.secondary">
                    Compliance Kurse
                  </Typography>
                  <Typography variant="h4">{complianceReport.totalComplianceCourses}</Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} sm={4}>
              <Card>
                <CardContent>
                  <Typography variant="body2" color="text.secondary">
                    Gesamt Benutzer
                  </Typography>
                  <Typography variant="h4">{complianceReport.totalUsers}</Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} sm={4}>
              <Card>
                <CardContent>
                  <Typography variant="body2" color="text.secondary">
                    Compliance Rate
                  </Typography>
                  <Typography variant="h4" color={complianceReport.overallComplianceRate >= 80 ? 'success.main' : 'error.main'}>
                    {Math.round(complianceReport.overallComplianceRate)}%
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          </Grid>

          {/* Compliance Courses */}
          {complianceReport.courses.map((course) => (
            <Card key={course.courseId} sx={{ mb: 3 }}>
              <CardContent>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', mb: 2 }}>
                  <Box>
                    <Typography variant="h6">{course.courseTitle}</Typography>
                    <Box sx={{ display: 'flex', gap: 1, mt: 1 }}>
                      <Chip label={course.courseType} size="small" color="error" />
                      {course.isComplianceCourse && (
                        <Chip label="Compliance" size="small" color="warning" />
                      )}
                    </Box>
                  </Box>
                  <Typography variant="h4" color={course.complianceRate >= 80 ? 'success.main' : 'error.main'}>
                    {Math.round(course.complianceRate)}%
                  </Typography>
                </Box>

                <Grid container spacing={2} sx={{ mb: 2 }}>
                  <Grid item xs={6} sm={3}>
                    <Typography variant="caption" color="text.secondary">
                      Abgeschlossen
                    </Typography>
                    <Typography variant="h6" color="success.main">
                      {course.completedUsers} / {course.totalUsers}
                    </Typography>
                  </Grid>
                  <Grid item xs={6} sm={3}>
                    <Typography variant="caption" color="text.secondary">
                      In Bearbeitung
                    </Typography>
                    <Typography variant="h6" color="primary.main">
                      {course.inProgressUsers}
                    </Typography>
                  </Grid>
                  <Grid item xs={6} sm={3}>
                    <Typography variant="caption" color="text.secondary">
                      Nicht eingeschrieben
                    </Typography>
                    <Typography variant="h6" color="text.secondary">
                      {course.usersNotEnrolled}
                    </Typography>
                  </Grid>
                  <Grid item xs={6} sm={3}>
                    <Typography variant="caption" color="text.secondary">
                      Überfällig
                    </Typography>
                    <Typography variant="h6" color="error.main">
                      {course.overdueUsers}
                    </Typography>
                  </Grid>
                </Grid>

                <LinearProgress
                  variant="determinate"
                  value={course.complianceRate}
                  sx={{ height: 8, borderRadius: 4, mb: 2 }}
                  color={course.complianceRate >= 80 ? 'success' : 'error'}
                />

                {/* User Details Table */}
                <TableContainer>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>Benutzer</TableCell>
                        <TableCell>Status</TableCell>
                        <TableCell>Fortschritt</TableCell>
                        <TableCell>Eingeschrieben am</TableCell>
                        <TableCell>Abgeschlossen am</TableCell>
                        <TableCell>Verfällt am</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {course.enrollments.map((enrollment) => (
                        <TableRow key={enrollment.userId} sx={{ bgcolor: enrollment.isOverdue ? 'error.light' : 'inherit' }}>
                          <TableCell>
                            <Typography variant="body2">{enrollment.userName}</Typography>
                            <Typography variant="caption" color="text.secondary">
                              {enrollment.email}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Chip
                              label={getStatusLabel(enrollment.status)}
                              size="small"
                              color={getStatusColor(enrollment.status) as any}
                            />
                            {enrollment.isOverdue && (
                              <Chip label="Überfällig" size="small" color="error" sx={{ ml: 0.5 }} />
                            )}
                          </TableCell>
                          <TableCell>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              <LinearProgress
                                variant="determinate"
                                value={enrollment.progressPercent}
                                sx={{ width: 60, height: 4 }}
                              />
                              <Typography variant="caption">{enrollment.progressPercent}%</Typography>
                            </Box>
                          </TableCell>
                          <TableCell>
                            {new Date(enrollment.enrolledAt).toLocaleDateString('de-DE')}
                          </TableCell>
                          <TableCell>
                            {enrollment.completedAt
                              ? new Date(enrollment.completedAt).toLocaleDateString('de-DE')
                              : '-'}
                          </TableCell>
                          <TableCell>
                            {enrollment.expiresAt
                              ? new Date(enrollment.expiresAt).toLocaleDateString('de-DE')
                              : '-'}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </CardContent>
            </Card>
          ))}
        </>
      )}

      {/* Certificates Tab */}
      {activeTab === 2 && (
        <Card>
          <CardContent>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
              <Typography variant="h6">
                Ausgestellte Zertifikate ({certificates.length})
              </Typography>
            </Box>

            {certificates.length === 0 ? (
              <Alert severity="info">
                Noch keine Zertifikate ausgestellt. Zertifikate werden automatisch generiert, wenn ein Benutzer einen Kurs zu 100% abschließt.
              </Alert>
            ) : (
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Benutzer</TableCell>
                      <TableCell>Kurs</TableCell>
                      <TableCell>Kurs-Typ</TableCell>
                      <TableCell>Abgeschlossen am</TableCell>
                      <TableCell>Zertifikat ausgestellt</TableCell>
                      <TableCell>Score</TableCell>
                      <TableCell align="right">Aktionen</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {certificates.map((cert) => (
                      <TableRow key={cert.enrollmentId}>
                        <TableCell>
                          <Typography variant="body2">
                            {cert.user.firstName} {cert.user.lastName}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {cert.user.email}
                          </Typography>
                        </TableCell>
                        <TableCell>{cert.course.title}</TableCell>
                        <TableCell>
                          <Chip
                            label={cert.course.courseType}
                            size="small"
                            color={cert.course.courseType === 'MANDATORY' ? 'error' : 'default'}
                          />
                        </TableCell>
                        <TableCell>
                          {cert.completedAt
                            ? new Date(cert.completedAt).toLocaleDateString('de-DE')
                            : '-'}
                        </TableCell>
                        <TableCell>
                          {cert.certificateIssuedAt
                            ? new Date(cert.certificateIssuedAt).toLocaleDateString('de-DE')
                            : '-'}
                        </TableCell>
                        <TableCell>
                          {cert.score ? (
                            <Chip
                              label={`${Math.round(cert.score)}%`}
                              size="small"
                              color={cert.score >= 80 ? 'success' : 'default'}
                            />
                          ) : (
                            '-'
                          )}
                        </TableCell>
                        <TableCell align="right">
                          <IconButton
                            size="small"
                            color="primary"
                            onClick={() =>
                              handleDownloadCertificate(
                                cert.enrollmentId,
                                cert.course.title,
                                `${cert.user.firstName} ${cert.user.lastName}`
                              )
                            }
                            title="Zertifikat herunterladen"
                          >
                            <DownloadIcon />
                          </IconButton>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </CardContent>
        </Card>
      )}
    </Box>
  );
};

export default AnalyticsReports;
