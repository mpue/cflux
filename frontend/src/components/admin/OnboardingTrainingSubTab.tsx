import React, { useState, useEffect, useCallback } from 'react';
import {
  Box, Typography, Button, TextField, Dialog, DialogTitle, DialogContent, DialogActions,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper,
  Chip, IconButton, Tooltip, LinearProgress, Alert, Autocomplete,
  Tabs, Tab,
} from '@mui/material';
import { Refresh, School, PersonAdd } from '@mui/icons-material';
import { onboardingService } from '../../services/onboardingService';
import api from '../../services/api';
import { Employee } from '../../types/onboarding';
import { Course, CourseType, EnrollmentStatus } from '../../types/elearning';

interface OnboardingTrainingSubTabProps {
  onUpdate?: () => void;
}

interface Enrollment {
  id: string;
  userId: string;
  courseId: string;
  status: EnrollmentStatus;
  progressPercent: number;
  score?: number;
  user?: { id: string; firstName: string; lastName: string; email: string };
  course?: { id: string; title: string };
}

const courseTypeLabels: Record<string, string> = {
  MANDATORY: 'Pflicht',
  OPTIONAL: 'Optional',
  CERTIFICATION: 'Zertifizierung',
  ONBOARDING: 'Onboarding',
};

const enrollmentStatusLabels: Record<EnrollmentStatus, string> = {
  [EnrollmentStatus.NOT_STARTED]: 'Nicht gestartet',
  [EnrollmentStatus.IN_PROGRESS]: 'In Bearbeitung',
  [EnrollmentStatus.COMPLETED]: 'Abgeschlossen',
  [EnrollmentStatus.FAILED]: 'Nicht bestanden',
  [EnrollmentStatus.EXPIRED]: 'Abgelaufen',
};

const enrollmentStatusColors: Record<EnrollmentStatus, 'default' | 'primary' | 'success' | 'error' | 'warning'> = {
  [EnrollmentStatus.NOT_STARTED]: 'default',
  [EnrollmentStatus.IN_PROGRESS]: 'primary',
  [EnrollmentStatus.COMPLETED]: 'success',
  [EnrollmentStatus.FAILED]: 'error',
  [EnrollmentStatus.EXPIRED]: 'warning',
};

const OnboardingTrainingSubTab: React.FC<OnboardingTrainingSubTabProps> = ({ onUpdate }) => {
  const [courses, setCourses] = useState<Course[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'courses' | 'assignments'>('courses');

  // Assignment dialog state
  const [assignDialogOpen, setAssignDialogOpen] = useState(false);
  const [selectedCourseId, setSelectedCourseId] = useState<string>('');
  const [selectedEmployees, setSelectedEmployees] = useState<Employee[]>([]);
  const [dueDate, setDueDate] = useState<string>('');
  const [assignNotes, setAssignNotes] = useState<string>('');

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [coursesRes, empData] = await Promise.all([
        api.get('/elearning/courses', { params: { status: 'PUBLISHED' } }),
        onboardingService.getAllEmployees(),
      ]);
      setCourses(coursesRes.data);
      setEmployees(empData);

      // Load enrollments for all onboarding employees
      const userIds = empData.filter((e: Employee) => e.userId).map((e: Employee) => e.userId!);
      if (userIds.length > 0) {
        const enrollmentPromises = userIds.map((uid) =>
          api.get(`/elearning/enrollments/user/${uid}`).catch(() => ({ data: [] }))
        );
        const enrollmentResults = await Promise.all(enrollmentPromises);
        const allEnrollments = enrollmentResults.flatMap((r) => r.data);
        setEnrollments(allEnrollments);
      }
    } catch (err: any) {
      console.error('Error loading data:', err);
      setError('Fehler beim Laden der Daten');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const openAssignDialog = (courseId?: string) => {
    setSelectedCourseId(courseId || '');
    setSelectedEmployees([]);
    setDueDate('');
    setAssignNotes('');
    setAssignDialogOpen(true);
  };

  const handleAssign = async () => {
    const userIds = selectedEmployees
      .filter((e) => e.userId)
      .map((e) => e.userId as string);

    if (userIds.length === 0) {
      setError('Ausgewählte Mitarbeiter haben kein verknüpftes Benutzerkonto');
      setAssignDialogOpen(false);
      return;
    }

    try {
      await api.post('/elearning/assignments', {
        courseId: selectedCourseId,
        assignedToUserIds: userIds,
        dueDate: dueDate ? new Date(dueDate).toISOString() : undefined,
        notes: assignNotes || undefined,
      });
      setAssignDialogOpen(false);
      await loadData();
      onUpdate?.();
    } catch (err: any) {
      console.error('Error assigning course:', err);
      setError(err.response?.data?.error || 'Fehler beim Zuweisen des Kurses');
    }
  };

  if (loading) {
    return (
      <Box sx={{ p: 2 }}>
        <LinearProgress />
        <Typography sx={{ mt: 1 }}>Lade E-Learning Kurse...</Typography>
      </Box>
    );
  }

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h5">E-Learning Kurse zuweisen</Typography>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Tooltip title="Aktualisieren">
            <IconButton onClick={loadData}>
              <Refresh />
            </IconButton>
          </Tooltip>
          <Button
            variant="contained"
            startIcon={<PersonAdd />}
            onClick={() => openAssignDialog()}
          >
            Kurs zuweisen
          </Button>
        </Box>
      </Box>

      {error && (
        <Alert severity="error" onClose={() => setError(null)} sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <Tabs
        value={activeTab}
        onChange={(_, v) => setActiveTab(v)}
        sx={{ mb: 2 }}
      >
        <Tab icon={<School />} iconPosition="start" label="Verfügbare Kurse" value="courses" />
        <Tab icon={<PersonAdd />} iconPosition="start" label="Zuweisungen" value="assignments" />
      </Tabs>

      {activeTab === 'courses' && (
        <>
          {courses.length === 0 ? (
            <Alert severity="info">
              Keine veröffentlichten E-Learning Kurse vorhanden. Erstellen Sie Kurse im E-Learning Modul.
            </Alert>
          ) : (
            <TableContainer component={Paper}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Kurs</TableCell>
                    <TableCell>Typ</TableCell>
                    <TableCell>Lektionen</TableCell>
                    <TableCell>Dauer</TableCell>
                    <TableCell>Compliance</TableCell>
                    <TableCell>Aktionen</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {courses.map((course) => (
                    <TableRow key={course.id} hover>
                      <TableCell>
                        <Typography fontWeight="bold">{course.title}</Typography>
                        {course.description && (
                          <Typography variant="caption" color="textSecondary" sx={{ display: 'block' }}>
                            {course.description.length > 100
                              ? course.description.substring(0, 100) + '...'
                              : course.description}
                          </Typography>
                        )}
                        {course.category && (
                          <Chip label={course.category.name} size="small" variant="outlined" sx={{ mt: 0.5 }} />
                        )}
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={courseTypeLabels[course.courseType] || course.courseType}
                          size="small"
                          color={course.courseType === CourseType.MANDATORY ? 'error' : course.courseType === CourseType.ONBOARDING ? 'primary' : 'default'}
                          variant="outlined"
                        />
                      </TableCell>
                      <TableCell>
                        {course._count?.lessons ?? 0}
                      </TableCell>
                      <TableCell>
                        {course.duration ? `${course.duration} Min.` : '–'}
                      </TableCell>
                      <TableCell>
                        {course.isComplianceCourse && (
                          <Chip label="Compliance" size="small" color="warning" />
                        )}
                        {course.ehsRelevant && (
                          <Chip label="EHS" size="small" color="error" sx={{ ml: 0.5 }} />
                        )}
                        {!course.isComplianceCourse && !course.ehsRelevant && '–'}
                      </TableCell>
                      <TableCell>
                        <Button
                          size="small"
                          variant="outlined"
                          startIcon={<PersonAdd />}
                          onClick={() => openAssignDialog(course.id)}
                        >
                          Zuweisen
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </>
      )}

      {activeTab === 'assignments' && (
        <>
          {employees.length === 0 ? (
            <Alert severity="info">
              Keine Onboarding-Mitarbeiter vorhanden.
            </Alert>
          ) : (
            <TableContainer component={Paper}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Mitarbeiter</TableCell>
                    <TableCell>Kurs</TableCell>
                    <TableCell>Fortschritt</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Punkte</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {employees.flatMap((emp) =>
                    enrollments
                      .filter((e) => e.userId === emp.userId)
                      .map((enrollment) => (
                        <TableRow key={`${emp.id}-${enrollment.id}`} hover>
                          <TableCell>
                            <Typography fontWeight="bold">
                              {emp.firstName} {emp.lastName}
                            </Typography>
                            <Typography variant="caption" color="textSecondary">
                              {emp.department || ''} {emp.position ? `· ${emp.position}` : ''}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2">
                              {enrollment.course?.title || '–'}
                            </Typography>
                          </TableCell>
                          <TableCell sx={{ minWidth: 140 }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              <LinearProgress
                                variant="determinate"
                                value={enrollment.progressPercent}
                                sx={{ flex: 1, height: 6, borderRadius: 3 }}
                              />
                              <Typography variant="caption">
                                {enrollment.progressPercent}%
                              </Typography>
                            </Box>
                          </TableCell>
                          <TableCell>
                            <Chip
                              label={enrollmentStatusLabels[enrollment.status]}
                              size="small"
                              color={enrollmentStatusColors[enrollment.status]}
                            />
                          </TableCell>
                          <TableCell>
                            {enrollment.score != null ? `${enrollment.score}%` : '–'}
                          </TableCell>
                        </TableRow>
                      ))
                  )}
                  {employees.every((emp) =>
                    !enrollments.some((e) => e.userId === emp.userId)
                  ) && (
                    <TableRow>
                      <TableCell colSpan={5}>
                        <Typography variant="body2" color="textSecondary" align="center" sx={{ py: 2 }}>
                          Noch keine Kurse zugewiesen. Wählen Sie den Tab "Verfügbare Kurse" und weisen Sie Kurse zu.
                        </Typography>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </>
      )}

      {/* Assign Course Dialog */}
      <Dialog open={assignDialogOpen} onClose={() => setAssignDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>E-Learning Kurs zuweisen</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
            <Autocomplete
              options={courses}
              getOptionLabel={(c) => `${c.title}${c.courseType ? ` (${courseTypeLabels[c.courseType] || c.courseType})` : ''}`}
              value={courses.find((c) => c.id === selectedCourseId) || null}
              onChange={(_, newValue) => setSelectedCourseId(newValue?.id || '')}
              renderInput={(params) => (
                <TextField {...params} label="Kurs auswählen" required />
              )}
            />
            <Autocomplete
              multiple
              options={employees.filter((e) => e.userId)}
              getOptionLabel={(e) => `${e.firstName} ${e.lastName} (${e.email})`}
              value={selectedEmployees}
              onChange={(_, newValue) => setSelectedEmployees(newValue)}
              renderInput={(params) => (
                <TextField {...params} label="Mitarbeiter auswählen" required />
              )}
              renderTags={(value, getTagProps) =>
                value.map((emp, index) => (
                  <Chip
                    label={`${emp.firstName} ${emp.lastName}`}
                    size="small"
                    {...getTagProps({ index })}
                    key={emp.id}
                  />
                ))
              }
            />
            <TextField
              label="Fälligkeitsdatum (optional)"
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              InputLabelProps={{ shrink: true }}
              fullWidth
            />
            <TextField
              label="Notizen (optional)"
              value={assignNotes}
              onChange={(e) => setAssignNotes(e.target.value)}
              multiline
              rows={2}
              fullWidth
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAssignDialogOpen(false)}>Abbrechen</Button>
          <Button
            variant="contained"
            onClick={handleAssign}
            disabled={!selectedCourseId || selectedEmployees.length === 0}
          >
            Zuweisen
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default OnboardingTrainingSubTab;
