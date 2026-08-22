'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useLanguage } from '@/context/LanguageContext';
import { OriginPool, OriginShieldConfig, FailoverEvent, OriginNode, LoadBalancerConfig } from '@/app/api/origin/route';
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
  ArrowUpRight,
  Globe,
  Compass,
  Cookie,
  Plus
} from 'lucide-react';

export const OriginView: React.FC = () => {
  const { selectedZone, authFetch, hasPermission } = useAuth();
  const { t, formatText } = useLanguage();
  const canModify = hasPermission('canAutoFix');

  const [activeTab, setActiveTab] = useState<'lbs' | 'pools' | 'shield'>('lbs');
  const [pools, setPools] = useState<OriginPool[]>([]);
  const [loadBalancers, setLoadBalancers] = useState<LoadBalancerConfig[]>([]);
  const [shield, setShield] = useState<OriginShieldConfig | null>(null);
  const [events, setEvents] = useState<FailoverEvent[]>([]);
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Modals
  const [isLbModalOpen, setIsLbModalOpen] = useState(false);
  const [lbForm, setLbForm] = useState({
    name: '',
    hostname: '',
    steeringPolicy: 'geo' as 'off' | 'geo' | 'dynamic_latency' | 'random' | 'proximity',
    sessionAffinity: 'cookie' as 'none' | 'cookie' | 'ip_cookie',
    sessionAffinityTtl: 1800,
    defaultPoolIds: [] as string[],
    fallbackPoolId: '',
  });

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
      setLoadBalancers(data.loadBalancers || []);
      setShield(data.shield || null);
      setEvents(data.events || []);

      if (data.pools && data.pools.length > 0 && lbForm.defaultPoolIds.length === 0) {
        setLbForm(prev => ({
          ...prev,
          hostname: selectedZone.name,
          defaultPoolIds: [data.pools[0].id],
          fallbackPoolId: data.pools[0].id,
        }));
      }
    } catch (err: any) {
      setNotification({ type: 'error', text: err.message || 'Error fetching origin telemetry' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOriginData();
  }, [selectedZone]);

  const handleCreateLb = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedZone || !lbForm.name.trim()) return;

    try {
      const res = await fetch('/api/origin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'create_load_balancer',
          zoneId: selectedZone.id,
          zoneName: selectedZone.name,
          lbData: {
            name: lbForm.name.trim(),
            hostname: lbForm.hostname.trim() || selectedZone.name,
            steeringPolicy: lbForm.steeringPolicy,
            sessionAffinity: lbForm.sessionAffinity,
            sessionAffinityTtl: lbForm.sessionAffinityTtl,
            defaultPoolIds: lbForm.defaultPoolIds.length > 0 ? lbForm.defaultPoolIds : [pools[0]?.id],
            fallbackPoolId: lbForm.fallbackPoolId || pools[0]?.id,
          },
        }),
      });
      const data = await res.json();
      if (data.success) {
        setLoadBalancers(data.loadBalancers || []);
        setIsLbModalOpen(false);
        setNotification({ type: 'success', text: data.message });
      }
    } catch (err: any) {
      setNotification({ type: 'error', text: err.message || 'Failed to create Load Balancer' });
    }
  };

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
      setNotification({ type: 'error', text: err.message || 'Failover simulation failed' });
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
      setEvents(data.events || []);
      setNotification({ type: 'success', text: data.message });
    } catch (err: any) {
      setNotification({ type: 'error', text: err.message || 'Restore failed' });
    } finally {
      setActionLoading(null);
    }
  };

  const handleRotateSecret = async () => {
    if (!selectedZone) return;
    setActionLoading('rotate');
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
      setShield(data.shield || null);
      setNotification({ type: 'success', text: data.message });
    } catch (err: any) {
      setNotification({ type: 'error', text: err.message || 'Rotation failed' });
    } finally {
      setActionLoading(null);
    }
  };

  const copyToClipboard = (text: string, type: 'secret' | 'snippet') => {
    navigator.clipboard.writeText(text);
    if (type === 'secret') {
      setCopiedSecret(true);
      setTimeout(() => setCopiedSecret(false), 2000);
    } else {
      setCopiedSnippet(true);
      setTimeout(() => setCopiedSnippet(false), 2000);
    }
  };

  const secretVal = shield?.headerSecret || 'cf-shield-sec-sample999888';
  const headerName = shield?.headerName || 'X-Origin-Verify-Secret';

  const snippets: Record<string, string> = {
    nginx: `# /etc/nginx/conf.d/origin-shield.conf
server {
    listen 443 ssl http2;
    server_name ${selectedZone?.name || 'example.com'};

    # Enforce Cloudflare Origin Shield Verification
    if ($http_${headerName.toLowerCase().replace(/-/g, '_')} != "${secretVal}") {
        return 403 "Forbidden: Direct origin access blocked by Cloudflare Origin Shield.";
    }

    # Your standard application proxy routing
    location / {
        proxy_pass http://127.0.0.1:8080;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }
}`,
    apache: `# .htaccess or /etc/apache2/sites-available/origin-shield.conf
<IfModule mod_rewrite.c>
    RewriteEngine On
    RewriteCond %{HTTP:${headerName}} !^${secretVal}$
    RewriteRule ^.*$ - [F,L]
</IfModule>`,
    iis: `<!-- web.config in IIS root directory -->
<configuration>
  <system.webServer>
    <rewrite>
      <rules>
        <rule name="Enforce Cloudflare Origin Shield" stopProcessing="true">
          <match url=".*" />
          <conditions>
            <add input="{HTTP_${headerName.replace(/-/g, '_')}}" pattern="^${secretVal}$" negate="true" />
          </conditions>
          <action type="CustomResponse" statusCode="403" statusReason="Forbidden" statusDescription="Direct IP Access Denied" />
        </rule>
      </rules>
    </rewrite>
  </system.webServer>
</configuration>`,
    haproxy: `# /etc/haproxy/haproxy.cfg
frontend https_front
    bind *:443 ssl crt /etc/ssl/certs/origin.pem
    
    # Drop any request lacking valid Cloudflare Secret Header
    http-request deny deny_status 403 unless { req.hdr(${headerName}) -m str "${secretVal}" }
    
    default_backend app_servers`,
  };

  return (
    <div className="space-y-6">
      {/* Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 rounded-2xl bg-gradient-to-r from-gray-900 via-gray-900/90 to-gray-950 border border-gray-800">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="p-2 rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
              <Compass className="w-5 h-5" />
            </span>
            <h1 className="text-xl font-bold text-white tracking-tight">{t.originView.title}</h1>
          </div>
          <p className="text-xs text-gray-400">
            {t.originView.subtitle}
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={fetchOriginData}
            disabled={loading}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-gray-800 hover:bg-gray-750 border border-gray-700 text-gray-300 text-xs font-semibold transition-all cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>{t.common.refresh}</span>
          </button>

          {activeTab === 'lbs' && (
            <button
              onClick={() => canModify && setIsLbModalOpen(true)}
              disabled={!canModify}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-md ${
                canModify
                  ? 'bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 text-white shadow-cyan-500/20 cursor-pointer'
                  : 'bg-gray-800 text-gray-500 cursor-not-allowed opacity-50'
              }`}
            >
              <Plus className="w-4 h-4" />
              <span>{t.originView.lbSection.addLbBtn}</span>
            </button>
          )}

          {activeTab === 'pools' && (
            <button
              onClick={() => handleRunHealthCheck()}
              disabled={actionLoading === 'probe'}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 text-white text-xs font-bold transition-all shadow-md shadow-cyan-500/20 cursor-pointer"
            >
              <Radio className={`w-3.5 h-3.5 ${actionLoading === 'probe' ? 'animate-spin' : ''}`} />
              <span>{t.originView.poolsSection.runProbesBtn}</span>
            </button>
          )}
        </div>
      </div>

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
          onClick={() => setActiveTab('lbs')}
          className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all flex items-center gap-2 ${
            activeTab === 'lbs'
              ? 'bg-cyan-500/15 text-cyan-400 border border-cyan-500/30 font-bold'
              : 'text-gray-400 hover:text-gray-200 hover:bg-gray-900'
          }`}
        >
          <Compass className="w-4 h-4" />
          <span>{t.originView.tabs.loadBalancers} ({loadBalancers.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('pools')}
          className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all flex items-center gap-2 ${
            activeTab === 'pools'
              ? 'bg-blue-500/15 text-blue-400 border border-blue-500/30 font-bold'
              : 'text-gray-400 hover:text-gray-200 hover:bg-gray-900'
          }`}
        >
          <Server className="w-4 h-4" />
          <span>{t.originView.tabs.pools} ({pools.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('shield')}
          className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all flex items-center gap-2 ${
            activeTab === 'shield'
              ? 'bg-purple-500/15 text-purple-400 border border-purple-500/30 font-bold'
              : 'text-gray-400 hover:text-gray-200 hover:bg-gray-900'
          }`}
        >
          <ShieldCheck className="w-4 h-4" />
          <span>{t.originView.tabs.shield}</span>
        </button>
      </div>

      {/* TAB 1: Native Load Balancers & Geo-Steering */}
      {activeTab === 'lbs' && (
        <div className="space-y-6">
          <div className="p-4 rounded-xl bg-gray-950 border border-gray-850 text-xs text-gray-300 flex items-start justify-between gap-4">
            <div>
              <span className="font-bold text-white block mb-1">{t.originView.lbSection.title}</span>
              <p className="text-gray-400 leading-relaxed">{t.originView.lbSection.subtitle}</p>
            </div>
            <span className="px-2.5 py-1 rounded-xl bg-cyan-500/15 text-cyan-300 border border-cyan-500/30 text-[10px] font-bold shrink-0">
              Native Anycast LB
            </span>
          </div>

          <div className="grid grid-cols-1 gap-4">
            {loadBalancers.map((lb) => (
              <div key={lb.id} className="p-6 rounded-2xl bg-gray-900/80 border border-gray-800 shadow-xl space-y-4">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 border-b border-gray-800 pb-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-base font-bold text-white">{lb.name}</h3>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-cyan-950 text-cyan-300 border border-cyan-800">
                        {lb.hostname}
                      </span>
                    </div>
                    <span className="text-xs text-gray-400 mt-0.5 block">
                      Steering: <strong className="text-orange-300">{t.originView.lbSection.steeringOptions[lb.steeringPolicy]}</strong> • Session Affinity: <strong className="text-emerald-300">{t.originView.lbSection.affinityOptions[lb.sessionAffinity]}</strong>
                    </span>
                  </div>

                  <span className="px-2.5 py-1 rounded-xl bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 text-xs font-bold flex items-center gap-1.5 w-max">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                    <span>TRAFFIC STEERING ACTIVE</span>
                  </span>
                </div>

                {/* Geo Steering Matrix View */}
                {lb.steeringPolicy === 'geo' && lb.geoSteeringMatrix && Object.keys(lb.geoSteeringMatrix).length > 0 && (
                  <div className="p-4 rounded-xl bg-gray-950 border border-gray-850 space-y-2">
                    <span className="text-xs font-bold text-gray-300 flex items-center gap-1.5">
                      <Globe className="w-3.5 h-3.5 text-cyan-400" />
                      <span>{t.originView.lbSection.geoMatrixTitle}</span>
                    </span>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 text-xs font-mono">
                      {Object.entries(lb.geoSteeringMatrix).map(([region, pId]) => (
                        <div key={region} className="p-2 rounded-lg bg-gray-900 border border-gray-800 flex items-center justify-between">
                          <span className="text-cyan-300 font-bold">{region}</span>
                          <span className="text-[11px] text-gray-400 truncate max-w-[110px]">{pools.find(p => p.id === pId)?.name.split(' ')[0] || pId}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Attached Pools */}
                <div className="space-y-2 text-xs">
                  <span className="text-gray-400 font-semibold block">{t.originView.lbSection.tableDefaultPools}:</span>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    {lb.defaultPoolIds.map((pId) => {
                      const pool = pools.find(p => p.id === pId);
                      return (
                        <div key={pId} className="p-3 rounded-xl bg-gray-950 border border-gray-850 space-y-1">
                          <div className="flex items-center justify-between font-bold text-white">
                            <span>{pool?.name || pId}</span>
                            <span className="text-[10px] text-emerald-400">✓ Healthy</span>
                          </div>
                          <div className="text-[11px] text-gray-400">
                            {pool?.nodes.length || 0} Origin Nodes • Total Weight: {pool?.nodes.reduce((acc, n) => acc + n.weight, 0)}%
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 2: Origin Pools & DNS Failover */}
      {activeTab === 'pools' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 gap-4">
            {pools.map((pool) => (
              <div key={pool.id} className="p-6 rounded-2xl bg-gray-900/80 border border-gray-800 shadow-xl space-y-4">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 border-b border-gray-800 pb-3">
                  <div>
                    <h3 className="text-base font-bold text-white flex items-center gap-2">
                      <span>{pool.name}</span>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-blue-950 text-blue-300 border border-blue-800">
                        {pool.hostname}
                      </span>
                    </h3>
                    <span className="text-xs text-gray-400">
                      Health Check: <strong className="text-cyan-300">{pool.healthCheck.type} {pool.healthCheck.path}</strong> ({pool.healthCheck.intervalSeconds}s interval)
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleSimulateFailover(pool.id)}
                      disabled={actionLoading === `failover-${pool.id}`}
                      className="px-3 py-1.5 rounded-xl bg-rose-500/15 hover:bg-rose-500/25 border border-rose-500/30 text-rose-300 text-xs font-semibold flex items-center gap-1.5 cursor-pointer transition-all"
                    >
                      <Flame className="w-3.5 h-3.5 text-rose-400" />
                      <span>{t.originView.poolsSection.simulateFailoverBtn}</span>
                    </button>
                    <button
                      onClick={() => handleRestorePrimary(pool.id)}
                      disabled={actionLoading === `restore-${pool.id}`}
                      className="px-3 py-1.5 rounded-xl bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/30 text-emerald-300 text-xs font-semibold flex items-center gap-1.5 cursor-pointer transition-all"
                    >
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                      <span>{t.originView.poolsSection.restorePrimaryBtn}</span>
                    </button>
                  </div>
                </div>

                {/* Nodes List */}
                <div className="space-y-2">
                  <span className="text-xs font-semibold text-gray-400">{formatText(t.originView.poolsSection.nodesListTitle, { count: pool.nodes.length })}</span>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                    {pool.nodes.map((node) => {
                      const isActive = pool.activeOriginId === node.id;
                      return (
                        <div
                          key={node.id}
                          className={`p-4 rounded-xl border transition-all ${
                            isActive
                              ? 'bg-blue-950/40 border-blue-500/50 shadow-md shadow-blue-500/10'
                              : 'bg-gray-950 border-gray-850'
                          }`}
                        >
                          <div className="flex items-center justify-between mb-2">
                            <span className="font-bold text-white text-xs">{node.name}</span>
                            <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase ${
                              node.status === 'healthy'
                                ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                                : 'bg-rose-500/15 text-rose-400 border border-rose-500/30'
                            }`}>
                              {node.status === 'healthy' ? t.originView.poolsSection.statusHealthy : t.originView.poolsSection.statusUnhealthy}
                            </span>
                          </div>

                          <div className="text-xs font-mono text-cyan-300 mb-2">
                            {node.address}:{node.port}
                          </div>

                          <div className="flex items-center justify-between text-[11px] text-gray-400 border-t border-gray-850 pt-2">
                            <span>Weight: <strong className="text-white">{node.weight}%</strong></span>
                            <span>RTT: <strong className="text-emerald-400">{node.rttMs}ms</strong></span>
                            <span>Uptime: <strong className="text-white">{node.uptimePercent}%</strong></span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Failover Events Log */}
          <div className="p-6 rounded-2xl bg-gray-900/60 border border-gray-800 shadow-xl space-y-4">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Activity className="w-4 h-4 text-cyan-400" />
              <span>{formatText(t.originView.poolsSection.eventsTitle, { count: events.length })}</span>
            </h3>

            <div className="space-y-2">
              {events.map((ev) => (
                <div key={ev.id} className="p-3 rounded-xl bg-gray-950 border border-gray-850 flex flex-col md:flex-row md:items-center justify-between gap-2 text-xs">
                  <div className="flex items-center gap-2 font-mono">
                    <span className="text-gray-500 text-[11px]">{new Date(ev.timestamp).toLocaleTimeString()}</span>
                    <span className="text-white font-bold">{ev.poolName}:</span>
                    <span className="text-rose-400">{ev.fromNodeName}</span>
                    <ArrowRight className="w-3.5 h-3.5 text-gray-500" />
                    <span className="text-emerald-400">{ev.toNodeName}</span>
                  </div>
                  <span className="text-gray-400 text-[11px] italic">{ev.reason}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: Origin Shield */}
      {activeTab === 'shield' && (
        <div className="space-y-6">
          <div className="p-6 rounded-2xl bg-gray-900/80 border border-gray-800 shadow-xl space-y-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-gray-800 pb-4">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <Key className="w-4 h-4 text-purple-400" />
                  <span>{t.originView.shieldSection.secretCardTitle}</span>
                </h3>
                <p className="text-xs text-gray-400 mt-1">
                  {t.originView.shieldSection.subtitle}
                </p>
              </div>

              <button
                onClick={handleRotateSecret}
                disabled={actionLoading === 'rotate'}
                className="px-4 py-2 rounded-xl bg-purple-500/15 hover:bg-purple-500/25 border border-purple-500/30 text-purple-300 text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-all"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${actionLoading === 'rotate' ? 'animate-spin' : ''}`} />
                <span>{t.originView.shieldSection.rotateSecretBtn}</span>
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-mono">
              <div className="p-4 rounded-xl bg-gray-950 border border-gray-850 space-y-1">
                <span className="text-gray-500 text-[11px] block">{t.originView.shieldSection.headerNameLabel}</span>
                <span className="text-cyan-300 font-bold">{headerName}</span>
              </div>

              <div className="p-4 rounded-xl bg-gray-950 border border-gray-850 flex items-center justify-between gap-2">
                <div className="truncate">
                  <span className="text-gray-500 text-[11px] block">{t.originView.shieldSection.secretValueLabel}</span>
                  <span className="text-purple-300 font-bold truncate block">{secretVal}</span>
                </div>
                <button
                  onClick={() => copyToClipboard(secretVal, 'secret')}
                  className="p-2 rounded-lg bg-gray-800 hover:bg-gray-750 text-gray-300"
                  title="Copy secret"
                >
                  {copiedSecret ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                </button>
              </div>
            </div>
          </div>

          {/* Snippets Generator */}
          <div className="p-6 rounded-2xl bg-gray-900/80 border border-gray-800 shadow-xl space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-gray-800 pb-3">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Code2 className="w-4 h-4 text-cyan-400" />
                <span>{t.originView.shieldSection.snippetsTitle}</span>
              </h3>

              <div className="flex items-center gap-1.5">
                {(['nginx', 'apache', 'iis', 'haproxy'] as const).map((srv) => (
                  <button
                    key={srv}
                    onClick={() => setSnippetServer(srv)}
                    className={`px-3 py-1 rounded-lg text-xs font-bold uppercase transition-all ${
                      snippetServer === srv
                        ? 'bg-cyan-500 text-gray-950'
                        : 'bg-gray-800 text-gray-400 hover:text-white'
                    }`}
                  >
                    {srv}
                  </button>
                ))}
              </div>
            </div>

            <div className="relative">
              <pre className="p-4 rounded-xl bg-gray-950 border border-gray-850 font-mono text-[11px] text-gray-300 overflow-x-auto">
                <code>{snippets[snippetServer]}</code>
              </pre>
              <button
                onClick={() => copyToClipboard(snippets[snippetServer], 'snippet')}
                className="absolute top-3 right-3 px-3 py-1.5 rounded-lg bg-gray-800 hover:bg-gray-700 text-gray-200 text-xs font-semibold flex items-center gap-1.5 shadow"
              >
                {copiedSnippet ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedSnippet ? t.originView.shieldSection.copiedSnippet : t.originView.shieldSection.copySnippetBtn}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Create Load Balancer */}
      {isLbModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="w-full max-w-xl bg-gray-900 border border-gray-800 rounded-3xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-gray-800 pb-3">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Compass className="w-4 h-4 text-cyan-400" />
                <span>{t.originView.modalLb.title}</span>
              </h3>
              <button onClick={() => setIsLbModalOpen(false)} className="text-gray-500 hover:text-white">✕</button>
            </div>

            <form onSubmit={handleCreateLb} className="space-y-3.5 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-gray-400 mb-1 font-semibold">{t.originView.modalLb.nameLabel}</label>
                  <input
                    type="text"
                    required
                    value={lbForm.name}
                    onChange={(e) => setLbForm({ ...lbForm, name: e.target.value })}
                    placeholder={t.originView.modalLb.namePlaceholder}
                    className="w-full bg-gray-950 border border-gray-800 rounded-xl px-3 py-2 text-white focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-gray-400 mb-1 font-semibold">{t.originView.modalLb.hostnameLabel}</label>
                  <input
                    type="text"
                    required
                    value={lbForm.hostname}
                    onChange={(e) => setLbForm({ ...lbForm, hostname: e.target.value })}
                    placeholder={t.originView.modalLb.hostnamePlaceholder}
                    className="w-full bg-gray-950 border border-gray-800 rounded-xl px-3 py-2 text-cyan-300 font-mono focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-gray-400 mb-1 font-semibold">{t.originView.modalLb.steeringLabel}</label>
                <select
                  value={lbForm.steeringPolicy}
                  onChange={(e) => setLbForm({ ...lbForm, steeringPolicy: e.target.value as any })}
                  className="w-full bg-gray-950 border border-gray-800 rounded-xl px-3 py-2 text-white font-semibold focus:outline-none"
                >
                  <option value="geo">{t.originView.lbSection.steeringOptions.geo}</option>
                  <option value="dynamic_latency">{t.originView.lbSection.steeringOptions.dynamic_latency}</option>
                  <option value="random">{t.originView.lbSection.steeringOptions.random}</option>
                  <option value="off">{t.originView.lbSection.steeringOptions.off}</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-gray-400 mb-1 font-semibold">{t.originView.modalLb.affinityLabel}</label>
                  <select
                    value={lbForm.sessionAffinity}
                    onChange={(e) => setLbForm({ ...lbForm, sessionAffinity: e.target.value as any })}
                    className="w-full bg-gray-950 border border-gray-800 rounded-xl px-3 py-2 text-white focus:outline-none"
                  >
                    <option value="cookie">{t.originView.lbSection.affinityOptions.cookie}</option>
                    <option value="none">{t.originView.lbSection.affinityOptions.none}</option>
                    <option value="ip_cookie">{t.originView.lbSection.affinityOptions.ip_cookie}</option>
                  </select>
                </div>
                <div>
                  <label className="block text-gray-400 mb-1 font-semibold">{t.originView.modalLb.affinityTtlLabel}</label>
                  <input
                    type="number"
                    value={lbForm.sessionAffinityTtl}
                    onChange={(e) => setLbForm({ ...lbForm, sessionAffinityTtl: Number(e.target.value) })}
                    className="w-full bg-gray-950 border border-gray-800 rounded-xl px-3 py-2 text-white font-mono focus:outline-none"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setIsLbModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-gray-800 text-gray-400 hover:text-white"
                >
                  {t.common.cancel}
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-500 text-white font-bold"
                >
                  {t.originView.modalLb.btnSave}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
