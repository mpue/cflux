import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Card,
  CardContent,
  Typography,
  TextField,
  MenuItem,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  Grid,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  Chip,
  Divider,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  DragIndicator as DragIcon,
  VideoLibrary as VideoIcon,
  PictureAsPdf as PdfIcon,
  Code as HtmlIcon,
  Quiz as QuizIcon,
  Link as LinkIcon,
  ArrowUpward as UpIcon,
  ArrowDownward as DownIcon,
  CloudUpload as UploadIcon,
} from '@mui/icons-material';
import api from '../../services/api';
import RichTextEditor from './RichTextEditor';

interface Lesson {
  id: string;
  title: string;
  description?: string;
  contentType: string;
  content?: string;
  videoUrl?: string;
  duration?: number;
  order: number;
  isOptional: boolean;
}

interface LessonEditorProps {
  courseId: string;
  onUpdate?: () => void;
}

const LessonEditor: React.FC<LessonEditorProps> = ({ courseId, onUpdate }) => {
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [editingLesson, setEditingLesson] = useState<Lesson | null>(null);

  // Form state
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [contentType, setContentType] = useState('HTML');
  const [content, setContent] = useState('');
  const [videoUrl, setVideoUrl] = useState('');
  const [duration, setDuration] = useState<number | ''>('');
  const [isOptional, setIsOptional] = useState(false);
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [uploadingPdf, setUploadingPdf] = useState(false);
  const [pdfUrl, setPdfUrl] = useState('');
  const [pdfFileName, setPdfFileName] = useState('');

  useEffect(() => {
    loadLessons();
  }, [courseId]);

  const loadLessons = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/elearning/courses/${courseId}`);
      setLessons(response.data.lessons || []);
    } catch (err: any) {
      console.error('Error loading lessons:', err);
      setError('Fehler beim Laden der Lektionen');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDialog = (lesson?: Lesson) => {
    if (lesson) {
      setEditingLesson(lesson);
      setTitle(lesson.title);
      setDescription(lesson.description || '');
      setContentType(lesson.contentType);
      setContent(lesson.content || '');
      setVideoUrl(lesson.videoUrl || '');
      setDuration(lesson.duration || '');
      setIsOptional(lesson.isOptional);
      
      // Load PDF URL if content type is PDF
      if (lesson.contentType === 'PDF' && lesson.content) {
        setPdfUrl(lesson.content);
        // Extract filename from URL if possible
        const parts = lesson.content.split('/');
        setPdfFileName(parts[parts.length - 1] || 'PDF-Dokument');
      } else {
        setPdfUrl('');
        setPdfFileName('');
      }
      setPdfFile(null);
    } else {
      setEditingLesson(null);
      setTitle('');
      setDescription('');
      setContentType('HTML');
      setContent('');
      setVideoUrl('');
      setDuration('');
      setIsOptional(false);
      setPdfFile(null);
      setPdfUrl('');
      setPdfFileName('');
    }
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setEditingLesson(null);
    setError(null);
    setPdfFile(null);
    setPdfUrl('');
    setPdfFileName('');
  };

  const handlePdfUpload = async (file: File) => {
    try {
      setUploadingPdf(true);
      setError(null);

      const formData = new FormData();
      formData.append('pdf', file);

      const response = await api.post('/elearning/upload/pdf', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      setPdfUrl(response.data.url);
      setPdfFileName(response.data.originalName || file.name);
      setContent(response.data.url); // Store PDF URL in content field
    } catch (err: any) {
      console.error('Error uploading PDF:', err);
      setError(err.response?.data?.error || 'Fehler beim Hochladen der PDF-Datei');
      setPdfFile(null);
    } finally {
      setUploadingPdf(false);
    }
  };

  const handlePdfFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.type !== 'application/pdf') {
        setError('Bitte wählen Sie eine PDF-Datei aus');
        return;
      }
      setPdfFile(file);
      handlePdfUpload(file);
    }
  };

  const handleSave = async () => {
    if (!title.trim()) {
      setError('Titel ist erforderlich');
      return;
    }

    try {
      setLoading(true);
      const data = {
        courseId,
        title,
        description: description || undefined,
        contentType,
        content: content || undefined,
        videoUrl: videoUrl || undefined,
        duration: duration || undefined,
        isOptional,
        order: editingLesson ? editingLesson.order : lessons.length,
      };

      if (editingLesson) {
        await api.put(`/elearning/lessons/${editingLesson.id}`, data);
      } else {
        await api.post('/elearning/lessons', data);
      }

      await loadLessons();
      handleCloseDialog();
      if (onUpdate) onUpdate();
    } catch (err: any) {
      console.error('Error saving lesson:', err);
      setError(err.response?.data?.error || 'Fehler beim Speichern');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!editingLesson) return;

    try {
      setLoading(true);
      await api.delete(`/elearning/lessons/${editingLesson.id}`);
      await loadLessons();
      setDeleteDialogOpen(false);
      setEditingLesson(null);
      if (onUpdate) onUpdate();
    } catch (err: any) {
      console.error('Error deleting lesson:', err);
      setError('Fehler beim Löschen');
    } finally {
      setLoading(false);
    }
  };

  const handleReorder = async (lessonId: string, direction: 'up' | 'down') => {
    const index = lessons.findIndex((l) => l.id === lessonId);
    if (
      (direction === 'up' && index === 0) ||
      (direction === 'down' && index === lessons.length - 1)
    ) {
      return;
    }

    const newOrder = [...lessons];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    [newOrder[index], newOrder[targetIndex]] = [newOrder[targetIndex], newOrder[index]];

    // Update order values
    newOrder.forEach((lesson, idx) => {
      lesson.order = idx;
    });

    setLessons(newOrder);

    // Save to backend
    try {
      await api.put(`/elearning/lessons/${lessonId}`, { order: newOrder[targetIndex].order });
      await api.put(`/elearning/lessons/${newOrder[index].id}`, { order: newOrder[index].order });
    } catch (err: any) {
      console.error('Error reordering lessons:', err);
      loadLessons(); // Reload on error
    }
  };

  const getContentIcon = (type: string) => {
    switch (type) {
      case 'VIDEO':
        return <VideoIcon />;
      case 'PDF':
        return <PdfIcon />;
      case 'HTML':
        return <HtmlIcon />;
      case 'QUIZ':
        return <QuizIcon />;
      case 'EXTERNAL_LINK':
        return <LinkIcon />;
      default:
        return <HtmlIcon />;
    }
  };

  const getContentTypeLabel = (type: string) => {
    const labels: { [key: string]: string } = {
      VIDEO: 'Video',
      PDF: 'PDF-Dokument',
      HTML: 'HTML-Inhalt',
      QUIZ: 'Quiz',
      SCORM: 'SCORM-Paket',
      EXTERNAL_LINK: 'Externer Link',
    };
    return labels[type] || type;
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h6">Lektionen ({lessons.length})</Typography>
        <Button variant="contained" startIcon={<AddIcon />} onClick={() => handleOpenDialog()}>
          Lektion hinzufügen
        </Button>
      </Box>

      {error && !dialogOpen && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {lessons.length === 0 ? (
        <Card>
          <CardContent>
            <Typography color="text.secondary" align="center">
              Noch keine Lektionen vorhanden. Fügen Sie die erste Lektion hinzu.
            </Typography>
          </CardContent>
        </Card>
      ) : (
        <List>
          {lessons.map((lesson, index) => (
            <Card key={lesson.id} sx={{ mb: 2 }}>
              <ListItem>
                <Box sx={{ display: 'flex', alignItems: 'center', mr: 2 }}>
                  <DragIcon sx={{ color: 'text.secondary', mr: 1 }} />
                  <Typography variant="h6" color="text.secondary">
                    {index + 1}
                  </Typography>
                </Box>
                <Box sx={{ mr: 2 }}>{getContentIcon(lesson.contentType)}</Box>
                <ListItemText
                  primary={
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Typography variant="body1" fontWeight="bold">
                        {lesson.title}
                      </Typography>
                      {lesson.isOptional && <Chip label="Optional" size="small" />}
                      <Chip label={getContentTypeLabel(lesson.contentType)} size="small" />
                      {lesson.duration && (
                        <Chip label={`${lesson.duration} Sek.`} size="small" variant="outlined" />
                      )}
                    </Box>
                  }
                  secondary={lesson.description}
                />
                <ListItemSecondaryAction>
                  <IconButton
                    size="small"
                    onClick={() => handleReorder(lesson.id, 'up')}
                    disabled={index === 0}
                  >
                    <UpIcon />
                  </IconButton>
                  <IconButton
                    size="small"
                    onClick={() => handleReorder(lesson.id, 'down')}
                    disabled={index === lessons.length - 1}
                  >
                    <DownIcon />
                  </IconButton>
                  <IconButton size="small" onClick={() => handleOpenDialog(lesson)}>
                    <EditIcon />
                  </IconButton>
                  <IconButton
                    size="small"
                    color="error"
                    onClick={() => {
                      setEditingLesson(lesson);
                      setDeleteDialogOpen(true);
                    }}
                  >
                    <DeleteIcon />
                  </IconButton>
                </ListItemSecondaryAction>
              </ListItem>
            </Card>
          ))}
        </List>
      )}

      {/* Edit/Create Dialog */}
      <Dialog open={dialogOpen} onClose={handleCloseDialog} maxWidth="md" fullWidth>
        <DialogTitle>
          {editingLesson ? 'Lektion bearbeiten' : 'Neue Lektion erstellen'}
        </DialogTitle>
        <DialogContent>
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                required
                label="Titel"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
            </Grid>

            <Grid item xs={12}>
              <TextField
                fullWidth
                multiline
                rows={2}
                label="Beschreibung"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                select
                label="Inhaltstyp"
                value={contentType}
                onChange={(e) => setContentType(e.target.value)}
              >
                <MenuItem value="HTML">HTML-Inhalt</MenuItem>
                <MenuItem value="VIDEO">Video</MenuItem>
                <MenuItem value="PDF">PDF-Dokument</MenuItem>
                <MenuItem value="EXTERNAL_LINK">Externer Link</MenuItem>
                <MenuItem value="QUIZ">Quiz</MenuItem>
                <MenuItem value="SCORM">SCORM-Paket</MenuItem>
              </TextField>
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                type="number"
                label="Dauer (Sekunden)"
                value={duration}
                onChange={(e) => setDuration(e.target.value ? parseInt(e.target.value) : '')}
                inputProps={{ min: 0 }}
              />
            </Grid>

            {contentType === 'VIDEO' && (
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Video-URL"
                  value={videoUrl}
                  onChange={(e) => setVideoUrl(e.target.value)}
                  placeholder="https://..."
                />
              </Grid>
            )}

            {contentType === 'HTML' && (
              <Grid item xs={12}>
                <Box>
                  <Typography variant="body2" color="textSecondary" gutterBottom>
                    Lektionsinhalt
                  </Typography>
                  <RichTextEditor
                    content={content}
                    onChange={setContent}
                    editable={true}
                  />
                  <Typography variant="caption" display="block" sx={{ mt: 1, color: 'text.secondary' }}>
                    Verwenden Sie die Toolbar für Formatierungen und zum Einfügen von Bildern.
                  </Typography>
                </Box>
              </Grid>
            )}

            {contentType === 'EXTERNAL_LINK' && (
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Link-URL"
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="https://..."
                />
              </Grid>
            )}

            {contentType === 'PDF' && (
              <Grid item xs={12}>
                <Box>
                  <Typography variant="body2" color="textSecondary" gutterBottom>
                    PDF-Dokument hochladen
                  </Typography>
                  
                  {pdfUrl && (
                    <Box sx={{ mb: 2, p: 2, bgcolor: 'action.hover', borderRadius: 1 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <PdfIcon color="error" />
                        <Typography variant="body2">
                          {pdfFileName || 'PDF-Dokument'}
                        </Typography>
                      </Box>
                      <Button
                        size="small"
                        color="error"
                        onClick={() => {
                          setPdfUrl('');
                          setPdfFileName('');
                          setContent('');
                          setPdfFile(null);
                        }}
                        sx={{ mt: 1 }}
                      >
                        Entfernen
                      </Button>
                    </Box>
                  )}
                  
                  {!pdfUrl && (
                    <Button
                      variant="outlined"
                      component="label"
                      startIcon={<UploadIcon />}
                      disabled={uploadingPdf}
                      fullWidth
                    >
                      {uploadingPdf ? 'Wird hochgeladen...' : 'PDF-Datei auswählen'}
                      <input
                        type="file"
                        hidden
                        accept="application/pdf"
                        onChange={handlePdfFileChange}
                      />
                    </Button>
                  )}
                  
                  <Typography variant="caption" display="block" sx={{ mt: 1, color: 'text.secondary' }}>
                    Erlaubte Dateigröße: max. 50 MB
                  </Typography>
                </Box>
              </Grid>
            )}

            <Grid item xs={12}>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <input
                  type="checkbox"
                  checked={isOptional}
                  onChange={(e) => setIsOptional(e.target.checked)}
                  id="isOptional"
                />
                <label htmlFor="isOptional" style={{ marginLeft: 8, cursor: 'pointer' }}>
                  Diese Lektion ist optional
                </label>
              </Box>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Abbrechen</Button>
          <Button onClick={handleSave} variant="contained" disabled={loading}>
            Speichern
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
        <DialogTitle>Lektion löschen?</DialogTitle>
        <DialogContent>
          <Typography>
            Möchten Sie die Lektion "{editingLesson?.title}" wirklich löschen? Diese Aktion kann
            nicht rückgängig gemacht werden.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>Abbrechen</Button>
          <Button onClick={handleDelete} color="error" variant="contained">
            Löschen
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default LessonEditor;
