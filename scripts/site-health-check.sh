#!/usr/bin/env bash
# HTTP, SEO, and test checks for zaydio.com (or BASE_URL override).
set -u

BASE_URL="${BASE_URL:-https://zaydio.com}"
BASE_URL="${BASE_URL%/}"
FAILURES=0

SEO_PAGES=(
  "/"
  "/parents.html"
  "/privacy.html"
  "/videos.html"
  "/albums/everybody-sing.html"
  "/albums/the-new-abcs.html"
  "/albums/sing-along-lullabies.html"
  "/albums/island-vibes-lullabies.html"
)

check_url() {
  local url="$1"
  local desc="$2"
  local code

  code="$(curl -sS -o /dev/null -w "%{http_code}" --max-time 20 -L "$url" 2>/dev/null || echo "000")"
  if [[ "$code" =~ ^2[0-9][0-9]$ ]]; then
    echo "OK   $desc ($code)"
  else
    echo "FAIL $desc ($code) — $url"
    FAILURES=$((FAILURES + 1))
  fi
}

check_seo_meta() {
  local path="$1"
  local url="$BASE_URL$path"
  local html

  html="$(curl -sS --max-time 20 -L "$url" 2>/dev/null || echo "")"
  if [[ -z "$html" ]]; then
    echo "FAIL SEO meta $path (no response)"
    FAILURES=$((FAILURES + 1))
    return
  fi

  if ! grep -qi '<title>' <<<"$html" || ! grep -qi 'meta name="description"' <<<"$html"; then
    echo "FAIL SEO meta $path (missing title or description)"
    FAILURES=$((FAILURES + 1))
    return
  fi

  if ! grep -qi 'rel="canonical"' <<<"$html"; then
    echo "FAIL SEO meta $path (missing canonical)"
    FAILURES=$((FAILURES + 1))
    return
  fi

  if ! grep -qi 'consent-banner\|consent.js' <<<"$html"; then
    echo "WARN consent $path (banner script not detected in HTML — may load via JS)"
  fi

  echo "OK   SEO meta $path"
}

echo "=== Zaydio site health check $(date -u +%Y-%m-%dT%H:%M:%SZ) ==="
echo "Target: $BASE_URL"
echo

check_url "$BASE_URL/" "homepage"
check_url "$BASE_URL/zaydio.css" "stylesheet"
check_url "$BASE_URL/sitemap.xml" "sitemap.xml"
check_url "$BASE_URL/api/albums" "api/albums"
check_url "$BASE_URL/api/latest-reel" "api/latest-reel"

echo
echo "--- Sitemap pages ---"
for page in "${SEO_PAGES[@]}"; do
  check_url "$BASE_URL$page" "page $page"
done

echo
echo "--- SEO meta tags ---"
for page in "${SEO_PAGES[@]}"; do
  check_seo_meta "$page"
done

if command -v deno >/dev/null 2>&1 && [[ -f deno.json ]]; then
  echo
  if deno test --allow-net --allow-read --allow-env 2>&1; then
    echo "OK   deno tests"
  else
    echo "FAIL deno tests"
    FAILURES=$((FAILURES + 1))
  fi
else
  echo "SKIP deno tests (deno not available)"
fi

echo
if [[ "$FAILURES" -gt 0 ]]; then
  echo "=== RESULT: $FAILURES failure(s) — investigate ==="
  exit 1
fi

echo "=== RESULT: healthy ==="
exit 0
