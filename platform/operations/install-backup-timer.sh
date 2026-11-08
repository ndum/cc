#!/bin/bash
# Runs backup-k3s.sh every six hours as your user, half an hour after the snapshots of k3s, chapter 6.2.
# Ubuntu 26.04 has no cron, a systemd timer does the same.
#
#   sudo ~/cc/platform/operations/install-backup-timer.sh
set -euo pipefail

user=${SUDO_USER:?run it with sudo as your user}
home=$(getent passwd "$user" | cut -d: -f6)
cat > /etc/systemd/system/cc-backup-k3s.service <<UNIT
[Unit]
Description=Copy the k3s snapshots to the front-end

[Service]
Type=oneshot
User=$user
ExecStart=$home/cc/platform/operations/backup-k3s.sh
UNIT
cat > /etc/systemd/system/cc-backup-k3s.timer <<UNIT
[Unit]
Description=Copy the k3s snapshots every six hours

[Timer]
# The k3s VMs run on UTC and take their snapshots at 0, 6, 12 and 18 o'clock UTC, so the copy uses UTC too
OnCalendar=*-*-* 00/6:30:00 UTC
Persistent=true

[Install]
WantedBy=timers.target
UNIT
systemctl daemon-reload
systemctl enable --now cc-backup-k3s.timer
systemctl list-timers cc-backup-k3s.timer
