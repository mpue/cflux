import React, { useState, useEffect, useCallback } from 'react';
import ReactDOM from 'react-dom';
import api from '../../services/api';
import WidgetHeader from './WidgetHeader';
import './EHSPyramidWidget.css';

interface PyramidData {
  fatalities: number;
  ltis: number;
  recordables: number;
  firstAids: number;
  nearMisses: number;
  unsafeBehaviors: number;
  unsafeConditions: number;
  propertyDamages: number;
  environmentIncidents: number;
  safetyObservations: number;
}

interface PyramidConfig {
  year?: number;
  month?: number;
}

interface Props {
  widgetId: string;
  config?: Record<string, any>;
  onRemove: () => void;
  onConfigChange: (config: Record<string, any>) => void;
}

const LEVELS: { key: keyof PyramidData; label: string; color: string }[] = [
  { key: 'fatalities',          label: 'Todesfälle',              color: '#991b1b' },
  { key: 'ltis',                label: 'LTI',                     color: '#dc2626' },
  { key: 'recordables',         label: 'Meldepflichtig',          color: '#ea580c' },
  { key: 'firstAids',           label: 'Erste Hilfe',             color: '#f59e0b' },
  { key: 'nearMisses',          label: 'Beinahe-Unfälle',         color: '#eab308' },
  { key: 'unsafeBehaviors',     label: 'Unsicheres Verhalten',    color: '#84cc16' },
  { key: 'unsafeConditions',    label: 'Unsichere Zustände',      color: '#22c55e' },
  { key: 'propertyDamages',     label: 'Sachschäden',             color: '#14b8a6' },
  { key: 'environmentIncidents',label: 'Umweltvorfälle',          color: '#06b6d4' },
  { key: 'safetyObservations',  label: 'Sicherheitsbeob.',        color: '#3b82f6' },
];

// Each level is 9% wider than the previous, starting at 10%
const widths = LEVELS.map((_, i) => 10 + i * 9);  // 10,19,28,...,91

const MONTH_NAMES = [
  'Januar','Februar','März','April','Mai','Juni',
  'Juli','August','September','Oktober','November','Dezember',
];

interface SettingsProps {
  config: PyramidConfig;
  onSave: (c: PyramidConfig) => void;
  onClose: () => void;
}

const SettingsModal: React.FC<SettingsProps> = ({ config, onSave, onClose }) => {
  const now = new Date();
  const [year,  setYear]  = useState(config.year  ?? now.getFullYear());
  const [month, setMonth] = useState(config.month ?? now.getMonth() + 1);
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content ehspyr-modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2>EHS Pyramide – Einstellungen</h2>
          <button className="modal-close-btn" onClick={onClose}>x</button>
        </div>
        <div className="modal-body" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: 14 }}>
          <label style={{ display: 'flex', flexDirection: 'column', gap: 6, fontSize: '0.85rem', fontWeight: 600, color: '#6b7280' }}>
            Jahr
            <select value={year} onChange={e => setYear(+e.target.value)}
              style={{ padding: '8px 10px', borderRadius: 8, border: '1.5px solid #e5e7eb', fontSize: '0.9rem' }}>
              {[now.getFullYear()-2, now.getFullYear()-1, now.getFullYear()].map(y =>
                <option key={y} value={y}>{y}</option>
              )}
            </select>
          </label>
          <label style={{ display: 'flex', flexDirection: 'column', gap: 6, fontSize: '0.85rem', fontWeight: 600, color: '#6b7280' }}>
            Monat
            <select value={month} onChange={e => setMonth(+e.target.value)}
              style={{ padding: '8px 10px', borderRadius: 8, border: '1.5px solid #e5e7eb', fontSize: '0.9rem' }}>
              {MONTH_NAMES.map((m, i) => <option key={i+1} value={i+1}>{m}</option>)}
            </select>
          </label>
        </div>
        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={onClose}>Abbrechen</button>
          <button className="btn btn-primary" onClick={() => onSave({ year, month })}>Speichern</button>
        </div>
      </div>
    </div>
  );
};

const EHSPyramidWidget: React.FC<Props> = ({ widgetId, config, onRemove, onConfigChange }) => {
  const now = new Date();
  const cfg: PyramidConfig = {
    year:  config?.year  ?? now.getFullYear(),
    month: config?.month ?? now.getMonth() + 1,
  };

  const [pyramid,      setPyramid]      = useState<PyramidData | null>(null);
  const [isLoading,    setIsLoading]    = useState(true);
  const [error,        setError]        = useState<string | null>(null);
  const [showSettings, setShowSettings] = useState(false);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const { data } = await api.get('/ehs/dashboard', {
        params: { year: cfg.year, month: cfg.month },
      });
      setPyramid(data.pyramid ?? null);
    } catch {
      setError('Fehler beim Laden der EHS-Daten');
    } finally {
      setIsLoading(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cfg.year, cfg.month]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const period = `${String(cfg.month).padStart(2, '0')}/${cfg.year}`;
  const total  = pyramid ? LEVELS.reduce((s, l) => s + (pyramid[l.key] ?? 0), 0) : 0;

  return (
    <div className="dashboard-widget">
      <WidgetHeader
        title={`EHS Pyramide ${period}`}
        icon="▲"
        onSettings={() => setShowSettings(true)}
        onRemove={onRemove}
      />
      <div className="widget-content ehspyr-content">
        {isLoading && (
          <div className="widget-loading"><div className="spinner" /><p>Lade...</p></div>
        )}
        {!isLoading && error && (
          <div className="widget-error">
            <span>{error}</span>
            <button className="btn btn-sm btn-secondary" style={{ marginTop: 8 }} onClick={fetchData}>Wiederholen</button>
          </div>
        )}
        {!isLoading && !error && pyramid && (
          <div className="ehspyr-wrap">
            <div className="ehspyr-total">Gesamt: <strong>{total}</strong></div>
            <div className="ehspyr-pyramid">
              {LEVELS.map((lvl, i) => {
                const count = pyramid[lvl.key] ?? 0;
                return (
                  <div
                    key={lvl.key}
                    className="ehspyr-level"
                    style={{
                      width: `${widths[i]}%`,
                      background: lvl.color,
                    }}
                    title={`${lvl.label}: ${count}`}
                  >
                    <span className="ehspyr-label">{lvl.label}</span>
                    <span className="ehspyr-count">{count}</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
      {showSettings && ReactDOM.createPortal(
        <SettingsModal
          config={cfg}
          onSave={c => { onConfigChange(c); setShowSettings(false); }}
          onClose={() => setShowSettings(false)}
        />,
        document.body,
      )}
    </div>
  );
};

export default EHSPyramidWidget;
