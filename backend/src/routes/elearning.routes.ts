import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import { requireModuleAccess } from '../middleware/moduleAccess';
import * as elearningController from '../controllers/elearning.controller';

const router = Router();

// ==================== COURSES ====================

router.get(
  '/courses',
  authenticate,
  requireModuleAccess('elearning', 'canView'),
  elearningController.getAllCourses
);

router.get(
  '/courses/:id',
  authenticate,
  requireModuleAccess('elearning', 'canView'),
  elearningController.getCourseById
);

router.post(
  '/courses',
  authenticate,
  requireModuleAccess('elearning', 'canCreate'),
  elearningController.createCourse
);

router.put(
  '/courses/:id',
  authenticate,
  requireModuleAccess('elearning', 'canEdit'),
  elearningController.updateCourse
);

router.delete(
  '/courses/:id',
  authenticate,
  requireModuleAccess('elearning', 'canDelete'),
  elearningController.deleteCourse
);

router.get(
  '/courses/:id/analytics',
  authenticate,
  requireModuleAccess('elearning', 'canView'),
  elearningController.getCourseAnalytics
);

router.get(
  '/courses/:courseId/assignments',
  authenticate,
  requireModuleAccess('elearning', 'canView'),
  elearningController.getCourseAssignments
);

// ==================== CATEGORIES ====================

router.get(
  '/categories',
  authenticate,
  requireModuleAccess('elearning', 'canView'),
  elearningController.getAllCategories
);

router.post(
  '/categories',
  authenticate,
  requireModuleAccess('elearning', 'canCreate'),
  elearningController.createCategory
);

router.put(
  '/categories/:id',
  authenticate,
  requireModuleAccess('elearning', 'canEdit'),
  elearningController.updateCategory
);

// ==================== LESSONS ====================

router.post(
  '/lessons',
  authenticate,
  requireModuleAccess('elearning', 'canCreate'),
  elearningController.createLesson
);

router.put(
  '/lessons/:id',
  authenticate,
  requireModuleAccess('elearning', 'canEdit'),
  elearningController.updateLesson
);

router.delete(
  '/lessons/:id',
  authenticate,
  requireModuleAccess('elearning', 'canDelete'),
  elearningController.deleteLesson
);

// Lesson Progress
router.post(
  '/lessons/:id/progress',
  authenticate,
  elearningController.trackLessonProgress
);

router.post(
  '/lessons/:id/complete',
  authenticate,
  elearningController.completLesson
);

// ==================== QUIZZES ====================

router.post(
  '/quizzes',
  authenticate,
  requireModuleAccess('elearning', 'canCreate'),
  elearningController.createQuiz
);

router.put(
  '/quizzes/:id',
  authenticate,
  requireModuleAccess('elearning', 'canEdit'),
  elearningController.updateQuiz
);

router.get(
  '/quizzes/:id',
  authenticate,
  requireModuleAccess('elearning', 'canView'),
  elearningController.getQuizWithQuestions
);

// ==================== QUESTIONS ====================

router.post(
  '/questions',
  authenticate,
  requireModuleAccess('elearning', 'canCreate'),
  elearningController.createQuestion
);

router.put(
  '/questions/:id',
  authenticate,
  requireModuleAccess('elearning', 'canEdit'),
  elearningController.updateQuestion
);

router.delete(
  '/questions/:id',
  authenticate,
  requireModuleAccess('elearning', 'canDelete'),
  elearningController.deleteQuestion
);

// ==================== ANSWERS ====================

router.post(
  '/answers',
  authenticate,
  requireModuleAccess('elearning', 'canCreate'),
  elearningController.createAnswer
);

router.put(
  '/answers/:id',
  authenticate,
  requireModuleAccess('elearning', 'canEdit'),
  elearningController.updateAnswer
);

router.delete(
  '/answers/:id',
  authenticate,
  requireModuleAccess('elearning', 'canDelete'),
  elearningController.deleteAnswer
);

// ==================== ENROLLMENTS ====================

router.post(
  '/enrollments',
  authenticate,
  requireModuleAccess('elearning', 'canCreate'),
  elearningController.enrollUser
);

router.get(
  '/enrollments/my',
  authenticate,
  requireModuleAccess('elearning', 'canView'),
  elearningController.getMyEnrollments
);

router.get(
  '/enrollments/user/:userId',
  authenticate,
  requireModuleAccess('elearning', 'canView'),
  elearningController.getUserEnrollments
);

router.get(
  '/enrollments/:id',
  authenticate,
  requireModuleAccess('elearning', 'canView'),
  elearningController.getEnrollmentById
);

router.put(
  '/enrollments/:id',
  authenticate,
  requireModuleAccess('elearning', 'canEdit'),
  elearningController.updateEnrollmentProgress
);

// ==================== LESSON PROGRESS ====================

router.post(
  '/lessons/:id/progress',
  authenticate,
  requireModuleAccess('elearning', 'canEdit'),
  elearningController.trackLessonProgress
);

router.post(
  '/lessons/:id/complete',
  authenticate,
  requireModuleAccess('elearning', 'canEdit'),
  elearningController.completLesson
);

router.post(
  '/lesson-progress',
  authenticate,
  requireModuleAccess('elearning', 'canEdit'),
  elearningController.updateLessonProgress
);

router.get(
  '/lesson-progress/:enrollmentId/:lessonId',
  authenticate,
  requireModuleAccess('elearning', 'canView'),
  elearningController.getLessonProgress
);

// ==================== QUIZZES ====================

router.get(
  '/lessons/:lessonId/quiz',
  authenticate,
  requireModuleAccess('elearning', 'canView'),
  elearningController.getQuizByLessonId
);

router.post(
  '/quizzes',
  authenticate,
  requireModuleAccess('elearning', 'canCreate'),
  elearningController.createQuiz
);

router.put(
  '/quizzes/:id',
  authenticate,
  requireModuleAccess('elearning', 'canEdit'),
  elearningController.updateQuiz
);

router.delete(
  '/quizzes/:id',
  authenticate,
  requireModuleAccess('elearning', 'canDelete'),
  elearningController.deleteQuiz
);

// ==================== QUESTIONS ====================

router.post(
  '/questions',
  authenticate,
  requireModuleAccess('elearning', 'canCreate'),
  elearningController.createQuestion
);

router.put(
  '/questions/:id',
  authenticate,
  requireModuleAccess('elearning', 'canEdit'),
  elearningController.updateQuestion
);

router.delete(
  '/questions/:id',
  authenticate,
  requireModuleAccess('elearning', 'canDelete'),
  elearningController.deleteQuestion
);

// ==================== ANSWERS ====================

router.post(
  '/answers',
  authenticate,
  requireModuleAccess('elearning', 'canCreate'),
  elearningController.createAnswer
);

router.put(
  '/answers/:id',
  authenticate,
  requireModuleAccess('elearning', 'canEdit'),
  elearningController.updateAnswer
);

router.delete(
  '/answers/:id',
  authenticate,
  requireModuleAccess('elearning', 'canDelete'),
  elearningController.deleteAnswer
);

// ==================== QUIZ ATTEMPTS ====================

router.post(
  '/quiz-attempts',
  authenticate,
  requireModuleAccess('elearning', 'canCreate'),
  elearningController.startQuizAttempt
);

router.post(
  '/quiz-attempts/:id/submit',
  authenticate,
  requireModuleAccess('elearning', 'canCreate'),
  elearningController.submitQuizAttempt
);

router.get(
  '/quiz-attempts/:id',
  authenticate,
  requireModuleAccess('elearning', 'canView'),
  elearningController.getQuizAttempt
);

router.get(
  '/quiz-attempts',
  authenticate,
  requireModuleAccess('elearning', 'canView'),
  elearningController.getUserQuizAttempts
);

// ==================== ASSIGNMENTS ====================

router.post(
  '/assignments',
  authenticate,
  requireModuleAccess('elearning', 'canCreate'),
  elearningController.createCourseAssignment
);

router.get(
  '/assignments',
  authenticate,
  requireModuleAccess('elearning', 'canView'),
  elearningController.getAllAssignments
);

router.get(
  '/assignments/my',
  authenticate,
  requireModuleAccess('elearning', 'canView'),
  elearningController.getMyAssignments
);

router.put(
  '/assignments/:id',
  authenticate,
  requireModuleAccess('elearning', 'canEdit'),
  elearningController.updateCourseAssignment
);

router.delete(
  '/assignments/:id',
  authenticate,
  requireModuleAccess('elearning', 'canDelete'),
  elearningController.deleteCourseAssignment
);

// ==================== ANALYTICS ====================

router.get(
  '/analytics/my',
  authenticate,
  requireModuleAccess('elearning', 'canView'),
  elearningController.getMyLearningStats
);

router.get(
  '/analytics/user/:userId',
  authenticate,
  requireModuleAccess('elearning', 'canView'),
  elearningController.getUserLearningStats
);

router.get(
  '/analytics/admin',
  authenticate,
  requireModuleAccess('elearning', 'canView'),
  elearningController.getAdminAnalytics
);

router.get(
  '/analytics/compliance',
  authenticate,
  requireModuleAccess('elearning', 'canView'),
  elearningController.getComplianceReport
);

// ==================== CERTIFICATES ====================

router.get(
  '/certificates',
  authenticate,
  requireModuleAccess('elearning', 'canView'),
  elearningController.getAllCertificates
);

router.get(
  '/certificates/:enrollmentId',
  authenticate,
  elearningController.getCertificate
);

router.get(
  '/certificates/:enrollmentId/download',
  authenticate,
  elearningController.downloadCertificate
);

router.post(
  '/certificates/:enrollmentId/generate',
  authenticate,
  elearningController.generateCertificate
);

// ==================== IMPORT/EXPORT ====================

router.get(
  '/courses/:id/export',
  authenticate,
  requireModuleAccess('elearning', 'canView'),
  elearningController.exportCourse
);

router.post(
  '/courses/import',
  authenticate,
  requireModuleAccess('elearning', 'canCreate'),
  elearningController.importCourse
);

export default router;
