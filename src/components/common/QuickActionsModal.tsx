'use client';

import React, { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useLanguage } from '@/context/LanguageContext';
import { Zap, Trash2, ShieldAlert, Code2, CheckCircle2, AlertCircle, RefreshCw } from 'lucide-react';

interface QuickActionsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const QuickActionsModal: React.FC<QuickActionsModalProps> = ({ isOpen, onClose }) => {
  const { selectedZone, authFetch, hasPermission, role } = useAuth();
  const { t, formatText } = useLanguage();
  const canPurge = hasPermission('canPurgeCache');
  const [loading, setLoading] = useState(false);
  const [purgeType, setPurgeType] = useState<'everything' | 'custom'>('everything');
  const [customUrls, setCustomUrls] = useState('');
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  if (!isOpen || !selectedZone) return null;

  const handlePurgeCache = async () => {
    setLoading(true);
    setMessage(null);
    try {
      if (purgeType === 'everything') {
        await authFetch(`/api/zones/${selectedZone.id}`, {
          method: 'POST',
          body: JSON.stringify({ action: 'purge_cache', purge_everything: true }),
        });
        setMessage({ type: 'success', text: t.quickActions.purgeSuccessAll });
      } else {
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
        setMessage({ type: 'success', text: formatText(t.quickActions.purgeSuccessUrls, { count: urls.length }) });
      }
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || t.quickActions.purgeError });
    } finally {
      setLoading(false);
    }
  };

  const handleToggleDevMode = async (enable: boolean) => {
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="w-full max-w-lg rounded-2xl bg-gray-900 border border-gray-800 p-6 shadow-2xl relative">
        <div className="flex items-center gap-3 mb-5">
          <div className="p-2.5 rounded-xl bg-orange-500/10 border border-orange-500/20 text-orange-500">
            <Zap className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              {t.quickActions.title}
            </h2>
            <p className="text-xs text-gray-400">{t.quickActions.subtitle} <span className="text-orange-400 font-mono font-medium">{selectedZone.name}</span></p>
          </div>
        </div>

        {message && (
          <div className={`p-3 rounded-xl mb-4 text-xs flex items-center gap-2 ${
            message.type === 'success' ? 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-400' : 'bg-rose-500/10 border border-rose-500/30 text-rose-400'
          }`}>
            {message.type === 'success' ? <CheckCircle2 className="w-4 h-4 shrink-0" /> : <AlertCircle className="w-4 h-4 shrink-0" />}
            <div>{message.text}</div>
          </div>
        )}

        <div className="space-y-4">
          {/* Purge Cache Section */}
          <div className="p-4 rounded-xl bg-gray-950 border border-gray-800">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2 text-sm font-semibold text-white">
                <Trash2 className="w-4 h-4 text-orange-400" />
                <span>{t.quickActions.purgeTitle}</span>
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setPurgeType('everything')}
                  className={`text-xs px-2.5 py-1 rounded-lg transition-colors ${purgeType === 'everything' ? 'bg-orange-500 text-white font-medium' : 'bg-gray-800 text-gray-400'}`}
                >
                  {t.quickActions.allCache}
                </button>
                <button
                  type="button"
                  onClick={() => setPurgeType('custom')}
                  className={`text-xs px-2.5 py-1 rounded-lg transition-colors ${purgeType === 'custom' ? 'bg-orange-500 text-white font-medium' : 'bg-gray-800 text-gray-400'}`}
                >
                  {t.quickActions.customUrl}
                </button>
              </div>
            </div>

            {purgeType === 'custom' ? (
              <div className="mb-3">
                <textarea
                  rows={3}
                  value={customUrls}
                  onChange={(e) => setCustomUrls(e.target.value)}
                  placeholder={t.quickActions.customUrlPlaceholder}
                  className="w-full bg-gray-900 border border-gray-800 rounded-lg p-2.5 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-orange-500 font-mono"
                />
              </div>
            ) : (
              <p className="text-xs text-gray-400 mb-3">
                {t.quickActions.purgeAllDesc}
              </p>
            )}

            <button
              onClick={() => canPurge && handlePurgeCache()}
              disabled={loading || !canPurge}
              className={`w-full text-white text-xs font-semibold py-2 px-3 rounded-lg flex items-center justify-center gap-1.5 transition-all ${
                !canPurge
                  ? 'bg-gray-800 text-gray-500 cursor-not-allowed opacity-60'
                  : 'bg-orange-600/80 hover:bg-orange-600 shadow-md shadow-orange-500/10'
              }`}
              title={!canPurge ? formatText(t.rbac.permissionDeniedTooltip, { role: t.rbac.roles[role]?.name || role }) : ''}
            >
              {loading ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
              {t.quickActions.purgeBtn}
            </button>
          </div>

          {/* Under Attack Mode & Dev Mode Quick Switches */}
          <div className="grid grid-cols-2 gap-3">
            <div className="p-4 rounded-xl bg-gray-950 border border-gray-800 flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-1.5 text-xs font-semibold text-rose-400 mb-1">
                  <ShieldAlert className="w-4 h-4 shrink-0" />
                  <span>{t.quickActions.underAttackTitle}</span>
                </div>
                <p className="text-[11px] text-gray-400 mb-3">
                  {t.quickActions.underAttackDesc}
                </p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => canPurge && handleToggleUnderAttack(true)}
                  disabled={loading || !canPurge}
                  className={`flex-1 py-1.5 px-2 rounded-lg text-xs font-semibold ${
                    !canPurge ? 'bg-gray-800 text-gray-500 cursor-not-allowed opacity-50' : 'bg-rose-600/80 hover:bg-rose-600 text-white'
                  }`}
                  title={!canPurge ? formatText(t.rbac.permissionDeniedTooltip, { role: t.rbac.roles[role]?.name || role }) : ''}
                >
                  {t.quickActions.btnEnableEmergency}
                </button>
                <button
                  onClick={() => canPurge && handleToggleUnderAttack(false)}
                  disabled={loading || !canPurge}
                  className={`flex-1 py-1.5 px-2 rounded-lg text-xs ${
                    !canPurge ? 'bg-gray-900 text-gray-600 cursor-not-allowed opacity-50' : 'bg-gray-800 hover:bg-gray-750 text-gray-300'
                  }`}
                  title={!canPurge ? formatText(t.rbac.permissionDeniedTooltip, { role: t.rbac.roles[role]?.name || role }) : ''}
                >
                  {t.quickActions.btnTurnOff}
                </button>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-gray-950 border border-gray-800 flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-1.5 text-xs font-semibold text-amber-400 mb-1">
                  <Code2 className="w-4 h-4 shrink-0" />
                  <span>{t.quickActions.devModeTitle}</span>
                </div>
                <p className="text-[11px] text-gray-400 mb-3">
                  {t.quickActions.devModeDesc}
                </p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => canPurge && handleToggleDevMode(true)}
                  disabled={loading || !canPurge}
                  className={`flex-1 py-1.5 px-2 rounded-lg text-xs font-semibold ${
                    !canPurge ? 'bg-gray-800 text-gray-500 cursor-not-allowed opacity-50' : 'bg-amber-600/80 hover:bg-amber-600 text-white'
                  }`}
                  title={!canPurge ? formatText(t.rbac.permissionDeniedTooltip, { role: t.rbac.roles[role]?.name || role }) : ''}
                >
                  {t.quickActions.btnEnable3h}
                </button>
                <button
                  onClick={() => canPurge && handleToggleDevMode(false)}
                  disabled={loading || !canPurge}
                  className={`flex-1 py-1.5 px-2 rounded-lg text-xs ${
                    !canPurge ? 'bg-gray-900 text-gray-600 cursor-not-allowed opacity-50' : 'bg-gray-800 hover:bg-gray-750 text-gray-300'
                  }`}
                  title={!canPurge ? formatText(t.rbac.permissionDeniedTooltip, { role: t.rbac.roles[role]?.name || role }) : ''}
                >
                  {t.quickActions.btnTurnOff}
                </button>
              </div>
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-500 hover:text-gray-300 text-sm p-1"
        >
          ✕
        </button>
      </div>
    </div>
  );
};
