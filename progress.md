# QuizForge — Nhật Ký Tiến Độ & Kế Hoạch Triển Khai (Progress Tracker)

> Cập nhật lần cuối: 2026-11-06  
> Nhánh hiện tại: `feat/S05-question-bank-crud`  
> Giai đoạn hoạt động: **Stage S05 — Question Bank CRUD (ĐANG TRIỂN KHAI)**

---

## 1. Tóm tắt tiến độ tổng quan (Project Status)

|    Stage    | Tên giai đoạn                               |     Trạng thái      | Chi tiết nghiệm thu                                                                                                                                                                     |
| :---------: | :------------------------------------------ | :-----------------: | :-------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
|   **S00**   | Discovery and decisions                     |   **HOÀN THÀNH**    | Đặc tả kỹ thuật `PRODUCT_SPEC.md`, `ROADMAP.md`, nhật ký kiến trúc `DECISIONS.md`.                                                                                                      |
|   **S01**   | Repository bootstrap                        |   **HOÀN THÀNH**    | Monorepo pnpm workspace (`apps/web`, `apps/api`, `packages/shared-types`, `packages/validation`), Vite React 19, NestJS 11, CI GitHub Actions (PR #1 merged).                           |
|   **S02**   | Database foundation                         |   **HOÀN THÀNH**    | Prisma schema hoàn chỉnh, migration `20261019155105_init_schema`, seed 5 dạng câu hỏi & assessment snapshot, PostgreSQL Docker Compose, CI PostgreSQL container service (PR #4 merged). |
|   **S03**   | Authentication and permissions              |   **HOÀN THÀNH**    | Luồng Auth hoàn chỉnh (Argon2id, JWT Rotation, Google OAuth 2.0, Guards, Decorators, 9 Endpoints, Swagger Bearer Auth, ADR-005, 43 unit tests + integration tests) (PR #5, #6 merged).  |
|   **S04**   | UI shell and design system                  |   **HOÀN THÀNH**    | Khung giao diện responsive, Design System primitives, màn hình Auth (Login, Register, Reset, Forgot, Google Callback), trạng thái Empty/Loading/Error, điều hướng Creator/Participant.  |
|   **S05**   | **Question Bank CRUD**                      | **ĐANG TRIỂN KHAI** | Quản lý ngân hàng câu hỏi, hỗ trợ 5 dạng câu hỏi (Single Choice, Multiple Choice, True/False, Short Answer, Essay), Zod validation, kiểm soát quyền sở hữu (ownership), API và UI.      |
| **S06–S15** | Core Assessment, Import, Grading, Live Room |   _Chưa bắt đầu_    | Lộ trình theo `docs/ROADMAP.md`.                                                                                                                                                        |

---

## 2. Kế hoạch triển khai Stage S05: Question Bank CRUD

### 2.1. Mục tiêu và Deliverable

- Hỗ trợ đầy đủ 5 dạng câu hỏi theo đặc tả `docs/PRODUCT_SPEC.md`:
  - `SINGLE_CHOICE`: Trắc nghiệm 1 đáp án đúng (tối thiểu 2 options, đúng 1 đáp án đúng).
  - `MULTIPLE_CHOICE`: Trắc nghiệm nhiều đáp án đúng (tối thiểu 2 options, ít nhất 1 đáp án đúng).
  - `TRUE_FALSE`: Câu hỏi Đúng / Sai (2 options "Đúng" và "Sai", đúng 1 đáp án đúng).
  - `SHORT_ANSWER`: Điền từ / câu trả lời ngắn (so khớp danh sách biến thể chấp nhận hoặc chấm tay).
  - `ESSAY`: Câu hỏi tự luận (kèm rubric tiêu chí chấm điểm và đáp án tham khảo tùy chọn).
- Hỗ trợ Markdown trong nội dung câu hỏi (`prompt`) và lời giải thích (`explanation`), lọc HTML độc hại.
- Phân trang, tìm kiếm theo tiêu đề/nội dung, lọc theo chủ đề (`topic`), thẻ (`tags`), độ khó (`difficulty: EASY, MEDIUM, HARD`), dạng câu hỏi (`type`).
- Bảo đảm an toàn quyền sở hữu (Server-Authoritative Ownership): Người dùng chỉ có quyền xem, chỉnh sửa, xóa ngân hàng câu hỏi và câu hỏi do chính mình tạo ra.
- Không rò rỉ đáp án đúng (`isCorrect`) hoặc rubric bí mật cho học sinh/thí sinh khi chưa được phép công bố.

---

### 2.2. Danh sách công việc (Task Breakdown & Checklist)

- [ ] **Bước 1: Shared Contracts & Validation (`packages/shared-types` & `packages/validation`)**
  - Định nghĩa enums và interfaces cho QuestionBank, Question, QuestionOption, PaginatedResult.
  - Xây dựng Zod schemas cho tạo/sửa ngân hàng câu hỏi và câu hỏi (discriminator/validation rules theo 5 dạng câu hỏi).

- [ ] **Bước 2: Backend Question Banks Module (`apps/api`)**
  - Tạo `QuestionBanksService` và `QuestionBanksController` (`/api/v1/question-banks`).
  - Enforce ownership check qua `@CurrentUser('id')`.
  - Phân trang, tìm kiếm, lọc, đánh dấu lưu trữ (`isArchived`).
  - Viết Unit tests cho Service và Controller.

- [ ] **Bước 3: Backend Questions Module (`apps/api`)**
  - Tạo `QuestionsService` và `QuestionsController` (`/api/v1/question-banks/:bankId/questions` và `/api/v1/questions/:id`).
  - Validate quy chuẩn 5 dạng câu hỏi khi tạo/cập nhật options.
  - Viết Unit tests cho Service và Controller.

- [ ] **Bước 4: Frontend API Hooks & State (`apps/web`)**
  - Tạo hooks TanStack Query: `useQuestionBanks`, `useQuestionBank`, `useQuestions`.

- [ ] **Bước 5: Frontend UI Views (`apps/web`)**
  - Trang danh sách ngân hàng câu hỏi (`/question-banks`): Thanh tìm kiếm, lọc, tạo mới ngân hàng câu hỏi (modal), trạng thái rỗng/tải.
  - Trang chi tiết ngân hàng câu hỏi (`/question-banks/:id`): Xem danh sách câu hỏi, lọc theo type/difficulty/topic.
  - Form/Modal soạn thảo câu hỏi hỗ trợ linh hoạt 5 dạng câu hỏi với Live Preview.

- [ ] **Bước 6: Kiểm thử tự động & Đảm bảo chất lượng**
  - Viết unit tests cho validation schemas và React components.
  - Kiểm tra `pnpm format:check`, `pnpm lint`, `pnpm typecheck`, `pnpm test`, `pnpm build`.
  - Cập nhật `progress.md` và `DEV-LOG.md`.

---

## 2. Chi tiết thực hiện Stage S04: UI Shell and Design System

### 2.1. Deliverables đã hoàn thành

- **Design System nền tảng**: Bộ UI primitives tái sử dụng trong `apps/web/src/components/ui/` (`Button`, `Input`, `Label`, `Card`, `Badge`, `Alert`) với Tailwind CSS v4 và Lucide icons, hỗ trợ đầy đủ accessibility (`aria-*`, keyboard focus ring, dark/light ready).
- **Điều hướng & Layout Shell**:
  - `Navbar`: Header với Brand logo, switcher chuyển đổi không gian làm việc Giáo viên (Creator) / Học sinh (Participant), dropdown user profile & nút đăng xuất.
  - `Sidebar`: Danh mục tính năng thích ứng theo vai trò đang chọn (Creator: Ngân hàng câu hỏi, Đề thi, Chấm bài, Import Markdown; Participant: Vào thi, Lịch sử nộp, Tự luyện tập) đi kèm responsive Mobile Drawer.
  - `MainLayout`: Bố cục khung hoàn chỉnh kèm Skip-to-content accessibility link và `ErrorBoundary` bao bọc Outlet.
- **Client Auth State & API Client**:
  - `apiClient` (`apps/web/src/lib/api-client.ts`): Tự động đính kèm `Bearer <token>`, interceptor xử lý `401 Unauthorized` với token rotation tự động và concurrency queue chống race condition.
  - `useAuthStore` (`apps/web/src/stores/auth.store.ts`): Quản lý Access Token strictly in-memory qua Zustand.
  - `useAuth` hook (`apps/web/src/hooks/useAuth.ts`): Quản lý Server State qua TanStack Query (`/auth/me`, login, register, logout mutations).
- **Màn hình Xác thực (Auth Pages)**:
  - `LoginPage` (`/login`): Form đăng nhập với client-side validation từ `@quizforge/validation`.
  - `RegisterPage` (`/register`): Đăng ký tài khoản với kiểm tra khớp mật khẩu và tiêu chuẩn độ phức tạp.
  - `ForgotPasswordPage` (`/forgot-password`): Gửi yêu cầu đặt lại mật khẩu với thông báo trạng thái.
  - `ResetPasswordPage` (`/reset-password`): Khôi phục mật khẩu thông qua token xác thực.
- **Route Guards & Protection**:
  - `ProtectedRoute`: Chặn người dùng chưa đăng nhập, tự động lưu URL chuyển hướng về `/login`.
  - `PublicOnlyRoute`: Chặn người dùng đã đăng nhập truy cập lại các trang auth.
  - `PlaceholderPage`: Giao diện thân thiện giữ chỗ cho các tính năng các stage tiếp theo (`/question-banks`, `/tests`, `/submissions`, `/import`, `/join`, `/attempts`, `/practice`, `/settings`).
- **Kiểm thử tự động (Test Suite)**:
  - Vitest: 38 unit & integration tests trong `apps/web` (toàn bộ pass 100%).
  - Playwright: Cập nhật smoke test kiểm tra shell brand navigation và trang login.
  - Tổng thể workspace: 88 unit tests, typecheck sạch, ESLint 0 warning/0 error, Prettier formatting chuẩn.

---

### 2.2. Danh sách công việc (Task Breakdown & Checklist)

- [x] **Bước 1: Thiết lập API Client & Quản lý Phiên (`apps/web`)**
  - Cài đặt `zustand` và `axios`.
  - Tạo `apiClient` (`apps/web/src/lib/api-client.ts`) với Request Bearer Interceptor và 401 Response Interceptor (Token Rotation & Concurrency Queue).
  - Tạo `useAuthStore` (`apps/web/src/stores/auth.store.ts`) lưu trữ `accessToken` trong memory và `refreshToken` an toàn.
  - Tạo hook `useAuth()` (`apps/web/src/hooks/useAuth.ts`) tích hợp TanStack Query quản lý Server State (`/auth/me`, login, register, logout).

- [x] **Bước 2: Xây dựng bộ UI Primitives (Design System Components)**
  - Cài đặt `lucide-react`.
  - `Button`: Hỗ trợ variants (default, primary, secondary, outline, ghost, destructive, link) và sizes (sm, md, lg, icon), hỗ trợ `isLoading` với spinner icon.
  - `Input`: Hỗ trợ label, error state (`aria-invalid`), helper text, focus-visible styles.
  - `Label`: Accessible label với indicator bắt buộc.
  - `Card`: `Card`, `CardHeader`, `CardTitle`, `CardDescription`, `CardContent`, `CardFooter`.
  - `Badge`: Variants default, secondary, outline, success, destructive.
  - `Alert`: `Alert`, `AlertTitle`, `AlertDescription`, variants default, error, success, warning kết hợp icon từ `lucide-react`.
  - Kiểm thử 9 kịch bản tự động cho toàn bộ UI primitives.

- [x] **Bước 3: Xây dựng Layouts & Điều hướng (Shell)**
  - `Navbar`: Logo, Menu điều hướng, thanh tìm kiếm nhanh, nút đổi vai trò (Creator / Participant), Dropdown User Profile & Logout.
  - `Sidebar` & Mobile Drawer: Danh mục tính năng (Ngân hàng câu hỏi, Đề thi, Lịch sử làm bài, Cài đặt).
  - Component trạng thái dùng chung: `LoadingSpinner`, `EmptyState`, `ErrorBoundary`.

- [x] **Bước 4: Xây dựng các trang Xác thực (Auth Pages)**
  - Trang Đăng nhập (`/login`).
  - Trang Đăng ký (`/register`).
  - Trang Quên mật khẩu (`/forgot-password`).
  - Trang Đặt lại mật khẩu (`/reset-password`).
  - Đồng bộ validation client-side sử dụng Zod schemas từ `@quizforge/validation`.

- [x] **Bước 5: Thiết lập Route Protection & Dashboard Shells**
  - `ProtectedRoute` và `PublicOnlyRoute` trong `router.tsx`.
  - Trang `DashboardPage` thích ứng linh hoạt theo vai trò Creator / Participant với Call-to-actions và Empty States.

- [x] **Bước 6: Kiểm thử tự động (Unit Tests & E2E Smoke Tests)**
  - Unit tests cho `auth.store`, `api-client`, `useAuth`, `ui-primitives`, `Layout`, `AuthPages`.
  - Playwright E2E smoke test kiểm tra shell brand và navigation.

- [x] **Bước 7: Kiểm tra chất lượng & Sẵn sàng Mở Pull Request S04**
  - `pnpm format:check` — PASSED.
  - `pnpm lint` — PASSED (0 errors, 0 warnings).
  - `pnpm typecheck` — PASSED (4 packages).
  - `pnpm build` — PASSED (Vite + NestJS).
  - `pnpm test` (web) — 38/38 PASSED.
