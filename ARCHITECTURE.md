# XUI One Decoded - Architecture Documentation

Technical architecture overview of XUI One Decoded (xuione_decoded).

## 🏛️ System Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                        CLIENT APPLICATIONS                          │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌──────────┐  │
│  │ STB Emu     │  │ IPTV        │  │ TiviMate    │  │ Web      │  │
│  │             │  │ Smarters    │  │             │  │ Browser  │  │
│  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘  └────┬─────┘  │
└─────────┼────────────────┼────────────────┼─────────────┼────────┘
          │                │                │             │
          ▼                ▼                ▼             ▼
┌─────────────────────────────────────────────────────────────────────┐
│                      LOAD BALANCER / PROXY                          │
│                    (Nginx / HAProxy / Cloudflare)                   │
└────────────────────────────────┬────────────────────────────────────┘
                                 │
                                 ▼
┌─────────────────────────────────────────────────────────────────────┐
│                         WEB SERVER LAYER                            │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │                    Nginx / Apache                           │   │
│  │  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────────┐   │   │
│  │  │  SSL     │  │  Static  │  │  Rate    │  │  Proxy to    │   │   │
│  │  │  Term    │  │  Files   │  │  Limit   │  │  PHP-FPM     │   │   │
│  │  └──────────┘ └──────────┘ └──────────┘ └──────────────┘   │   │
│  └─────────────────────────────────────────────────────────────┘   │
└────────────────────────────────┬────────────────────────────────────┘
                                 │
                                 ▼
┌─────────────────────────────────────────────────────────────────────┐
│                      PHP-FPM APPLICATION LAYER                      │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │                     init.php (Bootstrap)                     │   │
│  │  ┌─────────────┐ ┌─────────────┐ ┌──────────────────────┐   │   │
│  │  │ constants   │  │  Database   │  │   XUI Core Class   │   │   │
│  │  │ .php        │  │  (pdo.php)  │  │   (xui.php)        │   │   │
│  │  └─────────────┘ └─────────────┘ └──────────────────────┘   │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                                                                     │
│  ┌──────────────┐ ┌──────────────┐ ┌──────────────┐ ┌──────────┐  │
│  │   Admin      │  │   Player     │  │    API       │  │  CLI     │  │
│  │   Panel      │  │   Frontend   │  │  Endpoints   │  │  Scripts │  │
│  │ (admin/)     │  │ (player/)    │  │ (www/)       │  │ (cli/)   │  │
│  └──────────────┘ └──────────────┘ └──────────────┘ └──────────┘  │
└────────────────────────────────┬────────────────────────────────────┘
                                 │
         ┌───────────────────────┼───────────────────────┐
         ▼                       ▼                       ▼
┌─────────────────┐   ┌─────────────────┐   ┌─────────────────┐
│   MySQL/MariaDB │   │      Redis      │   │   File System   │
│   (Primary DB)  │   │   (Cache/Sess)  │   │   (Cache/Logs)  │
└─────────────────┘   └─────────────────┘   └─────────────────┘
         │                       │                       │
         ▼                       ▼                       ▼
┌─────────────────────────────────────────────────────────────────────┐
│                      STREAMING SERVERS                              │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌──────────┐  │
│  │  FFmpeg     │  │   Nginx     │  │   SRS/      │  │  Custom  │  │
│  │  Transcode  │  │   RTMP/     │  │   MediaMTX  │  │  Origin  │  │
│  │             │  │   HLS       │  │             │  │  Servers │  │
│  └─────────────┘  └─────────────┘  └─────────────┘  └──────────┘  │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 📦 Module Architecture

### Core Modules

```
XUI Core (decoded/includes/xui.php)
├── Initialization & Bootstrap
│   ├── init() - Main entry point
│   ├── Configuration loading
│   ├── Database connection setup
│   └── Cache initialization
├── Database Abstraction (decoded/includes/pdo.php)
│   ├── Query builder
│   ├── Prepared statements
│   ├── Result handling
│   └── Error logging
├── Caching System
│   ├── File-based (igbinary)
│   ├── TTL management
│   ├── Cache keys: servers, bouquets, settings, categories
│   └── Auto-refresh on expiry
├── Security Layer
│   ├── Flood protection (per IP)
│   ├── Brute-force prevention (MAC/username)
│   ├── IP blocking (manual + auto)
│   ├── UA/ISP/ASN blocking
│   └── Whitelist (allowed IPs/domains)
├── Server Management
│   ├── Multi-server support
│   ├── Load balancing
│   ├── Health checks
│   ├── Stream routing
│   └── Protocol handling (HTTP/HTTPS/RTMP)
├── Content Management
│   ├── Bouquets (channels, movies, series, radios)
│   ├── Categories
│   ├── EPG sources
│   └── Providers
├── System Monitoring
│   ├── CPU/RAM/Disk/Network
│   ├── GPU (NVIDIA via nvidia-smi)
│   ├── Video/Audio devices (v4l2/arecord)
│   └── I/O stats (iostat)
└── Streaming/Transcoding
    ├── FFmpeg management
    ├── Segment generation (HLS/DASH)
    ├── Token authentication
    └── Timeshift support
```

### Directory Structure Details

```
xuione_decoded/
├── decoded/                          # Fully decoded source
│   ├── admin/                        # Admin Panel (~100 files)
│   │   ├── index.php                 # Dashboard
│   │   ├── login.php                 # Authentication
│   │   ├── servers.php               # Server management
│   │   ├── lines.php                 # User/line management
│   │   ├── bouquets.php              # Bouquet management
│   │   ├── streams.php               # Channel management
│   │   ├── movies.php                # VOD management
│   │   ├── series.php                # Series management
│   │   ├── epgs.php                  # EPG management
│   │   ├── settings.php              # Panel settings
│   │   ├── dashboard.php             # Statistics
│   │   ├── process_monitor.php       # System monitor
│   │   ├── license.php               # License management
│   │   └── *.php                     # Other admin modules
│   │
│   ├── includes/                     # Core Libraries
│   │   ├── xui.php                   # MAIN CORE CLASS (2000+ lines)
│   │   ├── pdo.php                   # Database abstraction
│   │   ├── admin.php                 # Admin helper functions
│   │   ├── admin_api.php             # Admin REST API
│   │   ├── reseller_api.php          # Reseller API
│   │   ├── ts.php                    # Timeshift handling
│   │   ├── cli/                      # CLI Scripts (20+ files)
│   │   │   ├── monitor.php           # System monitoring
│   │   │   ├── queue.php             # Task queue
│   │   │   ├── record.php            # Recording manager
│   │   │   ├── proxy.php             # Proxy management
│   │   │   ├── epg.php               # EPG updater
│   │   │   ├── scanner.php           # Channel scanner
│   │   │   ├── update.php            # Auto-updater
│   │   │   ├── watchdog.php          # Process watchdog
│   │   │   └── *.php                 # Other CLI tools
│   │   ├── libs/                     # Third-party libraries
│   │   │   ├── TMDb/                 # TMDB API client
│   │   │   ├── m3u.php               # M3U playlist parser
│   │   │   ├── m3u_v2.php            # M3U v2 parser
│   │   │   ├── iptables.php          # Firewall management
│   │   │   ├── mobiledetect.php      # Device detection
│   │   │   └── XmlStringStreamer.php # XML streaming
│   │   └── api/                      # API implementations
│   │       ├── admin/                # Admin API endpoints
│   │       └── reseller/             # Reseller API endpoints
│   │
│   ├── player/                       # Player Frontend
│   │   ├── index.php                 # Player homepage
│   │   ├── live.php                  # Live TV player
│   │   ├── movie.php                 # VOD player
│   │   ├── series.php                # Series player
│   │   ├── episodes.php              # Episode list
│   │   ├── listings.php              # Channel listings
│   │   ├── login.php                 # Player login
│   │   └── libs/                     # Player-specific libs
│   │
│   ├── reseller/                     # Reseller Panel
│   │   ├── index.php                 # Reseller dashboard
│   │   ├── lines.php                 # Line management
│   │   ├── users.php                 # Sub-user management
│   │   ├── tickets.php               # Support tickets
│   │   └── *.php                     # Other reseller modules
│   │
│   ├── www/                          # Web Entry Points
│   │   ├── init.php                  # Bootstrap
│   │   ├── constants.php             # Path constants
│   │   ├── player_api.php            # Player API (STB apps)
│   │   ├── api.php                   # Main API
│   │   ├── playlist.php              # M3U generation
│   │   ├── epg.php                   # EPG XMLTV
│   │   ├── live.php                  # Live streaming
│   │   ├── vod.php                   # VOD streaming
│   │   ├── timeshift.php             # Catchup/timeshift
│   │   ├── enigma2.php               # Enigma2 support
│   │   ├── xplugin.php               # XPlugin support
│   │   ├── proxy_api.php             # Proxy API
│   │   ├── thumb.php                 # Thumbnail proxy
│   │   └── admin/                    # Admin web endpoints
│   │
│   ├── crons/                        # Scheduled tasks
│   ├── bin/                          # Binaries
│   ├── tools                         # Utility scripts
│   └── status                        # Status file
│
└── opc/                              # OPCache compiled version
    └── (mirror of decoded/ structure)
```

---

## 🔄 Data Flow

### 1. Player API Request Flow
```
STB App
   │
   ▼
GET /player_api.php?username=X&password=Y&action=get_live_streams
   │
   ▼
Nginx → PHP-FPM → init.php
   │
   ▼
XUI::init() → Load config, connect DB, load cache
   │
   ▼
Validate credentials (check line, expiry, connections)
   │
   ▼
Check flood/brute-force protection
   │
   ▼
Query database for streams (with category filter)
   │
   ▼
Apply bouquet permissions for user
   │
   ▼
Format JSON response
   │
   ▼
Return to client
```

### 2. Live Streaming Flow
```
Client requests: /live.php?stream=123&token=abc
   │
   ▼
Nginx → PHP-FPM → init.php
   │
   ▼
Validate token (check expiry, IP match, stream access)
   │
   ▼
Determine streaming server (load balance)
   │
   ▼
Generate stream URL (HLS/TS/RTMP)
   │
   ▼
If transcoding needed → FFmpeg process
   │
   ▼
Proxy/redirect to streaming server
   │
   ▼
Stream segments delivered via Nginx/HLS
```

### 3. Admin Panel Flow
```
Admin Browser → /admin/
   │
   ▼
Nginx → PHP-FPM → init.php
   │
   ▼
Check admin session (cookie/database)
   │
   ▼
Load XUI core, settings, servers
   │
   ▼
Route to admin module (servers.php, lines.php, etc.)
   │
   ▼
Process GET/POST
   │
   ▼
Database operations via XUI::$db
   │
   ▼
Render template (header + content + footer)
   │
   ▼
Return HTML
```

---

## 🗃️ Database Schema Overview

### Core Tables
```sql
-- Users/Lines
CREATE TABLE `users` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `username` VARCHAR(100) UNIQUE,
    `password` VARCHAR(100),
    `status` TINYINT DEFAULT 1,
    `exp_date` INT,
    `max_connections` INT DEFAULT 1,
    `bouquet` TEXT,              -- JSON array of bouquet IDs
    `allowed_output_formats` TEXT, -- JSON array
    `is_trial` TINYINT DEFAULT 0,
    `created_at` INT,
    `notes` TEXT
);

-- Servers
CREATE TABLE `servers` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `server_ip` VARCHAR(45),
    `private_ip` VARCHAR(45),
    `domain_name` TEXT,
    `http_broadcast_port` INT DEFAULT 8080,
    `https_broadcast_port` INT DEFAULT 443,
    `rtmp_port` INT DEFAULT 1935,
    `server_type` TINYINT DEFAULT 1,  -- 1=main, 2=load balancer
    `enabled` TINYINT DEFAULT 1,
    `status` TINYINT DEFAULT 1,
    `parent_id` TEXT,                 -- JSON array for load balancer
    `geoip_countries` TEXT,           -- JSON
    `isp_names` TEXT,                 -- JSON
    `last_check_ago` INT
);

-- Streams (Live TV)
CREATE TABLE `streams` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `name` VARCHAR(255),
    `stream_type` ENUM('live','movie','series','radio'),
    `stream_source` TEXT,
    `stream_icon` VARCHAR(500),
    `category_id` INT,
    `epg_channel_id` VARCHAR(100),
    `added` INT,
    `is_adult` TINYINT DEFAULT 0,
    `tv_archive` TINYINT DEFAULT 0,
    `tv_archive_duration` INT DEFAULT 0
);

-- Categories
CREATE TABLE `streams_categories` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `category_name` VARCHAR(255),
    `category_type` ENUM('live','movie','series','radio'),
    `cat_order` INT DEFAULT 0,
    `parent_id` INT DEFAULT 0
);

-- Bouquets
CREATE TABLE `bouquets` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `bouquet_name` VARCHAR(255),
    `bouquet_channels` TEXT,    -- JSON array of stream IDs
    `bouquet_movies` TEXT,      -- JSON array
    `bouquet_series` TEXT,      -- JSON array
    `bouquet_radios` TEXT,      -- JSON array
    `bouquet_order` INT DEFAULT 0
);

-- EPG
CREATE TABLE `epg` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `epg_name` VARCHAR(255),
    `epg_url` TEXT,
    `epg_source` VARCHAR(50),
    `enabled` TINYINT DEFAULT 1,
    `last_update` INT
);

-- Settings
CREATE TABLE `settings` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `license` VARCHAR(255),
    `security_key` VARCHAR(255),
    `default_timezone` VARCHAR(50),
    `segment_type` VARCHAR(20),
    `seg_time` INT,
    `seg_list_size` INT,
    `seg_delete_threshold` INT,
    `ffmpeg_cpu` VARCHAR(10),
    `flood_limit` INT,
    `flood_seconds` INT,
    `bruteforce_mac_attempts` INT,
    `bruteforce_username_attempts` INT,
    `bruteforce_frequency` INT,
    -- ... many more settings
);

-- Blocking
CREATE TABLE `blocked_ips` (`ip` VARCHAR(45), `notes` TEXT, `date` INT);
CREATE TABLE `blocked_uas` (`id` INT, `exact_match` TINYINT, `blocked_ua` TEXT);
CREATE TABLE `blocked_isps` (`id` INT, `isp` VARCHAR(255), `blocked` TINYINT);
CREATE TABLE `blocked_asns` (`asn` VARCHAR(20), `blocked` TINYINT);
CREATE TABLE `allowed_ips` (`ip` VARCHAR(45));

-- Logs
CREATE TABLE `panel_logs` (`id` INT, `date` INT, `type` VARCHAR(50), `message` TEXT);
CREATE TABLE `login_logs` (`id` INT, `date` INT, `username` VARCHAR(100), `ip` VARCHAR(45), `status` TINYINT);
CREATE TABLE `client_logs` (`id` INT, `date` INT, `username` VARCHAR(100), `ip` VARCHAR(45), `action` VARCHAR(50));
```

---

## 🔐 Security Architecture

### Authentication Layers
```
┌─────────────────────────────────────────────────────────────┐
│                    REQUEST ENTRY                            │
└─────────────────────────┬───────────────────────────────────┘
                          │
         ┌────────────────┼────────────────┐
         ▼                ▼                ▼
┌────────────────┐ ┌────────────────┐ ┌────────────────┐
│   Flood Check  │ │ Brute-force    │ │  IP Blocking   │
│  (per IP/sec)  │ │  (MAC/User)    │ │  (Auto/Manual) │
└────────┬───────┘ └────────┬───────┘ └────────┬───────┘
         │                  │                  │
         └──────────────────┼──────────────────┘
                            ▼
                 ┌─────────────────────┐
                 │   Token Validation  │
                 │  (Stream/Player)    │
                 └──────────┬──────────┘
                            ▼
                 ┌─────────────────────┐
                 │  Session Validation │
                 │   (Admin/Reseller)  │
                 └──────────┬──────────┘
                            ▼
                 ┌─────────────────────┐
                 │  Permission Check   │
                 │  (Bouquet/Feature)  │
                 └─────────────────────┘
```

### Token Generation
```php
// Stream token (time-limited, IP-bound)
$token = md5(
    $stream_id . 
    $client_ip . 
    $expiry_time . 
    XUI::$rSettings['security_key'] . 
    $user_agent_hash
);

// Player API token
$api_token = substr(
    md5(XUI::$rSettings['live_streaming_pass']), 
    0, 15
);
```

---

## ⚡ Performance Optimization

### Caching Strategy
```
┌─────────────────────────────────────────────────────────────┐
│                    CACHE LAYERS                             │
├─────────────────────────────────────────────────────────────┤
│  1. OPcache (PHP bytecode)                                  │
│     - Enabled in php.ini                                    │
│     - 256MB memory, 20000 max files                         │
├─────────────────────────────────────────────────────────────┤
│  2. Redis (Session + transient data)                        │
│     - User sessions                                         │
│     - Rate limiting counters                                │
│     - Temporary API responses                               │
├─────────────────────────────────────────────────────────────┤
│  3. File Cache (igbinary serialized)                        │
│     - Servers list (10s TTL)                                │
│     - Bouquets (60s TTL)                                    │
│     - Settings (20s TTL)                                    │
│     - Blocked IPs/UA/ISP (20s TTL)                          │
│     - Categories (20s TTL)                                  │
├─────────────────────────────────────────────────────────────┤
│  4. Nginx FastCGI Cache                                     │
│     - Player API responses (5-30s)                          │
│     - EPG XML (1-6 hours)                                   │
│     - M3U playlists (5-10 min)                              │
├─────────────────────────────────────────────────────────────┤
│  5. Browser/CDN Cache                                       │
│     - Static assets (30 days)                               │
│     - Stream segments (via HLS headers)                     │
└─────────────────────────────────────────────────────────────┘
```

### Database Optimization
```sql
-- Key indexes
CREATE INDEX idx_users_username ON users(username);
CREATE INDEX idx_users_status_exp ON users(status, exp_date);
CREATE INDEX idx_streams_category ON streams(category_id, stream_type);
CREATE INDEX idx_streams_epg ON streams(epg_channel_id);
CREATE INDEX idx_bouquets_order ON bouquets(bouquet_order);
CREATE INDEX idx_servers_enabled ON servers(enabled, status);
CREATE INDEX idx_blocked_ips_ip ON blocked_ips(ip);
CREATE INDEX idx_login_logs_date ON login_logs(date);
```

### Connection Pooling
- **PHP-FPM**: Dynamic process management (pm.max_children = 50)
- **MySQL**: Persistent connections via PDO
- **Redis**: Connection reuse (pconnect)

---

## 📡 Streaming Architecture

### Supported Protocols
```
┌─────────────────────────────────────────────────────────────┐
│                    STREAMING PROTOCOLS                      │
├──────────────┬──────────────┬──────────────┬──────────────┤
│     HLS      │     DASH     │    RTMP      │   MPEG-TS    │
│  (Primary)   │  (Optional)  │  (Legacy)    │  (Direct)    │
├──────────────┼──────────────┼──────────────┼──────────────┤
│ .m3u8        │ .mpd         │ rtmp://      │ .ts/.mp4     │
│ Segmented    │ Segmented    │ Persistent   │ Single file  │
│ AES-128 enc  │ CENC enc     │ Low latency  │ No encryption│
│ Adaptive     │ Adaptive     │ Flash/STB    │ Simple       │
└──────────────┴──────────────┴──────────────┴──────────────┘
```

### Transcoding Pipeline
```
Source Stream
     │
     ▼
┌─────────────────────────────────────────┐
│         FFmpeg (Hardware/Software)      │
├─────────────────────────────────────────┤
│  - decode → filter → encode             │
│  - H.264/H.265 (CPU/NVENC/QSV/AMF)      │
│  - AAC/AC3 audio                        │
│  - Segment: 10s (configurable)          │
│  - Playlist: 5 segments (configurable)  │
└─────────────────────────────────────────┘
     │
     ▼
Segment Files (.ts) + Playlist (.m3u8)
     │
     ▼
Nginx HLS Module / Custom PHP Delivery
     │
     ▼
Client (HLS.js, native, STB)
```

---

## 🔧 CLI Subsystem

### Process Management
```
┌─────────────────────────────────────────────────────────────┐
│                    CLI ARCHITECTURE                         │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  Cron (system)                                              │
│     │                                                       │
│     ├── monitor.php ──────► System stats → DB/Redis        │
│     ├── queue.php ────────► Process task queue             │
│     ├── epg.php ─────────► Update EPG from sources         │
│     ├── record.php ───────► Manage recordings              │
│     ├── proxy.php ────────► Health check proxies           │
│     ├── scanner.php ──────► Scan/validate streams          │
│     ├── watchdog.php ─────► Monitor critical processes     │
│     ├── update.php ────────► Check/apply updates           │
│     ├── cache_handler.php ► Clean/optimize cache           │
│     └── backup.php ────────► Database/files backup         │
│                                                             │
│  Daemon (systemd/supervisor)                                │
│     ├── balancer.php ─────► Load balancer daemon           │
│     ├── loopback.php ─────► Internal loopback server       │
│     └── signals.php ───────► Signal handling               │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### Inter-Process Communication
- **File-based locks** (flock) for mutual exclusion
- **Database** for task queue and state
- **Redis** for real-time messaging
- **Unix sockets** for high-performance local communication

---

## 🔄 High Availability

### Load Balancer Setup
```
                    ┌─────────────┐
                    │   Client    │
                    └──────┬──────┘
                           │
                    ┌──────▼──────┐
                    │  Load       │
                    │  Balancer   │
                    │ (Nginx/HAProxy)       
                    └──────┬──────┘
                           │
          ┌────────────────┼────────────────┐
          ▼                ▼                ▼
    ┌─────────┐      ┌─────────┐      ┌─────────┐
    │ Server 1│      │ Server 2│      │ Server N│
    │ (Main)  │      │(Backup) │      │ (Edge)  │
    └────┬────┘      └────┬────┘      └────┬────┘
         │                │                │
         └────────────────┼────────────────┘
                          ▼
                 ┌─────────────────┐
                 │ Shared Database │
                 │   (Galera/      │
                 │  Replication)   │
                 └─────────────────┘
```

### Failover Strategy
1. **Health Checks**: Every 30s via watchdog
2. **Auto-failover**: Load balancer removes unhealthy servers
3. **Session Persistence**: Redis-backed sessions
4. **Database**: Master-slave or Galera cluster
5. **File Sync**: lsyncd/rsync for shared assets

---

## 📊 Monitoring & Observability

### Metrics Collection
```
┌─────────────────────────────────────────────────────────────┐
│                    MONITORING STACK                         │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  Application Metrics (XUI)                                  │
│  ├── Active connections (per server)                        │
│  ├── Bandwidth usage (in/out)                               │
│  ├── CPU/RAM/Disk per server                                │
│  ├── Stream status (online/offline)                         │
│  ├── Error rates (5xx, timeouts)                            │
│  └── Queue depth                                            │
│                                                             │
│  Infrastructure Metrics                                     │
│  ├── Node Exporter (Prometheus)                             │
│  ├── Nginx metrics (stub_status)                            │
│  ├── MySQL metrics (mysqld_exporter)                        │
│  ├── Redis metrics (redis_exporter)                         │
│  └── PHP-FPM metrics (pm.status_path)                       │
│                                                             │
│  Logging                                                    │
│  ├── Structured JSON logs                                   │
│  ├── ELK/EFK Stack                                          │
│  ├── Log rotation (daily, 30 days)                          │
│  └── Alerting (PagerDuty, Slack, Email)                     │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## 🔮 Future Architecture Considerations

### Planned Improvements
- [ ] **Microservices**: Split API, streaming, admin into separate services
- [ ] **Kubernetes**: Container orchestration for scaling
- [ ] **GraphQL API**: Flexible data querying
- [ ] **WebRTC**: Ultra-low latency streaming
- [ ] **S3-compatible**: Object storage for recordings/assets
- [ ] **Event-driven**: Kafka/RabbitMQ for async processing
- [ ] **Multi-region**: Geo-distributed streaming edges

---

*Architecture documentation for XUI One Decoded v1.5.13*
*Based on analysis of [tealcavalon/xuione_decoded](https://github.com/tealcavalon/xuione_decoded)*