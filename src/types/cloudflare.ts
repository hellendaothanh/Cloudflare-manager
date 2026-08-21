export interface CloudflareAuthContext {
  apiToken: string;
}

export type UserRole = 'admin' | 'dns_operator' | 'security_engineer' | 'viewer';

export interface RolePermissions {
  canEditDns: boolean;
  canEditWaf: boolean;
  canEditSsl: boolean;
  canEditPageRules: boolean;
  canPurgeCache: boolean;
  canAutoFix: boolean;
  canManageAccounts: boolean;
  canManageWorkers: boolean;
  canManageRateLimit: boolean;
  canManageZeroTrust: boolean;
}

export const ROLE_PERMISSIONS_MAP: Record<UserRole, RolePermissions> = {
  admin: {
    canEditDns: true,
    canEditWaf: true,
    canEditSsl: true,
    canEditPageRules: true,
    canPurgeCache: true,
    canAutoFix: true,
    canManageAccounts: true,
    canManageWorkers: true,
    canManageRateLimit: true,
    canManageZeroTrust: true,
  },
  dns_operator: {
    canEditDns: true,
    canEditWaf: false,
    canEditSsl: false,
    canEditPageRules: false,
    canPurgeCache: true,
    canAutoFix: false,
    canManageAccounts: false,
    canManageWorkers: false,
    canManageRateLimit: false,
    canManageZeroTrust: false,
  },
  security_engineer: {
    canEditDns: false,
    canEditWaf: true,
    canEditSsl: true,
    canEditPageRules: true,
    canPurgeCache: true,
    canAutoFix: true,
    canManageAccounts: false,
    canManageWorkers: true,
    canManageRateLimit: true,
    canManageZeroTrust: true,
  },
  viewer: {
    canEditDns: false,
    canEditWaf: false,
    canEditSsl: false,
    canEditPageRules: false,
    canPurgeCache: false,
    canAutoFix: false,
    canManageAccounts: false,
    canManageWorkers: false,
    canManageRateLimit: false,
    canManageZeroTrust: false,
  },
};

export interface CloudflareAccountProfile {
  id: string;
  name: string;
  token: string;
  organization?: string;
  addedAt: string;
  isDemo?: boolean;
}

export interface Zone {
  id: string;
  name: string;
  status: 'active' | 'pending' | 'initializing' | 'moved' | 'deleted' | 'deactivated';
  paused: boolean;
  type: string;
  development_mode: number;
  name_servers: string[];
  original_name_servers?: string[];
  original_registrar?: string;
  original_dnshost?: string;
  account: {
    id: string;
    name: string;
  };
  plan?: {
    id: string;
    name: string;
    price: number;
    currency: string;
    frequency: string;
    is_subscribed: boolean;
    can_subscribe: boolean;
  };
  created_on?: string;
  modified_on?: string;
}

export interface DnsRecord {
  id: string;
  zone_id: string;
  zone_name: string;
  name: string;
  type: 'A' | 'AAAA' | 'CNAME' | 'TXT' | 'MX' | 'NS' | 'SRV' | 'CAA' | 'PTR' | string;
  content: string;
  proxiable: boolean;
  proxied: boolean;
  ttl: number;
  priority?: number;
  comment?: string;
  tags?: string[];
  created_on?: string;
  modified_on?: string;
}

export interface FirewallRule {
  id: string;
  paused: boolean;
  description: string;
  action: 'block' | 'challenge' | 'js_challenge' | 'managed_challenge' | 'allow' | 'bypass' | 'log';
  priority?: number;
  filter?: {
    id?: string;
    expression: string;
    paused?: boolean;
    description?: string;
  };
  products?: string[];
}

export interface IpAccessRule {
  id: string;
  notes?: string;
  allowed_modes: string[];
  mode: 'block' | 'challenge' | 'whitelist' | 'js_challenge' | 'managed_challenge';
  configuration: {
    target: 'ip' | 'ip_range' | 'asn' | 'country';
    value: string;
  };
  created_on?: string;
  modified_on?: string;
  scope?: {
    id: string;
    name: string;
    type: string;
  };
}

export interface SslSetting {
  id: 'ssl';
  value: 'off' | 'flexible' | 'full' | 'strict';
  editable: boolean;
  modified_on?: string;
}

export interface TlsSetting {
  id: 'min_tls_version' | 'tls_1_3' | 'security_header' | 'automatic_https_rewrites' | 'always_use_https' | 'security_level';
  value: any;
  editable?: boolean;
  modified_on?: string;
}

export interface HstsConfig {
  enabled: boolean;
  max_age: number;
  include_subdomains: boolean;
  nosniff: boolean;
  preload: boolean;
}

export interface PageRule {
  id: string;
  targets: Array<{
    target: 'url';
    constraint: {
      operator: 'matches';
      value: string;
    };
  }>;
  actions: Array<{
    id: string;
    value?: any;
  }>;
  priority: number;
  status: 'active' | 'disabled';
  created_on?: string;
  modified_on?: string;
}

export interface AnalyticsSummary {
  requests: {
    total: number;
    cached: number;
    uncached: number;
    encrypted: number;
    pageviews: number;
  };
  bandwidth: {
    total: number;
    cached: number;
    uncached: number;
    encrypted: number;
  };
  threats: {
    total: number;
    top_countries: Array<{ name: string; count: number }>;
    top_types: Array<{ name: string; count: number }>;
  };
  status_codes: {
    '2xx': number;
    '3xx': number;
    '4xx': number;
    '5xx': number;
  };
  timeseries: Array<{
    timestamp: string;
    requests: number;
    cached: number;
    bandwidth: number;
    threats: number;
  }>;
}

export interface SecurityAuditResult {
  score: number; // 0-100
  grade: 'A+' | 'A' | 'B' | 'C' | 'D' | 'F';
  zone_id: string;
  zone_name: string;
  scanned_at: string;
  checks: Array<{
    id: string;
    title: string;
    category: 'SSL/TLS' | 'DNS' | 'WAF' | 'Network' | 'Headers';
    severity: 'critical' | 'high' | 'medium' | 'low' | 'info';
    passed: boolean;
    current_value: string | boolean | number;
    recommended_value: string;
    description: string;
    remediation_action?: string;
  }>;
}

export interface ZoneConfigSnapshot {
  version: string;
  exported_at: string;
  zone: Zone;
  dns_records: DnsRecord[];
  ssl_mode: string;
  min_tls_version: string;
  always_use_https: boolean;
  hsts: HstsConfig;
  security_level: string;
  firewall_rules: FirewallRule[];
  ip_access_rules: IpAccessRule[];
  page_rules: PageRule[];
}

// --- Cloudflare Workers & Pages ---
export interface WorkerSecret {
  name: string;
  type: 'secret_text' | 'plain_text';
  hasValue?: boolean;
}

export interface WorkerDeployment {
  id: string;
  created_on: string;
  author: string;
  version: string;
  source: string;
  status: 'active' | 'superseded' | 'failed';
}

export interface WorkerScript {
  id: string;
  name: string;
  created_on: string;
  modified_on: string;
  etag: string;
  routes: string[];
  usage_model: 'bundled' | 'unbound' | 'standard';
  handlers: string[];
  compatibility_date?: string;
  secrets?: WorkerSecret[];
  deployments?: WorkerDeployment[];
  logTailSample?: Array<{
    timestamp: string;
    level: 'info' | 'warn' | 'error' | 'log';
    message: string;
    durationMs: number;
    cpuTimeUs: number;
    clientIp: string;
    requestMethod: string;
    requestUrl: string;
    status: number;
  }>;
}

export interface PagesProject {
  id: string;
  name: string;
  subdomain: string;
  production_branch: string;
  created_on: string;
  domains: string[];
  latest_deployment?: {
    id: string;
    created_on: string;
    status: 'success' | 'building' | 'failed';
    environment: 'production' | 'preview';
    short_id: string;
    commit_hash?: string;
    commit_message?: string;
    url: string;
  };
}

// --- Rate Limiting Rules & Analytics ---
export interface RateLimitRule {
  id: string;
  disabled: boolean;
  description: string;
  match: {
    request: {
      url: string;
      methods?: string[];
      schemes?: string[];
    };
    response?: {
      status?: number[];
      origin_traffic?: boolean;
      headers?: Record<string, string>;
    };
  };
  threshold: number; // e.g. 100 requests
  period: number; // in seconds, e.g. 60
  action: {
    mode: 'simulate' | 'ban' | 'challenge' | 'js_challenge' | 'managed_challenge';
    timeout?: number; // timeout for ban mode in seconds
    response?: {
      content_type: string;
      body: string;
    };
  };
  bypass?: Array<{ name: string; value: string }>;
  created_on?: string;
}

export interface RateLimitAnalytics {
  breachesCount: number;
  blockedRequestsCount: number;
  challengedRequestsCount: number;
  topTargetPaths: Array<{ path: string; count: number }>;
  topViolatingIps: Array<{ ip: string; country: string; count: number }>;
  timeseries: Array<{
    timestamp: string;
    breaches: number;
    mitigated: number;
  }>;
}

// --- Zero Trust Access & Cloudflare Tunnels ---
export interface ZeroTrustAccessApp {
  id: string;
  name: string;
  domain: string;
  type: 'self_hosted' | 'saas' | 'bookmark';
  session_duration: string;
  aud: string;
  created_at: string;
  updated_at: string;
  allowed_idps: string[];
  policies_count: number;
  policies?: Array<{
    id: string;
    name: string;
    decision: 'allow' | 'deny' | 'bypass';
    rules: {
      include: Array<{ email?: string; email_domain?: string; ip?: string; group?: string }>;
      require?: Array<{ email?: string; email_domain?: string }>;
      exclude?: Array<{ email?: string }>;
    };
  }>;
}

export interface CloudflareTunnel {
  id: string;
  name: string;
  status: 'healthy' | 'down' | 'inactive' | 'degraded';
  created_at: string;
  deleted_at?: string | null;
  connections_count: number;
  active_connectors: Array<{
    id: string;
    version: string;
    arch: string;
    origin_ip: string;
    opened_at: string;
  }>;
  ingress_rules: Array<{
    hostname: string;
    service: string;
    path?: string;
  }>;
}
