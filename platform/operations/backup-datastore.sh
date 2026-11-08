#!/bin/bash
# Creates the backup datastore of OpenNebula on the front-end, chapter 6.2.
# The driver rsync copies the disks of a VM over SSH to the front-end.
#
#   ~/cc/platform/operations/backup-datastore.sh
set -euo pipefail

# shellcheck source=/dev/null
source /etc/cc-lab.env
if ! onedatastore show backups >/dev/null 2>&1; then
  tmpl=$(mktemp)
  cat > "$tmpl" <<TMPL
NAME       = "backups"
TYPE       = "BACKUP_DS"
DS_MAD     = "rsync"
TM_MAD     = "-"
RSYNC_USER = "oneadmin"
RSYNC_HOST = "$CC_FE_IP"
TMPL
  onedatastore create "$tmpl"
  rm -f "$tmpl"
fi
# OpenNebula measures a new datastore only in its next monitoring cycle. Until then it reports no free
# space, and a backup into it fails with "Not enough free space on target datastore"
for _ in $(seq 60); do
  free=$(onedatastore show backups --json | python3 -c 'import json, sys; print(json.load(sys.stdin)["DATASTORE"]["FREE_MB"])')
  [ "$free" -gt 0 ] && break
  sleep 2
done
onedatastore show backups | grep -E '^(ID|NAME|STATE)'
if [ "$free" -gt 0 ]; then
  echo "FREE  $((free / 1024)) GB"
else
  echo "OpenNebula reports no free space yet, wait a minute before the first backup."
fi
