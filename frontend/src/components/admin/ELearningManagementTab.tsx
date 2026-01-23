import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Card,
  CardContent,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  Grid,
  TextField,
  MenuItem,
  Tabs,
  Tab,
} from '@mui/material';
import {
  Edit as EditIcon,
  Delete as DeleteIcon,
  Add as AddIcon,
  Visibility as ViewIcon,
  Archive as ArchiveIcon,
  Publish as PublishIcon,
  School as SchoolIcon,
  Assignment as AssignmentIcon,
  Analytics as AnalyticsIcon,
  Download as DownloadIcon,
  Upload as UploadIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import CourseAssignmentManager from '../elearning/CourseAssignmentManager';
import AnalyticsReports from '../elearning/AnalyticsReports';
import CourseEditorContent from '../elearning/CourseEditorContent';
import api from '../../services/api';

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
  createdBy: {
    firstName: string;
    lastName: string;
  };
  _count: {
    lessons: number;
    enrollments: number;
  };
  isComplianceCourse: boolean;
  ehsRelevant: boolean;
  createdAt: string;
}

interface ELearningManagementTabProps {
  onUpdate?: () => void;
}

const ELearningManagementTab: React.FC<ELearningManagementTabProps> = ({ onUpdate }) => {
  const navigate = useNavigate();
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [typeFilter, setTypeFilter] = useState<string>('');
  const [activeTab, setActiveTab] = useState<number>(0);
  const [importDialogOpen, setImportDialogOpen] = useState(false);
  const [importFile, setImportFile] = useState<File | null>(null);
  const [importing, setImporting] = useState(false);
  const [editorDialogOpen, setEditorDialogOpen] = useState(false);
  const [editingCourseId, setEditingCourseId] = useState<string | null>(null);

  useEffect(() => {
    loadCourses();
  }, [statusFilter, typeFilter]);

  const loadCourses = async () => {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams();
      if (statusFilter) params.append('status', statusFilter);
      if (typeFilter) params.append('courseType', typeFilter);

      const response = await api.get(`/elearning/courses?${params.toString()}`);
      setCourses(response.data);
    } catch (err: any) {
      console.error('Error loading courses:', err);
      setError(err.response?.data?.error || 'Fehler beim Laden der Kurse');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedCourse) return;

    try {
      await api.delete(`/elearning/courses/${selectedCourse.id}`);
      setDeleteDialogOpen(false);
      setSelectedCourse(null);
      loadCourses();
      if (onUpdate) onUpdate();
    } catch (err: any) {
      console.error('Error deleting course:', err);
      setError(err.response?.data?.error || 'Fehler beim Löschen des Kurses');
    }
  };

  const handleStatusChange = async (courseId: string, newStatus: string) => {
    try {
      await api.put(`/elearning/courses/${courseId}`, { status: newStatus });
      loadCourses();
      if (onUpdate) onUpdate();
    } catch (err: any) {
      console.error('Error updating course status:', err);
      setError(err.response?.data?.error || 'Fehler beim Aktualisieren des Status');
    }
  };

  const handleExportCourse = async (courseId: string, courseTitle: string) => {
    try {
      const response = await api.get(`/elearning/courses/${courseId}/export`, {
        responseType: 'blob',
      });

      // Create blob link to download
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      const filename = `kurs-${courseTitle.replace(/[^a-z0-9]/gi, '-').toLowerCase()}-${Date.now()}.json`;
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      link.parentNode?.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (err: any) {
      console.error('Error exporting course:', err);
      setError('Fehler beim Exportieren des Kurses');
    }
  };

  const handleImportCourse = async () => {
    if (!importFile) {
      setError('Bitte wählen Sie eine Datei aus');
      return;
    }

    try {
      setImporting(true);
      setError(null);

      // Read file content
      const fileContent = await importFile.text();
      const courseData = JSON.parse(fileContent);

      // Import course
      const response = await api.post('/elearning/courses/import', courseData);

      setImportDialogOpen(false);
      setImportFile(null);
      loadCourses();
      
      alert(`Kurs "${response.data.title}" erfolgreich importiert!`);
    } catch (err: any) {
      console.error('Error importing course:', err);
      setError(err.response?.data?.error || 'Fehler beim Importieren des Kurses. Bitte überprüfen Sie die Datei.');
    } finally {
      setImporting(false);
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

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'PUBLISHED':
        return 'Veröffentlicht';
      case 'DRAFT':
        return 'Entwurf';
      case 'ARCHIVED':
        return 'Archiviert';
      default:
        return status;
    }
  };

  if (loading && courses.length === 0) {
    return <Typography>Lade Kurse...</Typography>;
  }

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h5">E-Learning Verwaltung</Typography>
        {activeTab === 0 && (
          <Box sx={{ display: 'flex', gap: 2 }}>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => {
                setEditingCourseId('new');
                setEditorDialogOpen(true);
              }}
            >
              Neuer Kurs
            </Button>
            <Button
              variant="outlined"
              startIcon={<UploadIcon />}
              onClick={() => setImportDialogOpen(true)}
            >
              Kurs importieren
            </Button>
          </Box>
        )}
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* Tabs */}
      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs value={activeTab} onChange={(e, newValue) => setActiveTab(newValue)}>
          <Tab label="Kurse" icon={<SchoolIcon />} iconPosition="start" />
          <Tab label="Zuweisungen" icon={<AssignmentIcon />} iconPosition="start" />
          <Tab label="Analytics & Reports" icon={<AnalyticsIcon />} iconPosition="start" />
        </Tabs>
      </Box>

      {/* Courses Tab */}
      {activeTab === 0 && (
        <>

      {/* Filter */}
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
                size="small"
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
                size="small"
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

      {/* Course Table */}
      <TableContainer>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Titel</TableCell>
              <TableCell>Typ</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Kategorie</TableCell>
              <TableCell>Lektionen</TableCell>
              <TableCell>Teilnehmer</TableCell>
              <TableCell>Flags</TableCell>
              <TableCell>Ersteller</TableCell>
              <TableCell align="right">Aktionen</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {courses.map((course) => (
              <TableRow key={course.id} hover>
                <TableCell>
                  <Typography variant="body2" fontWeight="bold">
                    {course.title}
                  </Typography>
                  {course.description && (
                    <Typography variant="caption" color="text.secondary">
                      {course.description.substring(0, 60)}
                      {course.description.length > 60 && '...'}
                    </Typography>
                  )}
                </TableCell>
                <TableCell>
                  <Chip
                    label={getTypeLabel(course.courseType)}
                    size="small"
                    color={course.courseType === 'MANDATORY' ? 'error' : 'default'}
                  />
                </TableCell>
                <TableCell>
                  <Chip
                    label={getStatusLabel(course.status)}
                    size="small"
                    color={getStatusColor(course.status) as any}
                  />
                </TableCell>
                <TableCell>
                  {course.category ? (
                    <Chip
                      label={course.category.name}
                      size="small"
                      sx={{
                        bgcolor: course.category.color || 'grey.300',
                        color: 'white',
                      }}
                    />
                  ) : (
                    '-'
                  )}
                </TableCell>
                <TableCell>{course._count.lessons}</TableCell>
                <TableCell>{course._count.enrollments}</TableCell>
                <TableCell>
                  <Box sx={{ display: 'flex', gap: 0.5 }}>
                    {course.isComplianceCourse && (
                      <Chip label="Compliance" size="small" color="warning" />
                    )}
                    {course.ehsRelevant && <Chip label="EHS" size="small" color="info" />}
                  </Box>
                </TableCell>
                <TableCell>
                  <Typography variant="caption">
                    {course.createdBy.firstName} {course.createdBy.lastName}
                  </Typography>
                </TableCell>
                <TableCell align="right">
                  <Box sx={{ display: 'flex', gap: 0.5, justifyContent: 'flex-end' }}>
                    <IconButton
                      size="small"
                      color="info"
                      onClick={() => handleExportCourse(course.id, course.title)}
                      title="Kurs exportieren"
                    >
                      <DownloadIcon fontSize="small" />
                    </IconButton>
                    {course.status === 'DRAFT' && (
                      <IconButton
                        size="small"
                        color="success"
                        onClick={() => handleStatusChange(course.id, 'PUBLISHED')}
                        title="Veröffentlichen"
                      >
                        <PublishIcon fontSize="small" />
                      </IconButton>
                    )}
                    {course.status === 'PUBLISHED' && (
                      <IconButton
                        size="small"
                        color="warning"
                        onClick={() => handleStatusChange(course.id, 'ARCHIVED')}
                        title="Archivieren"
                      >
                        <ArchiveIcon fontSize="small" />
                      </IconButton>
                    )}
                    <IconButton
                      size="small"
                      color="primary"
                      onClick={() => {
                        setEditingCourseId(course.id);
                        setEditorDialogOpen(true);
                      }}
                      title="Bearbeiten"
                    >
                      <EditIcon fontSize="small" />
                    </IconButton>
                    <IconButton
                      size="small"
                      color="error"
                      onClick={() => {
                        setSelectedCourse(course);
                        setDeleteDialogOpen(true);
                      }}
                      title="Löschen"
                    >
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  </Box>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      {courses.length === 0 && (
        <Card sx={{ mt: 2 }}>
          <CardContent>
            <Typography variant="body1" color="text.secondary" align="center">
              Keine Kurse gefunden
            </Typography>
          </CardContent>
        </Card>
      )}

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
        <DialogTitle>Kurs löschen?</DialogTitle>
        <DialogContent>
          <Typography>
            Möchten Sie den Kurs "{selectedCourse?.title}" wirklich löschen? Diese Aktion kann nicht
            rückgängig gemacht werden.
          </Typography>
          {selectedCourse && selectedCourse._count.enrollments > 0 && (
            <Alert severity="warning" sx={{ mt: 2 }}>
              Achtung: {selectedCourse._count.enrollments} Benutzer sind in diesem Kurs eingeschrieben!
            </Alert>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>Abbrechen</Button>
          <Button onClick={handleDelete} color="error" variant="contained">
            Löschen
          </Button>
        </DialogActions>
      </Dialog>

      {/* Import Dialog */}
      <Dialog open={importDialogOpen} onClose={() => !importing && setImportDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Kurs importieren</DialogTitle>
        <DialogContent>
          <Typography variant="body2" sx={{ mb: 2 }}>
            Wählen Sie eine Kurs-Exportdatei (.json) aus, um einen Kurs zu importieren.
            Der Kurs wird als Entwurf importiert.
          </Typography>
          
          <input
            type="file"
            accept=".json,application/json"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) {
                setImportFile(file);
                setError(null);
              }
            }}
            style={{ marginBottom: 16 }}
          />

          {importFile && (
            <Alert severity="info" sx={{ mt: 2 }}>
              Ausgewählte Datei: {importFile.name}
            </Alert>
          )}

          {error && (
            <Alert severity="error" sx={{ mt: 2 }}>
              {error}
            </Alert>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setImportDialogOpen(false)} disabled={importing}>
            Abbrechen
          </Button>
          <Button 
            onClick={handleImportCourse} 
            variant="contained" 
            disabled={!importFile || importing}
          >
            {importing ? 'Importiere...' : 'Importieren'}
          </Button>
        </DialogActions>
      </Dialog>
        </>
      )}

      {/* Assignments Tab */}
      {activeTab === 1 && <CourseAssignmentManager />}
      
      {/* Analytics & Reports Tab */}
      {activeTab === 2 && <AnalyticsReports />}

      {/* Course Editor Dialog */}
      <Dialog
        open={editorDialogOpen}
        onClose={() => {
          setEditorDialogOpen(false);
          setEditingCourseId(null);
        }}
        maxWidth="xl"
        fullWidth
        PaperProps={{
          sx: { height: '90vh' }
        }}
      >
        <DialogTitle>
          {editingCourseId === 'new' ? 'Neuer Kurs' : 'Kurs bearbeiten'}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2 }}>
            <CourseEditorContent 
              courseId={editingCourseId || undefined}
              onSaveSuccess={() => {
                loadCourses();
              }}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button 
            onClick={() => {
              setEditorDialogOpen(false);
              setEditingCourseId(null);
              loadCourses();
              loadCourses(); // Refresh list after editing
            }}
          >
            Schließen
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ELearningManagementTab;
