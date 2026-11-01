#!/bin/bash
# Creates a backup job in OpenNebula that backs up VMs every night at 2.00 and keeps seven backups, chapter 6.2.
#
#   ~/cc/platform/operations/backup-job.sh <name> <VM IDs separated by commas>
#   ~/cc/platform/operations/backup-job.sh velo-nightly 21,22
set -euo pipefail

name=${1:?name of the job}
vms=${2:?VM IDs, for example 21,22}
ds=$(onedatastore show backups --json | python3 -c 'import json, sys; print(json.load(sys.stdin)["DATASTORE"]["ID"])')
tmpl=$(mktemp)
# REPEAT 0 means weekly, on the days 0 to 6, so every day. TIME is the first run in seconds since 1970
cat > "$tmpl" <<TMPL
NAME         = "$name"
BACKUP_VMS   = "$vms"
DATASTORE_ID = "$ds"
KEEP_LAST    = "7"
MODE         = "FULL"
SCHED_ACTION = [ REPEAT = "0", DAYS = "0,1,2,3,4,5,6", END_TYPE = "0", TIME = "$(date -d 'tomorrow 02:00' +%s)" ]
TMPL
onebackupjob create "$tmpl"
rm -f "$tmpl"
onebackupjob show "$name" | sed -n '/SCHEDULED ACTIONS/,/^$/p'
