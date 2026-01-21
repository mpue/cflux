export enum CourseStatus {
  DRAFT = 'DRAFT',
  PUBLISHED = 'PUBLISHED',
  ARCHIVED = 'ARCHIVED',
}

export enum CourseType {
  MANDATORY = 'MANDATORY',
  OPTIONAL = 'OPTIONAL',
  CERTIFICATION = 'CERTIFICATION',
  ONBOARDING = 'ONBOARDING',
}

export enum EnrollmentStatus {
  NOT_STARTED = 'NOT_STARTED',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
  EXPIRED = 'EXPIRED',
}

export enum QuestionType {
  SINGLE_CHOICE = 'SINGLE_CHOICE',
  MULTIPLE_CHOICE = 'MULTIPLE_CHOICE',
  TRUE_FALSE = 'TRUE_FALSE',
  TEXT = 'TEXT',
  FILL_BLANK = 'FILL_BLANK',
}

export interface CourseCategory {
  id: string;
  name: string;
  description?: string;
  icon?: string;
  color?: string;
  parentId?: string;
  sortOrder: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  parent?: CourseCategory;
  children?: CourseCategory[];
}

export interface Course {
  id: string;
  title: string;
  description?: string;
  courseType: CourseType;
  status: CourseStatus;
  categoryId?: string;
  tags: string[];
  thumbnailUrl?: string;
  duration?: number;
  level?: string;
  publishedAt?: string;
  validFrom?: string;
  validUntil?: string;
  certificateTemplateId?: string;
  passingScore: number;
  maxAttempts?: number;
  isComplianceCourse: boolean;
  ehsRelevant: boolean;
  renewalMonths?: number;
  createdById: string;
  updatedById: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  category?: CourseCategory;
  createdBy?: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
  updatedBy?: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
  lessons?: Lesson[];
  _count?: {
    lessons: number;
    enrollments: number;
    assignments: number;
  };
}

export interface Lesson {
  id: string;
  courseId: string;
  title: string;
  description?: string;
  order: number;
  contentType: string;
  content?: string;
  videoUrl?: string;
  duration?: number;
  attachments?: any;
  isOptional: boolean;
  completionCriteria?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  course?: {
    id: string;
    title: string;
  };
  quiz?: Quiz;
}

export interface Quiz {
  id: string;
  lessonId: string;
  title: string;
  description?: string;
  timeLimit?: number;
  shuffleQuestions: boolean;
  shuffleAnswers: boolean;
  showResults: boolean;
  passingScore: number;
  createdAt: string;
  updatedAt: string;
  lesson?: {
    id: string;
    title: string;
    courseId: string;
  };
  questions?: Question[];
  _count?: {
    questions: number;
  };
}

export interface Question {
  id: string;
  quizId: string;
  questionText: string;
  questionType: QuestionType;
  points: number;
  order: number;
  explanation?: string;
  caseSensitive: boolean;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  answers?: Answer[];
}

export interface Answer {
  id: string;
  questionId: string;
  answerText: string;
  isCorrect: boolean;
  order: number;
  createdAt: string;
  updatedAt: string;
}

export interface Enrollment {
  id: string;
  userId: string;
  courseId: string;
  status: EnrollmentStatus;
  enrolledAt: string;
  startedAt?: string;
  completedAt?: string;
  expiresAt?: string;
  progressPercent: number;
  score?: number;
  attempts: number;
  certificateIssued: boolean;
  certificateUrl?: string;
  certificateIssuedAt?: string;
  assignmentId?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
  user?: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
  course?: Course;
  lessonProgress?: LessonProgress[];
  quizAttempts?: QuizAttempt[];
}

export interface LessonProgress {
  id: string;
  enrollmentId: string;
  lessonId: string;
  status: string;
  startedAt?: string;
  completedAt?: string;
  timeSpent: number;
  lastPosition?: number;
  createdAt: string;
  updatedAt: string;
  lesson?: Lesson;
}

export interface QuizAttempt {
  id: string;
  enrollmentId: string;
  quizId: string;
  attemptNumber: number;
  startedAt: string;
  completedAt?: string;
  score: number;
  passed: boolean;
  timeSpent?: number;
  createdAt: string;
  updatedAt: string;
  quiz?: Quiz;
  responses?: QuestionResponse[];
}

export interface QuestionResponse {
  id: string;
  attemptId: string;
  questionId: string;
  selectedAnswers?: any;
  textResponse?: string;
  isCorrect: boolean;
  points: number;
  createdAt: string;
  question?: Question;
}

export interface CourseAssignment {
  id: string;
  courseId: string;
  assignedToUserIds: string[];
  assignedToGroupIds: string[];
  dueDate?: string;
  reminderDays: number[];
  assignedById: string;
  assignedAt: string;
  notes?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  course?: {
    id: string;
    title: string;
  };
  assignedBy?: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
  _count?: {
    enrollments: number;
  };
}

export interface CourseAnalytics {
  course: Course;
  totalEnrollments: number;
  completedCount: number;
  inProgressCount: number;
  notStartedCount: number;
  averageScore: number;
  averageProgress: number;
  completionRate: number;
}

export interface UserLearningStats {
  totalCourses: number;
  completedCourses: number;
  inProgressCourses: number;
  averageScore: number;
  certificatesEarned: number;
  completionRate: number;
}
