#!/usr/bin/env bash

# Familily Proxmox LXC Creator Script
# Run this ON your Proxmox host (not inside an LXC)
# Usage: bash -c "$(curl -fsSL https://raw.githubusercontent.com/PierrePetite/familily/main/scripts/create-lxc.sh)"

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Default configuration
CTID="${CTID:-auto}"
HOSTNAME="${HOSTNAME:-familily}"
DISK_SIZE="${DISK_SIZE:-4}"
RAM="${RAM:-1024}"
CORES="${CORES:-2}"
STORAGE="${STORAGE:-local-lvm}"
TEMPLATE="debian-12-standard"
APP_PORT=3000

log_info() { echo -e "${BLUE}[INFO]${NC} $1"; }
log_success() { echo -e "${GREEN}[OK]${NC} $1"; }
log_error() { echo -e "${RED}[ERROR]${NC} $1"; exit 1; }

# Banner
echo -e "${BLUE}"
echo "╔═══════════════════════════════════════════╗"
echo "║     Familily - Proxmox LXC Creator        ║"
echo "╚═══════════════════════════════════════════╝"
echo -e "${NC}"

# Check if running on Proxmox
if ! command -v pct &> /dev/null; then
    log_error "This script must be run on a Proxmox host"
fi

# Get next available CTID if auto
if [ "$CTID" = "auto" ]; then
    CTID=$(pvesh get /cluster/nextid)
    log_info "Using next available CTID: $CTID"
fi

# Check if template exists, download if not
TEMPLATE_PATH=$(pveam list $STORAGE 2>/dev/null | grep -o "${TEMPLATE}.*\.tar\.\(gz\|zst\)" | head -1 || true)

if [ -z "$TEMPLATE_PATH" ]; then
    log_info "Downloading Debian 12 template..."
    pveam update
    TEMPLATE_FILE=$(pveam available --section system | grep "debian-12-standard" | awk '{print $2}' | head -1)
    pveam download $STORAGE $TEMPLATE_FILE
    TEMPLATE_PATH=$TEMPLATE_FILE
fi

log_info "Using template: $TEMPLATE_PATH"

# Create LXC container
log_info "Creating LXC container (CTID: $CTID)..."
pct create $CTID ${STORAGE}:vztmpl/${TEMPLATE_PATH} \
    --hostname $HOSTNAME \
    --memory $RAM \
    --cores $CORES \
    --rootfs ${STORAGE}:${DISK_SIZE} \
    --net0 name=eth0,bridge=vmbr0,ip=dhcp \
    --unprivileged 1 \
    --features nesting=1 \
    --onboot 1 \
    --start 0

log_success "Container created"

# Start container
log_info "Starting container..."
pct start $CTID
sleep 5

# Wait for network
log_info "Waiting for network..."
for i in {1..30}; do
    if pct exec $CTID -- ping -c 1 google.com &>/dev/null; then
        break
    fi
    sleep 2
done

# Run install script inside container
log_info "Running Familily installation inside container..."
pct exec $CTID -- bash -c "apt-get update -qq && apt-get install -y -qq curl"
pct exec $CTID -- bash -c "curl -fsSL https://raw.githubusercontent.com/PierrePetite/familily/main/scripts/install-lxc.sh | bash"

# Get container IP
CONTAINER_IP=$(pct exec $CTID -- hostname -I | awk '{print $1}')

# Done!
echo ""
echo -e "${GREEN}╔═══════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║      LXC Container Ready!                 ║${NC}"
echo -e "${GREEN}╚═══════════════════════════════════════════╝${NC}"
echo ""
echo -e "Container ID:  ${YELLOW}$CTID${NC}"
echo -e "Container IP:  ${YELLOW}$CONTAINER_IP${NC}"
echo -e "Access URL:    ${BLUE}http://${CONTAINER_IP}:${APP_PORT}${NC}"
echo ""
echo -e "Proxmox commands:"
echo -e "  ${YELLOW}pct enter $CTID${NC}      - Enter container shell"
echo -e "  ${YELLOW}pct stop $CTID${NC}       - Stop container"
echo -e "  ${YELLOW}pct start $CTID${NC}      - Start container"
echo ""
log_success "Open the URL above to start the Familily setup wizard!"
