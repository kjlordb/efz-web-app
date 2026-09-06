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
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-teal-700" />
            <span>Inventory Audit & Stock Movement</span>
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Statistical breakdown of stock levels, supplier concentrations, and retail margins
          </p>
        </div>

        {/* Audit Tabs */}
        <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg text-xs font-semibold">
          <button
            onClick={() => setSelectedAuditTab('category')}
            className={`px-3 py-1.5 rounded-md transition-all ${
              selectedAuditTab === 'category' ? 'bg-white text-teal-900 shadow-sm font-bold' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Category Breakdown
          </button>
          <button
            onClick={() => setSelectedAuditTab('supplier')}
            className={`px-3 py-1.5 rounded-md transition-all ${
              selectedAuditTab === 'supplier' ? 'bg-white text-teal-900 shadow-sm font-bold' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Supplier Distribution
          </button>
          <button
            onClick={() => setSelectedAuditTab('movement')}
            className={`px-3 py-1.5 rounded-md transition-all ${
              selectedAuditTab === 'movement' ? 'bg-white text-teal-900 shadow-sm font-bold' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Recent Movement
          </button>
        </div>
      </div>

      {/* Overview Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
            Total In-Stock Units
          </span>
          <div className="text-2xl font-black text-teal-800 mt-1">
            {inStock.length} <span className="text-xs font-normal text-slate-500">items ready for sale</span>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
            Total Inventory Retail Value
          </span>
          <div className="text-2xl font-black text-slate-900 mt-1">
            ₱{inStock.reduce((acc, i) => acc + i.stockPrice, 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
            Wholesale Capital Investment
          </span>
          <div className="text-2xl font-black text-slate-700 mt-1">
            ₱{inStock.reduce((acc, i) => acc + i.suppliersPrice, 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}
          </div>
        </div>
      </div>

      {/* Tab 1: Category Breakdown Table */}
      {selectedAuditTab === 'category' && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-3 border-b border-slate-200 bg-slate-50">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-700">
              Hardware Category Inventory & Margin Breakdown
            </span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 text-slate-500 border-b border-slate-200 text-[10px] uppercase">
                  <th className="py-3 px-4">Hardware Category</th>
                  <th className="py-3 px-4 text-center">Remaining In-Stock</th>
                  <th className="py-3 px-4 text-center">Units Sold</th>
                  <th className="py-3 px-4 text-right">Wholesale Cost</th>
                  <th className="py-3 px-4 text-right">Retail Value</th>
                  <th className="py-3 px-4 text-right">Potential Margin</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {categoryStats.map((stat) => (
                  <tr key={stat.category} className="hover:bg-slate-50/70">
                    <td className="py-3 px-4 font-bold text-slate-800">{stat.category}</td>
                    <td className="py-3 px-4 text-center">
                      <span className="font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded font-mono">
                        {stat.storedCount}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span className="font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded font-mono">
                        {stat.soldCount}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right font-mono text-slate-600">
                      ₱{stat.totalCost.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </td>
                    <td className="py-3 px-4 text-right font-mono font-bold text-slate-900">
                      ₱{stat.totalValue.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </td>
                    <td className="py-3 px-4 text-right font-mono font-bold text-teal-700">
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
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-3 border-b border-slate-200 bg-slate-50">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-700">
              Supplier Sourcing & Distribution
            </span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 text-slate-500 border-b border-slate-200 text-[10px] uppercase">
                  <th className="py-3 px-4">Supplier Name</th>
                  <th className="py-3 px-4 text-center">In-Stock Units</th>
                  <th className="py-3 px-4 text-center">Delivered & Sold</th>
                  <th className="py-3 px-4 text-right">Total Supplier Investment</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {Object.entries(supplierMap).map(([name, data]) => (
                  <tr key={name} className="hover:bg-slate-50/70">
                    <td className="py-3 px-4 font-bold text-slate-800">{name}</td>
                    <td className="py-3 px-4 text-center font-mono font-bold text-slate-700">
                      {data.stored}
                    </td>
                    <td className="py-3 px-4 text-center font-mono text-slate-500">
                      {data.sold}
                    </td>
                    <td className="py-3 px-4 text-right font-mono font-bold text-slate-900">
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
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4 space-y-3">
          <div className="text-xs font-bold uppercase tracking-wider text-slate-700 border-b border-slate-100 pb-2">
            Inbound vs Outbound Stock Log
          </div>
          <div className="divide-y divide-slate-100">
            {items.slice(0, 10).map((item) => (
              <div key={item.id} className="py-2.5 flex items-center justify-between text-xs">
                <div className="flex items-center gap-3">
                  <div
                    className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${
                      item.stockStatus === 'stored'
                        ? 'bg-emerald-50 text-emerald-700'
                        : 'bg-blue-50 text-blue-700'
                    }`}
                  >
                    {item.stockStatus === 'stored' ? (
                      <TrendingUp className="w-3.5 h-3.5" />
                    ) : (
                      <TrendingDown className="w-3.5 h-3.5" />
                    )}
                  </div>
                  <div>
                    <div className="font-bold text-slate-800">{item.stockDetails}</div>
                    <div className="font-mono text-[11px] text-slate-500">
                      Serial: {item.stockSerial} • Supplier: {item.supplierName}
                    </div>
                  </div>
                </div>

                <div className="text-right">
                  <span
                    className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold ${
                      item.stockStatus === 'stored'
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-blue-100 text-blue-800'
                    }`}
                  >
                    {item.stockStatus === 'stored' ? 'Inbound (Stored)' : `Sold #${item.orderId}`}
                  </span>
                  <div className="text-[10px] text-slate-400 mt-0.5">
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
