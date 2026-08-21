'use client';

import React, { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useLanguage } from '@/context/LanguageContext';
import { Zone } from '@/types/cloudflare';
import { 
  Globe, 
  RefreshCw,
  ExternalLink,
  Sparkles,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';

export const ZonesView: React.FC = () => {
  const { zones, selectedZone, setSelectedZone, isLoadingZones, refreshZones, authFetch } = useAuth();
  const { t, formatText } = useLanguage();
  const [actionLoading, setActionLoading] = useState(false);
  const [statusMsg, setStatusMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const handleToggleDevMode = async (zone: Zone) => {
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
      setStatusMsg({
        type: 'success',
        text: formatText(t.zonesView.devModeUpdated, {
          status: isCurrentlyDev ? t.common.off.toLowerCase() : t.common.on.toLowerCase(),
          name: zone.name,
        }),
      });
      await refreshZones();
    } catch (err: any) {
      setStatusMsg({ type: 'error', text: err.message || t.common.error });
    } finally {
      setActionLoading(false);
    }
  };

  const handlePurgeEverything = async (zone: Zone) => {
    setActionLoading(true);
    setStatusMsg(null);
    try {
      await authFetch(`/api/zones/${zone.id}`, {
        method: 'POST',
        body: JSON.stringify({ action: 'purge_cache', purge_everything: true }),
      });
      setStatusMsg({
        type: 'success',
        text: formatText(t.zonesView.purgeSent, { name: zone.name }),
      });
    } catch (err: any) {
      setStatusMsg({ type: 'error', text: err.message || t.common.error });
    } finally {
      setActionLoading(false);
    }
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
                    onClick={() => handleToggleDevMode(zone)}
                    disabled={actionLoading}
                    className={`text-xs px-2.5 py-1.5 rounded-lg border font-medium transition-colors flex items-center gap-1.5 ${
                      isDevMode
                        ? 'bg-amber-500/20 text-amber-300 border-amber-500/40 hover:bg-amber-500/30'
                        : 'bg-gray-800/60 text-gray-400 border-gray-700 hover:text-gray-200'
                    }`}
                    title="Development Mode"
                  >
                    <Sparkles className="w-3 h-3" />
                    <span>{t.zonesView.devModeLabel} {isDevMode ? t.zonesView.devModeOn : t.zonesView.devModeOff}</span>
                  </button>

                  <button
                    onClick={() => handlePurgeEverything(zone)}
                    disabled={actionLoading}
                    className="text-xs px-2.5 py-1.5 rounded-lg bg-gray-800/60 hover:bg-gray-800 text-gray-300 border border-gray-700 font-medium transition-colors"
                  >
                    {t.zonesView.purgeCacheBtn}
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
    </div>
  );
};
