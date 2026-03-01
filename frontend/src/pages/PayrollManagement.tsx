import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
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
  Grid,
  Card,
  CardContent,
  Alert,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Typography,
  Box
} from '@mui/material';
import { PayrollPeriod, PayrollEntry, PayrollStatus } from '../types';
import './PayrollManagement.css';
import { useCurrency } from '../contexts/CurrencyContext';

// Check if running in Electron and use injected backend URL
const electronBackendUrl = typeof window !== 'undefined' && (window as any).ELECTRON_BACKEND_URL;
const API_URL = electronBackendUrl 
  ? `${electronBackendUrl}/api`
  : (process.env.REACT_APP_API_URL || 'http://localhost:3001/api');

const PayrollManagement: React.FC = () => {
  const { currency } = useCurrency();
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

  const handleRecalculatePeriod = async (periodId: string) => {
    if (!window.confirm('Möchten Sie diese Lohnperiode neu berechnen? Alle bestehenden Einträge werden gelöscht.')) {
      return;
    }
    
    try {
      setLoading(true);
      const response = await axios.post(`${API_URL}/payroll/periods/${periodId}/recalculate`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setSuccess(`Lohnperiode erfolgreich neu berechnet (${response.data.entries?.length || 0} Einträge)`);
      fetchPeriods();
      // Falls Detail-Dialog offen ist, auch aktualisieren
      if (openDetailDialog && selectedPeriod?.id === periodId) {
        handleViewDetails(periodId);
      }
    } catch (err) {
      setError('Fehler beim Neu-Berechnen der Lohnperiode');
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
      currency: currency
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
    <div className="admin-container">
      <div className="admin-header">
        <h1>Lohnabrechnung</h1>
      </div>

      <div className="tab-content">
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

        <div className="section-header">
          <button className="button primary" onClick={() => setOpenDialog(true)}>
            + Neue Lohnperiode
          </button>
        </div>

        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Periode</th>
                <th>Jahr</th>
                <th>Monat</th>
                <th>Zeitraum</th>
                <th>Typ</th>
                <th>Status</th>
                <th>Mitarbeiter</th>
                <th>Aktionen</th>
              </tr>
            </thead>
            <tbody>
              {periods.map((period) => (
                <tr key={period.id}>
                  <td><strong>{period.name}</strong></td>
                  <td>{period.year}</td>
                  <td>{period.month}</td>
                  <td>
                    {formatDate(period.startDate)} - {formatDate(period.endDate)}
                  </td>
                  <td>{period.type}</td>
                  <td>
                    <span className={`status-badge ${period.status.toLowerCase()}`}>
                      {getStatusLabel(period.status)}
                    </span>
                  </td>
                  <td>{period.payrollEntries?.length || 0}</td>
                  <td>
                    <div className="action-buttons">
                      <button
                        className="button small"
                        onClick={() => handleViewDetails(period.id)}
                        title="Details anzeigen"
                      >
                        Details
                      </button>
                      
                      {period.status === 'DRAFT' && (
                        <button
                          className="button small primary"
                          onClick={() => handleCalculatePeriod(period.id)}
                          title="Berechnen"
                        >
                          Berechnen
                        </button>
                      )}
                      
                      {(period.status === 'CALCULATED' || period.status === 'APPROVED') && (
                        <button
                          className="button small warning"
                          onClick={() => handleRecalculatePeriod(period.id)}
                          title="Neu berechnen"
                        >
                          Neu berechnen
                        </button>
                      )}
                      
                      {period.status === 'CALCULATED' && (
                        <button
                          className="button small success"
                          onClick={() => handleUpdateStatus(period.id, 'APPROVED')}
                          title="Genehmigen"
                        >
                          Genehmigen
                        </button>
                      )}
                      
                      {period.status === 'APPROVED' && (
                        <button
                          className="button small success"
                          onClick={() => handleUpdateStatus(period.id, 'PAID')}
                          title="Als bezahlt markieren"
                        >
                          Bezahlt
                        </button>
                      )}
                      
                      {period.status === 'DRAFT' && (
                        <button
                          className="button small danger"
                          onClick={() => handleDeletePeriod(period.id)}
                          title="Löschen"
                        >
                          Löschen
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
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
          <button className="button secondary" onClick={() => setOpenDialog(false)}>
            Abbrechen
          </button>
          <button className="button primary" onClick={handleCreatePeriod}>
            Erstellen
          </button>
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
                          {(entry.user?.employeeProfile?.employeeNumber || entry.user?.employeeNumber) && (
                            <Typography variant="caption" display="block" color="textSecondary">
                              Nr. {entry.user?.employeeProfile?.employeeNumber || entry.user?.employeeNumber}
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
          {selectedPeriod && (selectedPeriod.status === 'CALCULATED' || selectedPeriod.status === 'APPROVED') && (
            <button 
              className="button warning" 
              onClick={() => {
                handleRecalculatePeriod(selectedPeriod.id);
              }}
            >
              Neu berechnen
            </button>
          )}
          <button className="button secondary" onClick={() => setOpenDetailDialog(false)}>
            Schließen
          </button>
        </DialogActions>
      </Dialog>
    </div>
  );
};

export default PayrollManagement;
