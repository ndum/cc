#!/bin/bash
# Creates the secrets of the monitoring stack that do not belong in Git, chapter 5.1.
#
#   ~/cc/platform/observability/make-secrets.sh
#
# The Grafana password is stored in ~/cc-lab/grafana.pass.
set -euo pipefail

pass_file=~/cc-lab/grafana.pass
if [ ! -f "$pass_file" ]; then
  install -m 0600 /dev/null "$pass_file"
  openssl rand -hex 12 > "$pass_file"
fi
kubectl create namespace monitoring --dry-run=client -o yaml | kubectl apply -f -
kubectl -n monitoring create secret generic grafana-admin \
  --from-literal=admin-user=admin \
  --from-literal=admin-password="$(tr -d '\n' < "$pass_file")" \
  --dry-run=client -o yaml | kubectl apply -f -
echo "Grafana user admin, password in $pass_file"
