import React, { createContext, useContext, useState, useEffect } from 'react';
import { User } from '../types/index.ts';
import { api } from '../services/api.ts';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (credentials: any) => Promise<void>;
  adminLogin: (credentials: any) => Promise<void>;
  register: (data: any) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
  openAuthModal: (mode?: 'login' | 'register' | 'admin' | 'reset') => void;
  closeAuthModal: () => void;
  authModalOpen: boolean;
  authModalMode: 'login' | 'register' | 'admin' | 'reset';
  activeView: string;
  setActiveView: (view: string) => void;
  settings: Record<string, string>;
  refreshSettings: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authModalMode, setAuthModalMode] = useState<'login' | 'register' | 'admin' | 'reset'>('login');
  const [activeView, setActiveView] = useState('home');
  const [settings, setSettings] = useState<Record<string, string>>({});

  const refreshSettings = async () => {
    try {
      const data = await api.getPublicSettings();
      setSettings(data);
    } catch (err) {
      console.error('Failed to load settings:', err);
    }
  };

  const refreshUser = async () => {
    try {
      const res = await api.getMe();
      if (res && res.user) {
        setUser(res.user);
      } else {
        setUser(null);
      }
    } catch {
      setUser(null);
    }
  };

  useEffect(() => {
    const init = async () => {
      setLoading(true);
      await Promise.allSettled([refreshUser(), refreshSettings()]);
      setLoading(false);
    };
    init();
  }, []);

  const login = async (credentials: any) => {
    const res = await api.login(credentials);
    localStorage.setItem('npf_token', res.token);
    setUser(res.user);
    setAuthModalOpen(false);
    setActiveView('dashboard');
  };

  const adminLogin = async (credentials: any) => {
    const res = await api.adminLogin(credentials);
    localStorage.setItem('npf_token', res.token);
    setUser(res.user);
    setAuthModalOpen(false);
    setActiveView('admin');
  };

  const register = async (data: any) => {
    const res = await api.register(data);
    localStorage.setItem('npf_token', res.token);
    setUser(res.user);
    setAuthModalOpen(false);
    setActiveView('dashboard');
  };

  const logout = async () => {
    try {
      await api.logout();
    } catch (e) {
      // ignore
    }
    localStorage.removeItem('npf_token');
    setUser(null);
    setActiveView('home');
  };

  const openAuthModal = (mode: 'login' | 'register' | 'admin' | 'reset' = 'login') => {
    setAuthModalMode(mode);
    setAuthModalOpen(true);
  };

  const closeAuthModal = () => {
    setAuthModalOpen(false);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        adminLogin,
        register,
        logout,
        refreshUser,
        openAuthModal,
        closeAuthModal,
        authModalOpen,
        authModalMode,
        activeView,
        setActiveView,
        settings,
        refreshSettings,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
