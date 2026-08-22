'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useLanguage } from '@/context/LanguageContext';
import { ModernRulesetRule } from '@/app/api/rulesets/route';
import { 
  SlidersHorizontal, 
  Plus, 
  Trash2, 
  Globe, 
  Zap, 
  CheckCircle2, 
  AlertCircle, 
  RefreshCw, 
  ArrowRight,
  Sparkles,
  ArrowUpRight,
  Shield,
  Layers,
  Code2,
  FileCode,
  Check,
  AlertTriangle
} from 'lucide-react';
import { ActionConfirmModal } from '@/components/common/ActionConfirmModal';

export const PageRulesView: React.FC = () => {
  const { selectedZone, authFetch, hasPermission, role } = useAuth();
  const { t, formatText } = useLanguage();
  const canEditPageRules = hasPermission('canEditPageRules');

  const [rules, setRules] = useState<ModernRulesetRule[]>([]);
  const [activeTab, setActiveTab] = useState<'all' | 'dynamic_redirect' | 'response_header' | 'request_header' | 'url_rewrite' | 'query_sanitize'>('all');
  const [loading, setLoading] = useState(false);
  const [migrating, setMigrating] = useState(false);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [deleteRuleTarget, setDeleteRuleTarget] = useState<ModernRulesetRule | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Form State
  const [formDesc, setFormDesc] = useState('');
  const [formKind, setFormKind] = useState<'dynamic_redirect' | 'response_header' | 'request_header' | 'url_rewrite' | 'query_sanitize'>('dynamic_redirect');
  const [formExpr, setFormExpr] = useState('(http.request.uri.path wildcard "/api/*")');
  const [formTargetUrl, setFormTargetUrl] = useState('https://security-enterprise.io/api/v2');
  const [formStatusCode, setFormStatusCode] = useState(301);
  const [formPreserveQuery, setFormPreserveQuery] = useState(true);
  const [formHeaderName, setFormHeaderName] = useState('X-Frame-Options');
  const [formHeaderVal, setFormHeaderVal] = useState('DENY');
  const [formHeaderOp, setFormHeaderOp] = useState<'set' | 'remove' | 'add'>('set');
  const [formRewritePath, setFormRewritePath] = useState('/status/healthz');

  const fetchRulesets = async () => {
    if (!selectedZone) return;
    setLoading(true);
    try {
      const data = await authFetch(`/api/rulesets?zoneId=${selectedZone.id}`);
      if (data.success && Array.isArray(data.result)) {
        setRules(data.result);
      } else {
        setRules([]);
      }
    } catch (err: any) {
      setNotification({ type: 'error', text: err.message || t.common.error });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRulesets();
  }, [selectedZone]);

  const handleMigratePageRules = async () => {
    if (!selectedZone) return;
    setMigrating(true);
    try {
      const res = await authFetch('/api/rulesets', {
        method: 'POST',
        body: JSON.stringify({
          action: 'migrate_page_rules',
          zoneId: selectedZone.id,
        }),
      });

      if (res.success) {
        setNotification({ type: 'success', text: t.pageRulesView.migrateBanner.success });
        fetchRulesets();
      }
    } catch (err: any) {
      setNotification({ type: 'error', text: err.message || 'Migration failed' });
    } finally {
      setMigrating(false);
    }
  };

  const handleSaveRule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedZone || !formDesc.trim()) return;

    try {
      const newRule: Partial<ModernRulesetRule> = {
        description: formDesc.trim(),
        kind: formKind,
        expression: formExpr,
        enabled: true,
        action: formKind === 'dynamic_redirect' ? 'redirect' : formKind === 'url_rewrite' || formKind === 'query_sanitize' ? 'rewrite' : 'set_header',
      };

      if (formKind === 'dynamic_redirect') {
        newRule.parameters = {
          from_value: {
            target_url: { value: formTargetUrl },
            status_code: formStatusCode,
            preserve_query_string: formPreserveQuery,
          },
        };
      } else if (formKind === 'response_header' || formKind === 'request_header') {
        newRule.parameters = {
          headers: {
            [formHeaderName]: {
              operation: formHeaderOp,
              value: formHeaderVal,
            },
          },
        };
      } else if (formKind === 'url_rewrite') {
        newRule.parameters = {
          uri: {
            path: { value: formRewritePath },
          },
        };
      } else if (formKind === 'query_sanitize') {
        newRule.parameters = {
          uri: {
            query: { value: '' },
          },
        };
      }

      await authFetch('/api/rulesets', {
        method: 'POST',
        body: JSON.stringify({
          action: 'create',
          zoneId: selectedZone.id,
          rule: newRule,
        }),
      });

      setIsModalOpen(false);
      setFormDesc('');
      setNotification({ type: 'success', text: t.pageRulesView.messages.ruleCreated });
      fetchRulesets();
    } catch (err: any) {
      setNotification({ type: 'error', text: err.message || t.common.error });
    }
  };

  const handleDeleteRule = async () => {
    if (!selectedZone || !deleteRuleTarget) return;
    try {
      await authFetch(`/api/rulesets?zoneId=${selectedZone.id}&ruleId=${deleteRuleTarget.id}`, {
        method: 'DELETE',
      });
      setRules(prev => prev.filter(r => r.id !== deleteRuleTarget.id));
      setIsDeleteModalOpen(false);
      setDeleteRuleTarget(null);
      setNotification({ type: 'success', text: t.pageRulesView.messages.ruleDeleted });
    } catch (err: any) {
      setNotification({ type: 'error', text: err.message || t.common.error });
    }
  };

  const filteredRules = activeTab === 'all' ? rules : rules.filter(r => r.kind === activeTab);

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 rounded-2xl bg-gradient-to-r from-gray-900 via-gray-900/90 to-gray-950 border border-gray-800">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="p-2 rounded-xl bg-orange-500/10 text-orange-400 border border-orange-500/20">
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
            onClick={fetchRulesets}
            disabled={loading}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-gray-800 hover:bg-gray-750 border border-gray-700 text-gray-300 text-xs font-semibold transition-all cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>{t.pageRulesView.refreshBtn}</span>
          </button>

          <button
            onClick={() => canEditPageRules && setIsModalOpen(true)}
            disabled={!canEditPageRules}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-md ${
              canEditPageRules
                ? 'bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white shadow-orange-500/20 cursor-pointer'
                : 'bg-gray-800 text-gray-500 cursor-not-allowed opacity-50'
            }`}
          >
            <Plus className="w-4 h-4" />
            <span>{t.pageRulesView.addRuleBtn}</span>
          </button>
        </div>
      </div>

      {/* Cloudflare Deprecation Alert & 1-Click Migration Banner */}
      <div className="p-5 rounded-2xl bg-gradient-to-r from-amber-500/15 via-orange-500/10 to-amber-500/15 border border-amber-500/30 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
          <div className="space-y-0.5">
            <span className="text-xs font-bold text-amber-200 block">
              {t.pageRulesView.migrateBanner.title}
            </span>
            <p className="text-[11px] text-amber-300/80 leading-relaxed max-w-3xl">
              {t.pageRulesView.migrateBanner.desc}
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={handleMigratePageRules}
          disabled={migrating || !canEditPageRules}
          className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-gray-950 font-bold text-xs transition-all shadow-md shrink-0 flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
        >
          <Sparkles className={`w-3.5 h-3.5 ${migrating ? 'animate-spin' : ''}`} />
          <span>{migrating ? t.pageRulesView.migrateBanner.migrating : t.pageRulesView.migrateBanner.btnMigrate}</span>
        </button>
      </div>

      {/* Notifications */}
      {notification && (
        <div className={`p-4 rounded-xl text-xs flex items-center gap-2.5 ${
          notification.type === 'success' ? 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-300' : 'bg-rose-500/10 border border-rose-500/30 text-rose-400'
        }`}>
          {notification.type === 'success' ? <CheckCircle2 className="w-4 h-4 shrink-0" /> : <AlertCircle className="w-4 h-4 shrink-0" />}
          <span>{notification.text}</span>
        </div>
      )}

      {/* Sub-tabs Navigation */}
      <div className="flex flex-wrap items-center gap-2 border-b border-gray-800 pb-2">
        <button
          onClick={() => setActiveTab('all')}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all ${
            activeTab === 'all'
              ? 'bg-orange-500/20 text-orange-300 border border-orange-500/40 font-bold'
              : 'text-gray-400 hover:text-gray-200 hover:bg-gray-900'
          }`}
        >
          {formatText(t.pageRulesView.tabs.all, { count: rules.length })}
        </button>

        <button
          onClick={() => setActiveTab('dynamic_redirect')}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 ${
            activeTab === 'dynamic_redirect'
              ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 font-bold'
              : 'text-gray-400 hover:text-gray-200 hover:bg-gray-900'
          }`}
        >
          <ArrowUpRight className="w-3.5 h-3.5" />
          <span>{formatText(t.pageRulesView.tabs.redirects, { count: rules.filter(r => r.kind === 'dynamic_redirect').length })}</span>
        </button>

        <button
          onClick={() => setActiveTab('response_header')}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 ${
            activeTab === 'response_header'
              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-bold'
              : 'text-gray-400 hover:text-gray-200 hover:bg-gray-900'
          }`}
        >
          <Shield className="w-3.5 h-3.5" />
          <span>{formatText(t.pageRulesView.tabs.responseHeaders, { count: rules.filter(r => r.kind === 'response_header').length })}</span>
        </button>

        <button
          onClick={() => setActiveTab('request_header')}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 ${
            activeTab === 'request_header'
              ? 'bg-purple-500/20 text-purple-300 border border-purple-500/40 font-bold'
              : 'text-gray-400 hover:text-gray-200 hover:bg-gray-900'
          }`}
        >
          <Layers className="w-3.5 h-3.5" />
          <span>{formatText(t.pageRulesView.tabs.requestHeaders, { count: rules.filter(r => r.kind === 'request_header').length })}</span>
        </button>

        <button
          onClick={() => setActiveTab('url_rewrite')}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 ${
            activeTab === 'url_rewrite'
              ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 font-bold'
              : 'text-gray-400 hover:text-gray-200 hover:bg-gray-900'
          }`}
        >
          <FileCode className="w-3.5 h-3.5" />
          <span>{formatText(t.pageRulesView.tabs.rewrites, { count: rules.filter(r => r.kind === 'url_rewrite').length })}</span>
        </button>
      </div>

      {/* Ruleset Rules Table */}
      <div className="rounded-2xl border border-gray-800 bg-gray-900/60 overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-gray-950/80 border-b border-gray-800 text-gray-400 uppercase font-semibold text-[10px]">
              <tr>
                <th className="py-3.5 px-4">{t.pageRulesView.table.description}</th>
                <th className="py-3.5 px-4">{t.pageRulesView.table.kind}</th>
                <th className="py-3.5 px-4">{t.pageRulesView.table.expression}</th>
                <th className="py-3.5 px-4">{t.pageRulesView.table.actionDetails}</th>
                <th className="py-3.5 px-4">{t.pageRulesView.table.status}</th>
                <th className="py-3.5 px-4 text-right">{t.pageRulesView.table.actionsCol}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-850">
              {filteredRules.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-gray-500 font-sans">
                    No rules found in this category.
                  </td>
                </tr>
              ) : (
                filteredRules.map((rule) => (
                  <tr key={rule.id} className="hover:bg-gray-850/50 transition-colors">
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-white text-xs">{rule.description}</div>
                      <span className="text-[10px] font-mono text-gray-500">{rule.id}</span>
                    </td>

                    <td className="py-3.5 px-4">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase border ${
                        rule.kind === 'dynamic_redirect'
                          ? 'bg-cyan-500/15 text-cyan-300 border-cyan-500/30'
                          : rule.kind === 'response_header'
                          ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
                          : rule.kind === 'request_header'
                          ? 'bg-purple-500/15 text-purple-300 border-purple-500/30'
                          : 'bg-amber-500/15 text-amber-300 border-amber-500/30'
                      }`}>
                        {t.pageRulesView.ruleKinds[rule.kind] || rule.kind}
                      </span>
                    </td>

                    <td className="py-3.5 px-4 font-mono text-[11px] text-orange-300/90 max-w-xs truncate">
                      <code>{rule.expression}</code>
                    </td>

                    <td className="py-3.5 px-4 text-gray-300">
                      {rule.kind === 'dynamic_redirect' && rule.parameters?.from_value && (
                        <div className="flex items-center gap-1 text-xs">
                          <span className="px-1.5 py-0.5 rounded bg-cyan-950 border border-cyan-800 text-cyan-300 font-mono font-bold text-[10px]">
                            HTTP {rule.parameters.from_value.status_code || 301}
                          </span>
                          <ArrowRight className="w-3 h-3 text-gray-500" />
                          <span className="font-mono text-cyan-200 truncate max-w-xs">{rule.parameters.from_value.target_url?.value}</span>
                        </div>
                      )}

                      {rule.kind === 'response_header' && rule.parameters?.headers && (
                        <div className="text-[11px] font-mono text-emerald-300/90 space-y-0.5">
                          {Object.keys(rule.parameters.headers).slice(0, 2).map((h) => (
                            <div key={h} className="truncate">
                              + {h}: {rule.parameters?.headers?.[h]?.value}
                            </div>
                          ))}
                          {Object.keys(rule.parameters.headers).length > 2 && (
                            <span className="text-[10px] text-gray-500">+{Object.keys(rule.parameters.headers).length - 2} more headers</span>
                          )}
                        </div>
                      )}

                      {rule.kind === 'request_header' && rule.parameters?.headers && (
                        <div className="text-[11px] font-mono text-purple-300/90 space-y-0.5">
                          {Object.keys(rule.parameters.headers).slice(0, 2).map((h) => (
                            <div key={h} className="truncate">
                              + {h}: {rule.parameters?.headers?.[h]?.expression || rule.parameters?.headers?.[h]?.value}
                            </div>
                          ))}
                        </div>
                      )}

                      {rule.kind === 'url_rewrite' && (
                        <div className="text-[11px] font-mono text-amber-300">
                          Rewrite Path: {rule.parameters?.uri?.path?.value}
                        </div>
                      )}

                      {rule.kind === 'query_sanitize' && (
                        <div className="text-[11px] font-mono text-rose-300">
                          Strip Query Parameters
                        </div>
                      )}
                    </td>

                    <td className="py-3.5 px-4">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                        rule.enabled
                          ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                          : 'bg-gray-800 text-gray-400'
                      }`}>
                        {rule.enabled ? t.common.active : 'Disabled'}
                      </span>
                    </td>

                    <td className="py-3.5 px-4 text-right">
                      <button
                        type="button"
                        onClick={() => {
                          setDeleteRuleTarget(rule);
                          setIsDeleteModalOpen(true);
                        }}
                        disabled={!canEditPageRules}
                        className="p-1.5 rounded-lg text-gray-500 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal: Create Modern Ruleset */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="w-full max-w-xl bg-gray-900 border border-gray-800 rounded-3xl p-6 shadow-2xl space-y-5">
            <div className="flex items-center justify-between border-b border-gray-800 pb-3">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <SlidersHorizontal className="w-4 h-4 text-orange-400" />
                <span>{t.pageRulesView.modal.createTitle}</span>
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-500 hover:text-white">✕</button>
            </div>

            <form onSubmit={handleSaveRule} className="space-y-4 text-xs">
              <div>
                <label className="block text-gray-400 mb-1 font-semibold">{t.pageRulesView.modal.descLabel}</label>
                <input
                  type="text"
                  required
                  value={formDesc}
                  onChange={(e) => setFormDesc(e.target.value)}
                  placeholder={t.pageRulesView.modal.descPlaceholder}
                  className="w-full bg-gray-950 border border-gray-800 rounded-xl px-3.5 py-2.5 text-white font-sans focus:outline-none focus:border-orange-500"
                />
              </div>

              <div>
                <label className="block text-gray-400 mb-1 font-semibold">{t.pageRulesView.modal.kindLabel}</label>
                <select
                  value={formKind}
                  onChange={(e) => setFormKind(e.target.value as any)}
                  className="w-full bg-gray-950 border border-gray-800 rounded-xl px-3.5 py-2.5 text-white font-semibold focus:outline-none focus:border-orange-500"
                >
                  <option value="dynamic_redirect">{t.pageRulesView.ruleKinds.dynamic_redirect}</option>
                  <option value="response_header">{t.pageRulesView.ruleKinds.response_header}</option>
                  <option value="request_header">{t.pageRulesView.ruleKinds.request_header}</option>
                  <option value="url_rewrite">{t.pageRulesView.ruleKinds.url_rewrite}</option>
                  <option value="query_sanitize">{t.pageRulesView.ruleKinds.query_sanitize}</option>
                </select>
              </div>

              <div>
                <label className="block text-gray-400 mb-1 font-semibold">{t.pageRulesView.modal.exprLabel}</label>
                <input
                  type="text"
                  required
                  value={formExpr}
                  onChange={(e) => setFormExpr(e.target.value)}
                  placeholder={t.pageRulesView.modal.exprPlaceholder}
                  className="w-full bg-gray-950 border border-gray-800 rounded-xl px-3.5 py-2.5 text-orange-300 font-mono focus:outline-none focus:border-orange-500"
                />
              </div>

              {/* Dynamic Redirect Fields */}
              {formKind === 'dynamic_redirect' && (
                <div className="p-4 rounded-xl bg-gray-950 border border-gray-850 space-y-3">
                  <div>
                    <label className="block text-gray-400 mb-1 font-semibold">{t.pageRulesView.modal.redirectTargetLabel}</label>
                    <input
                      type="text"
                      required
                      value={formTargetUrl}
                      onChange={(e) => setFormTargetUrl(e.target.value)}
                      placeholder={t.pageRulesView.modal.redirectTargetPlaceholder}
                      className="w-full bg-gray-900 border border-gray-800 rounded-xl px-3 py-2 text-cyan-300 font-mono focus:outline-none"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-gray-400 mb-1 font-semibold">{t.pageRulesView.modal.statusCodeLabel}</label>
                      <select
                        value={formStatusCode}
                        onChange={(e) => setFormStatusCode(Number(e.target.value))}
                        className="w-full bg-gray-900 border border-gray-800 rounded-xl px-3 py-2 text-white font-mono"
                      >
                        <option value={301}>301 (Moved Permanently)</option>
                        <option value={302}>302 (Found / Temporary)</option>
                        <option value={307}>307 (Temporary Redirect)</option>
                        <option value={308}>308 (Permanent Redirect)</option>
                      </select>
                    </div>
                    <div className="flex items-center pt-5">
                      <label className="flex items-center gap-2 text-gray-300 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={formPreserveQuery}
                          onChange={(e) => setFormPreserveQuery(e.target.checked)}
                          className="rounded text-orange-500 bg-gray-900 border-gray-800"
                        />
                        <span>{t.pageRulesView.modal.preserveQueryLabel}</span>
                      </label>
                    </div>
                  </div>
                </div>
              )}

              {/* Header Transform Fields */}
              {(formKind === 'response_header' || formKind === 'request_header') && (
                <div className="p-4 rounded-xl bg-gray-950 border border-gray-850 space-y-3">
                  <div className="grid grid-cols-3 gap-2">
                    <div>
                      <label className="block text-gray-400 mb-1 font-semibold">{t.pageRulesView.modal.headerOpLabel}</label>
                      <select
                        value={formHeaderOp}
                        onChange={(e) => setFormHeaderOp(e.target.value as any)}
                        className="w-full bg-gray-900 border border-gray-800 rounded-xl px-3 py-2 text-white"
                      >
                        <option value="set">Set (Ghi đè)</option>
                        <option value="add">Add (Thêm mới)</option>
                        <option value="remove">Remove (Xóa)</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-gray-400 mb-1 font-semibold">{t.pageRulesView.modal.headerNameLabel}</label>
                      <input
                        type="text"
                        value={formHeaderName}
                        onChange={(e) => setFormHeaderName(e.target.value)}
                        className="w-full bg-gray-900 border border-gray-800 rounded-xl px-3 py-2 text-white font-mono"
                      />
                    </div>
                    <div>
                      <label className="block text-gray-400 mb-1 font-semibold">{t.pageRulesView.modal.headerValueLabel}</label>
                      <input
                        type="text"
                        value={formHeaderVal}
                        onChange={(e) => setFormHeaderVal(e.target.value)}
                        className="w-full bg-gray-900 border border-gray-800 rounded-xl px-3 py-2 text-white font-mono"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* URL Rewrite Fields */}
              {formKind === 'url_rewrite' && (
                <div className="p-4 rounded-xl bg-gray-950 border border-gray-850 space-y-2">
                  <label className="block text-gray-400 mb-1 font-semibold">{t.pageRulesView.modal.rewritePathLabel}</label>
                  <input
                    type="text"
                    value={formRewritePath}
                    onChange={(e) => setFormRewritePath(e.target.value)}
                    placeholder={t.pageRulesView.modal.rewritePathPlaceholder}
                    className="w-full bg-gray-900 border border-gray-800 rounded-xl px-3 py-2 text-amber-300 font-mono"
                  />
                </div>
              )}

              <div className="flex justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-gray-800 text-gray-400 hover:text-white"
                >
                  {t.common.cancel}
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 text-white font-bold"
                >
                  {t.pageRulesView.modal.btnCreate}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Safety Confirmation Modal: Delete Ruleset */}
      {deleteRuleTarget && (
        <ActionConfirmModal
          isOpen={isDeleteModalOpen}
          onClose={() => {
            setIsDeleteModalOpen(false);
            setDeleteRuleTarget(null);
          }}
          onConfirm={handleDeleteRule}
          title={t.pageRulesView.deleteModal.title}
          description={formatText(t.pageRulesView.deleteModal.desc, {
            pattern: deleteRuleTarget.description,
          })}
          variant="danger"
          confirmText={t.pageRulesView.deleteModal.btnConfirm}
          affectedResource={{
            label: 'Ruleset Execution Rule',
            value: deleteRuleTarget.description,
            badge: selectedZone?.name,
          }}
        />
      )}
    </div>
  );
};
