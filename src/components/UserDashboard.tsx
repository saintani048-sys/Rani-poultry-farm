import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext.tsx';
import { api } from '../services/api.ts';
import {
  ShoppingBag,
  Egg,
  ShieldCheck,
  Building,
  Sparkles,
  History,
  Users,
  HelpCircle,
  ArrowUpRight,
  ArrowDownLeft,
  Copy,
  Check,
  User,
  Clock,
  RefreshCw,
  Wallet,
  TrendingUp,
} from 'lucide-react';
import { BuyHenModule } from './modules/BuyHenModule.tsx';
import { SellEggsModule } from './modules/SellEggsModule.tsx';
import { CollectEggsModule } from './modules/CollectEggsModule.tsx';
import { TransactionsModule } from './modules/TransactionsModule.tsx';
import { ReferralsModule } from './modules/ReferralsModule.tsx';
import { RegulatoryModule } from './modules/RegulatoryModule.tsx';
import { SupportModule } from './modules/SupportModule.tsx';
import { AccountModule } from './modules/AccountModule.tsx';
import { DepositModal } from './DepositModal.tsx';
import { WithdrawModal } from './WithdrawModal.tsx';

export const UserDashboard: React.FC = () => {
  const { user, refreshUser, activeView, setActiveView, settings } = useAuth();
  const [summary, setSummary] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [copiedCode, setCopiedCode] = useState(false);

  // Modals
  const [depositOpen, setDepositOpen] = useState(false);
  const [withdrawOpen, setWithdrawOpen] = useState(false);

  const loadSummary = async () => {
    try {
      const data = await api.getDashboardSummary();
      setSummary(data);
    } catch (err) {
      console.error('Failed to load dashboard summary:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSummary();
  }, []);

  const handleCopyReferral = () => {
    if (navigator.clipboard && user?.referral_code) {
      navigator.clipboard.writeText(user.referral_code);
      setCopiedCode(true);
      setTimeout(() => setCopiedCode(false), 2000);
    }
  };

  // If activeView is a sub-module, render it
  if (activeView === 'buy-hen') {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 pb-24 md:pb-12">
        <BuyHenModule onBack={() => setActiveView('dashboard')} />
      </div>
    );
  }
  if (activeView === 'sell-eggs') {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 pb-24 md:pb-12">
        <SellEggsModule onBack={() => setActiveView('dashboard')} />
      </div>
    );
  }
  if (activeView === 'collect-eggs') {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 pb-24 md:pb-12">
        <CollectEggsModule onBack={() => setActiveView('dashboard')} />
      </div>
    );
  }
  if (activeView === 'transactions') {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 pb-24 md:pb-12">
        <TransactionsModule
          onBack={() => setActiveView('dashboard')}
          openDepositModal={() => setDepositOpen(true)}
          openWithdrawModal={() => setWithdrawOpen(true)}
        />
        <DepositModal
          isOpen={depositOpen}
          onClose={() => setDepositOpen(false)}
          onSuccess={() => { loadSummary(); refreshUser(); }}
        />
        <WithdrawModal
          isOpen={withdrawOpen}
          onClose={() => setWithdrawOpen(false)}
          onSuccess={() => { loadSummary(); refreshUser(); }}
        />
      </div>
    );
  }
  if (activeView === 'referrals') {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 pb-24 md:pb-12">
        <ReferralsModule onBack={() => setActiveView('dashboard')} />
      </div>
    );
  }
  if (activeView === 'regulatory') {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 pb-24 md:pb-12">
        <RegulatoryModule onBack={() => setActiveView('dashboard')} />
      </div>
    );
  }
  if (activeView === 'support') {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 pb-24 md:pb-12">
        <SupportModule onBack={() => setActiveView('dashboard')} />
      </div>
    );
  }
  if (activeView === 'account') {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 pb-24 md:pb-12">
        <AccountModule onBack={() => setActiveView('dashboard')} />
      </div>
    );
  }

  // Otherwise, default: Main User Dashboard (inspired by Screenshot 1)
  const metrics = summary?.metrics || {
    balance: user?.balance || 0,
    total_deposited: 0,
    total_withdrawn: 0,
    total_hens: 0,
    current_eggs: 0,
    total_collected: 0,
    total_sold: 0,
    pending_requests: 0,
    completed_transactions: 0,
    egg_price: 35,
    eligible_eggs_to_collect: 0,
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 pb-24 md:pb-12 space-y-6">
      {/* 1. Dashboard Header inspired by Reference Screenshot 1 */}
      <div className="bg-gradient-to-r from-[#064E3B] to-[#043d2f] text-white p-5 sm:p-7 rounded-3xl shadow-sm border border-emerald-700/50">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-amber-400/20 border border-amber-400/40 flex items-center justify-center text-amber-300 font-bold text-xl shadow-inner">
              {user?.full_name ? user.full_name[0].toUpperCase() : 'N'}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg sm:text-xl font-bold tracking-tight text-white">
                  Assalam-o-Alaikum, {user?.full_name}
                </h1>
              </div>
              <div className="flex items-center gap-3 text-xs text-emerald-200 mt-0.5">
                <span>@{user?.username}</span>
                <span>·</span>
                <div className="flex items-center gap-1">
                  <span>Ref:</span>
                  <span className="font-mono text-amber-300 font-bold">{user?.referral_code}</span>
                  <button
                    onClick={handleCopyReferral}
                    className="p-1 hover:text-white transition-colors"
                    title="Copy code"
                  >
                    {copiedCode ? <Check className="w-3 h-3 text-amber-300" /> : <Copy className="w-3 h-3" />}
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              onClick={() => setActiveView('account')}
              className="px-3.5 py-2 bg-emerald-800/80 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold border border-emerald-600/50 transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <User className="w-4 h-4 text-emerald-200" />
              <span>Profile</span>
            </button>
            <button
              onClick={() => { loadSummary(); refreshUser(); }}
              className="p-2 bg-emerald-800/80 hover:bg-emerald-700 text-emerald-200 hover:text-white rounded-xl border border-emerald-600/50 transition-colors"
              title="Refresh"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Balance & Financial Action Bar */}
        <div className="mt-6 pt-5 border-t border-emerald-700/50 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div>
              <span className="text-[11px] text-emerald-300 uppercase block font-medium">
                Available Wallet Balance
              </span>
              <div className="text-2xl sm:text-3xl font-extrabold text-white font-mono tabular-nums">
                PKR {metrics.balance.toLocaleString()}
              </div>
            </div>
            {metrics.eligible_eggs_to_collect > 0 && (
              <div className="px-3 py-1.5 bg-amber-400 text-emerald-950 rounded-xl text-xs font-bold animate-pulse flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5" />
                <span>{metrics.eligible_eggs_to_collect} Eggs Ready to Harvest!</span>
              </div>
            )}
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setDepositOpen(true)}
              className="px-4 py-2 bg-emerald-700 hover:bg-emerald-600 text-white text-xs font-bold rounded-xl shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <ArrowDownLeft className="w-4 h-4 text-amber-300" />
              <span>Deposit Funds</span>
            </button>
            <button
              onClick={() => setWithdrawOpen(true)}
              className="px-4 py-2 bg-amber-400 hover:bg-amber-300 text-emerald-950 text-xs font-bold rounded-xl shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <ArrowUpRight className="w-4 h-4" />
              <span>Withdraw</span>
            </button>
          </div>
        </div>
      </div>

      {/* 2. Real Metrics Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3 sm:gap-4">
        <div className="bg-white p-3.5 sm:p-4 rounded-2xl border border-slate-200 shadow-xs">
          <span className="text-[11px] text-slate-400 block font-medium">Active Hens Owned</span>
          <div className="text-lg sm:text-xl font-bold text-slate-900 font-mono mt-0.5 tabular-nums">
            {metrics.total_hens} <span className="text-xs font-normal text-slate-500 font-sans">Hens</span>
          </div>
        </div>

        <div className="bg-white p-3.5 sm:p-4 rounded-2xl border border-slate-200 shadow-xs">
          <span className="text-[11px] text-slate-400 block font-medium">Eggs in Inventory</span>
          <div className="text-lg sm:text-xl font-bold text-[#064E3B] font-mono mt-0.5 tabular-nums">
            {metrics.current_eggs} <span className="text-xs font-normal text-slate-500 font-sans">Eggs</span>
          </div>
        </div>

        <div className="bg-white p-3.5 sm:p-4 rounded-2xl border border-slate-200 shadow-xs">
          <span className="text-[11px] text-slate-400 block font-medium">Egg Market Rate</span>
          <div className="text-lg sm:text-xl font-bold text-amber-700 font-mono mt-0.5 tabular-nums">
            Rs {metrics.egg_price} <span className="text-xs font-normal text-slate-500 font-sans">/egg</span>
          </div>
        </div>

        <div className="bg-white p-3.5 sm:p-4 rounded-2xl border border-slate-200 shadow-xs">
          <span className="text-[11px] text-slate-400 block font-medium">Total Deposited</span>
          <div className="text-lg sm:text-xl font-bold text-slate-900 font-mono mt-0.5 tabular-nums">
            PKR {metrics.total_deposited.toLocaleString()}
          </div>
        </div>

        <div className="bg-white p-3.5 sm:p-4 rounded-2xl border border-slate-200 shadow-xs">
          <span className="text-[11px] text-slate-400 block font-medium">Total Withdrawn</span>
          <div className="text-lg sm:text-xl font-bold text-slate-900 font-mono mt-0.5 tabular-nums">
            PKR {metrics.total_withdrawn.toLocaleString()}
          </div>
        </div>

        <div className="bg-white p-3.5 sm:p-4 rounded-2xl border border-slate-200 shadow-xs">
          <span className="text-[11px] text-slate-400 block font-medium">Pending Requests</span>
          <div className="text-lg sm:text-xl font-bold text-amber-600 font-mono mt-0.5 tabular-nums">
            {metrics.pending_requests} <span className="text-xs font-normal text-slate-500 font-sans">Review</span>
          </div>
        </div>
      </div>

      {/* 3. The 8 Main Feature Cards inspired by Reference Screenshot 1 */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-bold text-slate-900">
            Farm Services & Features
          </h2>
          <span className="text-xs text-slate-500">Tap any service to manage</span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 gap-4">
          {/* 1. Buy Hen */}
          <div
            onClick={() => setActiveView('buy-hen')}
            className="group cursor-pointer bg-white p-5 rounded-2xl border border-slate-200 shadow-xs hover:shadow-md hover:border-emerald-600 transition-all flex flex-col justify-between"
          >
            <div>
              <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-800 flex items-center justify-center mb-3 group-hover:bg-emerald-700 group-hover:text-white transition-colors">
                <ShoppingBag className="w-6 h-6" />
              </div>
              <h3 className="text-sm font-bold text-slate-900 group-hover:text-emerald-800 transition-colors">
                1. Buy Hen
              </h3>
              <p className="text-[11px] text-slate-500 mt-1 line-clamp-2">
                Browse layer breeds, check stock, and purchase verified hens.
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-emerald-700 font-semibold">
              <span>Flock Store</span>
              <span className="group-hover:translate-x-1 transition-transform">→</span>
            </div>
          </div>

          {/* 2. Sell Eggs */}
          <div
            onClick={() => setActiveView('sell-eggs')}
            className="group cursor-pointer bg-white p-5 rounded-2xl border border-slate-200 shadow-xs hover:shadow-md hover:border-amber-500 transition-all flex flex-col justify-between"
          >
            <div>
              <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-800 flex items-center justify-center mb-3 group-hover:bg-amber-500 group-hover:text-white transition-colors">
                <Egg className="w-6 h-6" />
              </div>
              <h3 className="text-sm font-bold text-slate-900 group-hover:text-amber-800 transition-colors">
                2. Sell Eggs
              </h3>
              <p className="text-[11px] text-slate-500 mt-1 line-clamp-2">
                Sell collected farm eggs directly for instant PKR payout.
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-amber-700 font-semibold">
              <span>PKR {metrics.egg_price}/egg</span>
              <span className="group-hover:translate-x-1 transition-transform">→</span>
            </div>
          </div>

          {/* 3. FBR Information */}
          <div
            onClick={() => setActiveView('regulatory')}
            className="group cursor-pointer bg-white p-5 rounded-2xl border border-slate-200 shadow-xs hover:shadow-md hover:border-emerald-600 transition-all flex flex-col justify-between"
          >
            <div>
              <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-800 flex items-center justify-center mb-3 group-hover:bg-emerald-700 group-hover:text-white transition-colors">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <h3 className="text-sm font-bold text-slate-900 group-hover:text-emerald-800 transition-colors">
                3. FBR Information
              </h3>
              <p className="text-[11px] text-slate-500 mt-1 line-clamp-2">
                Active Taxpayer NTN 7849201-4 & Section 41 livestock exemption.
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-emerald-700 font-semibold">
              <span>Verified NTN</span>
              <span className="group-hover:translate-x-1 transition-transform">→</span>
            </div>
          </div>

          {/* 4. SECP Information */}
          <div
            onClick={() => setActiveView('regulatory')}
            className="group cursor-pointer bg-white p-5 rounded-2xl border border-slate-200 shadow-xs hover:shadow-md hover:border-emerald-600 transition-all flex flex-col justify-between"
          >
            <div>
              <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-800 flex items-center justify-center mb-3 group-hover:bg-emerald-700 group-hover:text-white transition-colors">
                <Building className="w-6 h-6" />
              </div>
              <h3 className="text-sm font-bold text-slate-900 group-hover:text-emerald-800 transition-colors">
                4. SECP Information
              </h3>
              <p className="text-[11px] text-slate-500 mt-1 line-clamp-2">
                Corporate Registration CUIN 0194823 under Companies Act 2017.
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-emerald-700 font-semibold">
              <span>Corporate Reg</span>
              <span className="group-hover:translate-x-1 transition-transform">→</span>
            </div>
          </div>

          {/* 5. Collect Eggs */}
          <div
            onClick={() => setActiveView('collect-eggs')}
            className="group cursor-pointer bg-white p-5 rounded-2xl border border-slate-200 shadow-xs hover:shadow-md hover:border-amber-500 transition-all flex flex-col justify-between relative overflow-hidden"
          >
            {metrics.eligible_eggs_to_collect > 0 && (
              <span className="absolute top-2 right-2 px-2 py-0.5 bg-amber-400 text-emerald-950 font-bold font-mono text-[10px] rounded-full">
                +{metrics.eligible_eggs_to_collect}
              </span>
            )}
            <div>
              <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-800 flex items-center justify-center mb-3 group-hover:bg-amber-500 group-hover:text-white transition-colors">
                <Sparkles className="w-6 h-6" />
              </div>
              <h3 className="text-sm font-bold text-slate-900 group-hover:text-amber-800 transition-colors">
                5. Collect Eggs
              </h3>
              <p className="text-[11px] text-slate-500 mt-1 line-clamp-2">
                Check laying cycle countdown and harvest ready eggs.
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-amber-700 font-semibold">
              <span>{metrics.eligible_eggs_to_collect > 0 ? 'Collect Now!' : 'Check Timer'}</span>
              <span className="group-hover:translate-x-1 transition-transform">→</span>
            </div>
          </div>

          {/* 6. Transaction History */}
          <div
            onClick={() => setActiveView('transactions')}
            className="group cursor-pointer bg-white p-5 rounded-2xl border border-slate-200 shadow-xs hover:shadow-md hover:border-emerald-600 transition-all flex flex-col justify-between"
          >
            <div>
              <div className="w-12 h-12 rounded-xl bg-slate-100 text-slate-800 flex items-center justify-center mb-3 group-hover:bg-emerald-700 group-hover:text-white transition-colors">
                <History className="w-6 h-6" />
              </div>
              <h3 className="text-sm font-bold text-slate-900 group-hover:text-emerald-800 transition-colors">
                6. Transaction History
              </h3>
              <p className="text-[11px] text-slate-500 mt-1 line-clamp-2">
                Audited ledger of all deposits, withdrawals, hens, and egg sales.
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-emerald-700 font-semibold">
              <span>View Ledger</span>
              <span className="group-hover:translate-x-1 transition-transform">→</span>
            </div>
          </div>

          {/* 7. Referral Program */}
          <div
            onClick={() => setActiveView('referrals')}
            className="group cursor-pointer bg-white p-5 rounded-2xl border border-slate-200 shadow-xs hover:shadow-md hover:border-emerald-600 transition-all flex flex-col justify-between"
          >
            <div>
              <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-800 flex items-center justify-center mb-3 group-hover:bg-emerald-700 group-hover:text-white transition-colors">
                <Users className="w-6 h-6" />
              </div>
              <h3 className="text-sm font-bold text-slate-900 group-hover:text-emerald-800 transition-colors">
                7. Referral Program
              </h3>
              <p className="text-[11px] text-slate-500 mt-1 line-clamp-2">
                Invite friends with your unique code and earn rewards.
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-emerald-700 font-semibold">
              <span>Code: {user?.referral_code}</span>
              <span className="group-hover:translate-x-1 transition-transform">→</span>
            </div>
          </div>

          {/* 8. Help and Support */}
          <div
            onClick={() => setActiveView('support')}
            className="group cursor-pointer bg-white p-5 rounded-2xl border border-slate-200 shadow-xs hover:shadow-md hover:border-emerald-600 transition-all flex flex-col justify-between"
          >
            <div>
              <div className="w-12 h-12 rounded-xl bg-slate-100 text-slate-800 flex items-center justify-center mb-3 group-hover:bg-emerald-700 group-hover:text-white transition-colors">
                <HelpCircle className="w-6 h-6" />
              </div>
              <h3 className="text-sm font-bold text-slate-900 group-hover:text-emerald-800 transition-colors">
                8. Help and Support
              </h3>
              <p className="text-[11px] text-slate-500 mt-1 line-clamp-2">
                Contact farm administration, WhatsApp, or submit a support ticket.
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-emerald-700 font-semibold">
              <span>Farm Helpdesk</span>
              <span className="group-hover:translate-x-1 transition-transform">→</span>
            </div>
          </div>
        </div>
      </div>

      {/* 4. Recent Transactions Snippet */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-bold text-slate-900">Recent Transactions</h3>
          <button
            onClick={() => setActiveView('transactions')}
            className="text-xs font-semibold text-emerald-700 hover:text-emerald-900"
          >
            View Full Ledger →
          </button>
        </div>

        {(!summary?.recent_transactions || summary.recent_transactions.length === 0) ? (
          <p className="text-xs text-slate-500 py-3 text-center">
            No transactions yet. Start by purchasing hens or depositing funds.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 uppercase font-semibold text-[10px]">
                <tr>
                  <th className="py-2 px-3">Reference</th>
                  <th className="py-2 px-3">Description</th>
                  <th className="py-2 px-3 text-right">Amount</th>
                  <th className="py-2 px-3 text-right">Balance</th>
                  <th className="py-2 px-3">Status</th>
                  <th className="py-2 px-3">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {summary.recent_transactions.map((tx: any, idx: number) => {
                  const isPositive = tx.amount > 0;
                  return (
                    <tr key={idx} className="hover:bg-slate-50/50">
                      <td className="py-2 px-3 font-mono font-medium text-slate-800">
                        {tx.reference_no}
                      </td>
                      <td className="py-2 px-3 text-slate-700 truncate max-w-xs">
                        {tx.description}
                      </td>
                      <td
                        className={`py-2 px-3 text-right font-mono font-bold ${
                          isPositive ? 'text-emerald-700' : 'text-slate-800'
                        }`}
                      >
                        {isPositive ? `+PKR ${tx.amount.toLocaleString()}` : `-PKR ${Math.abs(tx.amount).toLocaleString()}`}
                      </td>
                      <td className="py-2 px-3 text-right font-mono text-slate-600">
                        PKR {tx.balance_after.toLocaleString()}
                      </td>
                      <td className="py-2 px-3">
                        <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-100 text-emerald-800 uppercase">
                          {tx.status}
                        </span>
                      </td>
                      <td className="py-2 px-3 text-slate-400 font-mono text-[11px]">
                        {new Date(tx.created_at).toLocaleDateString()}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modals */}
      <DepositModal
        isOpen={depositOpen}
        onClose={() => setDepositOpen(false)}
        onSuccess={() => { loadSummary(); refreshUser(); }}
      />
      <WithdrawModal
        isOpen={withdrawOpen}
        onClose={() => setWithdrawOpen(false)}
        onSuccess={() => { loadSummary(); refreshUser(); }}
      />
    </div>
  );
};
