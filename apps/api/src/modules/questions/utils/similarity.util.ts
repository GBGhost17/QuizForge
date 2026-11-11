/**
 * Utility functions for measuring text similarity and detecting duplicate questions.
 */

/**
 * Normalizes text for comparison by lowercasing, stripping markdown/math delimiters,
 * removing punctuation, and collapsing whitespace.
 */
export function normalizeTextForComparison(text: string): string {
  if (!text) return '';
  return text
    .toLowerCase()
    .normalize('NFC')
    // Remove markdown math delimiters ($, $$)
    .replace(/\$\$/g, ' ')
    .replace(/\$/g, ' ')
    // Remove markdown code blocks and formatting characters
    .replace(/```[\s\S]*?```/g, ' ')
    .replace(/[`*_~#>[\]()]/g, ' ')
    // Replace all non-letter and non-number characters with space, preserving all Unicode letters
    .replace(/[^\p{L}\p{N}\s]/gu, ' ')
    // Collapse whitespace
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Calculates Levenshtein edit distance between two strings.
 */
export function levenshteinDistance(a: string, b: string): number {
  if (a === b) return 0;
  if (a.length === 0) return b.length;
  if (b.length === 0) return a.length;

  let prevRow: number[] = Array.from({ length: a.length + 1 }, (_, j) => j);

  for (let i = 1; i <= b.length; i++) {
    const currRow: number[] = [i];
    const bChar = b.charAt(i - 1);

    for (let j = 1; j <= a.length; j++) {
      const aChar = a.charAt(j - 1);
      const cost = bChar === aChar ? 0 : 1;

      const substitution = (prevRow[j - 1] ?? 0) + cost;
      const insertion = (currRow[j - 1] ?? 0) + 1;
      const deletion = (prevRow[j] ?? 0) + 1;

      currRow[j] = Math.min(substitution, insertion, deletion);
    }
    prevRow = currRow;
  }

  return prevRow[a.length] ?? b.length;
}

/**
 * Calculates similarity coefficient (0.0 to 1.0) between two question texts.
 * Combines token-level (word) Dice coefficient with Levenshtein edit ratio.
 */
export function calculateTextSimilarity(text1: string, text2: string): number {
  const s1 = normalizeTextForComparison(text1);
  const s2 = normalizeTextForComparison(text2);

  // Exact match after normalization
  if (s1 === s2) {
    return s1.length > 0 ? 1.0 : 0.0;
  }
  if (!s1 || !s2) {
    return 0.0;
  }

  // Tokenize into words
  const words1 = s1.split(' ').filter(Boolean);
  const words2 = s2.split(' ').filter(Boolean);

  if (words1.length === 0 || words2.length === 0) {
    return 0.0;
  }

  // Calculate word frequency overlap
  const wordMap2 = new Map<string, number>();
  for (const w of words2) {
    wordMap2.set(w, (wordMap2.get(w) || 0) + 1);
  }

  let wordIntersection = 0;
  for (const w of words1) {
    const count2 = wordMap2.get(w) || 0;
    if (count2 > 0) {
      wordIntersection++;
      wordMap2.set(w, count2 - 1);
    }
  }

  // Word-level Dice similarity: 2 * |A ∩ B| / (|A| + |B|)
  const wordDice = (2.0 * wordIntersection) / (words1.length + words2.length);

  // Word-level Overlap similarity: |A ∩ B| / min(|A|, |B|)
  const wordOverlap = wordIntersection / Math.min(words1.length, words2.length);

  // If word overlap is very low, questions share virtually no vocabulary
  if (wordDice < 0.25 && wordOverlap < 0.4) {
    return Math.round(wordDice * 100) / 100;
  }

  // Levenshtein similarity ratio
  const maxLen = Math.max(s1.length, s2.length);
  const editDist = levenshteinDistance(s1, s2);
  const levRatio = Math.max(0, 1.0 - editDist / maxLen);

  // If one question contains the entirety (or >= 90%) of the other
  if (wordOverlap >= 0.9) {
    const score = wordOverlap * 0.7 + wordDice * 0.3;
    return Math.min(1.0, Math.round(score * 100) / 100);
  }

  // In pure prose short questions (<= 10 words):
  // When sentences have substituted words, those differing words are almost always
  // the core entity/subject (e.g. "Pháp" vs "Ý", "Hà Nội" vs "Huế").
  // If words are substituted (neither is a subset of the other), cap similarity strictly below 0.80.
  if (words1.length <= 10 && words2.length <= 10) {
    const minWords = Math.min(words1.length, words2.length);
    if (wordIntersection < minWords) {
      const maxWords = Math.max(words1.length, words2.length);
      const strictRatio = (wordIntersection / maxWords) * 0.9;
      return Math.min(0.8, Math.round(strictRatio * 100) / 100);
    }
  }

  const finalScore = Math.max(
    wordDice,
    levRatio,
    wordDice * 0.7 + levRatio * 0.3,
  );

  return Math.min(1.0, Math.max(0.0, Math.round(finalScore * 100) / 100));
}

export interface ExtractedQuestionComponents {
  mathExpressions: string[];
  combinedMath: string;
  prose: string;
  hasMath: boolean;
}

/**
 * Extracts LaTeX math expressions ($...$ and $$...$$) and decouples them from prose text.
 */
export function extractQuestionComponents(rawText: string): ExtractedQuestionComponents {
  if (!rawText) {
    return { mathExpressions: [], combinedMath: '', prose: '', hasMath: false };
  }

  const mathExpressions: string[] = [];

  // Match $$...$$ display math blocks
  let prose = rawText.replace(/\$\$([\s\S]*?)\$\$/g, (_, math: string) => {
    const trimmed = math.trim();
    if (trimmed) mathExpressions.push(trimmed);
    return ' ';
  });

  // Match $...$ inline math blocks
  prose = prose.replace(/\$([^$\n]+?)\$/g, (_, math: string) => {
    const trimmed = math.trim();
    if (trimmed) mathExpressions.push(trimmed);
    return ' ';
  });

  // Normalized math representation: lowercase and remove all whitespace
  const combinedMath = mathExpressions
    .map((m) => m.toLowerCase().replace(/\s+/g, ''))
    .join(';');

  return {
    mathExpressions,
    combinedMath,
    prose: normalizeTextForComparison(prose),
    hasMath: mathExpressions.length > 0,
  };
}

/**
 * Calculates similarity coefficient (0.0 to 1.0) specifically between math formula contents.
 */
export function calculateMathSimilarity(math1: string, math2: string): number {
  if (!math1 || !math2) return 0.0;
  if (math1 === math2) return 1.0;

  const maxLen = Math.max(math1.length, math2.length);
  if (maxLen === 0) return 1.0;

  const editDist = levenshteinDistance(math1, math2);
  const ratio = Math.max(0, 1.0 - editDist / maxLen);

  return Math.round(ratio * 100) / 100;
}

export interface QuestionComparisonInput {
  prompt: string;
  options?: Array<{ text: string; isCorrect?: boolean }>;
}

/**
 * Core question similarity evaluator.
 * Prioritizes the true focal point of the question (math formulas and key data)
 * over generic prose boilerplate.
 */
export function calculateQuestionSimilarity(
  candidate: QuestionComparisonInput,
  existing: QuestionComparisonInput,
): number {
  const p1 = candidate.prompt || '';
  const p2 = existing.prompt || '';

  const comp1 = extractQuestionComponents(p1);
  const comp2 = extractQuestionComponents(p2);

  let finalSimilarity = 0.0;

  if (p1.trim() === p2.trim()) {
    finalSimilarity = 1.0;
  }
  // CASE 1: Both questions contain mathematical formulas
  else if (comp1.hasMath && comp2.hasMath) {
    const mathSim = calculateMathSimilarity(comp1.combinedMath, comp2.combinedMath);
    const proseSim = calculateTextSimilarity(comp1.prose, comp2.prose);

    // CORE FOCUS GUARD: If math formulas differ significantly (mathSim < 0.70),
    // questions are intrinsically different problems despite identical prose lead-ins!
    if (mathSim < 0.70) {
      finalSimilarity = Math.min(0.40, mathSim * 0.6 + proseSim * 0.1);
    } else {
      // Formulas match closely: math formula is primary focal point (85% weight)
      finalSimilarity = mathSim * 0.85 + proseSim * 0.15;
    }
  }
  // CASE 2: One question has formulas while the other is purely textual
  else if (comp1.hasMath !== comp2.hasMath) {
    const overallSim = calculateTextSimilarity(p1, p2);
    finalSimilarity = Math.min(0.50, overallSim * 0.6);
  }
  // CASE 3: Both questions are textual
  else {
    finalSimilarity = calculateTextSimilarity(p1, p2);
  }

  // SECONDARY CHECK: Choice options (if available on both questions)
  if (
    candidate.options &&
    candidate.options.length > 0 &&
    existing.options &&
    existing.options.length > 0
  ) {
    const optTexts1 = candidate.options
      .map((o) => normalizeTextForComparison(o.text))
      .filter(Boolean);
    const optTexts2 = existing.options
      .map((o) => normalizeTextForComparison(o.text))
      .filter(Boolean);

    if (optTexts1.length > 0 && optTexts2.length > 0) {
      let matchingOpts = 0;
      for (const t1 of optTexts1) {
        if (optTexts2.some((t2) => t1 === t2 || calculateTextSimilarity(t1, t2) >= 0.9)) {
          matchingOpts++;
        }
      }
      const optionsSim = (2.0 * matchingOpts) / (optTexts1.length + optTexts2.length);

      // If options differ completely, this represents different question questions/choices
      if (optionsSim < 0.25) {
        // If prompt is short boilerplate (e.g. "Chọn khẳng định đúng:"), different options mean different questions
        const wordCount = comp1.prose.split(' ').filter(Boolean).length;
        if (wordCount <= 12) {
          finalSimilarity = Math.min(0.5, optionsSim * 0.5 + 0.35);
        } else {
          finalSimilarity *= 0.8;
        }
      } else if (optionsSim >= 0.80 && finalSimilarity >= 0.80) {
        finalSimilarity = Math.min(1.0, finalSimilarity * 0.85 + optionsSim * 0.15);
      }
    }
  }

  return Math.min(1.0, Math.max(0.0, Math.round(finalSimilarity * 100) / 100));
}
