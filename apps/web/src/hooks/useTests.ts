import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../lib/api-client';
import type {
  AddQuestionsBatchDto,
  AddQuestionToTestDto,
  CreateTestDto,
  PaginatedResult,
  PublishTestDto,
  ReorderQuestionsDto,
  Test,
  TestQuestionSnapshot,
  TestQueryDto,
  UpdateTestDto,
} from '@quizforge/shared-types';

export const TESTS_QUERY_KEY = ['tests'] as const;

export function useTests(query: TestQueryDto = {}) {
  return useQuery<PaginatedResult<Test>>({
    queryKey: [...TESTS_QUERY_KEY, query],
    queryFn: async () => {
      const response = await apiClient.get<PaginatedResult<Test>>('/tests', {
        params: query,
      });
      return response.data;
    },
    staleTime: 60 * 1000,
  });
}

export function useTest(id: string | undefined) {
  return useQuery<Test>({
    queryKey: [...TESTS_QUERY_KEY, 'detail', id],
    queryFn: async () => {
      const response = await apiClient.get<Test>(`/tests/${id}`);
      return response.data;
    },
    enabled: Boolean(id),
    staleTime: 60 * 1000,
  });
}

export function useCreateTest() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (dto: CreateTestDto): Promise<Test> => {
      const response = await apiClient.post<Test>('/tests', dto);
      return response.data;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: TESTS_QUERY_KEY });
    },
  });
}

export function useUpdateTest() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, dto }: { id: string; dto: UpdateTestDto }): Promise<Test> => {
      const response = await apiClient.patch<Test>(`/tests/${id}`, dto);
      return response.data;
    },
    onSuccess: (_, variables) => {
      void queryClient.invalidateQueries({ queryKey: TESTS_QUERY_KEY });
      void queryClient.invalidateQueries({
        queryKey: [...TESTS_QUERY_KEY, 'detail', variables.id],
      });
    },
  });
}

export function useDeleteTest() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string): Promise<{ success: boolean; message: string }> => {
      const response = await apiClient.delete<{ success: boolean; message: string }>(
        `/tests/${id}`,
      );
      return response.data;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: TESTS_QUERY_KEY });
    },
  });
}

export function useAddQuestionToTest() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      testId,
      dto,
    }: {
      testId: string;
      dto: AddQuestionToTestDto;
    }): Promise<TestQuestionSnapshot> => {
      const response = await apiClient.post<TestQuestionSnapshot>(
        `/tests/${testId}/questions`,
        dto,
      );
      return response.data;
    },
    onSuccess: (_, variables) => {
      void queryClient.invalidateQueries({
        queryKey: [...TESTS_QUERY_KEY, 'detail', variables.testId],
      });
    },
  });
}

export function useAddQuestionsBatch() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      testId,
      dto,
    }: {
      testId: string;
      dto: AddQuestionsBatchDto;
    }): Promise<{ addedCount: number; test: Test }> => {
      const response = await apiClient.post<{ addedCount: number; test: Test }>(
        `/tests/${testId}/questions/batch`,
        dto,
      );
      return response.data;
    },
    onSuccess: (_, variables) => {
      void queryClient.invalidateQueries({
        queryKey: [...TESTS_QUERY_KEY, 'detail', variables.testId],
      });
    },
  });
}

export function useRemoveQuestionFromTest() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      testId,
      snapshotId,
    }: {
      testId: string;
      snapshotId: string;
    }): Promise<Test> => {
      const response = await apiClient.delete<Test>(`/tests/${testId}/questions/${snapshotId}`);
      return response.data;
    },
    onSuccess: (_, variables) => {
      void queryClient.invalidateQueries({
        queryKey: [...TESTS_QUERY_KEY, 'detail', variables.testId],
      });
    },
  });
}

export function useReorderQuestions() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      testId,
      dto,
    }: {
      testId: string;
      dto: ReorderQuestionsDto;
    }): Promise<Test> => {
      const response = await apiClient.patch<Test>(`/tests/${testId}/questions/reorder`, dto);
      return response.data;
    },
    onSuccess: (_, variables) => {
      void queryClient.invalidateQueries({
        queryKey: [...TESTS_QUERY_KEY, 'detail', variables.testId],
      });
    },
  });
}

export function usePublishTest() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      testId,
      dto = {},
    }: {
      testId: string;
      dto?: PublishTestDto;
    }): Promise<Test> => {
      const response = await apiClient.post<Test>(`/tests/${testId}/publish`, dto);
      return response.data;
    },
    onSuccess: (_, variables) => {
      void queryClient.invalidateQueries({ queryKey: TESTS_QUERY_KEY });
      void queryClient.invalidateQueries({
        queryKey: [...TESTS_QUERY_KEY, 'detail', variables.testId],
      });
    },
  });
}

export function useCloseTest() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (testId: string): Promise<Test> => {
      const response = await apiClient.post<Test>(`/tests/${testId}/close`);
      return response.data;
    },
    onSuccess: (_, testId) => {
      void queryClient.invalidateQueries({ queryKey: TESTS_QUERY_KEY });
      void queryClient.invalidateQueries({
        queryKey: [...TESTS_QUERY_KEY, 'detail', testId],
      });
    },
  });
}
