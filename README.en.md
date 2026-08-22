# Cloudflare DevSecOps Management Platform

[![E2E Tests](https://img.shields.io/badge/E2E%20Tests-18%2F18%20Passed-emerald?style=for-the-badge&logo=playwright&logoColor=white)](https://playwright.dev/)
[![Next.js](https://img.shields.io/badge/Next.js-15.5-black?style=for-the-badge&logo=next.js&logoColor=white)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![CI Status](https://img.shields.io/badge/CI-Passing-brightgreen?style=for-the-badge&logo=githubactions&logoColor=white)](https://github.com/)
[![License](https://img.shields.io/badge/License-MIT-purple?style=for-the-badge)](./LICENSE)

[Tiếng Việt](./README.md) | [English](./README.en.md)

---

A unified DevSecOps infrastructure management and automation suite for Cloudflare built on **Next.js**, **TypeScript**, and **Cloudflare REST API v4** (Official SDK).

The platform features comprehensive **bilingual support (Vietnamese & English)** with absolute language isolation, a **Sandbox Demo mode**, and automated security posture scoring based on CIS Benchmarks.

---

## Language Switcher

The application natively supports real-time bilingual switching with synchronized dictionaries:
- **Vietnamese (Tiếng Việt)**: Tailored DevSecOps terminology for Vietnamese teams.
- **English**: Pure 100% English interface with zero fallback artifacts.
- **Persistent State**: User language preferences are persisted via `localStorage` across sessions.
- **Bilingual Security Audit**: The CIS Benchmark scoring engine and remediation advisories dynamically translate based on the active language.

---

## Feature Matrix

### 1. Zone Management & Granular Purge Center
- Comprehensive zone listing, active status, apex domains, nameservers, and subscription plans.
- **Granular Purge Center**:
  - **By Specific URLs / Files**: Input target static asset URLs (supports batch submissions up to 30 URLs).
  - **1-Click Quick Presets**: Pre-populate common asset bundles (CSS & JS Bundles, Images & Media, Apex & Homepage).
  - **By Hostnames / Subdomains**: Purge cache across specific subdomains (e.g., `static.example.com`, `cdn.example.com`).
  - **By Cache-Tags & Prefixes**: Purge by `Cache-Tag` header or directory path prefix (`example.com/assets/`).
  - **Purge Everything**: Clear the entire edge cache for the zone with safety confirmation modals.
  - **Purge Audit History**: Track recent purge operations (timestamp, target, item count, status).
- **Development Mode Safety Confirmation**:
  - Safety modal warning before toggling Development Mode on/off.
  - Explicit warning detailing the 3-hour cache bypass window and origin server load implications.
- **Under Attack Mode**: Immediate 1-click mitigation triggering JavaScript Challenges during Layer 7 DDoS surges.

### 2. DNS Records Manager & Real-Time Sync
- Full CRUD support for core record types: `A`, `AAAA`, `CNAME`, `TXT`, `MX`, `NS`, `SRV`, `CAA`, `PTR`.
- **Active Refresh Button**: Instantly reload live DNS records from Cloudflare API without full page reloads.
- **Proxy Status Toggle Modal (Orange Cloud / DNS Only)**: Clear warnings on origin IP exposure when unproxying vs Edge acceleration benefits when enabled.
- **Delete Confirmation Modal**: Impact modal highlighting potential service outages before record deletion.
- **BIND Zone File Export (`.zone.txt`)**: Export standard zone configuration files.

### 3. Origin Pools, Health Probing & Origin Shield (Origin & Failover Hub)
- **Origin Server Pools & Automated DNS Failover**:
  - Manage origin server nodes (Primary, Secondary Standby, Disaster Recovery Backup).
  - Periodic health monitoring (HTTP/HTTPS/TCP Probes, Interval, Timeout, Expected Status Codes) with real-time RTT latency and uptime metrics.
  - **Automated DNS Failover**: Automatically detect primary origin degradation and reroute traffic to standby nodes to eliminate downtime.
  - **Failover Audit Log**: Comprehensive incident timeline detailing automated failover events and root causes.
- **Origin Shield & Header Validation (`X-Origin-Verify-Secret`)**:
  - Prevent attackers from scanning direct origin IPs to bypass Cloudflare WAF and DDoS shields.
  - Generate and securely store shared `X-Origin-Verify-Secret` headers.
  - **1-Click Config Snippet Generator**: Copy-paste snippets for **Nginx**, **Apache (.htaccess)**, **IIS (web.config)**, and **HAProxy** to enforce HTTP 403 Forbidden for direct non-Cloudflare traffic.

### 4. WAF Firewall, Rate Limiting & Enterprise API Shield (mTLS & OpenAPI Validation)
- **Enterprise Mutual TLS (mTLS) Manager**:
  - Issue and orchestrate client x509 certificates to mandate two-way cryptographic verification between Edge and Backend APIs / Microservices.
  - Granular client classification: *B2B Partner Gateway*, *Internal Microservice Mesh*, *Native Mobile Apps*, *IoT Devices*.
  - SHA-256 fingerprint verification and instant rejection of unauthorized requests (HTTP 403 Forbidden).
- **API Shield & OpenAPI / Swagger Schema Validation**:
  - Direct import for OpenAPI 3.0/3.1 and Swagger 2.0 specifications (YAML/JSON).
  - Enforces a strict **Positive Security Model**: Inspects incoming request payloads (data types, required fields, constraints) at the Edge and rejects malformed inputs before reaching origin servers (HTTP 400 Bad Request).
  - Real-time audit logs for Schema and mTLS handshake violation telemetry.
- **Refresh List**: Real-time refresh for custom WAF rules, IP Access lists, and Rate Limiting configurations.
- **Safety Deletion Modals**: Prevent accidental removal of active security filters.
- **Security Level Transition Modal**: Impact warnings when adjusting security postures (e.g., *Under Attack* vs *Essentially Off*).
- **Custom Firewall Rules**: Rule management using Wireshark-standard `Wirefilter` expressions (IP, URI, Headers, Threat Score).
- **IP Access Rules**: Whitelist, Block, and Challenge policies for Single IPs, CIDR blocks, ASNs, or Country codes.
- **Security Level** configuration and **Bot Fight Mode** status.

### 5. SSL/TLS Encryption & Origin Certificate Lifecycle (SSL & Origin Expiry Hub)
- **SSL/TLS Mode Transition Safety Modal**: Clear impact warning for 525/526 SSL Handshake Failed errors when switching to `Full (Strict)` mode before origin certs are configured.
- Flexible switching across 4 modes: `Off`, `Flexible`, `Full`, `Full (Strict)`.
- Enforce **Minimum TLS Version (TLS 1.2 / TLS 1.3)**.
- Activate **Always Use HTTPS** and **Automatic HTTPS Rewrites**.
- **Origin SSL Expiry Scanner & Error 526 Prevention**:
  - Automated TLS handshake probing against backend origin IPs/domains to inspect x509 expiration metrics.
  - Visual risk scoring: *Safe (>30 days)*, *Expiring Soon (15-30 days)*, *Critical (<7 days / Error 526 outage risk)*.
  - **Automated CRON Scheduling & Multi-Channel Dispatcher**: Proactively trigger expiration warnings to **Telegram Bots** and **Slack/Discord Webhooks** at 30, 15, and 7-day milestones.
  - **Cloudflare Origin CA 15-Year Guide**: Step-by-step guidance on issuing 15-year free Origin CA certificates to permanently resolve origin certificate expiration.
- Inspect **HSTS (HTTP Strict Transport Security)** parameters and Universal SSL Edge Certificates.
- **Graceful Permission Handling**: Informative alerts and 1-click links if the API Token lacks specific `Zone Settings` or `SSL Certificates` permissions.

### 6. Modern Ruleset Engine & Transform Rules (Page Rules Replacement)
- **Full Deprecation of Legacy Page Rules**: Fully aligned with Cloudflare's roadmap deprecating Page Rules, replaced by the modern Ruleset Engine with unlimited parallel execution.
- **Dynamic Redirect Rules**: Configure HTTP redirects (301, 302, 307, 308) with Wirefilter expressions and query string preservation (`?param=value`).
- **HTTP Request / Response Header Modifiers**: Inject, override, or remove HTTP headers directly at the Edge (e.g. `Content-Security-Policy`, `X-Frame-Options: DENY`, `Strict-Transport-Security`, `X-Origin-Shield-Token`).
- **URL Rewrites & Query String Sanitization**: Dynamically rewrite request paths and strip unwanted tracking query parameters (`fbclid`, `gclid`, `utm_*`) before routing to origin.
- **1-Click Migration Engine**: Migrate all legacy Page Rules to modern Dynamic Redirects and Transform Rules with a single click.

### 7. Telemetry & Analytics
- Real-time timeseries charts for request volume (Cached vs Uncached) and Bandwidth.
- Security analytics detailing **Threats Mitigated**, geographic threat distribution, and attack classifications.
- Comprehensive HTTP status breakdown (`2xx`, `3xx`, `4xx`, `5xx`).

### 8. DevSecOps Audit, Drift Detection & 1-Click Fix
- **Security Scorecard**: CIS Benchmark-based security scoring (0 - 100 points, Grades A+ to F).
- **1-Click Auto-Fix**: Automatically remediate risky configurations with a single click.
- **Config Backup & Drift Diff**: Export complete zone snapshots as JSON and perform side-by-side configuration drift audits across time intervals.

### 9. Multi-Account & Organization Management
- Maintain multiple **Cloudflare API Tokens** mapped to distinct client profiles or environments (*Production*, *Staging*, *Sandbox Demo*).
- Instant 1-click account switching from the navigation header with auto-refreshing zone lists.
- Alias tagging, organization labeling, and secure credential removal.

### 10. Internal Role-Based Access Control (RBAC Matrix)
Four built-in operator roles designed for least-privilege security:
- **Admin**: Full administrative control across DNS, WAF, SSL, Page Rules, Account Management, and Auto-Fix.
- **DNS Operator**: Full management over DNS records, Proxy routing, and BIND export; security and SSL configurations remain Read-only.
- **Security & WAF Engineer**: Management over WAF, IP Rules, SSL/TLS, and Page Rules; DNS record mutation is restricted.
- **Auditor / Viewer**: Read-only telemetry and compliance posture visibility; all mutation actions are securely disabled with permission hints.

### 11. Continuous Compliance, Alerting & GitOps Automation
- **Git-to-Cloudflare Two-Way Sync**:
  - **Automated Git Commits**: Automatically commit declarative Terraform HCL (`main.tf`, `terraform.tfvars`) and JSON snapshots to GitHub/GitLab upon configuration changes.
  - **PR-Based Review Workflow**: Open Pull Requests to audit configuration diffs before applying changes to Cloudflare.
  - **Sync Audit Timeline**: Visual status tracking showing commit hashes, sync states, and direct links to PRs.
- **Emergency Break-Glass Failover Shield**:
  - **Emergency War Room**: 1-click failover routing traffic to a Static Maintenance Page on Cloudflare Edge / Waiting Room during origin outages.
  - **Visual Routing Simulator**: Visual architecture diagram mapping `Inbound Visitors -> [Edge Maintenance Shield (HTTP 503)] -> Origin (Isolated)`.
  - **Live Preview Editor**: Customize maintenance copy, expected recovery windows, and NOC contact details.
  - **1-Click Traffic Restore**: Safely restore normal traffic flow with safety confirmation modals.
- **Scheduled Drift CRON Scanner**:
  - Background scanning intervals (`5m`, `15m`, `1h`, `6h`, `24h`) to automatically detect unauthorized manual changes.
- **Multi-Channel Alert Dispatcher**:
  - Automated alerts to Slack (BlockKit), Discord (Embeds), Telegram (HTML), and Custom SIEM/SOAR Webhooks.

### 12. Cost & FinOps Hub
- **Cache Hit-Ratio & Cost Optimization Engine**:
  - Real-time Cache Hit Ratio calculation (Edge Cached vs Origin Misses), total bandwidth saved, and estimated origin egress cost savings (based on AWS/GCP/Azure egress rates of ~$0.08 - $0.09/GB).
  - **Automated FinOps Recommendations**: 1-Click optimization to enable Tiered Cache, tune browser and edge TTLs, and enable Brotli + Early Hints (HTTP 103).
  - **Top Egress Drain Matrix**: Identify URIs and endpoints with high cache-miss rates generating origin bandwidth costs.
- **Workers CPU & R2 Storage Insights**:
  - **Workers Compute Telemetry**: Invocation counts, median execution duration, p95 wall-time latency, and estimated script costs.
  - **R2 Zero Egress Fee Comparison**: Storage consumption (GB Stored), Class A/B operation metrics, and cost savings compared to AWS S3.

### 13. AI DevSecOps Copilot & Threat Explainer
- **Natural Language to Wirefilter Synthesizer**:
  - Input security intents in plain English or Vietnamese (e.g., *"Block all POST requests to /api/login outside business hours from foreign IPs"* or *"Challenge bots with threat score > 20 on /checkout"*).
  - Automatically compiles precise **Cloudflare Wirefilter Expressions** with a **1-Click Deploy to WAF** button.
  - Built-in presets: Anti-Brute-Force Login, Bot Mitigation, SQLi/XSS Shield, and Scraper Bot Protection.
- **Log Analyzer & Threat Explainer (Ray ID Deep-Dive)**:
  - Deep-dive into specific **Cloudflare Ray IDs** (Client IP, Geo, ASN, HTTP Status, Threat Score, Bot Score).
  - Automated Root Cause Analysis classifying attack vectors (Credential Stuffing, Tor Exit Nodes, Layer 7 DDoS).
  - Instant remediation guidance and 1-click preventive WAF rule recommendations.

### 14. Infrastructure as Code Generator (Terraform Export)
- Reverse-engineer current zone state into HashiCorp Cloudflare Provider `~> 4.25` compliant HCL code.
- Generates resource blocks:
  - `cloudflare_zone_settings_override`: SSL mode, Min TLS, Always HTTPS, Brotli, HTTP/3, Security Level.
  - `cloudflare_record`: Complete DNS records with comments, TTL, and proxy status.
  - `cloudflare_filter` & `cloudflare_firewall_rule`: Custom firewall rules with Wireshark syntax.
  - `cloudflare_ip_list`: Whitelist, Block, and Challenge IP lists.
  - `cloudflare_page_rule`: URL forwarding and cache overrides.
- Utilities:
  - Filter components for export (DNS, WAF, SSL, Page Rules).
  - **1-Click Copy** HCL code to clipboard.
  - **1-Click Download** `main.tf` and `terraform.tfvars`.
  - Step-by-step deployment guide (`terraform init` -> `terraform plan` -> `terraform apply`).

### 15. Cloudflare Workers & Pages Hub
- **Serverless Worker Scripts**:
  - Manage Worker scripts, route bindings (e.g., `api.example.com/*`), usage models (`standard` / `bundled`), and compatibility dates.
  - **Environment Variables & Secrets**: Plaintext variables and encrypted secrets (`JWT_SECRET_KEY`, `UPSTREAM_GATEWAY_URL`).
  - **Deployments Timeline**: Version tracking, commit authors, and deployment triggers (GitHub Actions, Wrangler CLI).
- **Live Log Tail Simulator**:
  - Real-time execution logs (HTTP status, execution duration, CPU wall-time, client IP).
- **Cloudflare Pages**:
  - Project management, production branch settings, custom domains, and recent deployment statuses.

### 16. Rate Limiting & Layer 7 DDoS Mitigation
- **Rate Limiting Rule Management**:
  - Configure threshold request counts and evaluation windows (10s, 60s, 10m, 1h).
  - Enforcement actions: `Ban (Block HTTP 429 with timeout)`, `Managed Challenge`, `JS Challenge`.
- **1-Click DevSecOps Presets**:
  - *Anti-Brute-Force Login*: 10 req / 1m -> Ban 5m for `/api/v1/auth/login`.
  - *Payment Gateway Shield*: 15 req / 1m -> Managed Challenge for `/api/v1/checkout/*`.
  - *Anti-Scraping API*: 120 req / 1m -> JS Challenge for `/api/v1/catalog/*`.
- **Violation Telemetry**:
  - Metrics on threshold breaches, blocked requests (429), and challenges issued.
  - Top targeted endpoints and top offending client IPs by country.

### 17. Zero Trust Access & Cloudflare Tunnels
- **Zero Trust Access Applications**:
  - Protect internal tools (Jira, Grafana, Admin Dashboards) behind identity providers (Google Workspace, GitHub Enterprise SAML, Azure AD).
  - Configure session durations and access policies (Email matching, domain whitelist `@company.com`, IP CIDRs).
- **Cloudflare Tunnels (`cloudflared`)**:
  - Securely connect private infrastructure or Kubernetes clusters to Cloudflare Edge without open firewall ports or public IPs.
  - Monitor tunnel health, active connectors, and ingress routing.
  - **1-Click Launch Command**: Quick-start connector `cloudflared tunnel run --token <TOKEN>`.

### 18. System Audit Trail & 1-Click Rollback Engine
- **System Audit Trail**:
  - Automatically records all mutation operations (*Actor, Role, Action, Timestamp, Target Domain, Status*).
  - Search and filter by keyword, actor, role, and action classification.
  - **Compliance Export**: 1-Click export to `audit-trail.csv` or `audit-trail.json` for SOC2 and ISO 27001 audits.
- **Snapshot Manager & 1-Click Rollback**:
  - **Create Snapshot**: 1-Click backup of live zone configuration with audit notes.
  - **Import JSON Snapshot**: Drag-and-drop JSON configuration files.
  - **Pre-Restore Diff Inspector**: Side-by-side inspection between live state and snapshot before execution.
  - **1-Click Rollback**: Revert SSL, TLS, Always HTTPS, HSTS, DNS, and WAF settings safely.

### 19. Network & DNS Diagnostics Suite
- **In-line DNS Quick Test**:
  - Quick-test action on every DNS record row (`A`, `CNAME`, `TXT`, `MX`, ...).
  - In-line diagnostic modal: check resolution via **Cloudflare (1.1.1.1)** and **Google DNS (8.8.8.8)**, verify Cloudflare Proxy vs Direct Origin status, and test HTTP/HTTPS port reachability.
- **Comprehensive Network Diagnostics**:
  - **DNS & DoH Propagation Matrix**: Multi-resolver verification across public and system resolvers.
  - **Ping & HTTP Latency**: Round-trip time (Min/Avg/Max), packet loss, HTTP status, server headers, and Cloudflare Ray ID (`cf-ray`).
  - **Telnet & TCP Port Reachability**: Socket connectivity testing across standard ports (`80`, `443`, `22`, `8080`, `8443`, `3306`, `5432` or custom ports) and TCP handshake timing.
  - **IP, ASN & GeoIP Intelligence**: Detailed IP intelligence, ISP, ASN org (`AS13335`), country, city, and proxy validation.
  - **SSL/TLS Handshake & Certificate Inspector**: Real TLS handshake validation, cipher suites, TLS version (1.2 / 1.3), certificate issuer, expiration days remaining, and SAN lists.
  - **Traceroute & Hops Simulator**: Network routing path simulation from edge to origin.

### 20. UI/UX Ergonomics
- **Collapsible Sidebar**:
  - Logical categorization: *Infrastructure & Routing, Security Shield, Edge Compute, Governance & Compliance*.
  - Collapsible to compact icon-only mode (`w-16`) to maximize workspace.
  - Collapsible accordion groups.
- **Scroll To Top**:
  - Smooth floating action button appearing when scrolling past `300px` with 1-click smooth scrolling.

### 21. Playwright E2E Test Automation
- **Playwright Test Suite (18/18 Passed - 100% Green)**:
  - `cache-and-devmode.spec.ts`: Dev Mode safety modals, Granular Purge Center tabs, 1-click Purge All.
  - `compliance-and-iac.spec.ts`: Terraform HCL generation, CRON drift scanner, Webhook channels.
  - `dashboard-navigation.spec.ts`: Zone listing, bilingual VI/EN switching, full sidebar navigation.
  - `rbac-and-accounts.spec.ts`: Multi-Account profile switching, RBAC permission matrices.
  - `security-and-audit.spec.ts`: CIS Benchmark scorecard, audit trail export, 1-click rollback diff viewer.
- **GitHub Actions CI**: Automated `.github/workflows/e2e.yml` testing pipeline on Ubuntu/Node.js for all pull requests and pushes.

---

## Installation & Getting Started

### 1. Install Dependencies
```bash
npm install
```

### 2. Run Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

### 3. Run E2E Test Suites
```bash
# Run all E2E tests in headless mode
npm run test:e2e

# Launch interactive Playwright Test Runner UI
npm run test:e2e:ui

# View HTML Test Report
npm run test:e2e:report
```

### 4. Configure API Tokens
- Input your API Token directly via **"Cloudflare API Token"** or **"Manage Accounts"** in the navigation header.
- Or configure via `.env`:
```env
CLOUDFLARE_API_TOKEN=your_cloudflare_api_token_here
```

### 5. Required Cloudflare API Permissions Table:
When creating an API Token at [Cloudflare API Tokens](https://dash.cloudflare.com/profile/api-tokens), select **Create Custom Token** and grant the following permissions:

#### A. Zone-Level Permissions
| Permission | Level | Module | Purpose |
| :--- | :---: | :--- | :--- |
| `Zone - Zone` | **Read** | Zones Overview | Read zone list, activation status, and plan |
| `Zone - Zone Settings` | **Edit** | SSL / Overview | Manage SSL Mode, TLS 1.3, Always HTTPS, HSTS, Dev Mode, Under Attack |
| `Zone - SSL and Certificates` | **Edit** | SSL Security | Manage Edge Certificates and encryption parameters |
| `Zone - DNS` | **Edit** | DNS Manager | Create, edit, delete DNS records and toggle Cloudflare CDN Proxy |
| `Zone - Firewall Services` | **Edit** | WAF & Rate Limiting | Manage Custom WAF Rules, IP Access Rules, and Rate Limiting |
| `Zone - Page Rules` | **Edit** | Page Rules | Manage URL forwarding (301/302) and cache overrides |
| `Zone - Analytics` | **Read** | Analytics & Drift | Query traffic, request volumes, and security threat analytics |

#### B. Account-Level Permissions
| Permission | Level | Module | Purpose |
| :--- | :---: | :--- | :--- |
| `Account - Workers Scripts` | **Edit** | Workers & Pages | Manage serverless Worker scripts, routes, and secrets |
| `Account - Pages` | **Edit** | Workers & Pages | Manage Cloudflare Pages projects and Git deployment timelines |
| `Account - Workers R2 Storage` | **Read** / **Edit** | Cost & FinOps Hub | Inspect R2 buckets, Class A/B operations, and storage costs |
| `Account - Access: Apps and Policies` | **Edit** | Zero Trust Access | Manage internal applications, IdPs, and access policies |
| `Account - Cloudflare Tunnel` | **Edit** | Cloudflare Tunnels | Monitor and manage `cloudflared` edge connectors |
| `Account - Account Settings` | **Read** | Multi-Account | Verify account identity and retrieve organization details |

---

## Security Architecture
- All communication with the Cloudflare API v4 is executed via **Server-Side Route Handlers (BFF Pattern)**.
- Sensitive credentials never touch client storage unprotected.
- Built-in **Sandbox Demo** allows exploring all platform capabilities safely without a live API Token.
