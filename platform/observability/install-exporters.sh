#!/bin/bash
# Installs the Prometheus exporters of OpenNebula, the step of chapter 5.1. Run it on the front-end.
#
#   ~/cc/platform/observability/install-exporters.sh
#
# Front-end: the OpenNebula exporter (port 9925) and node_exporter (9100).
# Nodes: node_exporter (9100) and the libvirt exporter (9926).
# The package opennebula-prometheus would bring a Prometheus of its own, the cluster already has one.
set -euo pipefail

# shellcheck source=/dev/null
source /etc/cc-lab.env

sudo apt-get install -y opennebula-prometheus-kvm
sudo systemctl enable --now opennebula-exporter opennebula-node-exporter

for node in "$CC_NODE1_HOST" "$CC_NODE2_HOST"; do
  ssh "$node" "sudo apt-get install -y opennebula-prometheus-kvm && sudo systemctl enable --now opennebula-node-exporter opennebula-libvirt-exporter"
done

sleep 5
for target in "$CC_FE_IP:9925" "$CC_FE_IP:9100" "$CC_NODE1_IP:9100" "$CC_NODE1_IP:9926" "$CC_NODE2_IP:9100" "$CC_NODE2_IP:9926"; do
  if curl -fs -o /dev/null "http://$target/metrics"; then echo "ok  $target"; else echo "!!  $target"; fi
done
