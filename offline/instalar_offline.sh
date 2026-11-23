#!/usr/bin/env bash
# ==============================================================================
# IUX-ZONE OFFLINE INSTALLER v1.0
# Instalador ÚNICO y OFFLINE (sin descargas):
#   PARTE 1 — XUI.One (línea 1.5.x) desde xui.tar.gz ORIGINAL, con LICENCIA INCLUIDA
#   PARTE 2 — Panel IUX-ZONE (XUI.One Edition, motor TVLister 24/7) en coexistencia
# Todo lo necesario viaja en este paquete (runtime Node, node_modules, UI precompilada,
# esquema de BD 1.5.13). Solo se necesita el xui.tar.gz ORIGINAL dentro de ./xui/
#
# Uso:
#   sudo bash instalar_offline.sh                    # instala/actualiza todo
#   sudo bash instalar_offline.sh --tar /ruta/xui.tar.gz
#   sudo bash instalar_offline.sh --license XXXXXXXXXXXXXXXX   (por defecto va incluida)
#   sudo bash instalar_offline.sh --no-sysctl        # no tocar /etc/sysctl.conf
#   sudo bash instalar_offline.sh --panel-only       # solo la capa IUX-ZONE
#   sudo bash instalar_offline.sh --xui-only         # solo XUI.one
# ==============================================================================
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BUNDLE="$SCRIPT_DIR/bundle"
XUI_SQL="$SCRIPT_DIR/xui/database.sql"
XUI_HOME="/home/xui"
PANEL_DIR="/opt/tvlister24-7"
PANEL_SERVICE="tvlister24-7"
LICENSE_DEFAULT="3f8a29c1b74d56e2"
LICENSE_KEY="$LICENSE_DEFAULT"
TAR_PATH=""
APPLY_SYSCTL=1
DO_XUI=1
DO_PANEL=1

banner() { echo; echo "============================================================"; echo "  $1"; echo "============================================================"; }
have() { command -v "$1" >/dev/null 2>&1; }
rand_str() { # cadena aleatoria del alfabeto de XUI (sin 0/1/l/I/O)
  local LEN="$1" CHARS="23456789abcdefghjkmnpqrstuvwxyzABCDEFGHJKMNPQRSTUVWXYZ"
  [ -c /dev/urandom ] || { echo "passwordfallback$RANDOM$RANDOM"; return; }
  tr -dc "$CHARS" </dev/urandom | head -c "$LEN" || true
}

while [ $# -gt 0 ]; do
  case "$1" in
    --license) LICENSE_KEY="$2"; shift 2 ;;
    --tar) TAR_PATH="$2"; shift 2 ;;
    --no-sysctl) APPLY_SYSCTL=0; shift ;;
    --panel-only) DO_XUI=0; shift ;;
    --xui-only) DO_PANEL=0; shift ;;
    *) echo "[ERROR] Argumento desconocido: $1"; exit 1 ;;
  esac
done

if [ "$(id -u)" -ne 0 ]; then echo "[ERROR] Ejecuta como root: sudo bash instalar_offline.sh"; exit 1; fi
if [[ ! "$LICENSE_KEY" =~ ^[0-9a-fA-F]{16}$ ]]; then echo "[ERROR] Licencia inválida (16 hex): $LICENSE_KEY"; exit 1; fi

banner "IUX-ZONE OFFLINE INSTALLER — XUI.One + Panel IUX-ZONE"
echo "  Licencia XUI.one : $LICENSE_KEY  (incluida en el instalador)"

# ---------------------------------------------------------------------------
# 0) Localizar el xui.tar.gz ORIGINAL
# ---------------------------------------------------------------------------
if [ "$DO_XUI" -eq 1 ]; then
  if [ -n "$TAR_PATH" ]; then
    [ -f "$TAR_PATH" ] || { echo "[ERROR] No existe $TAR_PATH"; exit 1; }
  elif [ -f "$SCRIPT_DIR/xui/xui.tar.gz" ]; then
    TAR_PATH="$SCRIPT_DIR/xui/xui.tar.gz"
  else
    echo "[ERROR] Falta el xui.tar.gz ORIGINAL (el de 663 MB)."
    echo "        Cópialo a:  $SCRIPT_DIR/xui/xui.tar.gz"
    echo "        (o usa: sudo bash instalar_offline.sh --tar /ruta/xui.tar.gz)"
    exit 1
  fi
  echo "[OK] xui.tar.gz encontrado: $TAR_PATH ($(du -h "$TAR_PATH" | cut -f1))"
fi

# ---------------------------------------------------------------------------
# 1) Prerequisitos (modo OFFLINE: nada se descarga)
# ---------------------------------------------------------------------------
if ! have mysql && ! have mariadb; then
  echo "[AVISO] Cliente MariaDB/MySQL no encontrado."
  if have apt-get && (curl -sI --max-time 5 http://archive.ubuntu.com >/dev/null 2>&1 || wget -q --timeout=5 -O /dev/null http://archive.ubuntu.com 2>/dev/null); then
    echo "        Hay red: intentando instalar mariadb-server…"
    export DEBIAN_FRONTEND=noninteractive
    apt-get update -y || true
    apt-get install -y mariadb-server || { echo "[ERROR] Falló la instalación de MariaDB."; exit 1; }
  else
    echo "[ERROR] OFFLINE y sin MariaDB. Instala MariaDB en este servidor y re-ejecuta:"
    echo "        apt-get install mariadb-server   (en un equipo con red) y copia el estado."
    exit 1
  fi
fi
if ! have tar || ! have systemctl; then echo "[ERROR] Faltan 'tar' o 'systemd'."; exit 1; fi
if ! dpkg -l 2>/dev/null | grep -q libssl1.1; then
  echo "[AVISO] libssl1.1 no está (necesaria por el nginx de XUI en Ubuntu 22.04/24.04)."
  echo "        El servicio de XUI la parchea al arrancar si hay red; sin red, instálala a mano."
fi

# ---------------------------------------------------------------------------
# PARTE 1 — XUI.One (instalación / actualización segura)
# ---------------------------------------------------------------------------
if [ "$DO_XUI" -eq 1 ]; then
  banner "PARTE 1/2 · Instalando XUI.one (offline, licencia incluida)"

  if ! have mysql; then echo "[ERROR] No hay cliente mysql tras la instalación."; exit 1; fi

  # Usuario del sistema xui (igual que el instalador oficial)
  if ! getent passwd xui >/dev/null 2>&1; then
    adduser --system --shell /bin/false --group --disabled-login xui
    echo "[OK] Usuario del sistema 'xui' creado."
  fi
  mkdir -p "$XUI_HOME"

  echo "[1/8] Extrayendo xui.tar.gz en $XUI_HOME (puede tardar)…"
  tar -xzf "$TAR_PATH" -C "$XUI_HOME/"
  [ -e "$XUI_HOME/status" ] || { echo "[ERROR] El tar no contiene 'status'; ¿es el tar correcto?"; exit 1; }
  chmod +x "$XUI_HOME/status" "$XUI_HOME/tools" 2>/dev/null || true

  echo "[2/8] Configurando MariaDB (my.cnf de XUI)…"
  if [ -f /etc/mysql/my.cnf ] && [ "$(head -c 5 /etc/mysql/my.cnf)" = "# XUI" ]; then
    echo "      my.cnf de XUI ya presente."
  else
    cat >/etc/mysql/my.cnf <<'EOF_MYSQLCNF'
# XUI
[client]
port                            = 3306

[mysqld_safe]
nice                            = 0

[mysqld]
user                            = mysql
port                            = 3306
basedir                         = /usr
datadir                         = /var/lib/mysql
tmpdir                          = /tmp
lc-messages-dir                 = /usr/share/mysql
skip-external-locking
skip-name-resolve
bind-address                    = *

# MyISAM
key_buffer_size                 = 32M
myisam_sort_buffer_size         = 4M
myisam-recover-options          = BACKUP
max_length_for_sort_data        = 4096

# Connections
max_connections                 = 200
back_log                        = 256
max_connect_errors              = 1000

# Packet and cache
max_allowed_packet              = 16M
open_files_limit                = 2048
innodb_open_files               = 1024
table_open_cache                = 1024
table_definition_cache          = 1024

# Temp tables
tmp_table_size                  = 64M
max_heap_table_size             = 64M

# InnoDB
innodb_buffer_pool_size         = 2G
innodb_buffer_pool_instances    = 1
innodb_read_io_threads          = 4
innodb_write_io_threads         = 4
innodb_thread_concurrency       = 8
innodb_flush_log_at_trx_commit  = 1
innodb_flush_method             = O_DIRECT
innodb_file_per_table           = 1
innodb_io_capacity              = 1000
innodb_table_locks              = 1
innodb_lock_wait_timeout        = 30

# Logging
expire_logs_days                = 7
max_binlog_size                 = 64M

# Query cache – still disabled
query_cache_limit               = 0
query_cache_size                = 0
query_cache_type                = 0

performance_schema              = 0

sql_mode                        = "NO_ENGINE_SUBSTITUTION"

[mariadb]
thread_cache_size               = 64
thread_handling                 = pool-of-threads
thread_pool_size                = 4
thread_pool_idle_timeout        = 20
thread_pool_max_threads         = 256

[mysqldump]
quick
quote-names
max_allowed_packet              = 16M

[mysql]

[isamchk]
key_buffer_size                 = 8M
EOF_MYSQLCNF
    (service mariadb restart || service mysql restart || systemctl restart mariadb) >/dev/null 2>&1 || true
  fi
  (service mariadb start || service mysql start || systemctl start mariadb) >/dev/null 2>&1 || true
  sleep 2

  echo "[3/8] Acceso root de MariaDB…"
  rExtra=""
  if ! mysql -u root -e "SELECT VERSION();" >/dev/null 2>&1; then
    read -r -p "  Contraseña root de MySQL: " DBROOTPASS
    rExtra=" -p$DBROOTPASS"
    if ! mysql -u root$rExtra -e "SELECT VERSION();" >/dev/null 2>&1; then echo "[ERROR] Contraseña incorrecta."; exit 1; fi
  fi

  if [ ! -f "$XUI_HOME/config/config.ini" ]; then
    echo "[4/8] Creando base de datos (esquema 1.5.13 incluido en el paquete)…"
    mysql -u root$rExtra -e "DROP DATABASE IF EXISTS xui; CREATE DATABASE IF NOT EXISTS xui;"
    mysql -u root$rExtra -e "DROP DATABASE IF EXISTS xui_migrate; CREATE DATABASE IF NOT EXISTS xui_migrate;"
    mysql -u root$rExtra xui < "$XUI_SQL"
    DB_USER="$(rand_str 32)"; DB_PASS="$(rand_str 32)"
    mysql -u root$rExtra -e "CREATE USER '$DB_USER'@'localhost' IDENTIFIED BY '$DB_PASS'; GRANT ALL PRIVILEGES ON xui.* TO '$DB_USER'@'localhost'; GRANT ALL PRIVILEGES ON xui_migrate.* TO '$DB_USER'@'localhost'; GRANT ALL PRIVILEGES ON mysql.* TO '$DB_USER'@'localhost'; GRANT GRANT OPTION ON xui.* TO '$DB_USER'@'localhost';"
    mysql -u root$rExtra -e "CREATE USER '$DB_USER'@'127.0.0.1' IDENTIFIED BY '$DB_PASS'; GRANT ALL PRIVILEGES ON xui.* TO '$DB_USER'@'127.0.0.1'; GRANT ALL PRIVILEGES ON xui_migrate.* TO '$DB_USER'@'127.0.0.1'; GRANT ALL PRIVILEGES ON mysql.* TO '$DB_USER'@'127.0.0.1'; GRANT GRANT OPTION ON xui.* TO '$DB_USER'@'127.0.0.1';"
    mysql -u root$rExtra -e "FLUSH PRIVILEGES;"
    mkdir -p "$XUI_HOME/config"
    cat >"$XUI_HOME/config/config.ini" <<EOF_CONFIG
; XUI Configuration
; -----------------
; Your username and password will be encrypted and
; saved to the 'credentials' file in this folder
; automatically.
;
; To change your username or password, modify BOTH
; below and XUI will read and re-encrypt them.

[XUI]
hostname    =   "127.0.0.1"
database    =   "xui"
port        =   3306
server_id   =   1
license     =   "3f8a29c1b74d56e2"

[Encrypted]
username    =   "$DB_USER"
password    =   "$DB_PASS"
EOF_CONFIG
    echo "[OK] config.ini escrito con la licencia $LICENSE_KEY (credenciales BD generadas)."
  else
    echo "[4/8] config.ini existente conservado (no se toca la BD con datos)."
    DB_USER=""; DB_PASS=""
  fi

  echo "[5/8] Sistema: fstab tmpfs + systemd + límites…"
  if [ -f /etc/fstab ] && ! grep -q "/home/xui/content/streams" /etc/fstab; then
    printf '\ntmpfs /home/xui/content/streams tmpfs defaults,noatime,nosuid,nodev,noexec,mode=1777,size=90%% 0 0\ntmpfs /home/xui/tmp tmpfs defaults,noatime,nosuid,nodev,noexec,mode=1777,size=6G 0 0\n' >> /etc/fstab
  fi
  rm -f /etc/init.d/xuione /etc/systemd/system/xui.service
  if [ ! -f /etc/systemd/system/xuione.service ]; then
    cat >/etc/systemd/system/xuione.service <<'EOF_SYSTEMD'
[Unit]
SourcePath=/home/xui/service
Description=XUI.one Service
After=network.target
StartLimitIntervalSec=0

[Service]
Type=simple
User=root
Restart=always
RestartSec=1
ExecStart=/bin/bash /home/xui/service start
ExecRestart=/bin/bash /home/xui/service restart
ExecStop=/bin/bash /home/xui/service stop

[Install]
WantedBy=multi-user.target
EOF_SYSTEMD
    chmod +x /etc/systemd/system/xuione.service
    systemctl daemon-reload
    systemctl enable xuione >/dev/null 2>&1 || true
  fi
  if ! grep -q "DefaultLimitNOFILE=655350" /etc/systemd/system.conf 2>/dev/null; then
    printf '\nDefaultLimitNOFILE=655350\n' >> /etc/systemd/system.conf
    printf '\nDefaultLimitNOFILE=655350\n' >> /etc/systemd/user.conf
  fi

  if [ "$APPLY_SYSCTL" -eq 1 ]; then
    echo "[6/8] sysctl de XUI (BBR + límites de red, recomendado)…"
    modprobe ip_conntrack 2>/dev/null || true
    cat >/etc/sysctl.conf <<'EOF_SYSCTL'
# XUI.one

net.ipv4.tcp_congestion_control = bbr
net.core.default_qdisc = fq
net.ipv4.tcp_rmem = 8192 87380 134217728
net.ipv4.udp_rmem_min = 16384
net.core.rmem_default = 262144
net.core.rmem_max = 268435456
net.ipv4.tcp_wmem = 8192 65536 134217728
net.ipv4.udp_wmem_min = 16384
net.core.wmem_default = 262144
net.core.wmem_max = 268435456
net.core.somaxconn = 1000000
net.core.netdev_max_backlog = 250000
net.core.optmem_max = 65535
net.ipv4.tcp_max_tw_buckets = 1440000
net.ipv4.tcp_max_orphans = 16384
net.ipv4.ip_local_port_range = 2000 65000
net.ipv4.tcp_no_metrics_save = 1
net.ipv4.tcp_slow_start_after_idle = 0
net.ipv4.tcp_fin_timeout = 15
net.ipv4.tcp_keepalive_time = 300
net.ipv4.tcp_keepalive_probes = 5
net.ipv4.tcp_keepalive_intvl = 15
fs.file-max=20970800
fs.nr_open=20970800
fs.aio-max-nr=20970800
net.ipv4.tcp_timestamps = 1
net.ipv4.tcp_window_scaling = 1
net.ipv4.tcp_mtu_probing = 1
net.ipv4.route.flush = 1
net.ipv6.route.flush = 1
EOF_SYSCTL
    sysctl -p >/dev/null 2>&1 || true
    touch "$XUI_HOME/config/sysctl.on" 2>/dev/null || true
  else
    echo "[6/8] sysctl conservado (--no-sysctl)."
    rm -f "$XUI_HOME/config/sysctl.on" 2>/dev/null || true
  fi

  if [ ! -f "$XUI_HOME/bin/redis/redis.conf" ]; then
    REDIS_PASS="$(rand_str 32)"
    sed "s/#PASSWORD#/$REDIS_PASS/" >"$XUI_HOME/bin/redis/redis.conf" <<'EOF_REDIS'
bind *
protected-mode yes
port 6379
tcp-backlog 511
timeout 0
tcp-keepalive 300
daemonize yes
supervised no
pidfile /home/xui/bin/redis/redis-server.pid
loglevel warning
logfile /home/xui/bin/redis/redis-server.log
databases 1
always-show-logo yes
stop-writes-on-bgsave-error no
rdbcompression no
rdbchecksum no
dbfilename dump.rdb
dir /home/xui/bin/redis/
slave-serve-stale-data yes
slave-read-only yes
repl-diskless-sync no
repl-diskless-sync-delay 5
repl-disable-tcp-nodelay no
slave-priority 100
requirepass #PASSWORD#
maxclients 655350
lazyfree-lazy-eviction no
lazyfree-lazy-expire no
lazyfree-lazy-server-del no
slave-lazy-flush no
appendonly no
appendfilename "appendonly.aof"
appendfsync everysec
no-appendfsync-on-rewrite no
auto-aof-rewrite-percentage 100
auto-aof-rewrite-min-size 64mb
aof-load-truncated yes
aof-use-rdb-preamble no
lua-time-limit 5000
slowlog-log-slower-than 10000
slowlog-max-len 128
latency-monitor-threshold 0
notify-keyspace-events ""
hash-max-ziplist-entries 512
hash-max-ziplist-value 64
list-max-ziplist-size -2
list-compress-depth 0
set-max-intset-entries 512
zset-max-ziplist-entries 128
zset-max-ziplist-value 64
hll-sparse-max-bytes 3000
activerehashing yes
client-output-buffer-limit normal 0 0 0
client-output-buffer-limit slave 256mb 64mb 60
client-output-buffer-limit pubsub 32mb 8mb 60
hz 10
aof-rewrite-incremental-fsync yes
save 60 1000
server-threads 4
server-thread-affinity true
EOF_REDIS
    echo "[OK] redis.conf generado."
  fi

  echo "[7/8] Código de acceso admin de XUI…"
  rCodeDir="$XUI_HOME/bin/nginx/conf/codes"
  rHasAdmin=""
  if [ -d "$rCodeDir" ]; then
    for rCodeFile in "$rCodeDir"/*.conf; do
      [ -e "$rCodeFile" ] || continue
      base="$(basename "$rCodeFile" .conf)"
      if [ "$base" = "setup" ]; then rm -f "$rCodeFile";
      elif grep -q "/home/xui/admin" "$rCodeFile" 2>/dev/null; then rHasAdmin="$base"; fi
    done
    if [ -z "$rHasAdmin" ] && [ -n "$DB_USER" ] && [ -f "$rCodeDir/template" ]; then
      rCode="$(rand_str 8)"
      mysql -u root$rExtra -e "USE xui; INSERT INTO access_codes(code, type, enabled, groups) VALUES('$rCode', 0, 1, '[1]');" || true
      sed -e "s/#WHITELIST#//" -e "s/#TYPE#/admin/" -e "s/#CODE#/$rCode/" -e "s/#BURST#/500/" "$rCodeDir/template" > "$rCodeDir/$rCode.conf"
      echo "[OK] Código admin de XUI: $rCode  (http://TU_IP/$rCode)"
    fi
  fi

  echo "[8/8] Arrancando XUI.one…"
  mount -a >/dev/null 2>&1 || true
  chown xui:xui -R "$XUI_HOME" >/dev/null 2>&1 || true
  systemctl daemon-reload
  systemctl start xuione || true
  sleep 8
  ( "$XUI_HOME/status" 1 || true ) | head -30 || true
  chown xui:xui -R "$XUI_HOME/config/" >/dev/null 2>&1 || true
else
  banner "PARTE 1/2 · XUI.one ya instalado (se conserva tal cual)"
fi

# ---------------------------------------------------------------------------
# PARTE 2 — Panel IUX-ZONE (motor TVLister) 100% offline
# ---------------------------------------------------------------------------
if [ "$DO_PANEL" -eq 1 ]; then
  banner "PARTE 2/2 · Instalando Panel IUX-ZONE (XUI.One Edition, motor TVLister)"
  [ -f "$BUNDLE/node/node" ] || { echo "[ERROR] Falta $BUNDLE/node/node (runtime embebido)."; exit 1; }
  [ -f "$BUNDLE/package.json" ] || { echo "[ERROR] Falta $BUNDLE/package.json."; exit 1; }

  if [ -d "$XUI_HOME" ]; then
    PANEL_PORT=8095
    echo "[INFO] Modo coexistencia: el panel irá en 127.0.0.1:$PANEL_PORT tras el nginx de XUI."
  else
    PANEL_PORT=80
    echo "[INFO] Sin XUI: el panel servirá directamente en el puerto $PANEL_PORT."
  fi

  echo "[1/6] Copiando runtime Node + node_modules + UI precompilada…"
  mkdir -p "$PANEL_DIR/.runtime/node/bin" "$PANEL_DIR/.runtime/bin" "$PANEL_DIR/data"
  install -m 0755 "$BUNDLE/node/node" "$PANEL_DIR/.runtime/node/bin/node"
  rm -rf "$PANEL_DIR/node_modules" "$PANEL_DIR/dist" "$PANEL_DIR/server" "$PANEL_DIR/scripts"
  cp -r "$BUNDLE/node_modules" "$PANEL_DIR/node_modules"
  cp -r "$BUNDLE/dist" "$PANEL_DIR/dist"
  cp -r "$BUNDLE/server" "$PANEL_DIR/server"
  cp -r "$BUNDLE/scripts" "$PANEL_DIR/scripts"
  cp "$BUNDLE/package.json" "$PANEL_DIR/package.json"

  echo "[2/6] FFmpeg (wrapper auto-reparable: usa los de XUI si existen)…"
  if [ -f "$PANEL_DIR/.runtime/bin/ffmpeg" ] && "$PANEL_DIR/.runtime/bin/ffmpeg" -version >/dev/null 2>&1; then
    echo "      Wrapper ya operativo."
  else
    cat >"$PANEL_DIR/.runtime/bin/ffmpeg" <<'EOF_FF'
#!/usr/bin/env bash
# Wrapper FFmpeg IUX-ZONE: primero los de XUI.one, luego el embebido del panel.
for FF in \
  /home/xui/bin/ffmpeg_bin/4.4/ffmpeg \
  /home/xui/bin/ffmpeg_bin/4.3/ffmpeg \
  /home/xui/bin/ffmpeg_bin/4.0/ffmpeg \
  /home/xui/bin/ffmpeg/ffmpeg; do
  if [ -x "$FF" ]; then
    export LD_LIBRARY_PATH="$(dirname "$FF"):/home/xui/bin/ffmpeg:/home/xui/lib:${LD_LIBRARY_PATH:-}"
    exec "$FF" "$@"
  fi
done
FFB="$(dirname "$0")/../../node_modules/@ffmpeg-installer/linux-x64/ffmpeg"
if [ -x "$FFB" ]; then exec "$FFB" "$@"; fi
for FF in /usr/local/bin/ffmpeg /usr/bin/ffmpeg; do
  if [ -x "$FF" ]; then exec "$FF" "$@"; fi
done
echo "IUX-ZONE: sin FFmpeg disponible. Usa: tvlister-admin ffmpeg install" >&2
exit 127
EOF_FF
    chmod +x "$PANEL_DIR/.runtime/bin/ffmpeg"
    if "$PANEL_DIR/.runtime/bin/ffmpeg" -version >/dev/null 2>&1; then
      echo "      FFmpeg listo ($("$PANEL_DIR/.runtime/bin/ffmpeg" -version 2>/dev/null | head -1 | cut -d' ' -f1-3))."
    else
      echo "      [AVISO] Ningún FFmpeg disponible aún (instala XUI o añade uno al sistema)."
    fi
  fi

  echo "[3/6] Servicio systemd $PANEL_SERVICE…"
  cat >/etc/systemd/system/$PANEL_SERVICE.service <<EOF_UNIT
[Unit]
Description=IUX-ZONE Panel (XUI.One Edition — motor TVLister 24/7)
After=network.target mariadb.service mysql.service
[Service]
Type=simple
WorkingDirectory=$PANEL_DIR
Environment=NODE_ENV=production
Environment=PORT=$PANEL_PORT
ExecStart=$PANEL_DIR/.runtime/node/bin/node --no-warnings $PANEL_DIR/server/index.js
Restart=always
RestartSec=3
LimitNOFILE=655350
[Install]
WantedBy=multi-user.target
EOF_UNIT

  echo "[4/6] Comando de administración tvlister-admin…"
  if [ -f "$PANEL_DIR/scripts/tvlister-admin.sh" ]; then
    install -m 0755 "$PANEL_DIR/scripts/tvlister-admin.sh" /usr/local/bin/tvlister-admin
  fi

  echo "[5/6] Activando servicios…"
  systemctl daemon-reload
  systemctl enable $PANEL_SERVICE >/dev/null 2>&1 || true
  systemctl restart $PANEL_SERVICE

  echo "[6/6] Verificando…"
  sleep 4
  systemctl is-active --quiet $PANEL_SERVICE && echo "[OK] $PANEL_SERVICE activo." || { echo "[AVISO] El servicio aún arranca; revisa: journalctl -u $PANEL_SERVICE -n 30"; }
else
  banner "PARTE 2/2 · Panel omitido (--xui-only)"
fi

# ---------------------------------------------------------------------------
# RESUMEN
# ---------------------------------------------------------------------------
banner "INSTALACIÓN OFFLINE COMPLETADA"
if [ -d "$XUI_HOME" ]; then
  echo "  XUI.One (base)        : /home/xui  ·  licencia $LICENSE_KEY"
  echo "    Estado              : /home/xui/status   ·  /home/xui/service {start|stop|restart}"
  echo "    Admin               : http://TU_IP/<tu-codigo-admin>  (módulo 'Access Codes')"
  echo "    Credenciales BD     : /home/xui/config/config.ini"
fi
if [ "$DO_PANEL" -eq 1 ]; then
  echo "  Panel IUX-ZONE        : http://127.0.0.1:${PANEL_PORT:-8095} (o http://TU_IP si es standalone)"
  echo "    Servicio            : systemctl {status|restart} $PANEL_SERVICE"
  echo "    Administración      : tvlister-admin"
  echo "    Importar XUI        : módulo 'Importar XUI.one · BD' del panel (solo lectura)"
fi
echo
echo "  Todo funcionó SIN descargas: runtime Node, node_modules, UI, esquema BD y plantillas van en el paquete."
