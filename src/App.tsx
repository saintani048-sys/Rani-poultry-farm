/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { AuthProvider, useAuth } from './context/AuthContext.tsx';
import { Navbar } from './components/Navbar.tsx';
import { MobileBottomNav } from './components/MobileBottomNav.tsx';
import { LandingPage } from './components/LandingPage.tsx';
import { UserDashboard } from './components/UserDashboard.tsx';
import { AdminDashboard } from './components/admin/AdminDashboard.tsx';
import { AuthModal } from './components/AuthModal.tsx';

const AppContent: React.FC = () => {
  const { user, loading, activeView } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#FDFBF7]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-[#064E3B] text-amber-300 flex items-center justify-center font-bold text-2xl animate-pulse shadow-md">
            N
          </div>
          <span className="text-xs font-semibold text-slate-500 tracking-wider">
            Loading Noorani Poultry Farm...
          </span>
        </div>
      </div>
    );
  }

  // If in admin view and user is an admin
  if (activeView === 'admin' && user?.role === 'admin') {
    return (
      <>
        <AdminDashboard />
        <AuthModal />
      </>
    );
  }

  return (
    <div className="min-h-screen bg-[#FDFBF7] flex flex-col font-['Plus_Jakarta_Sans',sans-serif]">
      <Navbar />

      <main className="flex-1">
        {user ? <UserDashboard /> : <LandingPage />}
      </main>

      <MobileBottomNav />
      <AuthModal />
    </div>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}
