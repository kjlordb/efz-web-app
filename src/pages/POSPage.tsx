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

  const [isChangingCustomer, setIsChangingCustomer] = useState(false);

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
    const query = barcodeInput.trim().toLowerCase();
    if (!query) return;

    const found = stockItems.find(
      (item) => item.stockSerial.toLowerCase() === query
    );

    if (found) {
      handleAddToCart(found);
      setBarcodeInput('');
      setSearchCatalog('');
      return;
    }

    // If query matches a single item in filtered catalog, add it
    if (filteredCatalog.length === 1) {
      handleAddToCart(filteredCatalog[0]);
      setBarcodeInput('');
      setSearchCatalog('');
      return;
    }

    setErrorMsg(`No in-stock item found matching Serial "${barcodeInput}". Ensure the unit is received into inventory.`);
    setTimeout(() => setErrorMsg(null), 4000);
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

  const categories = Array.from(new Set(stockItems.map((i) => i.stockName)));

  return (
    <div className="space-y-4">
      {/* Notifications */}
      {errorMsg && (
        <div className="bg-red-500/15 border border-red-500/30 text-red-300 px-4 py-3 rounded-xl text-xs flex items-center justify-between shadow-glass-xs animate-fadeIn">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
            <span className="font-semibold">{errorMsg}</span>
          </div>
          <button onClick={() => setErrorMsg(null)} className="text-red-400 hover:text-red-200 text-sm cursor-pointer">×</button>
        </div>
      )}

      {successMsg && (
        <div className="bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 px-4 py-3 rounded-xl text-xs flex items-center justify-between shadow-glass-xs animate-fadeIn">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span className="font-semibold">{successMsg}</span>
          </div>
          <button onClick={() => setSuccessMsg(null)} className="text-emerald-400 hover:text-emerald-200 text-sm cursor-pointer">×</button>
        </div>
      )}

      {/* STEP 1: Customer Profile Bar */}
      <div className="glass-card rounded-2xl p-3 border border-white/[0.06] shadow-glass-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-teal-500/10 border border-teal-500/20 flex items-center justify-center shrink-0 text-teal-400">
              <User className="w-5 h-5" />
            </div>

            {selectedCustomer ? (
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-sm font-bold text-slate-100 truncate">
                    {selectedCustomer.fullName}
                  </span>
                  {selectedCustomer.company ? (
                    <span className="text-[11px] font-medium text-teal-300 bg-teal-500/10 px-2 py-0.5 rounded-md border border-teal-500/20">
                      {selectedCustomer.company}
                    </span>
                  ) : (
                    <span className="text-[11px] text-slate-400 bg-white/[0.04] px-2 py-0.5 rounded-md border border-white/[0.06]">
                      Direct Retail
                    </span>
                  )}
                  <span className="text-xs text-slate-400 font-mono">
                    {selectedCustomer.contactNumber}
                  </span>
                </div>
                <div className="text-[11px] text-slate-400 truncate mt-0.5">
                  {selectedCustomer.address || 'Standard Commercial Billing'}
                </div>
              </div>
            ) : (
              <div>
                <div className="text-sm font-bold text-amber-300">No Client Selected</div>
                <div className="text-xs text-slate-400">Select or register a client to bill this sales order</div>
              </div>
            )}
          </div>

          <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
            <button
              type="button"
              onClick={() => setIsChangingCustomer(!isChangingCustomer)}
              className="text-xs font-semibold px-3 py-1.5 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] text-slate-300 hover:text-white border border-white/[0.08] transition-all cursor-pointer"
            >
              {isChangingCustomer ? 'Done' : 'Change Client'}
            </button>
            <button
              type="button"
              onClick={() => setIsAddCustomerOpen(true)}
              className="text-xs font-semibold px-3 py-1.5 rounded-xl bg-teal-500/15 hover:bg-teal-500/25 text-teal-300 border border-teal-500/30 transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Register Client</span>
            </button>
          </div>
        </div>

        {/* Inline Customer Switcher */}
        {isChangingCustomer && (
          <div className="mt-3 pt-3 border-t border-white/[0.06] flex items-center gap-2 animate-fadeIn">
            <select
              value={selectedCustomerId}
              onChange={(e) => {
                setSelectedCustomerId(Number(e.target.value));
                setIsChangingCustomer(false);
              }}
              className="flex-1 text-xs glass-input rounded-xl px-3 py-2 text-slate-100 cursor-pointer"
            >
              <option value="" className="bg-slate-900 text-slate-300">-- Choose Client Account --</option>
              {customers.map((c) => (
                <option key={c.id} value={c.id} className="bg-slate-900 text-slate-100">
                  {c.fullName} {c.company ? `(${c.company})` : ''} • {c.contactNumber}
                </option>
              ))}
            </select>
            <button
              type="button"
              onClick={() => setIsChangingCustomer(false)}
              className="text-xs text-slate-400 hover:text-white px-2 py-1 cursor-pointer"
            >
              Cancel
            </button>
          </div>
        )}
      </div>

      {/* Main Split: Left = Catalog & Scanner, Right = Cart & Settlement */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* STEP 2 & 3: Catalog & Barcode Scanner (5 cols) */}
        <div className="lg:col-span-5 glass-card rounded-2xl border border-white/[0.06] shadow-glass-sm flex flex-col h-[700px] overflow-hidden">
          {/* Hero Scan / Search Bar */}
          <div className="p-3 border-b border-white/[0.06] bg-slate-950/40 space-y-2.5">
            <form onSubmit={handleBarcodeSubmit} className="relative flex items-center">
              <Barcode className="w-4 h-4 absolute left-3 text-teal-400 pointer-events-none" />
              <input
                ref={barcodeRef}
                type="text"
                placeholder="Scan serial or search hardware... [F2]"
                value={barcodeInput}
                onChange={(e) => {
                  setBarcodeInput(e.target.value);
                  setSearchCatalog(e.target.value);
                }}
                className="w-full text-xs glass-input rounded-xl pl-9 pr-20 py-2.5 font-mono text-slate-100 placeholder:text-slate-500 font-medium"
              />
              <div className="absolute right-1.5 flex items-center gap-1">
                <button
                  type="submit"
                  disabled={!barcodeInput.trim()}
                  className="bg-teal-500 hover:bg-teal-400 disabled:opacity-40 disabled:hover:bg-teal-500 text-slate-950 px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer"
                >
                  Scan
                </button>
              </div>
            </form>

            {/* Category Filter Horizontal Pills */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5 scrollbar-none">
              <button
                type="button"
                onClick={() => setSelectedCategory('All Stocks')}
                className={`pill-filter ${selectedCategory === 'All Stocks' ? 'active' : ''}`}
              >
                All Stocks ({stockItems.length})
              </button>
              {categories.map((cat) => {
                const count = stockItems.filter((i) => i.stockName === cat).length;
                return (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setSelectedCategory(cat)}
                    className={`pill-filter ${selectedCategory === cat ? 'active' : ''}`}
                  >
                    {cat} ({count})
                  </button>
                );
              })}
            </div>

            {/* Quick Simulation Serials Strip */}
            <div className="flex items-center gap-1.5 overflow-x-auto text-[10px] text-slate-400 pt-0.5">
              <span className="shrink-0 text-slate-400 font-medium">Quick Test:</span>
              {stockItems.slice(0, 3).map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => handleAddToCart(item)}
                  className="shrink-0 font-mono bg-white/[0.03] hover:bg-teal-500/15 border border-white/[0.06] hover:border-teal-500/30 text-teal-300 px-2 py-0.5 rounded-md transition-all cursor-pointer"
                  title={item.stockDetails}
                >
                  + {item.stockSerial}
                </button>
              ))}
            </div>
          </div>

          {/* Catalog Items List */}
          <div className="flex-1 overflow-y-auto p-2.5 space-y-2">
            {filteredCatalog.map((item) => {
              const inCart = cart.some((c) => c.id === item.id);
              return (
                <div
                  key={item.id}
                  onClick={() => !inCart && handleAddToCart(item)}
                  className={`p-3 rounded-xl transition-all cursor-pointer flex items-start justify-between gap-3 ${
                    inCart
                      ? 'bg-teal-500/[0.04] border border-teal-500/20 opacity-60 cursor-not-allowed'
                      : 'bg-white/[0.02] hover:bg-white/[0.05] border border-white/[0.05] hover:border-white/[0.1]'
                  }`}
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="text-[10px] font-mono font-bold bg-slate-900/90 text-teal-300 px-1.5 py-0.5 rounded border border-white/[0.06]">
                        {item.stockSerial}
                      </span>
                      <span className="text-[10px] bg-teal-500/10 text-teal-300 font-medium px-1.5 py-0.5 rounded border border-teal-500/20">
                        {item.stockName}
                      </span>
                      <span className="text-[10px] text-slate-400">
                        {item.warranty}d war.
                      </span>
                    </div>

                    <div className="text-xs font-semibold text-slate-100 mt-1 line-clamp-2 leading-relaxed">
                      {item.stockDetails}
                    </div>

                    <div className="text-[11px] text-slate-400 mt-0.5">
                      Distributor: <span className="text-slate-300">{item.supplierName}</span>
                    </div>
                  </div>

                  <div className="text-right shrink-0 flex flex-col items-end justify-between self-stretch">
                    <div className="font-bold text-xs text-slate-100 font-mono">
                      ₱{item.stockPrice.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </div>
                    <button
                      type="button"
                      disabled={inCart}
                      className={`text-[11px] font-semibold px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                        inCart
                          ? 'bg-slate-800 text-slate-400 border border-white/[0.06]'
                          : 'bg-teal-500/20 hover:bg-teal-500/30 text-teal-300 border border-teal-500/30 font-bold'
                      }`}
                    >
                      {inCart ? 'Added' : '+ Add'}
                    </button>
                  </div>
                </div>
              );
            })}

            {filteredCatalog.length === 0 && (
              <div className="h-full flex flex-col items-center justify-center text-center p-8 text-slate-400">
                <Search className="w-8 h-8 text-slate-500 mb-2" />
                <p className="text-xs text-slate-300 font-medium">No hardware assets match your query</p>
                <p className="text-[11px] text-slate-500 mt-0.5">Try clearing filters or scanning a serial directly</p>
              </div>
            )}
          </div>
        </div>

        {/* STEP 4, 5, 6: Cart & Settlement (7 cols) - THE HERO */}
        <div className="lg:col-span-7 glass-card rounded-2xl border border-white/[0.06] shadow-glass-sm flex flex-col h-[700px] overflow-hidden">
          {/* Cart Header */}
          <div className="p-3 border-b border-white/[0.06] bg-slate-950/40 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ShoppingCart className="w-4 h-4 text-teal-400" />
              <span className="text-xs font-bold uppercase tracking-wider text-slate-200">
                Active Sales Order
              </span>
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-teal-500/10 text-teal-300 border border-teal-500/20">
                {cart.length} {cart.length === 1 ? 'unit' : 'units'}
              </span>
            </div>

            {cart.length > 0 && (
              <button
                type="button"
                onClick={handleReset}
                className="text-xs text-red-400 hover:text-red-300 font-semibold flex items-center gap-1 transition-colors cursor-pointer"
              >
                <RotateCcw className="w-3 h-3" />
                <span>Void Order</span>
              </button>
            )}
          </div>

          {/* Cart Items List */}
          <div className="flex-1 overflow-y-auto p-2.5 space-y-1.5">
            {cart.length > 0 ? (
              cart.map((item, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between gap-3 p-2.5 rounded-xl bg-white/[0.02] hover:bg-white/[0.04] border border-white/[0.05] transition-colors"
                >
                  <div className="min-w-0 flex-1">
                    <div className="font-semibold text-xs text-slate-100 truncate">
                      {item.stockDetails}
                    </div>
                    <div className="flex items-center gap-2 mt-0.5 text-[10px] text-slate-400">
                      <span className="font-mono text-teal-300 font-bold bg-slate-900/90 px-1.5 py-0.2 rounded border border-white/[0.06]">
                        {item.stockSerial}
                      </span>
                      <span>{item.stockName}</span>
                      <span>•</span>
                      <span>{item.warranty}d warranty</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 shrink-0">
                    <span className="font-bold text-xs text-slate-100 font-mono">
                      ₱{item.stockPrice.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleRemoveFromCart(idx)}
                      className="text-slate-400 hover:text-red-400 p-1 rounded-lg hover:bg-red-500/10 transition-colors cursor-pointer"
                      title="Remove unit"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-center p-8 text-slate-400 space-y-3">
                <div className="w-12 h-12 rounded-2xl bg-white/[0.03] border border-white/[0.06] flex items-center justify-center text-slate-500">
                  <ShoppingCart className="w-6 h-6 stroke-[1.5]" />
                </div>
                <div>
                  <div className="font-bold text-sm text-slate-200">Your Sales Order is Empty</div>
                  <p className="text-xs max-w-xs text-slate-400 mt-1">
                    Scan barcode serials or pick hardware assets from the catalog to begin checkout.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => barcodeRef.current?.focus()}
                  className="text-xs font-semibold px-3 py-1.5 rounded-xl bg-teal-500/15 hover:bg-teal-500/25 text-teal-300 border border-teal-500/30 transition-all cursor-pointer"
                >
                  Focus Scanner (F2)
                </button>
              </div>
            )}
          </div>

          {/* STEP 5: Progressive Payment & Tendering Section */}
          <div className="p-3.5 bg-slate-950/60 border-t border-white/[0.06] space-y-3 shrink-0">
            {/* Payment Method Selector */}
            <div>
              <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5 flex items-center justify-between">
                <span>Payment Settlement Schedule</span>
                <span className="text-[10px] text-slate-400 font-normal">Select terms</span>
              </div>
              <div className="grid grid-cols-3 gap-2">
                {/* Cash */}
                <button
                  type="button"
                  onClick={() => setPaymentTier('Cash')}
                  className={`p-2 rounded-xl border text-left transition-all cursor-pointer ${
                    paymentTier === 'Cash'
                      ? 'bg-teal-500/15 text-teal-300 border-teal-500/40 shadow-glass-xs'
                      : 'bg-white/[0.02] text-slate-300 border-white/[0.06] hover:bg-white/[0.04]'
                  }`}
                >
                  <div className="text-[9px] font-bold uppercase tracking-wider opacity-80">
                    Spot Cash
                  </div>
                  <div className="font-bold text-xs mt-0.5 font-mono text-slate-100">
                    ₱{p3Cash.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                  </div>
                  <div className="text-[9px] text-slate-400 mt-0.5">Base Net Cash</div>
                </button>

                {/* 3 Months Card */}
                <button
                  type="button"
                  onClick={() => setPaymentTier('3months')}
                  className={`p-2 rounded-xl border text-left transition-all cursor-pointer ${
                    paymentTier === '3months'
                      ? 'bg-teal-500/15 text-teal-300 border-teal-500/40 shadow-glass-xs'
                      : 'bg-white/[0.02] text-slate-300 border-white/[0.06] hover:bg-white/[0.04]'
                  }`}
                >
                  <div className="text-[9px] font-bold uppercase tracking-wider opacity-80">
                    3-Mo Card
                  </div>
                  <div className="font-bold text-xs mt-0.5 font-mono text-slate-100">
                    ₱{p2ThreeMonths.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                  </div>
                  <div className="text-[9px] text-slate-400 mt-0.5">+4% MDR</div>
                </button>

                {/* 12 Months Financing */}
                <button
                  type="button"
                  onClick={() => setPaymentTier('12months')}
                  className={`p-2 rounded-xl border text-left transition-all cursor-pointer ${
                    paymentTier === '12months'
                      ? 'bg-teal-500/15 text-teal-300 border-teal-500/40 shadow-glass-xs'
                      : 'bg-white/[0.02] text-slate-300 border-white/[0.06] hover:bg-white/[0.04]'
                  }`}
                >
                  <div className="text-[9px] font-bold uppercase tracking-wider opacity-80">
                    12-Mo Financing
                  </div>
                  <div className="font-bold text-xs mt-0.5 font-mono text-slate-100">
                    ₱{p1TwelveMonths.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                  </div>
                  <div className="text-[9px] text-slate-400 mt-0.5">+15% APR</div>
                </button>
              </div>
            </div>

            {/* Progressive Disclosure: Cash Tendered vs. Amortization */}
            {paymentTier === 'Cash' ? (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-xs bg-slate-900/40 p-2.5 rounded-xl border border-white/[0.06]">
                <div>
                  <label className="text-[9px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                    Discount (%)
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
                    Amount Tendered (₱)
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
                  <div className="text-xs font-mono font-bold text-emerald-300 bg-emerald-500/10 px-3 py-1.5 rounded-xl border border-emerald-500/20 flex items-center h-[34px]">
                    ₱{changeDue.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                  </div>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs bg-slate-900/40 p-2.5 rounded-xl border border-white/[0.06]">
                <div>
                  <label className="text-[9px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                    Monthly Amortization ({paymentTier === '3months' ? '3 Months' : '12 Months'})
                  </label>
                  <div className="text-xs font-mono font-bold text-teal-300 bg-teal-500/10 px-3 py-1.5 rounded-xl border border-teal-500/20 flex items-center h-[34px]">
                    ₱{(currentPayable / (paymentTier === '3months' ? 3 : 12)).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} / month
                  </div>
                </div>

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
              </div>
            )}

            {/* Cashier & Remarks */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
              <div>
                <label className="text-[9px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                  Cashier Operator
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
                  Invoice Memo / Terms
                </label>
                <input
                  type="text"
                  value={remarks}
                  onChange={(e) => setRemarks(e.target.value)}
                  placeholder="e.g., Verified serial, seal intact"
                  className="w-full text-xs glass-input rounded-xl px-2.5 py-1.5 placeholder:text-slate-500"
                />
              </div>
            </div>

            {/* STEP 6: Total Due & Finalize CTA */}
            <div className="flex items-center justify-between pt-2 border-t border-white/[0.06]">
              <div>
                <div className="text-[9px] uppercase font-bold text-slate-400">
                  Total Due ({paymentTier})
                </div>
                <div className="text-2xl font-black text-slate-100 font-mono tracking-tight">
                  ₱{currentPayable.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </div>
              </div>

              <button
                type="button"
                disabled={cart.length === 0}
                onClick={handleCheckout}
                className="flex items-center gap-2 bg-gradient-to-r from-teal-500 to-emerald-400 hover:from-teal-400 hover:to-emerald-300 disabled:opacity-40 disabled:cursor-not-allowed text-slate-950 font-black text-xs px-6 py-3 rounded-xl shadow-lg shadow-teal-950/30 transition-all cursor-pointer"
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

