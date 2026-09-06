import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  KeyRound,
  User,
  ArrowRight,
  Sparkles,
  Lock,
  Eye,
  EyeOff,
  Cpu,
  Database,
  CheckCircle2,
  AlertCircle,
  RotateCcw,
  Layers,
  Terminal
} from 'lucide-react';
import { BrandLogo } from '../components/common/BrandLogo';
import { useAuth, DEMO_ACCOUNTS } from '../context/AuthContext';
import { getStorageStats, resetDemoDataToBaseline } from '../services/api';

export const LoginPage: React.FC = () => {
  const { login, loginAsGuest, loginAsAdmin, loginAsWarehouse, loginAsTechnician } = useAuth();
  
  const [identifier, setIdentifier] = useState('guest@efzdavao.ph');
  const [password, setPassword] = useState('guest123');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resetSuccess, setResetSuccess] = useState(false);

  const [stats, setStats] = useState(() => getStorageStats());

  useEffect(() => {
    setStats(getStorageStats());
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      const success = await login(identifier, password);
      if (!success) {
        setError('Invalid credentials. Please verify identifier and password or select a quick-launch profile.');
      }
    } catch (err: any) {
      setError(err.message || 'Login failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectDemoAccount = (key: 'guest' | 'warehouse' | 'tech' | 'admin') => {
    const acc = DEMO_ACCOUNTS[key];
    if (acc) {
      setIdentifier(acc.user.email);
      setPassword(acc.password);
      setError(null);
    }
  };

  const handleResetData = () => {
    if (window.confirm('Reset all cached transactions, stock status, invoices, and RMA claims back to factory demonstration baseline?')) {
      resetDemoDataToBaseline();
      setStats(getStorageStats());
      setResetSuccess(true);
      setTimeout(() => setResetSuccess(false), 3000);
    }
  };

  return (
    <div className="min-h-screen w-full bg-slate-950 flex flex-col justify-center items-center relative overflow-x-hidden p-4 sm:p-6 select-none font-sans">
      {/* Ambient background glow effects */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[500px] bg-gradient-to-tr from-teal-900/30 via-amber-500/15 to-transparent rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-20 -right-20 w-96 h-96 bg-teal-800/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -top-20 -left-20 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Main Container */}
      <div className="w-full max-w-4xl z-10 space-y-6">
        {/* Brand Header with Motion Graphic Emblem */}
        <div className="flex flex-col items-center text-center space-y-3">
          <div className="transform hover:scale-105 transition-transform duration-500">
            <BrandLogo size="xl" withMotion glowEffect showOrbitalRing />
          </div>

          <div className="space-y-1">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-400/15 border border-amber-400/30 text-amber-300 text-xs font-bold tracking-wider uppercase shadow-inner">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>Davao Premier Computer Sales & Enterprise ERP</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight uppercase">
              EFZ Computer Sales Terminal
            </h1>
            <p className="text-xs sm:text-sm text-slate-400 max-w-lg mx-auto">
              Hardware Point of Sale, Serialized Asset Inventory & Commercial Accounts Portal
            </p>
          </div>
        </div>

        {/* Central Split Card: Presentation Quick-Launch & Manual Form */}
        <div className="bg-slate-900/90 border border-slate-800 backdrop-blur-xl rounded-2xl shadow-2xl overflow-hidden grid grid-cols-1 lg:grid-cols-12 divide-y lg:divide-y-0 lg:divide-x divide-slate-800">
          
          {/* Left Panel: Instant Client Presentation Quick Launch (5 Cols) */}
          <div className="lg:col-span-5 p-6 sm:p-8 bg-gradient-to-br from-slate-900 via-slate-900 to-slate-950 flex flex-col justify-between space-y-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold tracking-wider text-amber-400 uppercase flex items-center gap-1.5">
                  <Terminal className="w-4 h-4" />
                  Client Presentation Mode
                </span>
                <span className="text-[10px] bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-2 py-0.5 rounded-full font-mono font-bold animate-pulse">
                  LIVE READY
                </span>
              </div>

              <h2 className="text-lg font-bold text-white leading-snug">
                One-Click Presentation Launch
              </h2>
              <p className="text-xs text-slate-400 leading-relaxed">
                Instantly enter pre-configured demo sessions tailored for client walkthroughs with real-time stock liquidation and dynamic status updates.
              </p>

              {/* Quick Launch Action Buttons */}
              <div className="space-y-3 pt-2">
              {/* Quick Launch Action Buttons */}
              <div className="space-y-2 pt-1">
                {/* 1. Cashier / Guest Demo */}
                <button
                  type="button"
                  onClick={loginAsGuest}
                  className="w-full group flex items-center justify-between p-2.5 rounded-xl bg-gradient-to-r from-teal-700 to-teal-800 hover:from-teal-600 hover:to-teal-700 text-white font-bold text-xs shadow-md transition-all duration-200"
                >
                  <div className="flex items-center gap-2.5">
                    <div className="w-7 h-7 rounded-lg bg-teal-950/40 flex items-center justify-center text-teal-300 font-bold text-xs">
                      🚀
                    </div>
                    <div className="text-left">
                      <div className="font-bold text-white text-xs leading-tight">
                        Cashier & POS Register
                      </div>
                      <div className="text-[10px] text-teal-200/80 font-normal">
                        Front-Counter Sales • Demo Cashier
                      </div>
                    </div>
                  </div>
                  <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                </button>

                {/* 2. Warehouse & Inventory Specialist */}
                <button
                  type="button"
                  onClick={loginAsWarehouse}
                  className="w-full group flex items-center justify-between p-2.5 rounded-xl bg-slate-800/90 hover:bg-cyan-950/60 border border-slate-700 hover:border-cyan-500/50 text-slate-200 hover:text-white font-semibold text-xs transition-all duration-200"
                >
                  <div className="flex items-center gap-2.5">
                    <div className="w-7 h-7 rounded-lg bg-cyan-500/20 text-cyan-400 flex items-center justify-center font-bold text-xs">
                      📦
                    </div>
                    <div className="text-left">
                      <div className="font-bold text-white text-xs leading-tight">
                        Warehouse & Inventory Custodian
                      </div>
                      <div className="text-[10px] text-slate-400 font-normal">
                        Stock Receiving • COGS Valuation • Suppliers
                      </div>
                    </div>
                  </div>
                  <ArrowRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-cyan-400 group-hover:translate-x-1 transition-all" />
                </button>

                {/* 3. Service Center RMA Technician */}
                <button
                  type="button"
                  onClick={loginAsTechnician}
                  className="w-full group flex items-center justify-between p-2.5 rounded-xl bg-slate-800/90 hover:bg-purple-950/60 border border-slate-700 hover:border-purple-500/50 text-slate-200 hover:text-white font-semibold text-xs transition-all duration-200"
                >
                  <div className="flex items-center gap-2.5">
                    <div className="w-7 h-7 rounded-lg bg-purple-500/20 text-purple-400 flex items-center justify-center font-bold text-xs">
                      🔧
                    </div>
                    <div className="text-left">
                      <div className="font-bold text-white text-xs leading-tight">
                        Service Center RMA Technician
                      </div>
                      <div className="text-[10px] text-slate-400 font-normal">
                        Defect Diagnostics • Warranty Turnaround
                      </div>
                    </div>
                  </div>
                  <ArrowRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-purple-400 group-hover:translate-x-1 transition-all" />
                </button>

                {/* 4. Store Manager & Admin */}
                <button
                  type="button"
                  onClick={loginAsAdmin}
                  className="w-full group flex items-center justify-between p-2.5 rounded-xl bg-gradient-to-r from-amber-500/20 to-amber-600/10 hover:from-amber-500/30 hover:to-amber-600/20 border border-amber-500/40 hover:border-amber-400 text-amber-200 hover:text-white font-semibold text-xs transition-all duration-200"
                >
                  <div className="flex items-center gap-2.5">
                    <div className="w-7 h-7 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center font-bold text-xs">
                      🛡️
                    </div>
                    <div className="text-left">
                      <div className="font-bold text-white text-xs leading-tight">
                        Store Manager & Admin Executive
                      </div>
                      <div className="text-[10px] text-amber-300/80 font-normal">
                        Unrestricted Modules • SQL DB Backup
                      </div>
                    </div>
                  </div>
                  <ArrowRight className="w-3.5 h-3.5 text-amber-400 group-hover:translate-x-1 transition-all" />
                </button>

                {/* Quick-Fill Preset Badges */}
                <div className="pt-2">
                  <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                    Quick-Fill Form Credentials:
                  </div>
                  <div className="grid grid-cols-4 gap-1.5">
                    <button
                      type="button"
                      onClick={() => handleSelectDemoAccount('guest')}
                      className="px-1.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-[10px] font-medium text-teal-300 border border-slate-700 text-center transition-colors"
                    >
                      Cashier
                    </button>
                    <button
                      type="button"
                      onClick={() => handleSelectDemoAccount('warehouse')}
                      className="px-1.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-[10px] font-medium text-cyan-300 border border-slate-700 text-center transition-colors"
                    >
                      Warehouse
                    </button>
                    <button
                      type="button"
                      onClick={() => handleSelectDemoAccount('tech')}
                      className="px-1.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-[10px] font-medium text-purple-300 border border-slate-700 text-center transition-colors"
                    >
                      RMA Tech
                    </button>
                    <button
                      type="button"
                      onClick={() => handleSelectDemoAccount('admin')}
                      className="px-1.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-[10px] font-medium text-amber-300 border border-slate-700 text-center transition-colors"
                    >
                      Admin
                    </button>
                  </div>
                </div>
              </div>
              </div>
            </div>

            {/* Session notice */}
            <div className="text-[11px] text-slate-500 bg-slate-950/60 p-3 rounded-lg border border-slate-800/80">
              <span className="text-slate-400 font-semibold">Client Presentation Note:</span> Transactions made in this session are cached dynamically in the browser. When logging out, underlying orders remain saved consistently.
            </div>
          </div>

          {/* Right Panel: Manual Authentication Form (7 Cols) */}
          <div className="lg:col-span-7 p-6 sm:p-8 flex flex-col justify-between space-y-6">
            <div className="space-y-5">
              <div>
                <h3 className="text-base font-bold text-white">
                  Terminal Operator Sign-In
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Authorize access to register workstations and ERP modules
                </p>
              </div>

              {/* Error Banner */}
              {error && (
                <div className="p-3 bg-red-900/30 border border-red-500/50 rounded-xl text-xs text-red-300 flex items-start gap-2.5 animate-fadeIn">
                  <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                  <span>{error}</span>
                </div>
              )}

              {/* Reset Success Banner */}
              {resetSuccess && (
                <div className="p-3 bg-emerald-900/30 border border-emerald-500/50 rounded-xl text-xs text-emerald-300 flex items-center gap-2.5 animate-fadeIn">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>Demonstration cache reset to factory baseline successfully.</span>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Identifier Input */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5 text-teal-400" />
                    <span>Operator Account / Email</span>
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      required
                      value={identifier}
                      onChange={(e) => setIdentifier(e.target.value)}
                      placeholder="e.g. guest@efzdavao.ph or admin"
                      className="w-full bg-slate-950/90 border border-slate-700 focus:border-amber-400 focus:ring-1 focus:ring-amber-400/40 rounded-xl px-4 py-2.5 text-xs text-white placeholder-slate-500 transition-all outline-none"
                    />
                  </div>
                </div>

                {/* Password Input */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                      <KeyRound className="w-3.5 h-3.5 text-teal-400" />
                      <span>Security PIN / Password</span>
                    </label>
                    <span className="text-[10px] text-amber-400 font-mono">
                      Guest: guest123
                    </span>
                  </div>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full bg-slate-950/90 border border-slate-700 focus:border-amber-400 focus:ring-1 focus:ring-amber-400/40 rounded-xl pl-4 pr-10 py-2.5 text-xs text-white placeholder-slate-500 transition-all outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Sign In Button */}
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-teal-600 to-teal-700 hover:from-teal-500 hover:to-teal-600 text-white font-bold text-xs shadow-md shadow-teal-900/30 transition-all flex items-center justify-center gap-2 mt-2 disabled:opacity-50"
                >
                  {isLoading ? (
                    <span>Authenticating Operator...</span>
                  ) : (
                    <>
                      <Lock className="w-3.5 h-3.5" />
                      <span>Authorize & Enter Terminal</span>
                    </>
                  )}
                </button>
              </form>
            </div>

            {/* Cache Telemetry & Reset Option */}
            <div className="pt-4 border-t border-slate-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-[11px] text-slate-400">
              <div className="flex items-center gap-2">
                <Database className="w-3.5 h-3.5 text-teal-400" />
                <span>
                  Dynamic Cache: <strong className="text-slate-200">{stats.ordersCount} Invoices</strong> •{' '}
                  <strong className="text-slate-200">{stats.storedStockCount} In-Stock</strong> •{' '}
                  <strong className="text-slate-200">{stats.rmaCount} RMA</strong>
                </span>
              </div>

              <button
                type="button"
                onClick={handleResetData}
                title="Reset cache to factory demo seed"
                className="text-[10px] text-slate-500 hover:text-amber-400 underline flex items-center gap-1 transition-colors self-start sm:self-auto"
              >
                <RotateCcw className="w-3 h-3" />
                <span>Reset Demo Cache</span>
              </button>
            </div>
          </div>
        </div>

        {/* Footer info */}
        <div className="text-center text-[11px] text-slate-500 space-y-1">
          <div>
            EFZ Davao Computer Sales • Point of Sale & Enterprise Management System v2.8 Web Edition
          </div>
          <div className="text-[10px] text-slate-600 font-mono">
            Encrypted Client Presentation Build • SQL Database Instance: EFZApp
          </div>
        </div>
      </div>
    </div>
  );
};
