# iux-zone 0.1.1

Consola IPTV independiente con **retransmisión MPEG-TS real**, administración de canales y listas M3U. Interfaz en español, Node.js 22+, sin dependencias npm de ejecución.

## Descargar e instalar

Release: **https://github.com/TalaveraSama/IUX-ZONE/releases/tag/v0.1.1**

Requisitos del instalador: Linux con systemd, Bash, herramientas habituales de administración y **Node.js >=22 ya instalado** en `/usr/bin`, `/usr/local/bin` o `/opt`. El paquete es portable entre arquitecturas compatibles con Node.js; **no incluye el runtime ni es un binario autónomo**.

```sh
curl -fLO https://github.com/TalaveraSama/IUX-ZONE/releases/download/v0.1.1/iux-zone-0.1.1-linux.tar.gz
curl -fLO https://github.com/TalaveraSama/IUX-ZONE/releases/download/v0.1.1/SHA256SUMS
sha256sum -c SHA256SUMS
tar -xzf iux-zone-0.1.1-linux.tar.gz
cd iux-zone-0.1.1
bash scripts/install.sh --check
# Primera instalación en una LAN confiable, con contraseña generada:
sudo bash scripts/install.sh --lan
```

Abre `http://IP-DEL-SERVIDOR:3000`. Consulta la contraseña con `sudo cat /etc/iux-zone/iux-zone.env`. **HTTP no cifra credenciales ni video: no publiques este modo en Internet.**

Para producción, usa `sudo bash scripts/install.sh` **sin `--lan`**: escucha en `127.0.0.1:3000`, exige proxy HTTPS y utiliza cookies Secure. Configura `PUBLIC_URL` para los enlaces de reproducción. Consulta [la guía de instalación, HTTPS, actualización y desinstalación](INSTALACION.md).

## Qué hace la retransmisión

| Entrada | Salida | Soporte |
|---|---|---|
| HTTP / HTTPS MPEG-TS directo | HTTP MPEG-TS | Sí, TLS verificado por Node.js |
| UDP IPv4 con paquetes MPEG-TS de 188 bytes | HTTP MPEG-TS | Sí, unicast local y multicast |
| RTP v2 / payload type 33 (MP2T) sobre UDP IPv4 | HTTP MPEG-TS | Sí, retira cabecera RTP |
| HLS / DASH / RTMP / SRT | — | No |
| Sintonizadores DVB, BISS, transcodificación | — | No |
| Emisión UDP/RTP de salida | — | No: la salida implementada es HTTP-TS |

- Se abre **una conexión de origen por canal**, bajo demanda del primer cliente.
- Se distribuyen los bytes a varios clientes, sin transcodificar ni cambiar códecs.
- El último cliente al desconectar libera el origen o el socket UDP.
- Error de origen o 15 segundos sin MPEG-TS: se cierra la sesión; el reproductor debe reconectar. No hay reconexión automática interna.
- Un lector lento se desconecta si su cola supera 2 MiB, sin bloquear a los demás.
- Límites de esta versión: 32 canales simultáneos, 256 clientes totales, sin promesa de capacidad de bitrate. Mide CPU y red en tu hardware.
- Estado, bytes recibidos, clientes y errores observados en `/api/relay` y en el panel. No son métricas DVB ni comprobaciones de canales sin demanda.
- RTP no implementa jitter buffer, reordenamiento, RTCP, FEC ni recuperación de pérdidas. Los saltos de secuencia se cuentan como discontinuidades, no como una estimación exacta de paquetes perdidos.
- UDP/RTP requiere puerto no privilegiado (1024–65535) y exclusivo por canal activo. Unicast: dirección de **escucha local** (por ejemplo `udp://0.0.0.0:5000`), no IP del emisor remoto. Multicast: `udp://239.1.1.1:5000`, con `MULTICAST_INTERFACE` si hace falta.

El servidor debe tener acceso autorizado a los orígenes. Los reproductores solo necesitan acceso a iux-zone y compatibilidad con los códecs originales. No se ha probado una instalación de gran escala ni reproducción audiovisual en hardware real; las pruebas de transporte usan paquetes MPEG-TS sintéticos y sockets reales.

## Uso

1. Abre **Nuevo canal** e introduce una URL MPEG-TS autorizada, un grupo y, opcionalmente, tvg-id y logo.
2. Actívalo para incluirlo en la lista.
3. En **Lista M3U**, descarga el archivo o pulsa **Mostrar enlace de suscripción**.
4. Abre ese archivo o enlace en VLC o tu reproductor IPTV. La conexión del reproductor inicia la retransmisión.
5. Mira el estado real del relay en la tabla de canales. «Habilitado» no significa que esté transmitiendo: sin clientes permanece sin demanda.

`STREAM_TOKEN` es un secreto de reproducción separado de `ADMIN_PASSWORD`: permite leer la lista y **todos los canales habilitados**, pero no administrar ni exportar las URLs originales. El instalador genera ambos. Rotar `STREAM_TOKEN` y reiniciar revoca los enlaces anteriores y desconecta las sesiones; no hay tokens individuales por cliente en esta versión.

Con contraseña y sin `STREAM_TOKEN`, se requiere cookie de administración para reproducir: la suscripción externa no funcionará. Sin contraseña ni token, solo desarrollo: cualquiera que alcance el puerto puede administrar y reproducir.

Los M3U exportados apuntan a `/stream/<id>.ts?token=…`, no al origen. La exportación de orígenes permanece disponible **solo para administradores** en `/playlist.m3u?direct=1`. Los logos e IDs son metadatos: no hay descarga de logos ni guía XMLTV.

## Ejecutar sin instalar

```sh
npm start
# http://localhost:3000 — desarrollo sin autenticación, NO publicar.
```

O bien configura `.env`:

```sh
cp .env.example .env
# Edita ADMIN_PASSWORD y STREAM_TOKEN con secretos diferentes.
node --env-file=.env server.js
```

`npm start` no carga `.env` automáticamente. No se necesita `npm install` para ejecutar la app.

| Variable | Predeterminado | Uso |
|---|---|---|
| `PORT` | `3000` | Panel, API, lista y retransmisiones HTTP |
| `HOST` | `0.0.0.0` | Dirección de escucha; instalador seguro usa `127.0.0.1` |
| `DATA_DIR` | `./data` junto al servidor | Directorio JSON persistente |
| `ADMIN_PASSWORD` | vacío | Contraseña de administrador; producción exige ≥12 caracteres |
| `STREAM_TOKEN` | vacío | Secreto de reproducción (≥24 caracteres si se configura) |
| `PUBLIC_URL` | origen de la petición | Origen externo, ej. `https://tv.example.com`, sin rutas; obligatorio detrás de un proxy para exportar URLs correctas |
| `MULTICAST_INTERFACE` | ruta de red predeterminada | IPv4 local de la interfaz multicast |
| `NODE_ENV` | desarrollo | `production` usa cookies Secure y protección contra iframes |

## Seguridad y datos

- Solo un administrador de confianza debe configurar fuentes: **el relay puede conectar con servicios internos**, lo cual es necesario para cabeceras LAN. No hay aislamiento de destinos ni defensa SSRF frente a un administrador malicioso; restringe la salida de red del servicio según tu despliegue.
- Sesión de administración de 8 horas, cookie HttpOnly / SameSite, límite de intentos de login y validación Origin. HTTPS es obligatorio para mantener sesión con `NODE_ENV=production`.
- No se aceptan credenciales embebidas en URLs. Los tokens de consulta del origen quedan en el JSON y en formularios: protege archivos y copias.
- Los tokens de reproducción van en la URL: evita registrarlos en logs de proxy, historiales o capturas. No compartas listas públicamente. Sin controles individuales ni límites por suscriptor.
- Una instancia por directorio de datos. JSON con reemplazo atómico, sin bloqueo multiproceso ni base de datos multiusuario.
- Sesiones y estado del relay en memoria. Reiniciar cierra las retransmisiones. Deshabilitar, borrar o cambiar el origen de un canal también cierra sus clientes.
- Sin roles, auditoría, facturación, DRM, EPG, autodescubrimiento DVB ni soporte de claves BISS.

## Docker

```sh
docker build -t iux-zone:local .
# ADMIN_PASSWORD y STREAM_TOKEN deben estar exportados en tu entorno.
# Requiere proxy HTTPS; PUBLIC_URL debe apuntar a ese proxy.
docker run -d --name iux-zone \
  -p 127.0.0.1:3000:3000 \
  -e ADMIN_PASSWORD -e STREAM_TOKEN -e PUBLIC_URL \
  -v iux-zone-data:/app/data iux-zone:local
```

Usuario no privilegiado. Para recibir multicast, usa una red de host o una configuración de red multicast probada; el bridge de Docker no suele transportar la recepción multicast como esperas. En Linux con `--network host`, omite `-p` y establece `HOST=127.0.0.1` si hay proxy. Para UDP unicast publica explícitamente cada puerto `/udp`. No hay dispositivos DVB implementados.

## Validación y empaquetado

```sh
npm test
npm run check
npm run package
# dist/iux-zone-0.1.1-linux.tar.gz y dist/SHA256SUMS
```

Pruebas de CRUD, persistencia, autenticación, tokens, HTTP-TS compartido, recepción UDP/RTP real, errores, timeouts, límites y clientes lentos. Los paquetes de prueba comprueban transporte e integridad de bytes, no decodificación audiovisual.

## API

Escrituras JSON. La API de administración solo admite sesión, nunca el token de reproducción.

| Método | Ruta | Función |
|---|---|---|
| GET / POST / DELETE | `/api/session` | Estado / login / logout |
| GET | `/api/system` | Versión y capacidades |
| GET / POST | `/api/channels` | Listar / crear |
| PATCH / DELETE | `/api/channels/:id` | Actualizar / eliminar |
| GET | `/api/relay` | Sesiones de origen observadas y errores |
| GET | `/api/playback` | Enlace secreto de suscripción para el administrador |
| GET | `/playlist.m3u?token=…` | Lista de salidas retransmitidas |
| GET | `/stream/:id.ts?token=…` | Video HTTP-TS bajo demanda |

## Referencia

Se revisó [novaheadend/nova-core-releases](https://github.com/novaheadend/nova-core-releases): solo distribuye binarios propietarios, no fuentes del producto. **iux-zone no es un fork ni contiene su código, marcas, capturas o ejecutables.** [Revisión y diferencias](REVISION-NOVA.md).

Usa únicamente señales que tengas autorización para recibir y distribuir.
