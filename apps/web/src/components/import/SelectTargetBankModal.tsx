import React, { useState } from 'react';
import {
  FolderPlus,
  Search,
  CheckCircle2,
  X,
  Layers,
  FileText,
  AlertCircle,
  Plus,
} from 'lucide-react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Badge } from '../ui/badge';
import { Alert, AlertDescription } from '../ui/alert';
import { LoadingSpinner } from '../common/LoadingSpinner';
import { useQuestionBanks, useCreateQuestionBank } from '../../hooks/useQuestionBanks';

interface SelectTargetBankModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectAndCommit: (bankId: string) => Promise<void>;
  defaultTitle?: string;
  defaultDescription?: string;
  questionsCount: number;
  isCommitting?: boolean;
}

export function SelectTargetBankModal({
  isOpen,
  onClose,
  onSelectAndCommit,
  defaultTitle = '',
  defaultDescription = '',
  questionsCount,
  isCommitting = false,
}: SelectTargetBankModalProps) {
  const [mode, setMode] = useState<'SELECT' | 'CREATE'>('SELECT');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedBankId, setSelectedBankId] = useState<string | null>(null);

  // Form states for creating a new bank on the fly
  const [newBankTitle, setNewBankTitle] = useState(defaultTitle || '');
  const [newBankDescription, setNewBankDescription] = useState(defaultDescription || '');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const { data: banksData, isLoading: isBanksLoading } = useQuestionBanks({
    q: searchTerm || undefined,
    limit: 50,
  });

  const createBankMutation = useCreateQuestionBank();

  if (!isOpen) return null;

  const banks = banksData?.data || [];

  const handleConfirmSelect = async () => {
    if (!selectedBankId) return;
    setErrorMessage(null);
    try {
      await onSelectAndCommit(selectedBankId);
      onClose();
    } catch (err: unknown) {
      setErrorMessage(
        err instanceof Error ? err.message : 'Có lỗi xảy ra khi nhập câu hỏi vào ngân hàng.',
      );
    }
  };

  const handleCreateAndCommit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBankTitle.trim()) {
      setErrorMessage('Vui lòng nhập tiêu đề ngân hàng câu hỏi.');
      return;
    }

    setErrorMessage(null);
    try {
      const newBank = await createBankMutation.mutateAsync({
        title: newBankTitle.trim(),
        description: newBankDescription.trim() || undefined,
      });

      await onSelectAndCommit(newBank.id);
      onClose();
    } catch (err: unknown) {
      setErrorMessage(
        err instanceof Error ? err.message : 'Có lỗi xảy ra khi tạo ngân hàng câu hỏi mới.',
      );
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs overflow-y-auto"
      role="dialog"
      aria-modal="true"
      aria-labelledby="select-bank-modal-title"
    >
      <div className="w-full max-w-xl rounded-2xl bg-white dark:bg-slate-900 shadow-2xl border border-slate-200 dark:border-slate-800 transition-all flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 rounded-xl">
              <Layers className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
            </div>
            <div>
              <h2
                id="select-bank-modal-title"
                className="text-lg font-bold text-slate-900 dark:text-white"
              >
                Chọn ngân hàng câu hỏi đích
              </h2>
              <p className="text-xs text-slate-500">
                Lưu {questionsCount} câu hỏi hợp lệ vào ngân hàng có sẵn hoặc tạo mới.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={isCommitting || createBankMutation.isPending}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Switcher: Select Existing vs Create New */}
        <div className="flex border-b border-slate-100 dark:border-slate-800 px-5 pt-2 gap-4 text-xs font-semibold">
          <button
            type="button"
            onClick={() => setMode('SELECT')}
            className={`pb-2.5 border-b-2 transition-colors flex items-center gap-1.5 cursor-pointer ${
              mode === 'SELECT'
                ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            Chọn ngân hàng có sẵn ({banks.length})
          </button>
          <button
            type="button"
            onClick={() => {
              setMode('CREATE');
              if (!newBankTitle && defaultTitle) {
                setNewBankTitle(defaultTitle);
              }
            }}
            className={`pb-2.5 border-b-2 transition-colors flex items-center gap-1.5 cursor-pointer ${
              mode === 'CREATE'
                ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Plus className="w-3.5 h-3.5" />
            Tạo ngân hàng mới
          </button>
        </div>

        {/* Body */}
        <div className="p-5 overflow-y-auto space-y-4 flex-1">
          {errorMessage && (
            <Alert variant="error">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{errorMessage}</AlertDescription>
            </Alert>
          )}

          {mode === 'SELECT' ? (
            <div className="space-y-3">
              {/* Search bar */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Tìm kiếm ngân hàng câu hỏi..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 py-2 pl-9 pr-4 text-xs text-slate-900 dark:text-white placeholder:text-slate-400 focus:border-indigo-600 focus:outline-hidden"
                />
              </div>

              {/* Banks List */}
              {isBanksLoading ? (
                <div className="py-8">
                  <LoadingSpinner label="Đang tải danh sách ngân hàng..." />
                </div>
              ) : banks.length === 0 ? (
                <div className="py-8 text-center space-y-2 border border-dashed border-slate-200 dark:border-slate-800 rounded-xl">
                  <FileText className="h-8 w-8 text-slate-300 dark:text-slate-600 mx-auto" />
                  <p className="text-xs text-slate-500">
                    {searchTerm
                      ? 'Không tìm thấy ngân hàng câu hỏi phù hợp.'
                      : 'Bạn chưa có ngân hàng câu hỏi nào.'}
                  </p>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setMode('CREATE');
                      if (!newBankTitle && defaultTitle) {
                        setNewBankTitle(defaultTitle);
                      }
                    }}
                    className="text-xs"
                  >
                    <Plus className="w-3.5 h-3.5 mr-1" /> Tạo ngân hàng mới ngay
                  </Button>
                </div>
              ) : (
                <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                  {banks.map((bank) => {
                    const isSelected = selectedBankId === bank.id;
                    return (
                      <div
                        key={bank.id}
                        onClick={() => setSelectedBankId(bank.id)}
                        className={`p-3 rounded-xl border text-left cursor-pointer transition-all flex items-start justify-between gap-3 ${
                          isSelected
                            ? 'border-indigo-600 bg-indigo-50/50 dark:bg-indigo-950/30 ring-1 ring-indigo-600'
                            : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800/60 hover:border-slate-300'
                        }`}
                      >
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-semibold text-slate-900 dark:text-white">
                              {bank.title}
                            </span>
                            <Badge variant="secondary" className="text-[10px] py-0 px-1.5">
                              {bank._count?.questions ?? 0} câu
                            </Badge>
                          </div>
                          {bank.description && (
                            <p className="text-[11px] text-slate-500 line-clamp-2 whitespace-pre-line">
                              {bank.description}
                            </p>
                          )}
                        </div>

                        <div className="pt-0.5">
                          <div
                            className={`w-4 h-4 rounded-full border flex items-center justify-center transition-colors ${
                              isSelected
                                ? 'border-indigo-600 bg-indigo-600 text-white'
                                : 'border-slate-300 dark:border-slate-600'
                            }`}
                          >
                            {isSelected && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          ) : (
            <form id="create-bank-form" onSubmit={handleCreateAndCommit} className="space-y-3">
              <Input
                id="modal-new-bank-title"
                label="Tên ngân hàng câu hỏi"
                placeholder="Ví dụ: Toán Giải Tích 12, Đề thi thử đại học..."
                value={newBankTitle}
                onChange={(e) => setNewBankTitle(e.target.value)}
                required
                autoFocus
              />

              <div className="space-y-1">
                <label
                  htmlFor="modal-new-bank-desc"
                  className="block text-xs font-semibold text-slate-700 dark:text-slate-300"
                >
                  Mô tả chi tiết (Tùy chọn)
                </label>
                <textarea
                  id="modal-new-bank-desc"
                  rows={3}
                  value={newBankDescription}
                  onChange={(e) => setNewBankDescription(e.target.value)}
                  placeholder="Ghi chú về mục đích, đối tượng hoặc nội dung của ngân hàng này..."
                  className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 p-2.5 text-xs text-slate-900 dark:text-white placeholder:text-slate-400 focus:border-indigo-600 focus:outline-hidden"
                />
              </div>

              <div className="p-3 rounded-xl bg-indigo-50/60 dark:bg-indigo-950/30 border border-indigo-100 dark:border-indigo-900/50 text-xs text-indigo-900 dark:text-indigo-200 flex items-start gap-2">
                <FolderPlus className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
                <p>
                  Ngân hàng sẽ được khởi tạo tự động và toàn bộ{' '}
                  <strong>{questionsCount} câu hỏi</strong> sẽ được lưu trực tiếp vào ngân hàng mới
                  này!
                </p>
              </div>
            </form>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end p-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onClose}
            disabled={isCommitting || createBankMutation.isPending}
          >
            Hủy
          </Button>

          {mode === 'SELECT' ? (
            <Button
              type="button"
              variant="primary"
              size="sm"
              onClick={handleConfirmSelect}
              disabled={!selectedBankId || isCommitting}
              className="bg-indigo-600 hover:bg-indigo-700 text-white"
            >
              {isCommitting ? (
                <>
                  <LoadingSpinner size="sm" className="mr-1.5" />
                  Đang lưu...
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4 mr-1.5" />
                  Xác nhận & Nhập câu hỏi
                </>
              )}
            </Button>
          ) : (
            <Button
              form="create-bank-form"
              type="submit"
              variant="primary"
              size="sm"
              disabled={!newBankTitle.trim() || createBankMutation.isPending || isCommitting}
              className="bg-indigo-600 hover:bg-indigo-700 text-white"
            >
              {createBankMutation.isPending || isCommitting ? (
                <>
                  <LoadingSpinner size="sm" className="mr-1.5" />
                  Đang tạo & lưu...
                </>
              ) : (
                <>
                  <FolderPlus className="w-4 h-4 mr-1.5" />
                  Tạo & Nhập câu hỏi ngay
                </>
              )}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
