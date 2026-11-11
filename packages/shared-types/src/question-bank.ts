/**
 * Question Bank and Question domain contracts shared across web and api.
 */

export type QuestionType =
  'SINGLE_CHOICE' | 'MULTIPLE_CHOICE' | 'TRUE_FALSE' | 'SHORT_ANSWER' | 'ESSAY';

export type Difficulty = 'EASY' | 'MEDIUM' | 'HARD';

export interface QuestionOption {
  id: string;
  questionId: string;
  text: string;
  isCorrect: boolean;
  explanation?: string | null;
  order: number;
  createdAt: string;
}

export interface RubricCriterion {
  description: string;
  points: number;
}

export interface QuestionRubric {
  criteria?: RubricCriterion[];
  modelAnswer?: string;
  acceptedAnswers?: string[];
  caseSensitive?: boolean;
}

export interface Question {
  id: string;
  bankId: string;
  type: QuestionType;
  prompt: string;
  explanation?: string | null;
  topic?: string | null;
  tags: string[];
  difficulty: Difficulty;
  defaultPoints: number;
  rubric?: QuestionRubric | null;
  isArchived: boolean;
  createdAt: string;
  updatedAt: string;
  options: QuestionOption[];
}

export interface QuestionBank {
  id: string;
  ownerId: string;
  title: string;
  description?: string | null;
  isArchived: boolean;
  createdAt: string;
  updatedAt: string;
  _count?: {
    questions: number;
  };
}

// ---------------------------------------------------------
// DTOs & QUERY TYPES
// ---------------------------------------------------------

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface PaginatedResult<T> {
  data: T[];
  meta: PaginationMeta;
}

export interface CreateQuestionBankDto {
  title: string;
  description?: string;
}

export interface UpdateQuestionBankDto {
  title?: string;
  description?: string;
  isArchived?: boolean;
}

export interface CreateQuestionOptionDto {
  id?: string;
  text: string;
  isCorrect: boolean;
  explanation?: string;
  order?: number;
}

export interface CreateQuestionDto {
  prompt: string;
  type: QuestionType;
  difficulty?: Difficulty;
  defaultPoints?: number;
  topic?: string;
  tags?: string[];
  explanation?: string;
  rubric?: QuestionRubric;
  options?: CreateQuestionOptionDto[];
}

export interface UpdateQuestionDto {
  prompt?: string;
  type?: QuestionType;
  difficulty?: Difficulty;
  defaultPoints?: number;
  topic?: string;
  tags?: string[];
  explanation?: string;
  rubric?: QuestionRubric;
  isArchived?: boolean;
  options?: CreateQuestionOptionDto[];
}

export interface QuestionBankQueryDto {
  q?: string;
  isArchived?: boolean;
  page?: number;
  limit?: number;
}

export interface QuestionQueryDto {
  q?: string;
  type?: QuestionType;
  difficulty?: Difficulty;
  topic?: string;
  isArchived?: boolean;
  page?: number;
  limit?: number;
}

export interface DuplicateCheckItemDto {
  prompt: string;
  type?: QuestionType;
  options?: Array<{ text: string; isCorrect?: boolean }>;
}

export interface CheckDuplicatesDto {
  questions: DuplicateCheckItemDto[];
  threshold?: number;
}

export interface DuplicateMatch {
  newQuestionIndex: number;
  newQuestionPrompt: string;
  newQuestionType?: QuestionType;
  existingQuestionId: string;
  existingQuestionPrompt: string;
  existingQuestionType?: QuestionType;
  existingQuestionOptions?: Array<{ text: string; isCorrect: boolean }>;
  similarity: number;
}

export interface CheckDuplicatesResult {
  hasDuplicates: boolean;
  totalChecked: number;
  duplicateCount: number;
  duplicates: DuplicateMatch[];
}
