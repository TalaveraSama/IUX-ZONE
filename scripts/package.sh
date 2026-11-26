#!/usr/bin/env bash
set -euo pipefail
cd -- "$(dirname -- "${BASH_SOURCE[0]}")/.."
version=$(node -p 'JSON.parse(require("node:fs").readFileSync("package.json", "utf8")).version')
[[ $version =~ ^[0-9]+\.[0-9]+\.[0-9]+$ ]] || { echo 'Invalid package version' >&2; exit 1; }
npm test
npm run check
bash -n scripts/install.sh
mkdir -p dist
stage=$(mktemp -d)
trap 'rm -rf -- "$stage"' EXIT
name="iux-zone-$version"
mkdir "$stage/$name"
cp -R server.js relay.js package.json package-lock.json README.md Dockerfile .dockerignore .env.example public docs scripts deploy test "$stage/$name/"
commit=$(git rev-parse HEAD)
node --input-type=module - "$version" "$commit" "$stage/$name/BUILD.json" <<'NODE'
import { writeFileSync } from 'node:fs';
const [version, commit, file] = process.argv.slice(2);
writeFileSync(file, JSON.stringify({ name: 'iux-zone', version, commit, builtAt: new Date().toISOString(), requires: 'Node.js >=22', runtimeBundled: false }, null, 2) + '\n');
NODE
find "$stage/$name" -type d -exec chmod 0755 {} +
find "$stage/$name" -type f -exec chmod 0644 {} +
chmod 0755 "$stage/$name/scripts/"*.sh
tar --owner=0 --group=0 --numeric-owner -czf "dist/$name-linux.tar.gz" -C "$stage" "$name"
(cd dist && sha256sum "$name-linux.tar.gz" > SHA256SUMS)
echo "Ready: dist/$name-linux.tar.gz and dist/SHA256SUMS"
