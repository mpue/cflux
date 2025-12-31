import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
  Container,
  Paper,
  Typography,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Chip,
  IconButton,
  Box,
  Grid,
  Card,
  CardContent,
  Alert
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Calculate as CalculateIcon,
  Check as CheckIcon,
  Payment as PaymentIcon,
  Visibility as VisibilityIcon
} from '@mui/icons-material';
import { PayrollPeriod, PayrollEntry, PayrollStatus } from '../types';
import './PayrollManagement.css';

// Check if running in Electron and use injected backend URL
const electronBackendUrl = typeof window !== 'undefined' && (window as any).ELECTRON_BACKEND_URL;
const API_URL = electronBackendUrl 
  ? `${electronBackendUrl}/api`
  : (process.env.REACT_APP_API_URL || 'http://localhost:3001/api');

const PayrollManagement: React.FC = () => {
  const [periods, setPeriods] = useState<PayrollPeriod[]>([]);
  const [selectedPeriod, setSelectedPeriod] = useState<PayrollPeriod | null>(null);
  const [openDialog, setOpenDialog] = useState(false);
  const [openDetailDialog, setOpenDetailDialog] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  
  const [formData, setFormData] = useState({
    name: '',
    year: new Date().getFullYear(),
    month: new Date().getMonth() + 1,
    startDate: '',
    endDate: '',
    type: 'MONTHLY' as const,
    notes: ''
  });

  const token = localStorage.getItem('token');

  useEffect(() => {
    fetchPeriods();
  }, []);

  const fetchPeriods = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_URL}/payroll/periods`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setPeriods(response.data);
    } catch (err) {
      setError('Fehler beim Laden der Lohnperioden');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreatePeriod = async () => {
    try {
      setLoading(true);
      await axios.post(`${API_URL}/payroll/periods`, formData, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setSuccess('Lohnperiode erfolgreich erstellt');
      setOpenDialog(false);
      fetchPeriods();
      resetForm();
    } catch (err) {
      setError('Fehler beim Erstellen der Lohnperiode');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCalculatePeriod = async (periodId: string) => {
    try {
      setLoading(true);
      await axios.post(`${API_URL}/payroll/periods/${periodId}/calculate`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setSuccess('Lohnabrechnung erfolgreich berechnet');
      fetchPeriods();
    } catch (err) {
      setError('Fehler beim Berechnen der Lohnabrechnung');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (periodId: string, status: PayrollStatus) => {
    try {
      setLoading(true);
      await axios.put(`${API_URL}/payroll/periods/${periodId}`, { status }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setSuccess(`Status erfolgreich auf ${status} gesetzt`);
      fetchPeriods();
    } catch (err) {
      setError('Fehler beim Aktualisieren des Status');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleDeletePeriod = async (periodId: string) => {
    if (!window.confirm('Möchten Sie diese Lohnperiode wirklich löschen?')) {
      return;
    }
    
    try {
      setLoading(true);
      await axios.delete(`${API_URL}/payroll/periods/${periodId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setSuccess('Lohnperiode erfolgreich gelöscht');
      fetchPeriods();
    } catch (err) {
      setError('Fehler beim Löschen der Lohnperiode');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleViewDetails = async (periodId: string) => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_URL}/payroll/periods/${periodId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setSelectedPeriod(response.data);
      setOpenDetailDialog(true);
    } catch (err) {
      setError('Fehler beim Laden der Details');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      year: new Date().getFullYear(),
      month: new Date().getMonth() + 1,
      startDate: '',
      endDate: '',
      type: 'MONTHLY',
      notes: ''
    });
  };

  const getStatusColor = (status: PayrollStatus) => {
    switch (status) {
      case 'DRAFT': return 'default';
      case 'CALCULATED': return 'primary';
      case 'APPROVED': return 'success';
      case 'PAID': return 'success';
      case 'CANCELLED': return 'error';
      default: return 'default';
    }
  };

  const getStatusLabel = (status: PayrollStatus) => {
    switch (status) {
      case 'DRAFT': return 'Entwurf';
      case 'CALCULATED': return 'Berechnet';
      case 'APPROVED': return 'Genehmigt';
      case 'PAID': return 'Bezahlt';
      case 'CANCELLED': return 'Storniert';
      default: return status;
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('de-CH', {
      style: 'currency',
      currency: 'CHF'
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('de-CH');
  };

  // Berechne Summen für die Detailansicht
  const calculateTotals = (entries: PayrollEntry[]) => {
    return entries.reduce(
      (acc, entry) => ({
        grossSalary: acc.grossSalary + entry.grossSalary,
        totalDeductions: acc.totalDeductions + entry.totalDeductions,
        netSalary: acc.netSalary + entry.netSalary
      }),
      { grossSalary: 0, totalDeductions: 0, netSalary: 0 }
    );
  };

  return (
    <Container maxWidth="xl" className="payroll-management">
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" gutterBottom>
          Lohnabrechnung
        </Typography>
        <Typography variant="body1" color="textSecondary">
          Verwaltung der Lohnabrechnungen und Gehaltsperioden
        </Typography>
      </Box>

      {error && (
        <Alert severity="error" onClose={() => setError(null)} sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {success && (
        <Alert severity="success" onClose={() => setSuccess(null)} sx={{ mb: 2 }}>
          {success}
        </Alert>
      )}

      <Box sx={{ mb: 3 }}>
        <Button
          variant="contained"
          color="primary"
          startIcon={<AddIcon />}
          onClick={() => setOpenDialog(true)}
        >
          Neue Lohnperiode
        </Button>
      </Box>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Periode</TableCell>
              <TableCell>Jahr</TableCell>
              <TableCell>Monat</TableCell>
              <TableCell>Zeitraum</TableCell>
              <TableCell>Typ</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Mitarbeiter</TableCell>
              <TableCell align="right">Aktionen</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {periods.map((period) => (
              <TableRow key={period.id}>
                <TableCell>{period.name}</TableCell>
                <TableCell>{period.year}</TableCell>
                <TableCell>{period.month}</TableCell>
                <TableCell>
                  {formatDate(period.startDate)} - {formatDate(period.endDate)}
                </TableCell>
                <TableCell>{period.type}</TableCell>
                <TableCell>
                  <Chip
                    label={getStatusLabel(period.status)}
                    color={getStatusColor(period.status)}
                    size="small"
                  />
                </TableCell>
                <TableCell>{period.payrollEntries?.length || 0}</TableCell>
                <TableCell align="right">
                  <IconButton
                    size="small"
                    onClick={() => handleViewDetails(period.id)}
                    title="Details anzeigen"
                  >
                    <VisibilityIcon />
                  </IconButton>
                  
                  {period.status === 'DRAFT' && (
                    <IconButton
                      size="small"
                      onClick={() => handleCalculatePeriod(period.id)}
                      title="Berechnen"
                      color="primary"
                    >
                      <CalculateIcon />
                    </IconButton>
                  )}
                  
                  {period.status === 'CALCULATED' && (
                    <IconButton
                      size="small"
                      onClick={() => handleUpdateStatus(period.id, 'APPROVED')}
                      title="Genehmigen"
                      color="success"
                    >
                      <CheckIcon />
                    </IconButton>
                  )}
                  
                  {period.status === 'APPROVED' && (
                    <IconButton
                      size="small"
                      onClick={() => handleUpdateStatus(period.id, 'PAID')}
                      title="Als bezahlt markieren"
                      color="success"
                    >
                      <PaymentIcon />
                    </IconButton>
                  )}
                  
                  {period.status === 'DRAFT' && (
                    <IconButton
                      size="small"
                      onClick={() => handleDeletePeriod(period.id)}
                      title="Löschen"
                      color="error"
                    >
                      <DeleteIcon />
                    </IconButton>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Dialog für neue Lohnperiode */}
      <Dialog open={openDialog} onClose={() => setOpenDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle>Neue Lohnperiode erstellen</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="z.B. Januar 2025"
              />
            </Grid>
            
            <Grid item xs={6}>
              <TextField
                fullWidth
                type="number"
                label="Jahr"
                value={formData.year}
                onChange={(e) => setFormData({ ...formData, year: parseInt(e.target.value) })}
              />
            </Grid>
            
            <Grid item xs={6}>
              <TextField
                fullWidth
                type="number"
                label="Monat"
                value={formData.month}
                onChange={(e) => setFormData({ ...formData, month: parseInt(e.target.value) })}
                inputProps={{ min: 1, max: 12 }}
              />
            </Grid>
            
            <Grid item xs={6}>
              <TextField
                fullWidth
                type="date"
                label="Startdatum"
                value={formData.startDate}
                onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            
            <Grid item xs={6}>
              <TextField
                fullWidth
                type="date"
                label="Enddatum"
                value={formData.endDate}
                onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            
            <Grid item xs={12}>
              <FormControl fullWidth>
                <InputLabel>Typ</InputLabel>
                <Select
                  value={formData.type}
                  label="Typ"
                  onChange={(e) => setFormData({ ...formData, type: e.target.value as any })}
                >
                  <MenuItem value="MONTHLY">Monatlich</MenuItem>
                  <MenuItem value="BONUS">Bonus</MenuItem>
                  <MenuItem value="CORRECTION">Korrektur</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            
            <Grid item xs={12}>
              <TextField
                fullWidth
                multiline
                rows={3}
                label="Notizen"
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDialog(false)}>Abbrechen</Button>
          <Button onClick={handleCreatePeriod} variant="contained" color="primary">
            Erstellen
          </Button>
        </DialogActions>
      </Dialog>

      {/* Dialog für Details */}
      <Dialog
        open={openDetailDialog}
        onClose={() => setOpenDetailDialog(false)}
        maxWidth="xl"
        fullWidth
      >
        <DialogTitle>
          Lohnperiode: {selectedPeriod?.name}
          <Chip
            label={getStatusLabel(selectedPeriod?.status || 'DRAFT')}
            color={getStatusColor(selectedPeriod?.status || 'DRAFT')}
            size="small"
            sx={{ ml: 2 }}
          />
        </DialogTitle>
        <DialogContent>
          {selectedPeriod && (
            <>
              <Box sx={{ mb: 3 }}>
                <Grid container spacing={2}>
                  <Grid item xs={12} md={4}>
                    <Card>
                      <CardContent>
                        <Typography color="textSecondary" gutterBottom>
                          Bruttolohn gesamt
                        </Typography>
                        <Typography variant="h5">
                          {formatCurrency(
                            calculateTotals(selectedPeriod.payrollEntries || []).grossSalary
                          )}
                        </Typography>
                      </CardContent>
                    </Card>
                  </Grid>
                  <Grid item xs={12} md={4}>
                    <Card>
                      <CardContent>
                        <Typography color="textSecondary" gutterBottom>
                          Abzüge gesamt
                        </Typography>
                        <Typography variant="h5">
                          {formatCurrency(
                            calculateTotals(selectedPeriod.payrollEntries || []).totalDeductions
                          )}
                        </Typography>
                      </CardContent>
                    </Card>
                  </Grid>
                  <Grid item xs={12} md={4}>
                    <Card>
                      <CardContent>
                        <Typography color="textSecondary" gutterBottom>
                          Nettolohn gesamt
                        </Typography>
                        <Typography variant="h5">
                          {formatCurrency(
                            calculateTotals(selectedPeriod.payrollEntries || []).netSalary
                          )}
                        </Typography>
                      </CardContent>
                    </Card>
                  </Grid>
                </Grid>
              </Box>

              <TableContainer component={Paper}>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Mitarbeiter</TableCell>
                      <TableCell align="right">Stunden</TableCell>
                      <TableCell align="right">Bruttolohn</TableCell>
                      <TableCell align="right">Abzüge</TableCell>
                      <TableCell align="right">Nettolohn</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {selectedPeriod.payrollEntries?.map((entry) => (
                      <TableRow key={entry.id}>
                        <TableCell>
                          {entry.user?.firstName} {entry.user?.lastName}
                          {entry.user?.employeeNumber && (
                            <Typography variant="caption" display="block" color="textSecondary">
                              Nr. {entry.user.employeeNumber}
                            </Typography>
                          )}
                        </TableCell>
                        <TableCell align="right">
                          {(entry.regularHours + entry.overtimeHours).toFixed(1)}h
                        </TableCell>
                        <TableCell align="right">
                          {formatCurrency(entry.grossSalary)}
                        </TableCell>
                        <TableCell align="right">
                          {formatCurrency(entry.totalDeductions)}
                        </TableCell>
                        <TableCell align="right">
                          <strong>{formatCurrency(entry.netSalary)}</strong>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDetailDialog(false)}>Schließen</Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default PayrollManagement;
