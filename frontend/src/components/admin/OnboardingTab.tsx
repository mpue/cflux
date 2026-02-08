import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Box, Typography, Button, Grid, Card, CardContent, Tabs, Tab } from '@mui/material';
import { PersonAdd, People, Assignment, Build, School, Dashboard, Description } from '@mui/icons-material';
import ApplicantsTab from './ApplicantsTab';
import OnboardingDashboardTab from './OnboardingDashboardTab';
import OnboardingTemplatesTab from './OnboardingTemplatesTab';

interface OnboardingTabProps {
  onUpdate?: () => void;
}

type SubTab = 'overview' | 'dashboard' | 'applicants' | 'employees' | 'equipment' | 'training' | 'templates';

const OnboardingTab: React.FC<OnboardingTabProps> = ({ onUpdate }) => {
  const navigate = useNavigate();
  const [activeSubTab, setActiveSubTab] = useState<SubTab>('overview');

  const handleTabChange = (_event: React.SyntheticEvent, newValue: SubTab) => {
    setActiveSubTab(newValue);
  };

  const renderOverview = () => {
    const cards = [
      {
        title: 'Bewerberverwaltung',
        description: 'Verwalten Sie Bewerbungen und führen Sie Interviews durch',
        icon: <PersonAdd sx={{ fontSize: 48 }} />,
        action: () => setActiveSubTab('applicants'),
        color: '#2196f3',
      },
      {
        title: 'Onboarding Dashboard',
        description: 'Übersicht aller laufenden Onboarding-Prozesse',
        icon: <Assignment sx={{ fontSize: 48 }} />,
        action: () => setActiveSubTab('dashboard'),
        color: '#4caf50',
      },
      {
        title: 'Vorlagen',
        description: 'Checklisten und Schulungen für Onboarding-Prozesse verwalten',
        icon: <Description sx={{ fontSize: 48 }} />,
        action: () => setActiveSubTab('templates'),
        color: '#00bcd4',
      },
      {
        title: 'Mitarbeiter',
        description: 'Mitarbeiterverwaltung und Onboarding-Status',
        icon: <People sx={{ fontSize: 48 }} />,
        action: () => navigate('/admin/onboarding/employees'),
        color: '#ff9800',
      },
      {
        title: 'Equipment',
        description: 'Geräte und Ausrüstung verwalten',
        icon: <Build sx={{ fontSize: 48 }} />,
        action: () => navigate('/admin/onboarding/equipment'),
        color: '#9c27b0',
      },
      {
        title: 'Schulungen',
        description: 'Schulungskatalog und Sitzungen planen',
        icon: <School sx={{ fontSize: 48 }} />,
        action: () => navigate('/admin/onboarding/training'),
        color: '#f44336',
      },
    ];

    return (
      <>
        <Typography variant="h4" gutterBottom>
          Onboarding-Modul
        </Typography>
        <Typography variant="body1" color="textSecondary" paragraph>
          Verwalten Sie den gesamten Onboarding-Prozess von der Bewerbung bis zur vollständigen Integration neuer Mitarbeiter.
        </Typography>

        <Grid container spacing={3} sx={{ mt: 2 }}>
          {cards.map((card, index) => (
            <Grid item xs={12} sm={6} md={4} key={index}>
              <Card
                sx={{
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  transition: 'transform 0.2s, box-shadow 0.2s',
                  '&:hover': {
                    transform: 'translateY(-4px)',
                    boxShadow: 4,
                    cursor: 'pointer',
                  },
                }}
                onClick={card.action}
              >
                <CardContent sx={{ flexGrow: 1, textAlign: 'center' }}>
                  <Box
                    sx={{
                      color: card.color,
                      mb: 2,
                      display: 'flex',
                      justifyContent: 'center',
                    }}
                  >
                    {card.icon}
                  </Box>
                  <Typography variant="h6" component="h2" gutterBottom>
                    {card.title}
                  </Typography>
                  <Typography variant="body2" color="textSecondary">
                    {card.description}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          ))}
          </Grid>

        <Box sx={{ mt: 4 }}>
          <Typography variant="h6" gutterBottom>
            Features
          </Typography>
          <Grid container spacing={2}>
            <Grid item xs={12} md={6}>
              <Typography variant="body2" component="div">
                <strong>Pre-Onboarding:</strong>
                <ul>
                  <li>Bewerberverwaltung mit Email-Verifikation</li>
                  <li>Dokumenten-Upload (CV, Zeugnisse, Anschreiben)</li>
                  <li>Interview-Terminplanung</li>
                  <li>HR-interne Notizen</li>
                </ul>
              </Typography>
            </Grid>
            <Grid item xs={12} md={6}>
              <Typography variant="body2" component="div">
                <strong>Main Onboarding:</strong>
                <ul>
                  <li>Automatische Mitarbeiter-Erstellung</li>
                  <li>Vertragsmanagement mit Unterschriftenstatus</li>
                  <li>Aufgabenverwaltung mit Auto-Generierung</li>
                  <li>Fortschrittsverfolgung</li>
                </ul>
              </Typography>
            </Grid>
            <Grid item xs={12} md={6}>
              <Typography variant="body2" component="div">
                <strong>Post-Onboarding:</strong>
                <ul>
                  <li>Equipment-Zuweisung mit Übergabeprotokoll</li>
                  <li>Schulungsmanagement mit Auto-Zuweisung</li>
                  <li>Teilnahmebestätigungen und Zertifikate</li>
                  <li>IT-Compliance Checklisten</li>
                </ul>
              </Typography>
            </Grid>
            <Grid item xs={12} md={6}>
              <Typography variant="body2" component="div">
                <strong>Reporting:</strong>
                <ul>
                  <li>Onboarding Dashboard mit Fortschrittsbalken</li>
                  <li>Überfällige Aufgaben</li>
                  <li>Mitarbeiter-Statistiken</li>
                  <li>PDF-Übergabeprotokolle</li>
                </ul>
              </Typography>
            </Grid>
          </Grid>
        </Box>
      </>
    );
  };

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs value={activeSubTab} onChange={handleTabChange}>
          <Tab icon={<Dashboard />} label="Übersicht" value="overview" />
          <Tab icon={<Assignment />} label="Dashboard" value="dashboard" />
          <Tab icon={<PersonAdd />} label="Bewerber" value="applicants" />
          <Tab icon={<Description />} label="Vorlagen" value="templates" />
          <Tab icon={<People />} label="Mitarbeiter" value="employees" disabled />
          <Tab icon={<Build />} label="Equipment" value="equipment" disabled />
          <Tab icon={<School />} label="Schulungen" value="training" disabled />
        </Tabs>
      </Box>

      {activeSubTab === 'overview' && renderOverview()}
      {activeSubTab === 'dashboard' && <OnboardingDashboardTab />}
      {activeSubTab === 'applicants' && <ApplicantsTab onUpdate={onUpdate} />}
      {activeSubTab === 'templates' && <OnboardingTemplatesTab onUpdate={onUpdate} />}
      {activeSubTab === 'employees' && (
        <Typography>Mitarbeiter-Verwaltung (in Entwicklung)</Typography>
      )}
      {activeSubTab === 'equipment' && (
        <Typography>Equipment-Verwaltung (in Entwicklung)</Typography>
      )}
      {activeSubTab === 'training' && (
        <Typography>Schulungs-Verwaltung (in Entwicklung)</Typography>
      )}
    </Box>
  );
};

export default OnboardingTab;
