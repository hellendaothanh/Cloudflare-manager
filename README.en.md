# Cloudflare DevSecOps Management Platform 🛡️⚡

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

### 1. Zone Management & Emergency Operations (Zones & Quick Actions)
- Centralized overview of active zones, domains, status, nameservers, and subscription plans.
- **Emergency Quick Actions**:
  - Instant cache purging (**Purge Everything** or selective URL list).
  - Toggle **Development Mode** (bypasses CDN cache for 3 hours).
  - Activate **I'm Under Attack!** mode (emergency DDoS challenge for all inbound visitors).

### 2. Advanced DNS Management (DNS Records Manager)
- Full CRUD operations for DNS record types: `A`, `AAAA`, `CNAME`, `TXT`, `MX`, `NS`, `SRV`, `CAA`, `PTR`.
- 1-Click toggle for **Cloudflare Proxy (Orange Cloud / CDN & WAF protection)**.
- Standard **BIND Zone File export (`.zone.txt`)**.

### 3. Web Application Firewall (WAF & Firewall Shield)
- Manage **Custom Firewall Rules** using Cloudflare `Wirefilter` expressions (IP, URI, Headers, Threat Score).
- **IP Access Rules**: Whitelist, Block, and Challenge policies for Single IPs, CIDR blocks, ASNs, or Country codes.
- **Security Level** configuration and **Bot Fight Mode** status.

### 4. SSL/TLS Encryption & Certificates Center
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

### 3. Configure API Token
- Enter your Cloudflare API Token directly via the **"Cloudflare API Token"** modal in the top navigation.
- Or specify it in your `.env` file:
```env
CLOUDFLARE_API_TOKEN=your_cloudflare_api_token_here
```

### 4. Recommended API Token Permissions
When creating an API Token at [Cloudflare API Tokens](https://dash.cloudflare.com/profile/api-tokens), select **Create Custom Token** and grant the following permissions:

| Permission Group | Permission Name | Access Level | Purpose |
| :--- | :--- | :--- | :--- |
| `Zone` | **Zone** | **Read** | View zones list and account metadata |
| `Zone` | **Zone Settings** | **Edit** | Manage SSL Mode, TLS 1.3, Always Use HTTPS, HSTS, Dev Mode |
| `Zone` | **SSL and Certificates** | **Edit** | Query and manage Edge certificates |
| `Zone` | **DNS** | **Edit** | Create, update, delete DNS records and proxy states |
| `Zone` | **Firewall Services** | **Edit** | Manage Custom WAF Rules and IP Access Rules |
| `Zone` | **Page Rules** | **Edit** | Configure URL redirects and cache overrides |
| `Zone` | **Analytics** | **Read** | Access traffic telemetry and threat data |

---

## 🔒 Security Architecture
- All communication with Cloudflare API v4 is proxied via **Server-Side Route Handlers (BFF Architecture)**.
- API Tokens remain secured on the server and are never exposed to client browsers.
- Built-in **Sandbox Demo Mode** allows full feature exploration with simulated infrastructure without requiring live Cloudflare credentials.
