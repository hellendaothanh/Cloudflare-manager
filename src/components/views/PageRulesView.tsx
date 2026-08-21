'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useLanguage } from '@/context/LanguageContext';
import { PageRule } from '@/types/cloudflare';
import { 
  SlidersHorizontal, 
  Plus, 
  Trash2, 
  Globe, 
  Zap, 
  CheckCircle2, 
  AlertCircle, 
  RefreshCw, 
  ArrowRight 
} from 'lucide-react';
import { ActionConfirmModal } from '@/components/common/ActionConfirmModal';

export const PageRulesView: React.FC = () => {
  const { selectedZone, authFetch, hasPermission, role } = useAuth();
  const { t, formatText } = useLanguage();
  const canEditPageRules = hasPermission('canEditPageRules');
  const [rules, setRules] = useState<PageRule[]>([]);
  const [loading, setLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Safety Confirmation Modal state
  const [deleteRuleTarget, setDeleteRuleTarget] = useState<PageRule | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  const [notification, setNotification] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [formData, setFormData] = useState({
    urlPattern: '',
    actionType: 'forwarding_url',
    forwardUrl: '',
    statusCode: 301,
    cacheLevel: 'cache_everything',
  });

  const fetchRules = async () => {
    if (!selectedZone) return;
    setLoading(true);
    try {
      const data = await authFetch(`/api/page-rules?zoneId=${selectedZone.id}`);
      setRules(Array.isArray(data) ? data : []);
    } catch (err: any) {
      setNotification({ type: 'error', text: err.message || t.common.error });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRules();
  }, [selectedZone]);

  const handleSaveRule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedZone) return;

    try {
      const actions: any[] = [];
      if (formData.actionType === 'forwarding_url') {
        actions.push({
          id: 'forwarding_url',
          value: {
            url: formData.forwardUrl,
            status_code: formData.statusCode,
          },
        });
      } else if (formData.actionType === 'cache_level') {
        actions.push({
          id: 'cache_level',
          value: formData.cacheLevel,
        });
      } else if (formData.actionType === 'always_use_https') {
        actions.push({
          id: 'always_use_https',
          value: 'on',
        });
      }

      await authFetch('/api/page-rules', {
        method: 'POST',
        body: JSON.stringify({
          zoneId: selectedZone.id,
          targets: [
            {
              target: 'url',
              constraint: {
                operator: 'matches',
                value: formData.urlPattern,
              },
            },
          ],
          actions,
          status: 'active',
        }),
      });

      setNotification({ type: 'success', text: t.pageRulesView.messages.ruleCreated });
      setIsModalOpen(false);
      setFormData({
        urlPattern: '',
        actionType: 'forwarding_url',
        forwardUrl: '',
        statusCode: 301,
        cacheLevel: 'cache_everything',
      });
      await fetchRules();
    } catch (err: any) {
      setNotification({ type: 'error', text: err.message || t.common.error });
    }
  };

  const confirmDeleteRule = async () => {
    if (!deleteRuleTarget || !selectedZone) return;
    const ruleId = deleteRuleTarget.id;
    try {
      await authFetch(`/api/page-rules?zoneId=${selectedZone.id}&ruleId=${ruleId}`, {
        method: 'DELETE',
      });
      setRules(prev => prev.filter(r => r.id !== ruleId));
      setNotification({ type: 'success', text: t.pageRulesView.messages.ruleDeleted });
    } catch (err: any) {
      setNotification({ type: 'error', text: err.message || t.common.error });
    } finally {
      setDeleteRuleTarget(null);
      setIsDeleteModalOpen(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 rounded-2xl bg-gradient-to-r from-gray-900 via-gray-900/90 to-gray-950 border border-gray-800">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="p-2 rounded-xl bg-purple-500/10 text-purple-400 border border-purple-500/20">
              <SlidersHorizontal className="w-5 h-5" />
            </span>
            <h1 className="text-xl font-bold text-white tracking-tight">{t.pageRulesView.title}</h1>
          </div>
          <p className="text-xs text-gray-400">
            {t.pageRulesView.subtitle}
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={fetchRules}
            disabled={loading}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-gray-800 hover:bg-gray-750 border border-gray-700 text-gray-300 text-xs font-medium transition-all"
            title={t.pageRulesView.refreshBtn || t.common.refresh}
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-purple-400' : ''}`} />
            <span>{t.pageRulesView.refreshBtn || t.common.refresh}</span>
          </button>

          <button
            onClick={() => canEditPageRules && setIsModalOpen(true)}
            disabled={!canEditPageRules}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold shadow-lg transition-all ${
              canEditPageRules
                ? 'bg-gradient-to-r from-purple-500 to-indigo-500 hover:from-purple-600 hover:to-indigo-600 text-white shadow-purple-500/20'
                : 'bg-gray-800 text-gray-500 cursor-not-allowed opacity-60'
            }`}
            title={!canEditPageRules ? formatText(t.rbac.permissionDeniedTooltip, { role: t.rbac.roles[role]?.name || role }) : ''}
          >
            <Plus className="w-4 h-4" />
            <span>{t.pageRulesView.addRuleBtn}</span>
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

      {/* Rules List */}
      <div className="space-y-3">
        {loading ? (
          <div className="p-12 text-center text-gray-500">
            <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-purple-400" />
            {t.common.loading}
          </div>
        ) : rules.length === 0 ? (
          <div className="p-8 text-center rounded-2xl bg-gray-900/40 border border-gray-800 text-gray-400 text-xs">
            {t.pageRulesView.noRules}
          </div>
        ) : (
          rules.map((rule, idx) => (
            <div
              key={rule.id}
              className="p-4 rounded-2xl bg-gray-900/70 border border-gray-800 hover:border-gray-700 transition-all flex flex-col md:flex-row md:items-center justify-between gap-4"
            >
              <div className="space-y-2 flex-1">
                <div className="flex items-center gap-2.5">
                  <span className="px-2 py-0.5 rounded-md bg-purple-500/15 border border-purple-500/30 text-purple-300 font-mono text-[10px] font-bold">
                    Priority #{rule.priority || idx + 1}
                  </span>
                  <span className="text-xs font-mono font-bold text-white">
                    {rule.targets?.[0]?.constraint?.value || '*'}
                  </span>
                </div>

                <div className="flex flex-wrap gap-2 pt-1">
                  {rule.actions?.map((act, aIdx) => (
                    <span key={aIdx} className="px-2.5 py-1 rounded-lg bg-gray-950 border border-gray-800 text-gray-300 text-[11px] font-mono flex items-center gap-1.5">
                      <span className="text-purple-400 font-semibold">{act.id}:</span>
                      {typeof act.value === 'object' && act.value !== null ? (
                        act.value.url ? (
                          <span className="flex items-center gap-1 text-gray-200">
                            <span>[{act.value.status_code}]</span>
                            <ArrowRight className="w-3 h-3 text-gray-500" />
                            <span className="text-cyan-300">{act.value.url}</span>
                          </span>
                        ) : JSON.stringify(act.value)
                      ) : (
                        <span className="text-gray-200">{String(act.value || 'Enabled')}</span>
                      )}
                    </span>
                  ))}
                </div>
              </div>

              <div className="flex items-center gap-2 self-end md:self-center">
                <button
                  onClick={() => {
                    if (!canEditPageRules) return;
                    setDeleteRuleTarget(rule);
                    setIsDeleteModalOpen(true);
                  }}
                  disabled={!canEditPageRules}
                  className={`p-2 rounded-xl transition-colors ${
                    canEditPageRules
                      ? 'bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 cursor-pointer'
                      : 'bg-gray-900 text-gray-600 border border-gray-800 cursor-not-allowed opacity-50'
                  }`}
                  title={!canEditPageRules ? formatText(t.rbac.permissionDeniedTooltip, { role: t.rbac.roles[role]?.name || role }) : t.common.delete}
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Add Page Rule Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="w-full max-w-lg rounded-2xl bg-gray-900 border border-gray-800 p-6 shadow-2xl relative">
            <h2 className="text-base font-bold text-white mb-4 flex items-center gap-2">
              <SlidersHorizontal className="w-4 h-4 text-purple-400" />
              {t.pageRulesView.modal.title}
            </h2>

            <form onSubmit={handleSaveRule} className="space-y-3.5">
              <div>
                <label className="block text-[11px] font-semibold text-gray-400 mb-1">{t.pageRulesView.modal.urlLabel}</label>
                <input
                  type="text"
                  required
                  placeholder={`${selectedZone?.name || 'example.com'}/*`}
                  value={formData.urlPattern}
                  onChange={(e) => setFormData({ ...formData, urlPattern: e.target.value })}
                  className="w-full bg-gray-950 border border-gray-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-purple-500 font-mono"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-gray-400 mb-1">{t.pageRulesView.modal.actionTypeLabel}</label>
                <select
                  value={formData.actionType}
                  onChange={(e) => setFormData({ ...formData, actionType: e.target.value })}
                  className="w-full bg-gray-950 border border-gray-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-purple-500 font-semibold"
                >
                  <option value="forwarding_url">{t.pageRulesView.modal.forwardingOption}</option>
                  <option value="cache_level">{t.pageRulesView.modal.cacheOption}</option>
                  <option value="always_use_https">{t.pageRulesView.modal.alwaysHttpsOption}</option>
                </select>
              </div>

              {formData.actionType === 'forwarding_url' && (
                <div className="space-y-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-gray-400 mb-1">{t.pageRulesView.modal.statusCodeLabel}</label>
                    <select
                      value={formData.statusCode}
                      onChange={(e) => setFormData({ ...formData, statusCode: parseInt(e.target.value, 10) })}
                      className="w-full bg-gray-950 border border-gray-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-purple-500 font-mono"
                    >
                      <option value={301}>301 - Permanent Redirect</option>
                      <option value={302}>302 - Temporary Redirect</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-gray-400 mb-1">{t.pageRulesView.modal.targetUrlLabel}</label>
                    <input
                      type="text"
                      required
                      placeholder="https://newdomain.com/$1"
                      value={formData.forwardUrl}
                      onChange={(e) => setFormData({ ...formData, forwardUrl: e.target.value })}
                      className="w-full bg-gray-950 border border-gray-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-purple-500 font-mono"
                    />
                  </div>
                </div>
              )}

              {formData.actionType === 'cache_level' && (
                <div>
                  <label className="block text-[11px] font-semibold text-gray-400 mb-1">{t.pageRulesView.modal.cacheLevelLabel}</label>
                  <select
                    value={formData.cacheLevel}
                    onChange={(e) => setFormData({ ...formData, cacheLevel: e.target.value })}
                    className="w-full bg-gray-950 border border-gray-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-purple-500"
                  >
                    <option value="bypass">{t.pageRulesView.modal.cacheBypass}</option>
                    <option value="basic">{t.pageRulesView.modal.cacheBasic}</option>
                    <option value="cache_everything">{t.pageRulesView.modal.cacheEverything}</option>
                  </select>
                </div>
              )}

              <div className="flex items-center gap-2 pt-3">
                <button
                  type="submit"
                  className="flex-1 bg-gradient-to-r from-purple-500 to-indigo-500 hover:from-purple-600 hover:to-indigo-600 text-white font-medium py-2 px-4 rounded-xl text-xs transition-all shadow-lg shadow-purple-500/20"
                >
                  {t.pageRulesView.modal.btnCreate}
                </button>
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-gray-700 bg-gray-800 hover:bg-gray-750 text-gray-300 text-xs font-medium"
                >
                  {t.common.cancel}
                </button>
              </div>
            </form>

            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="absolute top-4 right-4 text-gray-500 hover:text-gray-300 text-sm p-1"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {/* Safety Confirmation Modal: Delete Page Rule */}
      {deleteRuleTarget && (
        <ActionConfirmModal
          isOpen={isDeleteModalOpen}
          onClose={() => {
            setIsDeleteModalOpen(false);
            setDeleteRuleTarget(null);
          }}
          onConfirm={confirmDeleteRule}
          title={t.pageRulesView.deleteModal.title}
          description={formatText(t.pageRulesView.deleteModal.desc, {
            pattern: deleteRuleTarget.targets?.[0]?.constraint?.value || (deleteRuleTarget as any).urlPattern || 'Rule',
          })}
          variant="danger"
          confirmText={t.pageRulesView.deleteModal.btnConfirm}
          affectedResource={{
            label: 'Target URL Pattern',
            value: deleteRuleTarget.targets?.[0]?.constraint?.value || (deleteRuleTarget as any).urlPattern || 'Rule',
            badge: `${deleteRuleTarget.actions?.length || 0} Actions Configured`,
          }}
        />
      )}
    </div>
  );
};
