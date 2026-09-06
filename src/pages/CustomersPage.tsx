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

export const CustomersPage: React.FC = () => {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [toast, setToast] = useState<string | null>(null);

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

  return (
    <div className="space-y-4">
      {/* Toast */}
      {toast && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs px-4 py-2.5 rounded-xl flex items-center gap-2 font-medium">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          <span>{toast}</span>
        </div>
      )}

      {/* Header */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <Users className="w-5 h-5 text-teal-700" />
            <span>Customer Directory & CRM</span>
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Manage commercial and walk-in client accounts, contact details, and billing profiles
          </p>
        </div>

        <button
          onClick={() => {
            setEditingCustomer(null);
            setIsModalOpen(true);
          }}
          className="flex items-center gap-1.5 text-xs font-bold text-white bg-teal-700 hover:bg-teal-800 px-4 py-2 rounded-lg shadow-sm transition-all self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Add New Customer</span>
        </button>
      </div>

      {/* Search toolbar */}
      <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-sm flex items-center gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-slate-400" />
          <input
            type="text"
            placeholder="Search by customer name, company, contact number, or address..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 bg-slate-50 focus:bg-white"
          />
        </div>
        <div className="text-xs text-slate-500 font-medium">
          Showing <strong>{customers.length}</strong> client records
        </div>
      </div>

      {/* Customers Card Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {customers.map((c) => (
          <div
            key={c.id}
            className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm hover:border-teal-300 transition-all flex flex-col justify-between space-y-3"
          >
            <div>
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-bold text-sm text-slate-900 leading-tight">
                    {c.fullName}
                  </h3>
                  {c.company ? (
                    <div className="text-xs text-teal-800 font-medium flex items-center gap-1 mt-0.5">
                      <Building className="w-3 h-3 text-teal-600" />
                      <span>{c.company}</span>
                    </div>
                  ) : (
                    <div className="text-xs text-slate-400 mt-0.5">Individual Retail Buyer</div>
                  )}
                </div>

                <button
                  onClick={() => {
                    setEditingCustomer(c);
                    setIsModalOpen(true);
                  }}
                  className="text-slate-400 hover:text-teal-700 p-1.5 rounded hover:bg-slate-100 transition-colors"
                  title="Edit Customer"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="space-y-1.5 pt-3 border-t border-slate-100 text-xs text-slate-600">
                <div className="flex items-center gap-2">
                  <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <span>{c.contactNumber || 'No phone provided'}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <span className="truncate">{c.email || 'No email provided'}</span>
                </div>
                <div className="flex items-start gap-2">
                  <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                  <span className="line-clamp-2">{c.address || 'No physical address'}</span>
                </div>
              </div>
            </div>

            <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
              <span className="font-mono">ID: #{c.id}</span>
              {c.createdAt && <span>Joined: {c.createdAt}</span>}
            </div>
          </div>
        ))}

        {customers.length === 0 && (
          <div className="col-span-full bg-white rounded-xl border border-slate-200 p-12 text-center text-slate-400 space-y-2">
            <Users className="w-10 h-10 mx-auto text-slate-300 stroke-[1.5]" />
            <div className="text-sm font-semibold text-slate-600">No Customers Found</div>
            <p className="text-xs text-slate-400">
              Click "+ Add New Customer" above to create client profiles.
            </p>
          </div>
        )}
      </div>

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
