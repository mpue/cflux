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
  Divider,
  FormControl,
  FormControlLabel,
  Grid,
  IconButton,
  InputLabel,
  List,
  ListItemButton,
  ListItemText,
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
} from '@mui/icons-material';
import AppNavbar from '../components/AppNavbar';
import { useModules } from '../contexts/ModuleContext';
import berichtService from '../services/bericht.service';
import { normalizeUploadUrl } from '../services/api';
import {
  Bericht,
  BerichtArea,
  BerichtImportResult,
  BerichtFinding,
  BerichtListItem,
  BerichtProject,
} from '../types/bericht';

const MODULE_KEY = 'berichte';

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

const AMPEL = [
  { value: 'Grün', color: '#16a34a' },
  { value: 'Gelb', color: '#f59e0b' },
  { value: 'Rot', color: '#dc2626' },
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
  enablon: '',
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
  const { canCreate, canEdit, canDelete } = useModules();
  const mayCreate = canCreate(MODULE_KEY);
  const mayEdit = canEdit(MODULE_KEY);
  const mayDelete = canDelete(MODULE_KEY);

  const [projects, setProjects] = useState<BerichtProject[]>([]);
  const [reports, setReports] = useState<BerichtListItem[]>([]);
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
      await Promise.all([loadProjects(), loadReports()]);
      setLoading(false);
    })();
  }, [loadProjects, loadReports]);

  useEffect(() => {
    loadReports(projectFilter);
  }, [projectFilter, loadReports]);

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
    setImportResult(null);

    try {
      const result = await berichtService.importArchive(
        importFile,
        importProjectId,
        importSkipDuplicates
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
        startIcon={<UploadIcon />}
        disabled={!mayCreate || projects.length === 0}
        onClick={openImportDialog}
        sx={{ mb: 2 }}
      >
        Daten importieren
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

      {reports.length === 0 ? (
        <Typography variant="body2" color="text.secondary" sx={{ p: 1 }}>
          Noch keine Berichte vorhanden.
        </Typography>
      ) : (
        <List dense disablePadding>
          {reports.map((report) => (
            <ListItemButton
              key={report.id}
              selected={current?.id === report.id}
              onClick={() => selectReport(report.id)}
            >
              <ListItemText
                primary={`${report.weekday}, ${formatDate(report.date)}`}
                secondary={`${report.project.name} · ${report._count.findings} Feststellung(en)`}
              />
            </ListItemButton>
          ))}
        </List>
      )}
    </Paper>
  );

  const renderKopfdaten = (report: Bericht) => (
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
        </Grid>
      </CardContent>
    </Card>
  );

  const renderBereiche = (report: Bericht) => (
    <Grid container spacing={2}>
      {report.areas.map((area: BerichtArea, index: number) => (
        <Grid item xs={12} md={6} key={area.id || area.name}>
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

      {report.findings.map((finding, index) => (
        <Card key={finding.id || index} sx={{ mb: 2 }}>
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
                      sx={{ '&.Mui-selected': { bgcolor: option.color, color: '#fff' } }}
                    >
                      {option.value}
                    </ToggleButton>
                  ))}
                </ToggleButtonGroup>
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
                  Beweisfoto
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
                        alt="Beweisfoto"
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
            Hängt Kennzahlen (LTIFR/TRIR), EHS-Pyramide, Jahresübersicht und die Vorfälle des
            gewählten Monats als eigenen Abschnitt hinten an den Bericht.
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
              Archiv wird verarbeitet. Bei vielen Fotos kann das eine Weile dauern.
            </Alert>
          )}

          {importResult && (
            <Alert severity={importResult.imported > 0 ? 'success' : 'warning'} sx={{ mt: 2 }}>
              <Typography variant="body2">
                {importResult.imported} Bericht(e) importiert, {importResult.skipped}{' '}
                übersprungen — {importResult.findings} Feststellung(en), {importResult.photos}{' '}
                Foto(s).
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
