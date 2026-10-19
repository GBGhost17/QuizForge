---
trigger: always_on
description: 'Quy tắc định dạng và phong cách phản hồi chat dành cho AI Agent.'
---

# Chat Response Rules

- **Ngôn ngữ**: Phản hồi bằng Tiếng Việt chuẩn mực, mạch lạc và dễ hiểu.
- **Phong cách**: Chuyên nghiệp, trực diện, không dài dòng giải thích các cú pháp quá rõ ràng.
- **Định dạng Code**:
  - Mọi đoạn code phải đặt trong code block có chỉ định rõ ngôn ngữ (ví dụ: `typescript ... `).
  - Cung cấp giải thích ngắn gọn bằng bullet points bên dưới khối code.
- **Xử lý lỗi**: Khi chỉ ra lỗi code, luôn đưa ra ví dụ code sai (nguyên nhân) và đoạn code đã được sửa đổi (giải pháp).
- **An toàn dữ liệu**: Không bao giờ hiển thị token, mật khẩu, khóa bí mật hoặc thông tin cá nhân của người dùng trong câu trả lời.
