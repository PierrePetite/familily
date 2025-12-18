#!/usr/bin/env bash

# Familily LXC Install Script for Proxmox
# Usage: bash -c "$(curl -fsSL https://raw.githubusercontent.com/PierrePetite/familily/main/scripts/install-lxc.sh)"

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
APP_NAME="familily"
APP_DIR="/opt/familily"
APP_USER="familily"
APP_PORT=3000
NODE_VERSION="20"
REPO_URL="https://github.com/PierrePetite/familily.git"

log_info() { echo -e "${BLUE}[INFO]${NC} $1"; }
log_success() { echo -e "${GREEN}[OK]${NC} $1"; }
log_warn() { echo -e "${YELLOW}[WARN]${NC} $1"; }
log_error() { echo -e "${RED}[ERROR]${NC} $1"; exit 1; }

# Banner
echo -e "${BLUE}"
echo "╔═══════════════════════════════════════════╗"
echo "║     Familily - Family Calendar App        ║"
echo "║         LXC Installation Script           ║"
echo "╚═══════════════════════════════════════════╝"
echo -e "${NC}"

# Check if running as root
if [[ $EUID -ne 0 ]]; then
   log_error "This script must be run as root"
fi

# Detect OS
if [ -f /etc/debian_version ]; then
    OS="debian"
    log_info "Detected Debian/Ubuntu"
elif [ -f /etc/alpine-release ]; then
    OS="alpine"
    log_info "Detected Alpine Linux"
else
    log_error "Unsupported OS. This script supports Debian/Ubuntu and Alpine."
fi

# Update system
log_info "Updating system packages..."
if [ "$OS" = "debian" ]; then
    apt-get update -qq
    apt-get upgrade -y -qq
elif [ "$OS" = "alpine" ]; then
    apk update && apk upgrade
fi

# Install dependencies
log_info "Installing dependencies..."
if [ "$OS" = "debian" ]; then
    apt-get install -y -qq curl git openssl ca-certificates

    # Install Node.js via NodeSource
    if ! command -v node &> /dev/null; then
        log_info "Installing Node.js ${NODE_VERSION}..."
        curl -fsSL https://deb.nodesource.com/setup_${NODE_VERSION}.x | bash -
        apt-get install -y -qq nodejs
    fi
elif [ "$OS" = "alpine" ]; then
    apk add --no-cache curl git openssl nodejs npm
fi

log_success "Node.js $(node -v) installed"
log_success "npm $(npm -v) installed"

# Create application user
log_info "Creating application user..."
if [ "$OS" = "debian" ]; then
    id -u $APP_USER &>/dev/null || useradd -r -s /bin/false -m -d $APP_DIR $APP_USER
elif [ "$OS" = "alpine" ]; then
    id -u $APP_USER &>/dev/null || adduser -D -h $APP_DIR -s /sbin/nologin $APP_USER
fi

# Clone or update repository
if [ -d "$APP_DIR/.git" ]; then
    log_info "Updating existing installation..."
    cd $APP_DIR
    su - $APP_USER -s /bin/bash -c "cd $APP_DIR && git pull origin main"
else
    log_info "Cloning repository..."
    rm -rf $APP_DIR
    git clone $REPO_URL $APP_DIR
    chown -R $APP_USER:$APP_USER $APP_DIR
fi

cd $APP_DIR

# Install npm dependencies
log_info "Installing npm dependencies (this may take a few minutes)..."
su - $APP_USER -s /bin/bash -c "cd $APP_DIR && npm ci --silent"

# Generate Prisma client
log_info "Generating Prisma client..."
su - $APP_USER -s /bin/bash -c "cd $APP_DIR && npx prisma generate"

# Build application
log_info "Building application (this may take a few minutes)..."
su - $APP_USER -s /bin/bash -c "cd $APP_DIR && npm run build"

# Create data directory
mkdir -p $APP_DIR/data
chown $APP_USER:$APP_USER $APP_DIR/data

# Generate secrets
NEXTAUTH_SECRET=$(openssl rand -base64 32)

# Create environment file
log_info "Creating environment file..."
cat > $APP_DIR/.env.local << EOF
DATABASE_URL="file:$APP_DIR/data/familily.db"
NEXTAUTH_SECRET="$NEXTAUTH_SECRET"
NEXTAUTH_URL="http://localhost:$APP_PORT"
EOF
chown $APP_USER:$APP_USER $APP_DIR/.env.local
chmod 600 $APP_DIR/.env.local

# Initialize database
log_info "Initializing database..."
su - $APP_USER -s /bin/bash -c "cd $APP_DIR && npx prisma db push"

# Create systemd service (Debian) or OpenRC service (Alpine)
if [ "$OS" = "debian" ]; then
    log_info "Creating systemd service..."
    cat > /etc/systemd/system/familily.service << EOF
[Unit]
Description=Familily - Family Calendar App
After=network.target

[Service]
Type=simple
User=$APP_USER
Group=$APP_USER
WorkingDirectory=$APP_DIR
ExecStart=/usr/bin/npm start
Restart=on-failure
RestartSec=10
Environment=NODE_ENV=production
Environment=PORT=$APP_PORT

[Install]
WantedBy=multi-user.target
EOF

    systemctl daemon-reload
    systemctl enable familily
    systemctl start familily

elif [ "$OS" = "alpine" ]; then
    log_info "Creating OpenRC service..."
    cat > /etc/init.d/familily << 'EOF'
#!/sbin/openrc-run

name="familily"
description="Familily - Family Calendar App"
command="/usr/bin/npm"
command_args="start"
command_user="familily"
directory="/opt/familily"
pidfile="/run/${RC_SVCNAME}.pid"
command_background="yes"

depend() {
    need net
}
EOF
    chmod +x /etc/init.d/familily
    rc-update add familily default
    rc-service familily start
fi

# Get IP address
IP_ADDR=$(hostname -I | awk '{print $1}')

# Done!
echo ""
echo -e "${GREEN}╔═══════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║      Installation Complete!               ║${NC}"
echo -e "${GREEN}╚═══════════════════════════════════════════╝${NC}"
echo ""
echo -e "Access Familily at: ${BLUE}http://${IP_ADDR}:${APP_PORT}${NC}"
echo ""
echo -e "Useful commands:"
echo -e "  ${YELLOW}systemctl status familily${NC}  - Check status"
echo -e "  ${YELLOW}systemctl restart familily${NC} - Restart app"
echo -e "  ${YELLOW}journalctl -u familily -f${NC}  - View logs"
echo ""
echo -e "Configuration: ${YELLOW}$APP_DIR/.env.local${NC}"
echo -e "Database:      ${YELLOW}$APP_DIR/data/familily.db${NC}"
echo ""
log_success "Setup complete! Open the URL above to start the setup wizard."
