'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useLanguage } from '@/context/LanguageContext';
import { ApiSecurityState, MtlsCertificate, ApiShieldSchema } from '@/app/api/api-shield/route';
import { 
  ShieldCheck, 
  KeyRound, 
  FileJson, 
  AlertTriangle, 
  Plus, 
  RefreshCw, 
  CheckCircle2, 
  AlertCircle, 
  Lock, 
  Shield, 
  Upload, 
  ExternalLink,
  Ban,
  Activity,
  Layers,
  FileCode,
  Sliders,
  Check
} from 'lucide-react';
import { HelpTooltip } from '@/components/common/HelpTooltip';

export const ApiShieldView: React.FC = () => {
  const { selectedZone, authFetch, hasPermission, role } = useAuth();
  const { t, formatText } = useLanguage();
  const canEdit = hasPermission('canEditWaf');

  const [activeTab, setActiveTab] = useState<'mtls' | 'schema' | 'logs'>('mtls');
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<ApiSecurityState | null>(null);
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Modals
  const [isMtlsModalOpen, setIsMtlsModalOpen] = useState(false);
  const [isSchemaModalOpen, setIsSchemaModalOpen] = useState(false);

  // mTLS Form State
  const [mtlsForm, setMtlsForm] = useState({
    name: '',
    clientCertType: 'b2b_partner' as 'b2b_partner' | 'microservice_internal' | 'mobile_app' | 'iot_device',
    issuer: 'Cloudflare Managed CA Enterprise',
    associationHosts: 'api.security-enterprise.io, gateway.security-enterprise.io',
    expiresOn: '2028-08-20T00:00:00Z',
  });

  // Schema Form State
  const [schemaForm, setSchemaForm] = useState({
    name: '',
    version: '1.0.0',
    fileFormat: 'yaml' as 'yaml' | 'json',
    validationAction: 'block' as 'block' | 'log' | 'managed_challenge',
    specContent: '',
  });

  const fetchData = async () => {
    if (!selectedZone) return;
    setLoading(true);
    try {
      const res = await authFetch(`/api/api-shield?zoneId=${selectedZone.id}`);
      if (res.success && res.result) {
        setData(res.result);
      }
    } catch (err: any) {
      setNotification({ type: 'error', text: err.message || t.common.error });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [selectedZone]);

  const handleCreateMtls = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedZone || !mtlsForm.name.trim()) return;

    try {
      const hosts = mtlsForm.associationHosts.split(',').map(h => h.trim()).filter(Boolean);
      const res = await authFetch('/api/api-shield', {
        method: 'POST',
        body: JSON.stringify({
          action: 'create_mtls_cert',
          zoneId: selectedZone.id,
          cert: {
            name: mtlsForm.name.trim(),
            clientCertType: mtlsForm.clientCertType,
            issuer: mtlsForm.issuer,
            associationHosts: hosts,
            expiresOn: mtlsForm.expiresOn,
          },
        }),
      });

      if (res.success && res.cert) {
        setData(prev => prev ? { ...prev, mtlsCerts: [res.cert, ...prev.mtlsCerts] } : null);
        setIsMtlsModalOpen(false);
        setMtlsForm({
          name: '',
          clientCertType: 'b2b_partner',
          issuer: 'Cloudflare Managed CA Enterprise',
          associationHosts: 'api.security-enterprise.io',
          expiresOn: '2028-08-20T00:00:00Z',
        });
        setNotification({ type: 'success', text: res.message });
      }
    } catch (err: any) {
      setNotification({ type: 'error', text: err.message || t.common.error });
    }
  };

  const handleImportSchema = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedZone || !schemaForm.name.trim()) return;

    try {
      const res = await authFetch('/api/api-shield', {
        method: 'POST',
        body: JSON.stringify({
          action: 'import_openapi_schema',
          zoneId: selectedZone.id,
          schema: {
            name: schemaForm.name.trim(),
            version: schemaForm.version.trim(),
            fileFormat: schemaForm.fileFormat,
            validationAction: schemaForm.validationAction,
            endpointCount: 18,
            learnedRouting: true,
            endpoints: [
              { method: 'POST', path: '/api/v1/checkout', authRequired: true, schemaEnforced: true },
              { method: 'GET', path: '/api/v1/products', authRequired: false, schemaEnforced: true },
              { method: 'PUT', path: '/api/v1/customers/{id}', authRequired: true, schemaEnforced: true },
            ],
          },
        }),
      });

      if (res.success && res.schema) {
        setData(prev => prev ? { ...prev, schemas: [res.schema, ...prev.schemas] } : null);
        setIsSchemaModalOpen(false);
        setSchemaForm({
          name: '',
          version: '1.0.0',
          fileFormat: 'yaml',
          validationAction: 'block',
          specContent: '',
        });
        setNotification({ type: 'success', text: res.message });
      }
    } catch (err: any) {
      setNotification({ type: 'error', text: err.message || t.common.error });
    }
  };

  const certs = data?.mtlsCerts || [];
  const schemas = data?.schemas || [];
  const logs = data?.blockedPayloadLogs || [];

  return (
    <div className="space-y-6">
      {/* Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 rounded-2xl bg-gradient-to-r from-gray-900 via-gray-900/90 to-gray-950 border border-gray-800">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="p-2 rounded-xl bg-purple-500/10 text-purple-400 border border-purple-500/20">
              <KeyRound className="w-5 h-5" />
            </span>
            <h1 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
              <span>{t.apiShieldView.title}</span>
              <HelpTooltip 
                title={t.apiShieldView.title}
                content={t.apiShieldView.subtitle}
              />
            </h1>
          </div>
          <p className="text-xs text-gray-400">
            {t.apiShieldView.subtitle}
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={fetchData}
            disabled={loading}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-gray-800 hover:bg-gray-750 border border-gray-700 text-gray-300 text-xs font-semibold transition-all cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>{t.apiShieldView.refreshBtn}</span>
          </button>

          {activeTab === 'mtls' ? (
            <button
              onClick={() => canEdit && setIsMtlsModalOpen(true)}
              disabled={!canEdit}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-md ${
                canEdit
                  ? 'bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 text-white shadow-cyan-500/20 cursor-pointer'
                  : 'bg-gray-800 text-gray-500 cursor-not-allowed opacity-50'
              }`}
            >
              <Plus className="w-4 h-4" />
              <span>{t.apiShieldView.addMtlsBtn}</span>
            </button>
          ) : (
            <button
              onClick={() => canEdit && setIsSchemaModalOpen(true)}
              disabled={!canEdit}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-md ${
                canEdit
                  ? 'bg-gradient-to-r from-purple-500 to-indigo-500 hover:from-purple-600 hover:to-indigo-600 text-white shadow-purple-500/20 cursor-pointer'
                  : 'bg-gray-800 text-gray-500 cursor-not-allowed opacity-50'
              }`}
            >
              <Upload className="w-4 h-4" />
              <span>{t.apiShieldView.importSchemaBtn}</span>
            </button>
          )}
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 rounded-2xl bg-gray-900/60 border border-gray-800 shadow-md">
          <div className="flex items-center justify-between text-xs text-gray-400 mb-1">
            <span>{t.apiShieldView.kpiMtlsTotal}</span>
            <Lock className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="text-2xl font-black text-white">{certs.length} <span className="text-xs text-gray-500 font-normal">Certs</span></div>
          <div className="text-[11px] text-cyan-400/80 mt-1">mTLS Cryptographic Perimeter</div>
        </div>

        <div className="p-4 rounded-2xl bg-gray-900/60 border border-gray-800 shadow-md">
          <div className="flex items-center justify-between text-xs text-gray-400 mb-1">
            <span>{t.apiShieldView.kpiEndpointsProtected}</span>
            <Layers className="w-4 h-4 text-purple-400" />
          </div>
          <div className="text-2xl font-black text-white">{schemas.reduce((acc, s) => acc + s.endpointCount, 0)} <span className="text-xs text-gray-500 font-normal">Routes</span></div>
          <div className="text-[11px] text-purple-400/80 mt-1">Across {schemas.length} OpenAPI Specs</div>
        </div>

        <div className="p-4 rounded-2xl bg-gray-900/60 border border-gray-800 shadow-md">
          <div className="flex items-center justify-between text-xs text-gray-400 mb-1">
            <span>{t.apiShieldView.kpiBlockedPayloads}</span>
            <Ban className="w-4 h-4 text-rose-400" />
          </div>
          <div className="text-2xl font-black text-rose-400">{logs.length} <span className="text-xs text-gray-500 font-normal">Events</span></div>
          <div className="text-[11px] text-rose-400/80 mt-1">Zero Origin Penetration</div>
        </div>

        <div className="p-4 rounded-2xl bg-gray-900/60 border border-gray-800 shadow-md">
          <div className="flex items-center justify-between text-xs text-gray-400 mb-1">
            <span>{t.apiShieldView.kpiEnforcementRate}</span>
            <Activity className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-black text-emerald-400">99.8%</div>
          <div className="text-[11px] text-emerald-400/80 mt-1">Strict Positive Security Model</div>
        </div>
      </div>

      {notification && (
        <div className={`p-4 rounded-xl text-xs flex items-center gap-2.5 ${
          notification.type === 'success' ? 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-300' : 'bg-rose-500/10 border border-rose-500/30 text-rose-400'
        }`}>
          {notification.type === 'success' ? <CheckCircle2 className="w-4 h-4 shrink-0" /> : <AlertCircle className="w-4 h-4 shrink-0" />}
          <span>{notification.text}</span>
        </div>
      )}

      {/* Sub-tabs Navigation */}
      <div className="flex flex-wrap items-center gap-2 border-b border-gray-800 pb-2">
        <button
          onClick={() => setActiveTab('mtls')}
          className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all flex items-center gap-2 ${
            activeTab === 'mtls'
              ? 'bg-cyan-500/15 text-cyan-400 border border-cyan-500/30 font-bold'
              : 'text-gray-400 hover:text-gray-200 hover:bg-gray-900'
          }`}
        >
          <Lock className="w-4 h-4" />
          <span>{t.apiShieldView.tabs.mtls}</span>
        </button>

        <button
          onClick={() => setActiveTab('schema')}
          className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all flex items-center gap-2 ${
            activeTab === 'schema'
              ? 'bg-purple-500/15 text-purple-400 border border-purple-500/30 font-bold'
              : 'text-gray-400 hover:text-gray-200 hover:bg-gray-900'
          }`}
        >
          <FileCode className="w-4 h-4" />
          <span>{t.apiShieldView.tabs.schemaValidation}</span>
        </button>

        <button
          onClick={() => setActiveTab('logs')}
          className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all flex items-center gap-2 ${
            activeTab === 'logs'
              ? 'bg-rose-500/15 text-rose-400 border border-rose-500/30 font-bold'
              : 'text-gray-400 hover:text-gray-200 hover:bg-gray-900'
          }`}
        >
          <AlertTriangle className="w-4 h-4" />
          <span>{t.apiShieldView.tabs.blockedLogs}</span>
        </button>
      </div>

      {/* TAB 1: mTLS Client Certificates */}
      {activeTab === 'mtls' && (
        <div className="space-y-4">
          <div className="p-4 rounded-xl bg-gray-950 border border-gray-850 text-xs text-gray-300">
            <span className="font-bold text-white block mb-1">{t.apiShieldView.mtlsSection.title}</span>
            <p className="text-gray-400 leading-relaxed">{t.apiShieldView.mtlsSection.desc}</p>
          </div>

          <div className="rounded-2xl border border-gray-800 bg-gray-900/60 overflow-hidden shadow-xl">
            <table className="w-full text-left text-xs">
              <thead className="bg-gray-950/80 border-b border-gray-800 text-gray-400 uppercase font-semibold text-[10px]">
                <tr>
                  <th className="py-3.5 px-4">{t.apiShieldView.mtlsSection.tableCertName}</th>
                  <th className="py-3.5 px-4">{t.apiShieldView.mtlsSection.tableType}</th>
                  <th className="py-3.5 px-4">{t.apiShieldView.mtlsSection.tableIssuer}</th>
                  <th className="py-3.5 px-4">{t.apiShieldView.mtlsSection.tableHosts}</th>
                  <th className="py-3.5 px-4">{t.apiShieldView.mtlsSection.tableExpires}</th>
                  <th className="py-3.5 px-4">{t.apiShieldView.mtlsSection.tableStatus}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-850">
                {certs.map((cert) => (
                  <tr key={cert.id} className="hover:bg-gray-850/50 transition-colors">
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-white">{cert.name}</div>
                      <span className="text-[10px] font-mono text-gray-500">SHA256: {cert.fingerprintSha256.slice(0, 16)}...</span>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-blue-500/15 text-blue-300 border border-blue-500/30">
                        {t.apiShieldView.mtlsSection.certTypes[cert.clientCertType] || cert.clientCertType}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-gray-300 font-mono text-[11px]">{cert.issuer}</td>
                    <td className="py-3.5 px-4">
                      <div className="flex flex-wrap gap-1">
                        {cert.associationHosts.map((h) => (
                          <span key={h} className="px-1.5 py-0.5 rounded bg-gray-800 text-gray-300 font-mono text-[10px]">
                            {h}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-gray-400 font-mono text-[11px]">{new Date(cert.expiresOn).toLocaleDateString()}</td>
                    <td className="py-3.5 px-4">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 flex items-center gap-1 w-max">
                        <Check className="w-3 h-3" />
                        <span>ACTIVE</span>
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 2: OpenAPI Schema Validation */}
      {activeTab === 'schema' && (
        <div className="space-y-4">
          <div className="p-4 rounded-xl bg-gray-950 border border-gray-850 text-xs text-gray-300">
            <span className="font-bold text-white block mb-1">{t.apiShieldView.schemaSection.title}</span>
            <p className="text-gray-400 leading-relaxed">{t.apiShieldView.schemaSection.desc}</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {schemas.map((s) => (
              <div key={s.id} className="p-5 rounded-2xl bg-gray-900/80 border border-gray-800 shadow-xl space-y-4">
                <div className="flex items-center justify-between border-b border-gray-800 pb-3">
                  <div>
                    <h3 className="text-sm font-bold text-white">{s.name}</h3>
                    <span className="text-[11px] font-mono text-purple-400">Version: {s.version} • Format: {s.fileFormat.toUpperCase()}</span>
                  </div>
                  <span className="px-2.5 py-1 rounded-xl bg-rose-500/15 text-rose-300 border border-rose-500/30 text-[10px] font-bold">
                    {t.apiShieldView.schemaSection.actions[s.validationAction]}
                  </span>
                </div>

                <div className="space-y-1.5 text-xs">
                  <span className="text-gray-400 font-semibold text-[11px] block">Validated Schema Endpoints ({s.endpoints.length}):</span>
                  {s.endpoints.map((ep, idx) => (
                    <div key={idx} className="flex items-center justify-between p-2 rounded-lg bg-gray-950 border border-gray-850 text-[11px] font-mono">
                      <div className="flex items-center gap-2">
                        <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold ${
                          ep.method === 'POST' ? 'bg-emerald-500/20 text-emerald-300' :
                          ep.method === 'GET' ? 'bg-blue-500/20 text-blue-300' :
                          ep.method === 'PUT' ? 'bg-amber-500/20 text-amber-300' : 'bg-rose-500/20 text-rose-300'
                        }`}>
                          {ep.method}
                        </span>
                        <span className="text-gray-300">{ep.path}</span>
                      </div>
                      <span className="text-[10px] text-emerald-400">✓ ENFORCED</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 3: Blocked Logs */}
      {activeTab === 'logs' && (
        <div className="rounded-2xl border border-gray-800 bg-gray-900/60 overflow-hidden shadow-xl">
          <table className="w-full text-left text-xs">
            <thead className="bg-gray-950/80 border-b border-gray-800 text-gray-400 uppercase font-semibold text-[10px]">
              <tr>
                <th className="py-3.5 px-4">Thời gian</th>
                <th className="py-3.5 px-4">Client IP</th>
                <th className="py-3.5 px-4">Endpoint</th>
                <th className="py-3.5 px-4">Lý do Vi phạm (Schema / mTLS Reason)</th>
                <th className="py-3.5 px-4">Hành động</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-850">
              {logs.map((log) => (
                <tr key={log.id} className="hover:bg-gray-850/50 transition-colors">
                  <td className="py-3.5 px-4 text-gray-400 font-mono text-[11px]">{new Date(log.timestamp).toLocaleTimeString()}</td>
                  <td className="py-3.5 px-4 font-mono text-cyan-300">{log.clientIp}</td>
                  <td className="py-3.5 px-4 font-mono text-gray-200">
                    <span className="font-bold text-purple-400">{log.method}</span> {log.endpoint}
                  </td>
                  <td className="py-3.5 px-4 text-rose-300/90 font-mono text-[11px] max-w-md">{log.reason}</td>
                  <td className="py-3.5 px-4">
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/15 text-rose-400 border border-rose-500/30">
                      {log.action}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal: Issue mTLS Cert */}
      {isMtlsModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="w-full max-w-lg bg-gray-900 border border-gray-800 rounded-3xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-gray-800 pb-3">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Lock className="w-4 h-4 text-cyan-400" />
                <span>{t.apiShieldView.modalMtls.title}</span>
              </h3>
              <button onClick={() => setIsMtlsModalOpen(false)} className="text-gray-500 hover:text-white">✕</button>
            </div>

            <form onSubmit={handleCreateMtls} className="space-y-3.5 text-xs">
              <div>
                <label className="block text-gray-400 mb-1 font-semibold">{t.apiShieldView.modalMtls.nameLabel}</label>
                <input
                  type="text"
                  required
                  value={mtlsForm.name}
                  onChange={(e) => setMtlsForm({ ...mtlsForm, name: e.target.value })}
                  placeholder={t.apiShieldView.modalMtls.namePlaceholder}
                  className="w-full bg-gray-950 border border-gray-800 rounded-xl px-3.5 py-2 text-white focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-gray-400 mb-1 font-semibold">{t.apiShieldView.modalMtls.typeLabel}</label>
                <select
                  value={mtlsForm.clientCertType}
                  onChange={(e) => setMtlsForm({ ...mtlsForm, clientCertType: e.target.value as any })}
                  className="w-full bg-gray-950 border border-gray-800 rounded-xl px-3.5 py-2 text-white focus:outline-none"
                >
                  <option value="b2b_partner">{t.apiShieldView.mtlsSection.certTypes.b2b_partner}</option>
                  <option value="microservice_internal">{t.apiShieldView.mtlsSection.certTypes.microservice_internal}</option>
                  <option value="mobile_app">{t.apiShieldView.mtlsSection.certTypes.mobile_app}</option>
                  <option value="iot_device">{t.apiShieldView.mtlsSection.certTypes.iot_device}</option>
                </select>
              </div>

              <div>
                <label className="block text-gray-400 mb-1 font-semibold">{t.apiShieldView.modalMtls.hostsLabel}</label>
                <input
                  type="text"
                  required
                  value={mtlsForm.associationHosts}
                  onChange={(e) => setMtlsForm({ ...mtlsForm, associationHosts: e.target.value })}
                  placeholder={t.apiShieldView.modalMtls.hostsPlaceholder}
                  className="w-full bg-gray-950 border border-gray-800 rounded-xl px-3.5 py-2 text-cyan-300 font-mono focus:outline-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setIsMtlsModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-gray-800 text-gray-400 hover:text-white"
                >
                  {t.common.cancel}
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-500 text-white font-bold"
                >
                  {t.apiShieldView.modalMtls.btnCreate}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Import Schema */}
      {isSchemaModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="w-full max-w-xl bg-gray-900 border border-gray-800 rounded-3xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-gray-800 pb-3">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <FileCode className="w-4 h-4 text-purple-400" />
                <span>{t.apiShieldView.modalSchema.title}</span>
              </h3>
              <button onClick={() => setIsSchemaModalOpen(false)} className="text-gray-500 hover:text-white">✕</button>
            </div>

            <form onSubmit={handleImportSchema} className="space-y-3.5 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-gray-400 mb-1 font-semibold">{t.apiShieldView.modalSchema.nameLabel}</label>
                  <input
                    type="text"
                    required
                    value={schemaForm.name}
                    onChange={(e) => setSchemaForm({ ...schemaForm, name: e.target.value })}
                    placeholder={t.apiShieldView.modalSchema.namePlaceholder}
                    className="w-full bg-gray-950 border border-gray-800 rounded-xl px-3 py-2 text-white focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-gray-400 mb-1 font-semibold">{t.apiShieldView.modalSchema.versionLabel}</label>
                  <input
                    type="text"
                    value={schemaForm.version}
                    onChange={(e) => setSchemaForm({ ...schemaForm, version: e.target.value })}
                    className="w-full bg-gray-950 border border-gray-800 rounded-xl px-3 py-2 text-purple-300 font-mono focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-gray-400 mb-1 font-semibold">{t.apiShieldView.modalSchema.actionLabel}</label>
                <select
                  value={schemaForm.validationAction}
                  onChange={(e) => setSchemaForm({ ...schemaForm, validationAction: e.target.value as any })}
                  className="w-full bg-gray-950 border border-gray-800 rounded-xl px-3.5 py-2 text-white font-semibold focus:outline-none"
                >
                  <option value="block">BLOCK (HTTP 400 - Từ chối request sai schema)</option>
                  <option value="log">LOG ONLY (Chỉ ghi log vi phạm)</option>
                  <option value="managed_challenge">MANAGED CHALLENGE</option>
                </select>
              </div>

              <div>
                <label className="block text-gray-400 mb-1 font-semibold">{t.apiShieldView.modalSchema.specContentLabel}</label>
                <textarea
                  rows={6}
                  value={schemaForm.specContent}
                  onChange={(e) => setSchemaForm({ ...schemaForm, specContent: e.target.value })}
                  placeholder={t.apiShieldView.modalSchema.specPlaceholder}
                  className="w-full bg-gray-950 border border-gray-800 rounded-xl p-3 text-purple-200 font-mono text-[11px] focus:outline-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setIsSchemaModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-gray-800 text-gray-400 hover:text-white"
                >
                  {t.common.cancel}
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-gradient-to-r from-purple-500 to-indigo-500 text-white font-bold"
                >
                  {t.apiShieldView.modalSchema.btnImport}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
