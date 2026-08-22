'use client';

import React, { useState, useEffect } from 'react';
import { useLanguage } from '@/context/LanguageContext';
import { DnsRecord } from '@/types/cloudflare';
import { 
  X, 
  RefreshCw, 
  CheckCircle2, 
  AlertCircle, 
  Cloud, 
  CloudOff, 
  Globe, 
  Activity, 
  Check, 
  ShieldCheck, 
  ArrowRight,
  Zap
} from 'lucide-react';

interface DnsRecordTesterModalProps {
  isOpen: boolean;
  onClose: () => void;
  record: DnsRecord | null;
  zoneName: string;
}

export const DnsRecordTesterModal: React.FC<DnsRecordTesterModalProps> = ({
  isOpen,
  onClose,
  record,
  zoneName,
}) => {
  const { t } = useLanguage();
  const [loading, setLoading] = useState(false);
  const [dnsResult, setDnsResult] = useState<any>(null);
  const [tcpResult, setTcpResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const fullDomain = record?.name === '@' || record?.name === zoneName
    ? zoneName
    : record?.name?.includes('.')
      ? record.name
      : `${record?.name}.${zoneName}`;

  const runTest = async () => {
    if (!record) return;
    setLoading(true);
    setError(null);
    try {
      // 1. DNS Lookup query
      const dnsRes = await fetch('/api/diagnostics', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'dns',
          host: fullDomain,
          recordType: record.type,
        }),
      });
      const dnsData = await dnsRes.json();
      setDnsResult(dnsData);

      // 2. TCP Port test (check port 80 or 443 if A or CNAME)
      if (['A', 'AAAA', 'CNAME'].includes(record.type)) {
        const tcpRes = await fetch('/api/diagnostics', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'tcp',
            host: fullDomain,
            port: record.proxied ? 443 : 80,
          }),
        });
        const tcpData = await tcpRes.json();
        setTcpResult(tcpData);
      } else {
        setTcpResult(null);
      }
    } catch (err: any) {
      setError(err.message || 'Error executing test');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen && record) {
      runTest();
    } else {
      setDnsResult(null);
      setTcpResult(null);
      setError(null);
    }
  }, [isOpen, record]);

  if (!isOpen || !record) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl bg-gray-900 border border-gray-850 rounded-2xl shadow-2xl overflow-hidden text-left flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-800 flex items-center justify-between bg-gray-950/60">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-orange-500/15 border border-orange-500/30 text-orange-400">
              <Activity className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">{t.dnsTester.title}</h3>
              <p className="text-xs text-gray-400">{t.dnsTester.subtitle}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-gray-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-5">
          {/* Target Record Info Card */}
          <div className="p-4 rounded-xl bg-gray-950 border border-gray-800 space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
              <div className="flex items-center gap-2 font-mono">
                <span className="px-2 py-0.5 rounded bg-cyan-500/15 text-cyan-400 font-bold border border-cyan-500/30">
                  {record.type}
                </span>
                <span className="font-bold text-white text-sm">{fullDomain}</span>
              </div>
              <div className="flex items-center gap-2">
                {record.proxied ? (
                  <span className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-orange-500/15 text-orange-400 border border-orange-500/30 text-[11px] font-semibold">
                    <Cloud className="w-3.5 h-3.5 fill-current" /> Proxied
                  </span>
                ) : (
                  <span className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-gray-800 text-gray-400 border border-gray-700 text-[11px] font-semibold">
                    <CloudOff className="w-3.5 h-3.5" /> DNS Only
                  </span>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs pt-2 border-t border-gray-850 font-mono">
              <div>
                <span className="text-gray-500 block">{t.dnsTester.expectedContent}</span>
                <span className="text-gray-200 break-all font-semibold">{record.content}</span>
              </div>
              <div>
                <span className="text-gray-500 block">TTL:</span>
                <span className="text-gray-200">{record.ttl === 1 ? 'Auto' : `${record.ttl}s`}</span>
              </div>
            </div>
          </div>

          {/* Test Status Banner */}
          {loading && (
            <div className="p-4 rounded-xl bg-gray-950/80 border border-gray-800 flex items-center justify-center gap-3 text-xs text-orange-400">
              <RefreshCw className="w-4 h-4 animate-spin text-orange-500" />
              <span>{t.dnsTester.testing}</span>
            </div>
          )}

          {error && (
            <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 flex items-center gap-3 text-xs text-rose-400">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {dnsResult && !loading && (
            <div className="space-y-4">
              {/* Cloudflare Proxy vs Direct Origin Status */}
              <div className={`p-3.5 rounded-xl border flex items-center gap-3 ${
                dnsResult.isProxiedByCloudflare
                  ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                  : 'bg-cyan-500/10 border-cyan-500/30 text-cyan-300'
              }`}>
                <ShieldCheck className="w-5 h-5 shrink-0" />
                <div className="text-xs">
                  <span className="font-bold block">
                    {dnsResult.isProxiedByCloudflare
                      ? t.dnsTester.proxyActiveTitle
                      : t.dnsTester.directOriginTitle}
                  </span>
                  <span className="text-[11px] opacity-80">
                    {dnsResult.isProxiedByCloudflare
                      ? t.dnsTester.proxyActiveDesc
                      : t.dnsTester.directOriginDesc}
                  </span>
                </div>
              </div>

              {/* Global Resolvers Table */}
              <div className="space-y-2">
                <span className="text-xs font-bold text-gray-300 block">
                  {t.dnsTester.globalResolvers}
                </span>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {/* Cloudflare 1.1.1.1 */}
                  <div className="p-3.5 rounded-xl bg-gray-950 border border-gray-800 space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <Globe className="w-3.5 h-3.5 text-orange-400" />
                        <span className="font-bold text-white">Cloudflare (1.1.1.1)</span>
                      </div>
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/15 text-emerald-400 font-mono font-bold">
                        {dnsResult.resolvers?.cloudflare?.status}
                      </span>
                    </div>
                    <div className="space-y-1 font-mono text-[11px]">
                      {dnsResult.resolvers?.cloudflare?.answers?.length > 0 ? (
                        dnsResult.resolvers.cloudflare.answers.map((ans: any, i: number) => (
                          <div key={i} className="text-gray-300 bg-gray-900/80 px-2 py-1 rounded border border-gray-850 flex justify-between">
                            <span className="truncate">{ans.data}</span>
                            <span className="text-gray-500 text-[10px]">TTL {ans.ttl}s</span>
                          </div>
                        ))
                      ) : (
                        <span className="text-gray-500 text-xs italic">{t.dnsTester.emptyRecords}</span>
                      )}
                    </div>
                  </div>

                  {/* Google 8.8.8.8 */}
                  <div className="p-3.5 rounded-xl bg-gray-950 border border-gray-850 space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <Globe className="w-3.5 h-3.5 text-blue-400" />
                        <span className="font-bold text-white">Google DNS (8.8.8.8)</span>
                      </div>
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/15 text-emerald-400 font-mono font-bold">
                        {dnsResult.resolvers?.google?.status}
                      </span>
                    </div>
                    <div className="space-y-1 font-mono text-[11px]">
                      {dnsResult.resolvers?.google?.answers?.length > 0 ? (
                        dnsResult.resolvers.google.answers.map((ans: any, i: number) => (
                          <div key={i} className="text-gray-300 bg-gray-900/80 px-2 py-1 rounded border border-gray-850 flex justify-between">
                            <span className="truncate">{ans.data}</span>
                            <span className="text-gray-500 text-[10px]">TTL {ans.ttl}s</span>
                          </div>
                        ))
                      ) : (
                        <span className="text-gray-500 text-xs italic">{t.dnsTester.emptyRecords}</span>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* TCP Port Check (if applicable) */}
              {tcpResult && tcpResult.ports?.length > 0 && (
                <div className="p-4 rounded-xl bg-gray-950 border border-gray-800 space-y-2">
                  <span className="text-xs font-bold text-gray-300 block">
                    {t.dnsTester.portCheckTitle}
                  </span>
                  <div className="flex flex-wrap gap-2">
                    {tcpResult.ports.map((p: any) => (
                      <div
                        key={p.port}
                        className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border text-xs font-mono ${
                          p.open
                            ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
                            : 'bg-rose-500/15 text-rose-400 border-rose-500/30'
                        }`}
                      >
                        <span className="font-bold">{p.service} (Port {p.port}):</span>
                        <span>{p.open ? `Open (${p.rttMs}ms)` : 'Closed / Timeout'}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-800 bg-gray-950 flex items-center justify-between">
          <button
            type="button"
            onClick={runTest}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-orange-500 hover:bg-orange-600 text-white text-xs font-bold transition-all shadow-md shadow-orange-500/20 disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>{t.dnsTester.btnTestAgain}</span>
          </button>

          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-gray-850 hover:bg-gray-800 text-gray-300 text-xs font-semibold transition-all"
          >
            {t.common.close}
          </button>
        </div>
      </div>
    </div>
  );
};
