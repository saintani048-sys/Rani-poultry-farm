import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext.tsx';
import { api } from '../../services/api.ts';
import { Users, Copy, Check, ArrowLeft, RefreshCw, Award, Share2 } from 'lucide-react';

export const ReferralsModule: React.FC<{ onBack: () => void }> = ({ onBack }) => {
  const { user } = useAuth();
  const [data, setData] = useState<any>({
    referral_code: '',
    bonus_per_referral: 100,
    total_referred: 0,
    total_bonus_earned: 0,
    referred_users: [],
  });
  const [copied, setCopied] = useState(false);

  const loadData = async () => {
    try {
      const res = await api.getReferrals();
      setData(res);
    } catch (err) {
      console.error('Failed to load referrals:', err);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const referralLink = typeof window !== 'undefined'
    ? `${window.location.origin}/?ref=${data.referral_code || user?.referral_code}`
    : '';

  const handleCopy = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(data.referral_code || user?.referral_code || '');
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleCopyLink = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(referralLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
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

      {/* Hero Invitation Banner */}
      <div className="bg-gradient-to-r from-[#064E3B] to-[#043d2f] text-white p-6 sm:p-8 rounded-3xl shadow-xs">
        <div className="max-w-2xl space-y-4">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-900/80 border border-emerald-500/30 text-amber-300 text-xs font-semibold">
            <Award className="w-3.5 h-3.5" />
            <span>Community Livestock Program</span>
          </div>

          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            Invite Farmers & Grow Your Flock Network
          </h2>

          <p className="text-xs sm:text-sm text-emerald-100 leading-relaxed">
            Share your exclusive referral code with peers and poultry farmers. Earn PKR {data.bonus_per_referral} direct bonus when your referee completes their first verified hen purchase.
          </p>

          {/* Referral Code & Link Box */}
          <div className="pt-2 flex flex-col sm:flex-row gap-3">
            <div className="flex-1 bg-emerald-950/80 rounded-xl border border-emerald-700/60 p-3 flex items-center justify-between">
              <div>
                <span className="text-[10px] text-emerald-300 uppercase block font-semibold">
                  Your Unique Referral Code
                </span>
                <span className="text-lg font-bold font-mono text-amber-300 tracking-wider">
                  {data.referral_code || user?.referral_code}
                </span>
              </div>
              <button
                onClick={handleCopy}
                className="p-2 rounded-lg bg-emerald-800 hover:bg-emerald-700 text-white transition-colors cursor-pointer"
                title="Copy code"
              >
                {copied ? <Check className="w-4 h-4 text-amber-300" /> : <Copy className="w-4 h-4" />}
              </button>
            </div>

            <button
              onClick={handleCopyLink}
              className="px-5 py-3 bg-amber-400 hover:bg-amber-300 text-emerald-950 font-bold rounded-xl text-xs sm:text-sm shadow-md transition-colors cursor-pointer flex items-center justify-center gap-2 whitespace-nowrap"
            >
              <Share2 className="w-4 h-4" />
              <span>{copied ? 'Link Copied!' : 'Copy Invitation Link'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Referral Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <span className="text-xs text-slate-500 block">Total Farmers Referred</span>
          <div className="text-2xl font-extrabold text-[#064E3B] font-mono mt-1 tabular-nums">
            {data.total_referred}
          </div>
          <span className="text-[11px] text-slate-400 mt-1 block">Active members in your circle</span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <span className="text-xs text-slate-500 block">Bonus Earned</span>
          <div className="text-2xl font-extrabold text-amber-600 font-mono mt-1 tabular-nums">
            PKR {data.total_bonus_earned.toLocaleString()}
          </div>
          <span className="text-[11px] text-slate-400 mt-1 block">Paid directly to wallet</span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <span className="text-xs text-slate-500 block">Commission Rate</span>
          <div className="text-2xl font-extrabold text-slate-800 font-mono mt-1 tabular-nums">
            PKR {data.bonus_per_referral}
          </div>
          <span className="text-[11px] text-slate-400 mt-1 block">Per active farmer</span>
        </div>
      </div>

      {/* Referred Farmers Table */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
        <h3 className="text-base font-bold text-slate-900 mb-3">Referred Members</h3>
        {(!data.referred_users || data.referred_users.length === 0) ? (
          <p className="text-xs text-slate-500 py-6 text-center">
            No referrals yet. Share your code or referral link to start building your community network!
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 uppercase font-semibold text-[11px]">
                <tr>
                  <th className="py-2.5 px-3">Farmer Name</th>
                  <th className="py-2.5 px-3">Username</th>
                  <th className="py-2.5 px-3 text-center">Hens Owned</th>
                  <th className="py-2.5 px-3 text-right">Bonus Credited</th>
                  <th className="py-2.5 px-3">Status</th>
                  <th className="py-2.5 px-3">Joined Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {data.referred_users.map((refUser: any) => (
                  <tr key={refUser.id} className="hover:bg-slate-50/50">
                    <td className="py-2.5 px-3 font-semibold text-slate-900">
                      {refUser.full_name}
                    </td>
                    <td className="py-2.5 px-3 font-mono text-slate-600">
                      @{refUser.username}
                    </td>
                    <td className="py-2.5 px-3 text-center font-mono font-bold text-slate-800">
                      {refUser.hens_purchased || 0} Hens
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono font-bold text-emerald-800">
                      PKR {(refUser.bonus_amount || 0).toLocaleString()}
                    </td>
                    <td className="py-2.5 px-3">
                      <span className="inline-block px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-100 text-emerald-800 uppercase">
                        {refUser.status || 'Active'}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-slate-500 font-mono text-[11px]">
                      {new Date(refUser.created_at).toLocaleDateString()}
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
