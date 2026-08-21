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

### 1. Quản lý Zone & Trung tâm Xóa Cache Chi tiết (Zones & Granular Purge Center)
- Danh sách vùng (Zones), trạng thái kích hoạt, tên miền, nameservers và plan.
- **Trung tâm Xóa Cache Chi tiết (Granular Purge Center)**:
  - **Theo URLs / Files cụ thể**: Nhập danh sách URL tĩnh cần xóa (hỗ trợ tối đa 30 URLs mỗi lượt gửi).
  - **Phím tắt 1-Click Presets**: Tự động điền nhanh các loại tài nguyên phổ biến (⚡ CSS & JS Bundles, 🖼️ Hình ảnh & Media, 🏠 Trang chủ & Apex Domain).
  - **Theo Hostnames / Subdomains**: Xóa toàn bộ cache của các subdomain riêng biệt (ví dụ: `static.example.com`, `cdn.example.com`).
  - **Theo Cache-Tags & Thư mục Prefixes**: Xóa theo header `Cache-Tag` hoặc đường dẫn tiền tố thư mục (`example.com/assets/`).
  - **Xóa toàn bộ (Purge Everything)**: Xóa sạch toàn bộ cache cho toàn Zone kèm hộp thoại cảnh báo an toàn.
  - **Nhật ký Lịch sử Xóa Cache (Purge Audit History)**: Theo dõi danh sách các lượt xóa cache gần nhất (thời gian, mục tiêu, số lượng, trạng thái).
- **Bảng Xác nhận An toàn Development Mode (Dev Mode Safety Modal)**:
  - Hộp thoại cảnh báo và xác nhận trước khi Bật/Tắt Development Mode nhằm chống thao tác nhầm.
  - Nêu rõ cơ chế bypass Edge Cache trong 3 giờ và cảnh báo tải máy chủ gốc (Origin Load).
- **Chế độ Bị tấn công (I'm Under Attack! Mode)**: Kích hoạt khẩn cấp JS Challenge cho 100% người dùng khi phát hiện DDoS Layer 7.

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

### 8. Quản lý Đa tài khoản & Tổ chức (Multi-Account Manager)
- Lưu trữ danh sách nhiều **Cloudflare API Token** tương ứng với các tài khoản hoặc tổ chức khác nhau (e.g. *Production Web*, *Staging Security*, *Sandbox Demo*).
- Chuyển đổi tài khoản tức thì trực tiếp trên thanh Navbar với 1 cú nhấp chuột (tự động nạp lại danh sách Zone tương ứng).
- Quản lý Alias gợi nhớ, tên Tổ chức và xóa tài khoản an toàn.

### 9. Phân quyền Vận hành Nội bộ (Internal RBAC Matrix)
Hệ thống tích hợp sẵn 4 vai trò vận hành DevSecOps giúp ngăn ngừa rủi ro thao tác nhầm:
- 👑 **Admin (Toàn quyền)**: Có đầy đủ quyền cấu hình DNS, WAF, SSL, Page Rules, quản lý tài khoản và Auto-Fix.
- 🌐 **DNS Operator**: Quản lý toàn diện bản ghi DNS, Proxy CDN và BIND export; các tính năng WAF/SSL/Auto-Fix ở chế độ chỉ đọc (Read-only).
- 🛡️ **Security & WAF Engineer**: Quản trị WAF Firewall, IP Rules, SSL/TLS, Page Rules và Auto-Fix; không thể thay đổi bản ghi DNS.
- 👁️ **Auditor / Viewer (Chỉ đọc)**: Chỉ xem số liệu telemetry và kiểm tra báo cáo an ninh; toàn bộ các nút thay đổi cấu hình đều bị khóa kèm thông báo quyền hạn.

### 10. Tự động hóa CI/CD & Giám sát Liên tục (Continuous Compliance)
- **Lập lịch Quét Sai lệch Tự động (Scheduled Drift CRON Scanner)**:
  - Tự động chạy ngầm theo chu kỳ linh hoạt (`5 phút`, `15 phút`, `1 giờ`, `6 giờ`, `24 giờ`).
  - Đối soát và so sánh trạng thái thực tế của Zone với bản Baseline Snapshot đã lưu để phát hiện thay đổi cấu hình trái phép (Drift Detection).
  - Tích hợp nút **"Run Scan Now"** cho phép kích hoạt quét và đối soát ngay tức thời.
- **Hệ thống Cảnh báo Đa kênh Tức thời (Multi-Channel Alert Dispatcher)**:
  - 💬 **Slack**: Gửi tin nhắn định dạng BlockKit với màu trạng thái, tên Zone, số lượng sai lệch và điểm CIS Score.
  - 🎮 **Discord**: Gửi tin nhắn Rich Embed chuyên nghiệp với màu sắc cảnh báo và timestamp.
  - ✈️ **Telegram**: Gửi thông báo HTML qua Telegram Bot API (`/sendMessage`) hiển thị bảng so sánh tham số thay đổi.
  - 🔗 **Custom JSON Webhook**: Gửi payload chuẩn DevSecOps đến hệ thống SIEM/SOAR kèm header xác thực `X-DevSecOps-Secret`.
  - 🧪 **1-Click Test Alert**: Kiểm tra kết nối và định dạng tin nhắn cho từng kênh hoặc toàn bộ kênh trước khi kích hoạt.
- **Nhật ký Lịch sử Quét (Drift History Log)**:
  - Lưu trữ chi tiết các lần quét gần nhất (`PASS` vs `DRIFT DETECTED`).
  - Liệt kê chi tiết từng tham số bị thay đổi (`oldVal` ➔ `currentVal`).

### 11. Xuất Mã Nguồn Hạ tầng Terraform (IaC Generator)
- Trích xuất toàn bộ trạng thái Zone hiện tại thành mã nguồn Terraform HCL chuẩn HashiCorp Cloudflare Provider `~> 4.25`.
- Bao gồm đầy đủ các khối tài nguyên:
  - `cloudflare_zone_settings_override`: SSL mode (Strict), Minimum TLS (1.2/1.3), Always Use HTTPS, Automatic HTTPS Rewrites, Brotli, HTTP/3, 0-RTT, Security Level.
  - `cloudflare_record`: Toàn bộ các bản ghi DNS (A, AAAA, CNAME, MX, TXT, comments, TTL, Proxy status).
  - `cloudflare_filter` & `cloudflare_firewall_rule`: Quy tắc tường lửa WAF với biểu thức Wireshark (Wirefilter syntax).
  - `cloudflare_ip_list`: Danh sách IP Whitelist / Block / Challenge.
  - `cloudflare_page_rule`: Các quy tắc URL Forwarding (301/302), Cache Level overrides.
- Tiện ích thao tác 1-Click:
  - Lọc linh hoạt các thành phần xuất (DNS, WAF, SSL, Page Rules).
  - **1-Click Copy** mã HCL vào Clipboard.
  - **1-Click Download** file `main.tf` và `terraform.tfvars`.
  - Hướng dẫn triển khai từng bước (`terraform init` ➔ `terraform plan` ➔ `terraform apply`).

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
