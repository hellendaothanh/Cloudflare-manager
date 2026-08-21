'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useLanguage } from '@/context/LanguageContext';
import { FirewallRule, IpAccessRule } from '@/types/cloudflare';
import { 
  ShieldAlert, 
  Plus, 
  Trash2, 
  Code, 
  Globe, 
  CheckCircle2, 
  AlertCircle, 
  RefreshCw,
  Terminal,
  Sliders
} from 'lucide-react';
import { ActionConfirmModal } from '@/components/common/ActionConfirmModal';

export const SecurityView: React.FC = () => {
  const { selectedZone, authFetch, hasPermission, role } = useAuth();
  const { t, formatText } = useLanguage();
  const canEditWaf = hasPermission('canEditWaf');
  const [firewallRules, setFirewallRules] = useState<FirewallRule[]>([]);
  const [ipRules, setIpRules] = useState<IpAccessRule[]>([]);
  const [securityLevel, setSecurityLevel] = useState<string>('medium');
  const [loading, setLoading] = useState(false);
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Tab between WAF Rules and IP Access Rules
  const [activeSubTab, setActiveSubTab] = useState<'waf' | 'ip' | 'settings'>('waf');

  // WAF Modal state
  const [isWafModalOpen, setIsWafModalOpen] = useState(false);
  const [wafForm, setWafForm] = useState({
    description: '',
    expression: '',
    action: 'managed_challenge' as FirewallRule['action'],
  });

  // IP Rule Modal state
  const [isIpModalOpen, setIsIpModalOpen] = useState(false);
  const [ipForm, setIpForm] = useState({
    target: 'ip_range' as 'ip' | 'ip_range' | 'country' | 'asn',
    value: '',
    mode: 'block' as IpAccessRule['mode'],
    notes: '',
  });

  // Safety Confirmation Modals state
  const [deleteWafTarget, setDeleteWafTarget] = useState<FirewallRule | null>(null);
  const [isDeleteWafModalOpen, setIsDeleteWafModalOpen] = useState(false);

  const [deleteIpTarget, setDeleteIpTarget] = useState<IpAccessRule | null>(null);
  const [isDeleteIpModalOpen, setIsDeleteIpModalOpen] = useState(false);

  const [secLevelTarget, setSecLevelTarget] = useState<string | null>(null);
  const [isSecLevelModalOpen, setIsSecLevelModalOpen] = useState(false);

  const fetchData = async () => {
    if (!selectedZone) return;
    setLoading(true);
    try {
      const data = await authFetch(`/api/security?zoneId=${selectedZone.id}`);
      setFirewallRules(data.firewall_rules || []);
      setIpRules(data.ip_rules || []);
      setSecurityLevel(data.security_level || 'medium');
    } catch (err: any) {
      setNotification({ type: 'error', text: err.message || t.common.error });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [selectedZone]);

  const handleSaveWafRule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedZone) return;

    try {
      await authFetch('/api/security', {
        method: 'POST',
        body: JSON.stringify({
          zoneId: selectedZone.id,
          ruleType: 'waf',
          description: wafForm.description,
          expression: wafForm.expression,
          action: wafForm.action,
        }),
      });
      setNotification({ type: 'success', text: t.securityView.messages.wafCreated });
      setIsWafModalOpen(false);
      setWafForm({ description: '', expression: '', action: 'managed_challenge' });
      await fetchData();
    } catch (err: any) {
      setNotification({ type: 'error', text: err.message || t.common.error });
    }
  };

  const confirmDeleteWaf = async () => {
    if (!deleteWafTarget || !selectedZone) return;
    const ruleId = deleteWafTarget.id;
    try {
      await authFetch(`/api/security?zoneId=${selectedZone.id}&ruleId=${ruleId}&ruleType=waf`, {
        method: 'DELETE',
      });
      setFirewallRules(prev => prev.filter(r => r.id !== ruleId));
      setNotification({ type: 'success', text: t.securityView.messages.wafDeleted });
    } catch (err: any) {
      setNotification({ type: 'error', text: err.message || t.common.error });
    } finally {
      setDeleteWafTarget(null);
    }
  };

  const handleSaveIpRule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedZone) return;

    try {
      await authFetch('/api/security', {
        method: 'POST',
        body: JSON.stringify({
          zoneId: selectedZone.id,
          ruleType: 'ip',
          mode: ipForm.mode,
          configuration: {
            target: ipForm.target,
            value: ipForm.value.trim(),
          },
          notes: ipForm.notes,
        }),
      });
      setNotification({ type: 'success', text: t.securityView.messages.ipCreated });
      setIsIpModalOpen(false);
      setIpForm({ target: 'ip_range', value: '', mode: 'block', notes: '' });
      await fetchData();
    } catch (err: any) {
      setNotification({ type: 'error', text: err.message || t.common.error });
    }
  };

  const confirmDeleteIp = async () => {
    if (!deleteIpTarget || !selectedZone) return;
    const ruleId = deleteIpTarget.id;
    try {
      await authFetch(`/api/security?zoneId=${selectedZone.id}&ruleId=${ruleId}&ruleType=ip`, {
        method: 'DELETE',
      });
      setIpRules(prev => prev.filter(r => r.id !== ruleId));
      setNotification({ type: 'success', text: t.securityView.messages.ipDeleted });
    } catch (err: any) {
      setNotification({ type: 'error', text: err.message || t.common.error });
    } finally {
      setDeleteIpTarget(null);
    }
  };

  const confirmUpdateSecurityLevel = async () => {
    if (!secLevelTarget || !selectedZone) return;
    const level = secLevelTarget;
    try {
      await authFetch(`/api/zones/${selectedZone.id}`, {
        method: 'PATCH',
        body: JSON.stringify({ settingId: 'security_level', value: level }),
      });
      setSecurityLevel(level);
      setNotification({
        type: 'success',
        text: formatText(t.securityView.messages.secLevelUpdated, { level: level.toUpperCase() }),
      });
    } catch (err: any) {
      setNotification({ type: 'error', text: err.message || t.common.error });
    } finally {
      setSecLevelTarget(null);
    }
  };

  const getActionBadge = (action: string) => {
    switch (action) {
      case 'block':
        return <span className="px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-400 border border-rose-500/30 font-bold uppercase text-[10px]">{t.securityView.actions.block}</span>;
      case 'managed_challenge':
        return <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/30 font-bold uppercase text-[10px]">{t.securityView.actions.managed_challenge}</span>;
      case 'js_challenge':
        return <span className="px-2 py-0.5 rounded-full bg-yellow-500/20 text-yellow-400 border border-yellow-500/30 font-bold uppercase text-[10px]">{t.securityView.actions.js_challenge}</span>;
      case 'whitelist':
      case 'allow':
        return <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 font-bold uppercase text-[10px]">{t.securityView.actions.allow}</span>;
      default:
        return <span className="px-2 py-0.5 rounded-full bg-gray-800 text-gray-300 font-bold uppercase text-[10px]">{action}</span>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 rounded-2xl bg-gradient-to-r from-gray-900 via-gray-900/90 to-gray-950 border border-gray-800">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="p-2 rounded-xl bg-rose-500/10 text-rose-400 border border-rose-500/20">
              <ShieldAlert className="w-5 h-5" />
            </span>
            <h1 className="text-xl font-bold text-white tracking-tight">{t.securityView.title}</h1>
          </div>
          <p className="text-xs text-gray-400">
            {t.securityView.subtitle}
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={fetchData}
            disabled={loading}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-gray-800 hover:bg-gray-750 border border-gray-700 text-gray-300 text-xs font-medium transition-all"
            title={t.securityView.refreshBtn || t.common.refresh}
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-rose-400' : ''}`} />
            <span>{t.securityView.refreshBtn || t.common.refresh}</span>
          </button>

          {activeSubTab === 'waf' && (
            <button
              onClick={() => canEditWaf && setIsWafModalOpen(true)}
              disabled={!canEditWaf}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold shadow-lg transition-all ${
                canEditWaf
                  ? 'bg-gradient-to-r from-rose-500 to-amber-500 hover:from-rose-600 hover:to-amber-600 text-white shadow-rose-500/20'
                  : 'bg-gray-800 text-gray-500 cursor-not-allowed opacity-60'
              }`}
              title={!canEditWaf ? formatText(t.rbac.permissionDeniedTooltip, { role: t.rbac.roles[role]?.name || role }) : ''}
            >
              <Plus className="w-4 h-4" />
              <span>{t.securityView.addWafBtn}</span>
            </button>
          )}
          {activeSubTab === 'ip' && (
            <button
              onClick={() => canEditWaf && setIsIpModalOpen(true)}
              disabled={!canEditWaf}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold shadow-lg transition-all ${
                canEditWaf
                  ? 'bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white shadow-blue-500/20'
                  : 'bg-gray-800 text-gray-500 cursor-not-allowed opacity-60'
              }`}
              title={!canEditWaf ? formatText(t.rbac.permissionDeniedTooltip, { role: t.rbac.roles[role]?.name || role }) : ''}
            >
              <Plus className="w-4 h-4" />
              <span>{t.securityView.addIpBtn}</span>
            </button>
          )}
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

      {/* Sub-tabs */}
      <div className="flex items-center gap-2 border-b border-gray-800 pb-2">
        <button
          onClick={() => setActiveSubTab('waf')}
          className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all flex items-center gap-2 ${
            activeSubTab === 'waf'
              ? 'bg-rose-500/15 text-rose-400 border border-rose-500/30'
              : 'text-gray-400 hover:text-gray-200'
          }`}
        >
          <Code className="w-3.5 h-3.5" />
          <span>{t.securityView.tabs.waf} ({firewallRules.length})</span>
        </button>

        <button
          onClick={() => setActiveSubTab('ip')}
          className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all flex items-center gap-2 ${
            activeSubTab === 'ip'
              ? 'bg-blue-500/15 text-blue-400 border border-blue-500/30'
              : 'text-gray-400 hover:text-gray-200'
          }`}
        >
          <Globe className="w-3.5 h-3.5" />
          <span>{t.securityView.tabs.ip} ({ipRules.length})</span>
        </button>

        <button
          onClick={() => setActiveSubTab('settings')}
          className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all flex items-center gap-2 ${
            activeSubTab === 'settings'
              ? 'bg-amber-500/15 text-amber-400 border border-amber-500/30'
              : 'text-gray-400 hover:text-gray-200'
          }`}
        >
          <Sliders className="w-3.5 h-3.5" />
          <span>{t.securityView.tabs.settings}</span>
        </button>
      </div>

      {/* Sub-tab Content: Custom WAF Rules */}
      {activeSubTab === 'waf' && (
        <div className="space-y-3">
          {loading ? (
            <div className="p-12 text-center text-gray-500">
              <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-rose-400" />
              {t.common.loading}
            </div>
          ) : firewallRules.length === 0 ? (
            <div className="p-8 text-center rounded-2xl bg-gray-900/40 border border-gray-800 text-gray-400 text-xs">
              {t.securityView.wafTable.description}
            </div>
          ) : (
            firewallRules.map((rule) => (
              <div
                key={rule.id}
                className="p-4 rounded-2xl bg-gray-900/70 border border-gray-800 hover:border-gray-700 transition-all flex flex-col md:flex-row md:items-center justify-between gap-4"
              >
                <div className="space-y-1.5 flex-1">
                  <div className="flex items-center gap-2.5">
                    {getActionBadge(rule.action)}
                    <h3 className="text-xs font-bold text-white">{rule.description}</h3>
                    {rule.priority && (
                      <span className="text-[10px] text-gray-400 font-mono">Priority: #{rule.priority}</span>
                    )}
                  </div>
                  {rule.filter?.expression && (
                    <div className="p-2.5 rounded-lg bg-gray-950 border border-gray-850 font-mono text-[11px] text-rose-300 break-all">
                      <Terminal className="w-3 h-3 text-gray-500 inline mr-1.5" />
                      {rule.filter.expression}
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-2 self-end md:self-center">
                  <button
                    onClick={() => {
                      if (!canEditWaf) return;
                      setDeleteWafTarget(rule);
                      setIsDeleteWafModalOpen(true);
                    }}
                    disabled={!canEditWaf}
                    className={`p-2 rounded-xl transition-colors ${
                      canEditWaf
                        ? 'bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 cursor-pointer'
                        : 'bg-gray-900 text-gray-600 border border-gray-800 cursor-not-allowed opacity-50'
                    }`}
                    title={!canEditWaf ? formatText(t.rbac.permissionDeniedTooltip, { role: t.rbac.roles[role]?.name || role }) : t.common.delete}
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Sub-tab Content: IP Access List */}
      {activeSubTab === 'ip' && (
        <div className="rounded-2xl border border-gray-800 bg-gray-900/60 overflow-hidden shadow-xl">
          <table className="w-full text-left text-xs">
            <thead className="bg-gray-950/80 border-b border-gray-800 text-gray-400 uppercase font-semibold text-[10px] tracking-wider">
              <tr>
                <th className="py-3.5 px-4">{t.securityView.ipTable.mode}</th>
                <th className="py-3.5 px-4">{t.securityView.ipTable.target}</th>
                <th className="py-3.5 px-4">{t.securityView.ipTable.value}</th>
                <th className="py-3.5 px-4">{t.securityView.ipTable.notes}</th>
                <th className="py-3.5 px-4 text-right">{t.securityView.ipTable.actions}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800/60">
              {ipRules.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-gray-500">
                    —
                  </td>
                </tr>
              ) : (
                ipRules.map((r) => (
                  <tr key={r.id} className="hover:bg-gray-850/50 transition-colors">
                    <td className="py-3 px-4">{getActionBadge(r.mode)}</td>
                    <td className="py-3 px-4 uppercase font-mono text-gray-400">{r.configuration?.target}</td>
                    <td className="py-3 px-4 font-mono font-bold text-white">{r.configuration?.value}</td>
                    <td className="py-3 px-4 text-gray-400">{r.notes || '—'}</td>
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={() => {
                          if (!canEditWaf) return;
                          setDeleteIpTarget(r);
                          setIsDeleteIpModalOpen(true);
                        }}
                        disabled={!canEditWaf}
                        className={`p-1.5 rounded-lg transition-colors ${
                          canEditWaf
                            ? 'bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 cursor-pointer'
                            : 'bg-gray-900 text-gray-600 border border-gray-800 cursor-not-allowed opacity-50'
                        }`}
                        title={!canEditWaf ? formatText(t.rbac.permissionDeniedTooltip, { role: t.rbac.roles[role]?.name || role }) : t.common.delete}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Sub-tab Content: Security Level & Bot Mode */}
      {activeSubTab === 'settings' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-5 rounded-2xl bg-gray-900/70 border border-gray-800 space-y-4">
            <div>
              <h3 className="text-sm font-bold text-white mb-1">{t.securityView.settingsSection.secLevelTitle}</h3>
              <p className="text-xs text-gray-400">
                {t.securityView.settingsSection.secLevelDesc}
              </p>
            </div>

            <div className="space-y-2">
              {[
                { id: 'essentially_off', label: t.securityView.levels.essentially_off, desc: 'Essentially Off' },
                { id: 'low', label: t.securityView.levels.low, desc: 'Low' },
                { id: 'medium', label: t.securityView.levels.medium, desc: 'Medium (Standard)' },
                { id: 'high', label: t.securityView.levels.high, desc: 'High' },
                { id: 'under_attack', label: t.securityView.levels.under_attack, desc: 'Under Attack (DDoS mitigation)' },
              ].map((lvl) => (
                <button
                  key={lvl.id}
                  onClick={() => {
                    if (!canEditWaf || lvl.id === securityLevel) return;
                    setSecLevelTarget(lvl.id);
                    setIsSecLevelModalOpen(true);
                  }}
                  disabled={!canEditWaf}
                  className={`w-full p-3 rounded-xl text-left border transition-all flex items-start justify-between gap-2 cursor-pointer ${
                    !canEditWaf
                      ? 'bg-gray-950/60 border-gray-850 text-gray-600 cursor-not-allowed'
                      : securityLevel === lvl.id
                        ? 'bg-rose-500/15 border-rose-500/40 text-white'
                        : 'bg-gray-950 border-gray-800 text-gray-400 hover:text-gray-200 hover:bg-gray-900'
                  }`}
                  title={!canEditWaf ? formatText(t.rbac.permissionDeniedTooltip, { role: t.rbac.roles[role]?.name || role }) : ''}
                >
                  <div>
                    <span className="font-semibold text-xs block">{lvl.label}</span>
                  </div>
                  {securityLevel === lvl.id && <CheckCircle2 className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />}
                </button>
              ))}
            </div>
          </div>

          <div className="p-5 rounded-2xl bg-gray-900/70 border border-gray-800 space-y-4">
            <div>
              <h3 className="text-sm font-bold text-white mb-1">{t.securityView.settingsSection.botFightTitle}</h3>
              <p className="text-xs text-gray-400">
                {t.securityView.settingsSection.botFightDesc}
              </p>
            </div>

            <div className="p-4 rounded-xl bg-gray-950 border border-gray-800 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-white">Bot Fight Mode Status</span>
                <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 text-[10px] font-bold">
                  {t.common.active.toUpperCase()}
                </span>
              </div>
              <p className="text-[11px] text-gray-400">
                {t.securityView.settingsSection.rateLimitDesc}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Add WAF Rule Modal */}
      {isWafModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="w-full max-w-lg rounded-2xl bg-gray-900 border border-gray-800 p-6 shadow-2xl relative">
            <h2 className="text-base font-bold text-white mb-4 flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-rose-400" />
              {t.securityView.modalWaf.title}
            </h2>

            <form onSubmit={handleSaveWafRule} className="space-y-3.5">
              <div>
                <label className="block text-[11px] font-semibold text-gray-400 mb-1">{t.securityView.modalWaf.descLabel}</label>
                <input
                  type="text"
                  required
                  placeholder={t.securityView.modalWaf.descPlaceholder}
                  value={wafForm.description}
                  onChange={(e) => setWafForm({ ...wafForm, description: e.target.value })}
                  className="w-full bg-gray-950 border border-gray-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-rose-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-gray-400 mb-1">{t.securityView.modalWaf.actionLabel}</label>
                <select
                  value={wafForm.action}
                  onChange={(e) => setWafForm({ ...wafForm, action: e.target.value as any })}
                  className="w-full bg-gray-950 border border-gray-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-rose-500 font-semibold"
                >
                  <option value="managed_challenge">{t.securityView.actions.managed_challenge}</option>
                  <option value="block">{t.securityView.actions.block}</option>
                  <option value="js_challenge">{t.securityView.actions.js_challenge}</option>
                  <option value="allow">{t.securityView.actions.allow}</option>
                </select>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-[11px] font-semibold text-gray-400">{t.securityView.modalWaf.exprLabel}</label>
                  <button
                    type="button"
                    onClick={() => setWafForm({ ...wafForm, expression: '(http.request.uri.path contains "/admin") and not ip.src in {198.51.100.0/24}' })}
                    className="text-[10px] text-rose-400 hover:text-rose-300"
                  >
                    Template
                  </button>
                </div>
                <textarea
                  rows={4}
                  required
                  placeholder={t.securityView.modalWaf.exprPlaceholder}
                  value={wafForm.expression}
                  onChange={(e) => setWafForm({ ...wafForm, expression: e.target.value })}
                  className="w-full bg-gray-950 border border-gray-800 rounded-xl p-3 text-xs text-white focus:outline-none focus:border-rose-500 font-mono"
                />
              </div>

              <div className="flex items-center gap-2 pt-3">
                <button
                  type="submit"
                  className="flex-1 bg-gradient-to-r from-rose-500 to-amber-500 hover:from-rose-600 hover:to-amber-600 text-white font-medium py-2 px-4 rounded-xl text-xs transition-all shadow-lg shadow-rose-500/20"
                >
                  {t.securityView.modalWaf.btnCreate}
                </button>
                <button
                  type="button"
                  onClick={() => setIsWafModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-gray-700 bg-gray-800 hover:bg-gray-750 text-gray-300 text-xs font-medium"
                >
                  {t.common.cancel}
                </button>
              </div>
            </form>

            <button
              type="button"
              onClick={() => setIsWafModalOpen(false)}
              className="absolute top-4 right-4 text-gray-500 hover:text-gray-300 text-sm p-1"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {/* Add IP Rule Modal */}
      {isIpModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-2xl bg-gray-900 border border-gray-800 p-6 shadow-2xl relative">
            <h2 className="text-base font-bold text-white mb-4 flex items-center gap-2">
              <Globe className="w-4 h-4 text-blue-400" />
              {t.securityView.modalIp.title}
            </h2>

            <form onSubmit={handleSaveIpRule} className="space-y-3.5">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-gray-400 mb-1">{t.securityView.modalIp.targetLabel}</label>
                  <select
                    value={ipForm.target}
                    onChange={(e) => setIpForm({ ...ipForm, target: e.target.value as any })}
                    className="w-full bg-gray-950 border border-gray-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500 font-mono"
                  >
                    <option value="ip">{t.securityView.modalIp.targetIp}</option>
                    <option value="ip_range">{t.securityView.modalIp.targetRange}</option>
                    <option value="country">{t.securityView.modalIp.targetCountry}</option>
                    <option value="asn">{t.securityView.modalIp.targetAsn}</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-gray-400 mb-1">{t.securityView.modalIp.modeLabel}</label>
                  <select
                    value={ipForm.mode}
                    onChange={(e) => setIpForm({ ...ipForm, mode: e.target.value as any })}
                    className="w-full bg-gray-950 border border-gray-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500 font-semibold"
                  >
                    <option value="block">{t.securityView.actions.block}</option>
                    <option value="whitelist">{t.securityView.actions.allow}</option>
                    <option value="challenge">{t.securityView.actions.challenge}</option>
                    <option value="js_challenge">{t.securityView.actions.js_challenge}</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-gray-400 mb-1">{t.securityView.modalIp.valueLabel}</label>
                <input
                  type="text"
                  required
                  placeholder={t.securityView.modalIp.valuePlaceholder}
                  value={ipForm.value}
                  onChange={(e) => setIpForm({ ...ipForm, value: e.target.value })}
                  className="w-full bg-gray-950 border border-gray-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500 font-mono"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-gray-400 mb-1">{t.securityView.modalIp.notesLabel}</label>
                <input
                  type="text"
                  placeholder={t.securityView.modalIp.notesPlaceholder}
                  value={ipForm.notes}
                  onChange={(e) => setIpForm({ ...ipForm, notes: e.target.value })}
                  className="w-full bg-gray-950 border border-gray-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="flex items-center gap-2 pt-3">
                <button
                  type="submit"
                  className="flex-1 bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white font-medium py-2 px-4 rounded-xl text-xs transition-all shadow-lg shadow-blue-500/20"
                >
                  {t.securityView.modalIp.btnCreate}
                </button>
                <button
                  type="button"
                  onClick={() => setIsIpModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-gray-700 bg-gray-800 hover:bg-gray-750 text-gray-300 text-xs font-medium"
                >
                  {t.common.cancel}
                </button>
              </div>
            </form>

            <button
              type="button"
              onClick={() => setIsIpModalOpen(false)}
              className="absolute top-4 right-4 text-gray-500 hover:text-gray-300 text-sm p-1"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {/* Safety Confirmation Modal: Delete WAF Rule */}
      {deleteWafTarget && (
        <ActionConfirmModal
          isOpen={isDeleteWafModalOpen}
          onClose={() => {
            setIsDeleteWafModalOpen(false);
            setDeleteWafTarget(null);
          }}
          onConfirm={confirmDeleteWaf}
          title={t.securityView.deleteWafModal.title}
          description={formatText(t.securityView.deleteWafModal.desc, {
            desc: deleteWafTarget.description,
          })}
          variant="danger"
          confirmText={t.securityView.deleteWafModal.btnConfirm}
          affectedResource={{
            label: 'WAF Rule Expression',
            value: deleteWafTarget.description,
            badge: `${deleteWafTarget.action?.toUpperCase()} | ${deleteWafTarget.filter?.expression || 'Custom'}`,
          }}
        />
      )}

      {/* Safety Confirmation Modal: Delete IP Access Rule */}
      {deleteIpTarget && (
        <ActionConfirmModal
          isOpen={isDeleteIpModalOpen}
          onClose={() => {
            setIsDeleteIpModalOpen(false);
            setDeleteIpTarget(null);
          }}
          onConfirm={confirmDeleteIp}
          title={t.securityView.deleteIpModal.title}
          description={formatText(t.securityView.deleteIpModal.desc, {
            value: deleteIpTarget.configuration?.value || 'Target',
            mode: deleteIpTarget.mode,
          })}
          variant="danger"
          confirmText={t.securityView.deleteIpModal.btnConfirm}
          affectedResource={{
            label: 'IP Access Target',
            value: `${deleteIpTarget.configuration?.target?.toUpperCase()}: ${deleteIpTarget.configuration?.value}`,
            badge: `Action: ${deleteIpTarget.mode?.toUpperCase()}`,
          }}
        />
      )}

      {/* Safety Confirmation Modal: Change Security Level */}
      {secLevelTarget && (
        <ActionConfirmModal
          isOpen={isSecLevelModalOpen}
          onClose={() => {
            setIsSecLevelModalOpen(false);
            setSecLevelTarget(null);
          }}
          onConfirm={confirmUpdateSecurityLevel}
          title={t.securityView.secLevelModal.title}
          description={formatText(t.securityView.secLevelModal.desc, {
            level: secLevelTarget.toUpperCase(),
          })}
          variant={secLevelTarget === 'under_attack' || secLevelTarget === 'essentially_off' ? 'warning' : 'info'}
          confirmText={t.securityView.secLevelModal.btnConfirm}
          affectedResource={{
            label: 'Zone Security Level Transition',
            value: `${securityLevel.toUpperCase()} ➔ ${secLevelTarget.toUpperCase()}`,
            badge: selectedZone?.name,
          }}
        />
      )}
    </div>
  );
};
