import React from 'react';
import WidgetHeader from './WidgetHeader';
import { Report } from '../../types';
import './DashboardWidgets.css';

interface SummaryWidgetProps {
  report: Report | null;
  onShowPDFReport: () => void;
}

const SummaryWidget: React.FC<SummaryWidgetProps> = ({ report, onShowPDFReport }) => {
  if (!report) {
    return (
      <div className="dashboard-widget">
        <WidgetHeader title="Zusammenfassung" icon="📈" />
        <div className="widget-content">
          <div className="widget-loading">Laden...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard-widget">
      <WidgetHeader 
        title="Zusammenfassung" 
        icon="📈"
        actions={
          <button className="btn btn-primary btn-small" onClick={onShowPDFReport}>
            PDF Report
          </button>
        }
      />
      <div className="widget-content">
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '15px' }}>
          <div className="stat-card">
            <div className="stat-label">Stunden (Monat)</div>
            <div className="stat-value">{report.totalHours.toFixed(2)}h</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">Arbeitstage</div>
            <div className="stat-value">{report.totalDays}</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">Einträge</div>
            <div className="stat-value">{report.entries}</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SummaryWidget;
