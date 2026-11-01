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
onedatastore show backups | grep -E '^(ID|NAME|STATE)'
