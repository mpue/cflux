import React, { useState, useEffect, useRef } from 'react';
import {
  Container,
  Card,
  CardContent,
  Typography,
  TextField,
  Button,
  Box,
  Grid,
  MenuItem,
  FormControlLabel,
  Switch,
  Alert,
  CircularProgress,
  Chip,
  Autocomplete,
  Tabs,
  Tab,
  IconButton,
  CardMedia,
} from '@mui/material';
import { CloudUpload as UploadIcon, Delete as DeleteIcon } from '@mui/icons-material';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import AppNavbar from '../components/AppNavbar';
import LessonEditor from '../components/elearning/LessonEditor';
import QuizBuilder from '../components/elearning/QuizBuilder';
import api, { getBackendURL } from '../services/api';

interface Category {
  id: string;
  name: string;
  color?: string;
}

const CourseEditorPage: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { user, logout } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [activeTab, setActiveTab] = useState(0);

  // Form state
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [courseType, setCourseType] = useState('OPTIONAL');
  const [categoryId, setCategoryId] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [thumbnailUrl, setThumbnailUrl] = useState('');
  const [duration, setDuration] = useState<number | ''>('');
  const [level, setLevel] = useState('');
  const [validFrom, setValidFrom] = useState('');
  const [validUntil, setValidUntil] = useState('');
  const [passingScore, setPassingScore] = useState(80);
  const [maxAttempts, setMaxAttempts] = useState<number | ''>('');
  const [isComplianceCourse, setIsComplianceCourse] = useState(false);
  const [ehsRelevant, setEhsRelevant] = useState(false);
  const [renewalMonths, setRenewalMonths] = useState<number | ''>('');
  const [uploadingThumbnail, setUploadingThumbnail] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    loadCategories();
    if (id && id !== 'new') {
      loadCourse();
    }
  }, [id]);

  const loadCategories = async () => {
    try {
      const response = await api.get('/elearning/categories');
      setCategories(response.data);
    } catch (err: any) {
      console.error('Error loading categories:', err);
    }
  };

  const loadCourse = async () => {
    if (!id || id === 'new') return;
    
    try {
      setLoading(true);
      const response = await api.get(`/elearning/courses/${id}`);
      const course = response.data;

      setTitle(course.title);
      setDescription(course.description || '');
      setCourseType(course.courseType);
      setCategoryId(course.categoryId || '');
      setTags(course.tags || []);
      setThumbnailUrl(course.thumbnailUrl || '');
      setDuration(course.duration || '');
      setLevel(course.level || '');
      setValidFrom(course.validFrom ? course.validFrom.split('T')[0] : '');
      setValidUntil(course.validUntil ? course.validUntil.split('T')[0] : '');
      setPassingScore(course.passingScore);
      setMaxAttempts(course.maxAttempts || '');
      setIsComplianceCourse(course.isComplianceCourse);
      setEhsRelevant(course.ehsRelevant);
      setRenewalMonths(course.renewalMonths || '');
    } catch (err: any) {
      console.error('Error loading course:', err);
      setError(err.response?.data?.error || 'Fehler beim Laden des Kurses');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);

    if (!title.trim()) {
      setError('Titel ist erforderlich');
      return;
    }

    try {
      setLoading(true);

      const data = {
        title,
        description: description || undefined,
        courseType,
        categoryId: categoryId || undefined,
        tags,
        thumbnailUrl: thumbnailUrl || undefined,
        duration: duration || undefined,
        level: level || undefined,
        validFrom: validFrom ? new Date(validFrom).toISOString() : undefined,
        validUntil: validUntil ? new Date(validUntil).toISOString() : undefined,
        passingScore,
        maxAttempts: maxAttempts || undefined,
        isComplianceCourse,
        ehsRelevant,
        renewalMonths: renewalMonths || undefined,
      };

      if (id && id !== 'new') {
        await api.put(`/elearning/courses/${id}`, data);
        setSuccess(true);
        setTimeout(() => setSuccess(false), 3000);
      } else {
        const response = await api.post('/elearning/courses', data);
        setSuccess(true);
        // Redirect to edit page with lessons tab
        setTimeout(() => {
          navigate(`/elearning/courses/${response.data.id}/edit`, { replace: true });
          setActiveTab(1);
        }, 1000);
      }
    } catch (err: any) {
      console.error('Error saving course:', err);
      setError(err.response?.data?.error || 'Fehler beim Speichern des Kurses');
    } finally {
      setLoading(false);
    }
  };

  const handleThumbnailUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setError('Bitte wählen Sie eine Bilddatei aus');
      return;
    }

    // Validate file size (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      setError('Das Bild darf maximal 5MB groß sein');
      return;
    }

    try {
      setUploadingThumbnail(true);
      setError(null);

      const formData = new FormData();
      formData.append('thumbnail', file);

      const response = await api.post('/elearning/upload/thumbnail', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      setThumbnailUrl(response.data.url);
    } catch (err: any) {
      console.error('Error uploading thumbnail:', err);
      setError(err.response?.data?.error || 'Fehler beim Hochladen des Thumbnails');
    } finally {
      setUploadingThumbnail(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleDeleteThumbnail = async () => {
    if (!thumbnailUrl) return;

    try {
      // Try to delete the file, but continue even if it fails
      const filename = thumbnailUrl.split('/').pop();
      if (filename && filename.startsWith('thumbnail-')) {
        try {
          await api.delete(`/elearning/upload/thumbnail/${filename}`);
        } catch (fileErr) {
          console.warn('File deletion failed (may already be deleted):', fileErr);
          // Continue anyway to update database
        }
      }
      
      setThumbnailUrl('');
      
      // Always update course in database to remove thumbnail reference
      if (id && id !== 'new') {
        await api.put(`/elearning/courses/${id}`, {
          thumbnailUrl: null, // Set to null to remove reference
        });
      }
    } catch (err: any) {
      console.error('Error deleting thumbnail:', err);
      // Don't show error to user, just clear the URL
      setThumbnailUrl('');
    }
  };

  if (loading && id && id !== 'new') {
    return (
      <>
        <AppNavbar title="Kurs bearbeiten" onLogout={logout} />
        <Container sx={{ mt: 4, display: 'flex', justifyContent: 'center' }}>
          <CircularProgress />
        </Container>
      </>
    );
  }

  return (
    <>
      <AppNavbar title={id === 'new' ? 'Neuer Kurs' : 'Kurs bearbeiten'} onLogout={logout} />
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        <Card>
          <CardContent>
            <Typography variant="h5" gutterBottom>
              {id === 'new' ? 'Neuen Kurs erstellen' : 'Kurs bearbeiten'}
            </Typography>

            {error && (
              <Alert severity="error" sx={{ mb: 3 }}>
                {error}
              </Alert>
            )}

            {success && (
              <Alert severity="success" sx={{ mb: 3 }}>
                Kurs erfolgreich gespeichert!
              </Alert>
            )}

            {/* Tab Navigation */}
            <Tabs value={activeTab} onChange={(_, newValue) => setActiveTab(newValue)} sx={{ mb: 3 }}>
              <Tab label="Grundeinstellungen" />
              <Tab label="Lektionen" disabled={id === 'new'} />
              <Tab label="Quiz" disabled={id === 'new'} />
            </Tabs>

            {/* Tab Content */}
            {activeTab === 0 && (
              <Box component="form" onSubmit={handleSubmit}>
              <Grid container spacing={3}>
                {/* Basis-Informationen */}
                <Grid item xs={12}>
                  <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>
                    Basis-Informationen
                  </Typography>
                </Grid>

                <Grid item xs={12} md={8}>
                  <TextField
                    fullWidth
                    required
                    label="Kurstitel"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                  />
                </Grid>

                <Grid item xs={12} md={4}>
                  <TextField
                    fullWidth
                    select
                    label="Kurstyp"
                    value={courseType}
                    onChange={(e) => setCourseType(e.target.value)}
                  >
                    <MenuItem value="OPTIONAL">Freiwillig</MenuItem>
                    <MenuItem value="MANDATORY">Pflichtschulung</MenuItem>
                    <MenuItem value="CERTIFICATION">Zertifizierung</MenuItem>
                    <MenuItem value="ONBOARDING">Onboarding</MenuItem>
                  </TextField>
                </Grid>

                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    multiline
                    rows={4}
                    label="Beschreibung"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                  />
                </Grid>

                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    select
                    label="Kategorie"
                    value={categoryId}
                    onChange={(e) => setCategoryId(e.target.value)}
                  >
                    <MenuItem value="">Keine Kategorie</MenuItem>
                    {categories.map((cat) => (
                      <MenuItem key={cat.id} value={cat.id}>
                        {cat.name}
                      </MenuItem>
                    ))}
                  </TextField>
                </Grid>

                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Level"
                    value={level}
                    onChange={(e) => setLevel(e.target.value)}
                    placeholder="z.B. Beginner, Intermediate, Advanced"
                  />
                </Grid>

                <Grid item xs={12}>
                  <Autocomplete
                    multiple
                    freeSolo
                    options={[]}
                    value={tags}
                    onChange={(_, newValue) => setTags(newValue)}
                    renderTags={(value, getTagProps) =>
                      value.map((option, index) => (
                        <Chip label={option} {...getTagProps({ index })} key={index} />
                      ))
                    }
                    renderInput={(params) => (
                      <TextField {...params} label="Tags" placeholder="Tag hinzufügen" />
                    )}
                  />
                </Grid>

                {/* Zeitplanung */}
                <Grid item xs={12}>
                  <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>
                    Zeitplanung
                  </Typography>
                </Grid>

                <Grid item xs={12} md={4}>
                  <TextField
                    fullWidth
                    type="number"
                    label="Dauer (Minuten)"
                    value={duration}
                    onChange={(e) => setDuration(e.target.value ? parseInt(e.target.value) : '')}
                    inputProps={{ min: 0 }}
                  />
                </Grid>

                <Grid item xs={12} md={4}>
                  <TextField
                    fullWidth
                    type="date"
                    label="Gültig von"
                    value={validFrom}
                    onChange={(e) => setValidFrom(e.target.value)}
                    InputLabelProps={{ shrink: true }}
                  />
                </Grid>

                <Grid item xs={12} md={4}>
                  <TextField
                    fullWidth
                    type="date"
                    label="Gültig bis"
                    value={validUntil}
                    onChange={(e) => setValidUntil(e.target.value)}
                    InputLabelProps={{ shrink: true }}
                  />
                </Grid>

                {/* Bewertung & Prüfung */}
                <Grid item xs={12}>
                  <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>
                    Bewertung & Prüfung
                  </Typography>
                </Grid>

                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    type="number"
                    label="Bestehensgrenze (%)"
                    value={passingScore}
                    onChange={(e) => setPassingScore(parseInt(e.target.value))}
                    inputProps={{ min: 0, max: 100 }}
                  />
                </Grid>

                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    type="number"
                    label="Maximale Versuche"
                    value={maxAttempts}
                    onChange={(e) => setMaxAttempts(e.target.value ? parseInt(e.target.value) : '')}
                    inputProps={{ min: 1 }}
                    placeholder="Unbegrenzt"
                  />
                </Grid>

                {/* Medien */}
                <Grid item xs={12}>
                  <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>
                    Medien
                  </Typography>
                </Grid>

                <Grid item xs={12}>
                  <Box>
                    <Typography variant="body2" color="textSecondary" gutterBottom>
                      Kurs-Thumbnail
                    </Typography>
                    
                    {thumbnailUrl && (
                      <Box sx={{ mb: 2, position: 'relative', maxWidth: 400 }}>
                        <CardMedia
                          component="img"
                          image={thumbnailUrl.startsWith('http') ? thumbnailUrl : `${getBackendURL()}${thumbnailUrl}`}
                          alt="Kurs-Thumbnail"
                          sx={{ 
                            borderRadius: 1, 
                            maxHeight: 200,
                            objectFit: 'cover',
                            border: '1px solid',
                            borderColor: 'divider'
                          }}
                        />
                        <IconButton
                          size="small"
                          color="error"
                          onClick={handleDeleteThumbnail}
                          sx={{ 
                            position: 'absolute', 
                            top: 8, 
                            right: 8,
                            backgroundColor: 'background.paper',
                            '&:hover': { backgroundColor: 'error.light' }
                          }}
                        >
                          <DeleteIcon />
                        </IconButton>
                      </Box>
                    )}

                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      style={{ display: 'none' }}
                      onChange={handleThumbnailUpload}
                    />
                    
                    <Button
                      variant="outlined"
                      startIcon={uploadingThumbnail ? <CircularProgress size={20} /> : <UploadIcon />}
                      onClick={() => fileInputRef.current?.click()}
                      disabled={uploadingThumbnail}
                    >
                      {thumbnailUrl ? 'Thumbnail ändern' : 'Thumbnail hochladen'}
                    </Button>
                    
                    <Typography variant="caption" display="block" sx={{ mt: 1, color: 'text.secondary' }}>
                      Empfohlene Größe: 800x450px (16:9). Max. 5MB. Formate: JPG, PNG, GIF, WebP, SVG
                    </Typography>
                  </Box>
                </Grid>

                {/* Compliance & EHS */}
                <Grid item xs={12}>
                  <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>
                    Compliance & EHS
                  </Typography>
                </Grid>

                <Grid item xs={12} md={4}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={isComplianceCourse}
                        onChange={(e) => setIsComplianceCourse(e.target.checked)}
                      />
                    }
                    label="Compliance-relevant"
                  />
                </Grid>

                <Grid item xs={12} md={4}>
                  <FormControlLabel
                    control={
                      <Switch checked={ehsRelevant} onChange={(e) => setEhsRelevant(e.target.checked)} />
                    }
                    label="EHS-relevant"
                  />
                </Grid>

                <Grid item xs={12} md={4}>
                  <TextField
                    fullWidth
                    type="number"
                    label="Wiederholung nach (Monate)"
                    value={renewalMonths}
                    onChange={(e) => setRenewalMonths(e.target.value ? parseInt(e.target.value) : '')}
                    inputProps={{ min: 1 }}
                    disabled={!isComplianceCourse && !ehsRelevant}
                  />
                </Grid>

                {/* Buttons */}
                <Grid item xs={12}>
                  <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end', mt: 3 }}>
                    <Button variant="outlined" onClick={() => navigate('/elearning')}>
                      Abbrechen
                    </Button>
                    <Button type="submit" variant="contained" disabled={loading}>
                      {loading ? <CircularProgress size={24} /> : 'Speichern'}
                    </Button>
                  </Box>
                </Grid>
              </Grid>
            </Box>
            )}

            {/* Lessons Tab */}
            {activeTab === 1 && id && id !== 'new' && (
              <LessonEditor courseId={id} />
            )}

            {/* Quiz Tab */}
            {activeTab === 2 && id && id !== 'new' && (
              <QuizBuilder courseId={id} />
            )}
          </CardContent>
        </Card>
      </Container>
    </>
  );
};

export default CourseEditorPage;
