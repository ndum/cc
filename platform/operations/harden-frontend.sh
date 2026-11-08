#!/bin/bash
# Hardens the front-end, chapter 6.1: SSH only with keys, a firewall for incoming traffic, automatic security updates.
#
#   sudo ~/cc/platform/operations/harden-frontend.sh
#
# Test a login with your key in a second terminal before you close the first one.
set -euo pipefail

# shellcheck source=/dev/null
source /etc/cc-lab.env
user=${SUDO_USER:?run it with sudo as your user}
home=$(getent passwd "$user" | cut -d: -f6)

# Without a key the next login would fail, so stop here
if [ ! -s "$home/.ssh/authorized_keys" ]; then
  echo "No key in $home/.ssh/authorized_keys, add one first" >&2
  exit 1
fi

# sshd uses the first value it reads, files in sshd_config.d are read in name order before the cloud-init file
cat > /etc/ssh/sshd_config.d/10-cc-hardening.conf <<CONF
PasswordAuthentication no
KbdInteractiveAuthentication no
PermitRootLogin no
CONF
sshd -t
# An update of OpenSSH can change the unit of ssh, systemd loads it first instead of printing a warning
systemctl daemon-reload
systemctl reload ssh

# A table of its own for incoming traffic, the NAT table of cc-gateway stays untouched.
# The nodes and cc-net reach everything, from elsewhere only SSH and the web interface of OpenNebula
cat > /etc/cc-firewall.nft <<NFT
table inet cc_firewall
delete table inet cc_firewall
table inet cc_firewall {
  chain input {
    type filter hook input priority filter; policy drop;
    ct state established,related accept
    iif lo accept
    meta l4proto { icmp, ipv6-icmp } accept
    udp sport 67 udp dport 68 accept
    ip saddr { $CC_NODE1_IP, $CC_NODE2_IP, $CC_GUEST_NET } accept
    tcp dport { 22, 2616 } accept
  }
}
NFT
cat > /etc/systemd/system/cc-firewall.service <<UNIT
[Unit]
Description=Firewall of the CC front-end for incoming traffic
Wants=network-pre.target
Before=network-pre.target

[Service]
Type=oneshot
RemainAfterExit=yes
ExecStart=/usr/sbin/nft -f /etc/cc-firewall.nft

[Install]
WantedBy=multi-user.target
UNIT
systemctl daemon-reload
systemctl enable --now cc-firewall.service
systemctl restart cc-firewall.service

# Ubuntu installs security updates every day with unattended-upgrades, make sure it is on
apt-get install -y unattended-upgrades
cat > /etc/apt/apt.conf.d/20auto-upgrades <<APT
APT::Periodic::Update-Package-Lists "1";
APT::Periodic::Unattended-Upgrade "1";
APT
systemctl enable --now unattended-upgrades

sshd -T | grep -E '^(passwordauthentication|permitrootlogin)'
nft list table inet cc_firewall
