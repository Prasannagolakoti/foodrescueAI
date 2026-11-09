import React from 'react';
import { HeartHandshake, ShieldCheck, PhoneCall, Mail, MapPin } from 'lucide-react';

export default function Footer({ setCurrentView }) {
  return (
    <footer className="bg-slate-900 text-slate-400 text-sm border-t border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand Col */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <div className="w-9 h-9 rounded-xl bg-emerald-500 text-white flex items-center justify-center">
                <HeartHandshake className="w-5 h-5" />
              </div>
              <span className="text-lg font-bold text-white">FoodRescue <span className="text-emerald-400">AI</span></span>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              Empowering communities to eliminate edible food waste by connecting hotels, banquet halls, restaurants, and individuals with local shelters and orphanages via AI smart matching.
            </p>
            <div className="flex items-center gap-2 text-xs text-emerald-400 pt-1">
              <ShieldCheck className="w-4 h-4" />
              <span>HACCP Safety Verification Standard</span>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-white text-xs font-bold uppercase tracking-wider mb-3">Quick Navigation</h4>
            <ul className="space-y-2 text-xs">
              <li>
                <button onClick={() => setCurrentView('available-food')} className="hover:text-emerald-400 transition">
                  Available Food Nearby
                </button>
              </li>
              <li>
                <button onClick={() => setCurrentView('smart-matching')} className="hover:text-emerald-400 transition">
                  AI Smart Matching Matrix
                </button>
              </li>
              <li>
                <button onClick={() => setCurrentView('map')} className="hover:text-emerald-400 transition">
                  Interactive City Map
                </button>
              </li>
              <li>
                <button onClick={() => setCurrentView('donate')} className="hover:text-emerald-400 transition">
                  Donate Surplus Meals
                </button>
              </li>
              <li>
                <button onClick={() => setCurrentView('analytics')} className="hover:text-emerald-400 transition">
                  Live Impact Analytics
                </button>
              </li>
            </ul>
          </div>

          {/* Food Safety & Ethics */}
          <div>
            <h4 className="text-white text-xs font-bold uppercase tracking-wider mb-3">Food Safety Standards</h4>
            <ul className="space-y-2 text-xs text-slate-400">
              <li>• Automated 4-hour hot-holding threshold enforcement</li>
              <li>• Chilled preservation standards (0-4°C) for perishable proteins</li>
              <li>• Hard lock on past-deadline donations</li>
              <li>• Human physical inspection verification requirement</li>
              <li>• Strict non-distribution of expired items</li>
            </ul>
          </div>

          {/* Helpline & Support */}
          <div>
            <h4 className="text-white text-xs font-bold uppercase tracking-wider mb-3">24/7 Food Rescue Helpline</h4>
            <p className="text-xs text-slate-400 mb-3">
              Emergency banquet food surplus or urgent shelter requirement? Contact our regional coordinator team:
            </p>
            <div className="space-y-2 text-xs">
              <div className="flex items-center gap-2 text-emerald-400 font-semibold">
                <PhoneCall className="w-4 h-4" />
                <span>+91 1800 200 4545 (Toll-Free)</span>
              </div>
              <div className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-slate-500" />
                <span>emergency@foodrescue.org</span>
              </div>
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-slate-500" />
                <span>Hyderabad • Telangana • India</span>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-8 pt-8 border-t border-slate-800 text-center text-xs text-slate-500 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p>© 2026 AI-Powered Smart Food Rescue & Donation Agent. Built for zero hunger & sustainable cities.</p>
          <div className="flex items-center gap-4 text-slate-400">
            <span>English</span>
            <span>•</span>
            <span className="text-emerald-400 font-medium">తెలుగు (Telugu)</span>
            <span>•</span>
            <span>Terms & Safety Guidelines</span>
          </div>
        </div>
      </div>
    </footer>
  );
}

