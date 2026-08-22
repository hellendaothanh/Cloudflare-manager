'use client';

import React, { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useLanguage } from '@/context/LanguageContext';
import { GeneratedWafRule, RayIdAnalysis } from '@/app/api/ai-copilot/route';
import { 
  Sparkles, 
  Bot, 
  Terminal, 
  Send, 
  Check, 
  Copy, 
  CheckCircle2, 
  AlertCircle, 
  Search, 
  ShieldAlert, 
  ShieldCheck, 
  Code2, 
  Zap, 
  ExternalLink, 
  ArrowRight, 
  Layers, 
  Globe, 
  Lock,
  Flame,
  AlertTriangle,
  Lightbulb
} from 'lucide-react';

export const AiCopilotView: React.FC = () => {
  const { selectedZone, authFetch, hasPermission } = useAuth();
  const { t, formatText } = useLanguage();
  const canDeploy = hasPermission('canAutoFix');

  const [activeTab, setActiveTab] = useState<'wafSynthesizer' | 'rayIdAnalyzer'>('wafSynthesizer');
  const [loading, setLoading] = useState(false);
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // --- Sub-Tab 1: Natural Language WAF Synthesizer State ---
  const [prompt, setPrompt] = useState('');
  const [generatedRule, setGeneratedRule] = useState<GeneratedWafRule | null>(null);
  const [copiedExpr, setCopiedExpr] = useState(false);
  const [deploying, setDeploying] = useState(false);

  // Presets
  const quickPresets = [
    {
      title: 'Chặn POST /api/login ngoài Việt Nam',
      text: 'Chặn tất cả request POST vào /api/login có xuất xứ ngoài Việt Nam',
    },
    {
      title: 'Thách thức Bots vào /checkout',
      text: 'Managed Challenge các bot hoặc request có Threat Score > 20 truy cập vào /checkout/*',
    },
    {
      title: 'Chặn SQLi & Script Injections',
      text: 'Chặn hoàn toàn các request chứa payload SQL Injection (union select) hoặc XSS (<script>) trong query URL',
    },
    {
      title: 'Chặn Crawler Bots (curl / python)',
      text: 'Chặn các User-Agent tự động như curl, python-requests vào toàn bộ API',
    },
  ];

  // --- Sub-Tab 2: Ray ID & Threat Explainer State ---
  const [rayIdInput, setRayIdInput] = useState('8a7b9c1d2e3f4001');
  const [rayAnalysis, setRayAnalysis] = useState<RayIdAnalysis | null>(null);
  const [analyzingRay, setAnalyzingRay] = useState(false);

  const handleGenerateWafRule = async (promptText?: string) => {
    const targetPrompt = promptText || prompt;
    if (!targetPrompt.trim()) return;

    setLoading(true);
    setGeneratedRule(null);
    try {
      const res = await fetch('/api/ai-copilot', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'generate_waf_rule',
          prompt: targetPrompt,
          zoneName: selectedZone?.name || 'security-enterprise.io',
        }),
      });
      const data = await res.json();
      if (data.rule) {
        setGeneratedRule(data.rule);
      } else {
        setNotification({ type: 'error', text: data.error || 'Failed to generate rule' });
      }
    } catch (err: any) {
      setNotification({ type: 'error', text: err.message || 'AI synthesis failed' });
    } finally {
      setLoading(false);
    }
  };

  const handleDeployToWaf = async () => {
    if (!generatedRule || !selectedZone) return;
    setDeploying(true);
    try {
      // Direct call to existing WAF Custom rules API
      const res = await authFetch('/api/security', {
        method: 'POST',
        body: JSON.stringify({
          action: 'create_custom_rule',
          zoneId: selectedZone.id,
          rule: {
            description: generatedRule.description,
            expression: generatedRule.expression,
            action: generatedRule.action,
            enabled: true,
          },
        }),
      });

      setNotification({ type: 'success', text: t.aiCopilotView.wafSection.deploySuccess });
    } catch (err: any) {
      setNotification({ type: 'error', text: err.message || 'Deploy failed' });
    } finally {
      setDeploying(false);
    }
  };

  const handleAnalyzeRayId = async () => {
    if (!rayIdInput.trim()) return;
    setAnalyzingRay(true);
    try {
      const res = await fetch('/api/ai-copilot', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'analyze_ray_id',
          rayId: rayIdInput.trim(),
        }),
      });
      const data = await res.json();
      setRayAnalysis(data.analysis || null);
    } catch (err: any) {
      setNotification({ type: 'error', text: err.message || 'Investigation failed' });
    } finally {
      setAnalyzingRay(false);
    }
  };

  const handleCopyExpression = () => {
    if (generatedRule) {
      navigator.clipboard.writeText(generatedRule.expression);
      setCopiedExpr(true);
      setTimeout(() => setCopiedExpr(false), 2000);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 rounded-2xl bg-gradient-to-r from-purple-950/40 via-gray-900 to-gray-950 border border-purple-500/30 shadow-xl shadow-purple-500/5">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="p-2 rounded-xl bg-purple-500/15 text-purple-400 border border-purple-500/30">
              <Sparkles className="w-5 h-5" />
            </span>
            <h1 className="text-xl font-bold text-white tracking-tight">{t.aiCopilotView.title}</h1>
          </div>
          <p className="text-xs text-gray-400">
            {t.aiCopilotView.subtitle}
          </p>
        </div>
      </div>

      {/* Notification */}
      {notification && (
        <div className={`p-4 rounded-xl text-xs flex items-center gap-2.5 ${
          notification.type === 'success' ? 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-300' : 'bg-rose-500/10 border border-rose-500/30 text-rose-400'
        }`}>
          {notification.type === 'success' ? <CheckCircle2 className="w-4 h-4 shrink-0" /> : <AlertCircle className="w-4 h-4 shrink-0" />}
          <span>{notification.text}</span>
        </div>
      )}

      {/* Sub-tabs Navigation */}
      <div className="flex items-center gap-2 border-b border-gray-800 pb-2">
        <button
          onClick={() => setActiveTab('wafSynthesizer')}
          className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all flex items-center gap-2 ${
            activeTab === 'wafSynthesizer'
              ? 'bg-purple-500/15 text-purple-400 border border-purple-500/30 font-bold'
              : 'text-gray-400 hover:text-gray-200 hover:bg-gray-900'
          }`}
        >
          <Code2 className="w-4 h-4" />
          <span>{t.aiCopilotView.tabs.wafSynthesizer}</span>
        </button>

        <button
          onClick={() => setActiveTab('rayIdAnalyzer')}
          className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all flex items-center gap-2 ${
            activeTab === 'rayIdAnalyzer'
              ? 'bg-cyan-500/15 text-cyan-400 border border-cyan-500/30 font-bold'
              : 'text-gray-400 hover:text-gray-200 hover:bg-gray-900'
          }`}
        >
          <Search className="w-4 h-4" />
          <span>{t.aiCopilotView.tabs.rayIdAnalyzer}</span>
          <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-cyan-500/20 text-cyan-300 font-bold">
            RAY ID
          </span>
        </button>
      </div>

      {/* ========================================================================= */}
      {/* TAB 1: NATURAL LANGUAGE WAF SYNTHESIZER                                   */}
      {/* ========================================================================= */}
      {activeTab === 'wafSynthesizer' && (
        <div className="space-y-6">
          <div className="p-6 rounded-2xl bg-gray-900/70 border border-gray-800 space-y-4">
            <div className="space-y-1">
              <label className="block text-xs font-bold text-white flex items-center gap-2">
                <Bot className="w-4 h-4 text-purple-400" />
                {t.aiCopilotView.wafSection.promptLabel}
              </label>
              <p className="text-[11px] text-gray-400">
                {t.aiCopilotView.wafSection.subtitle}
              </p>
            </div>

            {/* Prompt Input Box */}
            <div className="space-y-3">
              <div className="relative">
                <textarea
                  rows={3}
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  placeholder={t.aiCopilotView.wafSection.promptPlaceholder}
                  className="w-full bg-gray-950 border border-gray-800 rounded-2xl p-4 text-xs text-white placeholder-gray-600 focus:outline-none focus:border-purple-500 transition-all font-sans leading-relaxed shadow-inner"
                />
              </div>

              {/* Quick Prompt Presets */}
              <div className="space-y-2">
                <span className="text-[11px] font-bold text-gray-400 flex items-center gap-1.5">
                  <Lightbulb className="w-3.5 h-3.5 text-amber-400" />
                  {t.aiCopilotView.wafSection.quickPromptsTitle}
                </span>
                <div className="flex flex-wrap gap-2">
                  {quickPresets.map((preset, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => {
                        setPrompt(preset.text);
                        handleGenerateWafRule(preset.text);
                      }}
                      className="px-3 py-1.5 rounded-xl bg-gray-950 border border-gray-800 hover:border-purple-500/50 hover:bg-purple-950/20 text-gray-300 hover:text-purple-300 text-[11px] transition-all font-medium flex items-center gap-1.5"
                    >
                      <span>⚡ {preset.title}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Action Button */}
              <div className="flex justify-end pt-2">
                <button
                  type="button"
                  onClick={() => handleGenerateWafRule()}
                  disabled={loading || !prompt.trim()}
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white text-xs font-bold transition-all shadow-lg shadow-purple-500/25 flex items-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  <Sparkles className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                  <span>{loading ? t.aiCopilotView.wafSection.btnGenerating : t.aiCopilotView.wafSection.btnGenerate}</span>
                </button>
              </div>
            </div>
          </div>

          {/* Generated Result Display Card */}
          {generatedRule && (
            <div className="p-6 rounded-2xl bg-gray-900/80 border border-purple-500/40 space-y-5 shadow-2xl shadow-purple-500/10">
              <div className="flex items-center justify-between border-b border-gray-800 pb-4">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-emerald-400" />
                  <span className="text-sm font-bold text-white">{generatedRule.description}</span>
                </div>
                <span className={`px-2.5 py-1 rounded-full text-xs font-extrabold uppercase font-mono border ${
                  generatedRule.action === 'block'
                    ? 'bg-rose-500/20 text-rose-300 border-rose-500/40'
                    : generatedRule.action === 'managed_challenge'
                    ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                    : 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40'
                }`}>
                  ACTION: {generatedRule.action.toUpperCase()}
                </span>
              </div>

              {/* Wirefilter Expression Output */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-gray-300">
                    {t.aiCopilotView.wafSection.generatedResultTitle}
                  </span>
                  <button
                    type="button"
                    onClick={handleCopyExpression}
                    className="flex items-center gap-1 text-[11px] text-cyan-400 hover:text-cyan-300 font-mono transition-colors"
                  >
                    {copiedExpr ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedExpr ? 'Copied' : 'Copy Expression'}</span>
                  </button>
                </div>

                <div className="p-4 rounded-xl bg-gray-950 border border-gray-800 font-mono text-xs text-orange-300 overflow-x-auto select-all">
                  <code>{generatedRule.expression}</code>
                </div>
              </div>

              {/* Matched Conditions Matrix */}
              <div className="space-y-2">
                <span className="text-xs font-bold text-gray-400">
                  {formatText(t.aiCopilotView.wafSection.matchedConditionsTitle, { count: generatedRule.matchedConditions.length })}
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {generatedRule.matchedConditions.map((cond, idx) => (
                    <div key={idx} className="p-3 rounded-xl bg-gray-950 border border-gray-850 space-y-1 text-xs">
                      <div className="flex items-center justify-between font-mono">
                        <span className="text-cyan-400 font-bold">{cond.field}</span>
                        <span className="text-purple-400 uppercase text-[10px]">{cond.operator}</span>
                      </div>
                      <p className="text-gray-300 text-[11px]">{cond.desc}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Explanation */}
              <div className="p-4 rounded-xl bg-purple-950/20 border border-purple-500/20 text-xs text-purple-200/90 leading-relaxed">
                <strong className="text-purple-300 block mb-1">{t.aiCopilotView.wafSection.explanationTitle}</strong>
                {generatedRule.explanation}
              </div>

              {/* Deploy Button */}
              <div className="pt-2 flex justify-end">
                <button
                  type="button"
                  onClick={handleDeployToWaf}
                  disabled={deploying || !canDeploy}
                  className="px-6 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-bold transition-all shadow-lg shadow-emerald-500/25 flex items-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  <ShieldAlert className={`w-4 h-4 ${deploying ? 'animate-spin' : ''}`} />
                  <span>{t.aiCopilotView.wafSection.btnDeployRule}</span>
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: RAY ID INVESTIGATION & THREAT EXPLAINER                           */}
      {/* ========================================================================= */}
      {activeTab === 'rayIdAnalyzer' && (
        <div className="space-y-6">
          <div className="p-6 rounded-2xl bg-gray-900/70 border border-gray-800 space-y-4">
            <div className="space-y-1">
              <label className="block text-xs font-bold text-white flex items-center gap-2">
                <Search className="w-4 h-4 text-cyan-400" />
                {t.aiCopilotView.rayIdSection.rayIdInputLabel}
              </label>
              <p className="text-[11px] text-gray-400">
                {t.aiCopilotView.rayIdSection.subtitle}
              </p>
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-3">
              <input
                type="text"
                value={rayIdInput}
                onChange={(e) => setRayIdInput(e.target.value)}
                placeholder={t.aiCopilotView.rayIdSection.rayIdPlaceholder}
                className="w-full bg-gray-950 border border-gray-800 rounded-xl px-4 py-2.5 text-xs text-cyan-400 font-mono font-bold focus:outline-none focus:border-cyan-500"
              />

              <button
                type="button"
                onClick={handleAnalyzeRayId}
                disabled={analyzingRay || !rayIdInput.trim()}
                className="w-full sm:w-auto shrink-0 px-5 py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold transition-all shadow-lg shadow-cyan-500/25 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                <Search className={`w-4 h-4 ${analyzingRay ? 'animate-spin' : ''}`} />
                <span>{analyzingRay ? t.aiCopilotView.rayIdSection.btnAnalyzing : t.aiCopilotView.rayIdSection.btnAnalyze}</span>
              </button>
            </div>
          </div>

          {/* Analysis Report Display */}
          {rayAnalysis && (
            <div className="p-6 rounded-2xl bg-gray-900/80 border border-cyan-500/30 space-y-6 shadow-2xl">
              {/* Telemetry Summary Bar */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs font-mono">
                <div className="p-3 rounded-xl bg-gray-950 border border-gray-850">
                  <span className="text-gray-500 block text-[10px]">RAY ID</span>
                  <span className="text-cyan-400 font-bold">{rayAnalysis.rayId}</span>
                </div>
                <div className="p-3 rounded-xl bg-gray-950 border border-gray-850">
                  <span className="text-gray-500 block text-[10px]">CLIENT IP & GEO</span>
                  <span className="text-white font-semibold truncate block">{rayAnalysis.clientIp} ({rayAnalysis.country})</span>
                </div>
                <div className="p-3 rounded-xl bg-gray-950 border border-gray-850">
                  <span className="text-gray-500 block text-[10px]">HTTP TARGET</span>
                  <span className="text-white font-semibold">{rayAnalysis.httpMethod} {rayAnalysis.uriPath}</span>
                </div>
                <div className="p-3 rounded-xl bg-gray-950 border border-gray-850">
                  <span className="text-gray-500 block text-[10px]">THREAT SCORE</span>
                  <span className="text-rose-400 font-extrabold">{rayAnalysis.threatScore} / 100 (HIGH)</span>
                </div>
              </div>

              {/* Attack Vector & Root Cause */}
              <div className="space-y-4">
                <div className="p-4 rounded-xl bg-rose-950/20 border border-rose-500/30 space-y-2">
                  <span className="text-xs font-bold text-rose-300 flex items-center gap-2">
                    <Flame className="w-4 h-4 text-rose-400" />
                    {t.aiCopilotView.rayIdSection.attackVectorTitle} {rayAnalysis.attackVector}
                  </span>
                  <p className="text-xs text-rose-200/90 leading-relaxed">
                    {rayAnalysis.rootCauseAnalysis}
                  </p>
                </div>

                {/* Remediation Guidance */}
                <div className="p-5 rounded-xl bg-gray-950 border border-gray-850 space-y-3 text-xs">
                  <span className="font-bold text-white block">
                    {t.aiCopilotView.rayIdSection.remediationTitle}
                  </span>
                  <ul className="space-y-2 text-gray-300">
                    {rayAnalysis.remediationSuggestions.map((item, idx) => (
                      <li key={idx} className="flex items-start gap-2">
                        <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Suggested Preventive WAF Rule */}
                <div className="p-5 rounded-2xl bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950 border border-emerald-500/30 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-emerald-400 flex items-center gap-2">
                      <ShieldCheck className="w-4 h-4" />
                      {t.aiCopilotView.rayIdSection.suggestedRuleTitle}
                    </span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-bold uppercase">
                      {rayAnalysis.suggestedPreventiveRule.action}
                    </span>
                  </div>

                  <div className="p-3 rounded-xl bg-gray-950 border border-gray-800 font-mono text-xs text-emerald-300">
                    <code>{rayAnalysis.suggestedPreventiveRule.expression}</code>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
