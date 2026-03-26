import React, { useEffect, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControlLabel,
  Grid,
  IconButton,
  MenuItem,
  Paper,
  Switch,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tabs,
  TextField,
  Typography,
} from '@mui/material';
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
  Visibility as VisibilityIcon,
} from '@mui/icons-material';
import DOMPurify from 'dompurify';
import TipTapEditor from '../TipTapEditor';
import { locationService } from '../../services/location.service';
import { onboardingService } from '../../services/onboardingService';
import { Location } from '../../types';
import { OnboardingJob, OnboardingJobFormData } from '../../types/onboarding';

const emptyForm: OnboardingJobFormData = {
  title: '',
  description: '',
  department: '',
  employmentType: '',
  location: '',
  workload: '',
  requirements: '',
  responsibilities: '',
  benefits: '',
  salaryCurrency: 'CHF',
  isActive: true,
  sortOrder: 0,
};

const employmentTypes = ['Festanstellung', 'Teilzeit', 'Praktikum', 'Temporär', 'Lehrstelle', 'Freelance'];
type ContentTab = 'description' | 'responsibilities' | 'requirements' | 'benefits';

const OnboardingJobsSubTab: React.FC = () => {
  const [jobs, setJobs] = useState<OnboardingJob[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [selectedJob, setSelectedJob] = useState<OnboardingJob | null>(null);
  const [formData, setFormData] = useState<OnboardingJobFormData>(emptyForm);
  const [contentTab, setContentTab] = useState<ContentTab>('description');

  useEffect(() => {
    loadJobs();
    loadLocations();
  }, []);

  const loadJobs = async () => {
    try {
      setLoading(true);
      const data = await onboardingService.getJobs();
      setJobs(data);
      setError(null);
    } catch (err) {
      console.error('Error loading onboarding jobs:', err);
      setError('Fehler beim Laden der Jobs');
    } finally {
      setLoading(false);
    }
  };

  const loadLocations = async () => {
    try {
      const data = await locationService.getActiveLocations();
      setLocations(data);
    } catch (err) {
      console.error('Error loading locations:', err);
      setError('Fehler beim Laden der Standorte');
    }
  };

  const resetForm = () => {
    setFormData(emptyForm);
    setSelectedJob(null);
    setContentTab('description');
  };

  const openCreateDialog = () => {
    resetForm();
    setDialogOpen(true);
  };

  const openEditDialog = (job: OnboardingJob) => {
    setSelectedJob(job);
    setFormData({
      title: job.title,
      description: job.description || '',
      department: job.department || '',
      employmentType: job.employmentType || '',
      location: job.location || '',
      workload: job.workload || '',
      requirements: job.requirements || '',
      responsibilities: job.responsibilities || '',
      benefits: job.benefits || '',
      salaryMin: job.salaryMin,
      salaryMax: job.salaryMax,
      salaryCurrency: job.salaryCurrency,
      isActive: job.isActive,
      sortOrder: job.sortOrder,
    });
    setContentTab('description');
    setDialogOpen(true);
  };

  const openDetailsDialog = async (jobId: string) => {
    try {
      const job = await onboardingService.getJobById(jobId);
      setSelectedJob(job);
      setDetailsOpen(true);
    } catch (err) {
      console.error('Error loading onboarding job details:', err);
      setError('Fehler beim Laden der Jobdetails');
    }
  };

  const handleSave = async () => {
    try {
      setLoading(true);

      if (selectedJob) {
        await onboardingService.updateJob(selectedJob.id, formData);
        setSuccess('Job erfolgreich aktualisiert');
      } else {
        await onboardingService.createJob(formData);
        setSuccess('Job erfolgreich erstellt');
      }

      setDialogOpen(false);
      resetForm();
      await loadJobs();
    } catch (err) {
      console.error('Error saving onboarding job:', err);
      setError('Fehler beim Speichern des Jobs');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (jobId: string) => {
    if (!window.confirm('Soll dieser Job wirklich gelöscht werden?')) {
      return;
    }

    try {
      setLoading(true);
      await onboardingService.deleteJob(jobId);
      setSuccess('Job erfolgreich gelöscht');
      await loadJobs();
    } catch (err) {
      console.error('Error deleting onboarding job:', err);
      setError('Fehler beim Löschen des Jobs');
    } finally {
      setLoading(false);
    }
  };

  const formatSalary = (job: OnboardingJob) => {
    if (!job.salaryMin && !job.salaryMax) {
      return '–';
    }

    if (job.salaryMin && job.salaryMax) {
      return `${job.salaryMin.toLocaleString('de-CH')} - ${job.salaryMax.toLocaleString('de-CH')} ${job.salaryCurrency}`;
    }

    if (job.salaryMin) {
      return `ab ${job.salaryMin.toLocaleString('de-CH')} ${job.salaryCurrency}`;
    }

    return `bis ${job.salaryMax?.toLocaleString('de-CH')} ${job.salaryCurrency}`;
  };

  const renderHtml = (content?: string) => {
    if (!content) {
      return '–';
    }

    return (
      <Box
        sx={{
          '& p': { my: 0.5 },
          '& ul, & ol': { pl: 3, my: 0.5 },
          '& h1, & h2, & h3': { mt: 1.5, mb: 0.75 },
          '& table': { borderCollapse: 'collapse', width: '100%' },
          '& td, & th': { border: '1px solid', borderColor: 'divider', p: 0.75 },
        }}
        dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(content) }}
      />
    );
  };

  const handleTabChange = (_event: React.SyntheticEvent, value: ContentTab) => {
    setContentTab(value);
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h5">Jobs</Typography>
          <Typography variant="body2" color="textSecondary">
            Verwalten Sie Stellen im Onboarding separat von internen Funktionsmatrizen.
          </Typography>
        </Box>
        <Button variant="contained" startIcon={<AddIcon />} onClick={openCreateDialog}>
          Neuer Job
        </Button>
      </Box>

      {error && <Alert severity="error" onClose={() => setError(null)} sx={{ mb: 2 }}>{error}</Alert>}
      {success && <Alert severity="success" onClose={() => setSuccess(null)} sx={{ mb: 2 }}>{success}</Alert>}

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Titel</TableCell>
              <TableCell>Abteilung</TableCell>
              <TableCell>Beschäftigung</TableCell>
              <TableCell>Standort</TableCell>
              <TableCell>Pensum</TableCell>
              <TableCell>Gehalt</TableCell>
              <TableCell>Status</TableCell>
              <TableCell align="right">Aktionen</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {jobs.map((job) => (
              <TableRow key={job.id} hover>
                <TableCell>
                  <Typography variant="body2" fontWeight={600}>{job.title}</Typography>
                </TableCell>
                <TableCell>{job.department || '–'}</TableCell>
                <TableCell>{job.employmentType || '–'}</TableCell>
                <TableCell>{job.location || '–'}</TableCell>
                <TableCell>{job.workload || '–'}</TableCell>
                <TableCell>{formatSalary(job)}</TableCell>
                <TableCell>
                  <Chip label={job.isActive ? 'Aktiv' : 'Inaktiv'} size="small" color={job.isActive ? 'success' : 'default'} />
                </TableCell>
                <TableCell align="right">
                  <IconButton onClick={() => openDetailsDialog(job.id)} size="small">
                    <VisibilityIcon fontSize="small" />
                  </IconButton>
                  <IconButton onClick={() => openEditDialog(job)} size="small">
                    <EditIcon fontSize="small" />
                  </IconButton>
                  <IconButton onClick={() => handleDelete(job.id)} size="small" color="error">
                    <DeleteIcon fontSize="small" />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
            {jobs.length === 0 && (
              <TableRow>
                <TableCell colSpan={8} align="center">
                  <Typography variant="body2" color="textSecondary">
                    Noch keine Jobs vorhanden
                  </Typography>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>

      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>{selectedJob ? 'Job bearbeiten' : 'Neuen Job anlegen'}</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 0.5 }}>
            <Grid item xs={12} md={8}>
              <TextField
                fullWidth
                required
                label="Titel"
                value={formData.title || ''}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                label="Sortierung"
                type="number"
                value={formData.sortOrder ?? 0}
                onChange={(e) => setFormData({ ...formData, sortOrder: Number(e.target.value) })}
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                label="Abteilung"
                value={formData.department || ''}
                onChange={(e) => setFormData({ ...formData, department: e.target.value })}
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                select
                label="Beschäftigungsart"
                value={formData.employmentType || ''}
                onChange={(e) => setFormData({ ...formData, employmentType: e.target.value })}
              >
                <MenuItem value="">Keine Angabe</MenuItem>
                {employmentTypes.map((type) => (
                  <MenuItem key={type} value={type}>{type}</MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                select
                label="Standort"
                value={formData.location || ''}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
              >
                <MenuItem value="">Kein Standort</MenuItem>
                {locations.map((location) => (
                  <MenuItem key={location.id} value={location.name}>{location.name}</MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                label="Pensum"
                value={formData.workload || ''}
                onChange={(e) => setFormData({ ...formData, workload: e.target.value })}
                placeholder="z. B. 80-100%"
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                label="Mindestlohn"
                type="number"
                value={formData.salaryMin ?? ''}
                onChange={(e) => setFormData({ ...formData, salaryMin: e.target.value === '' ? undefined : Number(e.target.value) })}
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                label="Maximallohn"
                type="number"
                value={formData.salaryMax ?? ''}
                onChange={(e) => setFormData({ ...formData, salaryMax: e.target.value === '' ? undefined : Number(e.target.value) })}
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                label="Währung"
                value={formData.salaryCurrency || 'CHF'}
                onChange={(e) => setFormData({ ...formData, salaryCurrency: e.target.value })}
              />
            </Grid>
            <Grid item xs={12}>
              <Tabs value={contentTab} onChange={handleTabChange} sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}>
                <Tab label="Beschreibung" value="description" />
                <Tab label="Verantwortlichkeiten" value="responsibilities" />
                <Tab label="Anforderungen" value="requirements" />
                <Tab label="Benefits" value="benefits" />
              </Tabs>
              <Box sx={{ height: 360 }}>
                {contentTab === 'description' && (
                  <TipTapEditor
                    content={formData.description || ''}
                    onChange={(content) => setFormData({ ...formData, description: content })}
                  />
                )}
                {contentTab === 'responsibilities' && (
                  <TipTapEditor
                    content={formData.responsibilities || ''}
                    onChange={(content) => setFormData({ ...formData, responsibilities: content })}
                  />
                )}
                {contentTab === 'requirements' && (
                  <TipTapEditor
                    content={formData.requirements || ''}
                    onChange={(content) => setFormData({ ...formData, requirements: content })}
                  />
                )}
                {contentTab === 'benefits' && (
                  <TipTapEditor
                    content={formData.benefits || ''}
                    onChange={(content) => setFormData({ ...formData, benefits: content })}
                  />
                )}
              </Box>
            </Grid>
            <Grid item xs={12}>
              <FormControlLabel
                control={
                  <Switch
                    checked={Boolean(formData.isActive)}
                    onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                  />
                }
                label="Job ist aktiv"
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>Abbrechen</Button>
          <Button onClick={handleSave} variant="contained" disabled={loading || !formData.title?.trim()}>
            Speichern
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={detailsOpen} onClose={() => setDetailsOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>{selectedJob?.title}</DialogTitle>
        <DialogContent>
          {selectedJob && (
            <Grid container spacing={2}>
              <Grid item xs={12} md={6}>
                <Typography variant="caption" color="textSecondary">Abteilung</Typography>
                <Typography variant="body1">{selectedJob.department || '–'}</Typography>
              </Grid>
              <Grid item xs={12} md={6}>
                <Typography variant="caption" color="textSecondary">Beschäftigungsart</Typography>
                <Typography variant="body1">{selectedJob.employmentType || '–'}</Typography>
              </Grid>
              <Grid item xs={12} md={6}>
                <Typography variant="caption" color="textSecondary">Standort</Typography>
                <Typography variant="body1">{selectedJob.location || '–'}</Typography>
              </Grid>
              <Grid item xs={12} md={6}>
                <Typography variant="caption" color="textSecondary">Pensum</Typography>
                <Typography variant="body1">{selectedJob.workload || '–'}</Typography>
              </Grid>
              <Grid item xs={12}>
                <Typography variant="caption" color="textSecondary">Beschreibung</Typography>
                {renderHtml(selectedJob.description)}
              </Grid>
              <Grid item xs={12}>
                <Typography variant="caption" color="textSecondary">Verantwortlichkeiten</Typography>
                {renderHtml(selectedJob.responsibilities)}
              </Grid>
              <Grid item xs={12}>
                <Typography variant="caption" color="textSecondary">Anforderungen</Typography>
                {renderHtml(selectedJob.requirements)}
              </Grid>
              <Grid item xs={12}>
                <Typography variant="caption" color="textSecondary">Benefits</Typography>
                {renderHtml(selectedJob.benefits)}
              </Grid>
            </Grid>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDetailsOpen(false)}>Schließen</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default OnboardingJobsSubTab;