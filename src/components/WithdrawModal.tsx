import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext.tsx';
import { api } from '../services/api.ts';
import { X, ArrowUpRight, Building2, Smartphone, CheckCircle, AlertCircle } from 'lucide-react';

export const WithdrawModal: React.FC<{ isOpen: boolean; onClose: () => void; onSuccess: () => void }> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const { user } = useAuth();
  const [amount, setAmount] = useState<number>(1000);
  const [paymentMethod, setPaymentMethod] = useState<'bank_transfer' | 'easypaisa' | 'jazzcash'>('easypaisa');
  const [accountTitle, setAccountTitle] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  if (!isOpen) return null;

  const currentBalance = user?.balance || 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || amount < 500) {
      setFeedback({ type: 'error', message: 'Minimum withdrawal amount is PKR 500.' });
      return;
    }
    if (amount > currentBalance) {
      setFeedback({
        type: 'error',
        message: `Insufficient balance. You have PKR ${currentBalance.toLocaleString()}, but requested PKR ${amount.toLocaleString()}.`,
      });
      return;
    }
    if (!accountTitle.trim() || !accountNumber.trim()) {
      setFeedback({ type: 'error', message: 'Please provide both account title and account number.' });
      return;
    }

    setLoading(true);
    setFeedback(null);

    try {
      const res = await api.withdraw({
        amount,
        paymentMethod,
        accountTitle,
        accountNumber,
      });

      setFeedback({ type: 'success', message: res.message });
      setTimeout(() => {
        onSuccess();
        onClose();
      }, 1800);
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message || 'Withdrawal submission failed.' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs">
      <div className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden">
        {/* Header */}
        <div className="bg-[#064E3B] px-6 py-4 text-white flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ArrowUpRight className="w-5 h-5 text-amber-300" />
            <div>
              <h3 className="text-base font-bold">Withdraw Funds</h3>
              <p className="text-[11px] text-emerald-200">Noorani Poultry Farm</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-emerald-200 hover:text-white hover:bg-emerald-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {feedback && (
            <div
              className={`p-3 rounded-lg text-xs flex items-start gap-2 ${
                feedback.type === 'success'
                  ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                  : 'bg-red-50 text-red-800 border border-red-200'
              }`}
            >
              {feedback.type === 'success' ? (
                <CheckCircle className="w-4 h-4 text-emerald-600 mt-0.5 shrink-0" />
              ) : (
                <AlertCircle className="w-4 h-4 text-red-600 mt-0.5 shrink-0" />
              )}
              <span>{feedback.message}</span>
            </div>
          )}

          {/* Current balance */}
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between">
            <span className="text-xs text-slate-500">Available Balance:</span>
            <span className="text-sm font-bold font-mono text-emerald-800">
              PKR {currentBalance.toLocaleString()}
            </span>
          </div>

          {/* Amount input */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-semibold text-slate-700">Withdrawal Amount (PKR) *</label>
              {currentBalance >= 500 && (
                <button
                  type="button"
                  onClick={() => setAmount(currentBalance)}
                  className="text-[11px] text-emerald-700 hover:underline"
                >
                  Withdraw All
                </button>
              )}
            </div>
            <input
              type="number"
              min={500}
              max={currentBalance}
              step={100}
              required
              value={amount}
              onChange={(e) => setAmount(parseInt(e.target.value, 10) || 0)}
              className="w-full px-3 py-2 text-sm font-mono font-bold border border-slate-300 rounded-lg focus:outline-none focus:border-emerald-600"
            />
            <span className="text-[11px] text-slate-400 mt-1 block">Minimum withdrawal: PKR 500</span>
          </div>

          {/* Payment Method */}
          <div>
            <label className="text-xs font-semibold text-slate-700 block mb-1">Payout Channel</label>
            <div className="grid grid-cols-3 gap-2">
              <label
                className={`p-2 rounded-xl border text-center cursor-pointer text-xs ${
                  paymentMethod === 'easypaisa'
                    ? 'border-emerald-700 bg-emerald-50 text-emerald-950 font-bold'
                    : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                <input
                  type="radio"
                  name="wMethod"
                  value="easypaisa"
                  checked={paymentMethod === 'easypaisa'}
                  onChange={() => setPaymentMethod('easypaisa')}
                  className="sr-only"
                />
                <Smartphone className="w-4 h-4 mx-auto mb-1 text-emerald-700" />
                <span>EasyPaisa</span>
              </label>

              <label
                className={`p-2 rounded-xl border text-center cursor-pointer text-xs ${
                  paymentMethod === 'jazzcash'
                    ? 'border-emerald-700 bg-emerald-50 text-emerald-950 font-bold'
                    : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                <input
                  type="radio"
                  name="wMethod"
                  value="jazzcash"
                  checked={paymentMethod === 'jazzcash'}
                  onChange={() => setPaymentMethod('jazzcash')}
                  className="sr-only"
                />
                <Smartphone className="w-4 h-4 mx-auto mb-1 text-amber-600" />
                <span>JazzCash</span>
              </label>

              <label
                className={`p-2 rounded-xl border text-center cursor-pointer text-xs ${
                  paymentMethod === 'bank_transfer'
                    ? 'border-emerald-700 bg-emerald-50 text-emerald-950 font-bold'
                    : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                <input
                  type="radio"
                  name="wMethod"
                  value="bank_transfer"
                  checked={paymentMethod === 'bank_transfer'}
                  onChange={() => setPaymentMethod('bank_transfer')}
                  className="sr-only"
                />
                <Building2 className="w-4 h-4 mx-auto mb-1 text-emerald-700" />
                <span>Bank IBAN</span>
              </label>
            </div>
          </div>

          {/* Account Title */}
          <div>
            <label className="text-xs font-semibold text-slate-700 block mb-1">
              Account Title (Must match registered name) *
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Muhammad Farooq"
              value={accountTitle}
              onChange={(e) => setAccountTitle(e.target.value)}
              className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:border-emerald-600"
            />
          </div>

          {/* Account Number */}
          <div>
            <label className="text-xs font-semibold text-slate-700 block mb-1">
              Account Number / Mobile Number / IBAN *
            </label>
            <input
              type="text"
              required
              placeholder="e.g. 03001234567 or PK45MEZN..."
              value={accountNumber}
              onChange={(e) => setAccountNumber(e.target.value)}
              className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg font-mono focus:outline-none focus:border-emerald-600 font-bold"
            />
          </div>

          <button
            type="submit"
            disabled={loading || currentBalance < 500}
            className="w-full py-2.5 bg-amber-400 hover:bg-amber-300 text-emerald-950 font-bold rounded-xl text-xs transition-colors disabled:opacity-50 cursor-pointer flex items-center justify-center gap-1.5"
          >
            {loading ? 'Submitting Request...' : `Submit Withdrawal (PKR ${amount.toLocaleString()})`}
          </button>
        </form>
      </div>
    </div>
  );
};
