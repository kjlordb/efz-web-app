import React, { createContext, useContext, useState } from 'react';
import { UserRole, Permission, ROLE_DEFINITIONS, roleHasPermission, canRoleAccessTab } from '../types/rbac';
import { ActiveTab } from '../components/layout/Sidebar';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  roleTitle: string;
  entityLabel: string;
  workstation: string;
  avatar: string;
  isGuest?: boolean;
}

export const DEMO_ACCOUNTS: Record<string, { user: User; password: string }> = {
  guest: {
    user: {
      id: 'usr_guest',
      name: 'Demo Guest Cashier',
      email: 'guest@efzdavao.ph',
      role: 'cashier',
      roleTitle: 'Sales Specialist & Cashier',
      entityLabel: 'Front-Counter Sales',
      workstation: 'POS-TERM-GUEST',
      avatar: 'G',
      isGuest: true
    },
    password: 'guest123'
  },
  warehouse: {
    user: {
      id: 'usr_warehouse',
      name: 'Mark (Warehouse Lead)',
      email: 'warehouse@efzdavao.ph',
      role: 'inventory',
      roleTitle: 'Warehouse & Procurement Specialist',
      entityLabel: 'Supply Chain & Warehouse',
      workstation: 'WH-TERM-04',
      avatar: 'M',
      isGuest: false
    },
    password: 'stock123'
  },
  tech: {
    user: {
      id: 'usr_tech',
      name: 'Dave (Hardware Lead)',
      email: 'tech@efzdavao.ph',
      role: 'technician',
      roleTitle: 'Senior RMA & Warranty Technician',
      entityLabel: 'Service Center & Diagnostics',
      workstation: 'TECH-BENCH-02',
      avatar: 'D',
      isGuest: false
    },
    password: 'tech123'
  },
  admin: {
    user: {
      id: 'usr_admin',
      name: 'Kyle (Admin)',
      email: 'admin@efzdavao.ph',
      role: 'admin',
      roleTitle: 'Store Manager & Administrator',
      entityLabel: 'Executive Management',
      workstation: 'WEB-TERM-01',
      avatar: 'K',
      isGuest: false
    },
    password: 'admin123'
  }
};

interface AuthContextType {
  currentUser: User | null;
  isAuthenticated: boolean;
  login: (identifier: string, password: string) => Promise<boolean>;
  loginAsGuest: () => void;
  loginAsAdmin: () => void;
  loginAsWarehouse: () => void;
  loginAsTechnician: () => void;
  switchRole: (role: UserRole) => void;
  hasPermission: (permission: Permission) => boolean;
  canAccess: (tab: ActiveTab) => boolean;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const AUTH_STORAGE_KEY = 'efz_auth_session';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(() => {
    try {
      const saved = localStorage.getItem(AUTH_STORAGE_KEY);
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  const saveUserSession = (user: User) => {
    setCurrentUser(user);
    localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(user));
  };

  const login = async (identifier: string, pass: string): Promise<boolean> => {
    const cleanId = identifier.trim().toLowerCase();
    
    // Find match by email or account key
    const matched = Object.values(DEMO_ACCOUNTS).find(
      (acc) =>
        acc.user.email.toLowerCase() === cleanId ||
        acc.user.name.toLowerCase().includes(cleanId) ||
        (cleanId === 'guest' && acc.user.role === 'cashier') ||
        (cleanId === 'admin' && acc.user.role === 'admin') ||
        (cleanId === 'warehouse' && acc.user.role === 'inventory') ||
        (cleanId === 'tech' && acc.user.role === 'technician')
    );

    if (matched && matched.password === pass) {
      saveUserSession(matched.user);
      return true;
    }

    // Flexible presentation fallback
    if (cleanId.includes('guest') && (pass === 'guest123' || pass === 'guest' || pass === '123456')) {
      saveUserSession(DEMO_ACCOUNTS.guest.user);
      return true;
    }
    if (cleanId.includes('admin') && (pass === 'admin123' || pass === 'admin' || pass === '123456')) {
      saveUserSession(DEMO_ACCOUNTS.admin.user);
      return true;
    }
    if (cleanId.includes('warehouse') && (pass === 'stock123' || pass === 'warehouse')) {
      saveUserSession(DEMO_ACCOUNTS.warehouse.user);
      return true;
    }
    if (cleanId.includes('tech') && (pass === 'tech123' || pass === 'tech')) {
      saveUserSession(DEMO_ACCOUNTS.tech.user);
      return true;
    }

    return false;
  };

  const loginAsGuest = () => saveUserSession(DEMO_ACCOUNTS.guest.user);
  const loginAsAdmin = () => saveUserSession(DEMO_ACCOUNTS.admin.user);
  const loginAsWarehouse = () => saveUserSession(DEMO_ACCOUNTS.warehouse.user);
  const loginAsTechnician = () => saveUserSession(DEMO_ACCOUNTS.tech.user);

  const switchRole = (role: UserRole) => {
    const targetAccount = Object.values(DEMO_ACCOUNTS).find((acc) => acc.user.role === role);
    if (targetAccount) {
      saveUserSession(targetAccount.user);
    }
  };

  const hasPermission = (permission: Permission): boolean => {
    if (!currentUser) return false;
    return roleHasPermission(currentUser.role, permission);
  };

  const canAccess = (tab: ActiveTab): boolean => {
    if (!currentUser) return false;
    return canRoleAccessTab(currentUser.role, tab);
  };

  const logout = () => {
    setCurrentUser(null);
    localStorage.removeItem(AUTH_STORAGE_KEY);
  };

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        isAuthenticated: !!currentUser,
        login,
        loginAsGuest,
        loginAsAdmin,
        loginAsWarehouse,
        loginAsTechnician,
        switchRole,
        hasPermission,
        canAccess,
        logout
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
