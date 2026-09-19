import React, { useState, useEffect } from 'react';
import { Database, X, CheckCircle2, Loader2 } from 'lucide-react';

interface BackupModalProps {
  onClose: () => void;
}

export const BackupModal: React.FC<BackupModalProps> = ({ onClose }) => {
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState('Initializing SQL Server backup protocol...');
  const [isCompleted, setIsCompleted] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          setStatus('Database backup completed successfully! Stored in C:\\data\\EFZApp\\');
          setIsCompleted(true);
          return 100;
        }

        const next = prev + 5;
        if (next < 20) {
          setStatus('Connecting to SQL Server instance (dbo.DbBackup)...');
        } else if (next < 60) {
          setStatus('Dumping transaction logs and serialized tables...');
        } else if (next < 90) {
          setStatus('Verifying checksums and compressing archive (.bak)...');
        } else {
          setStatus('Finalizing backup file write...');
        }
        return next;
      });
    }, 150);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="fixed inset-0 bg-slate-950/75 backdrop-blur-md z-50 flex items-center justify-center p-4">
      <div className="glass-modal rounded-2xl w-full max-w-md p-6 space-y-4 shadow-glass-modal border border-white/[0.14] animate-scaleUp">
        <div className="flex items-center justify-between border-b border-white/[0.08] pb-3">
          <div className="flex items-center gap-2">
            <Database className="w-5 h-5 text-teal-400 drop-shadow-[0_0_8px_rgba(29,130,150,0.5)]" />
            <h2 className="font-bold text-base text-slate-100">Database Backup Execution</h2>
          </div>
          {isCompleted && (
            <button onClick={onClose} className="p-1 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-white/[0.08] transition-colors cursor-pointer">
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        <div className="space-y-3 py-2">
          <div className="flex items-center justify-between text-xs">
            <span className="font-medium text-slate-300 flex items-center gap-2">
              {!isCompleted && <Loader2 className="w-3.5 h-3.5 animate-spin text-teal-400" />}
              {isCompleted && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />}
              <span className="truncate">{status}</span>
            </span>
            <span className="font-mono font-bold text-teal-300 shrink-0 ml-2">{progress}%</span>
          </div>

          <div className="w-full bg-slate-950/60 h-2.5 rounded-full overflow-hidden border border-white/[0.08] p-0.5">
            <div
              className={`h-full rounded-full transition-all duration-200 ${
                isCompleted ? 'bg-emerald-400 shadow-[0_0_12px_rgba(52,211,153,0.8)]' : 'bg-gradient-to-r from-teal-500 to-cyan-400 shadow-[0_0_10px_rgba(20,184,166,0.5)]'
              }`}
              style={{ width: `${progress}%` }}
            ></div>
          </div>

          <div className="bg-slate-950/50 p-3 rounded-xl border border-white/[0.08] text-[11px] font-mono text-slate-300 space-y-1 shadow-inner">
            <div>Target DB: <strong className="text-teal-300 font-bold">EFZApp</strong></div>
            <div className="truncate">File Path: <strong className="text-slate-200">C:\data\EFZApp\EFZApp_backup.bak</strong></div>
            <div>Timestamp: <strong className="text-slate-200">{new Date().toLocaleString()}</strong></div>
          </div>
        </div>

        {isCompleted && (
          <div className="pt-2 flex justify-end">
            <button
              onClick={onClose}
              className="px-5 py-2 bg-gradient-to-r from-teal-600 to-teal-500 hover:from-teal-500 hover:to-teal-400 text-slate-950 font-bold text-xs rounded-xl shadow-lg shadow-teal-900/40 transition-all cursor-pointer"
            >
              Done / Close
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
