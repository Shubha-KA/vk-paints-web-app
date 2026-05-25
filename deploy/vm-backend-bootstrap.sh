#!/usr/bin/env bash
# ==============================================================================
# VK-Paints Backend VM Bootstrap Script
# Target OS: Ubuntu 22.04 LTS / Debian-based
# ==============================================================================

# Exit immediately if a command exits with a non-zero status
set -e

echo "======================================================================"
echo " Bootstrapping Backend VM & Microservices"
echo "======================================================================"

echo "[1/4] Installing system packages..."
apt-get update -y
apt-get install -y curl git build-essential

echo "Installing Node.js 20..."
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt-get install -y nodejs

echo "[2/4] Configuring isolated service user..."
groupadd vkpaints || true
useradd -r -g vkpaints -d /var/www/vkpaints -s /sbin/nologin -c "VK-Paints Service User" vkpaints || true
mkdir -p /var/www/vkpaints

echo "[3/4] Cloning repository..."
rm -rf /tmp/vkpaints
git clone https://github.com/shubha-ka/VK-Paints.git /tmp/vkpaints

echo "[4/4] Deploying and starting all backend microservices..."

# Declare associative array for ports
declare -A PORTS=( ["user-service"]="3001" ["product-service"]="3002" ["order-service"]="3004" ["retailer-service"]="3005" ["quotation-service"]="3006" )

for svc in user-service product-service order-service retailer-service quotation-service; do
  echo ">>> Bootstrapping \$svc"
  cp -r /tmp/vkpaints/\$svc /var/www/vkpaints/\$svc
  cd /var/www/vkpaints/\$svc
  
  # Install dependencies
  npm install --unsafe-perm
  npm install pg --unsafe-perm
  
  PORT=\${PORTS[\$svc]}
  
  # IMPORTANT: Replace DB_HOST, DB_USER, and DB_PASS with your actual Azure PostgreSQL credentials
  cat << EOF > .env
PORT=\$PORT
DB_URL=postgres://DB_USER:DB_PASS@DB_HOST:5432/\${svc}_db?sslmode=require
JWT_SECRET=supersecret123
ADMIN_EMAIL=admin@vkpaints.com
ADMIN_PASSWORD=adminpass123
NODE_ENV=production
EOF
  
  # Ensure permissions
  chown -R vkpaints:vkpaints /var/www/vkpaints/\$svc
  
  # Setup Systemd daemon
  cat << EOF > /etc/systemd/system/vkpaints-\$svc.service
[Unit]
Description=VK-Paints \$svc Engine
After=network.target

[Service]
Type=simple
User=vkpaints
Group=vkpaints
WorkingDirectory=/var/www/vkpaints/\$svc
EnvironmentFile=/var/www/vkpaints/\$svc/.env
ExecStart=/usr/bin/node index.js
Restart=always
RestartSec=5
StandardOutput=syslog
StandardError=syslog
SyslogIdentifier=vkpaints-\$svc

[Install]
WantedBy=multi-user.target
EOF
  
  # Enable and start the service
  systemctl daemon-reload
  systemctl enable vkpaints-\$svc
  systemctl start vkpaints-\$svc
  echo ">>> \$svc configured and started on port \$PORT."
done

echo "======================================================================"
echo " Backend bootstrap completed successfully!"
echo " You can check logs using: journalctl -u vkpaints-<service> -f"
echo "======================================================================"
