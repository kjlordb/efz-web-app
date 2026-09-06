import React, { useState, useEffect } from 'react';
import { X, Package, Wand2, Shield, AlertCircle } from 'lucide-react';
import { inventoryService } from '../../services/api';
import { CATEGORIES } from '../../services/mockData';
import { StockItem, Supplier } from '../../types';

interface AddStockModalProps {
  itemToEdit?: StockItem | null;
  suppliers: Supplier[];
  onClose: () => void;
  onSaved: () => void;
}

const WARRANTY_OPTIONS = [7, 30, 60, 90, 180, 365, 730];

export const AddStockModal: React.FC<AddStockModalProps> = ({
  itemToEdit,
  suppliers,
  onClose,
  onSaved
}) => {
  const [serial, setSerial] = useState(itemToEdit?.stockSerial || '');
  const [category, setCategory] = useState(itemToEdit?.stockName || CATEGORIES[0]);
  const [details, setDetails] = useState(itemToEdit?.stockDetails || '');
  const [price, setPrice] = useState<number | ''>(itemToEdit?.stockPrice || '');
  const [cost, setCost] = useState<number | ''>(itemToEdit?.suppliersPrice || '');
  const [supplier, setSupplier] = useState(
    itemToEdit?.supplierName || (suppliers[0]?.supplierName || 'TechSource Distribution Corp')
  );
  const [warranty, setWarranty] = useState<number>(itemToEdit?.warranty || 365);
  const [remarks, setRemarks] = useState(itemToEdit?.remarks || '');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const generateRandomSerial = () => {
    const prefix = category.substring(0, 3).toUpperCase();
    const randomNum = Math.floor(100000 + Math.random() * 900000);
    setSerial(`SN-${prefix}-${randomNum}`);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!serial.trim() || !details.trim() || price === '' || cost === '') {
      setError('Please fill in all required fields.');
      return;
    }

    setSubmitting(true);
    setError(null);
    try {
      if (itemToEdit) {
        await inventoryService.updateStockItem(itemToEdit.id, {
          stockSerial: serial.trim(),
          stockName: category,
          stockDetails: details.trim(),
          stockPrice: Number(price),
          suppliersPrice: Number(cost),
          supplierName: supplier,
          warranty: Number(warranty),
          remarks: remarks.trim()
        });
      } else {
        await inventoryService.addStockItem({
          stockSerial: serial.trim(),
          stockName: category,
          stockDetails: details.trim(),
          stockPrice: Number(price),
          suppliersPrice: Number(cost),
          supplierName: supplier,
          warranty: Number(warranty),
          remarks: remarks.trim()
        });
      }
      onSaved();
    } catch (err: any) {
      setError(err.message || 'Failed to save stock item');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-xl border border-slate-200 w-full max-w-lg p-6 space-y-4 animate-scaleUp my-6">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <Package className="w-5 h-5 text-teal-700" />
            <h2 className="font-bold text-base text-slate-800">
              {itemToEdit ? `Edit Stock Item (${itemToEdit.stockSerial})` : 'Add New Serialized Item'}
            </h2>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-3.5 py-2.5 rounded-lg text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-3.5 text-xs">
          {/* Serial number with Auto-Gen */}
          <div>
            <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block mb-1">
              Hardware Serial Number (Unique) *
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                required
                placeholder="e.g., SN-GPU-4070-001"
                value={serial}
                onChange={(e) => setSerial(e.target.value)}
                className="flex-1 font-mono text-xs border border-slate-300 rounded-lg px-3 py-2 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500 font-bold text-teal-900"
              />
              <button
                type="button"
                onClick={generateRandomSerial}
                className="flex items-center gap-1 text-xs bg-slate-100 hover:bg-slate-200 text-slate-700 px-3 py-2 rounded-lg font-medium border border-slate-300"
                title="Generate Random Serial"
              >
                <Wand2 className="w-3.5 h-3.5 text-teal-700" />
                <span>Auto-Gen</span>
              </button>
            </div>
          </div>

          {/* Category & Supplier */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block mb-1">
                Category *
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full text-xs border border-slate-300 rounded-lg px-2.5 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-teal-500 font-medium text-slate-800"
              >
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block mb-1">
                Supplier *
              </label>
              <select
                value={supplier}
                onChange={(e) => setSupplier(e.target.value)}
                className="w-full text-xs border border-slate-300 rounded-lg px-2.5 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-teal-500 font-medium text-slate-800"
              >
                {suppliers.map((s) => (
                  <option key={s.id} value={s.supplierName}>{s.supplierName}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Specifications / Details */}
          <div>
            <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block mb-1">
              Model & Specifications *
            </label>
            <input
              type="text"
              required
              placeholder="e.g., ASUS TUF Gaming GeForce RTX 4070 SUPER OC Edition 12GB GDDR6X"
              value={details}
              onChange={(e) => setDetails(e.target.value)}
              className="w-full text-xs border border-slate-300 rounded-lg px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
          </div>

          {/* Retail Price & Supplier Cost */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block mb-1">
                Retail Price (₱) *
              </label>
              <input
                type="number"
                step="0.01"
                required
                placeholder="42500.00"
                value={price}
                onChange={(e) => setPrice(e.target.value === '' ? '' : Number(e.target.value))}
                className="w-full font-mono text-xs border border-slate-300 rounded-lg px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-teal-500 font-bold"
              />
            </div>

            <div>
              <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block mb-1">
                Supplier Cost (₱) *
              </label>
              <input
                type="number"
                step="0.01"
                required
                placeholder="37500.00"
                value={cost}
                onChange={(e) => setCost(e.target.value === '' ? '' : Number(e.target.value))}
                className="w-full font-mono text-xs border border-slate-300 rounded-lg px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-teal-500 font-bold"
              />
            </div>
          </div>

          {/* Warranty Duration */}
          <div>
            <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block mb-1">
              Warranty Duration *
            </label>
            <div className="flex gap-2 flex-wrap">
              {WARRANTY_OPTIONS.map((days) => (
                <button
                  type="button"
                  key={days}
                  onClick={() => setWarranty(days)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                    warranty === days
                      ? 'bg-teal-700 text-white border-teal-800 shadow-sm'
                      : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  {days >= 365 ? `${days / 365} Year${days > 365 ? 's' : ''}` : `${days} Days`}
                </button>
              ))}
            </div>
          </div>

          {/* Remarks */}
          <div>
            <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block mb-1">
              Batch Remarks / Note
            </label>
            <input
              type="text"
              placeholder="e.g., Batch shipment A1, sealed packaging"
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
              className="w-full text-xs border border-slate-300 rounded-lg px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
          </div>

          {/* Actions */}
          <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-slate-600 font-semibold hover:bg-slate-100 rounded-lg"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-5 py-2 bg-teal-700 hover:bg-teal-800 text-white font-bold rounded-lg shadow-sm transition-all"
            >
              {submitting ? 'Saving...' : itemToEdit ? 'Update Item' : 'Save Stock Item'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
