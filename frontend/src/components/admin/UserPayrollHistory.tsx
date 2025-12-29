import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Typography,
  Box,
  Alert,
  Chip,
  Grid,
  Card,
  CardContent
} from '@mui/material';
import { User, PayrollEntry } from '../../types';
import PayrollEntryDetail from './PayrollEntryDetail';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001/api';

interface UserPayrollHistoryProps {
  open: boolean;
  onClose: () => void;
  user: User;
}

const UserPayrollHistory: React.FC<UserPayrollHistoryProps> = ({ open, onClose, user }) => {
  const [entries, setEntries] = useState<PayrollEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedEntry, setSelectedEntry] = useState<PayrollEntry | null>(null);

  const token = localStorage.getItem('token');

  useEffect(() => {
    if (open && user.id) {
      fetchEntries();
    }
  }, [open, user.id]);

  const fetchEntries = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_URL}/payroll/user/${user.id}/entries`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setEntries(response.data);
    } catch (err) {
      setError('Fehler beim Laden der Gehaltsabrechnungen');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('de-CH', {
      style: 'currency',
      currency: 'CHF'
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('de-CH', {
      year: 'numeric',
      month: 'long'
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'DRAFT': return 'default';
      case 'CALCULATED': return 'primary';
      case 'APPROVED': return 'success';
      case 'PAID': return 'success';
      case 'CANCELLED': return 'error';
      default: return 'default';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'DRAFT': return 'Entwurf';
      case 'CALCULATED': return 'Berechnet';
      case 'APPROVED': return 'Genehmigt';
      case 'PAID': return 'Bezahlt';
      case 'CANCELLED': return 'Storniert';
      default: return status;
    }
  };

  // Berechne Gesamtsummen
  const totals = entries.reduce(
    (acc, entry) => ({
      grossSalary: acc.grossSalary + entry.grossSalary,
      totalDeductions: acc.totalDeductions + entry.totalDeductions,
      netSalary: acc.netSalary + entry.netSalary,
      regularHours: acc.regularHours + entry.regularHours,
      overtimeHours: acc.overtimeHours + entry.overtimeHours
    }),
    { grossSalary: 0, totalDeductions: 0, netSalary: 0, regularHours: 0, overtimeHours: 0 }
  );

  return (
    <Dialog open={open} onClose={onClose} maxWidth="lg" fullWidth>
      <DialogTitle>
        Gehaltsabrechnungen - {user.firstName} {user.lastName}
        {user.employeeNumber && (
          <Typography variant="caption" display="block" color="textSecondary">
            Personalnummer: {user.employeeNumber}
          </Typography>
        )}
      </DialogTitle>

      <DialogContent>
        {error && (
          <Alert severity="error" onClose={() => setError(null)} sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        {entries.length > 0 && (
          <Box sx={{ mb: 3 }}>
            <Typography variant="h6" gutterBottom>
              Übersicht
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6} md={3}>
                <Card>
                  <CardContent>
                    <Typography color="textSecondary" gutterBottom variant="body2">
                      Gesamte Arbeitsstunden
                    </Typography>
                    <Typography variant="h6">
                      {totals.regularHours.toFixed(1)}h
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <Card>
                  <CardContent>
                    <Typography color="textSecondary" gutterBottom variant="body2">
                      Überstunden gesamt
                    </Typography>
                    <Typography variant="h6">
                      {totals.overtimeHours.toFixed(1)}h
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <Card>
                  <CardContent>
                    <Typography color="textSecondary" gutterBottom variant="body2">
                      Bruttolohn gesamt
                    </Typography>
                    <Typography variant="h6">
                      {formatCurrency(totals.grossSalary)}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <Card>
                  <CardContent>
                    <Typography color="textSecondary" gutterBottom variant="body2">
                      Nettolohn gesamt
                    </Typography>
                    <Typography variant="h6" color="primary">
                      {formatCurrency(totals.netSalary)}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          </Box>
        )}

        {loading ? (
          <Box sx={{ textAlign: 'center', py: 4 }}>
            <Typography>Laden...</Typography>
          </Box>
        ) : entries.length === 0 ? (
          <Alert severity="info">
            Noch keine Gehaltsabrechnungen vorhanden
          </Alert>
        ) : (
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Periode</TableCell>
                  <TableCell align="right">Stunden</TableCell>
                  <TableCell align="right">Überstd.</TableCell>
                  <TableCell align="right">Brutto</TableCell>
                  <TableCell align="right">Abzüge</TableCell>
                  <TableCell align="right">Netto</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell align="right">Details</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {entries.map((entry) => (
                  <TableRow key={entry.id}>
                    <TableCell>
                      {entry.payrollPeriod?.name}
                      <Typography variant="caption" display="block" color="textSecondary">
                        {entry.payrollPeriod?.year} - {entry.payrollPeriod?.type}
                      </Typography>
                    </TableCell>
                    <TableCell align="right">{entry.regularHours.toFixed(1)}h</TableCell>
                    <TableCell align="right">{entry.overtimeHours.toFixed(1)}h</TableCell>
                    <TableCell align="right">{formatCurrency(entry.grossSalary)}</TableCell>
                    <TableCell align="right">{formatCurrency(entry.totalDeductions)}</TableCell>
                    <TableCell align="right">
                      <strong>{formatCurrency(entry.netSalary)}</strong>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={getStatusLabel(entry.payrollPeriod?.status || 'DRAFT')}
                        color={getStatusColor(entry.payrollPeriod?.status || 'DRAFT') as any}
                        size="small"
                      />
                    </TableCell>
                    <TableCell align="right">
                      <Button
                        size="small"
                        onClick={() => {
                          setSelectedEntry(entry);
                        }}
                      >
                        Details
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose}>Schließen</Button>
      </DialogActions>

      <PayrollEntryDetail
        open={!!selectedEntry}
        entry={selectedEntry}
        onClose={() => setSelectedEntry(null)}
      />
    </Dialog>
  );
};

export default UserPayrollHistory;
