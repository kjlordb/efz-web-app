import React, { useState, useEffect } from 'react';
import {
  Receipt,
  Search,
  Calendar,
  Barcode,
  ShieldCheck,
  ShieldAlert,
  ChevronDown,
  ChevronUp,
  Printer,
  User,
  DollarSign,
  Clock,
  CheckCircle2,
  Download,
  RotateCcw,
  Sparkles
} from 'lucide-react';
import { salesService, DATA_UPDATED_EVENT } from '../services/api';
import { Order, PaymentMethodType, StockItem } from '../types';
import { InvoicePrintModal } from '../components/modals/InvoicePrintModal';

interface SalesRecordPageProps {
  onInitiateRMA?: (serial: string, item: StockItem, order: Order) => void;
}

export const SalesRecordPage: React.FC<SalesRecordPageProps> = ({ onInitiateRMA }) => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(false);

  // Filters
  const [scanSerial, setScanSerial] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [searchCustomer, setSearchCustomer] = useState('');
  const [paymentTierFilter, setPaymentTierFilter] = useState<string>('all');

  // Accordion state
  const [expandedOrders, setExpandedOrders] = useState<Record<number, boolean>>({});

  // Print modal
  const [selectedOrderToPrint, setSelectedOrderToPrint] = useState<Order | null>(null);

  useEffect(() => {
    loadSales();
  }, [startDate, endDate]);

  useEffect(() => {
    const handleUpdate = () => {
      loadSales();
    };
    window.addEventListener(DATA_UPDATED_EVENT, handleUpdate);
    return () => window.removeEventListener(DATA_UPDATED_EVENT, handleUpdate);
  }, [startDate, endDate]);

  const loadSales = async () => {
    setLoading(true);
    try {
      const data = await salesService.getOrders({
        startDate: startDate || undefined,
        endDate: endDate || undefined,
        serial: scanSerial || undefined
      });
      setOrders(data);

      // By default expand first 3 orders
      const initialExpanded: Record<number, boolean> = {};
      data.slice(0, 3).forEach((o) => {
        initialExpanded[o.id] = true;
      });
      setExpandedOrders(initialExpanded);
    } finally {
      setLoading(false);
    }
  };

  const handleScanSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    loadSales();
  };

  const toggleExpand = (id: number) => {
    setExpandedOrders((prev) => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  // Export to CSV
  const handleExportCSV = () => {
    const headers = [
      'Invoice #',
      'Client Name',
      'Company',
      'Execution Date',
      'Payment Method',
      'Total Amount (PHP)',
      'Sales Associate (Encoder)',
      'Terminal Workstation',
      'Serialized Units'
    ];

    const rows = filteredOrders.map((o) => [
      o.id,
      `"${o.customerName}"`,
      `"${o.customerCompany || ''}"`,
      `"${o.orderDate}"`,
      `"${o.paymentMethod}"`,
      o.orderAmount,
      `"${o.encoder}"`,
      `"${o.computerName}"`,
      `"${o.listOfSerials}"`
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `EFZ_SalesLedger_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Filter in-memory
  const filteredOrders = orders.filter((order) => {
    if (paymentTierFilter !== 'all' && order.paymentTier !== paymentTierFilter) {
      return false;
    }
    if (!searchCustomer) return true;
    const q = searchCustomer.toLowerCase();
    return (
      (order.customerName && order.customerName.toLowerCase().includes(q)) ||
      (order.customerCompany && order.customerCompany.toLowerCase().includes(q)) ||
      order.id.toString().includes(q)
    );
  });

  const totalSalesVolume = filteredOrders.reduce((acc, o) => acc + o.orderAmount, 0);

  return (
    <div className="space-y-4">
      {/* Header Banner */}
      <div className="glass-card p-4 sm:p-5 rounded-2xl border border-white/[0.08] shadow-glass-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-lg sm:text-xl font-bold text-slate-100 flex items-center gap-2">
            <Receipt className="w-5 h-5 text-teal-400 drop-shadow-[0_0_8px_rgba(29,130,150,0.5)]" />
            <span>Sales Ledger & Warranty Claims Audit</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1 leading-relaxed">
            Audit commercial tax invoices, examine liquidation dates, and evaluate real-time warranty eligibility
          </p>
        </div>

        {/* Action Controls & Volume Summary */}
        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 text-xs font-semibold text-slate-200 bg-slate-800/80 hover:bg-white/[0.08] border border-white/[0.1] px-3.5 py-2 rounded-xl transition-all cursor-pointer shadow-glass-xs"
          >
            <Download className="w-3.5 h-3.5 text-slate-300" />
            <span>Export Ledger</span>
          </button>

          <div className="bg-slate-950/60 border border-white/[0.08] px-3 py-1.5 rounded-xl text-xs shadow-inner">
            <span className="text-slate-400 block text-[10px] uppercase font-bold">Total Invoices:</span>
            <span className="font-bold text-slate-200 font-mono">{filteredOrders.length}</span>
          </div>

          <div className="bg-emerald-500/15 border border-emerald-500/30 px-3.5 py-1.5 rounded-xl text-xs shadow-glass-xs">
            <span className="text-emerald-300 block text-[10px] uppercase font-bold">Revenue Volume:</span>
            <span className="font-black text-emerald-300 text-sm font-mono tracking-tight drop-shadow-sm">
              ₱{totalSalesVolume.toLocaleString('en-US', { minimumFractionDigits: 2 })}
            </span>
          </div>
        </div>
      </div>

      {/* Filter and Barcode Scanner Toolbar */}
      <div className="glass-card p-4 rounded-2xl border border-white/[0.08] shadow-glass-sm space-y-3">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-end">
          {/* Barcode Scanner Input (5 cols) */}
          <div className="md:col-span-5">
            <div className="flex items-center justify-between mb-1">
              <label className="text-[10px] font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                <Barcode className="w-3.5 h-3.5 text-teal-400" />
                <span>Barcode Scanner Warranty Lookup</span>
              </label>
            </div>
            <form onSubmit={handleScanSubmit} className="flex gap-2">
              <input
                type="text"
                placeholder="Scan or enter hardware serial to inspect warranty..."
                value={scanSerial}
                onChange={(e) => setScanSerial(e.target.value)}
                className="flex-1 text-xs glass-input rounded-xl px-3 py-2 font-mono font-bold text-teal-300 placeholder:text-slate-500"
              />
              <button
                type="submit"
                className="bg-gradient-to-r from-teal-600 to-teal-500 hover:from-teal-500 hover:to-teal-400 text-slate-950 px-4 py-2 rounded-xl text-xs font-bold shrink-0 shadow-lg shadow-teal-950/40 cursor-pointer transition-all"
              >
                Scan Serial
              </button>
            </form>
          </div>

          {/* Date Range Picker (3 cols) */}
          <div className="md:col-span-3 grid grid-cols-2 gap-2">
            <div>
              <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                From Date
              </label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full text-xs glass-input rounded-xl px-2 py-1.5 text-slate-200"
              />
            </div>
            <div>
              <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                To Date
              </label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full text-xs glass-input rounded-xl px-2 py-1.5 text-slate-200"
              />
            </div>
          </div>

          {/* Payment Tier Filter (2 cols) */}
          <div className="md:col-span-2">
            <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
              Payment Tier
            </label>
            <select
              value={paymentTierFilter}
              onChange={(e) => setPaymentTierFilter(e.target.value)}
              className="w-full text-xs glass-input rounded-xl px-2.5 py-1.5 font-medium text-slate-200 cursor-pointer"
            >
              <option value="all" className="bg-slate-900 text-slate-100">All Payment Tiers</option>
              <option value="Cash" className="bg-slate-900 text-slate-100">Cash Settlement</option>
              <option value="3months" className="bg-slate-900 text-slate-100">3-Mo Deferred Plan</option>
              <option value="12months" className="bg-slate-900 text-slate-100">12-Mo Financed Plan</option>
            </select>
          </div>

          {/* Customer Search (2 cols) */}
          <div className="md:col-span-2">
            <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
              Client Account
            </label>
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-slate-400" />
              <input
                type="text"
                placeholder="Search name..."
                value={searchCustomer}
                onChange={(e) => setSearchCustomer(e.target.value)}
                className="w-full pl-8 pr-2.5 py-1.5 text-xs glass-input rounded-xl placeholder:text-slate-500"
              />
            </div>
          </div>
        </div>

        {/* Quick Diagnostic Test Links */}
        <div className="flex items-center gap-2 pt-2 border-t border-white/[0.08] text-[11px] text-slate-400 flex-wrap">
          <span className="font-bold text-teal-300">Quick Test Scanner:</span>
          <button
            type="button"
            onClick={() => {
              setScanSerial('SN-GPU-4070-SOLD1');
              salesService.getOrders({ serial: 'SN-GPU-4070-SOLD1' }).then((data) => {
                setOrders(data);
                const ex: Record<number, boolean> = {};
                data.forEach((o) => (ex[o.id] = true));
                setExpandedOrders(ex);
              });
            }}
            className="font-mono bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-300 border border-emerald-500/30 px-2.5 py-0.5 rounded-lg font-semibold transition-colors cursor-pointer"
          >
            [Test Active Warranty: SN-GPU-4070-SOLD1]
          </button>
          <button
            type="button"
            onClick={() => {
              setScanSerial('SN-SSD-980-EXPIRED');
              salesService.getOrders({ serial: 'SN-SSD-980-EXPIRED' }).then((data) => {
                setOrders(data);
                const ex: Record<number, boolean> = {};
                data.forEach((o) => (ex[o.id] = true));
                setExpandedOrders(ex);
              });
            }}
            className="font-mono bg-red-500/15 hover:bg-red-500/25 text-red-300 border border-red-500/30 px-2.5 py-0.5 rounded-lg font-semibold transition-colors cursor-pointer"
          >
            [Test Expired Warranty: SN-SSD-980-EXPIRED]
          </button>
          {(scanSerial || startDate || endDate || searchCustomer || paymentTierFilter !== 'all') && (
            <button
              onClick={() => {
                setScanSerial('');
                setStartDate('');
                setEndDate('');
                setSearchCustomer('');
                setPaymentTierFilter('all');
                loadSales();
              }}
              className="text-teal-400 hover:text-teal-300 font-semibold ml-auto transition-colors cursor-pointer"
            >
              Reset Filters
            </button>
          )}
        </div>
      </div>

      {/* Orders List with Real-time Warranty Cards */}
      <div className="space-y-3">
        {filteredOrders.map((order) => {
          const isExpanded = !!expandedOrders[order.id];
          const orderDateFormatted = new Date(order.orderDate).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
          });

          return (
            <div
              key={order.id}
              className="glass-card rounded-2xl border border-white/[0.08] shadow-glass-sm overflow-hidden transition-all"
            >
              {/* Order Header Summary Row */}
              <div
                onClick={() => toggleExpand(order.id)}
                className="p-4 hover:bg-white/[0.04] transition-colors cursor-pointer flex flex-col md:flex-row md:items-center justify-between gap-3 select-none"
              >
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-xl bg-teal-500/15 text-teal-300 border border-teal-500/30 flex flex-col items-center justify-center shrink-0 shadow-glass-xs">
                    <span className="text-[9px] uppercase font-black text-teal-400">INV</span>
                    <span className="font-bold text-xs font-mono">#{order.id}</span>
                  </div>

                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-bold text-sm text-slate-100">
                        {order.customerName}
                      </span>
                      {order.customerCompany && (
                        <span className="text-xs text-slate-400 font-medium">
                          • {order.customerCompany}
                        </span>
                      )}
                      <span className="text-[10px] bg-slate-800/80 text-teal-300 border border-white/[0.08] px-2 py-0.5 rounded-lg font-mono font-medium">
                        {order.paymentMethod}
                      </span>
                    </div>

                    <div className="text-xs text-slate-400 mt-1 flex flex-wrap items-center gap-3">
                      <span>Execution Date: <strong className="text-slate-200">{orderDateFormatted}</strong></span>
                      <span>•</span>
                      <span>Associate: <strong className="text-slate-200">{order.encoder}</strong></span>
                      <span>•</span>
                      <span>Terminal: <strong className="font-mono text-slate-200">{order.computerName}</strong></span>
                      {order.remarks && (
                        <>
                          <span>•</span>
                          <span className="italic text-slate-300 truncate max-w-xs">"{order.remarks}"</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                {/* Right controls */}
                <div className="flex items-center gap-4 self-end md:self-center">
                  <div className="text-right">
                    <div className="text-[10px] uppercase font-bold text-slate-400">Total Billed</div>
                    <div className="text-lg font-black text-slate-100 font-mono tracking-tight drop-shadow-sm">
                      ₱{order.orderAmount.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </div>
                  </div>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedOrderToPrint(order);
                    }}
                    className="flex items-center gap-1.5 text-xs font-semibold text-slate-200 hover:text-white bg-slate-800/80 hover:bg-teal-500/20 border border-white/[0.1] hover:border-teal-400/40 px-3 py-1.5 rounded-xl transition-all shadow-glass-xs cursor-pointer"
                    title="Print Customer Tax Invoice"
                  >
                    <Printer className="w-3.5 h-3.5 text-teal-400" />
                    <span className="hidden sm:inline">Print Receipt</span>
                  </button>

                  <button className="text-slate-400 hover:text-slate-200 p-1 cursor-pointer">
                    {isExpanded ? (
                      <ChevronUp className="w-5 h-5 text-teal-400" />
                    ) : (
                      <ChevronDown className="w-5 h-5 text-slate-400" />
                    )}
                  </button>
                </div>
              </div>

              {/* Nested Items & Warranty Status */}
              {isExpanded && (
                <div className="border-t border-white/[0.08] bg-slate-950/60 p-4 space-y-3 shadow-inner">
                  <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 flex items-center justify-between">
                    <span>Itemized Assets & Warranty Verification Engine</span>
                    <span>{order.items?.length || 0} unit(s) linked to invoice</span>
                  </div>

                  <div className="grid grid-cols-1 gap-2.5">
                    {order.items && order.items.length > 0 ? (
                      order.items.map((item) => {
                        const warrantyInfo = salesService.calculateWarranty(item, order);
                        const isHighlighted =
                          scanSerial &&
                          item.stockSerial.toLowerCase().includes(scanSerial.toLowerCase().trim());

                        return (
                          <div
                            key={item.id}
                            className={`p-3.5 rounded-xl border transition-all flex flex-col md:flex-row md:items-center justify-between gap-3 ${
                              isHighlighted
                                ? 'bg-amber-500/15 border-amber-400/50 ring-2 ring-amber-400/30'
                                : 'bg-slate-900/70 border-white/[0.08] shadow-glass-xs'
                            }`}
                          >
                            {/* Item details */}
                            <div className="space-y-1 min-w-0">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="font-mono text-xs font-bold text-teal-300 bg-slate-950/80 border border-white/[0.08] px-2 py-0.5 rounded-lg">
                                  SN: {item.stockSerial}
                                </span>
                                <span className="text-xs font-semibold text-slate-300 bg-slate-800/80 border border-white/[0.08] px-2 py-0.5 rounded-lg">
                                  {item.stockName}
                                </span>
                                <span className="text-xs text-slate-400 font-medium">
                                  Distributor: <span className="text-slate-300">{item.supplierName}</span>
                                </span>
                              </div>
                              <div className="text-xs font-bold text-slate-100 leading-relaxed">
                                {item.stockDetails}
                              </div>
                              <div className="text-[11px] text-slate-400">
                                Liquidated SRP: <span className="font-mono font-bold text-slate-200">₱{item.stockPrice.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
                              </div>
                            </div>

                            {/* Warranty Status Card & RMA Trigger */}
                            <div className="shrink-0 flex items-center gap-3">
                              {warrantyInfo.isCovered ? (
                                <div className="bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 px-3.5 py-2 rounded-xl text-right shadow-glass-xs">
                                  <div className="flex items-center gap-1.5 font-bold text-xs text-emerald-300 justify-end">
                                    <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                                    <span>WARRANTY COVERED</span>
                                  </div>
                                  <div className="text-[11px] text-emerald-200/90 mt-0.5">
                                    <strong>{warrantyInfo.daysRemaining} days remaining</strong> ({warrantyInfo.daysPassed}d passed of {warrantyInfo.warrantyDays}d)
                                  </div>
                                </div>
                              ) : (
                                <div className="bg-red-500/15 border border-red-500/30 text-red-300 px-3.5 py-2 rounded-xl text-right shadow-glass-xs">
                                  <div className="flex items-center gap-1.5 font-bold text-xs text-red-400 justify-end">
                                    <ShieldAlert className="w-4 h-4 text-red-400 shrink-0" />
                                    <span>WARRANTY EXPIRED</span>
                                  </div>
                                  <div className="text-[11px] text-red-200/90 mt-0.5">
                                    Expired by <strong>{warrantyInfo.daysPassed - warrantyInfo.warrantyDays} days</strong> ({warrantyInfo.daysPassed}d passed vs {warrantyInfo.warrantyDays}d term)
                                  </div>
                                </div>
                              )}

                              {onInitiateRMA && (
                                <button
                                  onClick={() => onInitiateRMA(item.stockSerial, item, order)}
                                  className="flex items-center gap-1 text-[11px] font-semibold text-teal-300 hover:text-slate-950 hover:bg-teal-400 bg-teal-500/20 border border-teal-500/40 px-3 py-2 rounded-xl transition-all cursor-pointer shadow-glass-xs"
                                  title="Initiate Return Merchandise Authorization ticket"
                                >
                                  <RotateCcw className="w-3.5 h-3.5" />
                                  <span>RMA Claim</span>
                                </button>
                              )}
                            </div>
                          </div>
                        );
                      })
                    ) : (
                      <div className="text-xs text-slate-400 p-2 italic">
                        Serials linked: {order.listOfSerials}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          );
        })}

        {filteredOrders.length === 0 && (
          <div className="glass-card rounded-2xl border border-white/[0.08] p-12 text-center text-slate-400 space-y-2">
            <Receipt className="w-10 h-10 mx-auto text-slate-500 stroke-[1.5]" />
            <div className="text-sm font-semibold text-slate-300">No Sales Records Found</div>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              No customer invoices matched your barcode serial search or filter parameters.
            </p>
          </div>
        )}
      </div>

      {/* Invoice Print Modal */}
      {selectedOrderToPrint && (
        <InvoicePrintModal
          order={selectedOrderToPrint}
          onClose={() => setSelectedOrderToPrint(null)}
        />
      )}
    </div>
  );
};
