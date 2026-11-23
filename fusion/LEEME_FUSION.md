# FUSIÓN — XUI.One (base) + TVLister 24/7 (capa moderna)

Paquete unificado en el que **predomina XUI.One** como panel base y **TVLister 24/7** se monta
encima como capa moderna (VOD, canales 24/7, WebTV, CATV/UDP, balancers edge), alimentándose
de la base de datos de XUI.

> Lee primero [`COMPARATIVA_PANELES.md`](COMPARATIVA_PANELES.md) para entender el reparto de
> papeles y [`integracion/ARQUITECTURA_FUSION.md`](integracion/ARQUITECTURA_FUSION.md) para el
> detalle técnico de la integración.

## Contenido del paquete

```
FUSION_XUI_TVLISTERSAT/
├── LEEME_FUSION.md            ← esta guía
├── COMPARATIVA_PANELES.md     ← comparativa completa XUI vs TVLister
├── instalar_fusion.sh         ← instalador unificado (sudo bash instalar_fusion.sh)
├── integracion/
│   ├── ARQUITECTURA_FUSION.md
│   ├── SERVICIOS_Y_PUERTOS.md
│   └── USUARIO_MYSQL_LECTURA.sql
├── xui-one/                   ← PANEL BASE (predominante)
│   ├── install · update · service      ← scripts raíz originales de XUI.One
│   ├── database.sql                    ← esquema 1.5.13 (usar este, NO el del tar)
│   ├── decoded/                        ← fuente descodificada 1.5.13 (auditación/modificación)
│   ├── opc/                            ← volcados de opcodes (referencia de auditoría)
│   ├── LICENSE                         ← Apache-2.0 del repo de decodificación
│   └── analisis_original/              ← árbol, diff de estructura y tamaños vs repo
└── tvlister24-7/              ← CAPA MODERNA (v2.6.67, fuente completa)
    ├── server/  src/  scripts/  tools/  docs/
    └── package.json  Dockerfile  docker-compose.yml  README.md
```

## Orden de instalación (servidor nuevo)

1. **XUI.One primero** (panel base):
   ```bash
   cd FUSION_XUI_TVLISTERSAT/xui-one
   # Coloca a tu lado el xui.tar.gz ORIGINAL de tu licencia (el de 663 MB del Drive)
   sudo cp /ruta/a/tu/xui.tar.gz ./xui.tar.gz
   sudo ./install          # pedirá la licencia (16 hex) e instalará en /home/xui
   ```
   ⚠️ El código de `decoded/` es la fuente descodificada para **auditar y personalizar**; el
   panel en producción usa los archivos ionCube + binarios del tar original (nginx, ffmpeg,
   php, redis, `xui.so`). Al terminar, si tu BD quedó con el esquema viejo del tar, aplica el
   esquema nuevo: `mysql -u root -p xui < database.sql` **solo en instalaciones nuevas** (nunca
   sobre una BD con datos).
2. **TVLister después** (capa moderna, modo coexistencia):
   ```bash
   cd ..
   sudo bash instalar_fusion.sh
   ```
   El instalador detecta `/home/xui`, instala TVLister desde la carpeta incluida
   (sin clonar nada, sin tocar apt/MariaDB/nginx) y lo deja en `127.0.0.1:8095` tras el
   nginx de XUI.
3. **Integración con la BD de XUI**:
   ```bash
   mysql -u root -p < integracion/USUARIO_MYSQL_LECTURA.sql   # (edita la contraseña primero)
   ```
   Entra al panel de TVLister → página **Xui Import** → importa líneas/streams/VOD desde la BD
   `xui`. (TVLister también intenta leer las credenciales de `/home/xui/config/config.ini` y
   `/etc/mysql/debian.cnf` automáticamente.)

## Servidor que YA tiene XUI.one

Solo los pasos 2 y 3. No reinstales XUI. El instalador entra en modo seguro y conserva todo.

## Accesos resultantes

| Servicio | URL |
|---|---|
| Admin XUI.One | `http://TU_IP/admin/` (o el código de acceso que tengas configurado) |
| Panel TVLister (directo) | `http://127.0.0.1:8095` (local) o `http://TU_IP:8095` si abres el puerto |
| Panel TVLister (por nginx de XUI) | `http://TU_IP/tvlister/` tras activar el vhost que genera TVLister |
| Portal WebTV de clientes | dentro del panel TVLister → WebTvPortal |
| Comando de administración | `tvlister-admin` (ffmpeg, jellyfin, catv flussonic, tls, …) |

## Notas importantes

- **Puertos**: XUI mantiene 80/443 (y sus puertos de broadcast). TVLister usa 8095 interno.
  Detalle en `integracion/SERVICIOS_Y_PUERTOS.md`.
- **ffmpeg**: TVLister reutiliza los de XUI (`/home/xui/bin/ffmpeg_bin/...`) con un wrapper
  auto-reparable; solo descarga uno propio si XUI no tiene ninguno ejecutable.
- **Actualizaciones de TVLister**: re-ejecuta `sudo bash instalar_fusion.sh` con una carpeta
  `tvlister24-7/` más nueva (es idempotente) o usa su actualizador normal.
- **Licencias**: XUI.One es producto comercial (requiere tu licencia y su ionCube);
  la fuente decodificada se distribuye bajo Apache-2.0 (ver `xui-one/LICENSE`).
  TVLister 24/7 es desarrollo propio (repo `TalaveraSama/tvlister24-7`, v2.6.67).
- **Backups**: haz dump de la BD `xui` antes de cualquier importación masiva.
