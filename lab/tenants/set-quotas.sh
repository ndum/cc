#!/bin/bash
# Sets the quotas of the four members of Wolkenwerk Bern, the values of chapter 3.2.
#
#   ~/cc/lab/tenants/set-quotas.sh
set -euo pipefail

# member  VMs  CPU  memory in MB
QUOTAS="
praxis    2    1    2048
treuhand  4    2    4096
velo      2    1    2048
gemeinde  2    1    2048
"

while read -r member vms cpu memory; do
  [ -n "$member" ] || continue
  quota=$(mktemp)
  printf 'VM = [ VMS = "%s", CPU = "%s", MEMORY = "%s" ]\n' "$vms" "$cpu" "$memory" >"$quota"
  onegroup quota "$member" "$quota"
  rm -f "$quota"
  echo "$member: $vms VMs, $cpu CPU, $memory MB"
done <<<"$QUOTAS"
