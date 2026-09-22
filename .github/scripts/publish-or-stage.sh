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

run_npm() {
  local logfile status
  logfile="$(mktemp)"
  set +e
  "$@" >"$logfile" 2>&1
  status=$?
  set -e
  cat "$logfile"
  if [ "$status" -ne 0 ] && grep -qE 'EOTP|one-time password' "$logfile"; then
    cat >&2 <<EOF

EOTP: npm requires interactive 2FA for this publish. CI cannot enter an OTP.

Bootstrap options (pick one):
  1. Local (recommended for first create):
       cd ${dir} && npm publish --access public --otp=<code>
  2. Temporary granular token with Bypass 2FA + publish (and stage) for @techtrail,
     set as NPM_STAGE_TOKEN, re-run the tag workflow, then revoke Bypass 2FA /
     switch to stage-only or Trusted Publisher.

See README "Releasing".
EOF
  fi
  rm -f "$logfile"
  return "$status"
}

if package_exists; then
  echo "Exists on registry → stage publish"
  if [ "$dry" = "true" ]; then
    (cd "$dir" && npm stage publish --access public --dry-run)
  else
    run_npm bash -c "cd \"$dir\" && npm stage publish --access public"
    echo "Staged. Approve with: npm stage approve <stage-id> --otp <code>"
  fi
else
  echo "New package → direct publish (npm stage cannot create packages)"
  if [ "$dry" = "true" ]; then
    (cd "$dir" && npm publish --access public --dry-run)
  else
    run_npm bash -c "cd \"$dir\" && npm publish --access public"
    echo "Published ${name}@${version}. Configure Trusted Publisher, then later tags will stage."
  fi
fi
