import React, { useState, useEffect } from 'react';
import api from '../../services/api';

interface VersionInfo {
  version: string;
  build: number;
  display: string;
}

interface SystemStats {
  users: { total: number; active: number };
  projects: { total: number; active: number };
  timeEntries: { total: number; today: number; currentlyClockedIn: number };
  invoices: { total: number };
  orders: { total: number };
  incidents: { total: number; open: number };
  documents: { total: number };
  messages: { total: number; unread: number };
  actions: { last30Days: number; today: number };
  modules: { total: number };
  userGroups: { total: number };
}

interface InformationenTabProps {
  onUpdate?: () => void;
}

const StatCard: React.FC<{ label: string; value: number | string; sub?: string; color?: string; icon?: string }> = ({ label, value, sub, color = 'var(--primary-color, #1976d2)', icon }) => (
  <div style={{
    background: 'var(--card-bg, #fff)',
    border: '1px solid var(--border-color, #e0e0e0)',
    borderRadius: '12px',
    padding: '1.25rem',
    boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
    display: 'flex',
    alignItems: 'center',
    gap: '1rem'
  }}>
    {icon && <div style={{ fontSize: '2rem', opacity: 0.8 }}>{icon}</div>}
    <div>
      <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary, #666)', marginBottom: '0.25rem' }}>{label}</div>
      <div style={{ fontSize: '1.6rem', fontWeight: 700, color }}>{value}</div>
      {sub && <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary, #888)', marginTop: '0.15rem' }}>{sub}</div>}
    </div>
  </div>
);

const InformationenTab: React.FC<InformationenTabProps> = () => {
  const [versionInfo, setVersionInfo] = useState<VersionInfo | null>(null);
  const [stats, setStats] = useState<SystemStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [versionRes, statsRes] = await Promise.all([
          api.get('/version'),
          api.get('/system-stats').catch(() => null)
        ]);
        setVersionInfo(versionRes.data);
        if (statsRes) setStats(statsRes.data);
      } catch {
        setVersionInfo({ version: '0.0.0', build: 0, display: 'Nicht verfügbar' });
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center' }}>
        <p>Lade Informationen...</p>
      </div>
    );
  }

  return (
    <div style={{ padding: '1rem' }}>
      <h2 style={{ marginBottom: '1.5rem' }}>ℹ️ Systeminformationen</h2>

      {/* Version Cards */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
        gap: '1rem',
        marginBottom: '2rem'
      }}>
        <StatCard icon="🏷️" label="Version" value={versionInfo?.version || '-'} />
        <StatCard icon="🔨" label="Build" value={versionInfo?.build || 0} />
        <StatCard icon="📋" label="Vollständig" value={versionInfo?.display || '-'} color="#333" />
      </div>

      {/* Statistics */}
      {stats && (
        <>
          <h3 style={{ marginBottom: '1rem', fontSize: '1.1rem' }}>📊 Systemstatistiken</h3>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
            gap: '1rem',
            marginBottom: '2rem'
          }}>
            <StatCard icon="👥" label="Benutzer" value={stats.users.active} sub={`${stats.users.total} gesamt, ${stats.users.active} aktiv`} color="#1976d2" />
            <StatCard icon="👔" label="Benutzergruppen" value={stats.userGroups.total} color="#7b1fa2" />
            <StatCard icon="📁" label="Projekte" value={stats.projects.active} sub={`${stats.projects.total} gesamt, ${stats.projects.active} aktiv`} color="#388e3c" />
            <StatCard icon="⏱️" label="Zeiteinträge heute" value={stats.timeEntries.today} sub={`${stats.timeEntries.total.toLocaleString()} gesamt`} color="#f57c00" />
            <StatCard icon="🟢" label="Aktuell eingestempelt" value={stats.timeEntries.currentlyClockedIn} color="#2e7d32" />
            <StatCard icon="📄" label="Rechnungen" value={stats.invoices.total} color="#0288d1" />
            <StatCard icon="🛒" label="Bestellungen" value={stats.orders.total} color="#5d4037" />
            <StatCard icon="⚠️" label="Vorfälle" value={stats.incidents.open} sub={`${stats.incidents.total} gesamt, ${stats.incidents.open} offen`} color={stats.incidents.open > 0 ? '#d32f2f' : '#388e3c'} />
            <StatCard icon="📑" label="Dokumente" value={stats.documents.total} color="#455a64" />
            <StatCard icon="✉️" label="Nachrichten" value={stats.messages.total} sub={`${stats.messages.unread} ungelesen`} color="#6a1b9a" />
            <StatCard icon="📈" label="Aktionen heute" value={stats.actions.today} sub={`${stats.actions.last30Days.toLocaleString()} letzte 30 Tage`} color="#00796b" />
            <StatCard icon="🧩" label="Module" value={stats.modules.total} color="#c62828" />
          </div>
        </>
      )}

      {/* System Info Table */}
      <div style={{
        background: 'var(--card-bg, #fff)',
        border: '1px solid var(--border-color, #e0e0e0)',
        borderRadius: '12px',
        padding: '1.5rem',
        boxShadow: '0 2px 8px rgba(0,0,0,0.06)'
      }}>
        <h3 style={{ marginBottom: '1rem', fontSize: '1.1rem' }}>Systemdetails</h3>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <tbody>
            <tr style={{ borderBottom: '1px solid var(--border-color, #e0e0e0)' }}>
              <td style={{ padding: '0.75rem 1rem', fontWeight: 600, width: '200px', color: 'var(--text-secondary, #666)' }}>
                Anwendung
              </td>
              <td style={{ padding: '0.75rem 1rem' }}>cflux</td>
            </tr>
            <tr style={{ borderBottom: '1px solid var(--border-color, #e0e0e0)' }}>
              <td style={{ padding: '0.75rem 1rem', fontWeight: 600, color: 'var(--text-secondary, #666)' }}>
                Version
              </td>
              <td style={{ padding: '0.75rem 1rem' }}>{versionInfo?.version}</td>
            </tr>
            <tr style={{ borderBottom: '1px solid var(--border-color, #e0e0e0)' }}>
              <td style={{ padding: '0.75rem 1rem', fontWeight: 600, color: 'var(--text-secondary, #666)' }}>
                Build-Nummer
              </td>
              <td style={{ padding: '0.75rem 1rem' }}>{versionInfo?.build}</td>
            </tr>
            <tr>
              <td style={{ padding: '0.75rem 1rem', fontWeight: 600, color: 'var(--text-secondary, #666)' }}>
                Versionierung
              </td>
              <td style={{ padding: '0.75rem 1rem' }}>Major.Minor.Patchlevel Build-Nummer</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default InformationenTab;
