# El esquema de la base de datos (importante)

## El problema

En este repositorio **no existe el esquema de la base de datos**. Confirmado:

- No hay ningún `CREATE TABLE` en ninguno de los ~585 archivos PHP.
- No hay `install.sql`, `schema.sql` ni dumps embebidos en base64.
- El asistente `admin/setup.php` **no crea las tablas**: solo (a) migra desde una
  instalación previa (Xtream UI, ZapX original/NXT, StreamCreed, Xtream Codes v2)
  o (b) crea el usuario administrador (`INSERT INTO users ...`).

Por tanto, **el panel no funciona hasta que las tablas existan en MySQL**.

## Por qué falta

Es el comportamiento típico de los leaks "decoded" de XUI.one: se publica el
código PHP fuente, pero la parte del instalador que crea/importa el esquema
(solía estar en un componente cifrado o en un SQL aparte) no se incluye. El
`setup.php` que ves es el asistente de *migración*, no el creador del esquema.

## Cómo proveer el esquema

Tienes tres opciones (el fork no resuelve esto; toca al operador):

### Opción A — Migrar desde una BD previa (la vía que el panel espera)
1. Restaura tu base de Xtream UI / XUI anterior en un esquema llamado **`xui_migrate`**
   al que el usuario de MySQL del panel tenga acceso.
2. Entra a `http://<host>/admin/setup.php` y usa la sección *Database Migration*.
   El asistente recorre las tablas y las adapta al formato XUI.one.

### Opción B — Aportar tu propio SQL del esquema
Si dispones del dump oficial de XUI.one 1.5.13 (p.ej. de una instalación legítima
tuya), impórtalo antes de correr `setup.php`:
```bash
mysql -u root -p
CREATE DATABASE xui CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'xui'@'localhost' IDENTIFIED BY 'TU_PASSWORD_FUERTE';
GRANT ALL PRIVILEGES ON xui.* TO 'xui'@'localhost';
FLUSH PRIVILEGES;
EXIT;
mysql -u xui -p xui < /ruta/a/xui_1.5.13_schema.sql
```
Luego completa el admin en `/admin/setup.php`.

### Opción C — Generar el esquema manualmente (avanzado)
No recomendado: tendrías que reconstruir todas las tablas a partir de los
`SELECT`/`INSERT`/`UPDATE` que el código hace contra `users`, `users_groups`,
`servers`, `streams`, `streams_servers`, `access_codes`, `login_logs`,
`bouquets`, `series`, `vod`, `epg`, etc. El panel usa decenas de tablas; hacerlo
a mano es frágil.

## Tablas que el código referencia (para que sepas el alcance)

`users`, `users_groups`, `servers`, `streams`, `streams_servers`, `access_codes`,
`login_logs`, `bouquets`, `series`, `series_episodes`, `vod`, `vod_episodes`,
`epg`, `epg_files`, `playlists`, `lines`, `reg_user`, `reg_watch`, `mag_devices`,
`enigma2_devices`, `channel_epg`, `credits`, `blocked_ips`, `blocked_ua`,
`blocked_asn`, `allowed_ips`, `allowed_ua`, `allowed_country`, `settings`,
`config` (con las credenciales cifradas de BD), y varias más de caché/logs.

## Conclusión

El código de este fork es **completo y fiel**, pero para que sea *funcional* de
verdad necesitas aportar el esquema (Opción A o B). Todo lo demás —entorno,
servidor web, PHP, crons, permisos— lo deja listo `scripts/instalar.sh`.
