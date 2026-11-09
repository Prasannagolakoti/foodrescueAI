import React, { useState } from 'react';
import { 
  HeartHandshake, 
  Lock, 
  Mail, 
  User, 
  Building, 
  MapPin, 
  Phone, 
  ShieldCheck, 
  Users,
  CheckCircle2,
  UtensilsCrossed
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function AuthView({ onAuthSuccess }) {
  const { login, register } = useAuth();

  const [mode, setMode] = useState('login'); // 'login' or 'register'
  const [role, setRole] = useState('donor'); // 'donor', 'recipient', 'admin'
  
  // Login form state
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  // Register form state
  const [regName, setRegName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [orgType, setOrgType] = useState('Restaurant / Caterer');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [bio, setBio] = useState('');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const rolesConfig = [
    {
      id: 'donor',
      title: 'Donor',
      description: 'Users who have extra food and want to donate it.',
      icon: UtensilsCrossed,
      defaultOrg: 'Restaurant / Hotel / Banquet'
    },
    {
      id: 'recipient',
      title: 'Recipient',
      description: 'Users who need food and want to request available food.',
      icon: Users,
      defaultOrg: 'NGO / Orphanage / Shelter'
    },
    {
      id: 'admin',
      title: 'Admin',
      description: 'Administrator who manages and monitors the platform.',
      icon: ShieldCheck,
      defaultOrg: 'Central Monitoring Authority'
    }
  ];

  const handleRoleSelect = (newRole) => {
    setRole(newRole);
    setError(null);
    const found = rolesConfig.find(r => r.id === newRole);
    if (found) setOrgType(found.defaultOrg);
  };

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const user = await login(loginEmail, loginPassword, role);
      if (onAuthSuccess) onAuthSuccess(user);
    } catch (err) {
      setError(err.message || 'Login failed. Please verify credentials and selected role.');
    } finally {
      setLoading(false);
    }
  };

  const handleRegisterSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const user = await register({
        name: regName,
        email: regEmail,
        password: regPassword,
        role,
        organization_type: orgType,
        phone,
        address,
        bio
      });
      if (onAuthSuccess) onAuthSuccess(user);
    } catch (err) {
      setError(err.message || 'Registration failed.');
    } finally {
      setLoading(false);
    }
  };

  const activeRoleConfig = rolesConfig.find(r => r.id === role) || rolesConfig[0];

  return (
    <div className="max-w-xl mx-auto px-4 py-10 animate-in fade-in duration-200">
      {/* Main Auth Card */}
      <div className="bg-white rounded-3xl border border-slate-200/90 shadow-xl p-6 sm:p-8 space-y-6">
        {/* Toggle Mode Tabs */}
        <div className="flex items-center p-1 bg-slate-100 rounded-2xl">
          <button
            onClick={() => { setMode('login'); setError(null); }}
            className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition ${
              mode === 'login' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Sign In to Account
          </button>
          <button
            onClick={() => { setMode('register'); setError(null); }}
            className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition ${
              mode === 'register' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Register New Account
          </button>
        </div>

        {/* Role Selection Group (Mandatory before logging in or signing up) */}
        <div className="space-y-2">
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-500">
            Select Your Role:
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
            {rolesConfig.map((r) => {
              const Icon = r.icon;
              const isSelected = role === r.id;
              return (
                <button
                  key={r.id}
                  type="button"
                  onClick={() => handleRoleSelect(r.id)}
                  className={`p-3 rounded-2xl text-left border transition-all flex flex-col justify-between ${
                    isSelected
                      ? 'bg-emerald-50 border-emerald-500 ring-2 ring-emerald-500/20 text-emerald-950 shadow-xs'
                      : 'border-slate-200 text-slate-600 hover:border-slate-300 hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center justify-between w-full mb-1">
                    <span className="font-extrabold text-sm flex items-center gap-1.5">
                      <Icon className={`w-4 h-4 ${isSelected ? 'text-emerald-600' : 'text-slate-400'}`} />
                      {r.title}
                    </span>
                    {isSelected && <CheckCircle2 className="w-4 h-4 text-emerald-600" />}
                  </div>
                  <p className="text-[11px] leading-tight text-slate-500">
                    {r.description}
                  </p>
                </button>
              );
            })}
          </div>
        </div>

        {error && (
          <div className="p-3.5 rounded-xl bg-rose-50 text-rose-800 text-xs font-semibold border border-rose-200">
            {error}
          </div>
        )}

        {/* LOGIN FORM */}
        {mode === 'login' && (
          <form onSubmit={handleLoginSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Email Address</label>
              <div className="relative">
                <input
                  type="email"
                  required
                  placeholder="name@organization.com"
                  value={loginEmail}
                  onChange={(e) => setLoginEmail(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 text-sm rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
                />
                <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Password</label>
              <div className="relative">
                <input
                  type="password"
                  required
                  placeholder="Enter your password"
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 text-sm rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
                />
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-xl font-bold text-sm bg-emerald-600 hover:bg-emerald-700 text-white shadow-md shadow-emerald-600/20 disabled:opacity-50 transition"
            >
              {loading ? 'Authenticating...' : `Sign In as ${activeRoleConfig.title}`}
            </button>
          </form>
        )}

        {/* REGISTER FORM */}
        {mode === 'register' && (
          <form onSubmit={handleRegisterSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                {role === 'donor'
                  ? 'Donor Name / Organization *'
                  : role === 'recipient'
                  ? 'Recipient / Shelter / NGO Name *'
                  : 'Administrator Name *'}
              </label>
              <input
                type="text"
                required
                placeholder={
                  role === 'donor'
                    ? 'e.g. City Grand Hotel, Central Hostel Mess'
                    : role === 'recipient'
                    ? 'e.g. Hope Orphanage, City Shelter Home'
                    : 'e.g. Regional Platform Admin'
                }
                value={regName}
                onChange={(e) => setRegName(e.target.value)}
                className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Official Email *</label>
                <input
                  type="email"
                  required
                  placeholder="name@domain.com"
                  value={regEmail}
                  onChange={(e) => setRegEmail(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Password *</label>
                <input
                  type="password"
                  required
                  placeholder="Min 6 characters"
                  value={regPassword}
                  onChange={(e) => setRegPassword(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Organization / Entity Type *</label>
                <input
                  type="text"
                  required
                  placeholder={
                    role === 'donor'
                      ? 'Restaurant, Hotel, Banquet, Hostel'
                      : role === 'recipient'
                      ? 'Orphanage, Homeless Shelter, Welfare Society'
                      : 'Administration Authority'
                  }
                  value={orgType}
                  onChange={(e) => setOrgType(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Contact Phone *</label>
                <input
                  type="tel"
                  required
                  placeholder="+91 98765 43210"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Operational Address *</label>
              <input
                type="text"
                required
                placeholder="Street address, Area, City"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-xl font-bold text-sm bg-emerald-600 hover:bg-emerald-700 text-white shadow-md shadow-emerald-600/20 disabled:opacity-50 transition"
            >
              {loading ? 'Creating Account...' : `Register as ${activeRoleConfig.title}`}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
