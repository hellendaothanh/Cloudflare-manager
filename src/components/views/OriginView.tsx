'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useLanguage } from '@/context/LanguageContext';
import { OriginPool, OriginShieldConfig, FailoverEvent, OriginNode } from '@/app/api/origin/route';
import { 
  Server, 
  ShieldAlert, 
  ShieldCheck, 
  RefreshCw, 
  Activity, 
  Radio, 
  Zap, 
  ArrowRight, 
  Key, 
  Copy, 
  Check, 
  Flame, 
  FileCode, 
  CheckCircle2, 
  AlertCircle, 
  Sliders, 
  Code2,
  Lock,
  Layers,
  ArrowUpRight
} from 'lucide-react';

export const OriginView: React.FC = () => {
  const { selectedZone, authFetch, hasPermission } = useAuth();
  const { t, formatText } = useLanguage();
  const canModify = hasPermission('canAutoFix');

  const [activeTab, setActiveTab] = useState<'pools' | 'shield'>('pools');
  const [pools, setPools] = useState<OriginPool[]>([]);
  const [shield, setShield] = useState<OriginShieldConfig | null>(null);
  const [events, setEvents] = useState<FailoverEvent[]>([]);
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Snippets tab
  const [snippetServer, setSnippetServer] = useState<'nginx' | 'apache' | 'iis' | 'haproxy'>('nginx');
  const [copiedSnippet, setCopiedSnippet] = useState(false);
  const [copiedSecret, setCopiedSecret] = useState(false);

  const fetchOriginData = async () => {
    if (!selectedZone) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/origin?zoneId=${selectedZone.id}&zoneName=${selectedZone.name}`);
      const data = await res.json();
      setPools(data.pools || []);
      setShield(data.shield || null);
      setEvents(data.events || []);
    } catch (err: any) {
      setNotification({ type: 'error', text: err.message || 'Error fetching origin telemetry' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOriginData();
  }, [selectedZone]);

  const handleRunHealthCheck = async (poolId?: string) => {
    if (!selectedZone) return;
    setActionLoading('probe');
    try {
      const res = await fetch('/api/origin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'run_health_check',
          zoneId: selectedZone.id,
          zoneName: selectedZone.name,
          poolId,
        }),
      });
      const data = await res.json();
      setPools(data.pools || []);
      setNotification({ type: 'success', text: data.message });
    } catch (err: any) {
      setNotification({ type: 'error', text: err.message || 'Health probe failed' });
    } finally {
      setActionLoading(null);
    }
  };

  const handleSimulateFailover = async (poolId: string) => {
    if (!selectedZone) return;
    setActionLoading(`failover-${poolId}`);
    try {
      const res = await fetch('/api/origin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'simulate_failover',
          zoneId: selectedZone.id,
          zoneName: selectedZone.name,
          poolId,
        }),
      });
      const data = await res.json();
      setPools(data.pools || []);
      setEvents(data.events || []);
      setNotification({ type: 'success', text: data.message });
    } catch (err: any) {
      setNotification({ type: 'error', text: err.message || 'Failover trigger failed' });
    } finally {
      setActionLoading(null);
    }
  };

  const handleRestorePrimary = async (poolId: string) => {
    if (!selectedZone) return;
    setActionLoading(`restore-${poolId}`);
    try {
      const res = await fetch('/api/origin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'restore_primary',
          zoneId: selectedZone.id,
          zoneName: selectedZone.name,
          poolId,
        }),
      });
      const data = await res.json();
      setPools(data.pools || []);
      setNotification({ type: 'success', text: data.message });
    } catch (err: any) {
      setNotification({ type: 'error', text: err.message || 'Restore failed' });
    } finally {
      setActionLoading(null);
    }
  };

  const handleRotateShieldSecret = async () => {
    if (!selectedZone) return;
    setActionLoading('rotate-secret');
    try {
      const res = await fetch('/api/origin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'rotate_shield_secret',
          zoneId: selectedZone.id,
          zoneName: selectedZone.name,
        }),
      });
      const data = await res.json();
      setShield(data.shield);
      setNotification({ type: 'success', text: data.message });
    } catch (err: any) {
      setNotification({ type: 'error', text: err.message || 'Secret rotation failed' });
    } finally {
      setActionLoading(null);
    }
  };

  // Generate web server config snippets based on active secret
  const getSnippet = () => {
    const header = shield?.headerName || 'X-Origin-Verify-Secret';
    const secret = shield?.headerSecret || 'cf-shield-sec_placeholder';

    switch (snippetServer) {
      case 'nginx':
        return `# =========================================================================
# Nginx Cloudflare Origin Shield Enforcement
# Drop direct IP scanners with HTTP 403 unless secret header matches
# =========================================================================
server {
    listen 443 ssl http2;
    server_name ${selectedZone?.name || 'example.com'} *.${selectedZone?.name || 'example.com'};

    # Validate Cloudflare Custom Origin Shield Header
    if ($http_${header.toLowerCase().replace(/-/g, '_')} != "${secret}") {
        return 403 "Forbidden: Direct Origin Access Blocked by Cloudflare Shield";
    }

    # Restrict to Cloudflare IPv4 / IPv6 Ranges (Optional Defense-in-Depth)
    # set_real_ip_from 173.245.48.0/20;
    # set_real_ip_from 103.21.244.0/22;
    # real_ip_header CF-Connecting-IP;

    location / {
        proxy_pass http://127.0.0.1:8080;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }
}`;

      case 'apache':
        return `# =========================================================================
# Apache (.htaccess or httpd.conf) Origin Shield Protection
# =========================================================================
<IfModule mod_rewrite.c>
    RewriteEngine On
    
    # Block requests missing valid Cloudflare Secret Header
    RewriteCond %{HTTP:${header}} !^${secret}$ [NC]
    RewriteRule ^ - [F,L]
</IfModule>`;

      case 'iis':
        return `<!-- =========================================================================
     IIS web.config URL Rewrite Rule for Cloudflare Origin Shield
     ========================================================================= -->
<configuration>
  <system.webServer>
    <rewrite>
      <rules>
        <rule name="BlockDirectOriginAccess" stopProcessing="true">
          <match url=".*" />
          <conditions>
            <add input="{HTTP_${header.toUpperCase().replace(/-/g, '_')}}" pattern="^${secret}$" negate="true" />
          </conditions>
          <action type="CustomResponse" statusCode="403" statusReason="Forbidden" statusDescription="Direct IP Access Blocked" />
        </rule>
      </rules>
    </rewrite>
  </system.webServer>
</configuration>`;

      case 'haproxy':
        return `# =========================================================================
# HAProxy (haproxy.cfg) Origin Shield Header Enforcement
# =========================================================================
frontend https-in
    bind *:443 ssl crt /etc/ssl/certs/origin.pem
    mode http
    
    # Deny all direct requests unless valid Secret Header is present
    http-request deny deny_status 403 unless { req.hdr(${header}) -m str "${secret}" }
    
    default_backend backend_cluster`;
    }
  };

  const handleCopySnippet = () => {
    navigator.clipboard.writeText(getSnippet());
    setCopiedSnippet(true);
    setTimeout(() => setCopiedSnippet(false), 2000);
  };

  const handleCopySecret = () => {
    if (shield?.headerSecret) {
      navigator.clipboard.writeText(shield.headerSecret);
      setCopiedSecret(true);
      setTimeout(() => setCopiedSecret(false), 2000);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 rounded-2xl bg-gradient-to-r from-gray-900 via-gray-900/90 to-gray-950 border border-gray-800">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="p-2 rounded-xl bg-orange-500/10 text-orange-400 border border-orange-500/20">
              <Server className="w-5 h-5" />
            </span>
            <h1 className="text-xl font-bold text-white tracking-tight">{t.originView.title}</h1>
          </div>
          <p className="text-xs text-gray-400">
            {t.originView.subtitle}
          </p>
        </div>

        <button
          type="button"
          onClick={fetchOriginData}
          disabled={loading}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gray-900 hover:bg-gray-850 border border-gray-800 text-gray-300 text-xs font-semibold transition-all cursor-pointer self-start md:self-auto"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>{t.common.refresh}</span>
        </button>
      </div>

      {/* Notification */}
      {notification && (
        <div className={`p-4 rounded-xl text-xs flex items-center gap-2.5 ${
          notification.type === 'success' ? 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-300' : 'bg-rose-500/10 border border-rose-500/30 text-rose-400'
        }`}>
          {notification.type === 'success' ? <CheckCircle2 className="w-4 h-4 shrink-0" /> : <AlertCircle className="w-4 h-4 shrink-0" />}
          <span>{notification.text}</span>
        </div>
      )}

      {/* Sub-tabs Navigation */}
      <div className="flex items-center gap-2 border-b border-gray-800 pb-2">
        <button
          onClick={() => setActiveTab('pools')}
          className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all flex items-center gap-2 ${
            activeTab === 'pools'
              ? 'bg-orange-500/15 text-orange-400 border border-orange-500/30 font-bold'
              : 'text-gray-400 hover:text-gray-200 hover:bg-gray-900'
          }`}
        >
          <Server className="w-4 h-4" />
          <span>{t.originView.tabs.pools}</span>
        </button>

        <button
          onClick={() => setActiveTab('shield')}
          className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all flex items-center gap-2 ${
            activeTab === 'shield'
              ? 'bg-cyan-500/15 text-cyan-400 border border-cyan-500/30 font-bold'
              : 'text-gray-400 hover:text-gray-200 hover:bg-gray-900'
          }`}
        >
          <ShieldCheck className="w-4 h-4" />
          <span>{t.originView.tabs.shield}</span>
          <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-cyan-500/20 text-cyan-300 font-bold">
            SECRET
          </span>
        </button>
      </div>

      {/* ========================================================================= */}
      {/* TAB 1: ORIGIN POOLS & FAILOVER MONITOR                                    */}
      {/* ========================================================================= */}
      {activeTab === 'pools' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-sm font-bold text-white">
                {t.originView.poolsSection.title}
              </h2>
              <p className="text-xs text-gray-400">
                {t.originView.poolsSection.subtitle}
              </p>
            </div>

            <button
              type="button"
              onClick={() => handleRunHealthCheck()}
              disabled={actionLoading === 'probe'}
              className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-orange-500 hover:bg-orange-600 text-white text-xs font-bold transition-all shadow-md shadow-orange-500/20 self-start sm:self-auto cursor-pointer"
            >
              <Radio className={`w-3.5 h-3.5 ${actionLoading === 'probe' ? 'animate-spin' : ''}`} />
              <span>{t.originView.poolsSection.runProbesBtn}</span>
            </button>
          </div>

          {/* Pools Listing */}
          <div className="space-y-4">
            {pools.map((pool) => {
              const activeNode = pool.nodes.find((n) => n.id === pool.activeOriginId) || pool.nodes[0];
              const isFailoverActive = activeNode.role !== 'primary';

              return (
                <div
                  key={pool.id}
                  className={`p-5 rounded-2xl border transition-all ${
                    isFailoverActive
                      ? 'bg-amber-950/20 border-amber-500/40'
                      : 'bg-gray-900/70 border-gray-800'
                  }`}
                >
                  {/* Pool Header */}
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-gray-800/80 pb-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-white">{pool.name}</span>
                        <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-gray-950 border border-gray-800 text-cyan-400 font-bold">
                          {pool.hostname}
                        </span>
                        {pool.autoDnsFailover && (
                          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 font-bold flex items-center gap-1">
                            <Zap className="w-3 h-3" />
                            {t.originView.poolsSection.autoFailoverBadge}
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-3 text-xs text-gray-400 font-mono">
                        <span>
                          {t.originView.poolsSection.activeTarget}{' '}
                          <strong className={isFailoverActive ? 'text-amber-300' : 'text-emerald-300'}>
                            {activeNode?.name} ({activeNode?.address})
                          </strong>
                        </span>
                        <span>•</span>
                        <span>Probe: {pool.healthCheck.type} {pool.healthCheck.path} (Every {pool.healthCheck.intervalSeconds}s)</span>
                      </div>
                    </div>

                    {/* Actions on this Pool */}
                    <div className="flex items-center gap-2 shrink-0">
                      {isFailoverActive ? (
                        <button
                          type="button"
                          onClick={() => handleRestorePrimary(pool.id)}
                          disabled={actionLoading !== null}
                          className="px-3 py-1.5 rounded-xl bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/40 text-emerald-300 text-xs font-bold transition-all flex items-center gap-1.5"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>{t.originView.poolsSection.restorePrimaryBtn}</span>
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => handleSimulateFailover(pool.id)}
                          disabled={actionLoading !== null}
                          className="px-3 py-1.5 rounded-xl bg-rose-500/15 hover:bg-rose-500/25 border border-rose-500/40 text-rose-300 text-xs font-bold transition-all flex items-center gap-1.5"
                        >
                          <Flame className="w-3.5 h-3.5" />
                          <span>{t.originView.poolsSection.simulateFailoverBtn}</span>
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Origin Nodes Grid */}
                  <div className="pt-4 space-y-3">
                    <span className="text-xs font-bold text-gray-400 block">
                      {formatText(t.originView.poolsSection.nodesListTitle, { count: pool.nodes.length })}
                    </span>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      {pool.nodes.map((node) => {
                        const isServing = node.id === pool.activeOriginId;

                        return (
                          <div
                            key={node.id}
                            className={`p-4 rounded-xl border flex flex-col justify-between transition-all ${
                              isServing
                                ? node.status === 'healthy'
                                  ? 'bg-emerald-500/10 border-emerald-500/40 shadow-lg shadow-emerald-500/5'
                                  : 'bg-rose-500/10 border-rose-500/40'
                                : 'bg-gray-950 border-gray-850'
                            }`}
                          >
                            <div className="space-y-2">
                              <div className="flex items-center justify-between">
                                <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded ${
                                  node.role === 'primary'
                                    ? 'bg-blue-500/20 text-blue-300'
                                    : node.role === 'secondary'
                                    ? 'bg-purple-500/20 text-purple-300'
                                    : 'bg-gray-800 text-gray-400'
                                }`}>
                                  {node.role === 'primary' ? t.originView.poolsSection.nodeRolePrimary : node.role === 'secondary' ? t.originView.poolsSection.nodeRoleSecondary : t.originView.poolsSection.nodeRoleBackup}
                                </span>

                                <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded ${
                                  node.status === 'healthy'
                                    ? 'bg-emerald-500/20 text-emerald-400'
                                    : 'bg-rose-500/20 text-rose-400 animate-pulse'
                                }`}>
                                  {node.status === 'healthy' ? t.originView.poolsSection.statusHealthy : t.originView.poolsSection.statusUnhealthy}
                                </span>
                              </div>

                              <div>
                                <span className="text-xs font-bold text-white block truncate">{node.name}</span>
                                <span className="text-xs font-mono text-cyan-400">{node.address}:{node.port}</span>
                              </div>
                            </div>

                            <div className="pt-3 mt-3 border-t border-gray-850/80 flex items-center justify-between text-[11px] font-mono text-gray-400">
                              <span>RTT: <strong className="text-gray-200">{node.rttMs} ms</strong></span>
                              <span>Uptime: <strong className="text-emerald-400">{node.uptimePercent}%</strong></span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Failover Events Log Table */}
          <div className="rounded-2xl border border-gray-800 bg-gray-900/60 overflow-hidden shadow-xl">
            <div className="px-5 py-3.5 bg-gray-950/80 border-b border-gray-800 flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs font-bold text-white">
                <Activity className="w-4 h-4 text-orange-400" />
                <span>{formatText(t.originView.poolsSection.eventsTitle, { count: events.length })}</span>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-gray-950/40 border-b border-gray-800 text-gray-400 uppercase font-semibold text-[10px]">
                  <tr>
                    <th className="py-3 px-4">Pool</th>
                    <th className="py-3 px-4">From Origin (Outage)</th>
                    <th className="py-3 px-4">To Origin (Failover)</th>
                    <th className="py-3 px-4">Trigger Reason</th>
                    <th className="py-3 px-4">Time</th>
                    <th className="py-3 px-4">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-850 font-mono">
                  {events.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-6 text-center text-gray-500 font-sans">
                        {t.originView.poolsSection.emptyEvents}
                      </td>
                    </tr>
                  ) : (
                    events.map((ev) => (
                      <tr key={ev.id} className="hover:bg-gray-850/50">
                        <td className="py-3 px-4 font-bold text-white font-sans">{ev.poolName}</td>
                        <td className="py-3 px-4 text-rose-400">
                          <span className="block font-bold">{ev.fromNodeName}</span>
                          <span className="text-[10px] text-rose-300/80">{ev.fromNodeIp}</span>
                        </td>
                        <td className="py-3 px-4 text-emerald-400">
                          <span className="block font-bold">{ev.toNodeName}</span>
                          <span className="text-[10px] text-emerald-300/80">{ev.toNodeIp}</span>
                        </td>
                        <td className="py-3 px-4 text-gray-300 max-w-xs truncate font-sans">{ev.reason}</td>
                        <td className="py-3 px-4 text-gray-400 text-[11px]">{new Date(ev.timestamp).toLocaleTimeString()}</td>
                        <td className="py-3 px-4">
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-amber-500/15 text-amber-400 border border-amber-500/30">
                            AUTO SWITCHED
                          </span>
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
      {/* TAB 2: ORIGIN SHIELD & CUSTOM HEADER VALIDATION                           */}
      {/* ========================================================================= */}
      {activeTab === 'shield' && shield && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left: Secret Header Generator Card */}
            <div className="lg:col-span-6 p-5 rounded-2xl bg-gray-900/70 border border-gray-800 space-y-4">
              <div className="flex items-center justify-between border-b border-gray-800 pb-3">
                <span className="text-xs font-bold text-white flex items-center gap-2">
                  <Key className="w-4 h-4 text-orange-400" />
                  {t.originView.shieldSection.secretCardTitle}
                </span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                  SHIELD ACTIVE
                </span>
              </div>

              <div className="space-y-3.5 text-xs font-mono">
                <div>
                  <label className="block text-gray-400 font-semibold mb-1 font-sans">
                    {t.originView.shieldSection.headerNameLabel}
                  </label>
                  <input
                    type="text"
                    value={shield.headerName}
                    readOnly
                    className="w-full bg-gray-950 border border-gray-800 rounded-xl px-3 py-2 text-xs text-cyan-400 font-bold focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-gray-400 font-semibold mb-1 font-sans">
                    {t.originView.shieldSection.secretValueLabel}
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={shield.headerSecret}
                      readOnly
                      className="w-full bg-gray-950 border border-gray-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none font-bold select-all"
                    />
                    <button
                      type="button"
                      onClick={handleCopySecret}
                      className="p-2 rounded-xl bg-gray-800 hover:bg-gray-700 text-gray-300 transition-colors"
                      title="Copy Secret"
                    >
                      {copiedSecret ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div className="pt-2 flex items-center justify-between font-sans">
                  <span className="text-[11px] text-gray-500">
                    {t.originView.shieldSection.lastRotated} {new Date(shield.lastRotated).toLocaleDateString()}
                  </span>

                  <button
                    type="button"
                    onClick={handleRotateShieldSecret}
                    disabled={actionLoading === 'rotate-secret'}
                    className="px-3.5 py-1.5 rounded-xl bg-orange-500 hover:bg-orange-600 text-white text-xs font-bold transition-all shadow-md shadow-orange-500/20 cursor-pointer"
                  >
                    {actionLoading === 'rotate-secret' ? t.common.saving : t.originView.shieldSection.rotateSecretBtn}
                  </button>
                </div>
              </div>

              {/* Explainer Box */}
              <div className="p-4 rounded-xl bg-gray-950 border border-gray-850 space-y-2 text-xs text-gray-300">
                <span className="font-bold text-white block">
                  {t.originView.shieldSection.howItWorksTitle}
                </span>
                <p className="text-[11px] text-gray-400 leading-relaxed">
                  {t.originView.shieldSection.howItWorksStep1}
                </p>
                <p className="text-[11px] text-gray-400 leading-relaxed">
                  {t.originView.shieldSection.howItWorksStep2}
                </p>
                <p className="text-[11px] text-emerald-400/90 leading-relaxed">
                  {t.originView.shieldSection.howItWorksStep3}
                </p>
              </div>
            </div>

            {/* Right: 1-Click Web Server Snippet Generator */}
            <div className="lg:col-span-6 space-y-4">
              <div className="p-5 rounded-2xl bg-gray-900/70 border border-gray-800 space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-gray-800 pb-3">
                  <span className="text-xs font-bold text-white">
                    {t.originView.shieldSection.snippetsTitle}
                  </span>

                  {/* Web Server Selector */}
                  <div className="flex items-center gap-1 bg-gray-950 p-1 rounded-xl border border-gray-800 text-xs">
                    {(['nginx', 'apache', 'iis', 'haproxy'] as const).map((srv) => (
                      <button
                        key={srv}
                        type="button"
                        onClick={() => setSnippetServer(srv)}
                        className={`px-2.5 py-1 rounded-lg font-bold uppercase text-[10px] transition-colors ${
                          snippetServer === srv
                            ? 'bg-orange-500 text-white'
                            : 'text-gray-400 hover:text-gray-200'
                        }`}
                      >
                        {srv}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Code Box */}
                <div className="relative rounded-xl bg-gray-950 border border-gray-850 p-4 font-mono text-[11px] text-gray-300 overflow-x-auto max-h-[340px]">
                  <pre className="whitespace-pre">{getSnippet()}</pre>
                </div>

                <div className="flex justify-end pt-1">
                  <button
                    type="button"
                    onClick={handleCopySnippet}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gray-800 hover:bg-gray-700 text-white text-xs font-bold transition-all cursor-pointer"
                  >
                    {copiedSnippet ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                    <span>{copiedSnippet ? t.originView.shieldSection.copiedSnippet : t.originView.shieldSection.copySnippetBtn}</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
