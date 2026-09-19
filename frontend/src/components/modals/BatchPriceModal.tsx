import React, { useState } from 'react';
import { X, Tag, DollarSign, AlertCircle } from 'lucide-react';
import { inventoryService } from '../../services/api';
import { CATEGORIES } from '../../services/mockData';

interface BatchPriceModalProps {
  onClose: () => void;
  onSuccess: (count: number) => void;
}

export const BatchPriceModal: React.FC<BatchPriceModalProps> = ({ onClose, onSuccess }) => {
  const [category, setCategory] = useState(CATEGORIES[0]);
  const [specKeywords, setSpecKeywords] = useState('');
  const [newPrice, setNewPrice] = useState<number | ''>('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleBatchUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPrice === '' || Number(newPrice) <= 0) {
      setError('Please enter a valid retail price greater than 0.');
      return;
    }

    setSubmitting(true);
    setError(null);
    try {
      const count = await inventoryService.batchUpdatePrice(
        category,
        specKeywords.trim(),
        Number(newPrice)
      );

      if (count === 0) {
        setError('No active stored items matched the category and specification keywords.');
        setSubmitting(false);
        return;
      }

      onSuccess(count);
    } catch (err: any) {
      setError(err.message || 'Failed to execute batch price update');
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-950/75 backdrop-blur-md z-50 flex items-center justify-center p-4">
      <div className="glass-modal rounded-2xl w-full max-w-md p-6 space-y-4 shadow-glass-modal border border-white/[0.14] animate-scaleUp">
        <div className="flex items-center justify-between border-b border-white/[0.08] pb-3">
          <div className="flex items-center gap-2">
            <Tag className="w-5 h-5 text-teal-400 drop-shadow-[0_0_8px_rgba(29,130,150,0.5)]" />
            <h2 className="font-bold text-base text-slate-100">Batch Price Modification</h2>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-white/[0.08] transition-colors cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>

        <p className="text-xs text-slate-400">
          Bulk update retail selling prices across matching in-stock items. Replaces <code className="text-teal-300 font-mono">MultipleChangePriceForm</code>.
        </p>

        {error && (
          <div className="bg-red-500/15 border border-red-500/30 text-red-300 px-3.5 py-2.5 rounded-xl text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleBatchUpdate} className="space-y-3.5 text-xs">
          <div>
            <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
              Category *
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full text-xs glass-input rounded-xl px-3 py-2 font-medium text-slate-200"
            >
              <option value="All Stocks" className="bg-slate-900 text-slate-100">All Categories</option>
              {CATEGORIES.map((c) => (
                <option key={c} value={c} className="bg-slate-900 text-slate-100">{c}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
              Specification / Model Keyword (Optional)
            </label>
            <input
              type="text"
              placeholder="e.g., RTX 4070, DDR5 6000MHz, Core i7"
              value={specKeywords}
              onChange={(e) => setSpecKeywords(e.target.value)}
              className="w-full text-xs glass-input rounded-xl px-3 py-2 placeholder:text-slate-500"
            />
            <span className="text-[10px] text-slate-400 mt-1 block">
              Leave empty to update all items within the category
            </span>
          </div>

          <div>
            <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
              New Retail Selling Price (₱ PHP) *
            </label>
            <input
              type="number"
              step="0.01"
              required
              placeholder="0.00"
              value={newPrice}
              onChange={(e) => setNewPrice(e.target.value === '' ? '' : Number(e.target.value))}
              className="w-full text-xs font-mono font-bold glass-input rounded-xl px-3 py-2 text-amber-300 placeholder:text-slate-500"
            />
          </div>

          <div className="pt-3 border-t border-white/[0.08] flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-slate-300 font-semibold hover:bg-white/[0.06] rounded-xl transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-5 py-2 bg-gradient-to-r from-teal-600 to-teal-500 hover:from-teal-500 hover:to-teal-400 text-slate-950 font-bold rounded-xl shadow-lg shadow-teal-900/40 transition-all cursor-pointer disabled:opacity-50"
            >
              {submitting ? 'Applying...' : 'Apply New Price'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
