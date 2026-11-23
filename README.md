# IUX-ZONE — Fork funcional de XUIONE (decoded 1.5.13)

Fork propio de [`tealcavalon/xuione_decoded`](https://github.com/tealcavalon/xuione_decoded),
que contiene el código **decodificado** del panel **XUI.one** versión **1.5.13**
("source code only, no pre-compiled binaries").

> ⚠️ **Lee `PROVENANCE.md` y `docs/esquema-bd.md` antes de usar esto en producción.**
> Es código decodificado de un producto comercial; la licencia que rige este fork
> es *Libre License 2.0 (USA)* (ver `LICENSE`), pero eso **no** transfiere los
> derechos del código original. Además, **falta el esquema de la base de datos**.

---

## ¿Qué es?

XUI.one es un panel de gestión IPTV (administración de canales, VOD, líneas,
servidores de streaming, balanceadores, EPG, etc.). Este repositorio es una copia
fiel del código fuente decodificado, más documentación y un script de instalación
**nativa** (LAMP: Linux + Apache + PHP + MySQL/MariaDB) para dejarlo corriendo.

## Estado de funcionalidad

| Parte | Estado |
|-------|--------|
| Código PHP del panel (`decoded/`) | ✅ Completo |
| Código ofuscado original (`opc/`) | ✅ Incluido (referencia) |
| Documentación e instalación nativa | ✅ En `docs/` y `scripts/` |
| **Esquema de base de datos (SQL)** | ❌ **No incluido** — hay que aportarlo (ver `docs/esquema-bd.md`) |

El panel **no arranca** hasta que existan las tablas en MySQL (el `setup.php`
solo migra/crea admin, no crea el esquema). Esto es normal en los leaks
"decoded" de XUI.one.

## Estructura del repositorio

```
IUX-ZONE/
├── decoded/            # Código fuente decodificado (el que se despliega)
│   ├── www/            # Document root del panel (api.php, player_api.php, ...)
│   ├── admin/          # Backend de administración (setup.php, login.php, ...)
│   ├── includes/       # Núcleo (xui.php, pdo.php, libs/)
│   ├── player/         # Reproductor
│   ├── reseller/       # Panel de revendedor
│   ├── crons/          # Tareas programadas (26 scripts)
│   ├── bin/            # Binarios/helpers
│   ├── status          # Herramienta CLI de estado (usuario xui)
│   └── tools           # Herramienta CLI (requiere root)
├── opc/                # Versión ofuscada/original (referencia, no se despliega)
├── docs/               # Documentación
│   ├── requisitos.md
│   ├── arquitectura.md
│   ├── instalacion-nativa.md
│   └── esquema-bd.md
├── scripts/
│   ├── instalar.sh     # Instalación nativa automatizada (Debian/Ubuntu)
│   └── crontab.xui     # Entradas de cron para el usuario xui
├── LICENSE                 # Libre License 2.0 (USA) — rige este fork
├── LICENSE.apache-upstream # Apache 2.0 del repo origen (referencia)
├── PROVENANCE.md           # Procedencia y avisos legales
└── README.md
```

## Instalable (paquete autónomo)

Además del código en el repo, hay un **paquete instalable** listo para llevar a
cualquier servidor Linux (Debian/Ubuntu):

1. Descarga `xuione-instalable.tar.gz` desde la
   [release `instalable-1.5.13`](https://github.com/TalaveraSama/IUX-ZONE/releases/tag/instalable-1.5.13).
2. En la máquina destino:

   ```bash
   tar xzf xuione-instalable.tar.gz
   cd xuione-instalable
   sudo bash instalar.sh      # asistente interactivo: PHP 7.4, Apache, MariaDB, crons
   ```

El script pregunta dominio, credenciales de BD y (opcionalmente) la ruta/URL del
esquema SQL. Para regenerar el paquete: `bash scripts/empacar.sh`.
🔴 Recuerda: **falta el esquema de BD** (ver `docs/esquema-bd.md`).

## Requisitos mínimos

Resumen (detalle en `docs/requisitos.md`):

- **SO:** Debian 11/12 o Ubuntu 20.04/22.04 (64-bit).
- **PHP:** **7.4** (no usar 8.x sin probar; el código usa `goto`/variables ofuscadas).
- **Extensiones PHP:** `pdo_mysql`, `mysqli`, `curl`, `zlib`, `opcache`,
  `igbinary` *(obligatoria)*, `mbstring`, `json`, `xml`, `zip`, `gd`.
- **BD:** MariaDB 10.x o MySQL 5.7/8.0.
- **Web:** Apache 2.4 (`mod_php` o `php-fpm`) — docroot = `decoded/www/`.
- **Usuario del sistema:** `xui` con home `/home/xui` (el código asume esa ruta).
- **Opcional:** `ffmpeg`/`ffprobe` (transcoding), bases GeoIP de MaxMind.

## Instalación rápida (nativa, sin Docker)

```bash
# 1) Clona y entra al repo
git clone <tu-IUX-ZONE> iux-zone && cd iux-zone

# 2) Ejecuta el instalador (Debian/Ubuntu, como root)
sudo bash scripts/instalar.sh

# 3) Crea la base de datos y aporta el esquema (IMPORTANTE, ver docs/esquema-bd.md)
#    mysql -u root -p
#    CREATE DATABASE xui CHARACTER SET utf8mb4;
#    (importa aquí el SQL del esquema de XUI.one)

# 4) Abre el panel en el navegador y termina con el asistente:
#    http://<tu-ip-o-dominio>/admin/setup.php
```

El script deja todo montado en `/home/xui/` y el document root en
`/home/xui/www`. El paso 3 (esquema) es **obligatorio** y no está resuelto en
este repo; consulta `docs/esquema-bd.md`.

## Documentación

- `docs/requisitos.md` — PHP, extensiones, dependencias del sistema.
- `docs/instalacion-nativa.md` — Guía paso a paso de instalación manual.
- `docs/arquitectura.md` — Constantes, rutas, descifrado de config y crons.
- `docs/esquema-bd.md` — Por qué falta el esquema y cómo proveerlo.

## Licencia

Este fork se distribuye bajo **Libre License 2.0 (USA)** — ver `LICENSE`.
El texto Apache 2.0 del repositorio origen se conserva en
`LICENSE.apache-upstream` como referencia de procedencia. Ver `PROVENANCE.md`
para los avisos legales completos.
