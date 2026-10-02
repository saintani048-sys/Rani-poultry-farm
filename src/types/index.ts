export interface User {
  id: number;
  full_name: string;
  username: string;
  mobile: string;
  email?: string;
  role: 'user' | 'admin';
  balance: number;
  status: 'active' | 'suspended';
  status_reason?: string;
  referral_code: string;
  created_at?: string;
  total_hens?: number;
  current_eggs?: number;
  total_eggs_collected?: number;
  total_eggs_sold?: number;
}

export interface HenProduct {
  id: number;
  name: string;
  breed: string;
  description: string;
  price: number;
  stock: number;
  eggs_per_day: number;
  image_url: string;
  is_active: number;
}

export interface UserHen {
  id: number;
  quantity: number;
  purchased_at: string;
  last_collected_at: string;
  status: string;
  name: string;
  breed: string;
  description?: string;
  eggs_per_day: number;
  image_url: string;
}

export interface HenPurchase {
  id: number;
  reference_no: string;
  user_id: number;
  product_id: number;
  product_name?: string;
  product_breed?: string;
  product_image?: string;
  user_name?: string;
  username?: string;
  user_mobile?: string;
  user_balance?: number;
  quantity: number;
  unit_price: number;
  total_amount: number;
  payment_method: string;
  payment_ref?: string;
  payment_proof?: string;
  status: 'pending' | 'approved' | 'rejected' | 'cancelled';
  admin_notes?: string;
  created_at: string;
  reviewed_at?: string;
  reviewed_by?: string;
}

export interface EggSale {
  id: number;
  reference_no: string;
  user_id: number;
  user_name?: string;
  username?: string;
  user_mobile?: string;
  quantity: number;
  unit_price: number;
  total_amount: number;
  payment_destination: string;
  account_details?: string;
  status: 'pending' | 'approved' | 'rejected';
  admin_notes?: string;
  created_at: string;
  reviewed_at?: string;
  reviewed_by?: string;
}

export interface Transaction {
  id: number;
  reference_no: string;
  user_id: number;
  type: 'deposit' | 'withdrawal' | 'hen_purchase' | 'egg_sale' | 'referral_bonus' | 'admin_adjustment';
  amount: number;
  balance_before: number;
  balance_after: number;
  status: 'pending' | 'completed' | 'failed';
  description: string;
  related_reference?: string;
  processed_by?: string;
  created_at: string;
}

export interface DepositRequest {
  id: number;
  reference_no: string;
  user_id: number;
  user_name?: string;
  username?: string;
  user_mobile?: string;
  amount: number;
  payment_method: string;
  sender_account?: string;
  sender_name?: string;
  transaction_ref: string;
  proof_image?: string;
  status: 'pending' | 'approved' | 'rejected';
  admin_notes?: string;
  created_at: string;
  reviewed_at?: string;
  reviewed_by?: string;
}

export interface WithdrawalRequest {
  id: number;
  reference_no: string;
  user_id: number;
  user_name?: string;
  username?: string;
  user_mobile?: string;
  amount: number;
  payment_method: string;
  account_title: string;
  account_number: string;
  status: 'pending' | 'approved' | 'rejected';
  admin_notes?: string;
  created_at: string;
  reviewed_at?: string;
  reviewed_by?: string;
}

export interface SupportTicket {
  id: number;
  user_id: number;
  user_name?: string;
  username?: string;
  user_mobile?: string;
  subject: string;
  message: string;
  priority: 'low' | 'medium' | 'high';
  status: 'open' | 'in_progress' | 'resolved' | 'closed';
  admin_reply?: string;
  replied_at?: string;
  created_at: string;
}

export interface AuditLog {
  id: number;
  admin_id: number;
  admin_username: string;
  action: string;
  target_type: string;
  target_id: string;
  details: string;
  created_at: string;
}

export interface FarmStats {
  registered_farmers: number;
  active_hens_flock: number;
  total_eggs_collected: number;
  verified_transactions: number;
  available_hen_stock: number;
}
