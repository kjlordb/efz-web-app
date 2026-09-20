import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { 
  Printer, 
  X, 
  ZoomIn, 
  ZoomOut, 
  FileText, 
  CheckCircle2, 
  ShieldCheck, 
  Building2, 
  Phone, 
  Mail, 
  MapPin, 
  CreditCard,
  QrCode
} from 'lucide-react';
import { Order } from '../../types';
import { BarcodeSvg } from '../common/BarcodeSvg';
import { CertifiedStamp } from '../common/CertifiedStamp';

interface InvoicePrintModalProps {
  order: Order;
  onClose: () => void;
}

export const InvoicePrintModal: React.FC<InvoicePrintModalProps> = ({ order, onClose }) => {
  const [zoomLevel, setZoomLevel] = useState<number>(100);

  const handlePrint = () => {
    window.print();
  };

  // Ensure body has print-active class when modal is open to isolate printable canvas
  useEffect(() => {
    document.body.classList.add('print-active');
    return () => {
      document.body.classList.remove('print-active');
    };
  }, []);

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

  const formattedDate = new Date(order.orderDate).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });

  const rawInvoiceNo = `INV-2026-${String(order.id).padStart(5, '0')}`;

  // 12% Philippine VAT Breakdown calculations
  const totalAmount = order.orderAmount;
  const vatableSales = totalAmount / 1.12;
  const vatAmount = totalAmount - vatableSales;

  return createPortal(
    <div className="print-modal-overlay fixed inset-0 bg-slate-950/80 backdrop-blur-md z-50 flex flex-col items-center justify-start overflow-y-auto p-2 sm:p-6 select-none animate-fadeIn">
      {/* Top Floating Control Bar (Hidden on physical print) */}
      <header className="no-print sticky top-2 z-40 w-full max-w-4xl glass-panel border border-white/[0.12] text-white px-5 py-3 rounded-2xl shadow-glass-modal flex items-center justify-between gap-4 mb-4">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-teal-500/20 border border-teal-400/30 flex items-center justify-center text-teal-300">
            <FileText className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-sm tracking-tight text-white">
                Official Sales Invoice Preview
              </span>
              <span className="text-[10px] bg-emerald-500/20 border border-emerald-400/30 text-emerald-300 font-bold px-2 py-0.5 rounded-full uppercase">
                Ready for Print
              </span>
            </div>
            <p className="text-[11px] text-slate-400 font-mono">
              Document Ref: {rawInvoiceNo} • Station: {order.computerName || 'WEB-TERM-01'}
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
            <span>Print Invoice</span>
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
        className="print-modal-sheet-container w-full max-w-4xl transition-transform duration-200 origin-top flex justify-center pb-12"
        style={{ transform: `scale(${zoomLevel / 100})` }}
      >
        {/* The Physical Document Sheet (A4 Proportion Canvas) */}
        <div className="print-area bg-white text-slate-800 shadow-[0_25px_60px_-15px_rgba(0,0,0,0.5)] border border-slate-300 rounded-lg w-full max-w-[820px] p-6 sm:p-10 space-y-5 relative font-sans select-text">
          
          {/* Subtle Background Watermark of Official 3D Emblem (Screen preview only) */}
          <div className="no-print print-watermark absolute inset-0 flex items-center justify-center pointer-events-none opacity-[0.03] select-none">
            <img
              src="/efz-3d-gold.png"
              alt="Watermark"
              className="w-[500px] h-[500px] object-contain filter grayscale"
            />
          </div>

          {/* Official Letterhead Header */}
          <div className="border-b-2 border-slate-900 pb-5 relative z-10 flex flex-row items-start justify-between gap-4">
            <div className="flex items-start gap-3.5">
              <img
                src="/efz-3d-gold.png"
                alt="EFZ Davao Computer Sales"
                className="w-16 h-16 object-contain rounded-full border-2 border-amber-400 p-0.5 shrink-0 shadow-xs bg-white"
              />
              <div className="space-y-0.5">
                <h1 className="text-xl font-black text-slate-900 tracking-tight uppercase leading-tight font-sans">
                  EFZ DAVAO COMPUTER SALES
                </h1>
                <p className="text-[11px] font-semibold text-slate-700">
                  Custom High-End PC Builds • Authorized Enterprise Hardware &amp; Accessories
                </p>
                <div className="text-[10px] text-slate-600 space-y-0.5 pt-0.5">
                  <div className="flex items-center gap-1.5">
                    <MapPin className="w-3 h-3 text-teal-700 shrink-0" />
                    <span>Door 3, Davao Commercial Complex, J.P. Laurel Ave, Bajada, Davao City, 8000</span>
                  </div>
                  <div className="flex items-center gap-4 flex-wrap">
                    <span className="flex items-center gap-1 whitespace-nowrap">
                      <Phone className="w-3 h-3 text-teal-700 shrink-0" />
                      <span>Tel: (082) 298-7654 / +63 917 123 4567</span>
                    </span>
                    <span className="flex items-center gap-1 whitespace-nowrap">
                      <Mail className="w-3 h-3 text-teal-700 shrink-0" />
                      <span>sales@efzdavao.ph</span>
                    </span>
                  </div>
                  <div className="text-[9.5px] font-mono text-slate-500 pt-0.5">
                    TIN: <strong>123-456-789-000 NV</strong> • BIR Machine Identification No. (MIN): <strong>240906-EFZ-001</strong>
                  </div>
                </div>
              </div>
            </div>

            {/* Document Classification Box & Barcode */}
            <div className="flex flex-col items-end text-right shrink-0">
              <div className="inline-block bg-[#0E5460] text-white px-3.5 py-1 rounded-lg font-black text-xs tracking-wider uppercase shadow-xs border border-teal-800">
                OFFICIAL SALES INVOICE
              </div>
              <div className="mt-1 font-mono text-sm font-black text-slate-900 tracking-tight">
                {rawInvoiceNo}
              </div>
              <div className="text-[11px] text-slate-600 font-medium">
                Issue Date: {formattedDate}
              </div>
              {/* Barcode representation */}
              <div className="mt-1">
                <BarcodeSvg value={rawInvoiceNo} height={28} showText={false} />
              </div>
            </div>
          </div>

          {/* Customer Particulars & Terminal Meta Grid */}
          <div className="relative z-10 grid grid-cols-2 gap-4 text-xs bg-slate-50 p-3.5 rounded-xl border border-slate-200">
            <div className="space-y-1">
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 block">
                Billed To (Customer Account):
              </span>
              <div className="font-extrabold text-sm text-slate-900">
                {order.customerName || 'Walk-In Retail Client'}
              </div>
              {order.customerCompany && (
                <div className="text-slate-800 font-semibold flex items-center gap-1.5">
                  <Building2 className="w-3.5 h-3.5 text-slate-500" />
                  <span>{order.customerCompany}</span>
                </div>
              )}
              <div className="text-slate-600 leading-snug">
                {order.customerAddress || 'Davao City, Philippines'}
              </div>
              <div className="text-slate-600 font-mono">
                {order.customerContact || 'N/A'}
              </div>
            </div>

            <div className="space-y-1 text-right">
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 block">
                Transaction Logistics:
              </span>
              <div>
                <span className="text-slate-500 font-medium">Settlement Terms:</span>{' '}
                <strong className="text-slate-900 font-bold bg-white px-2 py-0.5 rounded border border-slate-200 inline-block">
                  {order.paymentMethod || 'Cash'}
                </strong>
              </div>
              <div>
                <span className="text-slate-500 font-medium">Sales Attendant:</span>{' '}
                <strong className="text-slate-800 font-semibold">{order.encoder}</strong>
              </div>
              <div>
                <span className="text-slate-500 font-medium">POS Terminal:</span>{' '}
                <strong className="font-mono text-teal-800 font-semibold">{order.computerName}</strong>
              </div>
              {order.remarks && (
                <div className="text-[11px] text-slate-600 italic">
                  Note: "{order.remarks}"
                </div>
              )}
            </div>
          </div>

          {/* Itemized Hardware & Serial Ledger Table */}
          <div className="relative z-10 overflow-visible">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-100 border-y-2 border-slate-800 text-slate-800 font-black uppercase text-[10px] tracking-wider">
                  <th className="py-2.5 px-3 w-10 text-center">#</th>
                  <th className="py-2.5 px-3">Item Description &amp; Specifications</th>
                  <th className="py-2.5 px-3">Hardware Serial Barcode</th>
                  <th className="py-2.5 px-3 text-center">Warranty</th>
                  <th className="py-2.5 px-3 text-right">Unit Price</th>
                  <th className="py-2.5 px-3 text-right">Subtotal</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {order.items && order.items.length > 0 ? (
                  order.items.map((item, idx) => (
                    <tr key={idx} className="even:bg-slate-50/60 hover:bg-slate-50 transition-colors">
                      <td className="py-2.5 px-3 text-center font-mono text-slate-400 text-[11px]">
                        {String(idx + 1).padStart(2, '0')}
                      </td>
                      <td className="py-2.5 px-3">
                        <div className="font-bold text-slate-900 text-xs">{item.stockName}</div>
                        <div className="text-[11px] text-slate-600 font-medium">{item.stockDetails}</div>
                      </td>
                      <td className="py-2.5 px-3 whitespace-nowrap">
                        <span className="font-mono font-bold text-teal-900 bg-teal-50 px-2 py-0.5 rounded border border-teal-200 text-[11px]">
                          {item.stockSerial}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-center whitespace-nowrap">
                        <span className="text-[11px] font-semibold text-slate-700 bg-slate-100 px-2 py-0.5 rounded">
                          {item.warranty} Days
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono font-medium text-slate-700">
                        ₱{item.stockPrice.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono font-bold text-slate-900">
                        ₱{item.stockPrice.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} className="py-4 px-3 text-slate-600 font-mono text-xs">
                      Serials Liquidated: {order.listOfSerials}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Financial Breakdown & Certified Stamp Banner */}
          <div className="relative z-10 grid grid-cols-12 gap-4 pt-2 border-t border-slate-200 page-break-inside-avoid print-avoid-break">
            {/* Left: Certified Seal Stamp & Tax Exemption Notes */}
            <div className="col-span-6 flex items-center justify-start gap-4">
              <CertifiedStamp status="PAID & LIQUIDATED" date={formattedDate.slice(0, 12)} />
              <div className="text-[10px] text-slate-500 space-y-1">
                <div className="font-bold text-slate-700 uppercase tracking-wide">
                  Official Audit Seal
                </div>
                <p className="leading-tight">
                  This transaction is recorded in EFZ SQL database cluster. Certified genuine Philippine retail distribution.
                </p>
              </div>
            </div>

            {/* Right: Subtotal, VAT, and Net Grand Total */}
            <div className="col-span-6 space-y-1 text-xs font-mono">
              <div className="flex justify-between text-slate-600">
                <span>VATable Sales (Net):</span>
                <span>₱{vatableSales.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>VAT Amount (12%):</span>
                <span>₱{vatAmount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>VAT Exempt / Zero-Rated:</span>
                <span>₱0.00</span>
              </div>
              
              {/* Grand Total Highlight */}
              <div className="border-t-2 border-slate-900 pt-1.5 flex items-center justify-between bg-teal-900 text-white p-2.5 rounded-lg shadow-xs">
                <span className="font-sans font-black text-xs uppercase tracking-wider text-amber-300">
                  Total Amount Paid:
                </span>
                <span className="font-black text-base text-white tracking-tight">
                  ₱{totalAmount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
              </div>
            </div>
          </div>

          {/* Warranty Terms & Conditions Box */}
          <div className="relative z-10 bg-slate-50 p-3 rounded-xl border border-slate-200 text-[9.5px] text-slate-600 space-y-1 leading-relaxed page-break-inside-avoid print-avoid-break">
            <div className="flex items-center gap-1.5 font-bold text-slate-800 uppercase tracking-wider">
              <ShieldCheck className="w-3.5 h-3.5 text-teal-700" />
              <span>Standard Warranty Terms &amp; Technical Policy:</span>
            </div>
            <p>
              1. <strong>Replacement Window:</strong> 7-day replacement for factory defects, subject to initial diagnostics and supplier verification.
            </p>
            <p>
              2. <strong>Warranty Seals:</strong> Barcode serial stickers and manufacturer seal warranty stickers must remain intact. Any tampering, tear, or removal automatically voids warranty.
            </p>
            <p>
              3. <strong>Exclusions:</strong> Physical breakage, burn marks, liquid spill, lightning surge, and improper installation or overclocking are strictly excluded from warranty coverage.
            </p>
            <p>
              4. <strong>Claim Presentation:</strong> Please present this official sales invoice along with the complete retail packaging and accessories for warranty claims.
            </p>
          </div>

          {/* Signatures & Conforme Block */}
          <div className="relative z-10 pt-4 border-t border-slate-200 grid grid-cols-2 gap-8 text-center text-xs page-break-inside-avoid print-avoid-break">
            <div className="space-y-1">
              <div className="border-b border-slate-400 w-44 mx-auto h-7"></div>
              <div className="font-black text-slate-900 uppercase tracking-tight text-[11px]">
                {order.encoder}
              </div>
              <div className="text-[9.5px] text-slate-500 uppercase tracking-wider">
                Authorized Store Officer / Encoder
              </div>
            </div>

            <div className="space-y-1">
              <div className="border-b border-slate-400 w-44 mx-auto h-7"></div>
              <div className="font-black text-slate-900 uppercase tracking-tight text-[11px]">
                {order.customerName || 'Customer Signature'}
              </div>
              <div className="text-[9.5px] text-slate-500 uppercase tracking-wider">
                Conforme / Received in Good Order &amp; Condition
              </div>
            </div>
          </div>

          {/* Document Micro-Footer */}
          <div className="pt-1 text-center text-[9px] text-slate-400 font-mono page-break-inside-avoid print-avoid-break">
            Thank you for choosing EFZ Davao Computer Sales! • Built for High Performance • www.efzdavao.ph
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
};
