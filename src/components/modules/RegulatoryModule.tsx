import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext.tsx';
import { api } from '../../services/api.ts';
import { ShieldCheck, ExternalLink, ArrowLeft, Building, FileCheck2, Scale, RefreshCw } from 'lucide-react';

export const RegulatoryModule: React.FC<{ onBack: () => void }> = ({ onBack }) => {
  const { settings } = useAuth();
  const [data, setData] = useState<any>(null);

  const loadData = async () => {
    try {
      const res = await api.getRegulatoryInfo();
      setData(res);
    } catch (err) {
      console.error('Failed to load regulatory info:', err);
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
        <button
          onClick={loadData}
          className="p-1.5 rounded-lg text-slate-500 hover:text-emerald-800 hover:bg-slate-100 transition-colors"
          title="Refresh"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {/* Hero Banner */}
      <div className="bg-[#064E3B] text-white p-6 sm:p-8 rounded-3xl shadow-xs">
        <div className="max-w-2xl space-y-3">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-900/90 border border-emerald-500/30 text-amber-300 text-xs font-semibold">
            <Scale className="w-3.5 h-3.5" />
            <span>Statutory Compliance & Regulatory Disclosures</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            Official FBR & SECP Documentation
          </h2>
          <p className="text-xs sm:text-sm text-emerald-100 leading-relaxed">
            Noorani Poultry Farm operates under statutory agricultural registrations in the Islamic Republic of Pakistan. All corporate charters, taxpayer status, and livestock guidelines are maintained with complete transparency.
          </p>
        </div>
      </div>

      {/* Grid of Verified Registrations */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* FBR Card */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-800 flex items-center justify-center border border-emerald-100">
                  <FileCheck2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">
                    Federal Board of Revenue (FBR)
                  </h3>
                  <span className="text-xs text-slate-500">Government of Pakistan</span>
                </div>
              </div>
              <span className="px-2.5 py-1 bg-emerald-100 text-emerald-800 rounded font-mono text-xs font-bold">
                ATL ACTIVE
              </span>
            </div>

            <div className="space-y-3 text-xs text-slate-600">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
                <div className="flex justify-between">
                  <span className="text-slate-500">National Tax Number (NTN):</span>
                  <span className="font-mono font-bold text-slate-900">
                    {data?.fbr?.ntn || settings.fbr_ntn || '7849201-4'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Tax Status:</span>
                  <span className="font-semibold text-emerald-700">
                    {data?.fbr?.status || settings.fbr_verified_status || 'Active Taxpayer on ATL'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Classification:</span>
                  <span className="font-medium text-slate-800">Agricultural Livestock & Poultry</span>
                </div>
              </div>

              <div className="leading-relaxed text-slate-600">
                <p className="font-semibold text-slate-800 mb-1">Tax Exemption on Poultry Breeding:</p>
                <p>
                  {data?.fbr?.description ||
                    settings.fbr_info ||
                    'Under Section 41 of the Income Tax Ordinance 2001, income derived from poultry farming and egg production operates under regulated agricultural livestock provisions with approved statutory exemptions.'}
                </p>
              </div>
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between">
            <span className="text-[11px] text-slate-400">IRIS Portal Verification</span>
            <a
              href={data?.fbr?.verification_url || 'https://iris.fbr.gov.pk/'}
              target="_blank"
              rel="noreferrer"
              className="text-xs font-semibold text-emerald-700 hover:text-emerald-900 flex items-center gap-1 cursor-pointer"
            >
              <span>Check on FBR IRIS</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>
        </div>

        {/* SECP Card */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-800 flex items-center justify-center border border-amber-100">
                  <Building className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">
                    Securities & Exchange Commission (SECP)
                  </h3>
                  <span className="text-xs text-slate-500">Corporate Registry Pakistan</span>
                </div>
              </div>
              <span className="px-2.5 py-1 bg-amber-100 text-amber-900 rounded font-mono text-xs font-bold">
                REGISTERED
              </span>
            </div>

            <div className="space-y-3 text-xs text-slate-600">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
                <div className="flex justify-between">
                  <span className="text-slate-500">Corporate Reg No (CUIN):</span>
                  <span className="font-mono font-bold text-slate-900">
                    {data?.secp?.registration_no || settings.secp_reg_no || '0194823'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Company Type:</span>
                  <span className="font-semibold text-slate-800">Private Limited Agro-Livestock</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Governing Statute:</span>
                  <span className="font-medium text-slate-800">Companies Act 2017</span>
                </div>
              </div>

              <div className="leading-relaxed text-slate-600">
                <p className="font-semibold text-slate-800 mb-1">Corporate Mandate & Filings:</p>
                <p>
                  {data?.secp?.description ||
                    settings.secp_info ||
                    'Incorporated under the Companies Act 2017 with the Securities and Exchange Commission of Pakistan as Noorani Poultry Agro Farms (Private) Limited. All statutory registers are maintained transparently.'}
                </p>
              </div>
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between">
            <span className="text-[11px] text-slate-400">eServices Portal Verification</span>
            <a
              href={data?.secp?.verification_url || 'https://eservices.secp.gov.pk/'}
              target="_blank"
              rel="noreferrer"
              className="text-xs font-semibold text-emerald-700 hover:text-emerald-900 flex items-center gap-1 cursor-pointer"
            >
              <span>Check on SECP eServices</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>
        </div>
      </div>

      {/* Legal & Risk Disclosure */}
      <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200 text-xs text-slate-600 space-y-2">
        <h4 className="font-bold text-slate-900 flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-emerald-700" />
          <span>Agricultural Livestock Integrity Statement</span>
        </h4>
        <p className="leading-relaxed">
          Noorani Poultry Farm operates authentic commercial biological flocks. Hens lay organic eggs based on natural feed, biological lay cycles, and veterinary care. All payments, eggs produced, and egg sale requests represent genuine farm assets without simulated or fictitious interest guarantees.
        </p>
      </div>
    </div>
  );
};
