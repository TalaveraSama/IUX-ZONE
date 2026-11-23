#!/usr/bin/env bash
#
# empacar.sh — Genera xuione-instalable.tar.gz (el "instalable" autónomo)
# Incluye el panel (decoded/opc), el instalador y la documentación.
# Uso:  bash scripts/empacar.sh
#
set -euo pipefail

REPO_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
OUT="$REPO_DIR/xuione-instalable.tar.gz"
TMP="$(mktemp -d)"
PKG="$TMP/xuione-instalable"

echo "Empaquetando en: $OUT"
mkdir -p "$PKG"
cp -a "$REPO_DIR/decoded" "$PKG/decoded"
cp -a "$REPO_DIR/opc"     "$PKG/opc"
cp -a "$REPO_DIR/docs"    "$PKG/docs"
cp -a "$REPO_DIR/scripts" "$PKG/scripts"
cp "$REPO_DIR/LICENSE" "$PKG/LICENSE"
cp "$REPO_DIR/LICENSE.apache-upstream" "$PKG/LICENSE.apache-upstream"
cp "$REPO_DIR/PROVENANCE.md" "$PKG/PROVENANCE.md"
cp "$REPO_DIR/README.md" "$PKG/README.md"

# Instalador de entrada que redirige al script interno
cat > "$PKG/instalar.sh" <<'EOF'
#!/usr/bin/env bash
# Instalable XUIONE: redirige al instalador interno.
exec "$(dirname "$0")/scripts/instalar.sh" "$@"
EOF
chmod +x "$PKG/instalar.sh" "$PKG/scripts/instalar.sh"

tar -czf "$OUT" -C "$TMP" xuione-instalable
rm -rf "$TMP"

echo "✓ Creado: $OUT"
echo ""
echo "Para usar en la máquina destino:"
echo "  tar xzf xuione-instalable.tar.gz"
echo "  cd xuione-instalable"
echo "  sudo bash instalar.sh"
