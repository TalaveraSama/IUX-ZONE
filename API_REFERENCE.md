# XUI One Decoded - API Reference

Complete API documentation for XUI One Decoded (xuione_decoded).

## 📋 Table of Contents

1. [Player API](#player-api) - For STB/Client applications
2. [Admin API](#admin-api) - For admin panel operations
3. [Internal API](#internal-api) - Core XUI class methods
4. [Web Endpoints](#web-endpoints) - Streaming and utility endpoints

---

## 🎮 Player API

Base URL: `https://your-domain.com/player_api.php`

Used by: STB Emulator, IPTV Smarters, TiviMate, GSE Smart IPTV, etc.

### Authentication
All endpoints require `username` and `password` parameters (line credentials).

### Live TV Endpoints

#### Get Live Categories
```
GET /player_api.php?username={user}&password={pass}&action=get_live_categories
```
**Response**: JSON array of categories
```json
[
  {"category_id": "1", "category_name": "Sports", "parent_id": "0"},
  {"category_id": "2", "category_name": "News", "parent_id": "0"}
]
```

#### Get Live Streams
```
GET /player_api.php?username={user}&password={pass}&action=get_live_streams
```
**Optional**: `category_id` - Filter by category

**Response**: JSON array of streams
```json
[
  {
    "num": 1,
    "name": "ESPN HD",
    "stream_type": "live",
    "stream_id": 123,
    "stream_icon": "http://domain.com/icon.png",
    "epg_channel_id": "espn.us",
    "added": "1609459200",
    "category_id": "1",
    "custom_sid": "",
    "tv_archive": 0,
    "direct_source": "",
    "tv_archive_duration": 0
  }
]
```

#### Get Live Stream Link
```
GET /player_api.php?username={user}&password={pass}&action=get_live_stream_link&stream_id={id}&extension=ts
```
**Response**: Stream URL
```json
"http://domain.com:8080/live/user/pass/123.ts"
```

### VOD Endpoints

#### Get VOD Categories
```
GET /player_api.php?username={user}&password={pass}&action=get_vod_categories
```

#### Get VOD Streams
```
GET /player_api.php?username={user}&password={pass}&action=get_vod_streams
```
**Optional**: `category_id`

#### Get VOD Stream Link
```
GET /player_api.php?username={user}&password={pass}&action=get_vod_stream_link&stream_id={id}&extension=mp4
```

### Series Endpoints

#### Get Series Categories
```
GET /player_api.php?username={user}&password={pass}&action=get_series_categories
```

#### Get Series
```
GET /player_api.php?username={user}&password={pass}&action=get_series
```
**Optional**: `category_id`

#### Get Series Info
```
GET /player_api.php?username={user}&password={pass}&action=get_series_info&series_id={id}
```

**Response**: Series with seasons and episodes
```json
{
  "info": {
    "name": "Breaking Bad",
    "plot": "A chemistry teacher...",
    "cover": "http://domain.com/cover.jpg",
    "cast": "Bryan Cranston...",
    "director": "Vince Gilligan",
    "genre": "Crime, Drama",
    "releaseDate": "2008",
    "rating": "9.5",
    "backdrop_path": "http://domain.com/backdrop.jpg",
    "youtube_trailer": "https://youtube.com/..."
  },
  "episodes": {
    "1": [
      {"id": 1, "season": 1, "episode_num": 1, "title": "Pilot", "container_extension": "mp4", "duration": "3600", "added": "1609459200"}
    ]
  }
}
```

#### Get Episode Link
```
GET /player_api.php?username={user}&password={pass}&action=get_series_stream_link&series_id={id}&season={s}&episode={e}&extension=mp4
```

### EPG Endpoints

#### Get Short EPG (Current/Next)
```
GET /player_api.php?username={user}&password={pass}&action=get_short_epg&stream_id={id}&limit=10
```

#### Get Simple EPG
```
GET /player_api.php?username={user}&password={pass}&action=get_simple_epg&stream_id={id}
```

### User Info
```
GET /player_api.php?username={user}&password={pass}&action=get_user_info
```

**Response**:
```json
{
  "user_info": {
    "username": "testuser",
    "password": "testpass",
    "message": "",
    "auth": 1,
    "status": "Active",
    "exp_date": "1704067200",
    "is_trial": "0",
    "active_cons": "1",
    "created_at": "1609459200",
    "max_connections": "1",
    "allowed_output_formats": ["m3u8", "ts", "mp4"]
  },
  "server_info": {
    "url": "http://domain.com:8080/c/",
    "port": "8080",
    "https_port": "443",
    "server_protocol": "http",
    "rtmp_port": "1935",
    "timezone": "America/New_York",
    "timestamp_now": 1699900000,
    "time_now": "2023-11-13 15:33:20"
  }
}
```

---

## 🔧 Admin API

Base: `https://your-domain.com/admin/` (requires admin session)

See `decoded/includes/admin_api.php` for complete implementation.

### Authentication
```
POST /admin/api.php
```
**Parameters**: `username`, `password` (admin credentials)

**Response**: Session cookie set

### Server Management

#### List Servers
```
GET /admin/api.php?action=servers
```

#### Add Server
```
POST /admin/api.php?action=add_server
```
**Parameters**: `server_ip`, `http_port`, `https_port`, `rtmp_port`, `server_type`, `domain_name`, etc.

#### Update Server
```
POST /admin/api.php?action=update_server&id={id}
```

#### Delete Server
```
POST /admin/api.php?action=delete_server&id={id}
```

### Line/User Management

#### List Lines
```
GET /admin/api.php?action=lines
```
**Optional**: `page`, `limit`, `search`, `status`, `bouquet`

#### Add Line
```
POST /admin/api.php?action=add_line
```
**Parameters**: `username`, `password`, `bouquet`, `exp_date`, `max_connections`, `allowed_output_formats`, etc.

#### Update Line
```
POST /admin/api.php?action=update_line&id={id}
```

#### Delete Line
```
POST /admin/api.php?action=delete_line&id={id}
```

#### Get Line Activity
```
GET /admin/api.php?action=line_activity&id={id}
```

### Bouquet Management

#### List Bouquets
```
GET /admin/api.php?action=bouquets
```

#### Add Bouquet
```
POST /admin/api.php?action=add_bouquet
```

#### Update Bouquet
```
POST /admin/api.php?action=update_bouquet&id={id}
```

#### Delete Bouquet
```
POST /admin/api.php?action=delete_bouquet&id={id}
```

### Channel/Stream Management

#### List Channels
```
GET /admin/api.php?action=streams&type=live
```

#### Add Channel
```
POST /admin/api.php?action=add_stream&type=live
```

#### Update Channel
```
POST /admin/api.php?action=update_stream&id={id}&type=live
```

#### Delete Channel
```
POST /admin/api.php?action=delete_stream&id={id}&type=live
```

### EPG Management

#### List EPG Sources
```
GET /admin/api.php?action=epgs
```

#### Add EPG Source
```
POST /admin/api.php?action=add_epg
```

#### Update EPG
```
POST /admin/api.php?action=update_epg&id={id}
```

### Settings

#### Get Settings
```
GET /admin/api.php?action=settings
```

#### Update Settings
```
POST /admin/api.php?action=update_settings
```

### Logs

#### Panel Logs
```
GET /admin/api.php?action=panel_logs
```

#### Login Logs
```
GET /admin/api.php?action=login_logs
```

---

## 🏗️ Internal API (XUI Core Class)

File: `decoded/includes/xui.php`

### Initialization
```php
XUI::init($cli = false);
```
Initializes the core system. Call once per request.

### Database
```php
XUI::$db->query($sql, ...$params);  // Prepared statements
XUI::$db->simple_query($sql);        // Direct query
XUI::$db->get_rows($keyed, $key, $clean, $subkey);
XUI::$db->get_row();
XUI::$db->get_col();
XUI::$db->num_rows();
XUI::$db->last_insert_id();
```

### Settings Access
```php
XUI::$rSettings['setting_name'];  // Access any setting
```

### Server Management
```php
XUI::$rServers[SERVER_ID];        // Current server
XUI::f76008F8dFe1898c();          // Get all servers (cached)
```

### Bouquet Management
```php
XUI::$rBouquets;                  // All bouquets (cached)
XUI::DE27bb48f7BfF12d();          // Get bouquets with streams
```

### Security/Blocking
```php
XUI::$rBlockedIPs;                // Blocked IPs
XUI::$rBlockedUA;                 // Blocked User Agents
XUI::$rBlockedISP;                // Blocked ISPs
XUI::$rAllowedIPs;                // Allowed IPs (whitelist)
XUI::$rAllowedDomains;            // Allowed domains
```

### Flood/Brute-force Protection
```php
XUI::AEEA5D3137274F80($ip);       // Check flood limit
XUI::a1FeF6439C28608e($ip, $mac, $username);  // Check brute-force
```

### System Info
```php
XUI::aFf015C358EB0964();          // Get server stats (CPU, RAM, Disk, Network, GPU)
```

### Cache Management
```php
XUI::f7a8933150230eAb($key, $data);    // Write cache
XUI::e74A9A4510C4fFE4($key, $ttl);     // Read cache
```

### Utilities
```php
XUI::aE400Ee4D91071a5($length);  // Generate random string
XUI::a336B0dAd3EaF634();         // Get API token (15 chars)
XUI::a7CF79752B1Ae214(...);      // Streaming/transcoding
```

---

## 🌐 Web Endpoints

### Streaming Endpoints (`decoded/www/`)

| Endpoint | Purpose | Parameters |
|----------|---------|------------|
| `live.php` | Live TV streaming | `stream`, `token`, `extension` |
| `vod.php` | VOD streaming | `stream`, `token`, `extension` |
| `series.php` | Series streaming | `stream`, `season`, `episode`, `token` |
| `timeshift.php` | Timeshift/catchup | `stream`, `token`, `start`, `end` |
| `playlist.php` | M3U playlist | `username`, `password`, `type` |
| `epg.php` | EPG XMLTV | `username`, `password` |
| `enigma2.php` | Enigma2 API | Various Enigma2 params |
| `xplugin.php` | XPlugin support | Plugin-specific |
| `proxy_api.php` | Proxy management | Internal use |
| `thumb.php` | Thumbnail proxy | `url`, `w`, `h` |

### Constants (`decoded/www/constants.php`)

Key paths and configuration:
```php
define('XUI_HOME', '/var/www/xui/');
define('CONFIG_PATH', XUI_HOME . 'config/');
define('INCLUDES_PATH', XUI_HOME . 'includes/');
define('CACHE_TMP_PATH', XUI_HOME . 'tmp/cache/');
define('FLOOD_TMP_PATH', XUI_HOME . 'tmp/flood/');
define('FFMPEG_BIN_40', '/usr/bin/ffmpeg');
define('FFMPEG_BIN_43', '/usr/bin/ffmpeg-4.3');
define('FFMPEG_BIN_44', '/usr/bin/ffmpeg-4.4');
define('FFPROBE_BIN_40', '/usr/bin/ffprobe');
```

---

## 📝 Error Responses

### Standard Error Format
```json
{
  "error": "Error message",
  "code": 400
}
```

### Common HTTP Codes
- `200` - Success
- `400` - Bad Request (missing params)
- `401` - Unauthorized (invalid credentials)
- `403` - Forbidden (blocked IP, flood, etc.)
- `404` - Not Found
- `500` - Server Error
- `503` - Service Unavailable (server offline)

---

## 🔐 Security Notes

1. **Always use HTTPS** in production
2. **Rotate API tokens** periodically
3. **Monitor flood logs** for attacks
4. **Use strong passwords** for admin and lines
5. **Restrict admin panel** by IP if possible
6. **Keep PHP/extensions updated**

---

## 📚 Additional Resources

- [Installation Guide](INSTALLATION_GUIDE.md)
- [Architecture Overview](ARCHITECTURE.md)
- [Original Repository](https://github.com/tealcavalon/xuione_decoded)
- [Fork Repository](https://github.com/TalaveraSama/xuione-decoded)