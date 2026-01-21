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
  FormControlLabel,
  Checkbox,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  CheckCircle as CorrectIcon,
} from '@mui/icons-material';
import api from '../../services/api';

interface Quiz {
  id: string;
  lessonId: string;
  title: string;
  description?: string;
  timeLimit?: number;
  shuffleQuestions: boolean;
  shuffleAnswers: boolean;
  showResults: boolean;
  passingScore: number;
  questions: Question[];
}

interface Question {
  id: string;
  quizId: string;
  questionText: string;
  questionType: string;
  points: number;
  order: number;
  explanation?: string;
  caseSensitive: boolean;
  answers: Answer[];
}

interface Answer {
  id: string;
  questionId: string;
  answerText: string;
  isCorrect: boolean;
  order: number;
}

interface QuizBuilderProps {
  courseId: string;
  onUpdate?: () => void;
}

const QuizBuilder: React.FC<QuizBuilderProps> = ({ courseId, onUpdate }) => {
  const [lessons, setLessons] = useState<any[]>([]);
  const [selectedLessonId, setSelectedLessonId] = useState<string | null>(null);
  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [questionDialogOpen, setQuestionDialogOpen] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState<Question | null>(null);
  const [deleteQuestionDialogOpen, setDeleteQuestionDialogOpen] = useState(false);

  // Quiz settings
  const [quizTitle, setQuizTitle] = useState('');
  const [quizDescription, setQuizDescription] = useState('');
  const [timeLimit, setTimeLimit] = useState<number | ''>('');
  const [shuffleQuestions, setShuffleQuestions] = useState(false);
  const [shuffleAnswers, setShuffleAnswers] = useState(false);
  const [showResults, setShowResults] = useState(true);
  const [passingScore, setPassingScore] = useState(80);

  // Question form
  const [questionText, setQuestionText] = useState('');
  const [questionType, setQuestionType] = useState('MULTIPLE_CHOICE');
  const [points, setPoints] = useState(1);
  const [explanation, setExplanation] = useState('');
  const [caseSensitive, setCaseSensitive] = useState(false);
  const [answers, setAnswers] = useState<Partial<Answer>[]>([]);

  useEffect(() => {
    loadLessons();
  }, [courseId]);

  useEffect(() => {
    if (selectedLessonId) {
      loadQuiz();
    }
  }, [selectedLessonId]);

  const loadLessons = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/elearning/courses/${courseId}`);
      const quizLessons = response.data.lessons?.filter((l: any) => l.contentType === 'QUIZ') || [];
      setLessons(quizLessons);
      if (quizLessons.length > 0 && !selectedLessonId) {
        setSelectedLessonId(quizLessons[0].id);
      }
    } catch (err: any) {
      console.error('Error loading lessons:', err);
      setError('Fehler beim Laden der Lektionen');
    } finally {
      setLoading(false);
    }
  };

  const loadQuiz = async () => {
    if (!selectedLessonId) return;

    try {
      setLoading(true);
      const response = await api.get(`/elearning/lessons/${selectedLessonId}/quiz`);
      if (response.data) {
        setQuiz(response.data);
        setQuizTitle(response.data.title);
        setQuizDescription(response.data.description || '');
        setTimeLimit(response.data.timeLimit || '');
        setShuffleQuestions(response.data.shuffleQuestions);
        setShuffleAnswers(response.data.shuffleAnswers);
        setShowResults(response.data.showResults);
        setPassingScore(response.data.passingScore);
      } else {
        setQuiz(null);
      }
    } catch (err: any) {
      if (err.response?.status === 404) {
        setQuiz(null);
      } else {
        console.error('Error loading quiz:', err);
        setError('Fehler beim Laden des Quiz');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSaveQuizSettings = async () => {
    if (!selectedLessonId) return;

    try {
      setLoading(true);
      const data = {
        lessonId: selectedLessonId,
        title: quizTitle,
        description: quizDescription || undefined,
        timeLimit: timeLimit || undefined,
        shuffleQuestions,
        shuffleAnswers,
        showResults,
        passingScore,
      };

      if (quiz) {
        await api.put(`/elearning/quizzes/${quiz.id}`, data);
      } else {
        await api.post('/elearning/quizzes', data);
      }

      await loadQuiz();
      setError(null);
      if (onUpdate) onUpdate();
    } catch (err: any) {
      console.error('Error saving quiz:', err);
      setError(err.response?.data?.error || 'Fehler beim Speichern');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenQuestionDialog = (question?: Question) => {
    if (question) {
      setEditingQuestion(question);
      setQuestionText(question.questionText);
      setQuestionType(question.questionType);
      setPoints(question.points);
      setExplanation(question.explanation || '');
      setCaseSensitive(question.caseSensitive);
      setAnswers(question.answers || []);
    } else {
      setEditingQuestion(null);
      setQuestionText('');
      setQuestionType('MULTIPLE_CHOICE');
      setPoints(1);
      setExplanation('');
      setCaseSensitive(false);
      setAnswers([
        { answerText: '', isCorrect: false, order: 0 },
        { answerText: '', isCorrect: false, order: 1 },
      ]);
    }
    setQuestionDialogOpen(true);
  };

  const handleSaveQuestion = async () => {
    if (!quiz) {
      setError('Bitte speichern Sie zuerst die Quiz-Einstellungen');
      return;
    }

    if (!questionText.trim()) {
      setError('Frage ist erforderlich');
      return;
    }

    try {
      setLoading(true);
      const data = {
        quizId: quiz.id,
        questionText,
        questionType,
        points,
        explanation: explanation || undefined,
        caseSensitive,
        order: editingQuestion ? editingQuestion.order : quiz.questions.length,
      };

      let questionId: string;

      if (editingQuestion) {
        await api.put(`/elearning/questions/${editingQuestion.id}`, data);
        questionId = editingQuestion.id;
      } else {
        const response = await api.post('/elearning/questions', data);
        questionId = response.data.id;
      }

      // Save answers
      if (questionType !== 'FREE_TEXT') {
        for (const answer of answers) {
          if (answer.answerText?.trim()) {
            const answerData = {
              questionId,
              answerText: answer.answerText,
              isCorrect: answer.isCorrect || false,
              order: answer.order || 0,
            };

            if (answer.id) {
              await api.put(`/elearning/answers/${answer.id}`, answerData);
            } else {
              await api.post('/elearning/answers', answerData);
            }
          }
        }
      }

      await loadQuiz();
      setQuestionDialogOpen(false);
      setError(null);
    } catch (err: any) {
      console.error('Error saving question:', err);
      setError(err.response?.data?.error || 'Fehler beim Speichern');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteQuestion = async () => {
    if (!editingQuestion) return;

    try {
      setLoading(true);
      await api.delete(`/elearning/questions/${editingQuestion.id}`);
      await loadQuiz();
      setDeleteQuestionDialogOpen(false);
      setEditingQuestion(null);
    } catch (err: any) {
      console.error('Error deleting question:', err);
      setError('Fehler beim Löschen');
    } finally {
      setLoading(false);
    }
  };

  const handleAddAnswer = () => {
    setAnswers([...answers, { answerText: '', isCorrect: false, order: answers.length }]);
  };

  const handleRemoveAnswer = (index: number) => {
    setAnswers(answers.filter((_, i) => i !== index));
  };

  const handleAnswerChange = (index: number, field: string, value: any) => {
    const newAnswers = [...answers];
    newAnswers[index] = { ...newAnswers[index], [field]: value };
    setAnswers(newAnswers);
  };

  const getQuestionTypeLabel = (type: string) => {
    const labels: { [key: string]: string } = {
      MULTIPLE_CHOICE: 'Multiple Choice',
      MULTIPLE_SELECT: 'Multiple Select',
      TRUE_FALSE: 'Richtig/Falsch',
      FREE_TEXT: 'Freitext',
    };
    return labels[type] || type;
  };

  if (lessons.length === 0) {
    return (
      <Box>
        <Alert severity="warning">
          Keine Quiz-Lektionen vorhanden. Erstellen Sie im Lektionen-Tab eine Lektion mit dem Inhaltstyp "Quiz".
        </Alert>
      </Box>
    );
  }

  return (
    <Box>
      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* Lesson Selector */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <TextField
            fullWidth
            select
            label="Quiz-Lektion auswählen"
            value={selectedLessonId || ''}
            onChange={(e) => setSelectedLessonId(e.target.value)}
          >
            {lessons.map((lesson) => (
              <MenuItem key={lesson.id} value={lesson.id}>
                {lesson.title}
              </MenuItem>
            ))}
          </TextField>
        </CardContent>
      </Card>

      {!selectedLessonId ? (
        <Alert severity="info">Bitte wählen Sie eine Quiz-Lektion aus.</Alert>
      ) : !quiz && !loading ? (
        <Box>
          <Alert severity="info" sx={{ mb: 3 }}>
            Noch kein Quiz für diese Lektion erstellt.
          </Alert>

          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Quiz erstellen
              </Typography>

              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    required
                    label="Quiz-Titel"
                    value={quizTitle}
                    onChange={(e) => setQuizTitle(e.target.value)}
                  />
                </Grid>

                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    multiline
                    rows={2}
                    label="Beschreibung"
                    value={quizDescription}
                    onChange={(e) => setQuizDescription(e.target.value)}
                  />
                </Grid>

                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    type="number"
                    label="Zeitlimit (Minuten)"
                    value={timeLimit}
                    onChange={(e) => setTimeLimit(e.target.value ? parseInt(e.target.value) : '')}
                    placeholder="Unbegrenzt"
                    inputProps={{ min: 1 }}
                  />
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

                <Grid item xs={12}>
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={shuffleQuestions}
                        onChange={(e) => setShuffleQuestions(e.target.checked)}
                      />
                    }
                    label="Fragen zufällig mischen"
                  />
                </Grid>

                <Grid item xs={12}>
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={shuffleAnswers}
                        onChange={(e) => setShuffleAnswers(e.target.checked)}
                      />
                    }
                    label="Antworten zufällig mischen"
                  />
                </Grid>

                <Grid item xs={12}>
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={showResults}
                        onChange={(e) => setShowResults(e.target.checked)}
                      />
                    }
                    label="Ergebnisse nach Abschluss anzeigen"
                  />
                </Grid>

                <Grid item xs={12}>
                  <Button
                    variant="contained"
                    onClick={handleSaveQuizSettings}
                    disabled={loading || !quizTitle.trim()}
                  >
                    Quiz erstellen
                  </Button>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Box>
      ) : quiz ? (
        <Box>
          {/* Quiz Settings */}
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Quiz-Einstellungen
              </Typography>

              <Grid container spacing={2}>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    required
                    label="Quiz-Titel"
                    value={quizTitle}
                    onChange={(e) => setQuizTitle(e.target.value)}
                  />
                </Grid>

                <Grid item xs={12} md={3}>
                  <TextField
                    fullWidth
                    type="number"
                    label="Zeitlimit (Min.)"
                    value={timeLimit}
                    onChange={(e) => setTimeLimit(e.target.value ? parseInt(e.target.value) : '')}
                    placeholder="Unbegrenzt"
                  />
                </Grid>

                <Grid item xs={12} md={3}>
                  <TextField
                    fullWidth
                    type="number"
                    label="Bestehensgrenze (%)"
                    value={passingScore}
                    onChange={(e) => setPassingScore(parseInt(e.target.value))}
                    inputProps={{ min: 0, max: 100 }}
                  />
                </Grid>

                <Grid item xs={12}>
                  <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                    <FormControlLabel
                      control={
                        <Checkbox
                          checked={shuffleQuestions}
                          onChange={(e) => setShuffleQuestions(e.target.checked)}
                        />
                      }
                      label="Fragen mischen"
                    />
                    <FormControlLabel
                      control={
                        <Checkbox
                          checked={shuffleAnswers}
                          onChange={(e) => setShuffleAnswers(e.target.checked)}
                        />
                      }
                      label="Antworten mischen"
                    />
                    <FormControlLabel
                      control={
                        <Checkbox
                          checked={showResults}
                          onChange={(e) => setShowResults(e.target.checked)}
                        />
                      }
                      label="Ergebnisse anzeigen"
                    />
                  </Box>
                </Grid>

                <Grid item xs={12}>
                  <Button variant="outlined" onClick={handleSaveQuizSettings} disabled={loading}>
                    Einstellungen speichern
                  </Button>
                </Grid>
              </Grid>
            </CardContent>
          </Card>

          {/* Questions */}
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h6">
              Fragen ({quiz.questions?.length || 0})
            </Typography>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => handleOpenQuestionDialog()}
            >
              Frage hinzufügen
            </Button>
          </Box>

          {(!quiz.questions || quiz.questions.length === 0) ? (
            <Card>
              <CardContent>
                <Typography color="text.secondary" align="center">
                  Noch keine Fragen vorhanden. Fügen Sie die erste Frage hinzu.
                </Typography>
              </CardContent>
            </Card>
          ) : (
            <List>
              {quiz.questions.map((question, index) => (
                <Card key={question.id} sx={{ mb: 2 }}>
                  <ListItem>
                    <Box sx={{ mr: 2 }}>
                      <Typography variant="h6" color="text.secondary">
                        {index + 1}
                      </Typography>
                    </Box>
                    <ListItemText
                      primary={
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Typography variant="body1" fontWeight="bold">
                            {question.questionText}
                          </Typography>
                          <Chip label={getQuestionTypeLabel(question.questionType)} size="small" />
                          <Chip label={`${question.points} Punkt${question.points !== 1 ? 'e' : ''}`} size="small" variant="outlined" />
                        </Box>
                      }
                      secondary={
                        <Box sx={{ mt: 1 }}>
                          {question.answers?.map((answer) => (
                            <Box key={answer.id} sx={{ display: 'flex', alignItems: 'center', gap: 1, ml: 2, my: 0.5 }}>
                              {answer.isCorrect ? (
                                <CorrectIcon color="success" fontSize="small" />
                              ) : (
                                <Box sx={{ width: 20 }} />
                              )}
                              <Typography variant="body2" color={answer.isCorrect ? 'success.main' : 'text.secondary'}>
                                {answer.answerText}
                              </Typography>
                            </Box>
                          ))}
                          {question.explanation && (
                            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1, ml: 2 }}>
                              💡 {question.explanation}
                            </Typography>
                          )}
                        </Box>
                      }
                    />
                    <ListItemSecondaryAction>
                      <IconButton size="small" onClick={() => handleOpenQuestionDialog(question)}>
                        <EditIcon />
                      </IconButton>
                      <IconButton
                        size="small"
                        color="error"
                        onClick={() => {
                          setEditingQuestion(question);
                          setDeleteQuestionDialogOpen(true);
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
        </Box>
      ) : null}

      {/* Question Dialog */}
      <Dialog open={questionDialogOpen} onClose={() => setQuestionDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>
          {editingQuestion ? 'Frage bearbeiten' : 'Neue Frage erstellen'}
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                required
                multiline
                rows={2}
                label="Frage"
                value={questionText}
                onChange={(e) => setQuestionText(e.target.value)}
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                select
                label="Fragetyp"
                value={questionType}
                onChange={(e) => setQuestionType(e.target.value)}
              >
                <MenuItem value="MULTIPLE_CHOICE">Multiple Choice (eine Antwort)</MenuItem>
                <MenuItem value="MULTIPLE_SELECT">Multiple Select (mehrere)</MenuItem>
                <MenuItem value="TRUE_FALSE">Richtig/Falsch</MenuItem>
                <MenuItem value="FREE_TEXT">Freitext</MenuItem>
              </TextField>
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                type="number"
                label="Punkte"
                value={points}
                onChange={(e) => setPoints(parseInt(e.target.value))}
                inputProps={{ min: 1 }}
              />
            </Grid>

            <Grid item xs={12}>
              <TextField
                fullWidth
                multiline
                rows={2}
                label="Erklärung (optional)"
                value={explanation}
                onChange={(e) => setExplanation(e.target.value)}
                helperText="Wird nach der Beantwortung angezeigt"
              />
            </Grid>

            {questionType === 'FREE_TEXT' && (
              <Grid item xs={12}>
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={caseSensitive}
                      onChange={(e) => setCaseSensitive(e.target.checked)}
                    />
                  }
                  label="Groß-/Kleinschreibung beachten"
                />
              </Grid>
            )}

            {questionType !== 'FREE_TEXT' && (
              <Grid item xs={12}>
                <Divider sx={{ my: 2 }} />
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                  <Typography variant="subtitle1">Antworten</Typography>
                  <Button size="small" startIcon={<AddIcon />} onClick={handleAddAnswer}>
                    Antwort hinzufügen
                  </Button>
                </Box>

                {answers.map((answer, index) => (
                  <Box key={index} sx={{ display: 'flex', gap: 1, mb: 2, alignItems: 'center' }}>
                    <Checkbox
                      checked={answer.isCorrect || false}
                      onChange={(e) => handleAnswerChange(index, 'isCorrect', e.target.checked)}
                      color="success"
                    />
                    <TextField
                      fullWidth
                      label={`Antwort ${index + 1}`}
                      value={answer.answerText || ''}
                      onChange={(e) => handleAnswerChange(index, 'answerText', e.target.value)}
                    />
                    <IconButton
                      size="small"
                      color="error"
                      onClick={() => handleRemoveAnswer(index)}
                      disabled={answers.length <= 2}
                    >
                      <DeleteIcon />
                    </IconButton>
                  </Box>
                ))}
              </Grid>
            )}
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setQuestionDialogOpen(false)}>Abbrechen</Button>
          <Button onClick={handleSaveQuestion} variant="contained" disabled={loading}>
            Speichern
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation */}
      <Dialog open={deleteQuestionDialogOpen} onClose={() => setDeleteQuestionDialogOpen(false)}>
        <DialogTitle>Frage löschen?</DialogTitle>
        <DialogContent>
          <Typography>
            Möchten Sie diese Frage wirklich löschen? Diese Aktion kann nicht rückgängig gemacht werden.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteQuestionDialogOpen(false)}>Abbrechen</Button>
          <Button onClick={handleDeleteQuestion} color="error" variant="contained">
            Löschen
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default QuizBuilder;
