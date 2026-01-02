import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Button,
  Alert,
  ToggleButtonGroup,
  ToggleButton,
  TextField,
  Paper,
  Divider,
  IconButton,
  Tooltip,
} from '@mui/material';
import {
  Save as SaveIcon,
  Code as MarkdownIcon,
  TextFields as WysiwygIcon,
  ViewColumn as HybridIcon,
  Lock as LockIcon,
  LockOpen as LockOpenIcon,
} from '@mui/icons-material';
import { marked } from 'marked';
import TurndownService from 'turndown';
import { useAuth } from '../../contexts/AuthContext';
import { DocumentNode } from '../../services/documentNode.service';
import TipTapEditor from '../../components/TipTapEditor';

type EditorMode = 'wysiwyg' | 'markdown' | 'hybrid';

interface DocumentEditorProps {
  document: DocumentNode;
  onSave: (content: string) => Promise<void>;
  canEdit: boolean; // Permission from parent
}

const DocumentEditor: React.FC<DocumentEditorProps> = ({ document, onSave, canEdit }) => {
  const { user } = useAuth();
  const [mode, setMode] = useState<EditorMode>('wysiwyg');
  const [htmlContent, setHtmlContent] = useState(document.content || '');
  const [markdownContent, setMarkdownContent] = useState('');
  const [saving, setSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [success, setSuccess] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);

  // Check if user can edit
  const isAdmin = user?.role === 'ADMIN';
  const hasEditPermission = isAdmin || canEdit;
  const isEditable = hasEditPermission && isEditMode;

  // Initialize Turndown service for HTML -> Markdown conversion
  const turndownService = new TurndownService({
    headingStyle: 'atx',
    codeBlockStyle: 'fenced',
  });

  // Convert HTML to Markdown on mount or document change
  useEffect(() => {
    setHtmlContent(document.content || '');
    try {
      const markdown = turndownService.turndown(document.content || '');
      setMarkdownContent(markdown);
    } catch (error) {
      console.error('Error converting HTML to Markdown:', error);
      setMarkdownContent('');
    }
    setHasChanges(false);
    setIsEditMode(false); // Reset edit mode on document change
  }, [document.id, document.content]);

  // Handle mode change
  const handleModeChange = (event: React.MouseEvent<HTMLElement>, newMode: EditorMode) => {
    if (newMode !== null) {
      setMode(newMode);
    }
  };

  // Handle HTML content change from TipTap editor
  const handleHtmlChange = (newHtml: string) => {
    setHtmlContent(newHtml);
    setHasChanges(true);
    setSuccess(false);
    
    // Sync to Markdown
    try {
      const markdown = turndownService.turndown(newHtml);
      setMarkdownContent(markdown);
    } catch (error) {
      console.error('Error converting HTML to Markdown:', error);
    }
  };

  // Handle Markdown content change
  const handleMarkdownChange = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newMarkdown = event.target.value;
    setMarkdownContent(newMarkdown);
    setHasChanges(true);
    setSuccess(false);
    
    // Sync to HTML
    try {
      const html = marked(newMarkdown) as string;
      setHtmlContent(html);
    } catch (error) {
      console.error('Error converting Markdown to HTML:', error);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      await onSave(htmlContent);
      setHasChanges(false);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (error) {
      console.error('Save error:', error);
    } finally {
      setSaving(false);
    }
  };

  const renderEditor = () => {
    switch (mode) {
      case 'wysiwyg':
        return (
          <Box sx={{ border: 1, borderColor: 'divider', borderRadius: 1 }}>
            <TipTapEditor
              content={htmlContent}
              onChange={handleHtmlChange}
              editable={isEditable}
            />
          </Box>
        );

      case 'markdown':
        return (
          <TextField
            multiline
            fullWidth
            value={markdownContent}
            onChange={handleMarkdownChange}
            placeholder={isEditable ? "Markdown eingeben..." : "Nur Lesezugriff - Bitte Edit-Mode aktivieren"}
            disabled={!isEditable}
            sx={{
              '& .MuiInputBase-root': {
                fontFamily: 'monospace',
                fontSize: '14px',
                minHeight: '400px',
                alignItems: 'flex-start',
                bgcolor: isEditable ? 'background.paper' : 'action.disabledBackground',
              },
            }}
            variant="outlined"
          />
        );

      case 'hybrid':
        return (
          <Box sx={{ display: 'flex', gap: 2 }}>
            <Box sx={{ flex: 1 }}>
              <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 'bold' }}>
                Markdown
              </Typography>
              <TextField
                multiline
                fullWidth
                value={markdownContent}
                onChange={handleMarkdownChange}
                placeholder={isEditable ? "Markdown eingeben..." : "Nur Lesezugriff"}
                disabled={!isEditable}
                sx={{
                  '& .MuiInputBase-root': {
                    fontFamily: 'monospace',
                    fontSize: '13px',
                    minHeight: '400px',
                    alignItems: 'flex-start',
                    bgcolor: isEditable ? 'background.paper' : 'action.disabledBackground',
                  },
                }}
                variant="outlined"
              />
            </Box>
            <Divider orientation="vertical" flexItem />
            <Box sx={{ flex: 1 }}>
              <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 'bold' }}>
                WYSIWYG
              </Typography>
              <Box sx={{ border: 1, borderColor: 'divider', borderRadius: 1 }}>
                <TipTapEditor
                  content={htmlContent}
                  onChange={handleHtmlChange}
                  editable={isEditable}
                />
              </Box>
            </Box>
          </Box>
        );

      default:
        return null;
    }
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h5">{document.title}</Typography>
        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
          {/* Edit Mode Toggle */}
          {hasEditPermission && (
            <Tooltip title={isEditMode ? "Bearbeitungsmodus deaktivieren" : "Bearbeitungsmodus aktivieren"}>
              <IconButton 
                onClick={() => setIsEditMode(!isEditMode)}
                color={isEditMode ? "primary" : "default"}
                sx={{ 
                  border: 1, 
                  borderColor: isEditMode ? 'primary.main' : 'divider',
                  bgcolor: isEditMode ? 'primary.light' : 'background.paper',
                }}
              >
                {isEditMode ? <LockOpenIcon /> : <LockIcon />}
              </IconButton>
            </Tooltip>
          )}
          
          {/* Mode Toggle */}
          <ToggleButtonGroup
            value={mode}
            exclusive
            onChange={handleModeChange}
            size="small"
            disabled={!isEditable}
          >
            <ToggleButton value="wysiwyg">
              <WysiwygIcon sx={{ mr: 0.5 }} fontSize="small" />
              WYSIWYG
            </ToggleButton>
            <ToggleButton value="markdown" disabled={!isEditable}>
              <MarkdownIcon sx={{ mr: 0.5 }} fontSize="small" />
              Markdown
            </ToggleButton>
            <ToggleButton value="hybrid">
              <HybridIcon sx={{ mr: 0.5 }} fontSize="small" />
              Hybrid
            </ToggleButton>
          </ToggleButtonGroup>
          
          {/* Save Button */}
          <Button
            variant="contained"
            startIcon={<SaveIcon />}
            onClick={handleSave}
            disabled={!hasChanges || saving || !isEditable}
          >
            {saving ? 'Speichert...' : 'Speichern'}
          </Button>
        </Box>
      </Box>

      {!hasEditPermission && (
        <Alert severity="info" sx={{ mb: 2 }}>
          Sie haben keine Berechtigung, dieses Dokument zu bearbeiten.
        </Alert>
      )}

      {hasEditPermission && !isEditMode && (
        <Alert severity="warning" sx={{ mb: 2 }}>
          Nur-Lese-Modus - Klicken Sie auf das Schloss-Symbol, um den Bearbeitungsmodus zu aktivieren.
        </Alert>
      )}

      {success && (
        <Alert severity="success" sx={{ mb: 2 }}>
          Dokument erfolgreich gespeichert
        </Alert>
      )}

      <Paper elevation={0} sx={{ p: 0 }}>
        {renderEditor()}
      </Paper>

      <Box sx={{ mt: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="caption" color="text.secondary">
          Zuletzt bearbeitet: {new Date(document.updatedAt).toLocaleString('de-DE')} von{' '}
          {document.updatedBy.firstName} {document.updatedBy.lastName}
        </Typography>
        {hasChanges && (
          <Typography variant="caption" color="warning.main">
            Nicht gespeicherte Änderungen
          </Typography>
        )}
      </Box>
    </Box>
  );
};

export default DocumentEditor;
