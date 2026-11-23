#!/usr/bin/env bash
#
# instalar.sh — Instalación nativa de XUIONE (decoded 1.5.13) en Debian/Ubuntu
# Deja el panel montado en /home/xui/ con Apache + PHP 7.4 + MariaDB + crons.
# NO modifica el código fuente; solo copia decoded/ y prepara el entorno.
# Requiere ejecutarse como root.
#
# Uso:  sudo bash scripts/instalar.sh
#
set -e

REPO_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
DECODED="$REPO_DIR/decoded"
XUI_HOME="/home/xui"
PHP_VER="7.4"

echo "=========================================================="
echo " IUX-ZONE :: Instalador nativo de XUIONE (decoded 1.5.13)"
echo " Repo:    $REPO_DIR"
echo " Destino: $XUI_HOME"
echo " PHP:     $PHP_VER"
echo "=========================================================="

# 0) Comprobaciones básicas ------------------------------------------------
if [ "$(id -u)" -ne 0 ]; then
  echo "ERROR: ejecuta este script como root (sudo bash ...)." >&2
  exit 1
fi
if [ ! -d "$DECODED" ]; then
  echo "ERROR: no se encontró $DECODED (ejecuta desde la raíz del repo)." >&2
  exit 1
fi

# Confirmación (instala paquetes del sistema)
read -r -p "Se van a instalar paquetes del sistema (Apache, PHP, MariaDB). ¿Continuar? [s/N] " RESP
if [[ ! "$RESP" =~ ^[sS]$ ]]; then
  echo "Cancelado por el usuario."
  exit 0
fi

# 1) Repo de PHP 7.4 (si no está en los repos por defecto) -----------------
add_php_repo() {
  if command -v apt-get >/dev/null 2>&1; then
    if grep -qi "ubuntu" /etc/os-release 2>/dev/null; then
      echo ">> Ubuntu detectado: agregando ppa:ondrej/php ..."
      apt-get update -y
      apt-get install -y software-properties-common ca-certificates lsb-release apt-transport-https
      add-apt-repository -y ppa:ondrej/php
    elif grep -qi "debian" /etc/os-release 2>/dev/null; then
      echo ">> Debian detectado: agregando repo sury (PHP 7.4) ..."
      apt-get update -y
      apt-get install -y ca-certificates lsb-release apt-transport-https curl gnupg2
      curl -sSLo /usr/share/keyrings/deb.sury.org-php.gpg https://packages.sury.org/php/apt.gpg
      echo "deb [signed-by=/usr/share/keyrings/deb.sury.org-php.gpg] https://packages.sury.org/php/ $(lsb_release -sc) main" \
        > /etc/apt/sources.list.d/sury.list
    fi
    apt-get update -y
  fi
}

# ¿Existe php7.4 en los repos actuales?
if ! apt-cache show "php$PHP_VER" >/dev/null 2>&1; then
  add_php_repo
fi

# 2) Instalar paquetes -----------------------------------------------------
echo ">> Instalando Apache, PHP $PHP_VER, MariaDB y ffmpeg ..."
DEBIAN_FRONTEND=noninteractive apt-get install -y \
  apache2 \
  "php$PHP_VER" "php$PHP_VER-cli" "php$PHP_VER-common" "php$PHP_VER-fpm" \
  "php$PHP_VER-mysql" "php$PHP_VER-curl" "php$PHP_VER-zip" "php$PHP_VER-gd" \
  "php$PHP_VER-mbstring" "php$PHP_VER-xml" "php$PHP_VER-opcache" \
  "php$PHP_VER-igbinary" "php$PHP_VER-bcmath" "php$PHP_VER-intl" \
  "libapache2-mod-php$PHP_VER" \
  mariadb-server \
  ffmpeg \
  certbot python3-certbot-apache

# Asegurar que 'php' apunte a 7.4
if command -v update-alternatives >/dev/null 2>&1; then
  update-alternatives --set php "/usr/bin/php$PHP_VER" 2>/dev/null || true
fi
echo ">> PHP instalado:"; php -v | head -1
php -m | grep -i igbinary >/dev/null && echo ">> Extensión igbinary: OK" || echo ">> AVISO: igbinary NO está cargada"

# 3) Crear usuario xui y desplegar código ----------------------------------
echo ">> Creando usuario 'xui' y desplegando código ..."
if ! id xui >/dev/null 2>&1; then
  useradd -m -d "$XUI_HOME" -s /bin/bash xui
fi
# Copiar el contenido de decoded/ a /home/xui/ (sin tocar el repo)
cp -a "$DECODED/." "$XUI_HOME/"

# 4) Directorios de runtime + permisos -------------------------------------
echo ">> Creando directorios de runtime ..."
mkdir -p "$XUI_HOME/tmp"/{cache/streams,cache/series,cache/lines,divergence,flood,player,ministra,signals,logs,watch,opened_cons,crons,cidr}
mkdir -p "$XUI_HOME/content"/{streams,epg,vod,archive,created,delayed,video,playlists}
chown -R xui:xui "$XUI_HOME"
find "$XUI_HOME" -type d -exec chmod 755 {} \;

# 5) Ajustar php.ini -------------------------------------------------------
echo ">> Ajustando php.ini ..."
for ini in "/etc/php/$PHP_VER/apache2/php.ini" "/etc/php/$PHP_VER/cli/php.ini"; do
  [ -f "$ini" ] || continue
  sed -i 's/^upload_max_filesize.*/upload_max_filesize = 256M/' "$ini"
  sed -i 's/^post_max_size.*/post_max_size = 256M/' "$ini"
  sed -i 's/^memory_limit.*/memory_limit = 512M/' "$ini"
  sed -i 's/^max_execution_time.*/max_execution_time = 300/' "$ini"
  sed -i 's/^max_input_time.*/max_input_time = 300/' "$ini"
  grep -q "^date.timezone" "$ini" || echo 'date.timezone = "UTC"' >> "$ini"
done

# 6) VirtualHost de Apache ------------------------------------------------
echo ">> Configurando Apache (docroot $XUI_HOME/www) ..."
cat > /etc/apache2/sites-available/xui.conf <<EOF
<VirtualHost *:80>
    ServerName $(hostname -I | awk '{print $1}')
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

# 7) MariaDB ---------------------------------------------------------------
echo ">> Iniciando MariaDB ..."
systemctl enable --now mariadb

# 8) Crons del usuario xui ------------------------------------------------
echo ">> Registrando crons para el usuario xui ..."
CRON_FILE="$(mktemp)"
{
  echo "# Generado por scripts/instalar.sh (XUIONE decoded 1.5.13)"
  for f in "$XUI_HOME"/crons/*.php; do
    [ -e "$f" ] || continue
    echo "* * * * * /usr/bin/php $f >/dev/null 2>&1"
  done
} > "$CRON_FILE"
crontab -u xui "$CRON_FILE"
rm -f "$CRON_FILE"

# 9) Siguientes pasos ------------------------------------------------------
echo ""
echo "=========================================================="
echo " INSTALACIÓN DEL ENTORNO COMPLETA"
echo "=========================================================="
echo " Panel montado en : $XUI_HOME"
echo " Document root    : $XUI_HOME/www"
echo " Crons (xui)      : registrados (cada minuto)"
echo ""
echo " FALTAN 2 PASOS (ver docs/esquema-bd.md):"
echo ""
echo " 1) Crea la base de datos y aporta el ESQUEMA de XUI.one 1.5.13:"
echo "      mysql -u root -p"
echo "      CREATE DATABASE xui CHARACTER SET utf8mb4;"
echo "      CREATE USER 'xui'@'localhost' IDENTIFIED BY 'PASSWORD_FUERTE';"
echo "      GRANT ALL PRIVILEGES ON xui.* TO 'xui'@'localhost';"
echo "      (importa aquí tu SQL del esquema, o migra desde BD previa)"
echo ""
echo " 2) Abre en el navegador y crea el admin:"
echo "      http://<tu-ip-o-dominio>/admin/setup.php"
echo ""
echo " Notas:"
echo "  - Sin el esquema de BD el panel NO arranca (no viene en el repo)."
echo "  - ffmpeg/GeoIP son opcionales; sin ellos algunas funciones no operan."
echo "=========================================================="
