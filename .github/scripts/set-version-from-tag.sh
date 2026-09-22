#!/usr/bin/env bash
# Usage: set-version-from-tag.sh v1.2.3
set -euo pipefail

raw="${1:-}"
if [[ ! "$raw" =~ ^v[0-9]+\.[0-9]+\.[0-9]+(-[0-9A-Za-z.-]+)?$ ]]; then
  echo "Expected a semver tag like v1.2.3 (got: ${raw:-empty})" >&2
  exit 1
fi

version="${raw#v}"
root="$(cd "$(dirname "$0")/../.." && pwd)"

for pkg in core react next angular; do
  node -e "
    const fs = require('fs');
    const path = process.argv[1];
    const version = process.argv[2];
    const pkg = JSON.parse(fs.readFileSync(path, 'utf8'));
    pkg.version = version;
    if (pkg.dependencies) {
      for (const [name, range] of Object.entries(pkg.dependencies)) {
        if (name.startsWith('@techtrail/release-compass-') && range.startsWith('workspace:')) {
          pkg.dependencies[name] = version;
        }
      }
    }
    fs.writeFileSync(path, JSON.stringify(pkg, null, 2) + '\n');
  " "$root/packages/$pkg/package.json" "$version"
  echo "Set packages/$pkg → $version"
done
