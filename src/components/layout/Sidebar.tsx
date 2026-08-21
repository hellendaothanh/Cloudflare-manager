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
  Sparkles
} from 'lucide-react';

export type NavTab = 'overview' | 'dns' | 'security' | 'ssl' | 'page-rules' | 'analytics' | 'audit';

interface SidebarProps {
  activeTab: NavTab;
  onSelectTab: (tab: NavTab) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ activeTab, onSelectTab }) => {
  const { t } = useLanguage();

  const menuItems = [
    {
      id: 'overview' as NavTab,
      label: t.sidebar.overview.title,
      subtitle: t.sidebar.overview.subtitle,
      icon: Globe,
      color: 'text-blue-400',
    },
    {
      id: 'dns' as NavTab,
      label: t.sidebar.dns.title,
      subtitle: t.sidebar.dns.subtitle,
      icon: Layers,
      color: 'text-amber-400',
    },
    {
      id: 'security' as NavTab,
      label: t.sidebar.security.title,
      subtitle: t.sidebar.security.subtitle,
      icon: ShieldAlert,
      color: 'text-rose-400',
    },
    {
      id: 'ssl' as NavTab,
      label: t.sidebar.ssl.title,
      subtitle: t.sidebar.ssl.subtitle,
      icon: Lock,
      color: 'text-emerald-400',
    },
    {
      id: 'page-rules' as NavTab,
      label: t.sidebar.pageRules.title,
      subtitle: t.sidebar.pageRules.subtitle,
      icon: SlidersHorizontal,
      color: 'text-purple-400',
    },
    {
      id: 'analytics' as NavTab,
      label: t.sidebar.analytics.title,
      subtitle: t.sidebar.analytics.subtitle,
      icon: BarChart3,
      color: 'text-cyan-400',
    },
    {
      id: 'audit' as NavTab,
      label: t.sidebar.audit.title,
      subtitle: t.sidebar.audit.subtitle,
      icon: ActivitySquare,
      color: 'text-orange-400',
      badge: t.sidebar.audit.badge,
    },
  ];

  return (
    <aside className="w-full md:w-64 lg:w-72 shrink-0 border-r border-gray-800/80 bg-gray-950/60 p-4 flex flex-col justify-between">
      <div className="space-y-1.5">
        <div className="px-3 py-2 text-[11px] font-bold uppercase tracking-wider text-gray-500">
          {t.sidebar.controlPlane}
        </div>

        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;

          return (
            <button
              key={item.id}
              onClick={() => onSelectTab(item.id)}
              className={`w-full flex items-center gap-3 px-3.5 py-3 rounded-xl text-left transition-all group relative ${
                isActive
                  ? 'bg-gradient-to-r from-gray-900 to-gray-850 text-white border border-gray-750 shadow-md'
                  : 'text-gray-400 hover:text-gray-200 hover:bg-gray-900/60'
              }`}
            >
              {isActive && (
                <div className="absolute left-0 top-2 bottom-2 w-1 bg-gradient-to-b from-orange-500 to-amber-500 rounded-r-full" />
              )}
              <div className={`p-2 rounded-lg ${isActive ? 'bg-gray-800 text-orange-400' : 'bg-gray-900/80 text-gray-400 group-hover:text-gray-200'}`}>
                <Icon className="w-4 h-4" />
              </div>
              <div className="flex-1 truncate">
                <div className="flex items-center justify-between">
                  <span className={`text-xs font-semibold ${isActive ? 'text-white' : 'text-gray-300'}`}>
                    {item.label}
                  </span>
                  {item.badge && (
                    <span className="text-[9px] font-extrabold px-1.5 py-0.5 rounded bg-gradient-to-r from-orange-500 to-amber-500 text-white">
                      {item.badge}
                    </span>
                  )}
                </div>
                <span className="text-[10px] text-gray-400 block truncate">{item.subtitle}</span>
              </div>
            </button>
          );
        })}
      </div>

      {/* DevSecOps Quick Card in Sidebar */}
      <div className="p-3.5 rounded-2xl bg-gradient-to-br from-gray-900 to-gray-950 border border-gray-800 text-xs text-gray-400 mt-6">
        <div className="flex items-center gap-2 text-white font-semibold text-xs mb-1">
          <Sparkles className="w-4 h-4 text-orange-400" />
          <span>{t.sidebar.automationCard.title}</span>
        </div>
        <p className="text-[11px] text-gray-400 leading-relaxed mb-2">
          {t.sidebar.automationCard.desc}
        </p>
        <div className="flex items-center justify-between text-[10px] text-gray-400 pt-2 border-t border-gray-800/80 font-mono">
          <span>{t.sidebar.automationCard.restApi}</span>
          <span className="text-emerald-400 flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" /> {t.sidebar.automationCard.live}
          </span>
        </div>
      </div>
    </aside>
  );
};
