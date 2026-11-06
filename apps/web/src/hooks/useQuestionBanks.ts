import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../lib/api-client';
import type {
  CreateQuestionBankDto,
  PaginatedResult,
  QuestionBank,
  QuestionBankQueryDto,
  UpdateQuestionBankDto,
} from '@quizforge/shared-types';

export const QUESTION_BANKS_QUERY_KEY = ['question-banks'] as const;

export function useQuestionBanks(query: QuestionBankQueryDto = {}) {
  return useQuery<PaginatedResult<QuestionBank>>({
    queryKey: [...QUESTION_BANKS_QUERY_KEY, query],
    queryFn: async () => {
      const response = await apiClient.get<PaginatedResult<QuestionBank>>('/question-banks', {
        params: query,
      });
      return response.data;
    },
    staleTime: 60 * 1000,
  });
}

export function useQuestionBank(id: string | undefined) {
  return useQuery<QuestionBank>({
    queryKey: [...QUESTION_BANKS_QUERY_KEY, 'detail', id],
    queryFn: async () => {
      const response = await apiClient.get<QuestionBank>(`/question-banks/${id}`);
      return response.data;
    },
    enabled: Boolean(id),
    staleTime: 60 * 1000,
  });
}

export function useCreateQuestionBank() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (dto: CreateQuestionBankDto): Promise<QuestionBank> => {
      const response = await apiClient.post<QuestionBank>('/question-banks', dto);
      return response.data;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: QUESTION_BANKS_QUERY_KEY });
    },
  });
}

export function useUpdateQuestionBank() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      dto,
    }: {
      id: string;
      dto: UpdateQuestionBankDto;
    }): Promise<QuestionBank> => {
      const response = await apiClient.patch<QuestionBank>(`/question-banks/${id}`, dto);
      return response.data;
    },
    onSuccess: (data) => {
      void queryClient.invalidateQueries({ queryKey: QUESTION_BANKS_QUERY_KEY });
      queryClient.setQueryData([...QUESTION_BANKS_QUERY_KEY, 'detail', data.id], data);
    },
  });
}

export function useDeleteQuestionBank() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string): Promise<{ message: string; isArchived: boolean }> => {
      const response = await apiClient.delete<{ message: string; isArchived: boolean }>(
        `/question-banks/${id}`,
      );
      return response.data;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: QUESTION_BANKS_QUERY_KEY });
    },
  });
}
