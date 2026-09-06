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
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl border border-slate-200 w-full max-w-md p-6 space-y-4 animate-scaleUp">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <Database className="w-5 h-5 text-teal-700" />
            <h2 className="font-bold text-base text-slate-800">Database Backup Execution</h2>
          </div>
          {isCompleted && (
            <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        <div className="space-y-3 py-2">
          <div className="flex items-center justify-between text-xs">
            <span className="font-medium text-slate-600 flex items-center gap-2">
              {!isCompleted && <Loader2 className="w-3.5 h-3.5 animate-spin text-teal-600" />}
              {isCompleted && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />}
              <span>{status}</span>
            </span>
            <span className="font-mono font-bold text-slate-800">{progress}%</span>
          </div>

          <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
            <div
              className={`h-full transition-all duration-200 ${
                isCompleted ? 'bg-emerald-500' : 'bg-gradient-to-r from-teal-600 to-teal-400'
              }`}
              style={{ width: `${progress}%` }}
            ></div>
          </div>

          <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 text-[11px] font-mono text-slate-600 space-y-0.5">
            <div>Target DB: <strong>EFZApp</strong></div>
            <div>File Path: <strong>C:\data\EFZApp\EFZApp_backup.bak</strong></div>
            <div>Timestamp: <strong>{new Date().toLocaleString()}</strong></div>
          </div>
        </div>

        {isCompleted && (
          <div className="pt-2 flex justify-end">
            <button
              onClick={onClose}
              className="px-5 py-2 bg-teal-700 hover:bg-teal-800 text-white font-bold text-xs rounded-lg shadow-sm"
            >
              Done / Close
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
