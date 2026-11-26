#!/usr/bin/env bash
# Installs the extracted, local iux-zone package. Does not download or run remote code.
set -euo pipefail
umask 027
export PATH="$PATH:/usr/sbin:/sbin"

usage() {
  cat <<'HELP'
Uso: sudo bash scripts/install.sh [--lan] [--check]

Requiere Linux con systemd y Node.js >=22 instalado en una ruta del sistema.
Por defecto: producción en 127.0.0.1:3000 detrás de un proxy HTTPS.
--lan    Primera instalación en HTTP, 0.0.0.0:3000, con contraseña.
         Solo para una LAN confiable; no cifra credenciales ni contenido.
--check  Verifica requisitos y paquete sin modificar el sistema (no requiere root).
--help   Muestra esta ayuda.

Código: /opt/iux-zone/releases/<version> (solo lectura para el servicio)
Datos: /var/lib/iux-zone    Configuración: /etc/iux-zone/iux-zone.env
Las actualizaciones conservan datos, contraseña y modo de acceso existentes.
HELP
}
lan=0
check=0
for arg in "$@"; do
  case "$arg" in
    --lan) lan=1 ;;
    --check) check=1 ;;
    --help|-h) usage; exit 0 ;;
    *) echo "Opción desconocida: $arg" >&2; usage >&2; exit 1 ;;
  esac
done
fail() { echo "ERROR: $*" >&2; exit 1; }
[[ $(uname -s) == Linux ]] || fail 'El instalador requiere Linux.'
for cmd in node systemctl install cp mv ln readlink getent useradd chown find chmod sed mktemp sleep id rm; do
  command -v "$cmd" >/dev/null || fail "Falta el requisito: $cmd"
done
node_bin=$(readlink -f "$(command -v node)")
case "$node_bin" in
  /usr/bin/*|/usr/local/bin/*|/opt/*) ;;
  *) fail 'Instala Node.js en /usr/bin, /usr/local/bin o /opt; no se admite un runtime dentro de /home o /root.' ;;
esac
node_major=$("$node_bin" -p 'process.versions.node.split(".")[0]')
(( node_major >= 22 )) || fail 'Se requiere Node.js >=22. Instálalo antes de continuar.'
source_dir=$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")/.." && pwd -P)
for file in scripts/install-lib.sh server.js relay.js tvheadend.js third_party/DSH-LICENSE.txt README.md package.json package-lock.json public/index.html public/app.js public/tvheadend-ui.js public/tvheadend.css public/ofm-tokens.css public/styles.css public/favicon.svg deploy/iux-zone.service; do
  [[ -f "$source_dir/$file" ]] || fail "Paquete incompleto: falta $file"
done
source "$source_dir/scripts/install-lib.sh"
version=$("$node_bin" -p 'JSON.parse(require("node:fs").readFileSync(process.argv[1], "utf8")).version' "$source_dir/package.json")
[[ $version =~ ^[0-9]+\.[0-9]+\.[0-9]+$ ]] || fail 'Versión de paquete inválida.'
"$node_bin" --check "$source_dir/server.js"
"$node_bin" --check "$source_dir/relay.js"
"$node_bin" --check "$source_dir/tvheadend.js"
"$node_bin" --check "$source_dir/public/tvheadend-ui.js"
"$node_bin" --check "$source_dir/public/app.js"
if (( check )); then
  echo "Paquete iux-zone $version válido; Node.js $node_major en $node_bin."
  if [[ ! -d /run/systemd/system ]] || ! systemctl show-environment >/dev/null 2>&1; then
    echo 'AVISO: systemd no está activo o no es accesible desde este entorno. La instalación requiere un host Linux arrancado con systemd.'
  fi
  echo 'Comprobación sin cambios. No verifica puertos, permisos del destino ni arranque del servicio.'
  exit 0
fi
(( EUID == 0 )) || fail 'Ejecuta con sudo o como root.'
[[ -d /run/systemd/system ]] || fail 'systemd no está activo. Usa el paquete portable o Docker en este entorno.'
systemctl show-environment >/dev/null || fail 'No se pudo contactar con systemd.'
base=/opt/iux-zone
release="$base/releases/$version"
config=/etc/iux-zone/iux-zone.env
[[ ! -e "$release" ]] || fail "La versión $version ya está instalada. No se sobrescribirá: $release"
if [[ -f "$config" ]] && (( lan )); then
  fail '--lan solo se admite en la primera instalación. La configuración existente no se cambia.'
fi
if getent passwd iux-zone >/dev/null; then
  [[ $(id -u iux-zone) != 0 ]] || fail 'El usuario iux-zone no puede ser root.'
else
  useradd --system --user-group --home-dir /var/lib/iux-zone --shell /usr/sbin/nologin iux-zone
fi
install -d -m 0755 "$base" "$base/releases"
install -d -m 0700 /etc/iux-zone
install -d -o iux-zone -g iux-zone -m 0700 /var/lib/iux-zone
stage=$(mktemp -d "$base/releases/.staging.XXXXXX")
cleanup() { if [[ -n ${stage:-} && -d $stage ]]; then rm -rf -- "$stage"; fi; }
trap cleanup EXIT
install -m 0644 "$source_dir/server.js" "$source_dir/relay.js" "$source_dir/tvheadend.js" "$source_dir/package.json" "$source_dir/package-lock.json" "$source_dir/README.md" "$stage/"
cp -R "$source_dir/public" "$stage/public"
cp -R "$source_dir/third_party" "$stage/third_party"
if [[ -d "$source_dir/docs" ]]; then cp -R "$source_dir/docs" "$stage/docs"; fi
if [[ -f "$source_dir/BUILD.json" ]]; then install -m 0644 "$source_dir/BUILD.json" "$stage/"; fi
find "$stage" -type d -exec chmod 0755 {} +
find "$stage" -type f -exec chmod 0644 {} +
chown -R root:root "$stage"
mv -- "$stage" "$release"
stage=''
if [[ ! -f "$config" ]]; then
  password=$("$node_bin" -p 'require("node:crypto").randomBytes(24).toString("hex")')
  mode=production
  host=127.0.0.1
  if (( lan )); then mode=development; host=0.0.0.0; fi
  # The randomly generated password is hex, so no EnvironmentFile escaping is needed.
  stream_token=$("$node_bin" -p 'require("node:crypto").randomBytes(24).toString("hex")')
  printf 'NODE_ENV=%s\nHOST=%s\nPORT=3000\nDATA_DIR=/var/lib/iux-zone\nADMIN_PASSWORD=%s\nSTREAM_TOKEN=%s\nPUBLIC_URL=\nMULTICAST_INTERFACE=\n' "$mode" "$host" "$password" "$stream_token" > "$config"
fi
chmod 0600 "$config"
chown root:root "$config"
# Node's absolute path is checked above, and substituted without shell evaluation.
sed "s|@NODE@|$node_bin|g" "$source_dir/deploy/iux-zone.service" > /etc/systemd/system/iux-zone.service
chmod 0644 /etc/systemd/system/iux-zone.service
previous=$(previous_release "$base")
switch_release "$base" "$release"
systemctl daemon-reload
systemctl enable iux-zone.service
if ! systemctl restart iux-zone.service; then
  if [[ -n "$previous" && -d "$previous" ]]; then
    switch_release "$base" "$previous"
    systemctl restart iux-zone.service || true
  fi
  fail 'No se pudo arrancar. Revisa journalctl -u iux-zone.service; la versión anterior se restauró si existía.'
fi
sleep 2
if ! systemctl is-active --quiet iux-zone.service; then
  if [[ -n "$previous" && -d "$previous" ]]; then
    switch_release "$base" "$previous"
    systemctl restart iux-zone.service || true
  fi
  fail 'El servicio se detuvo. Revisa journalctl -u iux-zone.service y /etc/iux-zone/iux-zone.env.'
fi
cat <<'DONE'
iux-zone instalado y servicio activo.

Contraseña (solo root): sudo cat /etc/iux-zone/iux-zone.env
Estado: sudo systemctl status iux-zone
Logs: sudo journalctl -u iux-zone -n 50 --no-pager

Por defecto: 127.0.0.1:3000; configura un proxy HTTPS (ver docs/INSTALACION.md).
Si elegiste --lan: http://IP-DEL-SERVIDOR:3000, solo en LAN confiable.
La contraseña no se imprime automáticamente ni se regenera al actualizar.
Incluye relay HTTP-TS con entrada HTTP/HTTPS, UDP-TS y RTP/MP2T.
Configura PUBLIC_URL con la dirección accesible por tus reproductores.
No incluye captura DVB, transcodificación ni conversión HLS.
DONE
