# Hostinger Deployment Guide for Noorani Poultry Farm

This guide explains how to deploy the **Noorani Poultry Farm** full-stack application on Hostinger.

---

## Deployment Options on Hostinger

Hostinger supports two primary hosting environments for Node.js apps:
- **Option 1: Hostinger VPS (Recommended)**: Ubuntu/Debian VPS running PM2 + Nginx reverse proxy. Gives full performance, unlimited process control, automatic SSL, and zero sleep time.
- **Option 2: Hostinger Cloud / Web Hosting (hPanel Node.js App Manager)**: Shared/Cloud plans featuring the hPanel Node.js selector.
- **Option 3: Hostinger VPS with Docker**: 1-command deployment using Docker Compose.

---

## Option 1: Hostinger VPS Deployment (Recommended)

### Step 1: Connect to your Hostinger VPS via SSH
Open your terminal (PowerShell, Command Prompt, or Mac/Linux Terminal) and connect:
```bash
ssh root@YOUR_VPS_IP
```

### Step 2: Install Node.js 22, Git & PM2
Run the following commands on your VPS:
```bash
# Update system packages
apt update && apt upgrade -y

# Install Node.js 22 LTS
curl -fsSL https://deb.nodesource.com/setup_22.x | bash -
apt install -y nodejs git nginx

# Verify installation
node -v # Should be v22.x
npm -v

# Install PM2 Process Manager globally
npm install -g pm2
```

### Step 3: Clone or Upload Your Code
Create the application directory:
```bash
mkdir -p /var/www/noorani-poultry
cd /var/www/noorani-poultry
```

Upload your files using Git, SFTP (FileZilla / Cyberduck), or SCP:
```bash
# Example if using Git:
git clone YOUR_REPOSITORY_URL .

# Or upload your project zip and extract:
apt install unzip -y
unzip project.zip
```

### Step 4: Configure Environment & Install Dependencies
Create your production `.env` file:
```bash
nano .env
```
Paste your production settings:
```env
PORT=3000
NODE_ENV=production
JWT_SECRET=your_super_strong_jwt_secret_key_here_2026
ADMIN_USERNAME=admin
ADMIN_PASSWORD=admin123
```
Save with `Ctrl + O`, then `Enter`, then exit with `Ctrl + X`.

Now install packages and build the production bundle:
```bash
# Install dependencies
npm ci

# Build frontend and backend bundles
npm run build
```

### Step 5: Start the App with PM2
We have included a pre-configured `ecosystem.config.cjs` file in the project. Run:
```bash
# Start application using PM2
pm2 start ecosystem.config.cjs

# Save PM2 process list and configure auto-start on server boot
pm2 save
pm2 startup
```

Verify that the server is running:
```bash
pm2 status
curl http://localhost:3000/api/health
# Response: {"status":"ok", ...}
```

### Step 6: Configure Nginx as Reverse Proxy
Configure Nginx to route traffic from your domain to port 3000:
```bash
nano /etc/nginx/sites-available/noorani-poultry
```

Paste the following configuration (replace `yourdomain.com` with your actual domain):
```nginx
server {
    listen 80;
    server_name yourdomain.com www.yourdomain.com;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        client_max_body_size 10M;
    }
}
```

Enable the site and restart Nginx:
```bash
ln -s /etc/nginx/sites-available/noorani-poultry /etc/nginx/sites-enabled/
nginx -t
systemctl restart nginx
```

### Step 7: Install Free SSL Certificate (HTTPS)
Secure your site with Let's Encrypt SSL:
```bash
apt install certbot python3-certbot-nginx -y
certbot --nginx -d yourdomain.com -d www.yourdomain.com
```
Follow the prompt to enter your email. Certbot will automatically configure HTTPS!

Your app is now live at `https://yourdomain.com`!

---

## Option 2: Hostinger hPanel (Web / Cloud Hosting)

If you have Hostinger Cloud Hosting or Web Hosting with Node.js support:

### Step 1: Open Node.js in hPanel
1. Log in to **Hostinger hPanel**.
2. Go to **Websites** → select your domain → click **Manage**.
3. In the search bar, type **Node.js** (under *Advanced*).
4. Click **Create Application**.

### Step 2: Configure the Node.js Application
Fill in the form:
- **Node.js version**: Choose `20.x` or `22.x`.
- **Application mode**: `Production`
- **Application root**: `noorani-poultry` (or `public_html`)
- **Application URL**: `yourdomain.com`
- **Application startup file**: `dist/server.js`

Click **Create**.

### Step 3: Upload Application Files
1. Open **File Manager** in hPanel.
2. Navigate to your application root directory (`noorani-poultry`).
3. Upload all project files (`package.json`, `dist/`, `src/assets/`, `index.html`, etc.).

### Step 4: Install Dependencies & Run
1. Go back to the **Node.js** section in hPanel.
2. Under **NPM Packages**, click **NPM Install** or open the **Terminal / SSH** in hPanel and run:
   ```bash
   npm install --omit=dev
   ```
3. Click the **Restart** button next to your Node.js application.

---

## Option 3: Hostinger VPS with Docker & Docker Compose

If your VPS has Docker installed, you can launch the app with a single command:

```bash
# Clone or upload your files
cd /var/www/noorani-poultry

# Start in background
docker compose up -d --build

# View logs
docker compose logs -f
```

---

## Database Storage & Backups

The application uses an SQLite database with Write-Ahead Logging (WAL) for high concurrency and zero-configuration persistence.

- **Database file path**: `./data/noorani_poultry.db`
- **To create a backup**:
  ```bash
  cp /var/www/noorani-poultry/data/noorani_poultry.db /var/www/noorani-poultry/data/backup_$(date +%Y%m%d).db
  ```
- All users, flock records, and transaction ledgers are saved inside `./data/noorani_poultry.db` and persist across server restarts.

---

## Administrator Access
Once deployed, access the admin portal:
- **Login Page**: Click **Login** → Select **Admin Panel**
- **Default Username**: `admin`
- **Default Password**: `admin123`
*(You can change the admin password or farm settings from the Admin Settings tab anytime).*
