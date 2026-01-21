import React, { useState, useEffect } from 'react';
import { Gantt, Task, ViewMode } from 'gantt-task-react';
import 'gantt-task-react/dist/index.css';
import { projectService } from '../../services/project.service';
import { Project } from '../../types';
import './ProjectPlanningTab.css';

interface GanttTask extends Omit<Task, 'project'> {
  projectId: string;
  project?: Project;
}

interface ProjectPlanningTabProps {
  onUpdate?: () => void;
}

const ProjectPlanningTab: React.FC<ProjectPlanningTabProps> = ({ onUpdate }) => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [tasks, setTasks] = useState<GanttTask[]>([]);
  const [viewMode, setViewMode] = useState<ViewMode>(ViewMode.Month);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  useEffect(() => {
    loadProjects();
  }, []);

  const loadProjects = async () => {
    try {
      setIsLoading(true);
      const projectsData = await projectService.getAllProjects();
      setProjects(projectsData);
      convertProjectsToTasks(projectsData);
    } catch (error) {
      console.error('Error loading projects:', error);
      alert('Fehler beim Laden der Projekte');
    } finally {
      setIsLoading(false);
    }
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
        </div>

        <button className="btn-refresh" onClick={loadProjects}>
          🔄 Aktualisieren
        </button>
      </div>

      {isLoading ? (
        <div className="loading-state">
          <div className="spinner"></div>
          <p>Lade Projekte...</p>
        </div>
      ) : tasks.length === 0 ? (
        <div className="empty-state">
          <p>Keine Projekte vorhanden</p>
          <p className="hint">Erstellen Sie zuerst Projekte im Tab "Projekte"</p>
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
        <p>💡 <strong>Tipp:</strong> Ziehen Sie Projektbalken, um Start-/Enddaten zu ändern. Änderungen werden automatisch gespeichert.</p>
        <p>📊 Der Fortschrittsbalken kann durch Ziehen angepasst werden (0-100%).</p>
        <p>🗑️ Klicken Sie auf das Papierkorb-Symbol, um ein Projekt zu löschen.</p>
      </div>
    </div>
  );
};

export default ProjectPlanningTab;
