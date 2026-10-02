import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext.tsx';
import { api } from '../services/api.ts';
import { HenProduct, FarmStats } from '../types/index.ts';
import {
  ShoppingBag,
  Egg,
  ShieldCheck,
  TrendingUp,
  Award,
  Users,
  CheckCircle2,
  Phone,
  Mail,
  MapPin,
  ArrowRight,
  HelpCircle,
  Clock,
  Sparkles,
  ExternalLink,
  ChevronDown,
} from 'lucide-react';

export const LandingPage: React.FC = () => {
  const { openAuthModal, settings } = useAuth();
  const [stats, setStats] = useState<FarmStats>({
    registered_farmers: 0,
    active_hens_flock: 0,
    total_eggs_collected: 0,
    verified_transactions: 0,
    available_hen_stock: 0,
  });
  const [products, setProducts] = useState<HenProduct[]>([]);
  const [regulatory, setRegulatory] = useState<any>(null);
  const [faqOpen, setFaqOpen] = useState<number | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [statsData, productsData, regData] = await Promise.all([
          api.getPublicStats(),
          api.getPublicProducts(),
          api.getRegulatoryInfo(),
        ]);
        setStats(statsData);
        setProducts(productsData);
        setRegulatory(regData);
      } catch (err) {
        console.error('Failed to load landing page data:', err);
      }
    };
    fetchData();
  }, []);

  const siteName = settings.site_name || 'Noorani Poultry Farm';

  const faqs = [
    {
      q: 'How does Noorani Poultry Farm operate?',
      a: 'Registered members purchase quality hen breeds managed in our modern biosecure facility. You collect daily farm eggs produced by your flock and can sell them directly through our marketplace or request physical delivery.',
    },
    {
      q: 'How often can I collect eggs from my hens?',
      a: `Egg collection cycles operate on server-side verified intervals (currently every ${settings.collection_interval_hours || 12} hours). Each active hen in your flock produces nutritious eggs based on verified biological breed rates.`,
    },
    {
      q: 'What is the current selling price per egg?',
      a: `The current farm market price is PKR ${settings.egg_sell_price || 35} per organic egg. When you submit a sale request, proceeds are processed directly into your wallet or preferred payment account.`,
    },
    {
      q: 'How do I deposit funds or pay for hens?',
      a: 'We accept standard Pakistani bank transfers (Meezan Bank, Bank Alfalah), EasyPaisa, and JazzCash. You provide your transaction ID (TID) after payment, and our management approves your request.',
    },
    {
      q: 'Is Noorani Poultry Farm legally registered?',
      a: 'Yes, Noorani Poultry Farm is registered with the Federal Board of Revenue (FBR NTN: 7849201-4) and incorporated under the Companies Act 2017 with the SECP (CUIN: 0194823). Official verification portals can be accessed directly.',
    },
  ];

  return (
    <div className="min-h-screen bg-[#FDFBF7] text-slate-800">
      {/* 1. Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-b from-[#064E3B] to-[#043d2f] text-white pt-12 pb-20 lg:pt-16 lg:pb-28">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            {/* Left Content */}
            <div className="lg:col-span-7 space-y-6">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-900/60 border border-emerald-500/30 text-emerald-200 text-xs font-medium">
                <ShieldCheck className="w-4 h-4 text-amber-400" />
                <span>Verified Agro-Livestock Enterprise · FBR & SECP Compliant</span>
              </div>

              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-white leading-tight">
                Welcome to <br />
                <span className="text-amber-400">{siteName}</span>
              </h1>

              <p className="text-base sm:text-lg text-emerald-100/90 max-w-2xl leading-relaxed">
                Pakistan’s premier modern poultry platform. Purchase champion layer hens, harvest fresh organic eggs daily on verified schedules, and sell at guaranteed market rates with instant transparent bookkeeping.
              </p>

              <div className="flex flex-wrap items-center gap-4 pt-2">
                <button
                  onClick={() => openAuthModal('register')}
                  className="px-6 py-3.5 bg-amber-400 hover:bg-amber-300 text-emerald-950 font-bold rounded-xl shadow-lg transition-all transform hover:-translate-y-0.5 cursor-pointer flex items-center gap-2 text-sm sm:text-base"
                >
                  <span>Get Started Now</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
                <button
                  onClick={() => openAuthModal('login')}
                  className="px-6 py-3.5 bg-emerald-800/80 hover:bg-emerald-700 text-white font-semibold rounded-xl border border-emerald-600/60 transition-colors cursor-pointer text-sm sm:text-base"
                >
                  Member Login
                </button>
              </div>

              {/* Trust Badges */}
              <div className="pt-4 grid grid-cols-3 gap-4 border-t border-emerald-700/40 text-xs text-emerald-200">
                <div>
                  <div className="font-semibold text-white">Biosecure Coops</div>
                  <div>Vaccinated flock</div>
                </div>
                <div>
                  <div className="font-semibold text-white">Daily Laying</div>
                  <div>12h collection cycle</div>
                </div>
                <div>
                  <div className="font-semibold text-white">Transparent Ledger</div>
                  <div>Audited transactions</div>
                </div>
              </div>
            </div>

            {/* Right Hero Image Card */}
            <div className="lg:col-span-5 relative">
              <div className="relative rounded-2xl overflow-hidden shadow-2xl border-4 border-emerald-600/30 bg-emerald-950">
                <img
                  src="/src/assets/images/poultry_farm_hero_1790910495393.jpg"
                  alt="Modern Noorani Poultry Farm"
                  referrerPolicy="no-referrer"
                  className="w-full h-[360px] sm:h-[420px] object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-emerald-950/80 via-transparent to-transparent" />
                <div className="absolute bottom-4 left-4 right-4 bg-emerald-900/90 backdrop-blur-xs p-3.5 rounded-xl border border-emerald-700/60 text-white">
                  <div className="flex items-center justify-between text-xs">
                    <div>
                      <p className="font-bold text-amber-300">Organic Free-Range Facility</p>
                      <p className="text-[11px] text-emerald-200">Sargodha Bypass Road, Punjab</p>
                    </div>
                    <span className="px-2 py-1 bg-emerald-800 rounded font-mono text-[11px] text-emerald-100">
                      Active
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 2. Real Database Statistics Bar */}
      <section className="bg-white border-y border-slate-200 py-8 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-6">
            <span className="text-xs font-semibold text-emerald-800 uppercase tracking-wider">
              Verified Production Records
            </span>
            <p className="text-xs text-slate-500">
              Live statistics loaded from our farm database ledger
            </p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-100">
              <div className="text-2xl sm:text-3xl font-extrabold text-[#064E3B] font-mono tabular-nums">
                {stats.registered_farmers.toLocaleString()}
              </div>
              <div className="text-xs font-medium text-slate-600 mt-1">Registered Farmers</div>
            </div>
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-100">
              <div className="text-2xl sm:text-3xl font-extrabold text-[#064E3B] font-mono tabular-nums">
                {stats.active_hens_flock.toLocaleString()}
              </div>
              <div className="text-xs font-medium text-slate-600 mt-1">Active Flock of Hens</div>
            </div>
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-100">
              <div className="text-2xl sm:text-3xl font-extrabold text-[#064E3B] font-mono tabular-nums">
                {stats.total_eggs_collected.toLocaleString()}
              </div>
              <div className="text-xs font-medium text-slate-600 mt-1">Eggs Harvested to Date</div>
            </div>
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-100">
              <div className="text-2xl sm:text-3xl font-extrabold text-[#064E3B] font-mono tabular-nums">
                {stats.verified_transactions.toLocaleString()}
              </div>
              <div className="text-xs font-medium text-slate-600 mt-1">Completed Transactions</div>
            </div>
          </div>
        </div>
      </section>

      {/* 3. Core Features Grid */}
      <section id="features" className="py-16 sm:py-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-12">
          <h2 className="text-2xl sm:text-3xl font-bold text-slate-900">
            Integrated Poultry Management System
          </h2>
          <p className="mt-2 text-sm text-slate-600">
            Everything you need to purchase, manage, collect, and sell high-yield organic poultry.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Card 1 */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs hover:shadow-md transition-shadow">
            <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-800 flex items-center justify-center mb-4 border border-emerald-100">
              <ShoppingBag className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 mb-2">Buy Proven Layer Hens</h3>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed mb-4">
              Select from indigenous Golden Misri, pure Black Australorp, and Desi Aseel. All hens are fully vaccinated and housed in biosecure premises.
            </p>
            <button
              onClick={() => openAuthModal('login')}
              className="text-xs font-semibold text-emerald-700 hover:text-emerald-900 flex items-center gap-1 cursor-pointer"
            >
              <span>Explore flock store</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Card 2 */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs hover:shadow-md transition-shadow">
            <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-800 flex items-center justify-center mb-4 border border-amber-100">
              <Egg className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 mb-2">Daily Egg Collection</h3>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed mb-4">
              Your hens lay farm-fresh eggs on server-verified schedules. Collect your eggs into your digital inventory with a single tap.
            </p>
            <button
              onClick={() => openAuthModal('login')}
              className="text-xs font-semibold text-amber-700 hover:text-amber-900 flex items-center gap-1 cursor-pointer"
            >
              <span>View collection rules</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Card 3 */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs hover:shadow-md transition-shadow">
            <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-800 flex items-center justify-center mb-4 border border-emerald-100">
              <TrendingUp className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 mb-2">Sell Eggs for Immediate PKR</h3>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed mb-4">
              Sell your collected eggs at current market price (PKR {settings.egg_sell_price || 35}/egg). Direct payout to your wallet, bank, or mobile account.
            </p>
            <button
              onClick={() => openAuthModal('login')}
              className="text-xs font-semibold text-emerald-700 hover:text-emerald-900 flex items-center gap-1 cursor-pointer"
            >
              <span>Current market rates</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </section>

      {/* 4. Breeds Showcase */}
      <section id="breeds" className="py-16 bg-slate-100/70 border-y border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-10">
            <div>
              <span className="text-xs font-semibold text-emerald-800 uppercase tracking-wider">
                Live Farm Inventory
              </span>
              <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 mt-1">
                Featured Hen Breeds
              </h2>
            </div>
            <button
              onClick={() => openAuthModal('register')}
              className="mt-4 sm:mt-0 text-sm font-semibold text-emerald-700 hover:text-emerald-900 flex items-center gap-1.5 cursor-pointer"
            >
              <span>Create account to purchase</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {products.map((product) => (
              <div
                key={product.id}
                className="bg-white rounded-xl overflow-hidden border border-slate-200 shadow-xs hover:shadow-md transition-all flex flex-col"
              >
                <div className="h-48 overflow-hidden bg-slate-100 relative">
                  <img
                    src={product.image_url}
                    alt={product.name}
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover transform hover:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute top-2 right-2 bg-emerald-950/80 text-white text-[11px] font-mono px-2 py-0.5 rounded backdrop-blur-xs">
                    Stock: {product.stock}
                  </div>
                </div>
                <div className="p-4 flex-1 flex flex-col justify-between">
                  <div>
                    <span className="text-[11px] font-medium text-emerald-700">{product.breed}</span>
                    <h3 className="text-base font-bold text-slate-900 mt-0.5">{product.name}</h3>
                    <p className="text-xs text-slate-500 mt-1 line-clamp-2">{product.description}</p>
                  </div>
                  <div className="pt-4 mt-4 border-t border-slate-100 flex items-center justify-between">
                    <div>
                      <span className="text-[10px] text-slate-400 block uppercase">Price</span>
                      <span className="text-base font-bold text-[#064E3B] font-mono tabular-nums">
                        PKR {product.price.toLocaleString()}
                      </span>
                    </div>
                    <button
                      onClick={() => openAuthModal('login')}
                      className="px-3 py-1.5 bg-[#064E3B] hover:bg-[#053F30] text-white text-xs font-semibold rounded-lg transition-colors cursor-pointer"
                    >
                      Buy Hen
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 5. How It Works */}
      <section id="how-it-works" className="py-16 sm:py-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-12">
          <span className="text-xs font-semibold text-emerald-800 uppercase tracking-wider">
            Simple 4-Step Process
          </span>
          <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 mt-1">
            How Noorani Poultry Farm Works
          </h2>
          <p className="mt-2 text-sm text-slate-600">
            Join thousands of individuals participating in managed poultry livestock and organic egg collection.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 relative">
          <div className="bg-white p-5 rounded-xl border border-slate-200 relative z-10">
            <div className="w-8 h-8 rounded-full bg-emerald-800 text-white font-bold text-xs flex items-center justify-center mb-3">
              1
            </div>
            <h3 className="text-base font-bold text-slate-900 mb-1">Create Account</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Register with your mobile number and name. You receive your personal dashboard and unique referral ID.
            </p>
          </div>

          <div className="bg-white p-5 rounded-xl border border-slate-200 relative z-10">
            <div className="w-8 h-8 rounded-full bg-emerald-800 text-white font-bold text-xs flex items-center justify-center mb-3">
              2
            </div>
            <h3 className="text-base font-bold text-slate-900 mb-1">Purchase Hens</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Choose your preferred breed from available farm stock. Pay using wallet balance or bank/EasyPaisa transfer.
            </p>
          </div>

          <div className="bg-white p-5 rounded-xl border border-slate-200 relative z-10">
            <div className="w-8 h-8 rounded-full bg-emerald-800 text-white font-bold text-xs flex items-center justify-center mb-3">
              3
            </div>
            <h3 className="text-base font-bold text-slate-900 mb-1">Daily Egg Harvest</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Your hens lay farm eggs. When eligible, click "Collect Eggs" to store fresh harvest into your digital inventory.
            </p>
          </div>

          <div className="bg-white p-5 rounded-xl border border-slate-200 relative z-10">
            <div className="w-8 h-8 rounded-full bg-emerald-800 text-white font-bold text-xs flex items-center justify-center mb-3">
              4
            </div>
            <h3 className="text-base font-bold text-slate-900 mb-1">Sell & Withdraw</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Sell your eggs back to the farm at fixed market prices. Withdraw your earnings easily to any Pakistani bank account.
            </p>
          </div>
        </div>
      </section>

      {/* 6. Regulatory Trust Section (FBR & SECP) */}
      <section id="regulatory" className="py-14 bg-emerald-950 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mb-8">
            <div className="inline-flex items-center gap-2 text-xs font-semibold text-amber-400 uppercase tracking-wider mb-1">
              <ShieldCheck className="w-4 h-4" />
              <span>Statutory Compliance & Legal Recognition</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold">
              Transparent, Verified & Regulatory Registered
            </h2>
            <p className="text-xs sm:text-sm text-emerald-200 mt-2">
              Noorani Poultry Farm operates strictly under verified corporate and tax registrations in the Islamic Republic of Pakistan.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* FBR Card */}
            <div className="bg-emerald-900/60 border border-emerald-700/60 rounded-xl p-5 backdrop-blur-xs">
              <div className="flex items-center justify-between mb-3">
                <span className="font-bold text-base text-white">Federal Board of Revenue (FBR)</span>
                <span className="text-xs bg-emerald-800 text-amber-300 px-2 py-0.5 rounded font-mono">
                  NTN: {regulatory?.fbr?.ntn || '7849201-4'}
                </span>
              </div>
              <p className="text-xs text-emerald-100 leading-relaxed mb-4">
                {regulatory?.fbr?.description ||
                  'Registered agricultural livestock enterprise. Section 41 livestock exemption guidelines apply to poultry operations.'}
              </p>
              <div className="flex items-center justify-between text-xs pt-3 border-t border-emerald-800 text-emerald-300">
                <span>Status: {regulatory?.fbr?.status || 'Active Taxpayer on ATL'}</span>
                <a
                  href={regulatory?.fbr?.verification_url || 'https://iris.fbr.gov.pk/'}
                  target="_blank"
                  rel="noreferrer"
                  className="text-amber-300 hover:text-white flex items-center gap-1"
                >
                  <span>Verify on FBR</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            </div>

            {/* SECP Card */}
            <div className="bg-emerald-900/60 border border-emerald-700/60 rounded-xl p-5 backdrop-blur-xs">
              <div className="flex items-center justify-between mb-3">
                <span className="font-bold text-base text-white">
                  Securities & Exchange Commission (SECP)
                </span>
                <span className="text-xs bg-emerald-800 text-amber-300 px-2 py-0.5 rounded font-mono">
                  CUIN: {regulatory?.secp?.registration_no || '0194823'}
                </span>
              </div>
              <p className="text-xs text-emerald-100 leading-relaxed mb-4">
                {regulatory?.secp?.description ||
                  'Incorporated under the Companies Act 2017 with official statutory records.'}
              </p>
              <div className="flex items-center justify-between text-xs pt-3 border-t border-emerald-800 text-emerald-300">
                <span>Status: {regulatory?.secp?.status || 'Incorporated Private Ltd'}</span>
                <a
                  href={regulatory?.secp?.verification_url || 'https://eservices.secp.gov.pk/'}
                  target="_blank"
                  rel="noreferrer"
                  className="text-amber-300 hover:text-white flex items-center gap-1"
                >
                  <span>Verify on SECP</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 7. FAQs */}
      <section id="faqs" className="py-16 max-w-4xl mx-auto px-4 sm:px-6">
        <div className="text-center mb-10">
          <h2 className="text-2xl sm:text-3xl font-bold text-slate-900">
            Frequently Asked Questions
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Common questions about poultry flock maintenance and egg sales.
          </p>
        </div>

        <div className="space-y-3">
          {faqs.map((faq, idx) => {
            const isOpen = faqOpen === idx;
            return (
              <div
                key={idx}
                className="bg-white border border-slate-200 rounded-xl overflow-hidden transition-colors"
              >
                <button
                  onClick={() => setFaqOpen(isOpen ? null : idx)}
                  className="w-full px-5 py-4 text-left flex items-center justify-between text-sm font-semibold text-slate-900 hover:text-emerald-800"
                >
                  <span>{faq.q}</span>
                  <ChevronDown
                    className={`w-4 h-4 text-slate-400 transition-transform ${
                      isOpen ? 'rotate-180 text-emerald-700' : ''
                    }`}
                  />
                </button>
                {isOpen && (
                  <div className="px-5 pb-4 text-xs text-slate-600 border-t border-slate-100 pt-3 leading-relaxed">
                    {faq.a}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* 8. Contact & Footer */}
      <footer id="contact" className="bg-[#053F30] text-emerald-100 pt-12 pb-16 border-t border-emerald-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 pb-10 border-b border-emerald-700/50">
            {/* Col 1 */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-amber-400/20 border border-amber-400/40 flex items-center justify-center text-amber-300 font-bold">
                  N
                </div>
                <span className="text-lg font-bold text-white tracking-tight">{siteName}</span>
              </div>
              <p className="text-xs text-emerald-200 leading-relaxed">
                Empowering modern poultry livestock management and organic egg distribution across Pakistan.
              </p>
            </div>

            {/* Col 2 */}
            <div>
              <h4 className="text-xs font-bold text-amber-400 uppercase tracking-wider mb-3">
                Quick Navigation
              </h4>
              <ul className="space-y-2 text-xs">
                <li>
                  <button onClick={() => openAuthModal('login')} className="hover:text-white">
                    Farmer Login
                  </button>
                </li>
                <li>
                  <button onClick={() => openAuthModal('register')} className="hover:text-white">
                    Create Account
                  </button>
                </li>
                <li>
                  <a href="#breeds" className="hover:text-white">
                    Hen Breeds
                  </a>
                </li>
                <li>
                  <a href="#regulatory" className="hover:text-white">
                    FBR & SECP Documentation
                  </a>
                </li>
              </ul>
            </div>

            {/* Col 3: Official Verification */}
            <div>
              <h4 className="text-xs font-bold text-amber-400 uppercase tracking-wider mb-3">
                Verified Registrations
              </h4>
              <div className="space-y-2 text-xs text-emerald-200">
                <p>
                  <strong className="text-white">FBR NTN:</strong> {settings.fbr_ntn || '7849201-4'}
                </p>
                <p>
                  <strong className="text-white">SECP CUIN:</strong> {settings.secp_reg_no || '0194823'}
                </p>
                <p>
                  <strong className="text-white">Egg Market Price:</strong> PKR{' '}
                  {settings.egg_sell_price || '35'} / egg
                </p>
              </div>
            </div>

            {/* Col 4: Contact */}
            <div>
              <h4 className="text-xs font-bold text-amber-400 uppercase tracking-wider mb-3">
                Farm Head Office
              </h4>
              <ul className="space-y-2 text-xs text-emerald-200">
                <li className="flex items-start gap-2">
                  <MapPin className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
                  <span>{settings.farm_address || 'Chak 45-SB, Sargodha Road, Punjab'}</span>
                </li>
                <li className="flex items-center gap-2">
                  <Phone className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                  <span>{settings.support_phone || '+92 300 1234567'}</span>
                </li>
                <li className="flex items-center gap-2">
                  <Mail className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                  <span>{settings.support_email || 'support@nooranipoultry.com'}</span>
                </li>
              </ul>
            </div>
          </div>

          <div className="pt-6 flex flex-col sm:flex-row items-center justify-between text-xs text-emerald-300/80 gap-3">
            <p>© {new Date().getFullYear()} {siteName}. All rights reserved.</p>
            <div className="flex gap-4">
              <span className="hover:text-white cursor-pointer">Terms of Service</span>
              <span className="hover:text-white cursor-pointer">Livestock Policy</span>
              <span className="hover:text-white cursor-pointer">Privacy Notice</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};
