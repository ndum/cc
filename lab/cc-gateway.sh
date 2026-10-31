#!/bin/bash
# Gateway of the guest network on the front-end.
#
# The guests of OpenNebula live in a VXLAN network that only the nodes carry. The front-end joins
# the same VXLAN, holds the gateway address and sends guest traffic to the internet with NAT, so
# only the addresses of the three VMs ever appear on the lab network.
#
#   cc-gateway up      create the VXLAN, the bridge, the gateway address and the NAT rule
#   cc-gateway down    remove them again
#   cc-gateway status  show what is there
#
# The values come from /etc/cc-lab.env, systemd runs "up" at every boot (cc-gateway.service).
set -euo pipefail

ENV_FILE=/etc/cc-lab.env
VXLAN=cc-vxlan
BRIDGE=cc-br
TABLE=cc_gateway
# A VXLAN header and its outer packet take 50 bytes of the 1500 the lab network carries
MTU=1450

# shellcheck source=/dev/null
source "$ENV_FILE"

uplink() {
  ip route show default | awk '{ for (i = 1; i < NF; i++) if ($i == "dev") { print $(i + 1); exit } }'
}

down() {
  ip link del "$VXLAN" 2>/dev/null || true
  ip link del "$BRIDGE" 2>/dev/null || true
  nft delete table ip "$TABLE" 2>/dev/null || true
}

up() {
  local dev
  dev=$(uplink)
  [ -n "$dev" ] || { echo "cc-gateway: no default route, the front-end has no uplink" >&2; exit 1; }
  down
  # Same id, multicast group and port as the VXLAN networks OpenNebula creates on the nodes
  ip link add "$VXLAN" type vxlan id "$CC_VNI" group "$CC_VXLAN_GROUP" dev "$dev" dstport 8472 ttl 16
  ip link add "$BRIDGE" type bridge
  ip link set "$VXLAN" master "$BRIDGE"
  ip link set "$VXLAN" mtu "$MTU" up
  ip link set "$BRIDGE" mtu "$MTU" up
  ip addr add "$CC_GUEST_GATEWAY/${CC_GUEST_NET#*/}" dev "$BRIDGE"
  sysctl -qw net.ipv4.ip_forward=1
  nft -f - <<EOF
table ip $TABLE {
  chain postrouting {
    type nat hook postrouting priority srcnat; policy accept;
    ip saddr $CC_GUEST_NET oifname "$dev" masquerade
  }
}
EOF
  echo "cc-gateway: $CC_GUEST_GATEWAY on $BRIDGE, VXLAN $CC_VNI over $dev, NAT for $CC_GUEST_NET"
}

status() {
  ip -br addr show "$BRIDGE" 2>/dev/null || echo "$BRIDGE is missing"
  ip -d link show "$VXLAN" 2>/dev/null | grep -o 'vxlan id [0-9]* group [0-9.]*' || echo "$VXLAN is missing"
  echo "ip_forward=$(sysctl -n net.ipv4.ip_forward)"
  nft list table ip "$TABLE" 2>/dev/null | grep masquerade || echo "NAT rule is missing"
}

case "${1:-}" in
  up) up ;;
  down) down ;;
  status) status ;;
  *) echo "usage: cc-gateway up|down|status" >&2; exit 2 ;;
esac
