#!/bin/bash
# Installs Ansible and one-deploy on the front-end, the steps of chapter 2.2.
#
#   ./install.sh
#
# one-deploy lands in ~/cc-lab/one-deploy at the release the course is tested with.
set -euo pipefail

ONE_DEPLOY_RELEASE=release-1.4.1

sudo DEBIAN_FRONTEND=noninteractive apt-get -qq update
sudo DEBIAN_FRONTEND=noninteractive apt-get -qq install -y ansible-core git python3-netaddr >/dev/null
ansible --version | head -1

mkdir -p ~/cc-lab
if [ ! -d ~/cc-lab/one-deploy ]; then
  git -c advice.detachedHead=false clone --quiet --branch "$ONE_DEPLOY_RELEASE" https://github.com/OpenNebula/one-deploy.git ~/cc-lab/one-deploy
fi
cd ~/cc-lab/one-deploy
# ansible.cfg of one-deploy looks for collections in ./ansible_collections only
ansible-galaxy collection install -r requirements.yml -p ./ansible_collections >/dev/null
echo "one-deploy $(git describe --tags) is ready in ~/cc-lab/one-deploy"
