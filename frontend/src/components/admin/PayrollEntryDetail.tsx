import React, { useEffect, useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  Grid,
  Divider,
  Table,
  TableBody,
  TableCell,
  TableRow,
  Paper
} from '@mui/material';
import { PayrollEntry } from '../../types';
import axios from 'axios';
import '../../styles/PayrollEntryDetail.css';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001/api';

interface SystemSettings {
  companyName?: string;
  companyAddress?: string;
  companyPhone?: string;
  companyEmail?: string;
  companyTaxId?: string;
}

interface PayrollEntryDetailProps {
  open: boolean;
  onClose: () => void;
  entry: PayrollEntry | null;
}

const PayrollEntryDetail: React.FC<PayrollEntryDetailProps> = ({ open, onClose, entry }) => {
  const [settings, setSettings] = useState<SystemSettings | null>(null);
  const token = localStorage.getItem('token');

  useEffect(() => {
    if (open) {
      loadSettings();
    }
  }, [open]);

  const loadSettings = async () => {
    try {
      const response = await axios.get(`${API_URL}/system-settings`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setSettings(response.data);
    } catch (error) {
      console.error('Error loading system settings:', error);
    }
  };

  if (!entry) return null;

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('de-CH', {
      style: 'currency',
      currency: 'CHF'
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('de-CH');
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle className="no-print">
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <Box>
            <Typography variant="h5" fontWeight="bold">Lohnabrechnung</Typography>
            <Typography variant="subtitle2" color="textSecondary">
              {entry.payrollPeriod?.name}
            </Typography>
          </Box>
          {settings && (
            <Box sx={{ textAlign: 'right' }}>
              <Typography variant="h6" fontWeight="bold">{settings.companyName || 'Firma'}</Typography>
              {settings.companyAddress && (
                <Typography variant="body2" color="textSecondary" sx={{ whiteSpace: 'pre-line' }}>
                  {settings.companyAddress}
                </Typography>
              )}
              {settings.companyTaxId && (
                <Typography variant="body2" color="textSecondary">
                  UID: {settings.companyTaxId}
                </Typography>
              )}
            </Box>
          )}
        </Box>
      </DialogTitle>

      <DialogContent>
        {/* Print-only header */}
        <Box className="print-only" sx={{ mb: 3, display: 'none' }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
            <Box>
              <Typography variant="h4" fontWeight="bold">Lohnabrechnung</Typography>
              <Typography variant="h6">{entry.payrollPeriod?.name}</Typography>
            </Box>
            {settings && (
              <Box sx={{ textAlign: 'right' }}>
                <Typography variant="h6" fontWeight="bold">{settings.companyName || 'Firma'}</Typography>
                {settings.companyAddress && (
                  <Typography variant="body2" sx={{ whiteSpace: 'pre-line' }}>
                    {settings.companyAddress}
                  </Typography>
                )}
                {settings.companyTaxId && (
                  <Typography variant="body2">UID: {settings.companyTaxId}</Typography>
                )}
              </Box>
            )}
          </Box>
          <Divider sx={{ mb: 3 }} />
        </Box>
        <Box sx={{ mb: 3 }}>
          <Typography variant="h6" gutterBottom sx={{ color: 'primary.main', fontWeight: 'bold' }}>
            Personalangaben
          </Typography>
          <Grid container spacing={2}>
            <Grid item xs={6}>
              <Typography variant="body2" color="textSecondary">Name</Typography>
              <Typography variant="body1" fontWeight="medium">
                {entry.user?.firstName} {entry.user?.lastName}
              </Typography>
            </Grid>
            <Grid item xs={6}>
              <Typography variant="body2" color="textSecondary">Personalnummer</Typography>
              <Typography variant="body1">
                {entry.user?.employeeNumber || '-'}
              </Typography>
            </Grid>
            <Grid item xs={6}>
              <Typography variant="body2" color="textSecondary">Geburtsdatum</Typography>
              <Typography variant="body1">
                {entry.user?.dateOfBirth ? formatDate(entry.user.dateOfBirth) : '-'}
              </Typography>
            </Grid>
            <Grid item xs={6}>
              <Typography variant="body2" color="textSecondary">Nationalität</Typography>
              <Typography variant="body1">
                {entry.user?.nationality || '-'}
              </Typography>
            </Grid>
            <Grid item xs={6}>
              <Typography variant="body2" color="textSecondary">AHV-Nummer</Typography>
              <Typography variant="body1">
                {entry.user?.ahvNumber || '-'}
              </Typography>
            </Grid>
            <Grid item xs={6}>
              <Typography variant="body2" color="textSecondary">Zivilstand</Typography>
              <Typography variant="body1">
                {entry.user?.civilStatus || '-'}
              </Typography>
            </Grid>
            <Grid item xs={12}>
              <Typography variant="body2" color="textSecondary">Adresse</Typography>
              <Typography variant="body1">
                {entry.user?.street && entry.user?.streetNumber 
                  ? `${entry.user.street} ${entry.user.streetNumber}` 
                  : '-'}
              </Typography>
              <Typography variant="body1">
                {entry.user?.zipCode && entry.user?.city 
                  ? `${entry.user.zipCode} ${entry.user.city}` 
                  : '-'}
              </Typography>
            </Grid>
            <Grid item xs={6}>
              <Typography variant="body2" color="textSecondary">Eintritt</Typography>
              <Typography variant="body1">
                {entry.user?.entryDate ? formatDate(entry.user.entryDate) : '-'}
              </Typography>
            </Grid>
            <Grid item xs={6}>
              <Typography variant="body2" color="textSecondary">Kanton</Typography>
              <Typography variant="body1">
                {entry.user?.canton || '-'}
              </Typography>
            </Grid>
          </Grid>
        </Box>

        <Divider sx={{ my: 3 }} />

        <Box sx={{ mb: 3 }}>
          <Typography variant="h6" gutterBottom sx={{ color: 'primary.main', fontWeight: 'bold' }}>
            Bankverbindung
          </Typography>
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <Typography variant="body2" color="textSecondary">IBAN</Typography>
              <Typography variant="body1" sx={{ fontFamily: 'monospace' }}>
                {entry.user?.iban || '-'}
              </Typography>
            </Grid>
            <Grid item xs={12}>
              <Typography variant="body2" color="textSecondary">Bank</Typography>
              <Typography variant="body1">
                {entry.user?.bankName || '-'}
              </Typography>
            </Grid>
          </Grid>
        </Box>

        <Divider sx={{ my: 3 }} />

        <Box sx={{ mb: 3 }}>
          <Typography variant="h6" gutterBottom>
            Arbeitsstunden
          </Typography>
          <Table size="small">
            <TableBody>
              <TableRow>
                <TableCell>Reguläre Stunden</TableCell>
                <TableCell align="right">{entry.regularHours.toFixed(2)}h</TableCell>
              </TableRow>
              <TableRow>
                <TableCell>Überstunden</TableCell>
                <TableCell align="right">{entry.overtimeHours.toFixed(2)}h</TableCell>
              </TableRow>
              <TableRow>
                <TableCell>Nachtstunden</TableCell>
                <TableCell align="right">{entry.nightHours.toFixed(2)}h</TableCell>
              </TableRow>
              <TableRow>
                <TableCell>Sonntagsstunden</TableCell>
                <TableCell align="right">{entry.sundayHours.toFixed(2)}h</TableCell>
              </TableRow>
              <TableRow>
                <TableCell>Feiertagsstunden</TableCell>
                <TableCell align="right">{entry.holidayHours.toFixed(2)}h</TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </Box>

        <Divider sx={{ my: 3 }} />

        <Box sx={{ mb: 3 }}>
          <Typography variant="h6" gutterBottom>
            Lohnberechnung
          </Typography>
          <Table size="small">
            <TableBody>
              <TableRow>
                <TableCell>Grundgehalt</TableCell>
                <TableCell align="right">{formatCurrency(entry.baseSalary)}</TableCell>
              </TableRow>
              <TableRow>
                <TableCell>Überstundenvergütung</TableCell>
                <TableCell align="right">{formatCurrency(entry.overtimePay)}</TableCell>
              </TableRow>
              <TableRow>
                <TableCell>Nachtzuschlag</TableCell>
                <TableCell align="right">{formatCurrency(entry.nightBonus)}</TableCell>
              </TableRow>
              <TableRow>
                <TableCell>Sonntagszuschlag</TableCell>
                <TableCell align="right">{formatCurrency(entry.sundayBonus)}</TableCell>
              </TableRow>
              <TableRow>
                <TableCell>Feiertagszuschlag</TableCell>
                <TableCell align="right">{formatCurrency(entry.holidayBonus)}</TableCell>
              </TableRow>
              <TableRow>
                <TableCell>Bonus</TableCell>
                <TableCell align="right">{formatCurrency(entry.bonus)}</TableCell>
              </TableRow>
              <TableRow>
                <TableCell>Provision</TableCell>
                <TableCell align="right">{formatCurrency(entry.commission)}</TableCell>
              </TableRow>
              <TableRow sx={{ backgroundColor: '#f5f5f5' }}>
                <TableCell><strong>Bruttolohn</strong></TableCell>
                <TableCell align="right"><strong>{formatCurrency(entry.grossSalary)}</strong></TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </Box>

        <Divider sx={{ my: 3 }} />

        <Box sx={{ mb: 3 }}>
          <Typography variant="h6" gutterBottom>
            Abzüge
          </Typography>
          <Table size="small">
            <TableBody>
              <TableRow>
                <TableCell>AHV/IV/EO</TableCell>
                <TableCell align="right">{formatCurrency(entry.ahvDeduction)}</TableCell>
              </TableRow>
              <TableRow>
                <TableCell>Arbeitslosenversicherung (ALV)</TableCell>
                <TableCell align="right">{formatCurrency(entry.alvDeduction)}</TableCell>
              </TableRow>
              <TableRow>
                <TableCell>Nichtberufsunfall (NBU)</TableCell>
                <TableCell align="right">{formatCurrency(entry.nbuvDeduction)}</TableCell>
              </TableRow>
              <TableRow>
                <TableCell>Pensionskasse (BVG)</TableCell>
                <TableCell align="right">{formatCurrency(entry.pensionDeduction)}</TableCell>
              </TableRow>
              <TableRow>
                <TableCell>Quellensteuer</TableCell>
                <TableCell align="right">{formatCurrency(entry.taxDeduction)}</TableCell>
              </TableRow>
              <TableRow>
                <TableCell>Weitere Abzüge</TableCell>
                <TableCell align="right">{formatCurrency(entry.otherDeductions)}</TableCell>
              </TableRow>
              <TableRow sx={{ backgroundColor: '#ffebee' }}>
                <TableCell><strong>Total Abzüge</strong></TableCell>
                <TableCell align="right"><strong>{formatCurrency(entry.totalDeductions)}</strong></TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </Box>

        <Divider sx={{ my: 3 }} />

        <Box sx={{ mb: 3 }}>
          <Typography variant="h6" gutterBottom>
            Abwesenheiten
          </Typography>
          <Table size="small">
            <TableBody>
              <TableRow>
                <TableCell>Urlaubstage</TableCell>
                <TableCell align="right">{entry.vacationDaysTaken.toFixed(1)} Tage</TableCell>
              </TableRow>
              <TableRow>
                <TableCell>Krankheitstage</TableCell>
                <TableCell align="right">{entry.sickDays.toFixed(1)} Tage</TableCell>
              </TableRow>
              <TableRow>
                <TableCell>Gesamt Abwesenheit</TableCell>
                <TableCell align="right">{entry.absenceDays.toFixed(1)} Tage</TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </Box>

        <Divider sx={{ my: 3 }} />

        <Paper sx={{ p: 2, backgroundColor: '#e8f5e9' }}>
          <Typography variant="h5" align="center" color="primary">
            Nettolohn: {formatCurrency(entry.netSalary)}
          </Typography>
        </Paper>

        {entry.notes && (
          <Box sx={{ mt: 3 }}>
            <Typography variant="h6" gutterBottom>
              Notizen
            </Typography>
            <Typography variant="body2" color="textSecondary">
              {entry.notes}
            </Typography>
          </Box>
        )}
      </DialogContent>

      <DialogActions className="no-print">
        <Button onClick={onClose}>Schließen</Button>
        <Button variant="contained" color="primary" onClick={handlePrint}>
          📄 PDF Drucken
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default PayrollEntryDetail;
