import {
  PrismaClient,
  QuestionType,
  Difficulty,
  TestMode,
  TestStatus,
  UserRole,
  SessionStatus,
} from '@prisma/client';

const prisma = new PrismaClient();

// Sample secure hash placeholder for dev seed (password: QuizForge2026!)
const DEV_PASSWORD_HASH =
  '$argon2id$v=19$m=65536,t=3,p=4$c29tZXNhbHQ$dGVzdF9oYXNoX3F1aXpmb3JnZV8yMDI2';

async function main(): Promise<void> {
  console.log('🌱 Starting QuizForge database seeding...');

  // 1. Seed Users (Teacher, Student, Admin)
  const teacher = await prisma.user.upsert({
    where: { email: 'teacher@quizforge.local' },
    update: {},
    create: {
      email: 'teacher@quizforge.local',
      passwordHash: DEV_PASSWORD_HASH,
      name: 'Thầy Giáo Mẫu',
      role: UserRole.USER,
      isEmailVerified: true,
    },
  });

  const student = await prisma.user.upsert({
    where: { email: 'student@quizforge.local' },
    update: {},
    create: {
      email: 'student@quizforge.local',
      passwordHash: DEV_PASSWORD_HASH,
      name: 'Học Sinh Mẫu',
      role: UserRole.USER,
      isEmailVerified: true,
    },
  });

  await prisma.user.upsert({
    where: { email: 'admin@quizforge.local' },
    update: {},
    create: {
      email: 'admin@quizforge.local',
      passwordHash: DEV_PASSWORD_HASH,
      name: 'Quản Trị Viên',
      role: UserRole.ADMIN,
      isEmailVerified: true,
    },
  });

  console.log('✅ Seeded users:', { teacher: teacher.email, student: student.email });

  // 2. Seed Question Bank
  let bank = await prisma.questionBank.findFirst({
    where: { ownerId: teacher.id, title: 'Ngân hàng Câu hỏi Tin học Căn bản' },
  });

  if (!bank) {
    bank = await prisma.questionBank.create({
      data: {
        ownerId: teacher.id,
        title: 'Ngân hàng Câu hỏi Tin học Căn bản',
        description:
          'Bộ câu hỏi mẫu phục vụ kiểm tra kiến thức mạng máy tính, phần cứng và cơ sở dữ liệu.',
      },
    });
  }

  console.log('✅ Seeded question bank:', bank.title);

  // 3. Seed 5 Representative Questions
  // Q1: SINGLE_CHOICE
  const q1 = await prisma.question.upsert({
    where: { id: '00000000-0000-0000-0000-000000000001' },
    update: {},
    create: {
      id: '00000000-0000-0000-0000-000000000001',
      bankId: bank.id,
      type: QuestionType.SINGLE_CHOICE,
      prompt:
        'Trong mô hình TCP/IP, giao thức nào sau đây hoạt động ở tầng Giao vận (Transport Layer)?',
      explanation: 'TCP (Transmission Control Protocol) và UDP hoạt động ở tầng Giao vận.',
      topic: 'Mạng máy tính',
      tags: ['networking', 'transport-layer', 'tcp-ip'],
      difficulty: Difficulty.EASY,
      defaultPoints: 2.0,
      options: {
        create: [
          { text: 'TCP (Transmission Control Protocol)', isCorrect: true, order: 0 },
          { text: 'HTTP (Hypertext Transfer Protocol)', isCorrect: false, order: 1 },
          { text: 'IP (Internet Protocol)', isCorrect: false, order: 2 },
          { text: 'Ethernet', isCorrect: false, order: 3 },
        ],
      },
    },
  });

  // Q2: MULTIPLE_CHOICE
  const q2 = await prisma.question.upsert({
    where: { id: '00000000-0000-0000-0000-000000000002' },
    update: {},
    create: {
      id: '00000000-0000-0000-0000-000000000002',
      bankId: bank.id,
      type: QuestionType.MULTIPLE_CHOICE,
      prompt: 'Các phát biểu nào sau đây là ĐÚNG về bộ nhớ RAM của máy tính?',
      explanation: 'RAM là bộ nhớ khả biến tốc độ cao, mất dữ liệu khi mất nguồn điện.',
      topic: 'Kiến trúc máy tính',
      tags: ['hardware', 'memory', 'ram'],
      difficulty: Difficulty.MEDIUM,
      defaultPoints: 2.0,
      options: {
        create: [
          {
            text: 'Là bộ nhớ khả biến (mất dữ liệu khi mất nguồn điện)',
            isCorrect: true,
            order: 0,
          },
          {
            text: 'Tốc độ truy xuất nhanh hơn đáng kể so với ổ đĩa SSD/HDD thông thường',
            isCorrect: true,
            order: 1,
          },
          {
            text: 'Được sử dụng làm nơi lưu trữ dữ liệu vĩnh viễn của hệ điều hành',
            isCorrect: false,
            order: 2,
          },
        ],
      },
    },
  });

  // Q3: TRUE_FALSE
  const q3 = await prisma.question.upsert({
    where: { id: '00000000-0000-0000-0000-000000000003' },
    update: {},
    create: {
      id: '00000000-0000-0000-0000-000000000003',
      bankId: bank.id,
      type: QuestionType.TRUE_FALSE,
      prompt:
        'Giao thức HTTPS mã hóa toàn bộ phiên truyền thông bằng TLS/SSL để chống tấn công nghe lén (eavesdropping).',
      explanation: 'HTTPS kết hợp HTTP với mã hóa TLS/SSL để bảo mật dữ liệu trên đường truyền.',
      topic: 'Bảo mật',
      tags: ['security', 'https', 'tls'],
      difficulty: Difficulty.EASY,
      defaultPoints: 2.0,
      options: {
        create: [
          { text: 'Đúng', isCorrect: true, order: 0 },
          { text: 'Sai', isCorrect: false, order: 1 },
        ],
      },
    },
  });

  // Q4: SHORT_ANSWER
  const q4 = await prisma.question.upsert({
    where: { id: '00000000-0000-0000-0000-000000000004' },
    update: {},
    create: {
      id: '00000000-0000-0000-0000-000000000004',
      bankId: bank.id,
      type: QuestionType.SHORT_ANSWER,
      prompt:
        'Trong ngôn ngữ SQL, mệnh đề nào được sử dụng để lọc các bản ghi thỏa mãn điều kiện chỉ định?',
      explanation: 'Mệnh đề WHERE lọc kết quả dựa trên biểu thức điều kiện.',
      topic: 'Cơ sở dữ liệu',
      tags: ['sql', 'database', 'query'],
      difficulty: Difficulty.EASY,
      defaultPoints: 2.0,
      options: {
        create: [
          { text: 'WHERE', isCorrect: true, order: 0 },
          { text: 'where', isCorrect: true, order: 1 },
        ],
      },
    },
  });

  // Q5: ESSAY
  const q5 = await prisma.question.upsert({
    where: { id: '00000000-0000-0000-0000-000000000005' },
    update: {},
    create: {
      id: '00000000-0000-0000-0000-000000000005',
      bankId: bank.id,
      type: QuestionType.ESSAY,
      prompt:
        'So sánh sự khác biệt cơ bản giữa giao thức TCP và UDP (về cơ chế bắt tay, độ tin cậy). Cho ví dụ ứng dụng thực tế cho mỗi loại.',
      explanation:
        'TCP tin cậy (3-way handshake, retransmission), UDP nhanh và hướng phi kết nối (streaming, DNS).',
      topic: 'Mạng máy tính',
      tags: ['networking', 'tcp', 'udp', 'essay'],
      difficulty: Difficulty.HARD,
      defaultPoints: 2.0,
      rubric: {
        criteria: [
          { name: 'Cơ chế thiết lập kết nối (Handshake)', maxPoints: 0.5 },
          { name: 'Độ tin cậy và kiểm soát lỗi', maxPoints: 0.75 },
          { name: 'Ví dụ ứng dụng thực tế (Web vs Streaming/Game)', maxPoints: 0.75 },
        ],
      },
    },
  });

  console.log('✅ Seeded 5 questions (Single, Multiple, T/F, Short Answer, Essay)');

  // 4. Seed Test and Immutable Published Version
  let test = await prisma.test.findFirst({
    where: { authorId: teacher.id, title: 'Bài Kiểm Tra Kiến Thức Mạng & Hệ Thống' },
  });

  if (!test) {
    test = await prisma.test.create({
      data: {
        authorId: teacher.id,
        title: 'Bài Kiểm Tra Kiến Thức Mạng & Hệ Thống',
        description: 'Bài đánh giá kiến thức cơ bản về hệ thống máy tính và mạng viễn thông.',
        instructions: 'Thời gian làm bài 45 phút. Không sử dụng tài liệu.',
        mode: TestMode.ASSIGNMENT,
        status: TestStatus.PUBLISHED,
      },
    });
  }

  // Version 1 Snapshot
  let testVersion = await prisma.testVersion.findUnique({
    where: { testId_versionNumber: { testId: test.id, versionNumber: 1 } },
  });

  if (!testVersion) {
    testVersion = await prisma.testVersion.create({
      data: {
        testId: test.id,
        versionNumber: 1,
        title: 'Bài Kiểm Tra Kiến Thức Mạng & Hệ Thống (v1)',
        description: 'Bản xuất bản chính thức lần 1',
        timeLimitMinutes: 45,
        maxAttempts: 2,
        shuffleQuestions: true,
        shuffleOptions: true,
        totalPoints: 10.0,
        isPublished: true,
        publishedAt: new Date(),
        questionSnapshots: {
          create: [
            {
              questionId: q1.id,
              order: 0,
              points: 2.0,
              type: q1.type,
              prompt: q1.prompt,
              explanation: q1.explanation,
              options: [
                { id: 'opt-1-1', text: 'TCP (Transmission Control Protocol)', isCorrect: true },
                { id: 'opt-1-2', text: 'HTTP (Hypertext Transfer Protocol)', isCorrect: false },
                { id: 'opt-1-3', text: 'IP (Internet Protocol)', isCorrect: false },
                { id: 'opt-1-4', text: 'Ethernet', isCorrect: false },
              ],
            },
            {
              questionId: q2.id,
              order: 1,
              points: 2.0,
              type: q2.type,
              prompt: q2.prompt,
              explanation: q2.explanation,
              options: [
                {
                  id: 'opt-2-1',
                  text: 'Là bộ nhớ khả biến (mất dữ liệu khi mất nguồn điện)',
                  isCorrect: true,
                },
                {
                  id: 'opt-2-2',
                  text: 'Tốc độ truy xuất nhanh hơn đáng kể so với ổ đĩa SSD/HDD thông thường',
                  isCorrect: true,
                },
                {
                  id: 'opt-2-3',
                  text: 'Được sử dụng làm nơi lưu trữ dữ liệu vĩnh viễn của hệ điều hành',
                  isCorrect: false,
                },
              ],
            },
            {
              questionId: q3.id,
              order: 2,
              points: 2.0,
              type: q3.type,
              prompt: q3.prompt,
              explanation: q3.explanation,
              options: [
                { id: 'opt-3-1', text: 'Đúng', isCorrect: true },
                { id: 'opt-3-2', text: 'Sai', isCorrect: false },
              ],
            },
            {
              questionId: q4.id,
              order: 3,
              points: 2.0,
              type: q4.type,
              prompt: q4.prompt,
              explanation: q4.explanation,
              options: [
                { id: 'opt-4-1', text: 'WHERE', isCorrect: true },
                { id: 'opt-4-2', text: 'where', isCorrect: true },
              ],
            },
            {
              questionId: q5.id,
              order: 4,
              points: 2.0,
              type: q5.type,
              prompt: q5.prompt,
              explanation: q5.explanation,
              options: [],
              rubric: q5.rubric as object,
            },
          ],
        },
      },
    });
  }

  // 5. Seed Test Session with Short Join Code
  await prisma.testSession.upsert({
    where: { joinCode: 'QUIZ101' },
    update: {},
    create: {
      versionId: testVersion.id,
      joinCode: 'QUIZ101',
      title: 'Phiên kiểm tra lớp CNTT K22',
      status: SessionStatus.ACTIVE,
      startsAt: new Date(),
    },
  });

  console.log('✅ Seeded Test with published snapshot version and session QUIZ101');
  console.log('🎉 Seed completed successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
