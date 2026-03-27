import React from 'react';
import { Container, Paper, Box, Typography, Button } from '@mui/material';
import { ArrowBack } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import OnboardingTrainingSubTab from '../components/admin/OnboardingTrainingSubTab';

const OnboardingTrainingPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 3, gap: 2 }}>
        <Button
          startIcon={<ArrowBack />}
          onClick={() => navigate('/admin')}
          variant="outlined"
        >
          Zurück
        </Button>
        <Typography variant="h4" component="h1">
          Onboarding - Schulungen
        </Typography>
      </Box>
      
      <Paper sx={{ p: 3 }}>
        <OnboardingTrainingSubTab />
      </Paper>
    </Container>
  );
};

export default OnboardingTrainingPage;
