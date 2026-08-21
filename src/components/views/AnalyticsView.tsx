'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useLanguage } from '@/context/LanguageContext';
import { AnalyticsSummary } from '@/types/cloudflare';
import { 
  BarChart3, 
  Activity, 
  ShieldAlert, 
  HardDrive, 
  Globe2, 
  RefreshCw, 
  Lock 
} from 'lucide-react';
import { formatBytes, formatNumber } from '@/lib/utils';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from 'recharts';

export const AnalyticsView: React.FC = () => {
  const { selectedZone, authFetch } = useAuth();
  const { t, formatText } = useLanguage();
  const [analytics, setAnalytics] = useState<AnalyticsSummary | null>(null);
  const [loading, setLoading] = useState(false);
  const [timeRange, setTimeRange] = useState<number>(24);

  const fetchAnalytics = async () => {
    if (!selectedZone) return;
    setLoading(true);
    try {
      const data = await authFetch(`/api/analytics?zoneId=${selectedZone.id}&hours=${timeRange}`);
      setAnalytics(data);
    } catch (err) {
      console.error('Failed to load analytics:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, [selectedZone, timeRange]);

  if (!analytics && loading) {
    return (
      <div className="p-20 text-center text-gray-500">
        <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-3 text-cyan-400" />
        <span className="text-sm font-medium">{t.common.loading}</span>
      </div>
    );
  }

  if (!analytics) return null;

  const cachedRatio = analytics.requests.total > 0
    ? ((analytics.requests.cached / analytics.requests.total) * 100).toFixed(1)
    : '0';

  const formatPercentage = (val: number, total: number) => {
    if (total === 0) return '0%';
    return `${((val / total) * 100).toFixed(1)}%`;
  };

  const bandwidthSavingsRatio = analytics.bandwidth.total > 0
    ? Math.round((analytics.bandwidth.cached / analytics.bandwidth.total) * 100)
    : 0;

  const statusColors: Record<string, string> = {
    '2xx': '#10B981',
    '3xx': '#38BDF8',
    '4xx': '#F59E0B',
    '5xx': '#F43F5E',
  };

  return (
    <div className="space-y-6">
      {/* Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 rounded-2xl bg-gradient-to-r from-gray-900 via-gray-900/90 to-gray-950 border border-gray-800">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="p-2 rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
              <BarChart3 className="w-5 h-5" />
            </span>
            <h1 className="text-xl font-bold text-white tracking-tight">{t.analyticsView.title}</h1>
          </div>
          <p className="text-xs text-gray-400">
            {formatText(t.analyticsView.subtitle, { zone: selectedZone?.name || 'Zone' })}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 self-start md:self-center">
          <button
            onClick={fetchAnalytics}
            disabled={loading}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gray-900 hover:bg-gray-850 border border-gray-800 text-gray-300 text-xs font-medium transition-all"
            title={t.analyticsView.refreshBtn || t.common.refresh}
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-cyan-400' : ''}`} />
            <span>{t.analyticsView.refreshBtn || t.common.refresh}</span>
          </button>

          {/* Time range selector */}
          <div className="flex items-center gap-1.5 bg-gray-950 p-1 rounded-xl border border-gray-800">
            {[
              { hours: 6, label: '6h' },
              { hours: 24, label: '24h' },
              { hours: 72, label: '72h' },
              { hours: 168, label: '7d' },
            ].map((timeOpt) => (
              <button
                key={timeOpt.hours}
                onClick={() => setTimeRange(timeOpt.hours)}
                className={`px-3 py-1 rounded-lg text-xs font-semibold transition-colors ${
                  timeRange === timeOpt.hours
                    ? 'bg-cyan-500 text-white'
                    : 'text-gray-400 hover:text-gray-200'
                }`}
              >
                {timeOpt.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Requests */}
        <div className="p-5 rounded-2xl bg-gray-900/70 border border-gray-800 relative overflow-hidden">
          <div className="flex items-center justify-between text-gray-400 mb-2">
            <span className="text-xs font-semibold">{t.analyticsView.cards.totalRequests}</span>
            <Activity className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="text-2xl font-extrabold text-white font-mono mb-2">
            {formatNumber(analytics.requests.total)}
          </div>
          <div className="flex items-center justify-between text-[11px] text-gray-400 pt-2 border-t border-gray-800/80">
            <span>{t.analyticsView.cards.cachedRatio}:</span>
            <span className="text-emerald-400 font-semibold font-mono">{cachedRatio}%</span>
          </div>
        </div>

        {/* Bandwidth */}
        <div className="p-5 rounded-2xl bg-gray-900/70 border border-gray-800 relative overflow-hidden">
          <div className="flex items-center justify-between text-gray-400 mb-2">
            <span className="text-xs font-semibold">{t.analyticsView.cards.totalBandwidth}</span>
            <HardDrive className="w-4 h-4 text-blue-400" />
          </div>
          <div className="text-2xl font-extrabold text-white font-mono mb-2">
            {formatBytes(analytics.bandwidth.total)}
          </div>
          <div className="flex items-center justify-between text-[11px] text-gray-400 pt-2 border-t border-gray-800/80">
            <span>{t.analyticsView.cards.originSaved}:</span>
            <span className="text-cyan-400 font-semibold font-mono">{bandwidthSavingsRatio}%</span>
          </div>
        </div>

        {/* Threats Blocked */}
        <div className="p-5 rounded-2xl bg-gray-900/70 border border-gray-800 relative overflow-hidden">
          <div className="flex items-center justify-between text-gray-400 mb-2">
            <span className="text-xs font-semibold">{t.analyticsView.cards.threatsBlocked}</span>
            <ShieldAlert className="w-4 h-4 text-rose-400" />
          </div>
          <div className="text-2xl font-extrabold text-rose-400 font-mono mb-2">
            {formatNumber(analytics.threats.total)}
          </div>
          <div className="flex items-center justify-between text-[11px] text-gray-400 pt-2 border-t border-gray-800/80">
            <span>{t.analyticsView.cards.wafDefense}:</span>
            <span className="text-rose-400 font-semibold font-mono">100% Mitigated</span>
          </div>
        </div>

        {/* SSL / Encrypted */}
        <div className="p-5 rounded-2xl bg-gray-900/70 border border-gray-800 relative overflow-hidden">
          <div className="flex items-center justify-between text-gray-400 mb-2">
            <span className="text-xs font-semibold">HTTPS (SSL/TLS)</span>
            <Lock className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-extrabold text-emerald-400 font-mono mb-2">
            {analytics.requests.total > 0
              ? `${Math.round((analytics.requests.encrypted / analytics.requests.total) * 100)}%`
              : '100%'}
          </div>
          <div className="flex items-center justify-between text-[11px] text-gray-400 pt-2 border-t border-gray-800/80">
            <span>TLS:</span>
            <span className="text-emerald-400 font-semibold font-mono">TLS 1.3 / HTTP/3</span>
          </div>
        </div>
      </div>

      {/* Main Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Requests Timeseries Chart */}
        <div className="lg:col-span-2 p-5 rounded-2xl bg-gray-900/70 border border-gray-800 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold text-white flex items-center gap-2">
              <Activity className="w-4 h-4 text-cyan-400" />
              <span>{t.analyticsView.charts.requestsOverTime}</span>
            </h3>
            <div className="flex items-center gap-3 text-[11px]">
              <span className="flex items-center gap-1 text-cyan-400">
                <span className="w-2 h-2 rounded-full bg-cyan-400" /> Total
              </span>
              <span className="flex items-center gap-1 text-emerald-400">
                <span className="w-2 h-2 rounded-full bg-emerald-400" /> Cached
              </span>
            </div>
          </div>

          <div className="h-64 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={analytics.timeseries} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="totalRequests" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#38BDF8" stopOpacity={0.4}/>
                    <stop offset="95%" stopColor="#38BDF8" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="cachedRequests" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10B981" stopOpacity={0.5}/>
                    <stop offset="95%" stopColor="#10B981" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" />
                <XAxis dataKey="timestamp" stroke="#64748B" fontSize={10} tickLine={false} />
                <YAxis stroke="#64748B" fontSize={10} tickLine={false} tickFormatter={(val) => formatNumber(val)} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0F172A', borderColor: '#334155', borderRadius: '12px', fontSize: '11px' }}
                  itemStyle={{ color: '#F1F5F9' }}
                />
                <Area type="monotone" dataKey="requests" stroke="#38BDF8" strokeWidth={2} fillOpacity={1} fill="url(#totalRequests)" />
                <Area type="monotone" dataKey="cached" stroke="#10B981" strokeWidth={2} fillOpacity={1} fill="url(#cachedRequests)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* HTTP Status Breakdown */}
        <div className="p-5 rounded-2xl bg-gray-900/70 border border-gray-800 space-y-4 flex flex-col justify-between">
          <div>
            <h3 className="text-xs font-bold text-white mb-1">{t.analyticsView.charts.statusDistribution}</h3>
            <p className="text-[11px] text-gray-400">{t.analyticsView.charts.trafficOverTime}</p>
          </div>

          <div className="space-y-3 py-2">
            {Object.entries(analytics.status_codes).map(([status, count]) => {
              const total = analytics.requests.total || 1;
              const pct = Math.round((count / total) * 100);
              const color = statusColors[status] || '#6B7280';

              return (
                <div key={status} className="space-y-1">
                  <div className="flex justify-between text-xs font-mono">
                    <span className="font-bold" style={{ color }}>{status}</span>
                    <span className="text-gray-300">{formatNumber(count)} ({pct}%)</span>
                  </div>
                  <div className="w-full bg-gray-950 h-2 rounded-full overflow-hidden border border-gray-850">
                    <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, backgroundColor: color }} />
                  </div>
                </div>
              );
            })}
          </div>

          <div className="p-3 rounded-xl bg-gray-950 border border-gray-850 text-[11px] text-gray-400 flex items-center justify-between">
            <span>2xx/3xx Ratio:</span>
            <span className="text-emerald-400 font-bold font-mono">
              {Math.round(((analytics.status_codes['2xx'] + analytics.status_codes['3xx']) / (analytics.requests.total || 1)) * 100)}%
            </span>
          </div>
        </div>
      </div>

      {/* Threats Detail Breakdown */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Top Attacking Countries */}
        <div className="p-5 rounded-2xl bg-gray-900/70 border border-gray-800 space-y-3">
          <h3 className="text-xs font-bold text-white flex items-center gap-2">
            <Globe2 className="w-4 h-4 text-rose-400" />
            <span>{t.analyticsView.charts.topCountries}</span>
          </h3>

          <div className="space-y-2 pt-1">
            {analytics.threats.top_countries?.map((c, idx) => (
              <div key={idx} className="flex items-center justify-between p-2.5 rounded-xl bg-gray-950 border border-gray-850 text-xs">
                <span className="text-gray-300 font-medium">{c.name}</span>
                <span className="font-mono text-rose-400 font-bold">{formatNumber(c.count)} threats</span>
              </div>
            )) || <span className="text-xs text-gray-500">—</span>}
          </div>
        </div>

        {/* Top Threat Vectors */}
        <div className="p-5 rounded-2xl bg-gray-900/70 border border-gray-800 space-y-3">
          <h3 className="text-xs font-bold text-white flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 text-amber-400" />
            <span>{t.analyticsView.charts.threatsOverTime}</span>
          </h3>

          <div className="space-y-2 pt-1">
            {analytics.threats.top_types?.map((itemType, idx) => (
              <div key={idx} className="flex items-center justify-between p-2.5 rounded-xl bg-gray-950 border border-gray-850 text-xs">
                <span className="text-gray-300 font-medium">{itemType.name}</span>
                <span className="font-mono text-amber-400 font-bold">{formatNumber(itemType.count)} blocked</span>
              </div>
            )) || <span className="text-xs text-gray-500">—</span>}
          </div>
        </div>
      </div>
    </div>
  );
};
