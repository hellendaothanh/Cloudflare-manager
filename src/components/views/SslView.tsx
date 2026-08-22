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
  Globe
} from 'lucide-react';
import { formatDate } from '@/lib/utils';
import { ActionConfirmModal } from '@/components/common/ActionConfirmModal';

export const SslView: React.FC = () => {
  const { selectedZone, authFetch, hasPermission, role } = useAuth();
  const { t, formatText } = useLanguage();
  const canEditSsl = hasPermission('canEditSsl');
  const [sslData, setSslData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [savingSetting, setSavingSetting] = useState<string | null>(null);
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

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

  useEffect(() => {
    fetchSslData();
  }, [selectedZone]);

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
