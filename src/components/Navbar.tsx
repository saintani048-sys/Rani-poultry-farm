import React from 'react';
import { useAuth } from '../context/AuthContext.tsx';
import { User, LogIn, LayoutDashboard, Shield, Menu, X } from 'lucide-react';

export const Navbar: React.FC = () => {
  const { user, openAuthModal, activeView, setActiveView, settings } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);
  const siteName = settings.site_name || 'Noorani Poultry Farm';

  return (
    <header className="sticky top-0 z-40 bg-[#064E3B] text-white border-b border-[#047857]/40 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Zone 1: Single text element wordmark */}
          <button
            onClick={() => {
              setActiveView(user ? 'dashboard' : 'home');
              setMobileMenuOpen(false);
            }}
            className="flex items-center gap-2.5 text-left focus:outline-none"
          >
            <div className="w-9 h-9 rounded-lg bg-amber-500/20 border border-amber-400/40 flex items-center justify-center text-amber-300 font-bold text-lg shadow-inner">
              N
            </div>
            <span className="text-lg md:text-xl font-bold tracking-tight text-white whitespace-nowrap">
              {siteName}
            </span>
          </button>

          {/* Zone 2: 4-6 clean text navigation links */}
          <nav className="hidden md:flex items-center gap-7 text-sm font-medium text-emerald-100">
            {user ? (
              <>
                <button
                  onClick={() => setActiveView('dashboard')}
                  className={`hover:text-white transition-colors cursor-pointer ${
                    activeView === 'dashboard' ? 'text-white font-semibold underline decoration-amber-400 decoration-2 underline-offset-8' : ''
                  }`}
                >
                  Dashboard
                </button>
                <button
                  onClick={() => setActiveView('buy-hen')}
                  className={`hover:text-white transition-colors cursor-pointer ${
                    activeView === 'buy-hen' ? 'text-white font-semibold underline decoration-amber-400 decoration-2 underline-offset-8' : ''
                  }`}
                >
                  Buy Hen
                </button>
                <button
                  onClick={() => setActiveView('collect-eggs')}
                  className={`hover:text-white transition-colors cursor-pointer ${
                    activeView === 'collect-eggs' ? 'text-white font-semibold underline decoration-amber-400 decoration-2 underline-offset-8' : ''
                  }`}
                >
                  Collect Eggs
                </button>
                <button
                  onClick={() => setActiveView('sell-eggs')}
                  className={`hover:text-white transition-colors cursor-pointer ${
                    activeView === 'sell-eggs' ? 'text-white font-semibold underline decoration-amber-400 decoration-2 underline-offset-8' : ''
                  }`}
                >
                  Sell Eggs
                </button>
                <button
                  onClick={() => setActiveView('transactions')}
                  className={`hover:text-white transition-colors cursor-pointer ${
                    activeView === 'transactions' ? 'text-white font-semibold underline decoration-amber-400 decoration-2 underline-offset-8' : ''
                  }`}
                >
                  Ledger
                </button>
                <button
                  onClick={() => setActiveView('regulatory')}
                  className={`hover:text-white transition-colors cursor-pointer ${
                    activeView === 'regulatory' ? 'text-white font-semibold underline decoration-amber-400 decoration-2 underline-offset-8' : ''
                  }`}
                >
                  Regulatory
                </button>
                {user.role === 'admin' && (
                  <button
                    onClick={() => setActiveView('admin')}
                    className="flex items-center gap-1.5 text-amber-300 font-semibold hover:text-amber-200 transition-colors"
                  >
                    <Shield className="w-3.5 h-3.5" />
                    Admin Panel
                  </button>
                )}
              </>
            ) : (
              <>
                <button
                  onClick={() => setActiveView('home')}
                  className={`hover:text-white transition-colors cursor-pointer ${
                    activeView === 'home' ? 'text-white font-semibold underline decoration-amber-400 decoration-2 underline-offset-8' : ''
                  }`}
                >
                  Home
                </button>
                <a href="#about" className="hover:text-white transition-colors">
                  About
                </a>
                <a href="#how-it-works" className="hover:text-white transition-colors">
                  How It Works
                </a>
                <a href="#breeds" className="hover:text-white transition-colors">
                  Hens & Breeds
                </a>
                <a href="#regulatory" className="hover:text-white transition-colors">
                  FBR & SECP
                </a>
                <a href="#contact" className="hover:text-white transition-colors">
                  Contact
                </a>
              </>
            )}
          </nav>

          {/* Zone 3: 1-2 primary actions */}
          <div className="flex items-center gap-3">
            {user ? (
              <div className="flex items-center gap-2 sm:gap-3">
                <button
                  onClick={() => setActiveView('account')}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-emerald-800/80 hover:bg-emerald-700 text-xs sm:text-sm font-medium border border-emerald-600/50 transition-colors cursor-pointer"
                >
                  <User className="w-4 h-4 text-emerald-200" />
                  <span className="max-w-[110px] truncate">{user.full_name.split(' ')[0]}</span>
                  <span className="hidden sm:inline-block font-mono text-amber-300 tabular-nums font-semibold">
                    Rs {user.balance.toLocaleString()}
                  </span>
                </button>

                <button
                  onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                  className="md:hidden p-2 rounded-lg text-emerald-200 hover:text-white hover:bg-emerald-800/50 focus:outline-none"
                  aria-label="Toggle menu"
                >
                  {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2 sm:gap-3">
                <button
                  onClick={() => openAuthModal('login')}
                  className="px-3.5 py-2 text-xs sm:text-sm font-medium text-emerald-100 hover:text-white transition-colors cursor-pointer flex items-center gap-1.5"
                >
                  <LogIn className="w-4 h-4" />
                  Login
                </button>
                <button
                  onClick={() => openAuthModal('register')}
                  className="px-4 py-2 text-xs sm:text-sm font-semibold text-emerald-950 bg-amber-400 hover:bg-amber-300 rounded-lg shadow-sm transition-all cursor-pointer whitespace-nowrap"
                >
                  Register Now
                </button>

                <button
                  onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                  className="md:hidden p-2 rounded-lg text-emerald-200 hover:text-white hover:bg-emerald-800/50 focus:outline-none"
                  aria-label="Toggle menu"
                >
                  {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-[#053F30] border-t border-emerald-700/50 px-4 pt-3 pb-4 space-y-2">
          {user ? (
            <>
              <button
                onClick={() => {
                  setActiveView('dashboard');
                  setMobileMenuOpen(false);
                }}
                className="w-full text-left px-3 py-2 text-sm font-medium text-emerald-100 hover:text-white rounded-md hover:bg-emerald-800/60"
              >
                Dashboard Overview
              </button>
              <button
                onClick={() => {
                  setActiveView('buy-hen');
                  setMobileMenuOpen(false);
                }}
                className="w-full text-left px-3 py-2 text-sm font-medium text-emerald-100 hover:text-white rounded-md hover:bg-emerald-800/60"
              >
                Buy Hen
              </button>
              <button
                onClick={() => {
                  setActiveView('collect-eggs');
                  setMobileMenuOpen(false);
                }}
                className="w-full text-left px-3 py-2 text-sm font-medium text-emerald-100 hover:text-white rounded-md hover:bg-emerald-800/60"
              >
                Collect Eggs
              </button>
              <button
                onClick={() => {
                  setActiveView('sell-eggs');
                  setMobileMenuOpen(false);
                }}
                className="w-full text-left px-3 py-2 text-sm font-medium text-emerald-100 hover:text-white rounded-md hover:bg-emerald-800/60"
              >
                Sell Eggs
              </button>
              <button
                onClick={() => {
                  setActiveView('transactions');
                  setMobileMenuOpen(false);
                }}
                className="w-full text-left px-3 py-2 text-sm font-medium text-emerald-100 hover:text-white rounded-md hover:bg-emerald-800/60"
              >
                Transaction History
              </button>
              <button
                onClick={() => {
                  setActiveView('referrals');
                  setMobileMenuOpen(false);
                }}
                className="w-full text-left px-3 py-2 text-sm font-medium text-emerald-100 hover:text-white rounded-md hover:bg-emerald-800/60"
              >
                Referral Program
              </button>
              <button
                onClick={() => {
                  setActiveView('regulatory');
                  setMobileMenuOpen(false);
                }}
                className="w-full text-left px-3 py-2 text-sm font-medium text-emerald-100 hover:text-white rounded-md hover:bg-emerald-800/60"
              >
                FBR & SECP Info
              </button>
              <button
                onClick={() => {
                  setActiveView('support');
                  setMobileMenuOpen(false);
                }}
                className="w-full text-left px-3 py-2 text-sm font-medium text-emerald-100 hover:text-white rounded-md hover:bg-emerald-800/60"
              >
                Help & Support
              </button>
              {user.role === 'admin' && (
                <button
                  onClick={() => {
                    setActiveView('admin');
                    setMobileMenuOpen(false);
                  }}
                  className="w-full text-left px-3 py-2 text-sm font-semibold text-amber-300 rounded-md bg-amber-900/30"
                >
                  Admin Control Panel
                </button>
              )}
            </>
          ) : (
            <>
              <button
                onClick={() => {
                  setActiveView('home');
                  setMobileMenuOpen(false);
                }}
                className="w-full text-left px-3 py-2 text-sm font-medium text-emerald-100 hover:text-white rounded-md hover:bg-emerald-800/60"
              >
                Home
              </button>
              <a
                href="#about"
                onClick={() => setMobileMenuOpen(false)}
                className="block px-3 py-2 text-sm font-medium text-emerald-100 hover:text-white rounded-md hover:bg-emerald-800/60"
              >
                About Us
              </a>
              <a
                href="#how-it-works"
                onClick={() => setMobileMenuOpen(false)}
                className="block px-3 py-2 text-sm font-medium text-emerald-100 hover:text-white rounded-md hover:bg-emerald-800/60"
              >
                How It Works
              </a>
              <a
                href="#breeds"
                onClick={() => setMobileMenuOpen(false)}
                className="block px-3 py-2 text-sm font-medium text-emerald-100 hover:text-white rounded-md hover:bg-emerald-800/60"
              >
                Hens & Breeds
              </a>
              <a
                href="#regulatory"
                onClick={() => setMobileMenuOpen(false)}
                className="block px-3 py-2 text-sm font-medium text-emerald-100 hover:text-white rounded-md hover:bg-emerald-800/60"
              >
                FBR & SECP
              </a>
              <a
                href="#contact"
                onClick={() => setMobileMenuOpen(false)}
                className="block px-3 py-2 text-sm font-medium text-emerald-100 hover:text-white rounded-md hover:bg-emerald-800/60"
              >
                Contact & Support
              </a>
              <button
                onClick={() => {
                  openAuthModal('admin');
                  setMobileMenuOpen(false);
                }}
                className="w-full text-left px-3 py-2 text-xs font-medium text-emerald-300 hover:text-white"
              >
                Administrator Login
              </button>
            </>
          )}
        </div>
      )}
    </header>
  );
};
