'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useLanguage } from '@/context/LanguageContext';
import { SystemAuditLogEntry, UserRole, AuditActionType } from '@/types/cloudflare';
import { auditLogger } from '@/lib/audit/audit-logger';
import { formatDate } from '@/lib/utils';
import { 
  Search, 
  Download, 
  Trash2, 
  Filter, 
  CheckCircle2, 
  AlertTriangle, 
  Clock, 
  User, 
  ShieldCheck, 
  Globe, 
  FileText,
  Layers,
  Zap,
  Lock,
  RotateCcw
} from 'lucide-react';

export const AuditTrailTab: React.FC = () => {
  const { role, hasPermission } = useAuth();
  const { t } = useLanguage();
  const isAdmin = role === 'admin';

  const [logs, setLogs] = useState<SystemAuditLogEntry[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('ALL');
  const [actionFilter, setActionFilter] = useState<string>('ALL');
  const [notification, setNotification] = useState<string | null>(null);

  const refreshLogs = () => {
    setLogs(auditLogger.getLogs());
  };

  useEffect(() => {
    refreshLogs();
    const handleUpdate = () => refreshLogs();
    window.addEventListener('cf_audit_log_updated', handleUpdate);
    return () => window.removeEventListener('cf_audit_log_updated', handleUpdate);
  }, []);

  const handleExportJson = () => {
    const jsonStr = auditLogger.exportAsJson();
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `cloudflare-audit-trail-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    setNotification('Đã xuất file audit-trail.json thành công!');
    setTimeout(() => setNotification(null), 3000);
  };

  const handleExportCsv = () => {
    const csvStr = auditLogger.exportAsCsv();
    const blob = new Blob([csvStr], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `cloudflare-audit-trail-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    setNotification('Đã xuất file audit-trail.csv thành công!');
    setTimeout(() => setNotification(null), 3000);
  };

  const handleClearLogs = () => {
    if (!isAdmin) return;
    if (!confirm('Bạn có chắc chắn muốn xóa toàn bộ nhật ký thao tác không?')) return;
    auditLogger.clearLogs();
    refreshLogs();
    setNotification(t.auditView.messages.logsCleared);
    setTimeout(() => setNotification(null), 3000);
  };

  const filteredLogs = logs.filter((log) => {
    const matchSearch = 
      log.actorName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.zoneName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.actionType.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.details.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.resource.toLowerCase().includes(searchTerm.toLowerCase());

    const matchRole = roleFilter === 'ALL' || log.actorRole === roleFilter;
    const matchAction = actionFilter === 'ALL' || log.actionType === actionFilter;

    return matchSearch && matchRole && matchAction;
  });

  const getActionBadgeColor = (action: AuditActionType) => {
    switch (action) {
      case 'TOGGLE_DEV_MODE':
        return 'bg-amber-500/15 text-amber-400 border-amber-500/30';
      case 'PURGE_CACHE':
        return 'bg-rose-500/15 text-rose-400 border-rose-500/30';
      case 'UPDATE_SSL':
        return 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30';
      case 'CREATE_DNS':
      case 'UPDATE_DNS':
      case 'DELETE_DNS':
        return 'bg-cyan-500/15 text-cyan-400 border-cyan-500/30';
      case 'RESTORE_SNAPSHOT':
        return 'bg-purple-500/15 text-purple-400 border-purple-500/30';
      default:
        return 'bg-gray-800 text-gray-300 border-gray-700';
    }
  };

  return (
    <div className="space-y-4">
      {/* Header Controls */}
      <div className="p-5 rounded-2xl bg-gray-900/70 border border-gray-800 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <Clock className="w-5 h-5 text-orange-400" />
              <span>{t.auditView.auditTrailSection.title}</span>
            </h2>
            <p className="text-xs text-gray-400">
              {t.auditView.auditTrailSection.subtitle}
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={handleExportCsv}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gray-800 hover:bg-gray-750 text-gray-300 border border-gray-700 text-xs font-semibold transition-colors"
            >
              <Download className="w-3.5 h-3.5" />
              <span>{t.auditView.auditTrailSection.exportCsvBtn}</span>
            </button>

            <button
              onClick={handleExportJson}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gray-800 hover:bg-gray-750 text-cyan-400 border border-gray-700 text-xs font-semibold transition-colors"
            >
              <FileText className="w-3.5 h-3.5" />
              <span>{t.auditView.auditTrailSection.exportJsonBtn}</span>
            </button>

            {isAdmin && (
              <button
                onClick={handleClearLogs}
                className="p-1.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 transition-colors"
                title={t.auditView.auditTrailSection.clearBtn}
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {notification && (
          <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{notification}</span>
          </div>
        )}

        {/* Search & Filters */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div className="relative">
            <Search className="w-4 h-4 text-gray-500 absolute left-3 top-2.5" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder={t.auditView.auditTrailSection.searchPlaceholder}
              className="w-full bg-gray-950 border border-gray-800 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-orange-500"
            />
          </div>

          <div>
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="w-full bg-gray-950 border border-gray-800 rounded-xl px-3 py-2 text-xs text-gray-300 focus:outline-none focus:border-orange-500"
            >
              <option value="ALL">{t.auditView.auditTrailSection.filterAllRoles}</option>
              <option value="admin">👑 Admin</option>
              <option value="dns_operator">🌐 DNS Operator</option>
              <option value="security_engineer">🛡️ Security Engineer</option>
              <option value="viewer">👁️ Viewer</option>
            </select>
          </div>

          <div>
            <select
              value={actionFilter}
              onChange={(e) => setActionFilter(e.target.value)}
              className="w-full bg-gray-950 border border-gray-800 rounded-xl px-3 py-2 text-xs text-gray-300 focus:outline-none focus:border-orange-500"
            >
              <option value="ALL">{t.auditView.auditTrailSection.filterAllActions}</option>
              <option value="TOGGLE_DEV_MODE">{t.auditView.auditTrailSection.actionOptions.toggleDevMode}</option>
              <option value="PURGE_CACHE">{t.auditView.auditTrailSection.actionOptions.purgeCache}</option>
              <option value="UPDATE_SSL">{t.auditView.auditTrailSection.actionOptions.updateSsl}</option>
              <option value="CREATE_DNS">{t.auditView.auditTrailSection.actionOptions.createDns}</option>
              <option value="RESTORE_SNAPSHOT">{t.auditView.auditTrailSection.actionOptions.restoreSnapshot}</option>
            </select>
          </div>
        </div>
      </div>

      {/* Logs Table */}
      <div className="rounded-2xl border border-gray-800 bg-gray-900/70 overflow-hidden">
        {filteredLogs.length === 0 ? (
          <div className="p-12 text-center text-xs text-gray-500">
            {t.auditView.auditTrailSection.emptyLogs}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-gray-800 bg-gray-950/60 text-gray-400 text-[11px] uppercase font-bold">
                  <th className="py-3 px-4">{t.auditView.auditTrailSection.tableHeaders.time}</th>
                  <th className="py-3 px-4">{t.auditView.auditTrailSection.tableHeaders.actor}</th>
                  <th className="py-3 px-4">{t.auditView.auditTrailSection.tableHeaders.action}</th>
                  <th className="py-3 px-4">{t.auditView.auditTrailSection.tableHeaders.zone}</th>
                  <th className="py-3 px-4">{t.auditView.auditTrailSection.tableHeaders.resource}</th>
                  <th className="py-3 px-4 text-right">{t.auditView.auditTrailSection.tableHeaders.status}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-850">
                {filteredLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-gray-800/40 transition-colors">
                    <td className="py-3 px-4 font-mono text-[11px] text-gray-400 whitespace-nowrap">
                      {formatDate(log.timestamp)}
                    </td>

                    <td className="py-3 px-4 whitespace-nowrap">
                      <div className="flex items-center gap-1.5">
                        <span className="font-semibold text-white">{log.actorName}</span>
                        <span className="text-[10px] px-1.5 py-0.2 rounded bg-gray-800 text-gray-400 font-mono">
                          {log.actorRole}
                        </span>
                      </div>
                    </td>

                    <td className="py-3 px-4 whitespace-nowrap">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${getActionBadgeColor(log.actionType)}`}>
                        {log.actionType}
                      </span>
                    </td>

                    <td className="py-3 px-4 font-mono text-cyan-300 whitespace-nowrap">
                      {log.zoneName}
                    </td>

                    <td className="py-3 px-4">
                      <div className="max-w-md">
                        <span className="font-medium text-gray-200 block text-[11px] truncate">{log.resource}</span>
                        <span className="text-[10px] text-gray-400 block truncate">{log.details}</span>
                      </div>
                    </td>

                    <td className="py-3 px-4 text-right whitespace-nowrap">
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full">
                        <CheckCircle2 className="w-3 h-3" />
                        <span>SUCCESS</span>
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
