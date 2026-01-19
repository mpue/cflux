import React, { useState, useEffect } from 'react';
import WidgetHeader from './WidgetHeader';
import './DashboardWidgets.css';

interface ClockWidgetProps {
  onRemove?: () => void;
}

const ClockWidget: React.FC<ClockWidgetProps> = ({ onRemove }) => {
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('de-DE', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('de-DE', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const getGreeting = () => {
    const hour = currentTime.getHours();
    if (hour < 12) return 'Guten Morgen';
    if (hour < 18) return 'Guten Tag';
    return 'Guten Abend';
  };

  return (
    <div className="dashboard-widget">
      <WidgetHeader title="Uhr" icon="🕐" onRemove={onRemove} />
      <div className="widget-content clock-widget-content">
        <div className="clock-greeting">{getGreeting()}</div>
        <div className="clock-time">{formatTime(currentTime)}</div>
        <div className="clock-date">{formatDate(currentTime)}</div>
        <div className="clock-week">
          Kalenderwoche {getWeekNumber(currentTime)}
        </div>
      </div>
    </div>
  );
};

// Helper function to get ISO week number
const getWeekNumber = (date: Date): number => {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
};

export default ClockWidget;
