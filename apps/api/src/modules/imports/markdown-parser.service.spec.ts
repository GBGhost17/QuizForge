import { Test, TestingModule } from '@nestjs/testing';
import * as fs from 'fs';
import * as path from 'path';
import { MarkdownParserService } from './markdown-parser.service';

describe('MarkdownParserService', () => {
  let service: MarkdownParserService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [MarkdownParserService],
    }).compile();

    service = module.get<MarkdownParserService>(MarkdownParserService);
  });

  const getFixturePath = (filename: string): string => {
    return path.join(__dirname, '../../../test/fixtures/markdown', filename);
  };

  it('parses valid markdown fixture with all 5 question types and LaTeX', async () => {
    const content = fs.readFileSync(getFixturePath('valid-all-types.md'), 'utf-8');
    const result = await service.parse(content);

    expect(result.hasErrors).toBe(false);
    expect(result.title).toBe('Đề thi Toán và Khoa học máy tính');
    expect(result.subject).toBe('Khoa học tự nhiên');
    expect(result.tags).toEqual(['toan', 'cntt', 'lap-trinh']);
    expect(result.questions).toHaveLength(5);

    // Q1: SINGLE_CHOICE
    const q1 = result.questions[0];
    expect(q1).toBeDefined();
    expect(q1?.type).toBe('SINGLE_CHOICE');
    expect(q1?.prompt).toContain('Nghiệm của phương trình $2x - 4 = 0$');
    expect(q1?.options).toHaveLength(4);
    expect(q1?.options?.filter((o) => o.isCorrect)).toHaveLength(1);
    expect(q1?.options?.find((o) => o.isCorrect)?.text).toBe('$x = 2$');
    expect(q1?.options?.find((o) => o.isCorrect)?.explanation).toContain('$2x = 4');

    // Q2: MULTIPLE_CHOICE
    const q2 = result.questions[1];
    expect(q2).toBeDefined();
    expect(q2?.type).toBe('MULTIPLE_CHOICE');
    expect(q2?.options?.filter((o) => o.isCorrect)).toHaveLength(3);

    // Q3: TRUE_FALSE
    const q3 = result.questions[2];
    expect(q3).toBeDefined();
    expect(q3?.type).toBe('TRUE_FALSE');
    expect(q3?.options).toHaveLength(2);
    expect(q3?.options?.find((o) => o.isCorrect)?.text).toBe('Đúng');

    // Q4: SHORT_ANSWER
    const q4 = result.questions[3];
    expect(q4).toBeDefined();
    expect(q4?.type).toBe('SHORT_ANSWER');
    expect(q4?.rubric?.acceptedAnswers).toEqual(['0', 'không']);
    expect(q4?.prompt).toContain('\\lim_{x \\to \\infty}');

    // Q5: ESSAY
    const q5 = result.questions[4];
    expect(q5).toBeDefined();
    expect(q5?.rubric?.modelAnswer).toContain('Hàm đệ quy');
  });

  it('generates line-accurate diagnostics for malformed questions', async () => {
    const content = fs.readFileSync(getFixturePath('malformed-errors.md'), 'utf-8');
    const result = await service.parse(content);

    expect(result.hasErrors).toBe(true);
    expect(result.diagnostics.length).toBeGreaterThanOrEqual(3);

    // Q1 has 2 correct answers for SINGLE_CHOICE
    const q1Error = result.diagnostics.find(
      (d) => d.questionIndex === 1 && d.message.includes('SINGLE_CHOICE'),
    );
    expect(q1Error).toBeDefined();
    expect(q1Error?.line).toBe(1);
    expect(q1Error?.remediation).toContain('duy nhất 1');

    // Q2 has 0 correct answers for MULTIPLE_CHOICE
    const q2Error = result.diagnostics.find(
      (d) => d.questionIndex === 2 && d.message.includes('MULTIPLE_CHOICE'),
    );
    expect(q2Error).toBeDefined();
    expect(q2Error?.line).toBe(11);

    // Q3 has empty prompt
    const q3Error = result.diagnostics.find(
      (d) => d.questionIndex === 3 && d.message.includes('nội dung đề bài'),
    );
    expect(q3Error).toBeDefined();
    expect(q3Error?.line).toBe(21);
  });

  it('detects and flags dangerous security injections with exact lines', async () => {
    const content = fs.readFileSync(getFixturePath('malicious-injection.md'), 'utf-8');
    const result = await service.parse(content);

    expect(result.hasErrors).toBe(true);
    const scriptError = result.diagnostics.find((d) => d.message.includes('<script>'));
    const onerrorError = result.diagnostics.find((d) => d.message.includes('sự kiện HTML'));
    const jsUrlError = result.diagnostics.find((d) => d.message.includes('javascript:'));

    expect(scriptError).toBeDefined();
    expect(onerrorError).toBeDefined();
    expect(jsUrlError).toBeDefined();
  });

  it('preserves Vietnamese diacritics and mathematical notation', async () => {
    const content = fs.readFileSync(getFixturePath('unicode-vietnamese.md'), 'utf-8');
    const result = await service.parse(content);

    expect(result.hasErrors).toBe(false);
    expect(result.questions).toHaveLength(2);
    expect(result.questions[0]?.prompt).toContain('Văn học Việt Nam thế kỷ XX');
    expect(result.questions[0]?.options?.find((o) => o.isCorrect)?.text).toBe('Vũ Trọng Phụng');
    expect(result.questions[1]?.prompt).toContain('\\int_0^1 x \\, dx = ?');
  });

  it('returns diagnostic when content is empty', async () => {
    const result = await service.parse('   \n  ');
    expect(result.hasErrors).toBe(true);
    expect(result.diagnostics[0]?.message).toContain('rỗng');
  });

  it('preserves bold formatting, step-by-step newlines and KaTeX formulas in prompt and explanation', async () => {
    const md = `## Q1: Bài toán đa thức
> type: SHORT_ANSWER
> points: 2.0
> acceptedAnswers: [1.5, 1,5]
> explanation: Gọi số học sinh là $a, b, c$ ($a, b, c \\in \\mathbb{N}^*$). Ta có $\\frac{a}{3} = \\frac{b}{4} = \\frac{c}{5}$
> Suy ra số học sinh là $c = 40$.

**a) Tính $C(x) = A(x) + B(x)$ và tìm nghiệm của $C(x)$:**
Ta có: $C(x) = (2x^3 - 3x^2 + 5x - 4) + (-2x^3 + 3x^2 - x - 2)$
$= 4x - 6$.
Cho $C(x) = 0 \\iff 4x - 6 = 0 \\iff x = 1{,}5$.
`;
    const result = await service.parse(md);
    expect(result.hasErrors).toBe(false);
    expect(result.questions).toHaveLength(1);

    const q = result.questions[0];
    expect(q?.prompt).toContain('**a) Tính $C(x) = A(x) + B(x)$ và tìm nghiệm của $C(x)$:**');
    expect(q?.prompt).toContain('$= 4x - 6$.');
    expect(q?.explanation).toContain('\\frac{a}{3} = \\frac{b}{4} = \\frac{c}{5}');
    expect(q?.explanation).toContain('Suy ra số học sinh là $c = 40$.');
  });
});
