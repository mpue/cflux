import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  Typography,
  Box,
  CircularProgress,
  Alert,
  Divider,
  Paper,
} from '@mui/material';
import {
  Restore as RestoreIcon,
  Visibility as ViewIcon,
} from '@mui/icons-material';
import documentNodeService, { DocumentNode, DocumentVersion } from '../../services/documentNode.service';

interface DocumentVersionHistoryProps {
  open: boolean;
  onClose: () => void;
  documentNode: DocumentNode;
  onRestore: () => void;
}

const DocumentVersionHistory: React.FC<DocumentVersionHistoryProps> = ({
  open,
  onClose,
  documentNode,
  onRestore,
}) => {
  const [versions, setVersions] = useState<DocumentVersion[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedVersion, setSelectedVersion] = useState<DocumentVersion | null>(null);
  const [viewContent, setViewContent] = useState(false);

  useEffect(() => {
    if (open) {
      loadVersions();
    }
  }, [open]);

  const loadVersions = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await documentNodeService.getVersionHistory(documentNode.id);
      setVersions(data);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Fehler beim Laden der Versionshistorie');
      console.error('Load versions error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleViewVersion = async (version: DocumentVersion) => {
    setSelectedVersion(version);
    setViewContent(true);
  };

  const handleRestoreVersion = async (version: DocumentVersion) => {
    if (!window.confirm(`Version ${version.version} wiederherstellen?`)) {
      return;
    }

    try {
      await documentNodeService.restoreVersion(documentNode.id, version.id);
      await loadVersions();
      onRestore();
      setSelectedVersion(null);
      setViewContent(false);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Fehler beim Wiederherstellen der Version');
      console.error('Restore version error:', err);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>
        Versionshistorie: {documentNode.title}
      </DialogTitle>
      <DialogContent>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
            {error}
          </Alert>
        )}

        {loading ? (
          <Box display="flex" justifyContent="center" p={3}>
            <CircularProgress />
          </Box>
        ) : viewContent && selectedVersion ? (
          <Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h6">
                Version {selectedVersion.version}
              </Typography>
              <Box>
                <Button
                  variant="outlined"
                  onClick={() => setViewContent(false)}
                  sx={{ mr: 1 }}
                >
                  Zurück
                </Button>
                <Button
                  variant="contained"
                  startIcon={<RestoreIcon />}
                  onClick={() => handleRestoreVersion(selectedVersion)}
                >
                  Wiederherstellen
                </Button>
              </Box>
            </Box>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Erstellt: {new Date(selectedVersion.createdAt).toLocaleString('de-DE')} von{' '}
              {selectedVersion.createdBy.firstName} {selectedVersion.createdBy.lastName}
            </Typography>
            <Divider sx={{ mb: 2 }} />
            <Paper sx={{ p: 2, bgcolor: 'grey.50', maxHeight: '400px', overflow: 'auto' }}>
              <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap', fontFamily: 'monospace' }}>
                {selectedVersion.content || '(Leer)'}
              </Typography>
            </Paper>
          </Box>
        ) : (
          <>
            {versions.length === 0 ? (
              <Typography variant="body2" color="text.secondary" textAlign="center" py={3}>
                Keine Versionen vorhanden
              </Typography>
            ) : (
              <List>
                {versions.map((version, index) => (
                  <React.Fragment key={version.id}>
                    <ListItem>
                      <ListItemText
                        primary={
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Typography variant="body1">
                              Version {version.version}
                            </Typography>
                            {index === 0 && (
                              <Typography
                                variant="caption"
                                sx={{
                                  bgcolor: 'primary.main',
                                  color: 'white',
                                  px: 1,
                                  py: 0.5,
                                  borderRadius: 1,
                                }}
                              >
                                Aktuell
                              </Typography>
                            )}
                          </Box>
                        }
                        secondary={
                          <>
                            {new Date(version.createdAt).toLocaleString('de-DE')}
                            {' • '}
                            {version.createdBy.firstName} {version.createdBy.lastName}
                          </>
                        }
                      />
                      <ListItemSecondaryAction>
                        <IconButton
                          edge="end"
                          onClick={() => handleViewVersion(version)}
                          sx={{ mr: 1 }}
                        >
                          <ViewIcon />
                        </IconButton>
                        {index !== 0 && (
                          <IconButton
                            edge="end"
                            onClick={() => handleRestoreVersion(version)}
                          >
                            <RestoreIcon />
                          </IconButton>
                        )}
                      </ListItemSecondaryAction>
                    </ListItem>
                    {index < versions.length - 1 && <Divider />}
                  </React.Fragment>
                ))}
              </List>
            )}
          </>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Schließen</Button>
      </DialogActions>
    </Dialog>
  );
};

export default DocumentVersionHistory;
