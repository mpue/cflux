import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Alert,
  Avatar,
  Box,
  Button,
  Card,
  CardContent,
  Checkbox,
  Chip,
  CircularProgress,
  Container,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Collapse,
  Divider,
  FormControl,
  FormControlLabel,
  Radio,
  RadioGroup,
  FormHelperText,
  Grid,
  IconButton,
  InputLabel,
  LinearProgress,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Menu,
  MenuItem,
  Paper,
  Select,
  Snackbar,
  Step,
  StepButton,
  Stepper,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
  Tooltip,
  Typography,
} from '@mui/material';
import {
  Add as AddIcon,
  CheckCircle as CheckCircleIcon,
  ArrowBack as ArrowBackIcon,
  ArrowForward as ArrowForwardIcon,
  Delete as DeleteIcon,
  Download as DownloadIcon,
  PhotoCamera as PhotoCameraIcon,
  PictureAsPdf as PdfIcon,
  Upload as UploadIcon,
  CreateNewFolder as NewFolderIcon,
  Folder as FolderIcon,
  FolderOpen as FolderOpenIcon,
  MoreVert as MoreVertIcon,
  ExpandLess as ExpandLessIcon,
  ExpandMore as ExpandMoreIcon,
  MenuBook as WeeklyReportIcon,
  InsertChart as DashboardIcon,
  Archive as ArchiveIcon,
  DriveFileMove as AblegenIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import AppNavbar from '../components/AppNavbar';
import { useModules } from '../contexts/ModuleContext';
import berichtService from '../services/bericht.service';
import { normalizeUploadUrl } from '../services/api';
import {
  Bericht,
  BerichtAblageResult,
  BerichtAblageVariant,
  BerichtArea,
  BerichtFolder,
  BerichtImportResult,
  BerichtFinding,
  BerichtListItem,
  BerichtProject,
} from '../types/bericht';

const MODULE_KEY = 'berichte';

/** Sentinel im Ordner-Auswahlfeld: öffnet den Dialog, statt zu verschieben. */
const NEW_FOLDER_OPTION = '__new_folder__';

const WEEKDAYS = [
  { value: 'Mo', label: 'Montag' },
  { value: 'Di', label: 'Dienstag' },
  { value: 'Mi', label: 'Mittwoch' },
  { value: 'Do', label: 'Donnerstag' },
  { value: 'Fr', label: 'Freitag' },
];

const STEPS = ['Wer & Wo', 'Rundgang', 'Fotos', 'Feststellungen', 'Fertig'];

const MONTH_NAMES = [
  'Januar', 'Februar', 'März', 'April', 'Mai', 'Juni',
  'Juli', 'August', 'September', 'Oktober', 'November', 'Dezember',
];

/** Auswahl im Export: aktuelles Jahr plus die vier vorangegangenen. */
const EHS_YEARS = Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i);

const AREA_STATUS = [
  { value: 'i.O.', label: 'i.O.', color: 'success' as const },
  { value: 'Abweichung', label: 'Abweichung', color: 'warning' as const },
  { value: 'nicht geprüft', label: 'nicht geprüft', color: 'standard' as const },
];

const KLASSIFIZIERUNGEN = [
  'Safe Behavior / Positive Beobachtung',
  'Unsafe Condition (unsicherer Zustand)',
  'Unsafe Act (unsichere Handlung)',
  'Good Catch',
  'Near Miss (Beinaheunfall)',
  'pSIF (Potential Serious Injury/Fatality)',
  'FAC (First Aid Case)',
  'MTC / Recordable Incident',
  'RWC (Restricted Work Case)',
  'LTI (Lost Time Injury)',
  'SIF / Fatality',
];

/** Reihenfolge und Bedeutung wie in der Legende des Exports. */
const AMPEL = [
  { value: 'Rot', color: '#dc2626', textColor: '#fff', meaning: 'Stop, Arbeit einstellen und Sicherheit wiederherstellen' },
  { value: 'Gelb', color: '#f59e0b', textColor: '#1a1a1a', meaning: 'Unsafe Condition / unsichere Handlung' },
  { value: 'Grün', color: '#16a34a', textColor: '#fff', meaning: 'erledigt' },
];

const FINDING_STATUS = ['Offen', 'In Bearbeitung', 'Erledigt'];

const emptyFinding = (): BerichtFinding => ({
  feststellung: '',
  bereich: '',
  klassifizierung: '',
  ampel: '',
  stopp: '',
  massnahme: '',
  verantwortlich: '',
  termin: '',
  status: '',
  erledigtAm: '',
  kontrolle: '',
  photoId: null,
});

/** ISO-Datum (auch mit Zeitanteil) auf yyyy-MM-dd für <input type="date"> kürzen. */
const toDateInput = (value?: string | null): string => (value ? value.slice(0, 10) : '');

const formatDate = (value?: string | null): string => {
  if (!value) return '';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? '' : date.toLocaleDateString('de-CH');
};

const BerichtePage: React.FC = () => {
  const navigate = useNavigate();
  const { canCreate, canEdit, canDelete } = useModules();
  const mayCreate = canCreate(MODULE_KEY);
  const mayEdit = canEdit(MODULE_KEY);
  const mayDelete = canDelete(MODULE_KEY);

  const [projects, setProjects] = useState<BerichtProject[]>([]);
  const [reports, setReports] = useState<BerichtListItem[]>([]);
  const [folders, setFolders] = useState<BerichtFolder[]>([]);
  /** Zugeklappte Ordner; standardmäßig ist alles offen. */
  const [collapsedFolders, setCollapsedFolders] = useState<Set<string>>(new Set());
  const [folderDialog, setFolderDialog] = useState<{
    folder: BerichtFolder | null;
    name: string;
    projectId: string;
  } | null>(null);
  const [folderMenu, setFolderMenu] = useState<{ anchor: HTMLElement; folder: BerichtFolder } | null>(
    null
  );
  const [projectFilter, setProjectFilter] = useState<string>('');
  const [current, setCurrent] = useState<Bericht | null>(null);
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [saveState, setSaveState] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [uploading, setUploading] = useState(false);
  const [exporting, setExporting] = useState(false);
  /** EHS-Auswertung als Anhang am Ende des Berichts. */
  const [ablegenOpen, setAblegenOpen] = useState(false);
  const [ablegenVariant, setAblegenVariant] = useState<BerichtAblageVariant>('report-pdf');
  const [ablegenBusy, setAblegenBusy] = useState(false);
  const [ablegenResult, setAblegenResult] = useState<BerichtAblageResult | null>(null);
  const [ablegenError, setAblegenError] = useState('');
  const [ehsInclude, setEhsInclude] = useState(true);
  const [ehsYear, setEhsYear] = useState(() => new Date().getFullYear());
  const [ehsMonth, setEhsMonth] = useState(() => new Date().getMonth() + 1);
  const [ehsProjectId, setEhsProjectId] = useState<string>('');
  const [newDialogOpen, setNewDialogOpen] = useState(false);
  /** Datenimport aus dem eigenständigen Wochenbericht-Tool. */
  const [importDialogOpen, setImportDialogOpen] = useState(false);
  const [importFile, setImportFile] = useState<File | null>(null);
  const [importProjectId, setImportProjectId] = useState('');
  const [importSkipDuplicates, setImportSkipDuplicates] = useState(true);
  const [importing, setImporting] = useState(false);
  const [importProgress, setImportProgress] = useState(0);
  const [importResult, setImportResult] = useState<BerichtImportResult | null>(null);
  /** Index der Feststellung, fuer die gerade ein Foto gewaehlt wird. */
  const [photoPickerIndex, setPhotoPickerIndex] = useState<number | null>(null);
  const [newReport, setNewReport] = useState({
    projectId: '',
    weekday: 'Mo',
    date: new Date().toISOString().slice(0, 10),
  });

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const importInputRef = useRef<HTMLInputElement | null>(null);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const currentRef = useRef<Bericht | null>(null);
  /** Zaehlt lokale Aenderungen mit, damit eine langsame Antwort keine neueren
   *  Eingaben ueberschreibt. */
  const revisionRef = useRef(0);

  currentRef.current = current;

  const loadProjects = useCallback(async () => {
    try {
      setProjects(await berichtService.getProjects());
    } catch (err: any) {
      setError(err?.response?.data?.error || 'Projekte konnten nicht geladen werden');
    }
  }, []);

  const loadFolders = useCallback(async (projectId?: string) => {
    try {
      setFolders(await berichtService.listFolders(projectId || undefined));
    } catch (err: any) {
      setError(err?.response?.data?.error || 'Ordner konnten nicht geladen werden');
    }
  }, []);

  const loadReports = useCallback(async (projectId?: string) => {
    try {
      setReports(await berichtService.list(projectId || undefined));
    } catch (err: any) {
      setError(err?.response?.data?.error || 'Berichte konnten nicht geladen werden');
    }
  }, []);

  useEffect(() => {
    (async () => {
      setLoading(true);
      await Promise.all([loadProjects(), loadReports(), loadFolders()]);
      setLoading(false);
    })();
  }, [loadProjects, loadReports, loadFolders]);

  useEffect(() => {
    loadReports(projectFilter);
    loadFolders(projectFilter);
  }, [projectFilter, loadReports, loadFolders]);

  // Der EHS-Anhang startet beim Monat und Projekt des geoeffneten Berichts,
  // laesst sich im letzten Schritt aber frei umstellen.
  useEffect(() => {
    if (!current) return;
    const date = new Date(current.date);
    if (!Number.isNaN(date.getTime())) {
      setEhsYear(date.getFullYear());
      setEhsMonth(date.getMonth() + 1);
    }
    setEhsProjectId(current.projectId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [current?.id]);

  // Ausstehenden Autosave beim Verlassen der Seite noch abschicken
  useEffect(() => {
    return () => {
      if (!saveTimer.current) return;

      clearTimeout(saveTimer.current);
      saveTimer.current = null;

      const report = currentRef.current;
      if (!report) return;

      // Bewusst ohne setState — die Komponente ist dann bereits ausgehaengt.
      berichtService
        .update(report.id, {
          weekday: report.weekday,
          date: report.date,
          referent: report.referent,
          rundgangDurchgefuehrt: report.rundgangDurchgefuehrt,
          titel: report.titel,
        folderId: report.folderId,
        weitereTeilnehmer: report.weitereTeilnehmer,
          areas: report.areas,
          findings: report.findings,
        })
        .catch(() => undefined);
    };
  }, []);

  const selectReport = async (id: string) => {
    try {
      const report = await berichtService.getById(id);
      revisionRef.current += 1;
      setCurrent(report);
      setStep(0);
      setSaveState('idle');
    } catch (err: any) {
      setError(err?.response?.data?.error || 'Bericht konnte nicht geladen werden');
    }
  };

  const persist = useCallback(async () => {
    const report = currentRef.current;
    if (!report) return;

    const revision = revisionRef.current;
    saveTimer.current = null;
    setSaveState('saving');

    try {
      const updated = await berichtService.update(report.id, {
        weekday: report.weekday,
        date: report.date,
        referent: report.referent,
        rundgangDurchgefuehrt: report.rundgangDurchgefuehrt,
        titel: report.titel,
        folderId: report.folderId,
        weitereTeilnehmer: report.weitereTeilnehmer,
        areas: report.areas,
        findings: report.findings,
      });

      // Waehrend des Speicherns kann weitergetippt worden sein — dann darf die
      // Antwort den lokalen Stand nicht ueberschreiben.
      if (revisionRef.current === revision) {
        setCurrent(updated);
        setSaveState('saved');
      }

      loadReports(projectFilter);
    } catch (err: any) {
      setSaveState('error');
      setError(err?.response?.data?.error || 'Speichern fehlgeschlagen');
    }
  }, [loadReports, projectFilter]);

  /** Ändert den lokalen Stand und plant einen Autosave. */
  const patchCurrent = (patch: Partial<Bericht>) => {
    if (!mayEdit) return;

    revisionRef.current += 1;
    setCurrent((prev) => (prev ? { ...prev, ...patch } : prev));
    setSaveState('saving');

    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => {
      persist();
    }, 800);
  };

  const handleCreate = async () => {
    if (!newReport.projectId || !newReport.date) {
      setError('Bitte Projekt und Datum wählen');
      return;
    }

    try {
      const report = await berichtService.create(newReport);
      setNewDialogOpen(false);
      await loadReports(projectFilter);
      setCurrent(report);
      setStep(0);
      setToast('Bericht angelegt');
    } catch (err: any) {
      setError(err?.response?.data?.error || 'Bericht konnte nicht angelegt werden');
    }
  };

  const handleDelete = async () => {
    if (!current) return;
    if (!window.confirm('Diesen Bericht wirklich löschen? Alle Angaben und Fotos gehen verloren.')) {
      return;
    }

    try {
      await berichtService.remove(current.id);
      setCurrent(null);
      await loadReports(projectFilter);
      setToast('Bericht gelöscht');
    } catch (err: any) {
      setError(err?.response?.data?.error || 'Bericht konnte nicht gelöscht werden');
    }
  };

  const handlePhotoUpload = async (files: FileList | null) => {
    if (!current || !files || files.length === 0) return;

    const images = Array.from(files).filter((file) => file.type.startsWith('image/'));

    if (images.length === 0) {
      setError('Keine Bilddateien gefunden');
      return;
    }

    setUploading(true);

    try {
      await berichtService.uploadPhotos(current.id, images);
      setCurrent(await berichtService.getById(current.id));
      setToast(`${images.length} Foto(s) hinzugefügt`);
    } catch (err: any) {
      setError(err?.response?.data?.error || 'Fotos konnten nicht hochgeladen werden');
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handlePhotoDelete = async (photoId: string) => {
    if (!current) return;

    try {
      await berichtService.deletePhoto(current.id, photoId);
      setCurrent(await berichtService.getById(current.id));
    } catch (err: any) {
      setError(err?.response?.data?.error || 'Foto konnte nicht gelöscht werden');
    }
  };

  const openImportDialog = () => {
    setImportFile(null);
    setImportResult(null);
    setImportProjectId(projectFilter || projects[0]?.id || '');
    setImportDialogOpen(true);
  };

  const handleImport = async () => {
    if (!importFile || !importProjectId) return;

    setImporting(true);
    setImportProgress(0);
    setImportResult(null);

    try {
      const result = await berichtService.importArchive(
        importFile,
        importProjectId,
        importSkipDuplicates,
        setImportProgress
      );
      setImportResult(result);
      await loadReports(projectFilter);
      setToast(
        result.imported === 1
          ? '1 Bericht importiert'
          : `${result.imported} Berichte importiert`
      );
    } catch (err: any) {
      setError(err?.response?.data?.error || 'Import fehlgeschlagen');
    } finally {
      setImporting(false);
    }
  };

  // --- Ordner ---

  /**
   * Vorbelegung des Ordner-Projekts: das Projekt des offenen Berichts hat
   * Vorrang — sonst legt man den Ordner neben den Berichten an, für die er
   * gedacht war, und er taucht in deren Auswahl nie auf.
   */
  const defaultFolderProjectId = () =>
    current?.projectId || projectFilter || projects[0]?.id || '';

  const openFolderDialog = (folder: BerichtFolder | null, projectId?: string) =>
    setFolderDialog({
      folder,
      name: folder?.name || '',
      projectId: folder?.projectId || projectId || defaultFolderProjectId(),
    });

  const toggleFolder = (folderId: string) => {
    setCollapsedFolders((prev) => {
      const next = new Set(prev);
      if (next.has(folderId)) {
        next.delete(folderId);
      } else {
        next.add(folderId);
      }
      return next;
    });
  };

  const saveFolder = async () => {
    if (!folderDialog) return;

    const name = folderDialog.name.trim();
    if (!name) return;

    try {
      if (folderDialog.folder) {
        await berichtService.renameFolder(folderDialog.folder.id, name);
        setToast('Ordner umbenannt');
      } else {
        if (!folderDialog.projectId) return;
        await berichtService.createFolder(folderDialog.projectId, name);
        setToast('Ordner angelegt');
      }

      setFolderDialog(null);
      await Promise.all([loadFolders(projectFilter), loadReports(projectFilter)]);
      if (current) setCurrent(await berichtService.getById(current.id));
    } catch (err: any) {
      setError(err?.response?.data?.error || 'Ordner konnte nicht gespeichert werden');
    }
  };

  const removeFolder = async (folder: BerichtFolder) => {
    const count = folder._count?.reports ?? 0;
    const question =
      count > 0
        ? `Ordner „${folder.name}" löschen? Die ${count} enthaltenen Berichte bleiben erhalten und landen in „Ohne Ordner".`
        : `Ordner „${folder.name}" löschen?`;

    if (!window.confirm(question)) return;

    try {
      await berichtService.deleteFolder(folder.id);
      setToast('Ordner gelöscht');
      await Promise.all([loadFolders(projectFilter), loadReports(projectFilter)]);
      if (current) setCurrent(await berichtService.getById(current.id));
    } catch (err: any) {
      setError(err?.response?.data?.error || 'Ordner konnte nicht gelöscht werden');
    }
  };

  /** Verschiebt den offenen Bericht in einen Ordner (oder heraus). */
  const moveCurrentToFolder = async (folderId: string) => {
    if (!current) return;

    patchCurrent({ folderId: folderId || null });

    try {
      const updated = await berichtService.update(current.id, { folderId: folderId || null });
      setCurrent(updated);
      await Promise.all([loadReports(projectFilter), loadFolders(projectFilter)]);
    } catch (err: any) {
      setError(err?.response?.data?.error || 'Bericht konnte nicht verschoben werden');
    }
  };

  /** Gesamt-Wochenbericht eines Ordners herunterladen. */
  const handleFolderExport = async (folderId: string, format: 'pdf' | 'html') => {
    setExporting(true);

    try {
      // Offene Eingaben zuerst sichern, sonst fehlen sie im Gesamtbericht.
      if (saveTimer.current) {
        clearTimeout(saveTimer.current);
        saveTimer.current = null;
        await persist();
      }

      await berichtService.downloadFolder(
        folderId,
        format,
        ehsInclude ? { year: ehsYear, month: ehsMonth, projectId: ehsProjectId || 'all' } : undefined
      );
      setToast('Gesamt-Wochenbericht wird heruntergeladen');
    } catch (err: any) {
      setError(err?.response?.data?.error || 'Export fehlgeschlagen');
    } finally {
      setExporting(false);
    }
  };

  /**
   * Ablage im Dokumenten-Modul. Der Zielpfad steht fest
   * (Rundgangsberichte / Projekt / Ordner bzw. Jahr), gewählt wird nur, was
   * abgelegt wird.
   */
  const handleAblegen = async () => {
    if (!current) return;

    setAblegenBusy(true);
    setAblegenResult(null);
    setAblegenError('');

    try {
      // Offene Eingaben zuerst sichern, sonst fehlen sie in der Ablage.
      if (saveTimer.current) {
        clearTimeout(saveTimer.current);
        saveTimer.current = null;
        await persist();
      }

      const result = await berichtService.ablegen(
        current.id,
        ablegenVariant,
        // Das ZIP trägt Rohdaten, die EHS-Auswahl gilt nur für die PDFs.
        ablegenVariant === 'archive' || !ehsInclude
          ? undefined
          : { year: ehsYear, month: ehsMonth, projectId: ehsProjectId || 'all' }
      );

      setAblegenResult(result);
    } catch (err: any) {
      setAblegenError(
        err?.response?.data?.message || err?.response?.data?.error || 'Ablage fehlgeschlagen'
      );
    } finally {
      setAblegenBusy(false);
    }
  };

  /**
   * Datenexport im Austauschformat. Anders als das Archiv enthält die Ablage
   * dieselben Dateien, legt sie aber im Dokumenten-Modul ab statt sie
   * herunterzuladen.
   */
  const handleArchiveExport = async (target: { folderId?: string; reportId?: string }) => {
    setExporting(true);

    try {
      // Offene Eingaben zuerst sichern, sonst fehlen sie im Archiv.
      if (saveTimer.current) {
        clearTimeout(saveTimer.current);
        saveTimer.current = null;
        await persist();
      }

      if (target.folderId) {
        await berichtService.downloadFolderArchive(target.folderId);
      } else if (target.reportId) {
        await berichtService.downloadArchive(target.reportId);
      }

      setToast('Datenexport wird heruntergeladen');
    } catch (err: any) {
      setError(err?.response?.data?.error || 'Datenexport fehlgeschlagen');
    } finally {
      setExporting(false);
    }
  };

  const handleExport = async (format: 'pdf' | 'html') => {
    if (!current) return;

    setExporting(true);

    try {
      // Ausstehende Änderungen zuerst sichern, sonst fehlen sie im Export
      if (saveTimer.current) {
        clearTimeout(saveTimer.current);
        saveTimer.current = null;
        await persist();
      }
      await berichtService.download(
        current.id,
        format,
        ehsInclude ? { year: ehsYear, month: ehsMonth, projectId: ehsProjectId || 'all' } : undefined
      );
      setToast(format === 'pdf' ? 'PDF wird heruntergeladen' : 'HTML wird heruntergeladen');
    } catch (err: any) {
      setError(err?.response?.data?.error || 'Export fehlgeschlagen');
    } finally {
      setExporting(false);
    }
  };

  const updateArea = (index: number, status: string) => {
    if (!current) return;
    const areas = current.areas.map((area, i) => (i === index ? { ...area, status } : area));
    patchCurrent({ areas });
  };

  const updateFinding = (index: number, patch: Partial<BerichtFinding>) => {
    if (!current) return;
    const findings = current.findings.map((finding, i) =>
      i === index ? { ...finding, ...patch } : finding
    );
    patchCurrent({ findings });
  };

  const addFinding = () => {
    if (!current) return;
    patchCurrent({ findings: [...current.findings, emptyFinding()] });
  };

  const removeFinding = (index: number) => {
    if (!current) return;
    patchCurrent({ findings: current.findings.filter((_, i) => i !== index) });
  };

  const saveLabel = useMemo(() => {
    switch (saveState) {
      case 'saving':
        return 'Speichert …';
      case 'saved':
        return 'Gespeichert';
      case 'error':
        return 'Speichern fehlgeschlagen';
      default:
        return '';
    }
  }, [saveState]);

  const projectBranding = current?.project;

  /** Berichte ohne Ordner — stehen unter den Ordnern. */
  const looseReports = reports.filter((report) => !report.folderId);

  const renderReportListItem = (report: BerichtListItem, indent: number) => (
    <ListItemButton
      key={report.id}
      selected={current?.id === report.id}
      onClick={() => selectReport(report.id)}
      sx={{ pl: indent }}
    >
      <ListItemText
        primary={
          report.titel?.trim()
            ? `${report.titel.trim()} (${report.weekday}, ${formatDate(report.date)})`
            : `${report.weekday}, ${formatDate(report.date)}`
        }
        secondary={`${report.project.name} · ${report._count.findings} Feststellung(en)`}
        primaryTypographyProps={{ variant: 'body2' }}
      />
    </ListItemButton>
  );

  const renderSidebar = () => (
    <Paper sx={{ p: 2, height: '100%' }}>
      <Button
        fullWidth
        variant="contained"
        startIcon={<AddIcon />}
        disabled={!mayCreate || projects.length === 0}
        onClick={() => {
          setNewReport((prev) => ({ ...prev, projectId: projectFilter || projects[0]?.id || '' }));
          setNewDialogOpen(true);
        }}
        sx={{ mb: 2 }}
      >
        Neuer Bericht
      </Button>

      <Button
        fullWidth
        variant="outlined"
        startIcon={<NewFolderIcon />}
        disabled={!mayCreate || projects.length === 0}
        onClick={() => openFolderDialog(null)}
        sx={{ mb: 1 }}
      >
        Neuer Ordner
      </Button>

      <Button
        fullWidth
        variant="outlined"
        startIcon={<UploadIcon />}
        disabled={!mayCreate || projects.length === 0}
        onClick={openImportDialog}
        sx={{ mb: 1 }}
      >
        Daten importieren
      </Button>

      <Button
        fullWidth
        variant="outlined"
        startIcon={<DashboardIcon />}
        onClick={() => navigate('/berichte-dashboard')}
        sx={{ mb: 2 }}
      >
        Dashboard
      </Button>

      <FormControl fullWidth size="small" sx={{ mb: 2 }}>
        <InputLabel id="bericht-project-filter">Projekt</InputLabel>
        <Select
          labelId="bericht-project-filter"
          label="Projekt"
          value={projectFilter}
          onChange={(e) => setProjectFilter(e.target.value)}
        >
          <MenuItem value="">Alle meine Projekte</MenuItem>
          {projects.map((project) => (
            <MenuItem key={project.id} value={project.id}>
              {project.name}
            </MenuItem>
          ))}
        </Select>
      </FormControl>

      <Divider sx={{ mb: 1 }} />

      {reports.length === 0 && folders.length === 0 ? (
        <Typography variant="body2" color="text.secondary" sx={{ p: 1 }}>
          Noch keine Berichte vorhanden.
        </Typography>
      ) : (
        <List dense disablePadding>
          {folders.map((folder) => {
            const inFolder = reports.filter((report) => report.folderId === folder.id);
            const open = !collapsedFolders.has(folder.id);

            return (
              <React.Fragment key={folder.id}>
                <ListItemButton onClick={() => toggleFolder(folder.id)}>
                  <ListItemIcon sx={{ minWidth: 34 }}>
                    {open ? <FolderOpenIcon fontSize="small" /> : <FolderIcon fontSize="small" />}
                  </ListItemIcon>
                  <ListItemText
                    primary={folder.name}
                    secondary={[
                      // Ohne Projektfilter stehen Ordner mehrerer Projekte
                      // untereinander — ohne den Namen ist nicht erkennbar,
                      // warum ein Ordner bei einem Bericht nicht wählbar ist.
                      projectFilter ? null : folder.project?.name,
                      `${inFolder.length} ${inFolder.length === 1 ? 'Bericht' : 'Berichte'}`,
                    ]
                      .filter(Boolean)
                      .join(' · ')}
                    primaryTypographyProps={{ fontWeight: 600 }}
                  />
                  <IconButton
                    size="small"
                    onClick={(event) => {
                      event.stopPropagation();
                      setFolderMenu({ anchor: event.currentTarget, folder });
                    }}
                  >
                    <MoreVertIcon fontSize="small" />
                  </IconButton>
                  {open ? <ExpandLessIcon fontSize="small" /> : <ExpandMoreIcon fontSize="small" />}
                </ListItemButton>

                <Collapse in={open} unmountOnExit>
                  <List dense disablePadding>
                    {inFolder.length === 0 ? (
                      <Typography variant="caption" color="text.secondary" sx={{ pl: 5, py: 0.5, display: 'block' }}>
                        Noch kein Bericht in diesem Ordner
                      </Typography>
                    ) : (
                      inFolder.map((report) => renderReportListItem(report, 4))
                    )}
                  </List>
                </Collapse>
              </React.Fragment>
            );
          })}

          {looseReports.length > 0 && (
            <>
              {folders.length > 0 && (
                <ListItemButton disabled sx={{ opacity: 1 }}>
                  <ListItemIcon sx={{ minWidth: 34 }}>
                    <PdfIcon fontSize="small" sx={{ visibility: 'hidden' }} />
                  </ListItemIcon>
                  <ListItemText
                    primary="Ohne Ordner"
                    primaryTypographyProps={{ fontWeight: 600, color: 'text.secondary' }}
                  />
                </ListItemButton>
              )}
              {looseReports.map((report) => renderReportListItem(report, folders.length > 0 ? 4 : 2))}
            </>
          )}
        </List>
      )}
    </Paper>
  );

  const renderKopfdaten = (report: Bericht) => {
    // Ordner sind projektgebunden — fremde gehören nicht in die Auswahl.
    const projectFolders = folders.filter((folder) => folder.projectId === report.projectId);

    return (
    <Card>
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
          {report.project.logoUrl ? (
            <Avatar
              variant="rounded"
              src={normalizeUploadUrl(report.project.logoUrl)}
              alt={report.project.name}
              sx={{ width: 56, height: 56, bgcolor: 'transparent' }}
            />
          ) : null}
          <Box>
            <Typography variant="h6">{report.project.name}</Typography>
            <Typography variant="body2" color="text.secondary">
              Das Projekt ist beim Anlegen festgelegt und bestimmt Logo und Farben im Export.
            </Typography>
          </Box>
        </Box>

        <Grid container spacing={2}>
          <Grid item xs={12} sm={4}>
            <FormControl fullWidth>
              <InputLabel id="bericht-weekday">Wochentag</InputLabel>
              <Select
                labelId="bericht-weekday"
                label="Wochentag"
                value={report.weekday}
                disabled={!mayEdit}
                onChange={(e) => patchCurrent({ weekday: e.target.value })}
              >
                {WEEKDAYS.map((day) => (
                  <MenuItem key={day.value} value={day.value}>
                    {day.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={12} sm={4}>
            <TextField
              fullWidth
              type="date"
              label="Datum"
              InputLabelProps={{ shrink: true }}
              value={toDateInput(report.date)}
              disabled={!mayEdit}
              onChange={(e) => patchCurrent({ date: e.target.value })}
            />
          </Grid>

          <Grid item xs={12} sm={4}>
            <TextField
              fullWidth
              label="Referent / CM"
              value={report.referent || ''}
              disabled={!mayEdit}
              onChange={(e) => patchCurrent({ referent: e.target.value })}
            />
          </Grid>

          <Grid item xs={12} sm={4}>
            <Typography variant="body2" sx={{ mb: 1 }}>
              Rundgang durchgeführt?
            </Typography>
            <ToggleButtonGroup
              exclusive
              size="small"
              value={report.rundgangDurchgefuehrt || null}
              disabled={!mayEdit}
              onChange={(_e, value) => patchCurrent({ rundgangDurchgefuehrt: value })}
            >
              <ToggleButton value="Ja" color="success">
                Ja
              </ToggleButton>
              <ToggleButton value="Nein" color="error">
                Nein
              </ToggleButton>
            </ToggleButtonGroup>
          </Grid>

          <Grid item xs={12} sm={8}>
            <TextField
              fullWidth
              label="Weitere Teilnehmer (Name / Firma)"
              value={report.weitereTeilnehmer || ''}
              disabled={!mayEdit}
              onChange={(e) => patchCurrent({ weitereTeilnehmer: e.target.value })}
            />
          </Grid>

          <Grid item xs={12} sm={8}>
            <TextField
              fullWidth
              label="Titel des Berichts (optional)"
              helperText="Steht im Export über dem Protokoll. Leer lassen für „Toolbox-Rundgang · Tagesprotokoll — …“."
              value={report.titel || ''}
              disabled={!mayEdit}
              onChange={(e) => patchCurrent({ titel: e.target.value })}
            />
          </Grid>

          <Grid item xs={12} sm={4}>
            <FormControl fullWidth disabled={!mayEdit}>
              <InputLabel id="bericht-folder">Ordner (optional)</InputLabel>
              <Select
                labelId="bericht-folder"
                label="Ordner (optional)"
                value={report.folderId || ''}
                onChange={(e) => {
                  if (e.target.value === NEW_FOLDER_OPTION) {
                    openFolderDialog(null, report.projectId);
                    return;
                  }
                  moveCurrentToFolder(e.target.value);
                }}
              >
                <MenuItem value="">Ohne Ordner</MenuItem>
                {projectFolders.map((folder) => (
                  <MenuItem key={folder.id} value={folder.id}>
                    {folder.name}
                  </MenuItem>
                ))}
                <MenuItem value={NEW_FOLDER_OPTION}>
                  <em>Neuen Ordner anlegen …</em>
                </MenuItem>
              </Select>
              <FormHelperText>
                {projectFolders.length === 0
                  ? `Für „${report.project.name}" gibt es noch keinen Ordner.`
                  : 'Klammert mehrere Tage zu einem Gesamt-Wochenbericht.'}
              </FormHelperText>
            </FormControl>
          </Grid>
        </Grid>
      </CardContent>
    </Card>
    );
  };

  const renderBereiche = (report: Bericht) => (
    <Grid container spacing={2}>
      {/* Gleiche Begruendung wie bei den Feststellungen: die IDs wechseln bei
          jedem Autosave, der Index nicht. */}
      {report.areas.map((area: BerichtArea, index: number) => (
        <Grid item xs={12} md={6} key={index}>
          <Card>
            <CardContent sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 2 }}>
              <Typography variant="body1">{area.name}</Typography>
              <ToggleButtonGroup
                exclusive
                size="small"
                value={area.status || null}
                disabled={!mayEdit}
                onChange={(_e, value) => updateArea(index, value || '')}
              >
                {AREA_STATUS.map((option) => (
                  <ToggleButton key={option.value} value={option.value} color={option.color}>
                    {option.label}
                  </ToggleButton>
                ))}
              </ToggleButtonGroup>
            </CardContent>
          </Card>
        </Grid>
      ))}
    </Grid>
  );

  const renderFotos = (report: Bericht) => (
    <Box>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        multiple
        hidden
        onChange={(e) => handlePhotoUpload(e.target.files)}
      />
      <Button
        variant="contained"
        startIcon={<PhotoCameraIcon />}
        disabled={!mayEdit || uploading}
        onClick={() => fileInputRef.current?.click()}
        sx={{ mb: 2 }}
      >
        {uploading ? 'Lädt hoch …' : 'Fotos hinzufügen'}
      </Button>

      {report.photos.length === 0 ? (
        <Typography variant="body2" color="text.secondary">
          Noch keine Fotos hochgeladen.
        </Typography>
      ) : (
        <Grid container spacing={2}>
          {report.photos.map((photo) => (
            <Grid item xs={6} sm={4} md={3} key={photo.id}>
              <Card>
                <Box
                  component="img"
                  src={berichtService.photoUrl(report.id, photo.id)}
                  alt={photo.originalName}
                  sx={{ width: '100%', height: 140, objectFit: 'cover', display: 'block' }}
                />
                <CardContent sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', py: 1 }}>
                  <Tooltip title={photo.originalName}>
                    <Typography variant="caption" noWrap sx={{ maxWidth: 120 }}>
                      {photo.originalName}
                    </Typography>
                  </Tooltip>
                  <IconButton
                    size="small"
                    disabled={!mayEdit}
                    onClick={() => handlePhotoDelete(photo.id)}
                  >
                    <DeleteIcon fontSize="small" />
                  </IconButton>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}
    </Box>
  );

  const renderFeststellungen = (report: Bericht) => (
    <Box>
      {report.findings.length === 0 && (
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          Noch keine Feststellungen erfasst. War alles in Ordnung, geht es direkt weiter zum Export.
        </Typography>
      )}

      {/*
        Key ist bewusst der Index und nicht finding.id: der Autosave schickt die
        Feststellungen komplett neu ans Backend, das sie loescht und neu anlegt
        — jede Antwort bringt also neue IDs mit. Am id-Key haengt React die
        Karte dann ab und baut sie neu auf, und das Feld, in dem gerade getippt
        wird, verliert den Fokus. Die Karten haben keinen eigenen Zustand, alle
        Felder sind kontrolliert; der Index ist hier deshalb der stabile
        Schluessel.
      */}
      {report.findings.map((finding, index) => (
        <Card key={index} sx={{ mb: 2 }}>
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
              <Chip label={`Feststellung ${index + 1}`} size="small" />
              <IconButton size="small" disabled={!mayEdit} onClick={() => removeFinding(index)}>
                <DeleteIcon fontSize="small" />
              </IconButton>
            </Box>

            <Grid container spacing={2}>
              <Grid item xs={12} md={8}>
                <TextField
                  fullWidth
                  label="Was ist aufgefallen?"
                  value={finding.feststellung || ''}
                  disabled={!mayEdit}
                  onChange={(e) => updateFinding(index, { feststellung: e.target.value })}
                />
              </Grid>

              <Grid item xs={12} md={4}>
                <TextField
                  fullWidth
                  label="Bereich"
                  value={finding.bereich || ''}
                  disabled={!mayEdit}
                  onChange={(e) => updateFinding(index, { bereich: e.target.value })}
                />
              </Grid>

              <Grid item xs={12} md={6}>
                <FormControl fullWidth>
                  <InputLabel id={`klassifizierung-${index}`}>Klassifizierung</InputLabel>
                  <Select
                    labelId={`klassifizierung-${index}`}
                    label="Klassifizierung"
                    value={finding.klassifizierung || ''}
                    disabled={!mayEdit}
                    onChange={(e) => updateFinding(index, { klassifizierung: e.target.value })}
                  >
                    <MenuItem value="">Bitte wählen</MenuItem>
                    {KLASSIFIZIERUNGEN.map((option) => (
                      <MenuItem key={option} value={option}>
                        {option}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>

              <Grid item xs={12} md={6}>
                <Typography variant="body2" sx={{ mb: 1 }}>
                  Ampel
                </Typography>
                <ToggleButtonGroup
                  exclusive
                  size="small"
                  value={finding.ampel || null}
                  disabled={!mayEdit}
                  onChange={(_e, value) => updateFinding(index, { ampel: value })}
                >
                  {AMPEL.map((option) => (
                    <ToggleButton
                      key={option.value}
                      value={option.value}
                      title={option.meaning}
                      sx={{
                        '&.Mui-selected': {
                          bgcolor: option.color,
                          color: option.textColor,
                          '&:hover': { bgcolor: option.color },
                        },
                      }}
                    >
                      {option.value}
                    </ToggleButton>
                  ))}
                </ToggleButtonGroup>
                <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5 }}>
                  {AMPEL.find((option) => option.value === finding.ampel)?.meaning ||
                    'Rot = Arbeit einstellen · Gelb = unsicherer Zustand/Handlung · Grün = erledigt'}
                </Typography>
              </Grid>

              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Massnahme"
                  value={finding.massnahme || ''}
                  disabled={!mayEdit}
                  onChange={(e) => updateFinding(index, { massnahme: e.target.value })}
                />
              </Grid>

              <Grid item xs={12} md={3}>
                <TextField
                  fullWidth
                  label="Verantwortlich"
                  value={finding.verantwortlich || ''}
                  disabled={!mayEdit}
                  onChange={(e) => updateFinding(index, { verantwortlich: e.target.value })}
                />
              </Grid>

              <Grid item xs={12} md={3}>
                <TextField
                  fullWidth
                  type="date"
                  label="Termin"
                  InputLabelProps={{ shrink: true }}
                  value={toDateInput(finding.termin)}
                  disabled={!mayEdit}
                  onChange={(e) => updateFinding(index, { termin: e.target.value })}
                />
              </Grid>

              <Grid item xs={12} md={3}>
                <FormControl fullWidth>
                  <InputLabel id={`finding-status-${index}`}>Status</InputLabel>
                  <Select
                    labelId={`finding-status-${index}`}
                    label="Status"
                    value={finding.status || ''}
                    disabled={!mayEdit}
                    onChange={(e) => updateFinding(index, { status: e.target.value })}
                  >
                    <MenuItem value="">Bitte wählen</MenuItem>
                    {FINDING_STATUS.map((option) => (
                      <MenuItem key={option} value={option}>
                        {option}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>

              <Grid item xs={12} md={3}>
                <TextField
                  fullWidth
                  type="date"
                  label="Erledigt am"
                  InputLabelProps={{ shrink: true }}
                  value={toDateInput(finding.erledigtAm)}
                  disabled={!mayEdit}
                  onChange={(e) => updateFinding(index, { erledigtAm: e.target.value })}
                />
              </Grid>

              <Grid item xs={12}>
                <Typography variant="body2" sx={{ mb: 1 }}>
                  Foto
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Box
                    onClick={() => mayEdit && setPhotoPickerIndex(index)}
                    sx={{
                      width: 120,
                      height: 90,
                      borderRadius: 1,
                      border: '1px dashed',
                      borderColor: 'divider',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      overflow: 'hidden',
                      cursor: mayEdit ? 'pointer' : 'default',
                      flexShrink: 0,
                    }}
                  >
                    {finding.photoId ? (
                      <Box
                        component="img"
                        src={berichtService.photoUrl(report.id, finding.photoId)}
                        alt="Foto"
                        sx={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      />
                    ) : (
                      <PhotoCameraIcon color="disabled" />
                    )}
                  </Box>

                  <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 0.5 }}>
                    <Button
                      size="small"
                      variant="outlined"
                      startIcon={<PhotoCameraIcon />}
                      disabled={!mayEdit || report.photos.length === 0}
                      onClick={() => setPhotoPickerIndex(index)}
                    >
                      {finding.photoId ? 'Foto ändern' : 'Foto zuordnen'}
                    </Button>
                    {finding.photoId && (
                      <Button
                        size="small"
                        color="inherit"
                        disabled={!mayEdit}
                        onClick={() => updateFinding(index, { photoId: null })}
                      >
                        Foto entfernen
                      </Button>
                    )}
                    {report.photos.length === 0 && (
                      <Typography variant="caption" color="text.secondary">
                        Erst in Schritt 3 Fotos hochladen.
                      </Typography>
                    )}
                  </Box>
                </Box>
              </Grid>

              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Kontrolle"
                  placeholder="Wer hat die Umsetzung wann kontrolliert?"
                  value={finding.kontrolle || ''}
                  disabled={!mayEdit}
                  onChange={(e) => updateFinding(index, { kontrolle: e.target.value })}
                />
              </Grid>
            </Grid>
          </CardContent>
        </Card>
      ))}

      <Button variant="outlined" startIcon={<AddIcon />} disabled={!mayEdit} onClick={addFinding}>
        Feststellung hinzufügen
      </Button>
    </Box>
  );

  const renderExport = () => (
    <Card>
      <CardContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, alignItems: 'flex-start' }}>
        <Typography variant="body1">
          Alle Angaben sind gespeichert. Der Export verwendet Logo und Farben des Projekts.
        </Typography>

        <Divider flexItem />

        <Box sx={{ width: '100%' }}>
          <FormControlLabel
            control={
              <Checkbox
                checked={ehsInclude}
                onChange={(event) => setEhsInclude(event.target.checked)}
              />
            }
            label="EHS-Auswertung anhängen"
          />
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Hängt die Sicherheitspyramide aus den Klassifizierungen dieses Berichts an, dazu die
            Jahresübersicht. Jahr und Projekt steuern die Jahresübersicht — die Pyramide zählt
            immer die Feststellungen des Dokuments.
          </Typography>

          <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
            <FormControl size="small" sx={{ minWidth: 160 }} disabled={!ehsInclude}>
              <InputLabel id="ehs-month-label">Monat</InputLabel>
              <Select
                labelId="ehs-month-label"
                label="Monat"
                value={ehsMonth}
                onChange={(event) => setEhsMonth(Number(event.target.value))}
              >
                {MONTH_NAMES.map((name, index) => (
                  <MenuItem key={name} value={index + 1}>
                    {name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <FormControl size="small" sx={{ minWidth: 120 }} disabled={!ehsInclude}>
              <InputLabel id="ehs-year-label">Jahr</InputLabel>
              <Select
                labelId="ehs-year-label"
                label="Jahr"
                value={ehsYear}
                onChange={(event) => setEhsYear(Number(event.target.value))}
              >
                {EHS_YEARS.map((year) => (
                  <MenuItem key={year} value={year}>
                    {year}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <FormControl size="small" sx={{ minWidth: 240 }} disabled={!ehsInclude}>
              <InputLabel id="ehs-project-label">Projekt</InputLabel>
              <Select
                labelId="ehs-project-label"
                label="Projekt"
                value={ehsProjectId}
                onChange={(event) => setEhsProjectId(event.target.value)}
              >
                <MenuItem value="all">Alle Projekte</MenuItem>
                {projects.map((project) => (
                  <MenuItem key={project.id} value={project.id}>
                    {project.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Box>
        </Box>

        <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
          <Button
            variant="contained"
            startIcon={exporting ? <CircularProgress size={18} color="inherit" /> : <PdfIcon />}
            disabled={exporting}
            onClick={() => handleExport('pdf')}
          >
            PDF herunterladen
          </Button>
          <Button
            variant="outlined"
            startIcon={<DownloadIcon />}
            disabled={exporting}
            onClick={() => handleExport('html')}
          >
            Als HTML herunterladen
          </Button>
        </Box>

        {current?.folder && (
          <>
            <Divider flexItem />

            <Box>
              <Typography variant="subtitle2" gutterBottom>
                Gesamt-Wochenbericht „{current.folder.name}"
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Deckblatt mit Zeitraum, Kennzahlen und Übersicht, danach jedes Tagesblatt des
                Ordners auf einer eigenen Seite. Die EHS-Auswahl oben gilt auch hier.
              </Typography>

              <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                <Button
                  variant="contained"
                  startIcon={exporting ? <CircularProgress size={18} color="inherit" /> : <WeeklyReportIcon />}
                  disabled={exporting}
                  onClick={() => handleFolderExport(current.folder!.id, 'pdf')}
                >
                  Gesamtbericht als PDF
                </Button>
                <Button
                  variant="outlined"
                  startIcon={<DownloadIcon />}
                  disabled={exporting}
                  onClick={() => handleFolderExport(current.folder!.id, 'html')}
                >
                  Gesamtbericht als HTML
                </Button>
              </Box>
            </Box>
          </>
        )}

        <Divider flexItem />

        <Box>
          <Typography variant="subtitle2" gutterBottom>
            Ablage in den Dokumenten
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Legt den Bericht als Anhang im Dokumenten-Modul ab, unter
            „Rundgangsberichte / {current?.project?.name || 'Projekt'} /{' '}
            {current?.folder?.name || new Date(current?.date || Date.now()).getFullYear()}".
            Fehlende Ordner werden angelegt.
          </Typography>

          <Button
            variant="contained"
            startIcon={<AblegenIcon />}
            disabled={!current}
            onClick={() => {
              setAblegenVariant('report-pdf');
              setAblegenResult(null);
              setAblegenError('');
              setAblegenOpen(true);
            }}
          >
            Ablegen
          </Button>
        </Box>

        <Divider flexItem />

        <Box>
          <Typography variant="subtitle2" gutterBottom>
            Datenexport
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            ZIP mit allen Feldern und den Originalfotos — dasselbe Format, das „Daten importieren"
            wieder einliest. Gedacht zum Umziehen in eine andere Instanz oder als Sicherung, nicht
            zum Verschicken: die Datei wird mit vielen Fotos schnell mehrere hundert Megabyte gross.
          </Typography>

          <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
            <Button
              variant="outlined"
              startIcon={<ArchiveIcon />}
              disabled={exporting || !current}
              onClick={() => current && handleArchiveExport({ reportId: current.id })}
            >
              Dieses Tagesblatt (ZIP)
            </Button>

            {current?.folder && (
              <Button
                variant="outlined"
                startIcon={<ArchiveIcon />}
                disabled={exporting}
                onClick={() => handleArchiveExport({ folderId: current.folder!.id })}
              >
                Ganzer Ordner „{current.folder.name}" (ZIP)
              </Button>
            )}
          </Box>
        </Box>
      </CardContent>
    </Card>
  );

  const renderEditor = (report: Bericht) => (
    <Paper sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2, gap: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Typography variant="h6">
            {report.weekday}, {formatDate(report.date)}
          </Typography>
          {projectBranding?.primaryColor && (
            <Box
              sx={{
                width: 16,
                height: 16,
                borderRadius: '50%',
                bgcolor: projectBranding.primaryColor,
                border: '1px solid rgba(0,0,0,0.2)',
              }}
            />
          )}
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Typography
            variant="caption"
            color={saveState === 'error' ? 'error' : 'text.secondary'}
          >
            {saveLabel}
          </Typography>
          <Button
            size="small"
            color="error"
            startIcon={<DeleteIcon />}
            disabled={!mayDelete}
            onClick={handleDelete}
          >
            Löschen
          </Button>
        </Box>
      </Box>

      <Stepper nonLinear activeStep={step} sx={{ mb: 3 }}>
        {STEPS.map((label, index) => (
          <Step key={label} completed={index < step}>
            <StepButton onClick={() => setStep(index)}>{label}</StepButton>
          </Step>
        ))}
      </Stepper>

      {step === 0 && renderKopfdaten(report)}
      {step === 1 && renderBereiche(report)}
      {step === 2 && renderFotos(report)}
      {step === 3 && renderFeststellungen(report)}
      {step === 4 && renderExport()}

      <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 3 }}>
        <Button
          startIcon={<ArrowBackIcon />}
          disabled={step === 0}
          onClick={() => setStep((prev) => Math.max(0, prev - 1))}
        >
          Zurück
        </Button>
        <Button
          endIcon={<ArrowForwardIcon />}
          disabled={step === STEPS.length - 1}
          onClick={() => setStep((prev) => Math.min(STEPS.length - 1, prev + 1))}
        >
          Weiter
        </Button>
      </Box>
    </Paper>
  );

  return (
    <>
      <AppNavbar title="Rundgangsberichte" />
      <Container maxWidth="xl" sx={{ py: 3 }}>
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
            <CircularProgress />
          </Box>
        ) : (
          <Grid container spacing={3}>
            <Grid item xs={12} md={3}>
              {renderSidebar()}
            </Grid>
            <Grid item xs={12} md={9}>
              {projects.length === 0 ? (
                <Alert severity="info">
                  Ihnen ist derzeit kein Projekt zugeordnet. Berichte sind immer an ein Projekt
                  gebunden — bitte wenden Sie sich an Ihren Administrator.
                </Alert>
              ) : current ? (
                renderEditor(current)
              ) : (
                <Paper sx={{ p: 4, textAlign: 'center' }}>
                  <Typography variant="body1" color="text.secondary">
                    Wählen Sie links einen Bericht aus oder legen Sie einen neuen an.
                  </Typography>
                </Paper>
              )}
            </Grid>
          </Grid>
        )}
      </Container>

      <Menu
        open={folderMenu !== null}
        anchorEl={folderMenu?.anchor}
        onClose={() => setFolderMenu(null)}
      >
        <MenuItem
          disabled={!mayEdit}
          onClick={() => {
            if (folderMenu) openFolderDialog(folderMenu.folder);
            setFolderMenu(null);
          }}
        >
          Umbenennen
        </MenuItem>
        <MenuItem
          disabled={exporting}
          onClick={() => {
            if (folderMenu) handleFolderExport(folderMenu.folder.id, 'pdf');
            setFolderMenu(null);
          }}
        >
          Gesamt-Wochenbericht (PDF)
        </MenuItem>
        <MenuItem
          disabled={exporting}
          onClick={() => {
            if (folderMenu) handleFolderExport(folderMenu.folder.id, 'html');
            setFolderMenu(null);
          }}
        >
          Gesamt-Wochenbericht (HTML)
        </MenuItem>
        <MenuItem
          disabled={exporting}
          onClick={() => {
            if (folderMenu) handleArchiveExport({ folderId: folderMenu.folder.id });
            setFolderMenu(null);
          }}
        >
          Datenexport (ZIP)
        </MenuItem>
        <Divider />
        <MenuItem
          disabled={!mayDelete}
          onClick={() => {
            if (folderMenu) removeFolder(folderMenu.folder);
            setFolderMenu(null);
          }}
        >
          Löschen
        </MenuItem>
      </Menu>

      <Dialog open={folderDialog !== null} onClose={() => setFolderDialog(null)} fullWidth maxWidth="xs">
        <DialogTitle>{folderDialog?.folder ? 'Ordner umbenennen' : 'Neuen Ordner anlegen'}</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            fullWidth
            label="Name"
            placeholder="z.B. KW 36"
            sx={{ mt: 1, mb: 2 }}
            value={folderDialog?.name || ''}
            onChange={(event) =>
              setFolderDialog((prev) => (prev ? { ...prev, name: event.target.value } : prev))
            }
            onKeyDown={(event) => {
              if (event.key === 'Enter') saveFolder();
            }}
          />

          <FormControl fullWidth disabled={folderDialog?.folder !== null}>
            <InputLabel id="folder-project">Projekt</InputLabel>
            <Select
              labelId="folder-project"
              label="Projekt"
              value={folderDialog?.projectId || ''}
              onChange={(event) =>
                setFolderDialog((prev) => (prev ? { ...prev, projectId: event.target.value } : prev))
              }
            >
              {projects.map((project) => (
                <MenuItem key={project.id} value={project.id}>
                  {project.name}
                </MenuItem>
              ))}
            </Select>
            <FormHelperText>
              {folderDialog?.folder
                ? 'Das Projekt eines bestehenden Ordners lässt sich nicht wechseln.'
                : 'Der Ordner steht nur Berichten dieses Projekts zur Auswahl.'}
            </FormHelperText>
          </FormControl>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setFolderDialog(null)}>Abbrechen</Button>
          <Button variant="contained" disabled={!folderDialog?.name.trim()} onClick={saveFolder}>
            {folderDialog?.folder ? 'Umbenennen' : 'Anlegen'}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={importDialogOpen}
        onClose={() => !importing && setImportDialogOpen(false)}
        fullWidth
        maxWidth="sm"
      >
        <DialogTitle>Daten aus dem Wochenbericht-Tool importieren</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Lade das ZIP-Archiv aus dem Wochenbericht-Tool hoch („Alle Daten exportieren"). Die
            enthaltenen Tagesblätter werden mit Bereichen, Feststellungen und Originalfotos als
            Berichte im gewählten Projekt angelegt.
          </Typography>

          <input
            ref={importInputRef}
            type="file"
            accept=".zip,application/zip"
            hidden
            onChange={(event) => {
              setImportFile(event.target.files?.[0] || null);
              setImportResult(null);
              // Zuruecksetzen, damit dieselbe Datei erneut gewaehlt werden kann.
              event.target.value = '';
            }}
          />

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
            <Button
              variant="outlined"
              startIcon={<UploadIcon />}
              disabled={importing}
              onClick={() => importInputRef.current?.click()}
            >
              Archiv wählen
            </Button>
            <Typography variant="body2" color={importFile ? 'text.primary' : 'text.secondary'}>
              {importFile
                ? `${importFile.name} (${(importFile.size / 1024 / 1024).toFixed(1)} MB)`
                : 'Keine Datei gewählt'}
            </Typography>
          </Box>

          <FormControl fullWidth sx={{ mb: 1 }} disabled={importing}>
            <InputLabel id="import-bericht-project">Zielprojekt</InputLabel>
            <Select
              labelId="import-bericht-project"
              label="Zielprojekt"
              value={importProjectId}
              onChange={(event) => setImportProjectId(event.target.value)}
            >
              {projects.map((project) => (
                <MenuItem key={project.id} value={project.id}>
                  {project.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <FormControlLabel
            control={
              <Checkbox
                checked={importSkipDuplicates}
                disabled={importing}
                onChange={(event) => setImportSkipDuplicates(event.target.checked)}
              />
            }
            label="Bereits vorhandene Berichte überspringen"
          />
          <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 1 }}>
            Erkannt an Projekt, Datum und Wochentag — so verdoppelt ein zweiter Import nichts.
          </Typography>

          {importing && (
            <Alert severity="info" icon={<CircularProgress size={18} />} sx={{ mt: 2 }}>
              {importProgress < 100
                ? `Archiv wird hochgeladen … ${importProgress}%`
                : 'Archiv wird entpackt und verarbeitet. Bei hunderten Fotos dauert das einige Minuten.'}
              <LinearProgress
                variant={importProgress < 100 ? 'determinate' : 'indeterminate'}
                value={importProgress}
                sx={{ mt: 1 }}
              />
            </Alert>
          )}

          {importResult && (
            <Alert severity={importResult.imported > 0 ? 'success' : 'warning'} sx={{ mt: 2 }}>
              <Typography variant="body2">
                {importResult.imported} Bericht(e) importiert, {importResult.skipped}{' '}
                übersprungen — {importResult.findings} Feststellung(en), {importResult.photos}{' '}
                Foto(s), {importResult.foldersCreated} neue(r) Ordner.
              </Typography>

              {importResult.droppedFields.length > 0 && (
                <Typography variant="caption" display="block" sx={{ mt: 1 }}>
                  Ohne Entsprechung in cflux und daher nicht übernommen:{' '}
                  {importResult.droppedFields.join(', ')}.
                </Typography>
              )}

              {importResult.warnings.length > 0 && (
                <Box component="ul" sx={{ m: 0, mt: 1, pl: 2 }}>
                  {importResult.warnings.slice(0, 5).map((warning) => (
                    <Typography component="li" variant="caption" key={warning}>
                      {warning}
                    </Typography>
                  ))}
                  {importResult.warnings.length > 5 && (
                    <Typography component="li" variant="caption">
                      … und {importResult.warnings.length - 5} weitere Hinweise
                    </Typography>
                  )}
                </Box>
              )}
            </Alert>
          )}
        </DialogContent>
        <DialogActions>
          <Button disabled={importing} onClick={() => setImportDialogOpen(false)}>
            {importResult ? 'Schliessen' : 'Abbrechen'}
          </Button>
          <Button
            variant="contained"
            disabled={!importFile || !importProjectId || importing}
            onClick={handleImport}
          >
            Importieren
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={ablegenOpen}
        onClose={() => !ablegenBusy && setAblegenOpen(false)}
        fullWidth
        maxWidth="sm"
      >
        <DialogTitle>In den Dokumenten ablegen</DialogTitle>
        <DialogContent>
          {ablegenResult ? (
            <Alert severity="success" sx={{ mt: 1 }}>
              <Typography variant="body2">
                „{ablegenResult.attachment.filename}" liegt jetzt unter{' '}
                <strong>{ablegenResult.path.join(' / ')}</strong>.
              </Typography>
              {ablegenResult.attachment.replacedVersion !== null && (
                <Typography variant="body2" sx={{ mt: 1 }}>
                  Eine gleichnamige Datei war schon da — sie wurde als Version{' '}
                  {ablegenResult.attachment.replacedVersion} fortgeschrieben, die alte bleibt in
                  der Versionshistorie.
                </Typography>
              )}
              {ablegenResult.createdFolders.length > 0 && (
                <Typography variant="body2" sx={{ mt: 1 }}>
                  Neu angelegt: {ablegenResult.createdFolders.join(', ')}
                </Typography>
              )}
            </Alert>
          ) : (
            <>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1, mb: 2 }}>
                Zielordner:{' '}
                <strong>
                  Rundgangsberichte / {current?.project?.name} /{' '}
                  {current?.folder?.name || new Date(current?.date || Date.now()).getFullYear()}
                </strong>
              </Typography>

              <FormControl>
                <RadioGroup
                  value={ablegenVariant}
                  onChange={(e) => setAblegenVariant(e.target.value as BerichtAblageVariant)}
                >
                  <FormControlLabel
                    value="report-pdf"
                    control={<Radio />}
                    label="Dieses Tagesblatt als PDF"
                  />
                  <FormControlLabel
                    value="folder-pdf"
                    control={<Radio />}
                    disabled={!current?.folder}
                    label={
                      current?.folder
                        ? `Gesamt-Wochenbericht „${current.folder.name}" als PDF`
                        : 'Gesamt-Wochenbericht als PDF (Bericht liegt in keinem Ordner)'
                    }
                  />
                  <FormControlLabel
                    value="archive"
                    control={<Radio />}
                    label="Datenexport (ZIP, wieder importierbar)"
                  />
                </RadioGroup>
              </FormControl>

              <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 2 }}>
                {ablegenVariant === 'archive'
                  ? 'Enthält die Originalfotos — die Datei wird schnell mehrere hundert Megabyte gross.'
                  : ehsInclude
                  ? 'Die EHS-Auswahl aus dem Export-Schritt wird mit abgelegt.'
                  : 'Ohne EHS-Anhang, entsprechend der Auswahl im Export-Schritt.'}
              </Typography>

              {ablegenError && (
                <Alert severity="error" sx={{ mt: 2 }}>
                  {ablegenError}
                </Alert>
              )}
            </>
          )}
        </DialogContent>
        <DialogActions>
          <Button disabled={ablegenBusy} onClick={() => setAblegenOpen(false)}>
            {ablegenResult ? 'Schliessen' : 'Abbrechen'}
          </Button>
          {!ablegenResult && (
            <Button
              variant="contained"
              disabled={ablegenBusy}
              startIcon={ablegenBusy ? <CircularProgress size={18} color="inherit" /> : undefined}
              onClick={handleAblegen}
            >
              Ablegen
            </Button>
          )}
        </DialogActions>
      </Dialog>

      <Dialog open={newDialogOpen} onClose={() => setNewDialogOpen(false)} fullWidth maxWidth="sm">
        <DialogTitle>Neuen Bericht anlegen</DialogTitle>
        <DialogContent>
          <FormControl fullWidth sx={{ mt: 1, mb: 2 }}>
            <InputLabel id="new-bericht-project">Projekt</InputLabel>
            <Select
              labelId="new-bericht-project"
              label="Projekt"
              value={newReport.projectId}
              onChange={(e) => setNewReport({ ...newReport, projectId: e.target.value })}
            >
              {projects.map((project) => (
                <MenuItem key={project.id} value={project.id}>
                  {project.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <FormControl fullWidth sx={{ mb: 2 }}>
            <InputLabel id="new-bericht-weekday">Wochentag</InputLabel>
            <Select
              labelId="new-bericht-weekday"
              label="Wochentag"
              value={newReport.weekday}
              onChange={(e) => setNewReport({ ...newReport, weekday: e.target.value })}
            >
              {WEEKDAYS.map((day) => (
                <MenuItem key={day.value} value={day.value}>
                  {day.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <TextField
            fullWidth
            type="date"
            label="Datum"
            InputLabelProps={{ shrink: true }}
            value={newReport.date}
            onChange={(e) => setNewReport({ ...newReport, date: e.target.value })}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setNewDialogOpen(false)}>Abbrechen</Button>
          <Button variant="contained" onClick={handleCreate}>
            Anlegen
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={photoPickerIndex !== null}
        onClose={() => setPhotoPickerIndex(null)}
        fullWidth
        maxWidth="md"
      >
        <DialogTitle>Foto auswählen</DialogTitle>
        <DialogContent dividers>
          {current && current.photos.length > 0 ? (
            <Grid container spacing={1.5}>
              {current.photos.map((photo) => {
                const selected =
                  photoPickerIndex !== null &&
                  current.findings[photoPickerIndex]?.photoId === photo.id;

                return (
                  <Grid item xs={6} sm={4} md={3} key={photo.id}>
                    <Box
                      onClick={() => {
                        if (photoPickerIndex !== null) {
                          updateFinding(photoPickerIndex, { photoId: photo.id });
                        }
                        setPhotoPickerIndex(null);
                      }}
                      sx={{
                        position: 'relative',
                        cursor: 'pointer',
                        borderRadius: 1,
                        overflow: 'hidden',
                        border: '3px solid',
                        borderColor: selected ? 'primary.main' : 'transparent',
                        '&:hover': { borderColor: 'primary.light' },
                      }}
                    >
                      <Box
                        component="img"
                        src={berichtService.photoUrl(current.id, photo.id)}
                        alt={photo.originalName}
                        sx={{ width: '100%', height: 130, objectFit: 'cover', display: 'block' }}
                      />
                      {selected && (
                        <CheckCircleIcon
                          sx={{
                            position: 'absolute',
                            top: 4,
                            right: 4,
                            color: 'primary.main',
                            bgcolor: '#fff',
                            borderRadius: '50%',
                          }}
                        />
                      )}
                    </Box>
                  </Grid>
                );
              })}
            </Grid>
          ) : (
            <Typography variant="body2" color="text.secondary">
              Noch keine Fotos vorhanden. Laden Sie in Schritt 3 Fotos hoch.
            </Typography>
          )}
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => {
              if (photoPickerIndex !== null) {
                updateFinding(photoPickerIndex, { photoId: null });
              }
              setPhotoPickerIndex(null);
            }}
          >
            Kein Foto
          </Button>
          <Button variant="contained" onClick={() => setPhotoPickerIndex(null)}>
            Schliessen
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={Boolean(error)}
        autoHideDuration={6000}
        onClose={() => setError(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert severity="error" onClose={() => setError(null)}>
          {error}
        </Alert>
      </Snackbar>

      <Snackbar
        open={Boolean(toast)}
        autoHideDuration={3000}
        onClose={() => setToast(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert severity="success" onClose={() => setToast(null)}>
          {toast}
        </Alert>
      </Snackbar>
    </>
  );
};

export default BerichtePage;
