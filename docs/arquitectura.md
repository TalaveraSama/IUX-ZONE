# Arquitectura y constantes

Cómo se estructura y configura el panel por dentro (basado en `decoded/www/constants.php`
e `init.php`).

## Rutas base (definidas en `www/constants.php`)

El código asume que vive bajo el home del usuario `xui`:

| Constante | Valor por defecto | Uso |
|-----------|-------------------|-----|
| `XUI_HOME` | `/home/xui/` | Raíz de la instalación |
| `WWW_PATH` | `XUI_HOME . 'www/'` | Document root |
| `INCLUDES_PATH` | `XUI_HOME . 'includes/'` | Núcleo PHP |
| `BIN_PATH` | `XUI_HOME . 'bin/'` | Binarios (ffmpeg, php, maxmind, install) |
| `CONTENT_PATH` | `XUI_HOME . 'content/'` | Streams, VOD, EPG, playlists, vídeo |
| `CONFIG_PATH` | `XUI_HOME . 'config/'` | Configuración |
| `TMP_PATH` | `XUI_HOME . 'tmp/'` | Cachés, logs, flood, signals, watch |
| `CRON_PATH` | `XUI_HOME . 'crons/'` | Tareas programadas |
| `XUI_VERSION` | `1.5.13` | Versión |

Subdirectorios creados en runtime bajo `TMP_PATH`:
`cache/`, `cache/streams/`, `cache/series/`, `cache/lines/`, `divergence/`,
`flood/`, `player/`, `ministra/`, `signals/`, `logs/`, `watch/`, `opened_cons/`,
`crons/`, `cidr/`.

Subdirectorios bajo `CONTENT_PATH`:
`streams/`, `epg/`, `vod/`, `archive/`, `created/`, `delayed/`, `video/`,
`playlists/`.

## Conexión a la base de datos

- La clase `Database` (`includes/pdo.php`) usa PDO con MySQL.
- Las credenciales de BD **no están en un archivo `.ini`**: se guardan
  **cifradas dentro de la propia base de datos** (tabla de configuración) y se
  descifran con una clave hardcodeada:
  ```
  Xui\Functions::connect('TKbxeQrBXw2swDNwTh5yrj4jMV4RaLO0')
  ```
  Esa misma clave aparece en `player/functions.php`. No la cambies salvo que
  también cambies el descifrado en el núcleo (fuera del alcance de este fork).

## Host / dominio

- `HOST` se deriva de `$_SERVER['HTTP_HOST']` (sin puerto).
- Si está activo `verify_host`, el dominio debe estar en la caché
  `allowed_domains` (generada por el panel). De lo contrario muestra
  `INVALID_HOST`.
- En instalación inicial esto normalmente está desactivado hasta configurar los
  dominios permitidos en el admin.

## Archivos de entrada (DocumentRoot = `www/`)

| Archivo | Función |
|---------|---------|
| `api.php` | API principal del panel |
| `player_api.php` | API del reproductor/líneas |
| `playlist.php` | Generación de listas (m3u) |
| `epg.php` | Guía EPG |
| `enigma2.php` | Soporte Enigma2 / STB |
| `probe.php` | Sondeo de streams |
| `progress.php` | Progreso de transcode |
| `xplugin.php` | Plugin externo |

Cada uno hace `require 'init.php';`, que carga `constants.php` → `includes/xui.php`
→ `includes/pdo.php` y abre la conexión.

## Crons

26 scripts en `crons/` (activity, backups, cache, certbot, cleanup, epg, errors,
license, lines_logs, plex, providers, root_mysql, root_signals, series, servers,
stats, streams, streams_logs, tmdb, tmdb_popular, tmp, users, vod, watch).
Se ejecutan como `xui` cada minuto. Ver `scripts/crontab.xui`.

## Herramientas CLI

- `status` — estado de procesos del usuario `xui` (corre como `xui`).
- `tools` — utilidades varias; **requiere root** y hace `require includes/admin.php`.

## Notas de despliegue nativo

Para una instalación "directa" (sin Docker), lo más fiel es colocar el contenido
de `decoded/` en `/home/xui/` y apuntar el servidor web a `/home/xui/www`.
El script `scripts/instalar.sh` automatiza exactamente eso.
