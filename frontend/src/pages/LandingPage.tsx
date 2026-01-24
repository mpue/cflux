import React from 'react';
import {
  Container,
  Typography,
  Box,
  Button,
  Grid,
  Card,
  CardContent,
  CardActions,
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { 
  PersonAdd, 
  Login, 
  Business,
  Work,
} from '@mui/icons-material';

const LandingPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <Box
      sx={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        py: 4,
      }}
    >
      <Container maxWidth="lg">
        <Box sx={{ textAlign: 'center', mb: 6 }}>
          <Typography
            variant="h2"
            component="h1"
            gutterBottom
            sx={{ color: 'white', fontWeight: 'bold', mb: 2 }}
          >
            Willkommen bei CFlux
          </Typography>
          <Typography
            variant="h5"
            sx={{ color: 'rgba(255,255,255,0.9)', mb: 4 }}
          >
            Ihr intelligentes Zeiterfassungs- und HR-Management-System
          </Typography>
        </Box>

        <Grid container spacing={4}>
          {/* Bewerber Karte */}
          <Grid item xs={12} md={6}>
            <Card
              sx={{
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                transition: 'transform 0.2s',
                '&:hover': {
                  transform: 'translateY(-8px)',
                  boxShadow: 6,
                },
              }}
            >
              <CardContent sx={{ flexGrow: 1, textAlign: 'center', pt: 4 }}>
                <Box
                  sx={{
                    width: 80,
                    height: 80,
                    borderRadius: '50%',
                    backgroundColor: 'primary.main',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    margin: '0 auto 24px',
                  }}
                >
                  <PersonAdd sx={{ fontSize: 40, color: 'white' }} />
                </Box>
                <Typography variant="h4" component="h2" gutterBottom>
                  Bewerber
                </Typography>
                <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
                  Starten Sie Ihre Karriere bei uns! Bewerben Sie sich online,
                  laden Sie Ihre Unterlagen hoch und verfolgen Sie Ihren Bewerbungsstatus.
                </Typography>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 2 }}>
                  <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'left' }}>
                    ✅ Online-Bewerbung in wenigen Minuten
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'left' }}>
                    ✅ Dokumente einfach hochladen
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'left' }}>
                    ✅ Bewerbungsstatus jederzeit einsehen
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'left' }}>
                    ✅ Vorstellungstermine online verwalten
                  </Typography>
                </Box>
              </CardContent>
              <CardActions sx={{ justifyContent: 'center', pb: 3, flexDirection: 'column', gap: 2 }}>
                <Button
                  variant="contained"
                  size="large"
                  fullWidth
                  onClick={() => navigate('/applicant/register')}
                  startIcon={<Work />}
                >
                  Jetzt bewerben
                </Button>
                <Button
                  variant="outlined"
                  size="large"
                  fullWidth
                  onClick={() => navigate('/applicant/login')}
                  startIcon={<Login />}
                >
                  Bewerber-Login
                </Button>
              </CardActions>
            </Card>
          </Grid>

          {/* Mitarbeiter Karte */}
          <Grid item xs={12} md={6}>
            <Card
              sx={{
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                transition: 'transform 0.2s',
                '&:hover': {
                  transform: 'translateY(-8px)',
                  boxShadow: 6,
                },
              }}
            >
              <CardContent sx={{ flexGrow: 1, textAlign: 'center', pt: 4 }}>
                <Box
                  sx={{
                    width: 80,
                    height: 80,
                    borderRadius: '50%',
                    backgroundColor: 'secondary.main',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    margin: '0 auto 24px',
                  }}
                >
                  <Business sx={{ fontSize: 40, color: 'white' }} />
                </Box>
                <Typography variant="h4" component="h2" gutterBottom>
                  Mitarbeiter
                </Typography>
                <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
                  Zugang für bestehende Mitarbeiter zum Zeiterfassungs-,
                  Projekt- und HR-Management-System.
                </Typography>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 2 }}>
                  <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'left' }}>
                    ✅ Zeiterfassung und Projektmanagement
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'left' }}>
                    ✅ Urlaubsanträge und Abwesenheiten
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'left' }}>
                    ✅ Spesen- und Reisekosten
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'left' }}>
                    ✅ Intranet und Dokumentenverwaltung
                  </Typography>
                </Box>
              </CardContent>
              <CardActions sx={{ justifyContent: 'center', pb: 3 }}>
                <Button
                  variant="contained"
                  size="large"
                  fullWidth
                  onClick={() => navigate('/login')}
                  startIcon={<Login />}
                >
                  Mitarbeiter-Login
                </Button>
              </CardActions>
            </Card>
          </Grid>
        </Grid>

        <Box sx={{ textAlign: 'center', mt: 6 }}>
          <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.7)' }}>
            © 2026 CFlux - Swiss Compliance Time Tracking System
          </Typography>
        </Box>
      </Container>
    </Box>
  );
};

export default LandingPage;
