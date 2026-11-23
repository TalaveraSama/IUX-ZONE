# Arquitectura de la fusión (detalle técnico)

## Principio

**XUI.One manda**: es el panel base (streaming masivo, MAG/Stalker/Enigma2, líneas, resellers,
admin API, nginx maestro en 80/443). **TVLister 24/7 se subordina a XUI**: corre como servicio
Node aparte, en puerto interno, sin instalar dependencias del sistema y leyendo (no escribiendo)
la base de datos de XUI.

## Componentes y fronteras

| Componente | Proceso / Servicio | Puerto | Escribe | Lee |
|---|---|---|---|---|
| XUI.One admin + API | nginx (`bin/nginx`) + PHP-FPM ionCube | 80/443 (admin) | BD `xui` | BD `xui` |
| XUI.One streaming | nginx_rtmp + ffmpeg + daemons PHP | puertos broadcast (80/443 cliente, 8880 RTMP…) | streams/cache | BD `xui` |
| Redis de XUI | `bin/redis/redis-server` | 6379 (local) | cache | — |
| TVLister 24/7 | systemd `tvlister24-7` (Node 22) | **127.0.0.1:8095** | **su SQLite** `data/tvlister.db` | BD `xui` (SELECT) |
| Playout/ffmpeg de TVLister | hijos del proceso Node | — | tmp propio | fuentes de streams |

**Regla de oro**: TVLister nunca escribe en la BD `xui`. La importa a su catálogo SQLite
(`server/xuiImporter.js`) y trabaja sobre su copia. Así XUI sigue siendo la fuente de verdad
operativa y TVLister puede reinstalarse sin tocar XUI.

## Cómo descubre TVLister las credenciales de XUI

En este orden (`server/xuiImporter.js`):

1. `/root/credentials.txt`, `/home/xui/credentials.txt`, `/home/xui/config/credentials.txt`
   (formato `MySQL Username: …` / `MySQL Password: …`)
2. `/etc/mysql/debian.cnf` (usuario de mantenimiento de MariaDB)
3. Socket UNIX (`/run/mysqld/mysqld.sock`, …) y BD candidata `xui` → `xuione` → `xtream_iptvpro`

Si nada de eso está disponible, crear el usuario de solo lectura de
`USUARIO_MYSQL_LECTURA.sql` y meterlo en el importador.

## Tránsito por el nginx de XUI (opcional, recomendado)

TVLister genera en su arranque un bloque nginx de coexistencia (proxy
`127.0.0.1:8095`). Dos opciones:

- **Subdominio/dominio propio** para TVLister (server_name aparte en el nginx de XUI).
- **Ruta** `/tvlister/` dentro del host existente (proxy_pass con cabeceras Host/X-Forwarded).

La resolución TLS la sigue haciendo el certbot de XUI (`/home/xui/bin/certbot`) o el que ya
tenga el servidor — TVLister incluye su propio gestor TLS solo si corre en 443 standalone.

## ffmpeg compartido

`scripts/install_ubuntu.sh` de TVLister busca en orden:

```
/home/xui/bin/ffmpeg_bin/4.4/ffmpeg
/home/xui/bin/ffmpeg_bin/4.3/ffmpeg
/home/xui/bin/ffmpeg_bin/4.0/ffmpeg
/home/xui/bin/ffmpeg/ffmpeg            (ruta antigua)
```

y crea un wrapper revalidado en cada arranque (si una actualización de XUI cambia la versión,
el wrapper se repara solo). Solo si no hay ninguno ejecutable descarga uno propio.
`LD_LIBRARY_PATH` apunta a las librerías que trae XUI.

## Flujos de datos de la fusión

1. **Importación catálogo**: BD `xui` (lines, streams, streams_servers, vod…) → SQLite de
   TVLister → páginas Live/VOD/Series del panel moderno.
2. **VOD Jellyfin→symlink**: TVLister enlaza archivos del disco (sin copiar) igual que hace
   XUI con sus VOD; conviven en servidores con mucho disco sin duplicar.
3. **Canales 24/7**: TVLister arma el playout (playlist/YouTube) y lo publica como stream HLS;
   puede alimentarse de fuentes que ya emite XUI (URLs de línea Xtream) sin duplicar emisión.
4. **Edge/balancers**: los nodos edge de TVLister cachean segmentos y suman ancho de banda al
   maestro; son independientes de los LB de XUI — no mezclarlos en el mismo despliegue.
