import React, { createContext, useContext, useEffect, useState } from 'react';
import { UserRole, Permission, ROLE_DEFINITIONS, roleHasPermission, canRoleAccessTab } from '../types/rbac';
import { ActiveTab } from '../components/layout/Sidebar';
import { apiFetch, apiUrl, AUTH_EXPIRED_EVENT, clearAccessToken, getAccessToken, setAccessToken } from '../services/auth';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  roleTitle: string;
  entityLabel: string;
  workstation: string;
  avatar: string;
}

export const OPERATOR_PROFILES = {
  cashier: { email: 'cashier@efzdavao.ph', label: 'Cashier' },
  inventory: { email: 'inventory@efzdavao.ph', label: 'Warehouse' },
  technician: { email: 'technician@efzdavao.ph', label: 'RMA Tech' },
  admin: { email: 'admin@efzdavao.ph', label: 'Admin' },
} as const;

interface AuthContextType {
  currentUser: User | null;
  isAuthenticated: boolean;
  login: (identifier: string, password: string) => Promise<boolean>;
  hasPermission: (permission: Permission) => boolean;
  canAccess: (tab: ActiveTab) => boolean;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);
const AUTH_USER_STORAGE_KEY = 'efz_authenticated_user';

function readStoredUser(): User | null {
  try {
    const saved = localStorage.getItem(AUTH_USER_STORAGE_KEY);
    return saved ? JSON.parse(saved) as User : null;
  } catch {
    return null;
  }
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(readStoredUser);

  const logout = () => {
    clearAccessToken();
    localStorage.removeItem(AUTH_USER_STORAGE_KEY);
    setCurrentUser(null);
  };

  const saveSession = (token: string, user: User) => {
    setAccessToken(token);
    localStorage.setItem(AUTH_USER_STORAGE_KEY, JSON.stringify(user));
    setCurrentUser(user);
  };

  useEffect(() => {
    const token = getAccessToken();
    if (!token) {
      if (currentUser) logout();
      return;
    }
    apiFetch('/api/auth/me')
      .then(async (response) => {
        if (!response.ok) throw new Error('Session validation failed.');
        const data = await response.json() as { user: User };
        localStorage.setItem(AUTH_USER_STORAGE_KEY, JSON.stringify(data.user));
        setCurrentUser(data.user);
      })
      .catch(logout);
    // Validate an existing browser session once on application startup.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    window.addEventListener(AUTH_EXPIRED_EVENT, logout);
    return () => window.removeEventListener(AUTH_EXPIRED_EVENT, logout);
  });

  const login = async (identifier: string, password: string): Promise<boolean> => {
    const response = await fetch(apiUrl('/api/auth/login'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ identifier, password }),
    });
    if (response.status === 401) return false;
    if (!response.ok) {
      const data = await response.json().catch(() => ({ error: 'Unable to sign in.' })) as { error?: string };
      throw new Error(data.error || 'Unable to sign in.');
    }
    const data = await response.json() as { token: string; user: User };
    saveSession(data.token, data.user);
    return true;
  };

  const hasPermission = (permission: Permission): boolean =>
    currentUser ? roleHasPermission(currentUser.role, permission) : false;

  const canAccess = (tab: ActiveTab): boolean =>
    currentUser ? canRoleAccessTab(currentUser.role, tab) : false;

  return (
    <AuthContext.Provider value={{ currentUser, isAuthenticated: !!currentUser, login, hasPermission, canAccess, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};
