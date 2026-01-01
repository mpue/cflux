import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useModules } from '../contexts/ModuleContext';
import { getUnreadCount } from '../services/message.service';

interface AppNavbarProps {
  title?: string;
  currentTime?: string;
  onLogout?: () => void;
  showLogo?: boolean;
  logoSrc?: string;
  onPdfReport?: () => void;
}

const AppNavbar: React.FC<AppNavbarProps> = ({ 
  title = 'Zeiterfassung',
  currentTime,
  onLogout,
  showLogo = false,
  logoSrc,
  onPdfReport
}) => {
  const { user, logout } = useAuth();
  const { modules } = useModules();
  const navigate = useNavigate();
  const [unreadMessagesCount, setUnreadMessagesCount] = useState<number>(0);
  const [displayTime, setDisplayTime] = useState<string>(new Date().toLocaleTimeString('de-DE'));

  useEffect(() => {
    loadUnreadCount();
    const timer = setInterval(() => {
      setDisplayTime(new Date().toLocaleTimeString('de-DE'));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const loadUnreadCount = async () => {
    try {
      const count = await getUnreadCount();
      setUnreadMessagesCount(count);
    } catch (error) {
      console.error('Error loading unread count:', error);
    }
  };

  const handleLogout = () => {
    if (onLogout) {
      onLogout();
    } else {
      logout();
      navigate('/login');
    }
  };

  return (
    <nav className="navbar">
      {showLogo && logoSrc ? (
        <div className="navbar-left">
          <img src={logoSrc} alt="CFlux" className="navbar-logo" />
          <h1>{title}</h1>
        </div>
      ) : (
        <h1>{title}</h1>
      )}
      <div className="navbar-right">
        <span style={{ fontWeight: 'bold', fontSize: '16px' }}>
          {currentTime || displayTime}
        </span>
        <span>{user?.firstName} {user?.lastName}</span>
        {onPdfReport && (
          <button className="btn btn-success" onClick={onPdfReport}>
            PDF-Bericht
          </button>
        )}
        <button className="btn btn-primary" onClick={() => navigate('/my-approvals')}>
          🔔 Genehmigungen
        </button>
        <button className="btn btn-primary" onClick={() => navigate('/messages')}>
          📨 Nachrichten {unreadMessagesCount > 0 && (
            <span style={{
              background: '#dc3545',
              padding: '2px 6px',
              borderRadius: '10px',
              fontSize: '12px',
              marginLeft: '4px'
            }}>
              {unreadMessagesCount}
            </span>
          )}
        </button>
        <button className="btn btn-secondary" onClick={() => navigate('/travel-expenses')}>
          💰 Reisekosten
        </button>
        <button className="btn btn-secondary" onClick={() => navigate('/incidents')}>
          Incidents
        </button>
        <button className="btn btn-secondary" onClick={() => navigate('/dashboard')}>
          🏠 Dashboard
        </button>
        {(user?.role === 'ADMIN' || modules.length > 0) && (
          <button className="btn btn-secondary" onClick={() => navigate('/admin')}>
            {user?.role === 'ADMIN' ? 'Admin Panel' : 'Verwaltung'}
          </button>
        )}
        <button className="btn btn-secondary" onClick={handleLogout}>
          Abmelden
        </button>
      </div>
    </nav>
  );
};

export default AppNavbar;
