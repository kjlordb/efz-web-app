import React from 'react';
import { ShieldAlert, ArrowLeft, Lock, UserCheck } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { ROLE_DEFINITIONS, UserRole } from '../../types/rbac';
import { ActiveTab } from '../layout/Sidebar';

interface AccessRestrictedProps {
  attemptedTab: ActiveTab;
  onNavigateHome: () => void;
}

export const AccessRestricted: React.FC<AccessRestrictedProps> = ({ attemptedTab, onNavigateHome }) => {
  const { currentUser, switchRole } = useAuth();
  const currentRole = currentUser?.role || 'cashier';
  const roleMeta = ROLE_DEFINITIONS[currentRole];

  // Find roles that have access to attemptedTab
  const authorizedRoles = (Object.keys(ROLE_DEFINITIONS) as UserRole[]).filter((r) =>
    ROLE_DEFINITIONS[r].allowedTabs.includes(attemptedTab)
  );

  return (
    <div className="min-h-[600px] flex items-center justify-center p-6 select-none font-sans">
      <div className="max-w-md w-full bg-white rounded-2xl border border-slate-200 shadow-xl p-8 text-center space-y-6 animate-scaleUp">
        {/* Shield Icon */}
        <div className="w-16 h-16 rounded-2xl bg-red-50 border border-red-200 flex items-center justify-center mx-auto text-red-600 shadow-sm">
          <ShieldAlert className="w-8 h-8" />
        </div>

        {/* Title and message */}
        <div className="space-y-2">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-red-100 text-red-700 text-xs font-bold uppercase tracking-wider">
            <Lock className="w-3 h-3" />
            <span>Role-Based Access Control (RBAC)</span>
          </div>
          <h2 className="text-xl font-bold text-slate-800">
            Access Restricted
          </h2>
          <p className="text-xs text-slate-500 leading-relaxed">
            Your current entity clearance as <strong className="text-slate-700">{roleMeta.title}</strong> does not permit direct access to the <span className="font-mono font-bold text-teal-800 uppercase">[{attemptedTab}]</span> module.
          </p>
        </div>

        {/* Clearance requirement card */}
        <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 text-left space-y-2 text-xs">
          <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wide">
            Permitted Entities for this Module:
          </div>
          <div className="flex flex-wrap gap-1.5">
            {authorizedRoles.map((r) => (
              <span
                key={r}
                className="px-2.5 py-1 rounded-md bg-white border border-slate-300 font-semibold text-slate-700 text-[11px] flex items-center gap-1"
              >
                <UserCheck className="w-3 h-3 text-teal-600" />
                <span>{ROLE_DEFINITIONS[r].title}</span>
              </span>
            ))}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="pt-2 flex flex-col sm:flex-row gap-2.5 justify-center">
          <button
            onClick={onNavigateHome}
            className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-teal-700 hover:bg-teal-800 text-white font-bold text-xs shadow-sm flex items-center justify-center gap-2 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Return to {roleMeta.entityLabel}</span>
          </button>

          {/* Quick Switch for Client Presentation */}
          {authorizedRoles.length > 0 && (
            <button
              onClick={() => switchRole(authorizedRoles[0])}
              className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs border border-slate-300 transition-colors"
            >
              Switch to {ROLE_DEFINITIONS[authorizedRoles[0]].role} View
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
