#!/usr/bin/env bash
# Shared, filesystem-only installer operations. Safe to source in regression tests.

previous_release() {
  local base=$1 current releases
  [[ -L "$base/current" ]] || return 0
  current=$(readlink -e -- "$base/current") || return 0
  releases=$(readlink -e -- "$base/releases") || return 0
  # A missing link can resolve to its own name with readlink -f. Never use that
  # as a rollback target, and never roll back outside the release directory.
  if [[ "$current" == "$releases/"* && -d "$current" && -f "$current/server.js" ]]; then
    printf '%s\n' "$current"
  fi
}

switch_release() (
  set -euo pipefail
  base=$1
  release=$2
  [[ -d "$release" && -f "$release/server.js" ]] || { echo 'Destino de versión inválido.' >&2; exit 1; }
  temporary=$(mktemp -d "$base/.activate.XXXXXX")
  trap 'rm -rf -- "$temporary"' EXIT
  ln -s -- "$release" "$temporary/current"
  # -T replaces the link itself, even when the old link is dangling or cyclic.
  mv -Tf -- "$temporary/current" "$base/current"
)
