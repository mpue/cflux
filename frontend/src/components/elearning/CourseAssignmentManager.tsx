import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  OutlinedInput,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Typography,
  Alert,
  Autocomplete,
  Grid,
  Checkbox,
  FormControlLabel,
  FormGroup,
  Snackbar,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Group as GroupIcon,
  Person as PersonIcon,
  Event as EventIcon,
  Notifications as NotificationsIcon,
} from '@mui/icons-material';
import api from '../../services/api';

interface Course {
  id: string;
  title: string;
}

interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
}

interface UserGroup {
  id: string;
  name: string;
}

interface Assignment {
  id: string;
  courseId: string;
  assignedToUserIds: string[];
  assignedToGroupIds: string[];
  dueDate?: string;
  reminderDays: number[];
  notes?: string;
  assignedAt: string;
  course: {
    id: string;
    title: string;
  };
  assignedBy: {
    firstName: string;
    lastName: string;
  };
  _count: {
    enrollments: number;
  };
}

interface CourseAssignmentManagerProps {
  courseId?: string;
}

const CourseAssignmentManager: React.FC<CourseAssignmentManagerProps> = ({ courseId }) => {
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [userGroups, setUserGroups] = useState<UserGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [openDialog, setOpenDialog] = useState(false);
  const [editingAssignment, setEditingAssignment] = useState<Assignment | null>(null);

  // Form state
  const [selectedCourse, setSelectedCourse] = useState<string>(courseId || '');
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [selectedGroups, setSelectedGroups] = useState<string[]>([]);
  const [dueDate, setDueDate] = useState<Date | null>(null);
  const [reminderDays, setReminderDays] = useState<number[]>([7, 3, 1]);
  const [notes, setNotes] = useState('');
  const [notifyUsers, setNotifyUsers] = useState(true);
  const [notifyByEmail, setNotifyByEmail] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, [courseId]);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);

      const [assignmentsRes, coursesRes, usersRes, groupsRes] = await Promise.all([
        courseId
          ? api.get(`/elearning/courses/${courseId}/assignments`)
          : api.get('/elearning/assignments'),
        api.get('/elearning/courses'),
        api.get('/users'),
        api.get('/user-groups'),
      ]);

      setAssignments(assignmentsRes.data);
      setCourses(coursesRes.data);
      setUsers(usersRes.data);
      setUserGroups(groupsRes.data);
    } catch (err: any) {
      console.error('Error loading data:', err);
      setError(err.response?.data?.error || 'Fehler beim Laden der Daten');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDialog = (assignment?: Assignment) => {
    if (assignment) {
      setEditingAssignment(assignment);
      setSelectedCourse(assignment.courseId);
      setSelectedUsers(assignment.assignedToUserIds);
      setSelectedGroups(assignment.assignedToGroupIds);
      setDueDate(assignment.dueDate ? new Date(assignment.dueDate) : null);
      setReminderDays(assignment.reminderDays);
      setNotes(assignment.notes || '');
      // Bei bestehenden Zuweisungen standardmäßig nicht erneut benachrichtigen
      setNotifyUsers(false);
      setNotifyByEmail(false);
    } else {
      setEditingAssignment(null);
      setSelectedCourse(courseId || '');
      setSelectedUsers([]);
      setSelectedGroups([]);
      setDueDate(null);
      setReminderDays([7, 3, 1]);
      setNotes('');
      setNotifyUsers(true);
      setNotifyByEmail(false);
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setEditingAssignment(null);
  };

  const handleSave = async () => {
    try {
      setError(null);

      if (!selectedCourse) {
        setError('Bitte wählen Sie einen Kurs aus');
        return;
      }

      if (selectedUsers.length === 0 && selectedGroups.length === 0) {
        setError('Bitte wählen Sie mindestens einen Benutzer oder eine Gruppe aus');
        return;
      }

      const data = {
        courseId: selectedCourse,
        assignedToUserIds: selectedUsers,
        assignedToGroupIds: selectedGroups,
        dueDate: dueDate?.toISOString(),
        reminderDays,
        notes,
        notifyUsers,
        notifyByEmail: notifyUsers && notifyByEmail,
      };

      if (editingAssignment) {
        await api.put(`/elearning/assignments/${editingAssignment.id}`, data);
      } else {
        const response = await api.post('/elearning/assignments', data);
        const notification = response.data?.notification;
        if (notification) {
          const parts = [`${notification.messagesSent} Benachrichtigung(en) versendet`];
          if (data.notifyByEmail) {
            parts.push(`${notification.emailsSent} E-Mail(s) versendet`);
          }
          setSuccessMessage(parts.join(' · '));
        }
      }

      await loadData();
      handleCloseDialog();
    } catch (err: any) {
      console.error('Error saving assignment:', err);
      setError(err.response?.data?.error || 'Fehler beim Speichern');
    }
  };

  const handleDelete = async (assignmentId: string) => {
    if (!window.confirm('Möchten Sie diese Zuweisung wirklich löschen?')) {
      return;
    }

    try {
      await api.delete(`/elearning/assignments/${assignmentId}`);
      await loadData();
    } catch (err: any) {
      console.error('Error deleting assignment:', err);
      setError(err.response?.data?.error || 'Fehler beim Löschen');
    }
  };

  const getUserName = (userId: string) => {
    const user = users.find((u) => u.id === userId);
    return user ? `${user.firstName} ${user.lastName}` : userId;
  };

  const getGroupName = (groupId: string) => {
    const group = userGroups.find((g) => g.id === groupId);
    return group ? group.name : groupId;
  };

  if (loading) {
    return <Typography>Laden...</Typography>;
  }

  return (
    <Box>
      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
          <Typography variant="h6">
            {courseId ? 'Kurs-Zuweisungen' : 'Alle Kurs-Zuweisungen'}
          </Typography>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => handleOpenDialog()}
          >
            Neue Zuweisung
          </Button>
        </Box>

        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                {!courseId && <TableCell>Kurs</TableCell>}
                <TableCell>Zugewiesen an</TableCell>
                <TableCell>Fälligkeitsdatum</TableCell>
                <TableCell>Einschreibungen</TableCell>
                <TableCell>Zugewiesen von</TableCell>
                <TableCell>Datum</TableCell>
                <TableCell align="right">Aktionen</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {assignments.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={courseId ? 6 : 7} align="center">
                    Keine Zuweisungen vorhanden
                  </TableCell>
                </TableRow>
              ) : (
                assignments.map((assignment) => (
                  <TableRow key={assignment.id}>
                    {!courseId && <TableCell>{assignment.course.title}</TableCell>}
                    <TableCell>
                      <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                        {assignment.assignedToUserIds.map((userId) => (
                          <Chip
                            key={userId}
                            label={getUserName(userId)}
                            size="small"
                            icon={<PersonIcon />}
                          />
                        ))}
                        {assignment.assignedToGroupIds.map((groupId) => (
                          <Chip
                            key={groupId}
                            label={getGroupName(groupId)}
                            size="small"
                            icon={<GroupIcon />}
                            color="primary"
                          />
                        ))}
                      </Box>
                    </TableCell>
                    <TableCell>
                      {assignment.dueDate ? (
                        <Chip
                          label={new Date(assignment.dueDate).toLocaleDateString('de-DE')}
                          size="small"
                          icon={<EventIcon />}
                          color={
                            new Date(assignment.dueDate) < new Date()
                              ? 'error'
                              : 'default'
                          }
                        />
                      ) : (
                        '-'
                      )}
                    </TableCell>
                    <TableCell>{assignment._count.enrollments}</TableCell>
                    <TableCell>
                      {assignment.assignedBy.firstName} {assignment.assignedBy.lastName}
                    </TableCell>
                    <TableCell>
                      {new Date(assignment.assignedAt).toLocaleDateString('de-DE')}
                    </TableCell>
                    <TableCell align="right">
                      <IconButton
                        size="small"
                        onClick={() => handleOpenDialog(assignment)}
                      >
                        <EditIcon />
                      </IconButton>
                      <IconButton
                        size="small"
                        color="error"
                        onClick={() => handleDelete(assignment.id)}
                      >
                        <DeleteIcon />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>

        {/* Assignment Dialog */}
        <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="md" fullWidth>
          <DialogTitle>
            {editingAssignment ? 'Zuweisung bearbeiten' : 'Neue Zuweisung'}
          </DialogTitle>
          <DialogContent>
            <Box sx={{ pt: 2 }}>
              <Grid container spacing={2}>
                {!courseId && (
                  <Grid item xs={12}>
                    <FormControl fullWidth>
                      <InputLabel>Kurs</InputLabel>
                      <Select
                        value={selectedCourse}
                        label="Kurs"
                        onChange={(e) => setSelectedCourse(e.target.value)}
                      >
                        {courses.map((course) => (
                          <MenuItem key={course.id} value={course.id}>
                            {course.title}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Grid>
                )}

                <Grid item xs={12}>
                  <Autocomplete
                    multiple
                    options={users}
                    getOptionLabel={(option) =>
                      `${option.firstName} ${option.lastName} (${option.email})`
                    }
                    value={users.filter((u) => selectedUsers.includes(u.id))}
                    onChange={(_, newValue) => {
                      setSelectedUsers(newValue.map((u) => u.id));
                    }}
                    renderInput={(params) => (
                      <TextField
                        {...params}
                        label="Benutzer"
                        placeholder="Benutzer auswählen"
                      />
                    )}
                    renderTags={(value, getTagProps) =>
                      value.map((option, index) => (
                        <Chip
                          label={`${option.firstName} ${option.lastName}`}
                          {...getTagProps({ index })}
                          icon={<PersonIcon />}
                        />
                      ))
                    }
                  />
                </Grid>

                <Grid item xs={12}>
                  <Autocomplete
                    multiple
                    options={userGroups}
                    getOptionLabel={(option) => option.name}
                    value={userGroups.filter((g) => selectedGroups.includes(g.id))}
                    onChange={(_, newValue) => {
                      setSelectedGroups(newValue.map((g) => g.id));
                    }}
                    renderInput={(params) => (
                      <TextField
                        {...params}
                        label="Benutzergruppen"
                        placeholder="Gruppen auswählen"
                      />
                    )}
                    renderTags={(value, getTagProps) =>
                      value.map((option, index) => (
                        <Chip
                          label={option.name}
                          {...getTagProps({ index })}
                          icon={<GroupIcon />}
                          color="primary"
                        />
                      ))
                    }
                  />
                </Grid>

                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    type="datetime-local"
                    label="Fälligkeitsdatum (optional)"
                    value={dueDate ? dueDate.toISOString().slice(0, 16) : ''}
                    onChange={(e) => setDueDate(e.target.value ? new Date(e.target.value) : null)}
                    InputLabelProps={{
                      shrink: true,
                    }}
                  />
                </Grid>

                <Grid item xs={12}>
                  <FormControl fullWidth>
                    <InputLabel>Erinnerungstage</InputLabel>
                    <Select
                      multiple
                      value={reminderDays}
                      onChange={(e) =>
                        setReminderDays(
                          typeof e.target.value === 'string'
                            ? []
                            : e.target.value
                        )
                      }
                      input={<OutlinedInput label="Erinnerungstage" />}
                      renderValue={(selected) =>
                        selected
                          .sort((a, b) => b - a)
                          .map((day) => `${day} Tage vorher`)
                          .join(', ')
                      }
                    >
                      {[1, 3, 7, 14, 30].map((day) => (
                        <MenuItem key={day} value={day}>
                          {day} Tage vorher
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>

                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    multiline
                    rows={3}
                    label="Notizen (optional)"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                  />
                </Grid>

                <Grid item xs={12}>
                  <Box
                    sx={{
                      border: '1px solid',
                      borderColor: 'divider',
                      borderRadius: 1,
                      p: 2,
                    }}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                      <NotificationsIcon fontSize="small" color="action" />
                      <Typography variant="subtitle2">Benachrichtigung</Typography>
                    </Box>
                    <FormGroup>
                      <FormControlLabel
                        control={
                          <Checkbox
                            checked={notifyUsers}
                            onChange={(e) => setNotifyUsers(e.target.checked)}
                          />
                        }
                        label="Mitarbeiter benachrichtigen (Postfach-Nachricht mit direktem Link zum Kurs)"
                      />
                      <FormControlLabel
                        sx={{ ml: 3 }}
                        control={
                          <Checkbox
                            checked={notifyByEmail}
                            disabled={!notifyUsers}
                            onChange={(e) => setNotifyByEmail(e.target.checked)}
                          />
                        }
                        label="Zusätzlich per E-Mail senden"
                      />
                    </FormGroup>
                    {editingAssignment && notifyUsers && (
                      <Alert severity="info" sx={{ mt: 1 }}>
                        Benachrichtigungen werden nur beim Erstellen einer Zuweisung versendet.
                      </Alert>
                    )}
                  </Box>
                </Grid>
              </Grid>
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCloseDialog}>Abbrechen</Button>
            <Button variant="contained" onClick={handleSave}>
              {editingAssignment ? 'Aktualisieren' : 'Erstellen'}
            </Button>
          </DialogActions>
        </Dialog>

        <Snackbar
          open={!!successMessage}
          autoHideDuration={5000}
          onClose={() => setSuccessMessage(null)}
        >
          <Alert severity="success" onClose={() => setSuccessMessage(null)}>
            {successMessage}
          </Alert>
        </Snackbar>
      </Box>
  );
};

export default CourseAssignmentManager;
