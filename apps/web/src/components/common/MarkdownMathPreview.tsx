import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';

interface MarkdownMathPreviewProps {
  content: string;
  className?: string;
}

/**
 * Renders Markdown rich text with KaTeX mathematical formulas.
 * Supports inline math ($...$) and block display math ($$...$$).
 */
export const MarkdownMathPreview: React.FC<MarkdownMathPreviewProps> = ({
  content,
  className = '',
}) => {
  if (!content) return null;

  return (
    <div
      className={`prose prose-slate max-w-none text-sm text-slate-800 dark:text-slate-200 ${className}`}
    >
      <ReactMarkdown
        remarkPlugins={[remarkMath]}
        rehypePlugins={[rehypeKatex]}
        components={{
          p: ({ children }) => (
            <p className="mb-2 last:mb-0 leading-relaxed whitespace-pre-line">{children}</p>
          ),
          strong: ({ children }) => (
            <strong className="font-semibold text-slate-900 dark:text-slate-100">{children}</strong>
          ),
          em: ({ children }) => <em className="italic">{children}</em>,
          code: ({ children, className: codeClass }) => {
            const isInline = !codeClass;
            if (isInline) {
              return (
                <code className="rounded bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 font-mono text-xs text-indigo-600 dark:text-indigo-400">
                  {children}
                </code>
              );
            }
            return (
              <pre className="overflow-x-auto rounded-lg bg-slate-900 p-3 text-xs text-slate-100 my-2">
                <code>{children}</code>
              </pre>
            );
          },
          blockquote: ({ children }) => (
            <blockquote className="border-l-4 border-indigo-500 pl-3 italic text-slate-600 dark:text-slate-400 my-2">
              {children}
            </blockquote>
          ),
          ul: ({ children }) => <ul className="list-disc pl-5 my-1 space-y-1">{children}</ul>,
          ol: ({ children }) => <ol className="list-decimal pl-5 my-1 space-y-1">{children}</ol>,
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
};
