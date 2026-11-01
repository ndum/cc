#!/bin/bash
# Installs Gitea on the front-end as a systemd service with SQLite, the Git server of chapter 4.4.
# Gitea runs outside the k3s cluster, so that rebuilding the cluster keeps the desired state.
#
#   sudo ~/cc/platform/gitea/install-gitea.sh
#
# The admin "platform" gets a random password, it is stored in ~/cc-lab/gitea/platform.pass of the calling user.
set -euo pipefail

VERSION=${GITEA_VERSION:-28.3.0}
BIN=/usr/local/bin/gitea
# shellcheck source=/dev/null
source /etc/cc-lab.env
OWNER=${SUDO_USER:?run with sudo as your own user}
OWNER_HOME=$(getent passwd "$OWNER" | cut -d: -f6)

# Binary with its published checksum
url="https://dl.gitea.com/gitea/$VERSION/gitea-$VERSION-linux-amd64"
tmp=$(mktemp -d)
curl -fsSL -o "$tmp/gitea" "$url"
echo "$(curl -fsSL "$url.sha256" | cut -d' ' -f1)  $tmp/gitea" | sha256sum -c -
install -m 0755 "$tmp/gitea" "$BIN"
rm -rf "$tmp"

# A system user without login owns the data
id git >/dev/null 2>&1 || adduser --system --shell /bin/bash --group --disabled-password --home /home/git git
install -d -o git -g git -m 0750 /var/lib/gitea /var/lib/gitea/custom /var/lib/gitea/data /var/lib/gitea/log
install -d -o root -g git -m 0770 /etc/gitea

# Configuration without the web installer, HTTP on port 3000 of the front-end, no self-registration
if [ ! -f /etc/gitea/app.ini ]; then
  cat > /etc/gitea/app.ini <<INI
APP_NAME = Wolkenwerk Git
RUN_USER = git
WORK_PATH = /var/lib/gitea

[server]
HTTP_PORT = 3000
ROOT_URL = http://$CC_FE_IP:3000/
DISABLE_SSH = true

[database]
DB_TYPE = sqlite3
PATH = /var/lib/gitea/data/gitea.db

[security]
INSTALL_LOCK = true
SECRET_KEY = $($BIN generate secret SECRET_KEY)
INTERNAL_TOKEN = $($BIN generate secret INTERNAL_TOKEN)

[oauth2]
JWT_SECRET = $($BIN generate secret JWT_SECRET)

[service]
DISABLE_REGISTRATION = true
REQUIRE_SIGNIN_VIEW = true

[repository]
DEFAULT_BRANCH = main

[log]
MODE = file
LEVEL = Info
INI
  chown root:git /etc/gitea/app.ini
  chmod 0640 /etc/gitea/app.ini
fi

cat > /etc/systemd/system/gitea.service <<UNIT
[Unit]
Description=Gitea
After=network.target

[Service]
User=git
Group=git
WorkingDirectory=/var/lib/gitea
ExecStart=$BIN web --config /etc/gitea/app.ini
Restart=always
Environment=USER=git HOME=/home/git GITEA_WORK_DIR=/var/lib/gitea

[Install]
WantedBy=multi-user.target
UNIT
systemctl daemon-reload
systemctl enable --now gitea
until curl -fs -o /dev/null http://localhost:3000/api/healthz; do sleep 2; done

# Admin of the platform team, created once
pass_file="$OWNER_HOME/cc-lab/gitea/platform.pass"
if [ ! -f "$pass_file" ]; then
  install -d -o "$OWNER" -g "$OWNER" -m 0700 "$OWNER_HOME/cc-lab" "$OWNER_HOME/cc-lab/gitea"
  pass=$(openssl rand -hex 16)
  sudo -u git "$BIN" --config /etc/gitea/app.ini admin user create --admin --username platform \
    --email platform@wolkenwerk.example --password "$pass" --must-change-password=false
  install -o "$OWNER" -g "$OWNER" -m 0600 /dev/null "$pass_file"
  echo "$pass" > "$pass_file"
fi
echo "Gitea $VERSION runs on http://$CC_FE_IP:3000/, user platform, password in $pass_file"
