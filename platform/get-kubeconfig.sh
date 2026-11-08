#!/bin/bash
# Copies the kubeconfig of the k3s server to ~/.kube/config and points it to the server address.
# Right after tofu apply the server may still install k3s, so the script waits up to five minutes.
#
#   ~/cc/platform/get-kubeconfig.sh
set -euo pipefail

# shellcheck source=/dev/null
source /etc/cc-lab.env
mkdir -p ~/.kube
for i in $(seq 30); do
  if ssh -o StrictHostKeyChecking=accept-new -o ConnectTimeout=5 "root@$CC_K3S_SERVER_IP" test -f /etc/rancher/k3s/k3s.yaml; then
    break
  fi
  if [ "$i" = 30 ]; then
    echo "k3s on $CC_K3S_SERVER_IP is not ready after five minutes. If ssh reports a changed host key," >&2
    echo "remove the old one with ssh-keygen -R $CC_K3S_SERVER_IP, see chapter 4.3." >&2
    exit 1
  fi
  echo "Waiting for k3s on $CC_K3S_SERVER_IP ..."
  sleep 10
done
# A temporary file keeps the old kubeconfig when the copy fails
tmp=$(mktemp)
ssh "root@$CC_K3S_SERVER_IP" cat /etc/rancher/k3s/k3s.yaml |
  sed "s#https://127.0.0.1:6443#https://$CC_K3S_SERVER_IP:6443#" > "$tmp"
install -m 600 "$tmp" ~/.kube/config
rm -f "$tmp"
kubectl get nodes
