import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext.tsx';
import { api } from '../services/api.ts';
import { X, ArrowDownLeft, Building2, Smartphone, CheckCircle, AlertCircle, Copy, Check } from 'lucide-react';

export const DepositModal: React.FC<{ isOpen: boolean; onClose: () => void; onSuccess: () => void }> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const { settings } = useAuth();
  const [amount, setAmount] = useState<number>(1000);
  const [paymentMethod, setPaymentMethod] = useState<'bank_transfer' | 'easypaisa' | 'jazzcash'>('bank_transfer');
  const [senderAccount, setSenderAccount] = useState('');
  const [senderName, setSenderName] = useState('');
  const [transactionRef, setTransactionRef] = useState('');
  const [proofImage, setProofImage] = useState('');
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  if (!isOpen) return null;

  const copyToClipboard = (text: string, field: string) => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(text);
      setCopiedField(field);
      setTimeout(() => setCopiedField(null), 2000);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || amount < 100) {
      setFeedback({ type: 'error', message: 'Minimum deposit is PKR 100.' });
      return;
    }
    if (!transactionRef.trim()) {
      setFeedback({ type: 'error', message: 'Transaction ID (TID) is required.' });
      return;
    }

    setLoading(true);
    setFeedback(null);

    try {
      const res = await api.deposit({
        amount,
        paymentMethod,
        senderAccount,
        senderName,
        transactionRef,
        proofImage,
      });

      setFeedback({ type: 'success', message: res.message });
      setTimeout(() => {
        onSuccess();
        onClose();
      }, 1800);
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message || 'Deposit submission failed.' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs">
      <div className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="bg-[#064E3B] px-6 py-4 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <ArrowDownLeft className="w-5 h-5 text-amber-300" />
            <div>
              <h3 className="text-base font-bold">Deposit Funds to Wallet</h3>
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

        {/* Content */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto">
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

          {/* Amount input */}
          <div>
            <label className="text-xs font-semibold text-slate-700 block mb-1">
              Deposit Amount (PKR) *
            </label>
            <div className="relative">
              <span className="absolute left-3 top-2.5 text-xs font-mono font-bold text-slate-400">Rs</span>
              <input
                type="number"
                min={100}
                step={50}
                required
                value={amount}
                onChange={(e) => setAmount(parseInt(e.target.value, 10) || 0)}
                className="w-full pl-9 pr-3 py-2 text-sm font-mono font-bold border border-slate-300 rounded-lg focus:outline-none focus:border-emerald-600"
              />
            </div>
            <div className="flex gap-2 mt-2">
              {[500, 1000, 2500, 5000, 10000].map((preset) => (
                <button
                  key={preset}
                  type="button"
                  onClick={() => setAmount(preset)}
                  className="px-2 py-1 text-[11px] font-mono bg-slate-100 hover:bg-slate-200 text-slate-700 rounded cursor-pointer"
                >
                  +{preset}
                </button>
              ))}
            </div>
          </div>

          {/* Method radio */}
          <div>
            <label className="text-xs font-semibold text-slate-700 block mb-1.5">
              Select Transfer Method
            </label>
            <div className="grid grid-cols-3 gap-2">
              <label
                className={`p-2 rounded-xl border text-center cursor-pointer text-xs ${
                  paymentMethod === 'bank_transfer'
                    ? 'border-emerald-700 bg-emerald-50 text-emerald-950 font-bold'
                    : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                <input
                  type="radio"
                  name="method"
                  value="bank_transfer"
                  checked={paymentMethod === 'bank_transfer'}
                  onChange={() => setPaymentMethod('bank_transfer')}
                  className="sr-only"
                />
                <Building2 className="w-4 h-4 mx-auto mb-1 text-emerald-700" />
                <span>Bank IBAN</span>
              </label>

              <label
                className={`p-2 rounded-xl border text-center cursor-pointer text-xs ${
                  paymentMethod === 'easypaisa'
                    ? 'border-emerald-700 bg-emerald-50 text-emerald-950 font-bold'
                    : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                <input
                  type="radio"
                  name="method"
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
                  name="method"
                  value="jazzcash"
                  checked={paymentMethod === 'jazzcash'}
                  onChange={() => setPaymentMethod('jazzcash')}
                  className="sr-only"
                />
                <Smartphone className="w-4 h-4 mx-auto mb-1 text-amber-600" />
                <span>JazzCash</span>
              </label>
            </div>
          </div>

          {/* Instructions Box */}
          <div className="p-3.5 bg-amber-50/80 rounded-xl border border-amber-200 text-xs space-y-2">
            <span className="font-bold text-amber-950 block">Official Recipient Account:</span>
            {paymentMethod === 'bank_transfer' ? (
              <div className="space-y-1 font-mono text-[11px] text-amber-900">
                <div className="flex justify-between items-center">
                  <span>Bank: {settings.bank_name || 'Meezan Bank Ltd'}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span>Title: {settings.bank_title || 'Noorani Poultry Farm Ltd'}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span>Account: {settings.bank_account || '02010108923451'}</span>
                  <button
                    type="button"
                    onClick={() => copyToClipboard(settings.bank_account || '02010108923451', 'acct')}
                    className="text-[10px] text-emerald-800 underline"
                  >
                    {copiedField === 'acct' ? 'Copied' : 'Copy'}
                  </button>
                </div>
                <div className="flex justify-between items-center">
                  <span className="truncate max-w-[280px]">IBAN: {settings.bank_iban || 'PK45MEZN0002010108923451'}</span>
                  <button
                    type="button"
                    onClick={() => copyToClipboard(settings.bank_iban || 'PK45MEZN0002010108923451', 'iban')}
                    className="text-[10px] text-emerald-800 underline"
                  >
                    {copiedField === 'iban' ? 'Copied' : 'Copy'}
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-1 font-mono text-[11px] text-amber-900">
                <div className="flex justify-between items-center">
                  <span>
                    Number: {paymentMethod === 'easypaisa' ? settings.easypaisa_no || '03001234567' : settings.jazzcash_no || '03017654321'}
                  </span>
                  <button
                    type="button"
                    onClick={() => copyToClipboard(paymentMethod === 'easypaisa' ? '03001234567' : '03017654321', 'wallet')}
                    className="text-[10px] text-emerald-800 underline"
                  >
                    {copiedField === 'wallet' ? 'Copied' : 'Copy'}
                  </button>
                </div>
                <div>Account Title: Noorani Farm Management</div>
              </div>
            )}
          </div>

          {/* Form fields */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-slate-700 block mb-1">
                Your Sending Account #
              </label>
              <input
                type="text"
                placeholder="e.g. 0300..."
                value={senderAccount}
                onChange={(e) => setSenderAccount(e.target.value)}
                className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-lg focus:outline-none focus:border-emerald-600 font-mono"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-slate-700 block mb-1">
                Sender Full Name
              </label>
              <input
                type="text"
                placeholder="e.g. Muhammad Farooq"
                value={senderName}
                onChange={(e) => setSenderName(e.target.value)}
                className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-lg focus:outline-none focus:border-emerald-600"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-700 block mb-1">
              Transaction ID / TID (From SMS or App Receipt) *
            </label>
            <input
              type="text"
              required
              placeholder="e.g. 784910283921"
              value={transactionRef}
              onChange={(e) => setTransactionRef(e.target.value)}
              className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg font-mono focus:outline-none focus:border-emerald-600 font-bold"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 bg-[#064E3B] hover:bg-[#053F30] text-white font-bold rounded-xl text-xs transition-colors disabled:opacity-50 cursor-pointer flex items-center justify-center gap-1.5 mt-2"
          >
            {loading ? 'Submitting...' : 'Submit Deposit for Verification'}
          </button>
        </form>
      </div>
    </div>
  );
};
