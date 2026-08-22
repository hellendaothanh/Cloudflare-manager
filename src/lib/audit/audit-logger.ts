import { SystemAuditLogEntry, UserRole, AuditActionType } from '@/types/cloudflare';

const STORAGE_KEY = 'cf_system_audit_logs';

export const INITIAL_MOCK_AUDIT_LOGS: SystemAuditLogEntry[] = [
  {
    id: 'log-1001',
    timestamp: new Date(Date.now() - 1000 * 60 * 12).toISOString(),
    actorName: 'Admin Ops (DevSecOps Lead)',
    actorRole: 'admin',
    actionType: 'TOGGLE_DEV_MODE',
    zoneName: 'security-enterprise.io',
    resource: 'Development Mode: ENABLED (3h auto-expire)',
    status: 'SUCCESS',
    details: 'Enabled Development Mode on domain security-enterprise.io for staging release verification.',
    ipAddress: '118.69.182.45',
  },
  {
    id: 'log-1002',
    timestamp: new Date(Date.now() - 1000 * 60 * 35).toISOString(),
    actorName: 'SecOps Engineer',
    actorRole: 'security_engineer',
    actionType: 'PURGE_CACHE',
    zoneName: 'security-enterprise.io',
    resource: 'Granular Cache: Hosts (api.security-enterprise.io)',
    status: 'SUCCESS',
    details: 'Executed granular host cache purge for api.security-enterprise.io.',
    ipAddress: '14.161.40.12',
  },
  {
    id: 'log-1003',
    timestamp: new Date(Date.now() - 1000 * 60 * 90).toISOString(),
    actorName: 'SecOps Engineer',
    actorRole: 'security_engineer',
    actionType: 'UPDATE_SSL',
    zoneName: 'security-enterprise.io',
    resource: 'SSL Encryption Mode: Full ➔ Strict',
    status: 'SUCCESS',
    details: 'Upgraded SSL/TLS encryption mode to Strict to enforce CIS Benchmark compliance.',
    ipAddress: '14.161.40.12',
  },
  {
    id: 'log-1004',
    timestamp: new Date(Date.now() - 1000 * 60 * 180).toISOString(),
    actorName: 'DNS Operator',
    actorRole: 'dns_operator',
    actionType: 'CREATE_DNS',
    zoneName: 'security-enterprise.io',
    resource: 'DNS Record: A api.security-enterprise.io ➔ 104.21.45.10 (Proxied)',
    status: 'SUCCESS',
    details: 'Created new DNS Type A record with Cloudflare CDN Proxy enabled.',
    ipAddress: '125.235.10.88',
  },
  {
    id: 'log-1005',
    timestamp: new Date(Date.now() - 1000 * 60 * 360).toISOString(),
    actorName: 'Admin Ops',
    actorRole: 'admin',
    actionType: 'RESTORE_SNAPSHOT',
    zoneName: 'security-enterprise.io',
    resource: 'Snapshot Rollback: "Baseline Release v2.4"',
    status: 'SUCCESS',
    details: 'Executed full zone configuration rollback from JSON snapshot Baseline Release v2.4.',
    ipAddress: '118.69.182.45',
  },
];

class AuditLoggerService {
  private getStorage(): SystemAuditLogEntry[] {
    if (typeof window === 'undefined') return INITIAL_MOCK_AUDIT_LOGS;
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(INITIAL_MOCK_AUDIT_LOGS));
        return INITIAL_MOCK_AUDIT_LOGS;
      }
      return JSON.parse(raw);
    } catch {
      return INITIAL_MOCK_AUDIT_LOGS;
    }
  }

  private saveStorage(logs: SystemAuditLogEntry[]) {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(logs));
      window.dispatchEvent(new CustomEvent('cf_audit_log_updated'));
    } catch (e) {
      console.error('Failed to save audit log:', e);
    }
  }

  public getLogs(): SystemAuditLogEntry[] {
    return this.getStorage();
  }

  public recordLog(entry: {
    actorName?: string;
    actorRole?: UserRole;
    actionType: AuditActionType;
    zoneName: string;
    zoneId?: string;
    resource: string;
    status?: 'SUCCESS' | 'FAILED' | 'WARNING';
    details: string;
  }): SystemAuditLogEntry {
    const activeRole = (typeof window !== 'undefined' ? localStorage.getItem('cf_user_role') : 'admin') as UserRole || 'admin';
    const newEntry: SystemAuditLogEntry = {
      id: `log-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      timestamp: new Date().toISOString(),
      actorName: entry.actorName || 'Current Operator',
      actorRole: entry.actorRole || activeRole,
      actionType: entry.actionType,
      zoneName: entry.zoneName,
      zoneId: entry.zoneId,
      resource: entry.resource,
      status: entry.status || 'SUCCESS',
      details: entry.details,
      ipAddress: 'Client Web Console',
    };

    const current = this.getStorage();
    const updated = [newEntry, ...current].slice(0, 200); // keep last 200 logs
    this.saveStorage(updated);
    return newEntry;
  }

  public clearLogs() {
    this.saveStorage([]);
  }

  public exportAsJson(): string {
    const logs = this.getLogs();
    return JSON.stringify(logs, null, 2);
  }

  public exportAsCsv(): string {
    const logs = this.getLogs();
    const headers = ['ID', 'Timestamp', 'Actor Name', 'Role', 'Action Type', 'Zone Name', 'Resource', 'Status', 'Details'];
    const rows = logs.map((l) => [
      `"${l.id}"`,
      `"${l.timestamp}"`,
      `"${l.actorName.replace(/"/g, '""')}"`,
      `"${l.actorRole}"`,
      `"${l.actionType}"`,
      `"${l.zoneName}"`,
      `"${l.resource.replace(/"/g, '""')}"`,
      `"${l.status}"`,
      `"${l.details.replace(/"/g, '""')}"`,
    ]);
    return [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
  }
}

export const auditLogger = new AuditLoggerService();
