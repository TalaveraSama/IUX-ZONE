# XUI One Decoded - Configuration Guide

Complete configuration reference for XUI One Decoded.

## 📁 Configuration Files

### 1. Main Config: `config/config.ini`
```ini
[database]
host = localhost
port = 3306
username = xui
password = YOUR_SECURE_PASSWORD
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
theme = default

[security]
flood_limit = 50
flood_seconds = 60
flood_ips_exclude = 127.0.0.1,::1
bruteforce_mac_attempts = 10
bruteforce_username_attempts = 10
bruteforce_frequency = 300
allowed_ips = 
blocked_ips = 
blocked_ua = 
blocked_isp = 
blocked_asn = 

[streaming]
ffmpeg_cpu = 4.4
ffmpeg_gpu = 4.0
segment_type = hls
seg_time = 10
seg_list_size = 5
seg_delete_threshold = 3
hls_encryption = 0
token_expiry = 3600

[paths]
home = /var/www/xui/
tmp = /var/www/xui/tmp/
logs = /var/www/xui/tmp/logs/
cache = /var/www/xui/tmp/cache/
flood = /var/www/xui/tmp/flood/
records = /var/www/xui/tmp/records/
thumbnails = /var/www/xui/tmp/thumbnails/

[epg]
update_interval = 21600
source_timeout = 30
max_epg_days = 7

[recording]
max_concurrent = 5
default_duration = 7200
keep_days = 30
format = ts

[transcoding]
enabled = 1
preset = fast
crf = 23
audio_bitrate = 128k
video_codec = libx264
audio_codec = aac
hwaccel = auto

[cdn]
enabled = 0
provider = cloudflare
api_key = 
zone_id = 
```

### 2. Constants: `decoded/www/constants.php`
```php
<?php

// Base paths
define('XUI_HOME', '/var/www/xui/');
define('CONFIG_PATH', XUI_HOME . 'config/');
define('INCLUDES_PATH', XUI_HOME . 'includes/');
define('ADMIN_PATH', XUI_HOME . 'decoded/admin/');
define('PLAYER_PATH', XUI_HOME . 'decoded/player/');
define('RESELLER_PATH', XUI_HOME . 'decoded/reseller/');

// Cache paths
define('CACHE_TMP_PATH', XUI_HOME . 'tmp/cache/');
define('FLOOD_TMP_PATH', XUI_HOME . 'tmp/flood/');
define('LOG_PATH', XUI_HOME . 'tmp/logs/');
define('THUMB_TMP_PATH', XUI_HOME . 'tmp/thumbnails/');
define('RECORD_TMP_PATH', XUI_HOME . 'tmp/records/');

// FFmpeg binaries
define('FFMPEG_BIN_40', '/usr/bin/ffmpeg');
define('FFMPEG_BIN_43', '/usr/bin/ffmpeg-4.3');
define('FFMPEG_BIN_44', '/usr/bin/ffmpeg-4.4');
define('FFPROBE_BIN_40', '/usr/bin/ffprobe');
define('FFPROBE_BIN_43', '/usr/bin/ffprobe-4.3');
define('FFPROBE_BIN_44', '/usr/bin/ffprobe-4.4');

// Streaming ports
define('HTTP_BROADCAST_PORT', 8080);
define('HTTPS_BROADCAST_PORT', 443);
define('RTMP_PORT', 1935);

// Security
define('OPENSSL_EXTRA', 'xui_extra_salt');

// Version
define('XUI_VERSION', '1.5.13');
```

---

## ⚙️ Configuration Sections Detail

### Database Configuration
| Parameter | Description | Default |
|-----------|-------------|---------|
| `host` | MySQL host | localhost |
| `port` | MySQL port | 3306 |
| `username` | Database user | xui |
| `password` | Database password | **Required** |
| `dbname` | Database name | xui |

### Redis Configuration
| Parameter | Description | Default |
|-----------|-------------|---------|
| `host` | Redis host | 127.0.0.1 |
| `port` | Redis port | 6379 |
| `password` | Redis password | (empty) |
| `db` | Redis database number | 0 |

### Panel Configuration
| Parameter | Description | Default |
|-----------|-------------|---------|
| `url` | Full panel URL (with protocol) | **Required** |
| `timezone` | PHP timezone | America/New_York |
| `language` | Default language | en |
| `theme` | Admin theme | default |

### Security Configuration
| Parameter | Description | Default |
|-----------|-------------|---------|
| `flood_limit` | Max requests per window | 50 |
| `flood_seconds` | Flood window (seconds) | 60 |
| `flood_ips_exclude` | Comma-separated IPs to exclude | 127.0.0.1,::1 |
| `bruteforce_mac_attempts` | Max MAC attempts | 10 |
| `bruteforce_username_attempts` | Max username attempts | 10 |
| `bruteforce_frequency` | Brute-force window (seconds) | 300 |
| `allowed_ips` | Whitelist IPs (comma-separated) | (empty) |
| `blocked_ips` | Blacklist IPs (comma-separated) | (empty) |
| `blocked_ua` | Blocked user agents (comma-separated) | (empty) |
| `blocked_isp` | Blocked ISPs (comma-separated) | (empty) |
| `blocked_asn` | Blocked ASNs (comma-separated) | (empty) |

### Streaming Configuration
| Parameter | Description | Default |
|-----------|-------------|---------|
| `ffmpeg_cpu` | FFmpeg version for CPU | 4.4 |
| `ffmpeg_gpu` | FFmpeg version for GPU | 4.0 |
| `segment_type` | Segment format (hls/dash) | hls |
| `seg_time` | Segment duration (seconds) | 10 |
| `seg_list_size` | Playlist segments count | 5 |
| `seg_delete_threshold` | Segments before cleanup | 3 |
| `hls_encryption` | Enable AES-128 encryption | 0 |
| `token_expiry` | Stream token validity (seconds) | 3600 |

### EPG Configuration
| Parameter | Description | Default |
|-----------|-------------|---------|
| `update_interval` | EPG update interval (seconds) | 21600 (6h) |
| `source_timeout` | EPG source timeout (seconds) | 30 |
| `max_epg_days` | Days of EPG to keep | 7 |

### Recording Configuration
| Parameter | Description | Default |
|-----------|-------------|---------|
| `max_concurrent` | Max simultaneous recordings | 5 |
| `default_duration` | Default recording length (seconds) | 7200 |
| `keep_days` | Days to keep recordings | 30 |
| `format` | Recording format | ts |

### Transcoding Configuration
| Parameter | Description | Default |
|-----------|-------------|---------|
| `enabled` | Enable transcoding | 1 |
| `preset` | FFmpeg preset (ultrafast..veryslow) | fast |
| `crf` | Constant Rate Factor (quality) | 23 |
| `audio_bitrate` | Audio bitrate | 128k |
| `video_codec` | Video codec | libx264 |
| `audio_codec` | Audio codec | aac |
| `hwaccel` | Hardware acceleration (auto/none/nvenc/qsv/amf) | auto |

---

## 🔧 Environment-Specific Configs

### Production
```ini
[security]
flood_limit = 30
flood_seconds = 60
bruteforce_mac_attempts = 5
bruteforce_username_attempts = 5
bruteforce_frequency = 600

[streaming]
hls_encryption = 1
token_expiry = 1800

[panel]
url = https://panel.yourdomain.com
```

### Development
```ini
[security]
flood_limit = 0
flood_seconds = 60
bruteforce_mac_attempts = 0
bruteforce_username_attempts = 0

[panel]
url = http://localhost:8080
```

### Load Balancer (Main)
```ini
[streaming]
ffmpeg_cpu = 4.4
segment_type = hls

[panel]
url = https://lb.yourdomain.com
```

### Edge Server
```ini
[database]
host = main-db.yourdomain.com

[redis]
host = main-redis.yourdomain.com

[streaming]
ffmpeg_cpu = 4.4

[panel]
url = https://edge1.yourdomain.com
```

---

## 🔐 Security Hardening

### 1. Database Security
```ini
# Use strong password
password = "Use-A-Very-Long-Random-String-Here-123!@#"

# Restrict MySQL user to specific host
GRANT ALL ON xui.* TO 'xui'@'10.0.0.%' IDENTIFIED BY 'password';
```

### 2. Redis Security
```bash
# redis.conf
bind 127.0.0.1
protected-mode yes
requirepass "StrongRedisPassword"
rename-command FLUSHDB ""
rename-command FLUSHALL ""
rename-command KEYS ""
rename-command CONFIG ""
```

### 3. PHP Security
```ini
; php.ini
disable_functions = exec,passthru,shell_exec,system,proc_open,popen,curl_exec,curl_multi_exec,parse_ini_file,show_source
expose_php = Off
display_errors = Off
log_errors = On
error_log = /var/log/php-errors.log
```

### 4. File Permissions
```bash
# Config files
chmod 640 /var/www/xui/config/config.ini
chown www-data:www-data /var/www/xui/config/config.ini

# Restrict access to sensitive dirs
chmod 750 /var/www/xui/tmp/cache
chmod 750 /var/www/xui/tmp/flood
chmod 750 /var/www/xui/tmp/logs
```

---

## 🌐 Multi-Server Configuration

### Server Types
| Type | ID | Description |
|------|-----|-------------|
| Main | 1 | Primary panel + streaming |
| Load Balancer | 2 | Distributes connections |
| Edge | 3 | Streaming only (no panel) |
| Backup | 4 | Failover server |

### Load Balancer Config
```ini
# Main server (load balancer)
[server_1]
type = 2
parent_id = [2,3,4]  # JSON array of edge server IDs
domain_name = lb.yourdomain.com,edge1.yourdomain.com,edge2.yourdomain.com
```

### Edge Server Config
```ini
# Edge server
[server_2]
type = 1
parent_id = 1
server_ip = 10.0.0.2
domain_name = edge1.yourdomain.com
```

---

## 📝 Configuration Validation

### Test Config
```bash
# Test database connection
php -r "
require 'decoded/includes/pdo.php';
\$db = new Database('TKbxeQrBXw2swDNwTh5yrj4jMV4RaLO0');
if (\$db->connected) echo 'DB: OK\n'; else echo 'DB: FAILED\n';
"

# Test Redis
php -r "
\$redis = new Redis();
\$redis->connect('127.0.0.1', 6379);
echo 'Redis: ' . (\$redis->ping() ? 'OK' : 'FAILED') . '\n';
"

# Test FFmpeg
php -r "
exec('ffmpeg -version', \$out, \$ret);
echo 'FFmpeg: ' . (\$ret === 0 ? 'OK' : 'FAILED') . '\n';
echo \$out[0] . '\n';
"
```

### Config Check Script
```bash
#!/bin/bash
# /usr/local/bin/xui-config-check.sh

echo "=== XUI Configuration Check ==="
echo ""

# Check config.ini exists
if [ -f /var/www/xui/config/config.ini ]; then
    echo "✓ config.ini exists"
else
    echo "✗ config.ini MISSING"
fi

# Check constants.php
if [ -f /var/www/xui/decoded/www/constants.php ]; then
    echo "✓ constants.php exists"
else
    echo "✗ constants.php MISSING"
fi

# Check directories
for dir in tmp/cache tmp/flood tmp/logs tmp/records tmp/thumbnails; do
    if [ -d "/var/www/xui/$dir" ]; then
        echo "✓ $dir exists"
    else
        echo "✗ $dir MISSING"
    fi
done

# Check permissions
if [ -w /var/www/xui/tmp/cache ]; then
    echo "✓ Cache writable"
else
    echo "✗ Cache NOT writable"
fi

# Check PHP extensions
for ext in pdo_mysql redis igbinary curl mbstring xml zip gd bcmath intl opcache; do
    if php -m | grep -q "^$ext$"; then
        echo "✓ PHP extension: $ext"
    else
        echo "✗ PHP extension MISSING: $ext"
    fi
done
```

---

## 🔄 Configuration Reload

Most configuration changes require:
```bash
# Clear cache
php /var/www/xui/decoded/includes/cli/cache_handler.php clear

# Restart PHP-FPM
systemctl reload php8.1-fpm

# Reload Nginx
systemctl reload nginx
```

Settings that **don't** require restart:
- Stream token expiry
- Flood/brute-force limits
- EPG update interval
- Recording settings

Settings that **require** restart:
- Database/Redis credentials
- FFmpeg paths
- Panel URL
- Timezone
- Segment settings

---

*Configuration Guide for XUI One Decoded v1.5.13*