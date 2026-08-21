export class CloudflareApiError extends Error {
  status: number;
  errors: Array<{ code: number; message: string }>;
  
  constructor(status: number, errors: Array<{ code: number; message: string }>, message?: string) {
    super(message || (errors && errors.length > 0 ? errors.map(e => e.message).join(', ') : `Cloudflare API Error (${status})`));
    this.name = 'CloudflareApiError';
    this.status = status;
    this.errors = errors || [];
  }
}

export class CloudflareClient {
  private token: string;
  private baseUrl = 'https://api.cloudflare.com/client/v4';

  constructor(token: string) {
    this.token = token.trim();
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = endpoint.startsWith('http') ? endpoint : `${this.baseUrl}${endpoint.startsWith('/') ? '' : '/'}${endpoint}`;
    
    const headers: Record<string, string> = {
      'Authorization': `Bearer ${this.token}`,
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string> || {}),
    };

    const response = await fetch(url, {
      ...options,
      headers,
    });

    const data = await response.json();

    if (!response.ok || !data.success) {
      // In GraphQL, data.errors might exist while data.success is not defined
      if (endpoint.includes('graphql') && data.data) {
        return data.data as T;
      }
      const errors = data.errors || [{ code: response.status, message: response.statusText || 'Unknown Error' }];
      throw new CloudflareApiError(response.status, errors, data.messages?.join(', '));
    }

    return data.result as T;
  }

  // --- Auth Verification & User / Account Details ---
  async verifyToken(): Promise<{ id: string; status: string }> {
    return this.request<{ id: string; status: string }>('/user/tokens/verify');
  }

  async getAccounts(): Promise<any[]> {
    return this.request<any[]>('/accounts');
  }

  // --- Zones ---
  async getZones(): Promise<any[]> {
    return this.request<any[]>('/zones?per_page=50');
  }

  async getZone(zoneId: string): Promise<any> {
    return this.request<any>(`/zones/${zoneId}`);
  }

  async purgeCache(zoneId: string, options: { purge_everything?: boolean; files?: string[]; tags?: string[]; hosts?: string[] }): Promise<any> {
    return this.request<any>(`/zones/${zoneId}/purge_cache`, {
      method: 'POST',
      body: JSON.stringify(options),
    });
  }

  async updateZoneSetting(zoneId: string, settingId: string, value: any): Promise<any> {
    return this.request<any>(`/zones/${zoneId}/settings/${settingId}`, {
      method: 'PATCH',
      body: JSON.stringify({ value }),
    });
  }

  async getZoneSetting(zoneId: string, settingId: string): Promise<any> {
    return this.request<any>(`/zones/${zoneId}/settings/${settingId}`);
  }

  async getZoneSettings(zoneId: string): Promise<any[]> {
    return this.request<any[]>(`/zones/${zoneId}/settings`);
  }

  // --- DNS Records ---
  async getDnsRecords(zoneId: string): Promise<any[]> {
    return this.request<any[]>(`/zones/${zoneId}/dns_records?per_page=100`);
  }

  async createDnsRecord(zoneId: string, record: { type: string; name: string; content: string; ttl?: number; proxied?: boolean; priority?: number; comment?: string }): Promise<any> {
    return this.request<any>(`/zones/${zoneId}/dns_records`, {
      method: 'POST',
      body: JSON.stringify(record),
    });
  }

  async updateDnsRecord(zoneId: string, recordId: string, record: Partial<{ type: string; name: string; content: string; ttl: number; proxied: boolean; priority?: number; comment?: string }>): Promise<any> {
    return this.request<any>(`/zones/${zoneId}/dns_records/${recordId}`, {
      method: 'PATCH',
      body: JSON.stringify(record),
    });
  }

  async deleteDnsRecord(zoneId: string, recordId: string): Promise<{ id: string }> {
    return this.request<{ id: string }>(`/zones/${zoneId}/dns_records/${recordId}`, {
      method: 'DELETE',
    });
  }

  async getDnssec(zoneId: string): Promise<any> {
    return this.request<any>(`/zones/${zoneId}/dnssec`);
  }

  async setDnssec(zoneId: string, status: 'active' | 'disabled'): Promise<any> {
    return this.request<any>(`/zones/${zoneId}/dnssec`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    });
  }

  // --- SSL/TLS & Certificates ---
  async getSslSetting(zoneId: string): Promise<any> {
    return this.request<any>(`/zones/${zoneId}/settings/ssl`);
  }

  async setSslSetting(zoneId: string, value: 'off' | 'flexible' | 'full' | 'strict'): Promise<any> {
    return this.updateZoneSetting(zoneId, 'ssl', value);
  }

  async getCertificates(zoneId: string): Promise<any[]> {
    try {
      return await this.request<any[]>(`/zones/${zoneId}/ssl/certificate_packs`);
    } catch {
      return [];
    }
  }

  // --- WAF / Firewall / IP Access Rules ---
  async getFirewallRules(zoneId: string): Promise<any[]> {
    try {
      return await this.request<any[]>(`/zones/${zoneId}/firewall/rules`);
    } catch {
      return [];
    }
  }

  async createFirewallRule(zoneId: string, rule: { action: string; description: string; filter: { expression: string; description?: string } }): Promise<any> {
    return this.request<any>(`/zones/${zoneId}/firewall/rules`, {
      method: 'POST',
      body: JSON.stringify([rule]),
    });
  }

  async deleteFirewallRule(zoneId: string, ruleId: string): Promise<any> {
    return this.request<any>(`/zones/${zoneId}/firewall/rules/${ruleId}`, {
      method: 'DELETE',
    });
  }

  async getIpAccessRules(zoneId: string): Promise<any[]> {
    try {
      return await this.request<any[]>(`/zones/${zoneId}/firewall/access_rules/rules`);
    } catch {
      return [];
    }
  }

  async createIpAccessRule(zoneId: string, rule: { mode: string; configuration: { target: string; value: string }; notes?: string }): Promise<any> {
    return this.request<any>(`/zones/${zoneId}/firewall/access_rules/rules`, {
      method: 'POST',
      body: JSON.stringify(rule),
    });
  }

  async deleteIpAccessRule(zoneId: string, ruleId: string): Promise<any> {
    return this.request<any>(`/zones/${zoneId}/firewall/access_rules/rules/${ruleId}`, {
      method: 'DELETE',
    });
  }

  // --- Page Rules ---
  async getPageRules(zoneId: string): Promise<any[]> {
    return this.request<any[]>(`/zones/${zoneId}/pagerules`);
  }

  async createPageRule(zoneId: string, rule: { targets: any[]; actions: any[]; priority?: number; status?: string }): Promise<any> {
    return this.request<any>(`/zones/${zoneId}/pagerules`, {
      method: 'POST',
      body: JSON.stringify(rule),
    });
  }

  async deletePageRule(zoneId: string, ruleId: string): Promise<any> {
    return this.request<any>(`/zones/${zoneId}/pagerules/${ruleId}`, {
      method: 'DELETE',
    });
  }

  // --- Analytics ---
  async getAnalyticsDashboard(zoneId: string, sinceHours = 24): Promise<any> {
    const sinceMinutes = sinceHours * 60;
    try {
      return await this.request<any>(`/zones/${zoneId}/analytics/dashboard?since=-${sinceMinutes}&continuous=true`);
    } catch {
      try {
        return await this.request<any>(`/zones/${zoneId}/analytics/dashboard?since=-${sinceMinutes}`);
      } catch {
        return null;
      }
    }
  }

  async getGraphQLAnalytics(zoneId: string, sinceHours = 24): Promise<any> {
    try {
      const now = new Date();
      const since = new Date(now.getTime() - sinceHours * 60 * 60 * 1000).toISOString();
      const until = now.toISOString();

      const query = `
        query ZoneHttpAnalytics($zoneTag: String!, $since: String!, $until: String!) {
          viewer {
            zones(filter: { zoneTag: $zoneTag }) {
              httpRequests1hGroups(
                limit: 100
                filter: { datetime_geq: $since, datetime_lt: $until }
                orderBy: [datetime_ASC]
              ) {
                dimensions {
                  datetime
                }
                sum {
                  requests
                  cachedRequests
                  bytes
                  cachedBytes
                  threats
                  encryptedRequests
                  encryptedBytes
                  pageViews
                }
              }
            }
          }
        }
      `;

      const res = await this.request<any>('/graphql', {
        method: 'POST',
        body: JSON.stringify({ query, variables: { zoneTag: zoneId, since, until } }),
      });

      return res;
    } catch {
      return null;
    }
  }
}
