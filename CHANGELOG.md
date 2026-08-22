# Changelog

All notable changes to the **Cloudflare DevSecOps Management Platform** will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [v1.3.0] - 2026-08-22

### Added
- **Interactive Bilingual Knowledge Guide & Documentation Hub**:
  - Embedded **Interactive DevSecOps Knowledge Base Modal** accessible directly from the top navigation bar.
  - Comprehensive architectural breakdowns, operational mechanisms, and DevSecOps best-practice guidelines categorized into *Connectivity & Routing*, *Security Shield*, and *FinOps & Governance*.
  - Instant live keyword search and multi-category filtering for rapid onboarding.
- **Contextual HelpTooltip System Across 100% of Views & Modules**:
  - Contextual question-mark `(?)` micro-badges integrated across all 16 platform modules (DNS, WAF, SSL, Rate Limiting, API Shield, Load Balancing, FinOps, GitOps, Zero Trust, Workers, Audit, Analytics, Diagnostics, AI Copilot).
  - Hover-activated backdrop-blur glassmorphism popups providing immediate, plain-language operational summaries and security impact warnings in both Vietnamese and English.

### Changed
- **Refined UI & Micro-interactions**:
  - Upgraded HelpTooltip trigger to a circular dark-mode micro-badge with neon cyan hover glows and precise directional pointer arrows.
  - Optimized popup typography, backdrop-blur intensity, and responsive positioning.

---

## [v1.2.0] - 2026-08-22

### Added
- **Modern Ruleset Engine & Transform Rules (Page Rules Replacement)**:
  - Dynamic Redirect Rules (301, 302, 307, 308) with Wirefilter expressions and query string preservation (`?param=value`).
  - HTTP Request & Response Header Modifiers (`Content-Security-Policy`, `X-Frame-Options: DENY`, `Strict-Transport-Security`, `X-Origin-Shield-Token`).
  - Dynamic URL Rewrites and Query String Sanitization (`fbclid`, `gclid`, `utm_*`).
  - 1-Click Page Rules Migration Engine to automatically upgrade legacy rules.
- **Enterprise API Shield & Mutual TLS (mTLS) Manager**:
  - Issue and orchestrate client x509 certificates to mandate two-way cryptographic verification between Edge and Backend APIs / Microservices.
  - Granular client classification: *B2B Partner Gateway*, *Internal Microservice Mesh*, *Native Mobile Apps*, *IoT Devices*.
  - OpenAPI 3.0/3.1 and Swagger 2.0 Schema Validation Engine enforcing a Positive Security Model at the perimeter.
  - Real-time audit telemetry for Schema violations and mTLS handshake rejections.
- **Cloudflare Native Load Balancing & Geo-Steering**:
  - Flexible Traffic Steering Policies: *Geo-Steering* (Continent/Country routing), *Dynamic Steering* (Lowest RTT Latency), *Random Weighted* (proportional percentage distribution), and *Standard Priority Failover*.
  - Geo-Steering Regional Routing Matrix.
  - Session Affinity (Sticky Session) via HTTP Cookie (`cf-affinity`) and IP Cookie Hybrid.

### Changed
- Refactored UI icons across all components, replacing AI-style emoji clichés with clean DevSecOps Lucide icons.
- Enforced Playwright E2E Quality Gate before triggering automated GitHub Releases.

---

## [v1.1.0] - 2026-08-22

### Added
- **Origin SSL Lifecycle & Expiry Scanner**:
  - Automated TLS handshake probing against backend origin IPs/domains.
  - Visual risk scoring: *Safe (>30 days)*, *Expiring Soon (15-30 days)*, *Critical (<7 days / Error 526 outage risk)*.
  - Automated CRON Scheduling with Telegram Bot and Slack/Discord Webhook notifications.
  - Integrated 15-Year Cloudflare Origin CA certificate guidance.
- **Cost & FinOps Hub**:
  - Real-time Cache Hit Ratio measurement and origin egress bandwidth cost savings calculator.
  - Workers Compute Telemetry (Invocations, CPU Wall-Time) and R2 Object Storage Zero-Egress fee comparison against AWS S3.
  - Top Egress Drain Endpoints Matrix and 1-Click Cache Optimization suggestions.
- **AI DevSecOps Copilot & Threat Explainer**:
  - Natural language Wirefilter WAF rule synthesis with multi-language parsing (English and Vietnamese).
  - Ray ID incident investigation and root cause analysis engine.
- **Continuous Compliance & Two-Way GitOps**:
  - Bidirectional Git synchronization with Terraform HCL (`main.tf`, `terraform.tfvars`) and JSON snapshots.
  - Emergency Break-Glass Failover Shield with static maintenance page routing.
- **Network & DNS Diagnostics Suite**:
  - Edge Ping latency, TCP port connectivity, Global DNS propagation check, Traceroute hop inspector, and Whois / ASN intelligence.

---

## [v1.0.0] - 2026-08-20

### Added
- Multi-Zone Management with DNS Record Editor (A, AAAA, CNAME, TXT, MX, NS, SRV, CAA, PTR) and BIND Zone File export.
- WAF Custom Firewall Rules, IP Access Lists (Whitelist, Block, Challenge), and Security Level switcher.
- SSL/TLS Encryption Control (Off, Flexible, Full, Strict), Minimum TLS Version, and Always Use HTTPS.
- Rate Limiting Shield for Layer 7 DDoS and Brute-Force mitigation.
- Zero Trust Access Applications and Cloudflare Tunnels (`cloudflared`) orchestration.
- Real-time Telemetry & Security Analytics.
- CIS Benchmark Security Audit Scorecard and 1-Click Auto-Fix.
- Multi-Account Token Management and 4-tier Internal RBAC Matrix (*Admin*, *DNS Operator*, *Security Engineer*, *Auditor*).
- Bilingual localization engine (English / Vietnamese) with persistent language state.
