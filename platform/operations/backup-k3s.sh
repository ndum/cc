#!/bin/bash
# Copies the etcd snapshots and the token of the k3s server and the key of Sealed Secrets to the front-end, chapter 6.2.
# A snapshot alone is not enough for a restore, k3s also needs the token of the old server.
# Without the key a new cluster cannot decrypt the SealedSecrets in Git.
#
#   ~/cc/platform/operations/backup-k3s.sh
#
# A systemd timer runs it every six hours, see install-backup-timer.sh.
set -euo pipefail

# shellcheck source=/dev/null
source /etc/cc-lab.env
dest=~/backup/k3s
mkdir -p "$dest/snapshots"
chmod 0700 ~/backup "$dest"
kubectl -n kube-system get secret -l sealedsecrets.bitnami.com/sealed-secrets-key -o yaml > "$dest/sealed-secrets-key.yaml"
chmod 0600 "$dest/sealed-secrets-key.yaml"
scp -q -p "root@$CC_K3S_SERVER_IP:/var/lib/rancher/k3s/server/db/snapshots/*" "$dest/snapshots/"
scp -q -p "root@$CC_K3S_SERVER_IP:/var/lib/rancher/k3s/server/token" "$dest/token"
chmod 0600 "$dest/token"
# k3s keeps eight snapshots on the server, the front-end keeps the last seven days
find "$dest/snapshots" -type f -mtime +7 -delete
echo "$(date -Is) $(find "$dest/snapshots" -type f | wc -l) snapshots in $dest"
