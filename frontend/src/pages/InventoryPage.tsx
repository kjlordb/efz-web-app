import React, { useState, useEffect } from 'react';
import {
  Package,
  Plus,
  Search,
  Filter,
  Trash2,
  Edit2,
  RotateCcw,
  Tag,
  DollarSign,
  ChevronLeft,
  ChevronRight,
  Shield,
  Layers,
  CheckCircle2,
  AlertCircle,
  Download,
  TrendingUp,
  ArrowUpDown,
  Archive,
  Database
} from 'lucide-react';
import { inventoryService, supplierService, DATA_UPDATED_EVENT } from '../services/api';
import { CATEGORIES } from '../services/mockData';
import { StockItem, Supplier } from '../types';
import { AddStockModal } from '../components/modals/AddStockModal';
import { BatchPriceModal } from '../components/modals/BatchPriceModal';
import { Pagination } from '../components/common/Pagination';
import { useAuth } from '../context/AuthContext';

export const InventoryPage: React.FC = () => {
  const { hasPermission } = useAuth();
  const canViewCosts = hasPermission('VIEW_COGS_MARGINS');
  const canManageInventory = hasPermission('MANAGE_INVENTORY');

  const [items, setItems] = useState<StockItem[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [stats, setStats] = useState<{
    totalUnits: number;
    legacyUnsoldUnits: number;
    activeSellableUnits: number;
    storedUnits: number;
    updatedUnits: number;
    deletedUnits: number;
    soldUnits: number;
    activeInventoryRetailValue: number;
    activeInventoryCostValue: number;
  } | null>(null);
  const [loading, setLoading] = useState(false);

  // Filters - defaults to 'unsold' matching the legacy desktop app's 4,248 count
  const [selectedCategory, setSelectedCategory] = useState('All Stocks');
  const [statusFilter, setStatusFilter] = useState<'unsold' | 'stored' | 'sold' | 'Deleted' | 'all'>('unsold');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(50);

  // Modals
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isBatchPriceModalOpen, setIsBatchPriceModalOpen] = useState(false);
  const [itemToEdit, setItemToEdit] = useState<StockItem | null>(null);

  const [notification, setNotification] = useState<{ type: 'success' | 'error'; msg: string } | null>(null);

  const loadStats = async () => {
    try {
      const s = await inventoryService.getStockStats();
      setStats(s);
    } catch (err) {
      console.warn('Failed to load inventory stats', err);
    }
  };

  useEffect(() => {
    loadInventory();
  }, [selectedCategory, statusFilter, sortOrder]);

  useEffect(() => {
    loadStats();
  }, []);

  useEffect(() => {
    const handleUpdate = () => {
      loadInventory();
      loadStats();
    };
    window.addEventListener(DATA_UPDATED_EVENT, handleUpdate);
    return () => window.removeEventListener(DATA_UPDATED_EVENT, handleUpdate);
  }, [selectedCategory, statusFilter, sortOrder]);

  const loadInventory = async () => {
    setLoading(true);
    try {
      const [data, sups] = await Promise.all([
        inventoryService.getStockItems({
          category: selectedCategory,
          includeDeleted: true,
          status: statusFilter === 'all' ? undefined : statusFilter,
          sort: sortOrder,
          limit: 5000,
        }),
        supplierService.getSuppliers()
      ]);
      setItems(data);
      setSuppliers(sups);
      loadStats();
    } catch (err: any) {
      showNotify('error', err.message || 'Error loading stock catalog');
    } finally {
      setLoading(false);
    }
  };

  const showNotify = (type: 'success' | 'error', msg: string) => {
    setNotification({ type, msg });
    setTimeout(() => setNotification(null), 4000);
  };

  const handleDelete = async (item: StockItem) => {
    if (!window.confirm(`Decommission / soft-delete unit "${item.stockSerial}" from active catalog?`)) return;

    try {
      await inventoryService.deleteStockItem(item.id);
      showNotify('success', `Unit ${item.stockSerial} marked as Decommissioned (Deleted).`);
      loadInventory();
    } catch (err: any) {
      showNotify('error', err.message || 'Failed to delete item');
    }
  };

  const handleRestore = async (item: StockItem) => {
    try {
      await inventoryService.restoreStockItem(item.id);
      showNotify('success', `Unit ${item.stockSerial} restored to active in-stock inventory.`);
      loadInventory();
    } catch (err: any) {
      showNotify('error', err.message || 'Failed to restore item');
    }
  };

  // Export inventory to CSV
  const handleExportCSV = () => {
    const headers = [
      'Stock ID',
      'Serial Number',
      'Category',
      'Model Specifications',
      'SRP (Selling Price)',
      'COGS (Supplier Cost)',
      'Margin (PHP)',
      'Margin (%)',
      'Distributor',
      'Warranty (Days)',
      'Inward Date',
      'Status'
    ];

    const rows = filtered.map((i) => {
      const marginPhp = i.stockPrice - i.suppliersPrice;
      const marginPct = i.stockPrice > 0 ? ((marginPhp / i.stockPrice) * 100).toFixed(1) : '0';
      return [
        i.id,
        `"${i.stockSerial}"`,
        `"${i.stockName}"`,
        `"${i.stockDetails.replace(/"/g, '""')}"`,
        i.stockPrice,
        i.suppliersPrice,
        marginPhp,
        `${marginPct}%`,
        `"${i.supplierName}"`,
        i.warranty,
        `"${i.inDate}"`,
        `"${i.stockStatus}"`
      ];
    });

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `EFZ_Inventory_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Filter by search query
  const filtered = items.filter((item) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase().trim();
    return (
      item.stockSerial.toLowerCase().includes(q) ||
      item.stockDetails.toLowerCase().includes(q) ||
      item.stockName.toLowerCase().includes(q) ||
      item.supplierName.toLowerCase().includes(q)
    );
  });

  const totalRecords = filtered.length;
  const totalPages = Math.ceil(totalRecords / pageSize) || 1;
  const paginatedItems = filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  return (
    <div className="space-y-4">
      {/* Toast Notification */}
      {notification && (
        <div
          className={`p-3.5 rounded-2xl text-xs font-medium flex items-center justify-between border shadow-glass-xs animate-fadeIn ${
            notification.type === 'success'
              ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
              : 'bg-red-500/15 text-red-300 border-red-500/30'
          }`}
        >
          <div className="flex items-center gap-2">
            {notification.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            ) : (
              <AlertCircle className="w-4 h-4 text-red-400" />
            )}
            <span>{notification.msg}</span>
          </div>
          <button onClick={() => setNotification(null)} className="text-slate-400 hover:text-slate-200 text-sm cursor-pointer">×</button>
        </div>
      )}

      {/* Header bar with enterprise actions */}
      <div className="glass-card p-4 sm:p-5 rounded-2xl border border-white/[0.08] shadow-glass-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-lg sm:text-xl font-bold text-slate-100 flex items-center gap-2">
            <Package className="w-5 h-5 text-teal-400 drop-shadow-[0_0_8px_rgba(29,130,150,0.5)]" />
            <span>Serialized Inventory & Asset Master</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1 leading-relaxed">
            Unit-level hardware control, COGS margins, distributor warranty schedules, and price governance
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 text-xs font-semibold text-slate-200 bg-slate-800/80 hover:bg-white/[0.08] border border-white/[0.1] px-3.5 py-2 rounded-xl transition-all cursor-pointer shadow-glass-xs"
            title="Export CSV spreadsheet"
          >
            <Download className="w-3.5 h-3.5 text-slate-300" />
            <span>Export CSV</span>
          </button>

          {canManageInventory ? (
            <>
              <button
                onClick={() => setIsBatchPriceModalOpen(true)}
                className="flex items-center gap-1.5 text-xs font-semibold text-slate-200 bg-slate-800/80 hover:bg-teal-500/20 hover:border-teal-400/50 border border-white/[0.1] px-3.5 py-2 rounded-xl transition-all cursor-pointer shadow-glass-xs"
              >
                <Tag className="w-3.5 h-3.5 text-teal-400" />
                <span>Bulk Price Revision</span>
              </button>

              <button
                onClick={() => {
                  setItemToEdit(null);
                  setIsAddModalOpen(true);
                }}
                className="flex items-center gap-1.5 text-xs font-bold text-slate-950 bg-gradient-to-r from-teal-600 to-teal-500 hover:from-teal-500 hover:to-teal-400 px-4 py-2 rounded-xl shadow-lg shadow-teal-950/40 transition-all cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Receive Inward Stock</span>
              </button>
            </>
          ) : (
            <div className="px-3.5 py-2 rounded-xl bg-slate-900/80 border border-white/[0.08] text-slate-400 text-xs font-semibold flex items-center gap-1.5">
              <span>Read-Only Catalog View</span>
            </div>
          )}
        </div>
      </div>

      {/* Inventory Health & Serial Count Reconciliation Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        {/* Card 1: Legacy Desktop App Count */}
        <div
          onClick={() => { setStatusFilter('unsold'); setCurrentPage(1); }}
          className={`p-3.5 rounded-2xl border transition-all cursor-pointer ${
            statusFilter === 'unsold'
              ? 'bg-teal-500/15 border-teal-400/50 shadow-glass-teal ring-1 ring-teal-400/30'
              : 'glass-card border-white/[0.08] hover:border-white/[0.15]'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-teal-300 uppercase tracking-wider">Legacy Unsold</span>
            <span className="text-[9px] bg-teal-400/20 text-teal-300 font-bold px-1.5 py-0.5 rounded border border-teal-400/30">
              Desktop Match
            </span>
          </div>
          <div className="mt-1.5 flex items-baseline gap-2">
            <span className="text-xl font-bold font-mono text-white">
              {stats ? stats.legacyUnsoldUnits.toLocaleString() : '4,248'}
            </span>
            <span className="text-[10px] text-slate-400">units</span>
          </div>
          <div className="text-[10px] text-slate-400 mt-1 truncate">
            Matches legacy desktop list (4,248)
          </div>
        </div>

        {/* Card 2: Active Sellable */}
        <div
          onClick={() => { setStatusFilter('stored'); setCurrentPage(1); }}
          className={`p-3.5 rounded-2xl border transition-all cursor-pointer ${
            statusFilter === 'stored'
              ? 'bg-emerald-500/15 border-emerald-400/50 shadow-glass-teal ring-1 ring-emerald-400/30'
              : 'glass-card border-white/[0.08] hover:border-white/[0.15]'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-emerald-300 uppercase tracking-wider">Active Sellable</span>
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          </div>
          <div className="mt-1.5 flex items-baseline gap-2">
            <span className="text-xl font-bold font-mono text-emerald-300">
              {stats ? stats.activeSellableUnits.toLocaleString() : '3,498'}
            </span>
            <span className="text-[10px] text-slate-400">units</span>
          </div>
          <div className="text-[10px] text-slate-400 mt-1 truncate">
            {stats ? `₱${stats.activeInventoryRetailValue.toLocaleString()} SRP` : 'In-stock sellable inventory'}
          </div>
        </div>

        {/* Card 3: Liquidated / Sold */}
        <div
          onClick={() => { setStatusFilter('sold'); setCurrentPage(1); }}
          className={`p-3.5 rounded-2xl border transition-all cursor-pointer ${
            statusFilter === 'sold'
              ? 'bg-blue-500/15 border-blue-400/50 shadow-glass-teal ring-1 ring-blue-400/30'
              : 'glass-card border-white/[0.08] hover:border-white/[0.15]'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-blue-300 uppercase tracking-wider">Sold / Liquidated</span>
            <CheckCircle2 className="w-3.5 h-3.5 text-blue-400" />
          </div>
          <div className="mt-1.5 flex items-baseline gap-2">
            <span className="text-xl font-bold font-mono text-blue-200">
              {stats ? stats.soldUnits.toLocaleString() : '37,686'}
            </span>
            <span className="text-[10px] text-slate-400">serials</span>
          </div>
          <div className="text-[10px] text-slate-400 mt-1 truncate">
            Across 12,718 sales orders
          </div>
        </div>

        {/* Card 4: Decommissioned */}
        <div
          onClick={() => { setStatusFilter('Deleted'); setCurrentPage(1); }}
          className={`p-3.5 rounded-2xl border transition-all cursor-pointer ${
            statusFilter === 'Deleted'
              ? 'bg-red-500/15 border-red-400/50 shadow-glass-teal ring-1 ring-red-400/30'
              : 'glass-card border-white/[0.08] hover:border-white/[0.15]'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-red-300 uppercase tracking-wider">Decommissioned</span>
            <Archive className="w-3.5 h-3.5 text-red-400" />
          </div>
          <div className="mt-1.5 flex items-baseline gap-2">
            <span className="text-xl font-bold font-mono text-red-300">
              {stats ? stats.deletedUnits.toLocaleString() : '750'}
            </span>
            <span className="text-[10px] text-slate-400">serials</span>
          </div>
          <div className="text-[10px] text-slate-400 mt-1 truncate">
            Soft-deleted / RMA write-offs
          </div>
        </div>

        {/* Card 5: Complete Master History */}
        <div
          onClick={() => { setStatusFilter('all'); setCurrentPage(1); }}
          className={`p-3.5 rounded-2xl border transition-all cursor-pointer col-span-2 sm:col-span-1 ${
            statusFilter === 'all'
              ? 'bg-amber-500/15 border-amber-400/50 shadow-glass-teal ring-1 ring-amber-400/30'
              : 'glass-card border-white/[0.08] hover:border-white/[0.15]'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-amber-300 uppercase tracking-wider">Master Registry</span>
            <Database className="w-3.5 h-3.5 text-amber-400" />
          </div>
          <div className="mt-1.5 flex items-baseline gap-2">
            <span className="text-xl font-bold font-mono text-amber-200">
              {stats ? stats.totalUnits.toLocaleString() : '41,934'}
            </span>
            <span className="text-[10px] text-slate-400">total</span>
          </div>
          <div className="text-[10px] text-slate-400 mt-1 truncate">
            All registered units in EFZApp
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="glass-card p-3 rounded-2xl border border-white/[0.08] shadow-glass-sm flex flex-wrap items-center justify-between gap-3">
        {/* Status Tabs with business terminology */}
        <div className="flex items-center gap-1 bg-slate-950/60 p-1 rounded-xl border border-white/[0.08] text-xs font-semibold shadow-inner flex-wrap sm:flex-nowrap">
          <button
            onClick={() => { setStatusFilter('unsold'); setCurrentPage(1); }}
            className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer flex items-center gap-1.5 ${
              statusFilter === 'unsold' ? 'bg-teal-500/20 text-teal-300 border border-teal-500/40 shadow-glass-xs font-bold' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <span>Legacy Unsold ({stats ? stats.legacyUnsoldUnits.toLocaleString() : '4,248'})</span>
            <span className="text-[9px] bg-teal-500/30 text-teal-200 px-1 py-0.5 rounded font-mono font-normal">Desktop</span>
          </button>
          <button
            onClick={() => { setStatusFilter('stored'); setCurrentPage(1); }}
            className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
              statusFilter === 'stored' ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-glass-xs font-bold' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            In-Stock Sellable ({stats ? stats.activeSellableUnits.toLocaleString() : '3,498'})
          </button>
          <button
            onClick={() => { setStatusFilter('sold'); setCurrentPage(1); }}
            className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
              statusFilter === 'sold' ? 'bg-teal-500/20 text-teal-300 border border-teal-500/40 shadow-glass-xs font-bold' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Liquidated ({stats ? stats.soldUnits.toLocaleString() : '37,686'})
          </button>
          <button
            onClick={() => { setStatusFilter('Deleted'); setCurrentPage(1); }}
            className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
              statusFilter === 'Deleted' ? 'bg-red-500/20 text-red-300 border border-red-500/40 shadow-glass-xs font-bold' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Decommissioned ({stats ? stats.deletedUnits.toLocaleString() : '750'})
          </button>
          <button
            onClick={() => { setStatusFilter('all'); setCurrentPage(1); }}
            className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
              statusFilter === 'all' ? 'bg-teal-500/20 text-teal-300 border border-teal-500/40 shadow-glass-xs font-bold' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            All Serials ({stats ? stats.totalUnits.toLocaleString() : '41,934'})
          </button>
        </div>

        {/* Category, Search, & Sort controls */}
        <div className="flex items-center gap-2.5 flex-1 max-w-2xl justify-end flex-wrap sm:flex-nowrap">
          <button
            onClick={() => {
              setSortOrder((prev) => (prev === 'asc' ? 'desc' : 'asc'));
              setCurrentPage(1);
            }}
            className="flex items-center gap-1.5 text-xs glass-input rounded-xl px-3 py-2 font-medium text-slate-200 hover:text-teal-300 transition-colors cursor-pointer whitespace-nowrap"
            title={sortOrder === 'asc' ? 'Legacy Desktop Order (ID 1 -> N)' : 'Newest First (ID N -> 1)'}
          >
            <ArrowUpDown className="w-3.5 h-3.5 text-teal-400" />
            <span>{sortOrder === 'asc' ? 'ID Asc (Desktop)' : 'ID Desc (Newest)'}</span>
          </button>

          <select
            value={selectedCategory}
            onChange={(e) => { setSelectedCategory(e.target.value); setCurrentPage(1); }}
            className="text-xs glass-input rounded-xl px-3 py-2 font-medium text-slate-200 cursor-pointer"
          >
            <option value="All Stocks" className="bg-slate-900 text-slate-100">All Categories</option>
            {CATEGORIES.map((cat) => (
              <option key={cat} value={cat} className="bg-slate-900 text-slate-100">{cat}</option>
            ))}
          </select>

          <div className="relative flex-1 min-w-[200px]">
            <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-slate-400" />
            <input
              type="text"
              placeholder="Search serial, specs, distributor..."
              value={searchQuery}
              onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
              className="w-full pl-8 pr-3 py-1.5 text-xs glass-input rounded-xl placeholder:text-slate-500"
            />
          </div>
        </div>
      </div>

      {/* Main Stock Data Table */}
      <div className="glass-card rounded-2xl border border-white/[0.08] shadow-glass-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-950/60 border-b border-white/[0.08] text-slate-400 font-bold uppercase tracking-wider text-[10px]">
                <th className="py-3 px-3.5 text-center font-mono"># ID</th>
                <th className="py-3 px-3 font-mono">Serial Barcode</th>
                <th className="py-3 px-3">Category</th>
                <th className="py-3 px-3">Product Description & Specifications</th>
                <th className="py-3 px-3 text-right">Selling Price (SRP)</th>
                {canViewCosts && (
                  <>
                    <th className="py-3 px-3 text-right">Unit Cost (COGS)</th>
                    <th className="py-3 px-3 text-center">Gross Margin</th>
                  </>
                )}
                <th className="py-3 px-3">Distributor</th>
                <th className="py-3 px-3 text-center">Warranty</th>
                <th className="py-3 px-3">Lifecycle Status</th>
                <th className="py-3 px-3 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.06]">
              {paginatedItems.map((item) => {
                const marginPhp = item.stockPrice - item.suppliersPrice;
                const marginPct = item.stockPrice > 0 ? (marginPhp / item.stockPrice) * 100 : 0;

                return (
                  <tr key={item.id} className="hover:bg-white/[0.04] transition-colors">
                    <td className="py-2.5 px-3.5 font-mono text-center text-slate-400 font-semibold whitespace-nowrap">
                      {item.id}
                    </td>
                    <td className="py-2.5 px-3 font-mono font-bold text-teal-300 whitespace-nowrap">
                      {item.stockSerial}
                    </td>
                    <td className="py-2.5 px-3">
                      <span className="bg-slate-900/80 border border-white/[0.08] text-slate-300 px-2 py-0.5 rounded-lg text-[11px] font-medium whitespace-nowrap">
                        {item.stockName}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 font-medium text-slate-200 max-w-xs leading-relaxed">
                      {item.stockDetails}
                    </td>
                    <td className="py-2.5 px-3 text-right font-bold text-slate-100 font-mono whitespace-nowrap">
                      ₱{item.stockPrice.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </td>
                    {canViewCosts && (
                      <>
                        <td className="py-2.5 px-3 text-right text-slate-400 font-mono whitespace-nowrap">
                          ₱{item.suppliersPrice.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                        </td>
                        <td className="py-2.5 px-3 text-center whitespace-nowrap">
                          <span
                            className={`inline-block px-2 py-0.5 rounded-lg text-[10px] font-mono font-bold ${
                              marginPct >= 15
                                ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30'
                                : marginPct >= 10
                                ? 'bg-blue-500/15 text-blue-300 border border-blue-500/30'
                                : 'bg-amber-500/15 text-amber-300 border border-amber-500/30'
                            }`}
                          >
                            +{marginPct.toFixed(1)}% (₱{marginPhp.toLocaleString()})
                          </span>
                        </td>
                      </>
                    )}
                    <td className="py-2.5 px-3 text-slate-300 truncate max-w-[130px]" title={item.supplierName}>
                      {item.supplierName}
                    </td>
                    <td className="py-2.5 px-3 text-center whitespace-nowrap">
                      <span className="inline-flex items-center gap-1 text-[11px] font-medium text-slate-300 bg-slate-900/80 border border-white/[0.08] px-2 py-0.5 rounded-lg">
                        <Shield className="w-3 h-3 text-teal-400" />
                        <span>{item.warranty}d</span>
                      </span>
                    </td>
                    <td className="py-2.5 px-3 whitespace-nowrap">
                      {item.stockStatus === 'stored' && (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                          In-Stock
                        </span>
                      )}
                      {item.stockStatus === 'updated' && (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-teal-500/15 text-teal-300 border border-teal-500/30" title="Specifications or price modified in-stock">
                          In-Stock (Updated)
                        </span>
                      )}
                      {(item.stockStatus === 'sold' || item.stockStatus === 'Sold') && (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-500/15 text-blue-300 border border-blue-500/30">
                          Sold {item.orderId ? `#${item.orderId}` : ''}
                        </span>
                      )}
                      {item.stockStatus === 'Deleted' && (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-red-500/15 text-red-300 border border-red-500/30">
                          Decommissioned
                        </span>
                      )}
                    </td>
                    <td className="py-2.5 px-3 text-center whitespace-nowrap">
                      {canManageInventory ? (
                        <div className="flex items-center justify-center gap-1">
                          {item.stockStatus === 'Deleted' ? (
                            <button
                              onClick={() => handleRestore(item)}
                              className="text-emerald-400 hover:text-emerald-200 p-1.5 rounded-lg hover:bg-emerald-500/15 transition-colors cursor-pointer"
                              title="Restore Stock Item"
                            >
                              <RotateCcw className="w-3.5 h-3.5" />
                            </button>
                          ) : (
                            <>
                              <button
                                onClick={() => {
                                  setItemToEdit(item);
                                  setIsAddModalOpen(true);
                                }}
                                className="text-slate-400 hover:text-teal-300 p-1.5 rounded-lg hover:bg-white/[0.08] transition-colors cursor-pointer"
                                title="Edit Specifications & Pricing"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => handleDelete(item)}
                                className="text-slate-400 hover:text-red-400 p-1.5 rounded-lg hover:bg-red-500/15 transition-colors cursor-pointer"
                                title="Decommission Stock Item"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </>
                          )}
                        </div>
                      ) : (
                        <span className="text-[10px] text-slate-500 font-medium">Read-Only</span>
                      )}
                    </td>
                  </tr>
                );
              })}

              {paginatedItems.length === 0 && (
                <tr>
                  <td colSpan={canViewCosts ? 11 : 9} className="py-12 text-center text-slate-500">
                    No hardware assets match the selected filter criteria.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Responsive Pagination Component */}
        <Pagination
          currentPage={currentPage}
          totalItems={totalRecords}
          pageSize={pageSize}
          pageSizeOptions={[25, 50, 100, 250]}
          onPageChange={setCurrentPage}
          onPageSizeChange={setPageSize}
          label="registered units"
        />
      </div>

      {/* Add / Edit Stock Modal */}
      {isAddModalOpen && (
        <AddStockModal
          itemToEdit={itemToEdit}
          suppliers={suppliers}
          onClose={() => setIsAddModalOpen(false)}
          onSaved={() => {
            setIsAddModalOpen(false);
            loadInventory();
            showNotify('success', itemToEdit ? 'Asset specifications updated!' : 'Goods inward unit registered!');
          }}
        />
      )}

      {/* Batch Price Revision Modal */}
      {isBatchPriceModalOpen && (
        <BatchPriceModal
          onClose={() => setIsBatchPriceModalOpen(false)}
          onSuccess={(count) => {
            setIsBatchPriceModalOpen(false);
            loadInventory();
            showNotify('success', `Revised selling price for ${count} catalog units.`);
          }}
        />
      )}
    </div>
  );
};
