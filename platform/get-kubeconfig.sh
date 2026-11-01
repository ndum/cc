#!/bin/bash
# Copies the kubeconfig of the k3s server to ~/.kube/config and points it to the server address.
#
#   ~/cc/platform/get-kubeconfig.sh
set -euo pipefail

# shellcheck source=/dev/null
source /etc/cc-lab.env
mkdir -p ~/.kube
ssh -o StrictHostKeyChecking=accept-new "root@$CC_K3S_SERVER_IP" cat /etc/rancher/k3s/k3s.yaml |
  sed "s#https://127.0.0.1:6443#https://$CC_K3S_SERVER_IP:6443#" > ~/.kube/config
chmod 600 ~/.kube/config
kubectl get nodes
