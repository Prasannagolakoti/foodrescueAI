import React, { useState } from 'react';
import { X, HeartHandshake, Users, Clock, Truck, ShieldAlert } from 'lucide-react';
import { api } from '../../services/api';

export default function RequestFoodModal({ donation, onClose, onSuccess, user }) {
  if (!donation) return null;

  const [requestedQuantity, setRequestedQuantity] = useState(donation.quantity || 10);
  const [beneficiariesCount, setBeneficiariesCount] = useState(
    donation.packets_count || Math.round(donation.quantity * 2.5) || 50
  );
  const [organizationName, setOrganizationName] = useState(user?.name || 'Local Welfare Organization');
  const [pickupLocation, setPickupLocation] = useState(donation.pickup_address || '');
  const [requiredPickupTime, setRequiredPickupTime] = useState(
    new Date(Date.now() + 2 * 3600 * 1000).toISOString().slice(0, 16)
  );
  const [urgencyLevel, setUrgencyLevel] = useState('Urgent');
  const [specialRequirements, setSpecialRequirements] = useState(
    'We will arrive with insulated thermal containers to preserve food hygiene.'
  );
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    try {
      const res = await api.createRequest({
        donation_id: donation.id,
        requested_quantity: parseFloat(requestedQuantity),
        beneficiaries_count: parseInt(beneficiariesCount),
        organization_name: organizationName,
        pickup_location: pickupLocation,
        required_pickup_time: new Date(requiredPickupTime).toISOString(),
        special_requirements: specialRequirements,
        urgency_level: urgencyLevel
      });

      if (onSuccess) onSuccess(res.request);
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to submit food request');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl max-w-lg w-full max-h-[92vh] overflow-y-auto shadow-2xl border border-slate-100 relative">
        <div className="flex items-center justify-between p-5 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center text-emerald-600">
              <HeartHandshake className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900">Request Food Rescue</h3>
              <p className="text-xs text-slate-500">Coordinate pickup with donor</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Selected Donation Brief */}
        <div className="px-6 py-3.5 bg-emerald-50/60 border-b border-emerald-100 flex items-center justify-between">
          <div>
            <h4 className="text-sm font-bold text-emerald-950">{donation.food_name}</h4>
            <p className="text-xs text-emerald-800">
              Donor: {donation.donor_name} • Max Available: {donation.quantity} {donation.quantity_unit} (~{donation.packets_count} portions)
            </p>
          </div>
          <span className="text-xs font-semibold px-2 py-0.5 rounded bg-emerald-200 text-emerald-900">
            {donation.category}
          </span>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 shrink-0 text-rose-600" />
              <span>{error}</span>
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Requested Quantity ({donation.quantity_unit}) *
              </label>
              <input
                type="number"
                step="0.5"
                min="1"
                max={donation.quantity}
                required
                value={requestedQuantity}
                onChange={(e) => setRequestedQuantity(e.target.value)}
                className="w-full px-3 py-2 text-sm rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Beneficiaries to Feed *
              </label>
              <div className="relative">
                <input
                  type="number"
                  min="1"
                  required
                  value={beneficiariesCount}
                  onChange={(e) => setBeneficiariesCount(e.target.value)}
                  className="w-full pl-8 pr-3 py-2 text-sm rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                />
                <Users className="w-4 h-4 text-slate-400 absolute left-2.5 top-2.5" />
              </div>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Organization / Shelter Name *
            </label>
            <input
              type="text"
              required
              value={organizationName}
              onChange={(e) => setOrganizationName(e.target.value)}
              className="w-full px-3 py-2 text-sm rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Required Pickup Time *
              </label>
              <div className="relative">
                <input
                  type="datetime-local"
                  required
                  value={requiredPickupTime}
                  onChange={(e) => setRequiredPickupTime(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Urgency Level *
              </label>
              <select
                value={urgencyLevel}
                onChange={(e) => setUrgencyLevel(e.target.value)}
                className="w-full px-3 py-2 text-sm rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 bg-white"
              >
                <option value="Normal">Normal</option>
                <option value="Urgent">Urgent</option>
                <option value="Critical">Critical (Immediate Need)</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Pickup Point Confirmation
            </label>
            <input
              type="text"
              required
              value={pickupLocation}
              onChange={(e) => setPickupLocation(e.target.value)}
              className="w-full px-3 py-2 text-sm rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Special Handling / Transport Equipment
            </label>
            <textarea
              rows={2}
              value={specialRequirements}
              onChange={(e) => setSpecialRequirements(e.target.value)}
              placeholder="e.g. Volunteer van with thermal insulated boxes, refrigeration box..."
              className="w-full px-3 py-2 text-sm rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
            />
          </div>

          <div className="pt-2 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-sm font-semibold text-slate-600 hover:bg-slate-100 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-5 py-2.5 rounded-xl text-sm font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-md shadow-emerald-600/20 disabled:opacity-50 transition"
            >
              {submitting ? 'Submitting Request...' : 'Confirm Request'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

