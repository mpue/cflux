import { PrismaClient, CourseStatus, CourseType, EnrollmentStatus, QuestionType } from '@prisma/client';
import PDFDocument from 'pdfkit';
import fs from 'fs';
import path from 'path';

const prisma = new PrismaClient();

/**
 * E-Learning Service
 * Handles course management, enrollments, quiz tracking, and certificates
 */

// ==================== COURSES ====================

export async function getAllCourses(filters?: {
  status?: CourseStatus;
  courseType?: CourseType;
  isComplianceCourse?: boolean;
  ehsRelevant?: boolean;
  categoryId?: string;
}) {
  return prisma.course.findMany({
    where: {
      isActive: true,
      ...(filters?.status && { status: filters.status }),
      ...(filters?.courseType && { courseType: filters.courseType }),
      ...(filters?.isComplianceCourse !== undefined && { isComplianceCourse: filters.isComplianceCourse }),
      ...(filters?.ehsRelevant !== undefined && { ehsRelevant: filters.ehsRelevant }),
      ...(filters?.categoryId && { categoryId: filters.categoryId }),
    },
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
}

export async function getCourseById(courseId: string) {
  return prisma.course.findUnique({
    where: { id: courseId },
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
      updatedBy: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
        },
      },
      lessons: {
        where: { isActive: true },
        orderBy: { order: 'asc' },
        include: {
          quiz: {
            include: {
              _count: {
                select: { questions: true },
              },
            },
          },
        },
      },
      _count: {
        select: {
          enrollments: true,
          assignments: true,
        },
      },
    },
  });
}

export async function createCourse(data: {
  title: string;
  description?: string;
  courseType?: CourseType;
  categoryId?: string;
  tags?: string[];
  thumbnailUrl?: string;
  duration?: number;
  level?: string;
  validFrom?: Date;
  validUntil?: Date;
  certificateTemplateId?: string;
  passingScore?: number;
  maxAttempts?: number;
  isComplianceCourse?: boolean;
  ehsRelevant?: boolean;
  renewalMonths?: number;
  createdById: string;
}) {
  const { createdById, categoryId, ...courseData } = data;
  
  return prisma.course.create({
    data: {
      ...courseData,
      status: CourseStatus.DRAFT,
      ...(categoryId && { category: { connect: { id: categoryId } } }),
      createdBy: { connect: { id: createdById } },
      updatedBy: { connect: { id: createdById } },
    },
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
      updatedBy: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
        },
      },
    },
  });
}

export async function updateCourse(courseId: string, data: {
  title?: string;
  description?: string;
  courseType?: CourseType;
  status?: CourseStatus;
  categoryId?: string;
  tags?: string[];
  thumbnailUrl?: string;
  duration?: number;
  level?: string;
  publishedAt?: Date;
  validFrom?: Date;
  validUntil?: Date;
  certificateTemplateId?: string;
  passingScore?: number;
  maxAttempts?: number;
  isComplianceCourse?: boolean;
  ehsRelevant?: boolean;
  renewalMonths?: number;
  updatedById: string;
}) {
  const { updatedById, categoryId, ...courseData } = data;
  
  return prisma.course.update({
    where: { id: courseId },
    data: {
      ...courseData,
      ...(categoryId && { category: { connect: { id: categoryId } } }),
      updatedBy: { connect: { id: updatedById } },
      // Set publishedAt when status changes to PUBLISHED
      ...(data.status === CourseStatus.PUBLISHED && !data.publishedAt && {
        publishedAt: new Date(),
      }),
    },
    include: {
      category: true,
      lessons: {
        where: { isActive: true },
        orderBy: { order: 'asc' },
      },
    },
  });
}

export async function deleteCourse(courseId: string) {
  return prisma.course.update({
    where: { id: courseId },
    data: { isActive: false },
  });
}

// ==================== CATEGORIES ====================

export async function getAllCategories() {
  return prisma.courseCategory.findMany({
    where: { isActive: true },
    include: {
      parent: true,
      _count: {
        select: { courses: true },
      },
    },
    orderBy: { sortOrder: 'asc' },
  });
}

export async function createCategory(data: {
  name: string;
  description?: string;
  icon?: string;
  color?: string;
  parentId?: string;
  sortOrder?: number;
}) {
  return prisma.courseCategory.create({
    data,
  });
}

export async function updateCategory(categoryId: string, data: {
  name?: string;
  description?: string;
  icon?: string;
  color?: string;
  parentId?: string;
  sortOrder?: number;
}) {
  return prisma.courseCategory.update({
    where: { id: categoryId },
    data,
  });
}

// ==================== LESSONS ====================

export async function createLesson(data: {
  courseId: string;
  title: string;
  description?: string;
  order?: number;
  contentType: string;
  content?: string;
  videoUrl?: string;
  duration?: number;
  attachments?: any;
  isOptional?: boolean;
  completionCriteria?: string;
}) {
  return prisma.lesson.create({
    data,
    include: {
      course: {
        select: {
          id: true,
          title: true,
        },
      },
    },
  });
}

export async function updateLesson(lessonId: string, data: {
  title?: string;
  description?: string;
  order?: number;
  contentType?: string;
  content?: string;
  videoUrl?: string;
  duration?: number;
  attachments?: any;
  isOptional?: boolean;
  completionCriteria?: string;
}) {
  return prisma.lesson.update({
    where: { id: lessonId },
    data,
  });
}

export async function deleteLesson(lessonId: string) {
  return prisma.lesson.update({
    where: { id: lessonId },
    data: { isActive: false },
  });
}

// ==================== QUIZZES ====================

export async function getQuizByLessonId(lessonId: string) {
  return prisma.quiz.findUnique({
    where: { lessonId },
    include: {
      questions: {
        where: { isActive: true },
        orderBy: { order: 'asc' },
        include: {
          answers: {
            orderBy: { order: 'asc' },
          },
        },
      },
    },
  });
}

export async function createQuiz(data: {
  lessonId: string;
  title: string;
  description?: string;
  timeLimit?: number;
  shuffleQuestions?: boolean;
  shuffleAnswers?: boolean;
  showResults?: boolean;
  passingScore?: number;
}) {
  return prisma.quiz.create({
    data,
  });
}

export async function updateQuiz(quizId: string, data: {
  title?: string;
  description?: string;
  timeLimit?: number;
  shuffleQuestions?: boolean;
  shuffleAnswers?: boolean;
  showResults?: boolean;
  passingScore?: number;
}) {
  return prisma.quiz.update({
    where: { id: quizId },
    data,
  });
}

export async function deleteQuiz(quizId: string) {
  // Hard delete - Quiz model doesn't have isActive field
  // All related questions and answers will be cascaded deleted
  return prisma.quiz.delete({
    where: { id: quizId },
  });
}

export async function getQuizWithQuestions(quizId: string) {
  return prisma.quiz.findUnique({
    where: { id: quizId },
    include: {
      lesson: {
        select: {
          id: true,
          title: true,
          courseId: true,
        },
      },
      questions: {
        where: { isActive: true },
        orderBy: { order: 'asc' },
        include: {
          answers: {
            orderBy: { order: 'asc' },
          },
        },
      },
    },
  });
}

// ==================== QUESTIONS ====================

export async function createQuestion(data: {
  quizId: string;
  questionText: string;
  questionType: QuestionType;
  points?: number;
  order?: number;
  explanation?: string;
  caseSensitive?: boolean;
}) {
  return prisma.question.create({
    data,
  });
}

export async function updateQuestion(questionId: string, data: {
  questionText?: string;
  questionType?: QuestionType;
  points?: number;
  order?: number;
  explanation?: string;
  caseSensitive?: boolean;
}) {
  return prisma.question.update({
    where: { id: questionId },
    data,
  });
}

export async function deleteQuestion(questionId: string) {
  return prisma.question.update({
    where: { id: questionId },
    data: { isActive: false },
  });
}

// ==================== ANSWERS ====================

export async function createAnswer(data: {
  questionId: string;
  answerText: string;
  isCorrect?: boolean;
  order?: number;
}) {
  return prisma.answer.create({
    data,
  });
}

export async function updateAnswer(answerId: string, data: {
  answerText?: string;
  isCorrect?: boolean;
  order?: number;
}) {
  return prisma.answer.update({
    where: { id: answerId },
    data,
  });
}

export async function deleteAnswer(answerId: string) {
  return prisma.answer.delete({
    where: { id: answerId },
  });
}

// ==================== ENROLLMENTS ====================

export async function enrollUser(data: {
  userId: string;
  courseId: string;
  assignmentId?: string;
  expiresAt?: Date;
}) {
  // Check if enrollment already exists
  const existing = await prisma.enrollment.findUnique({
    where: {
      userId_courseId: {
        userId: data.userId,
        courseId: data.courseId,
      },
    },
  });

  if (existing) {
    throw new Error('User is already enrolled in this course');
  }

  return prisma.enrollment.create({
    data,
    include: {
      course: {
        select: {
          id: true,
          title: true,
          thumbnailUrl: true,
        },
      },
      user: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
        },
      },
    },
  });
}

export async function getUserEnrollments(userId: string, filters?: {
  status?: EnrollmentStatus;
}) {
  return prisma.enrollment.findMany({
    where: {
      userId,
      ...(filters?.status && { status: filters.status }),
    },
    include: {
      course: {
        include: {
          category: true,
          _count: {
            select: { lessons: true },
          },
        },
      },
      lessonProgress: true,
    },
    orderBy: { enrolledAt: 'desc' },
  });
}

export async function getEnrollmentById(enrollmentId: string) {
  return prisma.enrollment.findUnique({
    where: { id: enrollmentId },
    include: {
      course: {
        include: {
          lessons: {
            where: { isActive: true },
            orderBy: { order: 'asc' },
            include: {
              quiz: true,
            },
          },
        },
      },
      user: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
        },
      },
      lessonProgress: {
        include: {
          lesson: true,
        },
      },
      quizAttempts: {
        include: {
          quiz: {
            select: {
              id: true,
              title: true,
            },
          },
        },
        orderBy: { attemptNumber: 'desc' },
      },
    },
  });
}

export async function updateEnrollmentProgress(enrollmentId: string, data: {
  status?: EnrollmentStatus;
  progressPercent?: number;
  score?: number;
  startedAt?: Date;
  completedAt?: Date;
  certificateIssued?: boolean;
  certificateUrl?: string;
  certificateIssuedAt?: Date;
}) {
  return prisma.enrollment.update({
    where: { id: enrollmentId },
    data,
  });
}

// ==================== LESSON PROGRESS ====================

export async function updateLessonProgress(data: {
  enrollmentId: string;
  lessonId: string;
  status?: string;
  startedAt?: Date;
  completedAt?: Date;
  timeSpent?: number;
  lastPosition?: number;
}) {
  const { enrollmentId, lessonId, ...updateData } = data;

  return prisma.lessonProgress.upsert({
    where: {
      enrollmentId_lessonId: {
        enrollmentId,
        lessonId,
      },
    },
    create: {
      enrollmentId,
      lessonId,
      ...updateData,
    },
    update: updateData,
  });
}

export async function getLessonProgress(enrollmentId: string, lessonId: string) {
  return prisma.lessonProgress.findUnique({
    where: {
      enrollmentId_lessonId: {
        enrollmentId,
        lessonId,
      },
    },
  });
}

// ==================== QUIZ ATTEMPTS ====================

export async function startQuizAttempt(data: {
  enrollmentId: string;
  quizId: string;
}) {
  // Get the next attempt number
  const lastAttempt = await prisma.quizAttempt.findFirst({
    where: {
      enrollmentId: data.enrollmentId,
      quizId: data.quizId,
    },
    orderBy: { attemptNumber: 'desc' },
  });

  const attemptNumber = (lastAttempt?.attemptNumber || 0) + 1;

  // Check if max attempts exceeded
  const enrollment = await prisma.enrollment.findUnique({
    where: { id: data.enrollmentId },
    include: {
      course: true,
    },
  });

  if (enrollment?.course.maxAttempts && attemptNumber > enrollment.course.maxAttempts) {
    throw new Error('Maximum number of attempts exceeded');
  }

  return prisma.quizAttempt.create({
    data: {
      ...data,
      attemptNumber,
    },
  });
}

export async function submitQuizAttempt(attemptId: string, responses: Array<{
  questionId: string;
  selectedAnswers?: string[];
  textResponse?: string;
}>) {
  // Create all responses
  const createdResponses = await Promise.all(
    responses.map(async (response) => {
      // Get question details to grade the response
      const question = await prisma.question.findUnique({
        where: { id: response.questionId },
        include: {
          answers: true,
        },
      });

      if (!question) {
        throw new Error(`Question ${response.questionId} not found`);
      }

      let isCorrect = false;
      let points = 0;

      // Grade based on question type
      if (question.questionType === QuestionType.SINGLE_CHOICE) {
        const correctAnswerId = question.answers.find(a => a.isCorrect)?.id;
        isCorrect = response.selectedAnswers?.[0] === correctAnswerId;
      } else if (question.questionType === QuestionType.MULTIPLE_CHOICE) {
        const correctAnswerIds = question.answers.filter(a => a.isCorrect).map(a => a.id).sort();
        const selectedIds = (response.selectedAnswers || []).sort();
        isCorrect = JSON.stringify(correctAnswerIds) === JSON.stringify(selectedIds);
      } else if (question.questionType === QuestionType.TRUE_FALSE) {
        const correctAnswerId = question.answers.find(a => a.isCorrect)?.id;
        isCorrect = response.selectedAnswers?.[0] === correctAnswerId;
      } else if (question.questionType === QuestionType.TEXT || question.questionType === QuestionType.FILL_BLANK) {
        const correctAnswer = question.answers.find(a => a.isCorrect)?.answerText;
        if (correctAnswer && response.textResponse) {
          if (question.caseSensitive) {
            isCorrect = response.textResponse === correctAnswer;
          } else {
            isCorrect = response.textResponse.toLowerCase() === correctAnswer.toLowerCase();
          }
        }
      }

      if (isCorrect) {
        points = question.points;
      }

      return prisma.questionResponse.create({
        data: {
          attemptId,
          questionId: response.questionId,
          selectedAnswers: response.selectedAnswers,
          textResponse: response.textResponse,
          isCorrect,
          points,
        },
      });
    })
  );

  // Calculate total score
  const totalPoints = createdResponses.reduce((sum, r) => sum + r.points, 0);
  const maxPoints = await prisma.question.aggregate({
    where: {
      id: { in: responses.map(r => r.questionId) },
      isActive: true,
    },
    _sum: { points: true },
  });

  const score = maxPoints._sum.points ? (totalPoints / maxPoints._sum.points) * 100 : 0;

  // Get passing score from quiz
  const attempt = await prisma.quizAttempt.findUnique({
    where: { id: attemptId },
    include: {
      quiz: true,
    },
  });

  const passed = score >= (attempt?.quiz.passingScore || 80);

  // Update attempt with score and completion
  const updatedAttempt = await prisma.quizAttempt.update({
    where: { id: attemptId },
    data: {
      completedAt: new Date(),
      score,
      passed,
    },
    include: {
      responses: {
        include: {
          question: {
            include: {
              answers: true,
            },
          },
        },
      },
    },
  });

  // Update enrollment attempts counter
  await prisma.enrollment.update({
    where: { id: attempt!.enrollmentId },
    data: {
      attempts: { increment: 1 },
    },
  });

  return updatedAttempt;
}

export async function getQuizAttempt(attemptId: string) {
  return prisma.quizAttempt.findUnique({
    where: { id: attemptId },
    include: {
      quiz: {
        include: {
          lesson: {
            select: {
              id: true,
              title: true,
            },
          },
          questions: {
            where: { isActive: true },
            orderBy: { order: 'asc' },
            include: {
              answers: {
                orderBy: { order: 'asc' },
              },
            },
          },
        },
      },
      responses: {
        include: {
          question: {
            include: {
              answers: true,
            },
          },
        },
      },
    },
  });
}

export async function getUserQuizAttempts(enrollmentId: string, quizId: string) {
  return await prisma.quizAttempt.findMany({
    where: {
      enrollmentId,
      quizId,
    },
    include: {
      quiz: true,
      responses: {
        include: {
          question: true,
        },
      },
    },
    orderBy: {
      attemptNumber: 'desc',
    },
  });
}

// ==================== ASSIGNMENTS ====================

export async function createCourseAssignment(data: {
  courseId: string;
  assignedToUserIds?: string[];
  assignedToGroupIds?: string[];
  dueDate?: Date;
  reminderDays?: number[];
  assignedById: string;
  notes?: string;
}) {
  const assignment = await prisma.courseAssignment.create({
    data: {
      courseId: data.courseId,
      assignedToUserIds: data.assignedToUserIds || [],
      assignedToGroupIds: data.assignedToGroupIds || [],
      dueDate: data.dueDate,
      reminderDays: data.reminderDays || [7, 3, 1],
      assignedById: data.assignedById,
      notes: data.notes,
    },
  });

  // Auto-enroll assigned users
  const userIds = data.assignedToUserIds || [];
  
  // Get users from groups
  if (data.assignedToGroupIds && data.assignedToGroupIds.length > 0) {
    const groupUsers = await prisma.userGroupMembership.findMany({
      where: {
        userGroupId: { in: data.assignedToGroupIds },
      },
      select: {
        userId: true,
      },
    });
    userIds.push(...groupUsers.map(gu => gu.userId));
  }

  // Remove duplicates
  const uniqueUserIds = [...new Set(userIds)];

  // Create enrollments
  await Promise.all(
    uniqueUserIds.map(userId =>
      prisma.enrollment.upsert({
        where: {
          userId_courseId: {
            userId,
            courseId: data.courseId,
          },
        },
        create: {
          userId,
          courseId: data.courseId,
          assignmentId: assignment.id,
          expiresAt: data.dueDate,
        },
        update: {
          assignmentId: assignment.id,
          expiresAt: data.dueDate,
        },
      })
    )
  );

  return assignment;
}

export async function getCourseAssignments(courseId: string) {
  return prisma.courseAssignment.findMany({
    where: {
      courseId,
      isActive: true,
    },
    include: {
      course: {
        select: {
          id: true,
          title: true,
        },
      },
      assignedBy: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
        },
      },
      _count: {
        select: {
          enrollments: true,
        },
      },
    },
    orderBy: { assignedAt: 'desc' },
  });
}

export async function getMyAssignments(userId: string) {
  // Get user's group IDs
  const userGroups = await prisma.userGroupMembership.findMany({
    where: { userId },
    select: { userGroupId: true },
  });
  const groupIds = userGroups.map(ug => ug.userGroupId);

  // Find assignments where user or their groups are assigned
  const assignments = await prisma.courseAssignment.findMany({
    where: {
      isActive: true,
      OR: [
        { assignedToUserIds: { has: userId } },
        { assignedToGroupIds: { hasSome: groupIds } },
      ],
    },
    include: {
      course: {
        select: {
          id: true,
          title: true,
          description: true,
          duration: true,
          category: {
            select: {
              name: true,
              color: true,
            },
          },
        },
      },
      assignedBy: {
        select: {
          firstName: true,
          lastName: true,
        },
      },
      enrollments: {
        where: { userId },
        select: {
          id: true,
          status: true,
          progressPercent: true,
          completedAt: true,
        },
      },
    },
    orderBy: [
      { dueDate: 'asc' },
      { assignedAt: 'desc' },
    ],
  });

  return assignments;
}

export async function getAllAssignments() {
  return prisma.courseAssignment.findMany({
    where: {
      isActive: true,
    },
    include: {
      course: {
        select: {
          id: true,
          title: true,
        },
      },
      assignedBy: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
        },
      },
      _count: {
        select: {
          enrollments: true,
        },
      },
    },
    orderBy: { assignedAt: 'desc' },
  });
}

export async function updateCourseAssignment(
  assignmentId: string,
  data: {
    assignedToUserIds?: string[];
    assignedToGroupIds?: string[];
    dueDate?: Date;
    reminderDays?: number[];
    notes?: string;
  }
) {
  return prisma.courseAssignment.update({
    where: { id: assignmentId },
    data,
  });
}

export async function deleteCourseAssignment(assignmentId: string) {
  return prisma.courseAssignment.update({
    where: { id: assignmentId },
    data: { isActive: false },
  });
}

// ==================== ANALYTICS ====================

export async function getCourseAnalytics(courseId: string) {
  const course = await prisma.course.findUnique({
    where: { id: courseId },
    include: {
      _count: {
        select: {
          enrollments: true,
          lessons: true,
        },
      },
    },
  });

  const enrollments = await prisma.enrollment.findMany({
    where: { courseId },
  });

  const completedCount = enrollments.filter(e => e.status === EnrollmentStatus.COMPLETED).length;
  const inProgressCount = enrollments.filter(e => e.status === EnrollmentStatus.IN_PROGRESS).length;
  const notStartedCount = enrollments.filter(e => e.status === EnrollmentStatus.NOT_STARTED).length;
  const averageScore = enrollments.reduce((sum, e) => sum + (e.score || 0), 0) / (enrollments.length || 1);
  const averageProgress = enrollments.reduce((sum, e) => sum + e.progressPercent, 0) / (enrollments.length || 1);

  return {
    course,
    totalEnrollments: enrollments.length,
    completedCount,
    inProgressCount,
    notStartedCount,
    averageScore: Math.round(averageScore * 100) / 100,
    averageProgress: Math.round(averageProgress * 100) / 100,
    completionRate: enrollments.length > 0 ? (completedCount / enrollments.length) * 100 : 0,
  };
}

export async function getUserLearningStats(userId: string) {
  const enrollments = await prisma.enrollment.findMany({
    where: { userId },
  });

  const totalCourses = enrollments.length;
  const completedCourses = enrollments.filter(e => e.status === EnrollmentStatus.COMPLETED).length;
  const inProgressCourses = enrollments.filter(e => e.status === EnrollmentStatus.IN_PROGRESS).length;
  const averageScore = enrollments.reduce((sum, e) => sum + (e.score || 0), 0) / (enrollments.length || 1);
  const certificatesEarned = enrollments.filter(e => e.certificateIssued).length;

  return {
    totalCourses,
    completedCourses,
    inProgressCourses,
    averageScore: Math.round(averageScore * 100) / 100,
    certificatesEarned,
    completionRate: totalCourses > 0 ? (completedCourses / totalCourses) * 100 : 0,
  };
}

// ==================== LESSON PROGRESS HELPERS ====================

export async function getLessonById(lessonId: string) {
  return prisma.lesson.findUnique({
    where: { id: lessonId },
    include: {
      course: true,
    },
  });
}

export async function getOrCreateEnrollment(userId: string, courseId: string) {
  let enrollment = await prisma.enrollment.findUnique({
    where: {
      userId_courseId: {
        userId,
        courseId,
      },
    },
  });

  if (!enrollment) {
    enrollment = await prisma.enrollment.create({
      data: {
        userId,
        courseId,
        status: EnrollmentStatus.IN_PROGRESS,
      },
    });
  }

  return enrollment;
}

export async function calculateAndUpdateEnrollmentProgress(enrollmentId: string) {
  const enrollment = await prisma.enrollment.findUnique({
    where: { id: enrollmentId },
    include: {
      course: {
        include: {
          lessons: {
            where: { isActive: true, isOptional: false },
          },
        },
      },
      lessonProgress: true,
    },
  });

  if (!enrollment) return;

  const totalLessons = enrollment.course.lessons.length;
  if (totalLessons === 0) return;

  const completedLessons = enrollment.lessonProgress.filter(
    lp => lp.status === 'COMPLETED'
  ).length;
  
  const progressPercent = (completedLessons / totalLessons) * 100;
  const isCompleted = progressPercent === 100;

  await updateEnrollmentProgress(enrollmentId, {
    progressPercent,
    status: isCompleted ? EnrollmentStatus.COMPLETED : EnrollmentStatus.IN_PROGRESS,
    completedAt: isCompleted && !enrollment.completedAt ? new Date() : undefined,
  });

  // Auto-generate certificate for completed enrollments
  if (isCompleted && !enrollment.certificateIssued) {
    await generateCertificate(enrollmentId);
  }
}

// ==================== CERTIFICATES ====================

export async function generateCertificate(enrollmentId: string) {
  const enrollment = await prisma.enrollment.findUnique({
    where: { id: enrollmentId },
    include: {
      user: true,
      course: true,
    },
  });

  if (!enrollment || enrollment.status !== EnrollmentStatus.COMPLETED) {
    throw new Error('Enrollment not completed');
  }

  // Create certificates directory if it doesn't exist
  const certificatesDir = path.join(process.cwd(), 'uploads', 'certificates');
  if (!fs.existsSync(certificatesDir)) {
    fs.mkdirSync(certificatesDir, { recursive: true });
  }

  // Generate certificate filename
  const certificateId = `CERT-${enrollment.courseId.slice(0, 8).toUpperCase()}-${enrollment.userId.slice(0, 8).toUpperCase()}-${Date.now()}`;
  const certificateFileName = `${certificateId}.pdf`;
  const certificatePath = path.join(certificatesDir, certificateFileName);
  const certificateUrl = `/api/elearning/certificates/${enrollmentId}/download`;

  // Create PDF document
  const doc = new PDFDocument({
    size: 'A4',
    layout: 'landscape',
    margin: 50,
  });

  // Pipe to file
  const stream = fs.createWriteStream(certificatePath);
  doc.pipe(stream);

  // Design certificate
  const pageWidth = doc.page.width;
  const pageHeight = doc.page.height;

  // Border
  doc.rect(30, 30, pageWidth - 60, pageHeight - 60)
    .lineWidth(3)
    .stroke('#2196f3');

  doc.rect(40, 40, pageWidth - 80, pageHeight - 80)
    .lineWidth(1)
    .stroke('#2196f3');

  // Title
  doc.fontSize(48)
    .font('Helvetica-Bold')
    .fillColor('#2196f3')
    .text('ZERTIFIKAT', 0, 100, {
      align: 'center',
      width: pageWidth,
    });

  // Subtitle
  doc.fontSize(16)
    .font('Helvetica')
    .fillColor('#666')
    .text('wird hiermit verliehen an', 0, 170, {
      align: 'center',
      width: pageWidth,
    });

  // User name
  doc.fontSize(36)
    .font('Helvetica-Bold')
    .fillColor('#000')
    .text(`${enrollment.user.firstName} ${enrollment.user.lastName}`, 0, 210, {
      align: 'center',
      width: pageWidth,
    });

  // Course completion text
  doc.fontSize(16)
    .font('Helvetica')
    .fillColor('#666')
    .text('für die erfolgreiche Absolvierung des Kurses', 0, 270, {
      align: 'center',
      width: pageWidth,
    });

  // Course name
  doc.fontSize(24)
    .font('Helvetica-Bold')
    .fillColor('#2196f3')
    .text(enrollment.course.title, 0, 310, {
      align: 'center',
      width: pageWidth,
    });

  // Completion date
  const completionDate = enrollment.completedAt ? new Date(enrollment.completedAt).toLocaleDateString('de-DE', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  }) : new Date().toLocaleDateString('de-DE', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  });

  doc.fontSize(14)
    .font('Helvetica')
    .fillColor('#666')
    .text(`Abgeschlossen am ${completionDate}`, 0, 380, {
      align: 'center',
      width: pageWidth,
    });

  // Score if available
  if (enrollment.score) {
    doc.fontSize(14)
      .fillColor('#666')
      .text(`Erreichte Punktzahl: ${Math.round(enrollment.score)}%`, 0, 410, {
        align: 'center',
        width: pageWidth,
      });
  }

  // Certificate ID at bottom
  doc.fontSize(10)
    .fillColor('#999')
    .text(`Zertifikat-ID: ${certificateId}`, 0, pageHeight - 80, {
      align: 'center',
      width: pageWidth,
    });

  // Signature line (placeholder for future template editor)
  const signatureY = pageHeight - 130;
  doc.moveTo(pageWidth / 2 - 150, signatureY)
    .lineTo(pageWidth / 2 + 150, signatureY)
    .stroke('#ccc');

  doc.fontSize(10)
    .fillColor('#666')
    .text('Unterschrift', 0, signatureY + 10, {
      align: 'center',
      width: pageWidth,
    });

  // Finalize PDF
  doc.end();

  // Wait for the PDF to be written
  await new Promise<void>((resolve, reject) => {
    stream.on('finish', () => resolve());
    stream.on('error', reject);
  });

  // Update enrollment with certificate info
  await prisma.enrollment.update({
    where: { id: enrollmentId },
    data: {
      certificateIssued: true,
      certificateUrl,
      certificateIssuedAt: new Date(),
    },
  });

  return {
    certificateUrl,
    certificatePath,
    certificateFileName,
  };
}

export async function getCertificate(enrollmentId: string) {
  const enrollment = await prisma.enrollment.findUnique({
    where: { id: enrollmentId },
    include: {
      user: true,
      course: true,
    },
  });

  if (!enrollment) {
    return null;
  }

  return {
    certificateUrl: enrollment.certificateUrl,
    certificateIssuedAt: enrollment.certificateIssuedAt,
    certificateIssued: enrollment.certificateIssued,
    user: enrollment.user,
    course: enrollment.course,
  };
}

export async function getAllCertificates() {
  const enrollments = await prisma.enrollment.findMany({
    where: {
      certificateIssued: true,
    },
    include: {
      user: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
        },
      },
      course: {
        select: {
          id: true,
          title: true,
          courseType: true,
        },
      },
    },
    orderBy: {
      certificateIssuedAt: 'desc',
    },
  });

  return enrollments.map(e => ({
    enrollmentId: e.id,
    certificateUrl: e.certificateUrl,
    certificateIssuedAt: e.certificateIssuedAt,
    completedAt: e.completedAt,
    score: e.score,
    user: e.user,
    course: e.course,
  }));
}

// ==================== ADMIN ANALYTICS ====================

export async function getAdminAnalytics() {
  // Overall statistics
  const [totalCourses, totalEnrollments, activeUsers, completedEnrollments] = await Promise.all([
    prisma.course.count({ where: { isActive: true } }),
    prisma.enrollment.count(),
    prisma.enrollment.groupBy({
      by: ['userId'],
      _count: true,
    }).then(result => result.length),
    prisma.enrollment.count({ where: { status: EnrollmentStatus.COMPLETED } }),
  ]);

  // Enrollment status breakdown
  const enrollmentsByStatus = await prisma.enrollment.groupBy({
    by: ['status'],
    _count: true,
  });

  // Course completion rates
  const courses = await prisma.course.findMany({
    where: { isActive: true },
    select: {
      id: true,
      title: true,
      courseType: true,
      _count: {
        select: {
          enrollments: true,
        },
      },
    },
  });

  const coursesWithRates = await Promise.all(
    courses.map(async (course) => {
      const completedCount = await prisma.enrollment.count({
        where: {
          courseId: course.id,
          status: EnrollmentStatus.COMPLETED,
        },
      });

      const totalEnrollments = course._count.enrollments;
      const completionRate = totalEnrollments > 0 ? (completedCount / totalEnrollments) * 100 : 0;

      return {
        id: course.id,
        title: course.title,
        courseType: course.courseType,
        totalEnrollments,
        completedCount,
        completionRate: Math.round(completionRate * 10) / 10,
      };
    })
  );

  // Recent completions
  const recentCompletions = await prisma.enrollment.findMany({
    where: {
      status: EnrollmentStatus.COMPLETED,
      completedAt: { not: null },
    },
    include: {
      user: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
        },
      },
      course: {
        select: {
          id: true,
          title: true,
          courseType: true,
        },
      },
    },
    orderBy: { completedAt: 'desc' },
    take: 20,
  });

  // Quiz performance
  const quizAttempts = await prisma.quizAttempt.groupBy({
    by: ['passed'],
    _count: true,
    _avg: {
      score: true,
    },
  });

  const totalQuizAttempts = quizAttempts.reduce((sum, item) => sum + item._count, 0);
  const passedAttempts = quizAttempts.find(item => item.passed)?._count || 0;
  const passRate = totalQuizAttempts > 0 ? (passedAttempts / totalQuizAttempts) * 100 : 0;

  return {
    overview: {
      totalCourses,
      totalEnrollments,
      activeUsers,
      completedEnrollments,
      completionRate: totalEnrollments > 0 ? (completedEnrollments / totalEnrollments) * 100 : 0,
    },
    enrollmentsByStatus: enrollmentsByStatus.map(item => ({
      status: item.status,
      count: item._count,
    })),
    coursesWithRates: coursesWithRates.sort((a, b) => b.completionRate - a.completionRate),
    recentCompletions,
    quizPerformance: {
      totalAttempts: totalQuizAttempts,
      passedAttempts,
      failedAttempts: totalQuizAttempts - passedAttempts,
      passRate: Math.round(passRate * 10) / 10,
      averageScore: quizAttempts.reduce((sum, item) => sum + (item._avg.score || 0) * item._count, 0) / totalQuizAttempts || 0,
    },
  };
}

export async function getComplianceReport() {
  // Get all mandatory and compliance courses
  const complianceCourses = await prisma.course.findMany({
    where: {
      isActive: true,
      OR: [
        { courseType: 'MANDATORY' },
        { isComplianceCourse: true },
      ],
    },
    include: {
      enrollments: {
        include: {
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
            },
          },
        },
      },
      assignments: {
        include: {
          assignedBy: {
            select: {
              firstName: true,
              lastName: true,
            },
          },
        },
      },
    },
  });

  // Get all users who should have completed these courses
  const allUsers = await prisma.user.count({
    where: { isActive: true },
  });

  const complianceData = complianceCourses.map((course: any) => {
    const enrolledUsers = course.enrollments.length;
    const completedUsers = course.enrollments.filter((e: any) => e.status === EnrollmentStatus.COMPLETED).length;
    const inProgressUsers = course.enrollments.filter((e: any) => e.status === EnrollmentStatus.IN_PROGRESS).length;
    const overdueUsers = course.enrollments.filter((e: any) => 
      e.expiresAt && e.expiresAt < new Date() && e.status !== EnrollmentStatus.COMPLETED
    ).length;

    const usersNotEnrolled = allUsers - enrolledUsers;

    return {
      courseId: course.id,
      courseTitle: course.title,
      courseType: course.courseType,
      isComplianceCourse: course.isComplianceCourse,
      totalUsers: allUsers,
      enrolledUsers,
      completedUsers,
      inProgressUsers,
      usersNotEnrolled,
      overdueUsers,
      complianceRate: allUsers > 0 ? (completedUsers / allUsers) * 100 : 0,
      enrollments: course.enrollments.map((e: any) => ({
        userId: e.user.id,
        userName: `${e.user.firstName} ${e.user.lastName}`,
        email: e.user.email,
        status: e.status,
        progressPercent: e.progressPercent,
        enrolledAt: e.enrolledAt,
        completedAt: e.completedAt,
        expiresAt: e.expiresAt,
        isOverdue: e.expiresAt ? e.expiresAt < new Date() && e.status !== EnrollmentStatus.COMPLETED : false,
      })),
    };
  });

  return {
    totalComplianceCourses: complianceCourses.length,
    totalUsers: allUsers,
    courses: complianceData,
    overallComplianceRate: complianceData.reduce((sum, c) => sum + c.complianceRate, 0) / complianceData.length || 0,
  };
}

// ==================== IMPORT/EXPORT ====================

export async function exportCourse(courseId: string) {
  const course = await prisma.course.findUnique({
    where: { id: courseId },
    include: {
      category: true,
      lessons: {
        include: {
          quiz: {
            include: {
              questions: {
                include: {
                  answers: true
                },
                orderBy: { order: 'asc' }
              }
            }
          }
        },
        orderBy: { order: 'asc' }
      }
    }
  });

  if (!course) {
    throw new Error('Course not found');
  }

  // Create export data structure
  const exportData = {
    exportVersion: '1.0',
    exportedAt: new Date().toISOString(),
    course: {
      title: course.title,
      description: course.description,
      courseType: course.courseType,
      status: course.status,
      tags: course.tags,
      thumbnailUrl: course.thumbnailUrl,
      duration: course.duration,
      level: course.level,
      passingScore: course.passingScore,
      maxAttempts: course.maxAttempts,
      isComplianceCourse: course.isComplianceCourse,
      ehsRelevant: course.ehsRelevant,
      renewalMonths: course.renewalMonths,
      category: course.category ? {
        name: course.category.name,
        description: course.category.description
      } : null,
      lessons: course.lessons.map(lesson => ({
        title: lesson.title,
        description: lesson.description,
        order: lesson.order,
        contentType: lesson.contentType,
        content: lesson.content,
        videoUrl: lesson.videoUrl,
        duration: lesson.duration,
        isOptional: lesson.isOptional,
        completionCriteria: lesson.completionCriteria,
        attachments: lesson.attachments,
        quiz: lesson.quiz ? {
          title: lesson.quiz.title,
          description: lesson.quiz.description,
          timeLimit: lesson.quiz.timeLimit,
          shuffleQuestions: lesson.quiz.shuffleQuestions,
          shuffleAnswers: lesson.quiz.shuffleAnswers,
          showResults: lesson.quiz.showResults,
          passingScore: lesson.quiz.passingScore,
          questions: lesson.quiz.questions.map(question => ({
            questionText: question.questionText,
            questionType: question.questionType,
            points: question.points,
            order: question.order,
            explanation: question.explanation,
            caseSensitive: question.caseSensitive,
            answers: question.answers.map(answer => ({
              answerText: answer.answerText,
              isCorrect: answer.isCorrect,
              order: answer.order
            }))
          }))
        } : null
      }))
    }
  };

  return exportData;
}

export async function importCourse(courseData: any, userId: string) {
  // Validate export version
  if (!courseData.exportVersion || courseData.exportVersion !== '1.0') {
    throw new Error('Invalid or unsupported export format');
  }

  const data = courseData.course;

  // Check if category exists or create it
  let categoryId = null;
  if (data.category) {
    const existingCategory = await prisma.courseCategory.findFirst({
      where: { name: data.category.name }
    });

    if (existingCategory) {
      categoryId = existingCategory.id;
    } else {
      const newCategory = await prisma.courseCategory.create({
        data: {
          name: data.category.name,
          description: data.category.description
        }
      });
      categoryId = newCategory.id;
    }
  }

  // Create course
  const newCourse = await prisma.course.create({
    data: {
      title: data.title,
      description: data.description,
      courseType: data.courseType,
      status: 'DRAFT', // Always import as draft for safety
      categoryId: categoryId,
      tags: data.tags || [],
      thumbnailUrl: data.thumbnailUrl,
      duration: data.duration,
      level: data.level,
      passingScore: data.passingScore,
      maxAttempts: data.maxAttempts,
      isComplianceCourse: data.isComplianceCourse,
      ehsRelevant: data.ehsRelevant,
      renewalMonths: data.renewalMonths,
      createdById: userId,
      updatedById: userId
    }
  });

  // Create lessons
  for (const lessonData of data.lessons) {
    const newLesson = await prisma.lesson.create({
      data: {
        courseId: newCourse.id,
        title: lessonData.title,
        description: lessonData.description,
        order: lessonData.order,
        contentType: lessonData.contentType,
        content: lessonData.content,
        videoUrl: lessonData.videoUrl,
        duration: lessonData.duration,
        isOptional: lessonData.isOptional,
        completionCriteria: lessonData.completionCriteria,
        attachments: lessonData.attachments
      }
    });

    // Create quiz if exists
    if (lessonData.quiz) {
      const newQuiz = await prisma.quiz.create({
        data: {
          lessonId: newLesson.id,
          title: lessonData.quiz.title,
          description: lessonData.quiz.description,
          timeLimit: lessonData.quiz.timeLimit,
          shuffleQuestions: lessonData.quiz.shuffleQuestions,
          shuffleAnswers: lessonData.quiz.shuffleAnswers,
          showResults: lessonData.quiz.showResults,
          passingScore: lessonData.quiz.passingScore
        }
      });

      // Create questions
      for (const questionData of lessonData.quiz.questions) {
        const newQuestion = await prisma.question.create({
          data: {
            quizId: newQuiz.id,
            questionText: questionData.questionText,
            questionType: questionData.questionType,
            points: questionData.points,
            order: questionData.order,
            explanation: questionData.explanation,
            caseSensitive: questionData.caseSensitive
          }
        });

        // Create answers
        for (const answerData of questionData.answers) {
          await prisma.answer.create({
            data: {
              questionId: newQuestion.id,
              answerText: answerData.answerText,
              isCorrect: answerData.isCorrect,
              order: answerData.order
            }
          });
        }
      }
    }
  }

  // Return the created course with all relations
  return prisma.course.findUnique({
    where: { id: newCourse.id },
    include: {
      category: true,
      lessons: {
        include: {
          quiz: {
            include: {
              questions: {
                include: {
                  answers: true
                }
              }
            }
          }
        }
      },
      createdBy: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true
        }
      }
    }
  });
}
