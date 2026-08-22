'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useLanguage } from '@/context/LanguageContext';
import { RateLimitRule, RateLimitAnalytics } from '@/types/cloudflare';
import { 
  ShieldAlert, 
  Shield,
  Plus, 
  Trash2, 
  RefreshCw, 
  Activity, 
  AlertTriangle, 
  AlertCircle,
  CheckCircle2, 
  Zap, 
  BarChart3, 
  Sliders, 
  Lock,
  Globe,
  Clock
} from 'lucide-react';
import { ActionConfirmModal } from '@/components/common/ActionConfirmModal';
import { HelpTooltip } from '@/components/common/HelpTooltip';

export const RateLimitView: React.FC = () => {
  const { selectedZone, authFetch, hasPermission, role } = useAuth();
  const { t, formatText } = useLanguage();
  const canManage = hasPermission('canManageRateLimit');

  const [activeSubTab, setActiveSubTab] = useState<'rules' | 'analytics'>('rules');
  const [loading, setLoading] = useState(false);
  const [rules, setRules] = useState<RateLimitRule[]>([]);
  const [analytics, setAnalytics] = useState<RateLimitAnalytics | null>(null);
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Safety Confirmation Modal state
  const [deleteRuleTarget, setDeleteRuleTarget] = useState<RateLimitRule | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    description: '',
    url: '',
    methods: ['POST'],
    threshold: 10,
    period: 60,
    action: 'ban' as 'ban' | 'challenge' | 'managed_challenge' | 'js_challenge',
    timeout: 300,
  });

  const loadData = async () => {
    if (!selectedZone) return;
    setLoading(true);
    try {
      const data = await authFetch(`/api/ratelimit?zoneId=${selectedZone.id}`);
      if (data.rules) setRules(data.rules);
      if (data.analytics) setAnalytics(data.analytics);
    } catch (err: any) {
      setNotification({ type: 'error', text: err.message || t.common.error });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [selectedZone?.id]);

  const handleApplyPreset = (preset: 'brute' | 'payment' | 'scraping') => {
    if (!selectedZone) return;
    setIsModalOpen(true);
    if (preset === 'brute') {
      setFormData({
        description: 'Chống Brute Force Đăng nhập & API Authentication',
        url: `*.${selectedZone.name}/api/v1/auth/login`,
        methods: ['POST'],
        threshold: 10,
        period: 60,
        action: 'ban',
        timeout: 300,
      });
    } else if (preset === 'payment') {
      setFormData({
        description: 'Bảo vệ Cổng thanh toán & Checkout Endpoint',
        url: `*.${selectedZone.name}/api/v1/checkout/*`,
        methods: ['POST', 'PUT'],
        threshold: 15,
        period: 60,
        action: 'managed_challenge',
        timeout: 300,
      });
    } else if (preset === 'scraping') {
      setFormData({
        description: 'Chống Cào dữ liệu Danh mục Sản phẩm & API',
        url: `*.${selectedZone.name}/catalog/*`,
        methods: ['GET'],
        threshold: 120,
        period: 60,
        action: 'js_challenge',
        timeout: 60,
      });
    }
  };

  const handleSaveRule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canManage || !selectedZone) return;

    setLoading(true);
    try {
      await authFetch('/api/ratelimit', {
        method: 'POST',
        body: JSON.stringify({
          zoneId: selectedZone.id,
          ...formData,
        }),
      });

      setNotification({ type: 'success', text: t.rateLimitView.messages.created });
      setIsModalOpen(false);
      await loadData();
    } catch (err: any) {
      setNotification({ type: 'error', text: err.message || t.common.error });
    } finally {
      setLoading(false);
    }
  };

  const confirmDeleteRule = async () => {
    if (!deleteRuleTarget || !canManage || !selectedZone) return;
    const ruleId = deleteRuleTarget.id;

    setLoading(true);
    try {
      await authFetch(`/api/ratelimit?zoneId=${selectedZone.id}&ruleId=${ruleId}`, {
        method: 'DELETE',
      });
      setNotification({ type: 'success', text: t.rateLimitView.messages.deleted });
      await loadData();
    } catch (err: any) {
      setNotification({ type: 'error', text: err.message || t.common.error });
    } finally {
      setLoading(false);
      setDeleteRuleTarget(null);
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
            <h1 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
              <span>{t.rateLimitView.title}</span>
              <HelpTooltip 
                title={t.rateLimitView.title}
                content={t.rateLimitView.subtitle}
              />
            </h1>
          </div>
          <p className="text-xs text-gray-400">
            {t.rateLimitView.subtitle}
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={loadData}
            disabled={loading}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-gray-800 hover:bg-gray-750 border border-gray-700 text-gray-300 text-xs font-medium transition-all"
            title={t.rateLimitView.refreshBtn || t.common.refresh}
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-rose-400' : ''}`} />
            <span>{t.rateLimitView.refreshBtn || t.common.refresh}</span>
          </button>

          <button
            onClick={() => setIsModalOpen(true)}
            disabled={!canManage}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-rose-500 to-red-600 hover:from-rose-600 hover:to-red-700 text-white text-xs font-semibold shadow-lg shadow-rose-500/20 transition-all disabled:opacity-50"
            title={!canManage ? formatText(t.rbac.permissionDeniedTooltip, { role: t.rbac.roles[role]?.name || role }) : ''}
          >
            <Plus className="w-4 h-4" />
            <span>{t.rateLimitView.rulesSection.addRuleBtn}</span>
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

      {/* 1-Click DevSecOps Presets */}
      <div className="p-4 rounded-2xl bg-gray-900/70 border border-gray-800 space-y-2.5">
        <span className="text-xs font-bold text-white flex items-center gap-1.5">
          <Shield className="w-3.5 h-3.5 text-rose-400" />
          {t.rateLimitView.presets.title}
        </span>
        <div className="flex flex-wrap gap-2.5">
          <button
            onClick={() => handleApplyPreset('brute')}
            className="px-3 py-1.5 rounded-xl bg-gray-950 hover:bg-gray-850 border border-gray-800 text-xs font-semibold text-rose-400 hover:border-rose-500/40 transition-all flex items-center gap-1.5"
          >
            <span>{t.rateLimitView.presets.authBruteForce}</span>
          </button>

          <button
            onClick={() => handleApplyPreset('payment')}
            className="px-3 py-1.5 rounded-xl bg-gray-950 hover:bg-gray-850 border border-gray-800 text-xs font-semibold text-amber-400 hover:border-amber-500/40 transition-all flex items-center gap-1.5"
          >
            <span>{t.rateLimitView.presets.paymentShield}</span>
          </button>

          <button
            onClick={() => handleApplyPreset('scraping')}
            className="px-3 py-1.5 rounded-xl bg-gray-950 hover:bg-gray-850 border border-gray-800 text-xs font-semibold text-cyan-400 hover:border-cyan-500/40 transition-all flex items-center gap-1.5"
          >
            <span>{t.rateLimitView.presets.antiScraping}</span>
          </button>
        </div>
      </div>

      {/* Sub-tabs Navigation */}
      <div className="flex items-center gap-2 border-b border-gray-800 pb-2">
        <button
          onClick={() => setActiveSubTab('rules')}
          className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all flex items-center gap-2 ${
            activeSubTab === 'rules'
              ? 'bg-rose-500/15 text-rose-400 border border-rose-500/30'
              : 'text-gray-400 hover:text-gray-200 hover:bg-gray-900'
          }`}
        >
          <Sliders className="w-4 h-4" />
          <span>{t.rateLimitView.tabs.rules} ({rules.length})</span>
        </button>

        <button
          onClick={() => setActiveSubTab('analytics')}
          className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all flex items-center gap-2 ${
            activeSubTab === 'analytics'
              ? 'bg-cyan-500/15 text-cyan-400 border border-cyan-500/30'
              : 'text-gray-400 hover:text-gray-200 hover:bg-gray-900'
          }`}
        >
          <BarChart3 className="w-4 h-4" />
          <span>{t.rateLimitView.tabs.analytics}</span>
        </button>
      </div>

      {/* ========================================================================= */}
      {/* SUBTAB 1: RULES LIST                                                      */}
      {/* ========================================================================= */}
      {activeSubTab === 'rules' && (
        <div className="space-y-3">
          {rules.length === 0 ? (
            <div className="p-12 text-center text-gray-500 text-xs rounded-2xl bg-gray-950/60 border border-gray-850">
              {t.rateLimitView.rulesSection.noRules}
            </div>
          ) : (
            rules.map((rule) => {
              const actionColors: Record<string, string> = {
                ban: 'bg-rose-500/15 text-rose-400 border-rose-500/30',
                managed_challenge: 'bg-amber-500/15 text-amber-400 border-amber-500/30',
                js_challenge: 'bg-yellow-500/15 text-yellow-400 border-yellow-500/30',
                challenge: 'bg-purple-500/15 text-purple-400 border-purple-500/30',
                simulate: 'bg-gray-800 text-gray-400 border-gray-700',
              };

              return (
                <div
                  key={rule.id}
                  className="p-5 rounded-2xl bg-gray-900/70 border border-gray-800 hover:border-gray-700 transition-all flex flex-col md:flex-row md:items-center justify-between gap-4"
                >
                  <div className="space-y-2 flex-1">
                    <div className="flex items-center gap-2.5">
                      <span className={`text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-full border ${actionColors[rule.action?.mode || 'simulate']}`}>
                        {rule.action?.mode || 'ACTION'}
                      </span>
                      <h3 className="text-sm font-bold text-white">{rule.description}</h3>
                    </div>

                    <div className="font-mono text-xs text-cyan-300 bg-gray-950 px-3 py-1.5 rounded-xl border border-gray-850 inline-block">
                      {rule.match?.request?.url}
                    </div>

                    <div className="flex flex-wrap items-center gap-4 text-xs text-gray-400">
                      <span>{t.rateLimitView.rulesSection.thresholdLabel} <strong className="text-white">{rule.threshold} requests</strong></span>
                      <span>{t.rateLimitView.rulesSection.periodLabel} <strong className="text-white">{rule.period}s</strong></span>
                      {rule.action?.timeout && (
                        <span>{t.rateLimitView.rulesSection.banTimeoutLabel} <strong className="text-rose-400">{rule.action.timeout}s</strong></span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 self-end md:self-center">
                    <button
                      onClick={() => {
                        if (!canManage) return;
                        setDeleteRuleTarget(rule);
                        setIsDeleteModalOpen(true);
                      }}
                      disabled={!canManage}
                      className="p-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 transition-colors disabled:opacity-50 cursor-pointer"
                      title={!canManage ? formatText(t.rbac.permissionDeniedTooltip, { role: t.rbac.roles[role]?.name || role }) : t.common.delete}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* SUBTAB 2: ANALYTICS & BREACH METRICS                                      */}
      {/* ========================================================================= */}
      {activeSubTab === 'analytics' && analytics && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-4 rounded-2xl bg-gray-900/70 border border-gray-800 space-y-1">
              <span className="text-xs text-gray-400">{t.rateLimitView.analyticsSection.breaches}</span>
              <div className="text-2xl font-bold text-rose-400 font-mono">{analytics.breachesCount.toLocaleString()}</div>
            </div>
            <div className="p-4 rounded-2xl bg-gray-900/70 border border-gray-800 space-y-1">
              <span className="text-xs text-gray-400">{t.rateLimitView.analyticsSection.blocked}</span>
              <div className="text-2xl font-bold text-amber-400 font-mono">{analytics.blockedRequestsCount.toLocaleString()}</div>
            </div>
            <div className="p-4 rounded-2xl bg-gray-900/70 border border-gray-800 space-y-1">
              <span className="text-xs text-gray-400">{t.rateLimitView.analyticsSection.challenged}</span>
              <div className="text-2xl font-bold text-cyan-400 font-mono">{analytics.challengedRequestsCount.toLocaleString()}</div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Top Target Paths */}
            <div className="p-5 rounded-2xl bg-gray-900/70 border border-gray-800 space-y-3">
              <h3 className="text-xs font-bold text-white uppercase tracking-wider">
                {t.rateLimitView.analyticsSection.topTargets}
              </h3>
              <div className="space-y-2">
                {analytics.topTargetPaths.map((p, idx) => (
                  <div key={idx} className="p-2.5 rounded-xl bg-gray-950 border border-gray-850 flex items-center justify-between font-mono text-xs">
                    <span className="text-gray-300 truncate">{p.path}</span>
                    <span className="text-rose-400 font-bold">{p.count} hits</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Top Violating IPs */}
            <div className="p-5 rounded-2xl bg-gray-900/70 border border-gray-800 space-y-3">
              <h3 className="text-xs font-bold text-white uppercase tracking-wider">
                {t.rateLimitView.analyticsSection.topIps}
              </h3>
              <div className="space-y-2">
                {analytics.topViolatingIps.map((ip, idx) => (
                  <div key={idx} className="p-2.5 rounded-xl bg-gray-950 border border-gray-855 flex items-center justify-between font-mono text-xs">
                    <div className="flex items-center gap-2">
                      <span className="text-gray-200">{ip.ip}</span>
                      <span className="text-[10px] text-gray-500 font-sans">({ip.country})</span>
                    </div>
                    <span className="text-amber-400 font-bold">{ip.count} breaches</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Create Rule Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-md p-4 animate-in fade-in duration-150">
          <div className="w-full max-w-lg rounded-2xl bg-gray-900 border border-gray-800 p-6 shadow-2xl space-y-4 relative">
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-rose-400" />
              {t.rateLimitView.rulesSection.modalTitle}
            </h2>

            <form onSubmit={handleSaveRule} className="space-y-3.5">
              <div>
                <label className="block text-[11px] font-semibold text-gray-300 mb-1">{t.rateLimitView.rulesSection.descLabel}</label>
                <input
                  type="text"
                  required
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder={t.rateLimitView.rulesSection.descPlaceholder}
                  className="w-full bg-gray-950 border border-gray-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-rose-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-gray-300 mb-1">{t.rateLimitView.rulesSection.urlLabel}</label>
                <input
                  type="text"
                  required
                  value={formData.url}
                  onChange={(e) => setFormData({ ...formData, url: e.target.value })}
                  placeholder={t.rateLimitView.rulesSection.urlPlaceholder}
                  className="w-full bg-gray-950 border border-gray-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-rose-500 font-mono"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-gray-300 mb-1">{t.rateLimitView.rulesSection.thresholdInputLabel}</label>
                  <input
                    type="number"
                    required
                    min={1}
                    value={formData.threshold}
                    onChange={(e) => setFormData({ ...formData, threshold: Number(e.target.value) })}
                    className="w-full bg-gray-950 border border-gray-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-rose-500 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-gray-300 mb-1">{t.rateLimitView.rulesSection.periodInputLabel}</label>
                  <select
                    value={formData.period}
                    onChange={(e) => setFormData({ ...formData, period: Number(e.target.value) })}
                    className="w-full bg-gray-950 border border-gray-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-rose-500 font-mono"
                  >
                    <option value={10}>10 seconds</option>
                    <option value={60}>60 seconds (1 min)</option>
                    <option value={600}>600 seconds (10 mins)</option>
                    <option value={3600}>3600 seconds (1 hour)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-gray-300 mb-1">{t.rateLimitView.rulesSection.actionSelectLabel}</label>
                  <select
                    value={formData.action}
                    onChange={(e) => setFormData({ ...formData, action: e.target.value as any })}
                    className="w-full bg-gray-950 border border-gray-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-rose-500 font-semibold"
                  >
                    <option value="ban">Ban (Block HTTP 429)</option>
                    <option value="managed_challenge">Managed Challenge</option>
                    <option value="js_challenge">JS Challenge</option>
                  </select>
                </div>

                {formData.action === 'ban' && (
                  <div>
                    <label className="block text-[11px] font-semibold text-gray-300 mb-1">{t.rateLimitView.rulesSection.banTimeoutLabel}</label>
                    <input
                      type="number"
                      required
                      min={10}
                      value={formData.timeout}
                      onChange={(e) => setFormData({ ...formData, timeout: Number(e.target.value) })}
                      className="w-full bg-gray-950 border border-gray-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-rose-500 font-mono"
                    />
                  </div>
                )}
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-gray-800">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-gray-800 hover:bg-gray-750 text-gray-300 text-xs font-semibold"
                >
                  {t.common.cancel}
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-gradient-to-r from-rose-500 to-red-600 text-white text-xs font-semibold shadow-md shadow-rose-500/20"
                >
                  {t.rateLimitView.rulesSection.btnSave}
                </button>
              </div>
            </form>

            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-white text-sm p-1"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {/* Safety Confirmation Modal: Delete Rate Limiting Rule */}
      {deleteRuleTarget && (
        <ActionConfirmModal
          isOpen={isDeleteModalOpen}
          onClose={() => {
            setIsDeleteModalOpen(false);
            setDeleteRuleTarget(null);
          }}
          onConfirm={confirmDeleteRule}
          title={t.rateLimitView.deleteModal.title}
          description={formatText(t.rateLimitView.deleteModal.desc, {
            desc: deleteRuleTarget.description,
            url: deleteRuleTarget.match?.request?.url || '*',
          })}
          variant="danger"
          confirmText={t.rateLimitView.deleteModal.btnConfirm}
          affectedResource={{
            label: 'Rate Limiting Rule Endpoint',
            value: deleteRuleTarget.match?.request?.url || '*',
            badge: `${deleteRuleTarget.threshold} req / ${deleteRuleTarget.period}s ➔ ${deleteRuleTarget.action?.mode?.toUpperCase()}`,
          }}
        />
      )}
    </div>
  );
};
