'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useLanguage } from '@/context/LanguageContext';
import { ZoneConfigSnapshot, SavedSnapshot } from '@/types/cloudflare';
import { auditLogger } from '@/lib/audit/audit-logger';
import { formatDate } from '@/lib/utils';
import { 
  RotateCcw, 
  Plus, 
  Upload, 
  Download, 
  CheckCircle2, 
  AlertTriangle, 
  RefreshCw, 
  Layers, 
  ShieldCheck, 
  FileJson, 
  Calendar, 
  Clock, 
  Trash2,
  Lock,
  ArrowRight,
  GitCompare
} from 'lucide-react';

const STORAGE_SNAPSHOTS_KEY = 'cf_saved_snapshots';

export const SnapshotRollbackTab: React.FC = () => {
  const { selectedZone, authFetch, hasPermission, role, activeAccount } = useAuth();
  const { language, t, formatText } = useLanguage();
  const canRollback = hasPermission('canRollbackSnapshot');

  const [snapshots, setSnapshots] = useState<SavedSnapshot[]>([]);
  const [selectedSnapshot, setSelectedSnapshot] = useState<SavedSnapshot | null>(null);
  const [liveSnapshot, setLiveSnapshot] = useState<ZoneConfigSnapshot | null>(null);
  const [isDiffLoading, setIsDiffLoading] = useState(false);
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Modals state
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isConfirmRestoreOpen, setIsConfirmRestoreOpen] = useState(false);
  const [isRestoring, setIsRestoring] = useState(false);
  const [newSnapshotForm, setNewSnapshotForm] = useState({ name: '', description: '' });

  // Load Saved Snapshots from localStorage
  const loadSavedSnapshots = () => {
    if (!selectedZone) return;
    try {
      const raw = localStorage.getItem(STORAGE_SNAPSHOTS_KEY);
      let list: SavedSnapshot[] = raw ? JSON.parse(raw) : [];

      // If empty for this zone, create initial default baseline snapshot
      const forCurrentZone = list.filter((s) => s.zoneId === selectedZone.id || s.zoneName === selectedZone.name);
      if (forCurrentZone.length === 0) {
        const defaultSnap: SavedSnapshot = {
          id: `snap-${Date.now()}`,
          name: `Baseline Gold Snapshot (${selectedZone.name})`,
          description: 'Bản sao lưu cấu hình chuẩn DevSecOps ban đầu (SSL Strict, TLS 1.3, Always HTTPS, WAF)',
          createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2).toISOString(),
          createdBy: activeAccount?.name || 'DevSecOps Admin',
          zoneName: selectedZone.name,
          zoneId: selectedZone.id,
          data: {
            version: '4.0.0',
            exported_at: new Date().toISOString(),
            zone: selectedZone,
            dns_records: [],
            ssl_mode: 'strict',
            min_tls_version: '1.2',
            always_use_https: true,
            hsts: { enabled: true, max_age: 31536000, include_subdomains: true, preload: true, nosniff: true },
            security_level: 'medium',
            firewall_rules: [],
            ip_access_rules: [],
            page_rules: [],
          },
        };
        list = [defaultSnap, ...list];
        localStorage.setItem(STORAGE_SNAPSHOTS_KEY, JSON.stringify(list));
      }

      setSnapshots(list.filter((s) => s.zoneId === selectedZone.id || s.zoneName === selectedZone.name));
      if (!selectedSnapshot && list.length > 0) {
        setSelectedSnapshot(list[0]);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const loadLiveState = async () => {
    if (!selectedZone) return;
    setIsDiffLoading(true);
    try {
      const live: ZoneConfigSnapshot = await authFetch(
        `/api/audit?zoneId=${selectedZone.id}&action=export_snapshot&lang=${language}`
      );
      setLiveSnapshot(live);
    } catch (err) {
      console.error('Failed to load live snapshot:', err);
    } finally {
      setIsDiffLoading(false);
    }
  };

  useEffect(() => {
    loadSavedSnapshots();
    loadLiveState();
  }, [selectedZone?.id]);

  const handleCreateSnapshot = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedZone) return;

    try {
      const liveData: ZoneConfigSnapshot = await authFetch(
        `/api/audit?zoneId=${selectedZone.id}&action=export_snapshot&lang=${language}`
      );

      const newSnap: SavedSnapshot = {
        id: `snap-${Date.now()}`,
        name: newSnapshotForm.name.trim() || `Snapshot ${selectedZone.name} ${new Date().toLocaleDateString()}`,
        description: newSnapshotForm.description.trim() || 'Bản sao lưu cấu hình tạo thủ công từ Dashboard',
        createdAt: new Date().toISOString(),
        createdBy: activeAccount?.name || 'Current Operator',
        zoneName: selectedZone.name,
        zoneId: selectedZone.id,
        data: liveData,
      };

      const raw = localStorage.getItem(STORAGE_SNAPSHOTS_KEY);
      const all: SavedSnapshot[] = raw ? JSON.parse(raw) : [];
      const updated = [newSnap, ...all];
      localStorage.setItem(STORAGE_SNAPSHOTS_KEY, JSON.stringify(updated));

      auditLogger.recordLog({
        actorName: activeAccount?.name || 'Operator',
        actorRole: role,
        actionType: 'EXPORT_SNAPSHOT',
        zoneName: selectedZone.name,
        zoneId: selectedZone.id,
        resource: `Created Snapshot: "${newSnap.name}"`,
        status: 'SUCCESS',
        details: `Đã tạo bản Snapshot sao lưu mới "${newSnap.name}" cho domain ${selectedZone.name}.`,
      });

      setSnapshots(updated.filter((s) => s.zoneId === selectedZone.id || s.zoneName === selectedZone.name));
      setSelectedSnapshot(newSnap);
      setIsCreateModalOpen(false);
      setNewSnapshotForm({ name: '', description: '' });
      setNotification({
        type: 'success',
        text: formatText(t.auditView.messages.snapshotCreated, { name: newSnap.name }),
      });
      setTimeout(() => setNotification(null), 3000);
    } catch (err: any) {
      setNotification({ type: 'error', text: err.message || t.auditView.messages.exportError });
    }
  };

  const handleUploadJson = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !selectedZone) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed: ZoneConfigSnapshot = JSON.parse(event.target?.result as string);
        const newSnap: SavedSnapshot = {
          id: `snap-import-${Date.now()}`,
          name: `Imported: ${file.name}`,
          description: `Được tải lên từ file JSON máy tính (${(file.size / 1024).toFixed(1)} KB)`,
          createdAt: new Date().toISOString(),
          createdBy: activeAccount?.name || 'Imported File',
          zoneName: selectedZone.name,
          zoneId: selectedZone.id,
          data: parsed,
        };

        const raw = localStorage.getItem(STORAGE_SNAPSHOTS_KEY);
        const all: SavedSnapshot[] = raw ? JSON.parse(raw) : [];
        const updated = [newSnap, ...all];
        localStorage.setItem(STORAGE_SNAPSHOTS_KEY, JSON.stringify(updated));
        setSnapshots(updated.filter((s) => s.zoneId === selectedZone.id || s.zoneName === selectedZone.name));
        setSelectedSnapshot(newSnap);

        setNotification({
          type: 'success',
          text: `Đã import thành công Snapshot từ file "${file.name}"!`,
        });
        setTimeout(() => setNotification(null), 3000);
      } catch (err: any) {
        setNotification({ type: 'error', text: 'File JSON không hợp lệ hoặc sai định dạng snapshot.' });
      }
    };
    reader.readAsText(file);
  };

  const handleExecuteRollback = async () => {
    if (!selectedZone || !selectedSnapshot || !canRollback) return;
    setIsRestoring(true);

    try {
      const res = await authFetch('/api/rollback', {
        method: 'POST',
        body: JSON.stringify({
          zoneId: selectedZone.id,
          snapshot: selectedSnapshot.data,
        }),
      });

      auditLogger.recordLog({
        actorName: activeAccount?.name || 'Operator',
        actorRole: role,
        actionType: 'RESTORE_SNAPSHOT',
        zoneName: selectedZone.name,
        zoneId: selectedZone.id,
        resource: `Restored from Snapshot: "${selectedSnapshot.name}"`,
        status: 'SUCCESS',
        details: `Đã khôi phục toàn bộ cấu hình Zone ${selectedZone.name} về trạng thái bản sao lưu "${selectedSnapshot.name}".`,
      });

      setIsConfirmRestoreOpen(false);
      setNotification({ type: 'success', text: t.auditView.messages.restoreSuccess });
      await loadLiveState();
      setTimeout(() => setNotification(null), 4000);
    } catch (err: any) {
      setNotification({
        type: 'error',
        text: formatText(t.auditView.messages.restoreFailed, { error: err.message || t.common.error }),
      });
    } finally {
      setIsRestoring(false);
    }
  };

  const handleDeleteSnapshot = (id: string, name: string) => {
    if (!confirm(`Bạn có chắc chắn muốn xóa bản snapshot "${name}"?`)) return;
    const raw = localStorage.getItem(STORAGE_SNAPSHOTS_KEY);
    const all: SavedSnapshot[] = raw ? JSON.parse(raw) : [];
    const updated = all.filter((s) => s.id !== id);
    localStorage.setItem(STORAGE_SNAPSHOTS_KEY, JSON.stringify(updated));
    setSnapshots(updated.filter((s) => s.zoneId === selectedZone?.id || s.zoneName === selectedZone?.name));
    if (selectedSnapshot?.id === id) {
      setSelectedSnapshot(updated[0] || null);
    }
  };

  // Compare diff items between Selected Snapshot and Live state
  const diffItems = [
    {
      category: 'SSL/TLS Mode',
      key: 'SSL Encryption',
      snapshotVal: (selectedSnapshot?.data.ssl_mode || 'strict').toUpperCase(),
      liveVal: (liveSnapshot?.ssl_mode || 'unknown').toUpperCase(),
    },
    {
      category: 'Protocol Version',
      key: 'Minimum TLS Version',
      snapshotVal: `TLS ${selectedSnapshot?.data.min_tls_version || '1.2'}`,
      liveVal: `TLS ${liveSnapshot?.min_tls_version || '1.0'}`,
    },
    {
      category: 'HTTPS Enforcement',
      key: 'Always Use HTTPS',
      snapshotVal: selectedSnapshot?.data.always_use_https ? 'ON' : 'OFF',
      liveVal: liveSnapshot?.always_use_https ? 'ON' : 'OFF',
    },
    {
      category: 'Security Posture',
      key: 'Security Level',
      snapshotVal: (selectedSnapshot?.data.security_level || 'medium').toUpperCase(),
      liveVal: (liveSnapshot?.security_level || 'medium').toUpperCase(),
    },
    {
      category: 'DNS Management',
      key: 'DNS Records Count',
      snapshotVal: `${selectedSnapshot?.data.dns_records?.length || 0} records`,
      liveVal: `${liveSnapshot?.dns_records?.length || 0} records (Live)`,
    },
    {
      category: 'WAF Firewall',
      key: 'WAF Rules Count',
      snapshotVal: `${selectedSnapshot?.data.firewall_rules?.length || 0} rules`,
      liveVal: `${liveSnapshot?.firewall_rules?.length || 0} rules (Live)`,
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="p-5 rounded-2xl bg-gray-900/70 border border-gray-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <RotateCcw className="w-5 h-5 text-purple-400" />
            <span>{t.auditView.rollbackSection.title}</span>
          </h2>
          <p className="text-xs text-gray-400">
            {t.auditView.rollbackSection.subtitle}
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-600 hover:to-indigo-700 text-white text-xs font-semibold shadow-md shadow-purple-500/20 transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>{t.auditView.rollbackSection.createSnapshotBtn}</span>
          </button>

          <label className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gray-800 hover:bg-gray-750 text-gray-200 border border-gray-700 text-xs font-semibold cursor-pointer transition-colors">
            <Upload className="w-3.5 h-3.5" />
            <span>{t.auditView.rollbackSection.uploadJsonBtn}</span>
            <input type="file" accept=".json" onChange={handleUploadJson} className="hidden" />
          </label>
        </div>
      </div>

      {notification && (
        <div className={`p-4 rounded-xl text-xs flex items-center gap-2.5 ${
          notification.type === 'success' ? 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-400' : 'bg-rose-500/10 border border-rose-500/30 text-rose-400'
        }`}>
          {notification.type === 'success' ? <CheckCircle2 className="w-4 h-4 shrink-0" /> : <AlertTriangle className="w-4 h-4 shrink-0" />}
          <div>{notification.text}</div>
        </div>
      )}

      {/* Snapshots Grid & Diff Inspector */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Left: Snapshots List */}
        <div className="lg:col-span-1 space-y-3">
          <h3 className="text-xs font-bold uppercase tracking-wider text-gray-400">
            Snapshots Lưu Trữ ({snapshots.length})
          </h3>

          <div className="space-y-2.5 max-h-[520px] overflow-y-auto pr-1">
            {snapshots.length === 0 ? (
              <div className="p-8 text-center text-xs text-gray-500 rounded-xl bg-gray-950 border border-gray-850">
                {t.auditView.rollbackSection.noSnapshots}
              </div>
            ) : (
              snapshots.map((snap) => {
                const isSelected = selectedSnapshot?.id === snap.id;
                return (
                  <div
                    key={snap.id}
                    onClick={() => setSelectedSnapshot(snap)}
                    className={`p-4 rounded-2xl border cursor-pointer transition-all ${
                      isSelected
                        ? 'bg-gray-950 border-purple-500/50 shadow-lg shadow-purple-500/5 ring-1 ring-purple-500/20'
                        : 'bg-gray-950/70 border-gray-800/80 hover:border-gray-700'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2 mb-1.5">
                      <span className="font-bold text-xs text-white truncate">{snap.name}</span>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteSnapshot(snap.id, snap.name);
                        }}
                        className="text-gray-500 hover:text-rose-400 p-1"
                        title={t.common.delete}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <p className="text-[11px] text-gray-400 line-clamp-2 mb-2">
                      {snap.description}
                    </p>

                    <div className="flex items-center justify-between text-[10px] text-gray-500 font-mono pt-2 border-t border-gray-850">
                      <span>{formatDate(snap.createdAt)}</span>
                      <span className="text-purple-400">{snap.createdBy}</span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right: Pre-Restore Diff Inspector & 1-Click Action */}
        <div className="lg:col-span-2 space-y-4">
          {selectedSnapshot ? (
            <div className="p-5 rounded-2xl bg-gray-900/70 border border-gray-800 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-gray-800">
                <div>
                  <h3 className="text-base font-bold text-white flex items-center gap-2">
                    <FileJson className="w-4 h-4 text-purple-400" />
                    <span>{selectedSnapshot.name}</span>
                  </h3>
                  <span className="text-xs text-gray-400">{selectedSnapshot.description}</span>
                </div>

                <button
                  onClick={() => setIsConfirmRestoreOpen(true)}
                  disabled={!canRollback || isRestoring}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-600 hover:to-indigo-700 text-white text-xs font-semibold shadow-lg shadow-purple-500/20 disabled:opacity-50 transition-all"
                  title={!canRollback ? formatText(t.rbac.permissionDeniedTooltip, { role: t.rbac.roles[role]?.name || role }) : ''}
                >
                  <RotateCcw className={`w-3.5 h-3.5 ${isRestoring ? 'animate-spin' : ''}`} />
                  <span>{isRestoring ? t.auditView.rollbackSection.restoring : t.auditView.rollbackSection.restoreBtn}</span>
                </button>
              </div>

              {/* Pre-Restore Diff Table */}
              <div className="space-y-2">
                <span className="text-xs font-bold text-white flex items-center gap-1.5">
                  <GitCompare className="w-3.5 h-3.5 text-cyan-400" />
                  {t.auditView.rollbackSection.diffTableTitle}
                </span>

                <div className="rounded-xl border border-gray-800 bg-gray-950 overflow-hidden">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-gray-800 bg-gray-900/60 text-gray-400 text-[10px] uppercase font-bold font-mono">
                        <th className="py-2.5 px-3">Tham số cấu hình</th>
                        <th className="py-2.5 px-3 text-purple-300">Giá trị Snapshot (Sẽ khôi phục)</th>
                        <th className="py-2.5 px-3 text-gray-400">Giá trị Live Hiện tại</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-850">
                      {diffItems.map((item, idx) => {
                        const isDiff = item.snapshotVal !== item.liveVal;
                        return (
                          <tr key={idx} className={`hover:bg-gray-900/40 transition-colors ${isDiff ? 'bg-purple-500/5' : ''}`}>
                            <td className="py-2.5 px-3 font-semibold text-gray-300">{item.key}</td>
                            <td className="py-2.5 px-3 font-mono font-bold text-purple-400">{item.snapshotVal}</td>
                            <td className="py-2.5 px-3 font-mono text-gray-400">
                              <span className={isDiff ? 'text-amber-400 font-semibold' : 'text-gray-400'}>
                                {item.liveVal}
                              </span>
                              {isDiff && <span className="ml-2 text-[9px] px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 uppercase">Diff</span>}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          ) : (
            <div className="p-12 text-center text-xs text-gray-500 rounded-2xl bg-gray-900/50 border border-gray-800">
              Vui lòng chọn 1 bản Snapshot bên trái để xem chi tiết đối soát.
            </div>
          )}
        </div>
      </div>

      {/* Modal: Create Snapshot */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-md p-4 animate-in fade-in duration-150">
          <div className="w-full max-w-md rounded-2xl bg-gray-900 border border-gray-800 p-6 shadow-2xl space-y-4 relative">
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <FileJson className="w-4 h-4 text-purple-400" />
              {t.auditView.rollbackSection.modalCreateTitle}
            </h2>

            <form onSubmit={handleCreateSnapshot} className="space-y-3.5">
              <div>
                <label className="block text-[11px] font-semibold text-gray-300 mb-1">
                  {t.auditView.rollbackSection.snapshotNameLabel}
                </label>
                <input
                  type="text"
                  required
                  value={newSnapshotForm.name}
                  onChange={(e) => setNewSnapshotForm({ ...newSnapshotForm, name: e.target.value })}
                  placeholder={t.auditView.rollbackSection.snapshotNamePlaceholder}
                  className="w-full bg-gray-950 border border-gray-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-purple-500 font-medium"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-gray-300 mb-1">
                  {t.auditView.rollbackSection.snapshotDescLabel}
                </label>
                <textarea
                  rows={3}
                  value={newSnapshotForm.description}
                  onChange={(e) => setNewSnapshotForm({ ...newSnapshotForm, description: e.target.value })}
                  placeholder={t.auditView.rollbackSection.snapshotDescPlaceholder}
                  className="w-full bg-gray-950 border border-gray-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-purple-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-gray-800">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-gray-800 hover:bg-gray-750 text-gray-300 text-xs font-semibold"
                >
                  {t.common.cancel}
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-purple-500 hover:bg-purple-600 text-white text-xs font-semibold shadow-md shadow-purple-500/20"
                >
                  {t.auditView.rollbackSection.saveSnapshotBtn}
                </button>
              </div>
            </form>

            <button
              type="button"
              onClick={() => setIsCreateModalOpen(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-white text-sm p-1"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {/* Modal: Confirm 1-Click Restore */}
      {isConfirmRestoreOpen && selectedSnapshot && selectedZone && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-in fade-in duration-150">
          <div className="w-full max-w-md rounded-2xl bg-gray-900 border border-purple-500/50 p-6 shadow-2xl space-y-4 relative">
            <div className="p-3 rounded-full bg-purple-500/10 border border-purple-500/30 text-purple-400 w-fit mx-auto">
              <RotateCcw className="w-6 h-6" />
            </div>

            <div className="text-center space-y-1">
              <h2 className="text-base font-bold text-white">
                {t.auditView.rollbackSection.restoreConfirmTitle}
              </h2>
              <p className="text-xs text-gray-300 leading-relaxed">
                {formatText(t.auditView.rollbackSection.restoreConfirmMsg, {
                  zone: selectedZone.name,
                  name: selectedSnapshot.name,
                })}
              </p>
            </div>

            <div className="p-3 rounded-xl bg-gray-950 border border-gray-800 text-xs font-mono space-y-1">
              <div className="text-gray-400">Target Zone: <span className="text-white">{selectedZone.name}</span></div>
              <div className="text-gray-400">Snapshot Source: <span className="text-purple-300">{selectedSnapshot.name}</span></div>
              <div className="text-gray-400">SSL Mode Restore: <span className="text-emerald-400">{(selectedSnapshot.data.ssl_mode || 'strict').toUpperCase()}</span></div>
            </div>

            <div className="flex items-center justify-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => setIsConfirmRestoreOpen(false)}
                className="px-4 py-2 rounded-xl bg-gray-800 hover:bg-gray-750 text-gray-300 text-xs font-semibold"
              >
                {t.common.cancel}
              </button>
              <button
                type="button"
                onClick={handleExecuteRollback}
                disabled={isRestoring}
                className="px-5 py-2 rounded-xl bg-gradient-to-r from-purple-500 to-indigo-600 text-white text-xs font-bold shadow-lg shadow-purple-500/30 disabled:opacity-50"
              >
                {isRestoring ? t.auditView.rollbackSection.restoring : 'Xác nhận Khôi phục Ngay'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
