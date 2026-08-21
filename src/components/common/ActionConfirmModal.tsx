'use client';

import React, { useState } from 'react';
import { 
  AlertTriangle, 
  AlertCircle, 
  Info, 
  RefreshCw, 
  ShieldAlert, 
  Trash2, 
  CheckCircle2, 
  X 
} from 'lucide-react';
import { useLanguage } from '@/context/LanguageContext';

export interface ActionConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void> | void;
  title: string;
  description: React.ReactNode;
  confirmText?: string;
  cancelText?: string;
  variant?: 'danger' | 'warning' | 'info';
  affectedResource?: {
    label: string;
    value: string;
    badge?: string;
  };
  warningNote?: string;
  isLoading?: boolean;
}

export const ActionConfirmModal: React.FC<ActionConfirmModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  description,
  confirmText,
  cancelText,
  variant = 'warning',
  affectedResource,
  warningNote,
  isLoading: externalLoading = false,
}) => {
  const { t } = useLanguage();
  const [internalLoading, setInternalLoading] = useState(false);
  const loading = externalLoading || internalLoading;

  if (!isOpen) return null;

  const handleConfirm = async () => {
    try {
      setInternalLoading(true);
      await onConfirm();
      onClose();
    } catch (e) {
      console.error(e);
    } finally {
      setInternalLoading(false);
    }
  };

  const getVariantStyles = () => {
    switch (variant) {
      case 'danger':
        return {
          icon: <Trash2 className="w-5 h-5 text-rose-400" />,
          iconBg: 'bg-rose-500/10 border-rose-500/20 text-rose-400',
          confirmBtn: 'bg-gradient-to-r from-rose-500 to-red-600 hover:from-rose-600 hover:to-red-700 text-white shadow-rose-500/20',
          borderColor: 'border-rose-500/30',
          noteBg: 'bg-rose-500/10 border-rose-500/20 text-rose-300',
        };
      case 'info':
        return {
          icon: <Info className="w-5 h-5 text-cyan-400" />,
          iconBg: 'bg-cyan-500/10 border-cyan-500/20 text-cyan-400',
          confirmBtn: 'bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white shadow-cyan-500/20',
          borderColor: 'border-cyan-500/30',
          noteBg: 'bg-cyan-500/10 border-cyan-500/20 text-cyan-300',
        };
      case 'warning':
      default:
        return {
          icon: <AlertTriangle className="w-5 h-5 text-amber-400" />,
          iconBg: 'bg-amber-500/10 border-amber-500/20 text-amber-400',
          confirmBtn: 'bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white shadow-amber-500/20',
          borderColor: 'border-amber-500/30',
          noteBg: 'bg-amber-500/10 border-amber-500/20 text-amber-300',
        };
    }
  };

  const styles = getVariantStyles();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 overflow-y-auto animate-in fade-in duration-150">
      <div 
        role="dialog"
        aria-modal="true"
        className="w-full max-w-lg rounded-2xl bg-gray-900 border border-gray-800 p-6 shadow-2xl relative my-8 animate-in fade-in zoom-in-95 duration-150"
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-3 mb-4">
          <div className="flex items-center gap-3">
            <div className={`p-2.5 rounded-xl border ${styles.iconBg}`}>
              {styles.icon}
            </div>
            <div>
              <h2 className="text-base font-bold text-white tracking-tight">
                {title}
              </h2>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={loading}
            className="text-gray-400 hover:text-white p-1 rounded-lg hover:bg-gray-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Affected Resource Highlight Card (if any) */}
        {affectedResource && (
          <div className="mb-4 p-3 rounded-xl bg-gray-950 border border-gray-800 flex items-center justify-between text-xs">
            <div>
              <span className="text-[11px] text-gray-400 block font-semibold">
                {affectedResource.label}
              </span>
              <span className="text-white font-mono font-bold text-xs truncate max-w-xs block mt-0.5">
                {affectedResource.value}
              </span>
            </div>
            {affectedResource.badge && (
              <span className="px-2 py-0.5 rounded-lg bg-gray-850 border border-gray-700 text-gray-300 font-mono text-[10px]">
                {affectedResource.badge}
              </span>
            )}
          </div>
        )}

        {/* Description / Explanation */}
        <div className="text-xs text-gray-300 leading-relaxed mb-4 space-y-2">
          {typeof description === 'string' ? <p>{description}</p> : description}
        </div>

        {/* Warning Note Box (if any) */}
        {warningNote && (
          <div className={`p-3 rounded-xl border text-[11px] leading-relaxed mb-5 flex items-start gap-2 ${styles.noteBg}`}>
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <div>{warningNote}</div>
          </div>
        )}

        {/* Footer Actions */}
        <div className="flex items-center justify-end gap-3 pt-3 border-t border-gray-800">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="px-4 py-2 rounded-xl text-xs font-semibold text-gray-300 hover:text-white hover:bg-gray-800 transition-colors"
          >
            {cancelText || t.common.cancel}
          </button>

          <button
            type="button"
            onClick={handleConfirm}
            disabled={loading}
            className={`px-4 py-2 rounded-xl text-xs font-semibold shadow-lg transition-all flex items-center gap-1.5 ${styles.confirmBtn} disabled:opacity-50`}
          >
            {loading && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
            <span>{confirmText || t.common.save}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
