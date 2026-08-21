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
