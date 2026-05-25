# V K Paints Selection & Ordering Platform

This is a complete end-to-end web application designed with a clean microservices architecture. It consists of a React Frontend and highly optimized Node.js Backend services that are designed to be deployed directly on Virtual Machines (VMs) using automated bootstrap scripts.

## Core Microservices
- **User Service**: Authentication and role-based access control (runs on port `3001`).
- **Product Service**: Manages the paint catalog and metadata (runs on port `3002`).
- **Quotation Service**: Stateless service to compute paint requirements and costs (runs on port `3003`).
- **Order Service**: Placements and transaction logs (runs on port `3004`).
- **Retailer Service**: Finds nearby stores using geolocations (runs on port `3005`).
- **Frontend**: React (Vite) single-page application served via Nginx, which also acts as the lightweight reverse proxy and API Gateway.

## Technologies Used
- Node.js & Express
- React (Vite)
- PostgreSQL
- Nginx (Web Server and Reverse Proxy Gateway)

---

## Deployment on Virtual Machines (Ubuntu / Debian)

All necessary automated provisioning files are located in the `deploy/` directory:

1. **Database VM Bootstrap (`deploy/db-bootstrap.sh`)**:
   Installs PostgreSQL, configures remote authorization rules, and initializes `product_db`, `order_db`, and `retailer_db`.
   ```bash
   sudo ./db-bootstrap.sh "your_secure_password"
   ```

2. **Microservices VM Bootstrap (`deploy/service-bootstrap.sh`)**:
   Installs Node.js v20 LTS, sets up a secure service user `vkpaints`, establishes dynamic Systemd service daemons, and starts services with auto-restart functionality.
   ```bash
   sudo ./service-bootstrap.sh <service-name> <port> <db-url>
   ```

3. **Frontend Nginx VM Bootstrap (`deploy/frontend-bootstrap.sh`)**:
   Compiles React static bundles and configures Nginx to host the SPA while routing API requests matching `/users`, `/products`, `/orders`, and `/retailers` directly to their respective VM service IPs.
   ```bash
   sudo ./frontend-bootstrap.sh <USER-VM-IP> <PRODUCT-VM-IP> <ORDER-VM-IP> <RETAILER-VM-IP>
   ```

Refer to the [walkthrough.md](file:///C:/Users/Admin/.gemini/antigravity-ide/brain/2b43880f-f5a1-4b5e-a906-06a3db9956e2/walkthrough.md) artifact for a step-by-step VM deployment walkthrough.
