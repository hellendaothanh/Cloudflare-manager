'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useLanguage } from '@/context/LanguageContext';
import { auditLogger } from '@/lib/audit/audit-logger';
import { 
  Zap, 
  Trash2, 
  ShieldAlert, 
  Code2, 
  CheckCircle2, 
  AlertCircle, 
  RefreshCw, 
  Globe, 
  Layers, 
  Tag, 
  FolderTree, 
  History, 
  Flame, 
  AlertTriangle,
  FileCode,
  Image as ImageIcon,
  Home
} from 'lucide-react';

interface QuickActionsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export type PurgeMode = 'custom' | 'hosts' | 'tags' | 'everything';

interface PurgeHistoryItem {
  id: string;
  timestamp: string;
  mode: PurgeMode;
  targetCount: number;
  details: string[];
  status: 'success' | 'failed';
}

export const QuickActionsModal: React.FC<QuickActionsModalProps> = ({ isOpen, onClose }) => {
  const { selectedZone, authFetch, hasPermission, role, activeAccount } = useAuth();
  const { t, formatText } = useLanguage();
  const canPurge = hasPermission('canPurgeCache');

  const [loading, setLoading] = useState(false);
  const [purgeMode, setPurgeMode] = useState<PurgeMode>('custom');

  // Input states
  const [customUrls, setCustomUrls] = useState('');
  const [customHosts, setCustomHosts] = useState('');
  const [customTags, setCustomTags] = useState('');
  const [customPrefixes, setCustomPrefixes] = useState('');

  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [history, setHistory] = useState<PurgeHistoryItem[]>([]);
  const [showHistory, setShowHistory] = useState(false);

  // Load history from localStorage
  useEffect(() => {
    if (selectedZone) {
      try {
        const raw = localStorage.getItem(`cf_purge_history_${selectedZone.id}`);
        if (raw) setHistory(JSON.parse(raw));
      } catch (e) {
        console.error(e);
      }
    }
  }, [selectedZone]);

  const saveHistoryItem = (item: PurgeHistoryItem) => {
    if (!selectedZone) return;
    const updated = [item, ...history.slice(0, 9)];
    setHistory(updated);
    localStorage.setItem(`cf_purge_history_${selectedZone.id}`, JSON.stringify(updated));
  };

  if (!isOpen || !selectedZone) return null;

  // Preset Handlers
  const handleApplyPreset = (type: 'css_js' | 'images' | 'homepage') => {
    setPurgeMode('custom');
    if (type === 'css_js') {
      setCustomUrls(
        `https://${selectedZone.name}/assets/app.js\nhttps://${selectedZone.name}/static/main.css\nhttps://${selectedZone.name}/bundle.js`
      );
    } else if (type === 'images') {
      setCustomUrls(
        `https://${selectedZone.name}/images/logo.png\nhttps://${selectedZone.name}/images/banner.webp\nhttps://${selectedZone.name}/favicon.ico`
      );
    } else if (type === 'homepage') {
      setCustomUrls(
        `https://${selectedZone.name}/\nhttps://www.${selectedZone.name}/`
      );
    }
  };

  const handleExecutePurge = async () => {
    if (!canPurge) return;
    setLoading(true);
    setMessage(null);

    const now = new Date().toISOString();

    try {
      if (purgeMode === 'everything') {
        await authFetch(`/api/zones/${selectedZone.id}`, {
          method: 'POST',
          body: JSON.stringify({ action: 'purge_cache', purge_everything: true }),
        });

        saveHistoryItem({
          id: 'purge_' + Date.now(),
          timestamp: now,
          mode: 'everything',
          targetCount: 1,
          details: ['* (All Zone Cache)'],
          status: 'success',
        });

        auditLogger.recordLog({
          actorName: activeAccount?.name || 'Operator',
          actorRole: role,
          actionType: 'PURGE_CACHE',
          zoneName: selectedZone.name,
          zoneId: selectedZone.id,
          resource: 'Purge Everything (Entire Domain Cache)',
          status: 'SUCCESS',
          details: `Xóa toàn bộ Cache trên Cloudflare Edge cho domain ${selectedZone.name}.`,
        });

        setMessage({ type: 'success', text: t.quickActions.purgeSuccessAll });
      } else if (purgeMode === 'custom') {
        const urls = customUrls.split('\n').map(u => u.trim()).filter(Boolean);
        if (urls.length === 0) {
          setMessage({ type: 'error', text: t.quickActions.purgeErrorEmpty });
          setLoading(false);
          return;
        }

        await authFetch(`/api/zones/${selectedZone.id}`, {
          method: 'POST',
          body: JSON.stringify({ action: 'purge_cache', files: urls }),
        });

        saveHistoryItem({
          id: 'purge_' + Date.now(),
          timestamp: now,
          mode: 'custom',
          targetCount: urls.length,
          details: urls,
          status: 'success',
        });

        auditLogger.recordLog({
          actorName: activeAccount?.name || 'Operator',
          actorRole: role,
          actionType: 'PURGE_CACHE',
          zoneName: selectedZone.name,
          zoneId: selectedZone.id,
          resource: `Granular Purge: ${urls.length} URLs`,
          status: 'SUCCESS',
          details: `Đã xóa Cache chi tiết cho ${urls.length} đường dẫn URLs trên domain ${selectedZone.name}.`,
        });

        setMessage({ type: 'success', text: formatText(t.quickActions.purgeSuccessUrls, { count: urls.length }) });
      } else if (purgeMode === 'hosts') {
        const hostsList = customHosts.split('\n').map(h => h.trim().replace(/^https?:\/\//, '').replace(/\/.*$/, '')).filter(Boolean);
        if (hostsList.length === 0) {
          setMessage({ type: 'error', text: t.quickActions.purgeErrorEmpty });
          setLoading(false);
          return;
        }

        await authFetch(`/api/zones/${selectedZone.id}`, {
          method: 'POST',
          body: JSON.stringify({ action: 'purge_cache', hosts: hostsList }),
        });

        saveHistoryItem({
          id: 'purge_' + Date.now(),
          timestamp: now,
          mode: 'hosts',
          targetCount: hostsList.length,
          details: hostsList,
          status: 'success',
        });

        auditLogger.recordLog({
          actorName: activeAccount?.name || 'Operator',
          actorRole: role,
          actionType: 'PURGE_CACHE',
          zoneName: selectedZone.name,
          zoneId: selectedZone.id,
          resource: `Granular Purge: Hosts (${hostsList.join(', ')})`,
          status: 'SUCCESS',
          details: `Đã xóa Cache cho Hostnames ${hostsList.join(', ')} trên domain ${selectedZone.name}.`,
        });

        setMessage({ type: 'success', text: formatText(t.quickActions.purgeSuccessHosts, { count: hostsList.length }) });
      } else if (purgeMode === 'tags') {
        const tagsList = customTags.split(/[,\n]/).map(t => t.trim()).filter(Boolean);
        const prefixesList = customPrefixes.split('\n').map(p => p.trim()).filter(Boolean);

        if (tagsList.length === 0 && prefixesList.length === 0) {
          setMessage({ type: 'error', text: t.quickActions.purgeErrorEmpty });
          setLoading(false);
          return;
        }

        await authFetch(`/api/zones/${selectedZone.id}`, {
          method: 'POST',
          body: JSON.stringify({
            action: 'purge_cache',
            tags: tagsList.length > 0 ? tagsList : undefined,
            prefixes: prefixesList.length > 0 ? prefixesList : undefined,
          }),
        });

        saveHistoryItem({
          id: 'purge_' + Date.now(),
          timestamp: now,
          mode: 'tags',
          targetCount: tagsList.length + prefixesList.length,
          details: [...tagsList.map(t => `tag:${t}`), ...prefixesList.map(p => `prefix:${p}`)],
          status: 'success',
        });

        auditLogger.recordLog({
          actorName: activeAccount?.name || 'Operator',
          actorRole: role,
          actionType: 'PURGE_CACHE',
          zoneName: selectedZone.name,
          zoneId: selectedZone.id,
          resource: `Granular Purge: Tags/Prefixes (${tagsList.length} tags, ${prefixesList.length} prefixes)`,
          status: 'SUCCESS',
          details: `Đã xóa Cache theo Tags/Prefixes trên domain ${selectedZone.name}.`,
        });

        setMessage({ type: 'success', text: t.quickActions.purgeSuccessTags });
      }
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || t.quickActions.purgeError });
    } finally {
      setLoading(false);
    }
  };

  const handleToggleDevMode = async (enable: boolean) => {
    if (!canPurge) return;
    setLoading(true);
    setMessage(null);
    try {
      await authFetch(`/api/zones/${selectedZone.id}`, {
        method: 'PATCH',
        body: JSON.stringify({ settingId: 'development_mode', value: enable ? 'on' : 'off' }),
      });
      setMessage({
        type: 'success',
        text: enable ? t.quickActions.devModeOnMsg : t.quickActions.devModeOffMsg,
      });
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || t.quickActions.purgeError });
    } finally {
      setLoading(false);
    }
  };

  const handleToggleUnderAttack = async (enable: boolean) => {
    if (!canPurge) return;
    setLoading(true);
    setMessage(null);
    try {
      await authFetch(`/api/zones/${selectedZone.id}`, {
        method: 'PATCH',
        body: JSON.stringify({ settingId: 'security_level', value: enable ? 'under_attack' : 'medium' }),
      });
      setMessage({
        type: 'success',
        text: enable ? t.quickActions.underAttackOnMsg : t.quickActions.underAttackOffMsg,
      });
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || t.quickActions.purgeError });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-md p-4 overflow-y-auto">
      <div className="w-full max-w-2xl rounded-2xl bg-gray-900 border border-gray-800 p-6 shadow-2xl relative my-8 animate-in fade-in zoom-in-95 duration-150">
        
        {/* Modal Header */}
        <div className="flex items-center justify-between gap-3 mb-5 border-b border-gray-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-orange-500/10 border border-orange-500/20 text-orange-500">
              <Zap className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                {t.quickActions.title}
              </h2>
              <p className="text-xs text-gray-400">
                {t.quickActions.subtitle} <span className="text-orange-400 font-mono font-bold">{selectedZone.name}</span>
              </p>
            </div>
          </div>

          <button
            onClick={() => setShowHistory(!showHistory)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-semibold transition-all ${
              showHistory ? 'bg-orange-500/20 text-orange-400 border-orange-500/40' : 'bg-gray-800 text-gray-300 border-gray-700 hover:bg-gray-750'
            }`}
          >
            <History className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">History ({history.length})</span>
          </button>
        </div>

        {message && (
          <div className={`p-3.5 rounded-xl mb-4 text-xs flex items-center gap-2.5 ${
            message.type === 'success' ? 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-400' : 'bg-rose-500/10 border border-rose-500/30 text-rose-400'
          }`}>
            {message.type === 'success' ? <CheckCircle2 className="w-4 h-4 shrink-0" /> : <AlertCircle className="w-4 h-4 shrink-0" />}
            <div className="font-medium">{message.text}</div>
          </div>
        )}

        {/* History Panel (Collapsible) */}
        {showHistory && (
          <div className="mb-5 p-4 rounded-xl bg-gray-950 border border-gray-800 space-y-2.5 max-h-48 overflow-y-auto">
            <span className="text-xs font-bold text-white block">
              {formatText(t.quickActions.historyTitle, { count: history.length })}
            </span>
            {history.length === 0 ? (
              <p className="text-xs text-gray-500">{t.quickActions.noHistory}</p>
            ) : (
              history.map((h) => (
                <div key={h.id} className="p-2.5 rounded-lg bg-gray-900/70 border border-gray-850 flex items-center justify-between text-xs font-mono">
                  <div className="space-y-0.5 truncate mr-2">
                    <div className="flex items-center gap-2">
                      <span className="px-1.5 py-0.2 rounded bg-orange-500/20 text-orange-400 text-[10px] uppercase font-bold">
                        {h.mode}
                      </span>
                      <span className="text-gray-300 font-semibold">{h.details[0]} {h.targetCount > 1 ? `(+${h.targetCount - 1} more)` : ''}</span>
                    </div>
                  </div>
                  <span className="text-[10px] text-gray-500 shrink-0">
                    {new Date(h.timestamp).toLocaleTimeString()}
                  </span>
                </div>
              ))
            )}
          </div>
        )}

        <div className="space-y-5">
          
          {/* Main Granular Purge Center */}
          <div className="p-4 rounded-2xl bg-gray-950 border border-gray-800 space-y-4">
            
            {/* Mode Tabs */}
            <div className="flex items-center gap-1.5 p-1 rounded-xl bg-gray-900 border border-gray-800 overflow-x-auto">
              <button
                type="button"
                onClick={() => setPurgeMode('custom')}
                className={`flex-1 min-w-[120px] py-1.5 px-3 rounded-lg text-xs font-semibold transition-all flex items-center justify-center gap-1.5 ${
                  purgeMode === 'custom' ? 'bg-orange-500 text-white shadow-md' : 'text-gray-400 hover:text-gray-200'
                }`}
              >
                <FileCode className="w-3.5 h-3.5" />
                <span>{t.quickActions.customUrl}</span>
              </button>

              <button
                type="button"
                onClick={() => setPurgeMode('hosts')}
                className={`flex-1 min-w-[120px] py-1.5 px-3 rounded-lg text-xs font-semibold transition-all flex items-center justify-center gap-1.5 ${
                  purgeMode === 'hosts' ? 'bg-orange-500 text-white shadow-md' : 'text-gray-400 hover:text-gray-200'
                }`}
              >
                <Globe className="w-3.5 h-3.5" />
                <span>{t.quickActions.byHosts}</span>
              </button>

              <button
                type="button"
                onClick={() => setPurgeMode('tags')}
                className={`flex-1 min-w-[130px] py-1.5 px-3 rounded-lg text-xs font-semibold transition-all flex items-center justify-center gap-1.5 ${
                  purgeMode === 'tags' ? 'bg-orange-500 text-white shadow-md' : 'text-gray-400 hover:text-gray-200'
                }`}
              >
                <Tag className="w-3.5 h-3.5" />
                <span>{t.quickActions.byTags}</span>
              </button>

              <button
                type="button"
                onClick={() => setPurgeMode('everything')}
                className={`flex-1 min-w-[130px] py-1.5 px-3 rounded-lg text-xs font-semibold transition-all flex items-center justify-center gap-1.5 ${
                  purgeMode === 'everything' ? 'bg-rose-600 text-white shadow-md' : 'text-gray-400 hover:text-rose-300'
                }`}
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>{t.quickActions.allCache}</span>
              </button>
            </div>

            {/* Quick 1-Click Presets */}
            {purgeMode === 'custom' && (
              <div className="space-y-1.5 pt-1">
                <span className="text-[11px] font-semibold text-gray-400 block">
                  {t.quickActions.presetsTitle}
                </span>
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleApplyPreset('css_js')}
                    className="px-2.5 py-1 rounded-lg bg-gray-900 hover:bg-gray-850 border border-gray-800 text-cyan-400 text-xs font-medium transition-colors flex items-center gap-1"
                  >
                    <FileCode className="w-3 h-3" />
                    <span>{t.quickActions.presetCssJs}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleApplyPreset('images')}
                    className="px-2.5 py-1 rounded-lg bg-gray-900 hover:bg-gray-850 border border-gray-800 text-emerald-400 text-xs font-medium transition-colors flex items-center gap-1"
                  >
                    <ImageIcon className="w-3 h-3" />
                    <span>{t.quickActions.presetImages}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleApplyPreset('homepage')}
                    className="px-2.5 py-1 rounded-lg bg-gray-900 hover:bg-gray-850 border border-gray-800 text-amber-400 text-xs font-medium transition-colors flex items-center gap-1"
                  >
                    <Home className="w-3 h-3" />
                    <span>{t.quickActions.presetHomepage}</span>
                  </button>
                </div>
              </div>
            )}

            {/* Form Fields according to selected Mode */}
            {purgeMode === 'custom' && (
              <div className="space-y-1.5">
                <label className="block text-[11px] font-semibold text-gray-300">
                  {t.quickActions.urlsLabel}
                </label>
                <textarea
                  rows={4}
                  value={customUrls}
                  onChange={(e) => setCustomUrls(e.target.value)}
                  placeholder={t.quickActions.urlsPlaceholder}
                  className="w-full bg-gray-900 border border-gray-800 rounded-xl p-3 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-orange-500 font-mono leading-relaxed"
                />
                <p className="text-[10px] text-gray-500">{t.quickActions.urlsHelper}</p>
              </div>
            )}

            {purgeMode === 'hosts' && (
              <div className="space-y-1.5">
                <label className="block text-[11px] font-semibold text-gray-300">
                  {t.quickActions.hostsLabel}
                </label>
                <textarea
                  rows={4}
                  value={customHosts}
                  onChange={(e) => setCustomHosts(e.target.value)}
                  placeholder={t.quickActions.hostsPlaceholder}
                  className="w-full bg-gray-900 border border-gray-800 rounded-xl p-3 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-orange-500 font-mono leading-relaxed"
                />
                <p className="text-[10px] text-gray-500">{t.quickActions.hostsHelper}</p>
              </div>
            )}

            {purgeMode === 'tags' && (
              <div className="space-y-3">
                <div className="space-y-1">
                  <label className="block text-[11px] font-semibold text-gray-300">
                    {t.quickActions.tagsLabel}
                  </label>
                  <input
                    type="text"
                    value={customTags}
                    onChange={(e) => setCustomTags(e.target.value)}
                    placeholder={t.quickActions.tagsPlaceholder}
                    className="w-full bg-gray-900 border border-gray-800 rounded-xl p-2.5 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-orange-500 font-mono"
                  />
                  <p className="text-[10px] text-gray-500">{t.quickActions.tagsHelper}</p>
                </div>

                <div className="space-y-1">
                  <label className="block text-[11px] font-semibold text-gray-300">
                    {t.quickActions.prefixesLabel}
                  </label>
                  <textarea
                    rows={2}
                    value={customPrefixes}
                    onChange={(e) => setCustomPrefixes(e.target.value)}
                    placeholder={t.quickActions.prefixesPlaceholder}
                    className="w-full bg-gray-900 border border-gray-800 rounded-xl p-2.5 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-orange-500 font-mono"
                  />
                  <p className="text-[10px] text-gray-500">{t.quickActions.prefixesHelper}</p>
                </div>
              </div>
            )}

            {purgeMode === 'everything' && (
              <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs space-y-2">
                <div className="flex items-center gap-2 font-bold text-rose-400">
                  <AlertTriangle className="w-4 h-4" />
                  <span>{t.quickActions.allCache}</span>
                </div>
                <p className="leading-relaxed text-[11px]">
                  {t.quickActions.everythingWarning}
                </p>
              </div>
            )}

            {/* Execute Button */}
            <button
              onClick={handleExecutePurge}
              disabled={loading || !canPurge}
              className={`w-full py-2.5 px-4 rounded-xl text-white text-xs font-semibold flex items-center justify-center gap-2 transition-all shadow-lg ${
                !canPurge
                  ? 'bg-gray-800 text-gray-500 cursor-not-allowed opacity-60'
                  : purgeMode === 'everything'
                    ? 'bg-rose-600 hover:bg-rose-500 shadow-rose-600/20'
                    : 'bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 shadow-orange-500/20'
              }`}
              title={!canPurge ? formatText(t.rbac.permissionDeniedTooltip, { role: t.rbac.roles[role]?.name || role }) : ''}
            >
              {loading ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
              <span>
                {purgeMode === 'everything' ? t.quickActions.btnPurgeEverything : t.quickActions.purgeBtn}
              </span>
            </button>
          </div>

          {/* Under Attack Mode & Dev Mode Quick Switches */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="p-4 rounded-2xl bg-gray-950 border border-gray-800 flex flex-col justify-between gap-3">
              <div>
                <div className="flex items-center gap-1.5 text-xs font-bold text-rose-400 mb-1">
                  <ShieldAlert className="w-4 h-4 shrink-0" />
                  <span>{t.quickActions.underAttackTitle}</span>
                </div>
                <p className="text-[11px] text-gray-400">
                  {t.quickActions.underAttackDesc}
                </p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => handleToggleUnderAttack(true)}
                  disabled={loading || !canPurge}
                  className={`flex-1 py-2 px-2 rounded-xl text-xs font-semibold transition-all ${
                    !canPurge ? 'bg-gray-800 text-gray-500 cursor-not-allowed opacity-50' : 'bg-rose-600/80 hover:bg-rose-600 text-white shadow-md shadow-rose-600/20'
                  }`}
                  title={!canPurge ? formatText(t.rbac.permissionDeniedTooltip, { role: t.rbac.roles[role]?.name || role }) : ''}
                >
                  {t.quickActions.btnEnableEmergency}
                </button>
                <button
                  onClick={() => handleToggleUnderAttack(false)}
                  disabled={loading || !canPurge}
                  className={`flex-1 py-2 px-2 rounded-xl text-xs font-semibold transition-all ${
                    !canPurge ? 'bg-gray-900 text-gray-600 cursor-not-allowed opacity-50' : 'bg-gray-850 hover:bg-gray-800 text-gray-300 border border-gray-750'
                  }`}
                  title={!canPurge ? formatText(t.rbac.permissionDeniedTooltip, { role: t.rbac.roles[role]?.name || role }) : ''}
                >
                  {t.quickActions.btnTurnOff}
                </button>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-gray-950 border border-gray-800 flex flex-col justify-between gap-3">
              <div>
                <div className="flex items-center gap-1.5 text-xs font-bold text-amber-400 mb-1">
                  <Code2 className="w-4 h-4 shrink-0" />
                  <span>{t.quickActions.devModeTitle}</span>
                </div>
                <p className="text-[11px] text-gray-400">
                  {t.quickActions.devModeDesc}
                </p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => handleToggleDevMode(true)}
                  disabled={loading || !canPurge}
                  className={`flex-1 py-2 px-2 rounded-xl text-xs font-semibold transition-all ${
                    !canPurge ? 'bg-gray-800 text-gray-500 cursor-not-allowed opacity-50' : 'bg-amber-600/80 hover:bg-amber-600 text-white shadow-md shadow-amber-600/20'
                  }`}
                  title={!canPurge ? formatText(t.rbac.permissionDeniedTooltip, { role: t.rbac.roles[role]?.name || role }) : ''}
                >
                  {t.quickActions.btnEnable3h}
                </button>
                <button
                  onClick={() => handleToggleDevMode(false)}
                  disabled={loading || !canPurge}
                  className={`flex-1 py-2 px-2 rounded-xl text-xs font-semibold transition-all ${
                    !canPurge ? 'bg-gray-900 text-gray-600 cursor-not-allowed opacity-50' : 'bg-gray-850 hover:bg-gray-800 text-gray-300 border border-gray-750'
                  }`}
                  title={!canPurge ? formatText(t.rbac.permissionDeniedTooltip, { role: t.rbac.roles[role]?.name || role }) : ''}
                >
                  {t.quickActions.btnTurnOff}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Modal Close */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-5 right-5 text-gray-400 hover:text-white text-sm p-1 transition-colors"
        >
          ✕
        </button>
      </div>
    </div>
  );
};
