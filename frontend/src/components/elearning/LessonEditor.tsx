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
  ToggleButton,
  ToggleButtonGroup,
  LinearProgress,
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
import api, { getBackendURL } from '../../services/api';
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
  const [videoSource, setVideoSource] = useState<'url' | 'upload'>('url');
  const [uploadingVideo, setUploadingVideo] = useState(false);
  const [videoUploadProgress, setVideoUploadProgress] = useState(0);
  const [videoFileName, setVideoFileName] = useState('');
  // URL eines in dieser Dialog-Sitzung hochgeladenen Videos. Nur so eine
  // Datei darf beim Entfernen geloescht werden - ein bereits gespeichertes
  // Video muss liegen bleiben, sonst zeigt die Lektion nach einem Abbruch
  // des Dialogs ins Leere.
  const [freshVideoUrl, setFreshVideoUrl] = useState('');

  // Hochgeladene Videos liegen unter /uploads/course-videos/, externe
  // Videos sind volle URLs (YouTube, Vimeo, ...).
  const isUploadedVideo = (url?: string) => !!url && url.startsWith('/uploads/course-videos/');

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

      if (isUploadedVideo(lesson.videoUrl)) {
        setVideoSource('upload');
        setVideoFileName(lesson.videoUrl!.split('/').pop() || 'Video');
      } else {
        setVideoSource('url');
        setVideoFileName('');
      }
      setVideoUploadProgress(0);
      setFreshVideoUrl('');
      
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
      setVideoSource('url');
      setVideoFileName('');
      setVideoUploadProgress(0);
      setFreshVideoUrl('');
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
    setVideoFileName('');
    setVideoUploadProgress(0);
    setFreshVideoUrl('');
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

  const handleVideoUpload = async (file: File) => {
    try {
      setUploadingVideo(true);
      setVideoUploadProgress(0);
      setError(null);

      const formData = new FormData();
      formData.append('video', file);

      const response = await api.post('/elearning/upload/video', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        onUploadProgress: (event) => {
          if (event.total) {
            setVideoUploadProgress(Math.round((event.loaded * 100) / event.total));
          }
        },
      });

      setVideoUrl(response.data.url);
      setFreshVideoUrl(response.data.url);
      setVideoFileName(response.data.originalName || file.name);
    } catch (err: any) {
      console.error('Error uploading video:', err);
      setError(err.response?.data?.error || 'Fehler beim Hochladen des Videos');
    } finally {
      setUploadingVideo(false);
    }
  };

  const handleVideoFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('video/')) {
      setError('Bitte wählen Sie eine Videodatei aus');
      return;
    }
    handleVideoUpload(file);
    // Zuruecksetzen, damit dieselbe Datei erneut gewaehlt werden kann
    event.target.value = '';
  };

  const handleRemoveVideo = async () => {
    const currentUrl = videoUrl;
    setVideoUrl('');
    setVideoFileName('');
    setVideoUploadProgress(0);

    // Nur eine gerade eben hochgeladene Datei wieder wegraeumen. Ein bereits
    // gespeichertes Video bleibt liegen, weil der Nutzer den Dialog noch
    // abbrechen kann und die Lektion dann weiter darauf verweist.
    if (currentUrl && currentUrl === freshVideoUrl && isUploadedVideo(currentUrl)) {
      setFreshVideoUrl('');
      const filename = currentUrl.split('/').pop();
      try {
        await api.delete(`/elearning/upload/video/${filename}`);
      } catch (err) {
        console.error('Error deleting video file:', err);
      }
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
                <Typography variant="body2" color="textSecondary" gutterBottom>
                  Videoquelle
                </Typography>
                <ToggleButtonGroup
                  exclusive
                  size="small"
                  value={videoSource}
                  onChange={(_, value) => {
                    if (!value || value === videoSource) return;
                    setVideoSource(value);
                    // Beim Wechsel der Quelle den Wert der anderen Quelle verwerfen
                    handleRemoveVideo();
                  }}
                  sx={{ mb: 2 }}
                >
                  <ToggleButton value="url">
                    <LinkIcon fontSize="small" sx={{ mr: 1 }} />
                    Externe URL
                  </ToggleButton>
                  <ToggleButton value="upload">
                    <UploadIcon fontSize="small" sx={{ mr: 1 }} />
                    Video hochladen
                  </ToggleButton>
                </ToggleButtonGroup>

                {videoSource === 'url' ? (
                  <TextField
                    fullWidth
                    label="Video-URL"
                    value={videoUrl}
                    onChange={(e) => setVideoUrl(e.target.value)}
                    placeholder="https://..."
                    helperText="YouTube- und Vimeo-Links werden automatisch eingebettet."
                  />
                ) : (
                  <Box>
                    {videoUrl && !uploadingVideo && (
                      <Box sx={{ mb: 2, p: 2, bgcolor: 'action.hover', borderRadius: 1 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <VideoIcon color="primary" />
                          <Typography variant="body2">{videoFileName || 'Video'}</Typography>
                        </Box>
                        <Box
                          component="video"
                          src={`${getBackendURL()}${videoUrl}`}
                          controls
                          preload="metadata"
                          onLoadedMetadata={(e: React.SyntheticEvent<HTMLVideoElement>) => {
                            // Dauer automatisch uebernehmen, solange nichts eingetragen ist
                            const seconds = Math.round(e.currentTarget.duration);
                            if (!duration && Number.isFinite(seconds) && seconds > 0) {
                              setDuration(seconds);
                            }
                          }}
                          sx={{ width: '100%', maxHeight: 240, mt: 1, borderRadius: 1, bgcolor: 'common.black' }}
                        />
                        <Button size="small" color="error" onClick={handleRemoveVideo} sx={{ mt: 1 }}>
                          Entfernen
                        </Button>
                      </Box>
                    )}

                    {uploadingVideo && (
                      <Box sx={{ mb: 2 }}>
                        <LinearProgress variant="determinate" value={videoUploadProgress} />
                        <Typography variant="caption" color="text.secondary">
                          Wird hochgeladen… {videoUploadProgress}%
                        </Typography>
                      </Box>
                    )}

                    {!videoUrl && (
                      <Button
                        variant="outlined"
                        component="label"
                        startIcon={<UploadIcon />}
                        disabled={uploadingVideo}
                        fullWidth
                      >
                        {uploadingVideo ? 'Wird hochgeladen…' : 'Videodatei auswählen'}
                        <input
                          type="file"
                          hidden
                          accept="video/mp4,video/webm,video/ogg,video/quicktime"
                          onChange={handleVideoFileChange}
                        />
                      </Button>
                    )}

                    <Typography variant="caption" display="block" sx={{ mt: 1, color: 'text.secondary' }}>
                      MP4, WebM oder Ogg, max. 2 GB. MOV-Dateien lassen sich nicht in jedem
                      Browser abspielen – MP4 (H.264) ist die sicherste Wahl.
                    </Typography>
                  </Box>
                )}
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
