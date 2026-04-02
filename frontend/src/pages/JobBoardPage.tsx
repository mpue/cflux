import React, { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Box,
  Card,
  CardContent,
  CardActions,
  Button,
  Grid,
  Chip,
  TextField,
  InputAdornment,
  CircularProgress,
} from '@mui/material';
import {
  Search,
  LocationOn,
  Work,
  Schedule,
  ArrowBack,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { systemSettingsService } from '../services/systemSettings.service';

interface Job {
  id: string;
  title: string;
  description?: string;
  department?: string;
  employmentType?: string;
  location?: string;
  workload?: string;
  requirements?: string;
  responsibilities?: string;
  benefits?: string;
  salaryMin?: number;
  salaryMax?: number;
  salaryCurrency: string;
  createdAt: string;
}

const JobBoardPage: React.FC = () => {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [companyLogo, setCompanyLogo] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    loadJobs();
    systemSettingsService.getPublicSettings().then((s) => {
      if (s.companyName) setCompanyName(s.companyName);
      if (s.companyLogo) setCompanyLogo(s.companyLogo);
    }).catch(() => {});
  }, []);

  const loadJobs = async () => {
    try {
      const response = await api.get('/onboarding/jobs/public');
      setJobs(response.data);
    } catch (error) {
      console.error('Error loading jobs:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredJobs = jobs.filter((job) => {
    const q = search.toLowerCase();
    return (
      job.title.toLowerCase().includes(q) ||
      (job.department && job.department.toLowerCase().includes(q)) ||
      (job.location && job.location.toLowerCase().includes(q))
    );
  });

  const formatSalary = (job: Job) => {
    if (!job.salaryMin && !job.salaryMax) return null;
    const currency = job.salaryCurrency || 'CHF';
    if (job.salaryMin && job.salaryMax) {
      return `${currency} ${job.salaryMin.toLocaleString('de-CH')} - ${job.salaryMax.toLocaleString('de-CH')}`;
    }
    if (job.salaryMin) return `ab ${currency} ${job.salaryMin.toLocaleString('de-CH')}`;
    return `bis ${currency} ${job.salaryMax!.toLocaleString('de-CH')}`;
  };

  const getEmploymentTypeLabel = (type?: string) => {
    const labels: Record<string, string> = {
      FULL_TIME: 'Vollzeit',
      PART_TIME: 'Teilzeit',
      TEMPORARY: 'Temporär',
      INTERNSHIP: 'Praktikum',
      APPRENTICESHIP: 'Lehrstelle',
    };
    return type ? labels[type] || type : null;
  };

  return (
    <Box sx={{ minHeight: '100vh', backgroundColor: '#f8f9fa' }}>
      {/* Header */}
      <Box
        sx={{
          background: 'linear-gradient(135deg, #1976d2 0%, #1565c0 100%)',
          color: 'white',
          py: 6,
          px: 2,
        }}
      >
        <Container maxWidth="lg">
          <Button
            startIcon={<ArrowBack />}
            onClick={() => navigate('/')}
            sx={{ color: 'white', mb: 2 }}
          >
            Zurück
          </Button>
          {companyLogo && (
            <Box sx={{ mb: 2 }}>
              <img
                src={companyLogo}
                alt={companyName}
                style={{ maxWidth: '180px', maxHeight: '60px', objectFit: 'contain' }}
              />
            </Box>
          )}
          <Typography variant="h3" component="h1" sx={{ fontWeight: 'bold', mb: 1 }}>
            Karriere bei {companyName || 'uns'}
          </Typography>
          <Typography variant="h6" sx={{ opacity: 0.9, mb: 3 }}>
            Entdecken Sie unsere offenen Stellen und werden Sie Teil unseres Teams
          </Typography>
          <TextField
            fullWidth
            placeholder="Stelle, Abteilung oder Standort suchen..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Search sx={{ color: 'rgba(0,0,0,0.5)' }} />
                </InputAdornment>
              ),
            }}
            sx={{
              maxWidth: 600,
              backgroundColor: 'white',
              borderRadius: 2,
              '& .MuiOutlinedInput-root': {
                borderRadius: 2,
              },
            }}
          />
        </Container>
      </Box>

      {/* Jobs */}
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
          {filteredJobs.length} {filteredJobs.length === 1 ? 'Stelle' : 'Stellen'} gefunden
        </Typography>

        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
            <CircularProgress />
          </Box>
        ) : filteredJobs.length === 0 ? (
          <Box sx={{ textAlign: 'center', py: 8 }}>
            <Work sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
            <Typography variant="h6" color="text.secondary">
              {search
                ? 'Keine Stellen für Ihre Suche gefunden'
                : 'Aktuell sind keine offenen Stellen verfügbar'}
            </Typography>
          </Box>
        ) : (
          <Grid container spacing={3}>
            {filteredJobs.map((job) => (
              <Grid item xs={12} md={6} key={job.id}>
                <Card
                  sx={{
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    transition: 'transform 0.2s, box-shadow 0.2s',
                    '&:hover': {
                      transform: 'translateY(-4px)',
                      boxShadow: 6,
                      cursor: 'pointer',
                    },
                  }}
                  onClick={() => navigate(`/jobs/${job.id}`)}
                >
                  <CardContent sx={{ flexGrow: 1 }}>
                    <Typography variant="h5" component="h2" sx={{ fontWeight: 600, mb: 1 }}>
                      {job.title}
                    </Typography>

                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 2 }}>
                      {job.department && (
                        <Chip
                          icon={<Work />}
                          label={job.department}
                          size="small"
                          variant="outlined"
                        />
                      )}
                      {job.location && (
                        <Chip
                          icon={<LocationOn />}
                          label={job.location}
                          size="small"
                          variant="outlined"
                        />
                      )}
                      {getEmploymentTypeLabel(job.employmentType) && (
                        <Chip
                          icon={<Schedule />}
                          label={getEmploymentTypeLabel(job.employmentType)}
                          size="small"
                          variant="outlined"
                        />
                      )}
                      {job.workload && (
                        <Chip label={job.workload} size="small" variant="outlined" />
                      )}
                    </Box>

                    {job.description && (
                      <Box
                        sx={{
                          display: '-webkit-box',
                          WebkitLineClamp: 3,
                          WebkitBoxOrient: 'vertical',
                          overflow: 'hidden',
                          mb: 2,
                          color: 'text.secondary',
                          fontSize: '0.875rem',
                          lineHeight: 1.8,
                          '& p': { m: 0 },
                          '& ul, & ol': { m: 0, pl: 2 },
                        }}
                        dangerouslySetInnerHTML={{ __html: job.description }}
                      />
                    )}

                    {formatSalary(job) && (
                      <Typography variant="body2" sx={{ fontWeight: 600, color: 'success.main' }}>
                        {formatSalary(job)}
                      </Typography>
                    )}
                  </CardContent>
                  <CardActions sx={{ px: 2, pb: 2 }}>
                    <Button variant="contained" size="small">
                      Details anzeigen
                    </Button>
                    <Typography variant="caption" color="text.secondary" sx={{ ml: 'auto' }}>
                      {new Date(job.createdAt).toLocaleDateString('de-CH')}
                    </Typography>
                  </CardActions>
                </Card>
              </Grid>
            ))}
          </Grid>
        )}
      </Container>
    </Box>
  );
};

export default JobBoardPage;
