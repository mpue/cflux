import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
  Card,
  CardContent,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  Box,
  Alert
} from '@mui/material';
import { PayrollEntry } from '../types';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001/api';

const MyPayrollEntries: React.FC = () => {
  const [entries, setEntries] = useState<PayrollEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const token = localStorage.getItem('token');

  useEffect(() => {
    fetchMyEntries();
  }, []);

  const fetchMyEntries = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_URL}/payroll/my-entries`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setEntries(response.data);
    } catch (err) {
      setError('Fehler beim Laden der Lohnabrechnungen');
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

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h5" gutterBottom>
        Meine Lohnabrechnungen
      </Typography>

      {error && (
        <Alert severity="error" onClose={() => setError(null)} sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {entries.length === 0 && !loading ? (
        <Alert severity="info">Keine Lohnabrechnungen vorhanden</Alert>
      ) : (
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Periode</TableCell>
                <TableCell align="right">Arbeitsstunden</TableCell>
                <TableCell align="right">Überstunden</TableCell>
                <TableCell align="right">Bruttolohn</TableCell>
                <TableCell align="right">Abzüge</TableCell>
                <TableCell align="right">Nettolohn</TableCell>
                <TableCell>Status</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {entries.map((entry) => (
                <TableRow key={entry.id}>
                  <TableCell>{entry.payrollPeriod?.name}</TableCell>
                  <TableCell align="right">{entry.regularHours.toFixed(1)}h</TableCell>
                  <TableCell align="right">{entry.overtimeHours.toFixed(1)}h</TableCell>
                  <TableCell align="right">{formatCurrency(entry.grossSalary)}</TableCell>
                  <TableCell align="right">{formatCurrency(entry.totalDeductions)}</TableCell>
                  <TableCell align="right">
                    <strong>{formatCurrency(entry.netSalary)}</strong>
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={entry.payrollPeriod?.status}
                      color={
                        entry.payrollPeriod?.status === 'PAID'
                          ? 'success'
                          : entry.payrollPeriod?.status === 'APPROVED'
                          ? 'primary'
                          : 'default'
                      }
                      size="small"
                    />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}
    </Box>
  );
};

export default MyPayrollEntries;
