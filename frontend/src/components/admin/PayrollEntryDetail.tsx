import React from 'react';
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

interface PayrollEntryDetailProps {
  open: boolean;
  onClose: () => void;
  entry: PayrollEntry | null;
}

const PayrollEntryDetail: React.FC<PayrollEntryDetailProps> = ({ open, onClose, entry }) => {
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

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>
        Lohnabrechnung Details
        <Typography variant="subtitle2" color="textSecondary">
          {entry.payrollPeriod?.name} - {entry.user?.firstName} {entry.user?.lastName}
        </Typography>
      </DialogTitle>

      <DialogContent>
        <Box sx={{ mb: 3 }}>
          <Typography variant="h6" gutterBottom>
            Mitarbeiter
          </Typography>
          <Grid container spacing={2}>
            <Grid item xs={6}>
              <Typography variant="body2" color="textSecondary">Name</Typography>
              <Typography variant="body1">
                {entry.user?.firstName} {entry.user?.lastName}
              </Typography>
            </Grid>
            <Grid item xs={6}>
              <Typography variant="body2" color="textSecondary">Personalnummer</Typography>
              <Typography variant="body1">
                {entry.user?.employeeNumber || '-'}
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

      <DialogActions>
        <Button onClick={onClose}>Schließen</Button>
        <Button variant="contained" color="primary">
          PDF Drucken
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default PayrollEntryDetail;
