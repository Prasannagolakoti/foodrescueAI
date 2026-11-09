import React, { useState } from 'react';
import { Trash2, AlertTriangle, X, CheckCircle2 } from 'lucide-react';

export default function ConfirmDeleteModal({ isOpen, onClose, donation, onConfirmDelete }) {
  if (!isOpen || !donation) return null;

  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState(null);

  const handleConfirm = async () => {
    setDeleting(true);
    setError(null);
    try {
      await onConfirmDelete(donation.id);
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to delete food listing');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white rounded-3xl max-w-md w-full shadow-2xl border border-slate-200 overflow-hidden relative">
        {/* Header Warning Bar */}
        <div className="p-6 text-center space-y-4">
          <div className="w-14 h-14 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center mx-auto shadow-xs">
            <Trash2 className="w-7 h-7" />
          </div>

          <div>
            <h3 className="text-lg font-extrabold text-slate-900">
              Delete Food Donation Listing?
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              Are you sure you want to delete and unlist this food donation?
            </p>
          </div>

          {/* Details Pill */}
          <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 text-left text-xs space-y-1">
            <div className="flex items-center justify-between">
              <strong className="text-slate-900 font-bold">{donation.food_name || donation.foodName}</strong>
              <span className="font-semibold text-emerald-700">{donation.quantity} {donation.quantity_unit}</span>
            </div>
            <p className="text-[11px] text-slate-500 truncate">Pickup: {donation.pickup_address || 'Registered Location'}</p>
          </div>

          {/* Notice Alert */}
          <div className="p-3 bg-amber-50 rounded-2xl border border-amber-200 text-amber-900 text-xs text-left flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <span className="text-[11px] leading-relaxed">
              <strong>Notice:</strong> This listing will be immediately removed from active availability and AI matching. Any recipients with active requests for this food will be notified automatically that the listing was cancelled.
            </span>
          </div>

          {error && (
            <div className="p-3 bg-rose-50 rounded-xl border border-rose-200 text-rose-800 text-xs text-left">
              {error}
            </div>
          )}
        </div>

        {/* Buttons */}
        <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={deleting}
            className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-200 transition"
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={handleConfirm}
            disabled={deleting}
            className="px-5 py-2.5 rounded-xl text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white shadow-md shadow-rose-600/25 flex items-center gap-1.5 transition disabled:opacity-50"
          >
            <Trash2 className="w-3.5 h-3.5" />
            {deleting ? 'Deleting Listing...' : 'Yes, Delete Listing'}
          </button>
        </div>
      </div>
    </div>
  );
}

