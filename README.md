# Noorani Poultry Farm — Complete Management Web Application

Professional, modern, responsive poultry livestock and commercial egg management application with integrated user website, live transaction ledger, and administrative analytics panel.

---

## 1. Technology Stack

- **Frontend**: React 19, TypeScript, Tailwind CSS, Lucide Icons, Chart.js (`react-chartjs-2`).
- **Backend**: Node.js v22 with Express.js full-stack server architecture.
- **Database**: Native SQLite engine (`node:sqlite`) with Write-Ahead Logging (WAL) and ACID transactions stored persistently on disk (`./data/noorani_poultry.db`).
- **Authentication**: Salted Bcrypt password hashing, signed JSON Web Tokens (JWT), HTTP-only cookies, role-based authorization guards.
- **Visual Assets**: High-fidelity custom farm and hen breed images generated via Google Imagen models.

---

## 2. Credentials & Initial Setup

### Default Administrator Credentials
- **Username**: `admin`
- **Password**: `AdminPassword123!`
- **Role**: `admin`
- **Access URL**: Click "Admin" on the login modal or navigate to `/` and select Admin Login.

### Farmer Demo Accounts
Visitors can immediately create their own accounts via the registration form with full name, username, mobile number, and password, or use any created test farmer.

---

## 3. Core Modules & Workflows

### A. Public Landing Page
- Rich agricultural hero banner with clean 3-zone Top Bar Contract.
- Real-time farm statistics loaded dynamically from the live database.
- Hen breed catalog showcasing Golden Misri, Black Australorp, Desi Aseel, and RIR.
- Transparent statutory disclosures: Federal Board of Revenue (FBR NTN: 7849201-4) and SECP Corporate Registration (CUIN: 0194823).
- Step-by-step how-it-works guide and interactive FAQs.

### B. User Dashboard (Reference 1 Design)
- **Personalized Welcome Banner**: Greets member, shows username, mobile, and 1-click referral copy.
- **Wallet & Balances**: Displays verified balance, deposits, withdrawals, and quick deposit/withdraw modals.
- **The 8 Core Feature Cards**:
  1. **Buy Hen**: Browse available flock stock, real-time price calculation, choose between instant wallet payment or manual bank/EasyPaisa transfer with TID.
  2. **Sell Eggs**: View inventory eggs, automatic PKR calculation at official market price (PKR 35/egg), instant liquidation request.
  3. **FBR Information**: Official NTN verification, agricultural livestock tax exemption details under Section 41.
  4. **SECP Information**: Corporate registry details under Companies Act 2017 with official portal links.
  5. **Collect Eggs**: Real-time biological countdown timer (12h cycle), eligible egg calculation, 1-click egg harvest into inventory.
  6. **Transaction History**: Complete chronological ledger of every credit/debit with resulting balances.
  7. **Referral Program**: Track invited farmers and claim referral bonuses.
  8. **Help & Support**: Direct WhatsApp link, helpline, and helpdesk ticket submission with admin reply tracking.
- **Mobile Bottom Navigation**: Fixed bottom bar featuring Home, Sell Eggs, Buy Hen, Account, and Logout.

### C. Admin Control Panel (Reference 2 Design)
- **Responsive Workspace**: Collapsible sidebar, quick switch to User View, notification badges for pending queues.
- **Analytics Dashboard**: Chart.js charts for daily farmer registrations, sales volume, and queue distribution.
- **User Management**: Search by username/mobile/name, inspect full portfolio, suspend/activate accounts, and adjust balances with mandatory audit notes.
- **Request Queues**:
  - **Hen Purchases**: Approve (decrements stock and increments user coop) or Reject.
  - **Egg Sales**: Approve (credits farmer wallet) or Reject (restores eggs to inventory).
  - **Deposits**: Review sender TID, verify, and credit wallet atomically.
  - **Withdrawals**: Review title/account, mark disbursed, or reject with automatic refund.
- **Catalog Management**: Add, update prices, modify stock, and archive breeds.
- **System Settings**: Live controls for egg prices, collection timers, bank details, and legal notices.
- **Security Audit Logs**: Immutable history of all administrative actions.

---

## 4. API Endpoints

### Public Endpoints
- `GET /api/public/settings` — Returns site settings and contact coordinates.
- `GET /api/public/hen-products` — Active hen breeds and prices.
- `GET /api/public/stats` — Real calculated farm records.
- `GET /api/public/regulatory-info` — FBR NTN & SECP verification data.

### Authentication Endpoints
- `POST /api/auth/register` — Create new farmer account.
- `POST /api/auth/login` — Farmer login with username or mobile.
- `POST /api/auth/admin-login` — Administrator authentication.
- `GET /api/auth/me` — Current authenticated session and flock stats.
- `POST /api/auth/logout` — Clear session.
- `POST /api/auth/reset-password` — Password reset.
- `PUT /api/auth/profile` — Update name/email.
- `POST /api/auth/change-password` — Change password.

### Farmer Dashboard Endpoints
- `GET /api/user/dashboard-summary` — All dashboard metrics and recent ledger.
- `GET /api/user/hen-products` — Live hen stock for purchase.
- `POST /api/user/buy-hen` — Submit purchase request (wallet balance or transfer).
- `GET /api/user/hen-purchases` — User purchase history.
- `GET /api/user/my-hens` — Active flock owned.
- `GET /api/user/egg-collection-status` — Current eligible eggs & timer.
- `POST /api/user/collect-eggs` — Harvest ready eggs.
- `GET /api/user/sell-eggs-status` — Inventory & market price.
- `POST /api/user/sell-eggs` — Submit egg sale request.
- `POST /api/user/deposit` — Submit deposit request with TID.
- `GET /api/user/deposits` — List deposit requests.
- `POST /api/user/withdraw` — Request withdrawal to bank/EasyPaisa.
- `GET /api/user/withdrawals` — List withdrawal requests.
- `GET /api/user/transactions` — Full transaction ledger.
- `GET /api/user/referrals` — Referral network & commission records.
- `POST /api/user/support-ticket` — Submit inquiry.
- `GET /api/user/support-tickets` — User inquiry history.

### Administrator Endpoints
- `GET /api/admin/analytics` — High-level metrics & Chart.js data series.
- `GET /api/admin/users` — Search and filter users.
- `GET /api/admin/users/:id` — Detailed user view.
- `PUT /api/admin/users/:id/status` — Activate / suspend account.
- `POST /api/admin/users/:id/adjust-balance` — Credit/debit user balance.
- `GET /api/admin/requests/hens` — Hen order queue.
- `POST /api/admin/requests/hens/:id/action` — Approve / reject hen order.
- `GET /api/admin/requests/eggs` — Egg sale queue.
- `POST /api/admin/requests/eggs/:id/action` — Approve / reject egg sale.
- `GET /api/admin/requests/deposits` — Deposit queue.
- `POST /api/admin/requests/deposits/:id/action` — Approve / reject deposit.
- `GET /api/admin/requests/withdrawals` — Withdrawal queue.
- `POST /api/admin/requests/withdrawals/:id/action` — Approve / reject withdrawal.
- `GET /api/admin/products` — Product catalog.
- `POST /api/admin/products` — Create breed.
- `PUT /api/admin/products/:id` — Update breed.
- `DELETE /api/admin/products/:id` — Archive breed.
- `GET /api/admin/settings` — Admin settings.
- `PUT /api/admin/settings` — Save settings.
- `GET /api/admin/audit-logs` — Administrative audit history.
- `GET /api/admin/support-tickets` — Helpdesk queue.
- `POST /api/admin/support-tickets/:id/reply` — Answer ticket.

---

## 5. Development & Testing Commands

```bash
# Start full-stack application (Express + Vite)
npm run dev

# Run automated business logic & integration tests
npm run test

# Type-check TypeScript code
npm run lint

# Production build
npm run build

# Start production server
npm run start
```
