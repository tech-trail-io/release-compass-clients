#!/usr/bin/env bash
# Publish or stage one package directory.
# First version for a never-published name uses `npm publish` (stage cannot create packages).
# Later versions use `npm stage publish` for 2FA approval.
set -euo pipefail

dir="${1:?package directory required}"
dry="${2:-false}"

name="$(node -p "require('./${dir}/package.json').name")"
version="$(node -p "require('./${dir}/package.json').version")"

package_exists() {
  npm view "$name" version >/dev/null 2>&1
}

echo "Package ${name}@${version}"

if package_exists; then
  echo "Exists on registry → stage publish"
  if [ "$dry" = "true" ]; then
    (cd "$dir" && npm stage publish --access public --dry-run)
  else
    (cd "$dir" && npm stage publish --access public)
    echo "Staged. Approve with: npm stage approve <stage-id> --otp <code>"
  fi
else
  echo "New package → direct publish (npm stage cannot create packages)"
  if [ "$dry" = "true" ]; then
    (cd "$dir" && npm publish --access public --dry-run)
  else
    (cd "$dir" && npm publish --access public)
    echo "Published ${name}@${version}. Configure Trusted Publisher (stage only), then later tags will stage."
  fi
fi
