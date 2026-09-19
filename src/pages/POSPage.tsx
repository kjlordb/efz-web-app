import React, { useState, useEffect, useRef } from 'react';
import {
  ShoppingCart,
  Search,
  Barcode,
  Plus,
  Trash2,
  Printer,
  RotateCcw,
  User,
  CreditCard,
  CheckCircle2,
  AlertTriangle,
  Info,
  DollarSign,
  Percent,
  Coins,
  Sparkles,
  Zap
} from 'lucide-react';
import { inventoryService, salesService, customerService, DATA_UPDATED_EVENT } from '../services/api';
import { Customer, Order, PaymentMethodType, StockItem } from '../types';
import { InvoicePrintModal } from '../components/modals/InvoicePrintModal';
import { AddCustomerModal } from '../components/modals/AddCustomerModal';
import { useAuth } from '../context/AuthContext';

export const POSPage: React.FC = () => {
  const { currentUser } = useAuth();
  const [stockItems, setStockItems] = useState<StockItem[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [selectedCustomerId, setSelectedCustomerId] = useState<number | ''>('');
  const [cart, setCart] = useState<StockItem[]>([]);
  
  // Search & Filters
  const [searchCatalog, setSearchCatalog] = useState('');
  const [barcodeInput, setBarcodeInput] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All Stocks');

  // Checkout info
  const [paymentTier, setPaymentTier] = useState<PaymentMethodType>('Cash');
  const [preparedBy, setPreparedBy] = useState(currentUser?.name || 'Sales Associate');
  const [remarks, setRemarks] = useState('');
  const [discountPercent, setDiscountPercent] = useState<number>(0);
  const [amountTendered, setAmountTendered] = useState<number | ''>('');

  // Modals & Feedback
  const [isInvoiceOpen, setIsInvoiceOpen] = useState(false);
  const [isAddCustomerOpen, setIsAddCustomerOpen] = useState(false);
  const [completedOrder, setCompletedOrder] = useState<Order | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const barcodeRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (currentUser) {
      setPreparedBy(currentUser.name);
    }
  }, [currentUser]);

  useEffect(() => {
    loadData();
    const handleDataUpdate = () => {
      loadData();
    };
    window.addEventListener(DATA_UPDATED_EVENT, handleDataUpdate);
    return () => window.removeEventListener(DATA_UPDATED_EVENT, handleDataUpdate);
  }, []);

  // Keyboard shortcut listener: F2 focuses barcode input
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'F2') {
        e.preventDefault();
        barcodeRef.current?.focus();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const loadData = async () => {
    try {
      const [items, custs] = await Promise.all([
        inventoryService.getStockItems({ status: 'stored', includeDeleted: false }),
        customerService.getCustomers()
      ]);
      setStockItems(items);
      setCustomers(custs);
      if (custs.length > 0 && selectedCustomerId === '') {
        setSelectedCustomerId(custs[0].id);
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Error loading POS data');
    }
  };

  const selectedCustomer = customers.find((c) => c.id === selectedCustomerId);

  // Cart calculations with discount
  const rawSubtotal = cart.reduce((acc, item) => acc + item.stockPrice, 0);
  const discountMultiplier = discountPercent > 0 ? (100 - discountPercent) / 100 : 1;
  const discountedBase = rawSubtotal * discountMultiplier;

  const p3Cash = Math.round(discountedBase * 100) / 100;
  const p2ThreeMonths = Math.round(discountedBase * 1.04 * 100) / 100;
  const p1TwelveMonths = Math.round(discountedBase * 1.15 * 100) / 100;

  const currentPayable =
    paymentTier === 'Cash'
      ? p3Cash
      : paymentTier === '3months'
      ? p2ThreeMonths
      : p1TwelveMonths;

  // Tendered amount & Change Due
  const numericTendered = Number(amountTendered) || 0;
  const changeDue = Math.max(0, numericTendered - currentPayable);

  // Add item to cart
  const handleAddToCart = (item: StockItem) => {
    if (cart.some((c) => c.id === item.id || c.stockSerial.toLowerCase() === item.stockSerial.toLowerCase())) {
      setErrorMsg(`Hardware unit with Serial "${item.stockSerial}" is already in active transaction.`);
      setTimeout(() => setErrorMsg(null), 3500);
      return;
    }
    setCart((prev) => [...prev, item]);
    setErrorMsg(null);
  };

  const handleRemoveFromCart = (index: number) => {
    setCart((prev) => prev.filter((_, idx) => idx !== index));
  };

  // Barcode / Serial scanner instant add
  const handleBarcodeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!barcodeInput.trim()) return;

    const query = barcodeInput.trim().toLowerCase();
    const found = stockItems.find(
      (item) => item.stockSerial.toLowerCase() === query
    );

    if (!found) {
      setErrorMsg(`No in-stock item found matching Serial "${barcodeInput}". Ensure the unit is received into inventory.`);
      setTimeout(() => setErrorMsg(null), 4000);
      return;
    }

    handleAddToCart(found);
    setBarcodeInput('');
  };

  // Reset order
  const handleReset = () => {
    if (cart.length > 0 && !window.confirm('Void current sales order and clear cart?')) {
      return;
    }
    setCart([]);
    setRemarks('');
    setDiscountPercent(0);
    setAmountTendered('');
    setErrorMsg(null);
    setSuccessMsg(null);
  };

  // Checkout and open print invoice
  const handleCheckout = async () => {
    if (!selectedCustomerId) {
      setErrorMsg('Client account must be selected to generate a commercial tax invoice.');
      return;
    }
    if (cart.length === 0) {
      setErrorMsg('Transaction cart is empty. Please scan or select hardware units.');
      return;
    }
    if (!preparedBy.trim()) {
      setErrorMsg('Authorized Cashier / Sales Associate name is required.');
      return;
    }
    if (paymentTier === 'Cash' && numericTendered > 0 && numericTendered < currentPayable) {
      setErrorMsg(`Insufficient cash tendered: ₱${numericTendered.toLocaleString()} is less than payable ₱${currentPayable.toLocaleString()}.`);
      return;
    }

    try {
      const newOrder = await salesService.createOrder({
        customerId: Number(selectedCustomerId),
        paymentTier,
        remarks,
        encoder: preparedBy,
        computerName: currentUser?.workstation || 'POS-TERM-GUEST',
        discountPercent,
        amountTendered: numericTendered > 0 ? numericTendered : undefined,
        changeDue: numericTendered > 0 ? changeDue : undefined,
        items: cart
      });

      setCompletedOrder(newOrder);
      setIsInvoiceOpen(true);
      setSuccessMsg(`Sales Invoice #${newOrder.id} successfully finalized! Units liquidated from inventory.`);
      
      // Clear cart
      setCart([]);
      setRemarks('');
      setAmountTendered('');
      setDiscountPercent(0);
      loadData();
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to finalize transaction');
    }
  };

  // Filter catalog items
  const filteredCatalog = stockItems.filter((item) => {
    const matchCat =
      selectedCategory === 'All Stocks' ||
      item.stockName.toLowerCase() === selectedCategory.toLowerCase();
    const matchSearch =
      !searchCatalog ||
      item.stockSerial.toLowerCase().includes(searchCatalog.toLowerCase()) ||
      item.stockDetails.toLowerCase().includes(searchCatalog.toLowerCase()) ||
      item.stockName.toLowerCase().includes(searchCatalog.toLowerCase());
    return matchCat && matchSearch;
  });

  return (
    <div className="space-y-4">
      {/* Notifications */}
      {errorMsg && (
        <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-xl text-xs flex items-center justify-between shadow-xs">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-red-600 shrink-0" />
            <span className="font-medium">{errorMsg}</span>
          </div>
          <button onClick={() => setErrorMsg(null)} className="text-red-500 hover:text-red-700 text-sm">×</button>
        </div>
      )}

      {successMsg && (
        <div className="bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 px-4 py-3 rounded-2xl text-xs flex items-center justify-between shadow-glass-xs animate-fadeIn">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span className="font-semibold">{successMsg}</span>
          </div>
          <button onClick={() => setSuccessMsg(null)} className="text-emerald-400 hover:text-emerald-200 text-sm cursor-pointer">×</button>
        </div>
      )}

      {/* Top Section: Client Billing Profile & Barcode Scanner */}
      <div className="glass-card p-4 rounded-2xl border border-white/[0.08] shadow-glass-sm grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Customer Select (7 cols) */}
        <div className="lg:col-span-7 space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
              <User className="w-3.5 h-3.5 text-teal-400" />
              <span>Customer Account (Billed Client)</span>
            </label>
            <button
              type="button"
              onClick={() => setIsAddCustomerOpen(true)}
              className="text-xs text-teal-400 hover:text-teal-300 font-semibold flex items-center gap-1 transition-colors cursor-pointer"
            >
              <Plus className="w-3 h-3" />
              <span>Register New Client</span>
            </button>
          </div>

          <select
            value={selectedCustomerId}
            onChange={(e) => setSelectedCustomerId(Number(e.target.value))}
            className="w-full text-xs glass-input rounded-xl px-3 py-2 font-medium text-slate-200 cursor-pointer"
          >
            <option value="" className="bg-slate-900 text-slate-100">-- Select Registered Client Account --</option>
            {customers.map((c) => (
              <option key={c.id} value={c.id} className="bg-slate-900 text-slate-100">
                {c.fullName} {c.company ? `(${c.company})` : ''} • {c.contactNumber}
              </option>
            ))}
          </select>

          {selectedCustomer && (
            <div className="bg-slate-950/60 p-2.5 rounded-xl border border-white/[0.08] text-xs text-slate-300 grid grid-cols-1 sm:grid-cols-3 gap-2 shadow-inner">
              <div>
                <span className="text-[10px] uppercase text-slate-400 font-bold block">Company / Trade:</span>
                <span className="font-semibold text-slate-100">{selectedCustomer.company || 'Direct Retail'}</span>
              </div>
              <div>
                <span className="text-[10px] uppercase text-slate-400 font-bold block">Contact Line:</span>
                <span className="font-semibold text-slate-100">{selectedCustomer.contactNumber}</span>
              </div>
              <div>
                <span className="text-[10px] uppercase text-slate-400 font-bold block">Billing Address:</span>
                <span className="font-semibold text-slate-100 truncate block" title={selectedCustomer.address}>
                  {selectedCustomer.address || 'Davao City, Philippines'}
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Barcode / Serial Scanner input (5 cols) */}
        <div className="lg:col-span-5 space-y-2 bg-teal-500/10 p-3.5 rounded-xl border border-teal-500/30 flex flex-col justify-between shadow-glass-xs">
          <div>
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold uppercase tracking-wider text-teal-300 flex items-center gap-1.5">
                <Barcode className="w-4 h-4 text-teal-400" />
                <span>Barcode / Serial Number Terminal</span>
              </label>
              <span className="text-[10px] font-mono text-teal-300 bg-teal-500/20 border border-teal-500/40 px-2 py-0.5 rounded-md font-semibold">
                Shortcut: [F2]
              </span>
            </div>
            <p className="text-[11px] text-teal-200/80 mt-0.5">
              Scan barcode serial or type and hit Enter for instant liquidation
            </p>
          </div>

          <form onSubmit={handleBarcodeSubmit} className="flex gap-2 mt-1">
            <input
              ref={barcodeRef}
              type="text"
              placeholder="Scan or enter Serial (e.g., SN-GPU-4070-001)..."
              value={barcodeInput}
              onChange={(e) => setBarcodeInput(e.target.value)}
              className="flex-1 text-xs glass-input rounded-xl px-3 py-2 font-mono font-bold text-teal-300 placeholder:text-slate-500"
            />
            <button
              type="submit"
              className="bg-gradient-to-r from-teal-600 to-teal-500 hover:from-teal-500 hover:to-teal-400 text-slate-950 px-3.5 py-2 rounded-xl text-xs font-bold shadow-lg shadow-teal-950/40 shrink-0 cursor-pointer transition-all"
            >
              Liquidate Unit
            </button>
          </form>

          {/* Quick simulation helper buttons for testing */}
          <div className="flex items-center gap-1.5 overflow-x-auto pt-1 text-[10px] text-slate-400">
            <span className="shrink-0 font-bold text-teal-300">Quick Test:</span>
            {stockItems.slice(0, 3).map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => handleAddToCart(item)}
                className="shrink-0 font-mono bg-slate-900/80 hover:bg-teal-500/20 border border-white/[0.1] hover:border-teal-400/40 text-teal-300 px-2 py-0.5 rounded-lg transition-all cursor-pointer shadow-glass-xs"
                title={item.stockDetails}
              >
                + {item.stockSerial}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main Split: Left = Available Inventory Catalog, Right = Transaction Cart */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Available Stock Catalog (5 cols) */}
        <div className="lg:col-span-5 glass-card rounded-2xl border border-white/[0.08] shadow-glass-sm flex flex-col h-[670px] overflow-hidden">
          <div className="p-3 border-b border-white/[0.08] bg-slate-950/50 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-200">
                In-Stock Hardware Assets ({filteredCatalog.length})
              </span>
              <span className="text-[11px] text-slate-400">Select to add to cart</span>
            </div>

            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-slate-400" />
                <input
                  type="text"
                  placeholder="Filter serial, brand or model specs..."
                  value={searchCatalog}
                  onChange={(e) => setSearchCatalog(e.target.value)}
                  className="w-full pl-8 pr-3 py-1.5 text-xs glass-input rounded-xl placeholder:text-slate-500"
                />
              </div>

              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="text-xs glass-input rounded-xl px-2.5 py-1.5 font-medium text-slate-200 cursor-pointer"
              >
                <option value="All Stocks" className="bg-slate-900 text-slate-100">All Categories</option>
                {Array.from(new Set(stockItems.map((i) => i.stockName))).map((cat) => (
                  <option key={cat} value={cat} className="bg-slate-900 text-slate-100">{cat}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto divide-y divide-white/[0.06] p-1.5">
            {filteredCatalog.map((item) => {
              const inCart = cart.some((c) => c.id === item.id);
              return (
                <div
                  key={item.id}
                  onClick={() => !inCart && handleAddToCart(item)}
                  className={`p-3 rounded-xl text-left transition-all cursor-pointer flex items-start justify-between gap-3 ${
                    inCart
                      ? 'bg-teal-500/10 border border-teal-500/30 opacity-60 cursor-not-allowed'
                      : 'hover:bg-white/[0.04] hover:border-white/[0.1] border border-transparent'
                  }`}
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="text-[10px] font-mono font-bold bg-slate-950/80 text-teal-300 px-2 py-0.5 rounded-lg border border-white/[0.08]">
                        {item.stockSerial}
                      </span>
                      <span className="text-[10px] bg-teal-500/15 text-teal-300 font-semibold px-2 py-0.5 rounded-lg border border-teal-500/30">
                        {item.stockName}
                      </span>
                      <span className="text-[10px] text-slate-400 font-medium">
                        {item.warranty}d warranty
                      </span>
                    </div>
                    <div className="text-xs font-semibold text-slate-200 mt-1 line-clamp-2 leading-relaxed">
                      {item.stockDetails}
                    </div>
                    <div className="text-[11px] text-slate-400 mt-0.5">
                      Distributor: <span className="text-slate-300 font-medium">{item.supplierName}</span>
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <div className="font-bold text-xs text-slate-100 font-mono">
                      ₱{item.stockPrice.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </div>
                    <button
                      disabled={inCart}
                      className={`mt-1.5 text-[11px] font-semibold px-2.5 py-1 rounded-xl transition-all cursor-pointer ${
                        inCart
                          ? 'bg-slate-800 text-slate-400 border border-white/[0.06]'
                          : 'bg-gradient-to-r from-teal-600 to-teal-500 hover:from-teal-500 hover:to-teal-400 text-slate-950 font-bold shadow-md shadow-teal-950/30'
                      }`}
                    >
                      {inCart ? 'Liquidating' : '+ Select'}
                    </button>
                  </div>
                </div>
              );
            })}

            {filteredCatalog.length === 0 && (
              <div className="p-8 text-center text-xs text-slate-400">
                No matching hardware assets found in inventory.
              </div>
            )}
          </div>
        </div>

        {/* Current Order Cart & Multi-Tier Settlement (7 cols) */}
        <div className="lg:col-span-7 glass-card rounded-2xl border border-white/[0.08] shadow-glass-sm flex flex-col h-[670px] overflow-hidden">
          {/* Cart Header */}
          <div className="p-3 border-b border-white/[0.08] bg-slate-950/50 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ShoppingCart className="w-4 h-4 text-teal-400" />
              <span className="text-xs font-bold uppercase tracking-wider text-slate-200">
                Active Order Cart ({cart.length} units staged)
              </span>
            </div>
            {cart.length > 0 && (
              <button
                onClick={handleReset}
                className="text-xs text-red-400 hover:text-red-300 font-semibold flex items-center gap-1 transition-colors cursor-pointer"
              >
                <RotateCcw className="w-3 h-3" />
                <span>Void Order / Reset</span>
              </button>
            )}
          </div>

          {/* Cart Line Items */}
          <div className="flex-1 overflow-y-auto p-2">
            {cart.length > 0 ? (
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-white/[0.08] text-slate-400 text-[10px] uppercase tracking-wider">
                    <th className="py-2.5 px-2.5 font-semibold">Hardware Serial & Model</th>
                    <th className="py-2.5 px-2.5 font-semibold">Category</th>
                    <th className="py-2.5 px-2.5 font-semibold text-center">Warranty</th>
                    <th className="py-2.5 px-2.5 font-semibold text-right">Selling Price</th>
                    <th className="py-2.5 px-2.5 text-center w-8"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/[0.06]">
                  {cart.map((item, idx) => (
                    <tr key={idx} className="hover:bg-white/[0.04] transition-colors">
                      <td className="py-2.5 px-2.5">
                        <div className="font-semibold text-slate-100 leading-tight">
                          {item.stockDetails}
                        </div>
                        <div className="font-mono text-[11px] text-teal-300 font-bold mt-0.5">
                          SN: {item.stockSerial}
                        </div>
                      </td>
                      <td className="py-2.5 px-2.5 text-slate-300">{item.stockName}</td>
                      <td className="py-2.5 px-2.5 text-center text-slate-300">{item.warranty} days</td>
                      <td className="py-2.5 px-2.5 text-right font-bold text-slate-100 font-mono">
                        ₱{item.stockPrice.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                      </td>
                      <td className="py-2.5 px-2.5 text-center">
                        <button
                          onClick={() => handleRemoveFromCart(idx)}
                          className="text-slate-400 hover:text-red-400 p-1 rounded-lg hover:bg-red-500/10 transition-colors cursor-pointer"
                          title="Remove unit"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-center p-8 text-slate-400 space-y-2">
                <ShoppingCart className="w-10 h-10 stroke-[1.5] text-slate-500" />
                <div className="font-bold text-sm text-slate-200">No Hardware Units Staged</div>
                <p className="text-xs max-w-xs text-slate-400">
                  Scan barcode serials or pick from the hardware catalog on the left to begin cashier checkout.
                </p>
              </div>
            )}
          </div>

          {/* Checkout & Multi-Tier Settlement Footer */}
          <div className="p-4 bg-slate-950/60 border-t border-white/[0.08] space-y-3 shrink-0">
            {/* Commercial Pricing Tier Selector */}
            <div>
              <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5 flex items-center justify-between">
                <span>Commercial Settlement Schedule</span>
                <span className="text-[10px] text-slate-400">Financing APR & Merchant Discount Rate</span>
              </div>
              <div className="grid grid-cols-3 gap-2">
                {/* Cash Option */}
                <button
                  type="button"
                  onClick={() => setPaymentTier('Cash')}
                  className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                    paymentTier === 'Cash'
                      ? 'bg-teal-500/20 text-teal-300 border-teal-500/50 shadow-glass-xs shadow-[0_0_15px_rgba(29,130,150,0.25)]'
                      : 'bg-slate-900/60 text-slate-300 border-white/[0.08] hover:bg-white/[0.04]'
                  }`}
                >
                  <div className="text-[9px] font-bold uppercase tracking-wider opacity-80">
                    Spot Cash (Tier 3)
                  </div>
                  <div className="font-bold text-xs mt-0.5 font-mono text-slate-100">
                    ₱{p3Cash.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                  </div>
                  <div className="text-[9px] opacity-75 mt-0.5">Base Net Cash</div>
                </button>

                {/* 3 Months Option */}
                <button
                  type="button"
                  onClick={() => setPaymentTier('3months')}
                  className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                    paymentTier === '3months'
                      ? 'bg-teal-500/20 text-teal-300 border-teal-500/50 shadow-glass-xs shadow-[0_0_15px_rgba(29,130,150,0.25)]'
                      : 'bg-slate-900/60 text-slate-300 border-white/[0.08] hover:bg-white/[0.04]'
                  }`}
                >
                  <div className="text-[9px] font-bold uppercase tracking-wider opacity-80">
                    3-Mo / Credit Card (Tier 2)
                  </div>
                  <div className="font-bold text-xs mt-0.5 font-mono text-slate-100">
                    ₱{p2ThreeMonths.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                  </div>
                  <div className="text-[9px] opacity-75 mt-0.5">4% MDR Surcharge</div>
                </button>

                {/* 12 Months Option */}
                <button
                  type="button"
                  onClick={() => setPaymentTier('12months')}
                  className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                    paymentTier === '12months'
                      ? 'bg-teal-500/20 text-teal-300 border-teal-500/50 shadow-glass-xs shadow-[0_0_15px_rgba(29,130,150,0.25)]'
                      : 'bg-slate-900/60 text-slate-300 border-white/[0.08] hover:bg-white/[0.04]'
                  }`}
                >
                  <div className="text-[9px] font-bold uppercase tracking-wider opacity-80">
                    12-Mo Financing (Tier 1)
                  </div>
                  <div className="font-bold text-xs mt-0.5 font-mono text-slate-100">
                    ₱{p1TwelveMonths.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                  </div>
                  <div className="text-[9px] opacity-75 mt-0.5">15% Financing Premium</div>
                </button>
              </div>
            </div>

            {/* Discount & Cash Tendering Row */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-xs bg-slate-900/50 p-2.5 rounded-xl border border-white/[0.08] shadow-inner">
              <div>
                <label className="text-[9px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                  Promotional Discount (%)
                </label>
                <div className="relative">
                  <Percent className="w-3 h-3 absolute left-2.5 top-2.5 text-slate-400" />
                  <input
                    type="number"
                    min={0}
                    max={100}
                    value={discountPercent || ''}
                    onChange={(e) => setDiscountPercent(Number(e.target.value))}
                    placeholder="0"
                    className="w-full text-xs font-mono glass-input rounded-xl px-2 py-1.5 pl-7 font-bold text-amber-300 placeholder:text-slate-500"
                  />
                </div>
              </div>

              <div>
                <label className="text-[9px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                  Amount Tendered (₱ PHP)
                </label>
                <div className="relative">
                  <Coins className="w-3 h-3 absolute left-2.5 top-2.5 text-slate-400" />
                  <input
                    type="number"
                    value={amountTendered}
                    onChange={(e) => setAmountTendered(e.target.value === '' ? '' : Number(e.target.value))}
                    placeholder={currentPayable.toString()}
                    className="w-full text-xs font-mono glass-input rounded-xl px-2 py-1.5 pl-7 font-bold text-teal-300 placeholder:text-slate-500"
                  />
                </div>
              </div>

              <div>
                <label className="text-[9px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                  Change Due
                </label>
                <div className="text-xs font-mono font-black text-emerald-300 bg-emerald-500/15 px-3 py-1.5 rounded-xl border border-emerald-500/30 flex items-center h-[34px]">
                  ₱{changeDue.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                </div>
              </div>
            </div>

            {/* Cashier & Remarks */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
              <div>
                <label className="text-[9px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                  Cashier / Sales Associate
                </label>
                <input
                  type="text"
                  value={preparedBy}
                  onChange={(e) => setPreparedBy(e.target.value)}
                  className="w-full text-xs glass-input rounded-xl px-2.5 py-1.5"
                />
              </div>

              <div>
                <label className="text-[9px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                  Invoice Memo / Terms of Sale
                </label>
                <input
                  type="text"
                  value={remarks}
                  onChange={(e) => setRemarks(e.target.value)}
                  placeholder="e.g., Client inspection passed, sealed box"
                  className="w-full text-xs glass-input rounded-xl px-2.5 py-1.5 placeholder:text-slate-500"
                />
              </div>
            </div>

            {/* Total Payable & Finalize Button */}
            <div className="flex items-center justify-between pt-2 border-t border-white/[0.08]">
              <div>
                <div className="text-[9px] uppercase font-bold text-slate-400">
                  Total Net Payable ({paymentTier})
                </div>
                <div className="text-2xl font-black text-slate-100 font-mono tracking-tight drop-shadow-sm">
                  ₱{currentPayable.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </div>
              </div>

              <button
                disabled={cart.length === 0}
                onClick={handleCheckout}
                className="flex items-center gap-2 bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-400 hover:to-teal-300 disabled:opacity-40 disabled:cursor-not-allowed text-slate-950 font-black text-xs px-6 py-3 rounded-xl shadow-lg shadow-teal-950/40 transition-all cursor-pointer"
              >
                <Printer className="w-4 h-4 text-slate-950" />
                <span>Finalize & Print Tax Invoice</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Invoice Printable Modal */}
      {isInvoiceOpen && completedOrder && (
        <InvoicePrintModal
          order={completedOrder}
          onClose={() => setIsInvoiceOpen(false)}
        />
      )}

      {/* Add Customer Modal */}
      {isAddCustomerOpen && (
        <AddCustomerModal
          onClose={() => setIsAddCustomerOpen(false)}
          onCustomerAdded={(newCust) => {
            setCustomers((prev) => [newCust, ...prev]);
            setSelectedCustomerId(newCust.id);
            setIsAddCustomerOpen(false);
          }}
        />
      )}
    </div>
  );
};
