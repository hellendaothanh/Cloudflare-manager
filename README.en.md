# Cloudflare DevSecOps Management Platform 🛡️⚡

[![E2E Tests](https://img.shields.io/badge/E2E%20Tests-18%2F18%20Passed-emerald?style=for-the-badge&logo=playwright&logoColor=white)](https://playwright.dev/)
[![Next.js](https://img.shields.io/badge/Next.js-15.5-black?style=for-the-badge&logo=next.js&logoColor=white)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![CI Status](https://img.shields.io/badge/CI-Passing-brightgreen?style=for-the-badge&logo=githubactions&logoColor=white)](https://github.com/)
[![License](https://img.shields.io/badge/License-MIT-purple?style=for-the-badge)](./LICENSE)

[🇻🇳 Tiếng Việt](./README.md) | [🇬🇧 English](./README.en.md)

---

A comprehensive Cloudflare edge infrastructure management and security automation platform built for DevSecOps engineers using **Next.js**, **TypeScript**, and the official **Cloudflare REST API v4**.

The platform features full **Multi-Language Support (English & Vietnamese)** with strict language isolation, an integrated **Sandbox Demo Mode**, and automated security posture scoring (CIS Benchmark).

---

## 🌐 Multi-Language Architecture (i18n)

The application includes built-in multilingual capabilities with fully synchronized dictionaries:
- **🇬🇧 English**: Pure English mode with 0% language leakage or mixed text.
- **🇻🇳 Tiếng Việt**: Fully localized for Vietnamese DevSecOps engineers.
- **State Persistence**: Selected language is saved in `localStorage` and automatically loaded in subsequent sessions.
- **Bilingual Security Audit Engine**: CIS Benchmark vulnerability evaluations, severity ratings, and remediation recommendations dynamically adapt to the selected language.

---

## 🌟 Implemented Features

### 1. Zone Hub & Granular Cache Purge Center (Zones & Purge Center)
- Centralized overview of active zones, domains, status, nameservers, and subscription plans.
- **Granular Cache Purge Center**:
  - **By Custom URLs / Files**: Invalidate specific static assets (up to 30 URLs per batch).
  - **1-Click Asset Presets**: Instant prefill shortcuts for common asset types (⚡ CSS & JS Bundles, 🖼️ Images & Media, 🏠 Homepage & Apex Domain).
  - **By Hostnames / Subdomains**: Invalidate all edge cache belonging to specific subdomains (e.g. `static.example.com`, `cdn.example.com`).
  - **By Cache-Tags & URL Path Prefixes**: Invalidate cache based on origin `Cache-Tag` headers or path prefixes (`example.com/assets/`).
  - **Purge Everything**: Complete zone edge cache flush equipped with critical safety warning dialog.
  - **Purge Audit History Log**: Review recent purge executions with target counts, details, timestamps, and status.
- **Development Mode Safety Confirmation Modal**:
  - Safety modal preventing accidental toggles of Development Mode.
  - Transparent notifications highlighting origin cache bypass, 3-hour auto-expiration, and origin server load considerations.
- **I'm Under Attack! Emergency Mode**: Instant JS Challenge deployment for all inbound visitors during active Layer 7 DDoS incidents.

### 2. Advanced DNS Management & Refresh List (DNS Records Manager & Refresh)
- Full CRUD operations for DNS record types: `A`, `AAAA`, `CNAME`, `TXT`, `MX`, `NS`, `SRV`, `CAA`, `PTR`.
- **Proactive Refresh List button**: Instantly sync and reload DNS records directly from the Cloudflare API without page reloads.
- **Proxy Toggle Safety Confirmation Modal**: Explains risks of exposing Origin IP when disabling Proxy and edge routing benefits when enabling Proxy before dispatching API updates.
- **DNS Record Deletion Safety Modal**: Protects production environments from unintended record drops and service downtime.
- Standard **BIND Zone File export (`.zone.txt`)**.

### 3. Origin Server Pools, Health Checks & Origin Shield (Origin Hub)
- **Origin Server Pools & Automated DNS Failover**:
  - Manage origin server nodes (Primary, Secondary Standby, Disaster Recovery Backup nodes).
  - Continuous health check probes (HTTP/HTTPS/TCP Probes, Interval, Timeout, Expected Status Codes) with real-time RTT latency and Uptime telemetry.
  - **Automated DNS Failover Mechanism**: Automatically detects when the primary origin is unreachable and immediately fails over traffic to standby origins to eliminate downtime.
  - **Failover Audit Log**: Comprehensive event logs capturing automated failover transitions and underlying probe failure reasons.
- **Origin Shield & Header Validation (X-Origin-Verify-Secret)**:
  - Prevents attackers from scanning and hitting your origin IP directly to bypass Cloudflare WAF/DDoS.
  - Automatically generates, rotates, and manages shared secret headers (`X-Origin-Verify-Secret`).
  - **1-Click Web Server Config Generator**: Generates production-ready configurations with 1-click copy for **Nginx**, **Apache (.htaccess)**, **IIS (web.config)**, and **HAProxy** to enforce immediate HTTP 403 Forbidden on direct access.

### 4. Web Application Firewall & Rate Limiting (WAF & Rate Limiting Shield)
- **Proactive Refresh List buttons**: Refresh WAF rules, IP Access Rules, and Rate Limiting configurations on demand.
- **Safety Confirmation Modals for Deletions**: Prevents accidental deletion of custom WAF filters, IP Access rules, and Rate Limiting policies.
- **Security Level Transition Safety Modal**: Detailed impact warning when switching to *Under Attack* or *Essentially Off* modes.
- Manage **Custom Firewall Rules** using Cloudflare `Wirefilter` expressions (IP, URI, Headers, Threat Score).
- **IP Access Rules**: Whitelist, Block, and Challenge policies for Single IPs, CIDR blocks, ASNs, or Country codes.
- **Security Level** configuration and **Bot Fight Mode** status.

### 4. SSL/TLS Encryption & Certificates Center
- **SSL/TLS Mode Transition Safety Modal**: Informs operators of possible 525/526 origin handshake errors before switching to `Full (Strict)` mode.
- Seamless switching across 4 encryption modes: `Off`, `Flexible`, `Full`, `Full (Strict)`.
- Enforce **Minimum TLS Version (TLS 1.2 / TLS 1.3)**.
- Toggle **Always Use HTTPS** (301 redirection) and **Automatic HTTPS Rewrites**.
- Inspect **HSTS (HTTP Strict Transport Security)** parameters and Universal SSL Edge Certificates.
- **Graceful Permission Handling**: Informative alerts and 1-click links if the API Token lacks specific `Zone Settings` or `SSL Certificates` permissions.

### 5. Page Rules & Edge Forwarding
- Customize routing behaviors, 301/302 URL redirects, Cache Level overrides, and security policies.
- Wildcard `*` pattern matching support and rule priority ordering.

### 6. Telemetry & Threat Analytics
- Real-time timeseries charts for request volume (Total vs. Cached) and edge bandwidth savings.
- Comprehensive mitigation statistics (**Threats Blocked**), breakdown by attacker country and attack vector.
- HTTP response status code distribution (`2xx`, `3xx`, `4xx`, `5xx`).

### 7. DevSecOps Security Audit & Drift Detection
- **Security Scorecard**: Automated CIS Benchmark posture rating (0 - 100 points, Grades A+, A, B, C, D, F).
- **1-Click Auto-Fix**: Automatically remediate high-risk security misconfigurations with one click.
- **Config Backup & Drift Diff**: Export live zone configuration snapshots to JSON and detect configuration drift against baseline snapshots.

### 8. Multi-Account & Organization Management
- Securely store multiple **Cloudflare API Tokens** mapped to distinct accounts or organizations (e.g. *Production Web*, *Staging Security*, *Sandbox Demo*).
- 1-Click quick account switcher right from the top navigation bar (instantly reloads the associated zone inventory).
- Custom account aliases, organization labels, and safe account removal.

### 9. Internal Role-Based Access Control (RBAC)
Four built-in operational roles to prevent misconfigurations and enforce least-privilege principles:
- 👑 **Admin (Full Access)**: Full privileges across DNS, WAF, SSL/TLS, Page Rules, Account management, and 1-Click Auto-Fix.
- 🌐 **DNS Operator**: Full access to DNS records, Proxy CDN toggling, and BIND export; WAF, SSL, and Auto-Fix actions remain Read-Only.
- 🛡️ **Security & WAF Engineer**: Full management of WAF Firewall rules, IP Access lists, SSL/TLS settings, Page Rules, and Auto-Fix; DNS record mutations are locked.
- 👁️ **Auditor / Viewer (Read-Only)**: Telemetry monitoring, drift inspection, and audit reports; all mutation buttons are disabled with descriptive permission notices.

### 11. CI/CD Automation, Continuous Compliance & GitOps Two-Way Sync
- **Bidirectional GitOps Two-Way Sync (Git-to-Cloudflare)**:
  - **Automated Git Commits**: When configuration changes are made (DNS, WAF, SSL, Page Rules), the system automatically pushes commits containing Terraform HCL (`main.tf`, `terraform.tfvars`) and JSON Snapshots to your specified Git repository (GitHub, GitLab, Gitea).
  - **PR-Based Review Gate (DevSecOps Governance)**: Option to open Pull Requests for peer review before applying live edge updates to Cloudflare.
  - **Audit & Commit History**: Interactive telemetry tracking commit hashes, PR URLs, and live synchronization status.
- **Emergency 1-Click Break-Glass Failover Shield**:
  - **Emergency War Room**: 1-Click activation redirecting all inbound visitors or critical subdomains to a static Edge Maintenance Shield / Cloudflare Waiting Room during complete origin datacenter/database outages.
  - **Traffic Flow Visualization**: Interactive pipeline diagram `Inbound Visitors ➔ [Edge Maintenance Shield (HTTP 503)] ➔ Origin (Isolated)`.
  - **Live Preview & Template Customization**: Customize maintenance messages, expected recovery timelines, and NOC emergency support emails.
  - **1-Click Restore**: Seamless traffic restoration to live origin with safety confirmation safeguards.
- **Scheduled Drift CRON Scanner**:
  - Automated background scanning at configurable intervals (`5 min`, `15 min`, `1 hour`, `6 hours`, `24 hours`) to detect unauthorized configuration drift.
- **Multi-Channel Alert Dispatcher**:
  - Dispatch alerts to Slack (BlockKit), Discord (Embed), Telegram (HTML), and Custom SIEM/SOAR Webhooks.

### 11. Infrastructure as Code (IaC) Terraform Export
- Export entire live zone state into production-ready Terraform HCL compatible with HashiCorp Cloudflare Provider `~> 4.25`.
- Comprehensive resource coverage:
  - `cloudflare_zone_settings_override`: SSL mode (Strict), Minimum TLS (1.2/1.3), Always Use HTTPS, Automatic HTTPS Rewrites, Brotli, HTTP/3, 0-RTT, Security Level.
  - `cloudflare_record`: All DNS records (A, AAAA, CNAME, MX, TXT, comments, TTL, Proxy status).
  - `cloudflare_filter` & `cloudflare_firewall_rule`: WAF firewall rules with Wirefilter expressions.
  - `cloudflare_ip_list`: IP Whitelist / Block / Challenge access rules.
  - `cloudflare_page_rule`: URL Forwarding (301/302), Cache Level overrides.
- 1-Click utilities:
  - Flexible component filters (DNS, WAF, SSL, Page Rules).
  - **1-Click Copy** HCL code to clipboard.
  - **1-Click Download** `main.tf` and `terraform.tfvars`.
  - Step-by-step deployment guide (`terraform init` ➔ `terraform plan` ➔ `terraform apply`).

### 12. Cloudflare Workers & Pages Hub (Edge Compute)
- **Serverless Workers Scripts**:
  - Manage worker scripts, bound HTTP routes (e.g. `api.example.com/*`), execution usage models (`standard` / `bundled`), and compatibility dates.
  - **Environment Variables & Secrets**: Manage plaintext variables and encrypted secrets (`JWT_SECRET_KEY`, `UPSTREAM_GATEWAY_URL`).
  - **Deployment History Timeline**: Track deployment versions, commit authors, and CI/CD sources.
- **Real-Time Event Tail Simulator**:
  - Live log streaming for edge executions (HTTP Status, CPU execution time, duration, client IP).
- **Cloudflare Pages Fullstack Apps**:
  - Manage Pages projects, production branches, custom domains, and latest build statuses.

### 13. Rate Limiting & Layer 7 DDoS Shield
- **Rate Limiting Policies**:
  - Configure request threshold counts and evaluation time windows (10s, 60s, 10m, 1h).
  - Enforcement actions: `Ban (Block HTTP 429 with custom timeout)`, `Managed Challenge`, `JS Challenge`.
- **1-Click DevSecOps Presets**:
  - ⚡ *Anti-Brute-Force Login*: 10 req / 1m ➔ Ban 5m on `/api/v1/auth/login`.
  - 💳 *Payment Gateway Shield*: 15 req / 1m ➔ Managed Challenge on `/api/v1/checkout/*`.
  - 🛡️ *Anti-Content Scraping*: 120 req / 1m ➔ JS Challenge on `/api/v1/catalog/*`.
- **Breach Telemetry & Analytics**:
  - Total threshold breaches, blocked requests (429), and challenged requests.
  - Top attacked endpoint paths and top violating IPs by country.

### 14. Zero Trust Access & Cloudflare Tunnels (cloudflared)
- **Zero Trust Access Applications**:
  - Secure internal portals (Jira, Grafana, Admin Panel) with identity-based SSO (Google Workspace, GitHub SAML, Azure AD).
  - Configure session durations and access policies (allow by email, corporate domain `@company.com`, or IP range).
- **Cloudflare Tunnels Network (`cloudflared`)**:
  - Direct outbound-only tunnels connecting private servers and Kubernetes clusters without open inbound ports.
  - Monitor tunnel health, active connectors, and public ingress routing.
  - **1-Click Launch Command**: Quick connector launch script `cloudflared tunnel run --token <TOKEN>`.

### 15. System Audit Trail & 1-Click Rollback Engine
- **System & Operator Action Audit Trail**:
  - Automatically records all mutation actions performed across the control plane (*Actor, RBAC Role, Action Type, Timestamp, Target Zone, Status*).
  - Categorized tracking: Dev Mode toggles, Granular Cache Purge, SSL/TLS changes, DNS record modifications, WAF rules, Snapshot restores.
  - Smart search and multi-criteria filters by keyword, user, role, and action category.
  - **Compliance Export**: 1-Click export to `audit-trail.csv` or `audit-trail.json` for SOC2 and ISO 27001 compliance reviews.
- **Snapshot Repository & 1-Click Rollback Engine**:
  - **Create Snapshot**: 1-Click capture of live zone configuration with custom naming and description notes.
  - **Import JSON Snapshot**: Drag-and-drop JSON backup files from your local workstation.
  - **Pre-Restore Diff Inspector**: Detailed visual parameter diff comparison between Live state and Snapshot before execution.
  - **1-Click Rollback**: Restore SSL, TLS, Always HTTPS, HSTS, DNS, and WAF settings with a safety confirmation modal.

### 16. Network & DNS Diagnostics Suite (Verification & Telemetry)
- **In-line Real-time DNS Record Tester**:
  - Integrated quick test trigger (`<Activity />` pulse icon) directly on every DNS table record row (`A`, `CNAME`, `TXT`, `MX`, etc.).
  - Instant diagnostic modal: resolves target hostnames across **Cloudflare (1.1.1.1)** and **Google DNS (8.8.8.8)**, identifies Cloudflare Edge Proxy (Orange Cloud) vs Direct Origin (Grey Cloud), and tests web port reachability (HTTP/HTTPS).
- **Comprehensive Network Diagnostics Suite**:
  - 🌐 **DNS & DoH Propagation Matrix**: Multi-resolver query engine testing propagation across global resolvers.
  - ⚡ **Ping & HTTP Latency**: Round-trip packet latency telemetry (Min/Avg/Max RTT), Packet Loss percentage, HTTP status codes, server headers, and Cloudflare Ray ID (`cf-ray`).
  - 🔌 **Telnet & TCP Port Reachability**: Socket connectivity testing for standard service ports (`80`, `443`, `22`, `8080`, `8443`, `3306`, `5432` or custom ports) with handshake latency.
  - 🗺️ **IP, ASN & GeoIP Intelligence**: Origin vs Cloudflare CDN Proxy IP detection, ISP classification, Autonomous System (`AS13335`), and geographic geolocation telemetry.
  - 🔒 **SSL/TLS Handshake & Certificate Inspector**: Live TLS handshake verifier, cipher suites, TLS version (1.2 / 1.3), certificate issuer, remaining validity days, and Subject Alternative Names (SANs).
  - 🚀 **Traceroute & Hops Simulator**: Simulates network path traversal from edge Anycast nodes to origin data centers.

### 17. UI/UX Ergonomics, Collapsible Sidebar & Scroll To Top
- **Collapsible & Streamlined Sidebar Navigation**:
  - Categorized into functional sections: *Network & Routing, Security & Shields, Edge & Compute, Telemetry & Compliance*.
  - Full sidebar collapse to compact icon mode (`w-16`) for maximum workspace canvas.
  - Accordion group expand/collapse toggles for focused workflow navigation.
- **Floating Scroll To Top Utility**:
  - Automatically fades in when scrolling exceeds `300px` with branded DevSecOps amber gradient and smooth 1-click scroll restoration.

### 18. E2E Automated Testing & CI/CD Pipeline (Playwright Test Automation)
- **Playwright Automated Test Suite (18/18 Passed • 100% Green)**:
  - `cache-and-devmode.spec.ts`: Validates Dev Mode safety confirmation modal, Granular Purge Center tabs, and 1-click Purge All.
  - `compliance-and-iac.spec.ts`: Validates Terraform HCL synthesis (`main.tf`, `terraform.tfvars`), scheduled CRON drift scanner, and Webhook alert channels.
  - `dashboard-navigation.spec.ts`: Validates Zone listing, bilingual VI/EN language switching, and primary sidebar navigation.
  - `rbac-and-accounts.spec.ts`: Validates Multi-Account organization switching and RBAC role permission gating (Viewer read-only vs DNS Operator vs Admin).
  - `security-and-audit.spec.ts`: Validates CIS Benchmark Scorecard, System Audit Trail search/filter/export, and 1-Click Snapshot Rollback diff viewer.
- **GitHub Actions CI Integration**: Automatically triggered on Push/Pull Request via `.github/workflows/e2e.yml` to build and verify 100% test pass rate across Node.js/Ubuntu environments.

---

## 🚀 Getting Started & Installation

### 1. Install Dependencies
```bash
npm install
```

### 2. Run Local Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

### 3. Run Automated E2E Tests (Playwright)
```bash
# Run all 15 E2E tests in headless mode
npm run test:e2e

# Open interactive Playwright UI Test Runner
npm run test:e2e:ui

# View detailed HTML Test Execution Report
npm run test:e2e:report
```

### 4. Configure API Token
- Enter your Cloudflare API Token directly via the **"Cloudflare API Token"** or **"Account Manager"** modal in the top navigation bar.
- Or specify it in your `.env` file:
```env
CLOUDFLARE_API_TOKEN=your_cloudflare_api_token_here
```

### 4. Required Cloudflare API Token Permissions Table
When creating an API Token at [Cloudflare API Tokens](https://dash.cloudflare.com/profile/api-tokens), select **Create Custom Token** and grant the following permissions:

#### A. Zone-Level Permissions
| Permission Group | Permission Name | Access Level | Purpose |
| :--- | :--- | :---: | :--- |
| `Zone` | `Zone` | **Read** | View zones list and account metadata |
| `Zone` | `Zone Settings` | **Edit** | Manage SSL Mode, TLS 1.3, Always Use HTTPS, HSTS, Dev Mode, Under Attack |
| `Zone` | `SSL and Certificates` | **Edit** | Query and manage Edge certificates |
| `Zone` | `DNS` | **Edit** | Create, update, delete DNS records and proxy states |
| `Zone` | `Firewall Services` | **Edit** | Manage Custom WAF Rules, IP Access Rules, and Rate Limiting |
| `Zone` | `Page Rules` | **Edit** | Configure URL redirects (301/302) and cache overrides |
| `Zone` | `Analytics` | **Read** | Access traffic telemetry and threat data |

#### B. Account-Level Permissions
| Permission Group | Permission Name | Access Level | Purpose |
| :--- | :--- | :---: | :--- |
| `Account` | `Workers Scripts` | **Edit** | Manage serverless worker scripts, route bindings, and secrets |
| `Account` | `Pages` | **Edit** | Manage Cloudflare Pages projects and build deployments |
| `Account` | `Access: Apps and Policies` | **Edit** | Manage Zero Trust Access applications, IdPs, and access policies |
| `Account` | `Cloudflare Tunnel` | **Edit** | Monitor and manage `cloudflared` edge tunnels |
| `Account` | `Account Settings` | **Read** | Read account metadata and organization name |

---

## 🔒 Security Architecture
- All communication with Cloudflare API v4 is proxied via **Server-Side Route Handlers (BFF Architecture)**.
- API Tokens remain secured on the server and are never exposed to client browsers.
- Built-in **Sandbox Demo Mode** allows full feature exploration with simulated infrastructure without requiring live Cloudflare credentials.
