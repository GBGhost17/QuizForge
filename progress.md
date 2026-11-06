# QuizForge — Nhật Ký Tiến Độ & Kế Hoạch Triển Khai (Progress Tracker)

> Cập nhật lần cuối: 2026-11-06  
> Nhánh hiện tại: `feat/S03-auth-and-permissions`  
> Giai đoạn hoạt động: **Stage S03 — Authentication and permissions**

---

## 1. Tóm tắt tiến độ tổng quan (Project Status)

|    Stage    | Tên giai đoạn                               |          Trạng thái           | Chi tiết nghiệm thu                                                                                                                                                                     |
| :---------: | :------------------------------------------ | :---------------------------: | :-------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
|   **S00**   | Discovery and decisions                     |        **HOÀN THÀNH**         | Đặc tả kỹ thuật `PRODUCT_SPEC.md`, `ROADMAP.md`, nhật ký kiến trúc `DECISIONS.md`.                                                                                                      |
|   **S01**   | Repository bootstrap                        |        **HOÀN THÀNH**         | Monorepo pnpm workspace (`apps/web`, `apps/api`, `packages/shared-types`, `packages/validation`), Vite React 19, NestJS 11, CI GitHub Actions (PR #1 merged).                           |
|   **S02**   | Database foundation                         |        **HOÀN THÀNH**         | Prisma schema hoàn chỉnh, migration `20261019155105_init_schema`, seed 5 dạng câu hỏi & assessment snapshot, PostgreSQL Docker Compose, CI PostgreSQL container service (PR #4 merged). |
|   **S03**   | **Authentication and permissions**          | **HOÀN THÀNH (Chờ merge PR)** | Luồng Auth hoàn chỉnh (Argon2id, JWT Rotation, Guards, Decorators, Endpoints, ADR-005, 36 unit tests + integration tests).                                                              |
|   **S04**   | UI shell and design system                  |        _Chưa bắt đầu_         | Phụ thuộc S01, S03.                                                                                                                                                                     |
|   **S05**   | Question Bank CRUD                          |        _Chưa bắt đầu_         | Phụ thuộc S02, S03, S04.                                                                                                                                                                |
| **S06–S15** | Core Assessment, Import, Grading, Live Room |        _Chưa bắt đầu_         | Lộ trình theo `docs/ROADMAP.md`.                                                                                                                                                        |

---

## 2. Kế hoạch chi tiết Stage S03: Authentication and Permissions

### 2.1. Mục tiêu và Deliverable

- Triển khai đầy đủ luồng xác thực an toàn: Đăng ký (`register`), Đăng nhập (`login`), Làm mới phiên (`refresh token`), Đăng xuất (`logout`), Đặt lại mật khẩu (`forgot-password`, `reset-password`).
- Áp dụng thuật toán băm mật khẩu chuẩn **Argon2id** (theo `.agent/rules/03-security-privacy.md`).
- Quản lý phiên làm việc với cặp JWT Access Token (ngắn hạn: 15 phút) và Refresh Token được băm SHA-256 lưu trong DB, hỗ trợ xoay vòng (token rotation) và thu hồi (revocation).
- Xây dựng hệ thống bảo vệ endpoints: `JwtAuthGuard`, `RolesGuard` (`USER`, `ADMIN`), các custom decorators `@CurrentUser()`, `@Roles()`.
- Ghi nhận quyết định kiến trúc **ADR-005** vào `docs/DECISIONS.md`.
- Bộ kiểm thử unit test và integration test đạt chuẩn CI.

---

### 2.2. Danh sách công việc (Task Breakdown & Checklist)

- [x] **Bước 1: Cài đặt thư viện phụ thuộc (`apps/api`)**
  - Cài đặt `argon2` cho băm mật khẩu.
  - Cài đặt `@nestjs/jwt`, `@nestjs/passport`, `passport`, `passport-jwt`, `@types/passport-jwt`.
  - Cài đặt `@nestjs/config` để quản lý biến môi trường JWT (`JWT_SECRET`, `JWT_EXPIRES_IN`, v.v.).

- [x] **Bước 2: Cấu hình biến môi trường & Module Config**
  - Cập nhật file `.env.example` và `.env` với cấu hình JWT secrets và thời hạn token.
  - Tích hợp `ConfigModule` vào `AppModule`.

- [x] **Bước 3: Định nghĩa Contracts & Validation Schemas**
  - Thêm type/interface trong `packages/shared-types` (Auth payload, Auth response, User profile).
  - Thêm Zod schemas và DTOs kiểm tra tính hợp lệ của request:
    - Email hợp lệ.
    - Password tối thiểu 8 ký tự, có chữ hoa, chữ số.
    - DTOs: `RegisterDto`, `LoginDto`, `RefreshTokenDto`, `ForgotPasswordDto`, `ResetPasswordDto`.

- [x] **Bước 4: Xây dựng Service Hashing & Quản lý Token (`AuthService`)**
  - Hàm băm và so khớp mật khẩu bằng `argon2id`.
  - Tạo Access Token JWT.
  - Tạo và băm SHA-256 cho Refresh Token; lưu trữ vào bảng `refresh_tokens`.
  - Xử lý thu hồi Refresh Token khi đăng xuất hoặc phát hiện sử dụng token đã hết hạn.
  - Xử lý tạo và xác thực token đặt lại mật khẩu trong bảng `password_reset_tokens`.

- [x] **Bước 5: Xây dựng Strategy & Guards**
  - `JwtStrategy` trích xuất và xác thực Bearer token từ Authorization Header.
  - `JwtAuthGuard` bảo vệ các route riêng tư.
  - `RolesGuard` và `@Roles(...)` phân quyền theo `UserRole` (`USER`, `ADMIN`).
  - `@CurrentUser()` decorator trích xuất payload người dùng hiện tại an toàn.

- [x] **Bước 6: Xây dựng Controller & API Endpoints (`/api/v1/auth`)**
  - `POST /api/v1/auth/register` — Đăng ký tài khoản mới.
  - `POST /api/v1/auth/login` — Đăng nhập, nhận Access & Refresh Token.
  - `POST /api/v1/auth/refresh` — Làm mới Access Token thông qua Refresh Token.
  - `POST /api/v1/auth/logout` — Đăng xuất và thu hồi Refresh Token.
  - `POST /api/v1/auth/forgot-password` — Tạo token đặt lại mật khẩu.
  - `POST /api/v1/auth/reset-password` — Cập nhật mật khẩu mới bằng token hợp lệ.
  - `GET /api/v1/auth/me` — Lấy thông tin tài khoản đang đăng nhập.

- [x] **Bước 7: Ghi nhận Kiến trúc (ADR-005)**
  - Ghi nhận `ADR-005: Authentication Transport and Token Rotation Strategy` vào `docs/DECISIONS.md`.

- [x] **Bước 8: Kiểm thử tự động (Unit & Integration Tests)**
  - Viết `auth.service.spec.ts`: Test hash password, kiểm tra mật khẩu đúng/sai, luồng xoay vòng token, thu hồi token.
  - Viết `auth.controller.spec.ts`: Test các endpoint đăng ký, đăng nhập, refresh, logout, reset password, get me.
  - Viết `jwt.strategy.spec.ts`, `jwt-auth.guard.spec.ts`, `roles.guard.spec.ts`.
  - Viết `auth.integration-spec.ts`: Test toàn trình trên Prisma integration.
  - Viết `auth.test.ts` trong `packages/validation`: Test các Zod schemas.

- [x] **Bước 9: Kiểm tra chất lượng & Mở Pull Request**
  - Chạy `pnpm format:check`, `pnpm lint`, `pnpm typecheck`, `pnpm test`, `pnpm build`.
  - Push lên nhánh `origin/feat/S03-auth-and-permissions` và mở Pull Request S03.

---

## 3. Các giai đoạn kế tiếp (Next Stages Ahead)

1. **Stage S04 (UI Shell & Design System)**:
   - Dựng Layout chính (Header, Sidebar, Navigation).
   - Màn hình Auth (Đăng nhập, Đăng ký, Quên mật khẩu).
   - Tích hợp Auth State trên Frontend (React Context / Zustand).
2. **Stage S05 (Question Bank CRUD)**:
   - Giao diện và API tạo, sửa, xóa, tìm kiếm câu hỏi theo 5 dạng.
   - Phân quyền sở hữu ngân hàng câu hỏi.
