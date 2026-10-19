---
name: chat-code-explain
description: Quy trình giải thích và tối ưu hóa đoạn mã nguồn khi người dùng yêu cầu review hoặc giải thích code trong chat.
---

# Code Explanation & Optimization Skill

Khi người dùng gửi một đoạn code và yêu cầu giải thích hoặc tối ưu, hãy thực hiện theo các bước sau:

## Quy trình xử lý

1. **Phân tích tổng quan**:
   - Tóm tắt mục đích chính của đoạn code trong 1-2 câu.
2. **Kiểm tra an toàn & Hiệu năng**:
   - Đánh giá độ phức tạp thuật toán (Time/Space Complexity nếu có).
   - Kiểm tra các lỗi rò rỉ bộ nhớ, race condition hoặc mất an toàn thông tin.
3. **Đề xuất cải tiến**:
   - Đưa ra phiên bản code đã tối ưu (Clean Code, Type Safety).
   - Liệt kê các điểm cải tiến dưới dạng danh sách đánh số.
4. **Xác nhận**:
   - Hỏi lại người dùng xem có cần viết thêm Unit Test cho phần code vừa tối ưu hay không.
