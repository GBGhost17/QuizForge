import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../lib/api-client';
import { QUESTION_BANKS_QUERY_KEY } from './useQuestionBanks';
import type {
  CreateQuestionDto,
  PaginatedResult,
  Question,
  QuestionQueryDto,
  UpdateQuestionDto,
} from '@quizforge/shared-types';

export const QUESTIONS_QUERY_KEY = ['questions'] as const;

export function useQuestions(bankId: string | undefined, query: QuestionQueryDto = {}) {
  return useQuery<PaginatedResult<Question>>({
    queryKey: [...QUESTIONS_QUERY_KEY, bankId, query],
    queryFn: async () => {
      const response = await apiClient.get<PaginatedResult<Question>>(
        `/question-banks/${bankId}/questions`,
        { params: query },
      );
      return response.data;
    },
    enabled: Boolean(bankId),
    staleTime: 60 * 1000,
  });
}

export function useQuestion(id: string | undefined) {
  return useQuery<Question>({
    queryKey: [...QUESTIONS_QUERY_KEY, 'detail', id],
    queryFn: async () => {
      const response = await apiClient.get<Question>(`/questions/${id}`);
      return response.data;
    },
    enabled: Boolean(id),
    staleTime: 60 * 1000,
  });
}

export function useCreateQuestion(bankId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (dto: CreateQuestionDto): Promise<Question> => {
      const response = await apiClient.post<Question>(`/question-banks/${bankId}/questions`, dto);
      return response.data;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: [...QUESTIONS_QUERY_KEY, bankId] });
      void queryClient.invalidateQueries({ queryKey: QUESTION_BANKS_QUERY_KEY });
    },
  });
}

export function useUpdateQuestion(bankId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, dto }: { id: string; dto: UpdateQuestionDto }): Promise<Question> => {
      const response = await apiClient.patch<Question>(`/questions/${id}`, dto);
      return response.data;
    },
    onSuccess: (data) => {
      void queryClient.invalidateQueries({ queryKey: [...QUESTIONS_QUERY_KEY, bankId] });
      queryClient.setQueryData([...QUESTIONS_QUERY_KEY, 'detail', data.id], data);
    },
  });
}

export function useDeleteQuestion(bankId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string): Promise<{ message: string; isArchived: boolean }> => {
      const response = await apiClient.delete<{ message: string; isArchived: boolean }>(
        `/questions/${id}`,
      );
      return response.data;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: [...QUESTIONS_QUERY_KEY, bankId] });
      void queryClient.invalidateQueries({ queryKey: QUESTION_BANKS_QUERY_KEY });
    },
  });
}
