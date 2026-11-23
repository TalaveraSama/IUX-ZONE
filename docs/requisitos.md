# Requisitos

Detalle de lo necesario para ejecutar el panel XUI.one (código `decoded/`).

## Sistema operativo

- Debian 11 (Bullseye) / 12 (Bookworm) o Ubuntu 20.04 / 22.04, 64-bit.
- Usuario del sistema **`xui`** con home **`/home/xui`**. El código define
  `XUI_HOME` por defecto como `/home/xui/` (ver `docs/arquitectura.md`); por eso
  el despliegue nativo coloca todo ahí.

## PHP

- **Versión recomendada: PHP 7.4.**
  - El código hace referencia explícita a PHP 7.2.34 y 7.4.10 y usa
    `hrtime()` (PHP ≥ 7.3). No está probado con PHP 8.x: el código está
    ofuscado con `goto` y nombres de variables aleatorios, y suele romper en 8+.
  - En el instalador (`admin/server.php`) aparecen las opciones "PHP 7.2.34" y
    "PHP 7.4.10".

### Extensiones PHP obligatorias

| Extensión | Para qué |
|-----------|----------|
| `pdo_mysql` / `mysqli` | Conexión a la base de datos |
| `curl` | Peticiones HTTP (EPG, proxies, APIs) |
| `zlib` | Compresión |
| `opcache` | Rendimiento (usa `opcache_invalidate`) |
| **`igbinary`** | **Obligatoria**: el panel serializa cachés con `igbinary_serialize/_unserialize` |
| `mbstring`, `json`, `xml`, `zip`, `gd` | Uso general / imágenes / imports |
| `posix`, `proc_open` | Herramientas CLI (`status`, `tools`, señales) |

> La extensión propietaria **`xui`** (un loader del binario original) se comprueba
> con `extension_loaded('xui')` en algunos puntos, pero **no es necesaria** en la
> versión decodificada: esas comprobaciones simplemente evalúan `false` y continúa.

## Base de datos

- **MariaDB 10.3+** o **MySQL 5.7 / 8.0**.
- El usuario de la BD debe tener permisos de `CREATE`, `INSERT`, `UPDATE`,
  `DELETE`, `SELECT`, `ALTER` sobre la base del panel.
- **El esquema NO viene en el repo** → ver `docs/esquema-bd.md`.

## Servidor web

- **Apache 2.4** con `mod_php` (php7.4) o `php7.4-fpm` + `proxy_fcgi`.
  - `DocumentRoot` = `/home/xui/www`.
  - `AllowOverride All` para respetar `.htaccess` (si existen).
  - `getallheaders()` es nativo en Apache; si usas Nginx + php-fpm, el propio
    `init.php` ya incluye un polyfill.
- Nginx + php-fpm también funciona; ajusta el `root` a `/home/xui/www`.

## Dependencias opcionales (mejoran funciones)

- **ffmpeg / ffprobe** (4.0, 4.3, 4.4): transcodificación, capturas, HLS.
  El código espera los binarios en `BIN_PATH/ffmpeg_bin/<ver>/`. Sin ellos, las
  funciones de transcode/no-remux no operan, pero el panel arranca.
- **Bases GeoIP de MaxMind** (`GeoLite2.mmdb`, `GeoLite2-City.mmdb`,
  `GeoIP2-ISP.mmdb`) en `BIN_PATH/maxmind/` para geolocalización de líneas.
- **Let's Encrypt / certbot**: el cron `crons/certbot.php` gestiona certificados.

## Espacio y permisos

- El panel escribe en `/home/xui/tmp/*` y `/home/xui/content/*`. Esos directorios
  deben existir y pertenecer a `xui:xui` con permisos de escritura.
- Los `crons/` se ejecutan como el usuario `xui` (vía cron).
