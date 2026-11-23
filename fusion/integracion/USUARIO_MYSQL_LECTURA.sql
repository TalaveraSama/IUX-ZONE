-- =====================================================================
-- Usuario MySQL/MariaDB de SOLO LECTURA para que TVLister 24/7 importe
-- el catálogo desde la base de datos de XUI.One.
--
-- 1. Edita la contraseña de abajo (CAMBIAME_ESTA_CLAVE).
-- 2. Ejecuta como root de MariaDB en el servidor donde vive XUI:
--      mysql -u root -p < USUARIO_MYSQL_LECTURA.sql
-- 3. En TVLister → Xui Import, usa tvlister_ro / esa contraseña
--    (host 127.0.0.1, BD "xui").
--
-- TVLister solo necesita SELECT: nunca escribe en la BD de XUI.
-- =====================================================================

CREATE USER IF NOT EXISTS 'tvlister_ro'@'localhost' IDENTIFIED BY 'CAMBIAME_ESTA_CLAVE';
CREATE USER IF NOT EXISTS 'tvlister_ro'@'127.0.0.1' IDENTIFIED BY 'CAMBIAME_ESTA_CLAVE';

GRANT SELECT ON xui.* TO 'tvlister_ro'@'localhost';
GRANT SELECT ON xui.* TO 'tvlister_ro'@'127.0.0.1';

FLUSH PRIVILEGES;

-- Verificación rápida:
--   mysql -u tvlister_ro -p -h 127.0.0.1 xui -e "SELECT COUNT(*) FROM lines;"
