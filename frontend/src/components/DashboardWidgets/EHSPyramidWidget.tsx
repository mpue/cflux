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

// SVG pyramid constants
const SVG_W = 400;
const SVG_H = 300;
const SVG_CX = SVG_W / 2;
const SVG_MIN_HW = 0;    // half-width at top edge (0 = pointed apex)
const SVG_MAX_HW = 194;  // half-width at bottom edge
const SVG_GAP = 2;       // px gap between levels
const SVG_LEVEL_H = (SVG_H - SVG_GAP * (LEVELS.length - 1)) / LEVELS.length;

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
            <svg
              className="ehspyr-svg"
              viewBox={`0 0 ${SVG_W} ${SVG_H}`}
              preserveAspectRatio="xMidYMid meet"
              aria-label="EHS Pyramide"
            >
              <defs>
                <linearGradient id="ehspyr-shine" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="white" stopOpacity={0.18} />
                  <stop offset="100%" stopColor="white" stopOpacity={0} />
                </linearGradient>
              </defs>
              {LEVELS.map((lvl, i) => {
                const count = pyramid[lvl.key] ?? 0;
                const n = LEVELS.length;
                const topY      = i * (SVG_LEVEL_H + SVG_GAP);
                const bottomY   = topY + SVG_LEVEL_H;
                const midY      = (topY + bottomY) / 2;
                const topHW     = SVG_MIN_HW + (SVG_MAX_HW - SVG_MIN_HW) * i / n;
                const bottomHW  = SVG_MIN_HW + (SVG_MAX_HW - SVG_MIN_HW) * (i + 1) / n;
                const midHW     = (topHW + bottomHW) / 2;
                const pts = [
                  `${SVG_CX - topHW},${topY}`,
                  `${SVG_CX + topHW},${topY}`,
                  `${SVG_CX + bottomHW},${bottomY}`,
                  `${SVG_CX - bottomHW},${bottomY}`,
                ].join(' ');
                const clipId  = `ehspyr-clip-${i}`;
                const hasLabel = midHW * 2 > 90;

                return (
                  <g key={lvl.key}>
                    <defs>
                      <clipPath id={clipId}>
                        <polygon points={pts} />
                      </clipPath>
                    </defs>
                    {/* Füllfarbe */}
                    <polygon points={pts} fill={lvl.color} />
                    {/* Glanz-Overlay */}
                    <polygon points={pts} fill="url(#ehspyr-shine)" />
                    {/* Beschriftung */}
                    <g clipPath={`url(#${clipId})`}>
                      {hasLabel ? (
                        <>
                          <text
                            x={SVG_CX - midHW + 8}
                            y={midY + 4}
                            fontSize={9.5}
                            fill="white"
                            fontWeight={700}
                            fontFamily="system-ui, -apple-system, sans-serif"
                          >
                            {lvl.label}
                          </text>
                          <text
                            x={SVG_CX + midHW - 8}
                            y={midY + 4}
                            fontSize={11}
                            fill="white"
                            fontWeight={800}
                            textAnchor="end"
                            fontFamily="system-ui, -apple-system, sans-serif"
                          >
                            {count}
                          </text>
                        </>
                      ) : (
                        <text
                          x={SVG_CX}
                          y={midY + 4}
                          fontSize={10}
                          fill="white"
                          fontWeight={800}
                          textAnchor="middle"
                          fontFamily="system-ui, -apple-system, sans-serif"
                        >
                          {count}
                        </text>
                      )}
                    </g>
                    {/* Transparentes Polygon für Tooltip */}
                    <polygon points={pts} fill="transparent">
                      <title>{`${lvl.label}: ${count}`}</title>
                    </polygon>
                  </g>
                );
              })}
            </svg>
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
