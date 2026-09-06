import React, { useState, useEffect } from 'react';
import {
  FileText,
  Plus,
  Trash2,
  Printer,
  User,
  Calculator,
  Search,
  CheckCircle2,
  AlertCircle,
  Eye,
  CreditCard
} from 'lucide-react';
import { quotationService, customerService, inventoryService, DATA_UPDATED_EVENT } from '../services/api';
import { CATEGORIES } from '../services/mockData';
import { Customer, QuotationDetailItem, QuotationHeader, StockItem } from '../types';
import { QuotationPrintModal } from '../components/modals/QuotationPrintModal';
import { AddCustomerModal } from '../components/modals/AddCustomerModal';
import { useAuth } from '../context/AuthContext';

export const QuotationPage: React.FC = () => {
  const { currentUser } = useAuth();
  const [quotations, setQuotations] = useState<QuotationHeader[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [selectedCustomerId, setSelectedCustomerId] = useState<number | ''>('');
  const [stockItems, setStockItems] = useState<StockItem[]>([]);

  // Quote form state
  const [quoteItems, setQuoteItems] = useState<QuotationDetailItem[]>([
    {
      stockName: 'Graphics Card',
      stockDetails: 'ASUS TUF Gaming GeForce RTX 4070 SUPER OC Edition 12GB GDDR6X',
      quantity: 1,
      stockPrice: 42500,
      subTotal: 42500
    }
  ]);
  const [remarks, setRemarks] = useState('Official quotation valid for 7 days from issue date.');
  const [encoder, setEncoder] = useState(currentUser?.name || 'Kyle (Admin)');

  useEffect(() => {
    if (currentUser) {
      setEncoder(currentUser.name);
    }
  }, [currentUser]);

  useEffect(() => {
    loadInitial();
    const handleUpdate = () => {
      loadInitial();
    };
    window.addEventListener(DATA_UPDATED_EVENT, handleUpdate);
    return () => window.removeEventListener(DATA_UPDATED_EVENT, handleUpdate);
  }, []);

  // New item inputs
  const [newItemCat, setNewItemCat] = useState(CATEGORIES[0]);
  const [newItemSpecs, setNewItemSpecs] = useState('');
  const [newItemQty, setNewItemQty] = useState(1);
  const [newItemPrice, setNewItemPrice] = useState(0);

  // Modals
  const [printQuote, setPrintQuote] = useState<QuotationHeader | null>(null);
  const [isAddCustModalOpen, setIsAddCustModalOpen] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);

  useEffect(() => {
    loadInitial();
  }, []);

  const loadInitial = async () => {
    const [qList, cList, sList] = await Promise.all([
      quotationService.getQuotations(),
      customerService.getCustomers(),
      inventoryService.getStockItems({ status: 'stored' })
    ]);
    setQuotations(qList);
    setCustomers(cList);
    setStockItems(sList);
    if (cList.length > 0 && selectedCustomerId === '') {
      setSelectedCustomerId(cList[0].id);
    }
  };

  const selectedCustomer = customers.find((c) => c.id === selectedCustomerId);

  // Add line item
  const handleAddLineItem = () => {
    if (!newItemSpecs.trim()) return;
    const price = Number(newItemPrice) || 0;
    const qty = Math.max(1, Number(newItemQty) || 1);

    const item: QuotationDetailItem = {
      stockName: newItemCat,
      stockDetails: newItemSpecs.trim(),
      quantity: qty,
      stockPrice: price,
      subTotal: price * qty
    };

    setQuoteItems((prev) => [...prev, item]);
    setNewItemSpecs('');
    setNewItemPrice(0);
    setNewItemQty(1);
  };

  const handleRemoveLineItem = (idx: number) => {
    setQuoteItems((prev) => prev.filter((_, i) => i !== idx));
  };

  // 3-tier financing calculation
  const cashBaseTotal = quoteItems.reduce((acc, i) => acc + i.subTotal, 0);
  const threeMonthsTotal = Math.round(cashBaseTotal * 1.04 * 100) / 100;
  const twelveMonthsTotal = Math.round(cashBaseTotal * 1.15 * 100) / 100;

  // Save quotation
  const handleCreateQuote = async () => {
    if (!selectedCustomerId) {
      alert('Please select a customer for this quotation.');
      return;
    }
    if (quoteItems.length === 0) {
      alert('Add at least one line item to the quotation.');
      return;
    }

    try {
      const saved = await quotationService.createQuotation({
        customerId: Number(selectedCustomerId),
        remarks,
        encoder,
        items: quoteItems.map((i) => ({
          stockName: i.stockName,
          stockDetails: i.stockDetails,
          quantity: i.quantity,
          stockPrice: i.stockPrice
        }))
      });

      setQuotations((prev) => [saved, ...prev]);
      setPrintQuote(saved);
      setFeedback(`Quotation #${saved.quotationId} generated successfully!`);
      setTimeout(() => setFeedback(null), 4000);
    } catch (err: any) {
      alert(err.message || 'Error generating quote');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <FileText className="w-5 h-5 text-teal-700" />
            <span>Price Quotation Generator</span>
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Prepare customized hardware quotations with automated 3-tier payment options (Cash, 3-Mo, 12-Mo)
          </p>
        </div>

        {feedback && (
          <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs px-3 py-1.5 rounded-lg flex items-center gap-1.5 font-medium">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>{feedback}</span>
          </div>
        )}
      </div>

      {/* Main Grid: Quote Builder (Left 7) & History / Previous Quotes (Right 5) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Quote Builder Form */}
        <div className="lg:col-span-8 bg-white rounded-xl border border-slate-200 shadow-sm p-5 space-y-5">
          {/* Customer Selection */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-teal-600" />
                <span>Customer Information</span>
              </label>
              <button
                type="button"
                onClick={() => setIsAddCustModalOpen(true)}
                className="text-xs text-teal-700 hover:text-teal-900 font-semibold flex items-center gap-1"
              >
                <Plus className="w-3 h-3" />
                <span>New Customer</span>
              </button>
            </div>

            <select
              value={selectedCustomerId}
              onChange={(e) => setSelectedCustomerId(Number(e.target.value))}
              className="w-full text-xs border border-slate-300 rounded-lg px-3 py-2 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500 font-medium text-slate-800"
            >
              <option value="">-- Select Customer --</option>
              {customers.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.fullName} {c.company ? `(${c.company})` : ''} - {c.contactNumber}
                </option>
              ))}
            </select>

            {selectedCustomer && (
              <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200 text-xs text-slate-600 grid grid-cols-1 sm:grid-cols-3 gap-2">
                <div>
                  <span className="text-[10px] uppercase text-slate-400 font-bold block">Company:</span>
                  <span className="font-medium text-slate-800">{selectedCustomer.company || 'N/A'}</span>
                </div>
                <div>
                  <span className="text-[10px] uppercase text-slate-400 font-bold block">Email:</span>
                  <span className="font-medium text-slate-800">{selectedCustomer.email || 'N/A'}</span>
                </div>
                <div>
                  <span className="text-[10px] uppercase text-slate-400 font-bold block">Address:</span>
                  <span className="font-medium text-slate-800 truncate block">{selectedCustomer.address || 'N/A'}</span>
                </div>
              </div>
            )}
          </div>

          {/* Add Line Item Controls */}
          <div className="bg-teal-50/50 p-3.5 rounded-xl border border-teal-100 space-y-2">
            <div className="text-xs font-bold uppercase tracking-wider text-teal-900">
              Add Hardware Item to Quotation
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-12 gap-2 text-xs">
              <div className="sm:col-span-3">
                <label className="text-[10px] font-bold text-slate-500 block mb-1">Category</label>
                <select
                  value={newItemCat}
                  onChange={(e) => setNewItemCat(e.target.value)}
                  className="w-full text-xs border border-teal-200 rounded-lg px-2.5 py-1.5 bg-white"
                >
                  {CATEGORIES.map((cat) => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>

              <div className="sm:col-span-5">
                <label className="text-[10px] font-bold text-slate-500 block mb-1">Specifications / Model</label>
                <input
                  type="text"
                  placeholder="e.g. Intel Core i7-14700K 20-Core..."
                  value={newItemSpecs}
                  onChange={(e) => setNewItemSpecs(e.target.value)}
                  className="w-full text-xs border border-teal-200 rounded-lg px-2.5 py-1.5 bg-white"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="text-[10px] font-bold text-slate-500 block mb-1">Unit Price (₱)</label>
                <input
                  type="number"
                  placeholder="0.00"
                  value={newItemPrice || ''}
                  onChange={(e) => setNewItemPrice(Number(e.target.value))}
                  className="w-full text-xs border border-teal-200 rounded-lg px-2.5 py-1.5 bg-white font-mono"
                />
              </div>

              <div className="sm:col-span-2 flex items-end">
                <button
                  type="button"
                  onClick={handleAddLineItem}
                  className="w-full bg-teal-700 hover:bg-teal-800 text-white font-bold py-1.5 px-3 rounded-lg text-xs shadow-sm transition-all"
                >
                  + Add Line
                </button>
              </div>
            </div>
          </div>

          {/* Line Items Table */}
          <div>
            <div className="text-xs font-bold uppercase tracking-wider text-slate-600 mb-2">
              Quotation Line Items ({quoteItems.length})
            </div>

            <div className="border border-slate-200 rounded-lg overflow-hidden">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 text-[10px] uppercase">
                    <th className="py-2.5 px-3">Item Description</th>
                    <th className="py-2.5 px-3">Category</th>
                    <th className="py-2.5 px-3 text-center">Qty</th>
                    <th className="py-2.5 px-3 text-right">Unit Price</th>
                    <th className="py-2.5 px-3 text-right">Subtotal</th>
                    <th className="py-2.5 px-2 text-center w-10"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {quoteItems.map((item, idx) => (
                    <tr key={idx} className="hover:bg-slate-50/70">
                      <td className="py-2 px-3 font-medium text-slate-800">{item.stockDetails}</td>
                      <td className="py-2 px-3 text-slate-500">{item.stockName}</td>
                      <td className="py-2 px-3 text-center font-bold text-slate-700">{item.quantity}</td>
                      <td className="py-2 px-3 text-right font-mono text-slate-600">
                        ₱{item.stockPrice.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                      </td>
                      <td className="py-2 px-3 text-right font-mono font-bold text-slate-900">
                        ₱{item.subTotal.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                      </td>
                      <td className="py-2 px-2 text-center">
                        <button
                          onClick={() => handleRemoveLineItem(idx)}
                          className="text-slate-400 hover:text-red-600 p-1"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                  {quoteItems.length === 0 && (
                    <tr>
                      <td colSpan={6} className="py-6 text-center text-slate-400 italic">
                        No line items added yet.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* 3-Tier Pricing Preview matching Crystal Report Quotation template */}
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
            <div className="text-[11px] font-bold uppercase tracking-wider text-slate-600 flex items-center justify-between">
              <span>Automatic 3-Tier Financing Structure</span>
              <span className="text-[10px] text-slate-400 font-normal">Included on formal quotation printout</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="bg-white p-3 rounded-lg border border-slate-200 shadow-sm">
                <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Tier 3: Cash Price
                </div>
                <div className="text-lg font-black text-slate-900 mt-1 font-mono">
                  ₱{cashBaseTotal.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                </div>
                <div className="text-[10px] text-slate-500 mt-0.5">Base net cash price</div>
              </div>

              <div className="bg-white p-3 rounded-lg border border-slate-200 shadow-sm">
                <div className="text-[10px] font-bold uppercase tracking-wider text-teal-700">
                  Tier 2: 3-Mo / Credit Card
                </div>
                <div className="text-lg font-black text-teal-900 mt-1 font-mono">
                  ₱{threeMonthsTotal.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                </div>
                <div className="text-[10px] text-teal-700/80 mt-0.5">4% surcharge ($1.04\times$)</div>
              </div>

              <div className="bg-white p-3 rounded-lg border border-slate-200 shadow-sm">
                <div className="text-[10px] font-bold uppercase tracking-wider text-slate-600">
                  Tier 1: 12-Mo Installment
                </div>
                <div className="text-lg font-black text-slate-900 mt-1 font-mono">
                  ₱{twelveMonthsTotal.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                </div>
                <div className="text-[10px] text-slate-500 mt-0.5">15% surcharge ($1.15\times$)</div>
              </div>
            </div>

            {/* Remarks and Encoder */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 text-xs">
              <div>
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block mb-1">
                  Prepared By
                </label>
                <input
                  type="text"
                  value={encoder}
                  onChange={(e) => setEncoder(e.target.value)}
                  className="w-full text-xs border border-slate-300 rounded-lg px-2.5 py-1.5 bg-white"
                />
              </div>
              <div>
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block mb-1">
                  Quotation Validity / Remarks
                </label>
                <input
                  type="text"
                  value={remarks}
                  onChange={(e) => setRemarks(e.target.value)}
                  className="w-full text-xs border border-slate-300 rounded-lg px-2.5 py-1.5 bg-white"
                />
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                type="button"
                disabled={quoteItems.length === 0}
                onClick={handleCreateQuote}
                className="flex items-center gap-2 bg-teal-700 hover:bg-teal-800 disabled:bg-slate-300 text-white font-bold text-xs px-6 py-2.5 rounded-lg shadow transition-all"
              >
                <Printer className="w-4 h-4" />
                <span>Generate & Print Formal Quotation</span>
              </button>
            </div>
          </div>
        </div>

        {/* Previous Quotations List */}
        <div className="lg:col-span-4 bg-white rounded-xl border border-slate-200 shadow-sm p-4 flex flex-col h-[700px]">
          <div className="border-b border-slate-100 pb-3 mb-3">
            <h2 className="font-bold text-sm text-slate-800">Saved Quotations</h2>
            <p className="text-xs text-slate-500">History of quotations generated for clients</p>
          </div>

          <div className="flex-1 overflow-y-auto space-y-3 pr-1">
            {quotations.map((q) => (
              <div
                key={q.quotationId}
                className="p-3 rounded-lg border border-slate-200 hover:border-teal-400 bg-white hover:bg-teal-50/30 transition-all space-y-1.5"
              >
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs font-bold text-teal-800">
                    Quote #{q.quotationId}
                  </span>
                  <span className="text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded font-medium">
                    {new Date(q.quotationDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                  </span>
                </div>

                <div className="text-xs font-bold text-slate-800">
                  {q.customerName}
                </div>

                <div className="text-[11px] text-slate-500 line-clamp-1">
                  {q.remarks}
                </div>

                <div className="flex items-center justify-between pt-1 border-t border-slate-100 text-xs">
                  <div className="font-mono font-bold text-slate-900">
                    ₱{q.payMethod3.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                  </div>

                  <button
                    onClick={() => setPrintQuote(q)}
                    className="text-xs text-teal-700 hover:text-teal-900 font-semibold flex items-center gap-1 hover:underline"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>View / Print</span>
                  </button>
                </div>
              </div>
            ))}

            {quotations.length === 0 && (
              <div className="p-8 text-center text-xs text-slate-400">
                No quotations recorded yet.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Print Quotation Modal */}
      {printQuote && (
        <QuotationPrintModal
          quote={printQuote}
          customer={customers.find((c) => c.id === printQuote.customerId)}
          onClose={() => setPrintQuote(null)}
        />
      )}

      {/* Add Customer Modal */}
      {isAddCustModalOpen && (
        <AddCustomerModal
          onClose={() => setIsAddCustModalOpen(false)}
          onCustomerAdded={(newC) => {
            setCustomers((prev) => [newC, ...prev]);
            setSelectedCustomerId(newC.id);
            setIsAddCustModalOpen(false);
          }}
        />
      )}
    </div>
  );
};
