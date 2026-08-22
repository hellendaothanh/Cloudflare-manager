'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useLanguage } from '@/context/LanguageContext';
import { EmergencyState } from '@/app/api/emergency/route';
import { ActionConfirmModal } from '@/components/common/ActionConfirmModal';
import { 
  Flame, 
  ShieldAlert, 
  ShieldCheck, 
  AlertTriangle, 
  RefreshCw, 
  Globe, 
  Radio, 
  Server, 
  Power, 
  ArrowRight, 
  Eye, 
  CheckCircle2, 
  AlertCircle,
  HelpCircle,
  FileCode,
  Clock,
  Mail
} from 'lucide-react';

export const EmergencyBreakGlassTab: React.FC = () => {
  const { selectedZone, authFetch, hasPermission, role } = useAuth();
  const { t, formatText } = useLanguage();
  const canOperateEmergency = hasPermission('canAutoFix');

  const [state, setState] = useState<EmergencyState | null>(null);
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Safety Confirmation Modals state
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [modalAction, setModalAction] = useState<'activate' | 'deactivate'>('activate');

  // Form State
  const [formData, setFormData] = useState<EmergencyState>({
    isActive: false,
    mode: 'static_maintenance',
    targetScope: 'all_traffic',
    httpStatusCode: 503,
    estimatedRecoveryTime: '30-45 minutes',
    maintenanceMessage: 'Hệ thống đang tiến hành bảo trì khẩn cấp. Mọi dịch vụ sẽ sớm hoạt động trở lại.',
    supportContact: 'noc-support@company.io',
    autoEnableAlwaysOnline: true,
    autoPurgeEdgeCacheOnDeactivate: true,
  });

  const fetchEmergencyState = async () => {
    if (!selectedZone) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/emergency?zoneId=${selectedZone.id}`);
      const data = await res.json();
      setState(data);
      if (data) {
        setFormData({
          isActive: data.isActive || false,
          mode: data.mode || 'static_maintenance',
          targetScope: data.targetScope || 'all_traffic',
          httpStatusCode: data.httpStatusCode || 503,
          estimatedRecoveryTime: data.estimatedRecoveryTime || '30-45 minutes',
          maintenanceMessage: data.maintenanceMessage || 'Hệ thống đang tiến hành bảo trì khẩn cấp.',
          supportContact: data.supportContact || 'noc-support@company.io',
          autoEnableAlwaysOnline: data.autoEnableAlwaysOnline ?? true,
          autoPurgeEdgeCacheOnDeactivate: data.autoPurgeEdgeCacheOnDeactivate ?? true,
        });
      }
    } catch (err: any) {
      setNotification({ type: 'error', text: err.message || 'Failed to fetch emergency state' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEmergencyState();
  }, [selectedZone]);

  const handleToggleEmergency = (targetAction: 'activate' | 'deactivate') => {
    setModalAction(targetAction);
    setIsConfirmModalOpen(true);
  };

  const confirmEmergencyExecution = async () => {
    if (!selectedZone) return;
    setActionLoading(modalAction);
    setIsConfirmModalOpen(false);

    try {
      const res = await fetch('/api/emergency', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: modalAction,
          zoneId: selectedZone.id,
          zoneName: selectedZone.name,
          state: formData,
        }),
      });
      const data = await res.json();
      setState(data.state);
      setNotification({
        type: 'success',
        text: modalAction === 'activate'
          ? formatText(t.complianceView.messages.emergencyActivated, { name: selectedZone.name })
          : formatText(t.complianceView.messages.emergencyDeactivated, { name: selectedZone.name }),
      });
    } catch (err: any) {
      setNotification({ type: 'error', text: err.message || 'Execution failed' });
    } finally {
      setActionLoading(null);
    }
  };

  const handleSaveTemplate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedZone) return;
    setActionLoading('save');
    try {
      const res = await fetch('/api/emergency', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'update_template',
          zoneId: selectedZone.id,
          zoneName: selectedZone.name,
          state: formData,
        }),
      });
      const data = await res.json();
      setState(data.state);
      setNotification({ type: 'success', text: data.message });
    } catch (err: any) {
      setNotification({ type: 'error', text: err.message || 'Failed to update template' });
    } finally {
      setActionLoading(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-gray-800 pb-4">
        <div>
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <Flame className="w-5 h-5 text-rose-500 animate-pulse" />
            {t.complianceView.emergencySection.title}
          </h2>
          <p className="text-xs text-gray-400 mt-0.5">
            {t.complianceView.emergencySection.subtitle}
          </p>
        </div>

        <button
          type="button"
          onClick={fetchEmergencyState}
          disabled={loading}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gray-900 border border-gray-800 hover:border-gray-700 text-xs text-gray-300 transition-colors self-start sm:self-auto"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>{t.common.refresh}</span>
        </button>
      </div>

      {/* Notification */}
      {notification && (
        <div className={`p-4 rounded-xl text-xs flex items-center gap-3 ${
          notification.type === 'success' ? 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-300' : 'bg-rose-500/10 border border-rose-500/30 text-rose-400'
        }`}>
          {notification.type === 'success' ? <CheckCircle2 className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
          <span>{notification.text}</span>
        </div>
      )}

      {/* WAR ROOM ACTIVATION BANNER */}
      <div className={`p-6 rounded-2xl border transition-all ${
        state?.isActive
          ? 'bg-gradient-to-br from-rose-950/90 via-gray-900 to-gray-950 border-rose-500 shadow-2xl shadow-rose-500/20'
          : 'bg-gray-900/80 border-gray-800'
      }`}>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className={`px-2.5 py-1 rounded-full text-xs font-extrabold uppercase tracking-wider flex items-center gap-1.5 ${
                state?.isActive
                  ? 'bg-rose-500 text-white animate-pulse shadow-md shadow-rose-500/30'
                  : 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
              }`}>
                {state?.isActive ? <Flame className="w-3.5 h-3.5" /> : <ShieldCheck className="w-3.5 h-3.5" />}
                <span>{state?.isActive ? t.complianceView.emergencySection.statusActiveTitle : t.complianceView.emergencySection.statusInactiveTitle}</span>
              </span>
            </div>

            <h3 className="text-lg font-bold text-white">
              {state?.isActive
                ? formatText(t.complianceView.emergencySection.statusActiveDesc, { zone: selectedZone?.name || '' })
                : t.complianceView.emergencySection.statusInactiveDesc}
            </h3>

            {state?.isActive && state.activatedAt && (
              <div className="flex items-center gap-4 text-xs font-mono text-rose-300/80 pt-1">
                <span>Activated: {new Date(state.activatedAt).toLocaleTimeString()}</span>
                <span>•</span>
                <span>By: {state.activatedBy || 'Operator'}</span>
                <span>•</span>
                <span>Scope: {state.targetScope}</span>
              </div>
            )}
          </div>

          {/* Trigger Button */}
          <div className="shrink-0">
            {state?.isActive ? (
              <button
                type="button"
                onClick={() => handleToggleEmergency('deactivate')}
                disabled={actionLoading !== null || !canOperateEmergency}
                className="w-full sm:w-auto px-6 py-3.5 rounded-2xl bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-extrabold transition-all shadow-xl shadow-emerald-500/25 flex items-center justify-center gap-2 cursor-pointer"
              >
                <ShieldCheck className="w-5 h-5" />
                <span>{t.complianceView.emergencySection.btnDeactivate}</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={() => handleToggleEmergency('activate')}
                disabled={actionLoading !== null || !canOperateEmergency}
                className="w-full sm:w-auto px-6 py-3.5 rounded-2xl bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-700 hover:to-red-700 text-white text-xs font-extrabold transition-all shadow-xl shadow-rose-600/30 flex items-center justify-center gap-2 cursor-pointer"
              >
                <Flame className="w-5 h-5" />
                <span>{t.complianceView.emergencySection.btnActivate}</span>
              </button>
            )}
          </div>
        </div>

        {/* Traffic Flow Pipeline Diagram */}
        <div className="mt-6 pt-6 border-t border-gray-800/80">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 font-mono text-xs text-center">
            <div className="p-3 rounded-xl bg-gray-950 border border-gray-850">
              <span className="text-gray-500 block text-[10px]">INBOUND VISITORS</span>
              <span className="text-white font-bold">100% Inbound Traffic</span>
            </div>

            <div className={`p-3 rounded-xl border flex flex-col items-center justify-center ${
              state?.isActive ? 'bg-rose-500/20 border-rose-500/40 text-rose-300' : 'bg-gray-950 border-gray-850 text-emerald-400'
            }`}>
              <span className="text-[10px] block opacity-80">CLOUDFLARE EDGE ROUTING</span>
              <span className="font-bold">
                {state?.isActive ? '🚨 Trapped at Edge Shield (HTTP 503)' : '✓ Pass-through to Origin'}
              </span>
            </div>

            <div className={`p-3 rounded-xl border ${
              state?.isActive ? 'bg-gray-950 border-gray-850 text-gray-500' : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
            }`}>
              <span className="text-[10px] block opacity-80">ORIGIN SERVER</span>
              <span className="font-bold">
                {state?.isActive ? '🛡️ ISOLATED (Protected from 5xx load)' : 'Live Origin Traffic (Active)'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Grid: Template Editor & Live Preview */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Configuration Form */}
        <form onSubmit={handleSaveTemplate} className="lg:col-span-6 p-5 rounded-2xl bg-gray-900/70 border border-gray-800 space-y-4">
          <div className="flex items-center justify-between border-b border-gray-800 pb-3">
            <span className="text-xs font-bold text-white flex items-center gap-2">
              <FileCode className="w-4 h-4 text-orange-400" />
              Cấu hình Thông điệp & Phạm vi Failover
            </span>
          </div>

          <div className="space-y-3.5 text-xs">
            <div>
              <label className="block text-gray-400 font-semibold mb-1">
                {t.complianceView.emergencySection.failoverModeLabel}
              </label>
              <select
                value={formData.mode}
                onChange={(e) => setFormData({ ...formData, mode: e.target.value as any })}
                className="w-full bg-gray-950 border border-gray-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-orange-500"
              >
                <option value="static_maintenance">{t.complianceView.emergencySection.modeStatic}</option>
                <option value="waiting_room">{t.complianceView.emergencySection.modeWaitingRoom}</option>
                <option value="r2_edge_fallback">{t.complianceView.emergencySection.modeR2}</option>
              </select>
            </div>

            <div>
              <label className="block text-gray-400 font-semibold mb-1">
                {t.complianceView.emergencySection.scopeLabel}
              </label>
              <select
                value={formData.targetScope}
                onChange={(e) => setFormData({ ...formData, targetScope: e.target.value as any })}
                className="w-full bg-gray-950 border border-gray-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-orange-500"
              >
                <option value="all_traffic">{t.complianceView.emergencySection.scopeAll}</option>
                <option value="root_domain_only">{t.complianceView.emergencySection.scopeWebOnly}</option>
              </select>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-gray-400 font-semibold mb-1">
                  {t.complianceView.emergencySection.recoveryTimeLabel}
                </label>
                <input
                  type="text"
                  value={formData.estimatedRecoveryTime}
                  onChange={(e) => setFormData({ ...formData, estimatedRecoveryTime: e.target.value })}
                  placeholder="30-45 minutes"
                  className="w-full bg-gray-950 border border-gray-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-orange-500 font-mono"
                />
              </div>

              <div>
                <label className="block text-gray-400 font-semibold mb-1">
                  {t.complianceView.emergencySection.supportContactLabel}
                </label>
                <input
                  type="email"
                  value={formData.supportContact}
                  onChange={(e) => setFormData({ ...formData, supportContact: e.target.value })}
                  placeholder="noc@company.io"
                  className="w-full bg-gray-950 border border-gray-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-orange-500 font-mono"
                />
              </div>
            </div>

            <div>
              <label className="block text-gray-400 font-semibold mb-1">
                {t.complianceView.emergencySection.messageLabel}
              </label>
              <textarea
                rows={3}
                value={formData.maintenanceMessage}
                onChange={(e) => setFormData({ ...formData, maintenanceMessage: e.target.value })}
                className="w-full bg-gray-950 border border-gray-800 rounded-xl p-3 text-xs text-white focus:outline-none focus:border-orange-500 leading-relaxed font-sans"
              />
            </div>

            <div className="pt-2 flex justify-end">
              <button
                type="submit"
                disabled={actionLoading === 'save'}
                className="px-4 py-2 rounded-xl bg-gray-800 hover:bg-gray-750 text-white text-xs font-bold transition-all"
              >
                {actionLoading === 'save' ? t.common.saving : t.complianceView.emergencySection.saveTemplateBtn}
              </button>
            </div>
          </div>
        </form>

        {/* Right: Live Preview of Maintenance Screen */}
        <div className="lg:col-span-6 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-gray-300 flex items-center gap-2">
              <Eye className="w-4 h-4 text-cyan-400" />
              {t.complianceView.emergencySection.previewTitle}
            </span>
            <span className="text-[10px] font-mono text-gray-500 bg-gray-950 px-2 py-0.5 rounded border border-gray-850">
              HTTP 503 • Service Unavailable
            </span>
          </div>

          <div className="p-8 rounded-2xl bg-gradient-to-b from-[#0B0F19] to-[#06080F] border border-gray-800 text-center shadow-2xl flex flex-col items-center justify-center min-h-[320px] space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-orange-500/10 border border-orange-500/30 text-orange-400 flex items-center justify-center shadow-lg shadow-orange-500/10">
              <Flame className="w-6 h-6" />
            </div>

            <div className="space-y-1">
              <h4 className="text-base font-bold text-white tracking-tight">
                {selectedZone?.name || 'System'} Maintenance Notice
              </h4>
              <p className="text-xs text-gray-400 max-w-sm mx-auto leading-relaxed">
                {formData.maintenanceMessage}
              </p>
            </div>

            <div className="p-3 rounded-xl bg-gray-950/80 border border-gray-850 flex items-center gap-4 text-[11px] font-mono text-gray-300">
              <div className="flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-cyan-400" />
                <span>Est. Recovery: <strong className="text-white">{formData.estimatedRecoveryTime}</strong></span>
              </div>
              <span>•</span>
              <div className="flex items-center gap-1.5">
                <Mail className="w-3.5 h-3.5 text-amber-400" />
                <span>{formData.supportContact}</span>
              </div>
            </div>

            <span className="text-[9px] text-gray-600 font-mono pt-2 block">
              Powered by Cloudflare DevSecOps Edge Failover Protection
            </span>
          </div>
        </div>
      </div>

      {/* Safety Confirmation Modal */}
      <ActionConfirmModal
        isOpen={isConfirmModalOpen}
        onClose={() => setIsConfirmModalOpen(false)}
        onConfirm={confirmEmergencyExecution}
        title={
          modalAction === 'activate'
            ? t.complianceView.emergencySection.confirmActivateTitle
            : t.complianceView.emergencySection.confirmDeactivateTitle
        }
        description={
          modalAction === 'activate'
            ? formatText(t.complianceView.emergencySection.confirmActivateMsg, { zone: selectedZone?.name || '' })
            : t.complianceView.emergencySection.confirmDeactivateMsg
        }
        variant={modalAction === 'activate' ? 'danger' : 'warning'}
        confirmText={
          modalAction === 'activate'
            ? t.complianceView.emergencySection.btnActivate
            : t.complianceView.emergencySection.btnDeactivate
        }
        affectedResource={{
          label: 'Emergency Failover Scope',
          value: modalAction === 'activate' ? 'LIVE ORIGIN ➔ STATIC EDGE MAINTENANCE (503)' : 'STATIC EDGE ➔ LIVE ORIGIN',
          badge: selectedZone?.name,
        }}
      />
    </div>
  );
};
