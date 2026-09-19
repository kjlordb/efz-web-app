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
        <div className="bg-[#F05D6C]/10 border border-[#F05D6C]/25 text-[#F05D6C] px-4 py-3 rounded-xl text-xs flex items-center justify-between shadow-glass-xs animate-fadeIn">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-[#F05D6C] shrink-0" />
            <span className="font-semibold">{errorMsg}</span>
          </div>
          <button onClick={() => setErrorMsg(null)} className="text-[#F05D6C] hover:opacity-80 text-sm cursor-pointer">×</button>
        </div>
      )}

      {successMsg && (
        <div className="bg-[#20C997]/10 border border-[#20C997]/25 text-[#20C997] px-4 py-3 rounded-xl text-xs flex items-center justify-between shadow-glass-xs animate-fadeIn">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-[#20C997] shrink-0" />
            <span className="font-semibold">{successMsg}</span>
          </div>
          <button onClick={() => setSuccessMsg(null)} className="text-[#20C997] hover:opacity-80 text-sm cursor-pointer">×</button>
        </div>
      )}

      {/* STEP 1: Customer Profile Bar */}
      <div className="customer-panel p-3.5 shadow-glass-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-[rgba(25,195,209,0.10)] border border-[rgba(25,195,209,0.22)] flex items-center justify-center shrink-0 text-[#19C3D1]">
              <User className="w-5 h-5" />
            </div>

            {selectedCustomer ? (
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-sm font-bold text-[#F4F7FB] truncate">
                    {selectedCustomer.fullName}
                  </span>
                  {selectedCustomer.company ? (
                    <span className="text-[11px] font-medium text-[#A9B6C8] bg-[rgba(18,28,45,0.7)] px-2 py-0.5 rounded-md border border-[rgba(148,163,184,0.14)]">
                      {selectedCustomer.company}
                    </span>
                  ) : (
                    <span className="text-[11px] text-[#A9B6C8] bg-[rgba(18,28,45,0.7)] px-2 py-0.5 rounded-md border border-[rgba(148,163,184,0.14)]">
                      Direct Retail
                    </span>
                  )}
                  <span className="text-xs text-[#A9B6C8] font-mono">
                    {selectedCustomer.contactNumber}
                  </span>
                </div>
                <div className="text-[11px] text-[#6F7E92] truncate mt-0.5">
                  {selectedCustomer.address || 'Standard Commercial Billing'}
                </div>
              </div>
            ) : (
              <div>
                <div className="text-sm font-bold text-[#F1C968]">No Client Selected</div>
                <div className="text-xs text-[#A9B6C8]">Select or register a client to bill this sales order</div>
              </div>
            )}
          </div>

          <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
            <button
              type="button"
              onClick={() => setIsChangingCustomer(!isChangingCustomer)}
              className="text-xs font-semibold px-3 py-1.5 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] text-[#19C3D1] hover:text-[#27D7E5] border border-[rgba(148,163,184,0.12)] transition-all cursor-pointer"
            >
              {isChangingCustomer ? 'Done' : 'Change Client'}
            </button>
            <button
              type="button"
              onClick={() => setIsAddCustomerOpen(true)}
              className="text-xs font-semibold px-3 py-1.5 rounded-xl bg-[rgba(25,195,209,0.10)] hover:bg-[rgba(25,195,209,0.18)] text-[#19C3D1] border border-[rgba(25,195,209,0.25)] transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Register Client</span>
            </button>
          </div>
        </div>

        {/* Inline Customer Switcher */}
        {isChangingCustomer && (
          <div className="mt-3 pt-3 border-t border-[rgba(148,163,184,0.10)] flex items-center gap-2 animate-fadeIn">
            <select
              value={selectedCustomerId}
              onChange={(e) => {
                setSelectedCustomerId(Number(e.target.value));
                setIsChangingCustomer(false);
              }}
              className="flex-1 text-xs glass-input rounded-xl px-3 py-2 text-[#F4F7FB] cursor-pointer"
            >
              <option value="" className="bg-[#0B1120] text-[#A9B6C8]">-- Choose Client Account --</option>
              {customers.map((c) => (
                <option key={c.id} value={c.id} className="bg-[#0B1120] text-[#F4F7FB]">
                  {c.fullName} {c.company ? `(${c.company})` : ''} • {c.contactNumber}
                </option>
              ))}
            </select>
            <button
              type="button"
              onClick={() => setIsChangingCustomer(false)}
              className="text-xs text-[#A9B6C8] hover:text-[#F4F7FB] px-2 py-1 cursor-pointer"
            >
              Cancel
            </button>
          </div>
        )}
      </div>

      {/* Main Split: Left = Catalog & Scanner, Right = Cart & Settlement */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* STEP 2 & 3: Catalog & Barcode Scanner (5 cols) */}
        <div className="lg:col-span-5 glass-card rounded-2xl border border-[rgba(148,163,184,0.10)] shadow-glass-sm flex flex-col h-[700px] overflow-hidden">
          {/* Hero Scan / Search Bar */}
          <div className="p-3 border-b border-[rgba(148,163,184,0.10)] bg-[#070B14]/60 space-y-2.5">
            <form onSubmit={handleBarcodeSubmit} className="relative flex items-center scan-hero-box p-0.5">
              <Barcode className="w-4 h-4 absolute left-3 text-[#19C3D1] pointer-events-none" />
              <input
                ref={barcodeRef}
                type="text"
                placeholder="Scan serial or search hardware... [F2]"
                value={barcodeInput}
                onChange={(e) => {
                  setBarcodeInput(e.target.value);
                  setSearchCatalog(e.target.value);
                }}
                className="w-full text-xs bg-transparent rounded-lg pl-9 pr-20 py-2 font-mono text-[#F4F7FB] placeholder:text-[#6F7E92] font-medium outline-none"
              />
              <div className="absolute right-1.5 flex items-center gap-1">
                <button
                  type="submit"
                  disabled={!barcodeInput.trim()}
                  className="bg-[#19C3D1] hover:bg-[#27D7E5] disabled:opacity-30 disabled:hover:bg-[#19C3D1] text-[#070B14] px-2.5 py-1 rounded-md text-xs font-bold transition-all cursor-pointer"
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
            <div className="flex items-center gap-1.5 overflow-x-auto text-[10px] text-[#A9B6C8] pt-0.5">
              <span className="shrink-0 text-[#6F7E92] font-medium">Quick Test:</span>
              {stockItems.slice(0, 3).map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => handleAddToCart(item)}
                  className="shrink-0 font-mono bg-[#121C2D]/60 hover:bg-[rgba(25,195,209,0.12)] border border-[rgba(148,163,184,0.10)] hover:border-[rgba(25,195,209,0.25)] text-[#19C3D1] px-2 py-0.5 rounded-md transition-all cursor-pointer"
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
                  className={`card-product p-3 cursor-pointer flex items-start justify-between gap-3 ${
                    inCart
                      ? 'opacity-50 cursor-not-allowed border-[rgba(25,195,209,0.20)]'
                      : ''
                  }`}
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="text-[10px] font-mono font-bold bg-[#070B14] text-[#19C3D1] px-1.5 py-0.5 rounded border border-[rgba(148,163,184,0.10)]">
                        {item.stockSerial}
                      </span>
                      <span className="text-[10px] bg-[rgba(25,195,209,0.10)] text-[#19C3D1] font-medium px-1.5 py-0.5 rounded border border-[rgba(25,195,209,0.20)]">
                        {item.stockName}
                      </span>
                      <span className="text-[10px] text-[#A9B6C8]">
                        {item.warranty}d war.
                      </span>
                    </div>

                    <div className="text-xs font-semibold text-[#F4F7FB] mt-1 line-clamp-2 leading-relaxed">
                      {item.stockDetails}
                    </div>

                    <div className="text-[11px] text-[#6F7E92] mt-0.5">
                      Distributor: <span className="text-[#A9B6C8]">{item.supplierName}</span>
                    </div>
                  </div>

                  <div className="text-right shrink-0 flex flex-col items-end justify-between self-stretch">
                    {/* Normal Product Price: #F4F7FB */}
                    <div className="font-bold text-xs text-[#F4F7FB] font-mono">
                      ₱{item.stockPrice.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </div>
                    <button
                      type="button"
                      disabled={inCart}
                      className={`text-[11px] font-semibold px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                        inCart
                          ? 'bg-[#0B1120] text-[#6F7E92] border border-[rgba(148,163,184,0.10)]'
                          : 'bg-[rgba(25,195,209,0.12)] hover:bg-[rgba(25,195,209,0.22)] text-[#19C3D1] border border-[rgba(25,195,209,0.25)] font-bold'
                      }`}
                    >
                      {inCart ? 'Added' : '+ Add'}
                    </button>
                  </div>
                </div>
              );
            })}

            {filteredCatalog.length === 0 && (
              <div className="h-full flex flex-col items-center justify-center text-center p-8 text-[#A9B6C8]">
                <Search className="w-8 h-8 text-[#6F7E92] mb-2" />
                <p className="text-xs text-[#F4F7FB] font-medium">No hardware assets match your query</p>
                <p className="text-[11px] text-[#6F7E92] mt-0.5">Try clearing filters or scanning a serial directly</p>
              </div>
            )}
          </div>
        </div>

        {/* STEP 4, 5, 6: Cart & Settlement (7 cols) - THE HERO */}
        <div className="lg:col-span-7 cart-hero rounded-2xl border border-[rgba(148,163,184,0.16)] shadow-glass-sm flex flex-col h-[700px] overflow-hidden">
          {/* Cart Header */}
          <div className="p-3 border-b border-[rgba(148,163,184,0.12)] bg-[#070B14]/60 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ShoppingCart className="w-4 h-4 text-[#19C3D1]" />
              <span className="text-xs font-bold uppercase tracking-wider text-[#F4F7FB]">
                Active Sales Order
              </span>
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-[rgba(25,195,209,0.10)] text-[#19C3D1] border border-[rgba(25,195,209,0.20)]">
                {cart.length} {cart.length === 1 ? 'unit' : 'units'}
              </span>
            </div>

            {cart.length > 0 && (
              <button
                type="button"
                onClick={handleReset}
                className="text-xs text-[#F05D6C] hover:opacity-80 font-semibold flex items-center gap-1 transition-colors cursor-pointer"
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
                  className="flex items-center justify-between gap-3 p-2.5 rounded-xl bg-[#070B14]/40 hover:bg-[#121C2D]/50 border border-[rgba(148,163,184,0.08)] transition-colors"
                >
                  <div className="min-w-0 flex-1">
                    <div className="font-semibold text-xs text-[#F4F7FB] truncate">
                      {item.stockDetails}
                    </div>
                    <div className="flex items-center gap-2 mt-0.5 text-[10px] text-[#A9B6C8]">
                      <span className="font-mono text-[#19C3D1] font-bold bg-[#070B14] px-1.5 py-0.2 rounded border border-[rgba(148,163,184,0.10)]">
                        {item.stockSerial}
                      </span>
                      <span>{item.stockName}</span>
                      <span>•</span>
                      <span>{item.warranty}d warranty</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 shrink-0">
                    <span className="font-bold text-xs text-[#F4F7FB] font-mono">
                      ₱{item.stockPrice.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleRemoveFromCart(idx)}
                      className="text-[#6F7E92] hover:text-[#F05D6C] p-1 rounded-lg hover:bg-red-500/10 transition-colors cursor-pointer"
                      title="Remove unit"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-center p-8 text-[#A9B6C8] space-y-3">
                <div className="w-12 h-12 rounded-2xl bg-[#070B14]/60 border border-[rgba(148,163,184,0.10)] flex items-center justify-center text-[#6F7E92]">
                  <ShoppingCart className="w-6 h-6 stroke-[1.5]" />
                </div>
                <div>
                  <div className="font-bold text-sm text-[#F4F7FB]">Your Sales Order is Empty</div>
                  <p className="text-xs max-w-xs text-[#A9B6C8] mt-1">
                    Scan barcode serials or pick hardware assets from the catalog to begin checkout.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => barcodeRef.current?.focus()}
                  className="text-xs font-semibold px-3 py-1.5 rounded-xl bg-[rgba(25,195,209,0.12)] hover:bg-[rgba(25,195,209,0.20)] text-[#19C3D1] border border-[rgba(25,195,209,0.25)] transition-all cursor-pointer"
                >
                  Focus Scanner (F2)
                </button>
              </div>
            )}
          </div>

          {/* STEP 5: Progressive Payment & Tendering Section */}
          <div className="p-3.5 bg-[#070B14]/80 border-t border-[rgba(148,163,184,0.12)] space-y-3 shrink-0">
            {/* Payment Method Selector */}
            <div>
              <div className="text-[10px] font-bold uppercase tracking-wider text-[#A9B6C8] mb-1.5 flex items-center justify-between">
                <span>Payment Settlement Schedule</span>
                <span className="text-[10px] text-[#6F7E92] font-normal">Select terms</span>
              </div>
              <div className="grid grid-cols-3 gap-2">
                {/* Cash */}
                <button
                  type="button"
                  onClick={() => setPaymentTier('Cash')}
                  className={`p-2 rounded-xl border text-left transition-all cursor-pointer ${
                    paymentTier === 'Cash'
                      ? 'bg-[rgba(25,195,209,0.10)] text-[#19C3D1] border-[rgba(25,195,209,0.40)] shadow-glass-xs'
                      : 'bg-[rgba(18,28,45,0.55)] text-[#A9B6C8] border-[rgba(148,163,184,0.12)] hover:border-[rgba(25,195,209,0.25)]'
                  }`}
                >
                  <div className="text-[9px] font-bold uppercase tracking-wider opacity-80">
                    Spot Cash
                  </div>
                  <div className="font-bold text-xs mt-0.5 font-mono text-[#F4F7FB]">
                    ₱{p3Cash.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                  </div>
                  <div className="text-[9px] text-[#6F7E92] mt-0.5">Base Net Cash</div>
                </button>

                {/* 3 Months Card */}
                <button
                  type="button"
                  onClick={() => setPaymentTier('3months')}
                  className={`p-2 rounded-xl border text-left transition-all cursor-pointer ${
                    paymentTier === '3months'
                      ? 'bg-[rgba(25,195,209,0.10)] text-[#19C3D1] border-[rgba(25,195,209,0.40)] shadow-glass-xs'
                      : 'bg-[rgba(18,28,45,0.55)] text-[#A9B6C8] border-[rgba(148,163,184,0.12)] hover:border-[rgba(25,195,209,0.25)]'
                  }`}
                >
                  <div className="text-[9px] font-bold uppercase tracking-wider opacity-80">
                    3-Mo Card
                  </div>
                  <div className="font-bold text-xs mt-0.5 font-mono text-[#F4F7FB]">
                    ₱{p2ThreeMonths.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                  </div>
                  <div className="text-[9px] text-[#6F7E92] mt-0.5">+4% MDR</div>
                </button>

                {/* 12 Months Financing */}
                <button
                  type="button"
                  onClick={() => setPaymentTier('12months')}
                  className={`p-2 rounded-xl border text-left transition-all cursor-pointer ${
                    paymentTier === '12months'
                      ? 'bg-[rgba(25,195,209,0.10)] text-[#19C3D1] border-[rgba(25,195,209,0.40)] shadow-glass-xs'
                      : 'bg-[rgba(18,28,45,0.55)] text-[#A9B6C8] border-[rgba(148,163,184,0.12)] hover:border-[rgba(25,195,209,0.25)]'
                  }`}
                >
                  <div className="text-[9px] font-bold uppercase tracking-wider opacity-80">
                    12-Mo Financing
                  </div>
                  <div className="font-bold text-xs mt-0.5 font-mono text-[#F4F7FB]">
                    ₱{p1TwelveMonths.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                  </div>
                  <div className="text-[9px] text-[#6F7E92] mt-0.5">+15% APR</div>
                </button>
              </div>
            </div>

            {/* Progressive Disclosure: Cash Tendered vs. Amortization */}
            {paymentTier === 'Cash' ? (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-xs bg-[#0B1120]/60 p-2.5 rounded-xl border border-[rgba(148,163,184,0.10)]">
                <div>
                  <label className="text-[9px] font-bold uppercase tracking-wider text-[#A9B6C8] block mb-1">
                    Discount (%)
                  </label>
                  <div className="relative">
                    <Percent className="w-3 h-3 absolute left-2.5 top-2.5 text-[#6F7E92]" />
                    <input
                      type="number"
                      min={0}
                      max={100}
                      value={discountPercent || ''}
                      onChange={(e) => setDiscountPercent(Number(e.target.value))}
                      placeholder="0"
                      className="w-full text-xs font-mono glass-input rounded-xl px-2 py-1.5 pl-7 font-bold text-[#F1C968] placeholder:text-[#6F7E92]"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[9px] font-bold uppercase tracking-wider text-[#A9B6C8] block mb-1">
                    Amount Tendered (₱)
                  </label>
                  <div className="relative">
                    <Coins className="w-3 h-3 absolute left-2.5 top-2.5 text-[#6F7E92]" />
                    <input
                      type="number"
                      value={amountTendered}
                      onChange={(e) => setAmountTendered(e.target.value === '' ? '' : Number(e.target.value))}
                      placeholder={currentPayable.toString()}
                      className="w-full text-xs font-mono glass-input rounded-xl px-2 py-1.5 pl-7 font-bold text-[#19C3D1] placeholder:text-[#6F7E92]"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[9px] font-bold uppercase tracking-wider text-[#A9B6C8] block mb-1">
                    Change Due
                  </label>
                  <div className="text-xs font-mono font-bold text-[#20C997] bg-[#20C997]/10 px-3 py-1.5 rounded-xl border border-[#20C997]/20 flex items-center h-[34px]">
                    ₱{changeDue.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                  </div>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs bg-[#0B1120]/60 p-2.5 rounded-xl border border-[rgba(148,163,184,0.10)]">
                <div>
                  <label className="text-[9px] font-bold uppercase tracking-wider text-[#A9B6C8] block mb-1">
                    Monthly Amortization ({paymentTier === '3months' ? '3 Months' : '12 Months'})
                  </label>
                  <div className="text-xs font-mono font-bold text-[#19C3D1] bg-[rgba(25,195,209,0.10)] px-3 py-1.5 rounded-xl border border-[rgba(25,195,209,0.20)] flex items-center h-[34px]">
                    ₱{(currentPayable / (paymentTier === '3months' ? 3 : 12)).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} / month
                  </div>
                </div>

                <div>
                  <label className="text-[9px] font-bold uppercase tracking-wider text-[#A9B6C8] block mb-1">
                    Promotional Discount (%)
                  </label>
                  <div className="relative">
                    <Percent className="w-3 h-3 absolute left-2.5 top-2.5 text-[#6F7E92]" />
                    <input
                      type="number"
                      min={0}
                      max={100}
                      value={discountPercent || ''}
                      onChange={(e) => setDiscountPercent(Number(e.target.value))}
                      placeholder="0"
                      className="w-full text-xs font-mono glass-input rounded-xl px-2 py-1.5 pl-7 font-bold text-[#F1C968] placeholder:text-[#6F7E92]"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Cashier & Remarks */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
              <div>
                <label className="text-[9px] font-bold uppercase tracking-wider text-[#A9B6C8] block mb-1">
                  Cashier Operator
                </label>
                <input
                  type="text"
                  value={preparedBy}
                  onChange={(e) => setPreparedBy(e.target.value)}
                  className="w-full text-xs glass-input rounded-xl px-2.5 py-1.5 text-[#F4F7FB]"
                />
              </div>

              <div>
                <label className="text-[9px] font-bold uppercase tracking-wider text-[#A9B6C8] block mb-1">
                  Invoice Memo / Terms
                </label>
                <input
                  type="text"
                  value={remarks}
                  onChange={(e) => setRemarks(e.target.value)}
                  placeholder="e.g., Verified serial, seal intact"
                  className="w-full text-xs glass-input rounded-xl px-2.5 py-1.5 text-[#F4F7FB] placeholder:text-[#6F7E92]"
                />
              </div>
            </div>

            {/* STEP 6: Total Due & Finalize CTA */}
            <div className="flex items-center justify-between pt-2 border-t border-[rgba(148,163,184,0.12)]">
              <div>
                <div className="text-[9px] uppercase font-bold text-[#A9B6C8]">
                  Total Due ({paymentTier})
                </div>
                {/* Final Amount Due in Champagne Gold Light #F1C968 */}
                <div className="text-2xl font-black text-[#F1C968] font-mono tracking-tight">
                  ₱{currentPayable.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </div>
              </div>

              <button
                type="button"
                disabled={cart.length === 0}
                onClick={handleCheckout}
                className="btn-finalize-sale flex items-center gap-2 disabled:opacity-30 disabled:cursor-not-allowed font-black text-xs px-6 py-3 rounded-xl cursor-pointer"
              >
                <Printer className="w-4 h-4 text-white" />
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

