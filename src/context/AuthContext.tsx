'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { 
  Zone, 
  CloudflareAccountProfile, 
  UserRole, 
  RolePermissions, 
  ROLE_PERMISSIONS_MAP 
} from '@/types/cloudflare';

interface AuthContextType {
  token: string;
  setToken: (token: string) => void;
  isAuthenticated: boolean;
  isDemo: boolean;
  accounts: CloudflareAccountProfile[];
  activeAccount: CloudflareAccountProfile | null;
  addAccount: (account: { name: string; token: string; organization?: string; isDemo?: boolean }) => string;
  switchAccount: (accountId: string) => void;
  removeAccount: (accountId: string) => void;
  updateAccount: (accountId: string, updates: Partial<CloudflareAccountProfile>) => void;
  role: UserRole;
  setRole: (role: UserRole) => void;
  permissions: RolePermissions;
  hasPermission: (permission: keyof RolePermissions) => boolean;
  zones: Zone[];
  selectedZone: Zone | null;
  setSelectedZone: (zone: Zone | null) => void;
  isLoadingZones: boolean;
  refreshZones: () => Promise<void>;
  authFetch: (url: string, options?: RequestInit) => Promise<any>;
  logout: () => void;
  setDemoMode: () => void;
}

const DEFAULT_DEMO_ACCOUNT: CloudflareAccountProfile = {
  id: 'demo-account',
  name: 'Sandbox Demo Lab',
  token: 'demo-token',
  organization: 'DevSecOps Mock Enterprise',
  addedAt: new Date().toISOString(),
  isDemo: true,
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [accounts, setAccounts] = useState<CloudflareAccountProfile[]>([]);
  const [activeAccount, setActiveAccount] = useState<CloudflareAccountProfile | null>(null);
  const [role, setRoleState] = useState<UserRole>('admin');
  const [zones, setZones] = useState<Zone[]>([]);
  const [selectedZone, setSelectedZone] = useState<Zone | null>(null);
  const [isLoadingZones, setIsLoadingZones] = useState<boolean>(false);

  // Initialize accounts & role from localStorage
  useEffect(() => {
    // 1. Role
    const savedRole = localStorage.getItem('cf_user_role') as UserRole;
    if (savedRole && ROLE_PERMISSIONS_MAP[savedRole]) {
      setRoleState(savedRole);
    }

    // 2. Accounts
    let loadedAccounts: CloudflareAccountProfile[] = [];
    const savedAccountsJson = localStorage.getItem('cf_accounts');
    if (savedAccountsJson) {
      try {
        loadedAccounts = JSON.parse(savedAccountsJson);
      } catch (e) {
        loadedAccounts = [];
      }
    }

    // Migrate single token if present from previous sessions
    const legacyToken = localStorage.getItem('cf_api_token');
    if (legacyToken && legacyToken !== 'demo-token') {
      const exists = loadedAccounts.some(a => a.token === legacyToken);
      if (!exists) {
        loadedAccounts.push({
          id: `acc-${Date.now()}`,
          name: 'Primary Account',
          token: legacyToken,
          organization: 'Cloudflare Org',
          addedAt: new Date().toISOString(),
          isDemo: false,
        });
      }
    }

    // Ensure Demo account is present if list is empty
    if (loadedAccounts.length === 0) {
      loadedAccounts = [DEFAULT_DEMO_ACCOUNT];
    }

    setAccounts(loadedAccounts);
    localStorage.setItem('cf_accounts', JSON.stringify(loadedAccounts));

    // 3. Active account
    const savedActiveId = localStorage.getItem('cf_active_account_id');
    const matched = loadedAccounts.find(a => a.id === savedActiveId);
    if (matched) {
      setActiveAccount(matched);
    } else {
      setActiveAccount(loadedAccounts[0]);
      localStorage.setItem('cf_active_account_id', loadedAccounts[0].id);
    }
  }, []);

  const saveAccounts = (newAccounts: CloudflareAccountProfile[]) => {
    setAccounts(newAccounts);
    localStorage.setItem('cf_accounts', JSON.stringify(newAccounts));
  };

  const addAccount = (data: { name: string; token: string; organization?: string; isDemo?: boolean }) => {
    const newId = `acc-${Date.now()}`;
    const newAcc: CloudflareAccountProfile = {
      id: newId,
      name: data.name.trim() || 'Cloudflare Account',
      token: data.token.trim(),
      organization: data.organization?.trim() || 'Default Org',
      addedAt: new Date().toISOString(),
      isDemo: Boolean(data.isDemo || data.token === 'demo-token'),
    };

    const updated = [...accounts.filter(a => a.id !== newId), newAcc];
    saveAccounts(updated);
    switchAccount(newId);
    return newId;
  };

  const switchAccount = (accountId: string) => {
    const target = accounts.find(a => a.id === accountId);
    if (target) {
      setActiveAccount(target);
      localStorage.setItem('cf_active_account_id', target.id);
      if (target.isDemo) {
        localStorage.setItem('cf_is_demo', 'true');
        localStorage.removeItem('cf_api_token');
      } else {
        localStorage.removeItem('cf_is_demo');
        localStorage.setItem('cf_api_token', target.token);
      }
      setSelectedZone(null);
    }
  };

  const removeAccount = (accountId: string) => {
    const updated = accounts.filter(a => a.id !== accountId);
    const finalAccounts = updated.length > 0 ? updated : [DEFAULT_DEMO_ACCOUNT];
    saveAccounts(finalAccounts);

    if (activeAccount?.id === accountId) {
      switchAccount(finalAccounts[0].id);
    }
  };

  const updateAccount = (accountId: string, updates: Partial<CloudflareAccountProfile>) => {
    const updated = accounts.map(a => (a.id === accountId ? { ...a, ...updates } : a));
    saveAccounts(updated);
    if (activeAccount?.id === accountId) {
      setActiveAccount(prev => (prev ? { ...prev, ...updates } : null));
    }
  };

  const setToken = (newToken: string) => {
    if (!newToken || newToken === 'demo-token') {
      switchAccount('demo-account');
      return;
    }

    const existing = accounts.find(a => a.token === newToken);
    if (existing) {
      switchAccount(existing.id);
    } else {
      addAccount({
        name: 'My Cloudflare Token',
        token: newToken,
        organization: 'Main Org',
      });
    }
  };

  const setRole = (newRole: UserRole) => {
    setRoleState(newRole);
    localStorage.setItem('cf_user_role', newRole);
  };

  const setDemoMode = () => {
    const demo = accounts.find(a => a.isDemo) || DEFAULT_DEMO_ACCOUNT;
    if (!accounts.some(a => a.id === demo.id)) {
      saveAccounts([...accounts, demo]);
    }
    switchAccount(demo.id);
  };

  const logout = () => {
    removeAccount(activeAccount?.id || '');
  };

  const currentToken = activeAccount?.token || 'demo-token';
  const isDemo = Boolean(activeAccount?.isDemo || currentToken === 'demo-token');
  const permissions = ROLE_PERMISSIONS_MAP[role] || ROLE_PERMISSIONS_MAP.viewer;

  const hasPermission = (perm: keyof RolePermissions): boolean => {
    return Boolean(permissions[perm]);
  };

  const authFetch = async (url: string, options: RequestInit = {}) => {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${currentToken}`,
      ...(options.headers as Record<string, string> || {}),
    };

    const res = await fetch(url, { ...options, headers });
    const data = await res.json();
    if (!res.ok || data.success === false) {
      throw new Error(data.message || `Request failed with status ${res.status}`);
    }
    return data.result !== undefined ? data.result : data;
  };

  const refreshZones = async () => {
    if (!currentToken) return;
    setIsLoadingZones(true);
    try {
      const data = await authFetch('/api/zones');
      const list = Array.isArray(data) ? data : [];
      setZones(list);
      if (list.length > 0) {
        if (!selectedZone || !list.find(z => z.id === selectedZone.id)) {
          setSelectedZone(list[0]);
        }
      } else {
        setSelectedZone(null);
      }
    } catch (err) {
      console.error('Failed to load zones for active account:', err);
    } finally {
      setIsLoadingZones(false);
    }
  };

  useEffect(() => {
    if (activeAccount) {
      refreshZones();
    }
  }, [activeAccount?.id, activeAccount?.token]);

  return (
    <AuthContext.Provider
      value={{
        token: currentToken,
        setToken,
        isAuthenticated: !!currentToken,
        isDemo,
        accounts,
        activeAccount,
        addAccount,
        switchAccount,
        removeAccount,
        updateAccount,
        role,
        setRole,
        permissions,
        hasPermission,
        zones,
        selectedZone,
        setSelectedZone,
        isLoadingZones,
        refreshZones,
        authFetch,
        logout,
        setDemoMode,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};
