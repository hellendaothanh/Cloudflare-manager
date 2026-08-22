'use client';

import React, { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useLanguage } from '@/context/LanguageContext';
import { TokenModal } from '@/components/auth/TokenModal';
import { AccountManagerModal } from '@/components/auth/AccountManagerModal';
import { QuickActionsModal } from '@/components/common/QuickActionsModal';
import { DocumentationModal } from '@/components/common/DocumentationModal';
import { UserRole } from '@/types/cloudflare';
import { 
  Cloud, 
  ShieldCheck, 
  Zap, 
  ChevronDown, 
  Globe, 
  Check, 
  RefreshCw,
  FlaskConical,
  Languages,
  Building2,
  Shield,
  UserCheck,
  Plus,
  ShieldAlert,
  Eye,
  ServerCog,
  BookOpen
} from 'lucide-react';

export const Navbar: React.FC = () => {
  const { 
    isDemo, 
    accounts,
    activeAccount,
    switchAccount,
    role,
    setRole,
    zones, 
    selectedZone, 
    setSelectedZone, 
    isLoadingZones, 
    refreshZones 
  } = useAuth();

  const { language, setLanguage, t } = useLanguage();

  const [isTokenModalOpen, setIsTokenModalOpen] = useState(false);
  const [isAccountModalOpen, setIsAccountModalOpen] = useState(false);
  const [isQuickActionsOpen, setIsQuickActionsOpen] = useState(false);
  const [isDocsModalOpen, setIsDocsModalOpen] = useState(false);
  const [isZoneDropdownOpen, setIsZoneDropdownOpen] = useState(false);
  const [isAccountDropdownOpen, setIsAccountDropdownOpen] = useState(false);
  const [isRoleDropdownOpen, setIsRoleDropdownOpen] = useState(false);
  const [isLangDropdownOpen, setIsLangDropdownOpen] = useState(false);

  const roleConfigs: Record<UserRole, { badgeColor: string; icon: React.ComponentType<{ className?: string }> }> = {
    admin: { badgeColor: 'text-purple-400 bg-purple-500/10 border-purple-500/30', icon: ServerCog },
    dns_operator: { badgeColor: 'text-cyan-400 bg-cyan-500/10 border-cyan-500/30', icon: Globe },
    security_engineer: { badgeColor: 'text-orange-400 bg-orange-500/10 border-orange-500/30', icon: ShieldAlert },
    viewer: { badgeColor: 'text-gray-400 bg-gray-500/10 border-gray-500/30', icon: Eye },
  };

  return (
    <>
      <header className="sticky top-0 z-40 w-full border-b border-gray-800 bg-gray-950/85 backdrop-blur-md px-3 lg:px-6 py-2.5">
        <div className="flex items-center justify-between gap-3">
          
          {/* Left: Brand & DevSecOps Platform Tag */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-gradient-to-br from-orange-500 to-amber-600 text-white shadow-lg shadow-orange-500/20">
                <Cloud className="w-5 h-5 fill-current" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-extrabold text-base tracking-tight text-white">
                    {t.navbar.brand}<span className="text-orange-500">{t.navbar.brandSuffix}</span>
                  </span>
                  <span className="hidden xl:inline-flex items-center gap-1 text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-400 border border-cyan-500/30">
                    <ShieldCheck className="w-3 h-3" /> {t.navbar.tag}
                  </span>
                </div>
                <p className="text-[10px] text-gray-400 hidden xl:block">{t.navbar.tagSubtitle}</p>
              </div>
            </div>
          </div>

          {/* Center: Account Switcher & Zone Selector */}
          <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
            
            {/* Account Switcher Dropdown */}
            <div className="relative">
              <button
                onClick={() => {
                  setIsAccountDropdownOpen(!isAccountDropdownOpen);
                  setIsZoneDropdownOpen(false);
                  setIsRoleDropdownOpen(false);
                  setIsLangDropdownOpen(false);
                }}
                className="flex items-center gap-2 px-2.5 py-1.5 rounded-xl bg-gray-900 border border-gray-800 hover:border-gray-700 text-white text-xs font-medium transition-all shadow-inner"
                title={t.navbar.accounts}
              >
                <Building2 className="w-3.5 h-3.5 text-amber-400" />
                <div className="text-left hidden sm:block max-w-[130px]">
                  <span className="truncate block font-bold text-gray-200 text-[11px] leading-tight">
                    {activeAccount?.name || 'Account'}
                  </span>
                </div>
                {activeAccount?.isDemo && (
                  <span className="text-[9px] px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 font-mono">
                    DEMO
                  </span>
                )}
                <ChevronDown className="w-3 h-3 text-gray-400" />
              </button>

              {isAccountDropdownOpen && (
                <div className="absolute top-full mt-2 w-64 left-0 bg-gray-900 border border-gray-800 rounded-xl shadow-2xl p-2 z-50 animate-in fade-in zoom-in-95 duration-100">
                  <div className="flex items-center justify-between px-2 py-1 text-[10px] uppercase font-bold text-gray-400 border-b border-gray-800 pb-1.5 mb-1">
                    <span>{t.navbar.accounts} ({accounts.length})</span>
                    <button
                      onClick={() => {
                        setIsAccountModalOpen(true);
                        setIsAccountDropdownOpen(false);
                      }}
                      className="text-orange-400 hover:text-orange-300 text-[11px] font-semibold flex items-center gap-0.5"
                    >
                      <Plus className="w-3 h-3" /> {t.navbar.manageAccounts}
                    </button>
                  </div>

                  <div className="max-h-56 overflow-y-auto space-y-1 py-0.5">
                    {accounts.map((acc) => {
                      const isCurr = activeAccount?.id === acc.id;
                      return (
                        <button
                          key={acc.id}
                          onClick={() => {
                            switchAccount(acc.id);
                            setIsAccountDropdownOpen(false);
                          }}
                          className={`w-full flex items-center justify-between px-2.5 py-2 rounded-lg text-xs text-left transition-colors ${
                            isCurr ? 'bg-orange-500/15 text-orange-400 font-bold' : 'text-gray-300 hover:bg-gray-800'
                          }`}
                        >
                          <div className="truncate">
                            <span className="block truncate text-[11px]">{acc.name}</span>
                            <span className="text-[10px] text-gray-500 block truncate">{acc.organization || 'Cloudflare'}</span>
                          </div>
                          {isCurr && <Check className="w-3.5 h-3.5 text-orange-400 shrink-0 ml-1" />}
                        </button>
                      );
                    })}
                  </div>

                  <div className="pt-1.5 mt-1 border-t border-gray-800">
                    <button
                      onClick={() => {
                        setIsAccountModalOpen(true);
                        setIsAccountDropdownOpen(false);
                      }}
                      className="w-full py-1.5 px-2 rounded-lg bg-gray-950 hover:bg-gray-800 text-orange-400 text-xs font-semibold text-center transition-colors border border-gray-800"
                    >
                      ⚙️ {t.navbar.manageAccounts}
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Zone Selector Dropdown */}
            <div className="relative">
              <button
                onClick={() => {
                  setIsZoneDropdownOpen(!isZoneDropdownOpen);
                  setIsAccountDropdownOpen(false);
                  setIsRoleDropdownOpen(false);
                  setIsLangDropdownOpen(false);
                }}
                className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-gray-900 border border-gray-800 hover:border-gray-700 text-white text-xs font-medium transition-all shadow-inner"
              >
                <Globe className="w-3.5 h-3.5 text-cyan-400" />
                <span className="max-w-[140px] truncate font-mono text-gray-200 text-xs">
                  {selectedZone ? selectedZone.name : (isLoadingZones ? t.navbar.loadingZones : t.navbar.selectZone)}
                </span>
                {selectedZone && (
                  <span className={`w-2 h-2 rounded-full ${selectedZone.status === 'active' ? 'bg-emerald-500' : 'bg-amber-500'}`} />
                )}
                <ChevronDown className="w-3.5 h-3.5 text-gray-400" />
              </button>

              {isZoneDropdownOpen && (
                <div className="absolute top-full mt-2 w-72 left-0 sm:left-auto sm:right-0 bg-gray-900 border border-gray-800 rounded-xl shadow-2xl p-2 z-50 animate-in fade-in zoom-in-95 duration-100">
                  <div className="flex items-center justify-between px-2 py-1.5 text-[11px] text-gray-400 font-semibold border-b border-gray-800">
                    <span>{t.navbar.zonesList} ({zones.length})</span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        refreshZones();
                      }}
                      className="hover:text-white flex items-center gap-1"
                    >
                      <RefreshCw className={`w-3 h-3 ${isLoadingZones ? 'animate-spin' : ''}`} /> {t.navbar.refreshZones}
                    </button>
                  </div>
                  <div className="max-h-60 overflow-y-auto py-1 space-y-1">
                    {zones.length === 0 ? (
                      <div className="p-3 text-center text-xs text-gray-500">{t.navbar.noZones}</div>
                    ) : (
                      zones.map((zone) => (
                        <button
                          key={zone.id}
                          onClick={() => {
                            setSelectedZone(zone);
                            setIsZoneDropdownOpen(false);
                          }}
                          className={`w-full flex items-center justify-between px-2.5 py-2 rounded-lg text-xs text-left transition-colors ${
                            selectedZone?.id === zone.id
                              ? 'bg-orange-500/15 text-orange-400 font-medium'
                              : 'text-gray-300 hover:bg-gray-800'
                          }`}
                        >
                          <div className="flex items-center gap-2 truncate">
                            <span className={`w-2 h-2 rounded-full shrink-0 ${zone.status === 'active' ? 'bg-emerald-500' : 'bg-amber-500'}`} />
                            <span className="truncate font-mono">{zone.name}</span>
                          </div>
                          {selectedZone?.id === zone.id && <Check className="w-3.5 h-3.5 shrink-0 text-orange-400" />}
                        </button>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Quick Actions Trigger */}
            <button
              onClick={() => setIsQuickActionsOpen(true)}
              disabled={!selectedZone}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-orange-500/10 border border-orange-500/30 hover:bg-orange-500/20 text-orange-400 text-xs font-semibold transition-all disabled:opacity-40"
              title={t.navbar.quickActionsTooltip}
            >
              <Zap className="w-3.5 h-3.5 fill-current" />
              <span className="hidden md:inline">{t.navbar.quickActions}</span>
            </button>
          </div>

          {/* Right: RBAC Role Selector + Language + Token Status */}
          <div className="flex items-center gap-2">
            
            {/* RBAC Role Switcher */}
            <div className="relative">
              <button
                onClick={() => {
                  setIsRoleDropdownOpen(!isRoleDropdownOpen);
                  setIsAccountDropdownOpen(false);
                  setIsZoneDropdownOpen(false);
                  setIsLangDropdownOpen(false);
                }}
                className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border text-xs font-semibold transition-all ${roleConfigs[role].badgeColor}`}
                title={t.rbac.subtitle}
              >
                {React.createElement(roleConfigs[role].icon, { className: 'w-3.5 h-3.5 shrink-0' })}
                <span className="hidden sm:inline font-mono uppercase text-[10px] tracking-wider">
                  {t.rbac.roles[role]?.badge || role}
                </span>
                <ChevronDown className="w-3 h-3 opacity-70" />
              </button>

              {isRoleDropdownOpen && (
                <div className="absolute top-full mt-2 right-0 w-72 bg-gray-900 border border-gray-800 rounded-xl shadow-2xl p-2 z-50 animate-in fade-in zoom-in-95 duration-100">
                  <div className="px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-gray-400 border-b border-gray-800 pb-1 mb-1">
                    {t.rbac.title}
                  </div>
                  
                  <div className="space-y-1 py-1">
                    {(['admin', 'dns_operator', 'security_engineer', 'viewer'] as UserRole[]).map((r) => {
                      const cfg = roleConfigs[r];
                      const roleData = t.rbac.roles[r];
                      const isCurr = role === r;
                      const RoleIcon = cfg.icon;

                      return (
                        <button
                          key={r}
                          onClick={() => {
                            setRole(r);
                            setIsRoleDropdownOpen(false);
                          }}
                          className={`w-full p-2 rounded-lg text-left transition-colors flex items-start gap-2.5 ${
                            isCurr ? 'bg-orange-500/15 border border-orange-500/30' : 'hover:bg-gray-800'
                          }`}
                        >
                          <div className={`p-1 rounded-md mt-0.5 ${isCurr ? 'bg-orange-500/20 text-orange-400' : 'bg-gray-800 text-gray-400'}`}>
                            <RoleIcon className="w-4 h-4 shrink-0" />
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center justify-between">
                              <span className={`text-xs font-bold ${isCurr ? 'text-orange-400' : 'text-white'}`}>
                                {roleData?.name || r}
                              </span>
                              {isCurr && <Check className="w-3.5 h-3.5 text-orange-400" />}
                            </div>
                            <p className="text-[10px] text-gray-400 leading-tight mt-0.5">
                              {roleData?.desc}
                            </p>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* Interactive Documentation & Guide Modal Trigger */}
            <button
              onClick={() => setIsDocsModalOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/30 text-cyan-300 text-xs font-semibold transition-all shadow-sm shadow-cyan-500/10"
              title={language === 'vi' ? 'Sổ tay Hướng dẫn & Cẩm nang DevSecOps' : 'Interactive Guide & Docs'}
            >
              <BookOpen className="w-3.5 h-3.5" />
              <span className="hidden md:inline">
                {language === 'vi' ? 'Sổ tay HDSD' : 'Docs & Guide'}
              </span>
            </button>

            {/* Language Switcher Dropdown */}
            <div className="relative">
              <button
                onClick={() => {
                  setIsLangDropdownOpen(!isLangDropdownOpen);
                  setIsAccountDropdownOpen(false);
                  setIsZoneDropdownOpen(false);
                  setIsRoleDropdownOpen(false);
                }}
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-gray-900 border border-gray-800 hover:border-gray-700 text-gray-200 text-xs font-medium transition-all"
                title={t.navbar.language}
              >
                <Languages className="w-3.5 h-3.5 text-cyan-400" />
                <span className="font-semibold text-[11px] uppercase tracking-wider text-gray-300">
                  {language === 'vi' ? '🇻🇳 VI' : '🇬🇧 EN'}
                </span>
                <ChevronDown className="w-3 h-3 text-gray-400" />
              </button>

              {isLangDropdownOpen && (
                <div className="absolute top-full mt-2 right-0 w-36 bg-gray-900 border border-gray-800 rounded-xl shadow-2xl p-1 z-50 animate-in fade-in zoom-in-95 duration-100">
                  <button
                    onClick={() => {
                      setLanguage('vi');
                      setIsLangDropdownOpen(false);
                    }}
                    className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs transition-colors ${
                      language === 'vi' ? 'bg-orange-500/20 text-orange-400 font-bold' : 'text-gray-300 hover:bg-gray-800'
                    }`}
                  >
                    <span className="flex items-center gap-1.5">
                      <span>🇻🇳</span>
                      <span>Tiếng Việt</span>
                    </span>
                    {language === 'vi' && <Check className="w-3.5 h-3.5 text-orange-400" />}
                  </button>
                  <button
                    onClick={() => {
                      setLanguage('en');
                      setIsLangDropdownOpen(false);
                    }}
                    className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs transition-colors ${
                      language === 'en' ? 'bg-orange-500/20 text-orange-400 font-bold' : 'text-gray-300 hover:bg-gray-800'
                    }`}
                  >
                    <span className="flex items-center gap-1.5">
                      <span>🇬🇧</span>
                      <span>English</span>
                    </span>
                    {language === 'en' && <Check className="w-3.5 h-3.5 text-orange-400" />}
                  </button>
                </div>
              )}
            </div>

            {/* Account / Token Manager Modal Trigger */}
            <button
              onClick={() => setIsAccountModalOpen(true)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium transition-all ${
                isDemo
                  ? 'bg-amber-500/10 border border-amber-500/30 text-amber-300 hover:bg-amber-500/20'
                  : 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 hover:bg-emerald-500/20'
              }`}
              title="Cloudflare API Accounts & Tokens"
            >
              <Building2 className="w-3.5 h-3.5" />
              <span className="hidden lg:inline">
                {isDemo ? t.navbar.demoMode : activeAccount?.name || t.navbar.connectedToken}
              </span>
              {isDemo && (
                <span className="flex items-center gap-1 text-[10px] bg-amber-500/20 px-1.5 py-0.5 rounded text-amber-200">
                  <FlaskConical className="w-2.5 h-2.5" /> {t.navbar.sandbox}
                </span>
              )}
            </button>
          </div>

        </div>
      </header>

      {/* Modals */}
      <DocumentationModal isOpen={isDocsModalOpen} onClose={() => setIsDocsModalOpen(false)} />
      <AccountManagerModal isOpen={isAccountModalOpen} onClose={() => setIsAccountModalOpen(false)} />
      <TokenModal isOpen={isTokenModalOpen} onClose={() => setIsTokenModalOpen(false)} />
      <QuickActionsModal isOpen={isQuickActionsOpen} onClose={() => setIsQuickActionsOpen(false)} />
    </>
  );
};
