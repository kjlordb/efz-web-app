import React, { useState, useEffect } from 'react';
import {
  Users,
  Search,
  Plus,
  Edit2,
  Mail,
  Phone,
  MapPin,
  Building,
  CheckCircle2,
  Calendar
} from 'lucide-react';
import { customerService } from '../services/api';
import { Customer } from '../types';
import { AddCustomerModal } from '../components/modals/AddCustomerModal';
import { Pagination } from '../components/common/Pagination';

export const CustomersPage: React.FC = () => {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(18);

  useEffect(() => {
    setCurrentPage(1);
  }, [search]);

  useEffect(() => {
    loadCustomers();
  }, [search]);

  const loadCustomers = async () => {
    setLoading(true);
    try {
      const data = await customerService.getCustomers(search);
      setCustomers(data);
    } finally {
      setLoading(false);
    }
  };

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };

  const totalCustomersCount = customers.length;
  const paginatedCustomers = customers.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  return (
    <div className="space-y-4">
      {/* Toast */}
      {toast && (
        <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-xs px-4 py-2.5 rounded-xl flex items-center gap-2 font-medium shadow-glass-xs animate-fadeIn">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>{toast}</span>
        </div>
      )}

      {/* Header */}
      <div className="bg-slate-900/60 backdrop-blur-md p-4 sm:p-5 rounded-2xl border border-white/[0.08] shadow-glass-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-lg font-black text-white tracking-tight flex items-center gap-2.5">
            <Users className="w-5 h-5 text-teal-400" />
            <span>Customer Directory & CRM</span>
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Manage commercial and walk-in client accounts, contact details, and billing profiles
          </p>
        </div>

        <button
          onClick={() => {
            setEditingCustomer(null);
            setIsModalOpen(true);
          }}
          className="flex items-center gap-2 text-xs font-bold text-white bg-gradient-to-r from-teal-600 to-teal-700 hover:from-teal-500 hover:to-teal-600 px-4 py-2.5 rounded-xl shadow-glass-xs hover:shadow-glow-teal transition-all self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Add New Customer</span>
        </button>
      </div>

      {/* Search toolbar */}
      <div className="bg-slate-900/60 backdrop-blur-md p-3.5 rounded-2xl border border-white/[0.08] shadow-glass-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-md w-full">
          <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
          <input
            type="text"
            placeholder="Search by customer name, company, contact number, or address..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="glass-input w-full pl-9 pr-3 py-1.5 text-xs"
          />
        </div>
        <div className="text-xs text-slate-400 font-medium">
          Showing <strong className="text-white">{totalCustomersCount}</strong> client records
        </div>
      </div>

      {/* Customers Card Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {paginatedCustomers.map((c) => (
          <div
            key={c.id}
            className="bg-slate-900/60 backdrop-blur-md p-5 rounded-2xl border border-white/[0.08] shadow-glass-xs hover:border-teal-500/40 hover:shadow-glass-sm transition-all flex flex-col justify-between space-y-3.5"
          >
            <div>
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-bold text-sm text-white leading-tight">
                    {c.fullName}
                  </h3>
                  {c.company ? (
                    <div className="text-xs text-teal-300 font-medium flex items-center gap-1.5 mt-1">
                      <Building className="w-3 h-3 text-teal-400" />
                      <span>{c.company}</span>
                    </div>
                  ) : (
                    <div className="text-xs text-slate-500 mt-1">Individual Retail Buyer</div>
                  )}
                </div>

                <button
                  onClick={() => {
                    setEditingCustomer(c);
                    setIsModalOpen(true);
                  }}
                  className="text-slate-400 hover:text-teal-300 p-1.5 rounded-lg hover:bg-white/[0.05] transition-colors"
                  title="Edit Customer"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="space-y-2 pt-3 border-t border-white/[0.06] text-xs text-slate-300">
                <div className="flex items-center gap-2.5">
                  <Phone className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                  <span>{c.contactNumber || 'No phone provided'}</span>
                </div>
                <div className="flex items-center gap-2.5">
                  <Mail className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                  <span className="truncate">{c.email || 'No email provided'}</span>
                </div>
                <div className="flex items-start gap-2.5">
                  <MapPin className="w-3.5 h-3.5 text-slate-500 shrink-0 mt-0.5" />
                  <span className="line-clamp-2 text-slate-400">{c.address || 'No physical address'}</span>
                </div>
              </div>
            </div>

            <div className="pt-2.5 border-t border-white/[0.06] flex items-center justify-between text-[11px] text-slate-500">
              <span className="font-mono text-teal-400">ID: #{c.id}</span>
              {c.createdAt && <span>Joined: {c.createdAt}</span>}
            </div>
          </div>
        ))}

        {totalCustomersCount === 0 && (
          <div className="col-span-full bg-slate-900/40 backdrop-blur-md rounded-2xl border border-white/[0.08] p-12 text-center text-slate-400 space-y-2">
            <Users className="w-10 h-10 mx-auto text-slate-500 stroke-[1.5]" />
            <div className="text-sm font-semibold text-white">No Customers Found</div>
            <p className="text-xs text-slate-400">
              Click "+ Add New Customer" above to create client profiles.
            </p>
          </div>
        )}
      </div>

      {/* Pagination Bar */}
      {totalCustomersCount > 0 && (
        <div className="bg-slate-900/60 backdrop-blur-md rounded-2xl border border-white/[0.08] overflow-hidden">
          <Pagination
            currentPage={currentPage}
            totalItems={totalCustomersCount}
            pageSize={pageSize}
            pageSizeOptions={[12, 18, 36, 72]}
            onPageChange={(page) => {
              setCurrentPage(page);
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            onPageSizeChange={setPageSize}
            label="client accounts"
          />
        </div>
      )}

      {/* Customer Modal */}
      {isModalOpen && (
        <AddCustomerModal
          customerToEdit={editingCustomer}
          onClose={() => setIsModalOpen(false)}
          onCustomerAdded={(newC) => {
            setIsModalOpen(false);
            loadCustomers();
            showToast(`Customer profile for ${newC.fullName} saved!`);
          }}
        />
      )}
    </div>
  );
};
