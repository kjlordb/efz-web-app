import React, { useState, useEffect } from 'react';
import {
  CreditCard,
  Calendar,
  Clock,
  CheckCircle,
  AlertCircle,
  DollarSign,
  Plus,
  Receipt,
  Search,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  X
} from 'lucide-react';
import { installmentService, DATA_UPDATED_EVENT } from '../services/api';
import { InstallmentPlan } from '../types';
import { Pagination } from '../components/common/Pagination';
import { useAuth } from '../context/AuthContext';

export const InstallmentSalesPage: React.FC = () => {
  const { currentUser } = useAuth();
  const [plans, setPlans] = useState<InstallmentPlan[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedPlanForPayment, setSelectedPlanForPayment] = useState<InstallmentPlan | null>(null);
  const [expandedPlans, setExpandedPlans] = useState<Record<string, boolean>>({});

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Payment modal state
  const [payAmount, setPayAmount] = useState<number | ''>('');
  const [payRef, setPayRef] = useState('');
  const [payCashier, setPayCashier] = useState(currentUser?.name || 'Kyle (Admin)');
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    if (currentUser) {
      setPayCashier(currentUser.name);
    }
  }, [currentUser]);

  useEffect(() => {
    loadPlans();
    const handleUpdate = () => {
      loadPlans();
    };
    window.addEventListener(DATA_UPDATED_EVENT, handleUpdate);
    return () => window.removeEventListener(DATA_UPDATED_EVENT, handleUpdate);
  }, []);

  const loadPlans = async () => {
    setLoading(true);
    try {
      const data = await installmentService.getPlans();
      setPlans(data);
    } finally {
      setLoading(false);
    }
  };

  const toggleExpand = (id: string) => {
    setExpandedPlans((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const handleOpenPayment = (plan: InstallmentPlan) => {
    setSelectedPlanForPayment(plan);
    setPayAmount(plan.monthlyAmortization);
    setPayRef(`OR-${Math.floor(1000 + Math.random() * 9000)}`);
  };

  const handleRecordPaymentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPlanForPayment || !payAmount || Number(payAmount) <= 0) return;

    try {
      await installmentService.recordPayment(
        selectedPlanForPayment.id,
        Number(payAmount),
        payRef.trim() || 'CASH-REC',
        payCashier.trim()
      );
      setSelectedPlanForPayment(null);
      setToast(`Amortization payment of ₱${Number(payAmount).toLocaleString()} recorded successfully!`);
      setTimeout(() => setToast(null), 4000);
      loadPlans();
    } catch (err: any) {
      alert(err.message || 'Error recording payment');
    }
  };

  // Financial aggregates
  const totalPrincipal = plans.reduce((acc, p) => acc + p.totalPrincipal, 0);
  const totalRemainingAR = plans.reduce((acc, p) => acc + p.remainingBalance, 0);
  const totalCollected = totalPrincipal - totalRemainingAR;

  const totalPlansCount = plans.length;
  const paginatedPlans = plans.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  return (
    <div className="space-y-4">
      {/* Toast */}
      {toast && (
        <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-xs px-4 py-2.5 rounded-xl flex items-center gap-2 font-medium shadow-glass-xs animate-fadeIn">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>{toast}</span>
        </div>
      )}

      {/* Header */}
      <div className="bg-slate-900/60 backdrop-blur-md p-4 sm:p-5 rounded-2xl border border-white/[0.08] shadow-glass-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <CreditCard className="w-5 h-5 text-teal-400" />
            <h1 className="text-lg font-black text-white tracking-tight">Installment Accounts Receivable & Amortization</h1>
            <span className="text-[10px] bg-teal-500/10 text-teal-300 font-bold px-2 py-0.5 rounded-full border border-teal-500/20">
              Commercial Credit
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Monitor client financing schedules, monthly collection maturities, and aging balances
          </p>
        </div>
      </div>

      {/* Financial Overview Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-slate-900/60 backdrop-blur-md p-4 rounded-2xl border border-white/[0.08] shadow-glass-xs hover:border-white/[0.14] transition-all">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
            Total Financed Portfolio
          </span>
          <div className="text-2xl font-black text-white font-mono mt-1">
            ₱{totalPrincipal.toLocaleString('en-US', { minimumFractionDigits: 2 })}
          </div>
          <div className="text-[11px] text-slate-400 mt-0.5">{plans.length} commercial financing plans</div>
        </div>

        <div className="bg-slate-900/60 backdrop-blur-md p-4 rounded-2xl border border-white/[0.08] shadow-glass-xs hover:border-white/[0.14] transition-all">
          <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400">
            Total Principal Collected
          </span>
          <div className="text-2xl font-black text-emerald-400 font-mono mt-1">
            ₱{totalCollected.toLocaleString('en-US', { minimumFractionDigits: 2 })}
          </div>
          <div className="text-[11px] text-emerald-400/70 mt-0.5">Liquidated through installments</div>
        </div>

        <div className="bg-slate-900/60 backdrop-blur-md p-4 rounded-2xl border border-white/[0.08] shadow-glass-xs hover:border-white/[0.14] transition-all">
          <span className="text-[10px] font-bold uppercase tracking-wider text-teal-400">
            Outstanding Accounts Receivable (AR)
          </span>
          <div className="text-2xl font-black text-teal-300 font-mono mt-1">
            ₱{totalRemainingAR.toLocaleString('en-US', { minimumFractionDigits: 2 })}
          </div>
          <div className="text-[11px] text-slate-400 mt-0.5">Pending collection</div>
        </div>
      </div>

      {/* Plans Table */}
      <div className="bg-slate-900/60 backdrop-blur-md rounded-2xl border border-white/[0.08] shadow-glass-sm overflow-hidden">
        <div className="p-3.5 border-b border-white/[0.08] bg-slate-950/40">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-300">
            Active Amortization Ledger
          </span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-950/60 border-b border-white/[0.08] text-slate-400 text-[10px] uppercase tracking-wider font-semibold">
                <th className="py-3 px-3.5">Plan Reference</th>
                <th className="py-3 px-3.5">Client Name</th>
                <th className="py-3 px-3.5">Financing Term</th>
                <th className="py-3 px-3.5 text-right">Total Financed</th>
                <th className="py-3 px-3.5 text-right">Monthly Due</th>
                <th className="py-3 px-3.5 text-center">Collection Progress</th>
                <th className="py-3 px-3.5 text-right">Remaining Balance</th>
                <th className="py-3 px-3.5">Next Maturity</th>
                <th className="py-3 px-3.5">Status</th>
                <th className="py-3 px-3.5 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.04]">
              {paginatedPlans.map((plan) => {
                const isExpanded = !!expandedPlans[plan.id];
                const pct = Math.round((plan.paidMonths / plan.totalMonths) * 100);

                return (
                  <React.Fragment key={plan.id}>
                    <tr className="hover:bg-white/[0.02] transition-colors">
                      <td className="py-3 px-3.5 font-mono font-bold text-teal-300">
                        {plan.id}
                        <div className="text-[10px] text-slate-500 font-normal">Invoice #{plan.orderId}</div>
                      </td>
                      <td className="py-3 px-3.5 font-bold text-slate-200">{plan.customerName}</td>
                      <td className="py-3 px-3.5 text-slate-300 font-medium">{plan.termMonths} Months</td>
                      <td className="py-3 px-3.5 text-right font-mono font-bold text-white">
                        ₱{plan.totalPrincipal.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                      </td>
                      <td className="py-3 px-3.5 text-right font-mono text-teal-300 font-bold">
                        ₱{plan.monthlyAmortization.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                      </td>
                      <td className="py-3 px-3.5 text-center">
                        <div className="flex items-center gap-2 justify-center">
                          <span className="font-bold text-slate-300 font-mono">
                            {plan.paidMonths}/{plan.totalMonths}
                          </span>
                          <div className="w-16 bg-slate-800 h-1.5 rounded-full overflow-hidden">
                            <div
                              className="bg-gradient-to-r from-teal-500 to-teal-400 h-full rounded-full transition-all"
                              style={{ width: `${pct}%` }}
                            ></div>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-3.5 text-right font-mono font-bold text-amber-300">
                        ₱{plan.remainingBalance.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                      </td>
                      <td className="py-3 px-3.5 text-slate-300 font-medium">{plan.nextDueDate}</td>
                      <td className="py-3 px-3.5">
                        <span
                          className={`font-bold text-[10px] px-2.5 py-0.5 rounded-full border ${
                            plan.status === 'Settled'
                              ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
                              : 'bg-teal-500/15 text-teal-300 border-teal-500/30'
                          }`}
                        >
                          {plan.status}
                        </span>
                      </td>
                      <td className="py-3 px-3.5 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          {plan.status !== 'Settled' && (
                            <button
                              onClick={() => handleOpenPayment(plan)}
                              className="bg-gradient-to-r from-teal-600 to-teal-700 hover:from-teal-500 hover:to-teal-600 text-white text-[11px] font-bold px-2.5 py-1 rounded-lg shadow-glass-xs hover:shadow-glow-teal transition-all"
                            >
                              Collect Payment
                            </button>
                          )}
                          <button
                            onClick={() => toggleExpand(plan.id)}
                            className="text-slate-400 hover:text-white p-1 transition-colors"
                            title="View Payment Logs"
                          >
                            {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                          </button>
                        </div>
                      </td>
                    </tr>

                    {/* Expandable Payment Logs */}
                    {isExpanded && (
                      <tr className="bg-slate-950/40">
                        <td colSpan={10} className="p-4">
                          <div className="border border-white/[0.08] rounded-xl bg-slate-900/90 p-4 space-y-2.5">
                            <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                              Payment Audit Trail ({plan.paymentHistory.length} logs recorded)
                            </div>
                            <div className="divide-y divide-white/[0.04]">
                              {plan.paymentHistory.map((log) => (
                                <div key={log.id} className="py-2 flex items-center justify-between text-xs">
                                  <div className="flex items-center gap-2.5">
                                    <span className="font-mono text-slate-400">{log.date}</span>
                                    <span className="font-bold text-white">Ref: {log.referenceNumber}</span>
                                    <span className="text-slate-400">via Cashier {log.cashier}</span>
                                  </div>
                                  <div className="font-mono font-bold text-emerald-400">
                                    +₱{log.amountPaid.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                                  </div>
                                </div>
                              ))}
                              {plan.paymentHistory.length === 0 && (
                                <div className="text-xs text-slate-500 italic py-1">No payment logs recorded yet.</div>
                              )}
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })}
            </tbody>
          </table>
        </div>

        {totalPlansCount > 0 && (
          <Pagination
            currentPage={currentPage}
            totalItems={totalPlansCount}
            pageSize={pageSize}
            pageSizeOptions={[5, 10, 20, 50]}
            onPageChange={setCurrentPage}
            onPageSizeChange={setPageSize}
            label="installment plans"
          />
        )}
      </div>

      {/* Record Payment Modal */}
      {selectedPlanForPayment && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900/95 border border-white/[0.14] rounded-2xl shadow-glass-modal w-full max-w-md p-6 space-y-4 backdrop-blur-xl animate-scaleUp text-white">
            <div className="flex items-center justify-between border-b border-white/[0.08] pb-3">
              <div className="flex items-center gap-2">
                <CreditCard className="w-4 h-4 text-teal-400" />
                <h2 className="font-bold text-sm text-white">
                  Record Amortization ({selectedPlanForPayment.id})
                </h2>
              </div>
              <button onClick={() => setSelectedPlanForPayment(null)} className="text-slate-400 hover:text-white transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="bg-slate-950/60 p-3 rounded-xl border border-white/[0.08] text-xs space-y-1 text-slate-300">
              <div>Client: <strong className="text-white">{selectedPlanForPayment.customerName}</strong></div>
              <div>Outstanding Balance: <strong className="font-mono text-teal-300">₱{selectedPlanForPayment.remainingBalance.toLocaleString()}</strong></div>
              <div>Monthly Amortization: <strong className="font-mono text-amber-300">₱{selectedPlanForPayment.monthlyAmortization.toLocaleString()}</strong></div>
            </div>

            <form onSubmit={handleRecordPaymentSubmit} className="space-y-3.5 text-xs">
              <div>
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1.5">
                  Payment Collection Amount (₱) *
                </label>
                <input
                  type="number"
                  step="0.01"
                  required
                  value={payAmount}
                  onChange={(e) => setPayAmount(e.target.value === '' ? '' : Number(e.target.value))}
                  className="glass-input w-full text-xs font-mono font-bold"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1.5">
                  Official Receipt / Reference # *
                </label>
                <input
                  type="text"
                  required
                  value={payRef}
                  onChange={(e) => setPayRef(e.target.value)}
                  className="glass-input w-full text-xs font-mono"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1.5">
                  Receiving Cashier / Encoder
                </label>
                <input
                  type="text"
                  value={payCashier}
                  onChange={(e) => setPayCashier(e.target.value)}
                  className="glass-input w-full text-xs"
                />
              </div>

              <div className="pt-3 flex justify-end gap-2 border-t border-white/[0.08]">
                <button
                  type="button"
                  onClick={() => setSelectedPlanForPayment(null)}
                  className="px-4 py-2 text-slate-400 hover:text-white font-semibold hover:bg-white/[0.05] rounded-xl transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-gradient-to-r from-teal-600 to-teal-700 hover:from-teal-500 hover:to-teal-600 text-white font-bold rounded-xl shadow-glass-xs hover:shadow-glow-teal transition-all"
                >
                  Post Payment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
