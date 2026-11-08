#!/bin/bash
# Prepares one VM of the CC lab. Run it on every VM with its role after /etc/cc-lab.env is in place.
#
#   sudo ./prepare.sh fe       the front-end
#   sudo ./prepare.sh node1    the first node
#   sudo ./prepare.sh node2    the second node
#
# The script can run again at any time, it changes only what is not yet as it should be.
set -euo pipefail

ENV_FILE=/etc/cc-lab.env
HERE=$(cd "$(dirname "$0")" && pwd)

say() { printf '\n== %s\n' "$*"; }
fail() { printf '\nERROR: %s\n' "$*" >&2; exit 1; }

[ "$(id -u)" -eq 0 ] || fail "Run the script with sudo."
ROLE=${1:-}
case "$ROLE" in fe | node1 | node2) ;; *) fail "Name the role: fe, node1 or node2." ;; esac
[ -f "$ENV_FILE" ] || fail "$ENV_FILE is missing. Copy it from the parameter generator of chapter 0.3."
# A file pasted through a Windows editor ends its lines with CR LF, the CR would become part of every value
sed -i 's/\r$//' "$ENV_FILE"

# shellcheck source=/dev/null
source "$ENV_FILE"
for var in CC_CODE CC_FE_HOST CC_NODE1_HOST CC_NODE2_HOST CC_FE_IP CC_NODE1_IP CC_NODE2_IP \
  CC_GUEST_NET CC_GUEST_GATEWAY CC_VNI CC_VXLAN_GROUP; do
  [ -n "${!var:-}" ] || fail "$var is empty in $ENV_FILE."
done

case "$ROLE" in
  fe) HOST=$CC_FE_HOST IP=$CC_FE_IP ;;
  node1) HOST=$CC_NODE1_HOST IP=$CC_NODE1_IP ;;
  node2) HOST=$CC_NODE2_HOST IP=$CC_NODE2_IP ;;
esac

say "System"
# shellcheck source=/dev/null
. /etc/os-release
echo "$PRETTY_NAME, kernel $(uname -r)"
[ "${VERSION_ID:-}" = "26.04" ] || echo "Warning: the course is tested on Ubuntu 26.04, this is $VERSION_ID."
# grep -q would end the pipe early and pipefail would count that as an error
addresses=$(ip -4 -o addr show)
grep -qw "$IP" <<<"$addresses" || fail "This VM has no address $IP. Check the role or the addresses in $ENV_FILE."

say "Host name and /etc/hosts"
# one-deploy and OpenNebula need every VM to resolve the names of all three
hostnamectl set-hostname "$HOST"
sed -i '/# cc-lab begin/,/# cc-lab end/d' /etc/hosts
sed -i "/[[:space:]]$HOST\$/d" /etc/hosts
# The installer maps the old name to 127.0.1.1, the new name has to resolve to the lab address
sed -i '/^127\.0\.1\.1[[:space:]]/d' /etc/hosts
cat >>/etc/hosts <<EOF
# cc-lab begin
$CC_FE_IP $CC_FE_HOST
$CC_NODE1_IP $CC_NODE1_HOST
$CC_NODE2_IP $CC_NODE2_HOST
# cc-lab end
EOF
echo "$HOST ($IP)"

say "Packages"
# The minimal server image of Ubuntu 26.04 has no rsyslog, one-deploy expects it, and no editor for the chapters
packages=(rsyslog nano)
# acl lets Ansible on the front-end switch to the user oneadmin, nftables carries the NAT of the gateway
[ "$ROLE" = fe ] && packages+=(acl nftables)
export DEBIAN_FRONTEND=noninteractive
# needrestart would print its report after every installation
export NEEDRESTART_SUSPEND=1
apt-get -qq update
apt-get -qq install -y "${packages[@]}" >/dev/null
systemctl enable --now rsyslog >/dev/null 2>&1
echo "${packages[*]} installed"

if [ "$ROLE" = fe ]; then
  say "Node.js for the web interface"
  # FireEdge 7.4 needs Node.js 20 from the OpenNebula repository, Ubuntu 26.04 offers a newer one
  cat >/etc/apt/preferences.d/opennebula-nodejs <<'EOF'
Package: nodejs
Pin: origin downloads.opennebula.io
Pin-Priority: 700
EOF
  echo "/etc/apt/preferences.d/opennebula-nodejs written"

  say "Gateway of the guest network"
  install -m 755 "$HERE/cc-gateway.sh" /usr/local/sbin/cc-gateway
  install -m 644 "$HERE/cc-gateway.service" /etc/systemd/system/cc-gateway.service
  systemctl daemon-reload
  systemctl enable cc-gateway.service >/dev/null 2>&1
  systemctl restart cc-gateway.service
  /usr/local/sbin/cc-gateway status
else
  say "Virtualisation"
  # KVM needs the virtualisation extensions of the CPU inside this VM (nested virtualisation)
  flag=$(grep -m1 -owE 'vmx|svm' /proc/cpuinfo || true)
  if [ -n "$flag" ]; then
    echo "The CPU of this VM offers $flag."
  else
    fail "This VM sees no vmx or svm flag. Turn on nested virtualisation for it, see chapter 0.2 and the supplement on own hypervisors."
  fi
  echo "Network interface for OpenNebula: $(ip route show default | awk '{ for (i = 1; i < NF; i++) if ($i == "dev") { print $(i + 1); exit } }')"
fi

say "Done"
echo "$HOST is prepared. Once all three VMs are prepared, chapter 0.4 continues on the front-end."
