import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Chip,
  Grid,
  MenuItem,
  FormControlLabel,
  Switch,
  Tabs,
  Tab,
  Alert,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Visibility as ViewIcon,
  People as PeopleIcon,
} from '@mui/icons-material';
import { JobFunction } from '../types';
import api from '../services/api';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;
  return (
    <div hidden={value !== index} {...other}>
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

const JobFunctionsPage: React.FC = () => {
  const [jobFunctions, setJobFunctions] = useState<JobFunction[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  
  const [openDialog, setOpenDialog] = useState(false);
  const [openViewDialog, setOpenViewDialog] = useState(false);
  const [selectedJobFunction, setSelectedJobFunction] = useState<JobFunction | null>(null);
  const [tabValue, setTabValue] = useState(0);
  
  const [formData, setFormData] = useState({
    title: '',
    titleEn: '',
    description: '',
    descriptionEn: '',
    requirements: '',
    requirementsEn: '',
    qualifications: '',
    qualificationsEn: '',
    responsibilities: '',
    responsibilitiesEn: '',
    department: '',
    level: '',
    category: '',
    salaryMin: '',
    salaryMax: '',
    salaryCurrency: 'CHF',
    isActive: true,
  });

  const levels = ['Junior', 'Medior', 'Senior', 'Lead', 'Manager', 'Director'];
  const categories = ['IT', 'HR', 'Finance', 'Operations', 'Sales', 'Marketing', 'Administration'];

  useEffect(() => {
    loadJobFunctions();
  }, []);

  const loadJobFunctions = async () => {
    setLoading(true);
    try {
      const response = await api.get('/job-functions');
      setJobFunctions(response.data);
      setError(null);
    } catch (err) {
      setError('Fehler beim Laden der Funktionen');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDialog = (jobFunction?: JobFunction) => {
    if (jobFunction) {
      setFormData({
        title: jobFunction.title,
        titleEn: jobFunction.titleEn || '',
        description: jobFunction.description || '',
        descriptionEn: jobFunction.descriptionEn || '',
        requirements: jobFunction.requirements || '',
        requirementsEn: jobFunction.requirementsEn || '',
        qualifications: jobFunction.qualifications || '',
        qualificationsEn: jobFunction.qualificationsEn || '',
        responsibilities: jobFunction.responsibilities || '',
        responsibilitiesEn: jobFunction.responsibilitiesEn || '',
        department: jobFunction.department || '',
        level: jobFunction.level || '',
        category: jobFunction.category || '',
        salaryMin: jobFunction.salaryMin?.toString() || '',
        salaryMax: jobFunction.salaryMax?.toString() || '',
        salaryCurrency: jobFunction.salaryCurrency || 'CHF',
        isActive: jobFunction.isActive,
      });
      setSelectedJobFunction(jobFunction);
    } else {
      setFormData({
        title: '',
        titleEn: '',
        description: '',
        descriptionEn: '',
        requirements: '',
        requirementsEn: '',
        qualifications: '',
        qualificationsEn: '',
        responsibilities: '',
        responsibilitiesEn: '',
        department: '',
        level: '',
        category: '',
        salaryMin: '',
        salaryMax: '',
        salaryCurrency: 'CHF',
        isActive: true,
      });
      setSelectedJobFunction(null);
    }
    setTabValue(0);
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setSelectedJobFunction(null);
  };

  const handleViewJobFunction = async (id: string) => {
    try {
      const response = await api.get(`/job-functions/${id}`);
      setSelectedJobFunction(response.data);
      setOpenViewDialog(true);
    } catch (err) {
      setError('Fehler beim Laden der Funktionsdetails');
      console.error(err);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const data = {
        ...formData,
        salaryMin: formData.salaryMin ? parseFloat(formData.salaryMin) : undefined,
        salaryMax: formData.salaryMax ? parseFloat(formData.salaryMax) : undefined,
      };

      if (selectedJobFunction) {
        await api.put(`/job-functions/${selectedJobFunction.id}`, data);
        setSuccess('Funktion erfolgreich aktualisiert');
      } else {
        await api.post('/job-functions', data);
        setSuccess('Funktion erfolgreich erstellt');
      }
      
      handleCloseDialog();
      loadJobFunctions();
    } catch (err) {
      setError('Fehler beim Speichern der Funktion');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Möchten Sie diese Funktion wirklich löschen?')) {
      return;
    }

    setLoading(true);
    try {
      await api.delete(`/job-functions/${id}`);
      setSuccess('Funktion erfolgreich gelöscht');
      loadJobFunctions();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Fehler beim Löschen der Funktion');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (min?: number, max?: number, currency: string = 'CHF') => {
    if (!min && !max) return '-';
    if (min && max) {
      return `${min.toLocaleString('de-CH')} - ${max.toLocaleString('de-CH')} ${currency}`;
    }
    if (min) return `ab ${min.toLocaleString('de-CH')} ${currency}`;
    if (max) return `bis ${max.toLocaleString('de-CH')} ${currency}`;
    return '-';
  };

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4">Funktionen</Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => handleOpenDialog()}
        >
          Neue Funktion
        </Button>
      </Box>

      {error && <Alert severity="error" onClose={() => setError(null)} sx={{ mb: 2 }}>{error}</Alert>}
      {success && <Alert severity="success" onClose={() => setSuccess(null)} sx={{ mb: 2 }}>{success}</Alert>}

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Titel</TableCell>
              <TableCell>Kategorie</TableCell>
              <TableCell>Abteilung</TableCell>
              <TableCell>Level</TableCell>
              <TableCell>Gehaltsspanne</TableCell>
              <TableCell>Mitarbeiter</TableCell>
              <TableCell>Status</TableCell>
              <TableCell align="right">Aktionen</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {jobFunctions.map((jobFunction) => (
              <TableRow key={jobFunction.id}>
                <TableCell>
                  <Typography variant="body2" fontWeight="medium">
                    {jobFunction.title}
                  </Typography>
                  {jobFunction.titleEn && (
                    <Typography variant="caption" color="textSecondary">
                      {jobFunction.titleEn}
                    </Typography>
                  )}
                </TableCell>
                <TableCell>{jobFunction.category || '-'}</TableCell>
                <TableCell>{jobFunction.department || '-'}</TableCell>
                <TableCell>{jobFunction.level || '-'}</TableCell>
                <TableCell>
                  {formatCurrency(jobFunction.salaryMin, jobFunction.salaryMax, jobFunction.salaryCurrency)}
                </TableCell>
                <TableCell>
                  <Chip
                    icon={<PeopleIcon />}
                    label={jobFunction._count?.employees || 0}
                    size="small"
                    color={jobFunction._count && jobFunction._count.employees > 0 ? 'primary' : 'default'}
                  />
                </TableCell>
                <TableCell>
                  <Chip
                    label={jobFunction.isActive ? 'Aktiv' : 'Inaktiv'}
                    color={jobFunction.isActive ? 'success' : 'default'}
                    size="small"
                  />
                </TableCell>
                <TableCell align="right">
                  <IconButton
                    size="small"
                    onClick={() => handleViewJobFunction(jobFunction.id)}
                    title="Ansehen"
                  >
                    <ViewIcon />
                  </IconButton>
                  <IconButton
                    size="small"
                    onClick={() => handleOpenDialog(jobFunction)}
                    title="Bearbeiten"
                  >
                    <EditIcon />
                  </IconButton>
                  <IconButton
                    size="small"
                    onClick={() => handleDelete(jobFunction.id)}
                    title="Löschen"
                    color="error"
                  >
                    <DeleteIcon />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
            {jobFunctions.length === 0 && (
              <TableRow>
                <TableCell colSpan={8} align="center">
                  <Typography variant="body2" color="textSecondary">
                    Keine Funktionen vorhanden
                  </Typography>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Create/Edit Dialog */}
      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="md" fullWidth>
        <form onSubmit={handleSubmit}>
          <DialogTitle>
            {selectedJobFunction ? 'Funktion bearbeiten' : 'Neue Funktion'}
          </DialogTitle>
          <DialogContent>
            <Tabs value={tabValue} onChange={(e, v) => setTabValue(v)} sx={{ mb: 2 }}>
              <Tab label="Grunddaten" />
              <Tab label="Beschreibung" />
              <Tab label="Anforderungen" />
            </Tabs>

            <TabPanel value={tabValue} index={0}>
              <Grid container spacing={2}>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Titel (DE)"
                    required
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Titel (EN)"
                    value={formData.titleEn}
                    onChange={(e) => setFormData({ ...formData, titleEn: e.target.value })}
                  />
                </Grid>
                <Grid item xs={12} md={4}>
                  <TextField
                    fullWidth
                    select
                    label="Kategorie"
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  >
                    <MenuItem value="">Keine</MenuItem>
                    {categories.map((cat) => (
                      <MenuItem key={cat} value={cat}>{cat}</MenuItem>
                    ))}
                  </TextField>
                </Grid>
                <Grid item xs={12} md={4}>
                  <TextField
                    fullWidth
                    label="Abteilung"
                    value={formData.department}
                    onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                  />
                </Grid>
                <Grid item xs={12} md={4}>
                  <TextField
                    fullWidth
                    select
                    label="Level"
                    value={formData.level}
                    onChange={(e) => setFormData({ ...formData, level: e.target.value })}
                  >
                    <MenuItem value="">Keines</MenuItem>
                    {levels.map((lvl) => (
                      <MenuItem key={lvl} value={lvl}>{lvl}</MenuItem>
                    ))}
                  </TextField>
                </Grid>
                <Grid item xs={12} md={4}>
                  <TextField
                    fullWidth
                    type="number"
                    label="Min. Gehalt"
                    value={formData.salaryMin}
                    onChange={(e) => setFormData({ ...formData, salaryMin: e.target.value })}
                  />
                </Grid>
                <Grid item xs={12} md={4}>
                  <TextField
                    fullWidth
                    type="number"
                    label="Max. Gehalt"
                    value={formData.salaryMax}
                    onChange={(e) => setFormData({ ...formData, salaryMax: e.target.value })}
                  />
                </Grid>
                <Grid item xs={12} md={4}>
                  <TextField
                    fullWidth
                    label="Währung"
                    value={formData.salaryCurrency}
                    onChange={(e) => setFormData({ ...formData, salaryCurrency: e.target.value })}
                  />
                </Grid>
                <Grid item xs={12}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={formData.isActive}
                        onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                      />
                    }
                    label="Aktiv"
                  />
                </Grid>
              </Grid>
            </TabPanel>

            <TabPanel value={tabValue} index={1}>
              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    multiline
                    rows={4}
                    label="Beschreibung (DE)"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    multiline
                    rows={4}
                    label="Beschreibung (EN)"
                    value={formData.descriptionEn}
                    onChange={(e) => setFormData({ ...formData, descriptionEn: e.target.value })}
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    multiline
                    rows={4}
                    label="Verantwortlichkeiten (DE)"
                    value={formData.responsibilities}
                    onChange={(e) => setFormData({ ...formData, responsibilities: e.target.value })}
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    multiline
                    rows={4}
                    label="Verantwortlichkeiten (EN)"
                    value={formData.responsibilitiesEn}
                    onChange={(e) => setFormData({ ...formData, responsibilitiesEn: e.target.value })}
                  />
                </Grid>
              </Grid>
            </TabPanel>

            <TabPanel value={tabValue} index={2}>
              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    multiline
                    rows={4}
                    label="Anforderungen (DE)"
                    value={formData.requirements}
                    onChange={(e) => setFormData({ ...formData, requirements: e.target.value })}
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    multiline
                    rows={4}
                    label="Anforderungen (EN)"
                    value={formData.requirementsEn}
                    onChange={(e) => setFormData({ ...formData, requirementsEn: e.target.value })}
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    multiline
                    rows={4}
                    label="Qualifikationen (DE)"
                    value={formData.qualifications}
                    onChange={(e) => setFormData({ ...formData, qualifications: e.target.value })}
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    multiline
                    rows={4}
                    label="Qualifikationen (EN)"
                    value={formData.qualificationsEn}
                    onChange={(e) => setFormData({ ...formData, qualificationsEn: e.target.value })}
                  />
                </Grid>
              </Grid>
            </TabPanel>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCloseDialog}>Abbrechen</Button>
            <Button type="submit" variant="contained" disabled={loading}>
              {loading ? 'Speichern...' : 'Speichern'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>

      {/* View Dialog */}
      <Dialog open={openViewDialog} onClose={() => setOpenViewDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle>{selectedJobFunction?.title}</DialogTitle>
        <DialogContent>
          {selectedJobFunction && (
            <Box>
              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <Typography variant="caption" color="textSecondary">Kategorie</Typography>
                  <Typography variant="body1">{selectedJobFunction.category || '-'}</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="caption" color="textSecondary">Abteilung</Typography>
                  <Typography variant="body1">{selectedJobFunction.department || '-'}</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="caption" color="textSecondary">Level</Typography>
                  <Typography variant="body1">{selectedJobFunction.level || '-'}</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="caption" color="textSecondary">Gehaltsspanne</Typography>
                  <Typography variant="body1">
                    {formatCurrency(
                      selectedJobFunction.salaryMin,
                      selectedJobFunction.salaryMax,
                      selectedJobFunction.salaryCurrency
                    )}
                  </Typography>
                </Grid>
                {selectedJobFunction.description && (
                  <Grid item xs={12}>
                    <Typography variant="caption" color="textSecondary">Beschreibung</Typography>
                    <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>
                      {selectedJobFunction.description}
                    </Typography>
                  </Grid>
                )}
                {selectedJobFunction.responsibilities && (
                  <Grid item xs={12}>
                    <Typography variant="caption" color="textSecondary">Verantwortlichkeiten</Typography>
                    <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>
                      {selectedJobFunction.responsibilities}
                    </Typography>
                  </Grid>
                )}
                {selectedJobFunction.requirements && (
                  <Grid item xs={12}>
                    <Typography variant="caption" color="textSecondary">Anforderungen</Typography>
                    <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>
                      {selectedJobFunction.requirements}
                    </Typography>
                  </Grid>
                )}
                {selectedJobFunction.qualifications && (
                  <Grid item xs={12}>
                    <Typography variant="caption" color="textSecondary">Qualifikationen</Typography>
                    <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>
                      {selectedJobFunction.qualifications}
                    </Typography>
                  </Grid>
                )}
                {selectedJobFunction.employees && selectedJobFunction.employees.length > 0 && (
                  <Grid item xs={12}>
                    <Typography variant="caption" color="textSecondary">
                      Zugewiesene Mitarbeiter ({selectedJobFunction.employees.length})
                    </Typography>
                    <Box sx={{ mt: 1 }}>
                      {selectedJobFunction.employees.map((emp) => (
                        <Chip
                          key={emp.id}
                          label={`${emp.firstName} ${emp.lastName}`}
                          size="small"
                          sx={{ m: 0.5 }}
                        />
                      ))}
                    </Box>
                  </Grid>
                )}
              </Grid>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenViewDialog(false)}>Schließen</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default JobFunctionsPage;
