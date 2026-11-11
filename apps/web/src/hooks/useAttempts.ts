import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../lib/api-client';
import type {
  AttemptDetail,
  AttemptSummary,
  SaveAnswersBatchDto,
  SaveAnswersResponse,
  SessionPreview,
  SubmitAttemptResponse,
} from '@quizforge/shared-types';

export const ATTEMPTS_QUERY_KEY = 'attempts';
export const SESSIONS_QUERY_KEY = 'sessions';

/**
 * Hook xem trước thông tin phòng thi theo mã phòng 6 ký tự
 */
export function useJoinSessionPreview(joinCode: string, enabled = true) {
  const cleanCode = joinCode.trim().toUpperCase();
  const isValidFormat = /^[A-Z0-9]{6}$/.test(cleanCode);

  return useQuery<SessionPreview>({
    queryKey: [SESSIONS_QUERY_KEY, 'join', cleanCode],
    queryFn: async () => {
      const { data } = await apiClient.get<SessionPreview>(`/sessions/join/${cleanCode}`);
      return data;
    },
    enabled: enabled && isValidFormat,
    staleTime: 30000,
    retry: false,
  });
}

/**
 * Hook bắt đầu làm bài hoặc tiếp tục bài thi dở dang
 */
export function useStartOrResumeAttempt() {
  const queryClient = useQueryClient();

  return useMutation<AttemptDetail, Error, string>({
    mutationFn: async (joinCode: string) => {
      const cleanCode = joinCode.trim().toUpperCase();
      const { data } = await apiClient.post<AttemptDetail>(`/sessions/join/${cleanCode}/start`);
      return data;
    },
    onSuccess: (attempt) => {
      queryClient.setQueryData([ATTEMPTS_QUERY_KEY, attempt.id], attempt);
      queryClient.invalidateQueries({ queryKey: [ATTEMPTS_QUERY_KEY] });
      queryClient.invalidateQueries({ queryKey: [SESSIONS_QUERY_KEY] });
    },
  });
}

/**
 * Hook lấy chi tiết bài thi theo attemptId
 */
export function useAttemptDetail(attemptId?: string) {
  return useQuery<AttemptDetail>({
    queryKey: [ATTEMPTS_QUERY_KEY, attemptId],
    queryFn: async () => {
      const { data } = await apiClient.get<AttemptDetail>(`/attempts/${attemptId}`);
      return data;
    },
    enabled: Boolean(attemptId),
    staleTime: 5000,
  });
}

/**
 * Hook tự động lưu danh sách câu trả lời
 */
export function useSaveAnswers() {
  return useMutation<
    SaveAnswersResponse,
    Error,
    { attemptId: string; payload: SaveAnswersBatchDto }
  >({
    mutationFn: async ({ attemptId, payload }) => {
      const { data } = await apiClient.patch<SaveAnswersResponse>(
        `/attempts/${attemptId}/answers`,
        payload,
      );
      return data;
    },
  });
}

/**
 * Hook nộp bài thi
 */
export function useSubmitAttempt() {
  const queryClient = useQueryClient();

  return useMutation<SubmitAttemptResponse, Error, string>({
    mutationFn: async (attemptId: string) => {
      const { data } = await apiClient.post<SubmitAttemptResponse>(`/attempts/${attemptId}/submit`);
      return data;
    },
    onSuccess: (_, attemptId) => {
      queryClient.invalidateQueries({ queryKey: [ATTEMPTS_QUERY_KEY, attemptId] });
      queryClient.invalidateQueries({ queryKey: [ATTEMPTS_QUERY_KEY] });
    },
  });
}

/**
 * Hook lấy lịch sử các bài làm của thí sinh
 */
export function useUserAttempts() {
  return useQuery<AttemptSummary[]>({
    queryKey: [ATTEMPTS_QUERY_KEY, 'my-history'],
    queryFn: async () => {
      const { data } = await apiClient.get<AttemptSummary[]>('/attempts');
      return data;
    },
  });
}
