# XUI One Decoded - Installation Guide

Complete installation guide for XUI One Decoded (xuione_decoded) on Linux servers.

## 📋 Prerequisites

### System Requirements
- **OS**: Ubuntu 20.04/22.04, Debian 11/12, CentOS 7/8/9, AlmaLinux/Rocky 8/9
- **PHP**: 7.4+ (8.1+ recommended)
- **MySQL**: 5.7+ or MariaDB 10.3+
- **Redis**: 6.0+
- **Web Server**: Nginx 1.18+ or Apache 2.4+
- **FFmpeg**: 4.0+ (4.4 recommended for hardware acceleration)
- **RAM**: Minimum 2GB (4GB+ recommended)
- **Disk**: 20GB+ SSD recommended

### Required PHP Extensions
```bash
# Ubuntu/Debian
apt install php8.1-{cli,fpm,mysql,redis,igbinary,curl,mbstring,xml,zip,gd,bcmath,intl,opcache}

# CentOS/RHEL/AlmaLinux
dnf install php81-php-{cli,fpm,mysqlnd,redis,igbinary,curl,mbstring,xml,zip,gd,bcmath,intl,opcache}
```

---

## 🖥️ Server Setup

### 1. Update System
```bash
# Ubuntu/Debian
apt update && apt upgrade -y

# CentOS/RHEL/AlmaLinux
dnf update -y
```

### 2. Install Required Packages
```bash
# Ubuntu 22.04
apt install -y nginx mariadb-server redis-server ffmpeg \
    php8.1-cli php8.1-fpm php8.1-mysql php8.1-redis php8.1-igbinary \
    php8.1-curl php8.1-mbstring php8.1-xml php8.1-zip php8.1-gd \
    php8.1-bcmath php8.1-intl php8.1-opcache git unzip

# Enable services
systemctl enable --now nginx mariadb redis php8.1-fpm
```

### 3. Install ionCube Loader (Optional - for encoded version)
The decoded version doesn't require ionCube, but if you need it:
```bash
# Download and install ionCube for PHP 8.1
cd /tmp
wget https://downloads.ioncube.com/loader_downloads/ioncube_loaders_lin_x86-64.tar.gz
tar xzf ioncube_loaders_lin_x86-64.tar.gz
cp ioncube/ioncube_loader_lin_8.1.so /usr/lib/php/20210902/
echo "zend_extension=ioncube_loader_lin_8.1.so" > /etc/php/8.1/mods-available/ioncube.ini
phpenmod ioncube
systemctl restart php8.1-fpm
```

---

## 🗄️ Database Setup

### 1. Secure MariaDB
```bash
mysql_secure_installation
```

### 2. Create Database and User
```bash
mysql -u root -p <<EOF
CREATE DATABASE xui CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'xui'@'localhost' IDENTIFIED BY 'CHANGE_THIS_PASSWORD';
GRANT ALL PRIVILEGES ON xui.* TO 'xui'@'localhost';
FLUSH PRIVILEGES;
EOF
```

### 3. Import Database Schema
```bash
# The database schema will be created automatically on first run
# Or you can import from a backup if available
```

---

## 🔧 XUI One Installation

### 1. Clone Repository
```bash
cd /var/www
git clone https://github.com/TalaveraSama/xuione-decoded.git xui
cd xui
```

### 2. Set Permissions
```bash
chown -R www-data:www-data /var/www/xui
chmod -R 755 /var/www/xui
chmod -R 777 /var/www/xui/decoded/tmp
chmod -R 777 /var/www/xui/decoded/www/admin/backup
```

### 3. Configure PHP-FPM
```bash
# Edit PHP-FPM pool
nano /etc/php/8.1/fpm/pool.d/www.conf

# Ensure these settings:
user = www-data
group = www-data
listen = /run/php/php8.1-fpm.sock
listen.owner = www-data
listen.group = www-data
pm = dynamic
pm.max_children = 50
pm.start_servers = 5
pm.min_spare_servers = 5
pm.max_spare_servers = 35
```

### 4. Configure PHP Settings
```bash
nano /etc/php/8.1/fpm/php.ini

# Recommended settings:
memory_limit = 512M
max_execution_time = 300
max_input_time = 300
post_max_size = 100M
upload_max_filesize = 100M
date.timezone = America/New_York  # Set your timezone
opcache.enable = 1
opcache.memory_consumption = 256
opcache.max_accelerated_files = 20000
```

```bash
systemctl restart php8.1-fpm
```

---

## 🌐 Nginx Configuration

### 1. Create Site Configuration
```bash
nano /etc/nginx/sites-available/xui
```

```nginx
server {
    listen 80;
    listen [::]:80;
    server_name your-domain.com;
    root /var/www/xui/decoded/www;
    index index.php;

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN";
    add_header X-Content-Type-Options "nosniff";
    add_header X-XSS-Protection "1; mode=block";

    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types text/plain text/css text/xml text/javascript application/javascript application/xml application/json;

    # Main location
    location / {
        try_files $uri $uri/ /init.php?$query_string;
    }

    # PHP handling
    location ~ \.php$ {
        fastcgi_pass unix:/run/php/php8.1-fpm.sock;
        fastcgi_param SCRIPT_FILENAME $document_root$fastcgi_script_name;
        fastcgi_param PATH_INFO $fastcgi_path_info;
        include fastcgi_params;
        fastcgi_read_timeout 300;
        fastcgi_send_timeout 300;
        fastcgi_buffer_size 128k;
        fastcgi_buffers 4 256k;
        fastcgi_busy_buffers_size 256k;
    }

    # Deny access to sensitive files
    location ~ /\.(git|env|htaccess) {
        deny all;
    }

    location ~ /(config|tmp|includes)/ {
        deny all;
    }

    # Static files caching
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2)$ {
        expires 30d;
        add_header Cache-Control "public, immutable";
    }

    # Large file uploads
    client_max_body_size 100M;
}
```

### 2. Enable Site
```bash
ln -s /etc/nginx/sites-available/xui /etc/nginx/sites-enabled/
rm /etc/nginx/sites-enabled/default
nginx -t
systemctl reload nginx
```

---

## 🔒 SSL Certificate (Let's Encrypt)

### 1. Install Certbot
```bash
apt install -y certbot python3-certbot-nginx
```

### 2. Obtain Certificate
```bash
certbot --nginx -d your-domain.com -d www.your-domain.com
```

### 3. Auto-renewal
```bash
systemctl enable certbot.timer
systemctl start certbot.timer
```

---

## ⚙️ XUI Configuration

### 1. Create Config File
```bash
mkdir -p /var/www/xui/config
nano /var/www/xui/config/config.ini
```

```ini
[database]
host = localhost
port = 3306
username = xui
password = CHANGE_THIS_PASSWORD
dbname = xui

[redis]
host = 127.0.0.1
port = 6379
password = 
db = 0

[panel]
url = https://your-domain.com
timezone = America/New_York
language = en

[security]
flood_limit = 50
flood_seconds = 60
bruteforce_mac_attempts = 10
bruteforce_username_attempts = 10
bruteforce_frequency = 300

[streaming]
ffmpeg_cpu = 4.4
segment_type = hls
seg_time = 10
seg_list_size = 5
seg_delete_threshold = 3

[paths]
home = /var/www/xui/
tmp = /var/www/xui/tmp/
```

### 2. Set Correct Paths in constants.php
```bash
nano /var/www/xui/decoded/www/constants.php
```

Update paths if needed:
```php
define('XUI_HOME', '/var/www/xui/');
define('CONFIG_PATH', XUI_HOME . 'config/');
define('INCLUDES_PATH', XUI_HOME . 'includes/');
define('CACHE_TMP_PATH', XUI_HOME . 'tmp/cache/');
define('FLOOD_TMP_PATH', XUI_HOME . 'tmp/flood/');
define('LOG_PATH', XUI_HOME . 'tmp/logs/');
```

### 3. Create Required Directories
```bash
mkdir -p /var/www/xui/tmp/{cache,flood,logs,thumbnails,records}
chown -R www-data:www-data /var/www/xui/tmp
chmod -R 777 /var/www/xui/tmp
```

---

## 🚀 First Run & Setup

### 1. Access Installation Wizard
Open browser: `https://your-domain.com`

You should see the XUI One installation wizard.

### 2. Complete Installation
1. **License**: Enter your license key (or use trial)
2. **Database**: Enter database credentials from config.ini
3. **Admin Account**: Create admin username/password
4. **Server Settings**: Configure main server IP, ports, domain
5. **Finish**: Complete installation

### 3. Post-Installation
```bash
# Remove install.php if exists
rm -f /var/www/xui/decoded/www/install.php

# Set proper permissions
chmod 644 /var/www/xui/config/config.ini
chown www-data:www-data /var/www/xui/config/config.ini
```

---

## 🔧 Cron Jobs

### 1. Add System Crons
```bash
crontab -u www-data -e
```

```bash
# Monitor (every minute)
* * * * * /usr/bin/php /var/www/xui/decoded/includes/cli/monitor.php > /dev/null 2>&1

# Queue processor (every minute)
* * * * * /usr/bin/php /var/www/xui/decoded/includes/cli/queue.php > /dev/null 2>&1

# EPG updater (every 6 hours)
0 */6 * * * /usr/bin/php /var/www/xui/decoded/includes/cli/epg.php > /dev/null 2>&1

# Cache cleaner (daily at 3 AM)
0 3 * * * /usr/bin/php /var/www/xui/decoded/includes/cli/cache_handler.php clean > /dev/null 2>&1

# Backup (daily at 2 AM)
0 2 * * * /usr/bin/php /var/www/xui/decoded/includes/cli/backup.php > /dev/null 2>&1

# Watchdog (every 5 minutes)
*/5 * * * * /usr/bin/php /var/www/xui/decoded/includes/cli/watchdog.php > /dev/null 2>&1
```

---

## 📊 Monitoring & Maintenance

### 1. Log Files
```bash
# Nginx logs
/var/log/nginx/access.log
/var/log/nginx/error.log

# PHP-FPM logs
/var/log/php8.1-fpm.log

# XUI logs
/var/www/xui/tmp/logs/
```

### 2. Health Check Script
```bash
nano /usr/local/bin/xui-health.sh
```

```bash
#!/bin/bash
# Health check for XUI One

DOMAIN="your-domain.com"
API_URL="https://$DOMAIN/player_api.php"

# Check web server
if ! curl -sf "https://$DOMAIN" > /dev/null; then
    echo "WEB DOWN" | mail -s "XUI Alert: Web Down" admin@domain.com
fi

# Check API
if ! curl -sf "$API_URL?username=test&password=test&action=get_user_info" > /dev/null; then
    echo "API DOWN" | mail -s "XUI Alert: API Down" admin@domain.com
fi

# Check disk space
DISK=$(df /var/www/xui | tail -1 | awk '{print $5}' | sed 's/%//')
if [ $DISK -gt 90 ]; then
    echo "DISK FULL: $DISK%" | mail -s "XUI Alert: Disk Full" admin@domain.com
fi

# Check MySQL
if ! mysqladmin ping -h localhost -u xui -pPASSWORD > /dev/null 2>&1; then
    echo "MYSQL DOWN" | mail -s "XUI Alert: MySQL Down" admin@domain.com
fi

# Check Redis
if ! redis-cli ping > /dev/null 2>&1; then
    echo "REDIS DOWN" | mail -s "XUI Alert: Redis Down" admin@domain.com
fi
```

```bash
chmod +x /usr/local/bin/xui-health.sh
# Add to crontab every 5 minutes
*/5 * * * * /usr/local/bin/xui-health.sh
```

### 3. Backup Strategy
```bash
nano /usr/local/bin/xui-backup.sh
```

```bash
#!/bin/bash
BACKUP_DIR="/var/backups/xui"
DATE=$(date +%Y%m%d_%H%M%S)
mkdir -p $BACKUP_DIR

# Database backup
mysqldump -u xui -pPASSWORD xui | gzip > $BACKUP_DIR/xui_db_$DATE.sql.gz

# Files backup (config, tmp)
tar -czf $BACKUP_DIR/xui_files_$DATE.tar.gz /var/www/xui/config /var/www/xui/tmp

# Keep last 7 days
find $BACKUP_DIR -type f -mtime +7 -delete
```

```bash
chmod +x /usr/local/bin/xui-backup.sh
# Daily at 2 AM
0 2 * * * /usr/local/bin/xui-backup.sh
```

---

## 🔧 Troubleshooting

### Common Issues

#### 1. White Screen / 500 Error
```bash
# Check PHP error log
tail -f /var/log/php8.1-fpm.log

# Check Nginx error log
tail -f /var/log/nginx/error.log

# Enable PHP display_errors temporarily
# Edit /etc/php/8.1/fpm/php.ini
display_errors = On
```

#### 2. Database Connection Failed
```bash
# Test connection
mysql -u xui -p -h localhost xui

# Check config.ini credentials
cat /var/www/xui/config/config.ini
```

#### 3. Redis Connection Failed
```bash
# Test Redis
redis-cli ping

# Check Redis config
redis-cli CONFIG GET bind
redis-cli CONFIG GET protected-mode
```

#### 4. Streams Not Playing
- Check FFmpeg installation: `ffmpeg -version`
- Check FFmpeg paths in constants.php
- Check server ports (80, 443, 1935, 8080) are open
- Check firewall: `ufw status` or `firewall-cmd --list-all`

#### 5. EPG Not Updating
```bash
# Run manually
php /var/www/xui/decoded/includes/cli/epg.php

# Check logs
cat /var/www/xui/tmp/logs/epg.log
```

#### 6. Permission Issues
```bash
# Fix all permissions
chown -R www-data:www-data /var/www/xui
chmod -R 755 /var/www/xui
chmod -R 777 /var/www/xui/tmp
chmod 644 /var/www/xui/config/config.ini
```

---

## 🔄 Updates

### 1. Update Code
```bash
cd /var/www/xui
git pull origin main
```

### 2. Run Database Migrations (if any)
```bash
php /var/www/xui/decoded/includes/cli/migrate.php
```

### 3. Clear Cache
```bash
php /var/www/xui/decoded/includes/cli/cache_handler.php clean
```

### 4. Restart Services
```bash
systemctl reload nginx
systemctl restart php8.1-fpm
```

---

## 📞 Support

- **Original Repository**: https://github.com/tealcavalon/xuione_decoded
- **Documentation**: https://github.com/TalaveraSama/IUX-ZONE
- **Fork**: https://github.com/TalaveraSama/xuione-decoded

---

*Last updated: 2024 - For XUI One Decoded v1.5.13*