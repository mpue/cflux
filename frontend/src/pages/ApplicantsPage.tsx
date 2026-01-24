import React, { useState, useEffect } from 'react';
import { applicantService } from '../services/onboardingService';
import { Applicant, ApplicantStatus } from '../types/onboarding';
import {
  Container,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Button,
  Chip,
  Box,
  TextField,
  MenuItem,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@mui/material';
import { Visibility, CheckCircle, Cancel } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';

const ApplicantsPage: React.FC = () => {
  const [applicants, setApplicants] = useState<Applicant[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<ApplicantStatus | ''>('');
  const [selectedApplicant, setSelectedApplicant] = useState<Applicant | null>(null);
  const [hireDialogOpen, setHireDialogOpen] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    loadApplicants();
  }, [statusFilter]);

  const loadApplicants = async () => {
    try {
      setLoading(true);
      const filters = statusFilter ? { status: statusFilter } : undefined;
      const data = await applicantService.getAll(filters);
      setApplicants(data);
    } catch (error) {
      console.error('Error loading applicants:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: ApplicantStatus) => {
    switch (status) {
      case ApplicantStatus.NEW:
        return 'info';
      case ApplicantStatus.IN_REVIEW:
        return 'default';
      case ApplicantStatus.INTERVIEW_SCHEDULED:
        return 'primary';
      case ApplicantStatus.OFFER:
        return 'warning';
      case ApplicantStatus.HIRED:
        return 'success';
      case ApplicantStatus.REJECTED:
        return 'error';
      default:
        return 'default';
    }
  };

  const getStatusLabel = (status: ApplicantStatus) => {
    switch (status) {
      case ApplicantStatus.NEW:
        return 'Neu';
      case ApplicantStatus.IN_REVIEW:
        return 'In Prüfung';
      case ApplicantStatus.INTERVIEW_SCHEDULED:
        return 'Gespräch geplant';
      case ApplicantStatus.OFFER:
        return 'Angebot';
      case ApplicantStatus.HIRED:
        return 'Eingestellt';
      case ApplicantStatus.REJECTED:
        return 'Abgelehnt';
      default:
        return status;
    }
  };

  const handleStatusChange = async (applicantId: string, newStatus: ApplicantStatus) => {
    try {
      await applicantService.updateStatus(applicantId, newStatus);
      loadApplicants();
    } catch (error) {
      console.error('Error updating status:', error);
    }
  };

  const handleHireApplicant = (applicant: Applicant) => {
    setSelectedApplicant(applicant);
    setHireDialogOpen(true);
  };

  const confirmHire = () => {
    if (selectedApplicant) {
      navigate(`/admin/onboarding/hire/${selectedApplicant.id}`);
    }
  };

  if (loading) {
    return (
      <Container>
        <Typography>Laden...</Typography>
      </Container>
    );
  }

  return (
    <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1">
          Bewerberverwaltung
        </Typography>
      </Box>

      <Paper sx={{ mb: 3, p: 2 }}>
        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
          <TextField
            select
            label="Status filtern"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as ApplicantStatus | '')}
            sx={{ minWidth: 200 }}
          >
            <MenuItem value="">Alle</MenuItem>
            {Object.values(ApplicantStatus).map((status) => (
              <MenuItem key={status} value={status}>
                {getStatusLabel(status)}
              </MenuItem>
            ))}
          </TextField>
        </Box>
      </Paper>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Name</TableCell>
              <TableCell>Email</TableCell>
              <TableCell>Position</TableCell>
              <TableCell>Bewerbungsdatum</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Dokumente</TableCell>
              <TableCell>Aktionen</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {applicants.map((applicant) => (
              <TableRow key={applicant.id}>
                <TableCell>
                  {applicant.firstName} {applicant.lastName}
                </TableCell>
                <TableCell>{applicant.email}</TableCell>
                <TableCell>{applicant.position}</TableCell>
                <TableCell>{new Date(applicant.appliedAt).toLocaleDateString('de-DE')}</TableCell>
                <TableCell>
                  <Chip label={getStatusLabel(applicant.status)} color={getStatusColor(applicant.status)} size="small" />
                </TableCell>
                <TableCell>
                  {applicant._count?.documents || 0} Dokumente
                </TableCell>
                <TableCell>
                  <Box sx={{ display: 'flex', gap: 1 }}>
                    <IconButton
                      size="small"
                      color="primary"
                      onClick={() => navigate(`/admin/onboarding/applicants/${applicant.id}`)}
                    >
                      <Visibility />
                    </IconButton>
                    {applicant.status === ApplicantStatus.OFFER && (
                      <IconButton
                        size="small"
                        color="success"
                        onClick={() => handleHireApplicant(applicant)}
                        title="Einstellen"
                      >
                        <CheckCircle />
                      </IconButton>
                    )}
                    {applicant.status !== ApplicantStatus.REJECTED && applicant.status !== ApplicantStatus.HIRED && (
                      <IconButton
                        size="small"
                        color="error"
                        onClick={() => handleStatusChange(applicant.id, ApplicantStatus.REJECTED)}
                        title="Ablehnen"
                      >
                        <Cancel />
                      </IconButton>
                    )}
                  </Box>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Hire Confirmation Dialog */}
      <Dialog open={hireDialogOpen} onClose={() => setHireDialogOpen(false)}>
        <DialogTitle>Bewerber einstellen</DialogTitle>
        <DialogContent>
          <Typography>
            Möchten Sie {selectedApplicant?.firstName} {selectedApplicant?.lastName} wirklich einstellen?
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
            Sie werden zum Formular weitergeleitet, um die Stammdaten zu erfassen.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setHireDialogOpen(false)}>Abbrechen</Button>
          <Button onClick={confirmHire} variant="contained" color="primary">
            Weiter
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default ApplicantsPage;
