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
} from '@mui/material';
import {
  Edit as EditIcon,
  Delete as DeleteIcon,
  Add as AddIcon,
  Visibility as ViewIcon,
  Archive as ArchiveIcon,
  Publish as PublishIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
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
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => navigate('/elearning/courses/new/edit')}
        >
          Neuer Kurs
        </Button>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

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
                      onClick={() => navigate(`/elearning/courses/${course.id}/edit`)}
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
    </Box>
  );
};

export default ELearningManagementTab;
