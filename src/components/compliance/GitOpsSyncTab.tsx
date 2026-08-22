'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useLanguage } from '@/context/LanguageContext';
import { GitOpsConfig, GitOpsCommitLog } from '@/app/api/gitops/route';
import { 
  GitBranch, 
  GitCommit, 
  GitPullRequest, 
  RefreshCw, 
  Send, 
  ExternalLink, 
  CheckCircle2, 
  Clock, 
  ShieldCheck, 
  Code2, 
  Check, 
  Copy, 
  ArrowUpRight, 
  AlertCircle,
  FileCode,
  Layers,
  Settings
} from 'lucide-react';

export const GitOpsSyncTab: React.FC = () => {
  const { selectedZone, authFetch } = useAuth();
  const { t, formatText } = useLanguage();

  const [config, setConfig] = useState<GitOpsConfig | null>(null);
  const [logs, setLogs] = useState<GitOpsCommitLog[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    provider: 'github' as 'github' | 'gitlab' | 'gitea' | 'custom',
    repoUrl: '',
    branch: 'main',
    syncMode: 'pr_review' as 'direct_commit' | 'pr_review',
    autoSyncOnMutation: true,
  });

  const fetchGitOpsData = async () => {
    if (!selectedZone) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/gitops?zoneId=${selectedZone.id}&zoneName=${selectedZone.name}`);
      const data = await res.json();
      setConfig(data.config);
      setLogs(data.logs || []);
      if (data.config) {
        setFormData({
          provider: data.config.provider || 'github',
          repoUrl: data.config.repoUrl || '',
          branch: data.config.branch || 'main',
          syncMode: data.config.syncMode || 'pr_review',
          autoSyncOnMutation: data.config.autoSyncOnMutation ?? true,
        });
      }
    } catch (err: any) {
      setNotification({ type: 'error', text: err.message || 'Error fetching GitOps configuration' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGitOpsData();
  }, [selectedZone]);

  const handleSaveConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedZone) return;
    setSaving(true);
    try {
      const res = await fetch('/api/gitops', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'save_config',
          zoneId: selectedZone.id,
          zoneName: selectedZone.name,
          config: formData,
        }),
      });
      const data = await res.json();
      setConfig(data.config);
      setNotification({ type: 'success', text: t.complianceView.messages.gitopsSaved });
    } catch (err: any) {
      setNotification({ type: 'error', text: err.message || 'Error saving configuration' });
    } finally {
      setSaving(false);
    }
  };

  const handlePushCommit = async () => {
    if (!selectedZone) return;
    setActionLoading('push');
    try {
      const res = await fetch('/api/gitops', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'push_commit',
          zoneId: selectedZone.id,
          zoneName: selectedZone.name,
          commitMessage: `chore(cf-sync): automated Terraform & JSON sync for ${selectedZone.name}`,
        }),
      });
      const data = await res.json();
      setNotification({ type: 'success', text: data.message });
      fetchGitOpsData();
    } catch (err: any) {
      setNotification({ type: 'error', text: err.message || 'Push commit failed' });
    } finally {
      setActionLoading(null);
    }
  };

  const handleCreatePR = async () => {
    if (!selectedZone) return;
    setActionLoading('pr');
    try {
      const res = await fetch('/api/gitops', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'create_pr',
          zoneId: selectedZone.id,
          zoneName: selectedZone.name,
          prTitle: `feat(cf-change): proposed edge infrastructure update for ${selectedZone.name}`,
        }),
      });
      const data = await res.json();
      setNotification({ type: 'success', text: data.message });
      fetchGitOpsData();
    } catch (err: any) {
      setNotification({ type: 'error', text: err.message || 'PR creation failed' });
    } finally {
      setActionLoading(null);
    }
  };

  const handleSyncFromGit = async () => {
    if (!selectedZone) return;
    setActionLoading('sync');
    try {
      const res = await fetch('/api/gitops', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'sync_from_git',
          zoneId: selectedZone.id,
          zoneName: selectedZone.name,
        }),
      });
      const data = await res.json();
      setNotification({ type: 'success', text: data.message });
      fetchGitOpsData();
    } catch (err: any) {
      setNotification({ type: 'error', text: err.message || 'Git sync failed' });
    } finally {
      setActionLoading(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Info */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-gray-800 pb-4">
        <div>
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <GitBranch className="w-5 h-5 text-cyan-400" />
            {t.complianceView.gitopsSection.title}
          </h2>
          <p className="text-xs text-gray-400 mt-0.5">
            {t.complianceView.gitopsSection.subtitle}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={fetchGitOpsData}
            disabled={loading}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gray-900 border border-gray-800 hover:border-gray-700 text-xs text-gray-300 transition-colors"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>{t.common.refresh}</span>
          </button>
        </div>
      </div>

      {/* Notification */}
      {notification && (
        <div className={`p-4 rounded-xl text-xs flex items-center gap-3 ${
          notification.type === 'success' ? 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-300' : 'bg-rose-500/10 border border-rose-500/30 text-rose-400'
        }`}>
          {notification.type === 'success' ? <CheckCircle2 className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
          <span>{notification.text}</span>
        </div>
      )}

      {/* Main Grid: Config Form & Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Configuration Form */}
        <form onSubmit={handleSaveConfig} className="lg:col-span-7 p-5 rounded-2xl bg-gray-900/70 border border-gray-800 space-y-4">
          <div className="flex items-center justify-between border-b border-gray-800/80 pb-3">
            <span className="text-xs font-bold text-white flex items-center gap-2">
              <Settings className="w-4 h-4 text-orange-400" />
              {t.complianceView.gitopsSection.repoConfigTitle}
            </span>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyan-500/15 text-cyan-400 border border-cyan-500/30">
              {formData.provider.toUpperCase()}
            </span>
          </div>

          <div className="space-y-3.5 text-xs">
            <div>
              <label className="block text-gray-400 font-semibold mb-1">
                {t.complianceView.gitopsSection.repoUrlLabel}
              </label>
              <input
                type="text"
                value={formData.repoUrl}
                onChange={(e) => setFormData({ ...formData, repoUrl: e.target.value })}
                placeholder="https://github.com/org/repo-infra"
                className="w-full bg-gray-950 border border-gray-800 rounded-xl px-3 py-2 text-xs text-white font-mono focus:outline-none focus:border-orange-500"
                required
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-gray-400 font-semibold mb-1">
                  {t.complianceView.gitopsSection.branchLabel}
                </label>
                <input
                  type="text"
                  value={formData.branch}
                  onChange={(e) => setFormData({ ...formData, branch: e.target.value })}
                  placeholder="main"
                  className="w-full bg-gray-950 border border-gray-800 rounded-xl px-3 py-2 text-xs text-white font-mono focus:outline-none focus:border-orange-500"
                  required
                />
              </div>

              <div>
                <label className="block text-gray-400 font-semibold mb-1">
                  {t.complianceView.gitopsSection.providerLabel}
                </label>
                <select
                  value={formData.provider}
                  onChange={(e) => setFormData({ ...formData, provider: e.target.value as any })}
                  className="w-full bg-gray-950 border border-gray-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-orange-500"
                >
                  <option value="github">GitHub</option>
                  <option value="gitlab">GitLab</option>
                  <option value="gitea">Gitea</option>
                  <option value="custom">Custom Git Server</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-gray-400 font-semibold mb-1.5">
                {t.complianceView.gitopsSection.syncModeLabel}
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, syncMode: 'direct_commit' })}
                  className={`p-3 rounded-xl text-left border transition-all ${
                    formData.syncMode === 'direct_commit'
                      ? 'bg-orange-500/15 border-orange-500/40 text-orange-300'
                      : 'bg-gray-950 border-gray-850 text-gray-400 hover:text-white'
                  }`}
                >
                  <div className="flex items-center gap-2 mb-1 font-bold text-xs">
                    <GitCommit className="w-3.5 h-3.5" />
                    <span>Direct Commit</span>
                  </div>
                  <span className="text-[11px] opacity-80 block leading-tight">
                    {t.complianceView.gitopsSection.modeDirect}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, syncMode: 'pr_review' })}
                  className={`p-3 rounded-xl text-left border transition-all ${
                    formData.syncMode === 'pr_review'
                      ? 'bg-cyan-500/15 border-cyan-500/40 text-cyan-300'
                      : 'bg-gray-950 border-gray-850 text-gray-400 hover:text-white'
                  }`}
                >
                  <div className="flex items-center gap-2 mb-1 font-bold text-xs">
                    <GitPullRequest className="w-3.5 h-3.5" />
                    <span>PR Review Gate</span>
                  </div>
                  <span className="text-[11px] opacity-80 block leading-tight">
                    {t.complianceView.gitopsSection.modePr}
                  </span>
                </button>
              </div>
            </div>

            <div className="pt-2">
              <label className="flex items-center gap-2 text-xs text-gray-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.autoSyncOnMutation}
                  onChange={(e) => setFormData({ ...formData, autoSyncOnMutation: e.target.checked })}
                  className="rounded border-gray-800 text-orange-500 focus:ring-0 bg-gray-950 w-4 h-4"
                />
                <span>{t.complianceView.gitopsSection.autoSyncLabel}</span>
              </label>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                type="submit"
                disabled={saving}
                className="px-4 py-2 rounded-xl bg-orange-500 hover:bg-orange-600 text-white text-xs font-bold transition-all shadow-md shadow-orange-500/20 disabled:opacity-50"
              >
                {saving ? t.common.saving : t.complianceView.gitopsSection.saveConfigBtn}
              </button>
            </div>
          </div>
        </form>

        {/* Right: Quick Action Hub */}
        <div className="lg:col-span-5 space-y-4">
          <div className="p-5 rounded-2xl bg-gray-900/70 border border-gray-800 space-y-4">
            <span className="text-xs font-bold text-white block">
              Trình Điều Khiển GitOps Tức Thời (Trigger Actions)
            </span>

            <div className="space-y-2.5">
              <button
                type="button"
                onClick={handlePushCommit}
                disabled={actionLoading !== null}
                className="w-full flex items-center justify-between p-3 rounded-xl bg-gray-950 border border-gray-800 hover:border-gray-700 text-left transition-colors group cursor-pointer"
              >
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-lg bg-orange-500/15 text-orange-400 group-hover:bg-orange-500 group-hover:text-white transition-colors">
                    <GitCommit className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-xs font-bold text-white block">
                      {t.complianceView.gitopsSection.pushNowBtn}
                    </span>
                    <span className="text-[10px] text-gray-400">Push Terraform HCL & JSON snapshot</span>
                  </div>
                </div>
                {actionLoading === 'push' && <RefreshCw className="w-4 h-4 animate-spin text-orange-400" />}
              </button>

              <button
                type="button"
                onClick={handleCreatePR}
                disabled={actionLoading !== null}
                className="w-full flex items-center justify-between p-3 rounded-xl bg-gray-950 border border-gray-800 hover:border-gray-700 text-left transition-colors group cursor-pointer"
              >
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-lg bg-cyan-500/15 text-cyan-400 group-hover:bg-cyan-500 group-hover:text-white transition-colors">
                    <GitPullRequest className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-xs font-bold text-white block">
                      {t.complianceView.gitopsSection.createPrBtn}
                    </span>
                    <span className="text-[10px] text-gray-400">Tạo PR review diff trước khi apply</span>
                  </div>
                </div>
                {actionLoading === 'pr' && <RefreshCw className="w-4 h-4 animate-spin text-cyan-400" />}
              </button>

              <button
                type="button"
                onClick={handleSyncFromGit}
                disabled={actionLoading !== null}
                className="w-full flex items-center justify-between p-3 rounded-xl bg-gray-950 border border-gray-800 hover:border-gray-700 text-left transition-colors group cursor-pointer"
              >
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-lg bg-emerald-500/15 text-emerald-400 group-hover:bg-emerald-500 group-hover:text-white transition-colors">
                    <RefreshCw className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-xs font-bold text-white block">
                      {t.complianceView.gitopsSection.syncFromGitBtn}
                    </span>
                    <span className="text-[10px] text-gray-400">Đọc cấu hình từ Git apply vào Cloudflare</span>
                  </div>
                </div>
                {actionLoading === 'sync' && <RefreshCw className="w-4 h-4 animate-spin text-emerald-400" />}
              </button>
            </div>
          </div>

          {/* Sync Status Badge */}
          {config && (
            <div className="p-4 rounded-xl bg-gray-950 border border-gray-850 space-y-2 text-xs font-mono">
              <div className="flex justify-between text-gray-400">
                <span>Last Commit:</span>
                <span className="text-cyan-400 font-bold">{config.lastCommitHash || '—'}</span>
              </div>
              <div className="flex justify-between text-gray-400">
                <span>Last Sync:</span>
                <span className="text-gray-200">{config.lastSyncTime ? new Date(config.lastSyncTime).toLocaleTimeString() : 'Never'}</span>
              </div>
              <div className="flex justify-between text-gray-400">
                <span>Status:</span>
                <span className="text-emerald-400 font-bold">100% Synced</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Sync Commit Logs Table */}
      <div className="rounded-2xl border border-gray-800 bg-gray-900/60 overflow-hidden shadow-xl">
        <div className="px-5 py-3.5 bg-gray-950/80 border-b border-gray-800 flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs font-bold text-white">
            <GitCommit className="w-4 h-4 text-orange-400" />
            <span>{formatText(t.complianceView.gitopsSection.historyTitle, { count: logs.length })}</span>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-gray-950/40 border-b border-gray-800 text-gray-400 uppercase font-semibold text-[10px]">
              <tr>
                <th className="py-3 px-4">Commit / PR</th>
                <th className="py-3 px-4">Message</th>
                <th className="py-3 px-4">Author</th>
                <th className="py-3 px-4">Files Changed</th>
                <th className="py-3 px-4">Time</th>
                <th className="py-3 px-4">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-850 font-mono">
              {logs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-6 text-center text-gray-500 font-sans">
                    {t.complianceView.gitopsSection.emptyLogs}
                  </td>
                </tr>
              ) : (
                logs.map((log) => (
                  <tr key={log.id} className="hover:bg-gray-850/50">
                    <td className="py-3 px-4 font-bold">
                      {log.type === 'pull_request' ? (
                        <a
                          href={log.prUrl || '#'}
                          target="_blank"
                          rel="noreferrer"
                          className="flex items-center gap-1.5 text-cyan-400 hover:underline"
                        >
                          <GitPullRequest className="w-3.5 h-3.5" />
                          <span>PR #{log.prNumber}</span>
                          <ArrowUpRight className="w-3 h-3" />
                        </a>
                      ) : (
                        <span className="flex items-center gap-1 text-orange-400">
                          <GitCommit className="w-3.5 h-3.5" />
                          <span>{log.hash}</span>
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-gray-200 max-w-xs truncate font-sans">
                      {log.message}
                    </td>
                    <td className="py-3 px-4 text-gray-400 font-sans">{log.author}</td>
                    <td className="py-3 px-4 text-gray-400 text-[11px]">
                      {log.filesChanged?.join(', ')}
                    </td>
                    <td className="py-3 px-4 text-gray-400 text-[11px]">
                      {new Date(log.timestamp).toLocaleTimeString()}
                    </td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                        log.status === 'applied'
                          ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                          : log.status === 'merged'
                          ? 'bg-purple-500/15 text-purple-400 border border-purple-500/30'
                          : 'bg-cyan-500/15 text-cyan-400 border border-cyan-500/30'
                      }`}>
                        {log.status === 'applied' ? t.complianceView.gitopsSection.statusApplied : log.status === 'merged' ? t.complianceView.gitopsSection.statusMerged : t.complianceView.gitopsSection.statusOpen}
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
  );
};
