import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  Button,
  Radio,
  RadioGroup,
  FormControlLabel,
  Checkbox,
  TextField,
  LinearProgress,
  Alert,
  Card,
  CardContent,
  Divider,
  Chip,
  Grid,
} from '@mui/material';
import {
  CheckCircle as CheckCircleIcon,
  Cancel as CancelIcon,
  AccessTime as AccessTimeIcon,
  Info as InfoIcon,
} from '@mui/icons-material';
import api from '../../services/api';

interface Answer {
  id: string;
  answerText: string;
  isCorrect: boolean;
}

interface Question {
  id: string;
  questionText: string;
  questionType: 'SINGLE_CHOICE' | 'MULTIPLE_CHOICE' | 'TRUE_FALSE' | 'TEXT' | 'FILL_BLANK';
  points: number;
  explanation?: string;
  answers: Answer[];
}

interface Quiz {
  id: string;
  title: string;
  description?: string;
  passingScore: number;
  timeLimit?: number;
  maxAttempts?: number;
  randomizeQuestions: boolean;
  randomizeAnswers: boolean;
  showCorrectAnswers: boolean;
  allowReview: boolean;
  questions: Question[];
}

interface QuizAttempt {
  id: string;
  attemptNumber: number;
  startedAt: string;
  completedAt?: string;
  score?: number;
  passed?: boolean;
  timeSpent?: number;
}

interface QuestionResponse {
  questionId: string;
  selectedAnswers?: string[];
  textResponse?: string;
}

interface QuizTakerProps {
  quizId: string;
  enrollmentId: string;
  onComplete?: (attempt: QuizAttempt) => void;
  onCancel?: () => void;
}

const QuizTaker: React.FC<QuizTakerProps> = ({
  quizId,
  enrollmentId,
  onComplete,
  onCancel,
}) => {
  const [loading, setLoading] = useState(true);
  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [attempt, setAttempt] = useState<QuizAttempt | null>(null);
  const [previousAttempts, setPreviousAttempts] = useState<QuizAttempt[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [responses, setResponses] = useState<Map<string, QuestionResponse>>(new Map());
  const [timeElapsed, setTimeElapsed] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  // Timer effect
  useEffect(() => {
    if (!attempt || attempt.completedAt || result) return;

    const interval = setInterval(() => {
      setTimeElapsed((prev) => prev + 1);
    }, 1000);

    return () => clearInterval(interval);
  }, [attempt, result]);

  // Load quiz and start attempt
  useEffect(() => {
    loadQuiz();
  }, [quizId, enrollmentId]);

  const loadQuiz = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch quiz details
      const quizResponse = await api.get(`/elearning/quizzes/${quizId}`);
      let quizData = quizResponse.data;

      // Randomize questions if needed
      if (quizData.randomizeQuestions) {
        quizData.questions = [...quizData.questions].sort(() => Math.random() - 0.5);
      }

      // Randomize answers if needed
      if (quizData.randomizeAnswers) {
        quizData.questions = quizData.questions.map((q: Question) => ({
          ...q,
          answers: [...q.answers].sort(() => Math.random() - 0.5),
        }));
      }

      setQuiz(quizData);

      // Fetch previous attempts
      const attemptsResponse = await api.get(
        `/elearning/quiz-attempts?enrollmentId=${enrollmentId}&quizId=${quizId}`
      );
      setPreviousAttempts(attemptsResponse.data);

      // Check if max attempts reached
      if (
        quizData.maxAttempts &&
        attemptsResponse.data.length >= quizData.maxAttempts
      ) {
        setError(
          `You have reached the maximum number of attempts (${quizData.maxAttempts}) for this quiz.`
        );
        setLoading(false);
        return;
      }

      // Start new attempt
      const attemptResponse = await api.post('/elearning/quiz-attempts', {
        quizId,
        enrollmentId,
      });
      setAttempt(attemptResponse.data);
    } catch (err: any) {
      console.error('Error loading quiz:', err);
      setError(err.response?.data?.error || 'Failed to load quiz');
    } finally {
      setLoading(false);
    }
  };

  const handleAnswerChange = (questionId: string, value: any, isMultiple: boolean = false) => {
    const currentResponse = responses.get(questionId) || { questionId };

    if (isMultiple) {
      // Handle checkbox (multiple select)
      const currentAnswers = currentResponse.selectedAnswers || [];
      const newAnswers = currentAnswers.includes(value)
        ? currentAnswers.filter((a) => a !== value)
        : [...currentAnswers, value];

      setResponses(
        new Map(
          responses.set(questionId, {
            ...currentResponse,
            selectedAnswers: newAnswers,
          })
        )
      );
    } else if (typeof value === 'string' && !Array.isArray(value)) {
      // Handle text input or single choice
      const question = quiz?.questions.find((q) => q.id === questionId);
      if (question?.questionType === 'TEXT' || question?.questionType === 'FILL_BLANK') {
        setResponses(
          new Map(
            responses.set(questionId, {
              ...currentResponse,
              textResponse: value,
            })
          )
        );
      } else {
        setResponses(
          new Map(
            responses.set(questionId, {
              ...currentResponse,
              selectedAnswers: [value],
            })
          )
        );
      }
    }
  };

  const handleSubmit = async () => {
    if (!attempt || !quiz) return;

    // Check if all questions are answered
    const unansweredQuestions = quiz.questions.filter(
      (q) => !responses.has(q.id)
    );

    if (unansweredQuestions.length > 0) {
      if (
        !window.confirm(
          `You have ${unansweredQuestions.length} unanswered question(s). Submit anyway?`
        )
      ) {
        return;
      }
    }

    try {
      setIsSubmitting(true);
      setError(null);

      // Convert responses to array format
      const responsesArray = Array.from(responses.values());

      const resultResponse = await api.post(
        `/elearning/quiz-attempts/${attempt.id}/submit`,
        {
          responses: responsesArray,
        }
      );

      setResult(resultResponse.data);
      
      if (onComplete) {
        onComplete(resultResponse.data.attempt);
      }
    } catch (err: any) {
      console.error('Error submitting quiz:', err);
      setError(err.response?.data?.error || 'Failed to submit quiz');
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const calculateProgress = () => {
    if (!quiz) return 0;
    return (responses.size / quiz.questions.length) * 100;
  };

  if (loading) {
    return (
      <Box sx={{ p: 3 }}>
        <Typography>Loading quiz...</Typography>
        <LinearProgress sx={{ mt: 2 }} />
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
        {previousAttempts.length > 0 && (
          <Box sx={{ mt: 3 }}>
            <Typography variant="h6" gutterBottom>
              Previous Attempts
            </Typography>
            {previousAttempts.map((prevAttempt) => (
              <Card key={prevAttempt.id} sx={{ mb: 2 }}>
                <CardContent>
                  <Grid container spacing={2} alignItems="center">
                    <Grid item xs={12} sm={3}>
                      <Typography variant="body2" color="text.secondary">
                        Attempt {prevAttempt.attemptNumber}
                      </Typography>
                    </Grid>
                    <Grid item xs={12} sm={3}>
                      <Typography variant="body1">
                        Score: {prevAttempt.score?.toFixed(1) || 0}%
                      </Typography>
                    </Grid>
                    <Grid item xs={12} sm={3}>
                      <Chip
                        label={prevAttempt.passed ? 'Passed' : 'Failed'}
                        color={prevAttempt.passed ? 'success' : 'error'}
                        size="small"
                      />
                    </Grid>
                    <Grid item xs={12} sm={3}>
                      <Typography variant="body2" color="text.secondary">
                        {new Date(prevAttempt.startedAt).toLocaleDateString()}
                      </Typography>
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>
            ))}
          </Box>
        )}
        {onCancel && (
          <Button onClick={onCancel} sx={{ mt: 2 }}>
            Back to Course
          </Button>
        )}
      </Box>
    );
  }

  if (!quiz || !attempt) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error">Quiz not found</Alert>
      </Box>
    );
  }

  // Show results
  if (result) {
    const { attempt: completedAttempt, responses: gradedResponses } = result;
    
    return (
      <Box sx={{ p: 3 }}>
        <Paper sx={{ p: 3, mb: 3 }}>
          <Box sx={{ textAlign: 'center', mb: 3 }}>
            {completedAttempt.passed ? (
              <CheckCircleIcon sx={{ fontSize: 80, color: 'success.main' }} />
            ) : (
              <CancelIcon sx={{ fontSize: 80, color: 'error.main' }} />
            )}
            <Typography variant="h4" gutterBottom sx={{ mt: 2 }}>
              {completedAttempt.passed ? 'Congratulations!' : 'Not Passed'}
            </Typography>
            <Typography variant="h5" color="text.secondary" gutterBottom>
              Your Score: {completedAttempt.score?.toFixed(1) || 0}%
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Passing Score: {quiz.passingScore}%
            </Typography>
          </Box>

          <Divider sx={{ my: 3 }} />

          <Grid container spacing={2}>
            <Grid item xs={12} sm={4}>
              <Typography variant="body2" color="text.secondary">
                Attempt Number
              </Typography>
              <Typography variant="h6">{completedAttempt.attemptNumber}</Typography>
            </Grid>
            <Grid item xs={12} sm={4}>
              <Typography variant="body2" color="text.secondary">
                Time Spent
              </Typography>
              <Typography variant="h6">
                {formatTime(completedAttempt.timeSpent || 0)}
              </Typography>
            </Grid>
            <Grid item xs={12} sm={4}>
              <Typography variant="body2" color="text.secondary">
                Completed At
              </Typography>
              <Typography variant="h6">
                {new Date(completedAttempt.completedAt).toLocaleTimeString()}
              </Typography>
            </Grid>
          </Grid>
        </Paper>

        {quiz.showCorrectAnswers && quiz.allowReview && (
          <Box sx={{ mb: 3 }}>
            <Typography variant="h6" gutterBottom>
              Review Answers
            </Typography>
            {quiz.questions.map((question, index) => {
              const response = gradedResponses.find((r: any) => r.questionId === question.id);
              
              return (
                <Paper key={question.id} sx={{ p: 3, mb: 2 }}>
                  <Box sx={{ display: 'flex', alignItems: 'flex-start', mb: 2 }}>
                    <Box sx={{ flexGrow: 1 }}>
                      <Typography variant="subtitle1" gutterBottom>
                        Question {index + 1}
                      </Typography>
                      <Typography variant="body1" gutterBottom>
                        {question.questionText}
                      </Typography>
                    </Box>
                    <Chip
                      icon={response?.isCorrect ? <CheckCircleIcon /> : <CancelIcon />}
                      label={response?.isCorrect ? 'Correct' : 'Incorrect'}
                      color={response?.isCorrect ? 'success' : 'error'}
                      size="small"
                    />
                  </Box>

                  {(question.questionType === 'SINGLE_CHOICE' ||
                    question.questionType === 'MULTIPLE_CHOICE' ||
                    question.questionType === 'TRUE_FALSE') && (
                    <Box sx={{ ml: 2 }}>
                      {question.answers.map((answer) => {
                        const wasSelected = response?.selectedAnswers?.includes(answer.id);
                        const isCorrect = answer.isCorrect;

                        return (
                          <Box
                            key={answer.id}
                            sx={{
                              p: 1,
                              mb: 1,
                              borderRadius: 1,
                              backgroundColor: wasSelected
                                ? isCorrect
                                  ? 'success.light'
                                  : 'error.light'
                                : isCorrect
                                ? 'info.light'
                                : 'transparent',
                              border: '1px solid',
                              borderColor: wasSelected
                                ? isCorrect
                                  ? 'success.main'
                                  : 'error.main'
                                : isCorrect
                                ? 'info.main'
                                : 'divider',
                            }}
                          >
                            <Typography variant="body2">
                              {wasSelected && '✓ '}
                              {isCorrect && !wasSelected && '→ '}
                              {answer.answerText}
                              {isCorrect && ' (Correct)'}
                            </Typography>
                          </Box>
                        );
                      })}
                    </Box>
                  )}

                  {(question.questionType === 'TEXT' || question.questionType === 'FILL_BLANK') && (
                    <Box sx={{ ml: 2 }}>
                      <Typography variant="body2" color="text.secondary" gutterBottom>
                        Your Answer:
                      </Typography>
                      <Paper sx={{ p: 2, mb: 2, bgcolor: 'grey.100' }}>
                        <Typography variant="body1">
                          {response?.textResponse || '(No answer provided)'}
                        </Typography>
                      </Paper>
                      {quiz.showCorrectAnswers && (
                        <>
                          <Typography variant="body2" color="text.secondary" gutterBottom>
                            Correct Answer(s):
                          </Typography>
                          <Paper sx={{ p: 2, bgcolor: 'success.light' }}>
                            {question.answers
                              .filter((a) => a.isCorrect)
                              .map((a) => (
                                <Typography key={a.id} variant="body1">
                                  {a.answerText}
                                </Typography>
                              ))}
                          </Paper>
                        </>
                      )}
                    </Box>
                  )}

                  {question.explanation && (
                    <Alert severity="info" icon={<InfoIcon />} sx={{ mt: 2 }}>
                      <Typography variant="body2">
                        <strong>Explanation:</strong> {question.explanation}
                      </Typography>
                    </Alert>
                  )}
                </Paper>
              );
            })}
          </Box>
        )}

        <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center' }}>
          {quiz.maxAttempts &&
            completedAttempt.attemptNumber < quiz.maxAttempts &&
            !completedAttempt.passed && (
              <Button variant="contained" onClick={loadQuiz}>
                Try Again
              </Button>
            )}
          {onCancel && (
            <Button variant="outlined" onClick={onCancel}>
              Back to Course
            </Button>
          )}
        </Box>
      </Box>
    );
  }

  // Quiz taking interface
  const currentQuestion = quiz.questions[currentQuestionIndex];
  const currentResponse = responses.get(currentQuestion.id);
  const isLastQuestion = currentQuestionIndex === quiz.questions.length - 1;

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h5">{quiz.title}</Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            {quiz.timeLimit && (
              <Chip
                icon={<AccessTimeIcon />}
                label={`${formatTime(timeElapsed)} / ${formatTime(quiz.timeLimit * 60)}`}
                color={timeElapsed > quiz.timeLimit * 60 ? 'error' : 'default'}
              />
            )}
            <Chip
              label={`Attempt ${attempt.attemptNumber}${
                quiz.maxAttempts ? ` of ${quiz.maxAttempts}` : ''
              }`}
              color="primary"
            />
          </Box>
        </Box>
        <LinearProgress
          variant="determinate"
          value={calculateProgress()}
          sx={{ height: 8, borderRadius: 1 }}
        />
        <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
          {responses.size} of {quiz.questions.length} questions answered
        </Typography>
      </Paper>

      {/* Question */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          Question {currentQuestionIndex + 1} of {quiz.questions.length}
        </Typography>
        <Typography variant="body1" sx={{ mb: 3, fontSize: '1.1rem' }}>
          {currentQuestion.questionText}
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
          Points: {currentQuestion.points}
        </Typography>

        {/* Answer options based on question type */}
        {currentQuestion.questionType === 'SINGLE_CHOICE' && (
          <RadioGroup
            value={currentResponse?.selectedAnswers?.[0] || ''}
            onChange={(e) => handleAnswerChange(currentQuestion.id, e.target.value)}
          >
            {currentQuestion.answers.map((answer) => (
              <FormControlLabel
                key={answer.id}
                value={answer.id}
                control={<Radio />}
                label={answer.answerText}
                sx={{
                  mb: 1,
                  p: 1,
                  borderRadius: 1,
                  '&:hover': { bgcolor: 'action.hover' },
                }}
              />
            ))}
          </RadioGroup>
        )}

        {currentQuestion.questionType === 'MULTIPLE_CHOICE' && (
          <Box>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Select all that apply
            </Typography>
            {currentQuestion.answers.map((answer) => (
              <FormControlLabel
                key={answer.id}
                control={
                  <Checkbox
                    checked={currentResponse?.selectedAnswers?.includes(answer.id) || false}
                    onChange={() => handleAnswerChange(currentQuestion.id, answer.id, true)}
                  />
                }
                label={answer.answerText}
                sx={{
                  display: 'block',
                  mb: 1,
                  p: 1,
                  borderRadius: 1,
                  '&:hover': { bgcolor: 'action.hover' },
                }}
              />
            ))}
          </Box>
        )}

        {currentQuestion.questionType === 'TRUE_FALSE' && (
          <RadioGroup
            value={currentResponse?.selectedAnswers?.[0] || ''}
            onChange={(e) => handleAnswerChange(currentQuestion.id, e.target.value)}
          >
            {currentQuestion.answers.map((answer) => (
              <FormControlLabel
                key={answer.id}
                value={answer.id}
                control={<Radio />}
                label={answer.answerText}
                sx={{
                  mb: 1,
                  p: 2,
                  borderRadius: 1,
                  border: '1px solid',
                  borderColor: 'divider',
                  '&:hover': { bgcolor: 'action.hover' },
                }}
              />
            ))}
          </RadioGroup>
        )}

        {(currentQuestion.questionType === 'TEXT' || currentQuestion.questionType === 'FILL_BLANK') && (
          <TextField
            fullWidth
            multiline={currentQuestion.questionType === 'TEXT'}
            rows={currentQuestion.questionType === 'TEXT' ? 4 : 1}
            value={currentResponse?.textResponse || ''}
            onChange={(e) => handleAnswerChange(currentQuestion.id, e.target.value)}
            placeholder="Type your answer here..."
            variant="outlined"
          />
        )}
      </Paper>

      {/* Navigation */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', gap: 2 }}>
        <Button
          variant="outlined"
          disabled={currentQuestionIndex === 0}
          onClick={() => setCurrentQuestionIndex((prev) => prev - 1)}
        >
          Previous
        </Button>

        <Box sx={{ display: 'flex', gap: 1 }}>
          {quiz.questions.map((_, index) => (
            <Box
              key={index}
              onClick={() => setCurrentQuestionIndex(index)}
              sx={{
                width: 32,
                height: 32,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: 1,
                cursor: 'pointer',
                bgcolor:
                  index === currentQuestionIndex
                    ? 'primary.main'
                    : responses.has(quiz.questions[index].id)
                    ? 'success.light'
                    : 'grey.300',
                color:
                  index === currentQuestionIndex
                    ? 'white'
                    : responses.has(quiz.questions[index].id)
                    ? 'success.dark'
                    : 'text.secondary',
                '&:hover': {
                  opacity: 0.8,
                },
              }}
            >
              <Typography variant="body2">{index + 1}</Typography>
            </Box>
          ))}
        </Box>

        {!isLastQuestion ? (
          <Button
            variant="contained"
            onClick={() => setCurrentQuestionIndex((prev) => prev + 1)}
          >
            Next
          </Button>
        ) : (
          <Button
            variant="contained"
            color="success"
            onClick={handleSubmit}
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Submitting...' : 'Submit Quiz'}
          </Button>
        )}
      </Box>

      {onCancel && (
        <Box sx={{ mt: 2, textAlign: 'center' }}>
          <Button
            variant="text"
            color="error"
            onClick={() => {
              if (
                window.confirm(
                  'Are you sure you want to cancel? Your progress will be lost.'
                )
              ) {
                onCancel();
              }
            }}
          >
            Cancel Quiz
          </Button>
        </Box>
      )}
    </Box>
  );
};

export default QuizTaker;
