#!/usr/bin/env bash

set -e

if [ "$#" -lt 3 ]; then
    echo "Error: Database credentials must be provided."
    echo "Usage: $0 <DB_HOST> <DB_USER> <DB_PASS>"
    echo "Example: $0 vkpaints-pg-server.postgres.database.azure.com vkadmin Admin@123!"
    exit 1
fi

DB_HOST=$1
DB_USER=$2
DB_PASS=$3

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

# Ensure the databases exist on Azure PostgreSQL
echo "Ensuring databases exist on PostgreSQL..."
mkdir -p /tmp/db-init
cd /tmp/db-init
npm init -y >/dev/null
npm install pg --unsafe-perm >/dev/null

cat << 'EOF' > init-dbs.js
const { Client } = require('pg');
const dbHost = process.argv[2];
const dbUser = process.argv[3];
const dbPass = process.argv[4];

const client = new Client({
  host: dbHost,
  user: dbUser,
  password: dbPass,
  database: 'postgres',
  port: 5432,
  ssl: { rejectUnauthorized: false }
});

const dbs = [
  'user-service_db',
  'product-service_db',
  'order-service_db',
  'retailer-service_db',
  'quotation-service_db'
];

async function run() {
  try {
    await client.connect();
    console.log("Connected to database server successfully.");
    for (const db of dbs) {
      const res = await client.query("SELECT 1 FROM pg_database WHERE datname = $1", [db]);
      if (res.rowCount === 0) {
        console.log(`Creating database: ${db}`);
        await client.query(`CREATE DATABASE "${db}"`);
      } else {
        console.log(`Database already exists: ${db}`);
      }
    }
  } catch (err) {
    console.error("Failed to ensure databases exist:", err);
    process.exit(1);
  } finally {
    await client.end();
  }
}
run();
EOF

node init-dbs.js "$DB_HOST" "$DB_USER" "$DB_PASS"

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

  # URL-encode credentials for DB_URL connection string
  ENCODED_USER=$(node -e "console.log(encodeURIComponent(process.argv[1]))" "$DB_USER")
  ENCODED_PASS=$(node -e "console.log(encodeURIComponent(process.argv[1]))" "$DB_PASS")

  cat <<EOF > .env
PORT=$PORT
DB_URL=postgres://${ENCODED_USER}:${ENCODED_PASS}@${DB_HOST}:5432/${svc}_db?sslmode=require
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