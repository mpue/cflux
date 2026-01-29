import React, { useState, useEffect } from 'react';
import { Gantt, Task, ViewMode } from 'gantt-task-react';
import 'gantt-task-react/dist/index.css';
import { projectService } from '../../services/project.service';
import { Project } from '../../types';
import './ProjectPlanningTab.css';

interface GanttTask extends Omit<Task, 'project'> {
  projectId: string;
  project?: Project;
  taskId?: string;
}

interface ProjectTask {
  id: string;
  projectId: string;
  name: string;
  description?: string;
  status: string;
  priority: string;
  startDate?: string;
  endDate?: string;
  estimatedHours?: number;
  actualHours?: number;
  progress: number;
  assignedToId?: string;
  assignedTo?: {
    id: string;
    firstName: string;
    lastName: string;
  };
  dependencies?: {
    dependsOnTask: {
      id: string;
      name: string;
      status: string;
      startDate?: string;
      endDate?: string;
    };
  }[];
}

interface ProjectPlanningTabProps {
  onUpdate?: () => void;
}

type ViewType = 'projects' | 'tasks';

const ProjectPlanningTab: React.FC<ProjectPlanningTabProps> = ({ onUpdate }) => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [tasks, setTasks] = useState<GanttTask[]>([]);
  const [projectTasks, setProjectTasks] = useState<ProjectTask[]>([]);
  const [viewType, setViewType] = useState<ViewType>('projects');
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>(ViewMode.Month);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [showTaskDialog, setShowTaskDialog] = useState(false);
  const [newTask, setNewTask] = useState({
    name: '',
    description: '',
    status: 'TODO',
    priority: 'MEDIUM',
    startDate: new Date().toISOString().split('T')[0],
    endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    estimatedHours: 0,
  });

  useEffect(() => {
    loadProjects();
  }, []);

  useEffect(() => {
    if (viewType === 'projects') {
      convertProjectsToTasks(projects);
    } else if (viewType === 'tasks' && selectedProject) {
      loadProjectTasks(selectedProject.id);
    } else if (viewType === 'tasks' && !selectedProject && projects.length > 0) {
      setSelectedProject(projects[0]);
    }
  }, [viewType, selectedProject]);

  const loadProjects = async () => {
    try {
      setIsLoading(true);
      const projectsData = await projectService.getAllProjects();
      setProjects(projectsData);
      if (projectsData.length > 0 && !selectedProject) {
        setSelectedProject(projectsData[0]);
      }
      convertProjectsToTasks(projectsData);
    } catch (error) {
      console.error('Error loading projects:', error);
      alert('Fehler beim Laden der Projekte');
    } finally {
      setIsLoading(false);
    }
  };

  const loadProjectTasks = async (projectId: string) => {
    try {
      setIsLoading(true);
      const response = await fetch(`/api/project-tasks/project/${projectId}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
      });
      
      if (!response.ok) throw new Error('Failed to load tasks');
      
      const tasksData: ProjectTask[] = await response.json();
      setProjectTasks(tasksData);
      convertTasksToGantt(tasksData);
    } catch (error) {
      console.error('Error loading project tasks:', error);
      alert('Fehler beim Laden der Aufgaben');
    } finally {
      setIsLoading(false);
    }
  };

  const createTask = async () => {
    if (!selectedProject) {
      alert('Bitte wählen Sie zuerst ein Projekt aus');
      return;
    }

    if (!newTask.name.trim()) {
      alert('Bitte geben Sie einen Aufgaben-Namen ein');
      return;
    }

    try {
      setIsSaving(true);
      const response = await fetch('/api/project-tasks', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({
          projectId: selectedProject.id,
          name: newTask.name,
          description: newTask.description || undefined,
          status: newTask.status,
          priority: newTask.priority,
          startDate: newTask.startDate ? new Date(newTask.startDate).toISOString() : undefined,
          endDate: newTask.endDate ? new Date(newTask.endDate).toISOString() : undefined,
          estimatedHours: newTask.estimatedHours || 0,
          progress: 0,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        throw new Error(errorData.error || 'Failed to create task');
      }

      setShowTaskDialog(false);
      setNewTask({
        name: '',
        description: '',
        status: 'TODO',
        priority: 'MEDIUM',
        startDate: new Date().toISOString().split('T')[0],
        endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        estimatedHours: 0,
      });
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 2000);
      await loadProjectTasks(selectedProject.id);
      if (onUpdate) onUpdate();
    } catch (error) {
      console.error('Error creating task:', error);
      alert('Fehler beim Erstellen der Aufgabe');
    } finally {
      setIsSaving(false);
    }
  };

  const convertTasksToGantt = (tasksData: ProjectTask[]) => {
    const ganttTasks: GanttTask[] = tasksData.map((task) => {
      const startDate = task.startDate ? new Date(task.startDate) : new Date();
      const endDate = task.endDate ? new Date(task.endDate) : new Date(startDate.getTime() + 7 * 24 * 60 * 60 * 1000);

      if (endDate <= startDate) {
        endDate.setTime(startDate.getTime() + 24 * 60 * 60 * 1000);
      }

      return {
        id: task.id,
        projectId: task.projectId,
        taskId: task.id,
        name: task.name,
        start: startDate,
        end: endDate,
        progress: task.progress || 0,
        type: 'task' as const,
        styles: {
          backgroundColor: getTaskColor(task.status),
          backgroundSelectedColor: getTaskColor(task.status, true),
          progressColor: getTaskProgressColor(task.priority),
          progressSelectedColor: getTaskProgressColor(task.priority, true),
        },
        dependencies: task.dependencies?.map(dep => dep.dependsOnTask.id) || [],
      };
    });

    setTasks(ganttTasks);
  };

  const getTaskColor = (status: string, selected: boolean = false): string => {
    const colors: Record<string, string> = {
      TODO: selected ? '#6b7280' : '#9ca3af',
      IN_PROGRESS: selected ? '#2563eb' : '#3b82f6',
      IN_REVIEW: selected ? '#d97706' : '#f59e0b',
      DONE: selected ? '#059669' : '#10b981',
      BLOCKED: selected ? '#dc2626' : '#ef4444',
    };
    return colors[status] || (selected ? '#6b7280' : '#9ca3af');
  };

  const getTaskProgressColor = (priority: string, selected: boolean = false): string => {
    const colors: Record<string, string> = {
      LOW: selected ? '#6b7280' : '#9ca3af',
      MEDIUM: selected ? '#2563eb' : '#3b82f6',
      HIGH: selected ? '#d97706' : '#f59e0b',
      URGENT: selected ? '#dc2626' : '#ef4444',
    };
    return colors[priority] || (selected ? '#6b7280' : '#9ca3af');
  };

  const convertProjectsToTasks = (projectsData: Project[]) => {
    const ganttTasks: GanttTask[] = projectsData.map((project) => {
      const startDate = project.startDate ? new Date(project.startDate) : new Date();
      const endDate = project.endDate ? new Date(project.endDate) : new Date(startDate.getTime() + 30 * 24 * 60 * 60 * 1000);

      if (endDate <= startDate) {
        endDate.setTime(startDate.getTime() + 24 * 60 * 60 * 1000);
      }

      return {
        id: project.id,
        projectId: project.id,
        name: project.name,
        start: startDate,
        end: endDate,
        progress: project.progress || 0,
        type: 'task' as const,
        project: project,
        styles: {
          backgroundColor: getProjectColor(project.status || 'PLANNING'),
          backgroundSelectedColor: getProjectColor(project.status || 'PLANNING', true),
          progressColor: getProgressColor(project.status || 'PLANNING'),
          progressSelectedColor: getProgressColor(project.status || 'PLANNING', true),
        },
      };
    });

    setTasks(ganttTasks);
  };

  const getProjectColor = (status: string, selected: boolean = false): string => {
    const colors: Record<string, string> = {
      ACTIVE: selected ? '#2563eb' : '#3b82f6',
      COMPLETED: selected ? '#059669' : '#10b981',
      ON_HOLD: selected ? '#d97706' : '#f59e0b',
      CANCELLED: selected ? '#dc2626' : '#ef4444',
    };
    return colors[status] || (selected ? '#6b7280' : '#9ca3af');
  };

  const getProgressColor = (status: string, selected: boolean = false): string => {
    const colors: Record<string, string> = {
      ACTIVE: selected ? '#1e40af' : '#2563eb',
      COMPLETED: selected ? '#047857' : '#059669',
      ON_HOLD: selected ? '#b45309' : '#d97706',
      CANCELLED: selected ? '#b91c1c' : '#dc2626',
    };
    return colors[status] || (selected ? '#4b5563' : '#6b7280');
  };

  const handleTaskChange = async (task: Task) => {
    try {
      setIsSaving(true);
      const ganttTask = task as GanttTask;
      const project = projects.find(p => p.id === ganttTask.projectId);
      
      if (!project) {
        setIsSaving(false);
        return;
      }

      setTasks(prevTasks => 
        prevTasks.map(t => 
          t.id === task.id 
            ? { ...t, start: task.start, end: task.end, progress: task.progress }
            : t
        )
      );

      setProjects(prevProjects =>
        prevProjects.map(p =>
          p.id === ganttTask.projectId
            ? { ...p, startDate: task.start.toISOString(), endDate: task.end.toISOString(), progress: task.progress }
            : p
        )
      );

      await projectService.updateProject(project.id, {
        startDate: task.start.toISOString(),
        endDate: task.end.toISOString(),
        progress: task.progress,
      });
      
      setIsSaving(false);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 2000);
      
      if (onUpdate) onUpdate();
    } catch (error) {
      console.error('Error updating project:', error);
      setIsSaving(false);
      alert('Fehler beim Aktualisieren des Projekts');
      await loadProjects();
    }
  };

  const handleTaskDelete = async (task: Task) => {
    const ganttTask = task as GanttTask;
    const confirmDelete = window.confirm(`Möchten Sie das Projekt "${task.name}" wirklich löschen?`);
    
    if (confirmDelete) {
      try {
        await projectService.deleteProject(ganttTask.projectId);
        await loadProjects();
        if (onUpdate) onUpdate();
      } catch (error) {
        console.error('Error deleting project:', error);
        alert('Fehler beim Löschen des Projekts');
      }
    }
  };

  const handleProgressChange = async (task: Task) => {
    try {
      setIsSaving(true);
      const ganttTask = task as GanttTask;
      
      setTasks(prevTasks => 
        prevTasks.map(t => 
          t.id === task.id 
            ? { ...t, progress: task.progress }
            : t
        )
      );

      setProjects(prevProjects =>
        prevProjects.map(p =>
          p.id === ganttTask.projectId
            ? { ...p, progress: task.progress }
            : p
        )
      );

      await projectService.updateProject(ganttTask.projectId, {
        progress: task.progress,
      });
      
      setIsSaving(false);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 2000);
      
      if (onUpdate) onUpdate();
    } catch (error) {
      console.error('Error updating progress:', error);
      setIsSaving(false);
      alert('Fehler beim Aktualisieren des Fortschritts');
      await loadProjects();
    }
  };

  return (
    <div className="project-planning-tab">
      {isSaving && (
        <div className="saving-indicator">
          💾 Speichert...
        </div>
      )}
      
      {saveSuccess && (
        <div className="success-indicator">
          ✅ Gespeichert!
        </div>
      )}

      {/* Tab Switcher */}
      <div className="view-tabs">
        <button
          className={`tab-button ${viewType === 'projects' ? 'active' : ''}`}
          onClick={() => setViewType('projects')}
        >
          📁 Projekte
        </button>
        <button
          className={`tab-button ${viewType === 'tasks' ? 'active' : ''}`}
          onClick={() => setViewType('tasks')}
        >
          ✅ Aufgaben
        </button>
      </div>

      {/* Project selector for tasks view */}
      {viewType === 'tasks' && (
        <div className="project-selector">
          <label>Projekt:</label>
          <select
            value={selectedProject?.id || ''}
            onChange={(e) => {
              const project = projects.find(p => p.id === e.target.value);
              setSelectedProject(project || null);
            }}
          >
            <option value="">Projekt wählen...</option>
            {projects.map(project => (
              <option key={project.id} value={project.id}>
                {project.name}
              </option>
            ))}
          </select>
          <button 
            className="btn-add-task"
            onClick={() => setShowTaskDialog(true)}
            disabled={!selectedProject}
          >
            ➕ Neue Aufgabe
          </button>
        </div>
      )}

      <div className="planning-header">
        <div className="view-controls">
          <label>Ansicht:</label>
          <button
            className={viewMode === ViewMode.Day ? 'active' : ''}
            onClick={() => setViewMode(ViewMode.Day)}
          >
            Tag
          </button>
          <button
            className={viewMode === ViewMode.Week ? 'active' : ''}
            onClick={() => setViewMode(ViewMode.Week)}
          >
            Woche
          </button>
          <button
            className={viewMode === ViewMode.Month ? 'active' : ''}
            onClick={() => setViewMode(ViewMode.Month)}
          >
            Monat
          </button>
          <button
            className={viewMode === ViewMode.Year ? 'active' : ''}
            onClick={() => setViewMode(ViewMode.Year)}
          >
            Jahr
          </button>
        </div>

        <div className="legend">
          {viewType === 'projects' ? (
            <>
              <div className="legend-item">
                <span className="legend-color" style={{ backgroundColor: '#3b82f6' }}></span>
                <span>Aktiv</span>
              </div>
              <div className="legend-item">
                <span className="legend-color" style={{ backgroundColor: '#10b981' }}></span>
                <span>Abgeschlossen</span>
              </div>
              <div className="legend-item">
                <span className="legend-color" style={{ backgroundColor: '#f59e0b' }}></span>
                <span>Pausiert</span>
              </div>
              <div className="legend-item">
                <span className="legend-color" style={{ backgroundColor: '#ef4444' }}></span>
                <span>Abgebrochen</span>
              </div>
            </>
          ) : (
            <>
              <div className="legend-item">
                <span className="legend-color" style={{ backgroundColor: '#9ca3af' }}></span>
                <span>Todo</span>
              </div>
              <div className="legend-item">
                <span className="legend-color" style={{ backgroundColor: '#3b82f6' }}></span>
                <span>In Bearbeitung</span>
              </div>
              <div className="legend-item">
                <span className="legend-color" style={{ backgroundColor: '#f59e0b' }}></span>
                <span>Review</span>
              </div>
              <div className="legend-item">
                <span className="legend-color" style={{ backgroundColor: '#10b981' }}></span>
                <span>Erledigt</span>
              </div>
              <div className="legend-item">
                <span className="legend-color" style={{ backgroundColor: '#ef4444' }}></span>
                <span>Blockiert</span>
              </div>
            </>
          )}
        </div>

        <button className="btn-refresh" onClick={loadProjects}>
          🔄 Aktualisieren
        </button>
      </div>

      {isLoading ? (
        <div className="loading-state">
          <div className="spinner"></div>
          <p>{viewType === 'projects' ? 'Lade Projekte...' : 'Lade Aufgaben...'}</p>
        </div>
      ) : tasks.length === 0 ? (
        <div className="empty-state">
          {viewType === 'projects' ? (
            <>
              <p>Keine Projekte vorhanden</p>
              <p className="hint">Erstellen Sie zuerst Projekte im Tab "Projekte"</p>
            </>
          ) : (
            <>
              <p>Keine Aufgaben vorhanden</p>
              <p className="hint">Dieses Projekt hat noch keine Aufgaben. Erstellen Sie Aufgaben im Tab "Projekt-Aufgaben".</p>
            </>
          )}
        </div>
      ) : (
        <div className="gantt-wrapper">
          <Gantt
            tasks={tasks as Task[]}
            viewMode={viewMode}
            onDateChange={handleTaskChange}
            onDelete={handleTaskDelete}
            onProgressChange={handleProgressChange}
            locale="de"
            listCellWidth="200px"
            columnWidth={viewMode === ViewMode.Month ? 60 : undefined}
            todayColor="rgba(252, 165, 165, 0.3)"
            barBackgroundColor="#ddd"
            barBackgroundSelectedColor="#aaa"
            arrowColor="#999"
            fontSize="14px"
            headerHeight={50}
            rowHeight={50}
          />
        </div>
      )}

      <div className="planning-info">
        {viewType === 'projects' ? (
          <>
            <p>💡 <strong>Tipp:</strong> Ziehen Sie Projektbalken, um Start-/Enddaten zu ändern. Änderungen werden automatisch gespeichert.</p>
            <p>📊 Der Fortschrittsbalken kann durch Ziehen angepasst werden (0-100%).</p>
            <p>🗑️ Klicken Sie auf das Papierkorb-Symbol, um ein Projekt zu löschen.</p>
          </>
        ) : (
          <>
            <p>💡 <strong>Tipp:</strong> Ziehen Sie Aufgaben, um Start-/Enddaten zu ändern.</p>
            <p>📊 Der Fortschrittsbalken zeigt den Bearbeitungsstand der Aufgabe.</p>
            <p>🔗 Abhängigkeiten zwischen Aufgaben werden als Pfeile dargestellt.</p>
          </>
        )}
      </div>

      {/* New Task Dialog */}
      {showTaskDialog && (
        <div className="modal-overlay" onClick={() => setShowTaskDialog(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Neue Aufgabe erstellen</h2>
              <button className="close-button" onClick={() => setShowTaskDialog(false)}>✕</button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label>Aufgaben-Name *</label>
                <input
                  type="text"
                  value={newTask.name}
                  onChange={(e) => setNewTask({ ...newTask, name: e.target.value })}
                  placeholder="z.B. Backend API implementieren"
                  autoFocus
                />
              </div>

              <div className="form-group">
                <label>Beschreibung</label>
                <textarea
                  value={newTask.description}
                  onChange={(e) => setNewTask({ ...newTask, description: e.target.value })}
                  placeholder="Detaillierte Beschreibung der Aufgabe..."
                  rows={3}
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Status</label>
                  <select
                    value={newTask.status}
                    onChange={(e) => setNewTask({ ...newTask, status: e.target.value })}
                  >
                    <option value="TODO">Todo</option>
                    <option value="IN_PROGRESS">In Bearbeitung</option>
                    <option value="IN_REVIEW">Review</option>
                    <option value="DONE">Erledigt</option>
                    <option value="BLOCKED">Blockiert</option>
                  </select>
                </div>

                <div className="form-group">
                  <label>Priorität</label>
                  <select
                    value={newTask.priority}
                    onChange={(e) => setNewTask({ ...newTask, priority: e.target.value })}
                  >
                    <option value="LOW">Niedrig</option>
                    <option value="MEDIUM">Mittel</option>
                    <option value="HIGH">Hoch</option>
                    <option value="URGENT">Dringend</option>
                  </select>
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Startdatum</label>
                  <input
                    type="date"
                    value={newTask.startDate}
                    onChange={(e) => setNewTask({ ...newTask, startDate: e.target.value })}
                  />
                </div>

                <div className="form-group">
                  <label>Enddatum</label>
                  <input
                    type="date"
                    value={newTask.endDate}
                    onChange={(e) => setNewTask({ ...newTask, endDate: e.target.value })}
                  />
                </div>
              </div>

              <div className="form-group">
                <label>Geschätzte Stunden</label>
                <input
                  type="number"
                  value={newTask.estimatedHours}
                  onChange={(e) => setNewTask({ ...newTask, estimatedHours: Number(e.target.value) })}
                  min="0"
                  step="0.5"
                />
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn-cancel" onClick={() => setShowTaskDialog(false)}>
                Abbrechen
              </button>
              <button className="btn-primary" onClick={createTask} disabled={isSaving}>
                {isSaving ? 'Erstellt...' : 'Aufgabe erstellen'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProjectPlanningTab;
