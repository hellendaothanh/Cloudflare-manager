'use client';

import React, { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useLanguage } from '@/context/LanguageContext';
import { TokenModal } from '@/components/auth/TokenModal';
import { QuickActionsModal } from '@/components/common/QuickActionsModal';
import { 
  Cloud, 
  ShieldCheck, 
  Key, 
  Zap, 
  ChevronDown, 
  Globe, 
  Check, 
  RefreshCw,
  Sparkles,
  Languages
} from 'lucide-react';

export const Navbar: React.FC = () => {
  const { 
    isDemo, 
    zones, 
    selectedZone, 
    setSelectedZone, 
    isLoadingZones, 
    refreshZones 
  } = useAuth();

  const { language, setLanguage, t } = useLanguage();

  const [isTokenModalOpen, setIsTokenModalOpen] = useState(false);
  const [isQuickActionsOpen, setIsQuickActionsOpen] = useState(false);
  const [isZoneDropdownOpen, setIsZoneDropdownOpen] = useState(false);
  const [isLangDropdownOpen, setIsLangDropdownOpen] = useState(false);

  return (
    <>
      <header className="sticky top-0 z-40 w-full border-b border-gray-800 bg-gray-950/80 backdrop-blur-md px-4 lg:px-8 py-3">
        <div className="flex items-center justify-between gap-4">
          
          {/* Brand & DevSecOps Platform Tag */}
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
                  <span className="hidden sm:inline-flex items-center gap-1 text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-400 border border-cyan-500/30">
                    <ShieldCheck className="w-3 h-3" /> {t.navbar.tag}
                  </span>
                </div>
                <p className="text-[10px] text-gray-400 hidden sm:block">{t.navbar.tagSubtitle}</p>
              </div>
            </div>
          </div>

          {/* Center: Zone Selector Dropdown */}
          <div className="flex items-center gap-2">
            <div className="relative">
              <button
                onClick={() => setIsZoneDropdownOpen(!isZoneDropdownOpen)}
                className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-gray-900 border border-gray-800 hover:border-gray-700 text-white text-xs font-medium transition-all shadow-inner"
              >
                <Globe className="w-3.5 h-3.5 text-orange-400" />
                <span className="max-w-[160px] truncate font-mono text-gray-200">
                  {selectedZone ? selectedZone.name : (isLoadingZones ? t.navbar.loadingZones : t.navbar.selectZone)}
                </span>
                {selectedZone && (
                  <span className={`w-2 h-2 rounded-full ${selectedZone.status === 'active' ? 'bg-emerald-500' : 'bg-amber-500'}`} />
                )}
                <ChevronDown className="w-3.5 h-3.5 text-gray-400 ml-1" />
              </button>

              {isZoneDropdownOpen && (
                <div className="absolute top-full mt-2 w-72 left-0 sm:left-auto sm:right-0 bg-gray-900 border border-gray-800 rounded-xl shadow-2xl p-2 z-50">
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
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-orange-500/10 border border-orange-500/30 hover:bg-orange-500/20 text-orange-400 text-xs font-semibold transition-all disabled:opacity-40"
              title={t.navbar.quickActionsTooltip}
            >
              <Zap className="w-3.5 h-3.5 fill-current" />
              <span className="hidden md:inline">{t.navbar.quickActions}</span>
            </button>
          </div>

          {/* Right: Language Selector & API Token Status */}
          <div className="flex items-center gap-2">
            {/* Language Switcher Dropdown */}
            <div className="relative">
              <button
                onClick={() => setIsLangDropdownOpen(!isLangDropdownOpen)}
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
                <div className="absolute top-full mt-2 right-0 w-36 bg-gray-900 border border-gray-800 rounded-xl shadow-2xl p-1 z-50">
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

            {/* API Token / Demo Status Button */}
            <button
              onClick={() => setIsTokenModalOpen(true)}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-medium transition-all ${
                isDemo
                  ? 'bg-amber-500/10 border border-amber-500/30 text-amber-300 hover:bg-amber-500/20'
                  : 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 hover:bg-emerald-500/20'
              }`}
            >
              <Key className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">
                {isDemo ? t.navbar.demoMode : t.navbar.connectedToken}
              </span>
              {isDemo && (
                <span className="flex items-center gap-1 text-[10px] bg-amber-500/20 px-1.5 py-0.5 rounded text-amber-200">
                  <Sparkles className="w-2.5 h-2.5" /> {t.navbar.sandbox}
                </span>
              )}
            </button>
          </div>

        </div>
      </header>

      {/* Modals */}
      <TokenModal isOpen={isTokenModalOpen} onClose={() => setIsTokenModalOpen(false)} />
      <QuickActionsModal isOpen={isQuickActionsOpen} onClose={() => setIsQuickActionsOpen(false)} />
    </>
  );
};
