#!/usr/bin/env bash

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

useradd -r \
  -g vkpaints \
  -d /var/www/vkpaints \
  -s /usr/sbin/nologin \
  -c "VK-Paints Service User" \
  vkpaints || true

mkdir -p /var/www/vkpaints

echo "[3/4] Cloning repository..."
rm -rf /tmp/vkpaints

git clone https://github.com/Shubha-KA/vk-paints-web-app.git /tmp/vkpaints

echo "[4/4] Deploying and starting all backend microservices..."

declare -A PORTS=(
  ["user-service"]="3001"
  ["product-service"]="3002"
  ["order-service"]="3004"
  ["retailer-service"]="3005"
  ["quotation-service"]="3006"
)

services=(
  user-service
  product-service
  order-service
  retailer-service
  quotation-service
)

for svc in "${services[@]}"; do

  echo "======================================================================"
  echo ">>> Bootstrapping $svc"
  echo "======================================================================"

  rm -rf "/var/www/vkpaints/$svc"

  mkdir -p "/var/www/vkpaints/$svc"

  cp -r "/tmp/vkpaints/$svc/"* "/var/www/vkpaints/$svc/"

  cd "/var/www/vkpaints/$svc"

  echo "Installing dependencies for $svc..."

  npm install --unsafe-perm
  npm install pg --unsafe-perm

  PORT=${PORTS[$svc]}

  echo "Creating environment file..."

  cat <<EOF > .env
PORT=$PORT
DB_URL=postgres://DB_USER:DB_PASS@DB_HOST:5432/${svc}_db?sslmode=require
JWT_SECRET=supersecret123
ADMIN_EMAIL=admin@vkpaints.com
ADMIN_PASSWORD=adminpass123
NODE_ENV=production
EOF

  chown -R vkpaints:vkpaints "/var/www/vkpaints/$svc"

  echo "Creating systemd service..."

  cat <<EOF > /etc/systemd/system/vkpaints-$svc.service
[Unit]
Description=VK-Paints $svc Engine
After=network.target

[Service]
Type=simple
User=vkpaints
Group=vkpaints
WorkingDirectory=/var/www/vkpaints/$svc
EnvironmentFile=/var/www/vkpaints/$svc/.env
ExecStart=/usr/bin/node index.js
Restart=always
RestartSec=5

[Install]
WantedBy=multi-user.target
EOF

  systemctl daemon-reload

  systemctl enable "vkpaints-$svc"

  systemctl restart "vkpaints-$svc"

  echo ">>> $svc started successfully on port $PORT"

done

echo "======================================================================"
echo " Backend bootstrap completed successfully!"
echo "======================================================================"

echo "Check service status using:"
echo "systemctl status vkpaints-user-service"
echo "systemctl status vkpaints-product-service"

echo "Check logs using:"
echo "journalctl -u vkpaints-user-service -f"