# Quản lý Lịch Họp, Phòng Họp - EVN PCVT

Ứng dụng quản lý lịch công tác và lịch phòng họp tự động đồng bộ dữ liệu từ Outlook của Công ty Điện lực Vũng Tàu.

## Kiến trúc đồng bộ trên Vercel & GitHub

Vì Vercel là môi trường Cloud (chạy Linux và không có Outlook Desktop), ứng dụng hoạt động theo cơ chế **lai (hybrid)**:
1. **Chạy Local (Máy tính cá nhân)**: Khởi chạy Node server để tự động gọi PowerShell kết nối Outlook COM lấy lịch trực tiếp theo thời gian thực (realtime).
2. **Chạy trên Vercel (Production)**: Lịch họp được tải tĩnh từ tệp `public/debug_events.json`. Tệp này sẽ được tự động cập nhật và đẩy lên GitHub bằng một script PowerShell chạy ngầm trên máy tính của bạn.

---

## Hướng dẫn cài đặt và Deploy

### Bước 1: Khởi tạo Git & Đẩy code lên GitHub

Mở terminal hoặc Powershell tại thư mục ứng dụng (`MeetingRoomCalendar`), chạy các lệnh sau:

```bash
# 1. Khởi tạo Git repository
git init

# 2. Add toàn bộ code (loại trừ node_modules qua .gitignore đã tạo)
git add .

# 3. Commit phiên bản đầu tiên
git commit -m "Initial commit: Quản lý lịch họp"

# 4. Đổi tên nhánh chính thành main
git branch -M main

# 5. Liên kết với Repository mới trên GitHub của bạn
# (Hãy tạo 1 repository trống trên github.com trước, sau đó lấy link và điền vào đây)
git remote add origin <LINK_GITHUB_REPO_CỦA_BẠN>

# 6. Push code lên GitHub
git push -u origin main
```

---

### Bước 2: Deploy lên Vercel

1. Truy cập trang quản trị [vercel.com](https://vercel.com/) và đăng nhập bằng tài khoản GitHub của bạn.
2. Chọn **Add New...** -> **Project**.
3. Import repository GitHub vừa tạo ở Bước 1.
4. Ở phần cấu hình (Configuration), bạn giữ nguyên các giá trị mặc định (Vercel sẽ tự nhận diện đây là một trang Front-end tĩnh, kết hợp với các cấu hình định tuyến rewrite trong tệp `vercel.json` đã chuẩn bị sẵn).
5. Nhấn **Deploy**. Sau 1 phút, bạn sẽ có một link website chạy công cộng (ví dụ: `https://meeting-room-calendar.vercel.app`).

---

### Bước 3: Cấu hình tự động đồng bộ lịch lên Vercel (Không cần làm thủ công)

Tôi đã tạo sẵn tệp script [update_calendar_github.ps1](file:///d:/TRAN%20TAN%20PHAT/2.%20TR%E1%BA%A6N%20T%E1%BA%A4N%20PH%C3%81T%20-%202026/2.%20PH%C3%92NG%20K%E1%BB%B8%20THU%E1%BA%ACT%20&%20AN%20TO%C3%80N-PCVT/9.%20AG-PCVT/MeetingRoomCalendar/update_calendar_github.ps1). Script này sẽ tự động:
1. Lấy dữ liệu lịch mới nhất từ Outlook.
2. Lưu vào tệp dữ liệu `public/debug_events.json`.
3. Tự động `git commit` và `git push` lên GitHub nếu có sự thay đổi dữ liệu lịch. Khi GitHub nhận code mới, Vercel sẽ tự động deploy lại bản mới nhất sau vài giây.

#### Cách chạy tự động mỗi 30 phút bằng Windows Task Scheduler:
1. Nhấn nút Windows, tìm kiếm và mở **Task Scheduler**.
2. Chọn **Create Basic Task...** ở khung bên phải.
3. Đặt tên: `Đồng bộ lịch họp EVN`.
4. Trigger: Chọn **Daily** (Hằng ngày) -> Lặp lại mỗi ngày.
5. Action: Chọn **Start a program**.
6. Điền thông tin:
   - **Program/script**: `powershell.exe`
   - **Add arguments (optional)**: `-ExecutionPolicy Bypass -NoProfile -File "D:\TRAN TAN PHAT\2. TRẦN TẤN PHÁT - 2026\2. PHÒNG KỸ THUẬT & AN TOÀN-PCVT\9. AG-PCVT\MeetingRoomCalendar\update_calendar_github.ps1"`
   - **Start in (optional)**: `D:\TRAN TAN PHAT\2. TRẦN TẤN PHÁT - 2026\2. PHÒNG KỸ THUẬT & AN TOÀN-PCVT\9. AG-PCVT\MeetingRoomCalendar\`
7. Nhấn **Finish**.
8. Bấm đúp vào task vừa tạo, chuyển sang tab **Triggers**, click đúp vào dòng Daily, tích chọn **Repeat task every:** `30 minutes` (hoặc thời gian tuỳ bạn chọn) trong thời hạn **for a duration of:** `Indefinitely` (Vô thời hạn).
9. Chuyển sang tab **Conditions**, bỏ chọn **Start the task only if the computer is on AC power** (để chạy được cả khi dùng pin laptop).

Bây giờ lịch họp trên website Vercel của bạn sẽ luôn được tự động cập nhật từ Outlook mà bạn không cần phải thao tác thủ công!
