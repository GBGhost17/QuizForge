import type { QuestionType } from './question-bank';

export type AttemptStatus =
  'IN_PROGRESS' | 'SUBMITTED' | 'AUTO_GRADED' | 'PENDING_REVIEW' | 'FINALIZED' | 'RELEASED';

export interface SanitizedOption {
  id: string;
  text: string;
  order: number;
}

export interface AttemptQuestion {
  snapshotId: string;
  order: number;
  points: number;
  type: QuestionType;
  prompt: string;
  options: SanitizedOption[];
}

export interface SavedAnswer {
  snapshotId: string;
  selectedOptionIds?: string[];
  textAnswer?: string;
  updatedAt: string;
}

export interface AttemptDetail {
  id: string;
  versionId: string;
  sessionId?: string | null;
  userId: string;
  attemptNumber: number;
  status: AttemptStatus;
  totalPoints: number;
  startedAt: string;
  submittedAt?: string | null;
  expiresAt?: string | null;
  serverTime: string;
  timeLimitMinutes?: number | null;
  title: string;
  instructions?: string | null;
  questions: AttemptQuestion[];
  answers: Record<string, SavedAnswer>;
}

export interface SessionPreview {
  sessionId: string;
  joinCode: string;
  testTitle: string;
  description?: string | null;
  instructions?: string | null;
  authorName: string;
  timeLimitMinutes?: number | null;
  totalQuestions: number;
  totalPoints: number;
  maxAttempts: number;
  usedAttempts: number;
  activeAttemptId?: string | null;
  canAttempt: boolean;
  reason?: string;
}

export interface SaveAnswerItem {
  snapshotId: string;
  selectedOptionIds?: string[];
  textAnswer?: string;
}

export interface SaveAnswersBatchDto {
  answers: SaveAnswerItem[];
}

export interface SaveAnswersResponse {
  success: boolean;
  savedCount: number;
  serverTime: string;
}

export interface SubmitAttemptResponse {
  id: string;
  status: AttemptStatus;
  submittedAt: string;
  message: string;
}

export interface AttemptSummary {
  id: string;
  versionId: string;
  sessionId?: string | null;
  testTitle: string;
  attemptNumber: number;
  status: AttemptStatus;
  startedAt: string;
  submittedAt?: string | null;
  score?: number | null;
  totalPoints: number;
}
