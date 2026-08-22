'use client';

import React, { useState } from 'react';
import { Navbar } from '@/components/layout/Navbar';
import { Sidebar, NavTab } from '@/components/layout/Sidebar';
import { ZonesView } from '@/components/views/ZonesView';
import { DnsView } from '@/components/views/DnsView';
import { SecurityView } from '@/components/views/SecurityView';
import { SslView } from '@/components/views/SslView';
import { PageRulesView } from '@/components/views/PageRulesView';
import { WorkersView } from '@/components/views/WorkersView';
import { RateLimitView } from '@/components/views/RateLimitView';
import { ZeroTrustView } from '@/components/views/ZeroTrustView';
import { AnalyticsView } from '@/components/views/AnalyticsView';
import { AuditView } from '@/components/views/AuditView';
import { ComplianceView } from '@/components/views/ComplianceView';
import { DiagnosticsView } from '@/components/views/DiagnosticsView';
import { OriginView } from '@/components/views/OriginView';
import { FinOpsView } from '@/components/views/FinOpsView';
import { AiCopilotView } from '@/components/views/AiCopilotView';
import { ApiShieldView } from '@/components/views/ApiShieldView';
import { useAuth } from '@/context/AuthContext';
import { useLanguage } from '@/context/LanguageContext';
import { Globe, Key, FlaskConical, ShieldCheck } from 'lucide-react';
import { ScrollToTop } from '@/components/common/ScrollToTop';

export default function DashboardPage() {
  const [activeTab, setActiveTab] = useState<NavTab>('overview');
  const { isDemo } = useAuth();
  const { t } = useLanguage();

  return (
    <div className="min-h-screen flex flex-col bg-[#090D16] text-[#F1F5F9]">
      <Navbar />

      {/* Demo Sandbox Alert Banner */}
      {isDemo && (
        <div className="bg-gradient-to-r from-amber-500/10 via-orange-500/10 to-amber-500/10 border-b border-amber-500/20 px-4 py-2 text-center text-xs text-amber-300 flex items-center justify-center gap-2">
          <FlaskConical className="w-3.5 h-3.5 shrink-0" />
          <span>{t.app.demoAlert}</span>
        </div>
      )}

      <div className="flex-1 flex flex-col md:flex-row">
        <Sidebar activeTab={activeTab} onSelectTab={setActiveTab} />

        <main className="flex-1 p-4 md:p-8 max-w-7xl mx-auto w-full">
          {activeTab === 'overview' && <ZonesView />}
          {activeTab === 'dns' && <DnsView />}
          {activeTab === 'origin' && <OriginView />}
          {activeTab === 'diagnostics' && <DiagnosticsView />}
          {activeTab === 'security' && <SecurityView />}
          {activeTab === 'api-shield' && <ApiShieldView />}
          {activeTab === 'ai-copilot' && <AiCopilotView />}
          {activeTab === 'ratelimit' && <RateLimitView />}
          {activeTab === 'ssl' && <SslView />}
          {activeTab === 'page-rules' && <PageRulesView />}
          {activeTab === 'workers' && <WorkersView />}
          {activeTab === 'zerotrust' && <ZeroTrustView />}
          {activeTab === 'analytics' && <AnalyticsView />}
          {activeTab === 'finops' && <FinOpsView />}
          {activeTab === 'audit' && <AuditView />}
          {activeTab === 'compliance' && <ComplianceView />}
        </main>
      </div>

      {/* Footer */}
      <footer className="border-t border-gray-900 bg-gray-950 py-4 px-6 text-center text-xs text-gray-500 flex flex-col sm:flex-row items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="font-bold text-gray-400">{t.app.footerTitle}</span>
          <span>•</span>
          <span>{t.app.footerApi}</span>
        </div>
        <div className="flex items-center gap-4 text-[11px] text-gray-400">
          <span>{t.app.footerTags.zones}</span>
          <span>{t.app.footerTags.dns}</span>
          <span>{t.app.footerTags.waf}</span>
          <span>{t.app.footerTags.ssl}</span>
          <span>{t.app.footerTags.audit}</span>
        </div>
      </footer>

      {/* Floating Scroll To Top Button */}
      <ScrollToTop />
    </div>
  );
}
