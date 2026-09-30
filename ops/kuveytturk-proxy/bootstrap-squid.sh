#!/usr/bin/env bash
set -euo pipefail

if [[ $# -ne 3 ]]; then
  echo "Usage: sudo $0 <proxy-domain> <letsencrypt-email> <proxy-username>" >&2
  exit 64
fi

if [[ ${EUID} -ne 0 ]]; then
  echo "Run this script with sudo/root." >&2
  exit 1
fi

PROXY_DOMAIN="$1"
LE_EMAIL="$2"
PROXY_USERNAME="$3"
SQUID_USER="proxy"
SQUID_GROUP="proxy"
TLS_DIR="/etc/squid/tls"
SQUID_CONF="/etc/squid/squid.conf"
PASSWD_FILE="/etc/squid/passwd"

export DEBIAN_FRONTEND=noninteractive
apt-get update
apt-get install -y squid apache2-utils certbot ca-certificates curl

if ! getent passwd "${SQUID_USER}" >/dev/null; then
  echo "Expected Squid service user '${SQUID_USER}' was not found." >&2
  exit 1
fi

echo
printf 'Creating proxy password for user %s. The password is not echoed or stored in this script.\n' "${PROXY_USERNAME}"
htpasswd -B -c "${PASSWD_FILE}" "${PROXY_USERNAME}"
chown root:"${SQUID_GROUP}" "${PASSWD_FILE}"
chmod 0640 "${PASSWD_FILE}"

echo
printf 'Requesting TLS certificate for %s. DNS must already point to this Droplet Reserved IPv4.\n' "${PROXY_DOMAIN}"
systemctl stop squid || true
certbot certonly \
  --standalone \
  --non-interactive \
  --agree-tos \
  --email "${LE_EMAIL}" \
  -d "${PROXY_DOMAIN}"

install -d -o "${SQUID_USER}" -g "${SQUID_GROUP}" -m 0750 "${TLS_DIR}"
install -o "${SQUID_USER}" -g "${SQUID_GROUP}" -m 0640 \
  "/etc/letsencrypt/live/${PROXY_DOMAIN}/fullchain.pem" "${TLS_DIR}/fullchain.pem"
install -o "${SQUID_USER}" -g "${SQUID_GROUP}" -m 0640 \
  "/etc/letsencrypt/live/${PROXY_DOMAIN}/privkey.pem" "${TLS_DIR}/privkey.pem"

cp -a "${SQUID_CONF}" "${SQUID_CONF}.bak.$(date +%Y%m%d%H%M%S)"
cat > "${SQUID_CONF}" <<'SQUID'
https_port 443 tls-cert=/etc/squid/tls/fullchain.pem tls-key=/etc/squid/tls/privkey.pem

# Authentication is required for every proxy tunnel.
auth_param basic program /usr/lib/squid/basic_ncsa_auth /etc/squid/passwd
auth_param basic realm MedineHuzur-POS-Egress
auth_param basic credentialsttl 5 minutes
acl authenticated proxy_auth REQUIRED

# This proxy is intentionally limited to HTTPS CONNECT traffic to Kuveyt Turk only.
acl CONNECT method CONNECT
acl SSL_ports port 443
acl kuveytturk dstdomain sanalpos.kuveytturk.com.tr boatest.kuveytturk.com.tr

http_access deny !CONNECT
http_access deny !SSL_ports
http_access allow authenticated kuveytturk
http_access deny all

# CONNECT payload stays end-to-end encrypted between the .NET client and the bank.
# Disable caching and request access logging for this dedicated payment egress proxy.
cache deny all
access_log none

visible_hostname medinehuzur-pos-proxy
SQUID

cat > /etc/letsencrypt/renewal-hooks/deploy/medinehuzur-squid-cert.sh <<'HOOK'
#!/usr/bin/env sh
set -eu
install -o proxy -g proxy -m 0640 "$RENEWED_LINEAGE/fullchain.pem" /etc/squid/tls/fullchain.pem
install -o proxy -g proxy -m 0640 "$RENEWED_LINEAGE/privkey.pem" /etc/squid/tls/privkey.pem
systemctl reload squid
HOOK
chmod 0750 /etc/letsencrypt/renewal-hooks/deploy/medinehuzur-squid-cert.sh

squid -k parse
systemctl enable squid
systemctl restart squid

cat <<EOF2

Proxy setup completed.

Next checks:
  1. Ensure TCP 443 is allowed to this Droplet. Keep TCP 80 reachable for Let's Encrypt renewal.
  2. Verify the proxy certificate:
       openssl s_client -connect ${PROXY_DOMAIN}:443 -servername ${PROXY_DOMAIN} </dev/null
  3. Verify the Droplet's outbound IPv4 is the DigitalOcean Reserved IPv4:
       curl -4 https://icanhazip.com/
  4. Do NOT paste the proxy password into chat or commit it to Git.

Render variables to set after validation:
  KUVEYTTURK_PROXY_URL=https://${PROXY_DOMAIN}:443
  KUVEYTTURK_PROXY_USERNAME=${PROXY_USERNAME}
  KUVEYTTURK_PROXY_PASSWORD=<the password you just created>
EOF2
