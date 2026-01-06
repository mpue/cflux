import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Button,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  Chip,
  CircularProgress,
  Alert,
  Divider,
  Tooltip,
  Menu,
  MenuItem,
} from '@mui/material';
import {
  AttachFile as AttachFileIcon,
  CloudUpload as UploadIcon,
  Download as DownloadIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
  History as HistoryIcon,
  MoreVert as MoreVertIcon,
  Info as InfoIcon,
} from '@mui/icons-material';
import documentNodeAttachmentService, {
  DocumentNodeAttachment,
  AttachmentVersion,
} from '../services/documentNodeAttachment.service';

interface DocumentNodeAttachmentsProps {
  nodeId: string;
  canEdit: boolean;
}

const DocumentNodeAttachments: React.FC<DocumentNodeAttachmentsProps> = ({
  nodeId,
  canEdit,
}) => {
  const [attachments, setAttachments] = useState<DocumentNodeAttachment[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Upload dialog
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploadDescription, setUploadDescription] = useState('');
  const [uploading, setUploading] = useState(false);

  // Update dialog
  const [updateDialogOpen, setUpdateDialogOpen] = useState(false);
  const [selectedAttachment, setSelectedAttachment] = useState<DocumentNodeAttachment | null>(null);
  const [updateFile, setUpdateFile] = useState<File | null>(null);
  const [updateDescription, setUpdateDescription] = useState('');
  const [updateChangeReason, setUpdateChangeReason] = useState('');
  const [updating, setUpdating] = useState(false);

  // Edit metadata dialog
  const [metadataDialogOpen, setMetadataDialogOpen] = useState(false);
  const [metadataDescription, setMetadataDescription] = useState('');

  // Version history dialog
  const [versionDialogOpen, setVersionDialogOpen] = useState(false);
  const [versions, setVersions] = useState<AttachmentVersion[]>([]);
  const [loadingVersions, setLoadingVersions] = useState(false);

  // Context menu
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [menuAttachment, setMenuAttachment] = useState<DocumentNodeAttachment | null>(null);

  useEffect(() => {
    loadAttachments();
  }, [nodeId]);

  const loadAttachments = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await documentNodeAttachmentService.getNodeAttachments(nodeId);
      setAttachments(data);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Fehler beim Laden der Anhänge');
    } finally {
      setLoading(false);
    }
  };

  const handleUploadClick = () => {
    setUploadFile(null);
    setUploadDescription('');
    setUploadDialogOpen(true);
  };

  const handleUploadSubmit = async () => {
    if (!uploadFile) {
      setError('Bitte wählen Sie eine Datei aus');
      return;
    }

    try {
      setUploading(true);
      setError(null);
      await documentNodeAttachmentService.uploadAttachment(
        nodeId,
        uploadFile,
        uploadDescription
      );
      setSuccess('Anhang erfolgreich hochgeladen');
      setUploadDialogOpen(false);
      loadAttachments();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Fehler beim Hochladen');
    } finally {
      setUploading(false);
    }
  };

  const handleUpdateClick = (attachment: DocumentNodeAttachment) => {
    setSelectedAttachment(attachment);
    setUpdateFile(null);
    setUpdateDescription(attachment.description || '');
    setUpdateChangeReason('');
    setUpdateDialogOpen(true);
    handleMenuClose();
  };

  const handleUpdateSubmit = async () => {
    if (!selectedAttachment || !updateFile) {
      setError('Bitte wählen Sie eine Datei aus');
      return;
    }

    try {
      setUpdating(true);
      setError(null);
      await documentNodeAttachmentService.updateAttachment(
        selectedAttachment.id,
        updateFile,
        updateDescription,
        updateChangeReason
      );
      setSuccess('Anhang erfolgreich aktualisiert');
      setUpdateDialogOpen(false);
      loadAttachments();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Fehler beim Aktualisieren');
    } finally {
      setUpdating(false);
    }
  };

  const handleMetadataClick = (attachment: DocumentNodeAttachment) => {
    setSelectedAttachment(attachment);
    setMetadataDescription(attachment.description || '');
    setMetadataDialogOpen(true);
    handleMenuClose();
  };

  const handleMetadataSubmit = async () => {
    if (!selectedAttachment) return;

    try {
      setError(null);
      await documentNodeAttachmentService.updateAttachmentMetadata(
        selectedAttachment.id,
        metadataDescription
      );
      setSuccess('Beschreibung erfolgreich aktualisiert');
      setMetadataDialogOpen(false);
      loadAttachments();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Fehler beim Aktualisieren');
    }
  };

  const handleDelete = async (attachment: DocumentNodeAttachment) => {
    if (!window.confirm(`Möchten Sie den Anhang "${attachment.originalFilename}" wirklich löschen?`)) {
      return;
    }

    try {
      setError(null);
      await documentNodeAttachmentService.deleteAttachment(attachment.id);
      setSuccess('Anhang erfolgreich gelöscht');
      loadAttachments();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Fehler beim Löschen');
    }
    handleMenuClose();
  };

  const handleDownload = async (attachment: DocumentNodeAttachment) => {
    try {
      setError(null);
      await documentNodeAttachmentService.downloadAttachment(
        attachment.id,
        attachment.originalFilename
      );
    } catch (err: any) {
      setError(err.response?.data?.error || 'Fehler beim Herunterladen');
    }
    handleMenuClose();
  };

  const handleVersionHistory = async (attachment: DocumentNodeAttachment) => {
    setSelectedAttachment(attachment);
    setVersionDialogOpen(true);
    handleMenuClose();

    try {
      setLoadingVersions(true);
      const data = await documentNodeAttachmentService.getAttachmentVersions(attachment.id);
      setVersions(data);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Fehler beim Laden der Versionsverlauf');
    } finally {
      setLoadingVersions(false);
    }
  };

  const handleDownloadVersion = async (version: AttachmentVersion) => {
    try {
      setError(null);
      await documentNodeAttachmentService.downloadAttachmentVersion(
        version.id,
        `v${version.version}-${version.originalFilename}`
      );
    } catch (err: any) {
      setError(err.response?.data?.error || 'Fehler beim Herunterladen');
    }
  };

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>, attachment: DocumentNodeAttachment) => {
    setAnchorEl(event.currentTarget);
    setMenuAttachment(attachment);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setMenuAttachment(null);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('de-CH');
  };

  if (loading && attachments.length === 0) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ mt: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <AttachFileIcon /> Anhänge ({attachments.length})
        </Typography>
        {canEdit && (
          <Button
            variant="contained"
            startIcon={<UploadIcon />}
            onClick={handleUploadClick}
          >
            Anhang hinzufügen
          </Button>
        )}
      </Box>

      {error && (
        <Alert severity="error" onClose={() => setError(null)} sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {success && (
        <Alert severity="success" onClose={() => setSuccess(null)} sx={{ mb: 2 }}>
          {success}
        </Alert>
      )}

      {attachments.length === 0 ? (
        <Paper sx={{ p: 3, textAlign: 'center' }}>
          <Typography color="text.secondary">
            Keine Anhänge vorhanden
          </Typography>
        </Paper>
      ) : (
        <Paper>
          <List>
            {attachments.map((attachment, index) => (
              <React.Fragment key={attachment.id}>
                {index > 0 && <Divider />}
                <ListItem>
                  <ListItemText
                    primary={
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <span>{documentNodeAttachmentService.getFileIcon(attachment.mimeType)}</span>
                        <span>{attachment.originalFilename}</span>
                        <Chip label={`v${attachment.version}`} size="small" />
                      </Box>
                    }
                    secondary={
                      <Box>
                        <Typography variant="body2" color="text.secondary">
                          {documentNodeAttachmentService.formatFileSize(attachment.fileSize)} • 
                          Hochgeladen von {attachment.createdBy.firstName} {attachment.createdBy.lastName} • 
                          {formatDate(attachment.createdAt)}
                        </Typography>
                        {attachment.description && (
                          <Typography variant="body2" sx={{ mt: 0.5 }}>
                            {attachment.description}
                          </Typography>
                        )}
                      </Box>
                    }
                  />
                  <ListItemSecondaryAction>
                    <Tooltip title="Herunterladen">
                      <IconButton
                        edge="end"
                        onClick={() => handleDownload(attachment)}
                      >
                        <DownloadIcon />
                      </IconButton>
                    </Tooltip>
                    <IconButton
                      edge="end"
                      onClick={(e) => handleMenuOpen(e, attachment)}
                    >
                      <MoreVertIcon />
                    </IconButton>
                  </ListItemSecondaryAction>
                </ListItem>
              </React.Fragment>
            ))}
          </List>
        </Paper>
      )}

      {/* Context Menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
      >
        <MenuItem onClick={() => menuAttachment && handleDownload(menuAttachment)}>
          <DownloadIcon sx={{ mr: 1 }} /> Herunterladen
        </MenuItem>
        <MenuItem onClick={() => menuAttachment && handleVersionHistory(menuAttachment)}>
          <HistoryIcon sx={{ mr: 1 }} /> Versionsverlauf
        </MenuItem>
        {canEdit && [
          <MenuItem key="update" onClick={() => menuAttachment && handleUpdateClick(menuAttachment)}>
            <EditIcon sx={{ mr: 1 }} /> Datei aktualisieren
          </MenuItem>,
          <MenuItem key="metadata" onClick={() => menuAttachment && handleMetadataClick(menuAttachment)}>
            <InfoIcon sx={{ mr: 1 }} /> Beschreibung ändern
          </MenuItem>,
          <Divider key="divider" />,
          <MenuItem key="delete" onClick={() => menuAttachment && handleDelete(menuAttachment)}>
            <DeleteIcon sx={{ mr: 1 }} color="error" /> Löschen
          </MenuItem>,
        ]}
      </Menu>

      {/* Upload Dialog */}
      <Dialog open={uploadDialogOpen} onClose={() => setUploadDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Anhang hinzufügen</DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 2 }}>
            <input
              type="file"
              onChange={(e) => setUploadFile(e.target.files?.[0] || null)}
              style={{ marginBottom: '16px' }}
            />
            {uploadFile && (
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                {uploadFile.name} ({documentNodeAttachmentService.formatFileSize(uploadFile.size)})
              </Typography>
            )}
            <TextField
              fullWidth
              label="Beschreibung (optional)"
              multiline
              rows={3}
              value={uploadDescription}
              onChange={(e) => setUploadDescription(e.target.value)}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setUploadDialogOpen(false)}>Abbrechen</Button>
          <Button
            onClick={handleUploadSubmit}
            variant="contained"
            disabled={!uploadFile || uploading}
          >
            {uploading ? <CircularProgress size={24} /> : 'Hochladen'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Update Dialog */}
      <Dialog open={updateDialogOpen} onClose={() => setUpdateDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Anhang aktualisieren</DialogTitle>
        <DialogContent>
          <Alert severity="info" sx={{ mt: 2, mb: 2 }}>
            Dies erstellt eine neue Version des Anhangs. Die alte Version bleibt im Versionsverlauf erhalten.
          </Alert>
          <Box sx={{ mt: 2 }}>
            <input
              type="file"
              onChange={(e) => setUpdateFile(e.target.files?.[0] || null)}
              style={{ marginBottom: '16px' }}
            />
            {updateFile && (
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                {updateFile.name} ({documentNodeAttachmentService.formatFileSize(updateFile.size)})
              </Typography>
            )}
            <TextField
              fullWidth
              label="Beschreibung (optional)"
              multiline
              rows={2}
              value={updateDescription}
              onChange={(e) => setUpdateDescription(e.target.value)}
              sx={{ mb: 2 }}
            />
            <TextField
              fullWidth
              label="Änderungsgrund"
              multiline
              rows={2}
              value={updateChangeReason}
              onChange={(e) => setUpdateChangeReason(e.target.value)}
              placeholder="z.B. Aktualisierte Inhalte, Fehlerkorrektur, ..."
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setUpdateDialogOpen(false)}>Abbrechen</Button>
          <Button
            onClick={handleUpdateSubmit}
            variant="contained"
            disabled={!updateFile || updating}
          >
            {updating ? <CircularProgress size={24} /> : 'Aktualisieren'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Metadata Edit Dialog */}
      <Dialog open={metadataDialogOpen} onClose={() => setMetadataDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Beschreibung ändern</DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 2 }}>
            <TextField
              fullWidth
              label="Beschreibung"
              multiline
              rows={4}
              value={metadataDescription}
              onChange={(e) => setMetadataDescription(e.target.value)}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setMetadataDialogOpen(false)}>Abbrechen</Button>
          <Button onClick={handleMetadataSubmit} variant="contained">
            Speichern
          </Button>
        </DialogActions>
      </Dialog>

      {/* Version History Dialog */}
      <Dialog open={versionDialogOpen} onClose={() => setVersionDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>Versionsverlauf</DialogTitle>
        <DialogContent>
          {loadingVersions ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
              <CircularProgress />
            </Box>
          ) : (
            <List>
              {versions.map((version, index) => (
                <React.Fragment key={version.id}>
                  {index > 0 && <Divider />}
                  <ListItem>
                    <ListItemText
                      primary={
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Chip label={`v${version.version}`} size="small" color="primary" />
                          <span>{version.originalFilename}</span>
                        </Box>
                      }
                      secondary={
                        <Box>
                          <Typography variant="body2" color="text.secondary">
                            {documentNodeAttachmentService.formatFileSize(version.fileSize)} • 
                            {version.createdBy.firstName} {version.createdBy.lastName} • 
                            {formatDate(version.createdAt)}
                          </Typography>
                          {version.changeReason && (
                            <Typography variant="body2" sx={{ mt: 0.5, fontStyle: 'italic' }}>
                              {version.changeReason}
                            </Typography>
                          )}
                        </Box>
                      }
                    />
                    <ListItemSecondaryAction>
                      <Tooltip title="Version herunterladen">
                        <IconButton
                          edge="end"
                          onClick={() => handleDownloadVersion(version)}
                        >
                          <DownloadIcon />
                        </IconButton>
                      </Tooltip>
                    </ListItemSecondaryAction>
                  </ListItem>
                </React.Fragment>
              ))}
            </List>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setVersionDialogOpen(false)}>Schließen</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default DocumentNodeAttachments;
