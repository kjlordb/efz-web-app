import React from 'react';
import { ShieldCheck, Check } from 'lucide-react';

interface CertifiedStampProps {
  status?: 'PAID & LIQUIDATED' | 'OFFICIAL QUOTATION' | 'WARRANTY VERIFIED';
  date?: string;
  className?: string;
}

export const CertifiedStamp: React.FC<CertifiedStampProps> = ({
  status = 'PAID & LIQUIDATED',
  date,
  className = ''
}) => {
  return (
    <div
      className={`inline-flex flex-col items-center justify-center p-2 rounded-full border-2 border-emerald-700/80 text-emerald-800 bg-emerald-50/40 select-none transform -rotate-12 pointer-events-none shadow-xs ${className}`}
      style={{
        width: '100px',
        height: '100px',
        boxShadow: 'inset 0 0 0 2px rgba(4, 120, 87, 0.2)'
      }}
    >
      <div className="w-full h-full rounded-full border border-dashed border-emerald-700/70 flex flex-col items-center justify-center p-1 text-center">
        <ShieldCheck className="w-4 h-4 text-emerald-700 shrink-0" />
        <span className="text-[7.5px] font-black tracking-tighter uppercase text-emerald-900 leading-tight mt-0.5">
          EFZ DAVAO
        </span>
        <span className="text-[8px] font-extrabold tracking-wider uppercase text-emerald-700 leading-none">
          {status === 'PAID & LIQUIDATED' ? 'PAID' : 'OFFICIAL'}
        </span>
        <span className="text-[6.5px] font-mono font-bold text-emerald-800/80 tracking-tight mt-0.5">
          {date || new Date().toISOString().slice(0, 10)}
        </span>
        <span className="text-[6px] tracking-widest text-emerald-700/80 uppercase">
          ★ AUTHENTIC ★
        </span>
      </div>
    </div>
  );
};
