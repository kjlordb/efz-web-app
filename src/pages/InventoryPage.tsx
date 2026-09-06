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
  TrendingUp
} from 'lucide-react';
import { inventoryService, supplierService, DATA_UPDATED_EVENT } from '../services/api';
import { CATEGORIES } from '../services/mockData';
import { StockItem, Supplier } from '../types';
import { AddStockModal } from '../components/modals/AddStockModal';
import { BatchPriceModal } from '../components/modals/BatchPriceModal';
import { useAuth } from '../context/AuthContext';

export const InventoryPage: React.FC = () => {
  const { hasPermission } = useAuth();
  const canViewCosts = hasPermission('VIEW_COGS_MARGINS');
  const canManageInventory = hasPermission('MANAGE_INVENTORY');

  const [items, setItems] = useState<StockItem[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(false);

  // Filters
  const [selectedCategory, setSelectedCategory] = useState('All Stocks');
  const [statusFilter, setStatusFilter] = useState<'stored' | 'sold' | 'Deleted' | 'all'>('stored');
  const [searchQuery, setSearchQuery] = useState('');

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 50;

  // Modals
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isBatchPriceModalOpen, setIsBatchPriceModalOpen] = useState(false);
  const [itemToEdit, setItemToEdit] = useState<StockItem | null>(null);

  const [notification, setNotification] = useState<{ type: 'success' | 'error'; msg: string } | null>(null);

  useEffect(() => {
    loadInventory();
  }, [selectedCategory, statusFilter]);

  useEffect(() => {
    const handleUpdate = () => {
      loadInventory();
    };
    window.addEventListener(DATA_UPDATED_EVENT, handleUpdate);
    return () => window.removeEventListener(DATA_UPDATED_EVENT, handleUpdate);
  }, [selectedCategory, statusFilter]);

  const loadInventory = async () => {
    setLoading(true);
    try {
      const [data, sups] = await Promise.all([
        inventoryService.getStockItems({
          category: selectedCategory,
          includeDeleted: true,
          status: statusFilter === 'all' ? undefined : statusFilter
        }),
        supplierService.getSuppliers()
      ]);
      setItems(data);
      setSuppliers(sups);
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
          className={`p-3 rounded-xl text-xs font-medium flex items-center justify-between border shadow-xs ${
            notification.type === 'success'
              ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
              : 'bg-red-50 text-red-800 border-red-200'
          }`}
        >
          <div className="flex items-center gap-2">
            {notification.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            ) : (
              <AlertCircle className="w-4 h-4 text-red-600" />
            )}
            <span>{notification.msg}</span>
          </div>
          <button onClick={() => setNotification(null)} className="text-slate-400 hover:text-slate-600">×</button>
        </div>
      )}

      {/* Header bar with enterprise actions */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <Package className="w-5 h-5 text-teal-700" />
            <span>Serialized Inventory & Asset Master</span>
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Unit-level hardware control, COGS margins, distributor warranty schedules, and price governance
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-300 px-3 py-2 rounded-lg transition-colors"
            title="Export CSV spreadsheet"
          >
            <Download className="w-3.5 h-3.5 text-slate-600" />
            <span>Export CSV</span>
          </button>

          {canManageInventory ? (
            <>
              <button
                onClick={() => setIsBatchPriceModalOpen(true)}
                className="flex items-center gap-1.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-300 px-3 py-2 rounded-lg transition-colors"
              >
                <Tag className="w-3.5 h-3.5 text-teal-700" />
                <span>Bulk Price Revision</span>
              </button>

              <button
                onClick={() => {
                  setItemToEdit(null);
                  setIsAddModalOpen(true);
                }}
                className="flex items-center gap-1.5 text-xs font-bold text-white bg-teal-700 hover:bg-teal-800 px-4 py-2 rounded-lg shadow-sm transition-all"
              >
                <Plus className="w-4 h-4" />
                <span>Receive Inward Stock</span>
              </button>
            </>
          ) : (
            <div className="px-3 py-1.5 rounded-lg bg-slate-100 border border-slate-200 text-slate-600 text-xs font-semibold flex items-center gap-1.5">
              <span>Read-Only Catalog View</span>
            </div>
          )}
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-sm flex flex-wrap items-center justify-between gap-3">
        {/* Status Tabs with business terminology */}
        <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg text-xs font-semibold">
          <button
            onClick={() => { setStatusFilter('stored'); setCurrentPage(1); }}
            className={`px-3 py-1.5 rounded-md transition-all ${
              statusFilter === 'stored' ? 'bg-white text-teal-900 shadow-sm font-bold' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            In-Stock (Available)
          </button>
          <button
            onClick={() => { setStatusFilter('sold'); setCurrentPage(1); }}
            className={`px-3 py-1.5 rounded-md transition-all ${
              statusFilter === 'sold' ? 'bg-white text-teal-900 shadow-sm font-bold' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Liquidated (Sold)
          </button>
          <button
            onClick={() => { setStatusFilter('Deleted'); setCurrentPage(1); }}
            className={`px-3 py-1.5 rounded-md transition-all ${
              statusFilter === 'Deleted' ? 'bg-white text-red-700 shadow-sm font-bold' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Decommissioned
          </button>
          <button
            onClick={() => { setStatusFilter('all'); setCurrentPage(1); }}
            className={`px-3 py-1.5 rounded-md transition-all ${
              statusFilter === 'all' ? 'bg-white text-teal-900 shadow-sm font-bold' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            All Lifecycle Statuses
          </button>
        </div>

        {/* Category Filter & Search Box */}
        <div className="flex items-center gap-2 flex-1 max-w-md justify-end">
          <select
            value={selectedCategory}
            onChange={(e) => { setSelectedCategory(e.target.value); setCurrentPage(1); }}
            className="text-xs border border-slate-300 rounded-lg px-2.5 py-1.5 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500 font-medium text-slate-700"
          >
            <option value="All Stocks">All Hardware Categories</option>
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>

          <div className="relative flex-1">
            <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-slate-400" />
            <input
              type="text"
              placeholder="Search serial, specs, distributor..."
              value={searchQuery}
              onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
              className="w-full pl-8 pr-3 py-1.5 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 bg-white"
            />
          </div>
        </div>
      </div>

      {/* Main Stock Data Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider text-[10px]">
                <th className="py-3 px-3">Serial Barcode</th>
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
            <tbody className="divide-y divide-slate-100">
              {paginatedItems.map((item) => {
                const marginPhp = item.stockPrice - item.suppliersPrice;
                const marginPct = item.stockPrice > 0 ? (marginPhp / item.stockPrice) * 100 : 0;

                return (
                  <tr key={item.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-2.5 px-3 font-mono font-bold text-teal-900 whitespace-nowrap">
                      {item.stockSerial}
                    </td>
                    <td className="py-2.5 px-3">
                      <span className="bg-slate-100 text-slate-700 px-2 py-0.5 rounded text-[11px] font-medium whitespace-nowrap">
                        {item.stockName}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 font-medium text-slate-800 max-w-xs">
                      {item.stockDetails}
                    </td>
                    <td className="py-2.5 px-3 text-right font-bold text-slate-900 font-mono whitespace-nowrap">
                      ₱{item.stockPrice.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </td>
                    {canViewCosts && (
                      <>
                        <td className="py-2.5 px-3 text-right text-slate-500 font-mono whitespace-nowrap">
                          ₱{item.suppliersPrice.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                        </td>
                        <td className="py-2.5 px-3 text-center whitespace-nowrap">
                          <span
                            className={`inline-block px-1.5 py-0.5 rounded text-[10px] font-mono font-bold ${
                              marginPct >= 15
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                : marginPct >= 10
                                ? 'bg-blue-50 text-blue-700 border border-blue-200'
                                : 'bg-amber-50 text-amber-700 border border-amber-200'
                            }`}
                          >
                            +{marginPct.toFixed(1)}% (₱{marginPhp.toLocaleString()})
                          </span>
                        </td>
                      </>
                    )}
                    <td className="py-2.5 px-3 text-slate-600 truncate max-w-[130px]" title={item.supplierName}>
                      {item.supplierName}
                    </td>
                    <td className="py-2.5 px-3 text-center whitespace-nowrap">
                      <span className="inline-flex items-center gap-1 text-[11px] font-medium text-slate-700 bg-slate-100 px-1.5 py-0.5 rounded">
                        <Shield className="w-3 h-3 text-teal-600" />
                        <span>{item.warranty}d</span>
                      </span>
                    </td>
                    <td className="py-2.5 px-3 whitespace-nowrap">
                      {item.stockStatus === 'stored' && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                          In-Stock
                        </span>
                      )}
                      {item.stockStatus === 'sold' && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-800">
                          Sold #{item.orderId}
                        </span>
                      )}
                      {item.stockStatus === 'Deleted' && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-100 text-red-800">
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
                              className="text-emerald-600 hover:text-emerald-800 p-1.5 rounded hover:bg-emerald-50 transition-colors"
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
                                className="text-slate-500 hover:text-teal-700 p-1.5 rounded hover:bg-slate-100 transition-colors"
                                title="Edit Specifications & Pricing"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => handleDelete(item)}
                                className="text-slate-400 hover:text-red-600 p-1.5 rounded hover:bg-red-50 transition-colors"
                                title="Decommission Stock Item"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </>
                          )}
                        </div>
                      ) : (
                        <span className="text-[10px] text-slate-400 font-medium">Read-Only</span>
                      )}
                    </td>
                  </tr>
                );
              })}

              {paginatedItems.length === 0 && (
                <tr>
                  <td colSpan={canViewCosts ? 10 : 8} className="py-12 text-center text-slate-400">
                    No hardware assets match the selected filter criteria.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination bar matching desktop 50 items/page */}
        <div className="p-3 border-t border-slate-200 bg-slate-50 flex items-center justify-between text-xs text-slate-600">
          <div>
            Displaying <strong className="font-semibold text-slate-800">{totalRecords > 0 ? (currentPage - 1) * pageSize + 1 : 0}</strong> to{' '}
            <strong className="font-semibold text-slate-800">{Math.min(currentPage * pageSize, totalRecords)}</strong> of{' '}
            <strong className="font-semibold text-slate-800">{totalRecords}</strong> registered units
          </div>

          <div className="flex items-center gap-2">
            <button
              disabled={currentPage <= 1}
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              className="p-1.5 rounded border border-slate-300 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-white transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="font-medium">
              Page {currentPage} of {totalPages}
            </span>
            <button
              disabled={currentPage >= totalPages}
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              className="p-1.5 rounded border border-slate-300 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-white transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
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
