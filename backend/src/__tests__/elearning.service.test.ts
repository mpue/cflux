// Import elearning service
import * as elearningService from '../services/elearning.service';

// Mock @prisma/client to preserve enums while mocking PrismaClient
jest.mock('@prisma/client', () => {
  const actual = jest.requireActual<typeof import('@prisma/client')>('@prisma/client');
  return {
    ...actual,
    PrismaClient: jest.fn().mockImplementation(() => ({
      course: {
        findMany: jest.fn(),
        findUnique: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        count: jest.fn(),
        groupBy: jest.fn(),
      },
      courseCategory: {
        findMany: jest.fn(),
        findFirst: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
      },
      lesson: {
        findUnique: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
      },
      quiz: {
        findUnique: jest.fn(),
        findFirst: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
      },
      question: {
        findUnique: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        aggregate: jest.fn(),
      },
      answer: {
        create: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
      },
      enrollment: {
        findUnique: jest.fn(),
        findMany: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        count: jest.fn(),
        upsert: jest.fn(),
        groupBy: jest.fn(),
      },
      lessonProgress: {
        findUnique: jest.fn(),
        upsert: jest.fn(),
      },
      quizAttempt: {
        findFirst: jest.fn(),
        findMany: jest.fn(),
        findUnique: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        groupBy: jest.fn(),
      },
      questionResponse: {
        create: jest.fn(),
      },
      courseAssignment: {
        create: jest.fn(),
        findMany: jest.fn(),
        update: jest.fn(),
      },
      userGroupMembership: {
        findMany: jest.fn(),
      },
      user: {
        count: jest.fn(),
      },
    })),
  };
});

// Mock ../lib/prisma to return our mocked prisma instance
jest.mock('../lib/prisma', () => {
  const { PrismaClient } = jest.requireMock('@prisma/client');
  return {
    prisma: new PrismaClient(),
  };
});

// Mock fs and pdfkit for certificate generation
jest.mock('fs');
jest.mock('pdfkit', () => {
  return jest.fn().mockImplementation(() => ({
    rect: jest.fn().mockReturnThis(),
    lineWidth: jest.fn().mockReturnThis(),
    stroke: jest.fn().mockReturnThis(),
    fontSize: jest.fn().mockReturnThis(),
    font: jest.fn().mockReturnThis(),
    fillColor: jest.fn().mockReturnThis(),
    text: jest.fn().mockReturnThis(),
    moveTo: jest.fn().mockReturnThis(),
    lineTo: jest.fn().mockReturnThis(),
    pipe: jest.fn(),
    end: jest.fn(),
    page: { width: 842, height: 595 },
  }));
});

import { prisma } from '../lib/prisma';

describe('E-Learning Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // ==================== COURSES ====================

  describe('getAllCourses', () => {
    it('should fetch all active courses', async () => {
      const mockCourses = [
        {
          id: 'course-1',
          title: 'TypeScript Basics',
          status: 'PUBLISHED',
          isActive: true,
          category: { id: 'cat-1', name: 'Programming' },
          createdBy: { id: 'user-1', firstName: 'John', lastName: 'Doe', email: 'john@example.com' },
          _count: { lessons: 5, enrollments: 10 },
        },
      ];

      (prisma.course.findMany as jest.Mock).mockResolvedValue(mockCourses);

      const result = await elearningService.getAllCourses();

      expect(prisma.course.findMany).toHaveBeenCalledWith({
        where: { isActive: true },
        include: {
          category: true,
          createdBy: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
            },
          },
          _count: {
            select: {
              lessons: true,
              enrollments: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      });
      expect(result).toEqual(mockCourses);
    });

    it('should filter courses by status', async () => {
      (prisma.course.findMany as jest.Mock).mockResolvedValue([]);

      await elearningService.getAllCourses({ status: 'PUBLISHED' as any });

      expect(prisma.course.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            isActive: true,
            status: 'PUBLISHED',
          }),
        })
      );
    });

    it('should filter courses by type and compliance', async () => {
      (prisma.course.findMany as jest.Mock).mockResolvedValue([]);

      await elearningService.getAllCourses({ 
        courseType: 'MANDATORY' as any, 
        isComplianceCourse: true,
        ehsRelevant: true,
      });

      expect(prisma.course.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            isActive: true,
            courseType: 'MANDATORY',
            isComplianceCourse: true,
            ehsRelevant: true,
          }),
        })
      );
    });
  });

  describe('getCourseById', () => {
    it('should fetch course with lessons and quizzes', async () => {
      const mockCourse = {
        id: 'course-1',
        title: 'TypeScript Basics',
        lessons: [
          {
            id: 'lesson-1',
            title: 'Introduction',
            order: 1,
            quiz: { id: 'quiz-1', title: 'Quiz 1', _count: { questions: 5 } },
          },
        ],
        _count: { enrollments: 10, assignments: 2 },
      };

      (prisma.course.findUnique as jest.Mock).mockResolvedValue(mockCourse);

      const result = await elearningService.getCourseById('course-1');

      expect(prisma.course.findUnique).toHaveBeenCalledWith({
        where: { id: 'course-1' },
        include: expect.objectContaining({
          category: true,
          createdBy: expect.any(Object),
          updatedBy: expect.any(Object),
          lessons: expect.any(Object),
          _count: expect.any(Object),
        }),
      });
      expect(result).toEqual(mockCourse);
    });
  });

  describe('createCourse', () => {
    it('should create course with minimal data', async () => {
      const mockCourse = {
        id: 'course-1',
        title: 'New Course',
        status: 'DRAFT',
        createdBy: { id: 'user-1', firstName: 'John', lastName: 'Doe', email: 'john@example.com' },
      };

      (prisma.course.create as jest.Mock).mockResolvedValue(mockCourse);

      const result = await elearningService.createCourse({
        title: 'New Course',
        createdById: 'user-1',
      });

      expect(prisma.course.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          title: 'New Course',
          status: 'DRAFT',
          createdBy: { connect: { id: 'user-1' } },
          updatedBy: { connect: { id: 'user-1' } },
        }),
        include: expect.any(Object),
      });
      expect(result).toEqual(mockCourse);
    });

    it('should create course with category', async () => {
      (prisma.course.create as jest.Mock).mockResolvedValue({});

      await elearningService.createCourse({
        title: 'New Course',
        categoryId: 'cat-1',
        createdById: 'user-1',
      });

      expect(prisma.course.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            title: 'New Course',
            category: { connect: { id: 'cat-1' } },
          }),
        })
      );
    });
  });

  describe('updateCourse', () => {
    it('should update course and set publishedAt when publishing', async () => {
      (prisma.course.update as jest.Mock).mockResolvedValue({});

      await elearningService.updateCourse('course-1', {
        title: 'Updated Course',
        status: 'PUBLISHED' as any,
        updatedById: 'user-1',
      });

      expect(prisma.course.update).toHaveBeenCalledWith({
        where: { id: 'course-1' },
        data: expect.objectContaining({
          title: 'Updated Course',
          status: 'PUBLISHED',
          publishedAt: expect.any(Date),
        }),
        include: expect.any(Object),
      });
    });

    it('should update course without changing publishedAt', async () => {
      (prisma.course.update as jest.Mock).mockResolvedValue({});

      await elearningService.updateCourse('course-1', {
        title: 'Updated Course',
        updatedById: 'user-1',
      });

      expect(prisma.course.update).toHaveBeenCalledWith({
        where: { id: 'course-1' },
        data: expect.objectContaining({
          title: 'Updated Course',
        }),
        include: expect.any(Object),
      });
    });
  });

  describe('deleteCourse', () => {
    it('should soft delete course', async () => {
      (prisma.course.update as jest.Mock).mockResolvedValue({});

      await elearningService.deleteCourse('course-1');

      expect(prisma.course.update).toHaveBeenCalledWith({
        where: { id: 'course-1' },
        data: { isActive: false },
      });
    });
  });

  // ==================== CATEGORIES ====================

  describe('getAllCategories', () => {
    it('should fetch all active categories', async () => {
      const mockCategories = [
        { id: 'cat-1', name: 'Programming', sortOrder: 1, _count: { courses: 5 } },
      ];

      (prisma.courseCategory.findMany as jest.Mock).mockResolvedValue(mockCategories);

      const result = await elearningService.getAllCategories();

      expect(prisma.courseCategory.findMany).toHaveBeenCalledWith({
        where: { isActive: true },
        include: {
          parent: true,
          _count: {
            select: { courses: true },
          },
        },
        orderBy: { sortOrder: 'asc' },
      });
      expect(result).toEqual(mockCategories);
    });
  });

  describe('createCategory', () => {
    it('should create category with parent', async () => {
      const mockCategory = { id: 'cat-2', name: 'Advanced JS', parentId: 'cat-1' };

      (prisma.courseCategory.create as jest.Mock).mockResolvedValue(mockCategory);

      const result = await elearningService.createCategory({
        name: 'Advanced JS',
        parentId: 'cat-1',
      });

      expect(prisma.courseCategory.create).toHaveBeenCalledWith({
        data: { name: 'Advanced JS', parentId: 'cat-1' },
      });
      expect(result).toEqual(mockCategory);
    });
  });

  // ==================== LESSONS ====================

  describe('createLesson', () => {
    it('should create lesson with course reference', async () => {
      const mockLesson = {
        id: 'lesson-1',
        title: 'Introduction',
        courseId: 'course-1',
        course: { id: 'course-1', title: 'TypeScript' },
      };

      (prisma.lesson.create as jest.Mock).mockResolvedValue(mockLesson);

      const result = await elearningService.createLesson({
        courseId: 'course-1',
        title: 'Introduction',
        contentType: 'TEXT',
      });

      expect(prisma.lesson.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          courseId: 'course-1',
          title: 'Introduction',
          contentType: 'TEXT',
        }),
        include: {
          course: {
            select: {
              id: true,
              title: true,
            },
          },
        },
      });
      expect(result).toEqual(mockLesson);
    });
  });

  describe('updateLesson', () => {
    it('should update lesson properties', async () => {
      (prisma.lesson.update as jest.Mock).mockResolvedValue({});

      await elearningService.updateLesson('lesson-1', {
        title: 'Updated Lesson',
        duration: 600,
      });

      expect(prisma.lesson.update).toHaveBeenCalledWith({
        where: { id: 'lesson-1' },
        data: { title: 'Updated Lesson', duration: 600 },
      });
    });
  });

  // ==================== QUIZZES ====================

  describe('createQuiz', () => {
    it('should create quiz for lesson', async () => {
      const mockQuiz = {
        id: 'quiz-1',
        lessonId: 'lesson-1',
        title: 'Quiz 1',
        passingScore: 80,
      };

      (prisma.quiz.create as jest.Mock).mockResolvedValue(mockQuiz);

      const result = await elearningService.createQuiz({
        lessonId: 'lesson-1',
        title: 'Quiz 1',
        passingScore: 80,
      });

      expect(prisma.quiz.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          lessonId: 'lesson-1',
          title: 'Quiz 1',
          passingScore: 80,
        }),
      });
      expect(result).toEqual(mockQuiz);
    });
  });

  describe('getQuizWithQuestions', () => {
    it('should fetch quiz with questions and answers', async () => {
      const mockQuiz = {
        id: 'quiz-1',
        title: 'Quiz 1',
        questions: [
          {
            id: 'q1',
            questionText: 'What is TypeScript?',
            answers: [
              { id: 'a1', answerText: 'A superset of JS', isCorrect: true },
              { id: 'a2', answerText: 'A database', isCorrect: false },
            ],
          },
        ],
      };

      (prisma.quiz.findUnique as jest.Mock).mockResolvedValue(mockQuiz);

      const result = await elearningService.getQuizWithQuestions('quiz-1');

      expect(prisma.quiz.findUnique).toHaveBeenCalledWith({
        where: { id: 'quiz-1' },
        include: expect.objectContaining({
          lesson: expect.any(Object),
          questions: expect.any(Object),
        }),
      });
      expect(result).toEqual(mockQuiz);
    });
  });

  // ==================== ENROLLMENTS ====================

  describe('enrollUser', () => {
    it('should enroll user in course', async () => {
      const mockEnrollment = {
        id: 'enroll-1',
        userId: 'user-1',
        courseId: 'course-1',
        course: { id: 'course-1', title: 'TypeScript' },
        user: { id: 'user-1', firstName: 'John', lastName: 'Doe', email: 'john@example.com' },
      };

      (prisma.enrollment.findUnique as jest.Mock).mockResolvedValue(null);
      (prisma.enrollment.create as jest.Mock).mockResolvedValue(mockEnrollment);

      const result = await elearningService.enrollUser({
        userId: 'user-1',
        courseId: 'course-1',
      });

      expect(prisma.enrollment.findUnique).toHaveBeenCalledWith({
        where: {
          userId_courseId: {
            userId: 'user-1',
            courseId: 'course-1',
          },
        },
      });
      expect(prisma.enrollment.create).toHaveBeenCalled();
      expect(result).toEqual(mockEnrollment);
    });

    it('should throw error if user already enrolled', async () => {
      (prisma.enrollment.findUnique as jest.Mock).mockResolvedValue({ id: 'existing' });

      await expect(
        elearningService.enrollUser({
          userId: 'user-1',
          courseId: 'course-1',
        })
      ).rejects.toThrow('User is already enrolled in this course');
    });
  });

  describe('getUserEnrollments', () => {
    it('should fetch user enrollments with lesson progress', async () => {
      const mockEnrollments = [
        {
          id: 'enroll-1',
          userId: 'user-1',
          course: { id: 'course-1', title: 'TypeScript', _count: { lessons: 5 } },
          lessonProgress: [{ lessonId: 'lesson-1', status: 'COMPLETED' }],
        },
      ];

      (prisma.enrollment.findMany as jest.Mock).mockResolvedValue(mockEnrollments);

      const result = await elearningService.getUserEnrollments('user-1');

      expect(prisma.enrollment.findMany).toHaveBeenCalledWith({
        where: { userId: 'user-1' },
        include: expect.objectContaining({
          course: expect.any(Object),
          lessonProgress: true,
        }),
        orderBy: { enrolledAt: 'desc' },
      });
      expect(result).toEqual(mockEnrollments);
    });

    it('should filter enrollments by status', async () => {
      (prisma.enrollment.findMany as jest.Mock).mockResolvedValue([]);

      await elearningService.getUserEnrollments('user-1', { status: 'COMPLETED' as any });

      expect(prisma.enrollment.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            userId: 'user-1',
            status: 'COMPLETED',
          }),
        })
      );
    });
  });

  describe('updateEnrollmentProgress', () => {
    it('should update enrollment status and progress', async () => {
      (prisma.enrollment.update as jest.Mock).mockResolvedValue({});

      await elearningService.updateEnrollmentProgress('enroll-1', {
        status: 'COMPLETED' as any,
        progressPercent: 100,
        completedAt: new Date(),
      });

      expect(prisma.enrollment.update).toHaveBeenCalledWith({
        where: { id: 'enroll-1' },
        data: expect.objectContaining({
          status: 'COMPLETED',
          progressPercent: 100,
          completedAt: expect.any(Date),
        }),
      });
    });
  });

  // ==================== LESSON PROGRESS ====================

  describe('updateLessonProgress', () => {
    it('should create or update lesson progress', async () => {
      const mockProgress = { enrollmentId: 'enroll-1', lessonId: 'lesson-1', status: 'COMPLETED' };

      (prisma.lessonProgress.upsert as jest.Mock).mockResolvedValue(mockProgress);

      const result = await elearningService.updateLessonProgress({
        enrollmentId: 'enroll-1',
        lessonId: 'lesson-1',
        status: 'COMPLETED',
        completedAt: new Date(),
      });

      expect(prisma.lessonProgress.upsert).toHaveBeenCalledWith({
        where: {
          enrollmentId_lessonId: {
            enrollmentId: 'enroll-1',
            lessonId: 'lesson-1',
          },
        },
        create: expect.objectContaining({
          enrollmentId: 'enroll-1',
          lessonId: 'lesson-1',
          status: 'COMPLETED',
        }),
        update: expect.objectContaining({
          status: 'COMPLETED',
        }),
      });
      expect(result).toEqual(mockProgress);
    });
  });

  // ==================== QUIZ ATTEMPTS ====================

  describe('startQuizAttempt', () => {
    it('should start first quiz attempt', async () => {
      const mockEnrollment = {
        id: 'enroll-1',
        course: { maxAttempts: 3 },
      };

      const mockAttempt = {
        id: 'attempt-1',
        enrollmentId: 'enroll-1',
        quizId: 'quiz-1',
        attemptNumber: 1,
      };

      (prisma.quizAttempt.findFirst as jest.Mock).mockResolvedValue(null);
      (prisma.enrollment.findUnique as jest.Mock).mockResolvedValue(mockEnrollment);
      (prisma.quizAttempt.create as jest.Mock).mockResolvedValue(mockAttempt);

      const result = await elearningService.startQuizAttempt({
        enrollmentId: 'enroll-1',
        quizId: 'quiz-1',
      });

      expect(result).toEqual(mockAttempt);
      expect(result.attemptNumber).toBe(1);
    });

    it('should throw error if max attempts exceeded', async () => {
      const mockEnrollment = {
        id: 'enroll-1',
        course: { maxAttempts: 2 },
      };

      const mockLastAttempt = { attemptNumber: 2 };

      (prisma.quizAttempt.findFirst as jest.Mock).mockResolvedValue(mockLastAttempt);
      (prisma.enrollment.findUnique as jest.Mock).mockResolvedValue(mockEnrollment);

      await expect(
        elearningService.startQuizAttempt({
          enrollmentId: 'enroll-1',
          quizId: 'quiz-1',
        })
      ).rejects.toThrow('Maximum number of attempts exceeded');
    });
  });

  describe('submitQuizAttempt', () => {
    it('should grade single choice question correctly', async () => {
      const mockQuestion = {
        id: 'q1',
        questionType: 'SINGLE_CHOICE',
        points: 10,
        answers: [
          { id: 'a1', isCorrect: true },
          { id: 'a2', isCorrect: false },
        ],
      };

      const mockAttempt = {
        id: 'attempt-1',
        enrollmentId: 'enroll-1',
        quiz: { passingScore: 80 },
      };

      (prisma.question.findUnique as jest.Mock).mockResolvedValue(mockQuestion);
      (prisma.questionResponse.create as jest.Mock).mockResolvedValue({ points: 10, isCorrect: true });
      (prisma.question.aggregate as jest.Mock).mockResolvedValue({ _sum: { points: 10 } });
      (prisma.quizAttempt.findUnique as jest.Mock).mockResolvedValue(mockAttempt);
      (prisma.quizAttempt.update as jest.Mock).mockResolvedValue({
        ...mockAttempt,
        score: 100,
        passed: true,
      });
      (prisma.enrollment.update as jest.Mock).mockResolvedValue({});

      const result = await elearningService.submitQuizAttempt('attempt-1', [
        { questionId: 'q1', selectedAnswers: ['a1'] },
      ]);

      expect(prisma.questionResponse.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          attemptId: 'attempt-1',
          questionId: 'q1',
          selectedAnswers: ['a1'],
          isCorrect: true,
          points: 10,
        }),
      });
      expect(result.score).toBe(100);
      expect(result.passed).toBe(true);
    });

    it('should grade multiple choice question correctly', async () => {
      const mockQuestion = {
        id: 'q1',
        questionType: 'MULTIPLE_CHOICE',
        points: 10,
        answers: [
          { id: 'a1', isCorrect: true },
          { id: 'a2', isCorrect: true },
          { id: 'a3', isCorrect: false },
        ],
      };

      (prisma.question.findUnique as jest.Mock).mockResolvedValue(mockQuestion);
      (prisma.questionResponse.create as jest.Mock).mockResolvedValue({ points: 10, isCorrect: true });
      (prisma.question.aggregate as jest.Mock).mockResolvedValue({ _sum: { points: 10 } });
      (prisma.quizAttempt.findUnique as jest.Mock).mockResolvedValue({
        id: 'attempt-1',
        enrollmentId: 'enroll-1',
        quiz: { passingScore: 80 },
      });
      (prisma.quizAttempt.update as jest.Mock).mockResolvedValue({
        score: 100,
        passed: true,
        responses: [],
      });
      (prisma.enrollment.update as jest.Mock).mockResolvedValue({});

      await elearningService.submitQuizAttempt('attempt-1', [
        { questionId: 'q1', selectedAnswers: ['a1', 'a2'] },
      ]);

      expect(prisma.questionResponse.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          isCorrect: true,
          points: 10,
        }),
      });
    });

    it('should grade text question with case sensitivity', async () => {
      const mockQuestion = {
        id: 'q1',
        questionType: 'TEXT',
        points: 10,
        caseSensitive: true,
        answers: [{ id: 'a1', isCorrect: true, answerText: 'TypeScript' }],
      };

      (prisma.question.findUnique as jest.Mock).mockResolvedValue(mockQuestion);
      (prisma.questionResponse.create as jest.Mock).mockResolvedValue({ points: 10, isCorrect: true });
      (prisma.question.aggregate as jest.Mock).mockResolvedValue({ _sum: { points: 10 } });
      (prisma.quizAttempt.findUnique as jest.Mock).mockResolvedValue({
        id: 'attempt-1',
        enrollmentId: 'enroll-1',
        quiz: { passingScore: 80 },
      });
      (prisma.quizAttempt.update as jest.Mock).mockResolvedValue({
        score: 100,
        passed: true,
        responses: [],
      });
      (prisma.enrollment.update as jest.Mock).mockResolvedValue({});

      await elearningService.submitQuizAttempt('attempt-1', [
        { questionId: 'q1', textResponse: 'TypeScript' },
      ]);

      expect(prisma.questionResponse.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          isCorrect: true,
          points: 10,
        }),
      });
    });
  });

  // ==================== ASSIGNMENTS ====================

  describe('createCourseAssignment', () => {
    it('should create assignment and auto-enroll users', async () => {
      const mockAssignment = {
        id: 'assign-1',
        courseId: 'course-1',
        assignedToUserIds: ['user-1', 'user-2'],
      };

      (prisma.courseAssignment.create as jest.Mock).mockResolvedValue(mockAssignment);
      (prisma.userGroupMembership.findMany as jest.Mock).mockResolvedValue([]);
      (prisma.enrollment.upsert as jest.Mock).mockResolvedValue({});

      const result = await elearningService.createCourseAssignment({
        courseId: 'course-1',
        assignedToUserIds: ['user-1', 'user-2'],
        assignedById: 'admin-1',
      });

      expect(prisma.courseAssignment.create).toHaveBeenCalled();
      expect(prisma.enrollment.upsert).toHaveBeenCalledTimes(2);
      expect(result).toEqual(mockAssignment);
    });

    it('should auto-enroll users from groups', async () => {
      const mockAssignment = {
        id: 'assign-1',
        courseId: 'course-1',
        assignedToGroupIds: ['group-1'],
      };

      const mockGroupUsers = [
        { userId: 'user-1' },
        { userId: 'user-2' },
      ];

      (prisma.courseAssignment.create as jest.Mock).mockResolvedValue(mockAssignment);
      (prisma.userGroupMembership.findMany as jest.Mock).mockResolvedValue(mockGroupUsers);
      (prisma.enrollment.upsert as jest.Mock).mockResolvedValue({});

      await elearningService.createCourseAssignment({
        courseId: 'course-1',
        assignedToGroupIds: ['group-1'],
        assignedById: 'admin-1',
      });

      expect(prisma.userGroupMembership.findMany).toHaveBeenCalledWith({
        where: {
          userGroupId: { in: ['group-1'] },
        },
        select: {
          userId: true,
        },
      });
      expect(prisma.enrollment.upsert).toHaveBeenCalledTimes(2);
    });
  });

  // ==================== ANALYTICS ====================

  describe('getCourseAnalytics', () => {
    it('should calculate course statistics', async () => {
      const mockCourse = {
        id: 'course-1',
        title: 'TypeScript',
        _count: { enrollments: 10, lessons: 5 },
      };

      const mockEnrollments = [
        { status: 'COMPLETED', score: 90, progressPercent: 100 },
        { status: 'COMPLETED', score: 85, progressPercent: 100 },
        { status: 'IN_PROGRESS', score: 0, progressPercent: 50 },
        { status: 'NOT_STARTED', score: 0, progressPercent: 0 },
      ];

      (prisma.course.findUnique as jest.Mock).mockResolvedValue(mockCourse);
      (prisma.enrollment.findMany as jest.Mock).mockResolvedValue(mockEnrollments);

      const result = await elearningService.getCourseAnalytics('course-1');

      expect(result.totalEnrollments).toBe(4);
      expect(result.completedCount).toBe(2);
      expect(result.inProgressCount).toBe(1);
      expect(result.notStartedCount).toBe(1);
      expect(result.completionRate).toBe(50);
      expect(result.averageScore).toBeGreaterThan(0);
    });
  });

  describe('getUserLearningStats', () => {
    it('should calculate user learning statistics', async () => {
      const mockEnrollments = [
        { status: 'COMPLETED', score: 90, certificateIssued: true },
        { status: 'COMPLETED', score: 85, certificateIssued: true },
        { status: 'IN_PROGRESS', score: 0, certificateIssued: false },
      ];

      (prisma.enrollment.findMany as jest.Mock).mockResolvedValue(mockEnrollments);

      const result = await elearningService.getUserLearningStats('user-1');

      expect(result.totalCourses).toBe(3);
      expect(result.completedCourses).toBe(2);
      expect(result.inProgressCourses).toBe(1);
      expect(result.certificatesEarned).toBe(2);
      expect(result.completionRate).toBeCloseTo(66.67, 1);
    });
  });

  // ==================== HELPERS ====================

  describe('getOrCreateEnrollment', () => {
    it('should return existing enrollment', async () => {
      const mockEnrollment = { id: 'enroll-1', userId: 'user-1', courseId: 'course-1' };

      (prisma.enrollment.findUnique as jest.Mock).mockResolvedValue(mockEnrollment);

      const result = await elearningService.getOrCreateEnrollment('user-1', 'course-1');

      expect(result).toEqual(mockEnrollment);
      expect(prisma.enrollment.create).not.toHaveBeenCalled();
    });

    it('should create enrollment if not exists', async () => {
      const mockEnrollment = {
        id: 'enroll-1',
        userId: 'user-1',
        courseId: 'course-1',
        status: 'IN_PROGRESS',
      };

      (prisma.enrollment.findUnique as jest.Mock).mockResolvedValue(null);
      (prisma.enrollment.create as jest.Mock).mockResolvedValue(mockEnrollment);

      const result = await elearningService.getOrCreateEnrollment('user-1', 'course-1');

      expect(prisma.enrollment.create).toHaveBeenCalledWith({
        data: {
          userId: 'user-1',
          courseId: 'course-1',
          status: 'IN_PROGRESS',
        },
      });
      expect(result).toEqual(mockEnrollment);
    });
  });

  describe('calculateAndUpdateEnrollmentProgress', () => {
    it('should calculate progress and mark completed when 100%', async () => {
      const mockEnrollment = {
        id: 'enroll-1',
        status: 'IN_PROGRESS',
        certificateIssued: false,
        course: {
          lessons: [
            { id: 'lesson-1', isActive: true, isOptional: false },
            { id: 'lesson-2', isActive: true, isOptional: false },
          ],
        },
        lessonProgress: [
          { lessonId: 'lesson-1', status: 'COMPLETED' },
          { lessonId: 'lesson-2', status: 'COMPLETED' },
        ],
      };

      const mockCompletedEnrollment = {
        ...mockEnrollment,
        status: 'COMPLETED',
        user: { id: 'user-1', firstName: 'John', lastName: 'Doe' },
        courseId: 'course-1',
        userId: 'user-1',
      };

      // First call returns enrollment for progress calculation
      // Second call (inside generateCertificate) returns completed enrollment
      (prisma.enrollment.findUnique as jest.Mock)
        .mockResolvedValueOnce(mockEnrollment)
        .mockResolvedValueOnce(mockCompletedEnrollment);
      (prisma.enrollment.update as jest.Mock).mockResolvedValue({});

      // Mock fs for certificate generation
      const fs = require('fs');
      fs.existsSync = jest.fn().mockReturnValue(true);
      fs.createWriteStream = jest.fn().mockReturnValue({
        on: jest.fn((event, callback) => {
          if (event === 'finish') callback();
          return { on: jest.fn() };
        }),
      });

      await elearningService.calculateAndUpdateEnrollmentProgress('enroll-1');

      expect(prisma.enrollment.update).toHaveBeenCalledWith({
        where: { id: 'enroll-1' },
        data: expect.objectContaining({
          progressPercent: 100,
          status: 'COMPLETED',
          completedAt: expect.any(Date),
        }),
      });
    });

    it('should not mark completed if progress less than 100%', async () => {
      const mockEnrollment = {
        id: 'enroll-1',
        course: {
          lessons: [
            { id: 'lesson-1', isActive: true, isOptional: false },
            { id: 'lesson-2', isActive: true, isOptional: false },
          ],
        },
        lessonProgress: [
          { lessonId: 'lesson-1', status: 'COMPLETED' },
        ],
      };

      (prisma.enrollment.findUnique as jest.Mock).mockResolvedValue(mockEnrollment);
      (prisma.enrollment.update as jest.Mock).mockResolvedValue({});

      await elearningService.calculateAndUpdateEnrollmentProgress('enroll-1');

      expect(prisma.enrollment.update).toHaveBeenCalledWith({
        where: { id: 'enroll-1' },
        data: expect.objectContaining({
          progressPercent: 50,
          status: 'IN_PROGRESS',
        }),
      });
    });
  });

  // ==================== IMPORT/EXPORT ====================

  describe('exportCourse', () => {
    it('should export course with lessons and quizzes', async () => {
      const mockCourse = {
        id: 'course-1',
        title: 'TypeScript Basics',
        description: 'Learn TypeScript',
        courseType: 'OPTIONAL',
        status: 'PUBLISHED',
        category: { name: 'Programming', description: 'Prog courses' },
        lessons: [
          {
            id: 'lesson-1',
            title: 'Introduction',
            order: 1,
            contentType: 'TEXT',
            quiz: {
              id: 'quiz-1',
              title: 'Quiz 1',
              questions: [
                {
                  id: 'q1',
                  questionText: 'What is TS?',
                  questionType: 'SINGLE_CHOICE',
                  order: 1,
                  answers: [
                    { id: 'a1', answerText: 'A language', isCorrect: true, order: 1 },
                  ],
                },
              ],
            },
          },
        ],
      };

      (prisma.course.findUnique as jest.Mock).mockResolvedValue(mockCourse);

      const result = await elearningService.exportCourse('course-1');

      expect(result).toHaveProperty('exportVersion', '1.0');
      expect(result).toHaveProperty('exportedAt');
      expect(result.course.title).toBe('TypeScript Basics');
      expect(result.course.lessons).toHaveLength(1);
      expect(result.course.lessons[0].quiz).toBeDefined();
    });

    it('should throw error if course not found', async () => {
      (prisma.course.findUnique as jest.Mock).mockResolvedValue(null);

      await expect(elearningService.exportCourse('invalid-id')).rejects.toThrow('Course not found');
    });
  });

  describe('importCourse', () => {
    it('should import course and create all relations', async () => {
      const courseData = {
        exportVersion: '1.0',
        course: {
          title: 'Imported Course',
          description: 'Imported',
          courseType: 'OPTIONAL',
          category: { name: 'Test Category', description: 'Test' },
          lessons: [
            {
              title: 'Lesson 1',
              order: 1,
              contentType: 'TEXT',
              quiz: {
                title: 'Quiz 1',
                questions: [
                  {
                    questionText: 'Q1',
                    questionType: 'SINGLE_CHOICE',
                    order: 1,
                    answers: [
                      { answerText: 'A1', isCorrect: true, order: 1 },
                    ],
                  },
                ],
              },
            },
          ],
        },
      };

      (prisma.courseCategory.findFirst as jest.Mock).mockResolvedValue(null);
      (prisma.courseCategory.create as jest.Mock).mockResolvedValue({ id: 'cat-1' });
      (prisma.course.create as jest.Mock).mockResolvedValue({ id: 'course-1' });
      (prisma.lesson.create as jest.Mock).mockResolvedValue({ id: 'lesson-1' });
      (prisma.quiz.create as jest.Mock).mockResolvedValue({ id: 'quiz-1' });
      (prisma.question.create as jest.Mock).mockResolvedValue({ id: 'q1' });
      (prisma.answer.create as jest.Mock).mockResolvedValue({ id: 'a1' });
      (prisma.course.findUnique as jest.Mock).mockResolvedValue({ id: 'course-1' });

      const result = await elearningService.importCourse(courseData, 'user-1');

      expect(prisma.courseCategory.create).toHaveBeenCalled();
      expect(prisma.course.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            title: 'Imported Course',
            status: 'DRAFT',
          }),
        })
      );
      expect(prisma.lesson.create).toHaveBeenCalled();
      expect(prisma.quiz.create).toHaveBeenCalled();
      expect(prisma.question.create).toHaveBeenCalled();
      expect(prisma.answer.create).toHaveBeenCalled();
    });

    it('should throw error for invalid export format', async () => {
      const invalidData = { exportVersion: '2.0', course: {} };

      await expect(elearningService.importCourse(invalidData, 'user-1')).rejects.toThrow(
        'Invalid or unsupported export format'
      );
    });
  });
});
