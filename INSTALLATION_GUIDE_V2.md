# XUI One Decoded - Guía de Instalación Moderna (v2.0)

> **Basada en:** XUI One Decoded (tealcavalon/xuione_decoded) + Mejores prácticas de XC_VM (Vateron-Media/XC_VM)
> **Compatible con:** Ubuntu 22.04 LTS / 24.04 LTS
> **Licencia:** Apache 2.0 (original) / AGPL-3.0 (XC_VM)

---

## 📋 Tabla de Contenidos

1. [Requisitos del Sistema](#-requisitos-del-sistema)
2. [Arquitectura Recomendada](#-arquitectura-recomendada)
3. [Instalación Automatizada](#-instalación-automatizada)
4. [Configuración Manual Paso a Paso](#-configuración-manual-paso-a-paso)
5. [Optimizaciones de Producción](#-optimizaciones-de-producción)
6. [Seguridad y Hardening](#-seguridad-y-hardening)
7. [Monitoreo y Mantenimiento](#-monitoreo-y-mantenimiento)
8. [Escalabilidad: MAIN + Load Balancers](#-escalabilidad-main--load-balancers)
9. [Troubleshooting](#-troubleshooting)

---

## 🖥️ Requisitos del Sistema

### Mínimos (Single Server)
| Componente | Versión | Notas |
|------------|---------|-------|
| **OS** | Ubuntu 22.04/24.04 LTS | 64-bit |
| **CPU** | 2 vCPU | 4+ recomendado para transcoding |
| **RAM** | 4 GB | 8+ GB para VOD/Series |
| **Disco** | 50 GB SSD | NVMe recomendado |
| **Red** | 1 Gbps | 10 Gbps para clusters |

### Recomendados (Producción)
| Componente | Especificación |
|------------|----------------|
| **PHP** | 8.3+ (JIT habilitado) |
| **Database** | MariaDB 10.11+ / MySQL 8.0+ |
| **Cache** | KeyDB 6.3+ (compatible Redis, multi-thread) |
| **Web Server** | Nginx 1.26+ (OpenSSL 3.0) |
| **FFmpeg** | 7.0+ (con NVENC/QSV/AMF) |
| **yt-dlp** | Última versión (YouTube/VOD) |
| **Deno** | 1.40+ (runtime para yt-dlp) |

---

## 🏗️ Arquitectura Recomendada

```
┌─────────────────────────────────────────────────────────────────┐
                        INTERNET / CLIENTS
└────────────────────────────┬────────────────────────────────────┘
                             │
                    ┌────────▼────────┐
                    │   Cloudflare /  │
                    │   Load Balancer │
                    │   (SSL Term)    │
                    └────────┬────────┘
                             │
        ┌────────────────────┼────────────────────┐
        ▼                    ▼                    ▼
┌───────────────┐    ┌───────────────┐    ┌───────────────┐
│   MAIN NODE   │    │   LB NODE 1   │    │   LB NODE 2   │
│  (Admin+Stream)│    │  (Stream Only)│    │  (Stream Only)│
├───────────────┤    ├───────────────┤    ├───────────────┤
│ PHP 8.3 FPM   │    │ PHP 8.3 FPM   │    │ PHP 8.3 FPM   │
│ Nginx         │    │ Nginx         │    │ Nginx         │
│ MariaDB       │    │ KeyDB (cache) │    │ KeyDB (cache) │
│ KeyDB         │    │ FFmpeg 7.0    │    │ FFmpeg 7.0    │
│ FFmpeg 7.0    │    │ yt-dlp/Deno   │    │ yt-dlp/Deno   │
│ yt-dlp/Deno   │    └───────────────┘    └───────────────┘
└───────┬───────┘
        │
┌───────▼───────┐
│  Shared Storage │
│  (NFS/S3/MinIO) │
│  - Recordings   │
│  - Thumbnails   │
│  - VOD Files    │
└───────────────┘
```

### Tipos de Nodos
| Tipo | Código | Servicios | Descripción |
|------|--------|-----------|-------------|
| **MAIN** | `main` | Admin + Stream + API | Panel completo, gestión de BD |
| **LOAD BALANCER** | `lb` | Stream + API | Solo streaming, sin admin |
| **PROXY** | `proxy` | Geo-routing | Proxy geo-IP, user proxy |

---

## 🚀 Instalación Automatizada

### Opción 1: Script Unificado (Recomendado)

```bash
# 1. Preparar sistema
sudo apt update && sudo apt install -y curl git python3

# 2. Descargar y ejecutar instalador mejorado
curl -fsSL https://raw.githubusercontent.com/TalaveraSama/xuione-decoded/main/scripts/install-ubuntu24.sh | sudo bash

# O con variables de entorno:
export XUI_DOMAIN="panel.tudominio.com"
export XUI_TYPE="main"                    # main|lb|proxy
export PHP_VERSION="8.3"
export DB_PASSWORD="$(openssl rand -base64 32)"
export REDIS_PASSWORD="$(openssl rand -base64 32)"
export ENABLE_YTDLP="true"
export ENABLE_DENO="true"

sudo -E bash -c "$(curl -fsSL https://raw.githubusercontent.com/TalaveraSama/xuione-decoded/main/scripts/install-ubuntu24.sh)"
```

### Opción 2: Instalación XC_VM Style (Moderna)

```bash
# Estilo XC_VM - Descargar release y ejecutar instalador Python
sudo apt update && sudo apt full-upgrade -y
sudo apt install -y python3-pip unzip

# Obtener última versión
latest_version=$(curl -s https://api.github.com/repos/TalaveraSama/xuione-decoded/releases/latest | grep '"tag_name":' | cut -d '"' -f 4)
wget "https://github.com/TalaveraSama/xuione-decoded/releases/download/${latest_version}/XUI_ONE.zip"

unzip XUI_ONE.zip
sudo python3 install.py --type=main --domain=panel.tudominio.com
```

---

## ⚙️ Configuración Manual Paso a Paso

### 1. Preparar Sistema Base

```bash
#!/bin/bash
# prepare-system.sh

set -euo pipefail

# Actualizar
apt update && apt full-upgrade -y

# Paquetes base
apt install -y \
    curl wget gnupg2 software-properties-common \
    apt-transport-https ca-certificates lsb-release \
    unzip git python3 python3-pip python3-venv \
    build-essential pkg-config

# Timezone
timedatectl set-timezone America/Managua

# Hostname
hostnamectl set-hostname xui-main-01
```

### 2. Instalar PHP 8.3 (con JIT)

```bash
#!/bin/bash
# install-php83.sh

# Añadir repositorio Ondrej
add-apt-repository -y ppa:ondrej/php
apt update

# PHP 8.3 + Extensiones requeridas
apt install -y \
    php8.3-cli php8.3-fpm php8.3-mysql php8.3-redis \
    php8.3-igbinary php8.3-curl php8.3-mbstring php8.3-xml \
    php8.3-zip php8.3-gd php8.3-bcmath php8.3-intl \
    php8.3-opcache php8.3-readline php8.3-sodium \
    php8.3-imagick php8.3-msgpack php8.3-pcov

# Configurar PHP-FPM Pool para XUI
cat > /etc/php/8.3/fpm/pool.d/xui.conf <<'EOF'
[xui]
user = www-data
group = www-data
listen = /run/php/php8.3-fpm-xui.sock
listen.owner = www-data
listen.group = www-data
listen.mode = 0660

pm = dynamic
pm.max_children = 100
pm.start_servers = 10
pm.min_spare_servers = 10
pm.max_spare_servers = 50
pm.max_requests = 1000
pm.status_path = /status

php_admin_value[memory_limit] = 1024M
php_admin_value[max_execution_time] = 600
php_admin_value[max_input_time] = 600
php_admin_value[post_max_size] = 200M
php_admin_value[upload_max_filesize] = 200M
php_admin_value[date.timezone] = America/Managua
php_admin_value[opcache.enable] = 1
php_admin_value[opcache.enable_cli] = 1
php_admin_value[opcache.jit] = 1235
php_admin_value[opcache.jit_buffer_size] = 256M
php_admin_value[opcache.memory_consumption] = 512M
php_admin_value[opcache.max_accelerated_files] = 50000
php_admin_value[opcache.validate_timestamps] = 0
php_admin_value[expose_php] = Off
php_admin_flag[display_errors] = Off
php_admin_value[error_log] = /var/log/php8.3-fpm-xui.log
php_admin_value[log_errors] = 1
EOF

# Configurar php.ini principal
sed -i 's/^;opcache.jit=.*/opcache.jit=1235/' /etc/php/8.3/fpm/php.ini
sed -i 's/^;opcache.jit_buffer_size=.*/opcache.jit_buffer_size=256M/' /etc/php/8.3/fpm/php.ini

systemctl enable --now php8.3-fpm
```

### 3. Instalar KeyDB (Mejor que Redis)

```bash
#!/bin/bash
# install-keydb.sh

# KeyDB - Multi-threaded, compatible Redis
apt install -y keydb

# Configuración optimizada
cat > /etc/keydb/keydb.conf <<'EOF'
bind 127.0.0.1
port 6379
requirepass YOUR_STRONG_REDIS_PASSWORD
maxmemory 2gb
maxmemory-policy allkeys-lru
save 900 1
save 300 10
save 60 10000
dir /var/lib/keydb
appendonly yes
appendfilename "appendonly.aof"
appendfsync everysec
activerehashing yes
databases 16

# Multi-threading (KeyDB feature)
thread_count 4
EOF

systemctl enable --now keydb

# Verificar
keydb-cli -a YOUR_STRONG_REDIS_PASSWORD ping
# Debe responder: PONG
```

### 4. Instalar MariaDB 10.11+

```bash
#!/bin/bash
# install-mariadb.sh

# Repositorio oficial MariaDB
curl -LsS https://downloads.mariadb.com/MariaDB/mariadb_repo_setup | sudo bash -s -- --mariadb-server-version=10.11
apt update
apt install -y mariadb-server mariadb-client

systemctl enable --now mariadb

# Securizar
mysql_secure_installation <<EOF

Y
YOUR_DB_ROOT_PASSWORD
YOUR_DB_ROOT_PASSWORD
Y
Y
Y
Y
EOF

# Crear BD y usuario XUI
mysql -u root -pYOUR_DB_ROOT_PASSWORD <<EOF
CREATE DATABASE IF NOT EXISTS xui CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER IF NOT EXISTS 'xui'@'localhost' IDENTIFIED BY 'YOUR_XUI_DB_PASSWORD';
GRANT ALL PRIVILEGES ON xui.* TO 'xui'@'localhost';
FLUSH PRIVILEGES;

# Optimizaciones
SET GLOBAL innodb_buffer_pool_size = 2147483648;  -- 2GB
SET GLOBAL innodb_log_file_size = 268435456;      -- 256MB
SET GLOBAL max_connections = 500;
SET GLOBAL innodb_flush_log_at_trx_commit = 2;
EOF

# Configuración persistente
cat >> /etc/mysql/mariadb.conf.d/99-xui.cnf <<'EOF'
[mysqld]
innodb_buffer_pool_size = 2G
innodb_log_file_size = 256M
innodb_flush_log_at_trx_commit = 2
innodb_flush_method = O_DIRECT
max_connections = 500
innodb_file_per_table = 1
innodb_read_io_threads = 8
innodb_write_io_threads = 8
query_cache_type = 0
query_cache_size = 0
tmp_table_size = 64M
max_heap_table_size = 64M
EOF

systemctl restart mariadb
```

### 5. Instalar FFmpeg 7.0+ con Hardware Acceleration

```bash
#!/bin/bash
# install-ffmpeg.sh

# Opción A: Ubuntu 24.04 (incluye FFmpeg 7.x)
apt install -y ffmpeg

# Opción B: Ubuntu 22.04 - Compilar o PPA
# add-apt-repository -y ppa:savoury1/ffmpeg7
# apt update && apt install -y ffmpeg

# Verificar codecs hardware
ffmpeg -hide_banner -encoders | grep -E "nvenc|qsv|amf|videotoolbox"

# Para NVIDIA NVENC (requiere drivers NVIDIA instalados)
# apt install -y nvidia-driver-550 nvidia-utils-550
# ffmpeg -hide_banner -encoders | grep nvenc

# Verificar instalación
ffmpeg -version | head -1
ffprobe -version | head -1
```

### 6. Instalar yt-dlp + Deno (Para YouTube/VOD)

```bash
#!/bin/bash
# install-ytdlp-deno.sh

# Deno (runtime para yt-dlp)
curl -fsSL https://deno.land/install.sh | sh
export PATH="$HOME/.deno/bin:$PATH"
echo 'export PATH="$HOME/.deno/bin:$PATH"' >> /etc/profile.d/deno.sh

# Verificar
deno --version

# yt-dlp
curl -L https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp -o /usr/local/bin/yt-dlp
chmod +x /usr/local/bin/yt-dlp

# Verificar
yt-dlp --version

# Para YouTube (requiere cookies para contenido restringido)
# mkdir -p /etc/yt-dlp
# cp cookies.txt /etc/yt-dlp/cookies.txt
```

### 7. Instalar Nginx con Configuración Moderna

```bash
#!/bin/bash
# install-nginx.sh

# Nginx Mainline (más reciente)
apt install -y nginx

# Configuración principal optimizada
cat > /etc/nginx/nginx.conf <<'EOF'
user www-data;
worker_processes auto;
worker_rlimit_nofile 65535;
pid /run/nginx.pid;

events {
    worker_connections 4096;
    multi_accept on;
    use epoll;
}

http {
    sendfile on;
    tcp_nopush on;
    tcp_nodelay on;
    keepalive_timeout 65;
    keepalive_requests 1000;
    types_hash_max_size 2048;
    server_tokens off;

    # MIME
    include /etc/nginx/mime.types;
    default_type application/octet-stream;

    # Logging
    access_log /var/log/nginx/access.log combined buffer=32k flush=5s;
    error_log /var/log/nginx/error.log warn;

    # Gzip
    gzip on;
    gzip_vary on;
    gzip_proxied any;
    gzip_comp_level 6;
    gzip_min_length 1024;
    gzip_types
        text/plain text/css text/xml text/javascript
        application/javascript application/json application/xml
        application/rss+xml application/xhtml+xml
        image/svg+xml font/woff font/woff2;

    # Brotli (si compilado)
    # brotli on;
    # brotli_comp_level 5;

    # Rate Limiting Zones
    limit_req_zone $binary_remote_addr zone=api_limit:10m rate=100r/s;
    limit_req_zone $binary_remote_addr zone=login_limit:10m rate=5r/s;
    limit_req_zone $binary_remote_addr zone=stream_limit:10m rate=50r/s;

    # Upstream PHP-FPM
    upstream php_xui {
        server unix:/run/php/php8.3-fpm-xui.sock;
        keepalive 64;
    }

    # SSL Settings (para Certbot)
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256:ECDHE-ECDSA-AES256-GCM-SHA384:ECDHE-RSA-AES256-GCM-SHA384;
    ssl_prefer_server_ciphers off;
    ssl_session_cache shared:SSL:10m;
    ssl_session_timeout 10m;

    # Include sites
    include /etc/nginx/sites-enabled/*;
}
EOF

# Site configuration para MAIN
cat > /etc/nginx/sites-available/xui-main <<'EOF'
server {
    listen 80;
    listen [::]:80;
    server_name panel.tudominio.com;
    root /var/www/xui/decoded/www;
    index init.php;

    # Security Headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;
    add_header Content-Security-Policy "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' data:; connect-src 'self'" always;

    # Rate Limits
    limit_req zone=api_limit burst=200 nodelay;
    limit_req zone=login_limit burst=10 nodelay;

    # Main location
    location / {
        try_files $uri $uri/ /init.php?$query_string;
    }

    # Admin panel
    location /admin/ {
        alias /var/www/xui/decoded/admin/;
        try_files $uri $uri/ /admin/index.php?$query_string;

        location ~ \.php$ {
            fastcgi_pass php_xui;
            fastcgi_param SCRIPT_FILENAME $request_filename;
            include fastcgi_params;
            fastcgi_read_timeout 600;
        }
    }

    # Player
    location /player/ {
        alias /var/www/xui/decoded/player/;
        try_files $uri $uri/ /player/index.php?$query_string;

        location ~ \.php$ {
            fastcgi_pass php_xui;
            fastcgi_param SCRIPT_FILENAME $request_filename;
            include fastcgi_params;
            fastcgi_read_timeout 600;
        }
    }

    # Reseller
    location /reseller/ {
        alias /var/www/xui/decoded/reseller/;
        try_files $uri $uri/ /reseller/index.php?$query_string;

        location ~ \.php$ {
            fastcgi_pass php_xui;
            fastcgi_param SCRIPT_FILENAME $request_filename;
            include fastcgi_params;
            fastcgi_read_timeout 600;
        }
    }

    # API endpoints
    location ~ ^/(player_api|api|playlist|epg|enigma2|xplugin)\.php {
        fastcgi_pass php_xui;
        fastcgi_param SCRIPT_FILENAME $document_root$fastcgi_script_name;
        include fastcgi_params;
        fastcgi_read_timeout 300;
        limit_req zone=api_limit burst=50 nodelay;
    }

    # Streaming endpoints (HLS/DASH)
    location ~* \.(m3u8|ts|mpd|m4s)$ {
        add_header Cache-Control "no-cache, no-store, must-revalidate";
        add_header Access-Control-Allow-Origin "*";
        add_header Access-Control-Allow-Headers "Range";
        add_header Access-Control-Expose-Headers "Content-Length,Content-Range";
        access_log off;
        try_files $uri =404;
    }

    # PHP Handling general
    location ~ \.php$ {
        fastcgi_pass php_xui;
        fastcgi_param SCRIPT_FILENAME $document_root$fastcgi_script_name;
        fastcgi_param PATH_INFO $fastcgi_path_info;
        include fastcgi_params;
        fastcgi_read_timeout 600;
        fastcgi_intercept_errors on;
    }

    # Deny sensitive
    location ~ /\.(git|env|htaccess|gitignore) { deny all; return 404; }
    location ~ /(config|tmp|includes|cli)/ { deny all; return 404; }

    # Static assets
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
        access_log off;
        try_files $uri =404;
    }

    # Logs
    access_log /var/log/nginx/xui_access.log combined;
    error_log /var/log/nginx/xui_error.log warn;
}
EOF

# Site para Load Balancer (solo streaming)
cat > /etc/nginx/sites-available/xui-lb <<'EOF'
server {
    listen 80;
    listen [::]:80;
    server_name lb.tudominio.com;
    root /var/www/xui/decoded/www;
    index init.php;

    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;

    # Solo endpoints de streaming
    location ~ ^/(player_api|api|playlist|epg|enigma2|xplugin|live|vod|timeshift|series)\.php {
        fastcgi_pass php_xui;
        fastcgi_param SCRIPT_FILENAME $document_root$fastcgi_script_name;
        include fastcgi_params;
        fastcgi_read_timeout 300;
        limit_req zone=stream_limit burst=100 nodelay;
    }

    # Streaming files
    location ~* \.(m3u8|ts|mpd|m4s)$ {
        add_header Cache-Control "no-cache, no-store, must-revalidate";
        add_header Access-Control-Allow-Origin "*";
        access_log off;
        try_files $uri =404;
    }

    # Deny admin/panel
    location /admin/ { deny all; return 404; }
    location /player/ { deny all; return 404; }
    location /reseller/ { deny all; return 404; }

    location ~ \.php$ {
        fastcgi_pass php_xui;
        fastcgi_param SCRIPT_FILENAME $document_root$fastcgi_script_name;
        include fastcgi_params;
        fastcgi_read_timeout 300;
    }

    location ~ /\.(git|env|htaccess) { deny all; return 404; }
    location ~ /(config|tmp|includes|cli)/ { deny all; return 404; }
}
EOF

# Habilitar sitio
ln -sf /etc/nginx/sites-available/xui-main /etc/nginx/sites-enabled/
# Para LB: ln -sf /etc/nginx/sites-available/xui-lb /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default

# Test y reload
nginx -t && systemctl reload nginx
systemctl enable --now nginx
```

---

## 🔐 Seguridad y Hardening

### 1. Firewall (UFW)

```bash
#!/bin/bash
# setup-firewall.sh

apt install -y ufw

# Políticas por defecto
ufw default deny incoming
ufw default allow outgoing

# SSH (cambiar puerto si es posible)
ufw allow 22/tcp comment 'SSH'

# Web
ufw allow 80/tcp comment 'HTTP'
ufw allow 443/tcp comment 'HTTPS'

# Streaming ports (solo desde IPs de confianza)
# ufw allow from 10.0.0.0/8 to any port 8080 comment 'Stream HTTP'
# ufw allow from 10.0.0.0/8 to any port 4433 comment 'Stream HTTPS'
# ufw allow from 10.0.0.0/8 to any port 1935 comment 'RTMP'

# Base de datos (solo localhost)
# ufw allow from 127.0.0.1 to any port 3306 comment 'MariaDB'
# ufw allow from 127.0.0.1 to any port 6379 comment 'KeyDB'

# Habilitar
ufw --force enable
ufw status verbose
```

### 2. Fail2Ban

```bash
#!/bin/bash
# setup-fail2ban.sh

apt install -y fail2ban

cat > /etc/fail2ban/jail.local <<'EOF'
[DEFAULT]
bantime = 3600
findtime = 600
maxretry = 5
backend = systemd
ignoreip = 127.0.0.1/8 10.0.0.0/8 192.168.0.0/16

[nginx-http-auth]
enabled = true
port = http,https
logpath = /var/log/nginx/error.log

[nginx-limit-req]
enabled = true
port = http,https
logpath = /var/log/nginx/*error.log
maxretry = 10

[nginx-badbots]
enabled = true
port = http,https
logpath = /var/log/nginx/*access.log
maxretry = 2

[xui-login]
enabled = true
port = http,https
logpath = /var/log/nginx/xui_access.log
maxretry = 5
filter = xui-login
EOF

cat > /etc/fail2ban/filter.d/xui-login.conf <<'EOF'
[Definition]
failregex = ^.*"POST /admin/login.php HTTP.*" 200.*$
            ^.*"POST /admin/ HTTP.*" 200.*$
ignoreregex =
EOF

systemctl enable --now fail2ban
fail2ban-client status
```

### 3. Configuración PHP Segura

```bash
# Deshabilitar funciones peligrosas
cat > /etc/php/8.3/fpm/conf.d/99-security.ini <<'EOF'
; Funciones peligrosas
disable_functions = exec,passthru,shell_exec,system,proc_open,popen,curl_exec,curl_multi_exec,parse_ini_file,show_source,pcntl_exec,pcntl_fork,pcntl_signal,pcntl_waitpid,pcntl_wexitstatus,pcntl_wifexited,pcntl_wifsignaled,pcntl_wifstopped,pcntl_wstopsig,pcntl_signal_dispatch,pcntl_get_last_error,pcntl_strerror,pcntl_sigprocmask,pcntl_sigwaitinfo,pcntl_sigtimedwait,pcntl_alarm,pcntl_getpriority,pcntl_setpriority

; Seguridad
expose_php = Off
display_errors = Off
log_errors = On
error_log = /var/log/php8.3-fpm-xui.log
max_execution_time = 300
max_input_time = 300
memory_limit = 512M
post_max_size = 100M
upload_max_filesize = 100M
file_uploads = On
max_file_uploads = 20
allow_url_fopen = On
allow_url_include = Off
session.cookie_httponly = 1
session.cookie_secure = 1
session.use_strict_mode = 1
session.gc_maxlifetime = 7200
EOF

systemctl restart php8.3-fpm
```

### 4. SSL con Let's Encrypt (Certbot)

```bash
#!/bin/bash
# setup-ssl.sh

apt install -y certbot python3-certbot-nginx

# Obtener certificado
certbot --nginx -d panel.tudominio.com \
    --non-interactive --agree-tos \
    --email admin@tudominio.com \
    --redirect --hsts --staple-ocsp

# Renovación automática
systemctl enable --now certbot.timer

# Verificar
certbot certificates
```

---

## 📊 Monitoreo y Mantenimiento

### 1. Prometheus Node Exporter

```bash
#!/bin/bash
# install-monitoring.sh

# Node Exporter
useradd --no-create-home --shell /bin/false node_exporter
wget https://github.com/prometheus/node_exporter/releases/download/v1.7.0/node_exporter-1.7.0.linux-amd64.tar.gz
tar xzf node_exporter-*.tar.gz
cp node_exporter-*/node_exporter /usr/local/bin/
rm -rf node_exporter-*

cat > /etc/systemd/system/node_exporter.service <<'EOF'
[Unit]
Description=Node Exporter
After=network.target

[Service]
User=node_exporter
Group=node_exporter
Type=simple
ExecStart=/usr/local/bin/node_exporter --collector.systemd --collector.processes

[Install]
WantedBy=multi-user.target
EOF

systemctl enable --now node_exporter
```

### 2. Logrotate para XUI

```bash
cat > /etc/logrotate.d/xui <<'EOF'
/var/log/nginx/xui_*.log {
    daily
    missingok
    rotate 30
    compress
    delaycompress
    notifempty
    create 0640 www-data adm
    sharedscripts
    postrotate
        systemctl reload nginx > /dev/null 2>&1 || true
    endscript
}

/var/log/php8.3-fpm-xui.log {
    daily
    missingok
    rotate 14
    compress
    delaycompress
    notifempty
    create 0640 www-data adm
}

/var/www/xui/tmp/logs/*.log {
    daily
    missingok
    rotate 7
    compress
    delaycompress
    notifempty
    create 0640 www-data www-data
}
EOF
```

### 3. Backup Automatizado

```bash
#!/bin/bash
# /usr/local/bin/xui-backup.sh

BACKUP_DIR="/var/backups/xui"
DATE=$(date +%Y%m%d_%H%M%S)
RETENTION_DAYS=7

mkdir -p "$BACKUP_DIR"

# 1. Database
mysqldump -u xui -pYOUR_DB_PASSWORD --single-transaction --quick --lock-tables=false xui | gzip > "$BACKUP_DIR/xui_db_$DATE.sql.gz"

# 2. Configuración y archivos importantes
tar -czf "$BACKUP_DIR/xui_config_$DATE.tar.gz" \
    /var/www/xui/config \
    /var/www/xui/decoded/includes \
    /etc/nginx/sites-available/xui-main \
    /etc/php/8.3/fpm/pool.d/xui.conf \
    /etc/keydb/keydb.conf 2>/dev/null

# 3. Limpiar backups antiguos
find "$BACKUP_DIR" -type f -mtime +$RETENTION_DAYS -delete

# 4. Opcional: Subir a S3/MinIO
# aws s3 sync "$BACKUP_DIR" s3://tu-bucket/xui-backups/ --storage-class GLACIER
```

```bash
chmod +x /usr/local/bin/xui-backup.sh

# Cron diario a las 2 AM
echo "0 2 * * * root /usr/local/bin/xui-backup.sh" > /etc/cron.d/xui-backup
```

### 4. Health Check Script

```bash
#!/bin/bash
# /usr/local/bin/xui-health.sh

DOMAIN="panel.tudominio.com"
ALERT_EMAIL="admin@tudominio.com"
WEBHOOK_URL=""  # Slack/Discord webhook

check_service() {
    systemctl is-active --quiet "$1" || return 1
}

check_port() {
    ss -ltn | grep -q ":$1 "
}

check_disk() {
    local usage=$(df /var/www/xui | tail -1 | awk '{print $5}' | sed 's/%//')
    [[ $usage -lt 90 ]]
}

check_db() {
    mysql -u xui -pYOUR_DB_PASSWORD -e "USE xui; SELECT 1;" >/dev/null 2>&1
}

check_redis() {
    keydb-cli -a YOUR_REDIS_PASSWORD ping | grep -q PONG
}

check_web() {
    curl -sf -o /dev/null -w "%{http_code}" "https://$DOMAIN/" | grep -q "200\|301\|302"
}

send_alert() {
    local msg="$1"
    echo "$msg" | mail -s "XUI Alert: $HOSTNAME" "$ALERT_EMAIL"
    [[ -n "$WEBHOOK_URL" ]] && curl -s -X POST -H 'Content-type: application/json' --data "{\"text\":\"$msg\"}" "$WEBHOOK_URL"
}

# Checks
FAILED=0

check_service nginx || { send_alert "NGINX DOWN"; ((FAILED++)); }
check_service php8.3-fpm || { send_alert "PHP-FPM DOWN"; ((FAILED++)); }
check_service mariadb || { send_alert "MARIADB DOWN"; ((FAILED++)); }
check_service keydb || { send_alert "KEYDB DOWN"; ((FAILED++)); }

check_port 80 || { send_alert "PORT 80 DOWN"; ((FAILED++)); }
check_port 443 || { send_alert "PORT 443 DOWN"; ((FAILED++)); }

check_disk || { send_alert "DISK > 90%"; ((FAILED++)); }
check_db || { send_alert "DB CONNECTION FAILED"; ((FAILED++)); }
check_redis || { send_alert "REDIS CONNECTION FAILED"; ((FAILED++)); }
check_web || { send_alert "WEB ENDPOINT DOWN"; ((FAILED++)); }

exit $FAILED
```

```bash
chmod +x /usr/local/bin/xui-health.sh

# Cada 5 minutos
echo "*/5 * * * * root /usr/local/bin/xui-health.sh" > /etc/cron.d/xui-health
```

---

## 📈 Escalabilidad: MAIN + Load Balancers

### Configuración de Cluster (MAIN ↔ LB)

#### 1. En MAIN - Configurar LB

```bash
# En panel admin: Servers → Add Server
# Tipo: Load Balancer (2)
# Parent ID: [ID del MAIN]
# Domain Names: lb1.tudominio.com,lb2.tudominio.com
# Enable HTTPS: Yes
```

#### 2. En cada LB - Configuración

```bash
# /etc/xui/server_type
echo "lb" > /etc/xui/server_type

# /var/www/xui/config/config.ini
cat > /var/www/xui/config/config.ini <<'EOF'
[database]
host = MAIN_DB_IP
port = 3306
username = xui
password = YOUR_DB_PASSWORD
dbname = xui

[redis]
host = 127.0.0.1
port = 6379
password = LB_REDIS_PASSWORD
db = 0

[panel]
url = https://lb1.tudominio.com
timezone = America/Managua

[server]
type = 2  ; Load Balancer
parent_id = 1  ; MAIN server ID

[streaming]
ffmpeg_cpu = 7.0
segment_type = hls
seg_time = 10
seg_list_size = 5

[cluster]
enabled = 1
main_host = MAIN_IP
main_port = 443
heartbeat_interval = 10
EOF
```

#### 3. Sincronización de Archivos (lsyncd)

```bash
# En MAIN
apt install -y lsyncd

cat > /etc/lsyncd/lsyncd.conf.lua <<'EOF'
settings {
    logfile = "/var/log/lsyncd.log",
    statusFile = "/var/log/lsyncd-status.log",
    statusInterval = 20,
    nodaemon = false,
}

sync {
    default.rsyncssh,
    source = "/var/www/xui/decoded",
    host = "lb1.tudominio.com",
    targetdir = "/var/www/xui/decoded",
    rsync = {
        archive = true,
        compress = true,
        _extra = {"--exclude=tmp/", "--exclude=config/"}
    },
    delay = 5,
}

sync {
    default.rsyncssh,
    source = "/var/www/xui/decoded",
    host = "lb2.tudominio.com",
    targetdir = "/var/www/xui/decoded",
    rsync = {
        archive = true,
        compress = true,
        _extra = {"--exclude=tmp/", "--exclude=config/"}
    },
    delay = 5,
}
EOF

systemctl enable --now lsyncd
```

---

## 🔧 Troubleshooting

### Problemas Comunes

| Síntoma | Causa | Solución |
|---------|-------|----------|
| **403 Forbidden en /** | Falta `index init.php` en nginx | Agregar `index init.php;` y `try_files $uri $uri/ /init.php?$query_string;` |
| **403 en /admin/** | Symlink incorrecto | `rm -rf /var/www/xui/decoded/www/admin && ln -sf ../admin /var/www/xui/decoded/www/admin` |
| **File not found (PHP)** | SCRIPT_FILENAME incorrecto | Usar `$request_filename` con alias, `$document_root$fastcgi_script_name` sin alias |
| **goto labelXX undefined** | Archivo decodificado corrupto | `git checkout -- decoded/player/functions.php` |
| **Primary script unknown** | Nginx no encuentra .php | Verificar `root` y `alias` en locations anidados |
| **502 Bad Gateway** | PHP-FPM caído / socket wrong | `systemctl restart php8.3-fpm` y verificar socket path |
| **SSL Certificate Error** | Certbot no renovó | `certbot renew --dry-run` y verificar cron |

### Logs Clave

```bash
# Nginx
tail -f /var/log/nginx/xui_error.log
tail -f /var/log/nginx/xui_access.log

# PHP-FPM
tail -f /var/log/php8.3-fpm-xui.log

# XUI Application
tail -f /var/www/xui/tmp/logs/*.log

# Systemd
journalctl -u nginx -u php8.3-fpm -u mariadb -u keydb -f

# Fail2ban
fail2ban-client status xui-login
```

### Debugging PHP

```bash
# Habilitar display_errors temporalmente
sed -i 's/display_errors = Off/display_errors = On/' /etc/php/8.3/fpm/php.ini
systemctl restart php8.3-fpm

# Ejecutar script directamente
php /var/www/xui/decoded/www/init.php

# Verificar sintaxis
php -l /var/www/xui/decoded/player/functions.php

# Xdebug (si instalado)
# apt install php8.3-xdebug
```

---

## 📚 Referencias y Recursos

### Documentación Oficial
- **XUI One Decoded:** https://github.com/TalaveraSama/xuione-decoded
- **Documentación IUX-ZONE:** https://github.com/TalaveraSama/IUX-ZONE
- **XC_VM (Arquitectura moderna):** https://vateron-media.github.io/XC_VM/latest/
- **XC_VM Repo:** https://github.com/Vateron-Media/XC_VM

### Guías XC_VM Aplicables
- [Arquitectura](https://vateron-media.github.io/XC_VM/latest/development/architecture/)
- [Bootstrap Contexts](https://vateron-media.github.io/XC_VM/latest/development/bootstrap-contexts/)
- [Streaming Subsystem](https://vateron-media.github.io/XC_VM/latest/development/streaming-subsystem/)
- [Cluster API](https://vateron-media.github.io/XC_VM/latest/development/cluster-api/)
- [Module System](https://vateron-media.github.io/XC_VM/latest/development/module-authoring/)
- [Security](https://vateron-media.github.io/XC_VM/latest/guides/authentication-and-sessions/)
- [Database Migrations](https://vateron-media.github.io/XC_VM/latest/guides/database-migrations/)

### Herramientas Útiles
- **yt-dlp:** https://github.com/yt-dlp/yt-dlp
- **Deno:** https://deno.land/
- **KeyDB:** https://github.com/JohnSully/KeyDB
- **FFmpeg Builds:** https://ffmpeg.org/download.html
- **MariaDB Repo:** https://mariadb.org/download/

---

## ✅ Checklist Post-Instalación

- [ ] Sistema actualizado y paquetes base instalados
- [ ] PHP 8.3 + FPM + Opcache JIT configurado
- [ ] MariaDB 10.11+ con optimizaciones InnoDB
- [ ] KeyDB 6.3+ con multi-threading
- [ ] FFmpeg 7.0+ con codecs hardware
- [ ] yt-dlp + Deno para VOD/YouTube
- [ ] Nginx con rate limiting, security headers, SSL
- [ ] Certificados Let's Encrypt válidos y auto-renovación
- [ ] Firewall UFW + Fail2Ban configurados
- [ ] Symlinks admin/player/reseller en www/
- [ ] Configuración config.ini correcta
- [ ] Cron jobs: monitor, queue, epg, cache, backup
- [ ] Health checks cada 5 minutos
- [ ] Backup diario verificado
- [ ] Logrotate configurado
- [ ] Monitoreo (Prometheus/Grafana opcional)
- [ ] Documentación de credenciales guardada segura

---

*Guía actualizada: 2024 - Para XUI One Decoded v1.5.13+ con mejoras de XC_VM*
*Repositorio: https://github.com/TalaveraSama/xuione-decoded*
*Documentación: https://github.com/TalaveraSama/IUX-ZONE*