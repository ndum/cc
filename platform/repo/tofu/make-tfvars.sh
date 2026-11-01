#!/bin/bash
# Writes the variables of the k3s VMs from /etc/cc-lab.env.
#
#   ./make-tfvars.sh > terraform.tfvars
set -euo pipefail

# shellcheck source=/dev/null
source /etc/cc-lab.env
cat <<VARS
server_ip = "$CC_K3S_SERVER_IP"
agent_ip  = "$CC_K3S_AGENT_IP"
VARS
