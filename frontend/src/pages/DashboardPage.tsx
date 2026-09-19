import React, { useEffect, useState } from 'react';
import {
  TrendingUp,
  Package,
  ShoppingCart,
  Users,
  AlertCircle,
  Plus,
  ArrowRight,
  ShieldCheck,
  Receipt,
  FileText,
  Clock,
  ExternalLink,
  DollarSign,
  CreditCard,
  RotateCcw,
  Sparkles
} from 'lucide-react';
import { inventoryService, salesService, customerService, rmaService, installmentService, DATA_UPDATED_EVENT } from '../services/api';
import { Order, StockItem, Customer, RMATicket, InstallmentPlan } from '../types';
import { ActiveTab } from '../components/layout/Sidebar';
import { BrandLogo } from '../components/common/BrandLogo';

interface DashboardPageProps {
  onNavigate: (tab: ActiveTab) => void;
  onSelectOrderForWarranty?: (order: Order) => void;
}

export const DashboardPage: React.FC<DashboardPageProps> = ({ onNavigate }) => {
  const [stock, setStock] = useState<StockItem[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [rmaTickets, setRmaTickets] = useState<RMATicket[]>([]);
  const [installments, setInstallments] = useState<InstallmentPlan[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    try {
      const [s, o, c, r, i] = await Promise.all([
        inventoryService.getStockItems({ includeDeleted: false }),
        salesService.getOrders(),
        customerService.getCustomers(),
        rmaService.getTickets(),
        installmentService.getPlans()
      ]);
      setStock(s);
      setOrders(o);
      setCustomers(c);
      setRmaTickets(r);
      setInstallments(i);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    const handleUpdate = () => {
      load();
    };
    window.addEventListener(DATA_UPDATED_EVENT, handleUpdate);
    return () => window.removeEventListener(DATA_UPDATED_EVENT, handleUpdate);
  }, []);

  const totalRevenue = orders.reduce((acc, o) => acc + o.orderAmount, 0);
  const inStockCount = stock.filter((i) => i.stockStatus === 'stored').length;
  const totalStockValue = stock
    .filter((i) => i.stockStatus === 'stored')
    .reduce((acc, i) => acc + i.stockPrice, 0);
  const totalStockCost = stock
    .filter((i) => i.stockStatus === 'stored')
    .reduce((acc, i) => acc + i.suppliersPrice, 0);

  // Total Outstanding Installment AR
  const totalOutstandingAR = installments.reduce((acc, i) => acc + i.remainingBalance, 0);
  const activeRMAClaims = rmaTickets.filter((r) => r.status !== 'Resolved & Released').length;

  // Group by category
  const categoryCounts = stock
    .filter((i) => i.stockStatus === 'stored')
    .reduce((acc, item) => {
      acc[item.stockName] = (acc[item.stockName] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

  const sortedCategories = Object.entries(categoryCounts).sort((a, b) => b[1] - a[1]);

  return (
    <div className="space-y-6">
      {/* Top Welcome Banner (Layer 2 Glass Surface) */}
      <div className="glass-panel rounded-2xl p-6 text-white shadow-glass-md relative overflow-hidden border border-white/[0.1]">
        <div className="absolute right-0 top-0 translate-x-10 -translate-y-10 w-96 h-96 bg-radial from-amber-400/15 via-teal-500/10 to-transparent rounded-full blur-3xl pointer-events-none"></div>
        <div className="relative z-10 flex flex-col 2xl:flex-row 2xl:items-center justify-between gap-6">
          <div className="flex flex-col sm:flex-row items-center sm:items-start md:items-center gap-6 min-w-0">
            <BrandLogo size="xl" withMotion glowEffect showOrbitalRing className="shrink-0" />
            <div className="min-w-0">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-400/15 text-amber-300 text-xs font-bold mb-2 border border-amber-400/30 shadow-xs">
                <ShieldCheck className="w-3.5 h-3.5 text-amber-400" />
                <span>EFZ Davao Computer Sales • Official Terminal</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
                Executive Dashboard & Operations Portal
              </h1>
              <p className="text-sm text-slate-300 mt-1 max-w-xl leading-relaxed">
                Real-time point-of-sale terminal, serialized hardware catalog, commercial financing schedules, and distributor warranty tracking.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 shrink-0 pt-2 2xl:pt-0">
            <button
              onClick={() => onNavigate('pos')}
              className="btn-finalize-sale flex items-center gap-2 text-white font-bold text-xs px-4 py-2.5 rounded-xl transition-all cursor-pointer"
            >
              <ShoppingCart className="w-4 h-4 text-white" />
              <span>Launch POS Checkout</span>
            </button>
            <button
              onClick={() => onNavigate('inventory')}
              className="flex items-center gap-2 bg-slate-800/80 hover:bg-white/[0.1] text-slate-200 hover:text-white font-medium text-xs px-4 py-2.5 rounded-xl transition-all border border-white/[0.1] hover:border-teal-400/40 cursor-pointer shadow-glass-xs"
            >
              <Package className="w-4 h-4 text-teal-400" />
              <span>Receive Inward Stock</span>
            </button>
            <button
              onClick={() => onNavigate('quotation')}
              className="flex items-center gap-2 bg-slate-800/80 hover:bg-white/[0.1] text-slate-200 hover:text-white font-medium text-xs px-4 py-2.5 rounded-xl transition-all border border-white/[0.1] hover:border-amber-400/40 cursor-pointer shadow-glass-xs"
            >
              <FileText className="w-4 h-4 text-amber-400" />
              <span>Draft Quotation</span>
            </button>
          </div>
        </div>
      </div>

      {/* KPI Cards (Layer 2 Elevated Glass Surfaces) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Revenue */}
        <div className="glass-card-interactive p-5 rounded-2xl">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Gross Sales Revenue
            </span>
            <div className="w-9 h-9 rounded-xl bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 flex items-center justify-center shadow-[0_0_12px_rgba(52,211,153,0.2)]">
              <TrendingUp className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-black text-slate-100 font-mono tracking-tight drop-shadow-sm">
              ₱{totalRevenue.toLocaleString('en-US', { minimumFractionDigits: 2 })}
            </div>
            <div className="flex items-center gap-1.5 text-xs text-slate-400 mt-1">
              <span>{orders.length} tax invoices finalized</span>
            </div>
          </div>
        </div>

        {/* In-Stock Valuation */}
        <div className="glass-card-interactive p-5 rounded-2xl">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
              In-Stock Asset Portfolio
            </span>
            <div className="w-9 h-9 rounded-xl bg-teal-500/15 text-teal-400 border border-teal-500/30 flex items-center justify-center shadow-[0_0_12px_rgba(45,212,191,0.2)]">
              <Package className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-black text-teal-300 font-mono tracking-tight drop-shadow-sm">
              {inStockCount}{' '}
              <span className="text-xs font-normal text-slate-400">units</span>
            </div>
            <div className="text-xs text-slate-400 mt-1">
              Retail Valuation: <strong className="text-slate-200">₱{totalStockValue.toLocaleString()}</strong>
            </div>
          </div>
        </div>

        {/* Installments AR */}
        <div className="glass-card-interactive p-5 rounded-2xl">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Accounts Receivable (AR)
            </span>
            <div className="w-9 h-9 rounded-xl bg-blue-500/15 text-blue-400 border border-blue-500/30 flex items-center justify-center shadow-[0_0_12px_rgba(96,165,250,0.2)]">
              <CreditCard className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-black text-blue-300 font-mono tracking-tight drop-shadow-sm">
              ₱{totalOutstandingAR.toLocaleString('en-US', { minimumFractionDigits: 2 })}
            </div>
            <div className="text-xs text-slate-400 mt-1">
              Active Financed Plans: <strong className="text-slate-200">{installments.length}</strong>
            </div>
          </div>
        </div>

        {/* Active RMA Turnaround */}
        <div className="glass-card-interactive p-5 rounded-2xl">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Warranty Turnaround
            </span>
            <div className="w-9 h-9 rounded-xl bg-purple-500/15 text-purple-400 border border-purple-500/30 flex items-center justify-center shadow-[0_0_12px_rgba(192,132,252,0.2)]">
              <RotateCcw className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-black text-purple-300 font-mono tracking-tight drop-shadow-sm">
              {activeRMAClaims}{' '}
              <span className="text-xs font-normal text-slate-400">active RMAs</span>
            </div>
            <div className="flex items-center gap-1.5 text-xs text-emerald-400 mt-1 font-semibold">
              <span className="w-2 h-2 rounded-full bg-emerald-400 inline-block shadow-[0_0_6px_rgba(52,211,153,0.8)]"></span>
              <span>Distributor diagnostics active</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Invoices List (2 Cols) */}
        <div className="lg:col-span-2 glass-card rounded-2xl overflow-hidden flex flex-col shadow-glass-sm border border-white/[0.08]">
          <div className="p-4 border-b border-white/[0.08] flex items-center justify-between">
            <div>
              <h2 className="font-bold text-sm text-slate-100">Recent Commercial Invoices</h2>
              <p className="text-xs text-slate-400">Latest transactions liquidated through POS</p>
            </div>
            <button
              onClick={() => onNavigate('sales')}
              className="text-xs font-semibold text-teal-400 hover:text-teal-300 flex items-center gap-1 transition-colors cursor-pointer"
            >
              <span>View Full Ledger</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="divide-y divide-white/[0.06] flex-1 overflow-x-auto">
            {orders.slice(0, 5).map((order) => (
              <div key={order.id} className="p-4 hover:bg-white/[0.04] transition-colors flex items-center justify-between gap-4">
                <div className="flex items-start gap-3">
                  <div className="w-9 h-9 rounded-xl bg-teal-500/10 border border-teal-500/20 text-teal-400 flex items-center justify-center shrink-0 mt-0.5 shadow-glass-xs">
                    <Receipt className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-xs text-slate-100 font-mono">
                        Invoice #{order.id}
                      </span>
                      <span className="text-[10px] bg-slate-800/80 text-teal-300 border border-white/[0.08] px-2 py-0.5 rounded-lg font-mono font-medium">
                        {order.paymentMethod}
                      </span>
                    </div>
                    <div className="text-xs text-slate-200 mt-1 font-semibold">
                      {order.customerName} {order.customerCompany ? `(${order.customerCompany})` : ''}
                    </div>
                    <div className="text-[11px] text-slate-400 mt-0.5 flex items-center gap-2">
                      <span>Associate: <strong className="text-slate-300">{order.encoder}</strong></span>
                      <span>•</span>
                      <span>{new Date(order.orderDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                    </div>
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <div className="font-mono font-black text-sm text-slate-100">
                    ₱{order.orderAmount.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                  </div>
                  <button
                    onClick={() => onNavigate('sales')}
                    className="text-[11px] text-teal-400 hover:text-teal-300 hover:underline inline-flex items-center gap-1 mt-1 font-semibold cursor-pointer"
                  >
                    <span>Audit Warranty</span>
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                  </button>
                </div>
              </div>
            ))}

            {orders.length === 0 && (
              <div className="p-8 text-center text-sm text-slate-400">
                No orders recorded yet. Process an invoice in POS Register!
              </div>
            )}
          </div>
        </div>

        {/* Category Breakdown (1 Col) */}
        <div className="glass-card rounded-2xl p-4 flex flex-col shadow-glass-sm border border-white/[0.08]">
          <div className="flex items-center justify-between border-b border-white/[0.08] pb-3 mb-3">
            <div>
              <h2 className="font-bold text-sm text-slate-100">Inventory Distribution</h2>
              <p className="text-xs text-slate-400">Asset concentration by category</p>
            </div>
            <button
              onClick={() => onNavigate('inventory')}
              className="text-xs text-teal-400 hover:text-teal-300 font-semibold transition-colors cursor-pointer"
            >
              Catalog
            </button>
          </div>

          <div className="space-y-3 flex-1 overflow-y-auto pr-1">
            {sortedCategories.map(([category, count]) => {
              const percentage = Math.round((count / (inStockCount || 1)) * 100);
              return (
                <div key={category} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-medium text-slate-300">{category}</span>
                    <span className="font-bold text-slate-100 font-mono">{count} units ({percentage}%)</span>
                  </div>
                  <div className="w-full bg-slate-950/60 h-2 rounded-full overflow-hidden border border-white/[0.06] p-0.5">
                    <div
                      className="bg-gradient-to-r from-teal-500 to-cyan-400 h-full rounded-full transition-all duration-500 shadow-[0_0_8px_rgba(20,184,166,0.4)]"
                      style={{ width: `${percentage}%` }}
                    ></div>
                  </div>
                </div>
              );
            })}

            {sortedCategories.length === 0 && (
              <div className="text-center text-xs text-slate-400 py-6">
                No stock items in inventory.
              </div>
            )}
          </div>

          <div className="mt-4 pt-3 border-t border-white/[0.08]">
            <button
              onClick={() => onNavigate('audit')}
              className="w-full text-center text-xs text-teal-300 hover:text-teal-200 font-semibold hover:bg-teal-500/10 py-2.5 rounded-xl transition-all border border-dashed border-teal-500/30 cursor-pointer"
            >
              Open Inventory Valuation & Margins Report →
            </button>
          </div>
        </div>
      </div>

      {/* Brand Identity & Media Showcase Banner */}
      <div className="glass-panel rounded-2xl p-6 border border-amber-400/30 text-white shadow-glass-md overflow-hidden relative">
        <div className="absolute top-0 right-0 w-96 h-96 bg-radial from-amber-400/15 via-teal-500/8 to-transparent rounded-full blur-3xl pointer-events-none"></div>

        <div className="relative z-10 flex flex-col lg:flex-row items-center justify-between gap-8">
          {/* Left: Motion Graphic Video Showcase */}
          <div className="w-full lg:w-1/2 flex flex-col items-center sm:items-start gap-4">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-400/15 text-amber-300 text-xs font-bold border border-amber-400/30 shadow-xs">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>OFFICIAL MOTION GRAPHIC IDENTITY</span>
            </div>
            <h3 className="text-xl font-black tracking-tight text-white sm:text-2xl">
              High-Precision Hardware Motion Identity
            </h3>
            <p className="text-xs text-slate-300 max-w-lg leading-relaxed">
              Synthesizing Davao's premier custom PC building heritage with enterprise-grade componentry. Featuring continuous looping motion graphics, dual orbital telemetry rings, and specular refractive illumination.
            </p>

            {/* Video Player Box */}
            <div className="w-full max-w-md aspect-video rounded-xl overflow-hidden shadow-glass-md border border-amber-400/30 bg-slate-950 relative group">
              <video
                src="/motion-logo.mp4"
                poster="/efz-3d-gold.png"
                autoPlay
                loop
                muted
                playsInline
                controls
                className="w-full h-full object-cover"
              />
            </div>
          </div>

          {/* Right: Photorealistic 3D Brushed Gold Masterpiece */}
          <div className="w-full lg:w-1/2 flex flex-col items-center lg:items-end gap-4">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-teal-500/20 text-teal-300 text-xs font-bold border border-teal-400/30 shadow-xs">
              <ShieldCheck className="w-3.5 h-3.5 text-teal-400" />
              <span>3D PHOTOREALISTIC MASTERPIECE</span>
            </div>
            <div className="relative group max-w-xs sm:max-w-sm">
              <div className="absolute -inset-2 bg-gradient-to-r from-amber-400/30 to-teal-500/30 rounded-2xl blur-lg group-hover:blur-xl transition-all opacity-75"></div>
              <div className="relative rounded-2xl overflow-hidden border border-amber-400/50 shadow-glass-lg bg-slate-950">
                <img
                  src="/efz-3d-gold.png"
                  alt="EFZ Davao Computer Sales 3D Masterpiece"
                  className="w-full h-auto object-cover transform transition-transform duration-700 group-hover:scale-105"
                />
                <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-slate-950 via-slate-950/80 to-transparent p-4 text-center sm:text-left">
                  <div className="text-xs font-black uppercase text-amber-400 tracking-wider">
                    Masterpiece Brass & Laurel Emblem
                  </div>
                  <div className="text-[11px] text-slate-300">
                    High-End PC Gaming Headset & Architectural Motherboard Circuitry
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
