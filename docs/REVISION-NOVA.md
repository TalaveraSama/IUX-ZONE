# Revisión del repositorio de referencia

Referencia: https://github.com/novaheadend/nova-core-releases

Revisión realizada: 26 de noviembre de 2026.
Commit consultado de `main`: `1020e74e213eee8a9174da934618032aa8c99eb7`.

## Qué publica

El árbol público contiene README, EULA, Dockerfile, un workflow de publicación y capturas de pantalla. Las releases distribuyen ejecutables. **No hay fuentes del motor ni de la interfaz para revisar o adaptar.** La última release observada fue `v0.1.16`.

Se revisaron el README, LICENSE, Dockerfile y el listado del árbol y releases a través de la API de GitHub. No se descargaron, ejecutaron ni descompilaron los binarios; tampoco se realizó una auditoría de sus componentes internos.

## Licencia

El archivo LICENSE identifica Nova Core como software propietario distribuido exclusivamente en forma binaria. Autoriza instalación y ejecución para uso propio, sujeto a sus condiciones. Sus restricciones incluyen modificaciones, obras derivadas, redistribución sin permiso y eliminación o alteración de avisos propietarios.

Por ello, **este proyecto no es un fork ni un cambio de marca de Nova Core**. Un rebranding de ese producto requeriría autorización del titular y acceso a las fuentes correspondientes. No se incorporaron código, imágenes, logotipos ni ejecutables del repositorio de referencia.

## Alcance de iux-zone 0.1.0

Implementación independiente de una consola de administración, inspirada únicamente en funciones descritas públicamente:

- Panel con conteos de canales y protocolos configurados (no métricas de señal o tráfico).
- CRUD de canales con nombre, URL, grupo, tvg-id, logo como metadato y habilitación.
- Persistencia JSON y exportación M3U con URLs de retransmisión.
- Relay propio bajo demanda: HTTP/HTTPS MPEG-TS, recepción UDP-TS y RTP/MP2T → HTTP-TS; tokens de reproducción separados.
- Contraseña de administrador opcional en desarrollo y obligatoria en producción.

## Diferencias que no deben confundirse

| Función | iux-zone 0.1.0 |
|---|---|
| Gestión de canales y lista M3U | Implementado |
| Captura DVB-S/S2/T/T2/C | No implementado |
| Relay HTTP-TS, recepción UDP-TS / RTP MP2T | Implementado con límites documentados |
| Envío UDP/RTP | No implementado |
| Comprobación de disponibilidad de fuentes | Solo durante demanda real del relay |
| EPG / XMLTV | Solo campo tvg-id; sin guía ni importador |
| BISS / descifrado | No implementado |
| Clientes y bytes recibidos por sesión | Implementado |
| Bitrate, señal y calidad DVB | No implementado |
| Binario estático sin runtime | No: requiere Node.js 22+ |

El relay abre los orígenes bajo demanda y libera recursos al irse el último cliente. No transcodifica ni reproduce HLS. Configurar o habilitar un canal no prueba que esté disponible ni que el usuario tenga autorización para distribuirlo. Las pruebas de transporte usan MPEG-TS sintético, no certifican reproducción audiovisual ni carga de producción.

## Siguientes etapas propuestas

1. Definir hardware, sistema operativo, protocolos y volumen de canales del despliegue real.
2. Evaluar motores adicionales con licencia compatible para transcodificación y captura DVB.
3. Medir rendimiento del relay en hardware real y ampliar métricas, resiliencia y controles por cliente.
4. Agregar EPG XMLTV con límites de tamaño y análisis seguro.
5. Agregar almacenamiento transaccional multiusuario, auditoría y gestión de permisos.

No son funciones prometidas ni implementadas por esta primera entrega.
