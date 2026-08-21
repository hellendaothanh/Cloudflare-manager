'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useLanguage } from '@/context/LanguageContext';
import { DnsRecord } from '@/types/cloudflare';
import { 
  Layers, 
  Plus, 
  Search, 
  Cloud, 
  CloudOff, 
  Trash2, 
  Edit, 
  Download, 
  CheckCircle2, 
  AlertCircle, 
  RefreshCw
} from 'lucide-react';
import { ActionConfirmModal } from '@/components/common/ActionConfirmModal';

export const DnsView: React.FC = () => {
  const { selectedZone, authFetch, hasPermission, role } = useAuth();
  const { t, formatText } = useLanguage();
  const canEditDns = hasPermission('canEditDns');
  const [records, setRecords] = useState<DnsRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState<string>('ALL');
  
  // Modal state for Add/Edit
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState<DnsRecord | null>(null);
  const [formData, setFormData] = useState({
    type: 'A',
    name: '@',
    content: '',
    ttl: 1, // 1 = Auto
    proxied: true,
    priority: 10,
    comment: '',
  });

  // Safety Confirmation Modals state
  const [proxyTargetRecord, setProxyTargetRecord] = useState<DnsRecord | null>(null);
  const [isProxyModalOpen, setIsProxyModalOpen] = useState(false);

  const [deleteTargetRecord, setDeleteTargetRecord] = useState<DnsRecord | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  const [notification, setNotification] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const fetchRecords = async () => {
    if (!selectedZone) return;
    setLoading(true);
    try {
      const data = await authFetch(`/api/dns?zoneId=${selectedZone.id}`);
      setRecords(Array.isArray(data) ? data : []);
    } catch (err: any) {
      setNotification({ type: 'error', text: err.message || t.common.error });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRecords();
  }, [selectedZone]);

  const confirmToggleProxy = async () => {
    if (!proxyTargetRecord || !selectedZone) return;
    const record = proxyTargetRecord;
    const newProxied = !record.proxied;

    // Optimistic UI update
    setRecords(prev => prev.map(r => r.id === record.id ? { ...r, proxied: newProxied } : r));

    try {
      await authFetch('/api/dns', {
        method: 'PATCH',
        body: JSON.stringify({
          zoneId: selectedZone.id,
          recordId: record.id,
          proxied: newProxied,
        }),
      });
      setNotification({
        type: 'success',
        text: formatText(t.dnsView.messages.proxyUpdated, {
          status: newProxied ? t.dnsView.messages.proxyOn : t.dnsView.messages.proxyOff,
          name: record.name,
        }),
      });
    } catch (err: any) {
      // Revert on error
      setRecords(prev => prev.map(r => r.id === record.id ? { ...r, proxied: record.proxied } : r));
      setNotification({ type: 'error', text: err.message || t.common.error });
    } finally {
      setProxyTargetRecord(null);
    }
  };

  const confirmDeleteRecord = async () => {
    if (!deleteTargetRecord || !selectedZone) return;
    const record = deleteTargetRecord;

    try {
      await authFetch(`/api/dns?zoneId=${selectedZone.id}&recordId=${record.id}`, {
        method: 'DELETE',
      });
      setRecords(prev => prev.filter(r => r.id !== record.id));
      setNotification({
        type: 'success',
        text: formatText(t.dnsView.messages.recordDeleted, { name: record.name }),
      });
    } catch (err: any) {
      setNotification({ type: 'error', text: err.message || t.common.error });
    } finally {
      setDeleteTargetRecord(null);
    }
  };

  const handleSaveRecord = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedZone) return;

    // Format domain name
    let finalName = formData.name.trim();
    if (finalName === '@') {
      finalName = selectedZone.name;
    } else if (!finalName.includes('.')) {
      finalName = `${finalName}.${selectedZone.name}`;
    }

    try {
      if (editingRecord) {
        await authFetch('/api/dns', {
          method: 'PATCH',
          body: JSON.stringify({
            zoneId: selectedZone.id,
            recordId: editingRecord.id,
            type: formData.type,
            name: finalName,
            content: formData.content.trim(),
            ttl: Number(formData.ttl),
            proxied: ['A', 'AAAA', 'CNAME'].includes(formData.type) ? formData.proxied : false,
            priority: ['MX', 'SRV'].includes(formData.type) ? Number(formData.priority) : undefined,
            comment: formData.comment.trim(),
          }),
        });
        setNotification({
          type: 'success',
          text: formatText(t.dnsView.messages.recordUpdated, { name: finalName }),
        });
      } else {
        await authFetch('/api/dns', {
          method: 'POST',
          body: JSON.stringify({
            zoneId: selectedZone.id,
            type: formData.type,
            name: finalName,
            content: formData.content.trim(),
            ttl: Number(formData.ttl),
            proxied: ['A', 'AAAA', 'CNAME'].includes(formData.type) ? formData.proxied : false,
            priority: ['MX', 'SRV'].includes(formData.type) ? Number(formData.priority) : undefined,
            comment: formData.comment.trim(),
          }),
        });
        setNotification({
          type: 'success',
          text: formatText(t.dnsView.messages.recordCreated, { type: formData.type, name: finalName }),
        });
      }

      setIsModalOpen(false);
      setEditingRecord(null);
      await fetchRecords();
    } catch (err: any) {
      setNotification({ type: 'error', text: err.message || t.common.error });
    }
  };

  const openAddModal = () => {
    setEditingRecord(null);
    setFormData({
      type: 'A',
      name: '@',
      content: '',
      ttl: 1,
      proxied: true,
      priority: 10,
      comment: '',
    });
    setIsModalOpen(true);
  };

  const openEditModal = (rec: DnsRecord) => {
    setEditingRecord(rec);
    setFormData({
      type: rec.type,
      name: rec.name,
      content: rec.content,
      ttl: rec.ttl,
      proxied: rec.proxied,
      priority: rec.priority || 10,
      comment: rec.comment || '',
    });
    setIsModalOpen(true);
  };

  const handleExportBIND = () => {
    if (!selectedZone || records.length === 0) return;
    let bindContent = `; BIND Zone File for ${selectedZone.name}\n; Exported from Cloudflare DevSecOps Manager at ${new Date().toISOString()}\n\n$ORIGIN ${selectedZone.name}.\n$TTL 3600\n\n`;
    
    records.forEach(r => {
      const ttl = r.ttl === 1 ? '3600' : r.ttl;
      if (r.type === 'MX') {
        bindContent += `${r.name}.\t${ttl}\tIN\tMX\t${r.priority || 10}\t${r.content}.\n`;
      } else if (r.type === 'TXT') {
        bindContent += `${r.name}.\t${ttl}\tIN\tTXT\t"${r.content}"\n`;
      } else {
        bindContent += `${r.name}.\t${ttl}\tIN\t${r.type}\t${r.content}\n`;
      }
    });

    const blob = new Blob([bindContent], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${selectedZone.name}.zone.txt`;
    a.click();
  };

  const filteredRecords = records.filter(r => {
    const matchesSearch = r.name.toLowerCase().includes(searchTerm.toLowerCase()) || r.content.toLowerCase().includes(searchTerm.toLowerCase()) || (r.comment && r.comment.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesType = selectedType === 'ALL' || r.type === selectedType;
    return matchesSearch && matchesType;
  });

  const recordTypes = ['ALL', 'A', 'AAAA', 'CNAME', 'TXT', 'MX', 'NS', 'SRV', 'CAA'];

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 rounded-2xl bg-gradient-to-r from-gray-900 via-gray-900/90 to-gray-950 border border-gray-800">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="p-2 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
              <Layers className="w-5 h-5" />
            </span>
            <h1 className="text-xl font-bold text-white tracking-tight">{t.dnsView.title}</h1>
          </div>
          <p className="text-xs text-gray-400">
            {t.dnsView.subtitle}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={fetchRecords}
            disabled={loading}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-gray-800 hover:bg-gray-750 border border-gray-700 text-gray-300 text-xs font-medium transition-all"
            title={t.dnsView.refreshBtn || t.common.refresh}
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-orange-400' : ''}`} />
            <span>{t.dnsView.refreshBtn || t.common.refresh}</span>
          </button>

          <button
            onClick={handleExportBIND}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-gray-800 hover:bg-gray-750 border border-gray-700 text-gray-300 text-xs font-medium transition-all"
            title="Export BIND"
          >
            <Download className="w-3.5 h-3.5" />
            <span>{t.dnsView.exportBindBtn}</span>
          </button>
          
          <button
            onClick={openAddModal}
            disabled={!canEditDns}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold shadow-lg transition-all ${
              canEditDns
                ? 'bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white shadow-orange-500/20'
                : 'bg-gray-800 text-gray-500 cursor-not-allowed opacity-60'
            }`}
            title={!canEditDns ? formatText(t.rbac.permissionDeniedTooltip, { role: t.rbac.roles[role]?.name || role }) : ''}
          >
            <Plus className="w-4 h-4" />
            <span>{t.dnsView.addRecordBtn}</span>
          </button>
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

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-3 rounded-2xl bg-gray-900/80 border border-gray-800">
        <div className="relative w-full sm:w-72">
          <input
            type="text"
            placeholder={t.dnsView.searchPlaceholder}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-gray-950 border border-gray-800 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-orange-500"
          />
          <Search className="w-3.5 h-3.5 text-gray-500 absolute left-3 top-2.5" />
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0">
          {recordTypes.map(rType => (
            <button
              key={rType}
              onClick={() => setSelectedType(rType)}
              className={`px-3 py-1 rounded-lg text-xs font-semibold transition-colors ${
                selectedType === rType
                  ? 'bg-orange-500 text-white'
                  : 'bg-gray-950 text-gray-400 hover:text-gray-200 border border-gray-800'
              }`}
            >
              {rType === 'ALL' ? t.dnsView.allTypes : rType}
            </button>
          ))}
        </div>
      </div>

      {/* Records Table */}
      <div className="rounded-2xl border border-gray-800 bg-gray-900/60 overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-gray-950/80 border-b border-gray-800 text-gray-400 uppercase font-semibold text-[10px] tracking-wider">
              <tr>
                <th className="py-3.5 px-4">{t.dnsView.table.type}</th>
                <th className="py-3.5 px-4">{t.dnsView.table.name}</th>
                <th className="py-3.5 px-4">{t.dnsView.table.content}</th>
                <th className="py-3.5 px-4 text-center">{t.dnsView.table.proxyStatus}</th>
                <th className="py-3.5 px-4">{t.dnsView.table.ttl}</th>
                <th className="py-3.5 px-4 text-right">{t.dnsView.table.actions}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800/60">
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-gray-500">
                    <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-orange-400" />
                    {t.common.loading}
                  </td>
                </tr>
              ) : filteredRecords.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-10 text-center text-gray-500">
                    {t.dnsView.noRecords}
                  </td>
                </tr>
              ) : (
                filteredRecords.map((record) => {
                  const canProxy = ['A', 'AAAA', 'CNAME'].includes(record.type);

                  return (
                    <tr key={record.id} className="hover:bg-gray-850/50 transition-colors group">
                      <td className="py-3.5 px-4 font-mono font-bold">
                        <span className="px-2 py-0.5 rounded-md bg-gray-800 border border-gray-700 text-amber-300">
                          {record.type}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 font-mono text-gray-200 font-medium">
                        {record.name}
                        {record.comment && (
                          <span className="block text-[10px] text-gray-500 font-sans font-normal mt-0.5">
                            {record.comment}
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 font-mono text-gray-300 max-w-xs truncate">
                        {record.type === 'MX' && record.priority ? (
                          <span className="text-gray-400 mr-1.5 font-bold">[{record.priority}]</span>
                        ) : null}
                        {record.content}
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        {canProxy ? (
                          <button
                            onClick={() => {
                              if (!canEditDns) return;
                              setProxyTargetRecord(record);
                              setIsProxyModalOpen(true);
                            }}
                            disabled={!canEditDns}
                            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold transition-all cursor-pointer ${
                              !canEditDns
                                ? 'opacity-50 cursor-not-allowed bg-gray-900 border-gray-800 text-gray-500'
                                : record.proxied
                                  ? 'bg-orange-500/20 text-orange-400 border border-orange-500/40 hover:bg-orange-500/30'
                                  : 'bg-gray-800 text-gray-400 border border-gray-700 hover:text-gray-200'
                            }`}
                            title={!canEditDns ? formatText(t.rbac.permissionDeniedTooltip, { role: t.rbac.roles[role]?.name || role }) : (record.proxied ? t.dnsView.proxiedTooltip : t.dnsView.dnsOnlyTooltip)}
                          >
                            {record.proxied ? (
                              <>
                                <Cloud className="w-3.5 h-3.5 fill-current text-orange-400" />
                                <span>Proxied</span>
                              </>
                            ) : (
                              <>
                                <CloudOff className="w-3.5 h-3.5" />
                                <span>DNS Only</span>
                              </>
                            )}
                          </button>
                        ) : (
                          <span className="text-gray-600 text-[10px] uppercase font-mono">DNS Only</span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-gray-400 font-mono">
                        {record.ttl === 1 ? t.dnsView.autoTtl : `${record.ttl}s`}
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5 opacity-80 group-hover:opacity-100">
                          <button
                            onClick={() => canEditDns && openEditModal(record)}
                            disabled={!canEditDns}
                            className={`p-1.5 rounded-lg transition-colors ${
                              canEditDns ? 'bg-gray-800 hover:bg-gray-700 text-gray-300 cursor-pointer' : 'bg-gray-900 text-gray-600 cursor-not-allowed opacity-50'
                            }`}
                            title={!canEditDns ? formatText(t.rbac.permissionDeniedTooltip, { role: t.rbac.roles[role]?.name || role }) : t.common.edit}
                          >
                            <Edit className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => {
                              if (!canEditDns) return;
                              setDeleteTargetRecord(record);
                              setIsDeleteModalOpen(true);
                            }}
                            disabled={!canEditDns}
                            className={`p-1.5 rounded-lg transition-colors ${
                              canEditDns ? 'bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 cursor-pointer' : 'bg-gray-900 text-gray-600 cursor-not-allowed opacity-50 border border-gray-800'
                            }`}
                            title={!canEditDns ? formatText(t.rbac.permissionDeniedTooltip, { role: t.rbac.roles[role]?.name || role }) : t.common.delete}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add / Edit DNS Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-2xl bg-gray-900 border border-gray-800 p-6 shadow-2xl relative">
            <h2 className="text-base font-bold text-white mb-4 flex items-center gap-2">
              <Layers className="w-4 h-4 text-amber-400" />
              {editingRecord ? t.dnsView.modal.editTitle : t.dnsView.modal.addTitle}
            </h2>

            <form onSubmit={handleSaveRecord} className="space-y-3.5">
              <div className="grid grid-cols-3 gap-3">
                <div className="col-span-1">
                  <label className="block text-[11px] font-semibold text-gray-400 mb-1">{t.dnsView.modal.typeLabel}</label>
                  <select
                    value={formData.type}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                    className="w-full bg-gray-950 border border-gray-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-orange-500 font-mono font-semibold"
                  >
                    {['A', 'AAAA', 'CNAME', 'TXT', 'MX', 'NS', 'SRV', 'CAA', 'PTR'].map(tType => (
                      <option key={tType} value={tType}>{tType}</option>
                    ))}
                  </select>
                </div>

                <div className="col-span-2">
                  <label className="block text-[11px] font-semibold text-gray-400 mb-1">{t.dnsView.modal.nameLabel}</label>
                  <input
                    type="text"
                    required
                    placeholder="@ or subdomain"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full bg-gray-950 border border-gray-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-orange-500 font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-gray-400 mb-1">
                  {formData.type === 'CNAME' ? t.dnsView.modal.cnameContentLabel : formData.type === 'TXT' ? t.dnsView.modal.txtContentLabel : formData.type === 'MX' ? t.dnsView.modal.mxContentLabel : t.dnsView.modal.contentLabel}
                </label>
                <input
                  type="text"
                  required
                  placeholder={formData.type === 'A' ? '192.0.2.1' : formData.type === 'CNAME' ? 'target.example.com' : 'Value'}
                  value={formData.content}
                  onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                  className="w-full bg-gray-950 border border-gray-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-orange-500 font-mono"
                />
              </div>

              {formData.type === 'MX' && (
                <div>
                  <label className="block text-[11px] font-semibold text-gray-400 mb-1">{t.dnsView.modal.priorityLabel}</label>
                  <input
                    type="number"
                    value={formData.priority}
                    onChange={(e) => setFormData({ ...formData, priority: parseInt(e.target.value, 10) })}
                    className="w-full bg-gray-950 border border-gray-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-orange-500 font-mono"
                  />
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-gray-400 mb-1">{t.dnsView.modal.ttlLabel}</label>
                  <select
                    value={formData.ttl}
                    onChange={(e) => setFormData({ ...formData, ttl: parseInt(e.target.value, 10) })}
                    className="w-full bg-gray-950 border border-gray-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-orange-500 font-mono"
                  >
                    <option value={1}>{t.dnsView.autoTtl}</option>
                    <option value={120}>2 mins</option>
                    <option value={300}>5 mins</option>
                    <option value={600}>10 mins</option>
                    <option value={3600}>1 hour</option>
                    <option value={86400}>1 day</option>
                  </select>
                </div>

                {['A', 'AAAA', 'CNAME'].includes(formData.type) && (
                  <div>
                    <label className="block text-[11px] font-semibold text-gray-400 mb-1">{t.dnsView.table.proxyStatus}</label>
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, proxied: !formData.proxied })}
                      className={`w-full py-2 px-3 rounded-xl border text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors ${
                        formData.proxied
                          ? 'bg-orange-500/20 text-orange-400 border-orange-500/40'
                          : 'bg-gray-950 text-gray-400 border-gray-800'
                      }`}
                    >
                      {formData.proxied ? <Cloud className="w-3.5 h-3.5 fill-current" /> : <CloudOff className="w-3.5 h-3.5" />}
                      <span>{formData.proxied ? 'Proxied' : 'DNS Only'}</span>
                    </button>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-gray-400 mb-1">{t.dnsView.modal.commentLabel}</label>
                <input
                  type="text"
                  placeholder="Notes..."
                  value={formData.comment}
                  onChange={(e) => setFormData({ ...formData, comment: e.target.value })}
                  className="w-full bg-gray-950 border border-gray-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-orange-500"
                />
              </div>

              <div className="flex items-center gap-2 pt-3">
                <button
                  type="submit"
                  className="flex-1 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-medium py-2 px-4 rounded-xl text-xs transition-all shadow-lg shadow-orange-500/20"
                >
                  {editingRecord ? t.dnsView.modal.saveBtn : t.dnsView.modal.createBtn}
                </button>
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-gray-700 bg-gray-800 hover:bg-gray-750 text-gray-300 text-xs font-medium"
                >
                  {t.common.cancel}
                </button>
              </div>
            </form>

            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="absolute top-4 right-4 text-gray-500 hover:text-gray-300 text-sm p-1"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {/* Safety Confirmation Modal: Toggle Proxy */}
      {proxyTargetRecord && (
        <ActionConfirmModal
          isOpen={isProxyModalOpen}
          onClose={() => {
            setIsProxyModalOpen(false);
            setProxyTargetRecord(null);
          }}
          onConfirm={confirmToggleProxy}
          title={
            !proxyTargetRecord.proxied
              ? t.dnsView.proxyModal.enableTitle
              : t.dnsView.proxyModal.disableTitle
          }
          description={
            !proxyTargetRecord.proxied
              ? formatText(t.dnsView.proxyModal.enableDesc, { name: proxyTargetRecord.name })
              : formatText(t.dnsView.proxyModal.disableDesc, { 
                  name: proxyTargetRecord.name, 
                  content: proxyTargetRecord.content 
                })
          }
          variant={!proxyTargetRecord.proxied ? 'info' : 'warning'}
          confirmText={
            !proxyTargetRecord.proxied
              ? t.dnsView.proxyModal.enableBtn
              : t.dnsView.proxyModal.disableBtn
          }
          affectedResource={{
            label: 'DNS Record / Target',
            value: `${proxyTargetRecord.name} ➔ ${proxyTargetRecord.content}`,
            badge: `${proxyTargetRecord.type} | Current: ${proxyTargetRecord.proxied ? 'Proxied' : 'DNS Only'}`,
          }}
          warningNote={t.dnsView.proxyModal.warningNote}
        />
      )}

      {/* Safety Confirmation Modal: Delete DNS Record */}
      {deleteTargetRecord && (
        <ActionConfirmModal
          isOpen={isDeleteModalOpen}
          onClose={() => {
            setIsDeleteModalOpen(false);
            setDeleteTargetRecord(null);
          }}
          onConfirm={confirmDeleteRecord}
          title={t.dnsView.deleteModal.title}
          description={formatText(t.dnsView.deleteModal.desc, {
            type: deleteTargetRecord.type,
            name: deleteTargetRecord.name,
            content: deleteTargetRecord.content,
          })}
          variant="danger"
          confirmText={t.dnsView.deleteModal.btnConfirm}
          affectedResource={{
            label: 'DNS Record to Delete',
            value: `${deleteTargetRecord.name} (${deleteTargetRecord.type})`,
            badge: deleteTargetRecord.content,
          }}
        />
      )}
    </div>
  );
};
