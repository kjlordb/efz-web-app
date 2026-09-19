import React, { useState, useEffect } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight
} from 'lucide-react';

export interface PaginationProps {
  currentPage: number;
  totalItems: number;
  pageSize: number;
  pageSizeOptions?: number[];
  onPageChange: (page: number) => void;
  onPageSizeChange?: (pageSize: number) => void;
  label?: string;
  compact?: boolean;
  showPageSizeSelector?: boolean;
  showJumpToPage?: boolean;
  className?: string;
}

export const Pagination: React.FC<PaginationProps> = ({
  currentPage,
  totalItems,
  pageSize,
  pageSizeOptions = [10, 20, 50, 100],
  onPageChange,
  onPageSizeChange,
  label = 'records',
  compact = false,
  showPageSizeSelector = true,
  showJumpToPage = true,
  className = ''
}) => {
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const [jumpInput, setJumpInput] = useState(String(currentPage));

  useEffect(() => {
    setJumpInput(String(currentPage));
  }, [currentPage]);

  if (totalItems <= 0) {
    return null;
  }

  const startItem = (currentPage - 1) * pageSize + 1;
  const endItem = Math.min(currentPage * pageSize, totalItems);

  const handleJumpSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const p = parseInt(jumpInput, 10);
    if (!isNaN(p) && p >= 1 && p <= totalPages) {
      onPageChange(p);
    } else {
      setJumpInput(String(currentPage));
    }
  };

  // Generate pagination numbers array with ellipsis
  const getPageNumbers = (): (number | string)[] => {
    if (totalPages <= 7) {
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }

    const pages: (number | string)[] = [];
    pages.push(1);

    if (currentPage > 3) {
      pages.push('...');
    }

    const start = Math.max(2, currentPage - 1);
    const end = Math.min(totalPages - 1, currentPage + 1);

    for (let i = start; i <= end; i++) {
      pages.push(i);
    }

    if (currentPage < totalPages - 2) {
      pages.push('...');
    }

    pages.push(totalPages);
    return pages;
  };

  if (compact) {
    return (
      <div
        className={`flex items-center justify-between text-xs text-slate-400 py-2 px-3 border-t border-white/[0.08] bg-slate-950/40 rounded-b-2xl ${className}`}
      >
        <div className="text-[11px] truncate">
          <span className="text-slate-200 font-semibold">{startItem}</span>-
          <span className="text-slate-200 font-semibold">{endItem}</span> of{' '}
          <span className="text-slate-200 font-semibold">{totalItems}</span>
        </div>

        <div className="flex items-center gap-1">
          <button
            type="button"
            disabled={currentPage <= 1}
            onClick={() => onPageChange(currentPage - 1)}
            className="p-1 rounded-lg border border-white/[0.1] disabled:opacity-30 disabled:cursor-not-allowed hover:bg-white/[0.08] text-slate-200 transition-colors cursor-pointer"
            title="Previous page"
          >
            <ChevronLeft className="w-3.5 h-3.5" />
          </button>
          <span className="px-1.5 text-[11px] font-mono text-slate-300">
            {currentPage}/{totalPages}
          </span>
          <button
            type="button"
            disabled={currentPage >= totalPages}
            onClick={() => onPageChange(currentPage + 1)}
            className="p-1 rounded-lg border border-white/[0.1] disabled:opacity-30 disabled:cursor-not-allowed hover:bg-white/[0.08] text-slate-200 transition-colors cursor-pointer"
            title="Next page"
          >
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`p-3 sm:p-3.5 border-t border-white/[0.08] bg-slate-950/70 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-slate-400 rounded-b-2xl select-none ${className}`}
    >
      {/* Record info & Page Size Selector */}
      <div className="flex items-center gap-3 flex-wrap">
        <div>
          Showing{' '}
          <strong className="font-semibold text-slate-200">{startItem}</strong> to{' '}
          <strong className="font-semibold text-slate-200">{endItem}</strong> of{' '}
          <strong className="font-semibold text-teal-300 font-mono">
            {totalItems.toLocaleString()}
          </strong>{' '}
          {label}
        </div>

        {showPageSizeSelector && onPageSizeChange && (
          <div className="flex items-center gap-1.5 text-[11px]">
            <span className="text-slate-500">Per page:</span>
            <select
              value={pageSize}
              onChange={(e) => {
                const newSize = Number(e.target.value);
                onPageSizeChange(newSize);
                onPageChange(1);
              }}
              className="bg-slate-900 border border-white/[0.1] text-slate-200 text-xs rounded-lg px-2 py-1 font-medium cursor-pointer focus:border-teal-500 focus:outline-none"
            >
              {pageSizeOptions.map((opt) => (
                <option key={opt} value={opt} className="bg-slate-900 text-slate-100">
                  {opt}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Navigation Controls */}
      <div className="flex items-center gap-1.5 flex-wrap self-end sm:self-auto">
        {/* First Page */}
        <button
          type="button"
          disabled={currentPage <= 1}
          onClick={() => onPageChange(1)}
          className="p-1.5 rounded-xl border border-white/[0.1] disabled:opacity-30 disabled:cursor-not-allowed hover:bg-white/[0.06] text-slate-200 transition-colors cursor-pointer"
          title="First Page"
        >
          <ChevronsLeft className="w-3.5 h-3.5" />
        </button>

        {/* Previous Page */}
        <button
          type="button"
          disabled={currentPage <= 1}
          onClick={() => onPageChange(currentPage - 1)}
          className="p-1.5 rounded-xl border border-white/[0.1] disabled:opacity-30 disabled:cursor-not-allowed hover:bg-white/[0.06] text-slate-200 transition-colors cursor-pointer"
          title="Previous Page"
        >
          <ChevronLeft className="w-3.5 h-3.5" />
        </button>

        {/* Page Number Pills (Hidden on very narrow mobile screens) */}
        <div className="hidden sm:flex items-center gap-1">
          {getPageNumbers().map((num, idx) => {
            if (num === '...') {
              return (
                <span key={`dots-${idx}`} className="px-1.5 text-slate-500 text-xs">
                  •••
                </span>
              );
            }

            const pageNum = num as number;
            const isActive = pageNum === currentPage;

            return (
              <button
                key={pageNum}
                type="button"
                onClick={() => onPageChange(pageNum)}
                className={`min-w-[28px] h-7 px-2 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  isActive
                    ? 'bg-teal-500 text-slate-950 font-bold shadow-glow-teal'
                    : 'text-slate-300 hover:bg-white/[0.08] hover:text-white border border-white/[0.06]'
                }`}
              >
                {pageNum}
              </button>
            );
          })}
        </div>

        {/* Mobile Page indicator */}
        <div className="sm:hidden px-2 text-xs font-medium text-slate-300">
          Page {currentPage} of {totalPages}
        </div>

        {/* Next Page */}
        <button
          type="button"
          disabled={currentPage >= totalPages}
          onClick={() => onPageChange(currentPage + 1)}
          className="p-1.5 rounded-xl border border-white/[0.1] disabled:opacity-30 disabled:cursor-not-allowed hover:bg-white/[0.06] text-slate-200 transition-colors cursor-pointer"
          title="Next Page"
        >
          <ChevronRight className="w-3.5 h-3.5" />
        </button>

        {/* Last Page */}
        <button
          type="button"
          disabled={currentPage >= totalPages}
          onClick={() => onPageChange(totalPages)}
          className="p-1.5 rounded-xl border border-white/[0.1] disabled:opacity-30 disabled:cursor-not-allowed hover:bg-white/[0.06] text-slate-200 transition-colors cursor-pointer"
          title="Last Page"
        >
          <ChevronsRight className="w-3.5 h-3.5" />
        </button>

        {/* Jump to Page input for large datasets */}
        {showJumpToPage && totalPages > 5 && (
          <form onSubmit={handleJumpSubmit} className="hidden md:flex items-center gap-1.5 ml-2 pl-2 border-l border-white/[0.1]">
            <span className="text-[11px] text-slate-500">Go:</span>
            <input
              type="text"
              inputMode="numeric"
              value={jumpInput}
              onChange={(e) => setJumpInput(e.target.value)}
              onBlur={handleJumpSubmit}
              className="w-11 bg-slate-900 border border-white/[0.1] text-slate-200 text-xs text-center rounded-lg py-1 px-1 font-mono focus:border-teal-500 focus:outline-none"
              title="Jump directly to page number"
            />
          </form>
        )}
      </div>
    </div>
  );
};
