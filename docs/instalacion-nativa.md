# Instalación nativa (sin Docker)

Guía paso a paso para dejar el panel corriendo en un servidor Linux
(Debian/Ubuntu). El script `scripts/instalar.sh` automatiza todo esto; esta
página sirve para entenderlo y para instalaciones manuales.

> ⚠️ Recuerda: tras instalar, **falta el esquema de BD** → `docs/esquema-bd.md`.

## 1. Preparar el sistema

```bash
sudo -i
apt update && apt -y upgrade
# (opcional) utilidades
apt -y install curl wget git unzip
```

## 2. Crear el usuario `xui`

El código asume `XUI_HOME = /home/xui`.

```bash
useradd -m -d /home/xui -s /bin/bash xui
```

## 3. Desplegar el código

```bash
git clone <tu-IUX-ZONE> /opt/iux-zone
cp -a /opt/iux-zone/decoded/. /home/xui/
```

## 4. Directorios de runtime y permisos

```bash
mkdir -p /home/xui/tmp/{cache/streams,cache/series,cache/lines,divergence,flood,player,ministra,signals,logs,watch,opened_cons,crons,cidr}
mkdir -p /home/xui/content/{streams,epg,vod,archive,created,delayed,video,playlists}
chown -R xui:xui /home/xui
find /home/xui -type d -exec chmod 755 {} \;
```

## 5. Instalar PHP 7.4 + extensiones

En Ubuntu 22.04/24.04 o Debian 12, PHP 7.4 no está en los repos por defecto;
añade el repo de terceros (ondrej/sury):

```bash
# Ubuntu
apt -y install software-properties-common
add-apt-repository -y ppa:ondrej/php
# Debian
# wget -qO- https://packages.sury.org/php/README.txt | bash   (sigue las instrucciones oficiales)

apt update
apt -y install php7.4 php7.4-cli php7.4-common php7.4-fpm \
  php7.4-mysql php7.4-curl php7.4-zip php7.4-gd php7.4-mbstring \
  php7.4-xml php7.4-opcache php7.4-igbinary php7.4-bcmath php7.4-intl
```

Verifica: `php -v` debe decir 7.4.x y `php -m | grep -i igbinary` debe aparecer.

## 6. Ajustar `php.ini`

Edita `/etc/php/7.4/apache2/php.ini` (y el de `cli` si usas fpm):

```ini
upload_max_filesize = 256M
post_max_size = 256M
memory_limit = 512M
max_execution_time = 300
max_input_time = 300
date.timezone = "UTC"
```

## 7. Servidor web (Apache)

```bash
apt -y install apache2
a2enmod rewrite php7.4
```

Crea `/etc/apache2/sites-available/xui.conf`:

```apache
<VirtualHost *:80>
    ServerName tu.dominio.o.ip
    DocumentRoot /home/xui/www
    <Directory /home/xui/www>
        Options -Indexes +FollowSymLinks
        AllowOverride All
        Require all granted
    </Directory>
    <FilesMatch \.php$>
        SetHandler application/x-httpd-php
    </FilesMatch>
    ErrorLog ${APACHE_LOG_DIR}/xui_error.log
    CustomLog ${APACHE_LOG_DIR}/xui_access.log combined
</VirtualHost>
```

```bash
a2dissite 000-default
a2ensite xui
systemctl restart apache2
```

(Si prefieres php-fpm, instala `php7.4-fpm` y usa `SetHandler proxy:unix:/run/php/php7.4-fpm.sock|fcgi://localhost`.)

## 8. Base de datos (MariaDB)

```bash
apt -y install mariadb-server
systemctl enable --now mariadb
mysql -u root -p
```

```sql
CREATE DATABASE xui CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'xui'@'localhost' IDENTIFIED BY 'CAMBIA_ESTO_POR_PASSWORD_FUERTE';
GRANT ALL PRIVILEGES ON xui.* TO 'xui'@'localhost';
FLUSH PRIVILEGES;
EXIT;
```

> 🔴 **Falta el esquema.** Importa el SQL de XUI.one 1.5.13 (o migra desde una BD
> previa) según `docs/esquema-bd.md` **antes** de abrir el panel.

## 9. Crons

Como `xui`, registra las tareas (ver `scripts/crontab.xui`):

```bash
crontab -u xui -e
# pega las líneas de scripts/crontab.xui
```

## 10. Terminar en el navegador

Abre `http://<tu-ip-o-dominio>/admin/setup.php` y crea el usuario
administrador. Si migras desde otra BD, usa la sección *Database Migration*.

## 11. (Opcional) ffmpeg y GeoIP

```bash
apt -y install ffmpeg
# Coloca ffmpeg/ffprobe en /home/xui/bin/ffmpeg_bin/<ver>/
# Coloca las bases MaxMind en /home/xui/bin/maxmind/
```

## Verificación

- `http://<host>/admin/` → login de admin.
- `http://<host>/player_api.php` → debe responder JSON (con BD configurada).
- `tail -f /home/xui/tmp/logs/error_log.log` para diagnóstico.
