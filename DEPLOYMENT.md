# คู่มือการ Deploy บน Ubuntu Server

## ข้อกำหนดเบื้องต้น

- Ubuntu 20.04 หรือใหม่กว่า
- Node.js 18.x หรือใหม่กว่า
- npm หรือ yarn
- PostgreSQL (ถ้าใช้ Supabase แยก)
- Git

## ขั้นตอนการติดตั้ง

### 1. อัปเดตระบบและติดตั้ง Dependencies

```bash
# อัปเดต package list
sudo apt update && sudo apt upgrade -y

# ติดตั้ง Node.js 20.x
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# ตรวจสอบเวอร์ชัน
node --version
npm --version

# ติดตั้ง Git (ถ้ายังไม่มี)
sudo apt install git -y

# ติดตั้ง PM2 สำหรับ process management
sudo npm install -g pm2
```

### 2. Clone Repository

```bash
# สร้างโฟลเดอร์สำหรับโปรเจกต์
cd /var/www
sudo mkdir -p stresser
sudo chown $USER:$USER stresser
cd stresser

# Clone repository
git clone https://github.com/alexanderhayes33/stresser.git .

# หรือถ้าใช้ SSH
# git clone git@github.com:alexanderhayes33/stresser.git .
```

### 3. ติดตั้ง Dependencies

```bash
# ติดตั้ง npm packages
npm install

# หรือถ้าใช้ yarn
# yarn install
```

### 4. Setup Environment Variables

```bash
# สร้างไฟล์ .env.local
nano .env.local
```

เพิ่ม environment variables ที่จำเป็น:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# Database (ถ้าใช้)
DATABASE_URL=your_database_url

# JWT Secret
JWT_SECRET=your_jwt_secret_key

# App URL
NEXT_PUBLIC_APP_URL=http://your-domain.com
```

### 5. Build Application

```bash
# Build production
npm run build
```

### 6. Run with PM2

```bash
# สร้างไฟล์ ecosystem.config.js
cat > ecosystem.config.js << 'EOF'
module.exports = {
  apps: [{
    name: 'stresser',
    script: 'npm',
    args: 'start',
    cwd: '/var/www/stresser',
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: '1G',
    env: {
      NODE_ENV: 'production',
      PORT: 3000
    }
  }]
}
EOF

# Start application
pm2 start ecosystem.config.js

# Save PM2 configuration
pm2 save

# Setup PM2 to start on boot
pm2 startup
# แล้วรันคำสั่งที่แสดงออกมา
```

### 7. Setup Nginx Reverse Proxy (แนะนำ)

```bash
# ติดตั้ง Nginx
sudo apt install nginx -y

# สร้างไฟล์ configuration
sudo nano /etc/nginx/sites-available/stresser
```

เพิ่มเนื้อหาดังนี้:

```nginx
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

```bash
# Enable site
sudo ln -s /etc/nginx/sites-available/stresser /etc/nginx/sites-enabled/

# Test Nginx configuration
sudo nginx -t

# Restart Nginx
sudo systemctl restart nginx
```

### 8. Setup SSL with Let's Encrypt (แนะนำ)

```bash
# ติดตั้ง Certbot
sudo apt install certbot python3-certbot-nginx -y

# Get SSL certificate
sudo certbot --nginx -d your-domain.com

# Auto-renewal จะ setup อัตโนมัติ
```

### 9. Firewall Configuration

```bash
# เปิด port ที่จำเป็น
sudo ufw allow 22/tcp    # SSH
sudo ufw allow 80/tcp    # HTTP
sudo ufw allow 443/tcp   # HTTPS
sudo ufw enable
```

## คำสั่งที่มีประโยชน์

### PM2 Commands

```bash
# ดูสถานะ
pm2 status

# ดู logs
pm2 logs stresser

# Restart
pm2 restart stresser

# Stop
pm2 stop stresser

# Reload (zero downtime)
pm2 reload stresser

# ดู monitoring
pm2 monit
```

### Update Application

```bash
cd /var/www/stresser

# Pull latest code
git pull origin main

# Install new dependencies (ถ้ามี)
npm install

# Rebuild
npm run build

# Restart PM2
pm2 restart stresser
```

### ดู Logs

```bash
# PM2 logs
pm2 logs stresser

# Nginx logs
sudo tail -f /var/log/nginx/access.log
sudo tail -f /var/log/nginx/error.log

# System logs
sudo journalctl -u nginx -f
```

## Troubleshooting

### Application ไม่ทำงาน

```bash
# ตรวจสอบ PM2 status
pm2 status

# ตรวจสอบ logs
pm2 logs stresser --lines 50

# ตรวจสอบ port
sudo netstat -tulpn | grep 3000
```

### Nginx ไม่ทำงาน

```bash
# ตรวจสอบ configuration
sudo nginx -t

# ตรวจสอบ status
sudo systemctl status nginx

# Restart Nginx
sudo systemctl restart nginx
```

### Port ถูกใช้งานแล้ว

```bash
# หา process ที่ใช้ port 3000
sudo lsof -i :3000

# Kill process
sudo kill -9 <PID>
```

## Security Best Practices

1. **ใช้ HTTPS เสมอ** - Setup SSL certificate
2. **Firewall** - เปิดเฉพาะ port ที่จำเป็น
3. **Environment Variables** - อย่า commit `.env.local` 
4. **Regular Updates** - อัปเดตระบบและ dependencies เป็นประจำ
5. **Backup** - สำรองข้อมูลเป็นประจำ

## Database Setup (ถ้าใช้ Supabase แยก)

```bash
# ติดตั้ง PostgreSQL (ถ้าจำเป็น)
sudo apt install postgresql postgresql-contrib -y

# สร้าง database และ user
sudo -u postgres psql
```

```sql
CREATE DATABASE stresser;
CREATE USER stresser_user WITH ENCRYPTED PASSWORD 'your_password';
GRANT ALL PRIVILEGES ON DATABASE stresser TO stresser_user;
\q
```

## Performance Optimization

1. **Enable Caching** - ใช้ Redis สำหรับ caching (ถ้าจำเป็น)
2. **CDN** - ใช้ CDN สำหรับ static assets
3. **Database Indexing** - สร้าง indexes ที่จำเป็น
4. **Monitoring** - ใช้ monitoring tools เช่น PM2 Plus

## Backup Script

```bash
# สร้าง backup script
cat > /var/www/stresser/backup.sh << 'EOF'
#!/bin/bash
BACKUP_DIR="/var/backups/stresser"
DATE=$(date +%Y%m%d_%H%M%S)
mkdir -p $BACKUP_DIR

# Backup .env.local
cp .env.local $BACKUP_DIR/env_$DATE

# Backup database (ถ้ามี)
# pg_dump stresser > $BACKUP_DIR/db_$DATE.sql

echo "Backup completed: $DATE"
EOF

chmod +x /var/www/stresser/backup.sh

# เพิ่มใน crontab สำหรับ auto backup
crontab -e
# เพิ่ม: 0 2 * * * /var/www/stresser/backup.sh
```

