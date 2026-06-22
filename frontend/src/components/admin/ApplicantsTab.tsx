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
  PersonAdd,
  RestartAlt,
  Delete,
} from '@mui/icons-material';
import {
  FormControlLabel,
  Checkbox,
} from '@mui/material';

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
  const [hireDialogOpen, setHireDialogOpen] = useState(false);
  const [hireSubmitting, setHireSubmitting] = useState(false);
  const [hireForm, setHireForm] = useState({
    startDate: new Date().toISOString().slice(0, 10),
    department: '',
    probationEndDate: '',
  });
  const [resetDialogOpen, setResetDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteEmployeeToo, setDeleteEmployeeToo] = useState(false);
  const [actionSubmitting, setActionSubmitting] = useState(false);

  useEffect(() => {
    loadApplicants();
  }, [statusFilter]);

  const loadApplicants = async () => {
    try {
      setLoading(true);
      setError(null);
      const params = statusFilter ? `?status=${statusFilter}` : '';
      const response = await api.get(`/onboarding/applicants${params}`);
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
      await api.patch(`/onboarding/applicants/${applicantId}/status`, { status: newStatus });
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
      await api.post(`/onboarding/applicants/${selectedApplicant.id}/verify-manual`);
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

  const handleOpenHire = (applicant: Applicant) => {
    setSelectedApplicant(applicant);
    setHireForm({
      startDate: new Date().toISOString().slice(0, 10),
      department: '',
      probationEndDate: '',
    });
    setDetailDialogOpen(false);
    setHireDialogOpen(true);
  };

  const handleHireSubmit = async () => {
    if (!selectedApplicant) return;
    if (!hireForm.startDate) {
      setError('Bitte ein Eintrittsdatum angeben');
      return;
    }
    try {
      setHireSubmitting(true);
      setError(null);
      await api.post('/onboarding/hire', {
        applicantId: selectedApplicant.id,
        startDate: hireForm.startDate,
        department: hireForm.department || undefined,
        probationEndDate: hireForm.probationEndDate || undefined,
      });
      setHireDialogOpen(false);
      loadApplicants();
      if (onUpdate) onUpdate();
    } catch (err: any) {
      console.error('Error hiring applicant:', err);
      setError(err?.response?.data?.details || 'Fehler beim Einstellen des Bewerbers');
    } finally {
      setHireSubmitting(false);
    }
  };

  const handleOpenReset = (applicant: Applicant) => {
    setSelectedApplicant(applicant);
    setResetDialogOpen(true);
  };

  const handleResetSubmit = async () => {
    if (!selectedApplicant) return;
    try {
      setActionSubmitting(true);
      setError(null);
      await api.post(`/onboarding/applicants/${selectedApplicant.id}/reset`, {});
      setResetDialogOpen(false);
      loadApplicants();
      if (onUpdate) onUpdate();
    } catch (err: any) {
      console.error('Error resetting applicant:', err);
      setError(err?.response?.data?.details || 'Fehler beim Zurücksetzen des Bewerbers');
    } finally {
      setActionSubmitting(false);
    }
  };

  const handleOpenDelete = (applicant: Applicant) => {
    setSelectedApplicant(applicant);
    setDeleteEmployeeToo(applicant.status === 'HIRED');
    setDeleteDialogOpen(true);
  };

  const handleDeleteSubmit = async () => {
    if (!selectedApplicant) return;
    try {
      setActionSubmitting(true);
      setError(null);
      await api.delete(`/onboarding/applicants/${selectedApplicant.id}`, {
        params: deleteEmployeeToo ? { deleteEmployee: true } : undefined,
      });
      setDeleteDialogOpen(false);
      loadApplicants();
      if (onUpdate) onUpdate();
    } catch (err: any) {
      console.error('Error deleting applicant:', err);
      setError(err?.response?.data?.details || 'Fehler beim Löschen des Bewerbers');
    } finally {
      setActionSubmitting(false);
    }
  };

  const handleViewDocuments = async (applicant: Applicant) => {
    setSelectedApplicant(applicant);
    try {
      const response = await api.get(`/onboarding/applicants/${applicant.id}/documents`);
      setApplicantDocuments(response.data);
      setDocumentsDialogOpen(true);
    } catch (err: any) {
      console.error('Error loading documents:', err);
      setError('Fehler beim Laden der Dokumente');
    }
  };

  const handleDownloadDocument = async (documentId: string, fileName: string) => {
    try {
      const response = await api.get(`/onboarding/applicants/documents/${documentId}/download`, {
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
                            color="secondary"
                            onClick={() => handleOpenHire(applicant)}
                            title="Einstellen"
                          >
                            <PersonAdd fontSize="small" />
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
                      {applicant.status === 'HIRED' && (
                        <IconButton
                          size="small"
                          color="warning"
                          onClick={() => handleOpenReset(applicant)}
                          title="Onboarding zurücksetzen (neu starten)"
                        >
                          <RestartAlt fontSize="small" />
                        </IconButton>
                      )}
                      <IconButton
                        size="small"
                        color="error"
                        onClick={() => handleOpenDelete(applicant)}
                        title="Bewerber löschen"
                      >
                        <Delete fontSize="small" />
                      </IconButton>
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
                    variant="contained"
                    color="success"
                    startIcon={<PersonAdd />}
                    onClick={() => handleOpenHire(selectedApplicant)}
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

      {/* Hire Dialog */}
      <Dialog
        open={hireDialogOpen}
        onClose={() => !hireSubmitting && setHireDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          Bewerber einstellen: {selectedApplicant?.firstName} {selectedApplicant?.lastName}
        </DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Der Bewerber wird in einen Mitarbeiter umgewandelt. Dabei werden ein
            Mitarbeiter-Profil und ein Benutzerkonto (Login) erstellt, der Bewerberstatus
            auf „Eingestellt" gesetzt und die Standard-Onboarding-Aufgaben angelegt.
          </Typography>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
            <TextField
              label="Eintrittsdatum"
              type="date"
              required
              value={hireForm.startDate}
              onChange={(e) => setHireForm({ ...hireForm, startDate: e.target.value })}
              InputLabelProps={{ shrink: true }}
              fullWidth
            />
            <TextField
              label="Abteilung"
              value={hireForm.department}
              onChange={(e) => setHireForm({ ...hireForm, department: e.target.value })}
              placeholder="optional"
              fullWidth
            />
            <TextField
              label="Ende der Probezeit"
              type="date"
              value={hireForm.probationEndDate}
              onChange={(e) => setHireForm({ ...hireForm, probationEndDate: e.target.value })}
              InputLabelProps={{ shrink: true }}
              helperText="optional"
              fullWidth
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setHireDialogOpen(false)} disabled={hireSubmitting}>
            Abbrechen
          </Button>
          <Button
            onClick={handleHireSubmit}
            variant="contained"
            color="success"
            disabled={hireSubmitting}
            startIcon={<PersonAdd />}
          >
            {hireSubmitting ? 'Wird eingestellt…' : 'Einstellen'}
          </Button>
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

      {/* Reset Dialog */}
      <Dialog
        open={resetDialogOpen}
        onClose={() => !actionSubmitting && setResetDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          Onboarding zurücksetzen: {selectedApplicant?.firstName} {selectedApplicant?.lastName}
        </DialogTitle>
        <DialogContent>
          <Alert severity="warning" sx={{ mb: 2 }}>
            Der verknüpfte Mitarbeiter inkl. laufendem Onboarding (Aufgaben und
            Checklisten-Instanzen) wird entfernt. Der Bewerber bleibt erhalten und der
            Status wird auf „In Prüfung" zurückgesetzt, sodass die Einstellung neu
            gestartet werden kann.
          </Alert>
          <Typography variant="body2" color="text.secondary">
            Das Benutzerkonto (Login) bleibt bestehen und wird bei einer erneuten
            Einstellung wiederverwendet.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setResetDialogOpen(false)} disabled={actionSubmitting}>
            Abbrechen
          </Button>
          <Button
            onClick={handleResetSubmit}
            variant="contained"
            color="warning"
            disabled={actionSubmitting}
            startIcon={<RestartAlt />}
          >
            {actionSubmitting ? 'Wird zurückgesetzt…' : 'Zurücksetzen'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Dialog */}
      <Dialog
        open={deleteDialogOpen}
        onClose={() => !actionSubmitting && setDeleteDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          Bewerber löschen: {selectedApplicant?.firstName} {selectedApplicant?.lastName}
        </DialogTitle>
        <DialogContent>
          <Alert severity="error" sx={{ mb: 2 }}>
            Der Bewerber wird endgültig gelöscht – inkl. Dokumenten, Interviews und
            Notizen. Diese Aktion kann nicht rückgängig gemacht werden.
          </Alert>
          <FormControlLabel
            control={
              <Checkbox
                checked={deleteEmployeeToo}
                onChange={(e) => setDeleteEmployeeToo(e.target.checked)}
              />
            }
            label="Auch den verknüpften Mitarbeiter inkl. Onboarding-Daten löschen"
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)} disabled={actionSubmitting}>
            Abbrechen
          </Button>
          <Button
            onClick={handleDeleteSubmit}
            variant="contained"
            color="error"
            disabled={actionSubmitting}
            startIcon={<Delete />}
          >
            {actionSubmitting ? 'Wird gelöscht…' : 'Löschen'}
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
