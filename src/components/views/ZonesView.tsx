'use client';

import React, { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useLanguage } from '@/context/LanguageContext';
import { QuickActionsModal } from '@/components/common/QuickActionsModal';
import { Zone } from '@/types/cloudflare';
import { auditLogger } from '@/lib/audit/audit-logger';
import { 
  Globe, 
  RefreshCw,
  ExternalLink,
  Terminal,
  CheckCircle2,
  AlertCircle,
  Zap,
  Trash2
} from 'lucide-react';

export const ZonesView: React.FC = () => {
  const { zones, selectedZone, setSelectedZone, isLoadingZones, refreshZones, authFetch, hasPermission, role, activeAccount } = useAuth();
  const { t, formatText } = useLanguage();
  const [actionLoading, setActionLoading] = useState(false);
  const [statusMsg, setStatusMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [isPurgeModalOpen, setIsPurgeModalOpen] = useState(false);

  // Dev Mode Confirmation State
  const [devModeModalZone, setDevModeModalZone] = useState<Zone | null>(null);

  const handleRequestToggleDevMode = (zone: Zone) => {
    setDevModeModalZone(zone);
  };

  const handleConfirmToggleDevMode = async () => {
    if (!devModeModalZone) return;
    const zone = devModeModalZone;
    setActionLoading(true);
    setStatusMsg(null);
    try {
      const isCurrentlyDev = zone.development_mode > 0;
      await authFetch(`/api/zones/${zone.id}`, {
        method: 'PATCH',
        body: JSON.stringify({
          settingId: 'development_mode',
          value: isCurrentlyDev ? 'off' : 'on',
        }),
      });

      auditLogger.recordLog({
        actorName: activeAccount?.name || 'Operator',
        actorRole: role,
        actionType: 'TOGGLE_DEV_MODE',
        zoneName: zone.name,
        zoneId: zone.id,
        resource: `Development Mode: ${isCurrentlyDev ? 'OFF' : 'ON (3h auto-expire)'}`,
        status: 'SUCCESS',
        details: `Người dùng ${activeAccount?.name || 'Operator'} đã ${isCurrentlyDev ? 'TẮT' : 'BẬT'} Development Mode cho domain ${zone.name}.`,
      });

      setStatusMsg({
        type: 'success',
        text: formatText(t.zonesView.devModeUpdated, {
          status: isCurrentlyDev ? t.common.off.toLowerCase() : t.common.on.toLowerCase(),
          name: zone.name,
        }),
      });
      setDevModeModalZone(null);
      await refreshZones();
    } catch (err: any) {
      setStatusMsg({ type: 'error', text: err.message || t.common.error });
    } finally {
      setActionLoading(false);
    }
  };

  const handleOpenGranularPurge = (zone: Zone) => {
    setSelectedZone(zone);
    setIsPurgeModalOpen(true);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner / Zone Summary */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 rounded-2xl bg-gradient-to-r from-gray-900 via-gray-900/90 to-gray-950 border border-gray-800">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="p-2 rounded-xl bg-blue-500/10 text-blue-400 border border-blue-500/20">
              <Globe className="w-5 h-5" />
            </span>
            <h1 className="text-xl font-bold text-white tracking-tight">{t.zonesView.title}</h1>
          </div>
          <p className="text-xs text-gray-400">
            {t.zonesView.subtitle}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={refreshZones}
            disabled={isLoadingZones}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-gray-800 hover:bg-gray-750 border border-gray-700 text-gray-200 text-xs font-medium transition-all"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoadingZones ? 'animate-spin' : ''}`} />
            <span>{t.zonesView.refreshBtn}</span>
          </button>
        </div>
      </div>

      {statusMsg && (
        <div className={`p-4 rounded-xl text-xs flex items-center gap-2.5 ${
          statusMsg.type === 'success' ? 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-400' : 'bg-rose-500/10 border border-rose-500/30 text-rose-400'
        }`}>
          {statusMsg.type === 'success' ? <CheckCircle2 className="w-4 h-4 shrink-0" /> : <AlertCircle className="w-4 h-4 shrink-0" />}
          <div>{statusMsg.text}</div>
        </div>
      )}

      {/* Grid of Zones */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {zones.map((zone) => {
          const isSelected = selectedZone?.id === zone.id;
          const isDevMode = zone.development_mode > 0;

          return (
            <div
              key={zone.id}
              className={`p-5 rounded-2xl transition-all border ${
                isSelected
                  ? 'bg-gray-900 border-orange-500/40 shadow-xl shadow-orange-500/5 ring-1 ring-orange-500/20'
                  : 'bg-gray-900/60 border-gray-800 hover:border-gray-700 hover:bg-gray-900'
              }`}
            >
              <div className="flex items-start justify-between gap-3 mb-3">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-xl bg-gray-800/80 border border-gray-700 text-orange-400">
                    <Globe className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-base font-bold text-white font-mono">{zone.name}</h3>
                      <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full uppercase ${
                        zone.status === 'active'
                          ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                          : 'bg-amber-500/15 text-amber-400 border border-amber-500/30'
                      }`}>
                        {zone.status === 'active' ? t.common.active : zone.status}
                      </span>
                    </div>
                    <span className="text-[11px] text-gray-400">{t.zonesView.idLabel} {zone.id}</span>
                  </div>
                </div>

                <button
                  onClick={() => setSelectedZone(zone)}
                  className={`text-xs px-3 py-1.5 rounded-xl font-medium transition-all ${
                    isSelected
                      ? 'bg-orange-500 text-white shadow-md shadow-orange-500/20'
                      : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                  }`}
                >
                  {isSelected ? t.zonesView.selectedBtn : t.zonesView.selectThisBtn}
                </button>
              </div>

              {/* Nameservers and Plan info */}
              <div className="space-y-2 py-3 border-y border-gray-800/80 text-xs">
                <div className="flex items-center justify-between text-gray-400">
                  <span>{t.zonesView.planLabel}</span>
                  <span className="text-white font-medium capitalize">{zone.plan?.name || t.common.freePlan}</span>
                </div>
                <div className="flex items-center justify-between text-gray-400">
                  <span>{t.zonesView.accountLabel}</span>
                  <span className="text-gray-300 truncate max-w-[200px]">{zone.account?.name || 'N/A'}</span>
                </div>
                <div>
                  <span className="text-gray-400 block mb-1">{t.zonesView.nameserversLabel}</span>
                  <div className="flex flex-wrap gap-1.5">
                    {zone.name_servers?.map((ns, idx) => (
                      <span key={idx} className="font-mono text-[11px] px-2 py-0.5 rounded-md bg-gray-950 border border-gray-800 text-gray-300">
                        {ns}
                      </span>
                    )) || <span className="text-gray-500">{t.zonesView.notConfigured}</span>}
                  </div>
                </div>
              </div>

              {/* Quick Actions Footer for this zone */}
              <div className="flex items-center justify-between gap-2 pt-3">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleRequestToggleDevMode(zone)}
                    disabled={actionLoading}
                    className={`text-xs px-2.5 py-1.5 rounded-lg border font-medium transition-colors flex items-center gap-1.5 ${
                      isDevMode
                        ? 'bg-amber-500/20 text-amber-300 border-amber-500/40 hover:bg-amber-500/30'
                        : 'bg-gray-800/60 text-gray-400 border-gray-700 hover:text-gray-200'
                    }`}
                    title="Development Mode"
                  >
                    <Terminal className="w-3 h-3" />
                    <span>{t.zonesView.devModeLabel} {isDevMode ? t.zonesView.devModeOn : t.zonesView.devModeOff}</span>
                  </button>

                  <button
                    onClick={() => handleOpenGranularPurge(zone)}
                    className="text-xs px-2.5 py-1.5 rounded-lg bg-orange-500/10 hover:bg-orange-500/20 text-orange-400 border border-orange-500/30 font-semibold transition-all flex items-center gap-1.5"
                    title={t.quickActions.title}
                  >
                    <Zap className="w-3 h-3 fill-current" />
                    <span>{t.zonesView.purgeCacheBtn}</span>
                  </button>
                </div>

                <a
                  href={`https://dash.cloudflare.com/${zone.account?.id}/${zone.name}`}
                  target="_blank"
                  rel="noreferrer"
                  className="text-gray-500 hover:text-orange-400 transition-colors p-1"
                  title={t.zonesView.openInCfDashboard}
                >
                  <ExternalLink className="w-4 h-4" />
                </a>
              </div>
            </div>
          );
        })}
      </div>

      {/* Granular Purge Center Modal */}
      <QuickActionsModal isOpen={isPurgeModalOpen} onClose={() => setIsPurgeModalOpen(false)} />

      {/* Development Mode Confirmation Modal */}
      {devModeModalZone && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-md p-4 animate-in fade-in duration-150">
          <div className="w-full max-w-md rounded-2xl bg-gray-900 border border-gray-800 p-6 shadow-2xl relative space-y-4">
            
            <div className="flex items-center gap-3">
              <div className={`p-3 rounded-2xl border ${
                devModeModalZone.development_mode > 0
                  ? 'bg-gray-800 text-gray-400 border-gray-700'
                  : 'bg-amber-500/10 text-amber-400 border-amber-500/20'
              }`}>
                <Terminal className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">
                  {devModeModalZone.development_mode > 0
                    ? t.zonesView.devModeModal.disableTitle
                    : t.zonesView.devModeModal.enableTitle}
                </h3>
                <span className="text-xs font-mono text-orange-400 font-bold">
                  {devModeModalZone.name}
                </span>
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-gray-950 border border-gray-850 text-xs text-gray-300 space-y-2 leading-relaxed">
              <p>
                {devModeModalZone.development_mode > 0
                  ? formatText(t.zonesView.devModeModal.disableDesc, { name: devModeModalZone.name })
                  : formatText(t.zonesView.devModeModal.enableDesc, { name: devModeModalZone.name })}
              </p>

              {devModeModalZone.development_mode === 0 && (
                <div className="pt-2 border-t border-gray-800/80 text-amber-300/90 text-[11px] flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-amber-400" />
                  <div>
                    <span className="font-bold text-amber-400 block mb-0.5">
                      {t.zonesView.devModeModal.warningTitle}
                    </span>
                    {t.zonesView.devModeModal.warningDesc}
                  </div>
                </div>
              )}
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setDevModeModalZone(null)}
                disabled={actionLoading}
                className="px-4 py-2 rounded-xl bg-gray-800 hover:bg-gray-750 text-gray-300 text-xs font-semibold transition-colors"
              >
                {t.common.cancel}
              </button>

              <button
                type="button"
                onClick={handleConfirmToggleDevMode}
                disabled={actionLoading}
                className={`px-4 py-2 rounded-xl text-white text-xs font-semibold shadow-lg transition-all flex items-center gap-1.5 ${
                  devModeModalZone.development_mode > 0
                    ? 'bg-gray-700 hover:bg-gray-600'
                    : 'bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 shadow-amber-500/20'
                }`}
              >
                {actionLoading && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                <span>
                  {devModeModalZone.development_mode > 0
                    ? t.zonesView.devModeModal.btnConfirmDisable
                    : t.zonesView.devModeModal.btnConfirmEnable}
                </span>
              </button>
            </div>

            <button
              type="button"
              onClick={() => setDevModeModalZone(null)}
              className="absolute top-4 right-4 text-gray-400 hover:text-white text-sm p-1"
            >
              ✕
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

