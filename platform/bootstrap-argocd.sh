#!/bin/bash
# Installs Argo CD in a new k3s cluster and connects it to the platform repo in Gitea, chapter 4.4.
# After this step Argo CD builds everything else from Git.
#
#   ~/cc/platform/bootstrap-argocd.sh
set -euo pipefail

CHART_VERSION=${ARGOCD_CHART_VERSION:-10.11.6}
# shellcheck source=/dev/null
source /etc/cc-lab.env
REPO="http://$CC_FE_IP:3000/wolkenwerk/platform.git"
HERE=$(dirname "$(readlink -f "$0")")

helm repo add argo https://argoproj.github.io/argo-helm >/dev/null
helm repo update argo >/dev/null
helm upgrade --install argocd argo/argo-cd --version "$CHART_VERSION" \
  --namespace argocd --create-namespace -f "$HERE/argocd/values.yaml" --wait --timeout 10m

# Read access to the repo, the token comes without a line break, otherwise Gitea refuses it
kubectl -n argocd create secret generic repo-platform \
  --from-literal=type=git \
  --from-literal=url="$REPO" \
  --from-literal=username=platform \
  --from-literal=password="$(tr -d '\n' < ~/cc-lab/gitea/argocd.token)" \
  --dry-run=client -o yaml |
  kubectl label --local -f - argocd.argoproj.io/secret-type=repository -o yaml |
  kubectl apply -f -

kubectl apply -f ~/platform/root.yaml
echo "Argo CD runs, UI on http://$CC_K3S_SERVER_IP:30080/, user admin, password:"
kubectl -n argocd get secret argocd-initial-admin-secret -o jsonpath='{.data.password}' | base64 -d
echo
