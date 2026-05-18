// Widget Types for Dashboard
export type WidgetType =
  | 'time-tracking'
  | 'logged-users'
  | 'recent-entries'
  | 'absence-requests'
  | 'summary'
  | 'pending-approvals'
  | 'messages'
  | 'clock'
  | 'budget'
  | 'notes'
  | 'weather'
  | 'payroll'
  | 'bauhaus-clock'
  | 'onboarding'
  | 'checklists'
  | 'news'
  | 'ehs-kpi'
  | 'ehs-pyramid';

// EHS KPI Widget configuration
export type EHSKPIMetric =
  | 'ltifr' | 'trir' | 'ytdLTIFR' | 'ytdTRIR'
  | 'totalHours' | 'ytdTotalHours'
  | 'ltis' | 'recordables' | 'nearMisses' | 'firstAids'
  | 'fatalities' | 'unsafeConditions' | 'unsafeBehaviors'
  | 'propertyDamages' | 'environmentIncidents' | 'safetyObservations'
  | 'totalIncidents';

export type EHSKPIDisplayType = 'numeric' | 'gauge' | 'bar-h' | 'bar-v' | 'trend' | 'radial' | 'traffic-light';

export interface EHSKPIConfig {
  metric: EHSKPIMetric;
  displayType: EHSKPIDisplayType;
  timeRange: 'current-month' | 'ytd';
  year?: number;
  month?: number;
  maxValue?: number;   // For gauge/bar: upper bound (auto if omitted)
  label?: string;     // Custom display label (auto if omitted)
  decimals?: number;  // Decimal places for numeric display
}

export interface DashboardWidget {
  id: string;
  type: WidgetType;
  title: string;
  isVisible: boolean;
  minW?: number;
  minH?: number;
  defaultW?: number;
  defaultH?: number;
  config?: Record<string, any>;
  /** If true, multiple independent instances of this widget can be added */
  multiInstance?: boolean;
}

export interface WidgetLayout {
  i: string; // Widget ID
  x: number;
  y: number;
  w: number;
  h: number;
  minW?: number;
  minH?: number;
  maxW?: number;
  maxH?: number;
}

export interface Layouts {
  lg: WidgetLayout[];
  md: WidgetLayout[];
  sm: WidgetLayout[];
}

export interface UserDashboardLayout {
  userId: string;
  widgets: DashboardWidget[];
  layouts: Layouts;
  lastModified: string;
}

export const DEFAULT_WIDGETS: DashboardWidget[] = [
  {
    id: 'time-tracking',
    type: 'time-tracking',
    title: '⏰ Zeit erfassen',
    isVisible: false,
    minW: 2,
    minH: 2,
    defaultW: 4,
    defaultH: 2,
  },
  {
    id: 'logged-users',
    type: 'logged-users',
    title: '👥 Angemeldete Mitarbeiter',
    isVisible: false,
    minW: 4,
    minH: 2,
    defaultW: 8,
    defaultH: 3,
  },
  {
    id: 'recent-entries',
    type: 'recent-entries',
    title: '📊 Letzte Zeiteinträge',
    isVisible: false,
    minW: 4,
    minH: 3,
    defaultW: 8,
    defaultH: 4,
  },
  {
    id: 'absence-requests',
    type: 'absence-requests',
    title: '📋 Abwesenheitsanträge',
    isVisible: false,
    minW: 4,
    minH: 2,
    defaultW: 4,
    defaultH: 3,
  },
  {
    id: 'summary',
    type: 'summary',
    title: '📈 Zusammenfassung',
    isVisible: false,
    minW: 2,
    minH: 2,
    defaultW: 4,
    defaultH: 3,
  },
  {
    id: 'pending-approvals',
    type: 'pending-approvals',
    title: '✅ Ausstehende Genehmigungen',
    isVisible: false,
    minW: 2,
    minH: 1,
    defaultW: 4,
    defaultH: 2,
  },
  {
    id: 'messages',
    type: 'messages',
    title: '💬 Nachrichten',
    isVisible: false,
    minW: 2,
    minH: 1,
    defaultW: 4,
    defaultH: 2,
  },
  {
    id: 'clock',
    type: 'clock',
    title: '🕐 Uhr & Datum',
    isVisible: false,
    minW: 2,
    minH: 2,
    defaultW: 4,
    defaultH: 3,
  },
  {
    id: 'budget',
    type: 'budget',
    title: '💰 Budget-Auslastung',
    isVisible: false,
    minW: 4,
    minH: 4,
    defaultW: 6,
    defaultH: 5,
  },
  {
    id: 'notes',
    type: 'notes',
    title: '📝 Notizen',
    isVisible: false,
    minW: 3,
    minH: 3,
    defaultW: 4,
    defaultH: 4,
  },
  {
    id: 'weather',
    type: 'weather',
    title: '🌤️ Wetter',
    isVisible: false,
    minW: 3,
    minH: 6,
    defaultW: 4,
    defaultH: 8,
  },
  {
    id: 'bauhaus-clock',
    type: 'bauhaus-clock',
    title: '🎨 Bauhaus Uhr',
    isVisible: false,
    minW: 2,
    minH: 2,
    defaultW: 3,
    defaultH: 3,
  },
  {
    id: 'onboarding',
    type: 'onboarding',
    title: '👤 Mein Onboarding',
    isVisible: false,
    minW: 4,
    minH: 3,
    defaultW: 6,
    defaultH: 4,
  },
  {
    id: 'checklists',
    type: 'checklists',
    title: '✓ Checklisten',
    isVisible: false,
    minW: 4,
    minH: 3,
    defaultW: 6,
    defaultH: 4,
  },
  {
    id: 'news',
    type: 'news',
    title: '📰 Nachrichten',
    isVisible: false,
    minW: 4,
    minH: 3,
    defaultW: 6,
    defaultH: 5,
  },
  {
    id: 'ehs-kpi',
    type: 'ehs-kpi',
    title: '🦺 EHS KPI',
    isVisible: false,
    minW: 2,
    minH: 2,
    defaultW: 4,
    defaultH: 3,
    multiInstance: true,
    config: {
      metric: 'ltifr',
      displayType: 'numeric',
      timeRange: 'current-month',
      decimals: 2,
    },
  },
  {
    id: 'ehs-pyramid',
    type: 'ehs-pyramid',
    title: '▲ EHS Pyramide',
    isVisible: false,
    minW: 3,
    minH: 4,
    defaultW: 4,
    defaultH: 7,
  },
];
