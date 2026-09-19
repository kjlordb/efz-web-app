import React, { useState, useEffect } from 'react';
import {
  BarChart3,
  Package,
  Layers,
  Truck,
  Calendar,
  DollarSign,
  TrendingDown,
  TrendingUp,
  Search
} from 'lucide-react';
import { inventoryService } from '../services/api';
import { CATEGORIES } from '../services/mockData';
import { StockItem } from '../types';

export const InventoryAuditPage: React.FC = () => {
  const [items, setItems] = useState<StockItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedAuditTab, setSelectedAuditTab] = useState<'category' | 'supplier' | 'movement'>('category');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const data = await inventoryService.getStockItems({ includeDeleted: false });
      setItems(data);
    } finally {
      setLoading(false);
    }
  };

  const inStock = items.filter((i) => i.stockStatus === 'stored');
  const sold = items.filter((i) => i.stockStatus === 'sold');

  // Aggregation by Category
  const categoryStats = CATEGORIES.map((cat) => {
    const catStored = inStock.filter((i) => i.stockName.toLowerCase() === cat.toLowerCase());
    const catSold = sold.filter((i) => i.stockName.toLowerCase() === cat.toLowerCase());
    const totalValue = catStored.reduce((acc, i) => acc + i.stockPrice, 0);
    const totalCost = catStored.reduce((acc, i) => acc + i.suppliersPrice, 0);

    return {
      category: cat,
      storedCount: catStored.length,
      soldCount: catSold.length,
      totalValue,
      totalCost,
      potentialProfit: totalValue - totalCost
    };
  }).filter((c) => c.storedCount > 0 || c.soldCount > 0);

  // Aggregation by Supplier
  const supplierMap: Record<string, { stored: number; sold: number; totalCost: number }> = {};
  items.forEach((item) => {
    const sup = item.supplierName || 'Unknown Supplier';
    if (!supplierMap[sup]) {
      supplierMap[sup] = { stored: 0, sold: 0, totalCost: 0 };
    }
    if (item.stockStatus === 'stored') {
      supplierMap[sup].stored++;
      supplierMap[sup].totalCost += item.suppliersPrice;
    } else if (item.stockStatus === 'sold') {
      supplierMap[sup].sold++;
    }
  });

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="bg-slate-900/60 backdrop-blur-md p-4 sm:p-5 rounded-2xl border border-white/[0.08] shadow-glass-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-lg font-black text-white tracking-tight flex items-center gap-2.5">
            <BarChart3 className="w-5 h-5 text-teal-400" />
            <span>Inventory Audit & Stock Movement</span>
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Statistical breakdown of stock levels, supplier concentrations, and retail margins
          </p>
        </div>

        {/* Audit Tabs */}
        <div className="flex items-center gap-1 bg-slate-950/60 p-1.5 rounded-xl border border-white/[0.08] text-xs font-semibold">
          <button
            onClick={() => setSelectedAuditTab('category')}
            className={`px-3 py-1.5 rounded-lg transition-all ${
              selectedAuditTab === 'category'
                ? 'bg-gradient-to-r from-teal-600 to-teal-700 text-white font-bold shadow-glass-xs'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Category Breakdown
          </button>
          <button
            onClick={() => setSelectedAuditTab('supplier')}
            className={`px-3 py-1.5 rounded-lg transition-all ${
              selectedAuditTab === 'supplier'
                ? 'bg-gradient-to-r from-teal-600 to-teal-700 text-white font-bold shadow-glass-xs'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Supplier Distribution
          </button>
          <button
            onClick={() => setSelectedAuditTab('movement')}
            className={`px-3 py-1.5 rounded-lg transition-all ${
              selectedAuditTab === 'movement'
                ? 'bg-gradient-to-r from-teal-600 to-teal-700 text-white font-bold shadow-glass-xs'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Recent Movement
          </button>
        </div>
      </div>

      {/* Overview Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-slate-900/60 backdrop-blur-md p-4 rounded-2xl border border-white/[0.08] shadow-glass-xs hover:border-white/[0.14] transition-all">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
            Total In-Stock Units
          </span>
          <div className="text-2xl font-black text-teal-300 mt-1 font-mono">
            {inStock.length} <span className="text-xs font-normal text-slate-400">items ready for sale</span>
          </div>
        </div>

        <div className="bg-slate-900/60 backdrop-blur-md p-4 rounded-2xl border border-white/[0.08] shadow-glass-xs hover:border-white/[0.14] transition-all">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
            Total Inventory Retail Value
          </span>
          <div className="text-2xl font-black text-white mt-1 font-mono">
            ₱{inStock.reduce((acc, i) => acc + i.stockPrice, 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}
          </div>
        </div>

        <div className="bg-slate-900/60 backdrop-blur-md p-4 rounded-2xl border border-white/[0.08] shadow-glass-xs hover:border-white/[0.14] transition-all">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
            Wholesale Capital Investment
          </span>
          <div className="text-2xl font-black text-amber-300 mt-1 font-mono">
            ₱{inStock.reduce((acc, i) => acc + i.suppliersPrice, 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}
          </div>
        </div>
      </div>

      {/* Tab 1: Category Breakdown Table */}
      {selectedAuditTab === 'category' && (
        <div className="bg-slate-900/60 backdrop-blur-md rounded-2xl border border-white/[0.08] shadow-glass-sm overflow-hidden">
          <div className="p-3.5 border-b border-white/[0.08] bg-slate-950/40">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-300">
              Hardware Category Inventory & Margin Breakdown
            </span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-950/60 text-slate-400 border-b border-white/[0.08] text-[10px] uppercase font-semibold">
                  <th className="py-3 px-4">Hardware Category</th>
                  <th className="py-3 px-4 text-center">Remaining In-Stock</th>
                  <th className="py-3 px-4 text-center">Units Sold</th>
                  <th className="py-3 px-4 text-right">Wholesale Cost</th>
                  <th className="py-3 px-4 text-right">Retail Value</th>
                  <th className="py-3 px-4 text-right">Potential Margin</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.04]">
                {categoryStats.map((stat) => (
                  <tr key={stat.category} className="hover:bg-white/[0.02] transition-colors">
                    <td className="py-3 px-4 font-bold text-slate-200">{stat.category}</td>
                    <td className="py-3 px-4 text-center">
                      <span className="font-bold text-emerald-300 bg-emerald-500/15 border border-emerald-500/30 px-2.5 py-0.5 rounded-full font-mono text-[11px]">
                        {stat.storedCount}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span className="font-bold text-blue-300 bg-blue-500/15 border border-blue-500/30 px-2.5 py-0.5 rounded-full font-mono text-[11px]">
                        {stat.soldCount}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right font-mono text-slate-400">
                      ₱{stat.totalCost.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </td>
                    <td className="py-3 px-4 text-right font-mono font-bold text-white">
                      ₱{stat.totalValue.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </td>
                    <td className="py-3 px-4 text-right font-mono font-bold text-teal-300">
                      ₱{stat.potentialProfit.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 2: Supplier Distribution */}
      {selectedAuditTab === 'supplier' && (
        <div className="bg-slate-900/60 backdrop-blur-md rounded-2xl border border-white/[0.08] shadow-glass-sm overflow-hidden">
          <div className="p-3.5 border-b border-white/[0.08] bg-slate-950/40">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-300">
              Supplier Sourcing & Distribution
            </span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-950/60 text-slate-400 border-b border-white/[0.08] text-[10px] uppercase font-semibold">
                  <th className="py-3 px-4">Supplier Name</th>
                  <th className="py-3 px-4 text-center">In-Stock Units</th>
                  <th className="py-3 px-4 text-center">Delivered & Sold</th>
                  <th className="py-3 px-4 text-right">Total Supplier Investment</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.04]">
                {Object.entries(supplierMap).map(([name, data]) => (
                  <tr key={name} className="hover:bg-white/[0.02] transition-colors">
                    <td className="py-3 px-4 font-bold text-slate-200">{name}</td>
                    <td className="py-3 px-4 text-center font-mono font-bold text-teal-300">
                      {data.stored}
                    </td>
                    <td className="py-3 px-4 text-center font-mono text-slate-400">
                      {data.sold}
                    </td>
                    <td className="py-3 px-4 text-right font-mono font-bold text-white">
                      ₱{data.totalCost.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 3: Recent Movement */}
      {selectedAuditTab === 'movement' && (
        <div className="bg-slate-900/60 backdrop-blur-md rounded-2xl border border-white/[0.08] shadow-glass-sm p-4 sm:p-5 space-y-3">
          <div className="text-xs font-bold uppercase tracking-wider text-slate-300 border-b border-white/[0.08] pb-3">
            Inbound vs Outbound Stock Log
          </div>
          <div className="divide-y divide-white/[0.04]">
            {items.slice(0, 10).map((item) => (
              <div key={item.id} className="py-2.5 flex items-center justify-between text-xs">
                <div className="flex items-center gap-3">
                  <div
                    className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 border ${
                      item.stockStatus === 'stored'
                        ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
                        : 'bg-blue-500/15 text-blue-300 border-blue-500/30'
                    }`}
                  >
                    {item.stockStatus === 'stored' ? (
                      <TrendingUp className="w-3.5 h-3.5" />
                    ) : (
                      <TrendingDown className="w-3.5 h-3.5" />
                    )}
                  </div>
                  <div>
                    <div className="font-bold text-white">{item.stockDetails}</div>
                    <div className="font-mono text-[11px] text-slate-400">
                      Serial: <span className="text-teal-300">{item.stockSerial}</span> • Supplier: {item.supplierName}
                    </div>
                  </div>
                </div>

                <div className="text-right">
                  <span
                    className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                      item.stockStatus === 'stored'
                        ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
                        : 'bg-blue-500/15 text-blue-300 border-blue-500/30'
                    }`}
                  >
                    {item.stockStatus === 'stored' ? 'Inbound (Stored)' : `Sold #${item.orderId}`}
                  </span>
                  <div className="text-[10px] text-slate-500 mt-0.5 font-mono">
                    {new Date(item.inDate).toLocaleDateString()}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
