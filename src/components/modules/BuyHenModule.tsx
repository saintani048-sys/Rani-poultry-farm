import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext.tsx';
import { api } from '../../services/api.ts';
import { HenProduct, HenPurchase } from '../../types/index.ts';
import { ShoppingBag, CheckCircle, Clock, AlertCircle, Shield, ArrowLeft, RefreshCw } from 'lucide-react';

export const BuyHenModule: React.FC<{ onBack: () => void }> = ({ onBack }) => {
  const { user, refreshUser, settings } = useAuth();
  const [products, setProducts] = useState<HenProduct[]>([]);
  const [purchases, setPurchases] = useState<HenPurchase[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<HenProduct | null>(null);
  const [quantity, setQuantity] = useState<number>(1);
  const [paymentMethod, setPaymentMethod] = useState<'balance' | 'bank_transfer' | 'easypaisa' | 'jazzcash'>('balance');
  const [paymentRef, setPaymentRef] = useState('');
  const [paymentProof, setPaymentProof] = useState('');
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const loadData = async () => {
    try {
      const [prods, purs] = await Promise.all([
        api.getHenProducts(),
        api.getHenPurchases(),
      ]);
      setProducts(prods);
      setPurchases(purs);
      if (prods.length > 0 && !selectedProduct) {
        setSelectedProduct(prods[0]);
      }
    } catch (err) {
      console.error('Failed to load buy hen data:', err);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const totalAmount = selectedProduct ? selectedProduct.price * quantity : 0;
  const hasEnoughBalance = user ? user.balance >= totalAmount : false;

  const handlePurchase = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProduct) return;
    setLoading(true);
    setFeedback(null);

    try {
      const res = await api.buyHen({
        productId: selectedProduct.id,
        quantity,
        paymentMethod,
        paymentRef: paymentMethod === 'balance' ? undefined : paymentRef,
        paymentProof: paymentMethod === 'balance' ? undefined : paymentProof,
      });

      setFeedback({ type: 'success', message: res.message });
      setPaymentRef('');
      setPaymentProof('');
      await Promise.all([loadData(), refreshUser()]);
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message || 'Failed to complete hen purchase.' });
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

      {/* Main Grid: Products Catalog on Left, Checkout Form on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Products List */}
        <div className="lg:col-span-7 space-y-4">
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
            <h3 className="text-base font-bold text-slate-900 mb-1">Select Hen Breed</h3>
            <p className="text-xs text-slate-500 mb-4">
              All birds are verified healthy, inoculated, and active daily egg producers.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {products.map((p) => {
                const isSelected = selectedProduct?.id === p.id;
                return (
                  <div
                    key={p.id}
                    onClick={() => setSelectedProduct(p)}
                    className={`cursor-pointer rounded-xl border-2 p-3 transition-all flex flex-col justify-between ${
                      isSelected
                        ? 'border-emerald-700 bg-emerald-50/40 shadow-xs'
                        : 'border-slate-200 hover:border-slate-300 bg-white'
                    }`}
                  >
                    <div className="h-32 rounded-lg overflow-hidden bg-slate-100 mb-2 relative">
                      <img
                        src={p.image_url}
                        alt={p.name}
                        referrerPolicy="no-referrer"
                        className="w-full h-full object-cover"
                      />
                      <span className="absolute bottom-1 right-1 text-[10px] bg-slate-900/80 text-white px-1.5 py-0.5 rounded font-mono">
                        Stock: {p.stock}
                      </span>
                    </div>

                    <div>
                      <h4 className="text-sm font-bold text-slate-900">{p.name}</h4>
                      <p className="text-[11px] text-emerald-700 font-medium">{p.breed}</p>
                      <p className="text-[11px] text-slate-500 line-clamp-2 mt-1">{p.description}</p>
                    </div>

                    <div className="mt-3 pt-2 border-t border-slate-100 flex items-center justify-between">
                      <span className="text-xs font-bold text-[#064E3B] font-mono tabular-nums">
                        PKR {p.price.toLocaleString()}
                      </span>
                      <span className={`text-[11px] font-semibold ${isSelected ? 'text-emerald-700' : 'text-slate-400'}`}>
                        {isSelected ? '✓ Selected' : 'Choose'}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Checkout Card */}
        <div className="lg:col-span-5">
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs sticky top-20">
            <h3 className="text-base font-bold text-slate-900 mb-4 pb-3 border-b border-slate-100">
              Purchase Summary & Checkout
            </h3>

            {selectedProduct ? (
              <form onSubmit={handlePurchase} className="space-y-4">
                <div>
                  <span className="text-xs text-slate-500 block">Selected Hen</span>
                  <div className="text-sm font-bold text-slate-900">{selectedProduct.name}</div>
                  <div className="text-xs text-emerald-700 font-mono">
                    PKR {selectedProduct.price.toLocaleString()} each · Lay Rate: 1 egg/cycle
                  </div>
                </div>

                {/* Quantity */}
                <div>
                  <label className="text-xs font-medium text-slate-700 block mb-1">
                    Select Quantity (Hens)
                  </label>
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => setQuantity(Math.max(1, quantity - 1))}
                      className="w-9 h-9 rounded-lg border border-slate-300 flex items-center justify-center font-bold text-slate-700 hover:bg-slate-100 cursor-pointer"
                    >
                      -
                    </button>
                    <input
                      type="number"
                      min={1}
                      max={selectedProduct.stock}
                      value={quantity}
                      onChange={(e) => setQuantity(Math.max(1, Math.min(selectedProduct.stock, parseInt(e.target.value, 10) || 1)))}
                      className="w-20 text-center py-1.5 border border-slate-300 rounded-lg font-mono font-bold text-sm"
                    />
                    <button
                      type="button"
                      onClick={() => setQuantity(Math.min(selectedProduct.stock, quantity + 1))}
                      className="w-9 h-9 rounded-lg border border-slate-300 flex items-center justify-center font-bold text-slate-700 hover:bg-slate-100 cursor-pointer"
                    >
                      +
                    </button>
                    <span className="text-xs text-slate-500">
                      (Max {selectedProduct.stock} available)
                    </span>
                  </div>
                </div>

                {/* Total Price */}
                <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200">
                  <div className="flex items-center justify-between text-xs text-slate-600 mb-1">
                    <span>Unit Price:</span>
                    <span className="font-mono">PKR {selectedProduct.price.toLocaleString()}</span>
                  </div>
                  <div className="flex items-center justify-between text-xs text-slate-600 mb-1">
                    <span>Quantity:</span>
                    <span className="font-mono">{quantity}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm font-bold text-slate-900 pt-2 border-t border-slate-200">
                    <span>Total Amount:</span>
                    <span className="text-emerald-800 font-mono text-base tabular-nums">
                      PKR {totalAmount.toLocaleString()}
                    </span>
                  </div>
                </div>

                {/* Payment Method Selector */}
                <div>
                  <label className="text-xs font-medium text-slate-700 block mb-1">
                    Payment Method
                  </label>
                  <div className="space-y-2">
                    <label className="flex items-start gap-2.5 p-2.5 rounded-lg border border-slate-200 hover:bg-slate-50 cursor-pointer">
                      <input
                        type="radio"
                        name="payMethod"
                        value="balance"
                        checked={paymentMethod === 'balance'}
                        onChange={() => setPaymentMethod('balance')}
                        className="mt-0.5 text-emerald-600"
                      />
                      <div className="text-xs">
                        <span className="font-bold text-slate-900 block">
                          Wallet Balance (PKR {user?.balance.toLocaleString()})
                        </span>
                        <span className={hasEnoughBalance ? 'text-emerald-700' : 'text-red-600 font-medium'}>
                          {hasEnoughBalance ? 'Instant activation' : 'Insufficient balance (Deposit required)'}
                        </span>
                      </div>
                    </label>

                    <label className="flex items-start gap-2.5 p-2.5 rounded-lg border border-slate-200 hover:bg-slate-50 cursor-pointer">
                      <input
                        type="radio"
                        name="payMethod"
                        value="bank_transfer"
                        checked={paymentMethod === 'bank_transfer'}
                        onChange={() => setPaymentMethod('bank_transfer')}
                        className="mt-0.5 text-emerald-600"
                      />
                      <div className="text-xs">
                        <span className="font-bold text-slate-900 block">Bank Direct Transfer</span>
                        <span className="text-slate-500">Meezan Bank · Manual admin verification</span>
                      </div>
                    </label>

                    <label className="flex items-start gap-2.5 p-2.5 rounded-lg border border-slate-200 hover:bg-slate-50 cursor-pointer">
                      <input
                        type="radio"
                        name="payMethod"
                        value="easypaisa"
                        checked={paymentMethod === 'easypaisa'}
                        onChange={() => setPaymentMethod('easypaisa')}
                        className="mt-0.5 text-emerald-600"
                      />
                      <div className="text-xs">
                        <span className="font-bold text-slate-900 block">EasyPaisa / JazzCash</span>
                        <span className="text-slate-500">Mobile wallet transfer · Manual verification</span>
                      </div>
                    </label>
                  </div>
                </div>

                {/* If manual payment: show transfer instructions & TID input */}
                {paymentMethod !== 'balance' && (
                  <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 space-y-2 text-xs">
                    <p className="font-semibold text-amber-900">Official Payment Account Details:</p>
                    <div className="font-mono text-[11px] text-amber-950 space-y-0.5">
                      {paymentMethod === 'bank_transfer' ? (
                        <>
                          <div>Bank: {settings.bank_name || 'Meezan Bank Limited'}</div>
                          <div>Title: {settings.bank_title || 'Noorani Poultry Farm Ltd'}</div>
                          <div>Account: {settings.bank_account || '02010108923451'}</div>
                          <div>IBAN: {settings.bank_iban || 'PK45MEZN0002010108923451'}</div>
                        </>
                      ) : (
                        <>
                          <div>EasyPaisa: {settings.easypaisa_no || '03001234567'}</div>
                          <div>JazzCash: {settings.jazzcash_no || '03017654321'}</div>
                        </>
                      )}
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-800 mt-2 mb-1">
                        Transaction ID (TID) *
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. 7849102847"
                        value={paymentRef}
                        onChange={(e) => setPaymentRef(e.target.value)}
                        className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded font-mono text-xs focus:outline-none focus:border-emerald-600"
                      />
                    </div>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading || (paymentMethod === 'balance' && !hasEnoughBalance)}
                  className="w-full py-2.5 bg-[#064E3B] hover:bg-[#053F30] text-white font-bold rounded-xl shadow-sm transition-all disabled:opacity-50 text-sm cursor-pointer flex items-center justify-center gap-2"
                >
                  <ShoppingBag className="w-4 h-4" />
                  <span>
                    {paymentMethod === 'balance' ? 'Confirm Wallet Purchase' : 'Submit Purchase Request'}
                  </span>
                </button>
              </form>
            ) : (
              <p className="text-xs text-slate-500">Please select a hen breed from the left.</p>
            )}
          </div>
        </div>
      </div>

      {/* Purchase Request History */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
        <h3 className="text-base font-bold text-slate-900 mb-3">Your Hen Purchase History</h3>
        {purchases.length === 0 ? (
          <p className="text-xs text-slate-500 py-4 text-center">No purchases recorded yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 uppercase font-semibold text-[11px]">
                <tr>
                  <th className="py-2.5 px-3">Reference</th>
                  <th className="py-2.5 px-3">Hen Breed</th>
                  <th className="py-2.5 px-3 text-center">Quantity</th>
                  <th className="py-2.5 px-3 text-right">Total Amount</th>
                  <th className="py-2.5 px-3">Method</th>
                  <th className="py-2.5 px-3">Status</th>
                  <th className="py-2.5 px-3">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {purchases.map((pur) => (
                  <tr key={pur.id} className="hover:bg-slate-50/50">
                    <td className="py-2.5 px-3 font-mono font-medium text-slate-800">
                      {pur.reference_no}
                    </td>
                    <td className="py-2.5 px-3 font-medium text-slate-900">
                      {pur.product_name}
                    </td>
                    <td className="py-2.5 px-3 text-center font-mono font-bold">
                      {pur.quantity}
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono font-bold text-emerald-800">
                      PKR {pur.total_amount.toLocaleString()}
                    </td>
                    <td className="py-2.5 px-3 capitalize text-slate-600">
                      {pur.payment_method.replace('_', ' ')}
                    </td>
                    <td className="py-2.5 px-3">
                      <span
                        className={`inline-block px-2 py-0.5 rounded text-[10px] font-semibold uppercase ${
                          pur.status === 'approved'
                            ? 'bg-emerald-100 text-emerald-800'
                            : pur.status === 'pending'
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-red-100 text-red-800'
                        }`}
                      >
                        {pur.status}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-slate-500 font-mono text-[11px]">
                      {new Date(pur.created_at).toLocaleDateString()}
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
