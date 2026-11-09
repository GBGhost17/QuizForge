import type { QuestionOption, QuestionRubric, QuestionType } from './question-bank';

export type TestMode = 'ASSIGNMENT' | 'PRACTICE' | 'LIVE';

export type TestStatus = 'DRAFT' | 'PUBLISHED' | 'CLOSED' | 'ARCHIVED';

export type ResultReleaseMode = 'ON_FINALIZATION' | 'AFTER_ALL_GRADED' | 'MANUAL';

export type SessionStatus = 'UPCOMING' | 'ACTIVE' | 'ENDED';

export interface TestQuestionSnapshot {
  id: string;
  versionId: string;
  questionId?: string | null;
  order: number;
  points: number;
  type: QuestionType;
  prompt: string;
  explanation?: string | null;
  options: QuestionOption[];
  rubric?: QuestionRubric | null;
  createdAt: string;
}

export interface TestSession {
  id: string;
  versionId: string;
  joinCode?: string | null;
  title?: string | null;
  status: SessionStatus;
  startsAt?: string | null;
  endsAt?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface TestVersion {
  id: string;
  testId: string;
  versionNumber: number;
  title: string;
  description?: string | null;
  instructions?: string | null;
  timeLimitMinutes?: number | null;
  maxAttempts: number;
  shuffleQuestions: boolean;
  shuffleOptions: boolean;
  releaseMode: ResultReleaseMode;
  passScore?: number | null;
  totalPoints: number;
  isPublished: boolean;
  publishedAt?: string | null;
  createdAt: string;
  questionSnapshots?: TestQuestionSnapshot[];
  sessions?: TestSession[];
}

export interface Test {
  id: string;
  authorId: string;
  title: string;
  description?: string | null;
  instructions?: string | null;
  mode: TestMode;
  status: TestStatus;
  createdAt: string;
  updatedAt: string;
  versions?: TestVersion[];
  currentVersion?: TestVersion;
  activeSession?: TestSession;
  _count?: {
    versions: number;
  };
}

// ---------------------------------------------------------
// DTOs & QUERY TYPES
// ---------------------------------------------------------

export interface CreateTestDto {
  title: string;
  description?: string;
  instructions?: string;
  mode?: TestMode;
  timeLimitMinutes?: number | null;
  maxAttempts?: number;
  shuffleQuestions?: boolean;
  shuffleOptions?: boolean;
  releaseMode?: ResultReleaseMode;
  passScore?: number | null;
}

export interface UpdateTestDto {
  title?: string;
  description?: string;
  instructions?: string;
  mode?: TestMode;
  status?: TestStatus;
  timeLimitMinutes?: number | null;
  maxAttempts?: number;
  shuffleQuestions?: boolean;
  shuffleOptions?: boolean;
  releaseMode?: ResultReleaseMode;
  passScore?: number | null;
}

export interface AddQuestionToTestDto {
  questionId: string;
  points?: number;
  order?: number;
}

export interface AddQuestionsBatchDto {
  questionIds: string[];
  defaultPoints?: number;
}

export interface ReorderQuestionItem {
  snapshotId: string;
  order: number;
  points?: number;
}

export interface ReorderQuestionsDto {
  items: ReorderQuestionItem[];
}

export interface PublishTestDto {
  sessionTitle?: string;
  startsAt?: string | null;
  endsAt?: string | null;
  joinCode?: string;
}

export interface TestQueryDto {
  q?: string;
  status?: TestStatus;
  mode?: TestMode;
  page?: number;
  limit?: number;
}
