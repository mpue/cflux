import React, { useState, useEffect } from 'react';
import {
  Container,
  Card,
  CardContent,
  Typography,
  Button,
  Box,
  Grid,
  Chip,
  LinearProgress,
  Alert,
  CircularProgress,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Divider,
  Paper,
} from '@mui/material';
import {
  PlayArrow as StartIcon,
  CheckCircle as CompleteIcon,
  RadioButtonUnchecked as IncompleteIcon,
  VideoLibrary as VideoIcon,
  PictureAsPdf as PdfIcon,
  Code as HtmlIcon,
  Quiz as QuizIcon,
  Link as LinkIcon,
  Schedule as DurationIcon,
  School as LevelIcon,
  Category as CategoryIcon,
  Person as InstructorIcon,
} from '@mui/icons-material';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import AppNavbar from '../components/AppNavbar';
import QuizTaker from '../components/elearning/QuizTaker';
import api from '../services/api';

interface Course {
  id: string;
  title: string;
  description?: string;
  courseType: string;
  status: string;
  category?: {
    name: string;
    color?: string;
  };
  duration?: number;
  level?: string;
  passingScore: number;
  isComplianceCourse: boolean;
  ehsRelevant: boolean;
  lessons: Lesson[];
  createdBy: {
    firstName: string;
    lastName: string;
  };
}

interface Lesson {
  id: string;
  title: string;
  description?: string;
  contentType: string;
  content?: string;
  videoUrl?: string;
  duration?: number;
  order: number;
  isOptional: boolean;
}

interface Enrollment {
  id: string;
  status: string;
  progressPercent: number;
  completedAt?: string;
  lessonProgress: LessonProgress[];
  certificateIssued: boolean;
  certificateUrl?: string;
  certificateIssuedAt?: string;
}

interface LessonProgress {
  lessonId: string;
  status: string;
  completedAt?: string;
  lastAccessedAt: string;
}

const CourseDetailPage: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { user, logout } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [course, setCourse] = useState<Course | null>(null);
  const [enrollment, setEnrollment] = useState<Enrollment | null>(null);
  const [selectedLesson, setSelectedLesson] = useState<Lesson | null>(null);
  const [showQuiz, setShowQuiz] = useState(false);
  const [activeQuizId, setActiveQuizId] = useState<string | null>(null);

  useEffect(() => {
    if (id) {
      loadCourse();
      checkEnrollment();
    }
  }, [id]);

  const loadCourse = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/elearning/courses/${id}`);
      setCourse(response.data);
      
      // Auto-select first lesson if enrolled
      if (response.data.lessons?.length > 0) {
        setSelectedLesson(response.data.lessons[0]);
      }
    } catch (err: any) {
      console.error('Error loading course:', err);
      setError('Fehler beim Laden des Kurses');
    } finally {
      setLoading(false);
    }
  };

  const checkEnrollment = async () => {
    try {
      const response = await api.get('/elearning/enrollments/my');
      const myEnrollment = response.data.find((e: any) => e.courseId === id);
      if (myEnrollment) {
        setEnrollment(myEnrollment);
      }
    } catch (err: any) {
      console.error('Error checking enrollment:', err);
    }
  };

  const handleDownloadCertificate = async () => {
    if (!enrollment) return;

    try {
      const response = await api.get(`/elearning/certificates/${enrollment.id}/download`, {
        responseType: 'blob',
      });

      // Create download link
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `Zertifikat - ${course?.title || 'Kurs'}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err: any) {
      console.error('Error downloading certificate:', err);
      setError('Fehler beim Herunterladen des Zertifikats');
    }
  };

  const handleEnroll = async () => {
    try {
      setLoading(true);
      await api.post('/elearning/enrollments', {
        courseId: id,
      });
      await checkEnrollment();
      setError(null);
    } catch (err: any) {
      console.error('Error enrolling:', err);
      setError(err.response?.data?.error || 'Fehler beim Einschreiben');
    } finally {
      setLoading(false);
    }
  };

  const handleLessonClick = async (lesson: Lesson) => {
    setSelectedLesson(lesson);
    setShowQuiz(false); // Reset quiz view when switching lessons
    
    // Track lesson access
    if (enrollment) {
      try {
        await api.post(`/elearning/lessons/${lesson.id}/progress`, {
          enrollmentId: enrollment.id,
        });
      } catch (err) {
        console.error('Error tracking lesson progress:', err);
      }
    }
  };

  const handleCompleteLesson = async () => {
    if (!selectedLesson || !enrollment) return;

    try {
      await api.post(`/elearning/lessons/${selectedLesson.id}/complete`, {
        enrollmentId: enrollment.id,
      });
      
      // Move to next lesson
      const currentIndex = course?.lessons.findIndex(l => l.id === selectedLesson.id) || 0;
      if (course && currentIndex < course.lessons.length - 1) {
        setSelectedLesson(course.lessons[currentIndex + 1]);
      }
      
      await checkEnrollment();
    } catch (err: any) {
      console.error('Error completing lesson:', err);
      setError('Fehler beim Markieren der Lektion als abgeschlossen');
    }
  };

  const handleStartQuiz = async () => {
    if (!selectedLesson || !enrollment) return;

    try {
      // Get quiz for this lesson
      const response = await api.get(`/elearning/lessons/${selectedLesson.id}/quiz`);
      if (response.data) {
        setActiveQuizId(response.data.id);
        setShowQuiz(true);
      } else {
        setError('Kein Quiz für diese Lektion verfügbar');
      }
    } catch (err: any) {
      console.error('Error loading quiz:', err);
      setError(err.response?.data?.error || 'Fehler beim Laden des Quiz');
    }
  };

  const handleQuizComplete = async (attempt: any) => {
    setShowQuiz(false);
    
    // If quiz was passed, mark lesson as completed
    if (attempt.passed && selectedLesson) {
      await handleCompleteLesson();
    } else {
      // Just reload enrollment to update progress
      await checkEnrollment();
    }
  };

  const isLessonCompleted = (lessonId: string): boolean => {
    return enrollment?.lessonProgress?.some(
      (lp) => lp.lessonId === lessonId && lp.status === 'COMPLETED'
    ) || false;
  };

  const getEmbedUrl = (url: string): string => {
    if (!url) return url;

    // YouTube URL conversion
    const youtubeRegex = /(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]{11})/;
    const match = url.match(youtubeRegex);
    if (match) {
      return `https://www.youtube.com/embed/${match[1]}`;
    }

    // Vimeo URL conversion
    const vimeoRegex = /(?:https?:\/\/)?(?:www\.)?vimeo\.com\/(\d+)/;
    const vimeoMatch = url.match(vimeoRegex);
    if (vimeoMatch) {
      return `https://player.vimeo.com/video/${vimeoMatch[1]}`;
    }

    return url;
  };

  const getContentIcon = (type: string) => {
    switch (type) {
      case 'VIDEO':
        return <VideoIcon />;
      case 'PDF':
        return <PdfIcon />;
      case 'HTML':
        return <HtmlIcon />;
      case 'QUIZ':
        return <QuizIcon />;
      case 'EXTERNAL_LINK':
        return <LinkIcon />;
      default:
        return <HtmlIcon />;
    }
  };

  const renderLessonContent = () => {
    if (!selectedLesson) return null;

    switch (selectedLesson.contentType) {
      case 'VIDEO':
        return (
          <Box>
            {selectedLesson.videoUrl ? (
              <Box
                component="iframe"
                src={getEmbedUrl(selectedLesson.videoUrl)}
                sx={{
                  width: '100%',
                  height: '400px',
                  border: 'none',
                  borderRadius: 1,
                }}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            ) : (
              <Alert severity="info">Video-URL nicht verfügbar</Alert>
            )}
          </Box>
        );

      case 'HTML':
        return (
          <Box
            sx={{ 
              p: 2,
              '& p': {
                marginBottom: 2,
                lineHeight: 1.6,
              },
              '& h1, & h2, & h3, & h4, & h5, & h6': {
                marginTop: 3,
                marginBottom: 2,
                lineHeight: 1.4,
              },
              '& ul, & ol': {
                marginBottom: 2,
                paddingLeft: 3,
              },
              '& li': {
                marginBottom: 1,
                lineHeight: 1.6,
              },
              '& blockquote': {
                marginLeft: 2,
                marginRight: 2,
                marginBottom: 2,
                paddingLeft: 2,
                borderLeft: '4px solid',
                borderColor: 'divider',
              },
              '& pre': {
                marginBottom: 2,
                padding: 2,
                backgroundColor: 'grey.100',
                borderRadius: 1,
                overflow: 'auto',
              },
              '& img': {
                maxWidth: '100%',
                height: 'auto',
                marginBottom: 2,
              },
              '& table': {
                marginBottom: 2,
                borderCollapse: 'collapse',
                width: '100%',
              },
              '& th, & td': {
                border: '1px solid',
                borderColor: 'divider',
                padding: 1,
              },
            }}
            dangerouslySetInnerHTML={{ __html: selectedLesson.content || '<p>Kein Inhalt</p>' }}
          />
        );

      case 'EXTERNAL_LINK':
        return (
          <Box sx={{ p: 2 }}>
            <Typography variant="body1" gutterBottom>
              Dieser Inhalt ist auf einer externen Webseite verfügbar:
            </Typography>
            <Button
              variant="contained"
              component="a"
              href={selectedLesson.content || '#'}
              target="_blank"
              rel="noopener noreferrer"
              startIcon={<LinkIcon />}
            >
              Link öffnen
            </Button>
          </Box>
        );

      case 'PDF':
        return (
          <Alert severity="info" sx={{ m: 2 }}>
            PDF-Viewer wird in Kürze implementiert
          </Alert>
        );

      case 'QUIZ':
        if (showQuiz && activeQuizId && enrollment) {
          return (
            <QuizTaker
              quizId={activeQuizId}
              enrollmentId={enrollment.id}
              onComplete={handleQuizComplete}
              onCancel={() => setShowQuiz(false)}
            />
          );
        }
        return (
          <Box sx={{ p: 3, textAlign: 'center' }}>
            <QuizIcon sx={{ fontSize: 80, color: 'primary.main', mb: 2 }} />
            <Typography variant="h6" gutterBottom>
              Quiz bereit
            </Typography>
            <Typography variant="body1" color="text.secondary" paragraph>
              Testen Sie Ihr Wissen mit diesem Quiz
            </Typography>
            <Button
              variant="contained"
              size="large"
              startIcon={<StartIcon />}
              onClick={handleStartQuiz}
            >
              Quiz starten
            </Button>
          </Box>
        );

      default:
        return (
          <Alert severity="warning" sx={{ m: 2 }}>
            Unbekannter Inhaltstyp
          </Alert>
        );
    }
  };

  if (loading) {
    return (
      <>
        <AppNavbar title="Kurs" onLogout={logout} />
        <Container sx={{ mt: 4, display: 'flex', justifyContent: 'center' }}>
          <CircularProgress />
        </Container>
      </>
    );
  }

  if (!course) {
    return (
      <>
        <AppNavbar title="Kurs" onLogout={logout} />
        <Container sx={{ mt: 4 }}>
          <Alert severity="error">Kurs nicht gefunden</Alert>
        </Container>
      </>
    );
  }

  return (
    <>
      <AppNavbar title={course.title} onLogout={logout} />
      <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
        {error && (
          <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
            {error}
          </Alert>
        )}

        <Grid container spacing={3}>
          {/* Course Info Header */}
          <Grid item xs={12}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                  <Box>
                    <Typography variant="h4" gutterBottom>
                      {course.title}
                    </Typography>
                    <Typography variant="body1" color="text.secondary" paragraph>
                      {course.description}
                    </Typography>

                    <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', mb: 2 }}>
                      {course.category && (
                        <Chip
                          icon={<CategoryIcon />}
                          label={course.category.name}
                          sx={{ bgcolor: course.category.color, color: 'white' }}
                        />
                      )}
                      {course.level && (
                        <Chip icon={<LevelIcon />} label={course.level} variant="outlined" />
                      )}
                      {course.duration && (
                        <Chip
                          icon={<DurationIcon />}
                          label={`${course.duration} Minuten`}
                          variant="outlined"
                        />
                      )}
                      {course.isComplianceCourse && (
                        <Chip label="Compliance" color="warning" />
                      )}
                      {course.ehsRelevant && <Chip label="EHS" color="info" />}
                    </Box>

                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <InstructorIcon fontSize="small" color="action" />
                      <Typography variant="body2" color="text.secondary">
                        {course.createdBy.firstName} {course.createdBy.lastName}
                      </Typography>
                    </Box>
                  </Box>

                  <Box sx={{ textAlign: 'right' }}>
                    {!enrollment ? (
                      <Button
                        variant="contained"
                        size="large"
                        startIcon={<StartIcon />}
                        onClick={handleEnroll}
                        disabled={loading}
                      >
                        Kurs starten
                      </Button>
                    ) : (
                      <Box>
                        <Chip
                          label={enrollment.status === 'COMPLETED' ? 'Abgeschlossen' : 'In Bearbeitung'}
                          color={enrollment.status === 'COMPLETED' ? 'success' : 'primary'}
                          sx={{ mb: 1 }}
                        />
                        <Box sx={{ minWidth: 200 }}>
                          <Typography variant="body2" color="text.secondary" gutterBottom>
                            Fortschritt: {Math.round(enrollment.progressPercent || 0)}%
                          </Typography>
                          <LinearProgress
                            variant="determinate"
                            value={enrollment.progressPercent || 0}
                            sx={{ height: 8, borderRadius: 4 }}
                          />
                        </Box>
                        {enrollment.status === 'COMPLETED' && enrollment.certificateIssued && (
                          <Button
                            variant="outlined"
                            size="small"
                            startIcon={<CompleteIcon />}
                            sx={{ mt: 1 }}
                            onClick={handleDownloadCertificate}
                          >
                            Zertifikat herunterladen
                          </Button>
                        )}
                      </Box>
                    )}
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>

          {enrollment && (
            <>
              {/* Lesson List Sidebar */}
              <Grid item xs={12} md={4}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      Lektionen ({course.lessons.length})
                    </Typography>
                    <List>
                      {course.lessons.map((lesson, index) => (
                        <React.Fragment key={lesson.id}>
                          <ListItem
                            button
                            selected={selectedLesson?.id === lesson.id}
                            onClick={() => handleLessonClick(lesson)}
                          >
                            <ListItemIcon>
                              {isLessonCompleted(lesson.id) ? (
                                <CompleteIcon color="success" />
                              ) : (
                                <IncompleteIcon color="action" />
                              )}
                            </ListItemIcon>
                            <ListItemIcon>{getContentIcon(lesson.contentType)}</ListItemIcon>
                            <ListItemText
                              primary={
                                <Typography variant="body2">
                                  {index + 1}. {lesson.title}
                                  {lesson.isOptional && (
                                    <Chip label="Optional" size="small" sx={{ ml: 1 }} />
                                  )}
                                </Typography>
                              }
                              secondary={
                                lesson.duration ? `${Math.round(lesson.duration / 60)} Min.` : null
                              }
                            />
                          </ListItem>
                          {index < course.lessons.length - 1 && <Divider />}
                        </React.Fragment>
                      ))}
                    </List>
                  </CardContent>
                </Card>
              </Grid>

              {/* Lesson Content Area */}
              <Grid item xs={12} md={8}>
                {selectedLesson ? (
                  <Card>
                    <CardContent>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', mb: 2 }}>
                        <Box>
                          <Typography variant="h5" gutterBottom>
                            {selectedLesson.title}
                          </Typography>
                          {selectedLesson.description && (
                            <Typography variant="body2" color="text.secondary" paragraph>
                              {selectedLesson.description}
                            </Typography>
                          )}
                        </Box>
                        {isLessonCompleted(selectedLesson.id) && (
                          <Chip label="Abgeschlossen" color="success" icon={<CompleteIcon />} />
                        )}
                      </Box>

                      <Paper variant="outlined" sx={{ mb: 3 }}>
                        {renderLessonContent()}
                      </Paper>

                      <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                        <Button
                          variant="outlined"
                          onClick={() => {
                            const currentIndex = course.lessons.findIndex(
                              (l) => l.id === selectedLesson.id
                            );
                            if (currentIndex > 0) {
                              setSelectedLesson(course.lessons[currentIndex - 1]);
                            }
                          }}
                          disabled={course.lessons[0].id === selectedLesson.id}
                        >
                          Vorherige Lektion
                        </Button>

                        {!isLessonCompleted(selectedLesson.id) && (
                          <Button variant="contained" onClick={handleCompleteLesson}>
                            Als abgeschlossen markieren
                          </Button>
                        )}

                        <Button
                          variant="contained"
                          onClick={() => {
                            const currentIndex = course.lessons.findIndex(
                              (l) => l.id === selectedLesson.id
                            );
                            if (currentIndex < course.lessons.length - 1) {
                              setSelectedLesson(course.lessons[currentIndex + 1]);
                            }
                          }}
                          disabled={
                            course.lessons[course.lessons.length - 1].id === selectedLesson.id
                          }
                        >
                          Nächste Lektion
                        </Button>
                      </Box>
                    </CardContent>
                  </Card>
                ) : (
                  <Card>
                    <CardContent>
                      <Typography color="text.secondary" align="center">
                        Wählen Sie eine Lektion aus der Liste
                      </Typography>
                    </CardContent>
                  </Card>
                )}
              </Grid>
            </>
          )}

          {!enrollment && (
            <Grid item xs={12}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Kursinhalte
                  </Typography>
                  <List>
                    {course.lessons.map((lesson, index) => (
                      <React.Fragment key={lesson.id}>
                        <ListItem>
                          <ListItemIcon>{getContentIcon(lesson.contentType)}</ListItemIcon>
                          <ListItemText
                            primary={`${index + 1}. ${lesson.title}`}
                            secondary={lesson.description}
                          />
                          {lesson.duration && (
                            <Chip
                              label={`${Math.round(lesson.duration / 60)} Min.`}
                              size="small"
                              variant="outlined"
                            />
                          )}
                        </ListItem>
                        {index < course.lessons.length - 1 && <Divider />}
                      </React.Fragment>
                    ))}
                  </List>
                </CardContent>
              </Card>
            </Grid>
          )}
        </Grid>
      </Container>
    </>
  );
};

export default CourseDetailPage;
