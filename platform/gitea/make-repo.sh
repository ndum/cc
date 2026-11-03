#!/bin/bash
# Creates the organisation wolkenwerk and its private repo platform in Gitea, and a token that may only read it.
#
#   ~/cc/platform/gitea/make-repo.sh
#
# The token for Argo CD is stored in ~/cc-lab/gitea/argocd.token, the token of the platform team in platform.token.
set -euo pipefail

# shellcheck source=/dev/null
source /etc/cc-lab.env
API="http://$CC_FE_IP:3000/api/v1"
DIR=~/cc-lab/gitea
AUTH="platform:$(cat "$DIR/platform.pass")"

api() {
  curl -fsS -u "$AUTH" -H "Content-Type: application/json" "$@"
}

# Organisation and repo, both only once
api -o /dev/null "$API/orgs/wolkenwerk" 2>/dev/null ||
  api -o /dev/null -X POST "$API/orgs" -d '{"username": "wolkenwerk", "visibility": "private"}'
api -o /dev/null "$API/repos/wolkenwerk/platform" 2>/dev/null ||
  api -o /dev/null -X POST "$API/orgs/wolkenwerk/repos" -d '{"name": "platform", "private": true, "default_branch": "main"}'

# Tokens are shown only once, so they are written right away
token() {
  local name=$1 scopes=$2 file="$DIR/$1.token"
  [ -f "$file" ] && return
  install -m 0600 /dev/null "$file"
  api -X POST "$API/users/platform/tokens" -d "{\"name\": \"$name\", \"scopes\": $scopes}" |
    python3 -c 'import json, sys; print(json.load(sys.stdin)["sha1"])' > "$file"
}
token platform '["write:repository", "write:organization"]'
token argocd '["read:repository"]'

echo "Repo http://$CC_FE_IP:3000/wolkenwerk/platform.git, tokens in $DIR"
