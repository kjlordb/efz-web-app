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

export const SuppliersPage: React.FC = () => {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [stock, setStock] = useState<StockItem[]>([]);
  const [isAddOpen, setIsAddOpen] = useState(false);

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
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs px-4 py-2.5 rounded-xl flex items-center gap-2 font-medium">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          <span>{feedback}</span>
        </div>
      )}

      {/* Header */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <Truck className="w-5 h-5 text-teal-700" />
            <span>Supplier & Vendor Directory</span>
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Registered distributors, hardware importers, and procurement partners
          </p>
        </div>

        <button
          onClick={() => setIsAddOpen(true)}
          className="flex items-center gap-1.5 text-xs font-bold text-white bg-teal-700 hover:bg-teal-800 px-4 py-2 rounded-lg shadow-sm transition-all self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Add New Supplier</span>
        </button>
      </div>

      {/* Supplier Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {suppliers.map((s) => {
          const supplierStockCount = stock.filter(
            (i) => i.supplierName.toLowerCase() === s.supplierName.toLowerCase()
          ).length;

          return (
            <div
              key={s.id}
              className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm hover:border-teal-300 transition-all flex flex-col justify-between space-y-3"
            >
              <div>
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-sm text-slate-900 leading-tight">
                    {s.supplierName}
                  </h3>
                  <span className="text-[10px] font-mono font-bold bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded">
                    #{s.id}
                  </span>
                </div>

                <div className="space-y-1.5 pt-3 border-t border-slate-100 text-xs text-slate-600">
                  <div className="flex items-center gap-2">
                    <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span>{s.supplierContact || 'No contact number'}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span className="truncate">{s.supplierEmail || 'No email'}</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                    <span className="line-clamp-2">{s.supplierAddress || 'No address specified'}</span>
                  </div>
                </div>
              </div>

              <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                <span className="flex items-center gap-1">
                  <Package className="w-3.5 h-3.5 text-teal-600" />
                  <span>Supplied: <strong>{supplierStockCount} units</strong></span>
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Add Supplier Modal */}
      {isAddOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 w-full max-w-md p-5 space-y-4 animate-scaleUp">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h2 className="font-bold text-sm text-slate-800 flex items-center gap-2">
                <Truck className="w-4 h-4 text-teal-700" />
                <span>Register New Supplier</span>
              </h2>
              <button
                onClick={() => setIsAddOpen(false)}
                className="text-slate-400 hover:text-slate-600 text-lg leading-none"
              >
                ×
              </button>
            </div>

            <form onSubmit={handleAddSupplier} className="space-y-3 text-xs">
              <div>
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block mb-1">
                  Supplier / Company Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g., TechSource Distribution Corp"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full text-xs border border-slate-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block mb-1">
                  Contact Number
                </label>
                <input
                  type="text"
                  placeholder="e.g., 0917-123-4567"
                  value={contact}
                  onChange={(e) => setContact(e.target.value)}
                  className="w-full text-xs border border-slate-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block mb-1">
                  Email Address
                </label>
                <input
                  type="email"
                  placeholder="e.g., sales@supplier.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full text-xs border border-slate-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block mb-1">
                  Office / Warehouse Address
                </label>
                <textarea
                  rows={2}
                  placeholder="Warehouse address..."
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className="w-full text-xs border border-slate-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-teal-500 resize-none"
                ></textarea>
              </div>

              <div className="pt-2 flex justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsAddOpen(false)}
                  className="px-4 py-2 rounded-lg text-slate-600 hover:bg-slate-100 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-lg bg-teal-700 hover:bg-teal-800 text-white font-bold shadow-sm"
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
