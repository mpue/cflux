import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import {
  Container,
  Typography,
  Paper,
  Box,
  Alert,
  CircularProgress,
  Button,
} from '@mui/material';
import { CheckCircle, Error as ErrorIcon } from '@mui/icons-material';
import api from '../services/api';

const ApplicantVerifyPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [verifying, setVerifying] = useState(true);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const token = searchParams.get('token');

  useEffect(() => {
    const verifyEmail = async () => {
      if (!token) {
        setError('Kein Verifizierungstoken gefunden');
        setVerifying(false);
        return;
      }

      try {
        await api.get(`/applicants/verify/${token}`);
        setSuccess(true);
      } catch (err: any) {
        console.error('Verification error:', err);
        setError(
          err.response?.data?.error || 
          'Verifizierung fehlgeschlagen. Der Link ist möglicherweise ungültig oder abgelaufen.'
        );
      } finally {
        setVerifying(false);
      }
    };

    verifyEmail();
  }, [token]);

  return (
    <Box
      sx={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 2,
      }}
    >
      <Container maxWidth="sm">
        <Paper
          elevation={10}
          sx={{
            padding: 4,
            borderRadius: 4,
            background: 'rgba(255, 255, 255, 0.95)',
            backdropFilter: 'blur(10px)',
            textAlign: 'center',
          }}
        >
          {verifying && (
            <Box>
              <CircularProgress size={60} sx={{ mb: 3 }} />
              <Typography variant="h5" gutterBottom>
                E-Mail wird verifiziert...
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Einen Moment bitte
              </Typography>
            </Box>
          )}

          {!verifying && success && (
            <Box>
              <CheckCircle
                sx={{
                  fontSize: 80,
                  color: 'success.main',
                  mb: 2,
                }}
              />
              <Typography variant="h4" gutterBottom sx={{ fontWeight: 600 }}>
                ✅ E-Mail erfolgreich bestätigt!
              </Typography>
              <Alert severity="success" sx={{ mt: 3, mb: 3, textAlign: 'left' }}>
                <Typography variant="body1">
                  Ihre E-Mail-Adresse wurde erfolgreich verifiziert. Sie können sich jetzt anmelden und
                  Ihre Bewerbungsunterlagen hochladen.
                </Typography>
              </Alert>
              <Box sx={{ mt: 4, display: 'flex', flexDirection: 'column', gap: 2 }}>
                <Button
                  variant="contained"
                  size="large"
                  onClick={() => navigate('/applicant/login')}
                  sx={{
                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    color: 'white',
                    fontWeight: 600,
                    '&:hover': {
                      background: 'linear-gradient(135deg, #5568d3 0%, #6a4493 100%)',
                    },
                  }}
                >
                  Jetzt anmelden
                </Button>
                <Button
                  variant="text"
                  onClick={() => navigate('/')}
                >
                  Zurück zur Startseite
                </Button>
              </Box>
            </Box>
          )}

          {!verifying && error && (
            <Box>
              <ErrorIcon
                sx={{
                  fontSize: 80,
                  color: 'error.main',
                  mb: 2,
                }}
              />
              <Typography variant="h4" gutterBottom sx={{ fontWeight: 600 }}>
                ❌ Verifizierung fehlgeschlagen
              </Typography>
              <Alert severity="error" sx={{ mt: 3, mb: 3, textAlign: 'left' }}>
                <Typography variant="body1">
                  {error}
                </Typography>
              </Alert>
              <Box sx={{ mt: 4, display: 'flex', flexDirection: 'column', gap: 2 }}>
                <Button
                  variant="outlined"
                  onClick={() => navigate('/applicant/register')}
                >
                  Neue Bewerbung einreichen
                </Button>
                <Button
                  variant="text"
                  onClick={() => navigate('/')}
                >
                  Zurück zur Startseite
                </Button>
              </Box>
            </Box>
          )}
        </Paper>
      </Container>
    </Box>
  );
};

export default ApplicantVerifyPage;
