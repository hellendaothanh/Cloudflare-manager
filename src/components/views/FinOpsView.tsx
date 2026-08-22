'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useLanguage } from '@/context/LanguageContext';
import { 
  FinOpsCostMetric, 
  FinOpsRecommendation, 
  WorkersUsageMetric, 
  R2StorageMetric, 
  TopEgressDrainEndpoint 
} from '@/app/api/finops/route';
import { 
  DollarSign, 
  TrendingDown, 
  Zap, 
  CheckCircle2, 
  AlertCircle, 
  RefreshCw, 
  Cpu, 
  Database, 
  HardDrive, 
  Layers, 
  Sparkles, 
  ArrowUpRight, 
  Server, 
  Gauge, 
  Activity,
  Workflow
} from 'lucide-react';

export const FinOpsView: React.FC = () => {
  const { selectedZone, authFetch, hasPermission } = useAuth();
  const { t, formatText } = useLanguage();
  const canOptimize = hasPermission('canAutoFix');

  const [activeTab, setActiveTab] = useState<'cache' | 'workersR2'>('cache');
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const [costData, setCostData] = useState<FinOpsCostMetric | null>(null);
  const [recommendations, setRecommendations] = useState<FinOpsRecommendation[]>([]);
  const [workers, setWorkers] = useState<WorkersUsageMetric[]>([]);
  const [r2, setR2] = useState<R2StorageMetric[]>([]);
  const [topDrains, setTopDrains] = useState<TopEgressDrainEndpoint[]>([]);

  const fetchFinOpsData = async () => {
    if (!selectedZone) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/finops?zoneId=${selectedZone.id}&zoneName=${selectedZone.name}`);
      const data = await res.json();
      setCostData(data.cost || null);
      setRecommendations(data.recommendations || []);
      setWorkers(data.workers || []);
      setR2(data.r2 || []);
      setTopDrains(data.topDrains || []);
    } catch (err: any) {
      setNotification({ type: 'error', text: err.message || 'Error loading FinOps telemetry' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFinOpsData();
  }, [selectedZone]);

  const handleApplyRecommendation = async (recId: string) => {
    if (!selectedZone) return;
    setActionLoading(recId);
    try {
      const res = await fetch('/api/finops', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'apply_recommendation',
          zoneId: selectedZone.id,
          zoneName: selectedZone.name,
          recId,
        }),
      });
      const data = await res.json();
      setCostData(data.data.cost);
      setRecommendations(data.data.recommendations);
      setNotification({ type: 'success', text: data.message });
    } catch (err: any) {
      setNotification({ type: 'error', text: err.message || 'Failed to apply recommendation' });
    } finally {
      setActionLoading(null);
    }
  };

  const handleUpdateEgressRate = async (newRate: number) => {
    if (!selectedZone) return;
    try {
      const res = await fetch('/api/finops', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'update_egress_rate',
          zoneId: selectedZone.id,
          zoneName: selectedZone.name,
          egressRate: newRate,
        }),
      });
      const data = await res.json();
      setCostData(data.data.cost);
      setNotification({ type: 'success', text: data.message });
    } catch (err: any) {
      setNotification({ type: 'error', text: err.message || 'Failed to update rate' });
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 rounded-2xl bg-gradient-to-r from-gray-900 via-gray-900/90 to-gray-950 border border-gray-800">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <DollarSign className="w-5 h-5" />
            </span>
            <h1 className="text-xl font-bold text-white tracking-tight">{t.finopsView.title}</h1>
          </div>
          <p className="text-xs text-gray-400">
            {t.finopsView.subtitle}
          </p>
        </div>

        <button
          type="button"
          onClick={fetchFinOpsData}
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
          onClick={() => setActiveTab('cache')}
          className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all flex items-center gap-2 ${
            activeTab === 'cache'
              ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 font-bold'
              : 'text-gray-400 hover:text-gray-200 hover:bg-gray-900'
          }`}
        >
          <TrendingDown className="w-4 h-4" />
          <span>{t.finopsView.tabs.cacheCost}</span>
        </button>

        <button
          onClick={() => setActiveTab('workersR2')}
          className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all flex items-center gap-2 ${
            activeTab === 'workersR2'
              ? 'bg-cyan-500/15 text-cyan-400 border border-cyan-500/30 font-bold'
              : 'text-gray-400 hover:text-gray-200 hover:bg-gray-900'
          }`}
        >
          <Cpu className="w-4 h-4" />
          <span>{t.finopsView.tabs.workersR2}</span>
          <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-cyan-500/20 text-cyan-300 font-bold">
            $0 EGRESS
          </span>
        </button>
      </div>

      {/* ========================================================================= */}
      {/* TAB 1: CACHE HIT-RATIO & EGRESS COST SAVINGS                             */}
      {/* ========================================================================= */}
      {activeTab === 'cache' && costData && (
        <div className="space-y-6">
          {/* 4 Top KPI Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* KPI 1: Hit Ratio */}
            <div className="p-5 rounded-2xl bg-gray-900/70 border border-gray-800 space-y-2">
              <div className="flex items-center justify-between text-gray-400 text-xs">
                <span>{t.finopsView.cacheSection.hitRatioTitle}</span>
                <Gauge className="w-4 h-4 text-emerald-400" />
              </div>
              <div className="text-2xl font-extrabold text-white font-mono flex items-baseline gap-1">
                <span>{costData.cacheHitRatioPercent}%</span>
                <span className="text-xs text-emerald-400 font-sans font-bold">HIT</span>
              </div>
              {/* Hit / Miss Ratio Progress Bar */}
              <div className="w-full bg-gray-800 h-2 rounded-full overflow-hidden flex">
                <div 
                  className="bg-emerald-500 h-full transition-all duration-500" 
                  style={{ width: `${costData.cacheHitRatioPercent}%` }} 
                />
                <div 
                  className="bg-amber-500 h-full transition-all duration-500" 
                  style={{ width: `${100 - costData.cacheHitRatioPercent}%` }} 
                />
              </div>
            </div>

            {/* KPI 2: Egress Saved USD */}
            <div className="p-5 rounded-2xl bg-gray-900/70 border border-gray-800 space-y-2">
              <div className="flex items-center justify-between text-gray-400 text-xs">
                <span>{t.finopsView.cacheSection.egressSavedTitle}</span>
                <TrendingDown className="w-4 h-4 text-emerald-400" />
              </div>
              <div className="text-2xl font-extrabold text-emerald-400 font-mono">
                ${costData.estimatedEgressCostSavedUsd.toLocaleString()}
              </div>
              <p className="text-[11px] text-gray-400 font-mono">
                {costData.cachedBandwidthGb.toLocaleString()} GB served from Edge
              </p>
            </div>

            {/* KPI 3: Egress Paid to Origin */}
            <div className="p-5 rounded-2xl bg-gray-900/70 border border-gray-800 space-y-2">
              <div className="flex items-center justify-between text-gray-400 text-xs">
                <span>{t.finopsView.cacheSection.egressPaidTitle}</span>
                <DollarSign className="w-4 h-4 text-amber-400" />
              </div>
              <div className="text-2xl font-extrabold text-amber-300 font-mono">
                ${costData.estimatedOriginCostPaidUsd.toLocaleString()}
              </div>
              <p className="text-[11px] text-gray-400 font-mono">
                {costData.originBandwidthGb.toLocaleString()} GB pulled from Origin
              </p>
            </div>

            {/* KPI 4: Egress Rate Settings */}
            <div className="p-5 rounded-2xl bg-gray-900/70 border border-gray-800 space-y-2">
              <div className="flex items-center justify-between text-gray-400 text-xs">
                <span>{t.finopsView.cacheSection.egressRateLabel}</span>
                <Workflow className="w-4 h-4 text-cyan-400" />
              </div>
              <div className="flex items-center gap-2 pt-1">
                <select
                  value={costData.originEgressRatePerGb}
                  onChange={(e) => handleUpdateEgressRate(parseFloat(e.target.value))}
                  className="w-full bg-gray-950 border border-gray-800 rounded-xl px-3 py-1.5 text-xs text-cyan-400 font-mono font-bold focus:outline-none"
                >
                  <option value={0.09}>AWS EC2 Standard ($0.09 / GB)</option>
                  <option value={0.08}>GCP Network Egress ($0.08 / GB)</option>
                  <option value={0.087}>Azure Internet Egress ($0.087 / GB)</option>
                  <option value={0.05}>Discounted / Custom ($0.05 / GB)</option>
                </select>
              </div>
            </div>
          </div>

          {/* Recommendations Engine */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-amber-400" />
                  {formatText(t.finopsView.cacheSection.recommendationsTitle, { count: recommendations.length })}
                </h3>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {recommendations.map((rec) => (
                <div
                  key={rec.id}
                  className={`p-5 rounded-2xl border flex flex-col justify-between transition-all ${
                    rec.applied
                      ? 'bg-emerald-950/10 border-emerald-500/30'
                      : 'bg-gray-900/70 border-gray-800 hover:border-gray-700'
                  }`}
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded ${
                        rec.impact === 'HIGH'
                          ? 'bg-rose-500/20 text-rose-300'
                          : 'bg-amber-500/20 text-amber-300'
                      }`}>
                        {rec.impact} SAVINGS IMPACT
                      </span>

                      <span className="text-xs font-mono font-bold text-emerald-400">
                        +${rec.potentialMonthlySavingsUsd}/mo
                      </span>
                    </div>

                    <h4 className="text-xs font-bold text-white">{rec.title}</h4>
                    <p className="text-[11px] text-gray-400 leading-relaxed">{rec.description}</p>
                  </div>

                  <div className="pt-4 mt-3 border-t border-gray-800/80 flex items-center justify-between">
                    <span className="text-[10px] text-gray-500 font-mono uppercase">
                      {rec.category.replace(/_/g, ' ')}
                    </span>

                    {rec.applied ? (
                      <span className="flex items-center gap-1 text-[11px] text-emerald-400 font-bold">
                        <CheckCircle2 className="w-4 h-4" />
                        <span>{t.finopsView.cacheSection.appliedBadge}</span>
                      </span>
                    ) : (
                      <button
                        type="button"
                        onClick={() => handleApplyRecommendation(rec.id)}
                        disabled={actionLoading === rec.id || !canOptimize}
                        className="px-3.5 py-1.5 rounded-xl bg-orange-500 hover:bg-orange-600 text-white text-xs font-bold transition-all shadow-md shadow-orange-500/20 flex items-center gap-1.5 cursor-pointer"
                      >
                        <Zap className={`w-3.5 h-3.5 ${actionLoading === rec.id ? 'animate-spin' : ''}`} />
                        <span>{t.finopsView.cacheSection.btnApplyRec}</span>
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Top Egress Drain Endpoints Matrix */}
          <div className="rounded-2xl border border-gray-800 bg-gray-900/60 overflow-hidden shadow-xl">
            <div className="px-5 py-3.5 bg-gray-950/80 border-b border-gray-800 flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs font-bold text-white">
                <Layers className="w-4 h-4 text-orange-400" />
                <span>{t.finopsView.cacheSection.topDrainsTitle}</span>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-gray-950/40 border-b border-gray-800 text-gray-400 uppercase font-semibold text-[10px]">
                  <tr>
                    <th className="py-3 px-4">Endpoint / URI Path</th>
                    <th className="py-3 px-4">Cache Hit Ratio</th>
                    <th className="py-3 px-4">Bandwidth Pulled</th>
                    <th className="py-3 px-4">Origin Cost ($)</th>
                    <th className="py-3 px-4">Suggested FinOps Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-850 font-mono">
                  {topDrains.map((item, idx) => (
                    <tr key={idx} className="hover:bg-gray-850/50">
                      <td className="py-3 px-4 font-bold text-white truncate max-w-xs">{item.path}</td>
                      <td className="py-3 px-4">
                        <span className={`font-bold ${item.hitRatioPercent > 70 ? 'text-emerald-400' : 'text-amber-400'}`}>
                          {item.hitRatioPercent}%
                        </span>
                      </td>
                      <td className="py-3 px-4 text-gray-300">{item.bandwidthGb} GB</td>
                      <td className="py-3 px-4 font-bold text-rose-400">${item.originCostUsd}</td>
                      <td className="py-3 px-4 text-gray-400 font-sans text-[11px]">{item.suggestedAction}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: WORKERS CPU & R2 OBJECT STORAGE INSIGHTS                           */}
      {/* ========================================================================= */}
      {activeTab === 'workersR2' && (
        <div className="space-y-6">
          {/* Workers Section */}
          <div className="space-y-3">
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Cpu className="w-4 h-4 text-cyan-400" />
                {t.finopsView.workersR2Section.workersTitle}
              </h3>
              <p className="text-xs text-gray-400">
                {t.finopsView.workersR2Section.workersSubtitle}
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {workers.map((w, idx) => (
                <div key={idx} className="p-5 rounded-2xl bg-gray-900/70 border border-gray-800 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-white font-mono truncate max-w-[180px]">{w.scriptName}</span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyan-500/15 text-cyan-400 font-bold uppercase">
                      {w.usageTier}
                    </span>
                  </div>

                  <div className="space-y-1.5 text-xs font-mono text-gray-400">
                    <div className="flex justify-between">
                      <span>Total Invocations:</span>
                      <strong className="text-white">{w.invocations.toLocaleString()}</strong>
                    </div>
                    <div className="flex justify-between">
                      <span>Avg CPU Wall-Time:</span>
                      <strong className="text-cyan-400">{w.avgCpuTimeMs} ms</strong>
                    </div>
                    <div className="flex justify-between">
                      <span>p95 Tail Latency:</span>
                      <strong className="text-amber-400">{w.p95CpuTimeMs} ms</strong>
                    </div>
                    <div className="flex justify-between pt-2 border-t border-gray-800">
                      <span>Est. Monthly Cost:</span>
                      <strong className="text-emerald-400 font-bold">${w.estimatedCostUsd}/mo</strong>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* R2 Object Storage Section */}
          <div className="space-y-3 pt-4">
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <HardDrive className="w-4 h-4 text-orange-400" />
                {t.finopsView.workersR2Section.r2Title}
              </h3>
              <p className="text-xs text-gray-400">
                {t.finopsView.workersR2Section.r2Subtitle}
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {r2.map((bucket, idx) => (
                <div key={idx} className="p-5 rounded-2xl bg-gray-900/70 border border-gray-800 space-y-4">
                  <div className="flex items-center justify-between border-b border-gray-800/80 pb-3">
                    <span className="text-xs font-bold text-white font-mono">{bucket.bucketName}</span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/15 text-emerald-400 font-bold">
                      {bucket.storageSizeGb.toLocaleString()} GB STORED
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-3 text-xs font-mono text-gray-400">
                    <div>
                      <span className="text-[10px] block">Class A Ops (Write):</span>
                      <strong className="text-white">{bucket.classARequests.toLocaleString()}</strong>
                    </div>
                    <div>
                      <span className="text-[10px] block">Class B Ops (Read):</span>
                      <strong className="text-white">{bucket.classBRequests.toLocaleString()}</strong>
                    </div>
                    <div>
                      <span className="text-[10px] block">Egress Bandwidth:</span>
                      <strong className="text-cyan-400">{bucket.egressBandwidthGb.toLocaleString()} GB</strong>
                    </div>
                    <div>
                      <span className="text-[10px] block">R2 Monthly Cost:</span>
                      <strong className="text-emerald-400 font-bold">${bucket.r2CostUsd.toFixed(2)}</strong>
                    </div>
                  </div>

                  {/* S3 Cost Comparison Badge */}
                  <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-between text-xs">
                    <div>
                      <span className="text-emerald-300 font-bold block">
                        {t.finopsView.workersR2Section.s3ComparisonTitle}
                      </span>
                      <span className="text-[11px] text-emerald-400/80">
                        AWS S3 Equivalent: ${bucket.awsS3EstimatedEquivalentCostUsd.toFixed(2)}
                      </span>
                    </div>
                    <span className="font-mono font-extrabold text-emerald-400 text-sm">
                      +${bucket.netSavingsUsd.toFixed(2)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
