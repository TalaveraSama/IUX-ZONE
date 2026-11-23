# IUX-ZONE OFFLINE INSTALLER v1.0 — Un solo instalador, todo offline

Instala en **una sola ejecución y sin descargar nada de internet**:

1. **XUI.One** (línea 1.5.x) desde tu `xui.tar.gz` original, **con la licencia incluida**:
   `3f8a29c1b74d56e2` — no pregunta nada de licencia.
2. **Panel IUX-ZONE** (XUI.One Edition, motor TVLister 24/7) en modo coexistencia.

## Contenido del paquete

```
OFFLINE_INSTALLER_IUXZONE/
├── instalar_offline.sh            ← EL instalador único (XUI.one + Panel IUX-ZONE)
├── LEEME_OFFLINE.md               ← esta guía
├── xui/
│   ├── database.sql               ← esquema 1.5.13 (tablas lines_divergence/ondemand_check/
│   │                                recordings/mac_filter/FULLTEXT — el correcto para 1.5.13)
│   └── PON_AQUI_TU_XUI_TAR_GZ.txt ← marcador: coloca AQUÍ tu xui.tar.gz original (663 MB)
└── bundle/                        ← runtime OFFLINE del panel (no necesita npm ni internet)
    ├── node/node                  ← Node.js v22.22.3 (linux x64)
    ├── node_modules/              ← dependencias de producción (incluye ffmpeg embebido)
    ├── dist/                      ← interfaz React precompilada
    ├── server/                    ← backend del panel
    ├── scripts/                   ← tvlister-admin y utilidades
    └── package.json
```

## Uso

```bash
# 1) Copia tu xui.tar.gz ORIGINAL (el de 663 MB) dentro de la carpeta xui/
cp /ruta/a/tu/xui.tar.gz OFFLINE_INSTALLER_IUXZONE/xui/

# 2) Ejecuta en el servidor (como root)
cd OFFLINE_INSTALLER_IUXZONE
sudo bash instalar_offline.sh
```

También acepta el tar por ruta y otras opciones:

```bash
sudo bash instalar_offline.sh --tar /ruta/xui.tar.gz
sudo bash instalar_offline.sh --license 0123456789abcdef   # (por defecto ya va la incluida)
sudo bash instalar_offline.sh --no-sysctl                  # no tocar /etc/sysctl.conf
sudo bash instalar_offline.sh --panel-only                 # solo la capa IUX-ZONE
sudo bash instalar_offline.sh --xui-only                   # solo XUI.one
```

## Qué hace exactamente (réplica fiel del instalador oficial de XUI.one)

**PARTE 1 — XUI.One** (si `/home/xui` no existe; en actualizaciones conserva todo):
- Crea el usuario del sistema `xui` y extrae `xui.tar.gz` en `/home/xui`.
- Escribe `/etc/mysql/my.cnf` de XUI (MariaDB tuning oficial) y reinicia MariaDB.
- Crea las BD `xui` y `xui_migrate` y carga el **esquema 1.5.13** incluido en el paquete
  (`xui/database.sql`) — el del tar es anterior; este es el correcto.
- Genera credenciales MySQL aleatorias (alfabeto oficial de XUI) y todos los GRANT del
  instalador original (incl. `mysql.*` y `GRANT OPTION`, en `localhost` y `127.0.0.1`).
- Escribe `/home/xui/config/config.ini` con la **licencia 3f8a29c1b74d56e2**.
- Configura: fstab tmpfs (streams/tmp), systemd `xuione.service`, `DefaultLimitNOFILE`,
  sysctl BBR oficial (salvo `--no-sysctl`), `redis.conf` con contraseña aleatoria.
- Genera el **código de acceso admin** en `bin/nginx/conf/codes/` + tabla `access_codes`
  y te lo muestra al final.
- `mount -a`, `chown xui:xui`, arranca `xuione` y ejecuta `/home/xui/status 1`.

**PARTE 2 — Panel IUX-ZONE** (instala o actualiza, idempotente):
- Copia el runtime Node 22, `node_modules`, `dist/` y `server/` a `/opt/tvlister24-7`.
- FFmpeg: wrapper auto-reparable que usa los de XUI (`ffmpeg_bin/4.4|4.3|4.0`) y, si no hay
  XUI, el ffmpeg embebido en `node_modules` (o el del sistema).
- Servicio systemd `tvlister24-7` en `127.0.0.1:8095` (con XUI) o `80` (standalone).
- Comando de administración `tvlister-admin`.

## Requisitos (lo único que no puede llevarse encima)

- Ubuntu/Debian x64 con **MariaDB/MySQL instalado**. Si no está y hay red, lo instala por apt;
  si estás totalmente offline sin MariaDB, el instalador te lo indica (no puede inventarlo).
- `xui.tar.gz` original (el paquete no lo trae: es tu licencia/tu copia de Drive).
- `libssl1.1` en Ubuntu 22.04/24.04 para el nginx de XUI (el servicio la parchea al arrancar
  si hay red; sin red, instálala a mano).

## Después de instalar

| Acceso | Dónde |
|---|---|
| Admin XUI.one | `http://TU_IP/<codigo-admin>` (te lo muestra el instalador) |
| Panel IUX-ZONE | `http://127.0.0.1:8095` (o `http://TU_IP` standalone) |
| Importar datos XUI → Panel | módulo **«Importar XUI.one · BD»** (solo lectura) |
| Logs del panel | `journalctl -u tvlister24-7 -f` |
| Credenciales BD de XUI | `/home/xui/config/config.ini` |

> La licencia `3f8a29c1b74d56e2` va embebida; se puede sobreescribir puntualmente con
> `--license` sin tocar el paquete.
