'use client';

import React, { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useLanguage } from '@/context/LanguageContext';
import { 
  Building2, 
  Plus, 
  Trash2, 
  CheckCircle2, 
  ExternalLink, 
  RefreshCw, 
  AlertTriangle, 
  KeyRound, 
  Lock,
  Layers
} from 'lucide-react';
import { formatDate } from '@/lib/utils';

interface AccountManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AccountManagerModal: React.FC<AccountManagerModalProps> = ({ isOpen, onClose }) => {
  const { 
    accounts, 
    activeAccount, 
    addAccount, 
    switchAccount, 
    removeAccount, 
    hasPermission 
  } = useAuth();
  const { t, formatText } = useLanguage();

  const [isAdding, setIsAdding] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    organization: '',
    token: '',
  });
  const [isVerifying, setIsVerifying] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleVerifyAndAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.token.trim()) {
      setErrorMsg(t.tokenModal.errorEmpty);
      return;
    }

    setIsVerifying(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      if (formData.token.trim() !== 'demo-token') {
        const res = await fetch('/api/auth/verify', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token: formData.token.trim() }),
        });

        const data = await res.json();
        if (!res.ok || !data.success) {
          throw new Error(data.message || t.accountModal.errorInvalid);
        }
      }

      const newId = addAccount({
        name: formData.name.trim() || 'Cloudflare Account',
        organization: formData.organization.trim() || 'Main Org',
        token: formData.token.trim(),
        isDemo: formData.token.trim() === 'demo-token',
      });

      setSuccessMsg(formatText(t.accountModal.successAdded, { name: formData.name || 'Account' }));
      setIsAdding(false);
      setFormData({ name: '', organization: '', token: '' });
      setTimeout(() => {
        setSuccessMsg(null);
      }, 3000);
    } catch (err: any) {
      setErrorMsg(err.message || t.accountModal.errorInvalid);
    } finally {
      setIsVerifying(false);
    }
  };

  const handleDelete = (id: string, name: string) => {
    if (!confirm(formatText(t.accountModal.confirmDelete, { name }))) return;
    removeAccount(id);
    setSuccessMsg(t.accountModal.successDeleted);
    setTimeout(() => setSuccessMsg(null), 2500);
  };

  const handleSwitch = (id: string, name: string) => {
    switchAccount(id);
    setSuccessMsg(formatText(t.accountModal.successSwitched, { name }));
    setTimeout(() => {
      setSuccessMsg(null);
      onClose();
    }, 800);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="w-full max-w-2xl rounded-2xl bg-gray-900 border border-gray-800 p-6 shadow-2xl relative max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-gray-800">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-orange-500/10 border border-orange-500/20 text-orange-400">
              <Building2 className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white tracking-tight flex items-center gap-2">
                {t.accountModal.title}
                <span className="text-[11px] px-2 py-0.5 rounded-full bg-gray-800 text-cyan-400 border border-gray-700 font-mono">
                  {accounts.length} Profiles
                </span>
              </h2>
              <p className="text-xs text-gray-400">{t.accountModal.subtitle}</p>
            </div>
          </div>

          <button
            onClick={() => setIsAdding(!isAdding)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white text-xs font-semibold shadow-md shadow-orange-500/20 transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>{isAdding ? t.accountModal.btnCancel : t.accountModal.addBtn}</span>
          </button>
        </div>

        {/* Alerts */}
        {errorMsg && (
          <div className="mt-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <div>{errorMsg}</div>
          </div>
        )}

        {successMsg && (
          <div className="mt-4 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <div>{successMsg}</div>
          </div>
        )}

        {/* Add Account Form */}
        {isAdding && (
          <form onSubmit={handleVerifyAndAdd} className="mt-4 p-4 rounded-2xl bg-gray-950 border border-orange-500/30 space-y-3.5">
            <h3 className="text-xs font-bold text-orange-400 flex items-center gap-1.5 uppercase tracking-wider">
              <KeyRound className="w-4 h-4" />
              <span>{t.accountModal.addTitle}</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-semibold text-gray-300 mb-1">{t.accountModal.nameLabel}</label>
                <input
                  type="text"
                  required
                  placeholder={t.accountModal.namePlaceholder}
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full bg-gray-900 border border-gray-800 rounded-xl px-3 py-2 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-orange-500 font-medium"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-gray-300 mb-1">{t.accountModal.orgLabel}</label>
                <input
                  type="text"
                  placeholder={t.accountModal.orgPlaceholder}
                  value={formData.organization}
                  onChange={(e) => setFormData({ ...formData, organization: e.target.value })}
                  className="w-full bg-gray-900 border border-gray-800 rounded-xl px-3 py-2 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-orange-500 font-medium"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-[11px] font-semibold text-gray-300">{t.accountModal.tokenLabel}</label>
                <a
                  href="https://dash.cloudflare.com/profile/api-tokens"
                  target="_blank"
                  rel="noreferrer"
                  className="text-[10px] text-orange-400 hover:text-orange-300 flex items-center gap-1"
                >
                  <span>{t.tokenModal.createTokenLink}</span>
                  <ExternalLink className="w-2.5 h-2.5" />
                </a>
              </div>
              <input
                type="password"
                required
                placeholder={t.accountModal.tokenPlaceholder}
                value={formData.token}
                onChange={(e) => setFormData({ ...formData, token: e.target.value })}
                className="w-full bg-gray-900 border border-gray-800 rounded-xl px-3 py-2 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-orange-500 font-mono"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setIsAdding(false)}
                className="px-3 py-1.5 rounded-xl border border-gray-700 bg-gray-800 hover:bg-gray-750 text-gray-300 text-xs font-medium"
              >
                {t.accountModal.btnCancel}
              </button>
              <button
                type="submit"
                disabled={isVerifying}
                className="flex items-center gap-1.5 px-4 py-1.5 rounded-xl bg-orange-500 hover:bg-orange-600 text-white text-xs font-semibold shadow-md shadow-orange-500/20 disabled:opacity-50"
              >
                {isVerifying && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                <span>{isVerifying ? t.tokenModal.btnVerifying : t.accountModal.btnVerify}</span>
              </button>
            </div>
          </form>
        )}

        {/* Accounts List */}
        <div className="mt-4 space-y-2.5 overflow-y-auto flex-1 pr-1 max-h-[400px]">
          {accounts.length === 0 ? (
            <div className="p-8 text-center text-gray-500 text-xs rounded-xl bg-gray-950 border border-gray-850">
              {t.accountModal.emptyAccounts}
            </div>
          ) : (
            accounts.map((acc) => {
              const isActive = activeAccount?.id === acc.id;

              return (
                <div
                  key={acc.id}
                  className={`p-4 rounded-2xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                    isActive
                      ? 'bg-gray-950 border-orange-500/50 shadow-lg shadow-orange-500/5 ring-1 ring-orange-500/20'
                      : 'bg-gray-950/60 border-gray-800/80 hover:border-gray-700'
                  }`}
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-white tracking-tight">{acc.name}</span>
                      {isActive && (
                        <span className="px-2 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-[10px] font-bold">
                          ✓ {t.accountModal.activeBadge}
                        </span>
                      )}
                      {acc.isDemo && (
                        <span className="px-2 py-0.5 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-400 text-[10px] font-bold">
                          {t.accountModal.demoBadge}
                        </span>
                      )}
                    </div>

                    <div className="flex flex-wrap items-center gap-3 text-[11px] text-gray-400">
                      <span className="flex items-center gap-1">
                        <Layers className="w-3 h-3 text-gray-500" />
                        <span>{acc.organization || 'Cloudflare Org'}</span>
                      </span>
                      <span className="font-mono text-gray-500 text-[10px]">
                        Token: {acc.token === 'demo-token' ? 'demo-sandbox' : `••••${acc.token.slice(-6)}`}
                      </span>
                      <span className="text-gray-500 text-[10px]">
                        {formatDate(acc.addedAt)}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 self-end sm:self-center">
                    {!isActive ? (
                      <button
                        onClick={() => handleSwitch(acc.id, acc.name)}
                        className="px-3 py-1.5 rounded-xl bg-gray-800 hover:bg-gray-700 text-gray-200 text-xs font-semibold border border-gray-700 transition-colors"
                      >
                        {t.accountModal.btnSwitch}
                      </button>
                    ) : (
                      <span className="px-3 py-1.5 text-xs text-emerald-400 font-bold font-mono">
                        Active
                      </span>
                    )}

                    {accounts.length > 1 && (
                      <button
                        onClick={() => handleDelete(acc.id, acc.name)}
                        className="p-1.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 transition-colors"
                        title={t.accountModal.btnDelete}
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="pt-4 mt-4 border-t border-gray-800 flex items-center justify-between">
          <span className="text-[11px] text-gray-500">
            {t.sidebar.automationCard.restApi} • Client-Side Token Isolation
          </span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl bg-gray-800 hover:bg-gray-750 text-gray-300 text-xs font-medium border border-gray-700"
          >
            {t.common.close}
          </button>
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
