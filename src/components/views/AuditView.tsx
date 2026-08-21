'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useLanguage } from '@/context/LanguageContext';
import { SecurityAuditResult, ZoneConfigSnapshot } from '@/types/cloudflare';
import { 
  ActivitySquare, 
  ShieldCheck, 
  ShieldAlert, 
  CheckCircle2, 
  AlertCircle,
  Download, 
  Upload, 
  RefreshCw, 
  Zap, 
  ArrowRight,
  GitCompare,
  Check,
  X
} from 'lucide-react';
import { formatDate } from '@/lib/utils';

export const AuditView: React.FC = () => {
  const { selectedZone, authFetch, hasPermission, role } = useAuth();
  const { language, t, formatText } = useLanguage();
  const canAutoFix = hasPermission('canAutoFix');
  const [auditResult, setAuditResult] = useState<SecurityAuditResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [remediatingId, setRemediatingId] = useState<string | null>(null);
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Drift detection state
  const [uploadedSnapshot, setUploadedSnapshot] = useState<ZoneConfigSnapshot | null>(null);
  const [driftDiffs, setDriftDiffs] = useState<Array<{ key: string; oldVal: string; currentVal: string; type: 'changed' | 'added' | 'removed' }> | null>(null);

  const runAuditScan = async () => {
    if (!selectedZone) return;
    setLoading(true);
    try {
      const data = await authFetch(`/api/audit?zoneId=${selectedZone.id}&action=scan&lang=${language}`);
      setAuditResult(data);
    } catch (err: any) {
      setNotification({ type: 'error', text: err.message || t.auditView.messages.scanError });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    runAuditScan();
  }, [selectedZone, language]);

  const handleAutoRemediate = async (checkId: string) => {
    if (!selectedZone) return;
    setRemediatingId(checkId);
    setNotification(null);

    try {
      if (checkId === 'ssl-mode') {
        await authFetch('/api/ssl', {
          method: 'PATCH',
          body: JSON.stringify({ zoneId: selectedZone.id, setting: 'ssl', value: 'strict' }),
        });
      } else if (checkId === 'always-https') {
        await authFetch('/api/ssl', {
          method: 'PATCH',
          body: JSON.stringify({ zoneId: selectedZone.id, setting: 'always_use_https', value: 'on' }),
        });
      } else if (checkId === 'min-tls') {
        await authFetch('/api/ssl', {
          method: 'PATCH',
          body: JSON.stringify({ zoneId: selectedZone.id, setting: 'min_tls_version', value: '1.2' }),
        });
      }
      setNotification({ type: 'success', text: t.auditView.messages.fixSuccess });
      await runAuditScan();
    } catch (err: any) {
      setNotification({ type: 'error', text: err.message || t.common.error });
    } finally {
      setRemediatingId(null);
    }
  };

  const handleExportSnapshot = async () => {
    if (!selectedZone) return;
    try {
      const data: ZoneConfigSnapshot = await authFetch(`/api/audit?zoneId=${selectedZone.id}&action=export_snapshot&lang=${language}`);
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `cloudflare-snapshot-${selectedZone.name}-${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
      setNotification({
        type: 'success',
        text: formatText(t.auditView.messages.exportSuccess, { name: selectedZone.name }),
      });
    } catch (err: any) {
      setNotification({ type: 'error', text: err.message || t.auditView.messages.exportError });
    }
  };

  const handleUploadSnapshot = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !selectedZone) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const parsed: ZoneConfigSnapshot = JSON.parse(event.target?.result as string);
        setUploadedSnapshot(parsed);

        // Fetch live state to compare dynamically
        const liveSnapshot: ZoneConfigSnapshot = await authFetch(
          `/api/audit?zoneId=${selectedZone.id}&action=export_snapshot&lang=${language}`
        );

        const diffs: Array<{ key: string; oldVal: string; currentVal: string; type: 'changed' | 'added' | 'removed' }> = [];

        // 1. SSL Mode
        diffs.push({
          key: 'SSL Encryption Mode',
          oldVal: (parsed.ssl_mode || 'unknown').toUpperCase(),
          currentVal: (liveSnapshot.ssl_mode || 'unknown').toUpperCase(),
          type: 'changed',
        });

        // 2. Min TLS
        diffs.push({
          key: 'Minimum TLS Version',
          oldVal: `TLS ${parsed.min_tls_version || '1.0'}`,
          currentVal: `TLS ${liveSnapshot.min_tls_version || '1.0'}`,
          type: 'changed',
        });

        // 3. Always Use HTTPS
        diffs.push({
          key: 'Always Use HTTPS',
          oldVal: parsed.always_use_https ? 'Enabled' : 'Disabled',
          currentVal: liveSnapshot.always_use_https ? 'Enabled' : 'Disabled',
          type: 'changed',
        });

        // 4. HSTS
        diffs.push({
          key: 'HSTS (Strict Transport Security)',
          oldVal: parsed.hsts?.enabled ? `Enabled (${parsed.hsts.max_age / 86400}d)` : 'Disabled',
          currentVal: liveSnapshot.hsts?.enabled ? `Enabled (${liveSnapshot.hsts.max_age / 86400}d)` : 'Disabled',
          type: 'changed',
        });

        // 5. Security Level
        diffs.push({
          key: 'Security Level',
          oldVal: (parsed.security_level || 'medium').toUpperCase(),
          currentVal: (liveSnapshot.security_level || 'medium').toUpperCase(),
          type: 'changed',
        });

        // 6. DNS Records Count
        diffs.push({
          key: 'DNS Records Count',
          oldVal: `${parsed.dns_records?.length || 0} records`,
          currentVal: `${liveSnapshot.dns_records?.length || 0} records (Live)`,
          type: 'changed',
        });

        // 7. WAF Firewall Rules Count
        diffs.push({
          key: 'WAF Firewall Rules Count',
          oldVal: `${parsed.firewall_rules?.length || 0} rules`,
          currentVal: `${liveSnapshot.firewall_rules?.length || 0} rules (Live)`,
          type: 'changed',
        });

        // 8. IP Access Rules Count
        diffs.push({
          key: 'IP Access Rules Count',
          oldVal: `${parsed.ip_access_rules?.length || 0} rules`,
          currentVal: `${liveSnapshot.ip_access_rules?.length || 0} rules (Live)`,
          type: 'changed',
        });

        setDriftDiffs(diffs);
        setNotification({ type: 'success', text: `Snapshot: ${formatDate(parsed.exported_at)}` });
      } catch (err) {
        setNotification({ type: 'error', text: 'Invalid JSON snapshot file or failed to fetch live state.' });
      }
    };
    reader.readAsText(file);
  };

  const getGradeBadge = (grade: string) => {
    switch (grade) {
      case 'A+':
      case 'A':
        return <span className="text-4xl font-extrabold text-emerald-400">{grade}</span>;
      case 'B':
        return <span className="text-4xl font-extrabold text-blue-400">{grade}</span>;
      case 'C':
        return <span className="text-4xl font-extrabold text-amber-400">{grade}</span>;
      default:
        return <span className="text-4xl font-extrabold text-rose-400">{grade}</span>;
    }
  };

  const getSeverityBadge = (sev: string) => {
    switch (sev) {
      case 'critical':
        return <span className="px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-400 border border-rose-500/30 text-[9px] font-extrabold uppercase">{t.auditView.severityLevels.critical}</span>;
      case 'high':
        return <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/30 text-[9px] font-extrabold uppercase">{t.auditView.severityLevels.high}</span>;
      case 'medium':
        return <span className="px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-400 border border-blue-500/30 text-[9px] font-extrabold uppercase">{t.auditView.severityLevels.medium}</span>;
      default:
        return <span className="px-2 py-0.5 rounded-full bg-gray-800 text-gray-400 text-[9px] font-extrabold uppercase">{t.auditView.severityLevels.low}</span>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 rounded-2xl bg-gradient-to-r from-gray-900 via-gray-900/90 to-gray-950 border border-gray-800">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="p-2 rounded-xl bg-orange-500/10 text-orange-400 border border-orange-500/20">
              <ActivitySquare className="w-5 h-5" />
            </span>
            <h1 className="text-xl font-bold text-white tracking-tight">{t.auditView.title}</h1>
          </div>
          <p className="text-xs text-gray-400">
            {t.auditView.subtitle}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={handleExportSnapshot}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-gray-800 hover:bg-gray-750 border border-gray-700 text-gray-300 text-xs font-medium transition-all"
            title="Export JSON"
          >
            <Download className="w-3.5 h-3.5" />
            <span>{t.auditView.exportSnapshotBtn}</span>
          </button>

          <label className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-gray-800 hover:bg-gray-750 border border-gray-700 text-gray-300 text-xs font-medium cursor-pointer transition-all">
            <Upload className="w-3.5 h-3.5" />
            <span>{t.auditView.compareSnapshotBtn}</span>
            <input type="file" accept=".json" onChange={handleUploadSnapshot} className="hidden" />
          </label>

          <button
            onClick={runAuditScan}
            disabled={loading}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white text-xs font-semibold shadow-lg shadow-orange-500/20 transition-all"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>{t.auditView.rescanBtn}</span>
          </button>
        </div>
      </div>

      {notification && (
        <div className={`p-4 rounded-xl text-xs flex items-center gap-2.5 ${
          notification.type === 'success' ? 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-400' : 'bg-rose-500/10 border border-rose-500/30 text-rose-400'
        }`}>
          {notification.type === 'success' ? <CheckCircle2 className="w-4 h-4 shrink-0" /> : <AlertCircle className="w-4 h-4 shrink-0" />}
          <div>{notification.text}</div>
        </div>
      )}

      {/* Top Scorecard Summary */}
      {auditResult && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Security Score Gauge Card */}
          <div className="p-6 rounded-2xl bg-gradient-to-br from-gray-900 to-gray-950 border border-gray-800 flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-xs font-bold uppercase tracking-wider text-gray-400 block">{t.auditView.scoreCard.title}</span>
              <div className="flex items-baseline gap-2">
                <span className="text-4xl font-extrabold text-white font-mono">{auditResult.score}</span>
                <span className="text-sm font-semibold text-gray-500">/ 100</span>
              </div>
              <span className="text-[11px] text-gray-400 block pt-1">
                {formatText(t.auditView.scoreCard.passedChecks, {
                  passed: auditResult.checks.filter(c => c.passed).length,
                  total: auditResult.checks.length,
                })}
              </span>
            </div>

            <div className="p-4 rounded-2xl bg-gray-950 border border-gray-800 flex flex-col items-center justify-center min-w-[90px]">
              <span className="text-[10px] text-gray-500 uppercase font-bold">Grade</span>
              {getGradeBadge(auditResult.grade)}
            </div>
          </div>

          {/* Critical Warnings */}
          <div className="p-6 rounded-2xl bg-gray-900/70 border border-gray-800 space-y-2">
            <div className="flex items-center gap-2 text-rose-400 font-bold text-xs">
              <ShieldAlert className="w-4 h-4" />
              <span>{t.auditView.scoreCard.gradeWarning}</span>
            </div>
            <div className="text-2xl font-extrabold text-white font-mono">
              {auditResult.checks.filter(c => !c.passed && (c.severity === 'critical' || c.severity === 'high')).length} items
            </div>
            <p className="text-[11px] text-gray-400 leading-relaxed">
              {t.sidebar.automationCard.desc}
            </p>
          </div>

          {/* Compliance Status */}
          <div className="p-6 rounded-2xl bg-gray-900/70 border border-gray-800 space-y-2">
            <div className="flex items-center gap-2 text-emerald-400 font-bold text-xs">
              <ShieldCheck className="w-4 h-4" />
              <span>{t.auditView.scoreCard.gradeExcellent}</span>
            </div>
            <div className="text-2xl font-extrabold text-emerald-400 font-mono">
              {Math.round((auditResult.checks.filter(c => c.passed).length / auditResult.checks.length) * 100)}%
            </div>
            <p className="text-[11px] text-gray-400 leading-relaxed">
              Cloudflare Security Engineering & CIS Benchmark.
            </p>
          </div>
        </div>
      )}

      {/* Drift Diff Box if snapshot uploaded */}
      {driftDiffs && uploadedSnapshot && (
        <div className="p-5 rounded-2xl bg-gray-900 border border-cyan-500/30 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs font-bold text-cyan-400">
              <GitCompare className="w-4 h-4" />
              <span>{t.auditView.driftSection.title}</span>
            </div>
            <button
              onClick={() => { setDriftDiffs(null); setUploadedSnapshot(null); }}
              className="text-[11px] text-gray-400 hover:text-white"
            >
              {t.common.close}
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-gray-950 border-b border-gray-800 text-gray-400 text-[10px] uppercase font-semibold">
                <tr>
                  <th className="py-2.5 px-3">{t.auditView.driftSection.settingCol}</th>
                  <th className="py-2.5 px-3">{t.auditView.driftSection.snapshotCol} ({formatDate(uploadedSnapshot.exported_at)})</th>
                  <th className="py-2.5 px-3">{t.auditView.driftSection.currentCol}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-850 font-mono">
                {driftDiffs.map((d, idx) => (
                  <tr key={idx} className="hover:bg-gray-850/40">
                    <td className="py-2.5 px-3 font-bold text-gray-200 font-sans">{d.key}</td>
                    <td className="py-2.5 px-3 text-amber-400">{d.oldVal}</td>
                    <td className="py-2.5 px-3 text-emerald-400 flex items-center gap-1.5">
                      <ArrowRight className="w-3 h-3 text-gray-500" />
                      <span>{d.currentVal}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Security Checklist Details */}
      <div className="rounded-2xl border border-gray-800 bg-gray-900/60 overflow-hidden shadow-xl">
        <div className="px-5 py-4 bg-gray-950/80 border-b border-gray-800 flex items-center justify-between">
          <span className="text-xs font-bold text-white">
            {formatText(t.auditView.checksTitle, { count: auditResult?.checks.length || 0 })}
          </span>
        </div>

        <div className="divide-y divide-gray-800/60">
          {loading ? (
            <div className="p-12 text-center text-gray-500">
              <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-orange-400" />
              {t.common.loading}
            </div>
          ) : auditResult?.checks.map((check) => (
            <div key={check.id} className="p-4 hover:bg-gray-850/40 transition-colors flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="space-y-1.5 flex-1">
                <div className="flex items-center gap-2.5">
                  {check.passed ? (
                    <div className="p-1 rounded-full bg-emerald-500/20 text-emerald-400">
                      <Check className="w-3.5 h-3.5" />
                    </div>
                  ) : (
                    <div className="p-1 rounded-full bg-rose-500/20 text-rose-400">
                      <X className="w-3.5 h-3.5" />
                    </div>
                  )}

                  <span className="text-xs font-bold text-white">{check.title}</span>
                  {getSeverityBadge(check.severity)}
                  <span className="text-[10px] px-2 py-0.5 rounded bg-gray-800 text-gray-400 font-mono">
                    {check.category}
                  </span>
                </div>

                <p className="text-[11px] text-gray-400 leading-relaxed pl-6">
                  {check.description}
                </p>

                <div className="flex items-center gap-4 text-[11px] pl-6 pt-1 font-mono">
                  <span className="text-gray-500">
                    {t.auditView.currentValue} <span className={check.passed ? 'text-emerald-400 font-semibold' : 'text-rose-400 font-semibold'}>{String(check.current_value)}</span>
                  </span>
                  {!check.passed && (
                    <span className="text-gray-500">
                      {t.auditView.recommendedValue} <span className="text-cyan-400 font-semibold">{check.recommended_value}</span>
                    </span>
                  )}
                </div>
              </div>

              {/* Action Button */}
              {!check.passed && check.remediation_action && (
                <div className="self-end md:self-center">
                  <button
                    onClick={() => canAutoFix && handleAutoRemediate(check.id)}
                    disabled={remediatingId === check.id || !canAutoFix}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                      !canAutoFix
                        ? 'opacity-50 cursor-not-allowed bg-gray-900 border border-gray-800 text-gray-500'
                        : 'bg-orange-500/20 hover:bg-orange-500/30 text-orange-400 border border-orange-500/40'
                    }`}
                    title={!canAutoFix ? formatText(t.rbac.permissionDeniedTooltip, { role: t.rbac.roles[role]?.name || role }) : ''}
                  >
                    <Zap className="w-3.5 h-3.5 fill-current" />
                    <span>{remediatingId === check.id ? t.auditView.fixingBtn : `${t.auditView.autoFixBtn} (1-Click)`}</span>
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
