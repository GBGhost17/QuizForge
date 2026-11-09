import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { MarkdownMathPreview } from './MarkdownMathPreview';

describe('MarkdownMathPreview', () => {
  it('renders plain markdown text with paragraphs', () => {
    const { container } = render(<MarkdownMathPreview content="Hello **QuizForge**" />);
    expect(container.textContent).toContain('Hello QuizForge');
    expect(container.querySelector('strong')?.textContent).toBe('QuizForge');
  });

  it('renders inline math expressions with KaTeX', () => {
    const { container } = render(
      <MarkdownMathPreview content="Công thức $E = mc^2$ của Einstein" />,
    );
    expect(container.textContent).toContain('Công thức');
    // KaTeX wraps math in span.katex
    const katexElement = container.querySelector('.katex');
    expect(katexElement).toBeTruthy();
  });

  it('renders display math block equations with KaTeX', () => {
    const { container } = render(
      <MarkdownMathPreview content={'$$\n\\lim_{x \\to \\infty} \\frac{1}{x} = 0\n$$'} />,
    );
    const katexElement = container.querySelector('.katex');
    expect(katexElement).toBeTruthy();
  });

  it('returns null for empty content without throwing', () => {
    const { container } = render(<MarkdownMathPreview content="" />);
    expect(container.firstChild).toBeNull();
  });

  it('renders complex multiline math solutions with fractions and bold titles', () => {
    const solution = `**a) Tính $C(x) = A(x) + B(x)$ và tìm nghiệm của $C(x)$:**
Ta có: $C(x) = (2x^3 - 3x^2 + 5x - 4) + (-2x^3 + 3x^2 - x - 2)$
$= 4x - 6$.
Cho $C(x) = 0 \\iff x = \\frac{6}{4} = 1{,}5$.`;

    const { container } = render(<MarkdownMathPreview content={solution} />);
    expect(container.querySelector('strong')).toBeTruthy();
    expect(container.querySelector('strong')?.textContent).toContain('a) Tính');
    const katexList = container.querySelectorAll('.katex');
    expect(katexList.length).toBeGreaterThan(0);
  });
});
