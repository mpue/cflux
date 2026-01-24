import React, { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  Container,
  Typography,
  Paper,
  Box,
  Alert,
  Button,
} from '@mui/material';
import { Email } from '@mui/icons-material';

const ApplicantVerifyEmailPage: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const email = location.state?.email;

  useEffect(() => {
    if (!email) {
      navigate('/applicant/register');
    }
  }, [email, navigate]);

  return (
    <Container maxWidth="sm" sx={{ mt: 8, mb: 4 }}>
      <Paper sx={{ p: 4, textAlign: 'center' }}>
        <Box sx={{ mb: 3 }}>
          <Email sx={{ fontSize: 80, color: 'primary.main' }} />
        </Box>
        
        <Typography variant="h4" gutterBottom>
          E-Mail-Bestätigung erforderlich
        </Typography>
        
        <Alert severity="info" sx={{ mt: 3, mb: 3, textAlign: 'left' }}>
          <Typography variant="body1" gutterBottom>
            Wir haben Ihnen eine E-Mail an <strong>{email}</strong> gesendet.
          </Typography>
          <Typography variant="body2">
            Bitte klicken Sie auf den Bestätigungslink in der E-Mail, um Ihre Bewerbung zu aktivieren.
          </Typography>
        </Alert>

        <Box sx={{ mt: 4 }}>
          <Typography variant="body2" color="text.secondary" gutterBottom>
            📧 E-Mail nicht erhalten?
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Überprüfen Sie bitte Ihren Spam-Ordner oder warten Sie einige Minuten.
          </Typography>
        </Box>

        <Box sx={{ mt: 4, display: 'flex', flexDirection: 'column', gap: 2 }}>
          <Button
            variant="outlined"
            onClick={() => navigate('/applicant/login')}
          >
            Zum Login
          </Button>
          <Button
            variant="text"
            onClick={() => navigate('/')}
          >
            Zurück zur Startseite
          </Button>
        </Box>
      </Paper>
    </Container>
  );
};

export default ApplicantVerifyEmailPage;
