#!/bin/bash
# STYXWORKS — reproducible APK build (no Gradle).
# Pipeline: aapt2 (resources+manifest) -> javac (shell) -> d8 (dex) ->
#           zipalign -> uber-apk-signer (dedicated keystore).
# The game HTML is copied fresh from its canonical home on every build,
# so rebuilding after a game update is just: ./build.sh
set -euo pipefail

# Repo copy: the keystore password is NEVER hardcoded. Set it in the environment:
#   export STYXWORKS_KS_PASS=<your keystore password>
: "${STYXWORKS_KS_PASS:?STYXWORKS_KS_PASS is not set}"

APP="$HOME/workspace/styxworks-app"
GAME="$HOME/workspace/your_files/styxworks/styxworks.html"
P="$APP/project"
B="$P/build"
export JAVA_HOME="$APP/tools/jdk17"
export PATH="$JAVA_HOME/bin:$PATH"
BT="$APP/sdk/build-tools/34.0.0"
AJAR="$APP/sdk/platforms/android-34/android.jar"
SIGNER="$HOME/workspace/idle-cpu-mod/tools/uber-apk-signer.jar"

rm -rf "$B"
mkdir -p "$B/gen" "$B/classes" "$B/dex" "$P/assets" "$APP/out"
cp "$GAME" "$P/assets/index.html"

echo "[1/6] aapt2 compile+link"
"$BT/aapt2" compile --dir "$P/res" -o "$B/res.zip"
"$BT/aapt2" link -o "$B/unsigned.apk" -I "$AJAR" \
    --manifest "$P/AndroidManifest.xml" -A "$P/assets" \
    --java "$B/gen" "$B/res.zip"

echo "[2/6] javac"
javac -source 8 -target 8 -cp "$AJAR" -d "$B/classes" \
    $(find "$B/gen" "$P/src" -name '*.java') 2>/dev/null

echo "[3/6] d8"
"$BT/d8" --release --lib "$AJAR" --output "$B/dex" \
    $(find "$B/classes" -name '*.class')

echo "[4/6] add classes.dex"
python3 - "$B/unsigned.apk" "$B/dex/classes.dex" <<'PYEOF'
import sys, zipfile
apk, dex = sys.argv[1], sys.argv[2]
with zipfile.ZipFile(apk, 'a') as z:
    z.write(dex, 'classes.dex')
PYEOF

echo "[5/6] zipalign"
"$BT/zipalign" -f -p 4 "$B/unsigned.apk" "$B/aligned.apk"

echo "[6/6] sign"
java -jar "$SIGNER" --apks "$B/aligned.apk" \
    --ks "$APP/tools/styxworks.keystore" --ksAlias styxworks \
    --ksPass "${STYXWORKS_KS_PASS}" --ksKeyPass "${STYXWORKS_KS_PASS}" --out "$APP/out/" \
    2>&1 | grep -E 'sign success|signature verified|zipalign verified|checksum' || true

cp "$APP/out/aligned-aligned-signed.apk" "$APP/out/StyxWorks-1.4.2.apk"
echo "DONE: $APP/out/StyxWorks-1.4.2.apk"
