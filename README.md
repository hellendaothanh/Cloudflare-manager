# Cloudflare DevSecOps Management Platform 🛡️⚡

[🇻🇳 Tiếng Việt](./README.md) | [🇬🇧 English](./README.en.md)

---

Nền tảng quản trị và tự động hóa hạ tầng Cloudflare toàn diện cho kỹ sư DevSecOps bằng **Next.js**, **TypeScript** và **Cloudflare REST API v4** (SDK chính thức).

Hệ thống hỗ trợ đầy đủ **Đa ngôn ngữ (Tiếng Việt & English)** với cơ chế cô lập ngôn ngữ tuyệt đối, chế độ **Sandbox Demo**, và kiểm soát an ninh tự động hóa (CIS Benchmark).

---

## 🌐 Chuyển đổi Ngôn ngữ (Language Switcher)

Hệ thống tích hợp sẵn tính năng đa ngôn ngữ với bộ từ điển đồng bộ:
- **🇻🇳 Tiếng Việt**: Ngôn ngữ mặc định, tối ưu hóa thuật ngữ DevSecOps cho người dùng Việt Nam.
- **🇬🇧 English**: Chế độ tiếng Anh 100% không bị lẫn lộn văn bản tiếng Việt.
- **Tự động lưu trạng thái**: Lựa chọn ngôn ngữ được lưu tại `localStorage` và tự động áp dụng cho các phiên làm việc tiếp theo.
- **Đánh giá An ninh Song ngữ**: Engine chấm điểm và khuyến nghị khắc phục bảo mật (Security Audit) tự động dịch theo ngôn ngữ đang chọn.

---

## 🌟 Danh sách Tính năng Đã triển khai

### 1. Quản lý Zone & Tác vụ Khẩn cấp (Zones & Quick Actions)
- Danh sách vùng (Zones), trạng thái kích hoạt, tên miền, nameservers và plan.
- **Tác vụ phản ứng nhanh (Quick Actions)**:
  - Xóa bộ nhớ đệm khẩn cấp (**Purge Cache Everything** hoặc theo danh sách URL cụ thể).
  - Bật/tắt **Development Mode** (bỏ qua cache trong 3 giờ).
  - Kích hoạt chế độ **I'm Under Attack!** (chống DDoS khẩn cấp bằng JS Challenge).

### 2. Quản trị DNS Nâng cao (DNS Records Manager)
- CRUD đầy đủ các loại bản ghi: `A`, `AAAA`, `CNAME`, `TXT`, `MX`, `NS`, `SRV`, `CAA`, `PTR`.
- Bật/tắt **Cloudflare Proxy (Orange Cloud / CDN & WAF)** với 1 cú nhấp chuột.
- Xuất file cấu hình chuẩn **BIND Zone File (`.zone.txt`)**.

### 3. Tường lửa & Bảo mật WAF (WAF & Firewall Shield)
- Quản trị quy tắc tùy biến (**Custom Firewall Rules**) theo biểu thức `Wirefilter` (IP, URI, Headers, Threat Score).
- **IP Access List**: Danh sách trắng (Whitelist) và danh sách chặn (Blocklist) cho IP đơn, dải CIDR, ASN, hoặc Quốc gia.
- Cấu hình **Mức độ Bảo mật (Security Level)** và **Bot Fight Mode**.

### 4. Trung tâm Mã hóa SSL/TLS (Certificates & Encryption Center)
- Chuyển đổi linh hoạt giữa 4 chế độ: `Off`, `Flexible`, `Full`, `Full (Strict)`.
- Ép buộc phiên bản mã hóa tối thiểu **Minimum TLS Version (TLS 1.2 / TLS 1.3)**.
- Kích hoạt **Always Use HTTPS** và **Automatic HTTPS Rewrites**.
- Giám sát trạng thái chính sách **HSTS (HTTP Strict Transport Security)** và chứng chỉ Universal SSL Edge.
- **Xử lý Graceful Fallback**: Tự động thông báo và hướng dẫn bổ sung quyền nếu API Token thiếu quyền hạn `Zone Settings` hoặc `SSL Certificates`.

### 5. Quy tắc Trang (Page Rules & Edge Forwarding)
- Cấu hình chuyển hướng URL (301/302 Redirect), ghi đè Cache Level, và tùy chỉnh mức độ bảo mật.
- Hỗ trợ ký tự đại diện Wildcard `*` và sắp xếp thứ tự ưu tiên (Priority Ordering) của quy tắc.

### 6. Giám sát & Phân tích Mối đe dọa (Telemetry & Analytics)
- Biểu đồ thời gian thực về lưu lượng Requests (Total vs Cached) và Băng thông (Bandwidth).
- Thống kê các cuộc tấn công bị ngăn chặn (**Threats Mitigated**), phân bổ theo quốc gia nguồn và phương thức tấn công.
- Phân tích mã phản hồi HTTP (`2xx`, `3xx`, `4xx`, `5xx`).

### 7. Đánh giá An ninh & Sao lưu Cấu hình (DevSecOps Audit & Drift Detection)
- **Security Scorecard**: Chấm điểm an ninh (0 - 100 điểm, xếp loại A+, A, B, C, D, F) dựa trên chuẩn CIS Benchmark.
- **1-Click Auto-Fix**: Tự động khắc phục các lỗ hổng cấu hình nguy hiểm chỉ với 1 nút bấm.
- **Config Backup & Drift Diff**: Xuất Snapshot toàn bộ cấu hình Zone ra file JSON và so sánh sai lệch cấu hình (Configuration Drift) giữa các mốc thời gian.

---

## 🚀 Hướng dẫn Cài đặt & Khởi chạy

### 1. Cài đặt Dependencies
```bash
npm install
```

### 2. Chạy môi trường phát triển (Dev Server)
```bash
npm run dev
```
Truy cập giao diện tại: [http://localhost:3000](http://localhost:3000)

### 3. Cấu hình API Token
- Nhập API Token trực tiếp trong cửa sổ **"Cloudflare API Token"** trên giao diện web.
- Hoặc cấu hình trong file `.env`:
```env
CLOUDFLARE_API_TOKEN=your_cloudflare_api_token_here
```

### 4. Quyền hạn API Token khuyến nghị:
Khi tạo Token trên [Cloudflare API Tokens](https://dash.cloudflare.com/profile/api-tokens), chọn **Create Custom Token** và cấp các quyền sau:

| Quyền hạn (Permission) | Mức độ | Mục đích |
| :--- | :--- | :--- |
| `Zone - Zone` | **Read** | Đọc danh sách Zones và thông tin tài khoản |
| `Zone - Zone Settings` | **Edit** | Quản lý SSL Mode, TLS 1.3, Always Use HTTPS, HSTS, Dev Mode |
| `Zone - SSL and Certificates` | **Edit** | Đọc và cấu hình chứng chỉ Edge Certificates |
| `Zone - DNS` | **Edit** | Thêm, sửa, xóa bản ghi DNS và đổi trạng thái Proxy |
| `Zone - Firewall Services` | **Edit** | Quản lý Custom WAF Rules và IP Access Rules |
| `Zone - Page Rules` | **Edit** | Quản lý Page Rules và URL Forwarding |
| `Zone - Analytics` | **Read** | Xem số liệu telemetry lưu lượng và mối đe dọa |

---

## 🔒 Bảo mật Kiến trúc (DevSecOps Security Architecture)
- Toàn bộ giao tiếp với Cloudflare API v4 được thực hiện tại **Server-Side Route Handlers (BFF Architecture)**.
- API Token được bảo vệ an toàn trên backend, không bao giờ lộ ra client browser.
- Hỗ trợ chế độ **Sandbox Demo** để kiểm thử mọi tính năng mà không cần Token thật.
