#!/bin/bash
# Installs OpenTofu, kubectl and Helm on the front-end from their official package repositories, the step of chapter 4.2.
#
#   sudo ~/cc/platform/install-tools.sh
set -euo pipefail

K8S_MINOR=${K8S_MINOR:-v1.36}

apt-get update
apt-get install -y apt-transport-https ca-certificates curl gnupg
install -m 0755 -d /etc/apt/keyrings

# OpenTofu
curl -fsSL https://get.opentofu.org/opentofu.gpg -o /etc/apt/keyrings/opentofu.gpg
curl -fsSL https://packages.opentofu.org/opentofu/tofu/gpgkey | gpg --dearmor --yes -o /etc/apt/keyrings/opentofu-repo.gpg
chmod a+r /etc/apt/keyrings/opentofu.gpg /etc/apt/keyrings/opentofu-repo.gpg
cat > /etc/apt/sources.list.d/opentofu.list <<LIST
deb [signed-by=/etc/apt/keyrings/opentofu.gpg,/etc/apt/keyrings/opentofu-repo.gpg] https://packages.opentofu.org/opentofu/tofu/any/ any main
LIST

# kubectl, the minor version follows k3s, kubectl may differ from the cluster by one minor version
curl -fsSL "https://pkgs.k8s.io/core:/stable:/$K8S_MINOR/deb/Release.key" | gpg --dearmor --yes -o /etc/apt/keyrings/kubernetes.gpg
echo "deb [signed-by=/etc/apt/keyrings/kubernetes.gpg] https://pkgs.k8s.io/core:/stable:/$K8S_MINOR/deb/ /" > /etc/apt/sources.list.d/kubernetes.list

# Helm
curl -fsSL https://packages.buildkite.com/helm-linux/helm-debian/gpgkey | gpg --dearmor --yes -o /etc/apt/keyrings/helm.gpg
echo "deb [signed-by=/etc/apt/keyrings/helm.gpg] https://packages.buildkite.com/helm-linux/helm-debian/any/ any main" > /etc/apt/sources.list.d/helm.list

apt-get update
apt-get install -y tofu kubectl helm
tofu version
kubectl version --client
helm version
