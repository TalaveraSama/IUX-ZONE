#!/usr/bin/env bash
# ==============================================================================
# FUSIÓN XUI.One + TVLister 24/7 | Instalador unificado
# XUI.One es el panel base (predominante); TVLister se instala en modo
# coexistencia (puerto interno 8095, sin tocar apt/MariaDB/nginx de XUI).
#
# Uso:  sudo bash instalar_fusion.sh        (desde la carpeta del paquete)
# Idempotente: se puede re-ejecutar para instalar o actualizar TVLister.
# ==============================================================================
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
TVLISTER_SRC="$SCRIPT_DIR/tvlister24-7"
XUI_HOME="/home/xui"

banner() { echo; echo "============================================================"; echo "  $1"; echo "============================================================"; }

if [ "$(id -u)" -ne 0 ]; then
  echo "[ERROR] Ejecuta como root: sudo bash instalar_fusion.sh"
  exit 1
fi

if [ ! -f "$TVLISTER_SRC/package.json" ]; then
  echo "[ERROR] No se encontró $TVLISTER_SRC (paquete incompleto)."
  exit 1
fi

banner "FUSIÓN XUI.One (base) + TVLister 24/7 (capa moderna)"

# ---------------------------------------------------------------------------
# 1) Estado del panel base XUI.One
# ---------------------------------------------------------------------------
XUI_PRESENT=0
if [ -d "$XUI_HOME" ] || [ -f "/etc/systemd/system/xuione.service" ]; then
  XUI_PRESENT=1
  echo "[OK] XUI.One detectado en $XUI_HOME → se instalará TVLister en modo coexistencia."
else
  echo "[AVISO] XUI.One NO está instalado en este servidor."
  echo "        Para respetar que XUI sea el panel base, instálalo primero:"
  echo "          cd \"$SCRIPT_DIR/xui-one\""
  echo "          sudo cp /ruta/a/tu/xui.tar.gz ./xui.tar.gz   # tar ORIGINAL de tu licencia"
  echo "          sudo ./install                               # pedirá la licencia (16 hex)"
  echo "        Tras instalar XUI, vuelve a ejecutar este script."
  echo
  read -r -p "¿Continuar ahora instalando SOLO TVLister (standalone, puertos 80/443)? [y/N]: " RESP
  case "$RESP" in [yY]|[sS]*) ;; *) echo "Cancelado."; exit 0 ;; esac
fi

# ---------------------------------------------------------------------------
# 2) Usuario MySQL de solo lectura para el importador (si hay XUI y mysql CLI)
# ---------------------------------------------------------------------------
if [ "$XUI_PRESENT" -eq 1 ] && command -v mysql >/dev/null 2>&1; then
  if ! mysql -u root -e "SELECT 1;" >/dev/null 2>&1; then
    echo "[INFO] MariaDB requiere contraseña de root; crea el usuario de lectura a mano:"
    echo "       mysql -u root -p < \"$SCRIPT_DIR/integracion/USUARIO_MYSQL_LECTURA.sql\""
  else
    if ! mysql -u root -e "SELECT 1 FROM mysql.user WHERE user='tvlister_ro' LIMIT 1;" 2>/dev/null | grep -q 1; then
      read -r -p "¿Crear usuario MySQL de solo lectura 'tvlister_ro' para TVLister? [Y/n]: " RESP2
      case "$RESP2" in [nN]*) ;; *)
        SQL="$SCRIPT_DIR/integracion/USUARIO_MYSQL_LECTURA.sql"
        TMPSQL="$(mktemp)"
        read -r -p "Contraseña para tvlister_ro (Enter = generar una aleatoria): " PASS
        if [ -z "$PASS" ]; then PASS="$(head -c 24 /dev/urandom | base64 | tr -dc 'A-Za-z0-9' | head -c 20)"; fi
        sed "s/CAMBIAME_ESTA_CLAVE/$PASS/g" "$SQL" > "$TMPSQL"
        mysql -u root < "$TMPSQL" && rm -f "$TMPSQL"
        echo "[OK] Usuario tvlister_ro creado. Contraseña: $PASS  (guárdala)"
      esac
    else
      echo "[OK] El usuario MySQL tvlister_ro ya existe."
    fi
  fi
fi

# ---------------------------------------------------------------------------
# 3) Instalar/actualizar TVLister desde la fuente incluida (modo seguro si hay XUI)
# ---------------------------------------------------------------------------
banner "Instalando / actualizando TVLister 24/7 desde el paquete"
export TVLISTER_SOURCE_DIR="$TVLISTER_SRC"
bash "$TVLISTER_SRC/scripts/install_ubuntu.sh"

# ---------------------------------------------------------------------------
# 4) Resumen e integración
# ---------------------------------------------------------------------------
PORT_FILE="/opt/tvlister24-7/data/port"
TVPORT="8095"
if [ -f "$PORT_FILE" ]; then TVPORT="$(cat "$PORT_FILE" 2>/dev/null || echo 8095)"; fi

banner "FUSIÓN COMPLETADA"
echo "  XUI.One (base)     : /home/xui  →  /home/xui/service {start|stop|restart}"
if [ "$XUI_PRESENT" -eq 1 ]; then
  echo "  TVLister (capa)    : http://127.0.0.1:${TVPORT}  (tras el nginx de XUI)"
  echo "  Servicio           : systemctl {status|restart} tvlister24-7"
  echo
  echo "  SIGUIENTES PASOS:"
  echo "   1. Entra al panel TVLister → página 'Xui Import' → importa líneas/streams/VOD"
  echo "      desde la BD 'xui' (usuario tvlister_ro o credenciales de XUI)."
  echo "   2. Opcional: publica TVLister por el nginx de XUI (vhost que genera el panel)."
  echo "   3. Canal 24/7, VOD Jellyfin, WebTV y CATV/UDP se configuran dentro del panel."
else
  echo "  TVLister (standalone): http://TU_IP (puertos 80/443 — sin XUI instalado)"
  echo "  Cuando instales XUI.One, re-ejecuta este script para pasar a modo coexistencia."
fi
echo
echo "  Guías: LEEME_FUSION.md · COMPARATIVA_PANELES.md · integracion/"
