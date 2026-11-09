#!/usr/bin/env bash
# Publish a production OTA update with verified config. Usage: scripts/publish-ota.sh "message"
# Refuses to publish unless the real keys are in the bundles, then reads the live update back.
set -euo pipefail
cd "$(dirname "$0")/.."
MESSAGE="${1:?Usage: scripts/publish-ota.sh \"message\"}"
PROJECT_ID=17b7de67-e1ec-4648-8a0c-74e8f2394332
RUNTIME=$(sed -nE "s/^const APP_VERSION = '([^']+)';/\1/p" app.config.js)
SUPABASE_REF=qxodyqgtpbykcuvscfew
[ -z "$(git status --porcelain -- src app.config.js eas.json)" ] || { echo "Commit src changes first."; exit 1; }

BACKUP=""
if [ -f .env ]; then BACKUP=$(mktemp); mv .env "$BACKUP"; fi
restore() { if [ -n "$BACKUP" ]; then mv "$BACKUP" .env; fi; }
trap restore EXIT

set -a; source ./.env.prod-build; set +a
[ "${EXPO_PUBLIC_APP_ENV:-}" = "production" ] || { echo "EXPO_PUBLIC_APP_ENV is not production"; exit 1; }

rm -rf dist
npx expo export -p ios -p android --output-dir dist --clear

check() { # platform regex label wanted-count-min
  local bundle; bundle=$(ls dist/_expo/static/js/"$1"/*.hbc)
  if [ "$(strings "$bundle" | grep -cE "$2")" -lt 1 ]; then echo "FAIL $1: $3 missing from bundle"; exit 1; fi
}
forbid() {
  local bundle; bundle=$(ls dist/_expo/static/js/"$1"/*.hbc)
  if [ "$(strings "$bundle" | grep -cE "$2")" -gt 0 ]; then echo "FAIL $1: $3 found in bundle"; exit 1; fi
}
check ios 'appl_[A-Za-z0-9]{10,}' 'RevenueCat iOS key'
check android 'goog_[A-Za-z0-9]{10,}' 'RevenueCat Android key'
for p in ios android; do
  check "$p" "https://$SUPABASE_REF\.supabase\.co" 'GutChecks Supabase URL'
  check "$p" 'eyJ[A-Za-z0-9_-]{20,}\.' 'Supabase anon key'
  forbid "$p" 'aunxdbqukbxyyiusaeqi' 'another project Supabase ref'
  forbid "$p" 'sk_live_|sk-ant' 'a secret key'
done
echo "Bundles verified."

npx eas-cli update --channel production --platform all --skip-bundler --input-dir dist --message "$MESSAGE" --non-interactive

for p in ios android; do
  key=EXPO_PUBLIC_REVENUECAT_IOS_API_KEY; [ "$p" = android ] && key=EXPO_PUBLIC_REVENUECAT_ANDROID_API_KEY
  curl -s "https://u.expo.dev/$PROJECT_ID" -H "expo-platform: $p" -H "expo-runtime-version: $RUNTIME" \
    -H "expo-channel-name: production" -H "accept: multipart/mixed,application/expo+json,application/json" \
    -H "expo-protocol-version: 1" | python3 -I -c '
import sys, json
key, plat = sys.argv[1], sys.argv[2]
raw = sys.stdin.buffer.read().decode("utf8", "replace")
d, _ = json.JSONDecoder().raw_decode(raw[raw.find("{\"id\""):])
ex = d["extra"]["expoClient"]["extra"]
assert ex.get(key), "live " + plat + " update has no RevenueCat key"
assert ex.get("EXPO_PUBLIC_APP_ENV") == "production", "live update is not production"
assert "qxodyqgtpbykcuvscfew" in (ex.get("EXPO_PUBLIC_SUPABASE_URL") or ""), "live update has wrong Supabase URL"
print("Live", plat, "update", d["id"], "verified")
' "$key" "$p"
done
