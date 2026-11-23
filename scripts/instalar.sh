#!/usr/bin/env bash
#
# instalar.sh — Instalable nativo e interactivo de XUIONE (decoded 1.5.13)
# Despliega el panel en /home/xui/ con Apache + PHP 7.4 + MariaDB + crons.
# Funciona tanto desde el repo como desde el paquete xuione-instalable.tar.gz.
# NO modifica el código fuente; solo lo copia y prepara el entorno.
# Uso:  sudo bash instalar.sh
#
set -euo pipefail

REPO_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
DECODED="$REPO_DIR/decoded"
XUI_HOME="/home/xui"
PHP_VER="7.4"

C_Y="\033[1;33m"; C_G="\033[1;32m"; C_R="\033[1;31m"; C_0="\033[0m"
info(){ echo -e "${C_Y}>>${C_0} $*"; }
ok(){ echo -e "${C_G}✓${C_0} $*"; }
err(){ echo -e "${C_R}ERROR:${C_0} $*" >&2; }

# 0) Comprobaciones ---------------------------------------------------------
[ "$(id -u)" -eq 0 ] || { err "ejecuta como root: sudo bash instalar.sh"; exit 1; }
[ -d "$DECODED" ] || { err "no se encuentra $DECODED (ejecuta desde la raíz del paquete/repo)"; exit 1; }

# Primer IP no-loopback para valores por defecto
DEF_IP="$(ip -4 addr show 2>/dev/null | awk '/inet / && $2 !~ /^127\./ {print $2; exit}' | cut -d/ -f1)"
[ -z "$DEF_IP" ] && DEF_IP="$(hostname -I 2>/dev/null | awk '{print $1}')"
[ -z "$DEF_IP" ] && DEF_IP="localhost"

echo "=========================================================="
echo " IUX-ZONE :: Instalable XUIONE (decoded 1.5.13)"
echo " Origen : $REPO_DIR"
echo " Destino: $XUI_HOME   |   PHP $PHP_VER"
echo "=========================================================="

# 1) Configuración interactiva ---------------------------------------------
read -r -p "Dominio o IP del panel [$DEF_IP]: " DOMAIN; DOMAIN="${DOMAIN:-$DEF_IP}"
read -r -p "Nombre de la base de datos [xui]: " DB_NAME; DB_NAME="${DB_NAME:-xui}"
read -r -p "Usuario de la base de datos [xui]: " DB_USER; DB_USER="${DB_USER:-xui}"
while [ -z "${DB_PASS:-}" ]; do
  read -r -s -p "Contraseña del usuario de BD ($DB_USER): " DB_PASS; echo
  [ -z "$DB_PASS" ] && echo "  (la contraseña no puede estar vacía)"
done
read -r -p "Ruta/URL del esquema SQL de XUI.one 1.5.13 (opcional, dejar vacío para migrar luego): " SCHEMA
read -r -p "¿Instalar también ffmpeg/GeoIP y certbot? [s/N]: " EXTRA; EXTRA="${EXTRA:-N}"

echo ""
info "Resumen: dominio=$DOMAIN  bd=$DB_NAME@localhost  usuario=$DB_USER"
read -r -p "¿Continuar e instalar paquetes del sistema? [s/N] " GO
[[ "$GO" =~ ^[sS]$ ]] || { info "Cancelado."; exit 0; }

# 2) Repo de PHP 7.4 si hace falta -----------------------------------------
add_php_repo(){
  if grep -qi "ubuntu" /etc/os-release 2>/dev/null; then
    info "Ubuntu: agregando ppa:ondrej/php"
    apt-get update -y
    apt-get install -y software-properties-common ca-certificates lsb-release apt-transport-https
    add-apt-repository -y ppa:ondrej/php
  elif grep -qi "debian" /etc/os-release 2>/dev/null; then
    info "Debian: agregando repo sury (PHP 7.4)"
    apt-get update -y
    apt-get install -y ca-certificates lsb-release apt-transport-https curl gnupg2
    curl -fsSLo /usr/share/keyrings/deb.sury.org-php.gpg https://packages.sury.org/php/apt.gpg
    echo "deb [signed-by=/usr/share/keyrings/deb.sury.org-php.gpg] https://packages.sury.org/php/ $(lsb_release -sc) main" \
      > /etc/apt/sources.list.d/sury.list
  fi
  apt-get update -y
}
if ! apt-cache show "php$PHP_VER" >/dev/null 2>&1; then add_php_repo; fi

# 3) Instalar paquetes ------------------------------------------------------
info "Instalando Apache, PHP $PHP_VER, MariaDB..."
PKGS="apache2 php$PHP_VER php$PHP_VER-cli php$PHP_VER-common php$PHP_VER-fpm
  php$PHP_VER-mysql php$PHP_VER-curl php$PHP_VER-zip php$PHP_VER-gd php$PHP_VER-mbstring
  php$PHP_VER-xml php$PHP_VER-opcache php$PHP_VER-igbinary php$PHP_VER-bcmath php$PHP_VER-intl
  libapache2-mod-php$PHP_VER mariadb-server"
if [[ "$EXTRA" =~ ^[sS]$ ]]; then PKGS="$PKGS ffmpeg certbot python3-certbot-apache"; fi
DEBIAN_FRONTEND=noninteractive apt-get install -y $PKGS

if command -v update-alternatives >/dev/null 2>&1; then
  update-alternatives --set php "/usr/bin/php$PHP_VER" 2>/dev/null || true
fi
php -m | grep -qi igbinary && ok "extensión igbinary cargada" || err "igbinary NO cargada (el panel lo requiere)"

# 4) Usuario xui + desplegar código ----------------------------------------
info "Creando usuario 'xui' y desplegando código"
id xui >/dev/null 2>&1 || useradd -m -d "$XUI_HOME" -s /bin/bash xui
cp -a "$DECODED/." "$XUI_HOME/"

# 5) Directorios runtime + permisos ----------------------------------------
info "Creando directorios de runtime"
mkdir -p "$XUI_HOME/tmp"/{cache/streams,cache/series,cache/lines,divergence,flood,player,ministra,signals,logs,watch,opened_cons,crons,cidr}
mkdir -p "$XUI_HOME/content"/{streams,epg,vod,archive,created,delayed,video,playlists}
chown -R xui:xui "$XUI_HOME"
find "$XUI_HOME" -type d -exec chmod 755 {} \;

# 6) php.ini ----------------------------------------------------------------
info "Ajustando php.ini"
for ini in "/etc/php/$PHP_VER/apache2/php.ini" "/etc/php/$PHP_VER/cli/php.ini"; do
  [ -f "$ini" ] || continue
  sed -i 's/^upload_max_filesize.*/upload_max_filesize = 256M/' "$ini"
  sed -i 's/^post_max_size.*/post_max_size = 256M/' "$ini"
  sed -i 's/^memory_limit.*/memory_limit = 512M/' "$ini"
  sed -i 's/^max_execution_time.*/max_execution_time = 300/' "$ini"
  sed -i 's/^max_input_time.*/max_input_time = 300/' "$ini"
  grep -q "^date.timezone" "$ini" || echo 'date.timezone = "UTC"' >> "$ini"
done

# 7) VirtualHost Apache -----------------------------------------------------
info "Configurando Apache (docroot $XUI_HOME/www)"
cat > /etc/apache2/sites-available/xui.conf <<EOF
<VirtualHost *:80>
    ServerName $DOMAIN
    DocumentRoot $XUI_HOME/www
    <Directory $XUI_HOME/www>
        Options -Indexes +FollowSymLinks
        AllowOverride All
        Require all granted
    </Directory>
    <FilesMatch \.php\$>
        SetHandler application/x-httpd-php
    </FilesMatch>
    ErrorLog \${APACHE_LOG_DIR}/xui_error.log
    CustomLog \${APACHE_LOG_DIR}/xui_access.log combined
</VirtualHost>
EOF
a2enmod rewrite "php$PHP_VER" proxy_fcgi setenvif 2>/dev/null || true
a2dissite 000-default.conf 2>/dev/null || true
a2ensite xui.conf
systemctl enable --now apache2

# 8) MariaDB + base de datos -----------------------------------------------
info "Iniciando MariaDB"
systemctl enable --now mariadb
info "Creando base de datos '$DB_NAME' y usuario '$DB_USER'"
mysql -u root <<SQL
CREATE DATABASE IF NOT EXISTS \`$DB_NAME\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER IF NOT EXISTS '$DB_USER'@'localhost' IDENTIFIED BY '$DB_PASS';
GRANT ALL PRIVILEGES ON \`$DB_NAME\`.* TO '$DB_USER'@'localhost';
FLUSH PRIVILEGES;
SQL

# 9) Esquema (opcional) -----------------------------------------------------
if [ -n "$SCHEMA" ]; then
  info "Importando esquema desde: $SCHEMA"
  TMP_SCHEMA="$(mktemp --suffix=.sql)"
  if [[ "$SCHEMA" == http* ]]; then
    curl -fsSL "$SCHEMA" -o "$TMP_SCHEMA" || { err "no se pudo descargar $SCHEMA"; rm -f "$TMP_SCHEMA"; }
  elif [ -f "$SCHEMA" ]; then
    cp "$SCHEMA" "$TMP_SCHEMA"
  else
    err "ruta de esquema no válida: $SCHEMA"; rm -f "$TMP_SCHEMA"
  fi
  if [ -s "$TMP_SCHEMA" ]; then
    mysql -u "$DB_USER" -p"$DB_PASS" "$DB_NAME" < "$TMP_SCHEMA" && ok "esquema importado" || err "falló la importación del esquema"
    rm -f "$TMP_SCHEMA"
  fi
else
  echo -e "${C_Y}NOTA:${C_0} no se proporcionó esquema. El panel NO arrancará hasta importarlo"
  echo "      o migrar desde una BD previa en /admin/setup.php (ver docs/esquema-bd.md)."
fi

# 10) Crons ----------------------------------------------------------------
info "Registrando crons para el usuario xui"
CRON_FILE="$(mktemp)"
{ echo "# Generado por instalar.sh (XUIONE decoded 1.5.13)"; for f in "$XUI_HOME"/crons/*.php; do [ -e "$f" ] || continue; echo "* * * * * /usr/bin/php $f >/dev/null 2>&1"; done; } > "$CRON_FILE"
crontab -u xui "$CRON_FILE"; rm -f "$CRON_FILE"

# 11) Fin ------------------------------------------------------------------
echo ""
echo "=========================================================="
echo -e " ${C_G}INSTALACIÓN DEL ENTORNO COMPLETA${C_0}"
echo "=========================================================="
echo " Panel montado en : $XUI_HOME"
echo " Document root    : $XUI_HOME/www"
echo " Servidor web     : Apache en http://$DOMAIN/"
echo " Base de datos    : $DB_NAME@localhost (usuario $DB_USER)"
echo ""
echo " SIGUIENTE PASO:"
echo "   Abre en el navegador y crea el admin (o migra BD):"
echo "     http://$DOMAIN/admin/setup.php"
echo ""
echo "   Si no importaste esquema: debes aportarlo (docs/esquema-bd.md)."
echo "=========================================================="
