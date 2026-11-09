import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../lib/api-client';
import type {
  MarkdownImportCommitDto,
  MarkdownImportParseDto,
  MarkdownImportResult,
} from '@quizforge/shared-types';

export function useMarkdownImport() {
  const queryClient = useQueryClient();

  const parseMutation = useMutation({
    mutationFn: async (dto: MarkdownImportParseDto): Promise<MarkdownImportResult> => {
      const response = await apiClient.post<MarkdownImportResult>('/imports/markdown/parse', dto);
      return response.data;
    },
  });

  const commitMutation = useMutation({
    mutationFn: async (
      dto: MarkdownImportCommitDto,
    ): Promise<{ count: number; bankId: string; message: string }> => {
      const response = await apiClient.post<{ count: number; bankId: string; message: string }>(
        '/imports/markdown/commit',
        dto,
      );
      return response.data;
    },
    onSuccess: (data) => {
      // Invalidate questions query for the target bank
      queryClient.invalidateQueries({ queryKey: ['questions', data.bankId] });
      queryClient.invalidateQueries({ queryKey: ['question-banks', data.bankId] });
      queryClient.invalidateQueries({ queryKey: ['question-banks'] });
    },
  });

  return {
    parse: parseMutation.mutateAsync,
    isParsing: parseMutation.isPending,
    parseError: parseMutation.error,
    parseResult: parseMutation.data,
    resetParse: parseMutation.reset,

    commit: commitMutation.mutateAsync,
    isCommitting: commitMutation.isPending,
    commitError: commitMutation.error,
    commitResult: commitMutation.data,
  };
}
