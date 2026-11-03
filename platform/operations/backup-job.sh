#!/bin/bash
# Creates a backup job in OpenNebula that backs up VMs every night, by default at 2.00 and keeping seven backups, chapter 6.2.
#
#   ~/cc/platform/operations/backup-job.sh <name> <VM IDs separated by commas> [hour] [backups to keep]
#   ~/cc/platform/operations/backup-job.sh velo-nightly 21,22
#   ~/cc/platform/operations/backup-job.sh praxis-nightly 15 4 10
#
# The hour is in the time zone of the front-end, timedatectl shows it.
set -euo pipefail

name=${1:?name of the job}
vms=${2:?VM IDs, for example 21,22}
hour=${3:-2}
keep=${4:-7}
# The first run is tonight if the hour is still ahead, otherwise the next night
first=$(date -d "today $hour:00" +%s)
[ "$first" -gt "$(date +%s)" ] || first=$(date -d "tomorrow $hour:00" +%s)
ds=$(onedatastore show backups --json | python3 -c 'import json, sys; print(json.load(sys.stdin)["DATASTORE"]["ID"])')
tmpl=$(mktemp)
# REPEAT 0 means weekly, on the days 0 to 6, so every day. TIME is the first run in seconds since 1970
cat > "$tmpl" <<TMPL
NAME         = "$name"
BACKUP_VMS   = "$vms"
DATASTORE_ID = "$ds"
KEEP_LAST    = "$keep"
MODE         = "FULL"
SCHED_ACTION = [ REPEAT = "0", DAYS = "0,1,2,3,4,5,6", END_TYPE = "0", TIME = "$first" ]
TMPL
onebackupjob create "$tmpl"
rm -f "$tmpl"
onebackupjob show "$name" | sed -n '/SCHEDULED ACTIONS/,/^$/p'
