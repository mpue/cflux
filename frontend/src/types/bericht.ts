export type ReportStatus = 'DRAFT' | 'COMPLETED';

/** Projekt-Kurzform inkl. Branding, wie sie das Berichte-Modul liefert. */
export interface BerichtProject {
  id: string;
  name: string;
  logoUrl?: string | null;
  primaryColor?: string | null;
  secondaryColor?: string | null;
  accentColor?: string | null;
}

export interface BerichtArea {
  id?: string;
  name: string;
  status: string; // 'i.O.' | 'Abweichung' | 'nicht geprüft' | ''
  sortOrder?: number;
}

export interface BerichtFinding {
  id?: string;
  position?: number;
  feststellung?: string | null;
  bereich?: string | null;
  klassifizierung?: string | null;
  ampel?: string | null;
  stopp?: string | null;
  massnahme?: string | null;
  verantwortlich?: string | null;
  termin?: string | null;
  status?: string | null;
  erledigtAm?: string | null;
  kontrolle?: string | null;
  photoId?: string | null;
}

export interface BerichtPhoto {
  id: string;
  reportId: string;
  filename: string;
  originalName: string;
  mimeType?: string | null;
  fileSize?: number | null;
  createdAt: string;
}

/** Vollständiger Bericht inkl. Bereichen, Feststellungen und Fotos. */
export interface Bericht {
  id: string;
  projectId: string;
  weekday: string;
  date: string;
  /** Freier Titel; steht im Export über dem Protokoll. */
  titel?: string | null;
  /** Ordner, der mehrere Tage zu einem Wochenbericht klammert. */
  folderId?: string | null;
  folder?: { id: string; name: string } | null;
  referent?: string | null;
  rundgangDurchgefuehrt?: string | null;
  weitereTeilnehmer?: string | null;
  status: ReportStatus;
  createdAt: string;
  updatedAt: string;
  project: BerichtProject;
  createdBy?: { id: string; firstName: string; lastName: string } | null;
  areas: BerichtArea[];
  findings: BerichtFinding[];
  photos: BerichtPhoto[];
}

/** Listeneintrag ohne Detaildaten. */
export interface BerichtListItem {
  id: string;
  projectId: string;
  weekday: string;
  date: string;
  titel?: string | null;
  folderId?: string | null;
  folder?: { id: string; name: string } | null;
  referent?: string | null;
  status: ReportStatus;
  createdAt: string;
  updatedAt: string;
  project: { id: string; name: string };
  createdBy?: { id: string; firstName: string; lastName: string } | null;
  _count: { findings: number; photos: number };
}

/** Ergebnis eines Datenimports aus dem Wochenbericht-Tool. */
export interface BerichtImportResult {
  imported: number;
  skipped: number;
  /** Neu angelegte Ordner; gleichnamige vorhandene werden wiederverwendet. */
  foldersCreated: number;
  photos: number;
  findings: number;
  areas: number;
  /** Felder des Quelltools ohne Entsprechung in cflux. */
  droppedFields: string[];
  warnings: string[];
  reports: { id: string; weekday: string; date: string }[];
}

/** Ordner fasst die Tagesblätter einer Woche zu einem Gesamt-Wochenbericht zusammen. */
export interface BerichtFolder {
  id: string;
  projectId: string;
  name: string;
  createdAt: string;
  project?: { id: string; name: string };
  _count?: { reports: number };
}

// --- Auswertung der Rundgangsberichte ---

export interface BerichtAmpelCounts {
  rot: number;
  gelb: number;
  gruen: number;
}

export interface BerichtPyramidLevel {
  key: string;
  label: string;
  color: string;
  count: number;
}

export interface BerichtMatrixRow {
  key: string;
  label: string;
  counts: number[];
  total: number;
}

export interface BerichtDashboardFolder {
  /** null für Tagesblätter ohne Wochenbericht-Ordner. */
  id: string | null;
  name: string;
  from: string | null;
  to: string | null;
  reports: number;
  findings: number;
  ampel: BerichtAmpelCounts;
}

export interface BerichtDashboard {
  year: number;
  projectId: string | null;
  projectName: string | null;
  kennzahlen: {
    reports: number;
    findings: number;
    photos: number;
    offeneMassnahmen: number;
    ampel: BerichtAmpelCounts;
  };
  pyramid: {
    levels: BerichtPyramidLevel[];
    total: number;
    unclassified: number;
  };
  matrix: {
    rows: BerichtMatrixRow[];
    monthTotals: number[];
    grandTotal: number;
  };
  ampelByMonth: { rot: number[]; gelb: number[]; gruen: number[] };
  folders: BerichtDashboardFolder[];
}
