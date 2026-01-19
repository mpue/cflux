// Widget Types for Dashboard
export type WidgetType =
  | 'time-tracking'
  | 'logged-users'
  | 'recent-entries'
  | 'absence-requests'
  | 'summary'
  | 'pending-approvals'
  | 'messages'
  | 'payroll';

export interface DashboardWidget {
  id: string;
  type: WidgetType;
  title: string;
  isVisible: boolean;
  minW?: number;
  minH?: number;
  defaultW?: number;
  defaultH?: number;
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
];
