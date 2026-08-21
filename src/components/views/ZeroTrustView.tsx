'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useLanguage } from '@/context/LanguageContext';
import { ZeroTrustAccessApp, CloudflareTunnel } from '@/types/cloudflare';
import { 
  Network, 
  ShieldCheck, 
  Terminal, 
  Copy, 
  Check, 
  RefreshCw, 
  ExternalLink, 
  Lock, 
  Key, 
  Globe, 
  Layers, 
  Server, 
  Shield, 
  Cpu, 
  Plus,
  Users
} from 'lucide-react';

export const ZeroTrustView: React.FC = () => {
  const { activeAccount, authFetch, hasPermission, role } = useAuth();
  const { t, formatText } = useLanguage();
  const canManage = hasPermission('canManageZeroTrust');

  const [activeSubTab, setActiveSubTab] = useState<'access' | 'tunnels'>('access');
  const [loading, setLoading] = useState(false);
  const [apps, setApps] = useState<ZeroTrustAccessApp[]>([]);
  const [tunnels, setTunnels] = useState<CloudflareTunnel[]>([]);
  const [copiedToken, setCopiedToken] = useState(false);

  const loadData = async () => {
    setLoading(true);
    try {
      const data = await authFetch(`/api/zerotrust?accountId=${activeAccount?.id || 'default'}`);
      if (data.apps) setApps(data.apps);
      if (data.tunnels) setTunnels(data.tunnels);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [activeAccount?.id]);

  const handleCopyCommand = (tunnelId: string) => {
    const cmd = `cloudflared tunnel run --token eyJhIjoiY2xvdWRmbGFyZS1tYW5hZ2VyIiwidCI6IiR7dHVuLXBvcnRhbH0ifQ==`;
    navigator.clipboard.writeText(cmd);
    setCopiedToken(true);
    setTimeout(() => setCopiedToken(false), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 rounded-2xl bg-gradient-to-r from-gray-900 via-gray-900/90 to-gray-950 border border-gray-800">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="p-2 rounded-xl bg-purple-500/10 text-purple-400 border border-purple-500/20">
              <Network className="w-5 h-5" />
            </span>
            <h1 className="text-xl font-bold text-white tracking-tight">{t.zeroTrustView.title}</h1>
          </div>
          <p className="text-xs text-gray-400">
            {t.zeroTrustView.subtitle}
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={loadData}
            disabled={loading}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-gray-800 hover:bg-gray-750 text-gray-300 border border-gray-700 text-xs font-semibold transition-all"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>{t.common.refresh}</span>
          </button>
        </div>
      </div>

      {/* Sub-tabs Navigation */}
      <div className="flex items-center gap-2 border-b border-gray-800 pb-2">
        <button
          onClick={() => setActiveSubTab('access')}
          className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all flex items-center gap-2 ${
            activeSubTab === 'access'
              ? 'bg-purple-500/15 text-purple-400 border border-purple-500/30'
              : 'text-gray-400 hover:text-gray-200 hover:bg-gray-900'
          }`}
        >
          <ShieldCheck className="w-4 h-4" />
          <span>{t.zeroTrustView.tabs.access} ({apps.length})</span>
        </button>

        <button
          onClick={() => setActiveSubTab('tunnels')}
          className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all flex items-center gap-2 ${
            activeSubTab === 'tunnels'
              ? 'bg-cyan-500/15 text-cyan-400 border border-cyan-500/30'
              : 'text-gray-400 hover:text-gray-200 hover:bg-gray-900'
          }`}
        >
          <Server className="w-4 h-4" />
          <span>{t.zeroTrustView.tabs.tunnels} ({tunnels.length})</span>
        </button>
      </div>

      {/* ========================================================================= */}
      {/* SUBTAB 1: ZERO TRUST ACCESS APPS                                          */}
      {/* ========================================================================= */}
      {activeSubTab === 'access' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {apps.length === 0 ? (
              <div className="col-span-2 p-12 text-center text-gray-500 text-xs rounded-2xl bg-gray-950/60 border border-gray-850">
                {t.zeroTrustView.accessSection.noApps}
              </div>
            ) : (
              apps.map((app) => (
                <div key={app.id} className="p-5 rounded-2xl bg-gray-900/70 border border-gray-800 space-y-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="p-1.5 rounded-lg bg-purple-500/10 text-purple-400 border border-purple-500/20">
                          <Lock className="w-4 h-4" />
                        </span>
                        <h3 className="text-base font-bold text-white">{app.name}</h3>
                      </div>
                      <span className="font-mono text-xs text-cyan-300 block mt-1">
                        {app.domain}
                      </span>
                    </div>

                    <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                      Active Shield
                    </span>
                  </div>

                  <div className="space-y-2 py-2 border-y border-gray-800/80 text-xs">
                    <div className="flex justify-between">
                      <span className="text-gray-400">{t.zeroTrustView.accessSection.sessionDuration}</span>
                      <span className="font-mono text-gray-200 font-bold">{app.session_duration}</span>
                    </div>
                    <div>
                      <span className="text-gray-400 block mb-1">{t.zeroTrustView.accessSection.idps}</span>
                      <div className="flex flex-wrap gap-1.5">
                        {app.allowed_idps.map((idp, idx) => (
                          <span key={idx} className="text-[11px] px-2 py-0.5 rounded bg-gray-950 border border-gray-800 text-gray-300 font-medium">
                            {idp}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Policies */}
                  <div className="space-y-2">
                    <span className="text-xs font-bold text-gray-300 block">
                      {t.zeroTrustView.accessSection.policyTitle}
                    </span>
                    <div className="space-y-1.5">
                      {app.policies?.map((pol) => (
                        <div key={pol.id} className="p-2.5 rounded-xl bg-gray-950 border border-gray-850 space-y-1 text-xs">
                          <div className="flex items-center justify-between">
                            <span className="font-semibold text-gray-200">{pol.name}</span>
                            <span className="text-[9px] font-extrabold uppercase px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400">
                              {pol.decision}
                            </span>
                          </div>
                          <div className="text-[11px] text-gray-400 font-mono">
                            {pol.rules.include.map((r, i) => (
                              <span key={i} className="text-cyan-300">
                                {r.email_domain ? `Domain: *@${r.email_domain}` : r.email ? `Email: ${r.email}` : `Group: ${r.group}`}
                              </span>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SUBTAB 2: CLOUDFLARE TUNNELS                                              */}
      {/* ========================================================================= */}
      {activeSubTab === 'tunnels' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {tunnels.length === 0 ? (
              <div className="col-span-2 p-12 text-center text-gray-500 text-xs rounded-2xl bg-gray-950/60 border border-gray-850">
                {t.zeroTrustView.tunnelsSection.noTunnels}
              </div>
            ) : (
              tunnels.map((tunnel) => (
                <div key={tunnel.id} className="p-5 rounded-2xl bg-gray-900/70 border border-gray-800 space-y-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <Server className="w-4 h-4 text-cyan-400" />
                        <h3 className="text-base font-bold text-white font-mono">{tunnel.name}</h3>
                      </div>
                      <span className="text-xs text-gray-500 font-mono">ID: {tunnel.id}</span>
                    </div>

                    <span className="text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                      {tunnel.status}
                    </span>
                  </div>

                  {/* Active Connectors */}
                  <div className="space-y-1.5">
                    <span className="text-xs font-bold text-gray-300 block">
                      {formatText(t.zeroTrustView.tunnelsSection.connectorsTitle, { count: tunnel.active_connectors.length })}
                    </span>
                    <div className="space-y-1">
                      {tunnel.active_connectors.map((c) => (
                        <div key={c.id} className="p-2 rounded-lg bg-gray-950 border border-gray-850 flex items-center justify-between text-[11px] font-mono">
                          <span className="text-gray-300">{c.id} ({c.arch})</span>
                          <span className="text-emerald-400">Node IP: {c.origin_ip}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Ingress Rules */}
                  <div className="space-y-1.5">
                    <span className="text-xs font-bold text-gray-300 block">
                      {t.zeroTrustView.tunnelsSection.ingressTitle}
                    </span>
                    <div className="space-y-1 font-mono text-[11px]">
                      {tunnel.ingress_rules.map((ing, idx) => (
                        <div key={idx} className="p-2 rounded-lg bg-gray-950 border border-gray-850 flex items-center justify-between">
                          <span className="text-cyan-300">{ing.hostname}</span>
                          <span className="text-gray-400">➔</span>
                          <span className="text-amber-300 font-bold">{ing.service}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* 1-Click Launch Command */}
                  <div className="p-3 rounded-xl bg-gray-950 border border-gray-850 space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-bold text-gray-300 flex items-center gap-1">
                        <Terminal className="w-3 h-3 text-cyan-400" />
                        {t.zeroTrustView.tunnelsSection.quickRunTitle}
                      </span>
                      <button
                        onClick={() => handleCopyCommand(tunnel.id)}
                        className="text-[11px] text-cyan-400 hover:text-cyan-300 flex items-center gap-1 font-semibold"
                      >
                        {copiedToken ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                        <span>{copiedToken ? t.common.copied : t.common.copy}</span>
                      </button>
                    </div>
                    <code className="text-[10px] text-gray-400 font-mono block truncate bg-gray-900 p-2 rounded border border-gray-800">
                      cloudflared tunnel run --token &lt;TOKEN&gt;
                    </code>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};
