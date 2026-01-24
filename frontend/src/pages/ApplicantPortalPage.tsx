import React, { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Paper,
  Box,
  Grid,
  Card,
  CardContent,
  Button,
  Chip,
  Alert,
  LinearProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  IconButton,
  Divider,
} from '@mui/material';
import {
  Upload,
  CheckCircle,
  Pending,
  Description,
  Event,
  Delete,
  Download,
} from '@mui/icons-material';
import api, { getBackendURL } from '../services/api';
import { OnboardingDocumentType } from '../types/onboarding';

interface ApplicantData {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone: string;
  position: string;
  status: string;
  appliedAt: string;
  documents: any[];
  interviews: any[];
}

const ApplicantPortalPage: React.FC = () => {
  const [applicant, setApplicant] = useState<ApplicantData | null>(null);
  const [loading, setLoading] = useState(true);
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [uploadData, setUploadData] = useState({
    documentType: OnboardingDocumentType.CV,
    file: null as File | null,
  });

  useEffect(() => {
    loadApplicantData();
  }, []);

  const loadApplicantData = async () => {
    try {
      setLoading(true);
      // In der echten Implementierung würde hier ein Token aus localStorage/SessionStorage verwendet
      const applicantId = localStorage.getItem('applicantId');
      
      if (!applicantId) {
        setError('Keine gültige Sitzung. Bitte melden Sie sich an.');
        return;
      }

      const response = await api.get(`/applicants/${applicantId}`);
      setApplicant(response.data);
    } catch (err: any) {
      console.error('Error loading applicant:', err);
      setError('Fehler beim Laden der Daten. Bitte versuchen Sie es später erneut.');
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setUploadData({ ...uploadData, file: e.target.files[0] });
    }
  };

  const handleUpload = async () => {
    if (!uploadData.file || !applicant) {
      setError('Bitte wählen Sie eine Datei aus.');
      return;
    }

    try {
      setUploading(true);
      setError(null);

      const formData = new FormData();
      formData.append('file', uploadData.file);
      formData.append('documentType', uploadData.documentType);

      await api.post(`/applicants/${applicant.id}/documents`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      setSuccess('Dokument erfolgreich hochgeladen!');
      setUploadDialogOpen(false);
      setUploadData({ documentType: OnboardingDocumentType.CV, file: null });
      loadApplicantData();

      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      console.error('Upload error:', err);
      setError(err.response?.data?.error || 'Fehler beim Hochladen. Bitte versuchen Sie es erneut.');
    } finally {
      setUploading(false);
    }
  };

  const handleDeleteDocument = async (documentId: string) => {
    if (!applicant || !window.confirm('Möchten Sie dieses Dokument wirklich löschen?')) {
      return;
    }

    try {
      await api.delete(`/applicants/${applicant.id}/documents/${documentId}`);
      setSuccess('Dokument gelöscht.');
      loadApplicantData();
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      console.error('Delete error:', err);
      setError('Fehler beim Löschen.');
    }
  };

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      NEW: 'Neu',
      IN_REVIEW: 'In Prüfung',
      INTERVIEW_SCHEDULED: 'Gespräch geplant',
      OFFER: 'Angebot erhalten',
      HIRED: 'Eingestellt',
      REJECTED: 'Abgelehnt',
    };
    return labels[status] || status;
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, any> = {
      NEW: 'info',
      IN_REVIEW: 'default',
      INTERVIEW_SCHEDULED: 'primary',
      OFFER: 'warning',
      HIRED: 'success',
      REJECTED: 'error',
    };
    return colors[status] || 'default';
  };

  const getDocumentTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      CV: 'Lebenslauf',
      COVER_LETTER: 'Anschreiben',
      CERTIFICATE: 'Zeugnis',
      CONTRACT: 'Vertrag',
      PRIVACY_POLICY: 'Datenschutzerklärung',
      IT_GUIDELINES: 'IT-Richtlinien',
      NDA: 'Vertraulichkeitsvereinbarung',
      CONFIDENTIALITY: 'Geheimhaltung',
      OTHER: 'Sonstiges',
    };
    return labels[type] || type;
  };

  const calculateProgress = () => {
    if (!applicant) return 0;
    
    let completed = 0;
    const total = 3; // Mindestanforderungen: CV, Anschreiben, 1 Zeugnis

    const hasCV = applicant.documents.some(d => d.documentType === 'CV');
    const hasCoverLetter = applicant.documents.some(d => d.documentType === 'COVER_LETTER');
    const hasCertificate = applicant.documents.some(d => d.documentType === 'CERTIFICATE');

    if (hasCV) completed++;
    if (hasCoverLetter) completed++;
    if (hasCertificate) completed++;

    return (completed / total) * 100;
  };

  if (loading) {
    return (
      <Container>
        <Box sx={{ mt: 4 }}>
          <LinearProgress />
          <Typography sx={{ mt: 2 }}>Laden...</Typography>
        </Box>
      </Container>
    );
  }

  if (!applicant) {
    return (
      <Container maxWidth="sm" sx={{ mt: 8 }}>
        <Alert severity="error">{error || 'Keine Bewerberdaten gefunden.'}</Alert>
        <Box sx={{ mt: 2 }}>
          <Button variant="contained" href="/applicant/login">
            Zur Anmeldung
          </Button>
        </Box>
      </Container>
    );
  }

  const progress = calculateProgress();

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}
      {success && (
        <Alert severity="success" sx={{ mb: 3 }} onClose={() => setSuccess(null)}>
          {success}
        </Alert>
      )}

      <Paper sx={{ p: 3, mb: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h4">
            👋 Willkommen, {applicant.firstName}!
          </Typography>
          <Chip
            label={getStatusLabel(applicant.status)}
            color={getStatusColor(applicant.status)}
            size="medium"
          />
        </Box>
        <Typography variant="body1" color="text.secondary">
          Position: <strong>{applicant.position}</strong>
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Bewerbung eingereicht am: {new Date(applicant.appliedAt).toLocaleDateString('de-CH')}
        </Typography>
      </Paper>

      <Grid container spacing={3}>
        {/* Fortschritt */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                📊 Bewerbungsfortschritt
              </Typography>
              <Box sx={{ mt: 2, mb: 1 }}>
                <LinearProgress
                  variant="determinate"
                  value={progress}
                  sx={{ height: 10, borderRadius: 5 }}
                />
              </Box>
              <Typography variant="body2" color="text.secondary" align="center">
                {Math.round(progress)}% abgeschlossen
              </Typography>
              <Box sx={{ mt: 2 }}>
                <Typography variant="body2">
                  {progress < 100 ? '⚠️ Bitte laden Sie noch folgende Dokumente hoch:' : '✅ Alle erforderlichen Dokumente hochgeladen!'}
                </Typography>
                <List dense>
                  {!applicant.documents.some(d => d.documentType === 'CV') && (
                    <ListItem>
                      <ListItemIcon><Pending fontSize="small" /></ListItemIcon>
                      <ListItemText primary="Lebenslauf" />
                    </ListItem>
                  )}
                  {!applicant.documents.some(d => d.documentType === 'COVER_LETTER') && (
                    <ListItem>
                      <ListItemIcon><Pending fontSize="small" /></ListItemIcon>
                      <ListItemText primary="Anschreiben" />
                    </ListItem>
                  )}
                  {!applicant.documents.some(d => d.documentType === 'CERTIFICATE') && (
                    <ListItem>
                      <ListItemIcon><Pending fontSize="small" /></ListItemIcon>
                      <ListItemText primary="Mindestens ein Zeugnis" />
                    </ListItem>
                  )}
                </List>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Nächste Schritte */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                🎯 Nächste Schritte
              </Typography>
              {applicant.status === 'NEW' && (
                <Alert severity="info" sx={{ mt: 2 }}>
                  Ihre Bewerbung wird derzeit geprüft. Wir melden uns in Kürze bei Ihnen.
                </Alert>
              )}
              {applicant.status === 'IN_REVIEW' && (
                <Alert severity="info" sx={{ mt: 2 }}>
                  Ihre Bewerbung befindet sich in Prüfung. Bitte haben Sie etwas Geduld.
                </Alert>
              )}
              {applicant.status === 'INTERVIEW_SCHEDULED' && (
                <Alert severity="success" sx={{ mt: 2 }}>
                  🎉 Sie wurden zu einem Vorstellungsgespräch eingeladen! Details finden Sie unten.
                </Alert>
              )}
              {applicant.status === 'OFFER' && (
                <Alert severity="success" sx={{ mt: 2 }}>
                  🎊 Glückwunsch! Wir möchten Ihnen ein Angebot machen.
                </Alert>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Dokumente */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6">
                  📄 Meine Dokumente ({applicant.documents.length})
                </Typography>
                <Button
                  variant="contained"
                  startIcon={<Upload />}
                  onClick={() => setUploadDialogOpen(true)}
                >
                  Dokument hochladen
                </Button>
              </Box>
              
              {applicant.documents.length === 0 ? (
                <Alert severity="warning">
                  Sie haben noch keine Dokumente hochgeladen. Bitte laden Sie Ihren Lebenslauf und weitere Unterlagen hoch.
                </Alert>
              ) : (
                <List>
                  {applicant.documents.map((doc, index) => (
                    <React.Fragment key={doc.id}>
                      {index > 0 && <Divider />}
                      <ListItem
                        secondaryAction={
                          <Box>
                            <IconButton
                              edge="end"
                              aria-label="download"
                              href={`${getBackendURL()}/uploads/applicant-documents/${doc.fileName}`}
                              target="_blank"
                            >
                              <Download />
                            </IconButton>
                            <IconButton
                              edge="end"
                              aria-label="delete"
                              onClick={() => handleDeleteDocument(doc.id)}
                            >
                              <Delete />
                            </IconButton>
                          </Box>
                        }
                      >
                        <ListItemIcon>
                          <Description />
                        </ListItemIcon>
                        <ListItemText
                          primary={getDocumentTypeLabel(doc.documentType)}
                          secondary={`${doc.fileName} • ${(doc.fileSize / 1024).toFixed(1)} KB • ${new Date(doc.uploadedAt).toLocaleDateString('de-CH')}`}
                        />
                      </ListItem>
                    </React.Fragment>
                  ))}
                </List>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Interviews */}
        {applicant.interviews.length > 0 && (
          <Grid item xs={12}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  📅 Vorstellungsgespräche
                </Typography>
                <List>
                  {applicant.interviews.map((interview, index) => (
                    <React.Fragment key={interview.id}>
                      {index > 0 && <Divider />}
                      <ListItem>
                        <ListItemIcon>
                          <Event />
                        </ListItemIcon>
                        <ListItemText
                          primary={interview.interviewType}
                          secondary={`${new Date(interview.scheduledAt).toLocaleString('de-CH')} • ${interview.duration} Min. • ${interview.location || 'Online'}`}
                        />
                      </ListItem>
                    </React.Fragment>
                  ))}
                </List>
              </CardContent>
            </Card>
          </Grid>
        )}
      </Grid>

      {/* Upload Dialog */}
      <Dialog open={uploadDialogOpen} onClose={() => !uploading && setUploadDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Dokument hochladen</DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 2 }}>
            <TextField
              select
              fullWidth
              label="Dokumenttyp"
              value={uploadData.documentType}
              onChange={(e) => setUploadData({ ...uploadData, documentType: e.target.value as OnboardingDocumentType })}
              margin="normal"
              disabled={uploading}
            >
              <MenuItem value={OnboardingDocumentType.CV}>Lebenslauf</MenuItem>
              <MenuItem value={OnboardingDocumentType.COVER_LETTER}>Anschreiben</MenuItem>
              <MenuItem value={OnboardingDocumentType.CERTIFICATE}>Zeugnis</MenuItem>
              <MenuItem value={OnboardingDocumentType.OTHER}>Sonstiges</MenuItem>
            </TextField>
            
            <Button
              variant="outlined"
              component="label"
              fullWidth
              sx={{ mt: 2 }}
              disabled={uploading}
            >
              Datei auswählen
              <input
                type="file"
                hidden
                accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                onChange={handleFileChange}
              />
            </Button>
            
            {uploadData.file && (
              <Alert severity="info" sx={{ mt: 2 }}>
                Ausgewählt: <strong>{uploadData.file.name}</strong> ({(uploadData.file.size / 1024).toFixed(1)} KB)
              </Alert>
            )}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setUploadDialogOpen(false)} disabled={uploading}>
            Abbrechen
          </Button>
          <Button
            onClick={handleUpload}
            variant="contained"
            disabled={!uploadData.file || uploading}
          >
            {uploading ? 'Wird hochgeladen...' : 'Hochladen'}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default ApplicantPortalPage;
