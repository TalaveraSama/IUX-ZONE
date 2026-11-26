# iux-zone v0.1.1 — corrección del arranque y reparación de current

Corrige el fallo de instalación de v0.1.0 que podía terminar en `status=200/CHDIR` y `Too many levels of symbolic links`.

## Causa y cambios

1. Node.js resuelve los enlaces simbólicos de los módulos, pero el comprobador del punto de entrada comparaba esa ruta real con una ruta sin resolver. Iniciar mediante `/opt/iux-zone/current/server.js` podía finalizar con código 0 sin abrir el puerto. Ahora se compara la ruta real.
2. `readlink -f` podía devolver el nombre de `current` cuando aún no existía. El rollback lo conservaba como versión anterior y podía crear un enlace a sí mismo. Ahora solo se guarda un enlace existente que resuelva a código real dentro de `releases`.
3. La activación sustituye atómicamente el enlace, incluso si está roto o es cíclico, usando un nombre temporal único.
4. La versión reportada por la API se obtiene de package.json.

## Reparar una instalación 0.1.0

Descarga de esta release `iux-zone-0.1.1-linux.tar.gz` y `SHA256SUMS`. En la carpeta de descarga:

```sh
sha256sum -c SHA256SUMS && \
  tar -xzf iux-zone-0.1.1-linux.tar.gz && \
  cd iux-zone-0.1.1 && \
  bash scripts/install.sh --check && \
  sudo bash scripts/install.sh
```

**En una actualización no uses `--lan`**, aunque la instalación original fuera LAN. Se conserva `/etc/iux-zone/iux-zone.env`, incluido el modo LAN/HTTPS, la contraseña y el token. También se conserva `/var/lib/iux-zone` con los canales. No hace falta borrar ni recrear estos directorios.

Después:

```sh
sudo systemctl status iux-zone --no-pager -l
sudo journalctl -u iux-zone -n 30 --no-pager
```

Para una primera instalación en LAN se mantiene la opción `--lan`. HTTP solo es adecuado para una red privada confiable. Producción requiere proxy HTTPS y PUBLIC_URL correcto.

## Validación y alcance

22 pruebas automatizadas: incluye arranque real del proceso invocado mediante un enlace simbólico, rechazo de rollback inexistente/roto/cíclico/externo y sustitución de un `current` cíclico. Se mantienen las pruebas de transporte HTTP-TS, UDP/RTP y autenticación.

La salida de video continúa siendo HTTP MPEG-TS, con entradas HTTP/HTTPS MPEG-TS, UDP-TS y RTP/MP2T. Sin transcodificación, DVB, conversión HLS ni salida UDP/RTP. Paquete Linux con instalador systemd: **requiere Node.js >=22 instalado; no incluye runtime**.

Guía completa: https://github.com/TalaveraSama/IUX-ZONE/blob/v0.1.1/docs/INSTALACION.md
