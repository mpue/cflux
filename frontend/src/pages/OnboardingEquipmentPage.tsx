import React from 'react';
import { Container, Paper, Box, Typography, Button } from '@mui/material';
import { ArrowBack } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import OnboardingEquipmentSubTab from '../components/admin/OnboardingEquipmentSubTab';

const OnboardingEquipmentPage: React.FC = () => {
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
          Onboarding - Equipment
        </Typography>
      </Box>
      
      <Paper sx={{ p: 3 }}>
        <OnboardingEquipmentSubTab />
      </Paper>
    </Container>
  );
};

export default OnboardingEquipmentPage;
