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

# Configuration (can be overridden via environment variables)
CTID="${CTID:-auto}"
HOSTNAME="${HOSTNAME:-familily}"
DISK_SIZE="${DISK_SIZE:-4}"
RAM="${RAM:-1024}"
CORES="${CORES:-2}"
TEMPLATE="debian-12-standard"
APP_PORT=3000

log_info() { echo -e "${BLUE}[INFO]${NC} $1"; }
log_success() { echo -e "${GREEN}[OK]${NC} $1"; }
log_warn() { echo -e "${YELLOW}[WARN]${NC} $1"; }
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

# Function to detect available storages
detect_storages() {
    log_info "Detecting available storages..."

    # Find storage that supports templates (vztmpl)
    if [ -z "$TEMPLATE_STORAGE" ]; then
        TEMPLATE_STORAGE=$(pvesm status --content vztmpl 2>/dev/null | awk 'NR>1 && $3=="active" {print $1; exit}')
        if [ -z "$TEMPLATE_STORAGE" ]; then
            log_error "No storage found that supports templates (vztmpl). Please set TEMPLATE_STORAGE manually."
        fi
    fi
    log_success "Template storage: $TEMPLATE_STORAGE"

    # Find storage that supports rootdir (for LXC disks)
    if [ -z "$STORAGE" ]; then
        STORAGE=$(pvesm status --content rootdir 2>/dev/null | awk 'NR>1 && $3=="active" {print $1; exit}')
        if [ -z "$STORAGE" ]; then
            log_error "No storage found that supports containers (rootdir). Please set STORAGE manually."
        fi
    fi
    log_success "Disk storage: $STORAGE"
}

# Detect storages
detect_storages

# Get next available CTID if auto
if [ "$CTID" = "auto" ]; then
    CTID=$(pvesh get /cluster/nextid)
fi
log_info "Container ID: $CTID"

# Check if template exists, download if not
log_info "Checking for Debian 12 template..."
TEMPLATE_PATH=$(pveam list $TEMPLATE_STORAGE 2>/dev/null | grep -o "${TEMPLATE}.*\.tar\.\(gz\|zst\)" | head -1 || true)

if [ -z "$TEMPLATE_PATH" ]; then
    log_info "Downloading Debian 12 template..."
    pveam update
    TEMPLATE_FILE=$(pveam available --section system | grep "debian-12-standard" | awk '{print $2}' | head -1)
    if [ -z "$TEMPLATE_FILE" ]; then
        log_error "Could not find Debian 12 template. Please download manually via Proxmox UI."
    fi
    pveam download $TEMPLATE_STORAGE $TEMPLATE_FILE
    TEMPLATE_PATH=$TEMPLATE_FILE
fi
log_success "Template: $TEMPLATE_PATH"

# Show configuration summary
echo ""
echo -e "${YELLOW}Configuration:${NC}"
echo -e "  Container ID:     $CTID"
echo -e "  Hostname:         $HOSTNAME"
echo -e "  RAM:              ${RAM}MB"
echo -e "  CPU Cores:        $CORES"
echo -e "  Disk Size:        ${DISK_SIZE}GB"
echo -e "  Template Storage: $TEMPLATE_STORAGE"
echo -e "  Disk Storage:     $STORAGE"
echo ""

# Create LXC container
log_info "Creating LXC container..."
pct create $CTID ${TEMPLATE_STORAGE}:vztmpl/${TEMPLATE_PATH} \
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
        log_success "Network ready"
        break
    fi
    sleep 2
done

# Run install script inside container
log_info "Installing Familily (this may take a few minutes)..."
pct exec $CTID -- bash -c "apt-get update -qq && apt-get install -y -qq curl"
pct exec $CTID -- bash -c "curl -fsSL https://raw.githubusercontent.com/PierrePetite/familily/main/scripts/install-lxc.sh | bash"

# Get container IP
CONTAINER_IP=$(pct exec $CTID -- hostname -I | awk '{print $1}')

# Done!
echo ""
echo -e "${GREEN}╔═══════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║      Installation Complete!               ║${NC}"
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
