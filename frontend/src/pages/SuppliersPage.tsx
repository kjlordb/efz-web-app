import React, { useState, useEffect } from 'react';
import {
  Truck,
  Plus,
  Mail,
  Phone,
  MapPin,
  Building,
  CheckCircle2,
  Package
} from 'lucide-react';
import { supplierService, inventoryService } from '../services/api';
import { Supplier, StockItem } from '../types';
import { Pagination } from '../components/common/Pagination';

export const SuppliersPage: React.FC = () => {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [stock, setStock] = useState<StockItem[]>([]);
  const [isAddOpen, setIsAddOpen] = useState(false);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(12);

  // New supplier form
  const [name, setName] = useState('');
  const [address, setAddress] = useState('');
  const [email, setEmail] = useState('');
  const [contact, setContact] = useState('');
  const [feedback, setFeedback] = useState<string | null>(null);

  useEffect(() => {
    load();
  }, []);

  const load = async () => {
    const [sups, items] = await Promise.all([
      supplierService.getSuppliers(),
      inventoryService.getStockItems({ includeDeleted: true })
    ]);
    setSuppliers(sups);
    setStock(items);
  };

  const handleAddSupplier = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    try {
      await supplierService.addSupplier({
        supplierName: name.trim(),
        supplierAddress: address.trim(),
        supplierEmail: email.trim(),
        supplierContact: contact.trim()
      });
      setName('');
      setAddress('');
      setEmail('');
      setContact('');
      setIsAddOpen(false);
      setFeedback('New supplier added successfully!');
      setTimeout(() => setFeedback(null), 3000);
      load();
    } catch (err: any) {
      alert(err.message || 'Error adding supplier');
    }
  };

  return (
    <div className="space-y-4">
      {/* Toast */}
      {feedback && (
        <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-xs px-4 py-2.5 rounded-xl flex items-center gap-2 font-medium shadow-glass-xs animate-fadeIn">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>{feedback}</span>
        </div>
      )}

      {/* Header */}
      <div className="bg-slate-900/60 backdrop-blur-md p-4 sm:p-5 rounded-2xl border border-white/[0.08] shadow-glass-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-lg font-black text-white tracking-tight flex items-center gap-2.5">
            <Truck className="w-5 h-5 text-teal-400" />
            <span>Supplier & Vendor Directory</span>
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Registered distributors, hardware importers, and procurement partners
          </p>
        </div>

        <button
          onClick={() => setIsAddOpen(true)}
          className="flex items-center gap-2 text-xs font-bold text-white bg-gradient-to-r from-teal-600 to-teal-700 hover:from-teal-500 hover:to-teal-600 px-4 py-2.5 rounded-xl shadow-glass-xs hover:shadow-glow-teal transition-all self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Add New Supplier</span>
        </button>
      </div>

      {/* Supplier Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {suppliers
          .slice((currentPage - 1) * pageSize, currentPage * pageSize)
          .map((s) => {
          const supplierStockCount = stock.filter(
            (i) => i.supplierName.toLowerCase() === s.supplierName.toLowerCase()
          ).length;

          return (
            <div
              key={s.id}
              className="bg-slate-900/60 backdrop-blur-md p-5 rounded-2xl border border-white/[0.08] shadow-glass-xs hover:border-teal-500/40 hover:shadow-glass-sm transition-all flex flex-col justify-between space-y-3.5"
            >
              <div>
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-sm text-white leading-tight">
                    {s.supplierName}
                  </h3>
                  <span className="text-[10px] font-mono font-bold bg-slate-800 text-teal-300 border border-white/[0.08] px-2 py-0.5 rounded-full">
                    #{s.id}
                  </span>
                </div>

                <div className="space-y-2 pt-3 border-t border-white/[0.06] text-xs text-slate-300">
                  <div className="flex items-center gap-2.5">
                    <Phone className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                    <span>{s.supplierContact || 'No contact number'}</span>
                  </div>
                  <div className="flex items-center gap-2.5">
                    <Mail className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                    <span className="truncate">{s.supplierEmail || 'No email'}</span>
                  </div>
                  <div className="flex items-start gap-2.5">
                    <MapPin className="w-3.5 h-3.5 text-slate-500 shrink-0 mt-0.5" />
                    <span className="line-clamp-2 text-slate-400">{s.supplierAddress || 'No address specified'}</span>
                  </div>
                </div>
              </div>

              <div className="pt-2.5 border-t border-white/[0.06] flex items-center justify-between text-xs text-slate-400">
                <span className="flex items-center gap-1.5">
                  <Package className="w-3.5 h-3.5 text-teal-400" />
                  <span>Supplied: <strong className="text-white font-mono">{supplierStockCount} units</strong></span>
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {suppliers.length > 0 && (
        <div className="bg-slate-900/60 backdrop-blur-md rounded-2xl border border-white/[0.08] overflow-hidden">
          <Pagination
            currentPage={currentPage}
            totalItems={suppliers.length}
            pageSize={pageSize}
            pageSizeOptions={[6, 12, 24, 48]}
            onPageChange={setCurrentPage}
            onPageSizeChange={setPageSize}
            label="suppliers"
          />
        </div>
      )}

      {/* Add Supplier Modal */}
      {isAddOpen && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900/95 border border-white/[0.14] rounded-2xl shadow-glass-modal w-full max-w-md p-6 space-y-4 backdrop-blur-xl animate-scaleUp text-white">
            <div className="flex items-center justify-between border-b border-white/[0.08] pb-3">
              <h2 className="font-bold text-sm text-white flex items-center gap-2">
                <Truck className="w-4 h-4 text-teal-400" />
                <span>Register New Supplier</span>
              </h2>
              <button
                onClick={() => setIsAddOpen(false)}
                className="text-slate-400 hover:text-white transition-colors"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleAddSupplier} className="space-y-3.5 text-xs">
              <div>
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1.5">
                  Supplier / Company Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g., TechSource Distribution Corp"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="glass-input w-full text-xs"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1.5">
                  Contact Number
                </label>
                <input
                  type="text"
                  placeholder="e.g., 0917-123-4567"
                  value={contact}
                  onChange={(e) => setContact(e.target.value)}
                  className="glass-input w-full text-xs"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1.5">
                  Email Address
                </label>
                <input
                  type="email"
                  placeholder="e.g., sales@supplier.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="glass-input w-full text-xs"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1.5">
                  Office / Warehouse Address
                </label>
                <textarea
                  rows={2}
                  placeholder="Warehouse address..."
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className="glass-input w-full text-xs resize-none"
                ></textarea>
              </div>

              <div className="pt-3 flex justify-end gap-2 border-t border-white/[0.08]">
                <button
                  type="button"
                  onClick={() => setIsAddOpen(false)}
                  className="px-4 py-2 rounded-xl text-slate-400 hover:text-white font-semibold hover:bg-white/[0.05] transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-gradient-to-r from-teal-600 to-teal-700 hover:from-teal-500 hover:to-teal-600 text-white font-bold rounded-xl shadow-glass-xs hover:shadow-glow-teal transition-all"
                >
                  Save Supplier
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
