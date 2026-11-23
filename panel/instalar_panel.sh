#!/usr/bin/env bash
# ==============================================================================
# IUX-ZONE PANEL v3.0 (XUI.One Edition) | Instalador unificado
# Panel único: estilo XUI.one + motor TVLister 24/7.
#  - Servidor limpio        → sirve en 80/443
#  - Servidor con XUI.one   → modo seguro: 127.0.0.1:8095 tras su nginx,
#                             reutiliza sus ffmpeg, no toca MariaDB ni paquetes
# Uso:  sudo bash instalar_panel.sh      (desde la carpeta del paquete)
# Idempotente: se puede re-ejecutar para instalar o actualizar.
# ==============================================================================
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PANEL_SRC="$SCRIPT_DIR/panel"
XUI_HOME="/home/xui"

banner() { echo; echo "============================================================"; echo "  $1"; echo "============================================================"; }

if [ "$(id -u)" -ne 0 ]; then
  echo "[ERROR] Ejecuta como root: sudo bash instalar_panel.sh"
  exit 1
fi

if [ ! -f "$PANEL_SRC/package.json" ]; then
  echo "[ERROR] No se encontró $PANEL_SRC (paquete incompleto)."
  exit 1
fi

banner "IUX-ZONE Panel v3.0 — XUI.One Edition (motor TVLister)"

# ---------------------------------------------------------------------------
# 1) Estado del servidor
# ---------------------------------------------------------------------------
if [ -d "$XUI_HOME" ] || [ -f "/etc/systemd/system/xuione.service" ]; then
  echo "[OK] XUI.one detectado en $XUI_HOME → MODO COEXISTENCIA:"
  echo "     • El panel quedará en 127.0.0.1:8095 (tras el nginx de XUI)."
  echo "     • No se tocarán apt, MariaDB, nginx ni los puertos de XUI."
  echo "     • Se reutilizarán los ffmpeg de XUI (wrapper auto-reparable)."
else
  echo "[INFO] XUI.one no está instalado → el panel servirá en los puertos 80/443."
fi

# ---------------------------------------------------------------------------
# 2) (Opcional) Usuario MySQL de solo lectura para importar la BD de XUI
# ---------------------------------------------------------------------------
if [ -d "$XUI_HOME" ] && command -v mysql >/dev/null 2>&1; then
  if mysql -u root -e "SELECT 1;" >/dev/null 2>&1; then
    if ! mysql -u root -e "SELECT 1 FROM mysql.user WHERE user='tvlister_ro' LIMIT 1;" 2>/dev/null | grep -q 1; then
      read -r -p "¿Crear usuario MySQL de solo lectura 'tvlister_ro' para importar XUI? [Y/n]: " RESP
      case "$RESP" in [nN]*) ;; *)
        read -r -p "Contraseña para tvlister_ro (Enter = generar aleatoria): " PASS
        if [ -z "$PASS" ]; then PASS="$(head -c 24 /dev/urandom | base64 | tr -dc 'A-Za-z0-9' | head -c 20)"; fi
        TMPSQL="$(mktemp)"
        printf "CREATE USER IF NOT EXISTS 'tvlister_ro'@'localhost' IDENTIFIED BY '%s';\nCREATE USER IF NOT EXISTS 'tvlister_ro'@'127.0.0.1' IDENTIFIED BY '%s';\nGRANT SELECT ON xui.* TO 'tvlister_ro'@'localhost';\nGRANT SELECT ON xui.* TO 'tvlister_ro'@'127.0.0.1';\nFLUSH PRIVILEGES;\n" "$PASS" "$PASS" > "$TMPSQL"
        mysql -u root < "$TMPSQL" && rm -f "$TMPSQL"
        echo "[OK] Usuario tvlister_ro creado. Contraseña: $PASS (guárdala)"
      esac
    else
      echo "[OK] El usuario MySQL tvlister_ro ya existe."
    fi
  else
    echo "[INFO] MariaDB pide contraseña de root; crea el usuario a mano si quieres importar XUI."
  fi
fi

# ---------------------------------------------------------------------------
# 3) Instalar / actualizar el panel desde la fuente incluida
# ---------------------------------------------------------------------------
banner "Instalando / actualizando IUX-ZONE Panel"
export TVLISTER_SOURCE_DIR="$PANEL_SRC"
bash "$PANEL_SRC/scripts/install_ubuntu.sh"

# ---------------------------------------------------------------------------
# 4) Resumen
# ---------------------------------------------------------------------------
PORT_FILE="/opt/tvlister24-7/data/port"
TVPORT="8095"
if [ -f "$PORT_FILE" ]; then TVPORT="$(cat "$PORT_FILE" 2>/dev/null || echo 8095)"; fi

banner "INSTALACIÓN COMPLETADA"
if [ -d "$XUI_HOME" ]; then
  echo "  Panel IUX-ZONE : http://127.0.0.1:${TVPORT}  (tras el nginx de XUI)"
  echo "  Servicio       : systemctl {status|restart} tvlister24-7"
  echo
  echo "  SIGUIENTES PASOS:"
  echo "   1. Entra al panel → módulo 'Importar XUI.one · BD' → importa líneas/streams/VOD."
  echo "   2. Opcional: publica el panel por el nginx de XUI (vhost en /tvlister o subdominio)."
else
  echo "  Panel IUX-ZONE : http://TU_IP  (puertos 80/443)"
  echo "  Servicio       : systemctl {status|restart} tvlister24-7"
fi
echo
echo "  Administración : tvlister-admin · Logs: journalctl -u tvlister24-7 -f"
