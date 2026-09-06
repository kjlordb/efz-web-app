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
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl border border-slate-200 w-full max-w-md p-6 space-y-4 animate-scaleUp">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <Tag className="w-5 h-5 text-teal-700" />
            <h2 className="font-bold text-base text-slate-800">Batch Price Modification</h2>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        <p className="text-xs text-slate-500">
          Bulk update retail selling prices across matching in-stock items. Replaces <code>MultipleChangePriceForm</code>.
        </p>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-3.5 py-2.5 rounded-lg text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleBatchUpdate} className="space-y-3.5 text-xs">
          <div>
            <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block mb-1">
              Category *
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full text-xs border border-slate-300 rounded-lg px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-teal-500 font-medium"
            >
              <option value="All Stocks">All Categories</option>
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block mb-1">
              Specification / Model Keyword (Optional)
            </label>
            <input
              type="text"
              placeholder="e.g., RTX 4070, DDR5 6000MHz, Core i7"
              value={specKeywords}
              onChange={(e) => setSpecKeywords(e.target.value)}
              className="w-full text-xs border border-slate-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
            <span className="text-[10px] text-slate-400 mt-0.5 block">
              Leave empty to update all items within the category
            </span>
          </div>

          <div>
            <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block mb-1">
              New Retail Selling Price (₱) *
            </label>
            <input
              type="number"
              step="0.01"
              required
              placeholder="0.00"
              value={newPrice}
              onChange={(e) => setNewPrice(e.target.value === '' ? '' : Number(e.target.value))}
              className="w-full text-xs font-mono font-bold border border-slate-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
          </div>

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
              className="px-5 py-2 bg-teal-700 hover:bg-teal-800 text-white font-bold rounded-lg shadow-sm"
            >
              {submitting ? 'Applying...' : 'Apply New Price'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
