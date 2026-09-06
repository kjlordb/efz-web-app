import React, { useState } from 'react';
import { X, UserPlus, AlertCircle } from 'lucide-react';
import { customerService } from '../../services/api';
import { Customer } from '../../types';

interface AddCustomerModalProps {
  customerToEdit?: Customer | null;
  onClose: () => void;
  onCustomerAdded: (customer: Customer) => void;
}

export const AddCustomerModal: React.FC<AddCustomerModalProps> = ({
  customerToEdit,
  onClose,
  onCustomerAdded
}) => {
  const [firstName, setFirstName] = useState(customerToEdit?.firstName || '');
  const [lastName, setLastName] = useState(customerToEdit?.lastName || '');
  const [company, setCompany] = useState(customerToEdit?.company || '');
  const [contactNumber, setContactNumber] = useState(customerToEdit?.contactNumber || '');
  const [email, setEmail] = useState(customerToEdit?.email || '');
  const [address, setAddress] = useState(customerToEdit?.address || '');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!firstName.trim()) {
      setError('First name is required.');
      return;
    }

    setSubmitting(true);
    setError(null);
    try {
      if (customerToEdit) {
        const updated = await customerService.updateCustomer(customerToEdit.id, {
          firstName: firstName.trim(),
          lastName: lastName.trim(),
          company: company.trim(),
          contactNumber: contactNumber.trim(),
          email: email.trim(),
          address: address.trim()
        });
        onCustomerAdded(updated);
      } else {
        const created = await customerService.addCustomer({
          firstName: firstName.trim(),
          lastName: lastName.trim(),
          company: company.trim(),
          contactNumber: contactNumber.trim(),
          email: email.trim(),
          address: address.trim()
        });
        onCustomerAdded(created);
      }
    } catch (err: any) {
      setError(err.message || 'Error saving customer record');
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl border border-slate-200 w-full max-w-md p-6 space-y-4 animate-scaleUp">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <UserPlus className="w-5 h-5 text-teal-700" />
            <h2 className="font-bold text-base text-slate-800">
              {customerToEdit ? 'Edit Customer Profile' : 'Register New Customer'}
            </h2>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-3.5 py-2.5 rounded-lg text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-3 text-xs">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block mb-1">
                First Name *
              </label>
              <input
                type="text"
                required
                placeholder="Gabriel"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                className="w-full text-xs border border-slate-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>
            <div>
              <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block mb-1">
                Last Name
              </label>
              <input
                type="text"
                placeholder="Santos"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                className="w-full text-xs border border-slate-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>
          </div>

          <div>
            <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block mb-1">
              Company / Institution (Optional)
            </label>
            <input
              type="text"
              placeholder="e.g. PixelForge Studios Inc."
              value={company}
              onChange={(e) => setCompany(e.target.value)}
              className="w-full text-xs border border-slate-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block mb-1">
                Contact Number
              </label>
              <input
                type="text"
                placeholder="0917-889-1122"
                value={contactNumber}
                onChange={(e) => setContactNumber(e.target.value)}
                className="w-full text-xs border border-slate-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>
            <div>
              <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block mb-1">
                Email Address
              </label>
              <input
                type="email"
                placeholder="client@domain.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full text-xs border border-slate-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>
          </div>

          <div>
            <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block mb-1">
              Billing / Delivery Address
            </label>
            <textarea
              rows={2}
              placeholder="Unit / House No., Street, City, Metro Manila"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              className="w-full text-xs border border-slate-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-teal-500 resize-none"
            ></textarea>
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
              {submitting ? 'Saving...' : customerToEdit ? 'Update Customer' : 'Save Customer'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
