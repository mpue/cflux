import React, { useState } from 'react';
import {
  Container,
  Typography,
  Paper,
  TextField,
  Button,
  Box,
  Alert,
  CircularProgress,
  Link as MuiLink,
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';

const ApplicantLoginPage: React.FC = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email.trim()) {
      setError('Bitte geben Sie Ihre E-Mail-Adresse ein.');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Vereinfachter Login: Nur E-Mail-basierte Authentifizierung
      // In der Produktion sollte hier ein Token/Password-System verwendet werden
      const response = await api.post('/onboarding/applicants/login', { email });
      
      // Speichere Applicant ID im localStorage
      localStorage.setItem('applicantId', response.data.id);
      localStorage.setItem('applicantEmail', response.data.email);
      
      // Weiterleitung zum Portal
      navigate('/applicant/portal');
    } catch (err: any) {
      console.error('Login error:', err);
      setError(
        err.response?.data?.error || 
        'Anmeldung fehlgeschlagen. Bitte überprüfen Sie Ihre E-Mail-Adresse.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container maxWidth="sm" sx={{ mt: 8, mb: 4 }}>
      <Paper sx={{ p: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom align="center">
          🔐 Bewerber-Login
        </Typography>
        <Typography variant="body1" color="text.secondary" align="center" sx={{ mb: 4 }}>
          Melden Sie sich mit Ihrer E-Mail-Adresse an, um auf Ihr Bewerber-Portal zuzugreifen.
        </Typography>

        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}

        <form onSubmit={handleSubmit}>
          <TextField
            fullWidth
            label="E-Mail-Adresse"
            type="email"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              setError(null);
            }}
            margin="normal"
            disabled={loading}
            autoFocus
            required
          />

          <Button
            type="submit"
            fullWidth
            variant="contained"
            size="large"
            sx={{ mt: 3 }}
            disabled={loading || !email.trim()}
            startIcon={loading ? <CircularProgress size={20} /> : null}
          >
            {loading ? 'Wird angemeldet...' : 'Anmelden'}
          </Button>
        </form>

        <Box sx={{ mt: 4, textAlign: 'center' }}>
          <Typography variant="body2" color="text.secondary">
            Noch keine Bewerbung eingereicht?
          </Typography>
          <Button
            variant="text"
            onClick={() => navigate('/applicant/register')}
            disabled={loading}
            sx={{ mt: 1 }}
          >
            Jetzt bewerben
          </Button>
        </Box>

        <Box sx={{ mt: 3, textAlign: 'center' }}>
          <MuiLink
            component="button"
            variant="body2"
            onClick={() => navigate('/')}
            disabled={loading}
          >
            Zurück zur Startseite
          </MuiLink>
        </Box>
      </Paper>

      <Box sx={{ mt: 3 }}>
        <Alert severity="info">
          <Typography variant="body2">
            <strong>Hinweis:</strong> Wenn Sie Ihre E-Mail-Adresse noch nicht verifiziert haben, 
            überprüfen Sie bitte Ihr Postfach und klicken Sie auf den Bestätigungslink.
          </Typography>
        </Alert>
      </Box>
    </Container>
  );
};

export default ApplicantLoginPage;
