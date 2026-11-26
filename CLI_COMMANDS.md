# XUI One Decoded - CLI Commands Reference

Complete reference for all CLI scripts in XUI One Decoded.

## 📋 Overview

CLI scripts are located in `decoded/includes/cli/` and are designed to be run via cron or systemd timers.

## 🛠️ Available Commands

### System Monitoring

#### monitor.php
**Purpose**: Collect system metrics (CPU, RAM, disk, network, GPU) and store in database
```bash
php includes/cli/monitor.php
```
**Schedule**: Every minute (`* * * * *`)
**Output**: Updates `servers` table with latest metrics

#### process_monitor.php (Admin Panel)
**Purpose**: Web-based process monitoring (accessible via admin panel)
```bash
# Not a CLI command - accessed via admin panel
```

### Task Queue

#### queue.php
**Purpose**: Process background task queue (recordings, conversions, notifications)
```bash
php includes/cli/queue.php
```
**Schedule**: Every minute (`* * * * *`)
**Queue Types**:
- Recording tasks
- Transcoding jobs
- EPG updates
- Notifications
- Backup tasks

### EPG Management

#### epg.php
**Purpose**: Fetch and process EPG data from configured sources
```bash
php includes/cli/epg.php
```
**Schedule**: Every 6 hours (`0 */6 * * *`)
**Features**:
- Downloads XMLTV from EPG sources
- Parses and stores in database
- Maps channels to EPG IDs
- Handles multiple EPG sources

### Recording Management

#### record.php
**Purpose**: Manage DVR recordings (start, stop, cleanup, segment)
```bash
php includes/cli/record.php [action] [options]

Actions:
  start     - Start scheduled recordings
  stop      - Stop completed recordings
  cleanup   - Remove expired recordings
  segment   - Create HLS segments for recordings
  status    - Check recording status
```
**Schedule**: Every minute for start/stop (`* * * * *`), daily for cleanup

### Channel Scanning

#### scanner.php
**Purpose**: Scan and validate streams, update stream status
```bash
php includes/cli/scanner.php [options]

Options:
  --server=ID     - Scan specific server
  --type=live     - Scan live streams only
  --type=vod      - Scan VOD only
  --fix           - Auto-fix broken streams
```
**Schedule**: Daily or weekly (`0 4 * * *`)

### Proxy Management

#### proxy.php
**Purpose**: Test and manage proxy servers for geo-unblocking
```bash
php includes/cli/proxy.php [action]

Actions:
  test      - Test all proxies
  enable    - Enable working proxies
  disable   - Disable failed proxies
  rotate    - Rotate proxy assignments
```
**Schedule**: Every 30 minutes (`*/30 * * * *`)

### Cache Management

#### cache_handler.php
**Purpose**: Manage file-based cache (clean, optimize, stats)
```bash
php includes/cli/cache_handler.php [action]

Actions:
  clean     - Remove expired cache files
  stats     - Show cache statistics
  clear     - Clear all cache (use with caution)
  rebuild   - Rebuild critical caches
```
**Schedule**: Daily at 3 AM (`0 3 * * *`)

### Backup

#### backup.php
**Purpose**: Create database and file backups
```bash
php includes/cli/backup.php [options]

Options:
  --db-only      - Database only
  --files-only   - Files only (config, tmp)
  --dest=PATH    - Custom destination
  --compress     - Compress output (default: true)
```
**Schedule**: Daily at 2 AM (`0 2 * * *`)

### Watchdog

#### watchdog.php
**Purpose**: Monitor critical processes and restart if needed
```bash
php includes/cli/watchdog.php

Checks:
  - PHP-FPM processes
  - Nginx
  - MySQL
  - Redis
  - FFmpeg processes
  - Custom streaming processes
```
**Schedule**: Every 5 minutes (`*/5 * * * *`)

### Auto Update

#### update.php
**Purpose**: Check for and apply updates
```bash
php includes/cli/update.php [options]

Options:
  --check      - Check only (don't apply)
  --force      - Force update even if same version
  --backup     - Create backup before update
```
**Schedule**: Weekly (`0 5 * * 0`)

### Startup Script

#### startup.php
**Purpose**: System initialization on boot
```bash
php includes/cli/startup.php

Actions:
  - Verify all services running
  - Initialize caches
  - Start daemon processes
  - Check database connectivity
  - Validate license
```
**Usage**: Add to systemd service or rc.local

### Balancer (Daemon)

#### balancer.php
**Purpose**: Load balancer daemon for multi-server setups
```bash
php includes/cli/balancer.php [action]

Actions:
  start    - Start balancer daemon
  stop     - Stop balancer daemon
  status   - Show balancer status
  reload   - Reload configuration
```
**Usage**: Run as systemd service

### Loopback (Daemon)

#### loopback.php
**Purpose**: Internal loopback server for inter-server communication
```bash
php includes/cli/loopback.php [action]

Actions:
  start    - Start loopback server
  stop     - Stop loopback server
  status   - Show status
```
**Usage**: Run as systemd service on each server

### Certificate Management

#### certbot.php
**Purpose**: Automate Let's Encrypt certificate renewal
```bash
php includes/cli/certbot.php [action]

Actions:
  renew    - Renew certificates
  install  - Install new certificate
  status   - Show certificate status
```
**Schedule**: Daily (`0 6 * * *`)

### Delayed Tasks

#### delay.php
**Purpose**: Execute delayed/scheduled tasks
```bash
php includes/cli/delay.php

Processes tasks scheduled for future execution
```
**Schedule**: Every minute (`* * * * *`)

### On-Demand Processing

#### ondemand.php
**Purpose**: Handle on-demand content preparation
```bash
php includes/cli/ondemand.php [action]

Actions:
  prepare    - Prepare VOD for streaming
  transcode  - Transcode to adaptive bitrate
  cleanup    - Remove temp files
```

### Plex Integration

#### plex_item.php
**Purpose**: Sync Plex library items
```bash
php includes/cli/plex_item.php [action]

Actions:
  sync       - Sync Plex library
  refresh    - Refresh metadata
  scan       - Scan for new content
```

### Watch Item

#### watch_item.php
**Purpose**: Track watch progress for series/movies
```bash
php includes/cli/watch_item.php [action]

Actions:
  update     - Update watch progress
  cleanup    - Remove old progress data
```

### Thumbnail Generation

#### thumbnail.php
**Purpose**: Generate thumbnails for VOD/series
```bash
php includes/cli/thumbnail.php [options]

Options:
  --all          - Generate for all content
  --missing      - Only missing thumbnails
  --size=WxH     - Custom size (default: 320x180)
```

### Tools

#### tools.php
**Purpose**: Miscellaneous maintenance tools
```bash
php includes/cli/tools.php [tool] [options]

Tools:
  clean-logs     - Clean old log files
  optimize-db    - Optimize database tables
  fix-perms      - Fix file permissions
  gen-keys       - Generate API keys
  test-ffmpeg    - Test FFmpeg installation
```

### Migration

#### migrate.php
**Purpose**: Run database migrations
```bash
php includes/cli/migrate.php [options]

Options:
  --version=V    - Migrate to specific version
  --dry-run      - Show what would be done
  --force        - Force migration
```

### Archive

#### archive.php
**Purpose**: Archive old data (logs, recordings, etc.)
```bash
php includes/cli/archive.php [type] [days]

Types:
  logs         - Archive panel logs
  recordings   - Archive old recordings
  client_logs  - Archive client access logs
```

### Binary Management

#### binaries.php
**Purpose**: Manage FFmpeg/FFprobe binaries
```bash
php includes/cli/binaries.php [action]

Actions:
  check      - Check binary versions
  download   - Download specific version
  update     - Update to latest
  test       - Test binary functionality
```

### Signals

#### signals.php
**Purpose**: Handle system signals for graceful shutdown
```bash
php includes/cli/signals.php

Used internally by daemon processes
```

### LLOD (Low Latency On Demand)

#### llod.php
**Purpose**: Low-latency streaming preparation
```bash
php includes/cli/llod.php [action]

Actions:
  prepare    - Prepare LLOD streams
  cleanup    - Clean LLOD temp files
```

---

## 📅 Recommended Cron Schedule

```bash
# Edit crontab for www-data user
crontab -u www-data -e
```

```cron
# System monitoring (every minute)
* * * * * /usr/bin/php /var/www/xui/decoded/includes/cli/monitor.php > /dev/null 2>&1

# Task queue (every minute)
* * * * * /usr/bin/php /var/www/xui/decoded/includes/cli/queue.php > /dev/null 2>&1

# Delayed tasks (every minute)
* * * * * /usr/bin/php /var/www/xui/decoded/includes/cli/delay.php > /dev/null 2>&1

# Recording management (every minute)
* * * * * /usr/bin/php /var/www/xui/decoded/includes/cli/record.php start > /dev/null 2>&1
* * * * * /usr/bin/php /var/www/xui/decoded/includes/cli/record.php stop > /dev/null 2>&1

# Watchdog (every 5 minutes)
*/5 * * * * /usr/bin/php /var/www/xui/decoded/includes/cli/watchdog.php > /dev/null 2>&1

# Proxy testing (every 30 minutes)
*/30 * * * * /usr/bin/php /var/www/xui/decoded/includes/cli/proxy.php test > /dev/null 2>&1

# EPG updates (every 6 hours)
0 */6 * * * /usr/bin/php /var/www/xui/decoded/includes/cli/epg.php > /dev/null 2>&1

# Cache cleanup (daily at 3 AM)
0 3 * * * /usr/bin/php /var/www/xui/decoded/includes/cli/cache_handler.php clean > /dev/null 2>&1

# Backup (daily at 2 AM)
0 2 * * * /usr/bin/php /var/www/xui/decoded/includes/cli/backup.php > /dev/null 2>&1

# Channel scanning (daily at 4 AM)
0 4 * * * /usr/bin/php /var/www/xui/decoded/includes/cli/scanner.php > /dev/null 2>&1

# Certificate renewal (daily at 6 AM)
0 6 * * * /usr/bin/php /var/www/xui/decoded/includes/cli/certbot.php renew > /dev/null 2>&1

# Weekly update check (Sunday 5 AM)
0 5 * * 0 /usr/bin/php /var/www/xui/decoded/includes/cli/update.php --check > /dev/null 2>&1

# Recording cleanup (daily at 1 AM)
0 1 * * * /usr/bin/php /var/www/xui/decoded/includes/cli/record.php cleanup > /dev/null 2>&1

# Log archiving (weekly)
0 3 * * 0 /usr/bin/php /var/www/xui/decoded/includes/cli/archive.php logs 30 > /dev/null 2>&1
```

---

## 🔧 Systemd Services (Alternative to Cron)

For daemon processes, use systemd:

### balancer.service
```ini
[Unit]
Description=XUI Load Balancer
After=network.target mysql.service redis.service

[Service]
Type=simple
User=www-data
WorkingDirectory=/var/www/xui/decoded
ExecStart=/usr/bin/php includes/cli/balancer.php start
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
```

### loopback.service
```ini
[Unit]
Description=XUI Loopback Server
After=network.target

[Service]
Type=simple
User=www-data
WorkingDirectory=/var/www/xui/decoded
ExecStart=/usr/bin/php includes/cli/loopback.php start
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
```

### Enable services
```bash
systemctl daemon-reload
systemctl enable --now xui-balancer xui-loopback
```

---

## 🐛 Debugging CLI Scripts

### Run with verbose output
```bash
php includes/cli/monitor.php -v
php includes/cli/queue.php --debug
```

### Check logs
```bash
# CLI logs
tail -f /var/www/xui/tmp/logs/cli.log

# Specific script logs
tail -f /var/www/xui/tmp/logs/monitor.log
tail -f /var/www/xui/tmp/logs/queue.log
```

### Test database connection
```bash
php -r "
require 'includes/pdo.php';
\$db = new Database('TKbxeQrBXw2swDNwTh5yrj4jMV4RaLO0');
echo \$db->connected ? 'Connected' : 'Failed';
"
```

---

## 📝 Creating Custom CLI Scripts

### Template
```php
<?php
// includes/cli/custom_script.php

require_once __DIR__ . '/../init.php';

// CLI-only check
if (php_sapi_name() !== 'cli') {
    exit('CLI only');
}

// Parse arguments
$args = getopt('', ['option1::', 'option2::']);

// Main logic
try {
    // Your code here
    echo "Success\n";
    exit(0);
} catch (Exception $e) {
    echo "Error: " . $e->getMessage() . "\n";
    exit(1);
}
```

### Register in tools.php
Add your script to the tools menu for easy access.

---

*CLI Commands Reference for XUI One Decoded v1.5.13*