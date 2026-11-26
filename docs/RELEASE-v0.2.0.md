# iux-zone v0.2.0 — Tvheadend workspace

Notas preparadas para el nuevo paquete. La publicación es una operación separada; este archivo no indica que exista una release pública.

## Novedades

- Base visual mediante tokens MIT de DSH Our Free Model, con licencia y procedencia conservadas. Sin código de proveedores IA.
- Integración con un Tvheadend externo mediante API HTTP, Basic o Digest.
- Conexión comprobable y credenciales guardadas en el servidor con permisos 0600.
- Árbol de adaptadores/frontends y editor guiado por las propiedades del motor.
- Redes y multiplexes: creación, edición, eliminación confirmada y exploración de redes.
- Mapeo de servicios e importación idempotente de canales hacia la biblioteca local.
- EPG de lectura y actividad del motor: entradas, señal/SNR originales, suscripciones y conexiones.
- Relay autenticado desde Tvheadend, compartido por canal, con URLs de reproducción que no revelan la contraseña upstream.
- Se mantienen los orígenes HTTP-TS, UDP-TS y RTP/MP2T anteriores y la corrección del enlace current.

## Requisitos y límites

Node.js >=22. Tvheadend y los drivers TBS se preparan por separado. No se distribuyen ni renombran binarios del motor GPL.

No es todavía un reemplazo de todas las pantallas nativas de Tvheadend. Las relaciones avanzadas se editan como JSON/UUID; LNB/DiSEqC/USALS, CAM/CI, ACL de Tvheadend y DVR no tienen asistentes dedicados. Sin transcodificación, conversión HLS, salida UDP ni XMLTV propio.

Las releases 0.1.x no incluyen esta integración. No instales su archivo esperando encontrar las nuevas pantallas.

## Validación

30 pruebas automatizadas de transporte, API, autenticación, permisos, persistencia y arranque, más comprobaciones en navegador de conexión, hardware, edición, creación, mapeo, importación, EPG y móvil.

La API Tvheadend se verificó mediante un fixture explícito con sockets reales y MPEG-TS sintético, no con un servidor Tvheadend real ni una tarjeta TBS física. Valida la sintonización y compatibilidad con tu versión y hardware antes de producción.

Guía del nuevo panel: docs/TVHEADEND.md. Licencias y procedencia: third_party/README.md.
