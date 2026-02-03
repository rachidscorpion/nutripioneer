# NutriPioneer Deployment Guide

This guide covers how to deploy the NutriPioneer application to a Hetzner VPS (or any Ubuntu server) and set up automated CI/CD using GitHub Actions.

## Prerequisites

- A **Hetzner Cloud Server** (Ubuntu 22.04 or 24.04 recommended).
- A **Domain Name** pointed to your server's IP address (A Record).
- **GitHub Repository** for your project.

---

## Part 1: Server Provisioning

1.  **SSH into your server**:
    ```bash
    ssh root@<YOUR_SERVER_IP>
    ```

2.  **Update and Install Dependencies**:
    ```bash
    apt update && apt upgrade -y
    apt install -y curl git ufw
    ```

3.  **Install Docker & Docker Compose**:
    ```bash
    curl -fsSL https://get.docker.com -o get-docker.sh
    sh get-docker.sh
    ```

4.  **Setup Firewall (UFW)**:
    ```bash
    ufw allow 22/tcp
    ufw allow 80/tcp
    ufw allow 443/tcp
    ufw enable
    ```

---

## Part 2: Manual Deployment (First Run)

1.  **Clone the Repository**:
    ```bash
    cd ~
    git clone https://github.com/yourusername/nutripioneer.git
    cd nutripioneer
    ```

2.  **Environment Variables**:
     Create a `.env` file in the `backend` directory (and frontend if needed, though most are baked in or runtime).
     ```bash
     nano backend/.env
     ```
     Add your secrets (DATABASE_URL, BETTER_AUTH_SECRET, OPENAI_API_KEY, etc.).

     **Important**: Before starting, create a `.env` file in the project root with your domain name:
     ```bash
     echo "DOMAIN_NAME=yourdomain.com" > .env
     ```

3.  **Start the Application**:
    ```bash
    docker compose -f docker-compose.prod.yml up -d --build
    ```

4.  **SSL Certificates (Certbot)**:
     On the first run, Nginx will fail because certificates don't exist yet. Follow these steps:

     **Step 1 - Update nginx.conf**: Replace `yourdomain.com` with your actual domain in nginx.conf (lines 16, 23, 66)

     **Step 2 - Temporarily disable SSL**: Comment out the HTTPS server block (lines 21-79 in nginx.conf) and the redirect (lines 17-19) so Nginx serves HTTP only

     **Step 3 - Start services**:
     ```bash
     docker compose -f docker-compose.prod.yml up -d
     ```

     **Step 4 - Generate certificates**:
     ```bash
     docker compose -f docker-compose.prod.yml run --rm certbot certonly --webroot --webroot-path /var/www/certbot -d nutripioneer.com -d www.nutripioneer.com
     ```

     **Step 5 - Restore nginx.conf**: Uncomment the SSL sections and restart Nginx:
     ```bash
     docker compose -f docker-compose.prod.yml restart nginx
     ```

     The certbot container will automatically renew certificates every 12 hours.

---

## Part 3: CI/CD Setup (GitHub Actions)

We have created a workflow in `.github/workflows/deploy.yml` that automates deployment.

1.  **Generate SSH Keys**:
    On your local machine (or the server), generate a new keypair:
    ```bash
    ssh-keygen -t ed25519 -C "github-actions"
    ```

2.  **Add Public Key to Server**:
    Copy the public key (`.pub`) content and append it to `~/.ssh/authorized_keys` on your Hetzner server.

3.  **Configure GitHub Secrets**:
     Go to your GitHub Repo -> Settings -> Secrets and variables -> Actions -> New repository secret.
     Add the following:
     
     | Name | Value |
     |------|-------|
     | `HOST` | Your server IP address |
     | `USERNAME` | `root` (or your sudo user) |
     | `SSH_KEY` | The **Private Key** you generated in step 1 |
     | `GH_TOKEN` | Your GitHub Personal Access Token (with `read:packages` and `write:packages` scopes) |

     To create a GH_TOKEN:
     - Go to GitHub Settings -> Developer settings -> Personal access tokens -> Tokens (classic)
     - Generate new token (classic)
     - Select `read:packages` and `write:packages` scopes
     - Copy and add as a secret

4.  **Trigger Deployment**:
     Push a commit to the `main` branch. The action will:
     - Build Docker images.
     - Push them to GitHub Container Registry (ghcr.io).
     - SSH into your server.
     - Pull the new images.
     - Restart the services.
     - Run database migrations automatically.

     **Note**: The GitHub workflow uses `GITHUB_TOKEN` by default, but we recommend creating a custom `GH_TOKEN` secret with `read:packages` and `write:packages` scopes for better control.

---

## Troubleshooting

-   **Database**: This setup uses SQLite (`dev.db`). For production, ensure the volume `./backend/prisma/dev.db:/app/prisma/dev.db` is correctly mapped so you don't lose data.
-   **Database Migrations**: If migrations don't run automatically, manually run:
    ```bash
    docker compose -f docker-compose.prod.yml exec backend npx prisma migrate deploy
    ```
-   **Logs**: Check logs with `docker compose -f docker-compose.prod.yml logs -f`.
-   **Permissions**: If using `ghcr.io`, you might need to run `docker login ghcr.io -u <GITHUB_USERNAME> -p <GITHUB_TOKEN>` once on the server if the automated script fails to authenticate.
-   **Domain Configuration**: Remember to replace `yourdomain.com` with `nutripioneer.com` in `nginx.conf` (lines 16, 23, 66) before starting.
