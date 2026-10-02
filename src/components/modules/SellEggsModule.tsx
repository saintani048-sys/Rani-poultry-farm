import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext.tsx';
import { api } from '../../services/api.ts';
import { EggSale } from '../../types/index.ts';
import { TrendingUp, Egg, CheckCircle, AlertCircle, ArrowLeft, RefreshCw, Wallet, Building2, Smartphone } from 'lucide-react';

export const SellEggsModule: React.FC<{ onBack: () => void }> = ({ onBack }) => {
  const { user, refreshUser } = useAuth();
  const [availableEggs, setAvailableEggs] = useState(0);
  const [totalSold, setTotalSold] = useState(0);
  const [unitPrice, setUnitPrice] = useState(35);
  const [salesHistory, setSalesHistory] = useState<EggSale[]>([]);
  const [quantity, setQuantity] = useState<number>(10);
  const [paymentDestination, setPaymentDestination] = useState<'wallet_balance' | 'bank_account' | 'mobile_wallet'>('wallet_balance');
  const [accountDetails, setAccountDetails] = useState('');
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const loadData = async () => {
    try {
      const data = await api.getSellEggsStatus();
      setAvailableEggs(data.available_eggs);
      setTotalSold(data.total_sold);
      setUnitPrice(data.unit_price);
      setSalesHistory(data.sales_history || []);
      if (data.available_eggs > 0 && quantity > data.available_eggs) {
        setQuantity(data.available_eggs);
      }
    } catch (err) {
      console.error('Failed to load sell eggs status:', err);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const totalPayout = quantity * unitPrice;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (quantity <= 0 || quantity > availableEggs) {
      setFeedback({ type: 'error', message: `Please enter a valid egg quantity between 1 and ${availableEggs}.` });
      return;
    }

    setLoading(true);
    setFeedback(null);

    try {
      const res = await api.sellEggs({
        quantity,
        paymentDestination,
        accountDetails: paymentDestination === 'wallet_balance' ? undefined : accountDetails,
      });

      setFeedback({ type: 'success', message: res.message });
      setAccountDetails('');
      await Promise.all([loadData(), refreshUser()]);
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message || 'Failed to submit egg sale request.' });
    } finally {
      setLoading(false);
    }
  };

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
        <button
          onClick={loadData}
          className="p-1.5 rounded-lg text-slate-500 hover:text-emerald-800 hover:bg-slate-100 transition-colors"
          title="Refresh"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {feedback && (
        <div
          className={`p-4 rounded-xl text-xs sm:text-sm flex items-start gap-2.5 ${
            feedback.type === 'success'
              ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
              : 'bg-red-50 text-red-800 border border-red-200'
          }`}
        >
          {feedback.type === 'success' ? (
            <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
          ) : (
            <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
          )}
          <span>{feedback.message}</span>
        </div>
      )}

      {/* Grid: Sale Form & Market Rules */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Sale Form */}
        <div className="lg:col-span-7">
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-5">
              <div>
                <h3 className="text-base font-bold text-slate-900">Sell Farm Eggs to Market</h3>
                <p className="text-xs text-slate-500">
                  Instant guaranteed sale to farm distribution network.
                </p>
              </div>
              <div className="text-right">
                <span className="text-[10px] text-slate-400 uppercase font-semibold block">Official Rate</span>
                <span className="text-base font-extrabold text-[#064E3B] font-mono">
                  PKR {unitPrice} / egg
                </span>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Inventory notice */}
              <div className="p-3.5 bg-emerald-50 rounded-xl border border-emerald-200 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <Egg className="w-5 h-5 text-emerald-700" />
                  <div>
                    <span className="text-xs text-emerald-900 font-bold block">Available in Inventory</span>
                    <span className="text-[11px] text-emerald-700">Eligible for instant liquidation</span>
                  </div>
                </div>
                <span className="text-xl font-extrabold text-emerald-950 font-mono tabular-nums">
                  {availableEggs}{' '}
                  <span className="text-xs font-normal text-emerald-800 font-sans">Eggs</span>
                </span>
              </div>

              {/* Quantity selector */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-semibold text-slate-700">
                    Quantity to Sell
                  </label>
                  {availableEggs > 0 && (
                    <button
                      type="button"
                      onClick={() => setQuantity(availableEggs)}
                      className="text-xs text-emerald-700 hover:underline font-medium cursor-pointer"
                    >
                      Sell All ({availableEggs})
                    </button>
                  )}
                </div>

                <div className="flex items-center gap-3">
                  <input
                    type="range"
                    min={1}
                    max={Math.max(1, availableEggs)}
                    value={Math.min(quantity, Math.max(1, availableEggs))}
                    onChange={(e) => setQuantity(parseInt(e.target.value, 10))}
                    disabled={availableEggs <= 0}
                    className="flex-1 accent-emerald-700"
                  />
                  <input
                    type="number"
                    min={1}
                    max={availableEggs}
                    value={quantity}
                    onChange={(e) => setQuantity(Math.max(1, Math.min(availableEggs, parseInt(e.target.value, 10) || 1)))}
                    disabled={availableEggs <= 0}
                    className="w-24 px-3 py-1.5 border border-slate-300 rounded-lg text-center font-mono font-bold text-sm"
                  />
                </div>
              </div>

              {/* Payout calculation */}
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-1.5 text-xs">
                <div className="flex justify-between text-slate-600">
                  <span>Number of Eggs:</span>
                  <span className="font-mono font-semibold">{quantity} Eggs</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>Rate per Egg:</span>
                  <span className="font-mono font-semibold">PKR {unitPrice}</span>
                </div>
                <div className="flex justify-between text-sm font-bold text-slate-900 pt-2 border-t border-slate-200">
                  <span>Total Payout:</span>
                  <span className="text-emerald-800 font-mono text-lg tabular-nums">
                    PKR {totalPayout.toLocaleString()}
                  </span>
                </div>
              </div>

              {/* Payment Destination */}
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1.5">
                  Deposit Proceeds To:
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
                  <label
                    className={`p-2.5 rounded-xl border cursor-pointer flex flex-col items-center text-center gap-1.5 ${
                      paymentDestination === 'wallet_balance'
                        ? 'border-emerald-700 bg-emerald-50/50 text-emerald-900 font-semibold'
                        : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <input
                      type="radio"
                      name="destination"
                      value="wallet_balance"
                      checked={paymentDestination === 'wallet_balance'}
                      onChange={() => setPaymentDestination('wallet_balance')}
                      className="sr-only"
                    />
                    <Wallet className="w-5 h-5 text-emerald-700" />
                    <span>Farm Wallet</span>
                    <span className="text-[10px] text-slate-400 font-normal">Instant credit</span>
                  </label>

                  <label
                    className={`p-2.5 rounded-xl border cursor-pointer flex flex-col items-center text-center gap-1.5 ${
                      paymentDestination === 'bank_account'
                        ? 'border-emerald-700 bg-emerald-50/50 text-emerald-900 font-semibold'
                        : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <input
                      type="radio"
                      name="destination"
                      value="bank_account"
                      checked={paymentDestination === 'bank_account'}
                      onChange={() => setPaymentDestination('bank_account')}
                      className="sr-only"
                    />
                    <Building2 className="w-5 h-5 text-emerald-700" />
                    <span>Bank Transfer</span>
                    <span className="text-[10px] text-slate-400 font-normal">Direct IBAN</span>
                  </label>

                  <label
                    className={`p-2.5 rounded-xl border cursor-pointer flex flex-col items-center text-center gap-1.5 ${
                      paymentDestination === 'mobile_wallet'
                        ? 'border-emerald-700 bg-emerald-50/50 text-emerald-900 font-semibold'
                        : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <input
                      type="radio"
                      name="destination"
                      value="mobile_wallet"
                      checked={paymentDestination === 'mobile_wallet'}
                      onChange={() => setPaymentDestination('mobile_wallet')}
                      className="sr-only"
                    />
                    <Smartphone className="w-5 h-5 text-emerald-700" />
                    <span>EasyPaisa/Jazz</span>
                    <span className="text-[10px] text-slate-400 font-normal">Mobile SIM</span>
                  </label>
                </div>
              </div>

              {paymentDestination !== 'wallet_balance' && (
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">
                    Provide Account Title & Number / IBAN *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Muhammad Farooq · Meezan Bank 020101089... or EasyPaisa 0300..."
                    value={accountDetails}
                    onChange={(e) => setAccountDetails(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:border-emerald-600 font-mono"
                  />
                </div>
              )}

              <button
                type="submit"
                disabled={loading || availableEggs <= 0 || quantity <= 0}
                className="w-full py-3 bg-[#064E3B] hover:bg-[#053F30] text-white font-bold rounded-xl shadow-sm transition-all disabled:opacity-50 text-sm cursor-pointer flex items-center justify-center gap-2"
              >
                <TrendingUp className="w-4 h-4" />
                <span>
                  {availableEggs <= 0
                    ? 'No Eggs in Inventory'
                    : `Submit Sale Request (PKR ${totalPayout.toLocaleString()})`}
                </span>
              </button>
            </form>
          </div>
        </div>

        {/* Quality Guidelines & Market Assurance */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
            <h4 className="text-sm font-bold text-slate-900 mb-3">Farm Commercial Guidelines</h4>
            <ul className="space-y-2.5 text-xs text-slate-600">
              <li className="flex items-start gap-2">
                <span className="text-emerald-600 font-bold">✓</span>
                <span>
                  <strong>Guaranteed Buyback:</strong> All eggs produced by Noorani flock hens are purchased back at approved farm gate rates.
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-emerald-600 font-bold">✓</span>
                <span>
                  <strong>Immediate Inventory Reservation:</strong> Submitted eggs are held safely in escrow during review and verified atomically.
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-emerald-600 font-bold">✓</span>
                <span>
                  <strong>Clean Ledger Record:</strong> Every completed sale is entered permanently with unique reference and timestamps.
                </span>
              </li>
            </ul>
          </div>

          <div className="p-4 bg-amber-50/80 rounded-2xl border border-amber-200 text-xs text-amber-900">
            <p className="font-semibold mb-1">Total Sales Summary to Date:</p>
            <p className="font-mono text-base font-bold text-amber-950 tabular-nums">
              {totalSold.toLocaleString()} Eggs Sold
            </p>
            <p className="text-[11px] text-amber-800 mt-1">
              Revenue: PKR {(totalSold * unitPrice).toLocaleString()}
            </p>
          </div>
        </div>
      </div>

      {/* Egg Sales History */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
        <h3 className="text-base font-bold text-slate-900 mb-3">Previous Egg Sales History</h3>
        {salesHistory.length === 0 ? (
          <p className="text-xs text-slate-500 py-4 text-center">No egg sales submitted yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 uppercase font-semibold text-[11px]">
                <tr>
                  <th className="py-2.5 px-3">Reference</th>
                  <th className="py-2.5 px-3 text-center">Quantity</th>
                  <th className="py-2.5 px-3 text-center">Rate</th>
                  <th className="py-2.5 px-3 text-right">Total Payout</th>
                  <th className="py-2.5 px-3">Destination</th>
                  <th className="py-2.5 px-3">Status</th>
                  <th className="py-2.5 px-3">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {salesHistory.map((s) => (
                  <tr key={s.id} className="hover:bg-slate-50/50">
                    <td className="py-2.5 px-3 font-mono font-medium text-slate-800">
                      {s.reference_no}
                    </td>
                    <td className="py-2.5 px-3 text-center font-mono font-bold text-slate-900">
                      {s.quantity} Eggs
                    </td>
                    <td className="py-2.5 px-3 text-center font-mono text-slate-600">
                      Rs {s.unit_price}
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono font-bold text-emerald-800">
                      PKR {s.total_amount.toLocaleString()}
                    </td>
                    <td className="py-2.5 px-3 capitalize text-slate-600">
                      {s.payment_destination.replace('_', ' ')}
                    </td>
                    <td className="py-2.5 px-3">
                      <span
                        className={`inline-block px-2 py-0.5 rounded text-[10px] font-semibold uppercase ${
                          s.status === 'approved'
                            ? 'bg-emerald-100 text-emerald-800'
                            : s.status === 'pending'
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-red-100 text-red-800'
                        }`}
                      >
                        {s.status}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-slate-500 font-mono text-[11px]">
                      {new Date(s.created_at).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
