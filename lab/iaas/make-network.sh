#!/bin/bash
# Writes the OpenNebula template of the internal network from /etc/cc-lab.env, the step of chapter 2.3.
#
#   ./make-network.sh > ~/cc-lab/cc-net.tpl
#   onevnet create ~/cc-lab/cc-net.tpl
#
# The interface that carries the VXLAN on the nodes is read from node 1, or given as first argument.
set -euo pipefail

# shellcheck source=/dev/null
source /etc/cc-lab.env
PHYDEV=${1:-$(ssh -o BatchMode=yes "$CC_NODE1_HOST" "ip route show default" | awk '{ for (i = 1; i < NF; i++) if ($i == "dev") { print $(i + 1); exit } }')}
[ -n "$PHYDEV" ] || { echo "No interface found on $CC_NODE1_HOST, give it as first argument" >&2; exit 1; }

cat <<TPL
NAME        = "cc-net"
DESCRIPTION = "Internal network of the cloud, gateway and NAT on the front-end"

# VXLAN carries the network over the lab network, the gateway on the front-end uses the same id
VN_MAD  = "vxlan"
PHYDEV  = "$PHYDEV"
VLAN_ID = "$CC_VNI"
BRIDGE  = "ccbr$CC_VNI"

# The VXLAN header takes 50 of the 1500 bytes, the guests have to know that
GUEST_MTU = "1450"

AR = [
  TYPE = "IP4",
  IP   = "$CC_GUEST_FIRST",
  SIZE = "$CC_GUEST_SIZE"
]

NETWORK_ADDRESS = "${CC_GUEST_NET%/*}"
NETWORK_MASK    = "255.255.255.0"
GATEWAY         = "$CC_GUEST_GATEWAY"
DNS             = "9.9.9.9 1.1.1.1"
TPL
