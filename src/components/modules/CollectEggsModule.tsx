import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext.tsx';
import { api } from '../../services/api.ts';
import { Egg, Clock, CheckCircle, AlertCircle, ArrowLeft, RefreshCw, Sparkles, Layers } from 'lucide-react';

export const CollectEggsModule: React.FC<{ onBack: () => void }> = ({ onBack }) => {
  const { user, refreshUser, settings } = useAuth();
  const [data, setData] = useState<any>({
    eligible_eggs: 0,
    current_inventory_eggs: 0,
    total_collected: 0,
    total_sold: 0,
    interval_hours: 12,
    next_collection_in_minutes: 0,
    history: [],
  });
  const [myHens, setMyHens] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const loadStatus = async () => {
    try {
      const [res, hens] = await Promise.all([
        api.getEggCollectionStatus(),
        api.getMyHens(),
      ]);
      setData(res);
      setMyHens(hens);
    } catch (err) {
      console.error('Failed to load collection status:', err);
    }
  };

  useEffect(() => {
    loadStatus();
  }, []);

  const handleCollect = async () => {
    if (data.eligible_eggs <= 0) return;
    setLoading(true);
    setFeedback(null);

    try {
      const res = await api.collectEggs();
      setFeedback({ type: 'success', message: res.message });
      await Promise.all([loadStatus(), refreshUser()]);
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message || 'Egg collection failed.' });
    } finally {
      setLoading(false);
    }
  };

  const totalActiveHens = myHens.reduce((acc, h) => acc + (h.quantity || 0), 0);

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
          onClick={loadStatus}
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

      {/* Main Harvest Hero Card */}
      <div className="bg-gradient-to-br from-[#064E3B] to-[#043d2f] text-white p-6 sm:p-8 rounded-3xl shadow-md relative overflow-hidden">
        <div className="absolute right-0 bottom-0 opacity-10 pointer-events-none translate-x-8 translate-y-8">
          <Egg className="w-64 h-64 text-amber-300" />
        </div>

        <div className="relative z-10 max-w-xl space-y-4">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-900/80 border border-emerald-500/30 text-amber-300 text-xs font-semibold">
            <Clock className="w-3.5 h-3.5" />
            <span>Biosecure Laying Cycle: {data.interval_hours} Hours</span>
          </div>

          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            Collect Daily Fresh Eggs
          </h2>

          <p className="text-xs sm:text-sm text-emerald-100 leading-relaxed">
            Your flock of <strong className="text-white">{totalActiveHens} active hens</strong> generates nutritious organic eggs on automated server schedules. Transfer eggs into your inventory with one click.
          </p>

          {/* Interactive Collection Box */}
          <div className="pt-2 flex flex-col sm:flex-row sm:items-center gap-4">
            <div className="p-4 bg-emerald-900/90 rounded-2xl border border-emerald-700/60 inline-flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-amber-400/20 border border-amber-400/30 flex items-center justify-center text-amber-300">
                <Egg className="w-7 h-7" />
              </div>
              <div>
                <span className="text-[11px] text-emerald-200 block uppercase font-medium">
                  Eligible For Collection Now
                </span>
                <span className="text-3xl font-extrabold text-white font-mono tabular-nums">
                  {data.eligible_eggs} <span className="text-base text-amber-300">Eggs</span>
                </span>
              </div>
            </div>

            <button
              onClick={handleCollect}
              disabled={loading || data.eligible_eggs <= 0}
              className="px-6 py-4 bg-amber-400 hover:bg-amber-300 text-emerald-950 font-extrabold rounded-2xl shadow-lg transition-all duration-150 disabled:opacity-50 text-sm sm:text-base cursor-pointer flex items-center justify-center gap-2 whitespace-nowrap"
            >
              <Sparkles className="w-5 h-5 text-emerald-900" />
              <span>
                {data.eligible_eggs > 0
                  ? `Harvest ${data.eligible_eggs} Eggs Now`
                  : totalActiveHens === 0
                  ? 'No Hens Owned'
                  : 'Incubating Next Cycle...'}
              </span>
            </button>
          </div>

          {data.eligible_eggs === 0 && totalActiveHens > 0 && (
            <p className="text-xs text-amber-200/90 pt-1 flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5" />
              <span>
                Next eggs will become available in approximately{' '}
                <strong className="text-white">
                  {data.next_collection_in_minutes > 60
                    ? `${Math.floor(data.next_collection_in_minutes / 60)}h ${data.next_collection_in_minutes % 60}m`
                    : `${data.next_collection_in_minutes} minutes`}
                </strong>
                .
              </span>
            </p>
          )}

          {totalActiveHens === 0 && (
            <div className="p-3 bg-emerald-950/80 rounded-xl border border-emerald-800 text-xs text-amber-200">
              You do not own any hens yet. Please purchase hens from the Buy Hen store to start producing eggs.
            </div>
          )}
        </div>
      </div>

      {/* Egg Storage & Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <span className="text-xs text-slate-500 block">Available in Inventory</span>
          <div className="text-2xl font-extrabold text-[#064E3B] font-mono mt-1 tabular-nums">
            {data.current_inventory_eggs.toLocaleString()}{' '}
            <span className="text-xs text-slate-500 font-sans font-normal">Eggs</span>
          </div>
          <span className="text-[11px] text-slate-400 mt-1 block">Ready to sell for PKR</span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <span className="text-xs text-slate-500 block">Total Harvested to Date</span>
          <div className="text-2xl font-extrabold text-slate-800 font-mono mt-1 tabular-nums">
            {data.total_collected.toLocaleString()}{' '}
            <span className="text-xs text-slate-500 font-sans font-normal">Eggs</span>
          </div>
          <span className="text-[11px] text-slate-400 mt-1 block">Lifetime production</span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <span className="text-xs text-slate-500 block">Total Sold to Market</span>
          <div className="text-2xl font-extrabold text-slate-800 font-mono mt-1 tabular-nums">
            {data.total_sold.toLocaleString()}{' '}
            <span className="text-xs text-slate-500 font-sans font-normal">Eggs</span>
          </div>
          <span className="text-[11px] text-slate-400 mt-1 block">Monetized farm harvest</span>
        </div>
      </div>

      {/* Flock Laying Overview */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
        <h3 className="text-base font-bold text-slate-900 mb-3">Your Producing Flock</h3>
        {myHens.length === 0 ? (
          <p className="text-xs text-slate-500 py-3 text-center">No hens currently active in your coop.</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {myHens.map((h) => (
              <div key={h.id} className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/50 flex items-center gap-3">
                <img
                  src={h.image_url}
                  alt={h.name}
                  referrerPolicy="no-referrer"
                  className="w-12 h-12 rounded-lg object-cover bg-slate-200 shrink-0"
                />
                <div className="min-w-0 flex-1">
                  <h4 className="text-xs font-bold text-slate-900 truncate">{h.name}</h4>
                  <p className="text-[11px] text-emerald-800 font-mono font-semibold">
                    Count: {h.quantity} Hens
                  </p>
                  <p className="text-[10px] text-slate-400">
                    Last collected: {new Date(h.last_collected_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Collection Audit Log */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
        <h3 className="text-base font-bold text-slate-900 mb-3">Recent Collection Logs</h3>
        {(!data.history || data.history.length === 0) ? (
          <p className="text-xs text-slate-500 py-4 text-center">No egg collection history yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 uppercase font-semibold text-[11px]">
                <tr>
                  <th className="py-2.5 px-3">Date & Time</th>
                  <th className="py-2.5 px-3 text-center">Quantity Harvested</th>
                  <th className="py-2.5 px-3">Notes</th>
                  <th className="py-2.5 px-3 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {data.history.map((log: any) => (
                  <tr key={log.id} className="hover:bg-slate-50/50">
                    <td className="py-2.5 px-3 font-mono text-slate-700">
                      {new Date(log.collected_at).toLocaleString()}
                    </td>
                    <td className="py-2.5 px-3 text-center font-mono font-bold text-amber-700">
                      +{log.quantity} Eggs
                    </td>
                    <td className="py-2.5 px-3 text-slate-600">
                      {log.notes || 'Routine farm harvest'}
                    </td>
                    <td className="py-2.5 px-3 text-right">
                      <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-100 text-emerald-800">
                        VERIFIED
                      </span>
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
