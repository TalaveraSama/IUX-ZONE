# COMPARATIVA — XUI.One vs TVLister 24/7

**Fecha:** 2026-11-23 · Versión XUI analizada: 1.5.13 · TVLister: v2.6.67 (`arena/85cc9902`)

## 1. Qué es cada uno

| | **XUI.One** (base, predominante) | **TVLister 24/7** (capa moderna) |
|---|---|---|
| Naturaleza | Panel IPTV comercial "todo en uno" (sucesor de Xtream Codes) | Panel IPTV/OTT/VOD auto-hospedado de código abierto, desarrollo propio y activo |
| Stack | PHP 7.4.10 + ionCube 10.4, nginx + nginx_rtmp, MariaDB 10.6, Redis, Zephir (`xui.so`) | Node.js 22 + Express + React 18/Vite + SQLite (`node:sqlite`) + mysql2 + node-media-server + hls.js |
| Código | **Cerrado/ionCube** (existe decodificación comunitaria 1.5.13, Apache-2.0) | **Abierto** (repo propio, 228 archivos, changelog v2.3→v2.6.67) |
| Streaming | Motor propio nginx-rtmp + ffmpeg 4.0/4.3/4.4, HLS/TS/RTMP | Playout con ffmpeg (reutiliza los binarios de XUI), HLS, ingest RTMP/SRT/RTSP, YouTube 24/7 |
| Base de datos | MySQL/MariaDB `xui` (67 tablas) | SQLite propia (`data/tvlister.db`) + **lector MySQL de la BD de XUI** |
| Estado del proyecto | **Discontinuado** (última oficial 1.5.13, dic-2024) | **Activo** (v2.6.67, releases semanales) |

## 2. Matriz de capacidades

| Capacidad | XUI.One | TVLister 24/7 | Quién lo hace mejor en la fusión |
|---|:---:|:---:|---|
| Líneas M3U / Xtream API | ✅ | ✅ | XUI (maduro, con balanceo multi-servidor) |
| MAG / Stalker Portal | ✅ (+ portal Ministra incluido) | ✅ (stalkerPortal.js) | **XUI** (ecosistema MAG completo) |
| Enigma2 | ✅ | ✅ | XUI |
| Resellers con créditos | ✅ | ✅ | XUI (nativo, probado) |
| VOD con catálogo | ✅ | ✅ + **Jellyfin con symlinks** + géneros TMDB automáticos | **TVLister** |
| Canales lineales 24/7 (playout continuo) | Parcial (VOD recurrente) | ✅ motor playout dedicado + **canales desde YouTube/playlists sin llenar el disco** | **TVLister** |
| Portal cliente WebTV HTML5 | ❌ | ✅ (WebTvPortal) | **TVLister** |
| Salida UDP/CATV (moduladores WK2500 32/64/125) | ❌ | ✅ (+ integración Flussonic 23.12) | **TVLister** |
| Edge Load Balancers | ✅ (LB oficial con tar propio) | ✅ (instalación SSH automática, caché de segmentos, reparto por Mbps) | **TVLister** (más simple de operar) |
| Proxy blindaje (TS+HLS) | Parcial (enable_proxy) | ✅ Stream Shield | **TVLister** |
| EPG | ✅ (importador/XML) | ✅ (epgSync) | Paritario |
| Admin API para terceros | ✅ (admin_api.php) | ✅ (REST propia) | Paritario |
| Auditable / modificable | ❌ (ionCube) — solo con decodificado | ✅ 100 % | **TVLister** |
| Anti-caídas / watchdog | ✅ (daemon watchdog) | ✅ (autoFailover, stability) | Paritario |

## 3. La integración ya existe (mitad del camino recorrido)

TVLister **no compite** con XUI.one en el mismo plano: fue diseñado para instalarse **sobre** un servidor XUI.one:

1. **Detección y modo seguro** — `scripts/install_ubuntu.sh` detecta `/home/xui` y no toca apt, MariaDB, nginx ni puertos de XUI.
2. **Puertos sin conflicto** — con XUI presente, TVLister corre en `127.0.0.1:8095` y genera un vhost de nginx que hace proxy desde el 80/443 del sistema (el nginx de XUI sigue siendo el maestro).
3. **Reutiliza los ffmpeg de XUI** — busca `/home/xui/bin/ffmpeg_bin/{4.4,4.3,4.0}/ffmpeg` y crea un wrapper auto-reparable; no descarga ni duplica binarios.
4. **Importador nativo de la BD de XUI** — `server/xuiImporter.js` lee credenciales de `/home/xui/config/config.ini` / `credentials.txt` / `/etc/mysql/debian.cnf`, conecta a las BD `xui`/`xuione`/`xtream_iptvpro` e importa líneas, streams y VOD a su catálogo (página **Xui Import** del panel y comando `tvlister-admin`).

## 4. Veredicto de la fusión

**XUI.One como núcleo predominante** (streaming masivo, MAG/Stalker, líneas/resellers, admin API probada) y **TVLister como capa moderna montada encima** (VOD con Jellyfin/TMDB, canales 24/7, WebTV, CATV/UDP, balancers edge, YouTube). No hay que reescribir nada: la unión se logra instalando TVLister en modo coexistencia y conectándolo a la BD `xui`.

Arquitectura resultante:

```
                    ┌────────────────────────────────────────────┐
  Clientes ──HTTP──▶│  nginx de XUI.One (80/443)                 │
                    │   ├─ /admin /player_api /stream...  → XUI  │  ← PANEL BASE (predominante)
                    │   └─ /tvlister → 127.0.0.1:8095            │
                    └──────────────┬─────────────────────────────┘
                                   │
             ┌─────────────────────┴──────────────────────┐
             │ MariaDB `xui`  ◀──lee──  TVLister 24/7     │
             │ (líneas, streams, VOD)   (SQLite propia +  │
             │                           catálogo import) │
             └────────────────────────────────────────────┘
```

Detalle de instalación en `LEEME_FUSION.md` y `integracion/ARQUITECTURA_FUSION.md`.
