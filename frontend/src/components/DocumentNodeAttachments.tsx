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
  Grid,
  Card,
  CardMedia,
  CardContent,
  CardActions,
  Accordion,
  AccordionSummary,
  AccordionDetails,
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
  Image as ImageIcon,
  Visibility as VisibilityIcon,
  ExpandMore as ExpandMoreIcon,
  PictureAsPdf as PdfIcon,
} from '@mui/icons-material';
import documentNodeAttachmentService, {
  DocumentNodeAttachment,
  AttachmentVersion,
} from '../services/documentNodeAttachment.service';
import ImageViewer from './ImageViewer';
import { normalizeUploadUrl } from '../services/api';

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

  // Edit Original dialog
  const [editOriginalDialogOpen, setEditOriginalDialogOpen] = useState(false);
  const [editOriginalAttachment, setEditOriginalAttachment] = useState<DocumentNodeAttachment | null>(null);
  const [editOriginalFile, setEditOriginalFile] = useState<File | null>(null);
  const [editOriginalChangeReason, setEditOriginalChangeReason] = useState('');
  const [editOriginalUploading, setEditOriginalUploading] = useState(false);

  // Image viewer
  const [imageViewerOpen, setImageViewerOpen] = useState(false);
  const [imageViewerIndex, setImageViewerIndex] = useState(0);

  // Accordion expanded state
  const [expanded, setExpanded] = useState(false);

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

  const handlePdfPreview = async (attachment: DocumentNodeAttachment) => {
    try {
      setError(null);
      await documentNodeAttachmentService.openPdfPreview(attachment.id);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Fehler beim Öffnen der PDF-Vorschau');
    }
    handleMenuClose();
  };

  const handleEditOriginal = (attachment: DocumentNodeAttachment) => {
    handleMenuClose();
    setEditOriginalAttachment(attachment);
    setEditOriginalFile(null);
    setEditOriginalChangeReason('');
    setEditOriginalDialogOpen(true);
  };

  const handleEditOriginalSubmit = async () => {
    if (!editOriginalAttachment || !editOriginalFile) return;

    try {
      setEditOriginalUploading(true);
      setError(null);
      await documentNodeAttachmentService.updateAttachment(
        editOriginalAttachment.id,
        editOriginalFile,
        editOriginalAttachment.description || undefined,
        editOriginalChangeReason || 'Original bearbeitet und aktualisiert'
      );
      setSuccess('Dokument erfolgreich aktualisiert. PDF-Vorschau wird neu erstellt.');
      setEditOriginalDialogOpen(false);
      loadAttachments();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Fehler beim Aktualisieren');
    } finally {
      setEditOriginalUploading(false);
    }
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

  // Helper function to check if file is an image
  const isImage = (filename: string): boolean => {
    const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.bmp', '.svg', '.webp'];
    return imageExtensions.some(ext => filename.toLowerCase().endsWith(ext));
  };

  // Get all images for the viewer
  const getImageAttachments = () => {
    return attachments
      .filter(att => isImage(att.originalFilename))
      .map(att => ({
        url: normalizeUploadUrl(att.path) || '',
        filename: att.originalFilename,
        description: att.description,
      }));
  };

  // Open image viewer at specific image
  const handleImageClick = (attachment: DocumentNodeAttachment) => {
    const images = getImageAttachments();
    const index = images.findIndex(img => img.filename === attachment.originalFilename);
    if (index !== -1) {
      setImageViewerIndex(index);
      setImageViewerOpen(true);
    }
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
    <Accordion expanded={expanded} onChange={(e, isExpanded) => setExpanded(isExpanded)}>
      <AccordionSummary expandIcon={<ExpandMoreIcon />}>
        <Typography sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <AttachFileIcon /> <strong>Anhänge ({attachments.length})</strong>
        </Typography>
      </AccordionSummary>
      <AccordionDetails>
        <Box>
          <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 2 }}>
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
        <>
          {/* Image Attachments Grid */}
          {attachments.some(att => isImage(att.originalFilename)) && (
            <Box sx={{ mb: 3 }}>
              <Typography variant="subtitle1" sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                <ImageIcon /> Bilder
              </Typography>
              <Grid container spacing={2}>
                {attachments
                  .filter(att => isImage(att.originalFilename))
                  .map((attachment) => (
                    <Grid item xs={12} sm={6} md={4} lg={3} key={attachment.id}>
                      <Card>
                        <CardMedia
                          component="img"
                          height="200"
                          image={normalizeUploadUrl(attachment.path)}
                          alt={attachment.originalFilename}
                          sx={{
                            objectFit: 'contain',
                            backgroundColor: '#f5f5f5',
                            cursor: 'pointer',
                            '&:hover': {
                              opacity: 0.8,
                            },
                          }}
                          onClick={() => handleImageClick(attachment)}
                        />
                        <CardContent sx={{ pb: 1 }}>
                          <Tooltip title={attachment.originalFilename}>
                            <Typography
                              variant="body2"
                              sx={{
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                whiteSpace: 'nowrap',
                              }}
                            >
                              {attachment.originalFilename}
                            </Typography>
                          </Tooltip>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5 }}>
                            <Chip label={`v${attachment.version}`} size="small" />
                            <Typography variant="caption" color="text.secondary">
                              {documentNodeAttachmentService.formatFileSize(attachment.fileSize)}
                            </Typography>
                          </Box>
                          {attachment.description && (
                            <Typography
                              variant="caption"
                              color="text.secondary"
                              sx={{
                                display: 'block',
                                mt: 0.5,
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                whiteSpace: 'nowrap',
                              }}
                            >
                              {attachment.description}
                            </Typography>
                          )}
                        </CardContent>
                        <CardActions sx={{ justifyContent: 'space-between', pt: 0 }}>
                          <Tooltip title="Bild anzeigen">
                            <IconButton size="small" onClick={() => handleImageClick(attachment)}>
                              <VisibilityIcon />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Herunterladen">
                            <IconButton size="small" onClick={() => handleDownload(attachment)}>
                              <DownloadIcon />
                            </IconButton>
                          </Tooltip>
                          <IconButton size="small" onClick={(e) => handleMenuOpen(e, attachment)}>
                            <MoreVertIcon />
                          </IconButton>
                        </CardActions>
                      </Card>
                    </Grid>
                  ))}
              </Grid>
            </Box>
          )}

          {/* Non-Image Attachments List */}
          {attachments.some(att => !isImage(att.originalFilename)) && (
            <Paper>
              <Typography variant="subtitle1" sx={{ p: 2, pb: 0, display: 'flex', alignItems: 'center', gap: 1 }}>
                <AttachFileIcon /> Weitere Dateien
              </Typography>
              <List>
                {attachments
                  .filter(att => !isImage(att.originalFilename))
                  .map((attachment, index) => (
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
                          {documentNodeAttachmentService.hasPdfPreview(attachment) && (
                            <Tooltip title="PDF-Vorschau">
                              <IconButton
                                edge="end"
                                onClick={() => handlePdfPreview(attachment)}
                              >
                                <PdfIcon />
                              </IconButton>
                            </Tooltip>
                          )}
                          <Tooltip title="Original herunterladen">
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
        </>
      )}

      {/* Image Viewer */}
      <ImageViewer
        open={imageViewerOpen}
        onClose={() => setImageViewerOpen(false)}
        images={getImageAttachments()}
        initialIndex={imageViewerIndex}
      />

      {/* Context Menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
      >
        <MenuItem onClick={() => menuAttachment && handleDownload(menuAttachment)}>
          <DownloadIcon sx={{ mr: 1 }} /> Original herunterladen
        </MenuItem>
        {menuAttachment && documentNodeAttachmentService.hasPdfPreview(menuAttachment) && (
          <MenuItem onClick={() => menuAttachment && handlePdfPreview(menuAttachment)}>
            <PdfIcon sx={{ mr: 1 }} /> PDF-Vorschau
          </MenuItem>
        )}
        <MenuItem onClick={() => menuAttachment && handleVersionHistory(menuAttachment)}>
          <HistoryIcon sx={{ mr: 1 }} /> Versionsverlauf
        </MenuItem>
        {canEdit && [
          <Divider key="divider-edit" />,
          <MenuItem key="edit-original" onClick={() => menuAttachment && handleEditOriginal(menuAttachment)}>
            <EditIcon sx={{ mr: 1 }} /> Original bearbeiten
          </MenuItem>,
          <MenuItem key="update" onClick={() => menuAttachment && handleUpdateClick(menuAttachment)}>
            <UploadIcon sx={{ mr: 1 }} /> Neue Version hochladen
          </MenuItem>,
          <MenuItem key="metadata" onClick={() => menuAttachment && handleMetadataClick(menuAttachment)}>
            <InfoIcon sx={{ mr: 1 }} /> Beschreibung ändern
          </MenuItem>,
          <Divider key="divider-delete" />,
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
            Die PDF-Vorschau wird automatisch aktualisiert.
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

      {/* Edit Original Re-Upload Dialog */}
      <Dialog open={editOriginalDialogOpen} onClose={() => setEditOriginalDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Original bearbeiten</DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 2 }}>
            {/* Step 1: Download link */}
            <Typography variant="subtitle2" sx={{ mb: 1 }}>
              1. Original herunterladen und bearbeiten
            </Typography>
            <Button
              variant="outlined"
              startIcon={<DownloadIcon />}
              onClick={() => editOriginalAttachment && documentNodeAttachmentService.downloadAttachment(editOriginalAttachment.id, editOriginalAttachment.originalFilename)}
              fullWidth
              sx={{ mb: 1 }}
            >
              {editOriginalAttachment?.originalFilename}
            </Button>
            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 3 }}>
              Öffnen Sie die Datei mit der passenden Anwendung und speichern Sie Ihre Änderungen.
            </Typography>

            <Divider sx={{ mb: 2 }} />

            {/* Step 2: Re-upload */}
            <Typography variant="subtitle2" sx={{ mb: 1 }}>
              2. Bearbeitete Datei wieder hochladen
            </Typography>
            <Button
              variant="outlined"
              component="label"
              startIcon={<UploadIcon />}
              fullWidth
              sx={{ mb: 2 }}
            >
              Bearbeitete Datei auswählen
              <input
                type="file"
                hidden
                onChange={(e) => setEditOriginalFile(e.target.files?.[0] || null)}
              />
            </Button>
            {editOriginalFile && (
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                {editOriginalFile.name} ({documentNodeAttachmentService.formatFileSize(editOriginalFile.size)})
              </Typography>
            )}
            <TextField
              fullWidth
              label="Änderungsgrund (optional)"
              multiline
              rows={2}
              value={editOriginalChangeReason}
              onChange={(e) => setEditOriginalChangeReason(e.target.value)}
              placeholder="z.B. Inhalte überarbeitet, Fehler korrigiert, ..."
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditOriginalDialogOpen(false)}>Abbrechen</Button>
          <Button
            onClick={handleEditOriginalSubmit}
            variant="contained"
            disabled={!editOriginalFile || editOriginalUploading}
          >
            {editOriginalUploading ? <CircularProgress size={24} /> : 'Aktualisieren'}
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
      </AccordionDetails>
    </Accordion>
  );
};

export default DocumentNodeAttachments;
