import React, { useState, useEffect, useCallback } from 'react';
import ReactDOM from 'react-dom';
import {
  AreaChart, Area, BarChart, Bar,
  XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
} from 'recharts';
import api from '../../services/api';
import WidgetHeader from './WidgetHeader';
import { EHSKPIConfig, EHSKPIMetric, EHSKPIDisplayType } from './types';
import './DashboardWidgets.css';
import './EHSKPIWidget.css';

interface ChartPoint { label: string; value: number; }
interface MetricInfo { label: string; source: 'kpis'|'pyramid'|'derived'; key: string; trendKey: string; unit: string; defaultMax: number; decimals: number; }
interface DP { value: number; max: number; label: string; unit: string; decimals: number; period: string; }
interface TrendProps { trendData: ChartPoint[]; label: string; unit: string; decimals: number; color: string; gradientId: string; }
interface SettingsModalProps { config: EHSKPIConfig; onSave: (c: EHSKPIConfig) => void; onClose: () => void; }
interface EHSKPIWidgetProps { config?: Record<string, any>; widgetId: string; onRemove: () => void; onConfigChange: (config: Record<string, any>) => void; }

const METRIC_CATALOGUE: Record<EHSKPIMetric, MetricInfo> = {
  ltifr:                { label: 'LTIFR',                   source: 'kpis',    key: 'ltifr',                unit: '',   defaultMax: 5,      decimals: 2, trendKey: 'ltifr' },
  trir:                 { label: 'TRIR',                     source: 'kpis',    key: 'trir',                 unit: '',   defaultMax: 10,     decimals: 2, trendKey: 'trir' },
  ytdLTIFR:             { label: 'LTIFR (YTD)',              source: 'kpis',    key: 'ytdLTIFR',             unit: '',   defaultMax: 5,      decimals: 2, trendKey: 'ltifr' },
  ytdTRIR:              { label: 'TRIR (YTD)',               source: 'kpis',    key: 'ytdTRIR',              unit: '',   defaultMax: 10,     decimals: 2, trendKey: 'trir' },
  totalHours:           { label: 'Arbeitsstunden',            source: 'kpis',    key: 'totalHours',           unit: 'h',  defaultMax: 50000,  decimals: 0, trendKey: 'totalHours' },
  ytdTotalHours:        { label: 'Arbeitsstunden (YTD)',      source: 'kpis',    key: 'ytdTotalHours',        unit: 'h',  defaultMax: 500000, decimals: 0, trendKey: 'totalHours' },
  ltis:                 { label: 'LTIs',                      source: 'pyramid', key: 'ltis',                unit: '',   defaultMax: 10,     decimals: 0, trendKey: 'ltis' },
  recordables:          { label: 'Recordables',               source: 'pyramid', key: 'recordables',          unit: '',   defaultMax: 20,     decimals: 0, trendKey: 'recordables' },
  nearMisses:           { label: 'Beinahe-Unfaelle',          source: 'pyramid', key: 'nearMisses',           unit: '',   defaultMax: 50,     decimals: 0, trendKey: 'nearMisses' },
  firstAids:            { label: 'Erste Hilfe',               source: 'pyramid', key: 'firstAids',            unit: '',   defaultMax: 20,     decimals: 0, trendKey: 'firstAids' },
  fatalities:           { label: 'Todesfaelle',               source: 'pyramid', key: 'fatalities',           unit: '',   defaultMax: 5,      decimals: 0, trendKey: 'fatalities' },
  unsafeConditions:     { label: 'Unsichere Zustaende',       source: 'pyramid', key: 'unsafeConditions',     unit: '',   defaultMax: 100,    decimals: 0, trendKey: 'unsafeConditions' },
  unsafeBehaviors:      { label: 'Unsicheres Verhalten',      source: 'pyramid', key: 'unsafeBehaviors',      unit: '',   defaultMax: 100,    decimals: 0, trendKey: 'unsafeBehaviors' },
  propertyDamages:      { label: 'Sachschaeden',              source: 'pyramid', key: 'propertyDamages',      unit: '',   defaultMax: 20,     decimals: 0, trendKey: 'propertyDamages' },
  environmentIncidents: { label: 'Umweltvorfaelle',           source: 'pyramid', key: 'environmentIncidents', unit: '',   defaultMax: 20,     decimals: 0, trendKey: 'environmentIncidents' },
  safetyObservations:   { label: 'Sicherheitsbeob.',          source: 'pyramid', key: 'safetyObservations',   unit: '',   defaultMax: 200,    decimals: 0, trendKey: 'safetyObservations' },
  totalIncidents:       { label: 'Vorfaelle gesamt',          source: 'derived', key: 'totalIncidents',       unit: '',   defaultMax: 50,     decimals: 0, trendKey: '__totalIncidents' },
};

const MONTH_SHORT = ['Jan','Feb','Mar','Apr','Mai','Jun','Jul','Aug','Sep','Okt','Nov','Dez'];

function kpiColor(ratio: number) {
  if (ratio > 0.8) return '#ef4444';
  if (ratio > 0.5) return '#f59e0b';
  return '#10b981';
}

const NumericDisplay: React.FC<DP> = ({ value, max, label, unit, decimals, period }) => {
  const ratio = max > 0 ? Math.min(value / max, 1) : 0;
  const color = kpiColor(ratio);
  const tints: Record<string,string> = { '#10b981': 'rgba(16,185,129,0.06)', '#f59e0b': 'rgba(245,158,11,0.06)', '#ef4444': 'rgba(239,68,68,0.06)' };
  return (
    <div className="ehskpi-numeric" style={{ background: tints[color] }}>
      <div className="ehskpi-numeric-accent" style={{ background: color }} />
      <div className="ehskpi-numeric-value" style={{ color }}>
        {value.toFixed(decimals)}{unit && <span className="ehskpi-numeric-unit">{unit}</span>}
      </div>
      <div className="ehskpi-numeric-label">{label}</div>
      <span className="ehskpi-numeric-period" style={{ borderColor: color, color }}>{period}</span>
    </div>
  );
};

const GaugeDisplay: React.FC<DP> = ({ value, max, label, unit, decimals }) => {
  const safeMax = max > 0 ? max : 1;
  const ratio = Math.min(value / safeMax, 1);
  const color = kpiColor(ratio);
  const cx = 100, cy = 100, r = 78;
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const startRad = toRad(135), sweepRad = toRad(270);
  const fillRad = startRad + ratio * sweepRad, trackEnd = startRad + sweepRad;
  const pt = (rad: number, radius = r) => ({ x: cx + radius * Math.cos(rad), y: cy + radius * Math.sin(rad) });
  const s = pt(startRad), te = pt(trackEnd), fe = pt(fillRad), ne = pt(fillRad, r - 22);
  const fillLarge = ratio * 270 > 180 ? 1 : 0;
  return (
    <div className="ehskpi-gauge-wrap">
      <svg viewBox="0 0 200 175" className="ehskpi-gauge-svg">
        <path d={`M ${s.x} ${s.y} A ${r} ${r} 0 1 1 ${te.x} ${te.y}`} fill="none" stroke="#e5e7eb" strokeWidth="14" strokeLinecap="round" />
        {ratio > 0 && <path d={`M ${s.x} ${s.y} A ${r} ${r} 0 ${fillLarge} 1 ${fe.x} ${fe.y}`} fill="none" stroke={color} strokeWidth="14" strokeLinecap="round" />}
        <line x1={cx} y1={cy} x2={ne.x} y2={ne.y} stroke={color} strokeWidth="3" strokeLinecap="round" />
        <circle cx={cx} cy={cy} r={7} fill={color} />
        <circle cx={cx} cy={cy} r={3} fill="#fff" />
        <text x={cx} y={cy + 32} textAnchor="middle" fontSize="22" fontWeight="700" fill={color}>{value.toFixed(decimals)}{unit}</text>
        <text x={cx} y={cy + 50} textAnchor="middle" fontSize="10" fill="#9ca3af">{label}</text>
        <text x={s.x - 4}  y={s.y + 14} textAnchor="end"   fontSize="9" fill="#9ca3af">0</text>
        <text x={te.x + 4} y={te.y + 14} textAnchor="start" fontSize="9" fill="#9ca3af">{max}</text>
      </svg>
    </div>
  );
};

const RadialDisplay: React.FC<DP> = ({ value, max, label, unit, decimals }) => {
  const safeMax = max > 0 ? max : 1;
  const ratio = Math.min(value / safeMax, 1);
  const color = kpiColor(ratio);
  const r = 48, cx = 70, cy = 70;
  const circ = 2 * Math.PI * r;
  const offset = circ * (1 - ratio);
  return (
    <div className="ehskpi-radial-wrap">
      <svg viewBox="0 0 140 140" className="ehskpi-radial-svg">
        <circle cx={cx} cy={cy} r={r} fill="none" stroke="#e5e7eb" strokeWidth="14" />
        <circle cx={cx} cy={cy} r={r} fill="none" stroke={color} strokeWidth="14" strokeLinecap="round"
          strokeDasharray={circ} strokeDashoffset={offset} transform={`rotate(-90 ${cx} ${cy})`}
          style={{ transition: 'stroke-dashoffset 0.7s ease' }} />
        <text x={cx} y={cy - 7} textAnchor="middle" fontSize="18" fontWeight="700" fill={color}>{value.toFixed(decimals)}{unit}</text>
        <text x={cx} y={cy + 11} textAnchor="middle" fontSize="9" fill="#9ca3af">{Math.round(ratio * 100)} %</text>
      </svg>
      <div className="ehskpi-radial-label">{label}</div>
    </div>
  );
};

const TrafficLight: React.FC<DP> = ({ value, max, label, unit, decimals }) => {
  const ratio = max > 0 ? Math.min(value / max, 1) : 0;
  const active = ratio > 0.8 ? 'red' : ratio > 0.5 ? 'amber' : 'green';
  const lights = [
    { id: 'red',   cy: 38,  fill: '#ef4444', glow: 'rgba(239,68,68,0.5)' },
    { id: 'amber', cy: 100, fill: '#f59e0b', glow: 'rgba(245,158,11,0.5)' },
    { id: 'green', cy: 162, fill: '#10b981', glow: 'rgba(16,185,129,0.5)' },
  ] as const;
  const cur = lights.find(l => l.id === active)!;
  return (
    <div className="ehskpi-traffic-wrap">
      <svg viewBox="0 0 80 200" className="ehskpi-traffic-svg">
        <rect x={10} y={5} width={60} height={190} rx={30} fill="#1f2937" />
        {lights.map(l => (
          <g key={l.id}>
            {l.id === active && <circle cx={40} cy={l.cy} r={26} fill={l.glow} />}
            <circle cx={40} cy={l.cy} r={20} fill={l.id === active ? l.fill : '#374151'} style={{ filter: l.id === active ? `drop-shadow(0 0 8px ${l.glow})` : 'none', transition: 'fill 0.4s' }} />
          </g>
        ))}
      </svg>
      <div className="ehskpi-traffic-value" style={{ color: cur.fill }}>{value.toFixed(decimals)}{unit}</div>
      <div className="ehskpi-traffic-label">{label}</div>
    </div>
  );
};

const BarHDisplay: React.FC<DP> = ({ value, max, label, unit, decimals }) => {
  const ratio = max > 0 ? Math.min(value / max, 1) : 0;
  const color = kpiColor(ratio);
  const data = [{ name: label, value, rest: Math.max(max - value, 0) }];
  return (
    <div className="ehskpi-barh-wrap">
      <div className="ehskpi-bar-header" style={{ color }}>
        <span className="ehskpi-bar-big">{value.toFixed(decimals)}{unit}</span>
        <span className="ehskpi-bar-pct">{Math.round(ratio * 100)} %</span>
      </div>
      <div style={{ width: '100%', height: 44 }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart layout="vertical" data={data} margin={{ top: 4, right: 8, left: 0, bottom: 4 }}>
            <XAxis type="number" domain={[0, max]} hide />
            <YAxis type="category" dataKey="name" hide />
            <Tooltip cursor={false} contentStyle={{ borderRadius: 8, border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,.12)', fontSize: 12 }}
              formatter={(v: any, n: any) => n === 'value' ? [`${Number(v).toFixed(decimals)}${unit}`, label] : null} />
            <Bar dataKey="value" stackId="a" fill={color}    radius={[6,0,0,6]} isAnimationActive />
            <Bar dataKey="rest"  stackId="a" fill="#e5e7eb" radius={[0,6,6,0]} isAnimationActive={false} />
          </BarChart>
        </ResponsiveContainer>
      </div>
      <div className="ehskpi-bar-footer">{label}</div>
    </div>
  );
};

const BarVDisplay: React.FC<DP> = ({ value, max, label, unit, decimals }) => {
  const ratio = max > 0 ? Math.min(value / max, 1) : 0;
  const color = kpiColor(ratio);
  const data = [{ name: label, value, rest: Math.max(max - value, 0) }];
  return (
    <div className="ehskpi-barv-wrap">
      <div style={{ width: '100%', flex: 1, minHeight: 80 }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 4, right: 16, left: -20, bottom: 4 }}>
            <XAxis dataKey="name" hide />
            <YAxis domain={[0, max]} hide />
            <Tooltip cursor={false} contentStyle={{ borderRadius: 8, border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,.12)', fontSize: 12 }}
              formatter={(v: any, n: any) => n === 'value' ? [`${Number(v).toFixed(decimals)}${unit}`, label] : null} />
            <Bar dataKey="value" stackId="a" fill={color}    radius={[6,6,0,0]} isAnimationActive />
            <Bar dataKey="rest"  stackId="a" fill="#e5e7eb" radius={[0,0,0,0]} isAnimationActive={false} />
          </BarChart>
        </ResponsiveContainer>
      </div>
      <div className="ehskpi-barv-footer" style={{ color }}>
        <span className="ehskpi-bar-big">{value.toFixed(decimals)}{unit}</span>
        <span className="ehskpi-barv-label">{label}</span>
      </div>
    </div>
  );
};

const TrendDisplay: React.FC<TrendProps> = ({ trendData, label, unit, decimals, color, gradientId }) => (
  <div className="ehskpi-trend-wrap">
    <div className="ehskpi-trend-header">
      <span className="ehskpi-trend-label">{label}</span>
      {trendData.length > 0 && <span className="ehskpi-trend-latest" style={{ color }}>{trendData[trendData.length-1].value.toFixed(decimals)}{unit}</span>}
    </div>
    <div style={{ width: '100%', flex: 1, minHeight: 80 }}>
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={trendData} margin={{ top: 8, right: 8, left: -24, bottom: 0 }}>
          <defs>
            <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%"  stopColor={color} stopOpacity={0.25} />
              <stop offset="95%" stopColor={color} stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f4f8" vertical={false} />
          <XAxis dataKey="label" tick={{ fontSize: 9, fill: '#9ca3af' }} tickLine={false} axisLine={false} interval="preserveStartEnd" />
          <YAxis tick={{ fontSize: 9, fill: '#9ca3af' }} tickLine={false} axisLine={false} />
          <Tooltip contentStyle={{ borderRadius: 8, border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,.12)', fontSize: 12 }}
            formatter={(v: any) => [`${Number(v).toFixed(decimals)}${unit}`, label]} />
          <Area type="monotone" dataKey="value" stroke={color} strokeWidth={2} fill={`url(#${gradientId})`} dot={false} activeDot={{ r: 4, fill: color }} />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  </div>
);

const DISPLAY_OPTS: { value: EHSKPIDisplayType; label: string; icon: string; desc: string }[] = [
  { value: 'numeric',       label: 'Zahl',     icon: 'N',  desc: 'Grosser KPI-Wert' },
  { value: 'gauge',         label: 'Gauge',    icon: 'G',  desc: '270 Grad Gauge' },
  { value: 'radial',        label: 'Donut',    icon: 'D',  desc: 'Ringdiagramm' },
  { value: 'bar-h',         label: 'Balken H', icon: 'BH', desc: 'Horizontal' },
  { value: 'bar-v',         label: 'Balken V', icon: 'BV', desc: 'Vertikal' },
  { value: 'trend',         label: 'Trend',    icon: 'T',  desc: '12 Monate' },
  { value: 'traffic-light', label: 'Ampel',    icon: 'A',  desc: 'Status-Ampel' },
];

const METRIC_GROUPS: { label: string; metrics: EHSKPIMetric[] }[] = [
  { label: 'Kennzahlen', metrics: ['ltifr','trir','ytdLTIFR','ytdTRIR','totalHours','ytdTotalHours'] },
  { label: 'Vorfaelle',  metrics: ['fatalities','ltis','recordables','firstAids','nearMisses','totalIncidents','propertyDamages','environmentIncidents','unsafeBehaviors','unsafeConditions','safetyObservations'] },
];

const SettingsModal: React.FC<SettingsModalProps> = ({ config, onSave, onClose }) => {
  const [draft, setDraft] = useState<EHSKPIConfig>({ ...config });
  const now = new Date();
  const set = <K extends keyof EHSKPIConfig>(k: K, v: EHSKPIConfig[K]) => setDraft(d => ({ ...d, [k]: v }));
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content ehskpi-modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2>EHS KPI Einstellungen</h2>
          <button className="modal-close-btn" onClick={onClose}>x</button>
        </div>
        <div className="modal-body ehskpi-modal-body">
          <section className="ehskpi-section">
            <h4 className="ehskpi-section-title">Kennzahl</h4>
            {METRIC_GROUPS.map(g => (
              <div key={g.label} style={{ marginBottom: 8 }}>
                <div className="ehskpi-group-label">{g.label}</div>
                <div className="ehskpi-metric-grid">
                  {g.metrics.map(m => (
                    <button key={m} type="button" className={`ehskpi-metric-btn${draft.metric === m ? ' active' : ''}`} onClick={() => set('metric', m)}>
                      {METRIC_CATALOGUE[m].label}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </section>
          <section className="ehskpi-section">
            <h4 className="ehskpi-section-title">Darstellung</h4>
            <div className="ehskpi-display-grid">
              {DISPLAY_OPTS.map(o => (
                <button key={o.value} type="button" className={`ehskpi-display-btn${draft.displayType === o.value ? ' active' : ''}`} onClick={() => set('displayType', o.value)}>
                  <span className="ehskpi-display-icon">{o.icon}</span>
                  <span className="ehskpi-display-name">{o.label}</span>
                  <span className="ehskpi-display-desc">{o.desc}</span>
                </button>
              ))}
            </div>
          </section>
          {draft.displayType !== 'trend' && (
            <section className="ehskpi-section">
              <h4 className="ehskpi-section-title">Zeitraum</h4>
              <div className="ehskpi-row">
                <select className="ehskpi-select" value={draft.timeRange} onChange={e => set('timeRange', e.target.value as EHSKPIConfig['timeRange'])}>
                  <option value="current-month">Aktueller Monat</option>
                  <option value="ytd">Jahr bis dato (YTD)</option>
                </select>
                <select className="ehskpi-select" value={draft.year ?? now.getFullYear()} onChange={e => set('year', +e.target.value)}>
                  {[now.getFullYear()-2, now.getFullYear()-1, now.getFullYear()].map(y => <option key={y} value={y}>{y}</option>)}
                </select>
                <select className="ehskpi-select" value={draft.month ?? now.getMonth()+1} onChange={e => set('month', +e.target.value)}>
                  {Array.from({length:12},(_,i)=>i+1).map(m => <option key={m} value={m}>{m.toString().padStart(2,'0')}</option>)}
                </select>
              </div>
            </section>
          )}
          <section className="ehskpi-section">
            <h4 className="ehskpi-section-title">Skala und Anzeige</h4>
            <div className="ehskpi-row">
              <label className="ehskpi-field">
                <span>Maximalwert</span>
                <input className="ehskpi-input" type="number" min={0} placeholder={String(METRIC_CATALOGUE[draft.metric].defaultMax)} value={draft.maxValue ?? ''} onChange={e => set('maxValue', e.target.value ? +e.target.value : undefined)} />
              </label>
              <label className="ehskpi-field">
                <span>Nachkommastellen</span>
                <input className="ehskpi-input" type="number" min={0} max={4} value={draft.decimals ?? METRIC_CATALOGUE[draft.metric].decimals} onChange={e => set('decimals', +e.target.value)} />
              </label>
            </div>
            <label className="ehskpi-field" style={{ marginTop: 8 }}>
              <span>Beschriftung (optional)</span>
              <input className="ehskpi-input" type="text" placeholder={METRIC_CATALOGUE[draft.metric].label} value={draft.label ?? ''} onChange={e => set('label', e.target.value || undefined)} />
            </label>
          </section>
        </div>
        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={onClose}>Abbrechen</button>
          <button className="btn btn-primary" onClick={() => onSave(draft)}>Speichern</button>
        </div>
      </div>
    </div>
  );
};

const DEFAULT_CFG: EHSKPIConfig = { metric: 'ltifr', displayType: 'numeric', timeRange: 'current-month', decimals: 2 };

const EHSKPIWidget: React.FC<EHSKPIWidgetProps> = ({ config, widgetId, onRemove, onConfigChange }) => {
  const cfg: EHSKPIConfig = { ...DEFAULT_CFG, ...(config as EHSKPIConfig) };
  const meta = METRIC_CATALOGUE[cfg.metric];
  const [value, setValue]         = useState<number | null>(null);
  const [trendData, setTrendData] = useState<ChartPoint[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError]         = useState<string | null>(null);
  const [showSettings, setShowSettings] = useState(false);
  const displayLabel = cfg.label || meta.label;
  const decimals     = cfg.decimals ?? meta.decimals;
  const maxValue     = cfg.maxValue ?? meta.defaultMax;
  const unit         = meta.unit;
  const now          = new Date();
  const year         = cfg.year  ?? now.getFullYear();
  const month        = cfg.month ?? now.getMonth() + 1;
  const period       = cfg.timeRange === 'ytd' ? `YTD ${year}` : `${month.toString().padStart(2,'0')}/${year}`;
  const fetchData = useCallback(async () => {
    setIsLoading(true); setError(null);
    try {
      if (cfg.displayType === 'trend') {
        const { data } = await api.get('/ehs/statistics', { params: { startYear: now.getFullYear()-1, endYear: now.getFullYear() } });
        const months: any[] = (data.monthlyData ?? []).slice(-12);
        const points: ChartPoint[] = months.map((m: any) => {
          let v = 0;
          if (meta.trendKey === '__totalIncidents') {
            v = (m.ltis??0)+(m.recordables??0)+(m.firstAids??0)+(m.nearMisses??0)+(m.fatalities??0)+(m.unsafeConditions??0)+(m.unsafeBehaviors??0)+(m.propertyDamages??0)+(m.environmentIncidents??0)+(m.safetyObservations??0);
          } else {
            v = m[meta.trendKey] ?? 0;
          }
          return { label: `${MONTH_SHORT[m.month-1]} ${String(m.year).slice(2)}`, value: v };
        });
        setTrendData(points);
        setValue(points.at(-1)?.value ?? 0);
      } else {
        const { data } = await api.get('/ehs/dashboard', { params: { year, month } });
        let extracted = 0;
        if (cfg.metric === 'totalIncidents') {
          extracted = (data.incidents as any[])?.length ?? 0;
        } else if (meta.source === 'kpis') {
          extracted = data.kpis?.[meta.key] ?? 0;
        } else {
          extracted = data.pyramid?.[meta.key] ?? 0;
        }
        setValue(extracted);
      }
    } catch {
      setError('Fehler beim Laden der EHS-Daten');
    } finally {
      setIsLoading(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cfg.displayType, cfg.metric, year, month, meta]);
  useEffect(() => { fetchData(); }, [fetchData]);
  const ratio  = maxValue > 0 && value !== null ? Math.min(value / maxValue, 1) : 0;
  const color  = kpiColor(ratio);
  const gradId = `ehstrend-${widgetId.replace(/[^a-z0-9]/gi, '')}`;
  const dp: DP = { value: value ?? 0, max: maxValue, label: displayLabel, unit, decimals, period };
  const renderContent = () => {
    if (isLoading) return <div className="widget-loading"><div className="spinner" /><p>Lade...</p></div>;
    if (error)     return <div className="widget-error"><span>{error}</span><button className="btn btn-sm btn-secondary" style={{marginTop:8}} onClick={fetchData}>Wiederholen</button></div>;
    if (value === null) return null;
    switch (cfg.displayType) {
      case 'gauge':         return <GaugeDisplay {...dp} />;
      case 'radial':        return <RadialDisplay {...dp} />;
      case 'traffic-light': return <TrafficLight {...dp} />;
      case 'bar-h':         return <BarHDisplay {...dp} />;
      case 'bar-v':         return <BarVDisplay {...dp} />;
      case 'trend':         return <TrendDisplay trendData={trendData} label={displayLabel} unit={unit} decimals={decimals} color={color} gradientId={gradId} />;
      default:              return <NumericDisplay {...dp} />;
    }
  };
  const needsCol = cfg.displayType === 'bar-v' || cfg.displayType === 'trend';
  return (
    <div className="dashboard-widget">
      <WidgetHeader title={displayLabel} icon="EHS" onSettings={() => setShowSettings(true)} onRemove={onRemove} />
      <div className={`widget-content ehskpi-content${needsCol ? ' ehskpi-content--col' : ''}`}>
        {renderContent()}
      </div>
      {showSettings && ReactDOM.createPortal(
        <SettingsModal config={cfg} onSave={c => { onConfigChange(c as unknown as Record<string,any>); setShowSettings(false); }} onClose={() => setShowSettings(false)} />,
        document.body,
      )}
    </div>
  );
};

export default EHSKPIWidget;
