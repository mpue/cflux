import React, { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Box,
  Button,
  Paper,
  Chip,
  Divider,
  CircularProgress,
} from '@mui/material';
import {
  ArrowBack,
  LocationOn,
  Work,
  Schedule,
  Send,
} from '@mui/icons-material';
import { useNavigate, useParams } from 'react-router-dom';
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

const JobDetailPage: React.FC = () => {
  const { jobId } = useParams<{ jobId: string }>();
  const navigate = useNavigate();
  const [job, setJob] = useState<Job | null>(null);
  const [loading, setLoading] = useState(true);
  const [companyName, setCompanyName] = useState('');


  useEffect(() => {
    loadJob();
    systemSettingsService.getPublicSettings().then((s) => {
      if (s.companyName) setCompanyName(s.companyName);
    }).catch(() => {});
  }, [jobId]);

  const loadJob = async () => {
    try {
      const response = await api.get(`/onboarding/jobs/public/${jobId}`);
      setJob(response.data);
    } catch {
      setJob(null);
    } finally {
      setLoading(false);
    }
  };



  const formatSalary = (j: Job) => {
    if (!j.salaryMin && !j.salaryMax) return null;
    const currency = j.salaryCurrency || 'CHF';
    if (j.salaryMin && j.salaryMax)
      return `${currency} ${j.salaryMin.toLocaleString('de-CH')} - ${j.salaryMax.toLocaleString('de-CH')}`;
    if (j.salaryMin) return `ab ${currency} ${j.salaryMin.toLocaleString('de-CH')}`;
    return `bis ${currency} ${j.salaryMax!.toLocaleString('de-CH')}`;
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

  const renderHtml = (html?: string) => {
    if (!html) return null;
    return (
      <Box
        sx={{
          lineHeight: 1.8,
          '& p': { mb: 1.5 },
          '& ul, & ol': { pl: 3, mb: 1.5 },
          '& li': { mb: 0.75 },
          '& h1, & h2, & h3, & h4': { mt: 2, mb: 1 },
        }}
        dangerouslySetInnerHTML={{ __html: html }}
      />
    );
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (!job) {
    return (
      <Container maxWidth="md" sx={{ py: 8, textAlign: 'center' }}>
        <Typography variant="h5" color="text.secondary" gutterBottom>
          Stelle nicht gefunden
        </Typography>
        <Button variant="contained" onClick={() => navigate('/jobs')}>
          Zurück zur Jobbörse
        </Button>
      </Container>
    );
  }

  return (
    <Box sx={{ minHeight: '100vh', backgroundColor: '#f8f9fa' }}>
      {/* Header */}
      <Box
        sx={{
          background: 'linear-gradient(135deg, #1976d2 0%, #1565c0 100%)',
          color: 'white',
          py: 4,
          px: 2,
        }}
      >
        <Container maxWidth="md">
          <Button
            startIcon={<ArrowBack />}
            onClick={() => navigate('/jobs')}
            sx={{ color: 'white', mb: 2 }}
          >
            Alle Stellen
          </Button>
          <Typography variant="h3" component="h1" sx={{ fontWeight: 'bold', mb: 1 }}>
            {job.title}
          </Typography>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mt: 2 }}>
            {job.department && (
              <Chip icon={<Work />} label={job.department} sx={{ color: 'white', borderColor: 'rgba(255,255,255,0.5)' }} variant="outlined" />
            )}
            {job.location && (
              <Chip icon={<LocationOn />} label={job.location} sx={{ color: 'white', borderColor: 'rgba(255,255,255,0.5)' }} variant="outlined" />
            )}
            {getEmploymentTypeLabel(job.employmentType) && (
              <Chip icon={<Schedule />} label={getEmploymentTypeLabel(job.employmentType)} sx={{ color: 'white', borderColor: 'rgba(255,255,255,0.5)' }} variant="outlined" />
            )}
            {job.workload && (
              <Chip label={job.workload} sx={{ color: 'white', borderColor: 'rgba(255,255,255,0.5)' }} variant="outlined" />
            )}
          </Box>
        </Container>
      </Box>

      {/* Content */}
      <Container maxWidth="md" sx={{ py: 4 }}>
        <Paper sx={{ p: 4, mb: 3 }}>
          {job.description && (
            <Box sx={{ mb: 3 }}>
              <Typography variant="h6" sx={{ fontWeight: 600, mb: 1 }}>
                Beschreibung
              </Typography>
              {renderHtml(job.description)}
            </Box>
          )}

          {job.responsibilities && (
            <>
              <Divider sx={{ my: 3 }} />
              <Box sx={{ mb: 3 }}>
                <Typography variant="h6" sx={{ fontWeight: 600, mb: 1 }}>
                  Aufgaben
                </Typography>
                {renderHtml(job.responsibilities)}
              </Box>
            </>
          )}

          {job.requirements && (
            <>
              <Divider sx={{ my: 3 }} />
              <Box sx={{ mb: 3 }}>
                <Typography variant="h6" sx={{ fontWeight: 600, mb: 1 }}>
                  Anforderungen
                </Typography>
                {renderHtml(job.requirements)}
              </Box>
            </>
          )}

          {job.benefits && (
            <>
              <Divider sx={{ my: 3 }} />
              <Box sx={{ mb: 3 }}>
                <Typography variant="h6" sx={{ fontWeight: 600, mb: 1 }}>
                  Was wir bieten
                </Typography>
                {renderHtml(job.benefits)}
              </Box>
            </>
          )}

          {formatSalary(job) && (
            <>
              <Divider sx={{ my: 3 }} />
              <Box>
                <Typography variant="h6" sx={{ fontWeight: 600, mb: 1 }}>
                  Vergütung
                </Typography>
                <Typography variant="h5" sx={{ color: 'success.main' }}>
                  {formatSalary(job)}
                </Typography>
              </Box>
            </>
          )}
        </Paper>

        {/* Apply section */}
        <Box sx={{ textAlign: 'center' }}>
          <Button
            variant="contained"
            size="large"
            startIcon={<Send />}
            onClick={() => navigate(`/applicant/register?position=${encodeURIComponent(job.title)}`)}
            sx={{ px: 6, py: 1.5, fontSize: '1.1rem' }}
          >
            Jetzt bewerben
          </Button>
        </Box>
      </Container>
    </Box>
  );
};

export default JobDetailPage;
