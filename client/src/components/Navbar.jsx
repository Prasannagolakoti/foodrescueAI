import React, { useState } from 'react';
import { 
  HeartHandshake, 
  MapPin, 
  Sparkles, 
  PlusCircle, 
  ClipboardList, 
  History, 
  BarChart3, 
  ShieldAlert, 
  Bell, 
  User, 
  LogOut, 
  Menu, 
  X,
  MessageSquare,
  CheckCircle2
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function Navbar({ currentView, setCurrentView, onOpenChatbot }) {
  const { user, unreadNotifications, logout, quickLogin } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);

  const navItems = [
    { id: 'home', label: 'Home' },
    { id: 'available-food', label: 'Available Food' },
    { id: 'smart-matching', label: 'AI Matching', badge: 'AI' },
    { id: 'map', label: 'Map View' },
    { id: 'donate', label: 'Donate Food', donorOnly: true },
    { id: 'requests', label: 'Requests' },
    { id: 'history', label: 'History' },
    { id: 'analytics', label: 'Analytics' },
    ...(user?.role === 'admin' ? [{ id: 'admin', label: 'Admin Hub', adminOnly: true }] : [])
  ];

  const handleNavClick = (viewId) => {
    setCurrentView(viewId);
    setMobileMenuOpen(false);
  };

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200/80 shadow-xs">
      {/* Top Status Bar */}
      <div className="bg-emerald-900 text-white text-[11px] px-4 py-1.5 flex flex-wrap items-center justify-between gap-2 border-b border-emerald-800">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span>Food Waste Rescue Agent</span>
          {user ? (
            <>
              <span className="text-emerald-400">•</span>
              <span>Active Account:</span>
              <strong className="uppercase bg-emerald-800 px-2 py-0.5 rounded text-emerald-200 font-bold">
                {user.role} ({user.name})
              </strong>
            </>
          ) : (
            <>
              <span className="text-emerald-400">•</span>
              <span className="text-emerald-200">Connect Donors & Recipients in Real Time</span>
            </>
          )}
        </div>
        <div className="flex items-center gap-2">
          {!user ? (
            <button
              onClick={() => handleNavClick('auth')}
              className="px-2.5 py-0.5 rounded bg-emerald-800 hover:bg-emerald-700 text-emerald-100 font-bold transition"
            >
              Select Role & Sign In (Donor / Recipient / Admin)
            </button>
          ) : (
            <button
              onClick={() => handleNavClick('profile')}
              className="text-emerald-300 hover:text-white font-medium transition"
            >
              Manage Profile
            </button>
          )}
        </div>
      </div>

      {/* Main Nav Bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Brand */}
          <div 
            onClick={() => handleNavClick('home')}
            className="flex items-center gap-2.5 cursor-pointer group"
          >
            <div className="w-10 h-10 rounded-xl bg-linear-to-tr from-emerald-600 to-teal-500 text-white flex items-center justify-center shadow-md shadow-emerald-600/20 group-hover:scale-105 transition">
              <HeartHandshake className="w-6 h-6" />
            </div>
            <div>
              <span className="text-lg font-extrabold text-slate-900 tracking-tight flex items-center gap-1">
                FoodRescue <span className="text-emerald-600">AI</span>
              </span>
              <p className="text-[10px] text-slate-400 font-medium -mt-1">Zero Waste • Feed Hope</p>
            </div>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-1 lg:gap-2">
            {navItems.map((item) => {
              const active = currentView === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => handleNavClick(item.id)}
                  className={`px-3 py-1.5 rounded-lg text-sm font-semibold transition flex items-center gap-1.5 ${
                    active
                      ? 'bg-emerald-50 text-emerald-700 font-bold'
                      : 'text-slate-600 hover:text-emerald-600 hover:bg-slate-50'
                  }`}
                >
                  {item.label}
                  {item.badge && (
                    <span className="px-1.5 py-0.2 rounded text-[10px] font-extrabold bg-linear-to-r from-emerald-500 to-teal-500 text-white uppercase shadow-xs">
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>

          {/* Right Action Icons */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* AI Chatbot Button */}
            <button
              onClick={onOpenChatbot}
              className="p-2 rounded-xl text-slate-600 hover:text-emerald-600 hover:bg-emerald-50 transition relative"
              title="Open AI Food Rescue Chatbot"
            >
              <MessageSquare className="w-5 h-5 text-emerald-600" />
            </button>

            {/* Notifications Button */}
            <button
              onClick={() => handleNavClick('notifications')}
              className="p-2 rounded-xl text-slate-600 hover:text-emerald-600 hover:bg-slate-100 transition relative"
              title="Notifications"
            >
              <Bell className="w-5 h-5" />
              {unreadNotifications > 0 && (
                <span className="absolute top-1.5 right-1.5 w-4 h-4 rounded-full bg-rose-500 text-white text-[10px] font-bold flex items-center justify-center animate-bounce">
                  {unreadNotifications > 9 ? '9+' : unreadNotifications}
                </span>
              )}
            </button>

            {/* User Profile or Login */}
            {user ? (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleNavClick('profile')}
                  className="flex items-center gap-2 px-2.5 py-1.5 rounded-xl border border-slate-200 hover:bg-slate-50 transition"
                >
                  <img
                    src={user.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80'}
                    alt={user.name}
                    className="w-7 h-7 rounded-full object-cover border border-slate-200"
                  />
                  <div className="hidden lg:block text-left text-xs">
                    <span className="font-bold text-slate-800 block truncate max-w-[100px]">{user.name}</span>
                    <span className="text-[10px] text-slate-400 capitalize">{user.role}</span>
                  </div>
                </button>

                <button
                  onClick={logout}
                  className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition"
                  title="Logout"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <button
                onClick={() => handleNavClick('auth')}
                className="px-4 py-2 rounded-xl text-sm font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-md shadow-emerald-600/20 transition"
              >
                Sign In
              </button>
            )}

            {/* Mobile Hamburger */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 rounded-xl text-slate-600 hover:bg-slate-100"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu Dropdown */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-slate-100 bg-white px-4 pt-2 pb-6 space-y-1 shadow-lg animate-in slide-in-from-top-2">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => handleNavClick(item.id)}
              className={`w-full text-left px-3 py-2.5 rounded-xl text-sm font-semibold flex items-center justify-between ${
                currentView === item.id
                  ? 'bg-emerald-50 text-emerald-700 font-bold'
                  : 'text-slate-700 hover:bg-slate-50'
              }`}
            >
              <span>{item.label}</span>
              {item.badge && (
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500 text-white">
                  {item.badge}
                </span>
              )}
            </button>
          ))}
          <div className="pt-2 border-t border-slate-100">
            <button
              onClick={() => handleNavClick('chatbot')}
              className="w-full text-left px-3 py-2.5 rounded-xl text-sm font-semibold text-emerald-700 bg-emerald-50/50 flex items-center gap-2"
            >
              <MessageSquare className="w-4 h-4" />
              AI Assistant (English / తెలుగు)
            </button>
          </div>
        </div>
      )}
    </header>
  );
}

