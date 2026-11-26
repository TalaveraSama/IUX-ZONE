# Instalación de la release iux-zone 0.1.0

## Requisitos

- Linux con systemd (Debian / Ubuntu recomendados como destino; valida primero en tu entorno).
- Bash y herramientas estándar: tar, sha256sum, coreutils, getent y useradd.
- Node.js **22 o superior**, accesible para un usuario de servicio, no instalado dentro de `/home` o `/root`. Obtén una versión mantenida mediante el proveedor del runtime o un repositorio de tu distribución. El instalador no descarga runtimes ni ejecuta scripts remotos.
- Puerto TCP 3000 disponible; puertos UDP de tus entradas disponibles y autorizados en el firewall.
- Permisos root para instalar el servicio; no para ejecutarlo.

## Descargar y verificar

```sh
curl -fLO https://github.com/TalaveraSama/IUX-ZONE/releases/download/v0.1.0/iux-zone-0.1.0-linux.tar.gz
curl -fLO https://github.com/TalaveraSama/IUX-ZONE/releases/download/v0.1.0/SHA256SUMS
sha256sum -c SHA256SUMS
tar -xzf iux-zone-0.1.0-linux.tar.gz
cd iux-zone-0.1.0
bash scripts/install.sh --check
```

Comprueba que la verificación SHA-256 es correcta antes de extraer o ejecutar. Las sumas detectan corrupción, pero no sustituyen la confianza en el repositorio de publicación; no están firmadas con una clave separada.

## Modo LAN (HTTP)

Para una primera prueba en una red **privada y confiable**:

```sh
sudo bash scripts/install.sh --lan
sudo cat /etc/iux-zone/iux-zone.env
```

Abre `http://IP-DEL-SERVIDOR:3000` y usa el campo `ADMIN_PASSWORD` como contraseña. `STREAM_TOKEN` es otro secreto, para reproductores, no para entrar al panel. El instalador los genera aleatoriamente y no los imprime automáticamente.

El modo LAN habilita autenticación, pero **no cifra el tráfico**. No debe publicarse a Internet. `NODE_ENV=development` en este modo permite cookies en HTTP; no significa que la contraseña esté deshabilitada. Limita el puerto con firewall a los administradores y reproductores autorizados.

Edita `/etc/iux-zone/iux-zone.env` y configura:

```text
PUBLIC_URL=http://IP-DEL-SERVIDOR:3000
```

Después de editar, reinicia con `sudo systemctl restart iux-zone`.

## Modo seguro (HTTPS mediante proxy)

```sh
sudo bash scripts/install.sh
```

Por defecto escucha solo en `127.0.0.1:3000` y usa `NODE_ENV=production`. Las sesiones requieren HTTPS en el navegador: **un acceso HTTP directo no permite mantener la sesión de producción**. Necesitas un dominio, un certificado válido y un proxy HTTPS configurado por el administrador.

Ejemplo orientativo de bloque Nginx; reemplaza dominio y rutas de certificados por valores reales antes de habilitarlo:

```nginx
server {
    listen 443 ssl;
    server_name tv.example.com;
    ssl_certificate /ruta/real/fullchain.pem;
    ssl_certificate_key /ruta/real/privkey.pem;

    # Evitar guardar tokens de reproducción y consultas en logs.
    access_log off;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_set_header Host $http_host;
        proxy_set_header X-Forwarded-Proto https;
        proxy_http_version 1.1;
        proxy_buffering off;
        proxy_request_buffering off;
        proxy_read_timeout 60s;
    }
}
```

El instalador **no instala Nginx ni solicita certificados**. Valida tu configuración y certificados antes de recargar el proxy. Conserva Host y Origin. En el archivo de entorno define `PUBLIC_URL=https://tu-dominio-real` y reinicia iux-zone. La aplicación no confía automáticamente en encabezados reenviados para generar enlaces, por eso se usa PUBLIC_URL.

No expongas el puerto 3000 directamente en este modo. Restringe la administración y el acceso a las fuentes según tu red. Detrás de un proxy, el límite de intentos de login se comparte por la IP de conexión del proxy.

## Añadir y reproducir un canal

Entradas admitidas:

```text
https://servidor-autorizado.example/canal.ts
http://192.168.10.20:8000/canal.ts
udp://0.0.0.0:5000
udp://239.10.10.1:5000
rtp://239.10.10.2:5002
```

- HTTP: un flujo MPEG-TS continuo, no una lista `.m3u8`, página web o MP4.
- UDP: dirección de escucha local o grupo multicast; puerto 1024–65535, sin parámetros ni rutas.
- RTP: versión 2, payload type 33, MPEG-TS. No RTSP.
- El puerto UDP de un canal activo no puede compartirse con otro proceso/canal en esta versión.
- Para una interfaz multicast concreta: `MULTICAST_INTERFACE=IP-LOCAL-DE-LA-INTERFAZ` en el archivo de entorno.

Habilita el canal y abre **Lista M3U → Mostrar enlace de suscripción**. Introduce el enlace en VLC o en tu reproductor. Las URLs apuntan a iux-zone, y el origen solo se abre al conectarse el reproductor. Comprueba **Relay / clientes** en la biblioteca. Habilitar un canal no inicia por sí solo la recepción.

El token de reproducción da acceso a todos los canales habilitados. No autentica administradores. No se incluyen usuarios de suscripción, caducidad individual ni límites por abonado.

## Archivos, operación y actualización

```text
/opt/iux-zone/releases/0.1.0   Código, propiedad de root
/opt/iux-zone/current         Enlace a la versión activa
/etc/iux-zone/iux-zone.env    Secretos, root:root 0600
/var/lib/iux-zone             JSON de canales, usuario iux-zone
/etc/systemd/system/iux-zone.service
```

```sh
sudo systemctl status iux-zone
sudo journalctl -u iux-zone -n 100 --no-pager
sudo systemctl restart iux-zone
sudo systemctl stop iux-zone
```

Ejecuta el instalador del paquete de una **nueva versión** para actualizar. Conserva datos, contraseña, token y modo de acceso. `--lan` solo se permite la primera vez. No sobrescribe un directorio de versión existente; respalda y revisa una instalación parcial antes de reintentar. Cambia el enlace de código y reinicia: las retransmisiones activas se interrumpen.

El instalador intenta restaurar el enlace de código anterior si el reinicio falla o el servicio está inactivo tras la comprobación inicial. Esto no es una transacción completa ni detecta fallos posteriores o indisponibilidad de fuentes. Verifica siempre estado y logs.

Para rollback manual de código, cambia `/opt/iux-zone/current` a una versión anterior **que realmente exista** y reinicia. Revisa compatibilidad del formato de datos entre versiones; no restaures un JSON mientras el servicio está escribiendo.

## Copia de seguridad

```sh
sudo systemctl stop iux-zone
sudo tar -czf /root/iux-zone-backup.tar.gz /var/lib/iux-zone /etc/iux-zone
sudo chmod 600 /root/iux-zone-backup.tar.gz
sudo systemctl start iux-zone
```

La copia contiene secretos: almacénala cifrada y fuera de un servidor web. Una instancia por directorio. La persistencia usa rename atómico, no una base de datos multiusuario ni garantías contra pérdida de energía.

## Desinstalación (conservando datos)

```sh
sudo systemctl disable --now iux-zone
sudo rm /etc/systemd/system/iux-zone.service
sudo systemctl daemon-reload
sudo rm -rf /opt/iux-zone
```

Esto conserva `/var/lib/iux-zone`, `/etc/iux-zone` y el usuario de servicio. Elimina esos datos y el usuario **solo tras verificar una copia y decidir expresamente que ya no los necesitas**.

## Límites y validación de la release

Pruebas automatizadas con sockets HTTP y UDP reales y paquetes MPEG-TS sintéticos. No constituyen una prueba de reproducción de un programa audiovisual, un sintonizador DVB, redes multicast reales ni una cabecera de alta carga. El instalador requiere verificación en un host systemd real; el modo `--check` no instala ni comprueba conectividad de fuentes.

Sin transcodificación, HLS/DASH, salida UDP, EPG ni descifrado. Consulta el README para el alcance completo y usa solo contenido autorizado.
