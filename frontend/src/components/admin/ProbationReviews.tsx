import { useEffect, useState } from 'react';
import {
  Box, Typography, Button, Chip, Table, TableHead, TableBody, TableRow, TableCell,
  Dialog, DialogTitle, DialogContent, DialogActions, TextField, Rating, FormControlLabel,
  Checkbox, FormControl, InputLabel, Select, MenuItem, IconButton, Tooltip, Alert, Stack,
} from '@mui/material';
import { Add, Delete, Edit } from '@mui/icons-material';
import { onboardingService } from '../../services/onboardingService';
import {
  ProbationReview, ProbationReviewType, ProbationReviewStatus, ProbationDecision,
} from '../../types/onboarding';

const typeLabels: Record<string, string> = {
  DAY_30: '30-Tage-Gespräch',
  DAY_60: '60-Tage-Gespräch',
  DAY_90: '90-Tage-Gespräch',
  FINAL: 'Abschlussgespräch',
  CUSTOM: 'Weiteres Gespräch',
};

const statusLabels: Record<string, string> = {
  SCHEDULED: 'Geplant',
  COMPLETED: 'Durchgeführt',
  OVERDUE: 'Überfällig',
  CANCELLED: 'Abgesagt',
};

const decisionLabels: Record<string, string> = {
  CONTINUE: 'Weiterbeschäftigung',
  EXTEND_PROBATION: 'Probezeit verlängern',
  TERMINATE: 'Beenden',
};

const fmtDate = (d?: string) => (d ? new Date(d).toLocaleDateString('de-CH') : '–');

// Zeigt "überfällig" an, wenn ein geplantes Gespräch in der Vergangenheit liegt.
function displayStatus(r: ProbationReview): { label: string; color: 'default' | 'success' | 'error' | 'warning' } {
  if (r.status === ProbationReviewStatus.COMPLETED) return { label: statusLabels.COMPLETED, color: 'success' };
  if (r.status === ProbationReviewStatus.CANCELLED) return { label: statusLabels.CANCELLED, color: 'default' };
  const overdue = new Date(r.scheduledDate).getTime() < Date.now();
  if (r.status === ProbationReviewStatus.OVERDUE || overdue) return { label: statusLabels.OVERDUE, color: 'error' };
  return { label: statusLabels.SCHEDULED, color: 'warning' };
}

interface Props {
  employeeId: string;
}

const emptyForm = {
  hrPresent: false,
  ratingPerformance: 0,
  ratingIntegration: 0,
  ratingCollaboration: 0,
  ratingGoals: 0,
  strengths: '',
  developmentAreas: '',
  employeeFeedback: '',
  agreements: '',
  decision: '' as '' | ProbationDecision,
};

export default function ProbationReviews({ employeeId }: Props) {
  const [reviews, setReviews] = useState<ProbationReview[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [editReview, setEditReview] = useState<ProbationReview | null>(null);
  const [form, setForm] = useState({ ...emptyForm });
  const [saving, setSaving] = useState(false);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      setReviews(await onboardingService.getProbationReviews(employeeId));
    } catch (e: any) {
      setError(e?.response?.data?.error || 'Gespräche konnten nicht geladen werden');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [employeeId]);

  const handleGenerate = async () => {
    setError(null);
    try {
      await onboardingService.generateProbationReviews(employeeId);
      await load();
    } catch (e: any) {
      setError(e?.response?.data?.error || 'Gespräche konnten nicht geplant werden');
    }
  };

  const handleAddFinal = async () => {
    setError(null);
    try {
      await onboardingService.createProbationReview({
        employeeId,
        type: ProbationReviewType.FINAL,
        scheduledDate: new Date().toISOString(),
      });
      await load();
    } catch (e: any) {
      setError(e?.response?.data?.error || 'Gespräch konnte nicht angelegt werden');
    }
  };

  const openDialog = (r: ProbationReview) => {
    setEditReview(r);
    setForm({
      hrPresent: r.hrPresent,
      ratingPerformance: r.ratingPerformance ?? 0,
      ratingIntegration: r.ratingIntegration ?? 0,
      ratingCollaboration: r.ratingCollaboration ?? 0,
      ratingGoals: r.ratingGoals ?? 0,
      strengths: r.strengths ?? '',
      developmentAreas: r.developmentAreas ?? '',
      employeeFeedback: r.employeeFeedback ?? '',
      agreements: r.agreements ?? '',
      decision: (r.decision ?? '') as '' | ProbationDecision,
    });
  };

  const buildPayload = (): Partial<ProbationReview> => ({
    hrPresent: form.hrPresent,
    ratingPerformance: form.ratingPerformance || undefined,
    ratingIntegration: form.ratingIntegration || undefined,
    ratingCollaboration: form.ratingCollaboration || undefined,
    ratingGoals: form.ratingGoals || undefined,
    strengths: form.strengths,
    developmentAreas: form.developmentAreas,
    employeeFeedback: form.employeeFeedback,
    agreements: form.agreements,
    decision: (form.decision || undefined) as ProbationDecision | undefined,
  });

  const handleSave = async (markCompleted: boolean) => {
    if (!editReview) return;
    setSaving(true);
    setError(null);
    try {
      const payload = buildPayload();
      if (markCompleted) (payload as any).status = ProbationReviewStatus.COMPLETED;
      await onboardingService.updateProbationReview(editReview.id, payload);
      setEditReview(null);
      await load();
    } catch (e: any) {
      setError(e?.response?.data?.error || 'Gespräch konnte nicht gespeichert werden');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    setError(null);
    try {
      await onboardingService.deleteProbationReview(id);
      await load();
    } catch (e: any) {
      setError(e?.response?.data?.error || 'Gespräch konnte nicht gelöscht werden');
    }
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
        <Typography variant="subtitle2">Probezeit- &amp; Feedbackgespräche</Typography>
        <Box sx={{ display: 'flex', gap: 1 }}>
          {reviews.length === 0 && (
            <Button size="small" startIcon={<Add />} onClick={handleGenerate}>
              Gespräche planen (30/60/90)
            </Button>
          )}
          <Button size="small" startIcon={<Add />} onClick={handleAddFinal}>
            Abschlussgespräch
          </Button>
        </Box>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 1 }}>{error}</Alert>}

      {!loading && reviews.length === 0 ? (
        <Typography variant="body2" color="textSecondary">
          Noch keine Gespräche geplant. Mit „Gespräche planen" werden die Termine nach 30, 60 und 90 Tagen ab Eintritt erstellt.
        </Typography>
      ) : (
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Gespräch</TableCell>
              <TableCell>Geplant</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Bewertung Ø</TableCell>
              <TableCell>Entscheid</TableCell>
              <TableCell>Durchgeführt von</TableCell>
              <TableCell align="right">Aktionen</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {reviews.map((r) => {
              const st = displayStatus(r);
              const ratings = [r.ratingPerformance, r.ratingIntegration, r.ratingCollaboration, r.ratingGoals].filter(
                (v): v is number => typeof v === 'number' && v > 0
              );
              const avg = ratings.length ? (ratings.reduce((a, b) => a + b, 0) / ratings.length).toFixed(1) : '–';
              return (
                <TableRow key={r.id}>
                  <TableCell>{typeLabels[r.type] || r.type}</TableCell>
                  <TableCell>{fmtDate(r.scheduledDate)}</TableCell>
                  <TableCell><Chip size="small" label={st.label} color={st.color} variant="outlined" /></TableCell>
                  <TableCell>{avg}</TableCell>
                  <TableCell>{r.decision ? decisionLabels[r.decision] : '–'}</TableCell>
                  <TableCell>
                    {r.conductedBy ? `${r.conductedBy.firstName} ${r.conductedBy.lastName}` : '–'}
                  </TableCell>
                  <TableCell align="right">
                    <Tooltip title="Dokumentieren">
                      <IconButton size="small" onClick={() => openDialog(r)}><Edit fontSize="small" /></IconButton>
                    </Tooltip>
                    <Tooltip title="Löschen">
                      <IconButton size="small" color="error" onClick={() => handleDelete(r.id)}><Delete fontSize="small" /></IconButton>
                    </Tooltip>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      )}

      <Dialog open={!!editReview} onClose={() => setEditReview(null)} maxWidth="sm" fullWidth>
        <DialogTitle>
          {editReview ? (typeLabels[editReview.type] || editReview.type) : ''} dokumentieren
        </DialogTitle>
        <DialogContent dividers>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <FormControlLabel
              control={<Checkbox checked={form.hrPresent} onChange={(e) => setForm({ ...form, hrPresent: e.target.checked })} />}
              label="HR beim Gespräch anwesend"
            />

            {([
              ['ratingPerformance', 'Fachliche Leistung'],
              ['ratingIntegration', 'Integration ins Team'],
              ['ratingCollaboration', 'Zusammenarbeit'],
              ['ratingGoals', 'Zielerreichung'],
            ] as const).map(([key, label]) => (
              <Box key={key} sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="body2">{label}</Typography>
                <Rating
                  value={(form as any)[key]}
                  onChange={(_, v) => setForm({ ...form, [key]: v || 0 })}
                />
              </Box>
            ))}

            <TextField label="Stärken" multiline minRows={2} value={form.strengths}
              onChange={(e) => setForm({ ...form, strengths: e.target.value })} fullWidth />
            <TextField label="Entwicklungsfelder" multiline minRows={2} value={form.developmentAreas}
              onChange={(e) => setForm({ ...form, developmentAreas: e.target.value })} fullWidth />
            <TextField label="Rückmeldung / Zufriedenheit des Mitarbeitenden" multiline minRows={2} value={form.employeeFeedback}
              onChange={(e) => setForm({ ...form, employeeFeedback: e.target.value })} fullWidth />
            <TextField label="Vereinbarungen / nächste Schritte" multiline minRows={2} value={form.agreements}
              onChange={(e) => setForm({ ...form, agreements: e.target.value })} fullWidth />

            <FormControl fullWidth>
              <InputLabel>Entscheid</InputLabel>
              <Select
                label="Entscheid"
                value={form.decision}
                onChange={(e) => setForm({ ...form, decision: e.target.value as '' | ProbationDecision })}
              >
                <MenuItem value=""><em>– kein Entscheid –</em></MenuItem>
                {Object.entries(decisionLabels).map(([k, v]) => (
                  <MenuItem key={k} value={k}>{v}</MenuItem>
                ))}
              </Select>
            </FormControl>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditReview(null)} disabled={saving}>Abbrechen</Button>
          <Button onClick={() => handleSave(false)} disabled={saving}>Speichern</Button>
          <Button variant="contained" onClick={() => handleSave(true)} disabled={saving}>
            Als durchgeführt markieren
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
