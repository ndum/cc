#!/bin/bash
# Writes the one-deploy inventory of the CC lab from /etc/cc-lab.env.
#
#   ./make-inventory.sh > ~/cc-lab/inventory.yml
#
# The password of the OpenNebula user oneadmin is generated once and kept in ~/cc-lab/oneadmin.pass.
set -euo pipefail

# shellcheck source=/dev/null
source /etc/cc-lab.env
mkdir -p ~/cc-lab
PASS_FILE=~/cc-lab/oneadmin.pass
if [ ! -f "$PASS_FILE" ]; then
  (umask 077 && openssl rand -base64 18 | tr -d '/+=' >"$PASS_FILE")
fi

cat <<EOF
---
all:
  vars:
    # Ansible logs in as the course user and becomes root with sudo
    ansible_user: $(id -un)
    ansible_become: true
    one_version: "7.4"
    one_pass: "$(cat "$PASS_FILE")"
    # one-deploy checks that every VM resolves the names of all others, prepare.sh wrote them
    ensure_hostname: true
    ensure_hosts: true
    # Images reach the nodes over SSH, no shared storage is needed
    ds:
      mode: ssh

frontend:
  hosts:
    $CC_FE_HOST: { ansible_host: $CC_FE_IP }

node:
  hosts:
    $CC_NODE1_HOST: { ansible_host: $CC_NODE1_IP }
    $CC_NODE2_HOST: { ansible_host: $CC_NODE2_IP }
EOF
