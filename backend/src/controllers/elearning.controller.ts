import { Request, Response } from 'express';
import * as elearningService from '../services/elearning.service';
import { CourseStatus, CourseType, EnrollmentStatus, QuestionType } from '@prisma/client';

// ==================== COURSES ====================

export async function getAllCourses(req: Request, res: Response) {
  try {
    const { status, courseType, isComplianceCourse, ehsRelevant, categoryId } = req.query;

    const filters: any = {};
    if (status) filters.status = status as CourseStatus;
    if (courseType) filters.courseType = courseType as CourseType;
    if (isComplianceCourse !== undefined) filters.isComplianceCourse = isComplianceCourse === 'true';
    if (ehsRelevant !== undefined) filters.ehsRelevant = ehsRelevant === 'true';
    if (categoryId) filters.categoryId = categoryId as string;

    const courses = await elearningService.getAllCourses(filters);
    res.json(courses);
  } catch (error: any) {
    console.error('Error fetching courses:', error);
    res.status(500).json({ error: 'Failed to fetch courses', details: error.message });
  }
}

export async function getCourseById(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const course = await elearningService.getCourseById(id);

    if (!course) {
      return res.status(404).json({ error: 'Course not found' });
    }

    res.json(course);
  } catch (error: any) {
    console.error('Error fetching course:', error);
    res.status(500).json({ error: 'Failed to fetch course', details: error.message });
  }
}

export async function createCourse(req: Request, res: Response) {
  try {
    const userId = (req as any).user.id;
    const course = await elearningService.createCourse({
      ...req.body,
      createdById: userId,
    });

    res.status(201).json(course);
  } catch (error: any) {
    console.error('Error creating course:', error);
    res.status(500).json({ error: 'Failed to create course', details: error.message });
  }
}

export async function updateCourse(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const userId = (req as any).user.id;

    const course = await elearningService.updateCourse(id, {
      ...req.body,
      updatedById: userId,
    });

    res.json(course);
  } catch (error: any) {
    console.error('Error updating course:', error);
    res.status(500).json({ error: 'Failed to update course', details: error.message });
  }
}

export async function deleteCourse(req: Request, res: Response) {
  try {
    const { id } = req.params;
    await elearningService.deleteCourse(id);
    res.json({ message: 'Course deleted successfully' });
  } catch (error: any) {
    console.error('Error deleting course:', error);
    res.status(500).json({ error: 'Failed to delete course', details: error.message });
  }
}

// ==================== CATEGORIES ====================

export async function getAllCategories(req: Request, res: Response) {
  try {
    const categories = await elearningService.getAllCategories();
    res.json(categories);
  } catch (error: any) {
    console.error('Error fetching categories:', error);
    res.status(500).json({ error: 'Failed to fetch categories', details: error.message });
  }
}

export async function createCategory(req: Request, res: Response) {
  try {
    const category = await elearningService.createCategory(req.body);
    res.status(201).json(category);
  } catch (error: any) {
    console.error('Error creating category:', error);
    res.status(500).json({ error: 'Failed to create category', details: error.message });
  }
}

export async function updateCategory(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const category = await elearningService.updateCategory(id, req.body);
    res.json(category);
  } catch (error: any) {
    console.error('Error updating category:', error);
    res.status(500).json({ error: 'Failed to update category', details: error.message });
  }
}

// ==================== LESSONS ====================

export async function createLesson(req: Request, res: Response) {
  try {
    const lesson = await elearningService.createLesson(req.body);
    res.status(201).json(lesson);
  } catch (error: any) {
    console.error('Error creating lesson:', error);
    res.status(500).json({ error: 'Failed to create lesson', details: error.message });
  }
}

export async function updateLesson(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const lesson = await elearningService.updateLesson(id, req.body);
    res.json(lesson);
  } catch (error: any) {
    console.error('Error updating lesson:', error);
    res.status(500).json({ error: 'Failed to update lesson', details: error.message });
  }
}

export async function deleteLesson(req: Request, res: Response) {
  try {
    const { id } = req.params;
    await elearningService.deleteLesson(id);
    res.json({ message: 'Lesson deleted successfully' });
  } catch (error: any) {
    console.error('Error deleting lesson:', error);
    res.status(500).json({ error: 'Failed to delete lesson', details: error.message });
  }
}

// ==================== QUIZZES ====================

export async function getQuizByLessonId(req: Request, res: Response) {
  try {
    const { lessonId } = req.params;
    const quiz = await elearningService.getQuizByLessonId(lessonId);

    if (!quiz) {
      return res.status(404).json({ error: 'Quiz not found' });
    }

    res.json(quiz);
  } catch (error: any) {
    console.error('Error fetching quiz:', error);
    res.status(500).json({ error: 'Failed to fetch quiz', details: error.message });
  }
}

export async function createQuiz(req: Request, res: Response) {
  try {
    const quiz = await elearningService.createQuiz(req.body);
    res.status(201).json(quiz);
  } catch (error: any) {
    console.error('Error creating quiz:', error);
    res.status(500).json({ error: 'Failed to create quiz', details: error.message });
  }
}

export async function updateQuiz(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const quiz = await elearningService.updateQuiz(id, req.body);
    res.json(quiz);
  } catch (error: any) {
    console.error('Error updating quiz:', error);
    res.status(500).json({ error: 'Failed to update quiz', details: error.message });
  }
}

export async function deleteQuiz(req: Request, res: Response) {
  try {
    const { id } = req.params;
    await elearningService.deleteQuiz(id);
    res.json({ success: true });
  } catch (error: any) {
    console.error('Error deleting quiz:', error);
    res.status(500).json({ error: 'Failed to delete quiz', details: error.message });
  }
}

export async function getQuizWithQuestions(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const quiz = await elearningService.getQuizWithQuestions(id);

    if (!quiz) {
      return res.status(404).json({ error: 'Quiz not found' });
    }

    res.json(quiz);
  } catch (error: any) {
    console.error('Error fetching quiz:', error);
    res.status(500).json({ error: 'Failed to fetch quiz', details: error.message });
  }
}

// ==================== QUESTIONS ====================

export async function createQuestion(req: Request, res: Response) {
  try {
    const question = await elearningService.createQuestion(req.body);
    res.status(201).json(question);
  } catch (error: any) {
    console.error('Error creating question:', error);
    res.status(500).json({ error: 'Failed to create question', details: error.message });
  }
}

export async function updateQuestion(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const question = await elearningService.updateQuestion(id, req.body);
    res.json(question);
  } catch (error: any) {
    console.error('Error updating question:', error);
    res.status(500).json({ error: 'Failed to update question', details: error.message });
  }
}

export async function deleteQuestion(req: Request, res: Response) {
  try {
    const { id } = req.params;
    await elearningService.deleteQuestion(id);
    res.json({ message: 'Question deleted successfully' });
  } catch (error: any) {
    console.error('Error deleting question:', error);
    res.status(500).json({ error: 'Failed to delete question', details: error.message });
  }
}

// ==================== ANSWERS ====================

export async function createAnswer(req: Request, res: Response) {
  try {
    const answer = await elearningService.createAnswer(req.body);
    res.status(201).json(answer);
  } catch (error: any) {
    console.error('Error creating answer:', error);
    res.status(500).json({ error: 'Failed to create answer', details: error.message });
  }
}

export async function updateAnswer(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const answer = await elearningService.updateAnswer(id, req.body);
    res.json(answer);
  } catch (error: any) {
    console.error('Error updating answer:', error);
    res.status(500).json({ error: 'Failed to update answer', details: error.message });
  }
}

export async function deleteAnswer(req: Request, res: Response) {
  try {
    const { id } = req.params;
    await elearningService.deleteAnswer(id);
    res.json({ message: 'Answer deleted successfully' });
  } catch (error: any) {
    console.error('Error deleting answer:', error);
    res.status(500).json({ error: 'Failed to delete answer', details: error.message });
  }
}

// ==================== ENROLLMENTS ====================

export async function enrollUser(req: Request, res: Response) {
  try {
    const currentUserId = (req as any).user.id;
    const { courseId, assignmentId, expiresAt } = req.body;
    const enrollment = await elearningService.enrollUser({
      userId: currentUserId,
      courseId,
      assignmentId,
      expiresAt: expiresAt ? new Date(expiresAt) : undefined,
    });

    res.status(201).json(enrollment);
  } catch (error: any) {
    console.error('Error enrolling user:', error);
    res.status(400).json({ error: 'Failed to enroll user', details: error.message });
  }
}

export async function getUserEnrollments(req: Request, res: Response) {
  try {
    const { userId } = req.params;
    const { status } = req.query;

    const filters: any = {};
    if (status) filters.status = status as EnrollmentStatus;

    const enrollments = await elearningService.getUserEnrollments(userId, filters);
    res.json(enrollments);
  } catch (error: any) {
    console.error('Error fetching enrollments:', error);
    res.status(500).json({ error: 'Failed to fetch enrollments', details: error.message });
  }
}

export async function getMyEnrollments(req: Request, res: Response) {
  try {
    const userId = (req as any).user.id;
    const { status } = req.query;

    const filters: any = {};
    if (status) filters.status = status as EnrollmentStatus;

    const enrollments = await elearningService.getUserEnrollments(userId, filters);
    res.json(enrollments);
  } catch (error: any) {
    console.error('Error fetching enrollments:', error);
    res.status(500).json({ error: 'Failed to fetch enrollments', details: error.message });
  }
}

export async function getEnrollmentById(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const enrollment = await elearningService.getEnrollmentById(id);

    if (!enrollment) {
      return res.status(404).json({ error: 'Enrollment not found' });
    }

    res.json(enrollment);
  } catch (error: any) {
    console.error('Error fetching enrollment:', error);
    res.status(500).json({ error: 'Failed to fetch enrollment', details: error.message });
  }
}

export async function updateEnrollmentProgress(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const enrollment = await elearningService.updateEnrollmentProgress(id, req.body);
    res.json(enrollment);
  } catch (error: any) {
    console.error('Error updating enrollment:', error);
    res.status(500).json({ error: 'Failed to update enrollment', details: error.message });
  }
}

// ==================== LESSON PROGRESS ====================

export async function updateLessonProgress(req: Request, res: Response) {
  try {
    const progress = await elearningService.updateLessonProgress(req.body);
    res.json(progress);
  } catch (error: any) {
    console.error('Error updating lesson progress:', error);
    res.status(500).json({ error: 'Failed to update lesson progress', details: error.message });
  }
}

export async function getLessonProgress(req: Request, res: Response) {
  try {
    const { enrollmentId, lessonId } = req.params;
    const progress = await elearningService.getLessonProgress(enrollmentId, lessonId);
    res.json(progress);
  } catch (error: any) {
    console.error('Error fetching lesson progress:', error);
    res.status(500).json({ error: 'Failed to fetch lesson progress', details: error.message });
  }
}

// ==================== QUIZ ATTEMPTS ====================

export async function startQuizAttempt(req: Request, res: Response) {
  try {
    const { enrollmentId, quizId } = req.body;
    const attempt = await elearningService.startQuizAttempt({ enrollmentId, quizId });
    res.status(201).json(attempt);
  } catch (error: any) {
    console.error('Error starting quiz attempt:', error);
    res.status(400).json({ error: 'Failed to start quiz attempt', details: error.message });
  }
}

export async function submitQuizAttempt(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const { responses } = req.body;
    const attempt = await elearningService.submitQuizAttempt(id, responses);
    res.json(attempt);
  } catch (error: any) {
    console.error('Error submitting quiz attempt:', error);
    res.status(500).json({ error: 'Failed to submit quiz attempt', details: error.message });
  }
}

export async function getQuizAttempt(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const attempt = await elearningService.getQuizAttempt(id);

    if (!attempt) {
      return res.status(404).json({ error: 'Quiz attempt not found' });
    }

    res.json(attempt);
  } catch (error: any) {
    console.error('Error fetching quiz attempt:', error);
    res.status(500).json({ error: 'Failed to fetch quiz attempt', details: error.message });
  }
}

export async function getUserQuizAttempts(req: Request, res: Response) {
  try {
    const { enrollmentId, quizId } = req.query;

    if (!enrollmentId || !quizId) {
      return res.status(400).json({ error: 'enrollmentId and quizId are required' });
    }

    const attempts = await elearningService.getUserQuizAttempts(
      enrollmentId as string,
      quizId as string
    );
    res.json(attempts);
  } catch (error: any) {
    console.error('Error fetching quiz attempts:', error);
    res.status(500).json({ error: 'Failed to fetch quiz attempts', details: error.message });
  }
}

// ==================== ASSIGNMENTS ====================

export async function createCourseAssignment(req: Request, res: Response) {
  try {
    const userId = (req as any).user.id;
    const assignment = await elearningService.createCourseAssignment({
      ...req.body,
      assignedById: userId,
    });

    res.status(201).json(assignment);
  } catch (error: any) {
    console.error('Error creating course assignment:', error);
    res.status(500).json({ error: 'Failed to create course assignment', details: error.message });
  }
}

export async function getCourseAssignments(req: Request, res: Response) {
  try {
    const { courseId } = req.params;
    const assignments = await elearningService.getCourseAssignments(courseId);
    res.json(assignments);
  } catch (error: any) {
    console.error('Error fetching course assignments:', error);
    res.status(500).json({ error: 'Failed to fetch course assignments', details: error.message });
  }
}

// ==================== ANALYTICS ====================

export async function getCourseAnalytics(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const analytics = await elearningService.getCourseAnalytics(id);
    res.json(analytics);
  } catch (error: any) {
    console.error('Error fetching course analytics:', error);
    res.status(500).json({ error: 'Failed to fetch course analytics', details: error.message });
  }
}

export async function getUserLearningStats(req: Request, res: Response) {
  try {
    const { userId } = req.params;
    const stats = await elearningService.getUserLearningStats(userId);
    res.json(stats);
  } catch (error: any) {
    console.error('Error fetching user learning stats:', error);
    res.status(500).json({ error: 'Failed to fetch user learning stats', details: error.message });
  }
}

export async function getMyLearningStats(req: Request, res: Response) {
  try {
    const userId = (req as any).user.id;
    const stats = await elearningService.getUserLearningStats(userId);
    res.json(stats);
  } catch (error: any) {
    console.error('Error fetching learning stats:', error);
    res.status(500).json({ error: 'Failed to fetch learning stats', details: error.message });
  }
}

// ==================== LESSON PROGRESS ====================

export async function trackLessonProgress(req: Request, res: Response) {
  try {
    const userId = (req as any).user.id;
    const { id: lessonId } = req.params;

    const lesson = await elearningService.getLessonById(lessonId);
    if (!lesson) {
      return res.status(404).json({ error: 'Lesson not found' });
    }

    const enrollment = await elearningService.getOrCreateEnrollment(userId, lesson.courseId);
    
    await elearningService.updateLessonProgress({
      enrollmentId: enrollment.id,
      lessonId,
      status: 'IN_PROGRESS',
      startedAt: new Date(),
    });

    res.json({ success: true });
  } catch (error: any) {
    console.error('Error tracking lesson progress:', error);
    res.status(500).json({ error: 'Failed to track lesson progress', details: error.message });
  }
}

export async function completLesson(req: Request, res: Response) {
  try {
    const userId = (req as any).user.id;
    const { id: lessonId } = req.params;

    const lesson = await elearningService.getLessonById(lessonId);
    if (!lesson) {
      return res.status(404).json({ error: 'Lesson not found' });
    }

    const enrollment = await elearningService.getOrCreateEnrollment(userId, lesson.courseId);
    
    await elearningService.updateLessonProgress({
      enrollmentId: enrollment.id,
      lessonId,
      status: 'COMPLETED',
      completedAt: new Date(),
    });

    // Recalculate enrollment progress
    await elearningService.calculateAndUpdateEnrollmentProgress(enrollment.id);

    res.json({ success: true });
  } catch (error: any) {
    console.error('Error completing lesson:', error);
    res.status(500).json({ error: 'Failed to complete lesson', details: error.message });
  }
}

