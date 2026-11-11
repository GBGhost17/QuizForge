import React, { useState, useEffect, useRef } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { MarkdownMathPreview } from './MarkdownMathPreview';

export interface ExpandableDescriptionProps {
  content?: string | null;
  className?: string;
  collapsedMaxHeight?: number;
  emptyText?: string;
}

/**
 * Renders a compact expandable markdown description.
 * Shows a preview portion with fade overlay and a "Xem thêm" / "Thu gọn" toggle
 * to maintain balanced visual hierarchy across page elements.
 */
export const ExpandableDescription: React.FC<ExpandableDescriptionProps> = ({
  content,
  className = '',
  collapsedMaxHeight = 72,
  emptyText = 'Chưa có mô tả cho ngân hàng câu hỏi này.',
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [canExpand, setCanExpand] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!content || !content.trim()) {
      setCanExpand(false);
      return;
    }

    const el = contentRef.current;
    // Heuristic for jsdom / headless environments where scrollHeight may evaluate to 0
    const hasMultipleLines = content.includes('\n\n') || (content.match(/\n/g) || []).length >= 2;
    const isLongText = content.trim().length > 150;

    if (el && el.scrollHeight > 0) {
      setCanExpand(el.scrollHeight > collapsedMaxHeight + 4);
    } else {
      setCanExpand(hasMultipleLines || isLongText);
    }
  }, [content, collapsedMaxHeight]);

  if (!content || !content.trim()) {
    return <p className="text-sm text-slate-400 italic">{emptyText}</p>;
  }

  return (
    <div
      className={`rounded-xl border border-slate-200/70 bg-slate-50/80 p-3 text-sm text-slate-600 dark:border-slate-800/80 dark:bg-slate-800/50 dark:text-slate-300 ${className}`}
    >
      <div
        ref={contentRef}
        style={{
          maxHeight: isExpanded || !canExpand ? 'none' : `${collapsedMaxHeight}px`,
        }}
        className="relative overflow-hidden transition-[max-height] duration-200 ease-in-out"
      >
        <MarkdownMathPreview content={content} />
        {canExpand && !isExpanded && (
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-x-0 bottom-0 h-8 bg-gradient-to-t from-slate-50 via-slate-50/70 to-transparent dark:from-slate-800 dark:via-slate-800/70"
          />
        )}
      </div>

      {canExpand && (
        <div className="mt-1.5 flex items-center justify-start border-t border-slate-200/50 pt-1.5 dark:border-slate-700/50">
          <button
            type="button"
            onClick={() => setIsExpanded((prev) => !prev)}
            className="inline-flex items-center gap-1 text-xs font-medium text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 dark:hover:text-indigo-300 transition-colors cursor-pointer select-none"
            aria-expanded={isExpanded}
          >
            <span>{isExpanded ? 'Thu gọn' : 'Xem thêm'}</span>
            {isExpanded ? (
              <ChevronUp className="h-3.5 w-3.5" />
            ) : (
              <ChevronDown className="h-3.5 w-3.5" />
            )}
          </button>
        </div>
      )}
    </div>
  );
};
