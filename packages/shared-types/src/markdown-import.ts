import type { Difficulty, QuestionType } from './question-bank';

export type MarkdownDiagnosticSeverity = 'ERROR' | 'WARNING' | 'INFO';

export interface ImportDiagnostic {
  line: number;
  column?: number;
  message: string;
  severity: MarkdownDiagnosticSeverity;
  remediation?: string;
  questionIndex?: number;
}

export interface ParsedQuestion {
  type: QuestionType;
  prompt: string;
  topic?: string | null;
  tags?: string[];
  options?: Array<{
    text: string;
    isCorrect: boolean;
    explanation?: string | null;
    order?: number;
  }>;
  rubric?: {
    modelAnswer?: string;
    acceptedAnswers?: string[];
    criteria?: Array<{ description: string; points: number }>;
  } | null;
  explanation?: string | null;
  defaultPoints: number;
  difficulty: Difficulty;
  rawSourceLine: number;
}

export interface MarkdownImportResult {
  title?: string;
  description?: string;
  subject?: string;
  tags?: string[];
  questions: ParsedQuestion[];
  diagnostics: ImportDiagnostic[];
  totalQuestions: number;
  validQuestionsCount: number;
  hasErrors: boolean;
}

export interface MarkdownImportCommitDto {
  bankId: string;
  questions: ParsedQuestion[];
}

export interface MarkdownImportParseDto {
  content: string;
}
