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
import { useAuth } from '../context/AuthContext';

export const InstallmentSalesPage: React.FC = () => {
  const { currentUser } = useAuth();
  const [plans, setPlans] = useState<InstallmentPlan[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedPlanForPayment, setSelectedPlanForPayment] = useState<InstallmentPlan | null>(null);
  const [expandedPlans, setExpandedPlans] = useState<Record<string, boolean>>({});

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

  return (
    <div className="space-y-4">
      {/* Toast */}
      {toast && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs px-4 py-2.5 rounded-xl flex items-center gap-2 font-medium">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          <span>{toast}</span>
        </div>
      )}

      {/* Header */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <CreditCard className="w-5 h-5 text-teal-700" />
            <h1 className="text-lg font-bold text-slate-900">Installment Accounts Receivable & Amortization</h1>
            <span className="text-[10px] bg-teal-50 text-teal-700 font-bold px-2 py-0.5 rounded-full border border-teal-200">
              Commercial Credit
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Monitor client financing schedules, monthly collection maturities, and aging balances
          </p>
        </div>
      </div>

      {/* Financial Overview Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
            Total Financed Portfolio
          </span>
          <div className="text-2xl font-black text-slate-900 font-mono mt-1">
            ₱{totalPrincipal.toLocaleString('en-US', { minimumFractionDigits: 2 })}
          </div>
          <div className="text-[11px] text-slate-500 mt-0.5">{plans.length} commercial financing plans</div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-600">
            Total Principal Collected
          </span>
          <div className="text-2xl font-black text-emerald-800 font-mono mt-1">
            ₱{totalCollected.toLocaleString('en-US', { minimumFractionDigits: 2 })}
          </div>
          <div className="text-[11px] text-emerald-700/80 mt-0.5">Liquidated through installments</div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <span className="text-[10px] font-bold uppercase tracking-wider text-teal-700">
            Outstanding Accounts Receivable (AR)
          </span>
          <div className="text-2xl font-black text-teal-900 font-mono mt-1">
            ₱{totalRemainingAR.toLocaleString('en-US', { minimumFractionDigits: 2 })}
          </div>
          <div className="text-[11px] text-slate-500 mt-0.5">Pending collection</div>
        </div>
      </div>

      {/* Plans Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-3 border-b border-slate-200 bg-slate-50">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-700">
            Active Amortization Ledger
          </span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 text-[10px] uppercase tracking-wider">
                <th className="py-3 px-3">Plan Reference</th>
                <th className="py-3 px-3">Client Name</th>
                <th className="py-3 px-3">Financing Term</th>
                <th className="py-3 px-3 text-right">Total Financed</th>
                <th className="py-3 px-3 text-right">Monthly Due</th>
                <th className="py-3 px-3 text-center">Collection Progress</th>
                <th className="py-3 px-3 text-right">Remaining Balance</th>
                <th className="py-3 px-3">Next Maturity</th>
                <th className="py-3 px-3">Status</th>
                <th className="py-3 px-3 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {plans.map((plan) => {
                const isExpanded = !!expandedPlans[plan.id];
                const pct = Math.round((plan.paidMonths / plan.totalMonths) * 100);

                return (
                  <React.Fragment key={plan.id}>
                    <tr className="hover:bg-slate-50/70">
                      <td className="py-3 px-3 font-mono font-bold text-teal-800">
                        {plan.id}
                        <div className="text-[10px] text-slate-400 font-normal">Invoice #{plan.orderId}</div>
                      </td>
                      <td className="py-3 px-3 font-bold text-slate-800">{plan.customerName}</td>
                      <td className="py-3 px-3 text-slate-600 font-medium">{plan.termMonths} Months</td>
                      <td className="py-3 px-3 text-right font-mono font-bold text-slate-900">
                        ₱{plan.totalPrincipal.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                      </td>
                      <td className="py-3 px-3 text-right font-mono text-teal-800 font-bold">
                        ₱{plan.monthlyAmortization.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                      </td>
                      <td className="py-3 px-3 text-center">
                        <div className="flex items-center gap-2 justify-center">
                          <span className="font-bold text-slate-700 font-mono">
                            {plan.paidMonths}/{plan.totalMonths}
                          </span>
                          <div className="w-16 bg-slate-100 h-1.5 rounded-full overflow-hidden">
                            <div
                              className="bg-teal-600 h-full rounded-full transition-all"
                              style={{ width: `${pct}%` }}
                            ></div>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-3 text-right font-mono font-bold text-slate-800">
                        ₱{plan.remainingBalance.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                      </td>
                      <td className="py-3 px-3 text-slate-600 font-medium">{plan.nextDueDate}</td>
                      <td className="py-3 px-3">
                        <span
                          className={`font-bold text-[10px] px-2 py-0.5 rounded-full ${
                            plan.status === 'Settled'
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-blue-100 text-blue-800'
                          }`}
                        >
                          {plan.status}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          {plan.status !== 'Settled' && (
                            <button
                              onClick={() => handleOpenPayment(plan)}
                              className="bg-teal-700 hover:bg-teal-800 text-white text-[11px] font-bold px-2.5 py-1 rounded shadow-xs transition-colors"
                            >
                              Collect Payment
                            </button>
                          )}
                          <button
                            onClick={() => toggleExpand(plan.id)}
                            className="text-slate-400 hover:text-slate-600 p-1"
                            title="View Payment Logs"
                          >
                            {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                          </button>
                        </div>
                      </td>
                    </tr>

                    {/* Expandable Payment Logs */}
                    {isExpanded && (
                      <tr className="bg-slate-50/80">
                        <td colSpan={10} className="p-4">
                          <div className="border border-slate-200 rounded-lg bg-white p-3 space-y-2">
                            <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                              Payment Audit Trail ({plan.paymentHistory.length} logs recorded)
                            </div>
                            <div className="divide-y divide-slate-100">
                              {plan.paymentHistory.map((log) => (
                                <div key={log.id} className="py-1.5 flex items-center justify-between text-xs">
                                  <div className="flex items-center gap-2">
                                    <span className="font-mono text-slate-500">{log.date}</span>
                                    <span className="font-bold text-slate-800">Ref: {log.referenceNumber}</span>
                                    <span className="text-slate-400">via Cashier {log.cashier}</span>
                                  </div>
                                  <div className="font-mono font-bold text-emerald-700">
                                    +₱{log.amountPaid.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                                  </div>
                                </div>
                              ))}
                              {plan.paymentHistory.length === 0 && (
                                <div className="text-xs text-slate-400 italic py-1">No payment logs recorded yet.</div>
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
      </div>

      {/* Record Payment Modal */}
      {selectedPlanForPayment && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 w-full max-w-md p-5 space-y-4 animate-scaleUp">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <CreditCard className="w-4 h-4 text-teal-700" />
                <h2 className="font-bold text-sm text-slate-800">
                  Record Amortization ({selectedPlanForPayment.id})
                </h2>
              </div>
              <button onClick={() => setSelectedPlanForPayment(null)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 text-xs space-y-1">
              <div>Client: <strong>{selectedPlanForPayment.customerName}</strong></div>
              <div>Outstanding Balance: <strong className="font-mono text-teal-900">₱{selectedPlanForPayment.remainingBalance.toLocaleString()}</strong></div>
              <div>Monthly Amortization: <strong className="font-mono text-slate-800">₱{selectedPlanForPayment.monthlyAmortization.toLocaleString()}</strong></div>
            </div>

            <form onSubmit={handleRecordPaymentSubmit} className="space-y-3 text-xs">
              <div>
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block mb-1">
                  Payment Collection Amount (₱) *
                </label>
                <input
                  type="number"
                  step="0.01"
                  required
                  value={payAmount}
                  onChange={(e) => setPayAmount(e.target.value === '' ? '' : Number(e.target.value))}
                  className="w-full text-xs font-mono font-bold border border-slate-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block mb-1">
                  Official Receipt / Reference # *
                </label>
                <input
                  type="text"
                  required
                  value={payRef}
                  onChange={(e) => setPayRef(e.target.value)}
                  className="w-full text-xs font-mono border border-slate-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block mb-1">
                  Receiving Cashier / Encoder
                </label>
                <input
                  type="text"
                  value={payCashier}
                  onChange={(e) => setPayCashier(e.target.value)}
                  className="w-full text-xs border border-slate-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setSelectedPlanForPayment(null)}
                  className="px-4 py-2 text-slate-600 font-semibold hover:bg-slate-100 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-teal-700 hover:bg-teal-800 text-white font-bold rounded-lg shadow-sm"
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
