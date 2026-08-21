'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { Zone } from '@/types/cloudflare';

interface AuthContextType {
  token: string;
  setToken: (token: string) => void;
  isAuthenticated: boolean;
  isDemo: boolean;
  zones: Zone[];
  selectedZone: Zone | null;
  setSelectedZone: (zone: Zone | null) => void;
  isLoadingZones: boolean;
  refreshZones: () => Promise<void>;
  authFetch: (url: string, options?: RequestInit) => Promise<any>;
  logout: () => void;
  setDemoMode: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [token, setTokenState] = useState<string>('');
  const [isDemo, setIsDemo] = useState<boolean>(false);
  const [zones, setZones] = useState<Zone[]>([]);
  const [selectedZone, setSelectedZone] = useState<Zone | null>(null);
  const [isLoadingZones, setIsLoadingZones] = useState<boolean>(false);

  useEffect(() => {
    // Check saved token or demo preference
    const savedToken = localStorage.getItem('cf_api_token');
    const demoPref = localStorage.getItem('cf_is_demo') === 'true';

    if (savedToken) {
      setTokenState(savedToken);
      setIsDemo(false);
    } else if (demoPref) {
      setTokenState('demo-token');
      setIsDemo(true);
    } else {
      // Default to demo mode on initial launch so user can explore right away
      setTokenState('demo-token');
      setIsDemo(true);
    }
  }, []);

  const setToken = (newToken: string) => {
    setTokenState(newToken);
    if (newToken === 'demo-token') {
      setIsDemo(true);
      localStorage.setItem('cf_is_demo', 'true');
      localStorage.removeItem('cf_api_token');
    } else {
      setIsDemo(false);
      localStorage.removeItem('cf_is_demo');
      localStorage.setItem('cf_api_token', newToken);
    }
  };

  const logout = () => {
    setTokenState('');
    setIsDemo(false);
    setZones([]);
    setSelectedZone(null);
    localStorage.removeItem('cf_api_token');
    localStorage.removeItem('cf_is_demo');
  };

  const setDemoMode = () => {
    setToken('demo-token');
  };

  const authFetch = async (url: string, options: RequestInit = {}) => {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token || 'demo-token'}`,
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
    if (!token) return;
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
      console.error('Failed to load zones:', err);
    } finally {
      setIsLoadingZones(false);
    }
  };

  useEffect(() => {
    if (token) {
      refreshZones();
    }
  }, [token]);

  return (
    <AuthContext.Provider
      value={{
        token,
        setToken,
        isAuthenticated: !!token,
        isDemo,
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
