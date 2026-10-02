import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext.tsx';
import { api } from '../../services/api.ts';
import { Transaction, DepositRequest, WithdrawalRequest } from '../../types/index.ts';
import { ArrowLeft, RefreshCw, ArrowUpRight, ArrowDownLeft, Wallet, Building2, Smartphone, CheckCircle, AlertCircle } from 'lucide-react';

export const TransactionsModule: React.FC<{
  onBack: () => void;
  openDepositModal: () => void;
  openWithdrawModal: () => void;
}> = ({ onBack, openDepositModal, openWithdrawModal }) => {
  const { user, refreshUser } = useAuth();
  const [activeTab, setActiveTab] = useState<'ledger' | 'deposits' | 'withdrawals'>('ledger');
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [deposits, setDeposits] = useState<DepositRequest[]>([]);
  const [withdrawals, setWithdrawals] = useState<WithdrawalRequest[]>([]);
  const [loading, setLoading] = useState(false);

  const loadData = async () => {
    setLoading(true);
    try {
      const [txs, deps, withs] = await Promise.all([
        api.getTransactions(),
        api.getDeposits(),
        api.getWithdrawals(),
      ]);
      setTransactions(txs);
      setDeposits(deps);
      setWithdrawals(withs);
    } catch (err) {
      console.error('Failed to load transaction data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  return (
    <div className="space-y-6">
      {/* Header bar */}
      <div className="flex items-center justify-between">
        <button
          onClick={onBack}
          className="flex items-center gap-1.5 text-xs sm:text-sm font-semibold text-emerald-800 hover:text-emerald-950 cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Dashboard</span>
        </button>

        <div className="flex items-center gap-2">
          <button
            onClick={openDepositModal}
            className="px-3 py-1.5 bg-[#064E3B] hover:bg-[#053F30] text-white text-xs font-semibold rounded-lg shadow-xs transition-colors flex items-center gap-1 cursor-pointer"
          >
            <ArrowDownLeft className="w-3.5 h-3.5" />
            <span>Deposit Funds</span>
          </button>
          <button
            onClick={openWithdrawModal}
            className="px-3 py-1.5 bg-amber-400 hover:bg-amber-300 text-emerald-950 text-xs font-bold rounded-lg shadow-xs transition-colors flex items-center gap-1 cursor-pointer"
          >
            <ArrowUpRight className="w-3.5 h-3.5" />
            <span>Withdraw</span>
          </button>
          <button
            onClick={loadData}
            className="p-1.5 rounded-lg text-slate-500 hover:text-emerald-800 hover:bg-slate-100 transition-colors"
            title="Refresh"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Balance Card */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs text-slate-500 block uppercase font-medium">Available Account Balance</span>
          <div className="text-3xl font-extrabold text-[#064E3B] font-mono mt-0.5 tabular-nums">
            PKR {user?.balance.toLocaleString()}
          </div>
          <span className="text-xs text-slate-400">Audited double-entry balance</span>
        </div>

        <div className="flex gap-4 text-xs border-t sm:border-t-0 sm:border-l border-slate-100 pt-3 sm:pt-0 sm:pl-6">
          <div>
            <span className="text-slate-400 block">Total Deposited</span>
            <span className="font-mono font-bold text-slate-700">
              PKR {deposits.filter(d => d.status === 'approved').reduce((acc, d) => acc + d.amount, 0).toLocaleString()}
            </span>
          </div>
          <div>
            <span className="text-slate-400 block">Total Withdrawn</span>
            <span className="font-mono font-bold text-slate-700">
              PKR {withdrawals.filter(w => w.status === 'approved').reduce((acc, w) => acc + w.amount, 0).toLocaleString()}
            </span>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200 text-xs font-semibold">
        <button
          onClick={() => setActiveTab('ledger')}
          className={`py-3 px-4 border-b-2 transition-colors cursor-pointer ${
            activeTab === 'ledger'
              ? 'border-emerald-700 text-emerald-900 font-bold'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          Financial Ledger ({transactions.length})
        </button>
        <button
          onClick={() => setActiveTab('deposits')}
          className={`py-3 px-4 border-b-2 transition-colors cursor-pointer ${
            activeTab === 'deposits'
              ? 'border-emerald-700 text-emerald-900 font-bold'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          Deposit Requests ({deposits.length})
        </button>
        <button
          onClick={() => setActiveTab('withdrawals')}
          className={`py-3 px-4 border-b-2 transition-colors cursor-pointer ${
            activeTab === 'withdrawals'
              ? 'border-emerald-700 text-emerald-900 font-bold'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          Withdrawal Requests ({withdrawals.length})
        </button>
      </div>

      {/* Tab 1: Ledger */}
      {activeTab === 'ledger' && (
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <h3 className="text-base font-bold text-slate-900 mb-3">All Account Movements</h3>
          {transactions.length === 0 ? (
            <p className="text-xs text-slate-500 py-6 text-center">No transaction records found.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 uppercase font-semibold text-[11px]">
                  <tr>
                    <th className="py-2.5 px-3">Transaction ID</th>
                    <th className="py-2.5 px-3">Type</th>
                    <th className="py-2.5 px-3">Description</th>
                    <th className="py-2.5 px-3 text-right">Amount</th>
                    <th className="py-2.5 px-3 text-right">Balance Result</th>
                    <th className="py-2.5 px-3">Status</th>
                    <th className="py-2.5 px-3">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {transactions.map((tx) => {
                    const isPositive = tx.amount > 0;
                    return (
                      <tr key={tx.id} className="hover:bg-slate-50/50">
                        <td className="py-2.5 px-3 font-mono font-medium text-slate-800">
                          {tx.reference_no}
                        </td>
                        <td className="py-2.5 px-3 capitalize font-semibold text-slate-700">
                          {tx.type.replace('_', ' ')}
                        </td>
                        <td className="py-2.5 px-3 text-slate-600 max-w-xs truncate">
                          {tx.description}
                        </td>
                        <td
                          className={`py-2.5 px-3 text-right font-mono font-bold ${
                            isPositive ? 'text-emerald-700' : 'text-slate-800'
                          }`}
                        >
                          {isPositive ? `+PKR ${tx.amount.toLocaleString()}` : `-PKR ${Math.abs(tx.amount).toLocaleString()}`}
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono text-slate-600">
                          PKR {tx.balance_after.toLocaleString()}
                        </td>
                        <td className="py-2.5 px-3">
                          <span
                            className={`inline-block px-2 py-0.5 rounded text-[10px] font-semibold uppercase ${
                              tx.status === 'completed'
                                ? 'bg-emerald-100 text-emerald-800'
                                : tx.status === 'pending'
                                ? 'bg-amber-100 text-amber-800'
                                : 'bg-red-100 text-red-800'
                            }`}
                          >
                            {tx.status}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 text-slate-500 font-mono text-[11px]">
                          {new Date(tx.created_at).toLocaleString()}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Tab 2: Deposits */}
      {activeTab === 'deposits' && (
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <h3 className="text-base font-bold text-slate-900 mb-3">Submitted Deposit Verifications</h3>
          {deposits.length === 0 ? (
            <p className="text-xs text-slate-500 py-6 text-center">No deposits submitted yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 uppercase font-semibold text-[11px]">
                  <tr>
                    <th className="py-2.5 px-3">Ref ID</th>
                    <th className="py-2.5 px-3">Method</th>
                    <th className="py-2.5 px-3">TID</th>
                    <th className="py-2.5 px-3 text-right">Amount</th>
                    <th className="py-2.5 px-3">Status</th>
                    <th className="py-2.5 px-3">Admin Notes</th>
                    <th className="py-2.5 px-3">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {deposits.map((dep) => (
                    <tr key={dep.id} className="hover:bg-slate-50/50">
                      <td className="py-2.5 px-3 font-mono text-slate-800 font-medium">
                        {dep.reference_no}
                      </td>
                      <td className="py-2.5 px-3 capitalize text-slate-700">
                        {dep.payment_method.replace('_', ' ')}
                      </td>
                      <td className="py-2.5 px-3 font-mono text-slate-600">
                        {dep.transaction_ref}
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono font-bold text-emerald-800">
                        PKR {dep.amount.toLocaleString()}
                      </td>
                      <td className="py-2.5 px-3">
                        <span
                          className={`inline-block px-2 py-0.5 rounded text-[10px] font-semibold uppercase ${
                            dep.status === 'approved'
                              ? 'bg-emerald-100 text-emerald-800'
                              : dep.status === 'pending'
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-red-100 text-red-800'
                          }`}
                        >
                          {dep.status}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-slate-500 text-[11px]">
                        {dep.admin_notes || '—'}
                      </td>
                      <td className="py-2.5 px-3 text-slate-500 font-mono text-[11px]">
                        {new Date(dep.created_at).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Tab 3: Withdrawals */}
      {activeTab === 'withdrawals' && (
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <h3 className="text-base font-bold text-slate-900 mb-3">Withdrawal Payout Requests</h3>
          {withdrawals.length === 0 ? (
            <p className="text-xs text-slate-500 py-6 text-center">No withdrawal requests submitted yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 uppercase font-semibold text-[11px]">
                  <tr>
                    <th className="py-2.5 px-3">Ref ID</th>
                    <th className="py-2.5 px-3">Method</th>
                    <th className="py-2.5 px-3">Account Title & Number</th>
                    <th className="py-2.5 px-3 text-right">Amount</th>
                    <th className="py-2.5 px-3">Status</th>
                    <th className="py-2.5 px-3">Admin Notes</th>
                    <th className="py-2.5 px-3">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {withdrawals.map((w) => (
                    <tr key={w.id} className="hover:bg-slate-50/50">
                      <td className="py-2.5 px-3 font-mono text-slate-800 font-medium">
                        {w.reference_no}
                      </td>
                      <td className="py-2.5 px-3 capitalize text-slate-700">
                        {w.payment_method.replace('_', ' ')}
                      </td>
                      <td className="py-2.5 px-3 font-mono text-slate-600">
                        {w.account_title} ({w.account_number})
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono font-bold text-slate-800">
                        PKR {w.amount.toLocaleString()}
                      </td>
                      <td className="py-2.5 px-3">
                        <span
                          className={`inline-block px-2 py-0.5 rounded text-[10px] font-semibold uppercase ${
                            w.status === 'approved'
                              ? 'bg-emerald-100 text-emerald-800'
                              : w.status === 'pending'
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-red-100 text-red-800'
                          }`}
                        >
                          {w.status}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-slate-500 text-[11px]">
                        {w.admin_notes || '—'}
                      </td>
                      <td className="py-2.5 px-3 text-slate-500 font-mono text-[11px]">
                        {new Date(w.created_at).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
