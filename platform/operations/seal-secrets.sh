#!/bin/bash
# Encrypts the Grafana password with the public key of the controller and writes it into the platform repo, chapter 6.1.
# Only the controller in the cluster can decrypt the result, so it may go into Git.
#
#   ~/cc/platform/operations/seal-secrets.sh
set -euo pipefail

pass_file=~/cc-lab/grafana.pass
out=~/platform/secrets/grafana-admin.yaml
if [ ! -f "$pass_file" ]; then
  install -m 0600 /dev/null "$pass_file"
  openssl rand -hex 12 > "$pass_file"
fi
mkdir -p "$(dirname "$out")"
kubectl -n monitoring create secret generic grafana-admin \
  --from-literal=admin-user=admin \
  --from-literal=admin-password="$(tr -d '\n' < "$pass_file")" \
  --dry-run=client -o yaml |
  kubeseal --format yaml > "$out"
echo "Written $out, commit and push it"
