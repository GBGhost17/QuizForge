import {
  calculateMathSimilarity,
  calculateQuestionSimilarity,
  calculateTextSimilarity,
  extractQuestionComponents,
  normalizeTextForComparison,
} from './similarity.util';

describe('Similarity Utility', () => {
  describe('normalizeTextForComparison', () => {
    it('normalizes case, math delimiters and punctuation', () => {
      const text = 'Nghiệm của phương trình: $2x - 4 = 0$ là bao nhiêu?';
      const normalized = normalizeTextForComparison(text);
      expect(normalized).toBe('nghiệm của phương trình 2x 4 0 là bao nhiêu');
    });

    it('preserves Vietnamese unicode characters accurately', () => {
      const text = 'Thì Hiện tại đơn & Hiện tại tiếp diễn';
      const normalized = normalizeTextForComparison(text);
      expect(normalized).toBe('thì hiện tại đơn hiện tại tiếp diễn');
    });
  });

  describe('extractQuestionComponents & calculateMathSimilarity', () => {
    it('extracts math formulas and prose separately', () => {
      const text = 'Cho phương trình $$2x^2 - 4x = 0$$. Hãy tìm nghiệm với $x > 0$.';
      const comp = extractQuestionComponents(text);
      expect(comp.hasMath).toBe(true);
      expect(comp.mathExpressions).toEqual(['2x^2 - 4x = 0', 'x > 0']);
      expect(comp.combinedMath).toBe('2x^2-4x=0;x>0');
      expect(comp.prose).toContain('cho phương trình hãy tìm nghiệm với');
    });

    it('calculates math similarity correctly', () => {
      const m1 = '2x^2-4x=0';
      const m2 = '2x^2-4x=0';
      expect(calculateMathSimilarity(m1, m2)).toBe(1.0);

      const m3 = '3y^3+9y=1';
      expect(calculateMathSimilarity(m1, m3)).toBeLessThan(0.4);
    });
  });

  describe('calculateQuestionSimilarity - Focus on Core Question Content', () => {
    it('does NOT flag questions with identical prose when math formulas are different (core focus protection)', () => {
      const q1 = {
        prompt: 'Tính giá trị của biểu thức $P = x^2 + 2x + 1$ với $x = 2$.',
      };
      const q2 = {
        prompt: 'Tính giá trị của biểu thức $Q = 2x^2 - 3x + 5$ với $x = 2$.',
      };

      const score = calculateQuestionSimilarity(q1, q2);
      // Even though prose lead-in is identical, different math formulas prevent duplication!
      expect(score).toBeLessThan(0.6);
      expect(score).toBeLessThan(0.85); // Well below the 85% threshold
    });

    it('detects high similarity when math formulas and prose are both matching', () => {
      const q1 = {
        prompt: 'Nghiệm của phương trình sau là bao nhiêu? $$2x - 6 = 0$$',
      };
      const q2 = {
        prompt: 'Tìm nghiệm của phương trình $$2x - 6 = 0$$',
      };

      const score = calculateQuestionSimilarity(q1, q2);
      // Math formula is 100% identical, prose is similar -> High duplication >= 85%
      expect(score).toBeGreaterThanOrEqual(0.85);
    });

    it('does not flag pure prose questions with common template but different subjects below 85%', () => {
      const q1 = {
        prompt: 'Thủ đô của nước Pháp là gì?',
      };
      const q2 = {
        prompt: 'Thủ đô của nước Ý là gì?',
      };

      const score = calculateQuestionSimilarity(q1, q2);
      // Differing key country entity keeps similarity below 85% threshold
      expect(score).toBeLessThan(0.85);
    });

    it('detects genuine duplicate questions in pure prose (>= 85%)', () => {
      const q1 = {
        prompt: 'Thủ đô của Việt Nam là gì?',
      };
      const q2 = {
        prompt: 'Thủ đô của nước Cộng hòa Xã hội Chủ nghĩa Việt Nam là gì?',
      };

      const score = calculateQuestionSimilarity(q1, q2);
      expect(score).toBeGreaterThanOrEqual(0.85);
    });

    it('reduces similarity score when choice options are completely different', () => {
      const q1 = {
        prompt: 'Chọn khẳng định đúng trong các khẳng định sau:',
        options: [{ text: 'Hàm số đồng biến trên R' }, { text: 'Hàm số nghịch biến trên R' }],
      };
      const q2 = {
        prompt: 'Chọn khẳng định đúng trong các khẳng định sau:',
        options: [{ text: 'Số 2 là số nguyên tố' }, { text: 'Số 4 là số nguyên tố' }],
      };

      const score = calculateQuestionSimilarity(q1, q2);
      // Identical prompt template but completely different options -> reduced score
      expect(score).toBeLessThan(0.85);
    });
  });

  describe('calculateTextSimilarity', () => {
    it('returns 1.0 for identical questions', () => {
      const q1 = 'My mother is in the kitchen. She is cooking dinner.';
      const q2 = 'My mother is in the kitchen. She is cooking dinner.';
      expect(calculateTextSimilarity(q1, q2)).toBe(1.0);
    });

    it('returns 1.0 for questions differing only by formatting and punctuation', () => {
      const q1 = 'Tính giá trị của biểu thức: $x^2 + 2x + 1$ với $x = 3$.';
      const q2 = '**Tính giá trị của biểu thức**: x^2 + 2x + 1 với x = 3!';
      expect(calculateTextSimilarity(q1, q2)).toBe(1.0);
    });

    it('returns low score for completely different questions', () => {
      const q1 = 'Thủ đô của Việt Nam là thành phố nào?';
      const q2 = 'Tính đạo hàm bậc nhất của hàm số y = \\sin(x).';
      const score = calculateTextSimilarity(q1, q2);
      expect(score).toBeLessThan(0.2);
    });
  });
});
