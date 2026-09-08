import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Alert,
  Box,
  Card,
  CardContent,
  CircularProgress,
  Container,
  FormControl,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from '@mui/material';
import Button from '@mui/material/Button';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import AppNavbar from '../components/AppNavbar';
import berichtService from '../services/bericht.service';
import { BerichtDashboard, BerichtProject } from '../types/bericht';

const MONTH_SHORT = [
  'Jan', 'Feb', 'Mär', 'Apr', 'Mai', 'Jun',
  'Jul', 'Aug', 'Sep', 'Okt', 'Nov', 'Dez',
];

/** Auswahl im Kopf: aktuelles Jahr plus die vier vorangegangenen. */
const YEARS = Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i);

const AMPEL_COLORS = { rot: '#dc2626', gelb: '#f59e0b', gruen: '#16a34a' };

const formatDate = (value?: string | null): string =>
  value ? new Date(value).toLocaleDateString('de-CH') : '';

/** Eine Kennzahl des Kopfbereichs. */
const Kennzahl: React.FC<{ value: number; label: string; color?: string }> = ({
  value,
  label,
  color,
}) => (
  <Card sx={{ flex: '1 1 150px', minWidth: 140 }}>
    <CardContent sx={{ textAlign: 'center', py: 2, '&:last-child': { pb: 2 } }}>
      <Typography variant="h4" sx={{ fontWeight: 700, color: color || 'primary.main', lineHeight: 1.2 }}>
        {value}
      </Typography>
      <Typography variant="body2" color="text.secondary">
        {label}
      </Typography>
    </CardContent>
  </Card>
);

/**
 * Sicherheitspyramide als SVG: je Klassifizierung eine Trapezstufe, zusammen
 * ein Dreieck — Spitze oben ist die schwerste Stufe. Gleiche Geometrie wie im
 * Export, damit Dashboard und Bericht dasselbe Bild zeigen.
 */
const Pyramide: React.FC<{ levels: BerichtDashboard['pyramid']['levels'] }> = ({ levels }) => {
  const WIDTH = 940;
  const TOP = 16;
  const BAND = 46;
  const GAP = 3;
  const HALF_BASE = 235;
  const HALF_APEX = 20;
  const CX = 258;
  const LABEL_X = 530;
  const HEIGHT = TOP + levels.length * BAND + 16;

  /** Halbe Breite des Dreiecks auf Höhe y — linear von Spitze zur Basis. */
  const halfWidth = (y: number): number => {
    const span = levels.length * BAND;
    const ratio = span === 0 ? 0 : (y - TOP) / span;
    return HALF_APEX + (HALF_BASE - HALF_APEX) * Math.min(Math.max(ratio, 0), 1);
  };

  return (
    <Box
      component="svg"
      viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
      sx={{ display: 'block', width: '100%', height: 'auto', maxWidth: 760, mx: 'auto' }}
    >
      {levels.map((level, index) => {
        const top = TOP + index * BAND;
        const bottom = top + BAND - GAP;
        const halfTop = halfWidth(top);
        const halfBottom = halfWidth(bottom);
        const midY = top + (BAND - GAP) / 2;

        return (
          <g key={level.key}>
            <polygon
              points={`${CX - halfTop},${top} ${CX + halfTop},${top} ${CX + halfBottom},${bottom} ${
                CX - halfBottom
              },${bottom}`}
              fill={level.color}
            />
            <text x={CX} y={midY + 6} textAnchor="middle" fill="#fff" fontSize="17" fontWeight="bold">
              {level.count}
            </text>
            <line
              x1={CX + halfBottom + 8}
              y1={midY}
              x2={LABEL_X - 8}
              y2={midY}
              stroke="#cfc6b8"
              strokeWidth="1"
            />
            <text x={LABEL_X} y={midY + 6} fontSize="17" fill="currentColor">
              {level.label}
            </text>
          </g>
        );
      })}
    </Box>
  );
};

const BerichteDashboardPage: React.FC = () => {
  const navigate = useNavigate();

  const [projects, setProjects] = useState<BerichtProject[]>([]);
  const [projectId, setProjectId] = useState('');
  const [year, setYear] = useState(() => new Date().getFullYear());
  const [data, setData] = useState<BerichtDashboard | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    berichtService
      .getProjects()
      .then(setProjects)
      .catch(() => setProjects([]));
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');

    try {
      setData(await berichtService.getDashboard(year, projectId || null));
    } catch (err: any) {
      setError(err?.response?.data?.error || 'Auswertung konnte nicht geladen werden');
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [year, projectId]);

  useEffect(() => {
    load();
  }, [load]);

  /** Höchster Monatswert — Bezugsgrösse für die Balkenhöhen im Jahresverlauf. */
  const monthMax = useMemo(() => {
    if (!data) return 0;
    return Math.max(
      1,
      ...Array.from({ length: 12 }, (_, i) =>
        data.ampelByMonth.rot[i] + data.ampelByMonth.gelb[i] + data.ampelByMonth.gruen[i]
      )
    );
  }, [data]);

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'background.default' }}>
      <AppNavbar title="Auswertung Rundgangsberichte" />

      <Container maxWidth="xl" sx={{ py: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3, flexWrap: 'wrap' }}>
          <Button startIcon={<ArrowBackIcon />} onClick={() => navigate('/berichte')}>
            Zurück zu den Berichten
          </Button>

          <Box sx={{ flexGrow: 1 }} />

          <FormControl size="small" sx={{ minWidth: 240 }}>
            <InputLabel id="dashboard-project">Projekt</InputLabel>
            <Select
              labelId="dashboard-project"
              label="Projekt"
              value={projectId}
              onChange={(e) => setProjectId(e.target.value)}
            >
              <MenuItem value="">Alle meine Projekte</MenuItem>
              {projects.map((project) => (
                <MenuItem key={project.id} value={project.id}>
                  {project.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <FormControl size="small" sx={{ minWidth: 120 }}>
            <InputLabel id="dashboard-year">Jahr</InputLabel>
            <Select
              labelId="dashboard-year"
              label="Jahr"
              value={year}
              onChange={(e) => setYear(Number(e.target.value))}
            >
              {YEARS.map((value) => (
                <MenuItem key={value} value={value}>
                  {value}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Box>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
            <CircularProgress />
          </Box>
        ) : !data ? null : (
          <>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              {data.projectName || 'Alle Projekte'} · {data.year} · gezählt werden die
              Feststellungen der Rundgangsberichte, nicht die Vorfälle aus dem Incident-Modul.
            </Typography>

            <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', mb: 3 }}>
              <Kennzahl value={data.kennzahlen.reports} label="Tagesblätter" />
              <Kennzahl value={data.kennzahlen.findings} label="Feststellungen" />
              <Kennzahl value={data.kennzahlen.ampel.rot} label="Ampel rot" color={AMPEL_COLORS.rot} />
              <Kennzahl value={data.kennzahlen.ampel.gelb} label="Ampel gelb" color={AMPEL_COLORS.gelb} />
              <Kennzahl value={data.kennzahlen.ampel.gruen} label="Ampel grün" color={AMPEL_COLORS.gruen} />
              <Kennzahl value={data.kennzahlen.offeneMassnahmen} label="offene Massnahmen" />
              <Kennzahl value={data.kennzahlen.photos} label="Fotos" />
            </Box>

            <Card sx={{ mb: 3 }}>
              <CardContent>
                <Typography variant="h6" sx={{ mb: 0.5 }}>
                  Sicherheitspyramide
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  {data.pyramid.total} Feststellungen im Jahr
                  {data.pyramid.unclassified > 0
                    ? `, davon ${data.pyramid.unclassified} ohne Klassifizierung`
                    : ''}
                  .
                </Typography>

                {data.pyramid.total === 0 ? (
                  <Typography variant="body2" color="text.secondary">
                    Für diesen Zeitraum sind keine Feststellungen erfasst.
                  </Typography>
                ) : (
                  <Pyramide levels={data.pyramid.levels} />
                )}
              </CardContent>
            </Card>

            <Card sx={{ mb: 3 }}>
              <CardContent>
                <Typography variant="h6" sx={{ mb: 0.5 }}>
                  Ampelverlauf {data.year}
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  Feststellungen je Monat, gestapelt nach Ampelstufe.
                </Typography>

                <Box sx={{ display: 'flex', alignItems: 'flex-end', gap: 1, height: 180 }}>
                  {MONTH_SHORT.map((label, index) => {
                    const rot = data.ampelByMonth.rot[index];
                    const gelb = data.ampelByMonth.gelb[index];
                    const gruen = data.ampelByMonth.gruen[index];
                    const total = rot + gelb + gruen;

                    return (
                      <Box
                        key={label}
                        sx={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center' }}
                      >
                        <Typography variant="caption" color="text.secondary">
                          {total || ''}
                        </Typography>
                        <Box
                          title={`${label}: ${rot} rot, ${gelb} gelb, ${gruen} grün`}
                          sx={{
                            width: '100%',
                            height: `${(total / monthMax) * 130}px`,
                            display: 'flex',
                            flexDirection: 'column',
                            justifyContent: 'flex-end',
                            borderRadius: '3px 3px 0 0',
                            overflow: 'hidden',
                            bgcolor: total ? 'transparent' : 'action.hover',
                            minHeight: total ? 0 : 2,
                          }}
                        >
                          {([
                            ['rot', rot],
                            ['gelb', gelb],
                            ['gruen', gruen],
                          ] as const).map(([key, count]) => (
                            <Box
                              key={key}
                              sx={{
                                height: total ? `${(count / total) * 100}%` : 0,
                                bgcolor: AMPEL_COLORS[key],
                              }}
                            />
                          ))}
                        </Box>
                        <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5 }}>
                          {label}
                        </Typography>
                      </Box>
                    );
                  })}
                </Box>
              </CardContent>
            </Card>

            <Card sx={{ mb: 3 }}>
              <CardContent>
                <Typography variant="h6" sx={{ mb: 2 }}>
                  Jahresübersicht — Klassifizierung nach Monat
                </Typography>

                <TableContainer component={Paper} variant="outlined" sx={{ overflowX: 'auto' }}>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell sx={{ minWidth: 220 }}>Klassifizierung</TableCell>
                        {MONTH_SHORT.map((month) => (
                          <TableCell key={month} align="center">
                            {month}
                          </TableCell>
                        ))}
                        <TableCell align="center">Gesamt</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {data.matrix.rows.map((row) => (
                        <TableRow key={row.key} hover>
                          <TableCell sx={{ fontWeight: row.total > 0 ? 600 : 400 }}>
                            {row.label}
                          </TableCell>
                          {row.counts.map((count, index) => (
                            <TableCell key={index} align="center">
                              {count || '–'}
                            </TableCell>
                          ))}
                          <TableCell align="center" sx={{ fontWeight: 700 }}>
                            {row.total || '–'}
                          </TableCell>
                        </TableRow>
                      ))}
                      <TableRow>
                        <TableCell sx={{ fontWeight: 700 }}>Summe</TableCell>
                        {data.matrix.monthTotals.map((total, index) => (
                          <TableCell key={index} align="center" sx={{ fontWeight: 700 }}>
                            {total || '–'}
                          </TableCell>
                        ))}
                        <TableCell align="center" sx={{ fontWeight: 700 }}>
                          {data.matrix.grandTotal}
                        </TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </TableContainer>
              </CardContent>
            </Card>

            <Card>
              <CardContent>
                <Typography variant="h6" sx={{ mb: 2 }}>
                  Wochenberichte {data.year}
                </Typography>

                {data.folders.length === 0 ? (
                  <Typography variant="body2" color="text.secondary">
                    Für dieses Jahr sind keine Berichte erfasst.
                  </Typography>
                ) : (
                  <TableContainer component={Paper} variant="outlined" sx={{ overflowX: 'auto' }}>
                    <Table size="small">
                      <TableHead>
                        <TableRow>
                          <TableCell>Ordner</TableCell>
                          <TableCell>Zeitraum</TableCell>
                          <TableCell align="center">Tagesblätter</TableCell>
                          <TableCell align="center">Feststellungen</TableCell>
                          <TableCell align="center">Rot</TableCell>
                          <TableCell align="center">Gelb</TableCell>
                          <TableCell align="center">Grün</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {data.folders.map((folder) => (
                          <TableRow key={folder.id || 'ohne-ordner'} hover>
                            <TableCell>{folder.name}</TableCell>
                            <TableCell>
                              {folder.from === folder.to
                                ? formatDate(folder.from)
                                : `${formatDate(folder.from)} – ${formatDate(folder.to)}`}
                            </TableCell>
                            <TableCell align="center">{folder.reports}</TableCell>
                            <TableCell align="center">{folder.findings}</TableCell>
                            <TableCell align="center" sx={{ color: AMPEL_COLORS.rot, fontWeight: 600 }}>
                              {folder.ampel.rot || '–'}
                            </TableCell>
                            <TableCell align="center" sx={{ color: AMPEL_COLORS.gelb, fontWeight: 600 }}>
                              {folder.ampel.gelb || '–'}
                            </TableCell>
                            <TableCell align="center" sx={{ color: AMPEL_COLORS.gruen, fontWeight: 600 }}>
                              {folder.ampel.gruen || '–'}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                )}
              </CardContent>
            </Card>
          </>
        )}
      </Container>
    </Box>
  );
};

export default BerichteDashboardPage;
