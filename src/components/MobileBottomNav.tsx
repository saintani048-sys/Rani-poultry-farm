import React from 'react';
import { useAuth } from '../context/AuthContext.tsx';
import { Home, ShoppingBag, Egg, User, LogOut } from 'lucide-react';

export const MobileBottomNav: React.FC = () => {
  const { user, activeView, setActiveView, logout, openAuthModal } = useAuth();

  if (!user) {
    return null;
  }

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-[#064E3B] border-t border-[#047857]/40 px-2 py-1 shadow-lg">
      <div className="grid grid-cols-5 gap-1 items-center justify-around">
        <button
          onClick={() => setActiveView('dashboard')}
          className={`flex flex-col items-center justify-center py-1.5 px-1 rounded-lg text-xs font-medium transition-colors ${
            activeView === 'dashboard'
              ? 'text-amber-400 font-semibold'
              : 'text-emerald-200 hover:text-white'
          }`}
        >
          <Home className="w-5 h-5 mb-0.5" />
          <span className="truncate">Home</span>
        </button>

        <button
          onClick={() => setActiveView('sell-eggs')}
          className={`flex flex-col items-center justify-center py-1.5 px-1 rounded-lg text-xs font-medium transition-colors ${
            activeView === 'sell-eggs'
              ? 'text-amber-400 font-semibold'
              : 'text-emerald-200 hover:text-white'
          }`}
        >
          <Egg className="w-5 h-5 mb-0.5" />
          <span className="truncate">Sell Eggs</span>
        </button>

        <button
          onClick={() => setActiveView('buy-hen')}
          className={`flex flex-col items-center justify-center py-1.5 px-1 rounded-lg text-xs font-medium transition-colors ${
            activeView === 'buy-hen'
              ? 'text-amber-400 font-semibold'
              : 'text-emerald-200 hover:text-white'
          }`}
        >
          <ShoppingBag className="w-5 h-5 mb-0.5" />
          <span className="truncate">Buy Hen</span>
        </button>

        <button
          onClick={() => setActiveView('account')}
          className={`flex flex-col items-center justify-center py-1.5 px-1 rounded-lg text-xs font-medium transition-colors ${
            activeView === 'account'
              ? 'text-amber-400 font-semibold'
              : 'text-emerald-200 hover:text-white'
          }`}
        >
          <User className="w-5 h-5 mb-0.5" />
          <span className="truncate">Account</span>
        </button>

        <button
          onClick={logout}
          className="flex flex-col items-center justify-center py-1.5 px-1 rounded-lg text-xs font-medium text-red-300 hover:text-red-100 transition-colors"
        >
          <LogOut className="w-5 h-5 mb-0.5" />
          <span className="truncate">Logout</span>
        </button>
      </div>
    </nav>
  );
};
