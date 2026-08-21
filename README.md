# Cloudflare DevSecOps Management Platform 🛡️⚡

[![E2E Tests](https://img.shields.io/badge/E2E%20Tests-18%2F18%20Passed-emerald?style=for-the-badge&logo=playwright&logoColor=white)](https://playwright.dev/)
[![Next.js](https://img.shields.io/badge/Next.js-15.5-black?style=for-the-badge&logo=next.js&logoColor=white)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![CI Status](https://img.shields.io/badge/CI-Passing-brightgreen?style=for-the-badge&logo=githubactions&logoColor=white)](https://github.com/)
[![License](https://img.shields.io/badge/License-MIT-purple?style=for-the-badge)](./LICENSE)

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

### 2. Quản trị DNS Nâng cao & Nút Làm mới Danh sách (DNS Records Manager & Refresh)
- CRUD đầy đủ các loại bản ghi: `A`, `AAAA`, `CNAME`, `TXT`, `MX`, `NS`, `SRV`, `CAA`, `PTR`.
- **Nút Refresh List chủ động**: Cho phép tải lại danh sách bản ghi trực tiếp từ Cloudflare API mà không cần tải lại toàn bộ trang web.
- **Modal Xác nhận Bật/Tắt Proxy (Orange Cloud / DNS Only)**: Cảnh báo chi tiết nguy cơ lộ Origin IP khi tắt Proxy hoặc giải thích lợi ích định tuyến Edge khi bật Proxy trước khi gửi lệnh.
- **Modal Xác nhận Xóa DNS Record**: Hộp thoại an toàn cảnh báo rủi ro downtime dịch vụ trước khi xóa.
- Xuất file cấu hình chuẩn **BIND Zone File (`.zone.txt`)**.

### 3. Tường lửa WAF, Giới hạn Tần suất & Xác nhận Thao tác (WAF & Rate Limiting Shield)
- **Nút Refresh List**: Tải mới quy tắc WAF, IP Access List và Rate Limiting tức thì.
- **Modal Xác nhận Xóa WAF / IP / RateLimit**: Ngăn chặn việc vô tình xóa bỏ các bộ lọc bảo vệ hệ thống.
- **Modal Xác nhận Đổi Security Level**: Cảnh báo tác động đến trải nghiệm người dùng cuối khi chuyển đổi sang chế độ *Under Attack* hoặc *Essentially Off*.
- Quản trị quy tắc tùy biến (**Custom Firewall Rules**) theo biểu thức `Wirefilter` (IP, URI, Headers, Threat Score).
- **IP Access List**: Danh sách trắng (Whitelist) và danh sách chặn (Blocklist) cho IP đơn, dải CIDR, ASN, hoặc Quốc gia.
- Cấu hình **Mức độ Bảo mật (Security Level)** và **Bot Fight Mode**.

### 4. Trung tâm Mã hóa SSL/TLS & Modal Cảnh báo Đổi Chế độ (SSL/TLS Encryption Center)
- **Modal Xác nhận Đổi Chế độ SSL/TLS Mode**: Cảnh báo nguy cơ lỗi 525/526 khi chuyển sang chế độ `Full (Strict)` nếu Origin Server chưa có chứng chỉ hợp lệ.
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

### 12. Quản lý Cloudflare Workers & Pages (Edge Compute Hub)
- **Workers Serverless Scripts**:
  - Quản lý danh sách Worker Scripts, đường dẫn liên kết Routes (vd: `api.example.com/*`), Usage model (`standard` / `bundled`), và Compatibility Date.
  - **Biến Môi Trường & Secrets**: Lưu trữ và quản lý Plaintext Variables cũng như Encrypted Secrets (`JWT_SECRET_KEY`, `UPSTREAM_GATEWAY_URL`).
  - **Lịch sử Triển khai (Deployments Timeline)**: Theo dõi phiên bản deploy, commit author và nguồn deploy (GitHub Actions, Wrangler CLI).
- **Giả lập Luồng Log Thời gian thực (Live Log Tail Simulator)**:
  - Giám sát luồng log thực thi của Worker theo thời gian thực (HTTP Status, Execution Duration, CPU time, Client IP).
- **Cloudflare Pages Fullstack Apps**:
  - Quản trị dự án Pages, Production Branch, Custom Domains, và trạng thái build deployment mới nhất.

### 13. Giới hạn Tần suất & Chống DDoS Layer 7 (Rate Limiting)
- **Quản lý Quy tắc Rate Limiting**:
  - Cấu hình ngưỡng Request (Threshold count) và chu kỳ thời gian (Period seconds: 10s, 60s, 10m, 1h).
  - Hành động thực thi khi vượt ngưỡng: `Ban (Block HTTP 429 kèm thời gian Timeout)`, `Managed Challenge`, `JS Challenge`.
- **1-Click DevSecOps Presets**:
  - ⚡ *Anti-Brute-Force Login*: 10 req / 1m ➔ Ban 5m cho endpoint `/api/v1/auth/login`.
  - 💳 *Payment Gateway Shield*: 15 req / 1m ➔ Managed Challenge cho `/api/v1/checkout/*`.
  - 🛡️ *Anti-Scraping API*: 120 req / 1m ➔ JS Challenge cho `/api/v1/catalog/*`.
- **Biểu đồ & Telemetry Vi phạm**:
  - Thống kê tổng số lần vượt ngưỡng (Breaches), số request bị chặn (Blocked 429), và số request bị thử thách (Challenged).
  - Top Endpoints bị tấn công nhiều nhất và Top IP vi phạm theo quốc gia.

### 14. Zero Trust Access & Cloudflare Tunnels (cloudflared)
- **Zero Trust Access Applications**:
  - Bảo vệ các cổng nội bộ (Jira, Grafana, Admin Panel) bằng xác thực định danh (IdPs: Google Workspace, GitHub Enterprise SAML, Azure AD).
  - Cấu hình Session Duration và chính sách Access Policies (cho phép theo Email, Domain `@company.com`, hoặc IP Whitelist).
- **Cloudflare Tunnels Network (`cloudflared`)**:
  - Kết nối trực tiếp máy chủ private / cụm Kubernetes ra Cloudflare Edge không cần mở Port Firewall hay Public IP.
  - Giám sát trạng thái Tunnel (Healthy / Down), Active Edge Connectors, và Public Ingress Routing.
  - **1-Click Launch Command**: Lệnh khởi chạy connector nhanh `cloudflared tunnel run --token <TOKEN>`.

### 15. Nhật ký Thao tác & Khôi phục (System Audit Trail & Rollback Engine)
- **Nhật ký Thao tác Hệ thống (System Audit Trail)**:
  - Tự động ghi lại lịch sử mọi hành động mutation trên hạ tầng (*Ai, Vai trò RBAC, Làm gì, Thời gian, Domain mục tiêu, Trạng thái*).
  - Phân loại rõ ràng: Bật/Tắt Dev Mode, Purge Cache chi tiết, Đổi SSL Mode, Thêm/Sửa/Xóa DNS, Tạo WAF rule, Khôi phục Snapshot.
  - Bộ lọc tìm kiếm thông minh theo từ khóa, User, Vai trò, và Phân loại hành động.
  - **Xuất Báo cáo**: 1-Click xuất toàn bộ lịch sử thành file `audit-trail.csv` hoặc `audit-trail.json` phục vụ đánh giá tuân thủ an ninh (SOC2, ISO 27001).
- **Trình Quản lý Snapshot & 1-Click Rollback Engine**:
  - **Tạo Snapshot**: 1-Click chụp lại toàn bộ cấu hình Zone hiện tại kèm ghi chú lý do sao lưu.
  - **Import JSON Snapshot**: Kéo thả file JSON backup từ máy tính.
  - **Trình Đối soát Pre-Restore Diff Inspector**: So sánh chi tiết từng tham số giữa cấu hình Live và Snapshot trước khi áp dụng.
  - **1-Click Restore Execution**: Khôi phục lại toàn bộ thiết lập SSL, TLS, Always HTTPS, HSTS, DNS và WAF về trạng thái cũ an toàn.

### 16. Kiểm thử Tự động E2E & CI/CD Pipeline (Playwright Test Automation)
- **Bộ Kiểm thử Tự động Playwright (15/15 Passed • 100% Green)**:
  - `cache-and-devmode.spec.ts`: Kiểm tra hộp thoại xác nhận an toàn Dev Mode, Granular Purge Center tabs, và 1-click Purge All.
  - `compliance-and-iac.spec.ts`: Kiểm tra trích xuất Terraform HCL (`main.tf`, `terraform.tfvars`), CRON drift scanner, và Webhook alert channels.
  - `dashboard-navigation.spec.ts`: Kiểm tra Zone listing, chuyển đổi song ngữ VI/EN, điều hướng toàn bộ menu sidebar.
  - `rbac-and-accounts.spec.ts`: Kiểm tra chuyển đổi Multi-Account profile, ma trận phân quyền RBAC (Viewer read-only vs DNS Operator vs Admin).
  - `security-and-audit.spec.ts`: Kiểm tra CIS Benchmark Scorecard, System Audit Trail search/filter/export, và 1-Click Snapshot Rollback diff viewer.
- **Tích hợp GitHub Actions CI**: Tự động kích hoạt luồng `.github/workflows/e2e.yml` để build và chạy 100% E2E tests trên môi trường Ubuntu/Node.js khi có Pull Request hoặc Push code.

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

### 3. Chạy Kiểm thử Tự động E2E (Playwright Test Suites)
```bash
# Chạy toàn bộ 15 bài test E2E ở chế độ headless
npm run test:e2e

# Mở giao diện tương tác trực quan Playwright Test Runner UI
npm run test:e2e:ui

# Xem báo cáo kiểm thử chi tiết dạng HTML Report
npm run test:e2e:report
```

### 4. Cấu hình API Token
- Nhập API Token trực tiếp trong cửa sổ **"Cloudflare API Token"** hoặc **"Quản lý Tài khoản"** trên thanh Navbar.
- Hoặc cấu hình trong file `.env`:
```env
CLOUDFLARE_API_TOKEN=your_cloudflare_api_token_here
```

### 4. Danh mục Quyền hạn API Token Yêu cầu (Cloudflare API Permissions Table):
Khi tạo Token trên [Cloudflare API Tokens](https://dash.cloudflare.com/profile/api-tokens), chọn **Create Custom Token** và cấp đầy đủ các quyền sau:

#### A. Quyền cấp độ Vùng (Zone-Level Permissions)
| Quyền hạn (Permission) | Mức độ | Phân hệ ứng dụng | Mục đích |
| :--- | :---: | :--- | :--- |
| `Zone - Zone` | **Read** | Zones Overview | Đọc danh sách Zones, trạng thái kích hoạt, Plan |
| `Zone - Zone Settings` | **Edit** | SSL / Overview | Quản lý SSL Mode, TLS 1.3, Always Use HTTPS, HSTS, Dev Mode, Under Attack |
| `Zone - SSL and Certificates` | **Edit** | SSL Security | Quản lý chứng chỉ Edge Certificates và cấu hình mã hóa |
| `Zone - DNS` | **Edit** | DNS Manager | Thêm, sửa, xóa bản ghi DNS (A, CNAME, MX, TXT...) và bật/tắt Proxy CDN |
| `Zone - Firewall Services` | **Edit** | WAF & Rate Limiting | Quản lý Custom WAF Rules, IP Access Rules và Rate Limiting |
| `Zone - Page Rules` | **Edit** | Page Rules | Quản lý quy tắc trang, URL Forwarding (301/302), Cache Overrides |
| `Zone - Analytics` | **Read** | Analytics & Drift | Truy vấn số liệu lưu lượng, mối đe dọa GraphQL & REST API |

#### B. Quyền cấp độ Tài khoản (Account-Level Permissions)
| Quyền hạn (Permission) | Mức độ | Phân hệ ứng dụng | Mục đích |
| :--- | :---: | :--- | :--- |
| `Account - Workers Scripts` | **Edit** | Workers & Pages | Quản lý Serverless Worker scripts, route bindings, secrets |
| `Account - Pages` | **Edit** | Workers & Pages | Quản lý dự án Cloudflare Pages và lịch sử deployment Git |
| `Account - Access: Apps and Policies` | **Edit** | Zero Trust Access | Quản trị ứng dụng nội bộ, IdPs và chính sách Access Policies |
| `Account - Cloudflare Tunnel` | **Edit** | Cloudflare Tunnels | Giám sát và quản trị kết nối Tunnels `cloudflared` |
| `Account - Account Settings` | **Read** | Multi-Account | Đọc thông tin tổ chức và xác thực tài khoản |

---

## 🔒 Bảo mật Kiến trúc (DevSecOps Security Architecture)
- Toàn bộ giao tiếp với Cloudflare API v4 được thực hiện tại **Server-Side Route Handlers (BFF Architecture)**.
- API Token được bảo vệ an toàn trên backend và lưu trữ client-side cách ly, không bao giờ bị rò rỉ.
- Hỗ trợ chế độ **Sandbox Demo** để kiểm thử mọi tính năng mà không cần Token thật.
