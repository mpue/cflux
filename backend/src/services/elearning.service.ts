import { PrismaClient, CourseStatus, CourseType, EnrollmentStatus, QuestionType } from '@prisma/client';

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
}

