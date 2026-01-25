import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import {
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
  Alert,
  Tabs,
  Tab,
  Badge,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  Divider,
} from '@mui/material';
import { 
  Visibility, 
  CheckCircle, 
  Cancel, 
  Email,
  Description,
  Event,
  GetApp,
} from '@mui/icons-material';

interface ApplicantDocument {
  id: string;
  documentType: string;
  fileName: string;
  fileSize: number;
  mimeType: string;
  uploadedAt: string;
}

interface Applicant {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone: string;
  position: string;
  status: string;
  emailVerified: boolean;
  appliedAt: string;
  documents?: ApplicantDocument[];
  interviews?: any[];
  _count?: {
    documents: number;
    interviews: number;
    notes: number;
  };
}

interface ApplicantsTabProps {
  onUpdate?: () => void;
}

const ApplicantsTab: React.FC<ApplicantsTabProps> = ({ onUpdate }) => {
  const [applicants, setApplicants] = useState<Applicant[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [selectedApplicant, setSelectedApplicant] = useState<Applicant | null>(null);
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const [verifyDialogOpen, setVerifyDialogOpen] = useState(false);
  const [documentsDialogOpen, setDocumentsDialogOpen] = useState(false);
  const [applicantDocuments, setApplicantDocuments] = useState<ApplicantDocument[]>([]);

  useEffect(() => {
    loadApplicants();
  }, [statusFilter]);

  const loadApplicants = async () => {
    try {
      setLoading(true);
      setError(null);
      const params = statusFilter ? `?status=${statusFilter}` : '';
      const response = await api.get(`/applicants/admin/applicants${params}`);
      setApplicants(response.data);
    } catch (err: any) {
      console.error('Error loading applicants:', err);
      setError('Fehler beim Laden der Bewerber');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string): any => {
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

  const getStatusLabel = (status: string): string => {
    const labels: Record<string, string> = {
      NEW: 'Neu',
      IN_REVIEW: 'In Prüfung',
      INTERVIEW_SCHEDULED: 'Gespräch geplant',
      OFFER: 'Angebot',
      HIRED: 'Eingestellt',
      REJECTED: 'Abgelehnt',
    };
    return labels[status] || status;
  };

  const handleStatusChange = async (applicantId: string, newStatus: string) => {
    try {
      await api.patch(`/applicants/admin/applicants/${applicantId}/status`, { status: newStatus });
      loadApplicants();
      if (onUpdate) onUpdate();
    } catch (err: any) {
      console.error('Error updating status:', err);
      setError('Fehler beim Aktualisieren des Status');
    }
  };

  const handleVerifyEmail = async () => {
    if (!selectedApplicant) return;
    
    try {
      // Manuell verifizieren via direktem DB-Update
      await api.post(`/applicants/${selectedApplicant.id}/verify-manual`);
      setVerifyDialogOpen(false);
      loadApplicants();
    } catch (err: any) {
      console.error('Error verifying email:', err);
      setError('Fehler beim Verifizieren der E-Mail');
    }
  };

  const handleViewDetails = (applicant: Applicant) => {
    setSelectedApplicant(applicant);
    setDetailDialogOpen(true);
  };

  const handleViewDocuments = async (applicant: Applicant) => {
    setSelectedApplicant(applicant);
    try {
      const response = await api.get(`/applicants/applicants/${applicant.id}/documents`);
      setApplicantDocuments(response.data);
      setDocumentsDialogOpen(true);
    } catch (err: any) {
      console.error('Error loading documents:', err);
      setError('Fehler beim Laden der Dokumente');
    }
  };

  const handleDownloadDocument = async (documentId: string, fileName: string) => {
    try {
      const response = await api.get(`/applicants/admin/documents/${documentId}/download`, {
        responseType: 'blob',
      });
      
      // Create download link
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', fileName);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err: any) {
      console.error('Error downloading document:', err);
      setError('Fehler beim Herunterladen des Dokuments');
    }
  };

  const getDocumentTypeLabel = (type: string): string => {
    const labels: Record<string, string> = {
      CV: 'Lebenslauf',
      COVER_LETTER: 'Anschreiben',
      CERTIFICATE: 'Zeugnis',
      ID_COPY: 'Ausweis-Kopie',
      DIPLOMA: 'Diplom',
      REFERENCE: 'Referenz',
      OTHER: 'Sonstiges',
    };
    return labels[type] || type;
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  const getStatistics = () => {
    return {
      total: applicants.length,
      new: applicants.filter(a => a.status === 'NEW').length,
      inReview: applicants.filter(a => a.status === 'IN_REVIEW').length,
      interviewScheduled: applicants.filter(a => a.status === 'INTERVIEW_SCHEDULED').length,
      unverified: applicants.filter(a => !a.emailVerified).length,
    };
  };

  const stats = getStatistics();

  if (loading) {
    return <Typography>Laden...</Typography>;
  }

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h5" gutterBottom>
        👥 Bewerberverwaltung
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* Statistics */}
      <Box sx={{ display: 'flex', gap: 2, mb: 3, flexWrap: 'wrap' }}>
        <Chip 
          label={`Gesamt: ${stats.total}`} 
          color="default" 
          size="medium"
        />
        <Chip 
          label={`Neu: ${stats.new}`} 
          color="info" 
          size="medium"
        />
        <Chip 
          label={`In Prüfung: ${stats.inReview}`} 
          color="default" 
          size="medium"
        />
        <Chip 
          label={`Gespräche: ${stats.interviewScheduled}`} 
          color="primary" 
          size="medium"
        />
        {stats.unverified > 0 && (
          <Chip 
            label={`⚠️ Nicht verifiziert: ${stats.unverified}`} 
            color="warning" 
            size="medium"
          />
        )}
      </Box>

      {/* Filter */}
      <Paper sx={{ mb: 3, p: 2 }}>
        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
          <TextField
            select
            label="Status filtern"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            sx={{ minWidth: 200 }}
            size="small"
          >
            <MenuItem value="">Alle Status</MenuItem>
            <MenuItem value="NEW">Neu</MenuItem>
            <MenuItem value="IN_REVIEW">In Prüfung</MenuItem>
            <MenuItem value="INTERVIEW_SCHEDULED">Gespräch geplant</MenuItem>
            <MenuItem value="OFFER">Angebot</MenuItem>
            <MenuItem value="HIRED">Eingestellt</MenuItem>
            <MenuItem value="REJECTED">Abgelehnt</MenuItem>
          </TextField>
          <Button onClick={loadApplicants} variant="outlined" size="small">
            Aktualisieren
          </Button>
        </Box>
      </Paper>

      {/* Table */}
      <TableContainer component={Paper}>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell><strong>Name</strong></TableCell>
              <TableCell><strong>Email</strong></TableCell>
              <TableCell><strong>Position</strong></TableCell>
              <TableCell><strong>Bewerbung</strong></TableCell>
              <TableCell><strong>Status</strong></TableCell>
              <TableCell align="center"><strong>Docs</strong></TableCell>
              <TableCell><strong>Aktionen</strong></TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {applicants.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} align="center">
                  <Typography color="textSecondary">Keine Bewerber gefunden</Typography>
                </TableCell>
              </TableRow>
            ) : (
              applicants.map((applicant) => (
                <TableRow key={applicant.id} hover>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      {applicant.firstName} {applicant.lastName}
                      {!applicant.emailVerified && (
                        <Chip label="⚠️" size="small" color="warning" />
                      )}
                    </Box>
                  </TableCell>
                  <TableCell>{applicant.email}</TableCell>
                  <TableCell>{applicant.position}</TableCell>
                  <TableCell>
                    {new Date(applicant.appliedAt).toLocaleDateString('de-CH')}
                  </TableCell>
                  <TableCell>
                    <Chip 
                      label={getStatusLabel(applicant.status)} 
                      color={getStatusColor(applicant.status)} 
                      size="small" 
                    />
                  </TableCell>
                  <TableCell align="center">
                    <Badge badgeContent={applicant._count?.documents || 0} color="primary">
                      <IconButton
                        size="small"
                        color="primary"
                        onClick={() => handleViewDocuments(applicant)}
                        title="Dokumente anzeigen"
                      >
                        <Description fontSize="small" />
                      </IconButton>
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', gap: 0.5 }}>
                      <IconButton
                        size="small"
                        color="primary"
                        onClick={() => handleViewDetails(applicant)}
                        title="Details anzeigen"
                      >
                        <Visibility fontSize="small" />
                      </IconButton>
                      {!applicant.emailVerified && (
                        <IconButton
                          size="small"
                          color="warning"
                          onClick={() => {
                            setSelectedApplicant(applicant);
                            setVerifyDialogOpen(true);
                          }}
                          title="E-Mail verifizieren"
                        >
                          <Email fontSize="small" />
                        </IconButton>
                      )}
                      {applicant.status !== 'REJECTED' && applicant.status !== 'HIRED' && (
                        <>
                          <IconButton
                            size="small"
                            color="success"
                            onClick={() => handleStatusChange(applicant.id, 'IN_REVIEW')}
                            title="In Prüfung"
                          >
                            <CheckCircle fontSize="small" />
                          </IconButton>
                          <IconButton
                            size="small"
                            color="error"
                            onClick={() => handleStatusChange(applicant.id, 'REJECTED')}
                            title="Ablehnen"
                          >
                            <Cancel fontSize="small" />
                          </IconButton>
                        </>
                      )}
                    </Box>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Detail Dialog */}
      <Dialog 
        open={detailDialogOpen} 
        onClose={() => setDetailDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          Bewerber-Details: {selectedApplicant?.firstName} {selectedApplicant?.lastName}
        </DialogTitle>
        <DialogContent>
          {selectedApplicant && (
            <Box sx={{ mt: 2 }}>
              <Typography><strong>E-Mail:</strong> {selectedApplicant.email}</Typography>
              <Typography><strong>Telefon:</strong> {selectedApplicant.phone}</Typography>
              <Typography><strong>Position:</strong> {selectedApplicant.position}</Typography>
              <Typography><strong>Status:</strong> {getStatusLabel(selectedApplicant.status)}</Typography>
              <Typography>
                <strong>E-Mail verifiziert:</strong> {selectedApplicant.emailVerified ? '✅ Ja' : '❌ Nein'}
              </Typography>
              <Typography>
                <strong>Bewerbungsdatum:</strong> {new Date(selectedApplicant.appliedAt).toLocaleString('de-CH')}
              </Typography>
              <Typography sx={{ mt: 2 }}>
                <strong>Dokumente:</strong> {selectedApplicant._count?.documents || 0}
              </Typography>
              <Typography>
                <strong>Interviews:</strong> {selectedApplicant._count?.interviews || 0}
              </Typography>
              <Typography>
                <strong>Notizen:</strong> {selectedApplicant._count?.notes || 0}
              </Typography>

              <Box sx={{ mt: 3 }}>
                <Typography variant="h6" gutterBottom>Status ändern:</Typography>
                <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                  <Button 
                    size="small" 
                    variant="outlined"
                    onClick={() => {
                      handleStatusChange(selectedApplicant.id, 'IN_REVIEW');
                      setDetailDialogOpen(false);
                    }}
                  >
                    In Prüfung
                  </Button>
                  <Button 
                    size="small" 
                    variant="outlined"
                    color="primary"
                    onClick={() => {
                      handleStatusChange(selectedApplicant.id, 'INTERVIEW_SCHEDULED');
                      setDetailDialogOpen(false);
                    }}
                  >
                    Gespräch planen
                  </Button>
                  <Button 
                    size="small" 
                    variant="outlined"
                    color="warning"
                    onClick={() => {
                      handleStatusChange(selectedApplicant.id, 'OFFER');
                      setDetailDialogOpen(false);
                    }}
                  >
                    Angebot machen
                  </Button>
                  <Button 
                    size="small" 
                    variant="outlined"
                    color="success"
                    onClick={() => {
                      handleStatusChange(selectedApplicant.id, 'HIRED');
                      setDetailDialogOpen(false);
                    }}
                  >
                    Einstellen
                  </Button>
                  <Button 
                    size="small" 
                    variant="outlined"
                    color="error"
                    onClick={() => {
                      handleStatusChange(selectedApplicant.id, 'REJECTED');
                      setDetailDialogOpen(false);
                    }}
                  >
                    Ablehnen
                  </Button>
                </Box>
              </Box>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDetailDialogOpen(false)}>Schließen</Button>
        </DialogActions>
      </Dialog>

      {/* Verify Email Dialog */}
      <Dialog open={verifyDialogOpen} onClose={() => setVerifyDialogOpen(false)}>
        <DialogTitle>E-Mail verifizieren</DialogTitle>
        <DialogContent>
          <Typography>
            Möchten Sie die E-Mail-Adresse von {selectedApplicant?.firstName} {selectedApplicant?.lastName} manuell verifizieren?
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
            E-Mail: {selectedApplicant?.email}
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setVerifyDialogOpen(false)}>Abbrechen</Button>
          <Button onClick={handleVerifyEmail} variant="contained" color="primary">
            Verifizieren
          </Button>
        </DialogActions>
      </Dialog>

      {/* Documents Dialog */}
      <Dialog 
        open={documentsDialogOpen} 
        onClose={() => setDocumentsDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          📄 Dokumente: {selectedApplicant?.firstName} {selectedApplicant?.lastName}
        </DialogTitle>
        <DialogContent>
          {applicantDocuments.length === 0 ? (
            <Typography color="textSecondary" sx={{ py: 3, textAlign: 'center' }}>
              Keine Dokumente hochgeladen
            </Typography>
          ) : (
            <List>
              {applicantDocuments.map((doc, index) => (
                <React.Fragment key={doc.id}>
                  {index > 0 && <Divider />}
                  <ListItem>
                    <ListItemText
                      primary={
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Description fontSize="small" color="primary" />
                          <Typography variant="body1" component="span">
                            {doc.fileName}
                          </Typography>
                        </Box>
                      }
                      secondary={
                        <Box sx={{ mt: 0.5 }}>
                          <Typography variant="caption" display="block">
                            <strong>Typ:</strong> {getDocumentTypeLabel(doc.documentType)}
                          </Typography>
                          <Typography variant="caption" display="block">
                            <strong>Größe:</strong> {formatFileSize(doc.fileSize)}
                          </Typography>
                          <Typography variant="caption" display="block">
                            <strong>Hochgeladen:</strong> {new Date(doc.uploadedAt).toLocaleString('de-CH')}
                          </Typography>
                        </Box>
                      }
                    />
                    <ListItemSecondaryAction>
                      <IconButton
                        edge="end"
                        color="primary"
                        onClick={() => handleDownloadDocument(doc.id, doc.fileName)}
                        title="Herunterladen"
                      >
                        <GetApp />
                      </IconButton>
                    </ListItemSecondaryAction>
                  </ListItem>
                </React.Fragment>
              ))}
            </List>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDocumentsDialogOpen(false)}>Schließen</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ApplicantsTab;
