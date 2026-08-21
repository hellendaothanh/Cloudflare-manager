'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useLanguage } from '@/context/LanguageContext';
import { WorkerScript, PagesProject } from '@/types/cloudflare';
import { 
  Cpu, 
  Layers, 
  GitBranch, 
  Terminal, 
  Key, 
  RefreshCw, 
  Play, 
  Pause, 
  Trash2, 
  ExternalLink, 
  CheckCircle2, 
  AlertCircle, 
  Sparkles,
  Radio,
  FileCode,
  Shield
} from 'lucide-react';

export const WorkersView: React.FC = () => {
  const { activeAccount, authFetch, hasPermission, role } = useAuth();
  const { t, formatText } = useLanguage();
  const canManage = hasPermission('canManageWorkers');

  const [activeSubTab, setActiveSubTab] = useState<'workers' | 'pages' | 'logs'>('workers');
  const [loading, setLoading] = useState(false);
  const [workers, setWorkers] = useState<WorkerScript[]>([]);
  const [pages, setPages] = useState<PagesProject[]>([]);
  const [selectedWorker, setSelectedWorker] = useState<WorkerScript | null>(null);

  // Live log simulation state
  const [isLiveLogActive, setIsLiveLogActive] = useState(true);
  const [logs, setLogs] = useState<Array<{
    id: string;
    timestamp: string;
    level: 'info' | 'warn' | 'error';
    message: string;
    durationMs: number;
    cpuTimeUs: number;
    clientIp: string;
    requestMethod: string;
    requestUrl: string;
    status: number;
  }>>([]);

  const loadData = async () => {
    setLoading(true);
    try {
      const data = await authFetch(`/api/workers?accountId=${activeAccount?.id || 'default'}`);
      if (data.workers) setWorkers(data.workers);
      if (data.pages) setPages(data.pages);
      if (data.workers && data.workers.length > 0 && !selectedWorker) {
        setSelectedWorker(data.workers[0]);
        if (data.workers[0].logTailSample) {
          setLogs(data.workers[0].logTailSample.map((l: any, idx: number) => ({ ...l, id: `log-${Date.now()}-${idx}` })));
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [activeAccount?.id]);

  // Live log simulator generator
  useEffect(() => {
    if (!isLiveLogActive || !selectedWorker) return;

    const interval = setInterval(() => {
      const paths = ['/api/v1/auth/verify', '/v1/data/feed', '/schema.json', '/checkout/sync'];
      const methods = ['GET', 'POST', 'PUT'];
      const randomPath = paths[Math.floor(Math.random() * paths.length)];
      const randomMethod = methods[Math.floor(Math.random() * methods.length)];
      const isErr = Math.random() < 0.15;
      const isWarn = Math.random() < 0.2;

      const newLog = {
        id: 'log-' + Date.now(),
        timestamp: new Date().toLocaleTimeString(),
        level: isErr ? ('error' as const) : isWarn ? ('warn' as const) : ('info' as const),
        message: isErr 
          ? `Worker execution error: unhandled promise rejection in ${randomPath}`
          : isWarn 
          ? `High latency detected on upstream connection (${(Math.random() * 80 + 20).toFixed(1)}ms)`
          : `Handled ${randomMethod} ${randomPath} with Edge Cache execution`,
        durationMs: Number((Math.random() * 8 + 0.5).toFixed(1)),
        cpuTimeUs: Math.floor(Math.random() * 4000 + 400),
        clientIp: `118.69.${Math.floor(Math.random() * 200)}.${Math.floor(Math.random() * 250)}`,
        requestMethod: randomMethod,
        requestUrl: `https://${selectedWorker.name}.security-enterprise.io${randomPath}`,
        status: isErr ? 500 : 200,
      };

      setLogs(prev => [newLog, ...prev.slice(0, 39)]);
    }, 2800);

    return () => clearInterval(interval);
  }, [isLiveLogActive, selectedWorker]);

  return (
    <div className="space-y-6">
      {/* Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 rounded-2xl bg-gradient-to-r from-gray-900 via-gray-900/90 to-gray-950 border border-gray-800">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="p-2 rounded-xl bg-orange-500/10 text-orange-400 border border-orange-500/20">
              <Cpu className="w-5 h-5" />
            </span>
            <h1 className="text-xl font-bold text-white tracking-tight">{t.workersView.title}</h1>
          </div>
          <p className="text-xs text-gray-400">
            {t.workersView.subtitle}
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={loadData}
            disabled={loading}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gray-800 hover:bg-gray-750 text-gray-300 border border-gray-700 text-xs font-semibold transition-all"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>{t.common.refresh}</span>
          </button>
        </div>
      </div>

      {/* Sub-tabs Navigation */}
      <div className="flex items-center gap-2 border-b border-gray-800 pb-2">
        <button
          onClick={() => setActiveSubTab('workers')}
          className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all flex items-center gap-2 ${
            activeSubTab === 'workers'
              ? 'bg-orange-500/15 text-orange-400 border border-orange-500/30'
              : 'text-gray-400 hover:text-gray-200 hover:bg-gray-900'
          }`}
        >
          <FileCode className="w-4 h-4" />
          <span>{t.workersView.tabs.workers} ({workers.length})</span>
        </button>

        <button
          onClick={() => setActiveSubTab('pages')}
          className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all flex items-center gap-2 ${
            activeSubTab === 'pages'
              ? 'bg-cyan-500/15 text-cyan-400 border border-cyan-500/30'
              : 'text-gray-400 hover:text-gray-200 hover:bg-gray-900'
          }`}
        >
          <Layers className="w-4 h-4" />
          <span>{t.workersView.tabs.pages} ({pages.length})</span>
        </button>

        <button
          onClick={() => setActiveSubTab('logs')}
          className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all flex items-center gap-2 ${
            activeSubTab === 'logs'
              ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
              : 'text-gray-400 hover:text-gray-200 hover:bg-gray-900'
          }`}
        >
          <Radio className="w-4 h-4" />
          <span>{t.workersView.tabs.logs}</span>
          {isLiveLogActive && (
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          )}
        </button>
      </div>

      {/* ========================================================================= */}
      {/* SUBTAB 1: WORKERS SCRIPTS                                                 */}
      {/* ========================================================================= */}
      {activeSubTab === 'workers' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* List of Workers */}
          <div className="lg:col-span-1 space-y-3">
            <h2 className="text-xs font-bold uppercase tracking-wider text-gray-400">
              {t.workersView.workersSection.title}
            </h2>
            <div className="space-y-2.5">
              {workers.map((w) => {
                const isSelected = selectedWorker?.id === w.id;
                return (
                  <div
                    key={w.id}
                    onClick={() => setSelectedWorker(w)}
                    className={`p-4 rounded-2xl border cursor-pointer transition-all ${
                      isSelected
                        ? 'bg-gray-900 border-orange-500/50 shadow-lg shadow-orange-500/5 ring-1 ring-orange-500/20'
                        : 'bg-gray-950/70 border-gray-800/80 hover:border-gray-700 hover:bg-gray-900/60'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="font-mono text-xs font-bold text-white truncate">{w.name}</span>
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-orange-500/15 text-orange-400 border border-orange-500/30 font-mono font-bold uppercase">
                        {w.usage_model}
                      </span>
                    </div>
                    <p className="text-[11px] text-gray-400 truncate">
                      {w.routes.length > 0 ? w.routes[0] : t.workersView.workersSection.noRoutes}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Worker Details View */}
          {selectedWorker && (
            <div className="lg:col-span-2 p-5 rounded-2xl bg-gray-900/70 border border-gray-800 space-y-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-gray-800">
                <div>
                  <h3 className="text-base font-bold text-white font-mono">{selectedWorker.name}</h3>
                  <span className="text-xs text-gray-400 font-mono">{t.workersView.workersSection.compatibility} {selectedWorker.compatibility_date || '2024-12-01'}</span>
                </div>

                <button
                  onClick={() => setActiveSubTab('logs')}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-xs font-semibold transition-colors"
                >
                  <Terminal className="w-3.5 h-3.5" />
                  <span>{t.workersView.workersSection.btnViewLogs}</span>
                </button>
              </div>

              {/* Routes */}
              <div className="space-y-2">
                <span className="text-xs font-bold text-gray-300 block">{t.workersView.workersSection.routes}</span>
                <div className="flex flex-wrap gap-2">
                  {selectedWorker.routes.map((r, idx) => (
                    <span key={idx} className="font-mono text-xs px-2.5 py-1 rounded-lg bg-gray-950 border border-gray-800 text-cyan-300">
                      {r}
                    </span>
                  ))}
                </div>
              </div>

              {/* Secrets & Environment Variables */}
              <div className="space-y-2.5">
                <span className="text-xs font-bold text-gray-300 block">
                  {formatText(t.workersView.workersSection.secretsTitle, { count: selectedWorker.secrets?.length || 0 })}
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {selectedWorker.secrets?.map((s, idx) => (
                    <div key={idx} className="p-3 rounded-xl bg-gray-950 border border-gray-850 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Key className="w-3.5 h-3.5 text-amber-400" />
                        <span className="font-mono text-xs font-semibold text-gray-200">{s.name}</span>
                      </div>
                      <span className="text-[10px] uppercase px-1.5 py-0.5 rounded bg-gray-850 text-gray-400 font-mono">
                        {s.type === 'secret_text' ? '🔒 Encrypted' : 'Plaintext'}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Deployments History */}
              <div className="space-y-2.5">
                <span className="text-xs font-bold text-gray-300 block">{t.workersView.workersSection.deployments}</span>
                <div className="space-y-2">
                  {selectedWorker.deployments?.map((d) => (
                    <div key={d.id} className="p-3 rounded-xl bg-gray-950 border border-gray-850 flex items-center justify-between text-xs font-mono">
                      <div className="flex items-center gap-2">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                          d.status === 'active' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-gray-800 text-gray-400'
                        }`}>
                          {d.version}
                        </span>
                        <span className="text-gray-300 font-sans">{d.source}</span>
                      </div>
                      <span className="text-gray-500 text-[11px]">{new Date(d.created_on).toLocaleDateString()}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* SUBTAB 2: PAGES PROJECTS                                                  */}
      {/* ========================================================================= */}
      {activeSubTab === 'pages' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {pages.map((p) => (
              <div key={p.id} className="p-5 rounded-2xl bg-gray-900/70 border border-gray-800 space-y-4">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="text-base font-bold text-white font-mono">{p.name}</h3>
                    <a
                      href={`https://${p.subdomain}`}
                      target="_blank"
                      rel="noreferrer"
                      className="text-xs text-cyan-400 hover:underline flex items-center gap-1 font-mono mt-0.5"
                    >
                      <span>{p.subdomain}</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                  <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-cyan-500/10 text-cyan-400 border border-cyan-500/30">
                    Git Integrated
                  </span>
                </div>

                <div className="space-y-2 py-2 border-y border-gray-800/80 text-xs">
                  <div className="flex justify-between">
                    <span className="text-gray-400">{t.workersView.pagesSection.branch}</span>
                    <span className="font-mono text-gray-200 font-bold">{p.production_branch}</span>
                  </div>
                  <div>
                    <span className="text-gray-400 block mb-1">{t.workersView.pagesSection.domains}</span>
                    <div className="flex flex-wrap gap-1.5">
                      {p.domains.map((d, idx) => (
                        <span key={idx} className="font-mono text-[11px] px-2 py-0.5 rounded bg-gray-950 border border-gray-800 text-gray-300">
                          {d}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                {p.latest_deployment && (
                  <div className="p-3 rounded-xl bg-gray-950 border border-gray-850 space-y-1.5 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-gray-300">{t.workersView.pagesSection.latestDeploy}</span>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-emerald-500/20 text-emerald-400">
                        {t.workersView.pagesSection.statusSuccess}
                      </span>
                    </div>
                    <p className="text-[11px] text-gray-400 italic truncate">
                      "{p.latest_deployment.commit_message}"
                    </p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SUBTAB 3: LIVE LOG TAIL SIMULATOR                                         */}
      {/* ========================================================================= */}
      {activeSubTab === 'logs' && (
        <div className="p-5 rounded-2xl bg-gray-900/70 border border-gray-800 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-base font-bold text-white mb-1">
                {t.workersView.logsSection.title}
              </h2>
              <p className="text-xs text-gray-400">
                {t.workersView.logsSection.subtitle}
              </p>
            </div>

            <div className="flex items-center gap-2">
              <span className={`px-3 py-1 rounded-full text-[10px] font-bold font-mono border flex items-center gap-1.5 ${
                isLiveLogActive ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' : 'bg-gray-800 text-gray-400 border-gray-700'
              }`}>
                <span className={`w-2 h-2 rounded-full ${isLiveLogActive ? 'bg-emerald-400 animate-pulse' : 'bg-gray-500'}`} />
                <span>{isLiveLogActive ? t.workersView.logsSection.liveStatus : t.workersView.logsSection.pausedStatus}</span>
              </span>

              <button
                onClick={() => setIsLiveLogActive(!isLiveLogActive)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gray-800 hover:bg-gray-750 text-gray-200 text-xs font-semibold"
              >
                {isLiveLogActive ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                <span>{isLiveLogActive ? t.workersView.logsSection.btnPause : t.workersView.logsSection.btnResume}</span>
              </button>

              <button
                onClick={() => setLogs([])}
                className="px-3 py-1.5 rounded-xl bg-gray-850 hover:bg-gray-800 text-gray-400 hover:text-white text-xs font-semibold"
              >
                {t.workersView.logsSection.btnClear}
              </button>
            </div>
          </div>

          {/* Terminal Console */}
          <div className="rounded-xl border border-gray-800 bg-gray-950 p-4 font-mono text-xs space-y-2 max-h-[500px] overflow-y-auto">
            {logs.length === 0 ? (
              <div className="p-12 text-center text-gray-500">
                Listening for incoming requests on Cloudflare Edge...
              </div>
            ) : (
              logs.map((log) => (
                <div key={log.id} className="p-2.5 rounded-lg bg-gray-900/60 border border-gray-850 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-2 truncate">
                    <span className="text-gray-500 text-[10px]">{log.timestamp}</span>
                    <span className={`px-1.5 py-0.2 rounded text-[9px] font-bold uppercase ${
                      log.level === 'error' ? 'bg-rose-500/20 text-rose-400' : log.level === 'warn' ? 'bg-amber-500/20 text-amber-400' : 'bg-cyan-500/20 text-cyan-400'
                    }`}>
                      {log.level}
                    </span>
                    <span className="text-gray-200 text-xs truncate">{log.message}</span>
                  </div>

                  <div className="flex items-center gap-3 text-[10px] text-gray-400 shrink-0">
                    <span className="text-cyan-400 font-bold">{log.requestMethod}</span>
                    <span className="text-emerald-400">{log.status}</span>
                    <span>{log.durationMs}ms</span>
                    <span className="text-gray-500">{log.clientIp}</span>
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
