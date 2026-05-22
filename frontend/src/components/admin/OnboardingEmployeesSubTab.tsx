import React, { useState, useEffect, useCallback } from 'react';
import {
  Box, Typography, Button, TextField, Dialog, DialogTitle, DialogContent, DialogActions,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper,
  Chip, IconButton, Tooltip, LinearProgress, Autocomplete, MenuItem, Select,
  FormControl, InputLabel, Collapse, Alert, Divider, Tabs, Tab,
  List, ListItem, ListItemText, Checkbox,
} from '@mui/material';
import {
  Add, ExpandMore, ExpandLess, Edit, CheckCircle, PlayArrow, Refresh,
  PlaylistAddCheck, OpenInNew, Close, Delete,
} from '@mui/icons-material';
import { onboardingService } from '../../services/onboardingService';
import { userService } from '../../services/user.service';
import api from '../../services/api';
import { Employee, OnboardingTask, OnboardingTaskStatus, TaskFormData } from '../../types/onboarding';
import { ChecklistTemplate, ChecklistInstance, ChecklistItemCompletion, ChecklistItemType } from '../../types/checklist';

interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
}

const statusColors: Record<OnboardingTaskStatus, 'default' | 'primary' | 'success' | 'error'> = {
  [OnboardingTaskStatus.NOT_STARTED]: 'default',
  [OnboardingTaskStatus.IN_PROGRESS]: 'primary',
  [OnboardingTaskStatus.COMPLETED]: 'success',
  [OnboardingTaskStatus.OVERDUE]: 'error',
};

const statusLabels: Record<OnboardingTaskStatus, string> = {
  [OnboardingTaskStatus.NOT_STARTED]: 'Nicht gestartet',
  [OnboardingTaskStatus.IN_PROGRESS]: 'In Bearbeitung',
  [OnboardingTaskStatus.COMPLETED]: 'Abgeschlossen',
  [OnboardingTaskStatus.OVERDUE]: 'Überfällig',
};

const TASK_CATEGORIES = [
  'IT_SETUP',
  'HR_DOCUMENTS',
  'TRAINING',
  'EQUIPMENT',
  'ACCESS_RIGHTS',
  'INTRODUCTION',
  'OTHER',
];

const categoryLabels: Record<string, string> = {
  IT_SETUP: 'IT-Einrichtung',
  HR_DOCUMENTS: 'HR-Dokumente',
  TRAINING: 'Schulung',
  EQUIPMENT: 'Ausrüstung',
  ACCESS_RIGHTS: 'Zugriffsrechte',
  INTRODUCTION: 'Einführung',
  OTHER: 'Sonstiges',
};

interface OnboardingEmployeesSubTabProps {
  onUpdate?: () => void;
}

const OnboardingEmployeesSubTab: React.FC<OnboardingEmployeesSubTabProps> = ({ onUpdate }) => {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedEmployee, setExpandedEmployee] = useState<string | null>(null);
  const [employeeTasks, setEmployeeTasks] = useState<Record<string, OnboardingTask[]>>({});
  const [taskDialogOpen, setTaskDialogOpen] = useState(false);
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string>('');
  const [taskForm, setTaskForm] = useState<TaskFormData>({
    employeeId: '',
    title: '',
    description: '',
    category: 'OTHER',
    assignedToId: '',
    dueDate: '',
  });

  // Checklist assignment state
  const [checklistDialogOpen, setChecklistDialogOpen] = useState(false);
  const [checklistTemplates, setChecklistTemplates] = useState<ChecklistTemplate[]>([]);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>('');
  const [checklistTargetDate, setChecklistTargetDate] = useState<string>('');
  const [checklistNotes, setChecklistNotes] = useState<string>('');
  const [checklistAssignedToId, setChecklistAssignedToId] = useState<string>('');
  const [employeeChecklists, setEmployeeChecklists] = useState<Record<string, ChecklistInstance[]>>({});
  const [expandedTab, setExpandedTab] = useState<Record<string, 'tasks' | 'checklists'>>({});

  // Checklist processing state
  const [processDialogOpen, setProcessDialogOpen] = useState(false);
  const [activeInstance, setActiveInstance] = useState<ChecklistInstance | null>(null);
  const [activeInstanceLoading, setActiveInstanceLoading] = useState(false);
  const [editItemDialog, setEditItemDialog] = useState(false);
  const [editCompletion, setEditCompletion] = useState<ChecklistItemCompletion | null>(null);
  const [editValue, setEditValue] = useState<{ text?: string; number?: number; date?: string; comment?: string }>({});

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [empData, userData, templatesRes] = await Promise.all([
        onboardingService.getAllEmployees(),
        userService.getAllUsers(),
        api.get('/checklists/templates?isActive=true'),
      ]);
      setEmployees(empData);
      setUsers(userData);
      setChecklistTemplates(templatesRes.data);
    } catch (err: any) {
      console.error('Error loading employees:', err);
      setError('Fehler beim Laden der Mitarbeiter');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const loadTasks = async (employeeId: string) => {
    try {
      const tasks = await onboardingService.getTasks(employeeId);
      setEmployeeTasks((prev) => ({ ...prev, [employeeId]: tasks }));
    } catch (err) {
      console.error('Error loading tasks:', err);
    }
  };

  const loadChecklists = async (employeeId: string, userId?: string) => {
    if (!userId) return;
    try {
      const res = await api.get('/checklists/instances', { params: { userId } });
      setEmployeeChecklists((prev) => ({ ...prev, [employeeId]: res.data }));
    } catch (err) {
      console.error('Error loading checklists:', err);
    }
  };

  const toggleExpand = (employeeId: string, userId?: string) => {
    if (expandedEmployee === employeeId) {
      setExpandedEmployee(null);
    } else {
      setExpandedEmployee(employeeId);
      if (!expandedTab[employeeId]) {
        setExpandedTab((prev) => ({ ...prev, [employeeId]: 'tasks' }));
      }
      if (!employeeTasks[employeeId]) {
        loadTasks(employeeId);
      }
      if (!employeeChecklists[employeeId] && userId) {
        loadChecklists(employeeId, userId);
      }
    }
  };

  const openTaskDialog = (employeeId: string) => {
    setSelectedEmployeeId(employeeId);
    setTaskForm({
      employeeId,
      title: '',
      description: '',
      category: 'OTHER',
      assignedToId: '',
      dueDate: '',
    });
    setTaskDialogOpen(true);
  };

  const handleCreateTask = async () => {
    try {
      const data: TaskFormData = {
        ...taskForm,
        employeeId: selectedEmployeeId,
      };
      if (!data.assignedToId) delete data.assignedToId;
      if (!data.dueDate) delete data.dueDate;
      if (!data.description) delete data.description;

      await onboardingService.createTask(data);
      setTaskDialogOpen(false);
      await loadTasks(selectedEmployeeId);
      onUpdate?.();
    } catch (err: any) {
      console.error('Error creating task:', err);
      setError('Fehler beim Erstellen der Aufgabe');
    }
  };

  const openChecklistDialog = (employeeId: string) => {
    setSelectedEmployeeId(employeeId);
    setSelectedTemplateId('');
    setChecklistTargetDate('');
    setChecklistNotes('');
    setChecklistAssignedToId('');
    setChecklistDialogOpen(true);
  };

  const openProcessDialog = async (instanceId: string) => {
    setProcessDialogOpen(true);
    setActiveInstanceLoading(true);
    try {
      const res = await api.get(`/checklists/instances/${instanceId}`);
      setActiveInstance(res.data);
    } catch (err) {
      console.error('Error loading checklist instance:', err);
      setError('Fehler beim Laden der Checkliste');
      setProcessDialogOpen(false);
    } finally {
      setActiveInstanceLoading(false);
    }
  };

  const handleToggleItem = async (completion: ChecklistItemCompletion) => {
    if (!activeInstance) return;
    try {
      await api.post('/checklists/items/complete', {
        instanceId: activeInstance.id,
        itemId: completion.itemId,
        completed: !completion.completed,
      });
      // Reload instance
      const res = await api.get(`/checklists/instances/${activeInstance.id}`);
      setActiveInstance(res.data);
      // Also refresh the checklist list for the employee
      const emp = employees.find((e) => e.userId === activeInstance.userId);
      if (emp) loadChecklists(emp.id, emp.userId);
    } catch (err) {
      console.error('Error toggling item:', err);
    }
  };

  const openEditItemDialog = (completion: ChecklistItemCompletion) => {
    setEditCompletion(completion);
    setEditValue({
      text: completion.textValue || '',
      number: completion.numberValue ?? undefined,
      date: completion.dateValue ? completion.dateValue.split('T')[0] : '',
      comment: completion.comment || '',
    });
    setEditItemDialog(true);
  };

  const handleSaveItemEdit = async () => {
    if (!activeInstance || !editCompletion) return;
    try {
      await api.post('/checklists/items/complete', {
        instanceId: activeInstance.id,
        itemId: editCompletion.itemId,
        completed: true,
        textValue: editValue.text || undefined,
        numberValue: editValue.number ?? undefined,
        dateValue: editValue.date ? new Date(editValue.date).toISOString() : undefined,
        comment: editValue.comment || undefined,
      });
      setEditItemDialog(false);
      const res = await api.get(`/checklists/instances/${activeInstance.id}`);
      setActiveInstance(res.data);
      const emp = employees.find((e) => e.userId === activeInstance.userId);
      if (emp) loadChecklists(emp.id, emp.userId);
    } catch (err) {
      console.error('Error saving item:', err);
    }
  };

  const handleDeleteChecklist = async (instanceId: string, employeeId: string, userId?: string) => {
    if (!window.confirm('Checkliste wirklich vom Mitarbeiter entfernen?')) return;
    try {
      await api.delete(`/checklists/instances/${instanceId}`);
      await loadChecklists(employeeId, userId);
      onUpdate?.();
    } catch (err: any) {
      console.error('Error deleting checklist instance:', err);
      setError('Fehler beim Entfernen der Checkliste');
    }
  };

  const handleAssignChecklist = async () => {
    const emp = employees.find((e) => e.id === selectedEmployeeId);
    if (!emp?.userId) {
      setError('Mitarbeiter hat kein verknüpftes Benutzerkonto');
      setChecklistDialogOpen(false);
      return;
    }
    try {
      await api.post('/checklists/instances', {
        templateId: selectedTemplateId,
        userId: emp.userId,
        assignedToId: checklistAssignedToId || undefined,
        targetEndDate: checklistTargetDate ? new Date(checklistTargetDate).toISOString() : undefined,
        notes: checklistNotes || undefined,
      });
      setChecklistDialogOpen(false);
      await loadChecklists(selectedEmployeeId, emp.userId);
      onUpdate?.();
    } catch (err: any) {
      console.error('Error assigning checklist:', err);
      setError('Fehler beim Zuweisen der Checkliste');
    }
  };

  const handleStatusChange = async (taskId: string, employeeId: string, status: OnboardingTaskStatus) => {
    try {
      await onboardingService.updateTaskStatus(taskId, status);
      await loadTasks(employeeId);
      onUpdate?.();
    } catch (err) {
      console.error('Error updating task status:', err);
    }
  };

  const getProgress = (employee: Employee) => {
    const tasks = employee.tasks || employeeTasks[employee.id] || [];
    if (tasks.length === 0) return 0;
    const completed = tasks.filter((t) => t.status === OnboardingTaskStatus.COMPLETED).length;
    return Math.round((completed / tasks.length) * 100);
  };

  const getTaskCount = (employee: Employee) => {
    return employee._count?.tasks ?? employee.tasks?.length ?? 0;
  };

  if (loading) {
    return (
      <Box sx={{ p: 2 }}>
        <LinearProgress />
        <Typography sx={{ mt: 1 }}>Lade Mitarbeiter...</Typography>
      </Box>
    );
  }

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h5">Mitarbeiter-Verwaltung</Typography>
        <Tooltip title="Aktualisieren">
          <IconButton onClick={loadData}>
            <Refresh />
          </IconButton>
        </Tooltip>
      </Box>

      {error && (
        <Alert severity="error" onClose={() => setError(null)} sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {employees.length === 0 ? (
        <Alert severity="info">
          Keine Mitarbeiter vorhanden. Mitarbeiter werden automatisch erstellt, wenn ein Bewerber akzeptiert wird.
        </Alert>
      ) : (
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell width={40} />
                <TableCell>Name</TableCell>
                <TableCell>Email</TableCell>
                <TableCell>Abteilung</TableCell>
                <TableCell>Position</TableCell>
                <TableCell>Aufgaben</TableCell>
                <TableCell>Fortschritt</TableCell>
                <TableCell>Aktionen</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {employees.map((emp) => (
                <React.Fragment key={emp.id}>
                  <TableRow
                    hover
                    sx={{ cursor: 'pointer' }}
                    onClick={() => toggleExpand(emp.id, emp.userId)}
                  >
                    <TableCell>
                      <IconButton size="small">
                        {expandedEmployee === emp.id ? <ExpandLess /> : <ExpandMore />}
                      </IconButton>
                    </TableCell>
                    <TableCell>
                      <Typography fontWeight="bold">
                        {emp.firstName} {emp.lastName}
                      </Typography>
                    </TableCell>
                    <TableCell>{emp.email}</TableCell>
                    <TableCell>{emp.department || '–'}</TableCell>
                    <TableCell>{emp.position || '–'}</TableCell>
                    <TableCell>
                      <Chip
                        label={getTaskCount(emp)}
                        size="small"
                        color={getTaskCount(emp) > 0 ? 'primary' : 'default'}
                      />
                    </TableCell>
                    <TableCell sx={{ minWidth: 120 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <LinearProgress
                          variant="determinate"
                          value={getProgress(emp)}
                          sx={{ flex: 1, height: 8, borderRadius: 4 }}
                        />
                        <Typography variant="caption">{getProgress(emp)}%</Typography>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Tooltip title="Aufgabe hinzufügen">
                        <IconButton
                          size="small"
                          color="primary"
                          onClick={(e) => {
                            e.stopPropagation();
                            openTaskDialog(emp.id);
                          }}
                        >
                          <Add />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Checkliste zuweisen">
                        <IconButton
                          size="small"
                          color="secondary"
                          onClick={(e) => {
                            e.stopPropagation();
                            openChecklistDialog(emp.id);
                          }}
                        >
                          <PlaylistAddCheck />
                        </IconButton>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell colSpan={8} sx={{ p: 0, borderBottom: expandedEmployee === emp.id ? undefined : 'none' }}>
                      <Collapse in={expandedEmployee === emp.id} timeout="auto" unmountOnExit>
                        <Box sx={{ p: 2, bgcolor: 'action.hover' }}>
                          <Tabs
                            value={expandedTab[emp.id] || 'tasks'}
                            onChange={(_, v) => setExpandedTab((prev) => ({ ...prev, [emp.id]: v }))}
                            sx={{ mb: 2, minHeight: 36 }}
                          >
                            <Tab label="Aufgaben" value="tasks" sx={{ minHeight: 36, py: 0 }} />
                            <Tab label="Checklisten" value="checklists" sx={{ minHeight: 36, py: 0 }} />
                          </Tabs>

                          {(expandedTab[emp.id] || 'tasks') === 'tasks' && (
                            <>
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                            <Typography variant="subtitle2">
                              Aufgaben für {emp.firstName} {emp.lastName}
                            </Typography>
                            <Button
                              size="small"
                              startIcon={<Add />}
                              onClick={() => openTaskDialog(emp.id)}
                            >
                              Aufgabe hinzufügen
                            </Button>
                          </Box>
                          {(!employeeTasks[emp.id] || employeeTasks[emp.id].length === 0) ? (
                            <Typography variant="body2" color="textSecondary">
                              Keine Aufgaben vorhanden.
                            </Typography>
                          ) : (
                            <Table size="small">
                              <TableHead>
                                <TableRow>
                                  <TableCell>Aufgabe</TableCell>
                                  <TableCell>Kategorie</TableCell>
                                  <TableCell>Zugewiesen an</TableCell>
                                  <TableCell>Fällig</TableCell>
                                  <TableCell>Status</TableCell>
                                  <TableCell>Aktionen</TableCell>
                                </TableRow>
                              </TableHead>
                              <TableBody>
                                {employeeTasks[emp.id].map((task) => (
                                  <TableRow key={task.id}>
                                    <TableCell>
                                      <Typography variant="body2" fontWeight="bold">{task.title}</Typography>
                                      {task.description && (
                                        <Typography variant="caption" color="textSecondary">
                                          {task.description}
                                        </Typography>
                                      )}
                                    </TableCell>
                                    <TableCell>
                                      <Chip
                                        label={categoryLabels[task.category] || task.category}
                                        size="small"
                                        variant="outlined"
                                      />
                                    </TableCell>
                                    <TableCell>
                                      {task.assignedTo
                                        ? `${task.assignedTo.firstName} ${task.assignedTo.lastName}`
                                        : '–'}
                                    </TableCell>
                                    <TableCell>
                                      {task.dueDate
                                        ? new Date(task.dueDate).toLocaleDateString('de-CH')
                                        : '–'}
                                    </TableCell>
                                    <TableCell>
                                      <Chip
                                        label={statusLabels[task.status]}
                                        size="small"
                                        color={statusColors[task.status]}
                                      />
                                    </TableCell>
                                    <TableCell>
                                      {task.status === OnboardingTaskStatus.NOT_STARTED && (
                                        <Tooltip title="Starten">
                                          <IconButton
                                            size="small"
                                            color="primary"
                                            onClick={() => handleStatusChange(task.id, emp.id, OnboardingTaskStatus.IN_PROGRESS)}
                                          >
                                            <PlayArrow />
                                          </IconButton>
                                        </Tooltip>
                                      )}
                                      {(task.status === OnboardingTaskStatus.IN_PROGRESS || task.status === OnboardingTaskStatus.OVERDUE) && (
                                        <Tooltip title="Abschliessen">
                                          <IconButton
                                            size="small"
                                            color="success"
                                            onClick={() => handleStatusChange(task.id, emp.id, OnboardingTaskStatus.COMPLETED)}
                                          >
                                            <CheckCircle />
                                          </IconButton>
                                        </Tooltip>
                                      )}
                                    </TableCell>
                                  </TableRow>
                                ))}
                              </TableBody>
                            </Table>
                          )}
                            </>
                          )}

                          {(expandedTab[emp.id]) === 'checklists' && (
                            <>
                              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                                <Typography variant="subtitle2">
                                  Checklisten für {emp.firstName} {emp.lastName}
                                </Typography>
                                <Button
                                  size="small"
                                  startIcon={<PlaylistAddCheck />}
                                  onClick={() => openChecklistDialog(emp.id)}
                                >
                                  Checkliste zuweisen
                                </Button>
                              </Box>
                              {(!employeeChecklists[emp.id] || employeeChecklists[emp.id].length === 0) ? (
                                <Typography variant="body2" color="textSecondary">
                                  Keine Checklisten zugewiesen.
                                </Typography>
                              ) : (
                                <Table size="small">
                                  <TableHead>
                                    <TableRow>
                                      <TableCell>Checkliste</TableCell>
                                      <TableCell>Typ</TableCell>
                                      <TableCell>Zuständig</TableCell>
                                      <TableCell>Fortschritt</TableCell>
                                      <TableCell>Status</TableCell>
                                      <TableCell>Fällig bis</TableCell>
                                      <TableCell>Aktionen</TableCell>
                                    </TableRow>
                                  </TableHead>
                                  <TableBody>
                                    {employeeChecklists[emp.id].map((cl) => (
                                      <TableRow key={cl.id} hover sx={{ cursor: 'pointer' }} onClick={() => openProcessDialog(cl.id)}>
                                        <TableCell>
                                          <Typography variant="body2" fontWeight="bold">
                                            {cl.template?.name || '–'}
                                          </Typography>
                                        </TableCell>
                                        <TableCell>
                                          <Chip
                                            label={cl.template?.type || '–'}
                                            size="small"
                                            variant="outlined"
                                          />
                                        </TableCell>
                                        <TableCell>
                                          {cl.assignedTo
                                            ? `${cl.assignedTo.firstName} ${cl.assignedTo.lastName}`
                                            : '–'}
                                        </TableCell>
                                        <TableCell sx={{ minWidth: 120 }}>
                                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                            <LinearProgress
                                              variant="determinate"
                                              value={cl.progressPercent}
                                              sx={{ flex: 1, height: 6, borderRadius: 3 }}
                                            />
                                            <Typography variant="caption">
                                              {cl.completedItems}/{cl.totalItems}
                                            </Typography>
                                          </Box>
                                        </TableCell>
                                        <TableCell>
                                          <Chip
                                            label={cl.status === 'COMPLETED' ? 'Abgeschlossen' : cl.status === 'IN_PROGRESS' ? 'In Bearbeitung' : cl.status === 'OVERDUE' ? 'Überfällig' : 'Nicht gestartet'}
                                            size="small"
                                            color={cl.status === 'COMPLETED' ? 'success' : cl.status === 'OVERDUE' ? 'error' : cl.status === 'IN_PROGRESS' ? 'primary' : 'default'}
                                          />
                                        </TableCell>
                                        <TableCell>
                                          {cl.targetEndDate
                                            ? new Date(cl.targetEndDate).toLocaleDateString('de-CH')
                                            : '–'}
                                        </TableCell>
                                        <TableCell>
                                          <Tooltip title="Checkliste abarbeiten">
                                            <IconButton
                                              size="small"
                                              color="primary"
                                              onClick={(e) => { e.stopPropagation(); openProcessDialog(cl.id); }}
                                            >
                                              <OpenInNew />
                                            </IconButton>
                                          </Tooltip>
                                          <Tooltip title="Checkliste entfernen">
                                            <IconButton
                                              size="small"
                                              color="error"
                                              onClick={(e) => { e.stopPropagation(); handleDeleteChecklist(cl.id, emp.id, emp.userId); }}
                                            >
                                              <Delete />
                                            </IconButton>
                                          </Tooltip>
                                        </TableCell>
                                      </TableRow>
                                    ))}
                                  </TableBody>
                                </Table>
                              )}
                            </>
                          )}
                        </Box>
                      </Collapse>
                    </TableCell>
                  </TableRow>
                </React.Fragment>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {/* Create Task Dialog */}
      <Dialog open={taskDialogOpen} onClose={() => setTaskDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Neue Aufgabe erstellen</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
            <TextField
              label="Titel"
              value={taskForm.title}
              onChange={(e) => setTaskForm({ ...taskForm, title: e.target.value })}
              required
              fullWidth
            />
            <TextField
              label="Beschreibung"
              value={taskForm.description}
              onChange={(e) => setTaskForm({ ...taskForm, description: e.target.value })}
              multiline
              rows={3}
              fullWidth
            />
            <FormControl fullWidth>
              <InputLabel>Kategorie</InputLabel>
              <Select
                value={taskForm.category}
                label="Kategorie"
                onChange={(e) => setTaskForm({ ...taskForm, category: e.target.value })}
              >
                {TASK_CATEGORIES.map((cat) => (
                  <MenuItem key={cat} value={cat}>
                    {categoryLabels[cat] || cat}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <Autocomplete
              options={users}
              getOptionLabel={(user) => `${user.firstName} ${user.lastName} (${user.email})`}
              value={users.find((u) => u.id === taskForm.assignedToId) || null}
              onChange={(_, newValue) => setTaskForm({ ...taskForm, assignedToId: newValue?.id || '' })}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Zugewiesen an (optional)"
                  helperText="Wer soll diese Aufgabe bearbeiten?"
                />
              )}
            />
            <TextField
              label="Fälligkeitsdatum"
              type="date"
              value={taskForm.dueDate}
              onChange={(e) => setTaskForm({ ...taskForm, dueDate: e.target.value })}
              InputLabelProps={{ shrink: true }}
              fullWidth
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setTaskDialogOpen(false)}>Abbrechen</Button>
          <Button
            variant="contained"
            onClick={handleCreateTask}
            disabled={!taskForm.title.trim() || !taskForm.category}
          >
            Erstellen
          </Button>
        </DialogActions>
      </Dialog>

      {/* Assign Checklist Dialog */}
      <Dialog open={checklistDialogOpen} onClose={() => setChecklistDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Checkliste zuweisen</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
            <Autocomplete
              options={checklistTemplates}
              getOptionLabel={(t) => `${t.name}${t.type ? ` (${t.type})` : ''}${t._count?.items ? ` – ${t._count.items} Punkte` : ''}`}
              value={checklistTemplates.find((t) => t.id === selectedTemplateId) || null}
              onChange={(_, newValue) => setSelectedTemplateId(newValue?.id || '')}
              renderInput={(params) => (
                <TextField {...params} label="Checklisten-Vorlage" required />
              )}
            />
            <Autocomplete
              options={users}
              getOptionLabel={(u) => `${u.firstName} ${u.lastName} (${u.email})`}
              value={users.find((u) => u.id === checklistAssignedToId) || null}
              onChange={(_, newValue) => setChecklistAssignedToId(newValue?.id || '')}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Zuständig – wer führt aus? (optional)"
                  helperText="Z.B. die HR-Person, die diese Checkliste abarbeitet"
                />
              )}
            />
            <TextField
              label="Fälligkeitsdatum (optional)"
              type="date"
              value={checklistTargetDate}
              onChange={(e) => setChecklistTargetDate(e.target.value)}
              InputLabelProps={{ shrink: true }}
              fullWidth
            />
            <TextField
              label="Notizen (optional)"
              value={checklistNotes}
              onChange={(e) => setChecklistNotes(e.target.value)}
              multiline
              rows={2}
              fullWidth
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setChecklistDialogOpen(false)}>Abbrechen</Button>
          <Button
            variant="contained"
            onClick={handleAssignChecklist}
            disabled={!selectedTemplateId}
          >
            Zuweisen
          </Button>
        </DialogActions>
      </Dialog>

      {/* Process Checklist Dialog */}
      <Dialog
        open={processDialogOpen}
        onClose={() => setProcessDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        {activeInstanceLoading ? (
          <DialogContent>
            <LinearProgress />
            <Typography sx={{ mt: 1 }}>Lade Checkliste...</Typography>
          </DialogContent>
        ) : activeInstance ? (
          <>
            <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Box>
                <Typography variant="h6">{activeInstance.template?.name}</Typography>
                <Typography variant="body2" color="textSecondary">
                  {activeInstance.user?.firstName} {activeInstance.user?.lastName}
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Chip
                  label={`${activeInstance.completedItems}/${activeInstance.totalItems} (${activeInstance.progressPercent}%)`}
                  color={activeInstance.progressPercent === 100 ? 'success' : 'primary'}
                  size="small"
                />
                <IconButton onClick={() => setProcessDialogOpen(false)}>
                  <Close />
                </IconButton>
              </Box>
            </DialogTitle>
            <DialogContent dividers>
              <LinearProgress
                variant="determinate"
                value={activeInstance.progressPercent}
                sx={{ mb: 2, height: 8, borderRadius: 4 }}
              />
              <List disablePadding>
                {activeInstance.completions
                  ?.sort((a, b) => (a.item?.order ?? 0) - (b.item?.order ?? 0))
                  .map((completion, index) => (
                  <React.Fragment key={completion.id}>
                    {index > 0 && <Divider />}
                    <ListItem
                      secondaryAction={
                        <Box sx={{ display: 'flex', gap: 0.5, alignItems: 'center' }}>
                          {completion.completed && <CheckCircle color="success" fontSize="small" />}
                          {completion.item?.itemType !== ChecklistItemType.CHECKBOX && (
                            <Tooltip title="Bearbeiten & Abschliessen">
                              <IconButton size="small" onClick={() => openEditItemDialog(completion)}>
                                <Edit fontSize="small" />
                              </IconButton>
                            </Tooltip>
                          )}
                        </Box>
                      }
                    >
                      {completion.item?.itemType === ChecklistItemType.CHECKBOX && (
                        <Checkbox
                          checked={completion.completed}
                          onChange={() => handleToggleItem(completion)}
                          sx={{ mr: 1 }}
                        />
                      )}
                      <ListItemText
                        primary={
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Typography
                              variant="body1"
                              sx={{ textDecoration: completion.completed ? 'line-through' : 'none', opacity: completion.completed ? 0.7 : 1 }}
                            >
                              {completion.item?.title}
                            </Typography>
                            {completion.item?.required && (
                              <Chip label="Pflicht" size="small" color="error" variant="outlined" />
                            )}
                            {completion.item?.assignedRole && (
                              <Chip label={completion.item.assignedRole} size="small" variant="outlined" />
                            )}
                          </Box>
                        }
                        secondary={
                          <Box>
                            {completion.item?.description && (
                              <Typography variant="body2" color="textSecondary" sx={{ mt: 0.5 }}>
                                {completion.item.description}
                              </Typography>
                            )}
                            {completion.textValue && (
                              <Typography variant="body2" sx={{ mt: 0.5 }}>
                                Wert: {completion.textValue}
                              </Typography>
                            )}
                            {completion.numberValue != null && (
                              <Typography variant="body2" sx={{ mt: 0.5 }}>
                                Wert: {completion.numberValue}
                              </Typography>
                            )}
                            {completion.dateValue && (
                              <Typography variant="body2" sx={{ mt: 0.5 }}>
                                Datum: {new Date(completion.dateValue).toLocaleDateString('de-CH')}
                              </Typography>
                            )}
                            {completion.comment && (
                              <Typography variant="body2" color="textSecondary" fontStyle="italic" sx={{ mt: 0.5 }}>
                                Kommentar: {completion.comment}
                              </Typography>
                            )}
                            {completion.completedAt && (
                              <Typography variant="caption" color="textSecondary">
                                Abgeschlossen am {new Date(completion.completedAt).toLocaleString('de-CH')}
                                {completion.completedBy && ` von ${completion.completedBy.firstName} ${completion.completedBy.lastName}`}
                              </Typography>
                            )}
                          </Box>
                        }
                      />
                    </ListItem>
                  </React.Fragment>
                ))}
              </List>
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setProcessDialogOpen(false)}>Schliessen</Button>
            </DialogActions>
          </>
        ) : null}
      </Dialog>

      {/* Edit Checklist Item Dialog */}
      <Dialog open={editItemDialog} onClose={() => setEditItemDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Aufgabe bearbeiten</DialogTitle>
        <DialogContent>
          {editCompletion && (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
              <Typography variant="subtitle1" fontWeight="bold">
                {editCompletion.item?.title}
              </Typography>
              {editCompletion.item?.description && (
                <Typography variant="body2" color="textSecondary">
                  {editCompletion.item.description}
                </Typography>
              )}

              {editCompletion.item?.itemType === ChecklistItemType.TEXT && (
                <TextField
                  fullWidth
                  label="Text"
                  multiline
                  rows={3}
                  value={editValue.text || ''}
                  onChange={(e) => setEditValue({ ...editValue, text: e.target.value })}
                />
              )}
              {editCompletion.item?.itemType === ChecklistItemType.NUMBER && (
                <TextField
                  fullWidth
                  label="Zahl"
                  type="number"
                  value={editValue.number ?? ''}
                  onChange={(e) => setEditValue({ ...editValue, number: parseFloat(e.target.value) })}
                />
              )}
              {editCompletion.item?.itemType === ChecklistItemType.DATE && (
                <TextField
                  fullWidth
                  label="Datum"
                  type="date"
                  value={editValue.date || ''}
                  onChange={(e) => setEditValue({ ...editValue, date: e.target.value })}
                  InputLabelProps={{ shrink: true }}
                />
              )}

              <TextField
                fullWidth
                label="Kommentar (optional)"
                multiline
                rows={2}
                value={editValue.comment || ''}
                onChange={(e) => setEditValue({ ...editValue, comment: e.target.value })}
              />
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditItemDialog(false)}>Abbrechen</Button>
          <Button variant="contained" onClick={handleSaveItemEdit}>
            Speichern & Abschliessen
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default OnboardingEmployeesSubTab;
