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
  },
  dns_operator: {
    canEditDns: true,
    canEditWaf: false,
    canEditSsl: false,
    canEditPageRules: false,
    canPurgeCache: true,
    canAutoFix: false,
    canManageAccounts: false,
  },
  security_engineer: {
    canEditDns: false,
    canEditWaf: true,
    canEditSsl: true,
    canEditPageRules: true,
    canPurgeCache: true,
    canAutoFix: true,
    canManageAccounts: false,
  },
  viewer: {
    canEditDns: false,
    canEditWaf: false,
    canEditSsl: false,
    canEditPageRules: false,
    canPurgeCache: false,
    canAutoFix: false,
    canManageAccounts: false,
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
