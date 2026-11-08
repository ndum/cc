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
umask 077
# New copies replace the old ones only when they are complete, so a run while the server is down
# or a failed copy keeps the last good key and token
kubectl -n kube-system get secret -l sealedsecrets.bitnami.com/sealed-secrets-key -o yaml > "$dest/sealed-secrets-key.yaml.new"
if grep -q 'kind: Secret' "$dest/sealed-secrets-key.yaml.new"; then
  mv "$dest/sealed-secrets-key.yaml.new" "$dest/sealed-secrets-key.yaml"
else
  rm -f "$dest/sealed-secrets-key.yaml.new"
  echo "No key of Sealed Secrets in the cluster, the last copy stays" >&2
fi
# Right after a rebuild the server has no snapshot yet, token and key are still worth copying
if ssh "root@$CC_K3S_SERVER_IP" 'ls /var/lib/rancher/k3s/server/db/snapshots/* >/dev/null 2>&1'; then
  scp -q -p "root@$CC_K3S_SERVER_IP:/var/lib/rancher/k3s/server/db/snapshots/*" "$dest/snapshots/"
fi
scp -q -p "root@$CC_K3S_SERVER_IP:/var/lib/rancher/k3s/server/token" "$dest/token.new"
mv "$dest/token.new" "$dest/token"
# k3s keeps eight snapshots on the server, the front-end keeps the last seven days
find "$dest/snapshots" -type f -mtime +7 -delete
echo "$(date -Is) $(find "$dest/snapshots" -type f | wc -l) snapshots in $dest"
