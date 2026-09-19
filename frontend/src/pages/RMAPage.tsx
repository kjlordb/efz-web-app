import React, { useState, useEffect } from 'react';
import {
  RotateCcw,
  AlertTriangle,
  ShieldCheck,
  ShieldAlert,
  Clock,
  CheckCircle2,
  Search,
  Plus,
  Edit2,
  X,
  Truck,
  FileCheck
} from 'lucide-react';
import { rmaService, salesService, inventoryService, DATA_UPDATED_EVENT } from '../services/api';
import { RMATicket, RMAStatus, StockItem } from '../types';
import { useAuth } from '../context/AuthContext';

interface RMAPageProps {
  initialRMAData?: { serial: string; item: StockItem; orderId: number; customer: string } | null;
  onClearInitialData?: () => void;
}

const RMA_STATUSES: RMAStatus[] = [
  'Pending Inspection',
  'In Distributor Diagnostic',
  'Replacement Inbound',
  'Replacement Ready',
  'Resolved & Released'
];

export const RMAPage: React.FC<RMAPageProps> = ({ initialRMAData, onClearInitialData }) => {
  const { hasPermission } = useAuth();
  const canManageRMA = hasPermission('MANAGE_RMA');

  const [tickets, setTickets] = useState<RMATicket[]>([]);
  const [loading, setLoading] = useState(false);
  const [isNewTicketOpen, setIsNewTicketOpen] = useState(false);
  const [selectedTicketForUpdate, setSelectedTicketForUpdate] = useState<RMATicket | null>(null);

  // New Ticket Form State
  const [serial, setSerial] = useState('');
  const [itemName, setItemName] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [orderId, setOrderId] = useState<number | ''>('');
  const [supplierName, setSupplierName] = useState('');
  const [defect, setDefect] = useState('');
  const [isWarrantyValid, setIsWarrantyValid] = useState(true);

  // Status Update State
  const [updateStatus, setUpdateStatus] = useState<RMAStatus>('Pending Inspection');
  const [techNotes, setTechNotes] = useState('');
  const [replacementSerial, setReplacementSerial] = useState('');
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    loadTickets();
    const handleUpdate = () => {
      loadTickets();
    };
    window.addEventListener(DATA_UPDATED_EVENT, handleUpdate);
    return () => window.removeEventListener(DATA_UPDATED_EVENT, handleUpdate);
  }, []);

  useEffect(() => {
    if (initialRMAData) {
      setSerial(initialRMAData.serial);
      setItemName(initialRMAData.item.stockDetails);
      setCustomerName(initialRMAData.customer);
      setOrderId(initialRMAData.orderId);
      setSupplierName(initialRMAData.item.supplierName);
      setIsNewTicketOpen(true);
      if (onClearInitialData) onClearInitialData();
    }
  }, [initialRMAData]);

  const loadTickets = async () => {
    setLoading(true);
    try {
      const data = await rmaService.getTickets();
      setTickets(data);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!serial.trim() || !defect.trim()) return;

    try {
      await rmaService.createTicket({
        serialNumber: serial.trim(),
        itemName: itemName.trim() || 'Hardware Component',
        customerName: customerName.trim() || 'Direct Client',
        orderId: Number(orderId) || 1001,
        supplierName: supplierName.trim() || 'Authorized Distributor',
        reportedDefect: defect.trim(),
        status: 'Pending Inspection',
        warrantyValid: isWarrantyValid,
        technicianNotes: 'Ticket initiated via portal. Initial bench diagnostic pending.'
      });

      setIsNewTicketOpen(false);
      setSerial('');
      setItemName('');
      setCustomerName('');
      setOrderId('');
      setSupplierName('');
      setDefect('');
      setToast('New RMA claim ticket filed successfully!');
      setTimeout(() => setToast(null), 4000);
      loadTickets();
    } catch (err: any) {
      alert(err.message || 'Error filing RMA ticket');
    }
  };

  const handleUpdateTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTicketForUpdate) return;

    try {
      await rmaService.updateTicketStatus(
        selectedTicketForUpdate.id,
        updateStatus,
        techNotes,
        replacementSerial || undefined
      );

      setSelectedTicketForUpdate(null);
      setToast(`Ticket ${selectedTicketForUpdate.id} updated to "${updateStatus}"!`);
      setTimeout(() => setToast(null), 4000);
      loadTickets();
    } catch (err: any) {
      alert(err.message || 'Error updating RMA ticket');
    }
  };

  const activeClaims = tickets.filter((t) => t.status !== 'Resolved & Released').length;
  const readyClaims = tickets.filter((t) => t.status === 'Replacement Ready').length;

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
            <RotateCcw className="w-5 h-5 text-teal-400" />
            <h1 className="text-lg font-black text-white tracking-tight">Return Merchandise Authorization (RMA)</h1>
            <span className="text-[10px] bg-teal-500/10 text-teal-300 font-bold px-2 py-0.5 rounded-full border border-teal-500/20">
              Warranty Claims
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Log defective hardware returns, coordinate distributor turnaround replacements, and record replacement serials
          </p>
        </div>

        <button
          onClick={() => setIsNewTicketOpen(true)}
          className="flex items-center gap-2 text-xs font-bold text-white bg-gradient-to-r from-teal-600 to-teal-700 hover:from-teal-500 hover:to-teal-600 px-4 py-2.5 rounded-xl shadow-glass-xs hover:shadow-glow-teal transition-all self-start md:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Initiate RMA Ticket</span>
        </button>
      </div>

      {/* KPI Overview */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-slate-900/60 backdrop-blur-md p-4 rounded-2xl border border-white/[0.08] shadow-glass-xs hover:border-white/[0.14] transition-all">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
            Active Defect Tickets
          </span>
          <div className="text-2xl font-black text-white font-mono mt-1">
            {activeClaims} <span className="text-xs font-normal text-slate-400">units in turnaround</span>
          </div>
        </div>

        <div className="bg-slate-900/60 backdrop-blur-md p-4 rounded-2xl border border-white/[0.08] shadow-glass-xs hover:border-white/[0.14] transition-all">
          <span className="text-[10px] font-bold uppercase tracking-wider text-teal-400">
            Replacement Units Ready
          </span>
          <div className="text-2xl font-black text-teal-300 font-mono mt-1">
            {readyClaims} <span className="text-xs font-normal text-slate-400">awaiting client pickup</span>
          </div>
        </div>

        <div className="bg-slate-900/60 backdrop-blur-md p-4 rounded-2xl border border-white/[0.08] shadow-glass-xs hover:border-white/[0.14] transition-all">
          <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400">
            Resolved Claims
          </span>
          <div className="text-2xl font-black text-emerald-400 font-mono mt-1">
            {tickets.filter((t) => t.status === 'Resolved & Released').length}
          </div>
        </div>
      </div>

      {/* Tickets Table */}
      <div className="bg-slate-900/60 backdrop-blur-md rounded-2xl border border-white/[0.08] shadow-glass-sm overflow-hidden">
        <div className="p-3.5 border-b border-white/[0.08] bg-slate-950/40">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-300">
            RMA Ticket Ledger
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-950/60 border-b border-white/[0.08] text-slate-400 text-[10px] uppercase tracking-wider font-semibold">
                <th className="py-3 px-3.5">RMA Ticket ID</th>
                <th className="py-3 px-3.5">Customer Account</th>
                <th className="py-3 px-3.5">Hardware Serial & Model</th>
                <th className="py-3 px-3.5">Distributor</th>
                <th className="py-3 px-3.5">Reported Defect</th>
                <th className="py-3 px-3.5 text-center">Warranty</th>
                <th className="py-3 px-3.5">Turnaround Status</th>
                <th className="py-3 px-3.5 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.04]">
              {tickets.map((t) => (
                <tr key={t.id} className="hover:bg-white/[0.02] transition-colors">
                  <td className="py-3 px-3.5 font-mono font-bold text-teal-300">
                    {t.id}
                    <div className="text-[10px] text-slate-500 font-normal">Invoice #{t.orderId}</div>
                  </td>
                  <td className="py-3 px-3.5 font-bold text-slate-200">{t.customerName}</td>
                  <td className="py-3 px-3.5">
                    <div className="font-mono text-xs font-bold text-teal-300">{t.serialNumber}</div>
                    <div className="text-[11px] text-slate-400 line-clamp-1">{t.itemName}</div>
                    {t.replacementSerial && (
                      <div className="text-[10px] font-mono text-emerald-400 font-bold mt-0.5">
                        Replacement SN: {t.replacementSerial}
                      </div>
                    )}
                  </td>
                  <td className="py-3 px-3.5 text-slate-300">{t.supplierName}</td>
                  <td className="py-3 px-3.5 text-slate-400 italic max-w-xs">{t.reportedDefect}</td>
                  <td className="py-3 px-3.5 text-center">
                    {t.warrantyValid ? (
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-300 bg-emerald-500/15 border border-emerald-500/30 px-2 py-0.5 rounded-full">
                        <ShieldCheck className="w-3 h-3" />
                        <span>Valid</span>
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold text-rose-300 bg-rose-500/15 border border-rose-500/30 px-2 py-0.5 rounded-full">
                        <ShieldAlert className="w-3 h-3" />
                        <span>Expired</span>
                      </span>
                    )}
                  </td>
                  <td className="py-3 px-3.5">
                    <span
                      className={`font-bold text-[10px] px-2.5 py-0.5 rounded-full border ${
                        t.status === 'Resolved & Released'
                          ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
                          : t.status === 'Replacement Ready'
                          ? 'bg-purple-500/15 text-purple-300 border-purple-500/30'
                          : t.status === 'In Distributor Diagnostic'
                          ? 'bg-blue-500/15 text-blue-300 border-blue-500/30'
                          : 'bg-amber-500/15 text-amber-300 border-amber-500/30'
                      }`}
                    >
                      {t.status}
                    </span>
                  </td>
                  <td className="py-3 px-3.5 text-center">
                    {canManageRMA ? (
                      <button
                        onClick={() => {
                          setSelectedTicketForUpdate(t);
                          setUpdateStatus(t.status);
                          setTechNotes(t.technicianNotes || '');
                          setReplacementSerial(t.replacementSerial || '');
                        }}
                        className="text-slate-400 hover:text-teal-300 font-semibold p-1.5 hover:bg-white/[0.05] rounded-lg transition-colors"
                        title="Update Ticket Status & Notes"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                    ) : (
                      <span className="text-[10px] text-slate-500 font-medium">Read-Only</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* New Ticket Modal */}
      {isNewTicketOpen && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900/95 border border-white/[0.14] rounded-2xl shadow-glass-modal w-full max-w-lg p-6 space-y-4 backdrop-blur-xl animate-scaleUp text-white">
            <div className="flex items-center justify-between border-b border-white/[0.08] pb-3">
              <div className="flex items-center gap-2">
                <RotateCcw className="w-5 h-5 text-teal-400" />
                <h2 className="font-bold text-base text-white">File New Warranty RMA Ticket</h2>
              </div>
              <button onClick={() => setIsNewTicketOpen(false)} className="text-slate-400 hover:text-white transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateTicket} className="space-y-3.5 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1.5">
                    Defective Hardware Serial # *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. SN-GPU-4070-001"
                    value={serial}
                    onChange={(e) => setSerial(e.target.value)}
                    className="glass-input w-full font-mono text-xs"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1.5">
                    Original Sales Invoice #
                  </label>
                  <input
                    type="number"
                    placeholder="1001"
                    value={orderId}
                    onChange={(e) => setOrderId(e.target.value === '' ? '' : Number(e.target.value))}
                    className="glass-input w-full font-mono text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1.5">
                  Product Description & Specifications
                </label>
                <input
                  type="text"
                  placeholder="e.g. ASUS TUF Gaming GeForce RTX 4070 SUPER..."
                  value={itemName}
                  onChange={(e) => setItemName(e.target.value)}
                  className="glass-input w-full text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1.5">
                    Customer / Client Account
                  </label>
                  <input
                    type="text"
                    placeholder="Gabriel Santos"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    className="glass-input w-full text-xs"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1.5">
                    Distributor / Supplier
                  </label>
                  <input
                    type="text"
                    placeholder="TechSource Distribution Corp"
                    value={supplierName}
                    onChange={(e) => setSupplierName(e.target.value)}
                    className="glass-input w-full text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1.5">
                  Reported Defect & Failure Symptoms *
                </label>
                <textarea
                  rows={3}
                  required
                  placeholder="Describe failure behavior, crash logs, or visual defects..."
                  value={defect}
                  onChange={(e) => setDefect(e.target.value)}
                  className="glass-input w-full text-xs resize-none"
                ></textarea>
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="warrantyCheck"
                  checked={isWarrantyValid}
                  onChange={(e) => setIsWarrantyValid(e.target.checked)}
                  className="rounded border-white/[0.2] bg-slate-950 text-teal-600 focus:ring-teal-500"
                />
                <label htmlFor="warrantyCheck" className="text-xs text-slate-300 font-medium cursor-pointer">
                  Unit verified within warranty period and stickers intact
                </label>
              </div>

              <div className="pt-3 border-t border-white/[0.08] flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsNewTicketOpen(false)}
                  className="px-4 py-2 text-slate-400 hover:text-white font-semibold hover:bg-white/[0.05] rounded-xl transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-gradient-to-r from-teal-600 to-teal-700 hover:from-teal-500 hover:to-teal-600 text-white font-bold rounded-xl shadow-glass-xs hover:shadow-glow-teal transition-all"
                >
                  Create RMA Ticket
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Update Ticket Modal */}
      {selectedTicketForUpdate && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900/95 border border-white/[0.14] rounded-2xl shadow-glass-modal w-full max-w-md p-6 space-y-4 backdrop-blur-xl animate-scaleUp text-white">
            <div className="flex items-center justify-between border-b border-white/[0.08] pb-3">
              <div className="flex items-center gap-2">
                <FileCheck className="w-5 h-5 text-teal-400" />
                <h2 className="font-bold text-base text-white">
                  Update RMA Ticket ({selectedTicketForUpdate.id})
                </h2>
              </div>
              <button onClick={() => setSelectedTicketForUpdate(null)} className="text-slate-400 hover:text-white transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleUpdateTicket} className="space-y-3.5 text-xs">
              <div>
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1.5">
                  Turnaround Lifecycle Status
                </label>
                <select
                  value={updateStatus}
                  onChange={(e) => setUpdateStatus(e.target.value as RMAStatus)}
                  className="glass-input w-full text-xs font-medium bg-slate-950"
                >
                  {RMA_STATUSES.map((status) => (
                    <option key={status} value={status} className="bg-slate-950 text-white">{status}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1.5">
                  Replacement Unit Serial Number (If Replaced)
                </label>
                <input
                  type="text"
                  placeholder="e.g. SN-GPU-4070-REP01"
                  value={replacementSerial}
                  onChange={(e) => setReplacementSerial(e.target.value)}
                  className="glass-input w-full font-mono text-xs"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1.5">
                  Diagnostic & Technical Log Notes
                </label>
                <textarea
                  rows={3}
                  placeholder="e.g., TechSource distributor confirmed GPU core defect; issued brand new replacement unit."
                  value={techNotes}
                  onChange={(e) => setTechNotes(e.target.value)}
                  className="glass-input w-full text-xs resize-none"
                ></textarea>
              </div>

              <div className="pt-3 border-t border-white/[0.08] flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedTicketForUpdate(null)}
                  className="px-4 py-2 text-slate-400 hover:text-white font-semibold hover:bg-white/[0.05] rounded-xl transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-gradient-to-r from-teal-600 to-teal-700 hover:from-teal-500 hover:to-teal-600 text-white font-bold rounded-xl shadow-glass-xs hover:shadow-glow-teal transition-all"
                >
                  Save RMA Status
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
