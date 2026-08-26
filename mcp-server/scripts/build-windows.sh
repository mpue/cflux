#!/usr/bin/env bash
#
# Baut das Windows-Paket fuer das Netzlaufwerk.
#
# Ergebnis: dist-win/cflux-mcp-<version>-windows.zip — entpacken, Schluessel
# eintragen, fertig. Die Kollegen brauchen weder Node noch npm noch Adminrechte.
#
# Aufruf:   npm run package:windows
#           NODE_VERSION=v22.20.0 npm run package:windows   (andere Node-Version)
#
# Der Lauf ist wiederholbar: node.exe wird einmal geholt, gegen die
# Pruefsumme von nodejs.org geprueft und danach aus .node-cache/ benutzt.
# Ist es einmal da, laeuft der Bau auch ohne Netz.
#
set -euo pipefail

NODE_VERSION="${NODE_VERSION:-v24.15.0}"
HERE="$(cd "$(dirname "$0")/.." && pwd)"
CACHE="$HERE/.node-cache/$NODE_VERSION"
ARCHIVE="node-$NODE_VERSION-win-x64"

fail() { printf '\n✗ %s\n\n' "$1" >&2; exit 1; }
step() { printf '▸ %s\n' "$1"; }

# ── Voraussetzungen ──────────────────────────────────────────────────────────
# Lieber hier mit einem klaren Satz abbrechen als spaeter mitten im Lauf.

for tool in node npm curl unzip zip shasum; do
  command -v "$tool" >/dev/null 2>&1 || fail "\"$tool\" fehlt. Bitte installieren und erneut versuchen."
done

[ -d "$HERE/node_modules" ] || fail "node_modules fehlt. Bitte zuerst \"npm install\" im Ordner mcp-server ausfuehren."

# ── Version ──────────────────────────────────────────────────────────────────
# package.json und src/version.ts muessen dasselbe sagen, sonst behauptet das
# Paket etwas anderes als sein Dateiname.

PKG_VERSION="$(node -p "require('$HERE/package.json').version")"
SRC_VERSION="$(node -p "
  const m = require('fs').readFileSync('$HERE/src/version.ts','utf8').match(/VERSION\s*=\s*'([^']+)'/);
  m ? m[1] : ''
")"

[ -n "$SRC_VERSION" ] || fail "In src/version.ts ist keine VERSION zu finden."
[ "$PKG_VERSION" = "$SRC_VERSION" ] || fail \
  "Versionen laufen auseinander: package.json sagt $PKG_VERSION, src/version.ts sagt $SRC_VERSION."

STAGE="$HERE/dist-win/cflux-mcp"
ZIP="$HERE/dist-win/cflux-mcp-$PKG_VERSION-windows.zip"

echo
echo "cflux-mcp $PKG_VERSION  ·  Node $NODE_VERSION  ·  Windows x64"
echo

# ── 1. Typen pruefen und buendeln ────────────────────────────────────────────

step "Typen pruefen"
npx tsc --noEmit

step "Server buendeln"
npx esbuild "$HERE/src/index.ts" \
  --bundle --platform=node --target=node20 --format=esm \
  --outfile="$HERE/build/cflux-mcp.mjs" \
  --banner:js="import{createRequire}from'module';const require=createRequire(import.meta.url);" \
  --log-level=warning

# ── 2. node.exe holen und pruefen ────────────────────────────────────────────

if [ ! -f "$CACHE/node.exe" ]; then
  step "node.exe $NODE_VERSION laden (einmalig, ca. 30 MB)"
  mkdir -p "$CACHE"
  curl -fsSL "https://nodejs.org/dist/$NODE_VERSION/$ARCHIVE.zip" -o "$CACHE/node.zip"

  step "Pruefsumme gegen nodejs.org abgleichen"
  EXPECTED="$(curl -fsSL "https://nodejs.org/dist/$NODE_VERSION/SHASUMS256.txt" \
    | awk -v f="$ARCHIVE.zip" '$2 == f { print $1 }')"
  [ -n "$EXPECTED" ] || fail "Fuer $ARCHIVE.zip steht keine Pruefsumme in SHASUMS256.txt. Gibt es die Node-Version wirklich?"

  ACTUAL="$(shasum -a 256 "$CACHE/node.zip" | awk '{print $1}')"
  if [ "$EXPECTED" != "$ACTUAL" ]; then
    rm -f "$CACHE/node.zip"
    fail "Pruefsumme stimmt nicht. Erwartet $EXPECTED, bekommen $ACTUAL. Download verworfen."
  fi

  unzip -qo "$CACHE/node.zip" "$ARCHIVE/node.exe" -d "$CACHE"
  mv "$CACHE/$ARCHIVE/node.exe" "$CACHE/node.exe"
  rm -rf "$CACHE/$ARCHIVE" "$CACHE/node.zip"
  printf '%s\n' "$EXPECTED" > "$CACHE/node.exe.sha256-of-archive"
else
  step "node.exe aus .node-cache/$NODE_VERSION"
fi

# ── 3. Paket zusammenstellen ─────────────────────────────────────────────────

step "Paket zusammenstellen"
rm -rf "$STAGE"
mkdir -p "$STAGE"

cp "$CACHE/node.exe"                              "$STAGE/"
cp "$HERE/build/cflux-mcp.mjs"                    "$STAGE/"
cp "$HERE/windows/LIESMICH.txt"                   "$STAGE/"
cp "$HERE/windows/test.cmd"                       "$STAGE/"
cp "$HERE/windows/claude_desktop_config_beispiel.json" "$STAGE/"

# Woher dieses Paket stammt — bei einer Rueckfrage aus dem Kollegenkreis ist
# damit ohne Nachfragen klar, welcher Stand dort liegt.
{
  printf 'cflux-mcp %s\r\n' "$PKG_VERSION"
  printf 'Node      %s (win-x64, Pruefsumme gegen nodejs.org geprueft)\r\n' "$NODE_VERSION"
  printf 'Gebaut    %s\r\n' "$(date '+%Y-%m-%d %H:%M %Z')"
  printf 'Commit    %s\r\n' "$(git -C "$HERE" rev-parse --short HEAD 2>/dev/null || echo 'unbekannt')"
} > "$STAGE/VERSION.txt"

# ── 4. Packen ────────────────────────────────────────────────────────────────

step "Packen"
mkdir -p "$HERE/dist-win"
rm -f "$ZIP"
( cd "$HERE/dist-win" && zip -qr "$(basename "$ZIP")" cflux-mcp )
rm -rf "$STAGE"

# ── 5. Selbstkontrolle ───────────────────────────────────────────────────────
# Das gebuendelte Skript wird hier mit dem lokalen Node gestartet. Das beweist
# nicht, dass es unter Windows laeuft, faengt aber jeden Buendelfehler ab,
# bevor das ZIP auf dem Netzlaufwerk landet.

step "Buendel gegenpruefen"
BUNDLE_VERSION="$(node "$HERE/build/cflux-mcp.mjs" --version | awk '{print $2}')"
[ "$BUNDLE_VERSION" = "$PKG_VERSION" ] || fail \
  "Das gebuendelte Skript meldet Version $BUNDLE_VERSION statt $PKG_VERSION."

echo
echo "✓ Fertig: $ZIP  ($(du -h "$ZIP" | cut -f1))"
echo
echo "  Auf das Netzlaufwerk legen. Die Kollegen entpacken nach C:\\cflux-mcp"
echo "  und folgen der LIESMICH.txt."
echo
