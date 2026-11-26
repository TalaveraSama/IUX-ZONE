# iux-zone v0.1.0 — consola IPTV y retransmisión MPEG-TS

Primera release instalable del proyecto independiente iux-zone. **No es un binario renombrado de Nova Core.**

## Incluye

- Panel web en español, gestión persistente de canales, grupos y metadatos.
- Retransmisión real bajo demanda: **HTTP/HTTPS MPEG-TS, UDP-TS y RTP/MP2T → HTTP MPEG-TS**.
- Un origen compartido por canal, liberación al desconectarse el último cliente, timeout y límites de memoria/clientes.
- Lista M3U de las salidas retransmitidas y enlace de suscripción con token separado de la contraseña de administrador.
- Estado observado de relay, clientes, bytes recibidos y errores en la interfaz y API.
- Paquete Linux portable con instalador systemd, usuario sin privilegios y secretos aleatorios.
- SHA-256 y BUILD.json con versión y commit de procedencia.

## Requisitos e instalación

**Node.js >=22 ya instalado**, Linux con systemd, Bash y utilidades estándar. **El runtime no va incluido y el paquete no es un binario autónomo.** No hace falta instalar paquetes npm.

Descarga `iux-zone-0.1.0-linux.tar.gz` y `SHA256SUMS` de los archivos adjuntos a esta release. En una misma carpeta:

```sh
sha256sum -c SHA256SUMS && \
  tar -xzf iux-zone-0.1.0-linux.tar.gz && \
  cd iux-zone-0.1.0 && \
  bash scripts/install.sh --check && \
  sudo bash scripts/install.sh --lan
```

El modo `--lan` permite abrir `http://IP-DEL-SERVIDOR:3000` en una LAN confiable. Consulta las credenciales generadas con:

```sh
sudo cat /etc/iux-zone/iux-zone.env
```

**No expongas ese modo HTTP a Internet.** Para producción omite `--lan`: escucha en `127.0.0.1`, exige proxy HTTPS para las sesiones y no configura automáticamente certificados ni proxy. Define `PUBLIC_URL` en el archivo de entorno con la dirección real usada por los reproductores y reinicia el servicio.

Guía: [docs/INSTALACION.md](https://github.com/TalaveraSama/IUX-ZONE/blob/v0.1.0/docs/INSTALACION.md).

## Alcance y límites

- Salida **solo HTTP-TS**; no emisión UDP/RTP de salida.
- Sin transcodificación, captura DVB, HLS/DASH/RTMP/SRT, EPG ni descifrado.
- RTP: v2, payload type 33, sin jitter buffer, RTCP, FEC ni recuperación de pérdidas.
- UDP: IPv4, escucha local o multicast, puertos no privilegiados y exclusivos por canal activo.
- Primera versión: 32 canales simultáneos, 256 clientes totales; sin certificación de carga de producción.
- El token de reproducción da acceso a todos los canales habilitados. No hay cuentas por abonado.
- Configurar fuentes permite conexiones internas del servidor: solo administradores de confianza y red restringida.

## Validación

18 pruebas automatizadas aprobadas, con conexiones HTTP y datagramas UDP/RTP reales y paquetes MPEG-TS sintéticos. También se verificaron en navegador autenticación, CRUD, M3U, suscripción con token y estado de retransmisión con cliente conectado.

Se comprobó la estructura del paquete, sintaxis y preflight del instalador. **No se ha validado el arranque systemd en un host de destino, la decodificación audiovisual de un canal real ni recepción multicast en una red física.** Valida primero en un servidor de pruebas.

Usa únicamente contenido autorizado.
