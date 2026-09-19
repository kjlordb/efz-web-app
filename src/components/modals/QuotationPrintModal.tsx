import React, { useState, useEffect } from 'react';
import { 
  Printer, 
  X, 
  ZoomIn, 
  ZoomOut, 
  FileText, 
  ShieldCheck, 
  Building2, 
  Phone, 
  Mail, 
  MapPin, 
  CreditCard,
  Banknote,
  CalendarCheck
} from 'lucide-react';
import { Customer, QuotationHeader } from '../../types';
import { BarcodeSvg } from '../common/BarcodeSvg';
import { CertifiedStamp } from '../common/CertifiedStamp';

interface QuotationPrintModalProps {
  quote: QuotationHeader;
  customer?: Customer;
  onClose: () => void;
}

export const QuotationPrintModal: React.FC<QuotationPrintModalProps> = ({
  quote,
  customer,
  onClose
}) => {
  const [zoomLevel, setZoomLevel] = useState<number>(100);

  const handlePrint = () => {
    window.print();
  };

  // Keyboard shortcut listener: Ctrl+P prints, Esc closes
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'p') {
        e.preventDefault();
        handlePrint();
      } else if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  const formattedDate = new Date(quote.quotationDate).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  const rawQuoteNo = `QTN-2026-${String(quote.quotationId).padStart(5, '0')}`;

  const clientName = customer?.fullName || quote.customerName || 'Prospective Corporate Client';
  const clientCompany = customer?.company;
  const clientAddress = customer?.address || 'Davao City, Philippines';
  const clientPhone = customer?.contactNumber || 'N/A';

  return (
    <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-50 flex flex-col items-center justify-start overflow-y-auto p-2 sm:p-6 select-none animate-fadeIn">
      {/* Top Floating Control Bar (Hidden on physical print) */}
      <header className="no-print sticky top-2 z-40 w-full max-w-4xl glass-panel border border-white/[0.12] text-white px-5 py-3 rounded-2xl shadow-glass-modal flex items-center justify-between gap-4 mb-4">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-teal-500/20 border border-teal-400/30 flex items-center justify-center text-teal-300">
            <FileText className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-sm tracking-tight text-white">
                Price Quotation & Commercial Proposal
              </span>
              <span className="text-[10px] bg-amber-500/20 border border-amber-400/30 text-amber-300 font-bold px-2 py-0.5 rounded-full uppercase">
                Official Estimate
              </span>
            </div>
            <p className="text-[11px] text-slate-400 font-mono">
              Quote Ref: {rawQuoteNo} • Workstation: {quote.computerName || 'WEB-TERM-01'}
            </p>
          </div>
        </div>

        {/* Zoom & Action Controls */}
        <div className="flex items-center gap-2">
          {/* Zoom Controls */}
          <div className="hidden sm:flex items-center bg-slate-800/90 border border-slate-700 rounded-lg p-1 text-xs">
            <button
              onClick={() => setZoomLevel((z) => Math.max(z - 10, 75))}
              title="Zoom Out"
              disabled={zoomLevel <= 75}
              className="p-1 hover:bg-slate-700 rounded text-slate-300 hover:text-white disabled:opacity-40"
            >
              <ZoomOut className="w-3.5 h-3.5" />
            </button>
            <span className="px-2 font-mono text-[11px] text-slate-200 min-w-[42px] text-center">
              {zoomLevel}%
            </span>
            <button
              onClick={() => setZoomLevel((z) => Math.min(z + 10, 130))}
              title="Zoom In"
              disabled={zoomLevel >= 130}
              className="p-1 hover:bg-slate-700 rounded text-slate-300 hover:text-white disabled:opacity-40"
            >
              <ZoomIn className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Paper Spec Pill */}
          <span className="hidden md:inline-block text-[10px] font-mono text-slate-400 bg-slate-800 px-2.5 py-1.5 rounded-lg border border-slate-700">
            A4 Standard (210×297mm)
          </span>

          {/* Primary Print Button */}
          <button
            onClick={handlePrint}
            className="flex items-center gap-2 bg-gradient-to-r from-teal-600 to-teal-500 hover:from-teal-500 hover:to-teal-400 text-slate-950 font-black text-xs px-4 py-2 rounded-xl transition-all shadow-lg shadow-teal-900/40 cursor-pointer"
          >
            <Printer className="w-3.5 h-3.5 text-slate-950" />
            <span>Print Quotation</span>
            <kbd className="hidden sm:inline-block text-[9px] bg-slate-950/20 px-1 py-0.5 rounded font-mono">
              Ctrl+P
            </kbd>
          </button>

          {/* Close Modal Button */}
          <button
            onClick={onClose}
            title="Close Preview (Esc)"
            className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </header>

      {/* Realistic Simulated Paper Sheet Container */}
      <div
        className="w-full max-w-4xl transition-transform duration-200 origin-top flex justify-center pb-12"
        style={{ transform: `scale(${zoomLevel / 100})` }}
      >
        {/* The Physical Document Sheet (A4 Proportion Canvas) */}
        <div className="print-area bg-white text-slate-800 shadow-[0_25px_60px_-15px_rgba(0,0,0,0.5)] border border-slate-300 rounded-lg w-full max-w-[820px] p-10 sm:p-12 space-y-7 relative overflow-hidden font-sans select-text">
          
          {/* Subtle Background Watermark */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-[0.03] select-none">
            <img
              src="/efz-3d-gold.png"
              alt="Watermark"
              className="w-[500px] h-[500px] object-contain filter grayscale"
            />
          </div>

          {/* Official Letterhead Header */}
          <div className="border-b-2 border-slate-900 pb-6 relative z-10 flex flex-col sm:flex-row items-start justify-between gap-6">
            <div className="flex items-start gap-4">
              <img
                src="/efz-3d-gold.png"
                alt="EFZ Davao Computer Sales Official Emblem"
                className="w-22 h-22 object-contain rounded-full border-2 border-amber-400 p-1 shrink-0 shadow-md bg-white"
              />
              <div className="space-y-0.5">
                <h1 className="text-2xl font-black text-teal-950 tracking-tight uppercase leading-tight font-sans">
                  EFZ DAVAO COMPUTER SALES
                </h1>
                <p className="text-xs font-semibold text-slate-700">
                  Custom High-End PC Builds • Authorized Enterprise Hardware & Accessories
                </p>
                <div className="text-[11px] text-slate-600 space-y-0.5 pt-1">
                  <div className="flex items-center gap-1.5">
                    <MapPin className="w-3 h-3 text-teal-700 shrink-0" />
                    <span>Door 3, Davao Commercial Complex, J.P. Laurel Ave, Bajada, Davao City, 8000</span>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="flex items-center gap-1">
                      <Phone className="w-3 h-3 text-teal-700 shrink-0" />
                      <span>Tel: (082) 298-7654 / +63 917 123 4567</span>
                    </span>
                    <span className="flex items-center gap-1">
                      <Mail className="w-3 h-3 text-teal-700 shrink-0" />
                      <span>quotes@efzdavao.ph</span>
                    </span>
                  </div>
                  <div className="text-[10px] font-mono text-slate-500 pt-0.5">
                    TIN: <strong>123-456-789-000 NV</strong> • Quotation Validity: <strong>30 Calendar Days</strong>
                  </div>
                </div>
              </div>
            </div>

            {/* Document Classification Box & Barcode */}
            <div className="flex flex-col items-start sm:items-end text-left sm:text-right shrink-0">
              <div className="inline-block bg-[#0E5460] text-white px-4 py-1.5 rounded-lg font-black text-sm tracking-wider uppercase shadow-sm border border-teal-800">
                FORMAL PRICE QUOTATION
              </div>
              <div className="mt-2 font-mono text-base font-black text-slate-900 tracking-tight">
                {rawQuoteNo}
              </div>
              <div className="text-xs text-slate-600 font-medium">
                Issue Date: {formattedDate}
              </div>
              {/* Barcode representation */}
              <div className="mt-2">
                <BarcodeSvg value={rawQuoteNo} height={32} showText={false} />
              </div>
            </div>
          </div>

          {/* Client & Quotation Meta Grid */}
          <div className="relative z-10 grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs bg-slate-50 p-4 rounded-xl border border-slate-200">
            <div className="space-y-1">
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 block">
                Quotation Prepared For:
              </span>
              <div className="font-extrabold text-sm text-slate-900">
                {clientName}
              </div>
              {clientCompany && (
                <div className="text-slate-800 font-semibold flex items-center gap-1.5">
                  <Building2 className="w-3.5 h-3.5 text-slate-500" />
                  <span>{clientCompany}</span>
                </div>
              )}
              <div className="text-slate-600 leading-snug">
                {clientAddress}
              </div>
              <div className="text-slate-600 font-mono">
                {clientPhone}
              </div>
            </div>

            <div className="space-y-1 text-left sm:text-right border-t sm:border-t-0 pt-2 sm:pt-0 border-slate-200">
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 block">
                Commercial Parameters:
              </span>
              <div>
                <span className="text-slate-500 font-medium">Proposal Status:</span>{' '}
                <strong className="text-emerald-800 font-bold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 inline-block">
                  {quote.quotationStatus || 'Active Formal Proposal'}
                </strong>
              </div>
              <div>
                <span className="text-slate-500 font-medium">Account Specialist:</span>{' '}
                <strong className="text-slate-800 font-semibold">{quote.encoder}</strong>
              </div>
              <div>
                <span className="text-slate-500 font-medium">Origin Station:</span>{' '}
                <strong className="font-mono text-teal-800 font-semibold">{quote.computerName}</strong>
              </div>
              {quote.remarks && (
                <div className="text-[11px] text-slate-600 italic">
                  Note: "{quote.remarks}"
                </div>
              )}
            </div>
          </div>

          {/* Itemized Line Items Table */}
          <div className="relative z-10 overflow-hidden">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-100 border-y-2 border-slate-800 text-slate-800 font-black uppercase text-[10px] tracking-wider">
                  <th className="py-2.5 px-3 w-10 text-center">#</th>
                  <th className="py-2.5 px-3">Product Category & Specification</th>
                  <th className="py-2.5 px-3 text-center w-16">Qty</th>
                  <th className="py-2.5 px-3 text-right">Unit Price (₱)</th>
                  <th className="py-2.5 px-3 text-right">Subtotal (₱)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {quote.items.map((item, idx) => (
                  <tr key={idx} className="even:bg-slate-50/60 hover:bg-slate-50 transition-colors">
                    <td className="py-3 px-3 text-center font-mono text-slate-400 text-[11px]">
                      {String(idx + 1).padStart(2, '0')}
                    </td>
                    <td className="py-3 px-3">
                      <div className="font-bold text-slate-900 text-xs">{item.stockName}</div>
                      <div className="text-[11px] text-slate-600 font-medium">{item.stockDetails}</div>
                    </td>
                    <td className="py-3 px-3 text-center font-mono font-bold text-slate-800">
                      {item.quantity}
                    </td>
                    <td className="py-3 px-3 text-right font-mono font-medium text-slate-700">
                      ₱{item.stockPrice.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </td>
                    <td className="py-3 px-3 text-right font-mono font-bold text-slate-900">
                      ₱{item.subTotal.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* 3-Tier Financing Matrix matching legacy Crystal Report */}
          <div className="relative z-10 bg-slate-50 p-5 rounded-2xl border border-slate-200 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-xs font-black uppercase tracking-wider text-slate-800">
                <CreditCard className="w-4 h-4 text-teal-700" />
                <span>Payment Options & Multi-Tier Pricing Schedule:</span>
              </div>
              <span className="text-[10px] text-slate-500 font-mono">
                Formula Engine: P1 / P2 / P3
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 text-center">
              {/* Option 1: Cash Net Total (P3) */}
              <div className="bg-white p-4 rounded-xl border-2 border-emerald-600 shadow-sm relative overflow-hidden flex flex-col justify-between">
                <div className="absolute top-0 right-0 bg-emerald-600 text-white text-[9px] font-black uppercase px-2 py-0.5 rounded-bl">
                  Best Value
                </div>
                <div>
                  <div className="text-[10px] font-extrabold uppercase tracking-wider text-emerald-800">
                    Option A: Cash Discount Net (P3)
                  </div>
                  <div className="text-xl font-black text-slate-950 font-mono mt-1">
                    ₱{quote.payMethod3.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                  </div>
                </div>
                <div className="text-[10px] text-emerald-700 font-medium mt-2 pt-2 border-t border-slate-100">
                  Instant Liquidation Discount
                </div>
              </div>

              {/* Option 2: 3-Month / Straight CC (P2) */}
              <div className="bg-white p-4 rounded-xl border border-teal-300 shadow-sm flex flex-col justify-between">
                <div>
                  <div className="text-[10px] font-extrabold uppercase tracking-wider text-teal-800">
                    Option B: 3-Mo / Card Rate (P2)
                  </div>
                  <div className="text-xl font-black text-teal-950 font-mono mt-1">
                    ₱{quote.payMethod2.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                  </div>
                </div>
                <div className="text-[10px] text-slate-500 font-medium mt-2 pt-2 border-t border-slate-100">
                  Major Credit Cards Accepted
                </div>
              </div>

              {/* Option 3: 12-Month Installment (P1) */}
              <div className="bg-white p-4 rounded-xl border border-slate-300 shadow-sm flex flex-col justify-between">
                <div>
                  <div className="text-[10px] font-extrabold uppercase tracking-wider text-slate-700">
                    Option C: 12-Mo Commercial Financing (P1)
                  </div>
                  <div className="text-xl font-black text-slate-900 font-mono mt-1">
                    ₱{quote.payMethod1.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                  </div>
                </div>
                <div className="text-[10px] text-slate-500 font-medium mt-2 pt-2 border-t border-slate-100">
                  Amortized: ~₱{(quote.payMethod1 / 12).toLocaleString('en-US', { maximumFractionDigits: 2 })} / mo
                </div>
              </div>
            </div>
          </div>

          {/* Quotation Terms & Conditions Box */}
          <div className="relative z-10 bg-slate-50 p-4 rounded-xl border border-slate-200 text-[10px] text-slate-600 space-y-1 leading-relaxed">
            <div className="flex items-center gap-1.5 font-bold text-slate-800 uppercase tracking-wider">
              <CalendarCheck className="w-3.5 h-3.5 text-teal-700" />
              <span>Commercial Terms & Proposal Guidelines:</span>
            </div>
            <p>1. <strong>Price Validity:</strong> Prices and item allocations quoted herein are firm for thirty (30) days from the issue date.</p>
            <p>2. <strong>Inventory Availability:</strong> Stock allocation is subject to prior sales unless backed by a formal purchase order or deposit.</p>
            <p>3. <strong>Warranty Inclusion:</strong> All quoted units carry manufacturer/distributor warranties with full technical support in Davao City.</p>
          </div>

          {/* Signatures & Conforme Block */}
          <div className="relative z-10 pt-6 border-t border-slate-200 grid grid-cols-2 gap-12 text-center text-xs page-break-inside-avoid">
            <div className="space-y-1">
              <div className="border-b border-slate-400 w-52 mx-auto h-8"></div>
              <div className="font-black text-slate-900 uppercase tracking-tight">
                {quote.encoder}
              </div>
              <div className="text-[10px] text-slate-500 uppercase tracking-wider">
                Sales Specialist / Account Executive
              </div>
            </div>

            <div className="space-y-1">
              <div className="border-b border-slate-400 w-52 mx-auto h-8"></div>
              <div className="font-black text-slate-900 uppercase tracking-tight">
                Client Conforme
              </div>
              <div className="text-[10px] text-slate-500 uppercase tracking-wider">
                Authorized Signature Over Printed Name
              </div>
            </div>
          </div>

          {/* Document Micro-Footer */}
          <div className="pt-2 text-center text-[9px] text-slate-400 font-mono">
            EFZ Davao Computer Sales • Official Commercial Quotation • www.efzdavao.ph
          </div>
        </div>
      </div>
    </div>
  );
};
