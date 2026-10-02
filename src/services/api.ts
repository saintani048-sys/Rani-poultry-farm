// API Client for Noorani Poultry Farm

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = localStorage.getItem('npf_token');
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string> || {}),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(endpoint, {
    ...options,
    headers,
  });

  const data = await response.json().catch(() => ({ error: 'Invalid response from server' }));

  if (!response.ok) {
    throw new Error(data.error || 'Server request failed');
  }

  return data as T;
}

export const api = {
  // Public
  getPublicSettings: () => request<Record<string, string>>('/api/public/settings'),
  getPublicProducts: () => request<any[]>('/api/public/hen-products'),
  getPublicStats: () => request<any>('/api/public/stats'),
  getRegulatoryInfo: () => request<any>('/api/public/regulatory-info'),

  // Auth
  register: (body: any) => request<any>('/api/auth/register', { method: 'POST', body: JSON.stringify(body) }),
  login: (body: any) => request<any>('/api/auth/login', { method: 'POST', body: JSON.stringify(body) }),
  adminLogin: (body: any) => request<any>('/api/auth/admin-login', { method: 'POST', body: JSON.stringify(body) }),
  getMe: () => request<any>('/api/auth/me'),
  logout: () => request<any>('/api/auth/logout', { method: 'POST' }),
  resetPassword: (body: any) => request<any>('/api/auth/reset-password', { method: 'POST', body: JSON.stringify(body) }),
  changePassword: (body: any) => request<any>('/api/auth/change-password', { method: 'POST', body: JSON.stringify(body) }),
  updateProfile: (body: any) => request<any>('/api/auth/profile', { method: 'PUT', body: JSON.stringify(body) }),

  // User
  getDashboardSummary: () => request<any>('/api/user/dashboard-summary'),
  getHenProducts: () => request<any[]>('/api/user/hen-products'),
  buyHen: (body: any) => request<any>('/api/user/buy-hen', { method: 'POST', body: JSON.stringify(body) }),
  getHenPurchases: () => request<any[]>('/api/user/hen-purchases'),
  getMyHens: () => request<any[]>('/api/user/my-hens'),
  getEggCollectionStatus: () => request<any>('/api/user/egg-collection-status'),
  collectEggs: () => request<any>('/api/user/collect-eggs', { method: 'POST' }),
  getSellEggsStatus: () => request<any>('/api/user/sell-eggs-status'),
  sellEggs: (body: any) => request<any>('/api/user/sell-eggs', { method: 'POST', body: JSON.stringify(body) }),
  deposit: (body: any) => request<any>('/api/user/deposit', { method: 'POST', body: JSON.stringify(body) }),
  getDeposits: () => request<any[]>('/api/user/deposits'),
  withdraw: (body: any) => request<any>('/api/user/withdraw', { method: 'POST', body: JSON.stringify(body) }),
  getWithdrawals: () => request<any[]>('/api/user/withdrawals'),
  getTransactions: () => request<any[]>('/api/user/transactions'),
  getReferrals: () => request<any>('/api/user/referrals'),
  submitSupportTicket: (body: any) => request<any>('/api/user/support-ticket', { method: 'POST', body: JSON.stringify(body) }),
  getSupportTickets: () => request<any[]>('/api/user/support-tickets'),

  // Admin
  getAdminAnalytics: () => request<any>('/api/admin/analytics'),
  getAdminUsers: (search?: string) => request<any[]>(`/api/admin/users${search ? `?search=${encodeURIComponent(search)}` : ''}`),
  getAdminUserDetails: (id: number) => request<any>(`/api/admin/users/${id}`),
  updateUserStatus: (id: number, status: string, reason?: string) =>
    request<any>(`/api/admin/users/${id}/status`, { method: 'PUT', body: JSON.stringify({ status, reason }) }),
  adjustUserBalance: (id: number, amount: number, type: 'credit' | 'debit', reason: string) =>
    request<any>(`/api/admin/users/${id}/adjust-balance`, { method: 'POST', body: JSON.stringify({ amount, type, reason }) }),
  getAdminHenRequests: (status = 'pending') => request<any[]>(`/api/admin/requests/hens?status=${status}`),
  handleHenRequest: (id: number, action: 'approve' | 'reject', notes?: string) =>
    request<any>(`/api/admin/requests/hens/${id}/action`, { method: 'POST', body: JSON.stringify({ action, notes }) }),
  getAdminEggRequests: (status = 'pending') => request<any[]>(`/api/admin/requests/eggs?status=${status}`),
  handleEggRequest: (id: number, action: 'approve' | 'reject', notes?: string) =>
    request<any>(`/api/admin/requests/eggs/${id}/action`, { method: 'POST', body: JSON.stringify({ action, notes }) }),
  getAdminDeposits: (status = 'pending') => request<any[]>(`/api/admin/requests/deposits?status=${status}`),
  handleDeposit: (id: number, action: 'approve' | 'reject', notes?: string) =>
    request<any>(`/api/admin/requests/deposits/${id}/action`, { method: 'POST', body: JSON.stringify({ action, notes }) }),
  getAdminWithdrawals: (status = 'pending') => request<any[]>(`/api/admin/requests/withdrawals?status=${status}`),
  handleWithdrawal: (id: number, action: 'approve' | 'reject', notes?: string) =>
    request<any>(`/api/admin/requests/withdrawals/${id}/action`, { method: 'POST', body: JSON.stringify({ action, notes }) }),
  getAdminProducts: () => request<any[]>('/api/admin/products'),
  createProduct: (body: any) => request<any>('/api/admin/products', { method: 'POST', body: JSON.stringify(body) }),
  updateProduct: (id: number, body: any) => request<any>(`/api/admin/products/${id}`, { method: 'PUT', body: JSON.stringify(body) }),
  archiveProduct: (id: number) => request<any>(`/api/admin/products/${id}`, { method: 'DELETE' }),
  getAdminSettings: () => request<Record<string, string>>('/api/admin/settings'),
  updateAdminSettings: (body: Record<string, string>) => request<any>('/api/admin/settings', { method: 'PUT', body: JSON.stringify(body) }),
  getAdminAuditLogs: () => request<any[]>('/api/admin/audit-logs'),
  getAdminSupportTickets: () => request<any[]>('/api/admin/support-tickets'),
  replySupportTicket: (id: number, reply: string, status = 'resolved') =>
    request<any>(`/api/admin/support-tickets/${id}/reply`, { method: 'POST', body: JSON.stringify({ reply, status }) }),
};
