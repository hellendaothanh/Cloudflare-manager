'use client';

import React from 'react';
import { useLanguage } from '@/context/LanguageContext';
import { 
  Globe, 
  Layers, 
  ShieldAlert, 
  Lock, 
  SlidersHorizontal, 
  BarChart3, 
  ActivitySquare,
  Workflow,
  GitBranch,
  Cpu,
  Shield,
  Network,
  ChevronDown,
  ChevronRight,
  PanelLeftClose,
  PanelLeftOpen,
  Radio,
  Server,
  Sparkles,
  ShieldCheck
} from 'lucide-react';

export type NavTab = 
  | 'overview' 
  | 'dns' 
  | 'origin'
  | 'security' 
  | 'api-shield'
  | 'ai-copilot'
  | 'ratelimit'
  | 'ssl' 
  | 'page-rules' 
  | 'workers'
  | 'zerotrust'
  | 'analytics' 
  | 'finops'
  | 'audit' 
  | 'compliance'
  | 'diagnostics';

interface SidebarProps {
  activeTab: NavTab;
  onSelectTab: (tab: NavTab) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ activeTab, onSelectTab }) => {
  const { t } = useLanguage();

  // State: Thu gọn / mở rộng toàn bộ thanh Sidebar
  const [isCollapsed, setIsCollapsed] = React.useState(false);

  // State: Thu gọn / mở rộng từng nhóm danh mục
  const [collapsedGroups, setCollapsedGroups] = React.useState<Record<string, boolean>>({});

  const toggleGroup = (groupKey: string) => {
    setCollapsedGroups((prev) => ({
      ...prev,
      [groupKey]: !prev[groupKey],
    }));
  };

  const menuSections = [
    {
      key: 'connectivity',
      group: t.sidebar.groups.connectivity,
      items: [
        {
          id: 'overview' as NavTab,
          label: t.sidebar.overview.title,
          icon: Globe,
        },
        {
          id: 'dns' as NavTab,
          label: t.sidebar.dns.title,
          icon: Layers,
        },
        {
          id: 'origin' as NavTab,
          label: t.sidebar.origin.title,
          icon: Server,
          badge: t.sidebar.origin.badge,
        },
        {
          id: 'diagnostics' as NavTab,
          label: t.sidebar.diagnostics.title,
          icon: Radio,
          badge: t.sidebar.diagnostics.badge,
        },
        {
          id: 'page-rules' as NavTab,
          label: t.sidebar.pageRules.title,
          icon: SlidersHorizontal,
        },
      ],
    },
    {
      key: 'security',
      group: t.sidebar.groups.security,
      items: [
        {
          id: 'security' as NavTab,
          label: t.sidebar.security.title,
          icon: ShieldAlert,
        },
        {
          id: 'api-shield' as NavTab,
          label: t.sidebar.apiShield.title,
          icon: ShieldCheck,
          badge: 'mTLS',
        },
        {
          id: 'ai-copilot' as NavTab,
          label: t.sidebar.aiCopilot.title,
          icon: Sparkles,
          badge: t.sidebar.aiCopilot.badge,
        },
        {
          id: 'ratelimit' as NavTab,
          label: t.sidebar.rateLimit.title,
          icon: Shield,
          badge: 'L7',
        },
        {
          id: 'ssl' as NavTab,
          label: t.sidebar.ssl.title,
          icon: Lock,
        },
        {
          id: 'zerotrust' as NavTab,
          label: t.sidebar.zeroTrust.title,
          icon: Network,
          badge: 'ACCESS',
        },
      ],
    },
    {
      key: 'compute',
      group: t.sidebar.groups.compute,
      items: [
        {
          id: 'workers' as NavTab,
          label: t.sidebar.workers.title,
          icon: Cpu,
          badge: 'EDGE',
        },
      ],
    },
    {
      key: 'governance',
      group: t.sidebar.groups.governance,
      items: [
        {
          id: 'analytics' as NavTab,
          label: t.sidebar.analytics.title,
          icon: BarChart3,
        },
        {
          id: 'finops' as NavTab,
          label: t.sidebar.finops.title,
          icon: Workflow,
          badge: t.sidebar.finops.badge,
        },
        {
          id: 'audit' as NavTab,
          label: t.sidebar.audit.title,
          icon: ActivitySquare,
          badge: t.sidebar.audit.badge,
        },
        {
          id: 'compliance' as NavTab,
          label: t.sidebar.compliance.title,
          icon: GitBranch,
          badge: t.sidebar.compliance.badge,
        },
      ],
    },
  ];

  return (
    <aside className={`shrink-0 border-r border-gray-800/80 bg-gray-950/70 p-3 flex flex-col justify-between select-none transition-all duration-200 ${
      isCollapsed ? 'w-16 md:w-20' : 'w-full md:w-60 lg:w-64'
    }`}>
      <div className="space-y-3">
        {/* Toggle Sidebar Button Header */}
        <div className="flex items-center justify-between px-1 pb-1 border-b border-gray-850">
          {!isCollapsed && (
            <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400">
              {t.sidebar.controlPlane}
            </span>
          )}
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-gray-850 transition-colors mx-auto md:mx-0"
            title={isCollapsed ? 'Mở rộng Menu (Expand)' : 'Thu gọn Menu (Collapse)'}
          >
            {isCollapsed ? (
              <PanelLeftOpen className="w-4 h-4 text-orange-400" />
            ) : (
              <PanelLeftClose className="w-4 h-4" />
            )}
          </button>
        </div>

        {/* Menu Sections */}
        {menuSections.map((section) => {
          const isGroupCollapsed = !!collapsedGroups[section.key];

          return (
            <div key={section.key} className="space-y-1">
              {/* Group Header (Clickable to collapse/expand group when sidebar is open) */}
              {!isCollapsed ? (
                <button
                  type="button"
                  onClick={() => toggleGroup(section.key)}
                  className="w-full flex items-center justify-between px-2 py-1 text-[10px] font-extrabold uppercase tracking-wider text-gray-400 hover:text-gray-200 rounded transition-colors group"
                >
                  <span>{section.group}</span>
                  <div className="text-gray-400 group-hover:text-gray-300">
                    {isGroupCollapsed ? (
                      <ChevronRight className="w-3 h-3" />
                    ) : (
                      <ChevronDown className="w-3 h-3" />
                    )}
                  </div>
                </button>
              ) : (
                <div className="h-px bg-gray-850 my-1.5" />
              )}

              {/* Group Items */}
              {(!isGroupCollapsed || isCollapsed) && (
                <div className="space-y-0.5 animate-in fade-in duration-100">
                  {section.items.map((item) => {
                    const Icon = item.icon;
                    const isActive = activeTab === item.id;

                    return (
                      <button
                        key={item.id}
                        onClick={() => onSelectTab(item.id)}
                        title={isCollapsed ? item.label : undefined}
                        className={`w-full flex items-center ${
                          isCollapsed ? 'justify-center py-2 px-1' : 'justify-between px-2.5 py-2'
                        } rounded-xl text-left transition-all group relative ${
                          isActive
                            ? 'bg-gradient-to-r from-orange-500/15 via-amber-500/10 to-transparent text-white border border-orange-500/30 shadow-sm font-semibold'
                            : 'text-gray-400 hover:text-gray-200 hover:bg-gray-900/60 font-medium'
                        }`}
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div className={`p-1.5 rounded-lg transition-colors ${
                            isActive
                              ? 'bg-orange-500 text-white shadow-md shadow-orange-500/30'
                              : 'bg-gray-900/80 text-gray-400 group-hover:text-gray-200 group-hover:bg-gray-850'
                          }`}>
                            <Icon className="w-3.5 h-3.5 shrink-0" />
                          </div>
                          {!isCollapsed && (
                            <span className={`text-xs truncate ${isActive ? 'text-white' : 'text-gray-300'}`}>
                              {item.label}
                            </span>
                          )}
                        </div>

                        {!isCollapsed && item.badge && (
                          <span className={`text-[9px] font-extrabold px-1.5 py-0.2 rounded shrink-0 ${
                            isActive
                              ? 'bg-gradient-to-r from-orange-500 to-amber-500 text-white shadow-xs'
                              : 'bg-gray-850 text-gray-400 border border-gray-750'
                          }`}>
                            {item.badge}
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* DevSecOps Automation Card */}
      {!isCollapsed ? (
        <div className="p-3 rounded-2xl bg-gradient-to-br from-gray-900 to-gray-950 border border-gray-800/90 text-xs text-gray-400 mt-4">
          <div className="flex items-center justify-between mb-1.5">
            <div className="flex items-center gap-1.5 text-white font-semibold text-xs">
              <Workflow className="w-3.5 h-3.5 text-orange-400" />
              <span>{t.sidebar.automationCard.title}</span>
            </div>
            <span className="text-emerald-400 text-[10px] font-mono flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" /> {t.sidebar.automationCard.live}
            </span>
          </div>
          <p className="text-[10px] text-gray-400 leading-normal">
            {t.sidebar.automationCard.desc}
          </p>
        </div>
      ) : (
        <div className="p-2 rounded-xl bg-gray-900/60 border border-gray-800 flex justify-center text-orange-400 mt-4" title={t.sidebar.automationCard.title}>
          <Workflow className="w-4 h-4" />
        </div>
      )}
    </aside>
  );
};
