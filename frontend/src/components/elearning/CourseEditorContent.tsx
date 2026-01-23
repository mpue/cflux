import React, { useState, useEffect, useRef } from 'react';
import {
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
import { useNavigate } from 'react-router-dom';
import LessonEditor from './LessonEditor';
import QuizBuilder from './QuizBuilder';
import api, { getBackendURL } from '../../services/api';

interface Category {
  id: string;
  name: string;
  color?: string;
}

interface CourseEditorContentProps {
  courseId?: string;
  onSaveSuccess?: () => void;
}

const CourseEditorContent: React.FC<CourseEditorContentProps> = ({ courseId, onSaveSuccess }) => {
  const navigate = useNavigate();
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
    if (courseId && courseId !== 'new') {
      loadCourse();
    }
  }, [courseId]);

  const loadCategories = async () => {
    try {
      const response = await api.get('/elearning/categories');
      setCategories(response.data);
    } catch (err: any) {
      console.error('Error loading categories:', err);
    }
  };

  const loadCourse = async () => {
    if (!courseId || courseId === 'new') return;
    
    try {
      setLoading(true);
      const response = await api.get(`/elearning/courses/${courseId}`);
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

      if (courseId && courseId !== 'new') {
        await api.put(`/elearning/courses/${courseId}`, data);
        setSuccess(true);
        setTimeout(() => setSuccess(false), 3000);
        if (onSaveSuccess) onSaveSuccess();
      } else {
        const response = await api.post('/elearning/courses', data);
        setSuccess(true);
        setTimeout(() => {
          navigate(`/elearning/courses/${response.data.id}/edit`, { replace: true });
        }, 1000);
        if (onSaveSuccess) onSaveSuccess();
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

    if (!file.type.startsWith('image/')) {
      setError('Bitte wählen Sie eine Bilddatei aus');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setError('Bild darf maximal 5MB groß sein');
      return;
    }

    try {
      setUploadingThumbnail(true);
      setError(null);

      const formData = new FormData();
      formData.append('thumbnail', file);

      const response = await api.post('/elearning/upload/thumbnail', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      setThumbnailUrl(response.data.url);
    } catch (err: any) {
      console.error('Error uploading thumbnail:', err);
      setError(err.response?.data?.error || 'Fehler beim Hochladen des Thumbnails');
    } finally {
      setUploadingThumbnail(false);
    }
  };

  const handleDeleteThumbnail = async () => {
    if (!thumbnailUrl) return;

    try {
      const filename = thumbnailUrl.split('/').pop();
      await api.delete(`/elearning/upload/course-thumbnails/${filename}`);
      setThumbnailUrl('');
    } catch (err: any) {
      console.error('Error deleting thumbnail:', err);
      setError(err.response?.data?.error || 'Fehler beim Löschen des Thumbnails');
    }
  };

  if (loading && !title) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {success && (
        <Alert severity="success" sx={{ mb: 2 }}>
          Kurs erfolgreich gespeichert!
        </Alert>
      )}

      <Tabs value={activeTab} onChange={(_, v) => setActiveTab(v)} sx={{ mb: 3 }}>
        <Tab label="Kurs-Details" />
        <Tab label="Lektionen" disabled={!courseId || courseId === 'new'} />
        <Tab label="Quiz" disabled={!courseId || courseId === 'new'} />
      </Tabs>

      {activeTab === 0 && (
        <Card>
          <CardContent>
            <form onSubmit={handleSubmit}>
              <Grid container spacing={3}>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Kurstitel *"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    required
                  />
                </Grid>

                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Beschreibung"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    multiline
                    rows={4}
                  />
                </Grid>

                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    select
                    label="Kurstyp"
                    value={courseType}
                    onChange={(e) => setCourseType(e.target.value)}
                  >
                    <MenuItem value="MANDATORY">Pflicht</MenuItem>
                    <MenuItem value="OPTIONAL">Freiwillig</MenuItem>
                    <MenuItem value="CERTIFICATION">Zertifizierung</MenuItem>
                    <MenuItem value="ONBOARDING">Onboarding</MenuItem>
                  </TextField>
                </Grid>

                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    select
                    label="Kategorie"
                    value={categoryId}
                    onChange={(e) => setCategoryId(e.target.value)}
                  >
                    <MenuItem value="">Keine</MenuItem>
                    {categories.map((cat) => (
                      <MenuItem key={cat.id} value={cat.id}>
                        {cat.name}
                      </MenuItem>
                    ))}
                  </TextField>
                </Grid>

                <Grid item xs={12}>
                  <Box>
                    <Typography variant="subtitle2" gutterBottom>
                      Thumbnail
                    </Typography>
                    {thumbnailUrl ? (
                      <Card sx={{ maxWidth: 300 }}>
                        <CardMedia
                          component="img"
                          height="200"
                          image={`${getBackendURL()}${thumbnailUrl}`}
                          alt="Course thumbnail"
                        />
                        <Box sx={{ p: 1, display: 'flex', justifyContent: 'center' }}>
                          <IconButton 
                            size="small" 
                            color="error"
                            onClick={handleDeleteThumbnail}
                          >
                            <DeleteIcon />
                          </IconButton>
                        </Box>
                      </Card>
                    ) : (
                      <Box>
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
                          {uploadingThumbnail ? 'Wird hochgeladen...' : 'Thumbnail hochladen'}
                        </Button>
                      </Box>
                    )}
                  </Box>
                </Grid>

                <Grid item xs={12} md={4}>
                  <TextField
                    fullWidth
                    type="number"
                    label="Dauer (Minuten)"
                    value={duration}
                    onChange={(e) => setDuration(e.target.value ? Number(e.target.value) : '')}
                  />
                </Grid>

                <Grid item xs={12} md={4}>
                  <TextField
                    fullWidth
                    select
                    label="Level"
                    value={level}
                    onChange={(e) => setLevel(e.target.value)}
                  >
                    <MenuItem value="">Keine Angabe</MenuItem>
                    <MenuItem value="BEGINNER">Anfänger</MenuItem>
                    <MenuItem value="INTERMEDIATE">Fortgeschritten</MenuItem>
                    <MenuItem value="ADVANCED">Experte</MenuItem>
                  </TextField>
                </Grid>

                <Grid item xs={12} md={4}>
                  <TextField
                    fullWidth
                    type="number"
                    label="Bestehensgrenze (%)"
                    value={passingScore}
                    onChange={(e) => setPassingScore(Number(e.target.value))}
                    inputProps={{ min: 0, max: 100 }}
                  />
                </Grid>

                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    type="date"
                    label="Gültig ab"
                    value={validFrom}
                    onChange={(e) => setValidFrom(e.target.value)}
                    InputLabelProps={{ shrink: true }}
                  />
                </Grid>

                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    type="date"
                    label="Gültig bis"
                    value={validUntil}
                    onChange={(e) => setValidUntil(e.target.value)}
                    InputLabelProps={{ shrink: true }}
                  />
                </Grid>

                <Grid item xs={12}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={isComplianceCourse}
                        onChange={(e) => setIsComplianceCourse(e.target.checked)}
                      />
                    }
                    label="Compliance-Kurs"
                  />
                </Grid>

                <Grid item xs={12}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={ehsRelevant}
                        onChange={(e) => setEhsRelevant(e.target.checked)}
                      />
                    }
                    label="EHS-relevant"
                  />
                </Grid>

                <Grid item xs={12}>
                  <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
                    <Button
                      variant="contained"
                      type="submit"
                      disabled={loading}
                    >
                      {loading ? 'Speichert...' : 'Speichern'}
                    </Button>
                  </Box>
                </Grid>
              </Grid>
            </form>
          </CardContent>
        </Card>
      )}

      {activeTab === 1 && courseId && courseId !== 'new' && (
        <LessonEditor courseId={courseId} />
      )}

      {activeTab === 2 && courseId && courseId !== 'new' && (
        <QuizBuilder courseId={courseId} />
      )}
    </Box>
  );
};

export default CourseEditorContent;
