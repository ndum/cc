#!/bin/bash
# Installs kubeseal, the command line tool of Sealed Secrets, on the front-end, chapter 6.1.
# The download is checked against the checksum file of the release.
#
#   sudo ~/cc/platform/operations/install-kubeseal.sh
set -euo pipefail

VERSION=${KUBESEAL_VERSION:-0.41.2}
BASE="https://github.com/bitnami-labs/sealed-secrets/releases/download/v$VERSION"
FILE="kubeseal-$VERSION-linux-amd64.tar.gz"
tmp=$(mktemp -d)
trap 'rm -rf "$tmp"' EXIT

curl -fsSL -o "$tmp/$FILE" "$BASE/$FILE"
curl -fsSL -o "$tmp/checksums.txt" "$BASE/sealed-secrets_${VERSION}_checksums.txt"
(cd "$tmp" && grep " $FILE\$" checksums.txt | sha256sum -c -)
tar -xzf "$tmp/$FILE" -C "$tmp" kubeseal
install -m 0755 "$tmp/kubeseal" /usr/local/bin/kubeseal
kubeseal --version
