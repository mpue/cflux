import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Grid,
  Typography,
  Box,
  Alert,
  InputAdornment
} from '@mui/material';
import { User, SalaryConfiguration } from '../../types';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001/api';

interface SalaryConfigDialogProps {
  open: boolean;
  onClose: () => void;
  user: User;
  onSuccess?: () => void;
}

const SalaryConfigDialog: React.FC<SalaryConfigDialogProps> = ({
  open,
  onClose,
  user,
  onSuccess
}) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  
  const [config, setConfig] = useState<Partial<SalaryConfiguration>>({
    monthlySalary: 0,
    hourlySalary: 0,
    overtimeRate: 125,
    nightRate: 125,
    sundayRate: 150,
    holidayRate: 200,
    ahvRate: 5.3,
    alvRate: 1.1,
    nbuvRate: 0.8,
    pensionRate: 7.0,
    taxRate: 0,
    validFrom: new Date().toISOString().split('T')[0],
    isActive: true
  });

  const token = localStorage.getItem('token');

  useEffect(() => {
    if (open && user.id) {
      loadConfig();
    }
  }, [open, user.id]);

  const loadConfig = async () => {
    try {
      const response = await axios.get(`${API_URL}/payroll/salary-config/${user.id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setConfig(response.data);
    } catch (err: any) {
      // Wenn keine Konfiguration existiert, Standardwerte verwenden
      if (err.response?.status !== 404) {
        console.error('Error loading config:', err);
      }
    }
  };

  const handleSave = async () => {
    try {
      setLoading(true);
      setError(null);
      
      await axios.post(
        `${API_URL}/payroll/salary-config`,
        {
          userId: user.id,
          ...config
        },
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );
      
      setSuccess('Gehaltskonfiguration erfolgreich gespeichert');
      setTimeout(() => {
        onSuccess?.();
        onClose();
      }, 1500);
    } catch (err) {
      setError('Fehler beim Speichern der Gehaltskonfiguration');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const calculateHourlyFromMonthly = () => {
    if (config.monthlySalary) {
      const hourly = config.monthlySalary / 173; // 173 Arbeitsstunden pro Monat (Durchschnitt)
      setConfig({ ...config, hourlySalary: parseFloat(hourly.toFixed(2)) });
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>
        Gehaltskonfiguration für {user.firstName} {user.lastName}
      </DialogTitle>
      
      <DialogContent>
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

        <Box sx={{ mt: 2 }}>
          <Typography variant="h6" gutterBottom>
            Grundgehalt
          </Typography>
          <Grid container spacing={2}>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                type="number"
                label="Monatslohn"
                value={config.monthlySalary}
                onChange={(e) => setConfig({ ...config, monthlySalary: parseFloat(e.target.value) })}
                onBlur={calculateHourlyFromMonthly}
                InputProps={{
                  endAdornment: <InputAdornment position="end">CHF</InputAdornment>,
                }}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                type="number"
                label="Stundenlohn"
                value={config.hourlySalary}
                onChange={(e) => setConfig({ ...config, hourlySalary: parseFloat(e.target.value) })}
                InputProps={{
                  endAdornment: <InputAdornment position="end">CHF</InputAdornment>,
                }}
              />
            </Grid>
          </Grid>

          <Typography variant="h6" gutterBottom sx={{ mt: 3 }}>
            Zuschlagsätze (in %)
          </Typography>
          <Grid container spacing={2}>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                type="number"
                label="Überstundenzuschlag"
                value={config.overtimeRate}
                onChange={(e) => setConfig({ ...config, overtimeRate: parseFloat(e.target.value) })}
                InputProps={{
                  endAdornment: <InputAdornment position="end">%</InputAdornment>,
                }}
                helperText="Standard: 125% (= +25% Zuschlag)"
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                type="number"
                label="Nachtzuschlag"
                value={config.nightRate}
                onChange={(e) => setConfig({ ...config, nightRate: parseFloat(e.target.value) })}
                InputProps={{
                  endAdornment: <InputAdornment position="end">%</InputAdornment>,
                }}
                helperText="Standard: 125%"
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                type="number"
                label="Sonntagszuschlag"
                value={config.sundayRate}
                onChange={(e) => setConfig({ ...config, sundayRate: parseFloat(e.target.value) })}
                InputProps={{
                  endAdornment: <InputAdornment position="end">%</InputAdornment>,
                }}
                helperText="Standard: 150%"
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                type="number"
                label="Feiertagszuschlag"
                value={config.holidayRate}
                onChange={(e) => setConfig({ ...config, holidayRate: parseFloat(e.target.value) })}
                InputProps={{
                  endAdornment: <InputAdornment position="end">%</InputAdornment>,
                }}
                helperText="Standard: 200%"
              />
            </Grid>
          </Grid>

          <Typography variant="h6" gutterBottom sx={{ mt: 3 }}>
            Abzugsätze (in %)
          </Typography>
          <Grid container spacing={2}>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                type="number"
                label="AHV/IV/EO"
                value={config.ahvRate}
                onChange={(e) => setConfig({ ...config, ahvRate: parseFloat(e.target.value) })}
                InputProps={{
                  endAdornment: <InputAdornment position="end">%</InputAdornment>,
                }}
                helperText="Arbeitnehmeranteil: 5.3%"
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                type="number"
                label="Arbeitslosenversicherung (ALV)"
                value={config.alvRate}
                onChange={(e) => setConfig({ ...config, alvRate: parseFloat(e.target.value) })}
                InputProps={{
                  endAdornment: <InputAdornment position="end">%</InputAdornment>,
                }}
                helperText="Standard: 1.1%"
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                type="number"
                label="Nichtberufsunfall (NBU)"
                value={config.nbuvRate}
                onChange={(e) => setConfig({ ...config, nbuvRate: parseFloat(e.target.value) })}
                InputProps={{
                  endAdornment: <InputAdornment position="end">%</InputAdornment>,
                }}
                helperText="Standard: 0.8%"
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                type="number"
                label="Pensionskasse (BVG)"
                value={config.pensionRate}
                onChange={(e) => setConfig({ ...config, pensionRate: parseFloat(e.target.value) })}
                InputProps={{
                  endAdornment: <InputAdornment position="end">%</InputAdornment>,
                }}
                helperText="Arbeitnehmeranteil: ca. 7%"
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                type="number"
                label="Quellensteuer"
                value={config.taxRate}
                onChange={(e) => setConfig({ ...config, taxRate: parseFloat(e.target.value) })}
                InputProps={{
                  endAdornment: <InputAdornment position="end">%</InputAdornment>,
                }}
                helperText="Individuell (falls anwendbar)"
              />
            </Grid>
          </Grid>

          <Typography variant="h6" gutterBottom sx={{ mt: 3 }}>
            Gültigkeit
          </Typography>
          <Grid container spacing={2}>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                type="date"
                label="Gültig ab"
                value={config.validFrom}
                onChange={(e) => setConfig({ ...config, validFrom: e.target.value })}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                type="date"
                label="Gültig bis"
                value={config.validUntil || ''}
                onChange={(e) => setConfig({ ...config, validUntil: e.target.value || undefined })}
                InputLabelProps={{ shrink: true }}
                helperText="Optional - leer lassen für unbegrenzt"
              />
            </Grid>
          </Grid>
        </Box>
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose}>Abbrechen</Button>
        <Button onClick={handleSave} variant="contained" color="primary" disabled={loading}>
          Speichern
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default SalaryConfigDialog;
