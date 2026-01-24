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
  Stepper,
  Step,
  StepLabel,
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';

const ApplicantRegisterPage: React.FC = () => {
  const navigate = useNavigate();
  const [activeStep, setActiveStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    position: '',
  });

  const steps = ['Persönliche Daten', 'Bestätigung'];

  const validateEmail = (email: string) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };

  const validatePhone = (phone: string) => {
    return /^[+]?[(]?[0-9]{1,4}[)]?[-\s.]?[(]?[0-9]{1,4}[)]?[-\s.]?[0-9]{1,9}$/.test(phone);
  };

  const handleChange = (field: string) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [field]: e.target.value });
    setError(null);
  };

  const handleNext = () => {
    // Validierung für Schritt 0
    if (activeStep === 0) {
      if (!formData.firstName.trim()) {
        setError('Bitte geben Sie Ihren Vornamen ein.');
        return;
      }
      if (!formData.lastName.trim()) {
        setError('Bitte geben Sie Ihren Nachnamen ein.');
        return;
      }
      if (!formData.email.trim() || !validateEmail(formData.email)) {
        setError('Bitte geben Sie eine gültige E-Mail-Adresse ein.');
        return;
      }
      if (!formData.phone.trim() || !validatePhone(formData.phone)) {
        setError('Bitte geben Sie eine gültige Telefonnummer ein.');
        return;
      }
      if (!formData.position.trim()) {
        setError('Bitte geben Sie die gewünschte Position ein.');
        return;
      }
    }

    setActiveStep((prev) => prev + 1);
  };

  const handleBack = () => {
    setActiveStep((prev) => prev - 1);
    setError(null);
  };

  const handleSubmit = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await api.post('/applicants/register', formData);

      setSuccess(true);
      setTimeout(() => {
        // Weiterleitung zum Verifizierungs-Hinweis
        navigate('/applicant/verify-email', { 
          state: { email: formData.email, applicantId: response.data.id } 
        });
      }, 2000);
    } catch (err: any) {
      console.error('Registration error:', err);
      setError(
        err.response?.data?.error || 
        'Fehler bei der Registrierung. Bitte versuchen Sie es später erneut.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container maxWidth="md" sx={{ mt: 8, mb: 4 }}>
      <Paper sx={{ p: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom align="center">
          🎯 Bewerbung bei CFlux
        </Typography>
        <Typography variant="body1" color="text.secondary" align="center" sx={{ mb: 4 }}>
          Starten Sie Ihre Karriere bei uns! Füllen Sie das Formular aus und laden Sie Ihre Bewerbungsunterlagen hoch.
        </Typography>

        <Stepper activeStep={activeStep} sx={{ mb: 4 }}>
          {steps.map((label) => (
            <Step key={label}>
              <StepLabel>{label}</StepLabel>
            </Step>
          ))}
        </Stepper>

        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}

        {success && (
          <Alert severity="success" sx={{ mb: 3 }}>
            ✅ Bewerbung erfolgreich eingereicht! Sie erhalten eine Bestätigungs-E-Mail.
          </Alert>
        )}

        {activeStep === 0 && (
          <Box>
            <TextField
              fullWidth
              label="Vorname *"
              value={formData.firstName}
              onChange={handleChange('firstName')}
              margin="normal"
              disabled={loading}
            />
            <TextField
              fullWidth
              label="Nachname *"
              value={formData.lastName}
              onChange={handleChange('lastName')}
              margin="normal"
              disabled={loading}
            />
            <TextField
              fullWidth
              label="E-Mail-Adresse *"
              type="email"
              value={formData.email}
              onChange={handleChange('email')}
              margin="normal"
              disabled={loading}
              helperText="Sie erhalten eine Bestätigungs-E-Mail an diese Adresse."
            />
            <TextField
              fullWidth
              label="Telefonnummer *"
              value={formData.phone}
              onChange={handleChange('phone')}
              margin="normal"
              disabled={loading}
              placeholder="+41 79 123 45 67"
            />
            <TextField
              fullWidth
              label="Gewünschte Position *"
              value={formData.position}
              onChange={handleChange('position')}
              margin="normal"
              disabled={loading}
              placeholder="z.B. Software Developer, Project Manager, etc."
            />
          </Box>
        )}

        {activeStep === 1 && (
          <Box>
            <Typography variant="h6" gutterBottom>
              Zusammenfassung Ihrer Bewerbung
            </Typography>
            <Box sx={{ mt: 2 }}>
              <Typography><strong>Name:</strong> {formData.firstName} {formData.lastName}</Typography>
              <Typography><strong>E-Mail:</strong> {formData.email}</Typography>
              <Typography><strong>Telefon:</strong> {formData.phone}</Typography>
              <Typography><strong>Position:</strong> {formData.position}</Typography>
            </Box>
            <Alert severity="info" sx={{ mt: 3 }}>
              Nach der Registrierung erhalten Sie eine E-Mail zur Verifizierung Ihrer Adresse. 
              Anschließend können Sie im Bewerber-Portal Ihre Unterlagen hochladen.
            </Alert>
          </Box>
        )}

        <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 4 }}>
          <Button
            disabled={activeStep === 0 || loading}
            onClick={handleBack}
          >
            Zurück
          </Button>
          <Box sx={{ display: 'flex', gap: 2 }}>
            {activeStep < steps.length - 1 ? (
              <Button
                variant="contained"
                onClick={handleNext}
                disabled={loading}
              >
                Weiter
              </Button>
            ) : (
              <Button
                variant="contained"
                color="primary"
                onClick={handleSubmit}
                disabled={loading || success}
                startIcon={loading ? <CircularProgress size={20} /> : null}
              >
                {loading ? 'Wird gesendet...' : 'Bewerbung absenden'}
              </Button>
            )}
          </Box>
        </Box>

        <Box sx={{ mt: 4, textAlign: 'center' }}>
          <Typography variant="body2" color="text.secondary">
            Haben Sie bereits ein Bewerber-Konto?{' '}
            <Button 
              variant="text" 
              onClick={() => navigate('/applicant/login')}
              disabled={loading}
            >
              Anmelden
            </Button>
          </Typography>
        </Box>
      </Paper>
    </Container>
  );
};

export default ApplicantRegisterPage;
