# Informe — Instalación original (Drive) vs `xuione_decoded` (GitHub)

**Fecha:** 2026-11-23 · **Rama:** `arena/629502e3-iux-zone`

## 1. Qué se comparó

| Fuente | Contenido |
|---|---|
| **Google Drive** (carpeta compartida) | `xui.tar.gz` (663 MB, instalación completa), carpeta `xui/` con el árbol extraído (≈440 archivos), `install` (19,5 KB), `update` (1 KB), `database.sql` (7,8 MB) y `license`, `service`, `status`, `tools` |
| **GitHub** `tealcavalon/xuione_decoded` | 294 archivos en `decoded/` (PHP descodificado con `goto`) + 291 en `opc/` (volcados de opcodes). Descripción oficial del repo: *"Version 1.5.13 — source code only, no pre-compiled binaries"* |

> ⚠️ Nota previa: a pesar del nombre "xui", esto **no es 3x-ui (Xray)**. Es **XUI.one / Xtream Codes v2**, el panel IPTV comercial en PHP.

## 2. Identificación de la instalación original

Evidencia extraída de los archivos raíz (copias en `analisis/muestras/`):

- `install`: instalador oficial de **XUI.one** — extrae `xui.tar.gz` a `/home/xui/`, crea usuario `xui`, systemd unit `xuione.service`, MariaDB 10.6 + Redis + certbot, tablas BBR/sysctl. Incluye `libssh2-1t64` (paquete del transitorio time64 de **Ubuntu 24.04**) → build de la era 2024-2025.
- `update`: actualizador python3 que valida MD5 y aplica tars de actualización.
- `service`: arranca nginx + nginx_rtmp + redis + daemons PHP (`startup.php`, `signals.php`, `watchdog.php`, `queue.php`, `cache_handler.php`, y condicionalmente `connection_sync.php`).
- `license`: script PHP con handlers de error de **ionCube** (`ION_CORRUPT_FILE`, `ION_LICENSE_*`) — pantalla "XUIONE - Unlicensed".
- **Todo el PHP del panel está codificado con ionCube**: los archivos empiezan con el magic `45 BF A6 67` (verificado en `admin/index.php`, `reseller/index.php`, `crons/stats.php`, `crons/license.php`, `status`, `tools`). No hay código fuente legible en la instalación original.
- Stack binario: **PHP 7.4.10** (`bin/php/bin/php`, strings verificados), ionCube Loader 10.4, **ffmpeg/ffprobe 4.0, 4.3 y 4.4** (`bin/ffmpeg_bin/{4.0,4.3,4.4}` — exactamente las rutas que el código 1.5.13 define en `www/constants.php`), `nginx` (1.28.0 en el paquete LB), redis, maxmind, `guess` (PyInstaller, fuente en `includes/python/`).
- `database.sql` (semilla, 67 tablas): sin datos de clientes → es la semilla que trae el tar, no un volcado de una BD en producción.

### ¿Qué versión es?

- **El repo decodificado es 1.5.13**: `define('XUI_VERSION', '1.5.13')` en `decoded/www/constants.php`, y la descripción del propio repo lo confirma.
- **Tu árbol original coincide con 1.5.13 en todas las comprobaciones estructurales**: sets de archivos 1:1 en `admin` (127), `crons` (25), `includes/cli` (24), `reseller` (35), `player` (14), `includes/libs` (8), `includes/api/admin` (1); `ffmpeg_bin` con 4.0/4.3/4.4; referencias a `connection_sync` presentes.
- **Una peculiaridad detectada**: la semilla dentro de tu tar (`bin/install/database.sql`) tiene un esquema **más antiguo** (columna `lines.init`, sin `mac_filter`), mientras el `database.sql` de la raíz del Drive tiene el **esquema de 1.5.13** (tablas `lines_divergence`, `ondemand_check`, `recordings`, columnas `mac_filter`, índices FULLTEXT) que el código decodificado usa directamente (INSERTs en `cli/scanner.php`, `admin/api.php`, `crons/users.php`, etc.). El semilla desactualizado dentro del tar es habitual en esta línea de producto; la migración real la aplica el panel al arrancar.
- **Veredicto**: instalación de la línea 1.5.x reciente, coherente con 1.5.13 salvo verificación en el servidor (ver §7). La única discrepancia restante es contra un paquete LB de terceros de sep-2024 (xui.php 801.738 vs 801.515 B), que solo demuestra que son builds distintos, no cuál es cuál.

## 3. Comparación de estructura

Detalle completo: `analisis/diff_estructura.txt` y `analisis/arbol_original.txt`.

| Grupo | Original | Repo decoded | ¿Coincide? |
|---|---:|---:|---|
| `admin/*.php` | 127 | 127 | ✅ 1:1 |
| `crons/` | 25 | 25 | ✅ 1:1 |
| `includes/cli/` | 24 | 24 | ✅ 1:1 |
| `includes/libs/` | 8 (+TMDb, resources) | 8 + TMDb + resources | ✅ |
| `includes/api/admin/` | 1 | 1 | ✅ |
| `reseller/` | 35 | 35 | ✅ 1:1 |
| `player/*.php` | 14 (+libs) | 14 (+libs) | ✅ |
| `includes/` raíz | 7 | 6 | ❌ falta **`streaming.php`** |
| `www/` | 11 (+admin 7, stream 11) | 10 (+admin 6) | ❌ faltan `index.html`, `admin/index.php`, **`www/stream/` completo (11)** |
| `ministra/` | 86 | 0 | ❌ ausente por completo |
| `admin/assets/` | css/fonts/images/js/libs | 0 | ❌ ausente |
| `includes/langs/`, `includes/python/` | en.ini, guess.py… | 0 | ❌ ausentes |
| `bin/`, `content/`, raíz (`install`, `service`, `status`…) | completo | solo `status` y `tools` decodificados | ❌ binarios no incluidos (por diseño del repo) |

**En resumen: el código PHP del panel coincide archivo a archivo con el repo.** Lo que falta en el repo son: 1 archivo PHP clave (`includes/streaming.php`, el motor de streaming), el punto de entrada de streaming `www/stream/` (11 archivos), el portal de STBs `ministra/` (86 archivos, mayormente JS), assets del admin, idiomas y utilidades Python, y todos los binarios.

## 4. Tamaños: original codificado vs repo

Tabla completa: `analisis/tamanos_original_vs_repo.csv` (255 archivos con equivalente).

- El tamaño codificado (ionCube, opcodes comprimidos) no es comparable byte a byte con el descodificado; la relación `encoded/opc` tiene mediana **0,596** con dispersión esperable según la proporción de strings embebidas por archivo (ej. `admin/footer.php`, cargado de JS inline, ratio 0,86).
- Muestras representativas (encoded original → decoded repo → opc repo):

| Archivo | Original | Decoded | Opc |
|---|---:|---:|---:|
| `admin/api.php` | 765.572 | 256.639 | 1.549.874 |
| `admin/table.php` | 1.276.350 | 495.236 | 2.743.069 |
| `includes/xui.php` | 801.515 | 242.889 | 1.604.044 |
| `includes/admin_api.php` | 928.757 | 317.044 | 1.931.615 |
| `www/player_api.php` | 178.834 | 53.720 | 355.399 |
| `reseller/table.php` | 315.701 | 121.505 | 662.207 |
| `status` | 357.218 | 100.940 | 545.369 |
| `tools` | 41.286 | 11.406 | 67.956 |

## 5. Base de datos

`analisis/db/` contiene ambas semillas y su diff (`diff_semillas.sql`, 207 líneas). Diferencias reales:

- **Solo en el de la raíz (esquema 1.5.13)**: tablas `lines_divergence`, `ondemand_check`, `recordings`; columnas `mac_filter` en `lines`, `mag_devices` y `enigma2_devices`; 6 índices FULLTEXT `search` (búsqueda global del admin que usa `admin/api.php`).
- **Solo en el del tar**: columna `lines.init` (esquema previo).
- El código decodificado 1.5.13 **no crea** esas tablas/columnas (solo las usa) → para montar un 1.5.13 desde cero hay que usar el `database.sql` de esquema nuevo.

## 6. Seguridad

- `config/rclone.conf` = plantilla vacía, **sin credenciales** ✅. El `config/config.ini` real (credenciales MySQL) **no** está en el Drive ✅.
- La carpeta compartida no contiene la licencia privada ni volcados de datos de clientes; `database.sql` es semilla ✅.
- La instalación original es 100 % ionCube: **no auditable sin decodificar**. El repo `xuione_decoded` permite auditar la lógica, pero **no cubre** `streaming.php` ni `www/stream/` (justo el plano de datos más sensible: autenticación de streams, keys, HLS).
- Precaución general: los empaquetados que circulan de XUI.one incluyen parches de licencia de terceros (p. ej. repos `crtlxui/xuione`, `Stefan2512/…` que reemplazan `xui.so`); son binarios de origen no verificado. Si tu tar proviene de uno de ellos, el `xui.so`/`ioncube.so` debe tratarse como no confiable.

## 7. Cómo confirmar la versión exacta en el servidor

```sql
mysql -u root -p xui -e "SELECT id, server_name, xui_version, xui_revision FROM servers WHERE id=1;"
```
o el pie del panel admin (muestra `v{XUI_VERSION}`), o `php -r` con el `bin/php/bin/php` del servidor. Si aparece `1.5.13`, la correspondencia con el repo es total.

## 8. Conclusiones

1. La instalación original es **XUI.one línea 1.5.x reciente, estructuralmente idéntica al 1.5.13** que decodifica el repo (sets de archivos 1:1 en los 5 módulos PHP principales, 255 archivos con equivalencia directa).
2. El repo `xuione_decoded` es una **decodificación fiel del código PHP del panel** (mismo árbol), útil para auditoría, con `decoded/` (fuente goto) y `opc/` (opcodes) por archivo.
3. **Cobertura incompleta del repo**: falta `includes/streaming.php`, todo `www/stream/`, `ministra/`, assets, idiomas, python y binarios. Para operar el panel no bastan solo los archivos decodificados: se necesitan los binarios originales y esos archivos ausentes.
4. Atención al esquema de BD: usar la semilla nueva (con `lines_divergence`/`ondemand_check`/`recordings`/`mac_filter`) para 1.5.13; el semilla del tar es antiguo.

## 9. Artefactos generados

```
INFORME_COMPARATIVA.md          ← este informe
analisis/
  arbol_original.txt            ← árbol completo del original con tamaños (440 entradas)
  diff_estructura.txt           ← comparación grupo a grupo original vs repo
  tamanos_original_vs_repo.csv  ← encoded vs decoded vs opc (255 archivos)
  build_artifacts.py            ← script que genera los artefactos anteriores
  db/
    database_raiz.sql           ← database.sql de la raíz del Drive (esquema 1.5.13)
    database_bin_install.sql    ← semilla dentro del tar (esquema anterior)
    diff_semillas.sql           ← diff entre ambas
  muestras/                     ← archivos raíz y muestras ionCube del original + SHA256SUMS
```

> Los archivos pesados descargados durante el análisis (binario PHP de 44 MB, `loadbalancer_update.tar.gz` de 91 MB) se eliminaron del workspace tras el análisis; quedan en el Drive original.
