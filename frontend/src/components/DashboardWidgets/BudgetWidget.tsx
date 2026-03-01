import React, { useState, useEffect } from 'react';
import { AlertTriangle, DollarSign } from 'lucide-react';
import api from '../../services/api';
import WidgetHeader from './WidgetHeader';
import { useCurrency } from '../../contexts/CurrencyContext';
import './DashboardWidgets.css';

interface ProjectBudgetData {
  id: string;
  name: string;
  budget: {
    totalBudget: number;
    actualCosts: number;
    remainingBudget: number;
    utilization: number;
    status: string;
  };
}

interface BudgetWidgetProps {
  onRemove: () => void;
}

const BudgetWidget: React.FC<BudgetWidgetProps> = ({ onRemove }) => {
  const { currency } = useCurrency();
  const [projects, setProjects] = useState<ProjectBudgetData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadBudgetData();
  }, []);

  const loadBudgetData = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await api.get('/project-reports/overview');
      
      // Filter projects with budget and sort by utilization
      const projectsWithBudget = response.data.projects
        .filter((p: any) => p.budget)
        .sort((a: any, b: any) => (b.budget?.utilization || 0) - (a.budget?.utilization || 0))
        .slice(0, 8); // Top 8 projects
      
      setProjects(projectsWithBudget);
    } catch (err) {
      console.error('Error loading budget data:', err);
      setError('Fehler beim Laden der Budget-Daten');
    } finally {
      setIsLoading(false);
    }
  };

  const getUtilizationColor = (utilization: number) => {
    if (utilization > 90) return '#dc3545'; // Red
    if (utilization > 75) return '#ffc107'; // Yellow
    return '#28a745'; // Green
  };

  const getUtilizationStatus = (utilization: number) => {
    if (utilization > 100) return 'Überschritten';
    if (utilization > 90) return 'Kritisch';
    if (utilization > 75) return 'Warnung';
    return 'Normal';
  };

  return (
    <>
      <WidgetHeader 
        title="Budget-Auslastung" 
        icon="💰"
        onRemove={onRemove}
      />
      
      <div className="widget-content budget-widget-content">
        {isLoading ? (
          <div className="widget-loading">
            <div className="spinner" />
            <p>Lade Budget-Daten...</p>
          </div>
        ) : error ? (
          <div className="widget-error">
            <AlertTriangle size={32} />
            <p>{error}</p>
          </div>
        ) : projects.length === 0 ? (
          <div className="widget-empty">
            <DollarSign size={48} />
            <p>Keine Projekte mit Budget gefunden</p>
          </div>
        ) : (
          <div className="budget-list">
            {projects.map((project) => (
              <div key={project.id} className="budget-item">
                <div className="budget-item-header">
                  <span className="budget-project-name" title={project.name}>
                    {project.name.length > 25 ? project.name.substring(0, 25) + '...' : project.name}
                  </span>
                  <span 
                    className={`budget-status ${
                      project.budget.utilization > 100 ? 'status-danger' :
                      project.budget.utilization > 90 ? 'status-critical' :
                      project.budget.utilization > 75 ? 'status-warning' : 'status-ok'
                    }`}
                  >
                    {getUtilizationStatus(project.budget.utilization)}
                  </span>
                </div>
                
                <div className="budget-bar-container">
                  <div 
                    className="budget-bar-fill" 
                    style={{ 
                      width: `${Math.min(project.budget.utilization, 100)}%`,
                      backgroundColor: getUtilizationColor(project.budget.utilization)
                    }}
                  />
                  <span className="budget-bar-text">
                    {project.budget.utilization.toFixed(1)}%
                  </span>
                </div>
                
                <div className="budget-amounts">
                  <div className="budget-amount">
                    <span className="budget-label">Budget:</span>
                    <span className="budget-value">
                      {currency} {project.budget.totalBudget.toLocaleString('de-CH', { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                  <div className="budget-amount">
                    <span className="budget-label">Kosten:</span>
                    <span className="budget-value">
                      {currency} {project.budget.actualCosts.toLocaleString('de-CH', { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                  <div className="budget-amount">
                    <span className="budget-label">Rest:</span>
                    <span className={`budget-value ${project.budget.remainingBudget < 0 ? 'negative' : ''}`}>
                      {currency} {project.budget.remainingBudget.toLocaleString('de-CH', { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
};

export default BudgetWidget;
