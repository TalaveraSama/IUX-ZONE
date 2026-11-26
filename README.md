# iux-zone · Tvheadend workspace

Consola de cabecera IPTV/DVB en español: gestión de canales, integración con Tvheadend y retransmisión HTTP MPEG-TS bajo demanda.

**Rama en desarrollo: 0.2.0.** La última release publicada previamente fue [v0.1.1](https://github.com/TalaveraSama/IUX-ZONE/releases/tag/v0.1.1); **esa release no contiene el nuevo panel Tvheadend**. Este cambio no publica otra release automáticamente.

## Las bases solicitadas

- **DSH Our Free Model:** se reutilizan sus tokens visuales MIT, conservando su licencia. Ese repositorio es un plugin de IA: no se incorporan sus proveedores ni sus ejecutables.
- **Tvheadend:** motor DVB externo, integrado mediante API HTTP. Se conserva su identidad y licencia GPL; no se incluyen ni renombran sus binarios. Los drivers TBS siguen siendo responsabilidad del host y su compatibilidad depende del modelo.

[Procedencia y licencias](third_party/README.md) · [Guía y alcance de Tvheadend](docs/TVHEADEND.md)

## Panel disponible

- **Vista general:** biblioteca local, grupos y distribución de fuentes configuradas.
- **Cabecera DVB:** comprobación del motor y resumen de hardware, redes, multiplexes, servicios y canales.
- **Adaptadores / TBS:** árbol de dispositivos, exploración de frontends y editor de propiedades publicadas por el motor.
- **Redes y frecuencias:** creación/edición de redes y multiplexes, exploración y eliminación confirmada.
- **Servicios y canales:** selección, mapeo en el motor e importación idempotente a iux-zone.
- **EPG:** consulta paginada de eventos reales de Tvheadend.
- **Actividad:** entradas, señal/SNR en las unidades originales del motor, suscripciones y conexiones.
- **Conexión al motor:** probar, guardar o eliminar conexión, autenticación Basic/Digest y contraseña protegida del lado del servidor.
- **Canales y M3U:** CRUD local, relays compartidos, token de reproducción separado del administrador y descarga/suscripción M3U.

No se cargan dispositivos o estadísticas de demostración. Sin motor configurado se muestra una pantalla de conexión. Las pruebas usan fixtures explícitos, nunca introducidos en la aplicación de producción.

## Ejecutar el código de esta rama

Requisito: **Node.js >=22**. No hay dependencias npm de ejecución.

```sh
npm start
# http://localhost:3000
```

Esto activa el modo de desarrollo. Si no defines ADMIN_PASSWORD, cualquiera con acceso al puerto puede administrar la instancia. **No lo publiques así en Internet.**

Para usar configuración local:

```sh
cp .env.example .env
# Edita .env con ADMIN_PASSWORD y STREAM_TOKEN únicos y diferentes.
node --env-file=.env server.js
```

En producción, define NODE_ENV=production, una contraseña de al menos 12 caracteres, un token de al menos 24, y publica mediante un proxy HTTPS. Las cookies Secure no mantienen sesión en HTTP directo. El servidor escucha en 0.0.0.0 por defecto para admitir la vista previa; el instalador seguro usa 127.0.0.1.

## Conectar Tvheadend

1. Prepara Tvheadend y el driver de tu TBS en un host Linux. El motor debe poder acceder a /dev/dvb.
2. Abre **Conexión al motor** e introduce su origen, usuario y contraseña. Ejemplo en el mismo host: `http://127.0.0.1:9981`.
3. El usuario necesita administración y streaming, incluido el perfil **pass**. Pulsa **Comprobar conexión** y después **Guardar**.
4. Explora los adaptadores, crea una red compatible, asigna sus UUID al frontend y configura los multiplexes.
5. Explora la red, mapea los servicios, e importa canales desde **Canales del motor**.
6. Descarga la lista M3U de iux-zone. El servidor obtiene el MPEG-TS autenticado desde Tvheadend y lo distribuye sin exponer las credenciales del motor.

El editor es guiado por los metadatos del motor; las relaciones/listas avanzadas se introducen como JSON de UUID. No es todavía un asistente completo para LNB, DiSEqC, USALS o CAM/CI. Esos ajustes pueden requerir la interfaz nativa de Tvheadend. [Detalles y límites](docs/TVHEADEND.md).

## Entradas y salidas

| Entrada | Salida |
|---|---|
| HTTP / HTTPS MPEG-TS directo | HTTP MPEG-TS |
| UDP-TS IPv4 / RTP v2 MP2T | HTTP MPEG-TS |
| `tvh://channel/<uuid>` importado del motor | HTTP MPEG-TS con autenticación upstream en el servidor |

Un origen compartido por canal; desconectar el último cliente libera el origen. Se aplican timeout de inactividad de 15 segundos, cola máxima de 2 MiB por cliente, 32 sesiones de canal y 256 clientes totales. No son garantías de rendimiento: mide tu hardware y red.

No hay transcodificación, conversión HLS, salida UDP/RTP, captura directa DVB desde Node, descifrado, DVR ni usuarios por abonado. El perfil pass debe entregar TS de 188 bytes. La EPG del panel no publica todavía un XMLTV propio.

## Configuración y seguridad

| Variable | Uso |
|---|---|
| HOST / PORT | Dirección y puerto HTTP; predeterminados 0.0.0.0:3000 |
| DATA_DIR | Directorio persistente; predeterminado data junto al servidor |
| ADMIN_PASSWORD | Contraseña del panel; obligatoria en producción |
| STREAM_TOKEN | Secreto de reproducción compartido por todos los canales habilitados |
| PUBLIC_URL | Origen externo para los enlaces M3U, especialmente detrás de un proxy |
| MULTICAST_INTERFACE | IPv4 local para recepción multicast |
| NODE_ENV | production activa cookies Secure y restricciones de iframe |

La conexión a Tvheadend se guarda desde el panel en `DATA_DIR/tvheadend.json` (0600), no en variables del navegador. Las contraseñas no se devuelven por la API, pero **no se cifran en disco**. Restringe y respalda el directorio completo; contiene datos y secretos.

Una instancia por directorio JSON. Las sesiones administrativas y del relay están en memoria y se cierran al reiniciar. El administrador de fuentes puede conectar con servicios de red internos: solo usuarios de confianza y salida de red restringida. HTTP, incluso con Digest, no cifra el video. No se siguen redirecciones con las credenciales de Tvheadend ni se desactiva la verificación TLS.

## Pruebas y paquete local

```sh
npm test
npm run check
npm run package
```

El empaquetado produce `dist/iux-zone-0.2.0-linux.tar.gz` y `dist/SHA256SUMS`. Requiere Node.js ya instalado; no es un binario autónomo. El instalador conserva configuración y canales en actualizaciones y mantiene las correcciones del enlace current de v0.1.1.

**No se ha validado una TBS física ni un Tvheadend real en esta sesión.** Las pruebas nuevas reproducen la API con un servidor fixture, autenticación, sockets y MPEG-TS sintético; no certifican sintonización, códecs ni rendimiento de producción.

Para instrucciones de la versión publicada anteriormente: [instalación 0.1.1](docs/INSTALACION.md) y [documentación histórica](docs/VERSION-0.1.1.md). No confundas ese archivo de descarga con el paquete local 0.2.0.

Usa únicamente contenido y señales que tengas autorización para recibir y distribuir.
