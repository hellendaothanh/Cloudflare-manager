'use client';

import React, { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useLanguage } from '@/context/LanguageContext';
import { Key, ShieldCheck, AlertTriangle, CheckCircle2, Lock, ExternalLink, RefreshCw } from 'lucide-react';

interface TokenModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const TokenModal: React.FC<TokenModalProps> = ({ isOpen, onClose }) => {
  const { token, setToken, isDemo, setDemoMode } = useAuth();
  const { t } = useLanguage();
  const [inputToken, setInputToken] = useState(isDemo ? '' : token);
  const [isVerifying, setIsVerifying] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleVerifyAndSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputToken.trim()) {
      setErrorMsg(t.tokenModal.errorEmpty);
      return;
    }

    setIsVerifying(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      const res = await fetch('/api/auth/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: inputToken.trim() }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || t.tokenModal.errorInvalid);
      }

      setToken(inputToken.trim());
      setSuccessMsg(t.tokenModal.successMsg);
      setTimeout(() => {
        onClose();
      }, 1000);
    } catch (err: any) {
      setErrorMsg(err.message || t.tokenModal.errorGeneric);
    } finally {
      setIsVerifying(false);
    }
  };

  const handleUseDemo = () => {
    setDemoMode();
    setSuccessMsg(t.tokenModal.demoSuccessMsg);
    setTimeout(() => {
      onClose();
    }, 800);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="w-full max-w-lg rounded-2xl bg-gray-900 border border-gray-800 p-6 shadow-2xl relative">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-3 rounded-xl bg-orange-500/10 border border-orange-500/20 text-orange-500">
            <Key className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              {t.tokenModal.title}
              {isDemo && <span className="text-xs px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/30">{t.tokenModal.demoTag}</span>}
            </h2>
            <p className="text-xs text-gray-400">{t.tokenModal.subtitle}</p>
          </div>
        </div>

        <form onSubmit={handleVerifyAndSave} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-gray-300 mb-1.5 flex items-center justify-between">
              <span>{t.tokenModal.label}</span>
              <a
                href="https://dash.cloudflare.com/profile/api-tokens"
                target="_blank"
                rel="noreferrer"
                className="text-orange-400 hover:text-orange-300 flex items-center gap-1 text-[11px]"
              >
                {t.tokenModal.createTokenLink} <ExternalLink className="w-3 h-3" />
              </a>
            </label>
            <div className="relative">
              <input
                type="password"
                placeholder={t.tokenModal.placeholder}
                value={inputToken}
                onChange={(e) => setInputToken(e.target.value)}
                className="w-full bg-gray-950 border border-gray-800 rounded-xl px-4 py-3 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 font-mono"
              />
              <Lock className="w-4 h-4 text-gray-500 absolute right-3.5 top-3.5" />
            </div>
            <p className="text-[11px] text-gray-400 mt-1">
              {t.tokenModal.recommendedScopes} <span className="text-gray-300 font-medium">{t.tokenModal.scopesList}</span>.
            </p>
          </div>

          {errorMsg && (
            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
              <div>{errorMsg}</div>
            </div>
          )}

          {successMsg && (
            <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <div>{successMsg}</div>
            </div>
          )}

          <div className="flex items-center gap-3 pt-2">
            <button
              type="submit"
              disabled={isVerifying}
              className="flex-1 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-medium py-2.5 px-4 rounded-xl text-sm transition-all shadow-lg shadow-orange-500/20 flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {isVerifying ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" /> {t.tokenModal.btnVerifying}
                </>
              ) : (
                <>
                  <ShieldCheck className="w-4 h-4" /> {t.tokenModal.btnConnect}
                </>
              )}
            </button>
            <button
              type="button"
              onClick={handleUseDemo}
              className="px-4 py-2.5 rounded-xl border border-gray-700 bg-gray-800 hover:bg-gray-750 text-gray-300 text-sm font-medium transition-all"
            >
              {t.tokenModal.btnDemo}
            </button>
          </div>
        </form>

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
