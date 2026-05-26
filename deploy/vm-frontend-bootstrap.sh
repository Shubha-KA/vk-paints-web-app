#!/usr/bin/env bash
# ==============================================================================
# VK-Paints Frontend VM Bootstrap Script
# Target OS: Ubuntu 22.04 LTS / Debian-based
# ==============================================================================

# Exit immediately if a command exits with a non-zero status
set -e

if [ -z "$1" ]; then
    echo "Usage: $0 <BACKEND_VM_IP>"
    echo "Example: $0 10.0.0.10"
    exit 1
fi

BACKEND_IP=$1

echo "======================================================================"
echo " Bootstrapping Frontend VM & Nginx Gateway"
echo "======================================================================"

echo "[1/4] Installing system packages..."
apt-get update -y
apt-get install -y curl git build-essential nginx

echo "Installing Node.js 20..."
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt-get install -y nodejs

echo "[2/4] Cloning repository..."
rm -rf /tmp/vkpaints
git clone https://github.com/Shubha-KA/vk-paints-web-app.git /tmp/vkpaints

mkdir -p /var/www/vkpaints/frontend
cp -r /tmp/vkpaints/frontend/* /var/www/vkpaints/frontend/

echo "[3/4] Building React application..."
cd /var/www/vkpaints/frontend
npm install --unsafe-perm
npm run build

echo "[4/4] Configuring Nginx API Gateway & Static Host..."
cat << EOF > /etc/nginx/sites-available/vkpaints
server {
    listen 80;
    server_name _;
    root /var/www/vkpaints/frontend/dist;
    index index.html;

    location / {
        try_files \$uri \$uri/ /index.html;
    }

    location /users/ {
        proxy_pass http://$BACKEND_IP:3001/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
    }

    location /products/ {
        proxy_pass http://$BACKEND_IP:3002/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
    }

    location /orders/ {
        proxy_pass http://$BACKEND_IP:3004/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
    }

    location /retailers/ {
        proxy_pass http://$BACKEND_IP:3005/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
    }
    
    # Cache static assets
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)\$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
EOF

ln -sf /etc/nginx/sites-available/vkpaints /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default
systemctl restart nginx

echo "======================================================================"
echo " Frontend bootstrap completed successfully!"
echo " Serve path directory: /var/www/vkpaints/frontend/dist"
echo "======================================================================"
