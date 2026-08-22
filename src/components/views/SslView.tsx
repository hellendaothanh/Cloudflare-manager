'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useLanguage } from '@/context/LanguageContext';
import { 
  Lock, 
  ShieldCheck, 
  CheckCircle2, 
  AlertCircle, 
  RefreshCw, 
  Shield, 
  ExternalLink, 
  AlertTriangle, 
  Zap, 
  Globe,
  Calendar,
  Send,
  Bell,
  Clock,
  Check,
  Server,
  Activity
} from 'lucide-react';
import { formatDate } from '@/lib/utils';
import { ActionConfirmModal } from '@/components/common/ActionConfirmModal';
import { OriginSslCertInfo, OriginScannerConfig } from '@/app/api/ssl/origin-scanner/route';

export const SslView: React.FC = () => {
  const { selectedZone, authFetch, hasPermission, role } = useAuth();
  const { t, formatText } = useLanguage();
  const canEditSsl = hasPermission('canEditSsl');
  
  // Subtab switcher
  const [activeTab, setActiveTab] = useState<'edgeSsl' | 'originLifecycle'>('edgeSsl');

  // Edge SSL Data State
  const [sslData, setSslData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [savingSetting, setSavingSetting] = useState<string | null>(null);
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Origin Scanner Data State
  const [originCerts, setOriginCerts] = useState<OriginSslCertInfo[]>([]);
  const [scannerConfig, setScannerConfig] = useState<OriginScannerConfig | null>(null);
  const [scanningOrigins, setScanningOrigins] = useState(false);
  const [dispatchingAlert, setDispatchingAlert] = useState(false);

  // Safety Confirmation Modal state
  const [targetSslMode, setTargetSslMode] = useState<'off' | 'flexible' | 'full' | 'strict' | null>(null);
  const [isSslModalOpen, setIsSslModalOpen] = useState(false);

  const [isAlwaysHttpsModalOpen, setIsAlwaysHttpsModalOpen] = useState(false);
  const [isAutoHttpsModalOpen, setIsAutoHttpsModalOpen] = useState(false);

  const fetchSslData = async () => {
    if (!selectedZone) return;
    setLoading(true);
    try {
      const data = await authFetch(`/api/ssl?zoneId=${selectedZone.id}`);
      setSslData(data);
    } catch (err: any) {
      setNotification({ type: 'error', text: err.message || t.common.error });
    } finally {
      setLoading(false);
    }
  };

  const fetchOriginScannerData = async () => {
    if (!selectedZone) return;
    try {
      const res = await fetch(`/api/ssl/origin-scanner?zoneId=${selectedZone.id}&zoneName=${selectedZone.name}`);
      const data = await res.json();
      if (data.success) {
        setOriginCerts(data.data.certs || []);
        setScannerConfig(data.data.config || null);
      }
    } catch (err: any) {
      console.error('Failed to load origin scanner data:', err);
    }
  };

  useEffect(() => {
    fetchSslData();
    fetchOriginScannerData();
  }, [selectedZone]);

  const handleScanAllOrigins = async () => {
    if (!selectedZone) return;
    setScanningOrigins(true);
    try {
      const res = await fetch('/api/ssl/origin-scanner', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'scan_all_origins',
          zoneId: selectedZone.id,
          zoneName: selectedZone.name,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setOriginCerts(data.data.certs);
        setNotification({ type: 'success', text: data.message });
      }
    } catch (err: any) {
      setNotification({ type: 'error', text: err.message || 'Scan failed' });
    } finally {
      setScanningOrigins(false);
    }
  };

  const handleDispatchAlert = async () => {
    if (!selectedZone) return;
    setDispatchingAlert(true);
    try {
      const res = await fetch('/api/ssl/origin-scanner', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'dispatch_alert',
          zoneId: selectedZone.id,
          zoneName: selectedZone.name,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setScannerConfig(data.data.config);
        setNotification({ type: 'success', text: data.message });
      }
    } catch (err: any) {
      setNotification({ type: 'error', text: err.message || 'Alert dispatch failed' });
    } finally {
      setDispatchingAlert(false);
    }
  };

  const handleSaveScannerConfig = async (newConfig: Partial<OriginScannerConfig>) => {
    if (!selectedZone || !scannerConfig) return;
    try {
      const res = await fetch('/api/ssl/origin-scanner', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'update_config',
          zoneId: selectedZone.id,
          zoneName: selectedZone.name,
          config: newConfig,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setScannerConfig(data.data.config);
        setNotification({ type: 'success', text: data.message });
      }
    } catch (err: any) {
      setNotification({ type: 'error', text: err.message || 'Save config failed' });
    }
  };

  const confirmUpdateSslMode = async () => {
    if (!targetSslMode || !selectedZone) return;
    const mode = targetSslMode;
    setSavingSetting('ssl');
    try {
      await authFetch('/api/ssl', {
        method: 'PATCH',
        body: JSON.stringify({
          zoneId: selectedZone.id,
          setting: 'ssl',
          value: mode,
        }),
      });
      setSslData((prev: any) => ({ ...prev, ssl_mode: mode }));
      setNotification({
        type: 'success',
        text: formatText(t.sslView.messages.modeUpdated, { mode: mode.toUpperCase() }),
      });
    } catch (err: any) {
      setNotification({ type: 'error', text: err.message || t.common.error });
    } finally {
      setSavingSetting(null);
      setTargetSslMode(null);
    }
  };

  const handleUpdateMinTls = async (version: string) => {
    setSavingSetting('min_tls_version');
    try {
      await authFetch('/api/ssl', {
        method: 'PATCH',
        body: JSON.stringify({
          zoneId: selectedZone?.id,
          setting: 'min_tls_version',
          value: version,
        }),
      });
      setSslData((prev: any) => ({ ...prev, min_tls_version: version }));
      setNotification({
        type: 'success',
        text: formatText(t.sslView.messages.minTlsUpdated, { version }),
      });
    } catch (err: any) {
      setNotification({ type: 'error', text: err.message || t.common.error });
    } finally {
      setSavingSetting(null);
    }
  };

  const confirmToggleAlwaysHttps = async () => {
    const newValue = !sslData?.always_use_https;
    setSavingSetting('always_use_https');
    try {
      await authFetch('/api/ssl', {
        method: 'PATCH',
        body: JSON.stringify({
          zoneId: selectedZone?.id,
          setting: 'always_use_https',
          value: newValue ? 'on' : 'off',
        }),
      });
      setSslData((prev: any) => ({ ...prev, always_use_https: newValue }));
      setNotification({
        type: 'success',
        text: formatText(t.sslView.messages.alwaysHttpsUpdated, {
          status: newValue ? t.common.enabled.toLowerCase() : t.common.disabled.toLowerCase(),
        }),
      });
    } catch (err: any) {
      setNotification({ type: 'error', text: err.message || t.common.error });
    } finally {
      setSavingSetting(null);
      setIsAlwaysHttpsModalOpen(false);
    }
  };

  const confirmToggleAutoHttps = async () => {
    const newValue = !sslData?.automatic_https_rewrites;
    setSavingSetting('automatic_https_rewrites');
    try {
      await authFetch('/api/ssl', {
        method: 'PATCH',
        body: JSON.stringify({
          zoneId: selectedZone?.id,
          setting: 'automatic_https_rewrites',
          value: newValue ? 'on' : 'off',
        }),
      });
      setSslData((prev: any) => ({ ...prev, automatic_https_rewrites: newValue }));
      setNotification({
        type: 'success',
        text: `Automatic HTTPS Rewrites ${newValue ? t.common.enabled.toLowerCase() : t.common.disabled.toLowerCase()}!`,
      });
    } catch (err: any) {
      setNotification({ type: 'error', text: err.message || t.common.error });
    } finally {
      setSavingSetting(null);
      setIsAutoHttpsModalOpen(false);
    }
  };

  const sslModes = [
    {
      id: 'off',
      title: 'Off',
      badge: t.sslView.modes.off.title,
      badgeColor: 'text-rose-400 bg-rose-500/10 border-rose-500/30',
      desc: t.sslView.modes.off.desc,
    },
    {
      id: 'flexible',
      title: 'Flexible',
      badge: 'Flexible',
      badgeColor: 'text-amber-400 bg-amber-500/10 border-amber-500/30',
      desc: t.sslView.modes.flexible.desc,
    },
    {
      id: 'full',
      title: 'Full',
      badge: 'Full',
      badgeColor: 'text-blue-400 bg-blue-500/10 border-blue-500/30',
      desc: t.sslView.modes.full.desc,
    },
    {
      id: 'strict',
      title: 'Full (Strict)',
      badge: t.sslView.modes.strict.title,
      badgeColor: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30',
      desc: t.sslView.modes.strict.desc,
      recommended: true,
    },
  ];

  return (
    <div className="space-y-6">
      {/* Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 rounded-2xl bg-gradient-to-r from-gray-900 via-gray-900/90 to-gray-950 border border-gray-800">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <Lock className="w-5 h-5" />
            </span>
            <h1 className="text-xl font-bold text-white tracking-tight">{t.sslView.title}</h1>
          </div>
          <p className="text-xs text-gray-400">
            {t.sslView.subtitle}
          </p>
        </div>

        <button
          onClick={fetchSslData}
          disabled={loading}
          className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-gray-800 hover:bg-gray-750 border border-gray-700 text-gray-300 text-xs font-medium transition-all self-start md:self-center"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>{t.common.refresh}</span>
        </button>
      </div>

      {notification && (
        <div className={`p-4 rounded-xl text-xs flex items-center gap-2.5 ${
          notification.type === 'success' ? 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-400' : 'bg-rose-500/10 border border-rose-500/30 text-rose-400'
        }`}>
          {notification.type === 'success' ? <CheckCircle2 className="w-4 h-4 shrink-0" /> : <AlertCircle className="w-4 h-4 shrink-0" />}
          <div>{notification.text}</div>
        </div>
      )}

      {sslData?.permission_warning && (
        <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-start gap-2.5">
            <AlertTriangle className="w-4 h-4 shrink-0 text-amber-400 mt-0.5" />
            <div>
              <span className="font-bold block text-amber-200">{t.sslView.permissionWarning.title}</span>
              <span className="text-[11px] text-amber-300/80">{t.sslView.permissionWarning.desc}</span>
            </div>
          </div>
          <a
            href="https://dash.cloudflare.com/profile/api-tokens"
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-200 text-xs font-semibold shrink-0 transition-colors border border-amber-500/40 self-start sm:self-auto"
          >
            <span>{t.sslView.permissionWarning.fixLink}</span>
            <ExternalLink className="w-3 h-3" />
          </a>
        </div>
      )}

      {/* Sub-tabs Navigation */}
      <div className="flex items-center gap-2 border-b border-gray-800 pb-2">
        <button
          onClick={() => setActiveTab('edgeSsl')}
          className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all flex items-center gap-2 ${
            activeTab === 'edgeSsl'
              ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 font-bold'
              : 'text-gray-400 hover:text-gray-200 hover:bg-gray-900'
          }`}
        >
          <Lock className="w-4 h-4" />
          <span>{t.sslView.tabs.edgeSsl}</span>
        </button>

        <button
          onClick={() => setActiveTab('originLifecycle')}
          className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all flex items-center gap-2 ${
            activeTab === 'originLifecycle'
              ? 'bg-amber-500/15 text-amber-400 border border-amber-500/30 font-bold'
              : 'text-gray-400 hover:text-gray-200 hover:bg-gray-900'
          }`}
        >
          <Calendar className="w-4 h-4" />
          <span>{t.sslView.tabs.originLifecycle}</span>
          <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-amber-500/20 text-amber-300 font-bold">
            ERROR 526 SHIELD
          </span>
        </button>
      </div>

      {/* ========================================================================= */}
      {/* TAB 1: EDGE SSL CONFIGURATION                                             */}
      {/* ========================================================================= */}
      {activeTab === 'edgeSsl' && (
        <div className="space-y-6">
          {/* SSL Modes Selector Cards */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-bold text-white flex items-center gap-2">
                <Shield className="w-4 h-4 text-emerald-400" />
                <span>{t.sslView.modesTitle}</span>
              </h2>
              <span className="text-xs text-gray-400">
                {t.sslView.currentMode}: <span className="font-bold text-white uppercase font-mono">{sslData?.ssl_mode || '...'}</span>
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
              {sslModes.map((mode) => {
                const isCurrent = sslData?.ssl_mode === mode.id;

                return (
                  <button
                    key={mode.id}
                    onClick={() => {
                      if (!canEditSsl || sslData?.ssl_mode === mode.id) return;
                      setTargetSslMode(mode.id as any);
                      setIsSslModalOpen(true);
                    }}
                    disabled={savingSetting === 'ssl' || !canEditSsl}
                    className={`p-4 rounded-2xl text-left border transition-all flex flex-col justify-between relative cursor-pointer ${
                      !canEditSsl
                        ? 'opacity-60 cursor-not-allowed bg-gray-950 border-gray-850'
                        : isCurrent
                          ? 'bg-gray-900 border-emerald-500/50 shadow-xl shadow-emerald-500/5 ring-1 ring-emerald-500/30'
                          : 'bg-gray-900/60 border-gray-800 hover:border-gray-700 hover:bg-gray-900'
                    }`}
                    title={!canEditSsl ? formatText(t.rbac.permissionDeniedTooltip, { role: t.rbac.roles[role]?.name || role }) : ''}
                  >
                    {isCurrent && (
                      <div className="absolute top-3 right-3 p-1 rounded-full bg-emerald-500 text-white shadow-sm">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                      </div>
                    )}

                    <div>
                      <div className="flex items-center gap-2 mb-1.5">
                        <span className="text-base font-bold text-white">{mode.title}</span>
                      </div>
                      <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border inline-block mb-2.5 ${mode.badgeColor}`}>
                        {mode.badge}
                      </span>
                      <p className="text-xs text-gray-400 leading-relaxed">{mode.desc}</p>
                    </div>

                    <div className="pt-4 mt-2 border-t border-gray-800/80">
                      <span className={`text-[11px] font-semibold ${isCurrent ? 'text-emerald-400' : 'text-gray-500'}`}>
                        {isCurrent ? `✓ ${t.common.active}` : t.common.actions}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Advanced TLS Configurations */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {/* Minimum TLS Version */}
            <div className="p-5 rounded-2xl bg-gray-900/70 border border-gray-800 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-white">{t.sslView.minTlsTitle}</span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-gray-800 text-cyan-400">
                  {sslData?.min_tls_version || '1.2'}
                </span>
              </div>
              <p className="text-[11px] text-gray-400">
                {t.sslView.minTlsDesc}
              </p>

              <div className="grid grid-cols-2 gap-2 pt-1">
                {['1.0', '1.1', '1.2', '1.3'].map((v) => (
                  <button
                    key={v}
                    onClick={() => canEditSsl && handleUpdateMinTls(v)}
                    disabled={savingSetting === 'min_tls_version' || !canEditSsl}
                    className={`py-2 px-3 rounded-xl text-xs font-mono font-semibold border transition-all ${
                      !canEditSsl
                        ? 'opacity-50 cursor-not-allowed bg-gray-950 text-gray-600 border-gray-850'
                        : sslData?.min_tls_version === v
                          ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40'
                          : 'bg-gray-950 text-gray-400 border-gray-850 hover:text-white'
                    }`}
                    title={!canEditSsl ? formatText(t.rbac.permissionDeniedTooltip, { role: t.rbac.roles[role]?.name || role }) : ''}
                  >
                    TLS {v}
                  </button>
                ))}
              </div>
            </div>

            {/* Always Use HTTPS & Auto Rewrites */}
            <div className="p-5 rounded-2xl bg-gray-900/70 border border-gray-800 flex flex-col justify-between space-y-4">
              <div className="space-y-4">
                {/* Always Use HTTPS Row */}
                <div className="p-3.5 rounded-xl bg-gray-950/80 border border-gray-800/80 flex items-center justify-between gap-3 hover:border-gray-700/80 transition-all">
                  <div className="flex-1 pr-2">
                    <div className="flex items-center gap-2 mb-1">
                      <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                      <span className="text-xs font-bold text-white leading-none">{t.sslView.alwaysHttpsTitle}</span>
                    </div>
                    <span className="text-[11px] text-gray-400 block leading-relaxed">{t.sslView.alwaysHttpsDesc}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => canEditSsl && setIsAlwaysHttpsModalOpen(true)}
                    disabled={savingSetting === 'always_use_https' || !canEditSsl}
                    className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                      !canEditSsl
                        ? 'opacity-50 cursor-not-allowed bg-gray-850'
                        : sslData?.always_use_https
                        ? 'bg-emerald-500 shadow-lg shadow-emerald-500/20'
                        : 'bg-gray-800'
                    }`}
                    title={!canEditSsl ? formatText(t.rbac.permissionDeniedTooltip, { role: t.rbac.roles[role]?.name || role }) : ''}
                  >
                    <span
                      aria-hidden="true"
                      className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
                        sslData?.always_use_https ? 'translate-x-5' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>

                {/* Automatic HTTPS Rewrites Row */}
                <div className="p-3.5 rounded-xl bg-gray-950/80 border border-gray-800/80 flex items-center justify-between gap-3 hover:border-gray-700/80 transition-all">
                  <div className="flex-1 pr-2">
                    <div className="flex items-center gap-2 mb-1">
                      <RefreshCw className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                      <span className="text-xs font-bold text-white leading-none">{t.sslView.autoHttpsTitle}</span>
                    </div>
                    <span className="text-[11px] text-gray-400 block leading-relaxed">{t.sslView.autoHttpsDesc}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => canEditSsl && setIsAutoHttpsModalOpen(true)}
                    disabled={savingSetting === 'automatic_https_rewrites' || !canEditSsl}
                    className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                      !canEditSsl
                        ? 'opacity-50 cursor-not-allowed bg-gray-850'
                        : sslData?.automatic_https_rewrites
                        ? 'bg-emerald-500 shadow-lg shadow-emerald-500/20'
                        : 'bg-gray-800'
                    }`}
                    title={!canEditSsl ? formatText(t.rbac.permissionDeniedTooltip, { role: t.rbac.roles[role]?.name || role }) : ''}
                  >
                    <span
                      aria-hidden="true"
                      className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
                        sslData?.automatic_https_rewrites ? 'translate-x-5' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>
              </div>
            </div>

            {/* HSTS Status Card */}
            <div className="p-5 rounded-2xl bg-gray-900/70 border border-gray-800 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-white">{t.sslView.hstsTitle}</span>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                  sslData?.hsts?.enabled
                    ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                    : 'bg-amber-500/15 text-amber-400 border border-amber-500/30'
                }`}>
                  {sslData?.hsts?.enabled ? t.common.enabled.toUpperCase() : t.common.disabled.toUpperCase()}
                </span>
              </div>
              <p className="text-[11px] text-gray-400">
                {t.sslView.hstsDesc}
              </p>

              <div className="p-3 rounded-xl bg-gray-950 border border-gray-850 space-y-1.5 text-[11px] text-gray-300 font-mono">
                <div className="flex justify-between">
                  <span className="text-gray-500">Max-Age:</span>
                  <span>{sslData?.hsts?.max_age ? `${sslData.hsts.max_age / 86400}d` : t.common.off}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Subdomains:</span>
                  <span>{sslData?.hsts?.include_subdomains ? 'Yes' : 'No'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">HSTS Preload:</span>
                  <span>{sslData?.hsts?.preload ? 'Preload' : 'No'}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Edge Certificates Table */}
          <div className="rounded-2xl border border-gray-800 bg-gray-900/60 overflow-hidden shadow-xl">
            <div className="px-5 py-4 bg-gray-950/80 border-b border-gray-800 flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs font-bold text-white">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <span>{t.sslView.edgeCertTitle}</span>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-gray-950/40 border-b border-gray-800 text-gray-400 uppercase font-semibold text-[10px] tracking-wider">
                  <tr>
                    <th className="py-3 px-4">Hosts</th>
                    <th className="py-3 px-4">{t.dnsView.table.type}</th>
                    <th className="py-3 px-4">Issuer</th>
                    <th className="py-3 px-4">{t.common.status}</th>
                    <th className="py-3 px-4">Expires</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-800/60 font-mono">
                  {sslData?.certificates?.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-6 text-center text-gray-500 font-sans">
                        {t.sslView.edgeCertStatus}
                      </td>
                    </tr>
                  ) : (
                    sslData?.certificates?.map((cert: any, idx: number) => (
                      <tr key={cert.id || idx} className="hover:bg-gray-850/50">
                        <td className="py-3 px-4 text-gray-200 font-bold">
                          {cert.hosts?.join(', ') || selectedZone?.name}
                        </td>
                        <td className="py-3 px-4 text-gray-400 uppercase">{cert.type || 'Universal SSL'}</td>
                        <td className="py-3 px-4 text-gray-300 font-sans">{cert.issuer || "Let's Encrypt / Google Trust Services"}</td>
                        <td className="py-3 px-4">
                          <span className="px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 text-[10px] font-bold uppercase">
                            {cert.status || 'Active'}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-gray-400">
                          {formatDate(cert.expires_on)}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: ORIGIN SSL LIFECYCLE & EXPIRY SCANNER                              */}
      {/* ========================================================================= */}
      {activeTab === 'originLifecycle' && (
        <div className="space-y-6">
          {/* Header & Probing Action Bar */}
          <div className="p-6 rounded-2xl bg-gray-900/70 border border-gray-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h2 className="text-sm font-bold text-white flex items-center gap-2 mb-1">
                <Calendar className="w-4 h-4 text-amber-400" />
                <span>{t.sslView.originScanner.title}</span>
              </h2>
              <p className="text-xs text-gray-400">
                {t.sslView.originScanner.subtitle}
              </p>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={handleDispatchAlert}
                disabled={dispatchingAlert}
                className="px-3.5 py-2 rounded-xl bg-gray-800 hover:bg-gray-750 border border-gray-700 text-gray-300 text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <Send className={`w-3.5 h-3.5 ${dispatchingAlert ? 'animate-spin' : ''}`} />
                <span>{t.sslView.originScanner.btnDispatchAlert}</span>
              </button>

              <button
                type="button"
                onClick={handleScanAllOrigins}
                disabled={scanningOrigins}
                className="px-4 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white text-xs font-bold transition-all shadow-md shadow-amber-500/20 flex items-center gap-2 cursor-pointer"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${scanningOrigins ? 'animate-spin' : ''}`} />
                <span>{scanningOrigins ? t.sslView.originScanner.btnScanning : t.sslView.originScanner.btnScanNow}</span>
              </button>
            </div>
          </div>

          {/* 4 KPI Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-5 rounded-2xl bg-gray-900/70 border border-gray-800 space-y-1">
              <span className="text-xs text-gray-400">{t.sslView.originScanner.kpiTotal}</span>
              <div className="text-2xl font-extrabold text-white font-mono">{originCerts.length} Nodes</div>
            </div>

            <div className="p-5 rounded-2xl bg-gray-900/70 border border-gray-800 space-y-1">
              <span className="text-xs text-emerald-400 font-medium">{t.sslView.originScanner.kpiSafe}</span>
              <div className="text-2xl font-extrabold text-emerald-400 font-mono">
                {originCerts.filter(c => c.status === 'safe').length}
              </div>
            </div>

            <div className="p-5 rounded-2xl bg-gray-900/70 border border-gray-800 space-y-1">
              <span className="text-xs text-amber-400 font-medium">{t.sslView.originScanner.kpiWarning}</span>
              <div className="text-2xl font-extrabold text-amber-400 font-mono">
                {originCerts.filter(c => c.status === 'warning').length}
              </div>
            </div>

            <div className="p-5 rounded-2xl bg-gray-900/70 border border-gray-800 space-y-1">
              <span className="text-xs text-rose-400 font-medium">{t.sslView.originScanner.kpiCritical}</span>
              <div className="text-2xl font-extrabold text-rose-400 font-mono">
                {originCerts.filter(c => c.status === 'critical' || c.status === 'expired').length}
              </div>
            </div>
          </div>

          {/* Origin SSL Certs Table */}
          <div className="rounded-2xl border border-gray-800 bg-gray-900/60 overflow-hidden shadow-xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-gray-950/80 border-b border-gray-800 text-gray-400 uppercase font-semibold text-[10px]">
                  <tr>
                    <th className="py-3.5 px-4">{t.sslView.originScanner.tableServer}</th>
                    <th className="py-3.5 px-4">{t.sslView.originScanner.tableCommonName}</th>
                    <th className="py-3.5 px-4">{t.sslView.originScanner.tableIssuer}</th>
                    <th className="py-3.5 px-4">{t.sslView.originScanner.tableExpires}</th>
                    <th className="py-3.5 px-4">{t.sslView.originScanner.tableDaysLeft}</th>
                    <th className="py-3.5 px-4">{t.sslView.originScanner.tableStatus}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-850">
                  {originCerts.map((cert) => (
                    <tr key={cert.id} className="hover:bg-gray-850/50 transition-colors">
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-white flex items-center gap-1.5">
                          <Server className="w-3.5 h-3.5 text-gray-400" />
                          <span>{cert.serverName}</span>
                        </div>
                        <span className="text-[11px] font-mono text-cyan-400">{cert.ipAddress}:{cert.port}</span>
                      </td>

                      <td className="py-3.5 px-4 font-mono text-gray-200">
                        <div className="font-bold text-white">{cert.commonName}</div>
                        <span className="text-[10px] text-gray-400 truncate block max-w-xs">{cert.sanList.join(', ')}</span>
                      </td>

                      <td className="py-3.5 px-4 text-gray-300">
                        {cert.isCloudflareOriginCa ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-300 font-bold text-[10px] border border-emerald-500/30">
                            <ShieldCheck className="w-3 h-3" />
                            {t.sslView.originScanner.originCaBadge}
                          </span>
                        ) : (
                          <span>{cert.issuer}</span>
                        )}
                      </td>

                      <td className="py-3.5 px-4 font-mono text-gray-300">
                        {formatDate(cert.expiresOn)}
                      </td>

                      <td className="py-3.5 px-4 font-mono">
                        <span className={`font-extrabold text-sm ${
                          cert.daysRemaining > 30 ? 'text-emerald-400' : cert.daysRemaining > 7 ? 'text-amber-400' : 'text-rose-400'
                        }`}>
                          {cert.daysRemaining} days
                        </span>
                      </td>

                      <td className="py-3.5 px-4">
                        <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold font-mono uppercase border ${
                          cert.status === 'safe'
                            ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
                            : cert.status === 'warning'
                            ? 'bg-amber-500/15 text-amber-400 border-amber-500/30'
                            : 'bg-rose-500/20 text-rose-300 border-rose-500/40 animate-pulse'
                        }`}>
                          {cert.status === 'safe'
                            ? t.sslView.originScanner.statusSafe
                            : cert.status === 'warning'
                            ? t.sslView.originScanner.statusWarning
                            : t.sslView.originScanner.statusCritical}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* CRON Schedule & Multi-Channel Alert Dispatcher Config */}
          {scannerConfig && (
            <div className="p-6 rounded-2xl bg-gray-900/70 border border-gray-800 space-y-4">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Bell className="w-4 h-4 text-cyan-400" />
                <span>{t.sslView.originScanner.configTitle}</span>
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                <div>
                  <label className="block text-gray-400 mb-1 font-semibold">{t.sslView.originScanner.autoScanIntervalLabel}</label>
                  <select
                    value={scannerConfig.autoScanInterval}
                    onChange={(e) => handleSaveScannerConfig({ autoScanInterval: e.target.value as any })}
                    className="w-full bg-gray-950 border border-gray-800 rounded-xl px-3 py-2 text-white font-mono focus:outline-none"
                  >
                    <option value="daily">{t.sslView.originScanner.intervalDaily}</option>
                    <option value="every_6h">{t.sslView.originScanner.interval6h}</option>
                    <option value="every_12h">{t.sslView.originScanner.interval12h}</option>
                    <option value="disabled">{t.sslView.originScanner.intervalDisabled}</option>
                  </select>
                </div>

                <div>
                  <label className="block text-gray-400 mb-1 font-semibold">{t.sslView.originScanner.telegramBotLabel}</label>
                  <input
                    type="text"
                    defaultValue={scannerConfig.telegramBotToken || ''}
                    onBlur={(e) => handleSaveScannerConfig({ telegramBotToken: e.target.value })}
                    className="w-full bg-gray-950 border border-gray-800 rounded-xl px-3 py-2 text-gray-300 font-mono focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-gray-400 mb-1 font-semibold">{t.sslView.originScanner.slackWebhookLabel}</label>
                  <input
                    type="text"
                    defaultValue={scannerConfig.slackWebhookUrl || ''}
                    onBlur={(e) => handleSaveScannerConfig({ slackWebhookUrl: e.target.value })}
                    className="w-full bg-gray-950 border border-gray-800 rounded-xl px-3 py-2 text-gray-300 font-mono focus:outline-none"
                  />
                </div>
              </div>

              {/* Cloudflare Origin CA 15-Year Guide Helper */}
              <div className="p-4 rounded-xl bg-emerald-950/20 border border-emerald-500/20 text-xs space-y-1">
                <span className="font-bold text-emerald-300 flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  {t.sslView.originScanner.originCaGuideTitle}
                </span>
                <p className="text-emerald-200/80 text-[11px] leading-relaxed">
                  {t.sslView.originScanner.originCaGuideDesc}
                </p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Safety Confirmation Modal: Change SSL Encryption Mode */}
      {targetSslMode && (
        <ActionConfirmModal
          isOpen={isSslModalOpen}
          onClose={() => {
            setIsSslModalOpen(false);
            setTargetSslMode(null);
          }}
          onConfirm={confirmUpdateSslMode}
          title={t.sslView.sslModeModal.title}
          description={formatText(t.sslView.sslModeModal.desc, {
            mode: targetSslMode.toUpperCase(),
          })}
          variant={targetSslMode === 'off' || targetSslMode === 'strict' ? 'warning' : 'info'}
          confirmText={t.sslView.sslModeModal.btnConfirm}
          affectedResource={{
            label: 'SSL/TLS Encryption Mode Transition',
            value: `${(sslData?.ssl_mode || 'Flexible').toUpperCase()} ➔ ${targetSslMode.toUpperCase()}`,
            badge: selectedZone?.name,
          }}
          warningNote={t.sslView.sslModeModal.warningNote}
        />
      )}

      {/* Safety Confirmation Modal: Always Use HTTPS */}
      <ActionConfirmModal
        isOpen={isAlwaysHttpsModalOpen}
        onClose={() => setIsAlwaysHttpsModalOpen(false)}
        onConfirm={confirmToggleAlwaysHttps}
        title={t.sslView.alwaysHttpsModal.title}
        description={formatText(
          !sslData?.always_use_https
            ? t.sslView.alwaysHttpsModal.enableDesc
            : t.sslView.alwaysHttpsModal.disableDesc,
          { name: selectedZone?.name || '' }
        )}
        variant={!sslData?.always_use_https ? 'info' : 'warning'}
        confirmText={t.sslView.alwaysHttpsModal.btnConfirm}
        affectedResource={{
          label: 'Always Use HTTPS Setting',
          value: !sslData?.always_use_https ? 'OFF ➔ ON (Enforce 301 Redirect)' : 'ON ➔ OFF',
          badge: selectedZone?.name,
        }}
        isLoading={savingSetting === 'always_use_https'}
      />

      {/* Safety Confirmation Modal: Automatic HTTPS Rewrites */}
      <ActionConfirmModal
        isOpen={isAutoHttpsModalOpen}
        onClose={() => setIsAutoHttpsModalOpen(false)}
        onConfirm={confirmToggleAutoHttps}
        title={t.sslView.autoHttpsModal.title}
        description={formatText(
          !sslData?.automatic_https_rewrites
            ? t.sslView.autoHttpsModal.enableDesc
            : t.sslView.autoHttpsModal.disableDesc,
          { name: selectedZone?.name || '' }
        )}
        variant={!sslData?.automatic_https_rewrites ? 'info' : 'warning'}
        confirmText={t.sslView.autoHttpsModal.btnConfirm}
        affectedResource={{
          label: 'Automatic HTTPS Rewrites Setting',
          value: !sslData?.automatic_https_rewrites ? 'OFF ➔ ON (Fix Mixed Content)' : 'ON ➔ OFF',
          badge: selectedZone?.name,
        }}
        isLoading={savingSetting === 'automatic_https_rewrites'}
      />
    </div>
  );
};

