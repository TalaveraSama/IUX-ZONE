# IUX-ZONE

Documentation and resources for XUI One Decoded (xuione_decoded) - A fork of the original XUI One IPTV Panel decoded source code.

## 📖 Overview

This repository contains comprehensive documentation for **XUI One Decoded** - the decoded/deobfuscated source code of XUI One, an IPTV panel management system. The original repository is [tealcavalon/xuione_decoded](https://github.com/tealcavalon/xuione_decoded) (Apache License 2.0).

## 📁 Repository Structure

### Original Repository (xuione_decoded)

```
xuione_decoded/
├── .gitattributes
├── LICENSE (Apache 2.0)
├── decoded/                 # Fully decoded/deobfuscated source
│   ├── admin/              # Admin panel PHP files (~100+ files)
│   ├── bin/                # Binary files
│   ├── crons/              # Cron job scripts
│   ├── includes/           # Core libraries and classes
│   │   ├── admin.php       # Admin functions
│   │   ├── admin_api.php   # Admin API endpoints
│   │   ├── api/            # API implementations
│   │   ├── cli/            # CLI command scripts
│   │   ├── libs/           # Third-party libraries (TMDb, m3u, etc.)
│   │   ├── pdo.php         # Database abstraction layer
│   │   ├── reseller_api.php# Reseller API
│   │   ├── ts.php          # Time-shift handling
│   │   └── xui.php         # Core XUI class (main entry point)
│   ├── player/             # Player/front-end interface
│   ├── reseller/           # Reseller panel
│   ├── status              # Status file
│   ├── tools               # Utility scripts
│   └── www/                # Web entry points (API, player, etc.)
└── opc/                    # OPC cached/compiled version
```

## 🔧 Core Components

### 1. XUI Class (`decoded/includes/xui.php`)
The main entry point and core class handling:
- **Initialization** (`init()`): Sets up configuration, settings, servers, bouquets
- **Database management**: Handles MySQL connections via Database class
- **Caching**: Uses igbinary serialization for performance
- **Security**: Flood protection, brute-force prevention, IP blocking
- **Server management**: Multi-server support with load balancing
- **System monitoring**: CPU, memory, disk, network, GPU (NVIDIA)

### 2. Database Layer (`decoded/includes/pdo.php`)
- PDO-based MySQL abstraction
- Prepared statement support
- Query logging and error handling
- Connection management with automatic reconnection

### 3. Web Entry Points (`decoded/www/`)
- `init.php` - Bootstrap file
- `player_api.php` - Player API (STB/mobile apps)
- `api.php` - Main API endpoint
- `playlist.php` - M3U playlist generation
- `epg.php` - EPG XMLTV generation
- `live.php` / `vod.php` / `timeshift.php` - Streaming endpoints
- `enigma2.php` - Enigma2 device support
- `xplugin.php` - XPlugin support

### 4. Admin Panel (`decoded/admin/`)
~100+ PHP files covering:
- Dashboard, servers, lines, users
- Bouquets, channels, movies, series
- EPG management, providers
- Settings, licenses, logs
- Proxy, load balancing, monitoring

### 5. CLI Scripts (`decoded/includes/cli/`)
- `monitor.php` - System monitoring
- `queue.php` - Task queue processing
- `record.php` - Recording management
- `proxy.php` - Proxy management
- `update.php` - Auto-updates
- `scanner.php` - Channel scanning
- And more...

## 📋 Requirements

- **PHP 7.4+** (8.x recommended)
- **MySQL/MariaDB 5.7+**
- **Redis** (for caching/sessions)
- **FFmpeg** (for transcoding/streaming)
- **Nginx/Apache** web server
- **ionCube Loader** (for encoded version - not needed for decoded)
- **PHP Extensions**: pdo_mysql, redis, igbinary, curl, openssl, mbstring, json, xml, zip, gd

## 🚀 Installation

### 1. Database Setup
```sql
CREATE DATABASE xui CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'xui'@'localhost' IDENTIFIED BY 'secure_password';
GRANT ALL PRIVILEGES ON xui.* TO 'xui'@'localhost';
FLUSH PRIVILEGES;
```

### 2. Configuration
Copy and configure `config.ini`:
```ini
[database]
host = localhost
port = 3306
username = xui
password = secure_password
dbname = xui

[redis]
host = 127.0.0.1
port = 6379

[panel]
url = https://your-domain.com
```

### 3. Web Server (Nginx Example)
```nginx
server {
    listen 80;
    server_name your-domain.com;
    root /var/www/xuione/decoded/www;
    index index.php;
    
    location / {
        try_files $uri $uri/ /init.php?$query_string;
    }
    
    location ~ \.php$ {
        fastcgi_pass unix:/run/php/php8.1-fpm.sock;
        fastcgi_param SCRIPT_FILENAME $document_root$fastcgi_script_name;
        include fastcgi_params;
    }
}
```

## 📚 API Documentation

### Player API (`player_api.php`)
Used by STB apps (STB Emu, IPTV Smarters, TiviMate, etc.)

| Endpoint | Description |
|----------|-------------|
| `/player_api.php?username=X&password=Y&action=get_live_streams` | Get live channels |
| `/player_api.php?username=X&password=Y&action=get_vod_streams` | Get VOD content |
| `/player_api.php?username=X&password=Y&action=get_series` | Get series |
| `/player_api.php?username=X&password=Y&action=get_live_categories` | Get channel categories |
| `/player_api.php?username=X&password=Y&action=get_short_epg` | Get EPG data |

### Admin API
Internal API for admin panel operations - see `decoded/includes/admin_api.php`

## 🔒 Security Features

- **Flood Protection**: Rate limiting per IP
- **Brute-force Prevention**: MAC and username attempt tracking
- **IP Blocking**: Manual and automatic (flood/brute-force)
- **UA Blocking**: User-agent based blocking
- **ISP/ASN Blocking**: Network-level blocking
- **Allowed IPs/Domains**: Whitelist support
- **HTTPS/SSL**: Full SSL termination support

## 🏗️ Architecture

```
┌─────────────────────────────────────┐
│         Web Server (Nginx)          │
└──────────────┬──────────────────────┘
               │
┌──────────────▼──────────────────────┐
│         PHP-FPM                     │
│  ┌─────────────────────────────┐    │
│  │      init.php (Bootstrap)   │    │
│  └──────────────┬──────────────┘    │
└─────────────────│────────────────────┘
                  │
      ┌───────────┼───────────┐
      ▼           ▼           ▼
┌──────────┐ ┌──────────┐ ┌──────────┐
│  Admin   │ │  Player  │ │   API    │
│  Panel   │ │  Front   │ │ Endpoints│
└──────────┘ └──────────┘ └──────────┘
      │           │           │
      └───────────┼───────────┘
                  │
      ┌───────────▼───────────┐
      │    XUI Core Class     │
      │  (decoded/xui.php)    │
      └───────────┬───────────┘
                  │
      ┌───────────┼───────────┐
      ▼           ▼           ▼
┌──────────┐ ┌──────────┐ ┌──────────┐
│ Database │ │  Redis   │ │  File    │
│ (MySQL)  │ │ (Cache)  │ │  Cache   │
└──────────┘ └──────────┘ └──────────┘
```

## 📦 Fork Information

This documentation is for a fork of [tealcavalon/xuione_decoded](https://github.com/tealcavalon/xuione_decoded) maintained at:

**Fork Repository**: [TalaveraSama/xuione-decoded](https://github.com/TalaveraSama/xuione-decoded)

### Key Points:
- ✅ **No modifications** - Exact copy of original
- ✅ **Fully functional** - All features preserved
- ✅ **Apache 2.0 License** - Same as original
- ✅ **Decoded source** - No ionCube encoding needed

## 🤝 Contributing

This is a documentation-only fork. For code contributions, please refer to the original repository.

## 📄 License

Apache License 2.0 - See [LICENSE](../xuione_decoded/LICENSE) for details.

Original work by [tealcavalon](https://github.com/tealcavalon).

## 🔗 Links

- **Original Repository**: https://github.com/tealcavalon/xuione_decoded
- **Documentation Repository**: https://github.com/TalaveraSama/IUX-ZONE
- **Fork Repository**: https://github.com/TalaveraSama/xuione-decoded

---

*Generated documentation for XUI One Decoded v1.5.13*