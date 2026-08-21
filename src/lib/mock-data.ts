import { Zone, DnsRecord, FirewallRule, IpAccessRule, AnalyticsSummary } from "@/types/cloudflare";

export const MOCK_ZONES: Zone[] = [
  {
    id: "zone-corp-01",
    name: "security-enterprise.io",
    status: "active",
    paused: false,
    type: "full",
    development_mode: 0,
    name_servers: ["amy.ns.cloudflare.com", "dave.ns.cloudflare.com"],
    original_registrar: "Cloudflare Registrar",
    account: {
      id: "acc-sec-99",
      name: "DevSecOps Production Team",
    },
    plan: {
      id: "pro",
      name: "Pro Plan",
      price: 20,
      currency: "USD",
      frequency: "monthly",
      is_subscribed: true,
      can_subscribe: true,
    },
    created_on: "2025-01-10T08:00:00.000Z",
  },
  {
    id: "zone-fintech-02",
    name: "fintech-bank.cloud",
    status: "active",
    paused: false,
    type: "full",
    development_mode: 0,
    name_servers: ["eric.ns.cloudflare.com", "kurt.ns.cloudflare.com"],
    account: {
      id: "acc-sec-99",
      name: "DevSecOps Production Team",
    },
    plan: {
      id: "enterprise",
      name: "Enterprise Plan",
      price: 200,
      currency: "USD",
      frequency: "monthly",
      is_subscribed: true,
      can_subscribe: true,
    },
    created_on: "2024-11-20T12:00:00.000Z",
  },
  {
    id: "zone-staging-03",
    name: "staging-app.internal",
    status: "pending",
    paused: false,
    type: "full",
    development_mode: 14400,
    name_servers: ["amy.ns.cloudflare.com", "dave.ns.cloudflare.com"],
    account: {
      id: "acc-sec-99",
      name: "DevSecOps Production Team",
    },
    plan: {
      id: "free",
      name: "Free Plan",
      price: 0,
      currency: "USD",
      frequency: "monthly",
      is_subscribed: true,
      can_subscribe: true,
    },
    created_on: "2025-02-15T09:30:00.000Z",
  }
];

export const MOCK_DNS_RECORDS: DnsRecord[] = [
  {
    id: "rec-1",
    zone_id: "zone-corp-01",
    zone_name: "security-enterprise.io",
    name: "security-enterprise.io",
    type: "A",
    content: "198.51.100.45",
    proxiable: true,
    proxied: true,
    ttl: 1,
    comment: "Production Frontend Cluster",
  },
  {
    id: "rec-2",
    zone_id: "zone-corp-01",
    zone_name: "security-enterprise.io",
    name: "api.security-enterprise.io",
    type: "A",
    content: "198.51.100.88",
    proxiable: true,
    proxied: true,
    ttl: 1,
    comment: "API Gateway Kubernetes Ingress",
  },
  {
    id: "rec-3",
    zone_id: "zone-corp-01",
    zone_name: "security-enterprise.io",
    name: "vpn.security-enterprise.io",
    type: "A",
    content: "203.0.113.12",
    proxiable: true,
    proxied: false,
    ttl: 300,
    comment: "Direct WireGuard VPN Endpoint",
  },
  {
    id: "rec-4",
    zone_id: "zone-corp-01",
    zone_name: "security-enterprise.io",
    name: "security-enterprise.io",
    type: "MX",
    content: "mx1.mailgun.org",
    proxiable: false,
    proxied: false,
    ttl: 3600,
    priority: 10,
    comment: "Mail server",
  },
  {
    id: "rec-5",
    zone_id: "zone-corp-01",
    zone_name: "security-enterprise.io",
    name: "security-enterprise.io",
    type: "TXT",
    content: "v=spf1 include:mailgun.org ~all",
    proxiable: false,
    proxied: false,
    ttl: 3600,
    comment: "SPF Policy",
  },
  {
    id: "rec-6",
    zone_id: "zone-corp-01",
    zone_name: "security-enterprise.io",
    name: "_dmarc.security-enterprise.io",
    type: "TXT",
    content: "v=DMARC1; p=reject; rua=mailto:dmarc@security-enterprise.io",
    proxiable: false,
    proxied: false,
    ttl: 3600,
    comment: "DMARC Enforcement",
  }
];

export const MOCK_FIREWALL_RULES: FirewallRule[] = [
  {
    id: "fw-01",
    paused: false,
    description: "Chặn truy cập Admin Panel từ bên ngoài VPN / Văn phòng",
    action: "managed_challenge",
    priority: 1,
    filter: {
      expression: '(http.request.uri.path contains "/admin" or http.request.uri.path contains "/wp-admin") and not ip.src in {118.69.0.0/16 27.72.0.0/16}',
      description: "Admin Path Protection",
    },
  },
  {
    id: "fw-02",
    paused: false,
    description: "Giới hạn và thách thức các Bot cào dữ liệu có Threat Score > 30",
    action: "js_challenge",
    priority: 2,
    filter: {
      expression: 'cf.threat_score gt 30 and not cf.client.bot',
      description: "High Threat Score Challenge",
    },
  },
  {
    id: "fw-03",
    paused: false,
    description: "Chặn hoàn toàn các request chứa payload SQLi / XSS phổ biến",
    action: "block",
    priority: 3,
    filter: {
      expression: 'http.request.uri.query contains "UNION+SELECT" or http.request.uri.query contains "<script>"',
      description: "Basic Payload Blocker",
    },
  }
];

export const MOCK_IP_RULES: IpAccessRule[] = [
  {
    id: "ip-rule-1",
    mode: "whitelist",
    notes: "Văn phòng DevSecOps Hà Nội (Primary HQ)",
    allowed_modes: ["whitelist", "block", "challenge", "js_challenge"],
    configuration: {
      target: "ip_range",
      value: "118.69.182.0/24",
    },
    created_on: "2025-01-12T00:00:00.000Z",
  },
  {
    id: "ip-rule-2",
    mode: "block",
    notes: "Dải IP tấn công Brute Force SSH & API đã xác nhận",
    allowed_modes: ["whitelist", "block", "challenge", "js_challenge"],
    configuration: {
      target: "ip_range",
      value: "45.142.120.0/24",
    },
    created_on: "2025-02-01T15:20:00.000Z",
  }
];

export const MOCK_ANALYTICS: AnalyticsSummary = {
  requests: {
    total: 3428900,
    cached: 2680400,
    uncached: 748500,
    encrypted: 3415000,
    pageviews: 1250000,
  },
  bandwidth: {
    total: 184500000000, // ~184.5 GB
    cached: 149000000000,
    uncached: 35500000000,
    encrypted: 183200000000,
  },
  threats: {
    total: 14250,
    top_countries: [
      { name: "United States", count: 4820 },
      { name: "China", count: 3290 },
      { name: "Russia", count: 2410 },
      { name: "Vietnam", count: 1830 },
      { name: "Germany", count: 900 },
    ],
    top_types: [
      { name: "WAF Custom Rule Match", count: 6840 },
      { name: "Bad User Agent / Scraper", count: 3420 },
      { name: "IP Access Rule Block", count: 2610 },
      { name: "Rate Limiting Breach", count: 1380 },
    ],
  },
  status_codes: {
    "2xx": 3120000,
    "3xx": 180000,
    "4xx": 114650,
    "5xx": 14250,
  },
  timeseries: [
    { timestamp: "00:00", requests: 120000, cached: 95000, bandwidth: 7200000000, threats: 520 },
    { timestamp: "04:00", requests: 80000, cached: 65000, bandwidth: 4800000000, threats: 310 },
    { timestamp: "08:00", requests: 280000, cached: 220000, bandwidth: 15400000000, threats: 1250 },
    { timestamp: "12:00", requests: 450000, cached: 360000, bandwidth: 24100000000, threats: 2100 },
    { timestamp: "16:00", requests: 520000, cached: 410000, bandwidth: 28500000000, threats: 2650 },
    { timestamp: "20:00", requests: 380000, cached: 300000, bandwidth: 20200000000, threats: 1840 },
  ]
};

export const MOCK_WORKERS = [
  {
    id: "worker-api-gateway",
    name: "edge-api-gateway",
    created_on: "2025-01-15T08:00:00Z",
    modified_on: "2025-02-18T14:22:00Z",
    etag: "e7b92f8a41",
    routes: ["api.security-enterprise.io/*", "auth.security-enterprise.io/oauth/*"],
    usage_model: "standard",
    handlers: ["fetch", "scheduled"],
    compatibility_date: "2024-12-01",
    secrets: [
      { name: "JWT_SECRET_KEY", type: "secret_text", hasValue: true },
      { name: "UPSTREAM_GATEWAY_URL", type: "plain_text", hasValue: true },
      { name: "REDIS_TOKEN", type: "secret_text", hasValue: true },
    ],
    deployments: [
      { id: "dep-v2.4.1", created_on: "2025-02-18T14:22:00Z", author: "devsecops@company.io", version: "v2.4.1", source: "GitHub Actions", status: "active" },
      { id: "dep-v2.4.0", created_on: "2025-02-10T09:15:00Z", author: "devsecops@company.io", version: "v2.4.0", source: "GitHub Actions", status: "superseded" },
    ],
    logTailSample: [
      { timestamp: "15:42:01", level: "info", message: "JWT token verified successfully for sub=usr_8892", durationMs: 4.2, cpuTimeUs: 1800, clientIp: "118.69.182.45", requestMethod: "POST", requestUrl: "https://api.security-enterprise.io/v1/auth/verify", status: 200 },
      { timestamp: "15:42:05", level: "warn", message: "Rate limit threshold nearing capacity (82/100)", durationMs: 3.8, cpuTimeUs: 1400, clientIp: "45.142.120.12", requestMethod: "GET", requestUrl: "https://api.security-enterprise.io/v1/data/feed", status: 200 },
      { timestamp: "15:42:11", level: "error", message: "Unauthorized API key format detected", durationMs: 2.1, cpuTimeUs: 900, clientIp: "103.21.244.9", requestMethod: "GET", requestUrl: "https://api.security-enterprise.io/v1/admin/export", status: 401 },
      { timestamp: "15:42:18", level: "info", message: "Edge cache HIT for static schema definition", durationMs: 0.9, cpuTimeUs: 320, clientIp: "27.72.88.19", requestMethod: "GET", requestUrl: "https://api.security-enterprise.io/schema.json", status: 200 },
    ]
  },
  {
    id: "worker-image-resizer",
    name: "edge-image-transformer",
    created_on: "2025-01-20T10:00:00Z",
    modified_on: "2025-02-15T11:00:00Z",
    etag: "a1c890de44",
    routes: ["security-enterprise.io/cdn-cgi/image/*"],
    usage_model: "bundled",
    handlers: ["fetch"],
    compatibility_date: "2024-11-15",
    secrets: [
      { name: "S3_BUCKET_NAME", type: "plain_text", hasValue: true },
      { name: "AWS_ACCESS_KEY_ID", type: "secret_text", hasValue: true },
    ],
    deployments: [
      { id: "dep-v1.8.0", created_on: "2025-02-15T11:00:00Z", author: "frontend-lead@company.io", version: "v1.8.0", source: "Wrangler CLI", status: "active" },
    ],
    logTailSample: [
      { timestamp: "15:41:50", level: "info", message: "Resized 2.4MB image to WebP 180KB", durationMs: 14.5, cpuTimeUs: 9200, clientIp: "118.69.182.45", requestMethod: "GET", requestUrl: "https://security-enterprise.io/cdn-cgi/image/w=800/hero.png", status: 200 },
    ]
  }
];

export const MOCK_PAGES = [
  {
    id: "pages-portal-frontend",
    name: "security-portal-web",
    subdomain: "security-portal-web.pages.dev",
    production_branch: "main",
    created_on: "2025-01-05T00:00:00Z",
    domains: ["portal.security-enterprise.io", "security-portal-web.pages.dev"],
    latest_deployment: {
      id: "pages-dep-991",
      created_on: "2025-02-19T08:30:00Z",
      status: "success",
      environment: "production",
      short_id: "8c7b1a2",
      commit_hash: "8c7b1a29f8e4e0b3c1d9f8e4e0b3c1d9f8e4e0b3",
      commit_message: "feat(ui): update zero trust dashboard & telemetry widgets",
      url: "https://8c7b1a2.security-portal-web.pages.dev"
    }
  }
];

export const MOCK_RATE_LIMITS = [
  {
    id: "rl-auth-bruteforce",
    disabled: false,
    description: "Chống Brute Force API Đăng nhập & Xác thực OAuth",
    match: {
      request: {
        url: "*.security-enterprise.io/api/v1/auth/login",
        methods: ["POST"],
        schemes: ["HTTPS"],
      },
      response: {
        status: [400, 401, 403],
        origin_traffic: true,
      }
    },
    threshold: 10,
    period: 60,
    action: {
      mode: "ban",
      timeout: 300,
      response: {
        content_type: "application/json",
        body: '{"error": "Too Many Requests", "message": "Quá nhiều yêu cầu đăng nhập thất bại. Vui lòng thử lại sau 5 phút."}'
      }
    },
    created_on: "2025-01-12T00:00:00Z"
  },
  {
    id: "rl-payment-protect",
    disabled: false,
    description: "Bảo vệ Cổng thanh toán & Checkout Endpoint",
    match: {
      request: {
        url: "*.security-enterprise.io/api/v1/checkout/*",
        methods: ["POST"],
        schemes: ["HTTPS"],
      }
    },
    threshold: 15,
    period: 60,
    action: {
      mode: "managed_challenge"
    },
    created_on: "2025-01-18T00:00:00Z"
  },
  {
    id: "rl-anti-scraping",
    disabled: false,
    description: "Giới hạn tần suất cào dữ liệu danh mục & sản phẩm",
    match: {
      request: {
        url: "*.security-enterprise.io/api/v1/catalog/*",
        methods: ["GET"],
        schemes: ["HTTP", "HTTPS"],
      }
    },
    threshold: 120,
    period: 60,
    action: {
      mode: "js_challenge"
    },
    created_on: "2025-02-02T00:00:00Z"
  }
];

export const MOCK_RATE_LIMIT_ANALYTICS = {
  breachesCount: 1420,
  blockedRequestsCount: 890,
  challengedRequestsCount: 530,
  topTargetPaths: [
    { path: "/api/v1/auth/login", count: 740 },
    { path: "/api/v1/checkout/process", count: 410 },
    { path: "/api/v1/catalog/products", count: 270 },
  ],
  topViolatingIps: [
    { ip: "45.142.120.24", country: "Russia", count: 320 },
    { ip: "185.220.101.5", country: "Germany", count: 215 },
    { ip: "103.251.167.88", country: "Vietnam", count: 180 },
    { ip: "198.51.100.99", country: "United States", count: 95 },
  ],
  timeseries: [
    { timestamp: "00:00", breaches: 45, mitigated: 45 },
    { timestamp: "04:00", breaches: 20, mitigated: 20 },
    { timestamp: "08:00", breaches: 110, mitigated: 110 },
    { timestamp: "12:00", breaches: 340, mitigated: 340 },
    { timestamp: "16:00", breaches: 520, mitigated: 520 },
    { timestamp: "20:00", breaches: 385, mitigated: 385 },
  ]
};

export const MOCK_ACCESS_APPS = [
  {
    id: "app-internal-jira",
    name: "Internal DevOps Portal & Jira",
    domain: "jira.security-enterprise.io",
    type: "self_hosted",
    session_duration: "24h",
    aud: "aud_9981a7b64c20e",
    created_at: "2025-01-10T00:00:00Z",
    updated_at: "2025-02-14T00:00:00Z",
    allowed_idps: ["Google Workspace", "GitHub Enterprise SAML"],
    policies_count: 2,
    policies: [
      {
        id: "pol-corp-staff",
        name: "Cho phép toàn bộ Nhân sự DevSecOps @company.io",
        decision: "allow",
        rules: {
          include: [{ email_domain: "security-enterprise.io" }],
          require: [{ email_domain: "security-enterprise.io" }]
        }
      },
      {
        id: "pol-contractors",
        name: "Đối tác & Nhà thầu chỉ định",
        decision: "allow",
        rules: {
          include: [{ email: "contractor-audit@partner.org" }]
        }
      }
    ]
  },
  {
    id: "app-grafana-metrics",
    name: "Grafana & Prometheus Observability",
    domain: "grafana.security-enterprise.io",
    type: "self_hosted",
    session_duration: "12h",
    aud: "aud_1120f5c88b43d",
    created_at: "2025-01-15T00:00:00Z",
    updated_at: "2025-02-10T00:00:00Z",
    allowed_idps: ["Google Workspace"],
    policies_count: 1,
    policies: [
      {
        id: "pol-sre-team",
        name: "SRE & SecOps Group",
        decision: "allow",
        rules: {
          include: [{ group: "SecOps-Engineers" }]
        }
      }
    ]
  }
];

export const MOCK_TUNNELS = [
  {
    id: "tun-prod-k8s-01",
    name: "prod-k8s-edge-ingress",
    status: "healthy",
    created_at: "2025-01-10T00:00:00Z",
    deleted_at: null,
    connections_count: 4,
    active_connectors: [
      { id: "conn-node-01", version: "2024.12.2", arch: "linux_amd64", origin_ip: "10.0.1.15", opened_at: "2025-02-01T00:00:00Z" },
      { id: "conn-node-02", version: "2024.12.2", arch: "linux_amd64", origin_ip: "10.0.1.16", opened_at: "2025-02-01T00:00:00Z" }
    ],
    ingress_rules: [
      { hostname: "jira.security-enterprise.io", service: "http://10.0.1.50:8080" },
      { hostname: "grafana.security-enterprise.io", service: "http://10.0.1.60:3000" },
      { hostname: "api.security-enterprise.io", service: "http://10.0.2.100:80" }
    ]
  },
  {
    id: "tun-staging-lab-02",
    name: "staging-internal-lab",
    status: "healthy",
    created_at: "2025-02-01T00:00:00Z",
    deleted_at: null,
    connections_count: 2,
    active_connectors: [
      { id: "conn-lab-node", version: "2024.12.2", arch: "linux_arm64", origin_ip: "192.168.1.100", opened_at: "2025-02-15T00:00:00Z" }
    ],
    ingress_rules: [
      { hostname: "staging.security-enterprise.io", service: "http://localhost:8000" }
    ]
  }
];

