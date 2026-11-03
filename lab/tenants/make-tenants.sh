#!/bin/bash
# Creates the four members of Wolkenwerk Bern as groups with an admin each and a VDC for them,
# the steps of chapter 3.1. Run it as your user on the front-end, it may run again.
#
#   ~/cc/lab/tenants/make-tenants.sh
#
# The passwords of the group admins are generated once and kept in ~/cc-lab/tenants/.
set -euo pipefail

MEMBERS=(praxis treuhand velo gemeinde)
VDC=wolkenwerk
PASS_DIR=~/cc-lab/tenants
mkdir -p "$PASS_DIR"
chmod 700 "$PASS_DIR"

for member in "${MEMBERS[@]}"; do
  if ! onegroup show "$member" >/dev/null 2>&1; then
    pass_file="$PASS_DIR/$member-admin.pass"
    [ -f "$pass_file" ] || (umask 077 && openssl rand -base64 12 | tr -d '/+=' >"$pass_file")
    # Group users may create VMs, images, templates and documents, OneFlow services are documents
    onegroup create --name "$member" --admin_user "$member-admin" --admin_password "$(cat "$pass_file")" \
      --resources "VM+IMAGE+TEMPLATE+DOCUMENT" >/dev/null
    echo "group $member with admin $member-admin created"
  fi
done

# Every new group lands in the VDC default, which grants all clusters to every group.
# The members get their own VDC instead, so the platform team decides what they see.
onevdc show "$VDC" >/dev/null 2>&1 || onevdc create "$VDC" >/dev/null
for member in "${MEMBERS[@]}"; do
  gid=$(onegroup show "$member" --json | python3 -c 'import json,sys; print(json.load(sys.stdin)["GROUP"]["ID"])')
  onevdc delgroup default "$gid" >/dev/null 2>&1 || true
  onevdc addgroup "$VDC" "$gid" >/dev/null 2>&1 || true
done
# Zone 0 and cluster 0 hold both nodes, cc-net and the datastores of the lab
onevdc addcluster "$VDC" 0 0 >/dev/null 2>&1 || true

# The members may use the course template and its image, but not change them
onetemplate chmod ubuntu 604
oneimage chmod ubuntu-26.04 604

onevdc show "$VDC" | sed -n '/GROUPS/,$p'
