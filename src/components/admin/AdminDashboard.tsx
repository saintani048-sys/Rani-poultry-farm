import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext.tsx';
import { api } from '../../services/api.ts';
import {
  Users,
  ShoppingBag,
  Egg,
  DollarSign,
  TrendingUp,
  Settings,
  Shield,
  Layers,
  FileText,
  Clock,
  CheckCircle,
  XCircle,
  AlertTriangle,
  RefreshCw,
  Search,
  Plus,
  Edit2,
  Trash2,
  Lock,
  LogOut,
  ArrowUpRight,
  ArrowDownLeft,
  MessageSquare,
  Building,
  Check,
  X,
  ExternalLink,
} from 'lucide-react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { Line, Bar, Doughnut } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
);

export const AdminDashboard: React.FC = () => {
  const { user, logout, setActiveView, settings, refreshSettings } = useAuth();
  const [activeTab, setActiveTab] = useState<
    'analytics' | 'users' | 'hen_requests' | 'egg_requests' | 'deposits' | 'withdrawals' | 'products' | 'settings' | 'support' | 'audit'
  >('analytics');

  const [analytics, setAnalytics] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // User Management State
  const [usersList, setUsersList] = useState<any[]>([]);
  const [userSearch, setUserSearch] = useState('');
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [balanceModal, setBalanceModal] = useState<{ open: boolean; userId: number; username: string }>({
    open: false,
    userId: 0,
    username: '',
  });
  const [adjustAmount, setAdjustAmount] = useState(1000);
  const [adjustType, setAdjustType] = useState<'credit' | 'debit'>('credit');
  const [adjustReason, setAdjustReason] = useState('');

  // Requests Queues
  const [henRequests, setHenRequests] = useState<any[]>([]);
  const [eggRequests, setEggRequests] = useState<any[]>([]);
  const [depositRequests, setDepositRequests] = useState<any[]>([]);
  const [withdrawalRequests, setWithdrawalRequests] = useState<any[]>([]);
  const [queueStatusFilter, setQueueStatusFilter] = useState<'pending' | 'approved' | 'rejected'>('pending');

  // Products
  const [productsList, setProductsList] = useState<any[]>([]);
  const [productModalOpen, setProductModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<any>(null);

  // Settings
  const [siteSettings, setSiteSettings] = useState<Record<string, string>>({});

  // Support
  const [supportTickets, setSupportTickets] = useState<any[]>([]);
  const [replyTicketId, setReplyTicketId] = useState<number | null>(null);
  const [replyText, setReplyText] = useState('');

  // Audit Logs
  const [auditLogs, setAuditLogs] = useState<any[]>([]);

  // Action Confirmation Modal
  const [actionModal, setActionModal] = useState<{
    open: boolean;
    type: 'hen' | 'egg' | 'deposit' | 'withdrawal';
    id: number;
    action: 'approve' | 'reject';
    title: string;
    notes: string;
  }>({
    open: false,
    type: 'hen',
    id: 0,
    action: 'approve',
    title: '',
    notes: '',
  });

  const loadAnalytics = async () => {
    try {
      const data = await api.getAdminAnalytics();
      setAnalytics(data);
    } catch (err) {
      console.error('Failed to load admin analytics:', err);
    }
  };

  const loadUsers = async () => {
    try {
      const data = await api.getAdminUsers(userSearch);
      setUsersList(data);
    } catch (err) {
      console.error('Failed to load users:', err);
    }
  };

  const loadRequests = async () => {
    try {
      const [hens, eggs, deps, withs] = await Promise.all([
        api.getAdminHenRequests(queueStatusFilter),
        api.getAdminEggRequests(queueStatusFilter),
        api.getAdminDeposits(queueStatusFilter),
        api.getAdminWithdrawals(queueStatusFilter),
      ]);
      setHenRequests(hens);
      setEggRequests(eggs);
      setDepositRequests(deps);
      setWithdrawalRequests(withs);
    } catch (err) {
      console.error('Failed to load requests:', err);
    }
  };

  const loadProducts = async () => {
    try {
      const data = await api.getAdminProducts();
      setProductsList(data);
    } catch (err) {
      console.error('Failed to load products:', err);
    }
  };

  const loadSettings = async () => {
    try {
      const data = await api.getAdminSettings();
      setSiteSettings(data);
    } catch (err) {
      console.error('Failed to load settings:', err);
    }
  };

  const loadSupport = async () => {
    try {
      const data = await api.getAdminSupportTickets();
      setSupportTickets(data);
    } catch (err) {
      console.error('Failed to load support tickets:', err);
    }
  };

  const loadAuditLogs = async () => {
    try {
      const data = await api.getAdminAuditLogs();
      setAuditLogs(data);
    } catch (err) {
      console.error('Failed to load audit logs:', err);
    }
  };

  useEffect(() => {
    loadAnalytics();
  }, []);

  useEffect(() => {
    if (activeTab === 'users') loadUsers();
    if (['hen_requests', 'egg_requests', 'deposits', 'withdrawals'].includes(activeTab)) loadRequests();
    if (activeTab === 'products') loadProducts();
    if (activeTab === 'settings') loadSettings();
    if (activeTab === 'support') loadSupport();
    if (activeTab === 'audit') loadAuditLogs();
  }, [activeTab, queueStatusFilter]);

  const handleActionConfirm = async () => {
    setLoading(true);
    setFeedback(null);
    try {
      const { type, id, action, notes } = actionModal;
      if (type === 'hen') await api.handleHenRequest(id, action, notes);
      if (type === 'egg') await api.handleEggRequest(id, action, notes);
      if (type === 'deposit') await api.handleDeposit(id, action, notes);
      if (type === 'withdrawal') await api.handleWithdrawal(id, action, notes);

      setFeedback({ type: 'success', message: `Request successfully ${action}d.` });
      setActionModal({ ...actionModal, open: false });
      await Promise.all([loadRequests(), loadAnalytics()]);
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message || 'Action failed.' });
    } finally {
      setLoading(false);
    }
  };

  const handleToggleUserStatus = async (userId: number, currentStatus: string) => {
    const nextStatus = currentStatus === 'active' ? 'suspended' : 'active';
    const reason = prompt(`Enter reason for marking account as ${nextStatus}:`) || 'Administrative review';
    try {
      await api.updateUserStatus(userId, nextStatus, reason);
      setFeedback({ type: 'success', message: `User marked as ${nextStatus}.` });
      loadUsers();
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message || 'Status update failed.' });
    }
  };

  const handleBalanceAdjustment = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.adjustUserBalance(balanceModal.userId, adjustAmount, adjustType, adjustReason);
      setFeedback({ type: 'success', message: `Balance updated for ${balanceModal.username}.` });
      setBalanceModal({ open: false, userId: 0, username: '' });
      setAdjustReason('');
      loadUsers();
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message || 'Failed to adjust balance.' });
    }
  };

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.updateAdminSettings(siteSettings);
      setFeedback({ type: 'success', message: 'System settings saved successfully.' });
      await refreshSettings();
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message || 'Failed to update settings.' });
    } finally {
      setLoading(false);
    }
  };

  const handleReplyTicket = async (ticketId: number) => {
    if (!replyText.trim()) return;
    try {
      await api.replySupportTicket(ticketId, replyText);
      setFeedback({ type: 'success', message: 'Reply sent and ticket resolved.' });
      setReplyTicketId(null);
      setReplyText('');
      loadSupport();
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message || 'Failed to reply.' });
    }
  };

  // Prepare Chart.js data
  const regDays = analytics?.charts?.registrations?.map((r: any) => r.day) || [];
  const regCounts = analytics?.charts?.registrations?.map((r: any) => r.count) || [];

  const registrationChartData = {
    labels: regDays.length ? regDays : ['Today'],
    datasets: [
      {
        label: 'New Farmers Registered',
        data: regCounts.length ? regCounts : [analytics?.metrics?.total_users || 0],
        borderColor: '#047857',
        backgroundColor: 'rgba(4, 120, 87, 0.15)',
        tension: 0.3,
        fill: true,
      },
    ],
  };

  const requestDistributionData = {
    labels: ['Hen Purchases', 'Egg Sales', 'Deposits', 'Withdrawals'],
    datasets: [
      {
        data: [
          analytics?.metrics?.pending_requests?.hens || 0,
          analytics?.metrics?.pending_requests?.eggs || 0,
          analytics?.metrics?.pending_requests?.deposits || 0,
          analytics?.metrics?.pending_requests?.withdrawals || 0,
        ],
        backgroundColor: ['#047857', '#d97706', '#2563eb', '#dc2626'],
      },
    ],
  };

  const pendingRequestsTotal = analytics?.metrics?.pending_requests?.total || 0;

  return (
    <div className="min-h-screen bg-[#F4F6F8] text-slate-800 flex flex-col md:flex-row">
      {/* Sidebar Navigation */}
      <aside className="w-full md:w-64 bg-[#064E3B] text-white shrink-0 border-r border-emerald-800 flex flex-col">
        {/* Brand Header */}
        <div className="p-5 border-b border-emerald-800/80 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-amber-400/20 border border-amber-400/40 flex items-center justify-center text-amber-300 font-bold">
              N
            </div>
            <div>
              <span className="text-sm font-bold block leading-tight text-white">
                {settings.site_name || 'Noorani Farm'}
              </span>
              <span className="text-[10px] text-amber-300 font-semibold tracking-wider uppercase">
                Admin Console
              </span>
            </div>
          </div>
          <button
            onClick={() => setActiveView('dashboard')}
            className="p-1.5 rounded-lg bg-emerald-800/80 hover:bg-emerald-700 text-emerald-200 text-xs flex items-center gap-1"
            title="Switch to User View"
          >
            <span>User View</span>
          </button>
        </div>

        {/* Nav Links */}
        <nav className="p-3 space-y-1 flex-1 text-xs font-medium text-emerald-100 overflow-y-auto">
          <button
            onClick={() => setActiveTab('analytics')}
            className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl transition-colors cursor-pointer ${
              activeTab === 'analytics'
                ? 'bg-amber-400 text-emerald-950 font-bold shadow-xs'
                : 'hover:bg-emerald-800/60'
            }`}
          >
            <div className="flex items-center gap-2.5">
              <TrendingUp className="w-4 h-4" />
              <span>Dashboard & Analytics</span>
            </div>
          </button>

          <button
            onClick={() => setActiveTab('users')}
            className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl transition-colors cursor-pointer ${
              activeTab === 'users'
                ? 'bg-amber-400 text-emerald-950 font-bold shadow-xs'
                : 'hover:bg-emerald-800/60'
            }`}
          >
            <div className="flex items-center gap-2.5">
              <Users className="w-4 h-4" />
              <span>User Management</span>
            </div>
            <span className="text-[10px] opacity-75 font-mono">
              {analytics?.metrics?.total_users || 0}
            </span>
          </button>

          <div className="pt-2 pb-1 px-3 text-[10px] font-bold text-emerald-300/80 uppercase tracking-wider">
            Verification Queues
          </div>

          <button
            onClick={() => setActiveTab('hen_requests')}
            className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl transition-colors cursor-pointer ${
              activeTab === 'hen_requests'
                ? 'bg-amber-400 text-emerald-950 font-bold shadow-xs'
                : 'hover:bg-emerald-800/60'
            }`}
          >
            <div className="flex items-center gap-2.5">
              <ShoppingBag className="w-4 h-4" />
              <span>Hen Purchases</span>
            </div>
            {(analytics?.metrics?.pending_requests?.hens || 0) > 0 && (
              <span className="px-1.5 py-0.5 rounded-full bg-amber-500 text-emerald-950 text-[10px] font-bold font-mono">
                {analytics.metrics.pending_requests.hens}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('egg_requests')}
            className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl transition-colors cursor-pointer ${
              activeTab === 'egg_requests'
                ? 'bg-amber-400 text-emerald-950 font-bold shadow-xs'
                : 'hover:bg-emerald-800/60'
            }`}
          >
            <div className="flex items-center gap-2.5">
              <Egg className="w-4 h-4" />
              <span>Egg Sales Queue</span>
            </div>
            {(analytics?.metrics?.pending_requests?.eggs || 0) > 0 && (
              <span className="px-1.5 py-0.5 rounded-full bg-amber-500 text-emerald-950 text-[10px] font-bold font-mono">
                {analytics.metrics.pending_requests.eggs}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('deposits')}
            className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl transition-colors cursor-pointer ${
              activeTab === 'deposits'
                ? 'bg-amber-400 text-emerald-950 font-bold shadow-xs'
                : 'hover:bg-emerald-800/60'
            }`}
          >
            <div className="flex items-center gap-2.5">
              <ArrowDownLeft className="w-4 h-4" />
              <span>Deposit Verifications</span>
            </div>
            {(analytics?.metrics?.pending_requests?.deposits || 0) > 0 && (
              <span className="px-1.5 py-0.5 rounded-full bg-amber-500 text-emerald-950 text-[10px] font-bold font-mono">
                {analytics.metrics.pending_requests.deposits}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('withdrawals')}
            className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl transition-colors cursor-pointer ${
              activeTab === 'withdrawals'
                ? 'bg-amber-400 text-emerald-950 font-bold shadow-xs'
                : 'hover:bg-emerald-800/60'
            }`}
          >
            <div className="flex items-center gap-2.5">
              <ArrowUpRight className="w-4 h-4" />
              <span>Withdrawals Queue</span>
            </div>
            {(analytics?.metrics?.pending_requests?.withdrawals || 0) > 0 && (
              <span className="px-1.5 py-0.5 rounded-full bg-amber-500 text-emerald-950 text-[10px] font-bold font-mono">
                {analytics.metrics.pending_requests.withdrawals}
              </span>
            )}
          </button>

          <div className="pt-2 pb-1 px-3 text-[10px] font-bold text-emerald-300/80 uppercase tracking-wider">
            Catalog & System
          </div>

          <button
            onClick={() => setActiveTab('products')}
            className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl transition-colors cursor-pointer ${
              activeTab === 'products'
                ? 'bg-amber-400 text-emerald-950 font-bold shadow-xs'
                : 'hover:bg-emerald-800/60'
            }`}
          >
            <div className="flex items-center gap-2.5">
              <Layers className="w-4 h-4" />
              <span>Hen Breeds & Prices</span>
            </div>
          </button>

          <button
            onClick={() => setActiveTab('settings')}
            className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl transition-colors cursor-pointer ${
              activeTab === 'settings'
                ? 'bg-amber-400 text-emerald-950 font-bold shadow-xs'
                : 'hover:bg-emerald-800/60'
            }`}
          >
            <div className="flex items-center gap-2.5">
              <Settings className="w-4 h-4" />
              <span>Farm Settings & FBR</span>
            </div>
          </button>

          <button
            onClick={() => setActiveTab('support')}
            className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl transition-colors cursor-pointer ${
              activeTab === 'support'
                ? 'bg-amber-400 text-emerald-950 font-bold shadow-xs'
                : 'hover:bg-emerald-800/60'
            }`}
          >
            <div className="flex items-center gap-2.5">
              <MessageSquare className="w-4 h-4" />
              <span>Support Helpdesk</span>
            </div>
          </button>

          <button
            onClick={() => setActiveTab('audit')}
            className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl transition-colors cursor-pointer ${
              activeTab === 'audit'
                ? 'bg-amber-400 text-emerald-950 font-bold shadow-xs'
                : 'hover:bg-emerald-800/60'
            }`}
          >
            <div className="flex items-center gap-2.5">
              <FileText className="w-4 h-4" />
              <span>Security Audit Logs</span>
            </div>
          </button>
        </nav>

        {/* Admin User Footer */}
        <div className="p-3 border-t border-emerald-800/80 bg-emerald-950/60 flex items-center justify-between text-xs">
          <div>
            <span className="font-bold text-white block">Administrator</span>
            <span className="text-emerald-300 font-mono text-[10px]">@{user?.username}</span>
          </div>
          <button
            onClick={logout}
            className="p-1.5 rounded-lg text-red-300 hover:text-white hover:bg-red-900/50 transition-colors"
            title="Logout"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </aside>

      {/* Main Admin Content Canvas */}
      <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 space-y-6">
        {/* Top bar header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-200">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-bold text-slate-900 capitalize">
                {activeTab.replace('_', ' ')}
              </h2>
              {pendingRequestsTotal > 0 && (
                <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-900">
                  {pendingRequestsTotal} Pending Actions
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500">
              Noorani Poultry Farm Enterprise Operations Engine
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                loadAnalytics();
                if (activeTab === 'users') loadUsers();
                if (['hen_requests', 'egg_requests', 'deposits', 'withdrawals'].includes(activeTab)) loadRequests();
                if (activeTab === 'products') loadProducts();
              }}
              className="p-2 rounded-lg bg-white border border-slate-200 text-slate-600 hover:text-emerald-800 transition-colors shadow-2xs"
              title="Refresh Data"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
        </div>

        {feedback && (
          <div
            className={`p-4 rounded-xl text-xs sm:text-sm flex items-start justify-between gap-2.5 ${
              feedback.type === 'success'
                ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                : 'bg-red-50 text-red-800 border border-red-200'
            }`}
          >
            <div className="flex items-center gap-2">
              {feedback.type === 'success' ? (
                <CheckCircle className="w-4 h-4 text-emerald-600" />
              ) : (
                <AlertTriangle className="w-4 h-4 text-red-600" />
              )}
              <span>{feedback.message}</span>
            </div>
            <button onClick={() => setFeedback(null)} className="text-slate-400 hover:text-slate-700">
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* TAB 1: ANALYTICS & DASHBOARD (Inspired by Reference Screenshot 2) */}
        {activeTab === 'analytics' && (
          <div className="space-y-6">
            {/* Top Stat Cards Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 gap-4">
              {/* Stat 1 */}
              <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
                <span className="text-xs text-slate-500 block font-medium">Registered Farmers</span>
                <div className="text-2xl font-extrabold text-[#064E3B] font-mono mt-1 tabular-nums">
                  {analytics?.metrics?.total_users || 0}
                </div>
                <div className="text-[11px] text-slate-400 mt-1 flex justify-between">
                  <span>Active: {analytics?.metrics?.active_users || 0}</span>
                  <span>Suspended: {analytics?.metrics?.suspended_users || 0}</span>
                </div>
              </div>

              {/* Stat 2 */}
              <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
                <span className="text-xs text-slate-500 block font-medium">Pending Requests</span>
                <div className="text-2xl font-extrabold text-amber-600 font-mono mt-1 tabular-nums">
                  {analytics?.metrics?.pending_requests?.total || 0}
                </div>
                <div className="text-[11px] text-slate-400 mt-1 truncate">
                  Hens: {analytics?.metrics?.pending_requests?.hens || 0} · Eggs: {analytics?.metrics?.pending_requests?.eggs || 0}
                </div>
              </div>

              {/* Stat 3 */}
              <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
                <span className="text-xs text-slate-500 block font-medium">Verified Hen Sales</span>
                <div className="text-2xl font-extrabold text-slate-900 font-mono mt-1 tabular-nums">
                  PKR {(analytics?.metrics?.financials?.hen_sales_pkr || 0).toLocaleString()}
                </div>
                <div className="text-[11px] text-slate-400 mt-1">
                  Orders: {analytics?.metrics?.financials?.hen_orders_count || 0}
                </div>
              </div>

              {/* Stat 4 */}
              <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
                <span className="text-xs text-slate-500 block font-medium">Egg Buyback Volume</span>
                <div className="text-2xl font-extrabold text-slate-900 font-mono mt-1 tabular-nums">
                  PKR {(analytics?.metrics?.financials?.egg_sales_pkr || 0).toLocaleString()}
                </div>
                <div className="text-[11px] text-slate-400 mt-1">
                  Purchases: {analytics?.metrics?.financials?.egg_orders_count || 0}
                </div>
              </div>

              {/* Stat 5 */}
              <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
                <span className="text-xs text-slate-500 block font-medium">Verified Deposits</span>
                <div className="text-2xl font-extrabold text-emerald-700 font-mono mt-1 tabular-nums">
                  PKR {(analytics?.metrics?.financials?.deposits_verified_pkr || 0).toLocaleString()}
                </div>
                <span className="text-[11px] text-slate-400 mt-1 block">Farm credit volume</span>
              </div>

              {/* Stat 6 */}
              <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
                <span className="text-xs text-slate-500 block font-medium">Disbursed Withdrawals</span>
                <div className="text-2xl font-extrabold text-red-700 font-mono mt-1 tabular-nums">
                  PKR {(analytics?.metrics?.financials?.withdrawals_verified_pkr || 0).toLocaleString()}
                </div>
                <span className="text-[11px] text-slate-400 mt-1 block">Paid out to farmers</span>
              </div>

              {/* Stat 7 */}
              <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
                <span className="text-xs text-slate-500 block font-medium">Live Hen Flock</span>
                <div className="text-2xl font-extrabold text-[#064E3B] font-mono mt-1 tabular-nums">
                  {(analytics?.metrics?.inventory?.active_hens_flock || 0).toLocaleString()}
                </div>
                <span className="text-[11px] text-slate-400 mt-1 block">Active in user coops</span>
              </div>

              {/* Stat 8 */}
              <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
                <span className="text-xs text-slate-500 block font-medium">Eggs Harvested (All Time)</span>
                <div className="text-2xl font-extrabold text-amber-700 font-mono mt-1 tabular-nums">
                  {(analytics?.metrics?.inventory?.total_eggs_collected || 0).toLocaleString()}
                </div>
                <span className="text-[11px] text-slate-400 mt-1 block">Verified lay records</span>
              </div>
            </div>

            {/* Chart.js Analytics Rows */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Left Chart: Registration growth */}
              <div className="lg:col-span-8 bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
                <h3 className="text-sm font-bold text-slate-900 mb-1">
                  Farmer Registration Growth (Recent Timeline)
                </h3>
                <p className="text-xs text-slate-500 mb-4">
                  Real database timestamp telemetry
                </p>
                <div className="h-64">
                  <Line
                    data={registrationChartData}
                    options={{
                      responsive: true,
                      maintainAspectRatio: false,
                      plugins: { legend: { display: false } },
                      scales: {
                        y: { beginAtZero: true, ticks: { stepSize: 1 } },
                      },
                    }}
                  />
                </div>
              </div>

              {/* Right Chart: Pending requests breakdown */}
              <div className="lg:col-span-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs flex flex-col justify-between">
                <div>
                  <h3 className="text-sm font-bold text-slate-900 mb-1">
                    Pending Verification Queues
                  </h3>
                  <p className="text-xs text-slate-500 mb-4">
                    Active requests needing admin signoff
                  </p>
                  <div className="h-48 flex items-center justify-center">
                    <Doughnut
                      data={requestDistributionData}
                      options={{
                        responsive: true,
                        maintainAspectRatio: false,
                        plugins: { legend: { position: 'bottom', labels: { boxWidth: 12, font: { size: 10 } } } },
                      }}
                    />
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                  <span className="text-slate-500">Total Action Items:</span>
                  <span className="font-bold font-mono text-amber-700">{pendingRequestsTotal}</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: USER MANAGEMENT */}
        {activeTab === 'users' && (
          <div className="space-y-4">
            {/* Search toolbar */}
            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="relative w-full sm:w-80">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  placeholder="Search by name, username, mobile..."
                  value={userSearch}
                  onChange={(e) => setUserSearch(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && loadUsers()}
                  className="w-full pl-9 pr-3 py-1.5 text-xs border border-slate-300 rounded-lg focus:outline-none focus:border-emerald-600"
                />
              </div>

              <button
                onClick={loadUsers}
                className="px-3.5 py-1.5 bg-[#064E3B] text-white rounded-lg text-xs font-semibold cursor-pointer"
              >
                Search
              </button>
            </div>

            {/* Users Table */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 uppercase font-semibold text-[11px]">
                    <tr>
                      <th className="py-3 px-4">Farmer</th>
                      <th className="py-3 px-4">Contact</th>
                      <th className="py-3 px-4 text-right">Balance</th>
                      <th className="py-3 px-4 text-center">Hens</th>
                      <th className="py-3 px-4 text-center">Eggs Inv</th>
                      <th className="py-3 px-4">Status</th>
                      <th className="py-3 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {usersList.map((u) => (
                      <tr key={u.id} className="hover:bg-slate-50/50">
                        <td className="py-3 px-4">
                          <div className="font-bold text-slate-900">{u.full_name}</div>
                          <div className="text-[11px] text-slate-400 font-mono">@{u.username} · Ref: {u.referral_code}</div>
                        </td>
                        <td className="py-3 px-4 font-mono text-slate-600">
                          {u.mobile}
                          {u.email && <div className="text-[10px] text-slate-400 font-sans">{u.email}</div>}
                        </td>
                        <td className="py-3 px-4 text-right font-mono font-bold text-emerald-800">
                          PKR {u.balance.toLocaleString()}
                        </td>
                        <td className="py-3 px-4 text-center font-mono font-bold">
                          {u.active_hens || 0}
                        </td>
                        <td className="py-3 px-4 text-center font-mono">
                          {u.current_eggs || 0}
                        </td>
                        <td className="py-3 px-4">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-semibold uppercase ${
                              u.status === 'active'
                                ? 'bg-emerald-100 text-emerald-800'
                                : 'bg-red-100 text-red-800'
                            }`}
                          >
                            {u.status}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right space-x-1 whitespace-nowrap">
                          <button
                            onClick={async () => {
                              const details = await api.getAdminUserDetails(u.id);
                              setSelectedUser(details);
                            }}
                            className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded text-[11px] font-medium cursor-pointer"
                          >
                            Details
                          </button>
                          <button
                            onClick={() => setBalanceModal({ open: true, userId: u.id, username: u.username })}
                            className="px-2 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 rounded text-[11px] font-medium cursor-pointer"
                          >
                            Adjust Rs
                          </button>
                          <button
                            onClick={() => handleToggleUserStatus(u.id, u.status)}
                            className={`px-2 py-1 rounded text-[11px] font-medium cursor-pointer ${
                              u.status === 'active'
                                ? 'bg-red-50 text-red-700 hover:bg-red-100'
                                : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                            }`}
                          >
                            {u.status === 'active' ? 'Suspend' : 'Activate'}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: HEN PURCHASES QUEUE */}
        {activeTab === 'hen_requests' && (
          <div className="space-y-4">
            {/* Filter buttons */}
            <div className="flex gap-2 text-xs">
              {(['pending', 'approved', 'rejected'] as const).map((st) => (
                <button
                  key={st}
                  onClick={() => setQueueStatusFilter(st)}
                  className={`px-3 py-1.5 rounded-lg capitalize font-semibold cursor-pointer ${
                    queueStatusFilter === st
                      ? 'bg-[#064E3B] text-white'
                      : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  {st} ({st === 'pending' ? analytics?.metrics?.pending_requests?.hens || 0 : ''})
                </button>
              ))}
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
              {henRequests.length === 0 ? (
                <p className="p-8 text-center text-xs text-slate-500">No {queueStatusFilter} hen purchase requests.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 uppercase font-semibold text-[11px]">
                      <tr>
                        <th className="py-3 px-4">Ref #</th>
                        <th className="py-3 px-4">Farmer</th>
                        <th className="py-3 px-4">Breed & Qty</th>
                        <th className="py-3 px-4 text-right">Total Amount</th>
                        <th className="py-3 px-4">Payment Method</th>
                        <th className="py-3 px-4">TID / Ref</th>
                        <th className="py-3 px-4 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {henRequests.map((hr) => (
                        <tr key={hr.id} className="hover:bg-slate-50/50">
                          <td className="py-3 px-4 font-mono font-medium">{hr.reference_no}</td>
                          <td className="py-3 px-4">
                            <span className="font-bold block text-slate-900">{hr.user_name}</span>
                            <span className="text-[11px] text-slate-400 font-mono">@{hr.username} · {hr.user_mobile}</span>
                          </td>
                          <td className="py-3 px-4">
                            <span className="font-bold">{hr.product_name}</span>
                            <div className="text-[11px] text-slate-500 font-mono">
                              Qty: {hr.quantity} (Stock Left: {hr.current_product_stock})
                            </div>
                          </td>
                          <td className="py-3 px-4 text-right font-mono font-bold text-emerald-800">
                            PKR {hr.total_amount.toLocaleString()}
                          </td>
                          <td className="py-3 px-4 capitalize font-medium text-slate-700">
                            {hr.payment_method.replace('_', ' ')}
                          </td>
                          <td className="py-3 px-4 font-mono text-slate-600">
                            {hr.payment_ref || 'N/A (Wallet)'}
                          </td>
                          <td className="py-3 px-4 text-right space-x-1.5 whitespace-nowrap">
                            {hr.status === 'pending' ? (
                              <>
                                <button
                                  onClick={() =>
                                    setActionModal({
                                      open: true,
                                      type: 'hen',
                                      id: hr.id,
                                      action: 'approve',
                                      title: `Approve Hen Order #${hr.reference_no}`,
                                      notes: 'Payment confirmed. Flock updated.',
                                    })
                                  }
                                  className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-[11px] font-bold cursor-pointer"
                                >
                                  Approve
                                </button>
                                <button
                                  onClick={() =>
                                    setActionModal({
                                      open: true,
                                      type: 'hen',
                                      id: hr.id,
                                      action: 'reject',
                                      title: `Reject Hen Order #${hr.reference_no}`,
                                      notes: 'Payment verification failed',
                                    })
                                  }
                                  className="px-2.5 py-1 bg-red-600 hover:bg-red-700 text-white rounded text-[11px] font-bold cursor-pointer"
                                >
                                  Reject
                                </button>
                              </>
                            ) : (
                              <span className="text-[11px] text-slate-400 font-mono capitalize">
                                {hr.status} by {hr.reviewed_by || 'system'}
                              </span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 4: EGG SALES QUEUE */}
        {activeTab === 'egg_requests' && (
          <div className="space-y-4">
            <div className="flex gap-2 text-xs">
              {(['pending', 'approved', 'rejected'] as const).map((st) => (
                <button
                  key={st}
                  onClick={() => setQueueStatusFilter(st)}
                  className={`px-3 py-1.5 rounded-lg capitalize font-semibold cursor-pointer ${
                    queueStatusFilter === st
                      ? 'bg-[#064E3B] text-white'
                      : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  {st}
                </button>
              ))}
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
              {eggRequests.length === 0 ? (
                <p className="p-8 text-center text-xs text-slate-500">No {queueStatusFilter} egg sale requests.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 uppercase font-semibold text-[11px]">
                      <tr>
                        <th className="py-3 px-4">Ref #</th>
                        <th className="py-3 px-4">Farmer</th>
                        <th className="py-3 px-4 text-center">Eggs Qty</th>
                        <th className="py-3 px-4 text-right">Rate</th>
                        <th className="py-3 px-4 text-right">Total Payout</th>
                        <th className="py-3 px-4">Destination</th>
                        <th className="py-3 px-4 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {eggRequests.map((er) => (
                        <tr key={er.id} className="hover:bg-slate-50/50">
                          <td className="py-3 px-4 font-mono font-medium">{er.reference_no}</td>
                          <td className="py-3 px-4">
                            <span className="font-bold block text-slate-900">{er.user_name}</span>
                            <span className="text-[11px] text-slate-400 font-mono">@{er.username} · {er.user_mobile}</span>
                          </td>
                          <td className="py-3 px-4 text-center font-mono font-bold text-amber-800">
                            {er.quantity} Eggs
                          </td>
                          <td className="py-3 px-4 text-right font-mono">Rs {er.unit_price}</td>
                          <td className="py-3 px-4 text-right font-mono font-bold text-emerald-800">
                            PKR {er.total_amount.toLocaleString()}
                          </td>
                          <td className="py-3 px-4 capitalize text-slate-700">
                            {er.payment_destination.replace('_', ' ')}
                            {er.account_details && <div className="text-[10px] text-slate-400">{er.account_details}</div>}
                          </td>
                          <td className="py-3 px-4 text-right space-x-1.5 whitespace-nowrap">
                            {er.status === 'pending' ? (
                              <>
                                <button
                                  onClick={() =>
                                    setActionModal({
                                      open: true,
                                      type: 'egg',
                                      id: er.id,
                                      action: 'approve',
                                      title: `Approve Egg Buyback #${er.reference_no}`,
                                      notes: 'Eggs received in inventory, wallet credited.',
                                    })
                                  }
                                  className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-[11px] font-bold cursor-pointer"
                                >
                                  Approve & Pay
                                </button>
                                <button
                                  onClick={() =>
                                    setActionModal({
                                      open: true,
                                      type: 'egg',
                                      id: er.id,
                                      action: 'reject',
                                      title: `Reject Egg Sale #${er.reference_no}`,
                                      notes: 'Damaged or unverified collection',
                                    })
                                  }
                                  className="px-2.5 py-1 bg-red-600 hover:bg-red-700 text-white rounded text-[11px] font-bold cursor-pointer"
                                >
                                  Reject & Return
                                </button>
                              </>
                            ) : (
                              <span className="text-[11px] text-slate-400 font-mono capitalize">
                                {er.status} by {er.reviewed_by || 'system'}
                              </span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 5: DEPOSITS QUEUE */}
        {activeTab === 'deposits' && (
          <div className="space-y-4">
            <div className="flex gap-2 text-xs">
              {(['pending', 'approved', 'rejected'] as const).map((st) => (
                <button
                  key={st}
                  onClick={() => setQueueStatusFilter(st)}
                  className={`px-3 py-1.5 rounded-lg capitalize font-semibold cursor-pointer ${
                    queueStatusFilter === st
                      ? 'bg-[#064E3B] text-white'
                      : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  {st}
                </button>
              ))}
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
              {depositRequests.length === 0 ? (
                <p className="p-8 text-center text-xs text-slate-500">No {queueStatusFilter} deposit requests.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 uppercase font-semibold text-[11px]">
                      <tr>
                        <th className="py-3 px-4">Ref #</th>
                        <th className="py-3 px-4">Farmer</th>
                        <th className="py-3 px-4 text-right">Amount</th>
                        <th className="py-3 px-4">Method</th>
                        <th className="py-3 px-4">Sender Info</th>
                        <th className="py-3 px-4">TID / Transaction ID</th>
                        <th className="py-3 px-4 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {depositRequests.map((dr) => (
                        <tr key={dr.id} className="hover:bg-slate-50/50">
                          <td className="py-3 px-4 font-mono font-medium">{dr.reference_no}</td>
                          <td className="py-3 px-4">
                            <span className="font-bold block text-slate-900">{dr.user_name}</span>
                            <span className="text-[11px] text-slate-400 font-mono">@{dr.username} · {dr.user_mobile}</span>
                          </td>
                          <td className="py-3 px-4 text-right font-mono font-bold text-emerald-800">
                            PKR {dr.amount.toLocaleString()}
                          </td>
                          <td className="py-3 px-4 capitalize font-medium text-slate-700">
                            {dr.payment_method.replace('_', ' ')}
                          </td>
                          <td className="py-3 px-4 text-slate-600">
                            {dr.sender_name} ({dr.sender_account || '—'})
                          </td>
                          <td className="py-3 px-4 font-mono font-bold text-slate-900 bg-slate-50 px-2 py-1 rounded inline-block">
                            {dr.transaction_ref}
                          </td>
                          <td className="py-3 px-4 text-right space-x-1.5 whitespace-nowrap">
                            {dr.status === 'pending' ? (
                              <>
                                <button
                                  onClick={() =>
                                    setActionModal({
                                      open: true,
                                      type: 'deposit',
                                      id: dr.id,
                                      action: 'approve',
                                      title: `Approve Deposit PKR ${dr.amount} (TID: ${dr.transaction_ref})`,
                                      notes: 'Bank transfer verified and credited.',
                                    })
                                  }
                                  className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-[11px] font-bold cursor-pointer"
                                >
                                  Credit Balance
                                </button>
                                <button
                                  onClick={() =>
                                    setActionModal({
                                      open: true,
                                      type: 'deposit',
                                      id: dr.id,
                                      action: 'reject',
                                      title: `Reject Deposit #${dr.reference_no}`,
                                      notes: 'TID invalid or funds not received',
                                    })
                                  }
                                  className="px-2.5 py-1 bg-red-600 hover:bg-red-700 text-white rounded text-[11px] font-bold cursor-pointer"
                                >
                                  Reject
                                </button>
                              </>
                            ) : (
                              <span className="text-[11px] text-slate-400 font-mono capitalize">
                                {dr.status} by {dr.reviewed_by || 'system'}
                              </span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 6: WITHDRAWALS QUEUE */}
        {activeTab === 'withdrawals' && (
          <div className="space-y-4">
            <div className="flex gap-2 text-xs">
              {(['pending', 'approved', 'rejected'] as const).map((st) => (
                <button
                  key={st}
                  onClick={() => setQueueStatusFilter(st)}
                  className={`px-3 py-1.5 rounded-lg capitalize font-semibold cursor-pointer ${
                    queueStatusFilter === st
                      ? 'bg-[#064E3B] text-white'
                      : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  {st}
                </button>
              ))}
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
              {withdrawalRequests.length === 0 ? (
                <p className="p-8 text-center text-xs text-slate-500">No {queueStatusFilter} withdrawal requests.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 uppercase font-semibold text-[11px]">
                      <tr>
                        <th className="py-3 px-4">Ref #</th>
                        <th className="py-3 px-4">Farmer</th>
                        <th className="py-3 px-4 text-right">Amount</th>
                        <th className="py-3 px-4">Method</th>
                        <th className="py-3 px-4">Account Title & Number</th>
                        <th className="py-3 px-4 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {withdrawalRequests.map((wr) => (
                        <tr key={wr.id} className="hover:bg-slate-50/50">
                          <td className="py-3 px-4 font-mono font-medium">{wr.reference_no}</td>
                          <td className="py-3 px-4">
                            <span className="font-bold block text-slate-900">{wr.user_name}</span>
                            <span className="text-[11px] text-slate-400 font-mono">@{wr.username} · {wr.user_mobile}</span>
                          </td>
                          <td className="py-3 px-4 text-right font-mono font-bold text-slate-900">
                            PKR {wr.amount.toLocaleString()}
                          </td>
                          <td className="py-3 px-4 capitalize font-medium text-slate-700">
                            {wr.payment_method.replace('_', ' ')}
                          </td>
                          <td className="py-3 px-4 text-slate-700 font-mono">
                            <div className="font-bold">{wr.account_title}</div>
                            <div className="text-[11px] text-slate-500">{wr.account_number}</div>
                          </td>
                          <td className="py-3 px-4 text-right space-x-1.5 whitespace-nowrap">
                            {wr.status === 'pending' ? (
                              <>
                                <button
                                  onClick={() =>
                                    setActionModal({
                                      open: true,
                                      type: 'withdrawal',
                                      id: wr.id,
                                      action: 'approve',
                                      title: `Approve Payout of PKR ${wr.amount} to ${wr.account_title}`,
                                      notes: 'Funds disbursed via online banking',
                                    })
                                  }
                                  className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-[11px] font-bold cursor-pointer"
                                >
                                  Mark Disbursed
                                </button>
                                <button
                                  onClick={() =>
                                    setActionModal({
                                      open: true,
                                      type: 'withdrawal',
                                      id: wr.id,
                                      action: 'reject',
                                      title: `Reject Withdrawal #${wr.reference_no}`,
                                      notes: 'Account title mismatch or incorrect account info',
                                    })
                                  }
                                  className="px-2.5 py-1 bg-red-600 hover:bg-red-700 text-white rounded text-[11px] font-bold cursor-pointer"
                                >
                                  Reject & Refund
                                </button>
                              </>
                            ) : (
                              <span className="text-[11px] text-slate-400 font-mono capitalize">
                                {wr.status} by {wr.reviewed_by || 'system'}
                              </span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 7: HEN PRODUCTS & PRICES */}
        {activeTab === 'products' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-slate-900">Hen Breeds & Live Inventory</h3>
                <p className="text-xs text-slate-500">Configure prices in PKR, stock, and lay rates</p>
              </div>
              <button
                onClick={() => {
                  setEditingProduct({
                    id: 0,
                    name: '',
                    breed: '',
                    description: '',
                    price: 2000,
                    stock: 50,
                    eggs_per_day: 1,
                    image_url: '/src/assets/images/golden_misri_hen_1790910506803.jpg',
                    is_active: 1,
                  });
                  setProductModalOpen(true);
                }}
                className="px-3.5 py-2 bg-[#064E3B] text-white rounded-lg text-xs font-bold flex items-center gap-1.5 cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Add New Hen Breed</span>
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {productsList.map((prod) => (
                <div key={prod.id} className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden flex flex-col justify-between">
                  <div>
                    <div className="h-36 overflow-hidden bg-slate-100 relative">
                      <img
                        src={prod.image_url}
                        alt={prod.name}
                        referrerPolicy="no-referrer"
                        className="w-full h-full object-cover"
                      />
                      <span className={`absolute top-2 right-2 px-2 py-0.5 rounded text-[10px] font-bold ${
                        prod.is_active ? 'bg-emerald-800 text-white' : 'bg-slate-800 text-slate-300'
                      }`}>
                        {prod.is_active ? 'ACTIVE' : 'ARCHIVED'}
                      </span>
                    </div>

                    <div className="p-4 space-y-1.5">
                      <span className="text-[11px] font-semibold text-emerald-800">{prod.breed}</span>
                      <h4 className="text-sm font-bold text-slate-900">{prod.name}</h4>
                      <p className="text-xs text-slate-500 line-clamp-2">{prod.description}</p>
                      <div className="pt-2 flex justify-between text-xs font-mono font-bold text-slate-800">
                        <span>Price: PKR {prod.price.toLocaleString()}</span>
                        <span>Stock: {prod.stock}</span>
                      </div>
                    </div>
                  </div>

                  <div className="p-4 pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
                    <button
                      onClick={() => {
                        setEditingProduct(prod);
                        setProductModalOpen(true);
                      }}
                      className="text-emerald-700 hover:text-emerald-950 font-semibold flex items-center gap-1 cursor-pointer"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                      <span>Edit Breed</span>
                    </button>
                    {prod.is_active === 1 && (
                      <button
                        onClick={async () => {
                          if (confirm(`Archive ${prod.name}?`)) {
                            await api.archiveProduct(prod.id);
                            loadProducts();
                          }
                        }}
                        className="text-red-600 hover:text-red-800 font-semibold flex items-center gap-1 cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Archive</span>
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 8: SETTINGS & COMPLIANCE */}
        {activeTab === 'settings' && (
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs">
            <h3 className="text-base font-bold text-slate-900 mb-1">Global System Configuration</h3>
            <p className="text-xs text-slate-500 mb-6">
              These settings control pricing, collection timers, statutory FBR/SECP filings, and payment coordinates across the entire application.
            </p>

            <form onSubmit={handleSaveSettings} className="space-y-6">
              {/* Core Commercial Settings */}
              <div>
                <h4 className="text-xs font-bold text-emerald-900 uppercase tracking-wider mb-3">
                  1. Commercial & Egg Rules
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="text-xs font-semibold text-slate-700 block mb-1">
                      Egg Buyback Price (PKR / piece) *
                    </label>
                    <input
                      type="number"
                      required
                      value={siteSettings.egg_sell_price || '35'}
                      onChange={(e) => setSiteSettings({ ...siteSettings, egg_sell_price: e.target.value })}
                      className="w-full px-3 py-2 text-xs font-mono font-bold border border-slate-300 rounded-lg focus:outline-none focus:border-emerald-600"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-slate-700 block mb-1">
                      Collection Interval (Hours) *
                    </label>
                    <input
                      type="number"
                      required
                      value={siteSettings.collection_interval_hours || '12'}
                      onChange={(e) => setSiteSettings({ ...siteSettings, collection_interval_hours: e.target.value })}
                      className="w-full px-3 py-2 text-xs font-mono font-bold border border-slate-300 rounded-lg focus:outline-none focus:border-emerald-600"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-slate-700 block mb-1">
                      Referral Bonus (PKR)
                    </label>
                    <input
                      type="number"
                      required
                      value={siteSettings.referral_bonus_pkr || '100'}
                      onChange={(e) => setSiteSettings({ ...siteSettings, referral_bonus_pkr: e.target.value })}
                      className="w-full px-3 py-2 text-xs font-mono font-bold border border-slate-300 rounded-lg focus:outline-none focus:border-emerald-600"
                    />
                  </div>
                </div>
              </div>

              {/* Bank & Mobile Wallet Coordinates */}
              <div>
                <h4 className="text-xs font-bold text-emerald-900 uppercase tracking-wider mb-3">
                  2. Official Deposit Accounts
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                  <div>
                    <label className="font-semibold text-slate-700 block mb-1">Bank Name</label>
                    <input
                      type="text"
                      value={siteSettings.bank_name || ''}
                      onChange={(e) => setSiteSettings({ ...siteSettings, bank_name: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="font-semibold text-slate-700 block mb-1">Bank Account Title</label>
                    <input
                      type="text"
                      value={siteSettings.bank_title || ''}
                      onChange={(e) => setSiteSettings({ ...siteSettings, bank_title: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="font-semibold text-slate-700 block mb-1">Account Number</label>
                    <input
                      type="text"
                      value={siteSettings.bank_account || ''}
                      onChange={(e) => setSiteSettings({ ...siteSettings, bank_account: e.target.value })}
                      className="w-full px-3 py-2 font-mono border border-slate-300 rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="font-semibold text-slate-700 block mb-1">IBAN</label>
                    <input
                      type="text"
                      value={siteSettings.bank_iban || ''}
                      onChange={(e) => setSiteSettings({ ...siteSettings, bank_iban: e.target.value })}
                      className="w-full px-3 py-2 font-mono border border-slate-300 rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="font-semibold text-slate-700 block mb-1">EasyPaisa Account</label>
                    <input
                      type="text"
                      value={siteSettings.easypaisa_no || ''}
                      onChange={(e) => setSiteSettings({ ...siteSettings, easypaisa_no: e.target.value })}
                      className="w-full px-3 py-2 font-mono border border-slate-300 rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="font-semibold text-slate-700 block mb-1">JazzCash Account</label>
                    <input
                      type="text"
                      value={siteSettings.jazzcash_no || ''}
                      onChange={(e) => setSiteSettings({ ...siteSettings, jazzcash_no: e.target.value })}
                      className="w-full px-3 py-2 font-mono border border-slate-300 rounded-lg"
                    />
                  </div>
                </div>
              </div>

              {/* FBR & SECP Statutory Records */}
              <div>
                <h4 className="text-xs font-bold text-emerald-900 uppercase tracking-wider mb-3">
                  3. Verified Regulatory Documents
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                  <div>
                    <label className="font-semibold text-slate-700 block mb-1">FBR NTN Number</label>
                    <input
                      type="text"
                      value={siteSettings.fbr_ntn || ''}
                      onChange={(e) => setSiteSettings({ ...siteSettings, fbr_ntn: e.target.value })}
                      className="w-full px-3 py-2 font-mono border border-slate-300 rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="font-semibold text-slate-700 block mb-1">SECP Registration CUIN</label>
                    <input
                      type="text"
                      value={siteSettings.secp_reg_no || ''}
                      onChange={(e) => setSiteSettings({ ...siteSettings, secp_reg_no: e.target.value })}
                      className="w-full px-3 py-2 font-mono border border-slate-300 rounded-lg"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="font-semibold text-slate-700 block mb-1">FBR Tax Exemption Statement</label>
                    <textarea
                      rows={2}
                      value={siteSettings.fbr_info || ''}
                      onChange={(e) => setSiteSettings({ ...siteSettings, fbr_info: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                    />
                  </div>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="px-6 py-2.5 bg-[#064E3B] hover:bg-[#053F30] text-white font-bold rounded-xl text-xs transition-colors cursor-pointer"
              >
                {loading ? 'Saving...' : 'Save Settings to Database'}
              </button>
            </form>
          </div>
        )}

        {/* TAB 9: SUPPORT HELPDESK */}
        {activeTab === 'support' && (
          <div className="space-y-4">
            <h3 className="text-base font-bold text-slate-900">User Inquiries & Helpdesk Tickets</h3>
            <div className="space-y-3">
              {supportTickets.map((t) => (
                <div key={t.id} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="font-bold text-slate-900">{t.subject}</span>
                      <div className="text-[11px] text-slate-400 font-mono">
                        By {t.user_name} (@{t.username}) · {t.user_mobile} · Priority: {t.priority}
                      </div>
                    </div>
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-semibold uppercase ${
                        t.status === 'resolved' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                      }`}
                    >
                      {t.status}
                    </span>
                  </div>

                  <p className="text-xs text-slate-700 bg-slate-50 p-3 rounded-lg border border-slate-100">
                    {t.message}
                  </p>

                  {t.admin_reply && (
                    <div className="p-3 bg-emerald-50 rounded-lg border border-emerald-200 text-xs text-emerald-900">
                      <span className="font-bold block mb-0.5">Admin Response:</span>
                      <p>{t.admin_reply}</p>
                    </div>
                  )}

                  {t.status !== 'resolved' && (
                    <div className="pt-2 flex gap-2">
                      {replyTicketId === t.id ? (
                        <div className="w-full space-y-2">
                          <textarea
                            rows={2}
                            placeholder="Type administrator response..."
                            value={replyText}
                            onChange={(e) => setReplyText(e.target.value)}
                            className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-lg"
                          />
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleReplyTicket(t.id)}
                              className="px-3 py-1 bg-emerald-700 text-white rounded text-xs font-semibold"
                            >
                              Submit Reply
                            </button>
                            <button
                              onClick={() => { setReplyTicketId(null); setReplyText(''); }}
                              className="px-3 py-1 bg-slate-100 text-slate-700 rounded text-xs"
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      ) : (
                        <button
                          onClick={() => { setReplyTicketId(t.id); setReplyText(''); }}
                          className="px-3 py-1 bg-emerald-800 text-white rounded text-xs font-semibold"
                        >
                          Reply to Ticket
                        </button>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 10: AUDIT LOGS */}
        {activeTab === 'audit' && (
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
            <div className="p-4 border-b border-slate-200">
              <h3 className="text-sm font-bold text-slate-900">Immutable Administrative Audit Log</h3>
              <p className="text-xs text-slate-500">Every sensitive admin action is logged permanently.</p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 uppercase font-semibold text-[11px]">
                  <tr>
                    <th className="py-2.5 px-4">Timestamp</th>
                    <th className="py-2.5 px-4">Admin</th>
                    <th className="py-2.5 px-4">Action</th>
                    <th className="py-2.5 px-4">Target</th>
                    <th className="py-2.5 px-4">Audit Details</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-mono text-[11px]">
                  {auditLogs.map((log) => (
                    <tr key={log.id} className="hover:bg-slate-50/50">
                      <td className="py-2.5 px-4 text-slate-500">{new Date(log.created_at).toLocaleString()}</td>
                      <td className="py-2.5 px-4 font-bold text-slate-900">{log.admin_username}</td>
                      <td className="py-2.5 px-4 font-semibold text-emerald-800">{log.action}</td>
                      <td className="py-2.5 px-4 text-slate-600">{log.target_type} #{log.target_id}</td>
                      <td className="py-2.5 px-4 font-sans text-xs text-slate-700">{log.details}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ACTION CONFIRMATION MODAL */}
        {actionModal.open && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs">
            <div className="w-full max-w-md bg-white rounded-2xl p-6 shadow-2xl space-y-4">
              <h3 className="text-base font-bold text-slate-900">{actionModal.title}</h3>
              <p className="text-xs text-slate-600">
                Are you sure you want to <strong>{actionModal.action}</strong> this request? This action will immediately adjust inventory, balances, and audit records.
              </p>

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">
                  Reason / Administrative Note:
                </label>
                <input
                  type="text"
                  value={actionModal.notes}
                  onChange={(e) => setActionModal({ ...actionModal, notes: e.target.value })}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:border-emerald-600"
                />
              </div>

              <div className="flex gap-2 justify-end pt-2">
                <button
                  onClick={() => setActionModal({ ...actionModal, open: false })}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-lg text-xs"
                >
                  Cancel
                </button>
                <button
                  onClick={handleActionConfirm}
                  disabled={loading}
                  className={`px-4 py-2 text-white font-bold rounded-lg text-xs ${
                    actionModal.action === 'approve'
                      ? 'bg-emerald-700 hover:bg-emerald-800'
                      : 'bg-red-600 hover:bg-red-700'
                  }`}
                >
                  {loading ? 'Processing...' : `Confirm ${actionModal.action}`}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* BALANCE ADJUSTMENT MODAL */}
        {balanceModal.open && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs">
            <form onSubmit={handleBalanceAdjustment} className="w-full max-w-md bg-white rounded-2xl p-6 shadow-2xl space-y-4">
              <h3 className="text-base font-bold text-slate-900">
                Adjust Wallet Balance for @{balanceModal.username}
              </h3>

              <div className="flex gap-4">
                <label className="flex items-center gap-1.5 text-xs font-semibold cursor-pointer">
                  <input
                    type="radio"
                    name="adjType"
                    checked={adjustType === 'credit'}
                    onChange={() => setAdjustType('credit')}
                  />
                  <span>Credit (+) Add Funds</span>
                </label>
                <label className="flex items-center gap-1.5 text-xs font-semibold cursor-pointer">
                  <input
                    type="radio"
                    name="adjType"
                    checked={adjustType === 'debit'}
                    onChange={() => setAdjustType('debit')}
                  />
                  <span>Debit (-) Deduct Funds</span>
                </label>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">
                  Amount in PKR *
                </label>
                <input
                  type="number"
                  min={1}
                  required
                  value={adjustAmount}
                  onChange={(e) => setAdjustAmount(parseInt(e.target.value, 10) || 0)}
                  className="w-full px-3 py-2 text-xs font-mono font-bold border border-slate-300 rounded-lg"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">
                  Reason for Adjustment (Required for Audit Trail) *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Bank adjustment reference #48291"
                  value={adjustReason}
                  onChange={(e) => setAdjustReason(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg"
                />
              </div>

              <div className="flex gap-2 justify-end pt-2">
                <button
                  type="button"
                  onClick={() => setBalanceModal({ open: false, userId: 0, username: '' })}
                  className="px-4 py-2 bg-slate-100 text-slate-700 rounded-lg text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#064E3B] text-white font-bold rounded-lg text-xs"
                >
                  Save Adjustment
                </button>
              </div>
            </form>
          </div>
        )}

        {/* USER DETAILS DRAWER / MODAL */}
        {selectedUser && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs">
            <div className="w-full max-w-2xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden max-h-[85vh] flex flex-col">
              <div className="bg-[#064E3B] px-6 py-4 text-white flex items-center justify-between shrink-0">
                <div>
                  <h3 className="text-base font-bold">{selectedUser.user.full_name}</h3>
                  <p className="text-xs text-emerald-200 font-mono">
                    @{selectedUser.user.username} · {selectedUser.user.mobile}
                  </p>
                </div>
                <button
                  onClick={() => setSelectedUser(null)}
                  className="p-1 rounded-lg text-emerald-200 hover:text-white hover:bg-emerald-800"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-6 space-y-4 overflow-y-auto text-xs">
                <div className="grid grid-cols-3 gap-3">
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                    <span className="text-slate-400 block">Balance</span>
                    <span className="text-sm font-bold font-mono text-emerald-800">
                      PKR {selectedUser.user.balance.toLocaleString()}
                    </span>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                    <span className="text-slate-400 block">Status</span>
                    <span className="text-sm font-bold capitalize">{selectedUser.user.status}</span>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                    <span className="text-slate-400 block">Eggs in Inv</span>
                    <span className="text-sm font-bold font-mono">
                      {selectedUser.egg_inventory?.current_eggs || 0}
                    </span>
                  </div>
                </div>

                <div>
                  <h4 className="font-bold text-slate-900 mb-2">Hens Owned in Coop</h4>
                  {selectedUser.hens.length === 0 ? (
                    <p className="text-slate-400">No hens purchased yet.</p>
                  ) : (
                    <div className="space-y-1.5">
                      {selectedUser.hens.map((h: any) => (
                        <div key={h.id} className="p-2.5 bg-slate-50 rounded-lg flex justify-between font-mono">
                          <span className="font-sans font-medium">{h.breed_name}</span>
                          <span className="font-bold">Qty: {h.quantity}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div>
                  <h4 className="font-bold text-slate-900 mb-2">Recent Account Transactions</h4>
                  <div className="max-h-40 overflow-y-auto space-y-1">
                    {selectedUser.transactions.map((t: any) => (
                      <div key={t.id} className="p-2 bg-slate-50 rounded flex justify-between text-[11px] font-mono">
                        <span className="truncate max-w-xs">{t.description}</span>
                        <span className={t.amount > 0 ? 'text-emerald-700 font-bold' : 'text-slate-800'}>
                          PKR {t.amount.toLocaleString()}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* PRODUCT ADD / EDIT MODAL */}
        {productModalOpen && editingProduct && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs">
            <form
              onSubmit={async (e) => {
                e.preventDefault();
                try {
                  if (editingProduct.id === 0) {
                    await api.createProduct(editingProduct);
                  } else {
                    await api.updateProduct(editingProduct.id, editingProduct);
                  }
                  setProductModalOpen(false);
                  loadProducts();
                } catch (err: any) {
                  alert(err.message);
                }
              }}
              className="w-full max-w-md bg-white rounded-2xl p-6 shadow-2xl space-y-3 text-xs"
            >
              <h3 className="text-base font-bold text-slate-900">
                {editingProduct.id === 0 ? 'Add New Hen Breed' : `Edit ${editingProduct.name}`}
              </h3>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Breed Name *</label>
                <input
                  type="text"
                  required
                  value={editingProduct.name}
                  onChange={(e) => setEditingProduct({ ...editingProduct, name: e.target.value })}
                  className="w-full px-3 py-1.5 border border-slate-300 rounded-lg"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Breed Type / Origin *</label>
                <input
                  type="text"
                  required
                  value={editingProduct.breed}
                  onChange={(e) => setEditingProduct({ ...editingProduct, breed: e.target.value })}
                  className="w-full px-3 py-1.5 border border-slate-300 rounded-lg"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Description</label>
                <textarea
                  rows={2}
                  value={editingProduct.description}
                  onChange={(e) => setEditingProduct({ ...editingProduct, description: e.target.value })}
                  className="w-full px-3 py-1.5 border border-slate-300 rounded-lg"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Price (PKR) *</label>
                  <input
                    type="number"
                    required
                    value={editingProduct.price}
                    onChange={(e) => setEditingProduct({ ...editingProduct, price: parseInt(e.target.value, 10) || 0 })}
                    className="w-full px-3 py-1.5 font-mono border border-slate-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Stock Quantity *</label>
                  <input
                    type="number"
                    required
                    value={editingProduct.stock}
                    onChange={(e) => setEditingProduct({ ...editingProduct, stock: parseInt(e.target.value, 10) || 0 })}
                    className="w-full px-3 py-1.5 font-mono border border-slate-300 rounded-lg"
                  />
                </div>
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Image URL / Path</label>
                <input
                  type="text"
                  value={editingProduct.image_url}
                  onChange={(e) => setEditingProduct({ ...editingProduct, image_url: e.target.value })}
                  className="w-full px-3 py-1.5 font-mono border border-slate-300 rounded-lg"
                />
              </div>

              <div className="flex gap-2 justify-end pt-3">
                <button
                  type="button"
                  onClick={() => setProductModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 rounded-lg font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#064E3B] text-white font-bold rounded-lg"
                >
                  Save Breed
                </button>
              </div>
            </form>
          </div>
        )}
      </main>
    </div>
  );
};
