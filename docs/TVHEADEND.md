# Workspace Tvheadend — desarrollo 0.2.0

Esta integración pertenece a la rama de desarrollo. **Las releases 0.1.0 y 0.1.1 no la contienen.** No se ha publicado una release 0.2.0 como parte de este cambio.

## Bases utilizadas

- `Ebony-Vinyl/dsh-our-free-model`, commit `748d97a9dde64eb024be832bbaf66d27f6cfb4fd`: se reutiliza exclusivamente `packages/standalone/frontend/system/tokens.css`, bajo MIT, como `public/ofm-tokens.css`. No se incorpora el plugin IA, su código de proveedores ni sus bundles.
- `tvheadend/tvheadend`, commit consultado `b1c4d2812bd363515e03282c416b39162cea6239`: se revisaron los controladores públicos de la API para implementar el cliente. Tvheadend se mantiene como proceso externo; no se incluye su código ni su binario en el paquete iux-zone. Licencia del motor: GPLv3; no se presenta como código propietario de iux-zone.

Avisos y procedencia en `third_party/README.md`; licencia original de los tokens incluida en `third_party/DSH-LICENSE.txt`.

## Arquitectura

```text
TBS + driver Linux → /dev/dvb → Tvheadend externo
                                  ↓ API HTTP / Digest o Basic
                           servidor iux-zone
                                  ↓ relay HTTP MPEG-TS
                          reproductores con token
```

El navegador solo llama al mismo servidor iux-zone. No conecta directamente al puerto 9981, no necesita CORS y no recibe la contraseña del motor. No se abre un proxy genérico a cualquier endpoint: hay recursos y operaciones permitidos expresamente.

**No se instala Tvheadend ni el driver TBS automáticamente.** Debes preparar un motor accesible, con permisos sobre `/dev/dvb` y un usuario dedicado. El modelo de TBS, señal, firmware y driver determinan qué puede detectar y sintonizar.

## Ponerlo en marcha desde esta rama

1. Requiere Node.js 22+, igual que el servidor anterior. Ejecuta `npm start` o usa `node --env-file=.env server.js` con ADMIN_PASSWORD y STREAM_TOKEN únicos. No publiques el modo de desarrollo sin autenticación.
2. Instala y configura Tvheadend siguiendo su documentación oficial, según tu distribución y tarjeta. No uses un usuario anónimo administrador en una red pública.
3. En iux-zone, abre **Conexión al motor**. Introduce origen HTTP/HTTPS, usuario y contraseña de Tvheadend. Ejemplo desde el mismo host: `http://127.0.0.1:9981`. Si está en otro servidor, usa su IP accesible **desde iux-zone**, no desde el navegador.
4. El usuario de Tvheadend necesita permisos de administración para hardware/redes, acceso a streaming y al perfil **pass**. La prueba comprueba serverinfo **y hardware/tree**: serverinfo puede ser anónimo y por sí solo no valida las credenciales.
5. Pulsa **Comprobar conexión**, y después **Guardar conexión**. La prueba no guarda cambios implícitamente.
6. Revisa **Adaptadores / TBS** y explora cada nodo hasta sus frontends. El editor usa las propiedades que publica el motor, no una lista inventada de modelos.
7. En **Redes y frecuencias**, crea una red compatible. Asigna sus UUID a la propiedad de redes del frontend, y configura el hardware según la señal. Las listas del editor avanzado se introducen como JSON de valores/UUID.
8. Crea o configura multiplexes usando las unidades de la API de tu motor. Pulsa **Explorar red** y revisa resultados y servicios.
9. En **Servicios y canales**, selecciona servicios y usa **Mapear seleccionados**. Esta operación se realiza en Tvheadend y comprueba disponibilidad, por lo que puede ocupar sintonizadores. El mapeo puede tardar; actualiza Canales del motor al terminar.
10. En la pestaña **Canales del motor**, selecciona hasta 100 canales y usa **Importar seleccionados**. Se agregan a la biblioteca local con un origen `tvh://channel/<uuid>`; reimportar actualiza el nombre/metadatos sin duplicar ese origen ni volver a habilitar un canal deshabilitado localmente.
11. Exporta el M3U local o utiliza su suscripción. El servidor abre `/stream/channel/<uuid>?profile=pass` con las credenciales guardadas; el reproductor solo ve `/stream/<id-local>.ts?token=...`.

## Paneles y operaciones implementadas

| Panel | Funciones |
|---|---|
| Cabecera DVB | Conexión verificada, resumen de recuentos disponibles y ruta de trabajo |
| Adaptadores / TBS | Árbol, navegación por niveles y edición de propiedades publicadas |
| Redes | Listar, crear según builders del motor, editar, eliminar con confirmación, solicitar scan |
| Multiplexes | Listar, crear en una red con su esquema, editar y eliminar con confirmación |
| Servicios | Listar, seleccionar y solicitar mapeo a canales |
| Canales del motor | Listar, editar e importar a la biblioteca iux-zone |
| EPG | Lectura paginada de eventos recogidos por el motor |
| Actividad | Entradas, señal/SNR en escala original, suscripciones y conexiones; refresco cada 10 s mientras el panel está visible |
| Conexión | Probar, guardar, conservar contraseña en el mismo host o desconectar |

Los listados usan páginas de 50. La búsqueda de tabla filtra **la página actual**, no todo el servidor. No todos los endpoints del motor implementan paginación; los árboles se recorren por UUID. No hay telemetría de muestra en la aplicación.

## Credenciales y red

- Se almacenan en `DATA_DIR/tvheadend.json`, con modo 0600. No están cifradas en reposo: protege el disco, el usuario del servicio y sus copias.
- GET settings devuelve `hasPassword`, nunca el valor de la contraseña. Dejarla en blanco al guardar conserva el secreto **solo para el mismo origen**. Al cambiar de servidor se elimina el secreto anterior salvo que introduzcas uno nuevo. Para borrar todas las credenciales usa Desconectar.
- Guardar o desconectar el motor cierra sus retransmisiones activas. Los canales locales permanecen configurados.
- Autenticación por desafío Basic o Digest MD5 / SHA-256, incluidas variantes sess, con qop auth. No Digest auth-int, Kerberos ni OAuth. TLS se verifica; no se aceptan certificados autofirmados sin instalar una CA de confianza en el runtime.
- Basic sobre HTTP no cifra la contraseña; Digest tampoco cifra el video. Usa HTTPS o una LAN confiable.
- No se siguen redirecciones, para no enviar credenciales a otro servidor. Se admite solo un origen sin subruta/webroot en esta primera integración; usa un proxy con origen dedicado si tu motor está publicado bajo una subruta.
- Credenciales embebidas, fragmentos y consultas no se aceptan en la URL del motor.
- Las APIs de configuración requieren la sesión de administrador de iux-zone; STREAM_TOKEN no da acceso a ellas.
- El administrador puede conectar con direcciones internas: es una capacidad deliberada de cabecera LAN, no una API segura para usuarios no confiables. Restringe red y administración.
- Importaciones internas sin credenciales: exportar orígenes con `direct=1` entrega URIs tvh://, que no son URLs reproducibles directamente por terceros. Usa el M3U normal para los canales del motor.
- Verifica PUBLIC_URL para que los enlaces exportados sean accesibles por los reproductores. Evita logs de URLs con tokens.

## Límites de esta entrega

Esto es un workspace operativo para el flujo hardware → red/mux → servicios → canales → relay, **no una reproducción completa de cada pantalla de Tvheadend**.

- No hay instalación de drivers, firmware, aprovisionamiento de Tvheadend ni detección directa desde Node.js.
- El editor es guiado por metadatos. Las opciones dinámicas y relaciones complejas se introducen con valores/UUID; todavía no hay un asistente dedicado de LNB/DiSEqC, USALS, CAM/CI ni gestión avanzada de satélites. Esos ajustes pueden requerir la interfaz nativa de Tvheadend.
- No se implementan DVR/grabaciones, usuarios/ACL de Tvheadend, CA/BISS, perfiles de transcodificación ni edición de reglas de captura EPG.
- No se publica XMLTV desde iux-zone en esta entrega. Se leen eventos EPG, no se construye un servicio de guía para reproductores.
- La salida sigue siendo MPEG-TS HTTP, sin transcodificación. El perfil pass de Tvheadend debe entregar paquetes TS de 188 bytes y el reproductor debe soportar los códecs originales.
- Un solo Tvheadend por instancia. La importación busca canales entre los primeros 10 000; no se promete importación ilimitada.
- La compatibilidad de versiones de Tvheadend depende de sus endpoints/esquemas. Se verificaron las firmas del código fuente indicado; no se certifica cualquier fork o versión antigua.

## Pruebas

`npm test` cubre credenciales y persistencia, API Basic y Digest SHA-256, importación idempotente, rutas/acciones permitidas, aislamiento del token de reproducción, flujo MPEG-TS autenticado compartido y timeout sin datos, además de las pruebas existentes.

La integración se probó con un **servidor fixture que reproduce la API**, sockets reales y paquetes TS sintéticos. Se recorrió el panel en navegador (conectar, hardware, red, mux, scan, mapeo, importación, EPG y móvil). **No se ha probado una TBS física ni una instalación real de Tvheadend en esta sesión.**

Antes de usarla en producción, prueba con tu versión de Tvheadend, tarjeta, señal y red reales. No se incluyen cuentas o servidores de terceros ni contenidos no autorizados.
