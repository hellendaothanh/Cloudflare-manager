'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useLanguage } from '@/context/LanguageContext';
import { AlertChannelConfig, AlertPlatform, DriftAlertPayload } from '@/lib/alerts/dispatcher';
import { 
  GitBranch, 
  Terminal, 
  Copy, 
  Check, 
  Download, 
  Clock, 
  BellRing, 
  Play, 
  Pause, 
  RefreshCw, 
  Send, 
  Plus, 
  Trash2, 
  AlertTriangle, 
  CheckCircle2, 
  AlertCircle, 
  Code2, 
  ShieldCheck, 
  Flame, 
  Sliders,
  ExternalLink
} from 'lucide-react';

export const ComplianceView: React.FC = () => {
  const { selectedZone, authFetch, hasPermission, role } = useAuth();
  const { t, formatText } = useLanguage();

  const [activeSubTab, setActiveSubTab] = useState<'terraform' | 'cron' | 'alerts'>('terraform');
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // --- 1. Terraform State ---
  const [loadingTf, setLoadingTf] = useState(false);
  const [mainTfCode, setMainTfCode] = useState<string>('');
  const [tfvarsCode, setTfvarsCode] = useState<string>('');
  const [tfActiveFile, setTfActiveFile] = useState<'main.tf' | 'terraform.tfvars'>('main.tf');
  const [copiedTf, setCopiedTf] = useState(false);
  const [tfOptions, setTfOptions] = useState({
    includeDns: true,
    includeWaf: true,
    includeSsl: true,
    includePageRules: true,
    includeZoneSettings: true,
  });

  // --- 2. CRON & Drift State ---
  const [cronEnabled, setCronEnabled] = useState<boolean>(false);
  const [cronIntervalMins, setCronIntervalMins] = useState<number>(60);
  const [lastScanTime, setLastScanTime] = useState<string | null>(null);
  const [nextScanTime, setNextScanTime] = useState<string | null>(null);
  const [isScanning, setIsScanning] = useState<boolean>(false);
  const [scanHistory, setScanHistory] = useState<Array<{
    id: string;
    timestamp: string;
    status: 'passed' | 'drift';
    driftCount: number;
    drifts: Array<{ key: string; oldVal: string; currentVal: string }>;
  }>>([]);

  // --- 3. Alert Channels State ---
  const [channels, setChannels] = useState<AlertChannelConfig[]>([]);
  const [isChannelModalOpen, setIsChannelModalOpen] = useState(false);
  const [testingChannelId, setTestingChannelId] = useState<string | null>(null);
  const [channelForm, setChannelForm] = useState<{
    name: string;
    platform: AlertPlatform;
    webhookUrl: string;
    telegramBotToken: string;
    telegramChatId: string;
    secretHeader: string;
  }>({
    name: '',
    platform: 'slack',
    webhookUrl: '',
    telegramBotToken: '',
    telegramChatId: '',
    secretHeader: '',
  });

  // Load persistence from localStorage
  useEffect(() => {
    try {
      const savedChannels = localStorage.getItem('cf_alert_channels');
      if (savedChannels) {
        setChannels(JSON.parse(savedChannels));
      } else {
        // Default sample channels
        const defaults: AlertChannelConfig[] = [
          {
            id: 'chan_sample_slack',
            name: 'Slack #devsecops-alerts',
            platform: 'slack',
            enabled: false,
            webhookUrl: 'https://hooks.slack.com/services/EXAMPLE/SAMPLE/WEBHOOK',
          },
          {
            id: 'chan_sample_discord',
            name: 'Discord Security Channel',
            platform: 'discord',
            enabled: false,
            webhookUrl: 'https://discord.com/api/webhooks/EXAMPLE/SAMPLE',
          },
        ];
        setChannels(defaults);
        localStorage.setItem('cf_alert_channels', JSON.stringify(defaults));
      }

      const savedCron = localStorage.getItem('cf_cron_config');
      if (savedCron) {
        const parsed = JSON.parse(savedCron);
        setCronEnabled(parsed.enabled ?? false);
        setCronIntervalMins(parsed.interval ?? 60);
        setLastScanTime(parsed.lastScan || null);
        setNextScanTime(parsed.nextScan || null);
        setScanHistory(parsed.history || []);
      }
    } catch (e) {
      console.error(e);
    }
  }, []);

  // Save Channels to localStorage
  const saveChannelsToStorage = (updated: AlertChannelConfig[]) => {
    setChannels(updated);
    localStorage.setItem('cf_alert_channels', JSON.stringify(updated));
  };

  // Save CRON to localStorage
  const saveCronToStorage = (
    enabled: boolean,
    interval: number,
    last: string | null,
    next: string | null,
    hist: typeof scanHistory
  ) => {
    setCronEnabled(enabled);
    setCronIntervalMins(interval);
    setLastScanTime(last);
    setNextScanTime(next);
    setScanHistory(hist);
    localStorage.setItem(
      'cf_cron_config',
      JSON.stringify({
        enabled,
        interval,
        lastScan: last,
        nextScan: next,
        history: hist,
      })
    );
  };

  // --- Terraform Generation ---
  const handleGenerateTerraform = async () => {
    if (!selectedZone) return;
    setLoadingTf(true);
    try {
      const data = await authFetch('/api/iac/terraform', {
        method: 'POST',
        body: JSON.stringify({
          zoneId: selectedZone.id,
          options: tfOptions,
        }),
      });

      if (data.success) {
        setMainTfCode(data.mainTf);
        setTfvarsCode(data.tfvars);
        setNotification({
          type: 'success',
          text: formatText(t.complianceView.messages.generateSuccess, { name: selectedZone.name }),
        });
      }
    } catch (err: any) {
      setNotification({ type: 'error', text: err.message || t.common.error });
    } finally {
      setLoadingTf(false);
    }
  };

  useEffect(() => {
    if (selectedZone) {
      handleGenerateTerraform();
    }
  }, [selectedZone, tfOptions]);

  const handleCopyTf = () => {
    const code = tfActiveFile === 'main.tf' ? mainTfCode : tfvarsCode;
    if (!code) return;
    navigator.clipboard.writeText(code);
    setCopiedTf(true);
    setTimeout(() => setCopiedTf(false), 2000);
  };

  const handleDownloadTf = (filename: 'main.tf' | 'terraform.tfvars') => {
    const code = filename === 'main.tf' ? mainTfCode : tfvarsCode;
    if (!code || !selectedZone) return;
    const blob = new Blob([code], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
  };

  // --- CRON Scanner Execution ---
  const handleRunCronScan = async () => {
    if (!selectedZone) return;
    setIsScanning(true);
    const now = new Date().toISOString();

    try {
      // 1. Fetch current live zone audit result
      const auditData = await authFetch(`/api/audit?zoneId=${selectedZone.id}`);

      // Check against stored snapshot in localStorage
      let detectedDrifts: Array<{ key: string; oldVal: string; currentVal: string }> = [];
      const savedSnapshotRaw = localStorage.getItem(`cf_snapshot_${selectedZone.id}`);

      if (savedSnapshotRaw) {
        const snap = JSON.parse(savedSnapshotRaw);
        if (snap.settings) {
          if (snap.settings.ssl && snap.settings.ssl !== auditData?.liveSettings?.ssl) {
            detectedDrifts.push({ key: 'ssl_mode', oldVal: snap.settings.ssl, currentVal: auditData?.liveSettings?.ssl || 'unknown' });
          }
          if (snap.settings.min_tls_version && snap.settings.min_tls_version !== auditData?.liveSettings?.min_tls_version) {
            detectedDrifts.push({ key: 'min_tls_version', oldVal: snap.settings.min_tls_version, currentVal: auditData?.liveSettings?.min_tls_version || 'unknown' });
          }
          if (snap.settings.security_level && snap.settings.security_level !== auditData?.liveSettings?.security_level) {
            detectedDrifts.push({ key: 'security_level', oldVal: snap.settings.security_level, currentVal: auditData?.liveSettings?.security_level || 'unknown' });
          }
          if (snap.settings.always_use_https !== undefined && snap.settings.always_use_https !== auditData?.liveSettings?.always_use_https) {
            detectedDrifts.push({ key: 'always_use_https', oldVal: String(snap.settings.always_use_https), currentVal: String(auditData?.liveSettings?.always_use_https) });
          }
        }
      }

      const hasDrift = detectedDrifts.length > 0;
      const nextTime = new Date(Date.now() + cronIntervalMins * 60 * 1000).toISOString();

      const newLogItem = {
        id: 'scan_' + Date.now(),
        timestamp: now,
        status: hasDrift ? ('drift' as const) : ('passed' as const),
        driftCount: detectedDrifts.length,
        drifts: detectedDrifts,
      };

      const updatedHistory = [newLogItem, ...scanHistory.slice(0, 19)];
      saveCronToStorage(cronEnabled, cronIntervalMins, now, nextTime, updatedHistory);

      // If drift detected, dispatch alerts to all active channels
      if (hasDrift) {
        const activeChans = channels.filter(c => c.enabled);
        if (activeChans.length > 0) {
          const payload: DriftAlertPayload = {
            zoneName: selectedZone.name,
            zoneId: selectedZone.id,
            score: auditData?.score || 88,
            grade: auditData?.grade || 'B',
            driftCount: detectedDrifts.length,
            drifts: detectedDrifts,
            timestamp: now,
          };

          await authFetch('/api/alerts', {
            method: 'POST',
            body: JSON.stringify({ channels: activeChans, payload }),
          });

          setNotification({
            type: 'error',
            text: formatText(t.complianceView.messages.driftAlertSent, { count: activeChans.length }),
          });
        }
      } else {
        setNotification({
          type: 'success',
          text: t.complianceView.cronSection.logPassed,
        });
      }
    } catch (err: any) {
      setNotification({ type: 'error', text: err.message || t.common.error });
    } finally {
      setIsScanning(false);
    }
  };

  // Toggle CRON active
  const handleToggleCron = () => {
    const nextState = !cronEnabled;
    const nextTime = nextState ? new Date(Date.now() + cronIntervalMins * 60 * 1000).toISOString() : null;
    saveCronToStorage(nextState, cronIntervalMins, lastScanTime, nextTime, scanHistory);
  };

  // --- Alert Channel Handlers ---
  const handleAddChannel = (e: React.FormEvent) => {
    e.preventDefault();
    if (!channelForm.name.trim()) return;

    const newChannel: AlertChannelConfig = {
      id: 'chan_' + Date.now(),
      name: channelForm.name.trim(),
      platform: channelForm.platform,
      enabled: true,
      webhookUrl: channelForm.webhookUrl.trim() || undefined,
      telegramBotToken: channelForm.telegramBotToken.trim() || undefined,
      telegramChatId: channelForm.telegramChatId.trim() || undefined,
      secretHeader: channelForm.secretHeader.trim() || undefined,
    };

    const updated = [...channels, newChannel];
    saveChannelsToStorage(updated);
    setIsChannelModalOpen(false);
    setChannelForm({
      name: '',
      platform: 'slack',
      webhookUrl: '',
      telegramBotToken: '',
      telegramChatId: '',
      secretHeader: '',
    });
    setNotification({
      type: 'success',
      text: formatText(t.complianceView.messages.channelAdded, { name: newChannel.name }),
    });
  };

  const handleDeleteChannel = (id: string) => {
    const updated = channels.filter(c => c.id !== id);
    saveChannelsToStorage(updated);
    setNotification({ type: 'success', text: t.complianceView.messages.channelDeleted });
  };

  const handleToggleChannelStatus = (id: string) => {
    const updated = channels.map(c => c.id === id ? { ...c, enabled: !c.enabled } : c);
    saveChannelsToStorage(updated);
  };

  const handleTestChannel = async (channel: AlertChannelConfig) => {
    if (!selectedZone) return;
    setTestingChannelId(channel.id);
    try {
      const payload: DriftAlertPayload = {
        zoneName: selectedZone.name,
        zoneId: selectedZone.id,
        score: 95,
        grade: 'A+',
        driftCount: 0,
        drifts: [],
        timestamp: new Date().toISOString(),
        isTest: true,
      };

      const res = await authFetch('/api/alerts', {
        method: 'POST',
        body: JSON.stringify({ channel, payload }),
      });

      if (res.success) {
        setNotification({
          type: 'success',
          text: formatText(t.complianceView.messages.testSuccess, { name: channel.name }),
        });
      }
    } catch (err: any) {
      setNotification({
        type: 'error',
        text: formatText(t.complianceView.messages.testFailed, { error: err.message || t.common.error }),
      });
    } finally {
      setTestingChannelId(null);
    }
  };

  const handleTestAllChannels = async () => {
    if (!selectedZone) return;
    setTestingChannelId('all');
    try {
      const payload: DriftAlertPayload = {
        zoneName: selectedZone.name,
        zoneId: selectedZone.id,
        score: 95,
        grade: 'A+',
        driftCount: 0,
        drifts: [],
        timestamp: new Date().toISOString(),
        isTest: true,
      };

      const res = await authFetch('/api/alerts', {
        method: 'POST',
        body: JSON.stringify({ channels, payload }),
      });

      if (res.success) {
        setNotification({
          type: 'success',
          text: `Delivered test alert to ${channels.filter(c => c.enabled).length} channels.`,
        });
      }
    } catch (err: any) {
      setNotification({
        type: 'error',
        text: formatText(t.complianceView.messages.testFailed, { error: err.message || t.common.error }),
      });
    } finally {
      setTestingChannelId(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 rounded-2xl bg-gradient-to-r from-gray-900 via-gray-900/90 to-gray-950 border border-gray-800">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="p-2 rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
              <GitBranch className="w-5 h-5" />
            </span>
            <h1 className="text-xl font-bold text-white tracking-tight">{t.complianceView.title}</h1>
          </div>
          <p className="text-xs text-gray-400">
            {t.complianceView.subtitle}
          </p>
        </div>

        {/* Action Status Indicator */}
        <div className="flex items-center gap-2.5">
          <span className={`px-3 py-1.5 rounded-xl border text-xs font-semibold flex items-center gap-2 ${
            cronEnabled
              ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
              : 'bg-gray-800 text-gray-400 border-gray-700'
          }`}>
            <span className={`w-2 h-2 rounded-full ${cronEnabled ? 'bg-emerald-400 animate-pulse' : 'bg-gray-500'}`} />
            <span>CRON Drift: {cronEnabled ? 'Active' : 'Paused'}</span>
          </span>
        </div>
      </div>

      {notification && (
        <div className={`p-4 rounded-xl text-xs flex items-center gap-2.5 ${
          notification.type === 'success' ? 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-400' : 'bg-rose-500/10 border border-rose-500/30 text-rose-400'
        }`}>
          {notification.type === 'success' ? <CheckCircle2 className="w-4 h-4 shrink-0" /> : <AlertCircle className="w-4 h-4 shrink-0" />}
          <div>{notification.text}</div>
        </div>
      )}

      {/* Sub-tabs Navigation */}
      <div className="flex items-center gap-2 border-b border-gray-800 pb-2">
        <button
          onClick={() => setActiveSubTab('terraform')}
          className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all flex items-center gap-2 ${
            activeSubTab === 'terraform'
              ? 'bg-cyan-500/15 text-cyan-400 border border-cyan-500/30'
              : 'text-gray-400 hover:text-gray-200 hover:bg-gray-900'
          }`}
        >
          <Code2 className="w-4 h-4" />
          <span>{t.complianceView.tabs.terraform}</span>
        </button>

        <button
          onClick={() => setActiveSubTab('cron')}
          className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all flex items-center gap-2 ${
            activeSubTab === 'cron'
              ? 'bg-orange-500/15 text-orange-400 border border-orange-500/30'
              : 'text-gray-400 hover:text-gray-200 hover:bg-gray-900'
          }`}
        >
          <Clock className="w-4 h-4" />
          <span>{t.complianceView.tabs.cron}</span>
        </button>

        <button
          onClick={() => setActiveSubTab('alerts')}
          className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all flex items-center gap-2 ${
            activeSubTab === 'alerts'
              ? 'bg-purple-500/15 text-purple-400 border border-purple-500/30'
              : 'text-gray-400 hover:text-gray-200 hover:bg-gray-900'
          }`}
        >
          <BellRing className="w-4 h-4" />
          <span>{t.complianceView.tabs.alerts}</span>
          <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-purple-500/20 text-purple-300 font-bold">
            {channels.length}
          </span>
        </button>
      </div>

      {/* ========================================================================= */}
      {/* SUBTAB 1: TERRAFORM (IAC) EXPORT                                          */}
      {/* ========================================================================= */}
      {activeSubTab === 'terraform' && (
        <div className="space-y-4">
          <div className="p-5 rounded-2xl bg-gray-900/70 border border-gray-800 space-y-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h2 className="text-base font-bold text-white mb-1">
                  {t.complianceView.terraformSection.title}
                </h2>
                <p className="text-xs text-gray-400">
                  {t.complianceView.terraformSection.subtitle}
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <button
                  onClick={handleCopyTf}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-gray-800 hover:bg-gray-700 text-white text-xs font-semibold transition-all"
                >
                  {copiedTf ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedTf ? t.common.copied : t.complianceView.terraformSection.copyBtn}</span>
                </button>

                <button
                  onClick={() => handleDownloadTf('main.tf')}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-cyan-600/20 hover:bg-cyan-600/30 text-cyan-300 border border-cyan-500/30 text-xs font-semibold transition-all"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>{t.complianceView.terraformSection.downloadTfBtn}</span>
                </button>

                <button
                  onClick={() => handleDownloadTf('terraform.tfvars')}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-gray-800 hover:bg-gray-700 text-gray-300 text-xs font-semibold transition-all"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>{t.complianceView.terraformSection.downloadTfvarsBtn}</span>
                </button>
              </div>
            </div>

            {/* IaC Inclusions Filter Toggles */}
            <div className="p-3.5 rounded-xl bg-gray-950 border border-gray-850 space-y-2">
              <span className="text-xs font-semibold text-gray-300 block">
                {t.complianceView.terraformSection.optionsTitle}
              </span>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-1">
                {[
                  { key: 'includeDns', label: t.complianceView.terraformSection.optDns },
                  { key: 'includeWaf', label: t.complianceView.terraformSection.optWaf },
                  { key: 'includeSsl', label: t.complianceView.terraformSection.optSsl },
                  { key: 'includePageRules', label: t.complianceView.terraformSection.optPageRules },
                ].map(opt => (
                  <label key={opt.key} className="flex items-center gap-2 cursor-pointer text-xs text-gray-300 hover:text-white">
                    <input
                      type="checkbox"
                      checked={(tfOptions as any)[opt.key]}
                      onChange={(e) => setTfOptions({ ...tfOptions, [opt.key]: e.target.checked })}
                      className="rounded border-gray-700 bg-gray-900 text-cyan-500 focus:ring-cyan-500/20"
                    />
                    <span className="truncate">{opt.label}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Code Viewer */}
            <div className="rounded-xl border border-gray-800 bg-gray-950 overflow-hidden">
              <div className="flex items-center justify-between px-4 py-2.5 bg-gray-900/80 border-b border-gray-800">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setTfActiveFile('main.tf')}
                    className={`px-3 py-1 rounded-lg text-xs font-mono transition-colors ${
                      tfActiveFile === 'main.tf' ? 'bg-cyan-500/20 text-cyan-300 font-bold border border-cyan-500/40' : 'text-gray-400 hover:text-gray-200'
                    }`}
                  >
                    main.tf
                  </button>
                  <button
                    onClick={() => setTfActiveFile('terraform.tfvars')}
                    className={`px-3 py-1 rounded-lg text-xs font-mono transition-colors ${
                      tfActiveFile === 'terraform.tfvars' ? 'bg-cyan-500/20 text-cyan-300 font-bold border border-cyan-500/40' : 'text-gray-400 hover:text-gray-200'
                    }`}
                  >
                    terraform.tfvars
                  </button>
                </div>
                <span className="text-[10px] text-gray-500 font-mono">HashiCorp HCL</span>
              </div>

              <div className="p-4 overflow-x-auto max-h-[500px] overflow-y-auto">
                {loadingTf ? (
                  <div className="p-12 text-center text-gray-500 text-xs flex items-center justify-center gap-2">
                    <RefreshCw className="w-4 h-4 animate-spin text-cyan-400" />
                    <span>Synthesizing Terraform code...</span>
                  </div>
                ) : (
                  <pre className="font-mono text-xs text-gray-200 leading-relaxed">
                    <code>{tfActiveFile === 'main.tf' ? mainTfCode : tfvarsCode}</code>
                  </pre>
                )}
              </div>
            </div>

            {/* Quick Guide */}
            <div className="p-4 rounded-xl bg-gray-950 border border-gray-850 space-y-2">
              <span className="text-xs font-bold text-white flex items-center gap-2">
                <Terminal className="w-3.5 h-3.5 text-cyan-400" />
                {t.complianceView.terraformSection.guideTitle}
              </span>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5 text-xs font-mono text-gray-400">
                <div className="p-2.5 rounded-lg bg-gray-900/60 border border-gray-800">
                  <span className="text-cyan-400 block font-bold mb-1">Step 1</span>
                  <code>{t.complianceView.terraformSection.guideStep1}</code>
                </div>
                <div className="p-2.5 rounded-lg bg-gray-900/60 border border-gray-800">
                  <span className="text-cyan-400 block font-bold mb-1">Step 2</span>
                  <code>{t.complianceView.terraformSection.guideStep2}</code>
                </div>
                <div className="p-2.5 rounded-lg bg-gray-900/60 border border-gray-800">
                  <span className="text-cyan-400 block font-bold mb-1">Step 3</span>
                  <code>{t.complianceView.terraformSection.guideStep3}</code>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SUBTAB 2: SCHEDULED DRIFT CRON                                           */}
      {/* ========================================================================= */}
      {activeSubTab === 'cron' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {/* Control Panel */}
            <div className="lg:col-span-1 p-5 rounded-2xl bg-gray-900/70 border border-gray-800 space-y-4">
              <div>
                <h2 className="text-sm font-bold text-white mb-1">
                  {t.complianceView.cronSection.title}
                </h2>
                <p className="text-xs text-gray-400 leading-relaxed">
                  {t.complianceView.cronSection.subtitle}
                </p>
              </div>

              <div className="p-4 rounded-xl bg-gray-950 border border-gray-850 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-gray-300">
                    {t.complianceView.cronSection.statusLabel}
                  </span>
                  <button
                    onClick={handleToggleCron}
                    className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold transition-all ${
                      cronEnabled
                        ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/30'
                        : 'bg-gray-800 text-gray-400 border border-gray-700 hover:text-white'
                    }`}
                  >
                    {cronEnabled ? <Pause className="w-3 h-3" /> : <Play className="w-3 h-3" />}
                    <span>{cronEnabled ? t.complianceView.cronSection.enabled : t.complianceView.cronSection.disabled}</span>
                  </button>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-gray-400 mb-1.5">
                    {t.complianceView.cronSection.intervalLabel}
                  </label>
                  <select
                    value={cronIntervalMins}
                    onChange={(e) => {
                      const mins = Number(e.target.value);
                      setCronIntervalMins(mins);
                      saveCronToStorage(cronEnabled, mins, lastScanTime, cronEnabled ? new Date(Date.now() + mins * 60 * 1000).toISOString() : null, scanHistory);
                    }}
                    className="w-full bg-gray-900 border border-gray-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-orange-500 font-semibold"
                  >
                    <option value={5}>{t.complianceView.cronSection.interval5m}</option>
                    <option value={15}>{t.complianceView.cronSection.interval15m}</option>
                    <option value={60}>{t.complianceView.cronSection.interval1h}</option>
                    <option value={360}>{t.complianceView.cronSection.interval6h}</option>
                    <option value={1440}>{t.complianceView.cronSection.interval24h}</option>
                  </select>
                </div>

                <div className="space-y-1 pt-2 border-t border-gray-800 text-[11px] font-mono text-gray-400">
                  <div className="flex justify-between">
                    <span>{t.complianceView.cronSection.lastScan}</span>
                    <span className="text-gray-200">{lastScanTime ? new Date(lastScanTime).toLocaleTimeString() : '—'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>{t.complianceView.cronSection.nextScan}</span>
                    <span className="text-orange-400 font-bold">{nextScanTime && cronEnabled ? new Date(nextScanTime).toLocaleTimeString() : '—'}</span>
                  </div>
                </div>
              </div>

              <button
                onClick={handleRunCronScan}
                disabled={isScanning}
                className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white text-xs font-semibold shadow-lg shadow-orange-500/20 flex items-center justify-center gap-2 transition-all disabled:opacity-50"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isScanning ? 'animate-spin' : ''}`} />
                <span>{isScanning ? t.complianceView.cronSection.scanning : t.complianceView.cronSection.runNowBtn}</span>
              </button>
            </div>

            {/* Scan History Log */}
            <div className="lg:col-span-2 p-5 rounded-2xl bg-gray-900/70 border border-gray-800 space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold text-white">
                  {formatText(t.complianceView.cronSection.historyTitle, { count: scanHistory.length })}
                </h3>
              </div>

              <div className="space-y-2.5 max-h-[440px] overflow-y-auto pr-1">
                {scanHistory.length === 0 ? (
                  <div className="p-12 text-center text-gray-500 text-xs">
                    {t.complianceView.cronSection.noHistory}
                  </div>
                ) : (
                  scanHistory.map((item) => (
                    <div
                      key={item.id}
                      className={`p-3.5 rounded-xl border transition-all ${
                        item.status === 'passed'
                          ? 'bg-gray-950/80 border-gray-850'
                          : 'bg-rose-500/10 border-rose-500/30'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1.5">
                        <div className="flex items-center gap-2">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                            item.status === 'passed' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-rose-500/20 text-rose-400'
                          }`}>
                            {item.status === 'passed' ? 'PASS' : 'DRIFT'}
                          </span>
                          <span className="text-xs font-semibold text-white">
                            {item.status === 'passed' ? t.complianceView.cronSection.logPassed : formatText(t.complianceView.cronSection.logDrift, { count: item.driftCount })}
                          </span>
                        </div>
                        <span className="text-[10px] font-mono text-gray-400">
                          {new Date(item.timestamp).toLocaleString()}
                        </span>
                      </div>

                      {item.drifts && item.drifts.length > 0 && (
                        <div className="space-y-1 mt-2 pt-2 border-t border-gray-800/80 font-mono text-[11px]">
                          {item.drifts.map((d, idx) => (
                            <div key={idx} className="flex items-center gap-2 text-rose-300">
                              <span>• {d.key}:</span>
                              <span className="text-amber-400">{d.oldVal}</span>
                              <span>➔</span>
                              <span className="text-emerald-400 font-bold">{d.currentVal}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SUBTAB 3: ALERT NOTIFICATION CHANNELS                                     */}
      {/* ========================================================================= */}
      {activeSubTab === 'alerts' && (
        <div className="space-y-4">
          <div className="p-5 rounded-2xl bg-gray-900/70 border border-gray-800 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-base font-bold text-white mb-1">
                  {t.complianceView.alertsSection.title}
                </h2>
                <p className="text-xs text-gray-400">
                  {t.complianceView.alertsSection.subtitle}
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={handleTestAllChannels}
                  disabled={testingChannelId === 'all' || channels.length === 0}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-gray-800 hover:bg-gray-700 text-gray-200 text-xs font-semibold transition-all disabled:opacity-50"
                >
                  <Send className={`w-3.5 h-3.5 ${testingChannelId === 'all' ? 'animate-spin' : ''}`} />
                  <span>{t.complianceView.alertsSection.testAllBtn}</span>
                </button>

                <button
                  onClick={() => setIsChannelModalOpen(true)}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-purple-500 to-indigo-500 hover:from-purple-600 hover:to-indigo-600 text-white text-xs font-semibold shadow-lg shadow-purple-500/20 transition-all"
                >
                  <Plus className="w-4 h-4" />
                  <span>{t.complianceView.alertsSection.addChannelBtn}</span>
                </button>
              </div>
            </div>

            {/* Channels Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
              {channels.length === 0 ? (
                <div className="col-span-2 p-12 text-center rounded-2xl bg-gray-950/60 border border-gray-850 text-gray-500 text-xs">
                  {t.complianceView.alertsSection.emptyChannels}
                </div>
              ) : (
                channels.map((chan) => {
                  const platformBadgeColors: Record<AlertPlatform, string> = {
                    slack: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
                    discord: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/30',
                    telegram: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/30',
                    webhook: 'bg-amber-500/10 text-amber-400 border-amber-500/30',
                  };

                  return (
                    <div
                      key={chan.id}
                      className="p-4 rounded-2xl bg-gray-950/90 border border-gray-800 hover:border-gray-700 transition-all flex flex-col justify-between gap-3 relative"
                    >
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className={`text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full border ${platformBadgeColors[chan.platform]}`}>
                              {chan.platform}
                            </span>
                            <span className="text-xs font-bold text-white">{chan.name}</span>
                          </div>

                          <button
                            onClick={() => handleToggleChannelStatus(chan.id)}
                            className={`w-9 h-5 flex items-center rounded-full p-0.5 transition-colors ${
                              chan.enabled ? 'bg-emerald-500' : 'bg-gray-800'
                            }`}
                          >
                            <div className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform ${
                              chan.enabled ? 'translate-x-4' : 'translate-x-0'
                            }`} />
                          </button>
                        </div>

                        <div className="font-mono text-[11px] text-gray-400 truncate">
                          {chan.platform === 'telegram' ? (
                            <span>Chat ID: <span className="text-cyan-300 font-bold">{chan.telegramChatId}</span></span>
                          ) : (
                            <span className="truncate block">{chan.webhookUrl || '—'}</span>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center justify-between pt-2 border-t border-gray-850">
                        <span className={`text-[10px] font-semibold ${chan.enabled ? 'text-emerald-400' : 'text-gray-500'}`}>
                          {chan.enabled ? `● ${t.complianceView.alertsSection.statusActive}` : `○ ${t.complianceView.alertsSection.statusDisabled}`}
                        </span>

                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() => handleTestChannel(chan)}
                            disabled={testingChannelId === chan.id || !chan.enabled}
                            className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-gray-800 hover:bg-gray-700 text-gray-200 text-xs font-medium transition-all disabled:opacity-40"
                          >
                            <Send className={`w-3 h-3 ${testingChannelId === chan.id ? 'animate-spin' : ''}`} />
                            <span>{testingChannelId === chan.id ? t.complianceView.alertsSection.testing : t.complianceView.alertsSection.testBtn}</span>
                          </button>

                          <button
                            onClick={() => handleDeleteChannel(chan.id)}
                            className="p-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 transition-colors"
                            title={t.common.delete}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      )}

      {/* Add Alert Channel Modal */}
      {isChannelModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="w-full max-w-lg rounded-2xl bg-gray-900 border border-gray-800 p-6 shadow-2xl relative">
            <h2 className="text-base font-bold text-white mb-4 flex items-center gap-2">
              <BellRing className="w-4 h-4 text-purple-400" />
              {t.complianceView.alertsSection.modalTitle}
            </h2>

            <form onSubmit={handleAddChannel} className="space-y-3.5">
              <div>
                <label className="block text-[11px] font-semibold text-gray-400 mb-1">
                  {t.complianceView.alertsSection.platformLabel}
                </label>
                <select
                  value={channelForm.platform}
                  onChange={(e) => setChannelForm({ ...channelForm, platform: e.target.value as AlertPlatform })}
                  className="w-full bg-gray-950 border border-gray-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-purple-500 font-semibold"
                >
                  <option value="slack">Slack Webhook</option>
                  <option value="discord">Discord Webhook</option>
                  <option value="telegram">Telegram Bot</option>
                  <option value="webhook">Custom JSON Webhook (SIEM)</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-gray-400 mb-1">
                  {t.complianceView.alertsSection.nameLabel}
                </label>
                <input
                  type="text"
                  required
                  placeholder={t.complianceView.alertsSection.namePlaceholder}
                  value={channelForm.name}
                  onChange={(e) => setChannelForm({ ...channelForm, name: e.target.value })}
                  className="w-full bg-gray-950 border border-gray-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-purple-500"
                />
              </div>

              {channelForm.platform !== 'telegram' ? (
                <div>
                  <label className="block text-[11px] font-semibold text-gray-400 mb-1">
                    {t.complianceView.alertsSection.webhookUrlLabel}
                  </label>
                  <input
                    type="url"
                    required
                    placeholder={t.complianceView.alertsSection.webhookUrlPlaceholder}
                    value={channelForm.webhookUrl}
                    onChange={(e) => setChannelForm({ ...channelForm, webhookUrl: e.target.value })}
                    className="w-full bg-gray-950 border border-gray-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-purple-500 font-mono"
                  />
                </div>
              ) : (
                <>
                  <div>
                    <label className="block text-[11px] font-semibold text-gray-400 mb-1">
                      {t.complianceView.alertsSection.botTokenLabel}
                    </label>
                    <input
                      type="text"
                      required
                      placeholder={t.complianceView.alertsSection.botTokenPlaceholder}
                      value={channelForm.telegramBotToken}
                      onChange={(e) => setChannelForm({ ...channelForm, telegramBotToken: e.target.value })}
                      className="w-full bg-gray-950 border border-gray-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-purple-500 font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-gray-400 mb-1">
                      {t.complianceView.alertsSection.chatIdLabel}
                    </label>
                    <input
                      type="text"
                      required
                      placeholder={t.complianceView.alertsSection.chatIdPlaceholder}
                      value={channelForm.telegramChatId}
                      onChange={(e) => setChannelForm({ ...channelForm, telegramChatId: e.target.value })}
                      className="w-full bg-gray-950 border border-gray-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-purple-500 font-mono"
                    />
                  </div>
                </>
              )}

              {channelForm.platform === 'webhook' && (
                <div>
                  <label className="block text-[11px] font-semibold text-gray-400 mb-1">
                    {t.complianceView.alertsSection.secretLabel}
                  </label>
                  <input
                    type="password"
                    placeholder={t.complianceView.alertsSection.secretPlaceholder}
                    value={channelForm.secretHeader}
                    onChange={(e) => setChannelForm({ ...channelForm, secretHeader: e.target.value })}
                    className="w-full bg-gray-950 border border-gray-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-purple-500 font-mono"
                  />
                </div>
              )}

              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-gray-800">
                <button
                  type="button"
                  onClick={() => setIsChannelModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-gray-800 hover:bg-gray-750 text-gray-300 text-xs font-semibold"
                >
                  {t.common.cancel}
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold shadow-lg shadow-purple-500/20"
                >
                  {t.complianceView.alertsSection.saveChannelBtn}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
