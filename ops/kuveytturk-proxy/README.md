# Kuveyt Turk Static Egress Proxy

This directory contains the operational setup for routing only Kuveyt Turk payment traffic through a stable DigitalOcean Reserved IPv4.

## Architecture

```text
Browser
  -> medinehuzur.com
  -> Render backend
  -> HTTPS proxy tunnel on DigitalOcean
  -> Kuveyt Turk
```

The proxy uses HTTPS CONNECT. Squid does not terminate the TLS session between the .NET payment client and Kuveyt Turk, so the tunneled bank payload is not decrypted by Squid.

## 1. Create the Droplet

Recommended low-cost production starting point:

- Region: Frankfurt (`fra1`)
- Image: Ubuntu 24.04 LTS
- Plan: Basic
- Size: 1 vCPU / 512 MiB / 10 GiB (`s-1vcpu-512mb-10gb`)
- Backups: optional; not required for this stateless proxy
- Authentication: SSH key preferred

Keep the Droplet dedicated to payment egress.

## 2. Create and assign a Reserved IPv4

Create one DigitalOcean Reserved IPv4 in the same region and assign it to the Droplet.

The bank should eventually whitelist the **Reserved IPv4**, not the Droplet's ordinary public IPv4.

### Route outbound traffic through the Reserved IPv4

After assigning the Reserved IPv4, get the anchor gateway:

```bash
curl -s http://169.254.169.254/metadata/v1/interfaces/public/0/anchor_ipv4/gateway
```

Use that value as the default gateway:

```bash
sudo sh -c "ip route del 0/0; ip route add default via <anchor-gateway-IP-address> dev eth0"
```

Verify:

```bash
curl -4 https://icanhazip.com/
```

The output **must equal the Reserved IPv4** before sending the IP to Kuveyt Turk.

The command above is not persistent across reboot. For Ubuntu 20.04+ DigitalOcean documents persisting it by disabling cloud-init network rewriting and updating the default route in `/etc/netplan/50-cloud-init.yaml` to the anchor gateway. Follow the current DigitalOcean Reserved IP outbound-routing documentation before production use.

After reboot, run `curl -4 https://icanhazip.com/` again and confirm it still returns the Reserved IPv4.

## 3. DNS

Create an A record such as:

```text
pos-proxy.medinehuzur.com -> <Reserved IPv4>
```

If the DNS provider has an HTTP/CDN proxy mode (for example an orange-cloud style proxy), keep this record **DNS-only**. The connection must reach the Droplet directly.

Wait until the name resolves to the Reserved IPv4.

## 4. Firewall

Allow only the ports needed for administration, certificate renewal, and the secure proxy:

```bash
sudo ufw allow OpenSSH
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw enable
```

Do not expose Squid's default plain-text port 3128.

## 5. Install the secure proxy

Copy `bootstrap-squid.sh` to the Droplet and run:

```bash
sudo bash bootstrap-squid.sh \
  pos-proxy.medinehuzur.com \
  <letsencrypt-contact-email> \
  medinehuzur
```

The script prompts interactively for the proxy password using `htpasswd`. Do not paste that password into chat, source control, shell scripts, or screenshots.

The generated Squid policy:

- requires proxy authentication
- accepts only CONNECT
- accepts only destination port 443
- allows only `sanalpos.kuveytturk.com.tr` and `boatest.kuveytturk.com.tr`
- denies every other destination
- disables proxy caching
- disables request access logging
- uses a normal public TLS certificate on the Render-to-proxy connection

## 6. Verify the proxy

Check TLS:

```bash
openssl s_client \
  -connect pos-proxy.medinehuzur.com:443 \
  -servername pos-proxy.medinehuzur.com \
  </dev/null
```

Check service state:

```bash
sudo systemctl status squid --no-pager
sudo squid -k parse
```

Do not perform repeated payment attempts merely to test routing.

## 7. Render configuration

The application reads these variables only for the Kuveyt Turk typed HttpClient:

```text
KUVEYTTURK_PROXY_URL=https://pos-proxy.medinehuzur.com:443
KUVEYTTURK_PROXY_USERNAME=medinehuzur
KUVEYTTURK_PROXY_PASSWORD=<secret>
```

If `KUVEYTTURK_PROXY_URL` is absent, the application uses a direct connection.

The implementation rejects non-HTTPS proxy URLs and rejects credentials embedded in the proxy URL.

## 8. Bank allowlist

Only after the Droplet itself reports the Reserved IPv4 as its outbound address should that single IPv4 be sent to Kuveyt Turk for the merchant IP allowlist.

Do not send:

- the Droplet's ordinary temporary IPv4
- the old Render CIDR base addresses
- a CIDR block

## 9. Controlled live verification

After:

1. Reserved IPv4 is persistent after reboot,
2. Squid is healthy,
3. the proxy TLS certificate is valid,
4. Render proxy variables are configured,
5. Kuveyt Turk confirms the Reserved IPv4 is allowlisted,

use the existing guarded 1 TL smoke flow.

If 3D authentication/provisioning reaches an ambiguous state, do not automatically retry the charge. Preserve the existing ReviewRequired/provisioning safety behavior.
