import React, { useState, useEffect } from 'react';
import { Gantt, Task, ViewMode } from 'gantt-task-react';
import 'gantt-task-react/dist/index.css';
import { projectService } from '../services/project.service';
import { Project } from '../types';
import AppNavbar from '../components/AppNavbar';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import './ProjectPlanningPage.css';

interface GanttTask extends Omit<Task, 'project'> {
  projectId: string;
  project?: Project;
  taskId?: string; // For project tasks
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

type ViewType = 'projects' | 'tasks';

const ProjectPlanningPage: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [projectTasks, setProjectTasks] = useState<ProjectTask[]>([]);
  const [tasks, setTasks] = useState<GanttTask[]>([]);
  const [viewType, setViewType] = useState<ViewType>('projects');
  const [viewMode, setViewMode] = useState<ViewMode>(ViewMode.Month);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [currentTime, setCurrentTime] = useState<string>(new Date().toLocaleTimeString('de-DE'));
  const [editingTask, setEditingTask] = useState<ProjectTask | null>(null);
  const [showTaskModal, setShowTaskModal] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date().toLocaleTimeString('de-DE'));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    loadProjects();
  }, []);

  useEffect(() => {
    if (viewType === 'projects') {
      convertProjectsToTasks(projects);
    } else if (viewType === 'tasks' && selectedProject) {
      loadProjectTasks(selectedProject.id);
    }
  }, [viewType, selectedProject]);

  const loadProjects = async () => {
    try {
      setIsLoading(true);
      const projectsData = await projectService.getAllProjects();
      setProjects(projectsData);
      if (projectsData.length > 0) {
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

  const convertTasksToGantt = (tasksData: ProjectTask[]) => {
    const ganttTasks: GanttTask[] = tasksData.map((task) => {
      const startDate = task.startDate ? new Date(task.startDate) : new Date();
      const endDate = task.endDate ? new Date(task.endDate) : new Date(startDate.getTime() + 7 * 24 * 60 * 60 * 1000); // Default: 7 days

      if (endDate <= startDate) {
        endDate.setTime(startDate.getTime() + 24 * 60 * 60 * 1000);
      }

      // Map dependencies
      const dependencies = task.dependencies?.map(dep => dep.dependsOnTask.id) || [];

      return {
        id: task.id,
        projectId: task.projectId,
        taskId: task.id,
        name: task.assignedTo 
          ? `${task.name} (${task.assignedTo.firstName} ${task.assignedTo.lastName})`
          : task.name,
        start: startDate,
        end: endDate,
        progress: task.progress || 0,
        type: 'task' as const,
        dependencies,
        styles: {
          backgroundColor: getTaskColor(task.status),
          backgroundSelectedColor: getTaskColor(task.status, true),
          progressColor: getTaskProgressColor(task.status),
          progressSelectedColor: getTaskProgressColor(task.status, true),
        },
      };
    });

    setTasks(ganttTasks);
  };

  const getTaskColor = (status: string, selected: boolean = false): string => {
    const colors: Record<string, string> = {
      TODO: selected ? '#6b7280' : '#9ca3af',
      IN_PROGRESS: selected ? '#2563eb' : '#3b82f6',
      COMPLETED: selected ? '#059669' : '#10b981',
      BLOCKED: selected ? '#dc2626' : '#ef4444',
    };
    return colors[status] || (selected ? '#6b7280' : '#9ca3af');
  };

  const getTaskProgressColor = (status: string, selected: boolean = false): string => {
    const colors: Record<string, string> = {
      TODO: selected ? '#4b5563' : '#6b7280',
      IN_PROGRESS: selected ? '#1e40af' : '#2563eb',
      COMPLETED: selected ? '#047857' : '#059669',
      BLOCKED: selected ? '#b91c1c' : '#dc2626',
    };
    return colors[status] || (selected ? '#4b5563' : '#6b7280');
  };

  const convertProjectsToTasks = (projectsData: Project[]) => {
    const ganttTasks: GanttTask[] = projectsData.map((project) => {
      const startDate = project.startDate ? new Date(project.startDate) : new Date();
      const endDate = project.endDate ? new Date(project.endDate) : new Date(startDate.getTime() + 30 * 24 * 60 * 60 * 1000); // Default: 30 Tage

      // Ensure end date is after start date
      if (endDate <= startDate) {
        endDate.setTime(startDate.getTime() + 24 * 60 * 60 * 1000); // At least 1 day duration
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

      if (viewType === 'projects') {
        const project = projects.find(p => p.id === ganttTask.projectId);
        
        if (!project) {
          console.error('Project not found:', ganttTask.projectId);
          setIsSaving(false);
          return;
        }

        // Optimistically update local state
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

        // Update project dates - ensure this always executes
        console.log('Updating project:', project.id, {
          startDate: task.start.toISOString(),
          endDate: task.end.toISOString(),
          progress: task.progress,
        });
        
        const result = await projectService.updateProject(project.id, {
          startDate: task.start.toISOString(),
          endDate: task.end.toISOString(),
          progress: task.progress,
        });
        
        console.log('Project update result:', result);
      } else if (viewType === 'tasks' && ganttTask.taskId) {
        // Update project task
        const response = await fetch(`/api/project-tasks/${ganttTask.taskId}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${localStorage.getItem('token')}`,
          },
          body: JSON.stringify({
            startDate: task.start.toISOString(),
            endDate: task.end.toISOString(),
            progress: task.progress,
          }),
        });

        if (!response.ok) throw new Error('Failed to update task');

        // Update local state
        setTasks(prevTasks => 
          prevTasks.map(t => 
            t.id === task.id 
              ? { ...t, start: task.start, end: task.end, progress: task.progress }
              : t
          )
        );

        setProjectTasks(prevTasks =>
          prevTasks.map(t =>
            t.id === ganttTask.taskId
              ? { ...t, startDate: task.start.toISOString(), endDate: task.end.toISOString(), progress: task.progress }
              : t
          )
        );
      }
      
      setIsSaving(false);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 2000);
    } catch (error) {
      console.error('Error updating task:', error);
      setIsSaving(false);
      alert('Fehler beim Aktualisieren');
      // Reload
      if (viewType === 'projects') {
        await loadProjects();
      } else if (selectedProject) {
        await loadProjectTasks(selectedProject.id);
      }
    }
  };

  const handleTaskDelete = async (task: Task) => {
    const ganttTask = task as GanttTask;
    const confirmDelete = window.confirm(`Möchten Sie das Projekt "${task.name}" wirklich löschen?`);
    
    if (confirmDelete) {
      try {
        await projectService.deleteProject(ganttTask.projectId);
        await loadProjects();
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
      
      if (viewType === 'projects') {
        // Optimistically update local state
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

        // Update in background
        await projectService.updateProject(ganttTask.projectId, {
          progress: task.progress,
        });
      } else if (viewType === 'tasks' && ganttTask.taskId) {
        // Update project task progress
        const response = await fetch(`/api/project-tasks/${ganttTask.taskId}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${localStorage.getItem('token')}`,
          },
          body: JSON.stringify({
            progress: task.progress,
          }),
        });

        if (!response.ok) throw new Error('Failed to update task progress');

        setTasks(prevTasks => 
          prevTasks.map(t => 
            t.id === task.id 
              ? { ...t, progress: task.progress }
              : t
          )
        );

        setProjectTasks(prevTasks =>
          prevTasks.map(t =>
            t.id === ganttTask.taskId
              ? { ...t, progress: task.progress }
              : t
          )
        );
      }
      
      setIsSaving(false);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 2000);
    } catch (error) {
      console.error('Error updating progress:', error);
      setIsSaving(false);
      alert('Fehler beim Aktualisieren des Fortschritts');
      if (viewType === 'projects') {
        await loadProjects();
      } else if (selectedProject) {
        await loadProjectTasks(selectedProject.id);
      }
    }
  };

  const handleTaskDoubleClick = (task: Task) => {
    const ganttTask = task as GanttTask;
    
    if (viewType === 'tasks' && ganttTask.taskId) {
      const projectTask = projectTasks.find(t => t.id === ganttTask.taskId);
      if (projectTask) {
        setEditingTask(projectTask);
        setShowTaskModal(true);
      }
    } else if (viewType === 'projects') {
      // Navigate to project detail page
      navigate(`/projects/${ganttTask.projectId}`);
    }
  };

  const handleSaveTask = async (updatedTask: ProjectTask) => {
    try {
      const response = await fetch(`/api/project-tasks/${updatedTask.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify(updatedTask),
      });

      if (!response.ok) throw new Error('Failed to update task');

      // Reload tasks
      if (selectedProject) {
        await loadProjectTasks(selectedProject.id);
      }
      
      setShowTaskModal(false);
      setEditingTask(null);
    } catch (error) {
      console.error('Error saving task:', error);
      alert('Fehler beim Speichern der Aufgabe');
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const getStatusLabel = (status: string): string => {
    const labels: Record<string, string> = {
      ACTIVE: 'Aktiv',
      COMPLETED: 'Abgeschlossen',
      ON_HOLD: 'Pausiert',
      CANCELLED: 'Abgebrochen',
    };
    return labels[status] || status;
  };

  return (
    <div className="project-planning-page">
      <AppNavbar 
        title="Projektplanung - Gantt-Chart"
        currentTime={currentTime}
        onLogout={handleLogout}
        showLogo={true}
      />

      <div className="planning-container">
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
        
        {/* DEBUG: Test if this renders */}
        <h1 style={{color: 'red', fontSize: '48px', background: 'yellow', padding: '20px'}}>
          🚨 TEST - WENN DU DAS SIEHST, RENDERT REACT HIER! 🚨
        </h1>
        
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
              {projects.map(project => (
                <option key={project.id} value={project.id}>
                  {project.name}
                </option>
              ))}
            </select>
            <button 
              className="btn-new-task"
              onClick={() => {/* TODO: Open task creation modal */}}
              disabled={!selectedProject}
            >
              + Neue Aufgabe
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
                  <span>To Do</span>
                </div>
                <div className="legend-item">
                  <span className="legend-color" style={{ backgroundColor: '#3b82f6' }}></span>
                  <span>In Bearbeitung</span>
                </div>
                <div className="legend-item">
                  <span className="legend-color" style={{ backgroundColor: '#10b981' }}></span>
                  <span>Abgeschlossen</span>
                </div>
                <div className="legend-item">
                  <span className="legend-color" style={{ backgroundColor: '#ef4444' }}></span>
                  <span>Blockiert</span>
                </div>
              </>
            )}
          </div>

          <button className="btn-refresh" onClick={viewType === 'projects' ? loadProjects : () => selectedProject && loadProjectTasks(selectedProject.id)}>
            🔄 Aktualisieren
          </button>
        </div>

        {isLoading ? (
          <div className="loading-state">
            <div className="spinner"></div>
            <p>Lade {viewType === 'projects' ? 'Projekte' : 'Aufgaben'}...</p>
          </div>
        ) : tasks.length === 0 ? (
          <div className="empty-state">
            <p>Keine {viewType === 'projects' ? 'Projekte' : 'Aufgaben'} vorhanden</p>
            {viewType === 'projects' && (
              <button onClick={() => navigate('/projects')}>Projekt erstellen</button>
            )}
          </div>
        ) : (
          <div className="gantt-wrapper">
            <Gantt
              tasks={tasks as Task[]}
              viewMode={viewMode}
              onDateChange={handleTaskChange}
              onDelete={viewType === 'projects' ? handleTaskDelete : undefined}
              onProgressChange={handleProgressChange}
              onDoubleClick={handleTaskDoubleClick}
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
      </div>

      <div className="planning-info">
        <p>💡 <strong>Tipp:</strong> Ziehen Sie {viewType === 'projects' ? 'Projektbalken' : 'Aufgabenbalken'}, um Start-/Enddaten zu ändern. Änderungen werden automatisch gespeichert.</p>
        <p>📊 Der Fortschrittsbalken kann durch Ziehen angepasst werden (0-100%).</p>
        {viewType === 'projects' && (
          <p>🗑️ Klicken Sie auf das Papierkorb-Symbol, um ein Projekt zu löschen.</p>
        )}
        {viewType === 'tasks' && (
          <>
            <p>🔗 Abhängigkeiten zwischen Aufgaben werden durch Pfeile visualisiert.</p>
            <p>✏️ Doppelklicken Sie auf eine Aufgabe, um sie zu bearbeiten.</p>
          </>
        )}
      </div>

      {/* Task Edit Modal */}
      {showTaskModal && editingTask && (
        <div className="modal-overlay" onClick={() => setShowTaskModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Aufgabe bearbeiten</h2>
              <button className="modal-close" onClick={() => setShowTaskModal(false)}>×</button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label>Name:</label>
                <input
                  type="text"
                  value={editingTask.name}
                  onChange={(e) => setEditingTask({ ...editingTask, name: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label>Beschreibung:</label>
                <textarea
                  value={editingTask.description || ''}
                  onChange={(e) => setEditingTask({ ...editingTask, description: e.target.value })}
                  rows={4}
                />
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Status:</label>
                  <select
                    value={editingTask.status}
                    onChange={(e) => setEditingTask({ ...editingTask, status: e.target.value })}
                  >
                    <option value="TODO">To Do</option>
                    <option value="IN_PROGRESS">In Bearbeitung</option>
                    <option value="COMPLETED">Abgeschlossen</option>
                    <option value="BLOCKED">Blockiert</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Priorität:</label>
                  <select
                    value={editingTask.priority}
                    onChange={(e) => setEditingTask({ ...editingTask, priority: e.target.value })}
                  >
                    <option value="LOW">Niedrig</option>
                    <option value="MEDIUM">Mittel</option>
                    <option value="HIGH">Hoch</option>
                    <option value="CRITICAL">Kritisch</option>
                  </select>
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Startdatum:</label>
                  <input
                    type="date"
                    value={editingTask.startDate ? editingTask.startDate.split('T')[0] : ''}
                    onChange={(e) => setEditingTask({ ...editingTask, startDate: e.target.value ? new Date(e.target.value).toISOString() : undefined })}
                  />
                </div>
                <div className="form-group">
                  <label>Enddatum:</label>
                  <input
                    type="date"
                    value={editingTask.endDate ? editingTask.endDate.split('T')[0] : ''}
                    onChange={(e) => setEditingTask({ ...editingTask, endDate: e.target.value ? new Date(e.target.value).toISOString() : undefined })}
                  />
                </div>
              </div>
              <div className="form-group">
                <label>Fortschritt: {editingTask.progress}%</label>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={editingTask.progress}
                  onChange={(e) => setEditingTask({ ...editingTask, progress: parseInt(e.target.value) })}
                />
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn-cancel" onClick={() => setShowTaskModal(false)}>
                Abbrechen
              </button>
              <button className="btn-save" onClick={() => handleSaveTask(editingTask)}>
                Speichern
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProjectPlanningPage;
