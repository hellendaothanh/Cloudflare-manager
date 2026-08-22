'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useLanguage } from '@/context/LanguageContext';
import { 
  Radio, 
  Activity, 
  Globe, 
  Server, 
  ShieldCheck, 
  Lock, 
  Terminal, 
  RefreshCw, 
  ArrowRight, 
  AlertCircle, 
  CheckCircle2, 
  Check, 
  Copy, 
  Search,
  Zap,
  Layers,
  CornerDownRight,
  Shield,
  Wifi,
  Cloud
} from 'lucide-react';

type DiagTab = 'dns' | 'ping' | 'tcp' | 'ip' | 'ssl' | 'traceroute';

export const DiagnosticsView: React.FC = () => {
  const { selectedZone } = useAuth();
  const { t } = useLanguage();

  const [activeTab, setActiveTab] = useState<DiagTab>('dns');
  const [host, setHost] = useState('');
  const [recordType, setRecordType] = useState('A');
  const [port, setPort] = useState('443');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  // Initialize host with current zone name if available
  useEffect(() => {
    if (selectedZone && !host) {
      setHost(selectedZone.name);
    }
  }, [selectedZone]);

  const handleRunDiagnostic = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!host.trim()) return;

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const res = await fetch('/api/diagnostics', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: activeTab === 'tcp' ? 'tcp' : activeTab,
          host: host.trim(),
          recordType,
          port: port ? parseInt(port, 10) : undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Diagnostic query failed');
      }
      setResult(data);
    } catch (err: any) {
      setError(err.message || 'Lỗi khi thực hiện kiểm tra mạng');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="p-6 rounded-2xl bg-gradient-to-r from-gray-900 via-gray-900 to-gray-950 border border-gray-800 shadow-xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="p-3 rounded-2xl bg-gradient-to-br from-orange-500 to-amber-600 text-white shadow-lg shadow-orange-500/20">
              <Radio className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-white tracking-tight">
                {t.diagnosticsView.title}
              </h1>
              <p className="text-xs text-gray-400 mt-0.5">
                {t.diagnosticsView.subtitle}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 font-mono text-xs text-gray-400 bg-gray-950 px-3 py-1.5 rounded-xl border border-gray-850">
            <Wifi className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
            <span>Target Zone: <strong className="text-white">{selectedZone?.name || 'Global'}</strong></span>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center gap-1.5 mt-6 border-b border-gray-800 pb-2 overflow-x-auto">
          {[
            { id: 'dns', label: t.diagnosticsView.tabs.dns, icon: Globe },
            { id: 'ping', label: t.diagnosticsView.tabs.ping, icon: Activity },
            { id: 'tcp', label: t.diagnosticsView.tabs.tcp, icon: Terminal },
            { id: 'ip', label: t.diagnosticsView.tabs.ip, icon: Server },
            { id: 'ssl', label: t.diagnosticsView.tabs.ssl, icon: Lock },
            { id: 'traceroute', label: t.diagnosticsView.tabs.traceroute, icon: Layers },
          ].map((tabItem) => {
            const Icon = tabItem.icon;
            const isTabActive = activeTab === tabItem.id;

            return (
              <button
                key={tabItem.id}
                onClick={() => {
                  setActiveTab(tabItem.id as DiagTab);
                  setResult(null);
                  setError(null);
                }}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all shrink-0 ${
                  isTabActive
                    ? 'bg-orange-500 text-white shadow-md shadow-orange-500/25'
                    : 'text-gray-400 hover:text-white hover:bg-gray-800/60'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{tabItem.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Query Control Form */}
      <form onSubmit={handleRunDiagnostic} className="p-5 rounded-2xl bg-gray-900/80 border border-gray-800 shadow-xl space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-end">
          {/* Target Host Input */}
          <div className={`${activeTab === 'dns' ? 'md:col-span-6' : activeTab === 'tcp' || activeTab === 'ssl' ? 'md:col-span-7' : 'md:col-span-9'}`}>
            <label className="block text-xs font-semibold text-gray-300 mb-1.5">
              {t.diagnosticsView.hostInputLabel}
            </label>
            <div className="relative">
              <input
                type="text"
                value={host}
                onChange={(e) => setHost(e.target.value)}
                placeholder={t.diagnosticsView.hostInputPlaceholder}
                className="w-full bg-gray-950 border border-gray-800 rounded-xl pl-3.5 pr-10 py-2.5 text-xs text-white placeholder-gray-600 focus:outline-none focus:border-orange-500 font-mono shadow-inner"
              />
              {selectedZone && (
                <button
                  type="button"
                  onClick={() => setHost(selectedZone.name)}
                  className="absolute right-2 top-2 px-2 py-0.5 rounded bg-gray-800 hover:bg-gray-700 text-[10px] font-mono text-orange-400"
                  title="Điền domain hiện tại"
                >
                  Zone
                </button>
              )}
            </div>
          </div>

          {/* DNS Record Type Selector */}
          {activeTab === 'dns' && (
            <div className="md:col-span-3">
              <label className="block text-xs font-semibold text-gray-300 mb-1.5">
                {t.diagnosticsView.recordTypeLabel}
              </label>
              <select
                value={recordType}
                onChange={(e) => setRecordType(e.target.value)}
                className="w-full bg-gray-950 border border-gray-800 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-orange-500 font-mono font-bold shadow-inner"
              >
                {['A', 'AAAA', 'CNAME', 'TXT', 'MX', 'NS', 'SOA'].map((r) => (
                  <option key={r} value={r}>{r}</option>
                ))}
              </select>
            </div>
          )}

          {/* TCP / SSL Port Input */}
          {(activeTab === 'tcp' || activeTab === 'ssl') && (
            <div className="md:col-span-2">
              <label className="block text-xs font-semibold text-gray-300 mb-1.5">
                {t.diagnosticsView.portLabel}
              </label>
              <input
                type="number"
                value={port}
                onChange={(e) => setPort(e.target.value)}
                placeholder="443"
                className="w-full bg-gray-950 border border-gray-800 rounded-xl px-3 py-2.5 text-xs text-white placeholder-gray-600 focus:outline-none focus:border-orange-500 font-mono shadow-inner"
              />
            </div>
          )}

          {/* Action Button */}
          <div className="md:col-span-3">
            <button
              type="submit"
              disabled={loading || !host.trim()}
              className="w-full flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-orange-500 to-amber-600 hover:from-orange-600 hover:to-amber-700 text-white text-xs font-bold transition-all shadow-md shadow-orange-500/20 disabled:opacity-50 cursor-pointer"
            >
              {loading ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>{t.diagnosticsView.btnRunning}</span>
                </>
              ) : (
                <>
                  <Zap className="w-4 h-4" />
                  <span>{t.diagnosticsView.btnRun}</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Quick presets for Ports */}
        {activeTab === 'tcp' && (
          <div className="flex items-center gap-2 pt-2 text-xs">
            <span className="text-gray-500">{t.diagnosticsView.quickPresets}</span>
            {[80, 443, 22, 8080, 8443, 3306, 5432].map((p) => (
              <button
                key={p}
                type="button"
                onClick={() => setPort(p.toString())}
                className={`px-2 py-0.5 rounded font-mono text-[11px] border transition-colors ${
                  port === p.toString()
                    ? 'bg-orange-500/20 text-orange-400 border-orange-500/40 font-bold'
                    : 'bg-gray-950 text-gray-400 border-gray-850 hover:text-white'
                }`}
              >
                {p}
              </button>
            ))}
          </div>
        )}
      </form>

      {/* Error Alert */}
      {error && (
        <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 flex items-center gap-3 text-xs text-rose-400 shadow-md">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Results Display Area */}
      {result && !loading && (
        <div className="p-6 rounded-2xl bg-gray-900/80 border border-gray-800 shadow-2xl space-y-6 animate-in fade-in duration-200">
          <div className="flex items-center justify-between border-b border-gray-800 pb-3">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span className="text-xs font-bold text-white uppercase tracking-wider">
                {t.diagnosticsView.resultsTitle}
              </span>
            </div>
            <span className="text-[11px] font-mono text-gray-500">
              Host: <strong className="text-gray-300">{result.host || host}</strong>
            </span>
          </div>

          {/* 1. DNS Results View */}
          {activeTab === 'dns' && result.resolvers && (
            <div className="space-y-4">
              {/* Proxy Detection Banner */}
              <div className={`p-4 rounded-xl border flex items-center gap-3 ${
                result.isProxiedByCloudflare
                  ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                  : 'bg-amber-500/10 border-amber-500/30 text-amber-300'
              }`}>
                <ShieldCheck className="w-5 h-5 shrink-0" />
                <div>
                  <span className="font-bold text-xs block">
                    {result.isProxiedByCloudflare
                      ? t.diagnosticsView.proxyDetected
                      : t.diagnosticsView.directOriginDetected}
                  </span>
                  <span className="text-[11px] opacity-80 block mt-0.5">
                    {result.isProxiedByCloudflare
                      ? t.diagnosticsView.proxyDetectedDesc
                      : t.diagnosticsView.directOriginDetectedDesc}
                  </span>
                </div>
              </div>

              {/* Resolvers Breakdown */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Cloudflare Resolver */}
                <div className="p-4 rounded-xl bg-gray-950 border border-gray-850 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-xs font-bold text-white">
                      <Globe className="w-4 h-4 text-orange-400" />
                      <span>{result.resolvers.cloudflare?.name}</span>
                    </div>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/15 text-emerald-400 font-bold border border-emerald-500/30">
                      {result.resolvers.cloudflare?.status}
                    </span>
                  </div>
                  <div className="space-y-1.5 font-mono text-xs">
                    {result.resolvers.cloudflare?.answers?.length > 0 ? (
                      result.resolvers.cloudflare.answers.map((ans: any, i: number) => (
                        <div key={i} className="flex items-center justify-between p-2 rounded-lg bg-gray-900 border border-gray-800 text-gray-200">
                          <span className="font-bold break-all">{ans.data}</span>
                          <span className="text-gray-500 text-[10px] shrink-0 ml-2">TTL: {ans.ttl}s</span>
                        </div>
                      ))
                    ) : (
                      <span className="text-gray-500 text-xs italic">{t.diagnosticsView.emptyRecords}</span>
                    )}
                  </div>
                </div>

                {/* Google Public DNS */}
                <div className="p-4 rounded-xl bg-gray-950 border border-gray-850 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-xs font-bold text-white">
                      <Globe className="w-4 h-4 text-blue-400" />
                      <span>{result.resolvers.google?.name}</span>
                    </div>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/15 text-emerald-400 font-bold border border-emerald-500/30">
                      {result.resolvers.google?.status}
                    </span>
                  </div>
                  <div className="space-y-1.5 font-mono text-xs">
                    {result.resolvers.google?.answers?.length > 0 ? (
                      result.resolvers.google.answers.map((ans: any, i: number) => (
                        <div key={i} className="flex items-center justify-between p-2 rounded-lg bg-gray-900 border border-gray-800 text-gray-200">
                          <span className="font-bold break-all">{ans.data}</span>
                          <span className="text-gray-500 text-[10px] shrink-0 ml-2">TTL: {ans.ttl}s</span>
                        </div>
                      ))
                    ) : (
                      <span className="text-gray-500 text-xs italic">{t.diagnosticsView.emptyRecords}</span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* 2. Ping Results View */}
          {activeTab === 'ping' && result.samples && (
            <div className="space-y-4">
              {/* Summary Stats */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-3.5 rounded-xl bg-gray-950 border border-gray-850 text-center">
                  <span className="text-[11px] text-gray-400 block">Min RTT</span>
                  <span className="text-base font-bold font-mono text-emerald-400">{result.stats?.min} ms</span>
                </div>
                <div className="p-3.5 rounded-xl bg-gray-950 border border-gray-850 text-center">
                  <span className="text-[11px] text-gray-400 block">Avg RTT</span>
                  <span className="text-base font-bold font-mono text-cyan-400">{result.stats?.avg} ms</span>
                </div>
                <div className="p-3.5 rounded-xl bg-gray-950 border border-gray-850 text-center">
                  <span className="text-[11px] text-gray-400 block">Max RTT</span>
                  <span className="text-base font-bold font-mono text-amber-400">{result.stats?.max} ms</span>
                </div>
                <div className="p-3.5 rounded-xl bg-gray-950 border border-gray-850 text-center">
                  <span className="text-[11px] text-gray-400 block">Packet Loss</span>
                  <span className={`text-base font-bold font-mono ${result.packetLossPercent === 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                    {result.packetLossPercent}%
                  </span>
                </div>
              </div>

              {/* Sample Packets Table */}
              <div className="rounded-xl border border-gray-800 overflow-hidden font-mono text-xs">
                <table className="w-full text-left">
                  <thead className="bg-gray-950 text-gray-400 text-[10px] uppercase">
                    <tr>
                      <th className="py-2.5 px-4">#</th>
                      <th className="py-2.5 px-4">Latency (RTT)</th>
                      <th className="py-2.5 px-4">HTTP Status</th>
                      <th className="py-2.5 px-4">Server</th>
                      <th className="py-2.5 px-4">CF-Ray</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-850 bg-gray-900/60">
                    {result.samples.map((s: any) => (
                      <tr key={s.sequence} className="hover:bg-gray-850/50">
                        <td className="py-2.5 px-4 text-gray-500">#{s.sequence}</td>
                        <td className="py-2.5 px-4 font-bold text-gray-200">{s.time} ms</td>
                        <td className="py-2.5 px-4">
                          {s.error ? (
                            <span className="text-rose-400">{s.error}</span>
                          ) : (
                            <span className="px-2 py-0.5 rounded bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 text-[10px] font-bold">
                              {s.status} {s.statusText}
                            </span>
                          )}
                        </td>
                        <td className="py-2.5 px-4 text-gray-400">{s.server || 'Cloudflare'}</td>
                        <td className="py-2.5 px-4 text-gray-400 truncate max-w-[120px]">{s.cfRay || '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* 3. TCP Port Tester (Telnet) */}
          {activeTab === 'tcp' && result.ports && (
            <div className="space-y-4">
              <span className="text-xs font-bold text-gray-300 block">{t.diagnosticsView.tcpPortsTitle}</span>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                {result.ports.map((p: any) => (
                  <div
                    key={p.port}
                    className={`p-4 rounded-xl border flex flex-col justify-between ${
                      p.open
                        ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                        : 'bg-gray-950 border-gray-850 text-gray-400'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-bold font-mono text-white">Port {p.port}</span>
                      <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full font-bold uppercase ${
                        p.open ? 'bg-emerald-500/20 text-emerald-400' : 'bg-rose-500/20 text-rose-400'
                      }`}>
                        {p.open ? 'OPEN' : 'CLOSED'}
                      </span>
                    </div>
                    <div className="text-xs space-y-1 font-mono">
                      <div className="flex justify-between text-gray-400">
                        <span>Service:</span>
                        <span className="text-gray-200">{p.service}</span>
                      </div>
                      <div className="flex justify-between text-gray-400">
                        <span>Handshake RTT:</span>
                        <span className="text-gray-200">{p.rttMs} ms</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 4. IP & ASN Intelligence */}
          {activeTab === 'ip' && result.details && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 rounded-xl bg-gray-950 border border-gray-850 space-y-2 text-xs font-mono">
                  <span className="text-gray-500 block uppercase font-bold text-[10px]">Địa chỉ IP & Cloud Status</span>
                  <div className="text-sm font-bold text-white">{result.details.ip}</div>
                  <div className="pt-2">
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${
                      result.details.isCloudflareProxy
                        ? 'bg-orange-500/15 text-orange-400 border-orange-500/30'
                        : 'bg-cyan-500/15 text-cyan-400 border-cyan-500/30'
                    }`}>
                      {result.details.isCloudflareProxy ? <Cloud className="w-3.5 h-3.5 fill-current" /> : <Server className="w-3.5 h-3.5" />}
                      <span>{result.details.cloudStatus}</span>
                    </span>
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-gray-950 border border-gray-850 space-y-2 text-xs font-mono">
                  <span className="text-gray-500 block uppercase font-bold text-[10px]">Tổ chức & ASN (Network Autonomous System)</span>
                  <div className="text-sm font-bold text-white">{result.details.org || 'Cloudflare, Inc.'}</div>
                  <div className="text-gray-400">ASN: <span className="text-cyan-400 font-bold">{result.details.asn || 'AS13335'}</span></div>
                </div>
              </div>

              {result.details.country && (
                <div className="p-4 rounded-xl bg-gray-950 border border-gray-850 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs font-mono">
                  <div>
                    <span className="text-gray-500 block">Quốc gia:</span>
                    <span className="text-gray-200 font-semibold">{result.details.country} ({result.details.countryCode})</span>
                  </div>
                  <div>
                    <span className="text-gray-500 block">Thành phố / Vùng:</span>
                    <span className="text-gray-200 font-semibold">{result.details.city || result.details.region || 'Anycast Node'}</span>
                  </div>
                  <div>
                    <span className="text-gray-500 block">Múi giờ:</span>
                    <span className="text-gray-200 font-semibold">{result.details.timezone || 'UTC'}</span>
                  </div>
                  <div>
                    <span className="text-gray-500 block">Postal:</span>
                    <span className="text-gray-200 font-semibold">{result.details.postal || '—'}</span>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* 5. SSL / TLS Inspector */}
          {activeTab === 'ssl' && (
            <div className="space-y-4">
              {result.success ? (
                <div className="space-y-4">
                  <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-between text-xs text-emerald-300">
                    <div className="flex items-center gap-2">
                      <Lock className="w-4 h-4 text-emerald-400" />
                      <span className="font-bold">SSL/TLS Handshake Hợp lệ & Chứng chỉ Đang Hoạt Động</span>
                    </div>
                    <span className="font-mono font-bold bg-emerald-500/20 px-2 py-0.5 rounded text-[11px]">
                      {result.daysRemaining} ngày còn lại
                    </span>
                  </div>

                  <div className="p-4 rounded-xl bg-gray-950 border border-gray-850 grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-mono">
                    <div>
                      <span className="text-gray-500 block">Giao thức TLS Handshake:</span>
                      <span className="text-white font-bold">{result.protocol} ({result.cipher})</span>
                    </div>
                    <div>
                      <span className="text-gray-500 block">Thời gian bắt tay (Handshake RTT):</span>
                      <span className="text-cyan-400 font-bold">{result.rttMs} ms</span>
                    </div>
                    <div>
                      <span className="text-gray-500 block">Nhà phát hành (Issuer):</span>
                      <span className="text-gray-200 font-semibold">{result.issuer?.O || result.issuer?.CN || "Let's Encrypt / Cloudflare"}</span>
                    </div>
                    <div>
                      <span className="text-gray-500 block">Hiệu lực đến (Valid Until):</span>
                      <span className="text-gray-200 font-semibold">{result.validTo}</span>
                    </div>
                  </div>

                  {result.subjectAltNames?.length > 0 && (
                    <div className="p-4 rounded-xl bg-gray-950 border border-gray-850 space-y-2">
                      <span className="text-xs font-bold text-gray-400 uppercase tracking-wider block">Subject Alternative Names (SANs):</span>
                      <div className="flex flex-wrap gap-2">
                        {result.subjectAltNames.map((san: string, idx: number) => (
                          <span key={idx} className="px-2.5 py-1 rounded bg-gray-900 border border-gray-800 text-[11px] font-mono text-gray-300">
                            {san}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-xs text-rose-400">
                  Lỗi bắt tay SSL: {result.error || 'Không thể kết nối qua cổng SSL'}
                </div>
              )}
            </div>
          )}

          {/* 6. Traceroute View */}
          {activeTab === 'traceroute' && result.hops && (
            <div className="space-y-4">
              <span className="text-xs font-bold text-gray-300 block">{t.diagnosticsView.tracerouteTitle}</span>
              <div className="space-y-2 font-mono text-xs">
                {result.hops.map((hop: any) => (
                  <div key={hop.hop} className="flex items-center gap-3 p-3 rounded-xl bg-gray-950 border border-gray-850 hover:border-gray-750 transition-colors">
                    <span className="w-6 h-6 rounded-full bg-gray-850 text-orange-400 flex items-center justify-center font-bold text-[11px] shrink-0">
                      {hop.hop}
                    </span>
                    <div className="flex-1 truncate">
                      <span className="text-white font-bold block truncate">{hop.host}</span>
                      <span className="text-[10px] text-gray-500">{hop.location}</span>
                    </div>
                    <span className="text-cyan-400 shrink-0 text-[11px]">{hop.ip}</span>
                    <span className="text-emerald-400 font-bold shrink-0 text-[11px] bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                      {hop.rtt}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
