#!/usr/bin/env bash

# Familily Proxmox LXC Creator Script
# Run this ON your Proxmox host (not inside an LXC)

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
BOLD='\033[1m'
NC='\033[0m'

# Configuration defaults
CT_HOSTNAME="familily"
DISK_SIZE="4"
RAM="1024"
CORES="2"
TEMPLATE="debian-12-standard"
APP_PORT=3000

log_info() { echo -e "${BLUE}[INFO]${NC} $1"; }
log_success() { echo -e "${GREEN}[OK]${NC} $1"; }
log_error() { echo -e "${RED}[ERROR]${NC} $1"; exit 1; }

# Banner
echo ""
echo -e "${BLUE}╔═══════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║     Familily - Proxmox LXC Creator        ║${NC}"
echo -e "${BLUE}║     Family Calendar & Organizer           ║${NC}"
echo -e "${BLUE}╚═══════════════════════════════════════════╝${NC}"
echo ""

# Check if running on Proxmox
if ! command -v pct &> /dev/null; then
    log_error "This script must be run on a Proxmox host"
fi

echo -e "${BOLD}Let's set up your Familily container!${NC}"
echo ""

# ─────────────────────────────────────────────────────────────
# Step 1: Container ID
# ─────────────────────────────────────────────────────────────
NEXT_CTID=$(pvesh get /cluster/nextid)
printf "${BOLD}Container ID${NC} [${CYAN}$NEXT_CTID${NC}]: "
read -r CTID </dev/tty
CTID="${CTID:-$NEXT_CTID}"

if pct status $CTID &>/dev/null; then
    log_error "Container $CTID already exists!"
fi

# ─────────────────────────────────────────────────────────────
# Step 2: Hostname
# ─────────────────────────────────────────────────────────────
printf "${BOLD}Hostname${NC} [${CYAN}$CT_HOSTNAME${NC}]: "
read -r input </dev/tty
CT_HOSTNAME="${input:-$CT_HOSTNAME}"

# ─────────────────────────────────────────────────────────────
# Step 3: Template Storage
# ─────────────────────────────────────────────────────────────
echo ""
log_info "Scanning for storages..."

# Get template storages
readarray -t TEMPLATE_STORAGES < <(pvesm status --content vztmpl 2>/dev/null | awk 'NR>1 && $3=="active" {print $1}')

if [ ${#TEMPLATE_STORAGES[@]} -eq 0 ]; then
    log_error "No template storage found!"
elif [ ${#TEMPLATE_STORAGES[@]} -eq 1 ]; then
    TEMPLATE_STORAGE="${TEMPLATE_STORAGES[0]}"
    log_success "Template storage: $TEMPLATE_STORAGE"
else
    echo -e "${BOLD}Select template storage:${NC}"
    for i in "${!TEMPLATE_STORAGES[@]}"; do
        echo -e "  ${CYAN}$((i+1)))${NC} ${TEMPLATE_STORAGES[$i]}"
    done
    printf "${BOLD}Choice [1-${#TEMPLATE_STORAGES[@]}]:${NC} "
    read -r choice </dev/tty
    TEMPLATE_STORAGE="${TEMPLATE_STORAGES[$((choice-1))]}"
    log_success "Template storage: $TEMPLATE_STORAGE"
fi

# ─────────────────────────────────────────────────────────────
# Step 4: Disk Storage
# ─────────────────────────────────────────────────────────────
readarray -t DISK_STORAGES < <(pvesm status --content rootdir 2>/dev/null | awk 'NR>1 && $3=="active" {print $1}')

if [ ${#DISK_STORAGES[@]} -eq 0 ]; then
    log_error "No disk storage found!"
elif [ ${#DISK_STORAGES[@]} -eq 1 ]; then
    STORAGE="${DISK_STORAGES[0]}"
    log_success "Disk storage: $STORAGE"
else
    echo ""
    echo -e "${BOLD}Select disk storage:${NC}"
    for i in "${!DISK_STORAGES[@]}"; do
        echo -e "  ${CYAN}$((i+1)))${NC} ${DISK_STORAGES[$i]}"
    done
    printf "${BOLD}Choice [1-${#DISK_STORAGES[@]}]:${NC} "
    read -r choice </dev/tty
    STORAGE="${DISK_STORAGES[$((choice-1))]}"
    log_success "Disk storage: $STORAGE"
fi

# ─────────────────────────────────────────────────────────────
# Step 5: Resources
# ─────────────────────────────────────────────────────────────
echo ""
printf "${BOLD}Disk size (GB)${NC} [${CYAN}$DISK_SIZE${NC}]: "
read -r input </dev/tty
DISK_SIZE="${input:-$DISK_SIZE}"

printf "${BOLD}RAM (MB)${NC} [${CYAN}$RAM${NC}]: "
read -r input </dev/tty
RAM="${input:-$RAM}"

printf "${BOLD}CPU cores${NC} [${CYAN}$CORES${NC}]: "
read -r input </dev/tty
CORES="${input:-$CORES}"

# ─────────────────────────────────────────────────────────────
# Summary
# ─────────────────────────────────────────────────────────────
echo ""
echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BOLD}Configuration:${NC}"
echo -e "  Container ID:      ${CYAN}$CTID${NC}"
echo -e "  Hostname:          ${CYAN}$CT_HOSTNAME${NC}"
echo -e "  Template Storage:  ${CYAN}$TEMPLATE_STORAGE${NC}"
echo -e "  Disk Storage:      ${CYAN}$STORAGE${NC}"
echo -e "  Disk:              ${CYAN}${DISK_SIZE}GB${NC}"
echo -e "  RAM:               ${CYAN}${RAM}MB${NC}"
echo -e "  CPU:               ${CYAN}${CORES} cores${NC}"
echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

printf "${BOLD}Proceed?${NC} [Y/n]: "
read -r confirm </dev/tty
if [[ "${confirm,,}" == "n" ]]; then
    echo "Cancelled."
    exit 0
fi

echo ""

# ─────────────────────────────────────────────────────────────
# Download Template
# ─────────────────────────────────────────────────────────────
log_info "Checking template..."
TEMPLATE_PATH=$(pveam list $TEMPLATE_STORAGE 2>/dev/null | grep -o "${TEMPLATE}.*\.tar\.\(gz\|zst\)" | head -1 || true)

if [ -z "$TEMPLATE_PATH" ]; then
    log_info "Downloading Debian 12 template..."
    pveam update >/dev/null 2>&1
    TEMPLATE_FILE=$(pveam available --section system | grep "debian-12-standard" | awk '{print $2}' | head -1)
    pveam download $TEMPLATE_STORAGE $TEMPLATE_FILE
    TEMPLATE_PATH=$TEMPLATE_FILE
fi
log_success "Template: $TEMPLATE_PATH"

# ─────────────────────────────────────────────────────────────
# Create Container
# ─────────────────────────────────────────────────────────────
log_info "Creating container..."
pct create $CTID ${TEMPLATE_STORAGE}:vztmpl/${TEMPLATE_PATH} \
    --hostname $CT_HOSTNAME \
    --memory $RAM \
    --cores $CORES \
    --rootfs ${STORAGE}:${DISK_SIZE} \
    --net0 name=eth0,bridge=vmbr0,ip=dhcp \
    --unprivileged 1 \
    --features nesting=1 \
    --onboot 1 \
    --start 0
log_success "Container created"

# ─────────────────────────────────────────────────────────────
# Start & Install
# ─────────────────────────────────────────────────────────────
log_info "Starting container..."
pct start $CTID
sleep 5

log_info "Waiting for network..."
for i in {1..30}; do
    if pct exec $CTID -- ping -c 1 google.com &>/dev/null; then
        break
    fi
    sleep 2
done
log_success "Network ready"

log_info "Installing Familily (3-5 min)..."
echo -e "  ${YELLOW}☕ Grab a coffee...${NC}"
echo ""

pct exec $CTID -- bash -c "apt-get update && apt-get install -y curl" 2>&1 | while read line; do
    echo -e "  ${CYAN}>${NC} $line"
done

pct exec $CTID -- bash -c "curl -fsSL https://raw.githubusercontent.com/PierrePetite/familily/main/scripts/install-lxc.sh | bash" 2>&1 | while read line; do
    echo -e "  ${CYAN}>${NC} $line"
done

# Get IP
CONTAINER_IP=$(pct exec $CTID -- hostname -I | awk '{print $1}')

# ─────────────────────────────────────────────────────────────
# Done!
# ─────────────────────────────────────────────────────────────
echo ""
echo -e "${GREEN}╔═══════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║         Installation Complete!            ║${NC}"
echo -e "${GREEN}╚═══════════════════════════════════════════╝${NC}"
echo ""
echo -e "  ${BOLD}Open:${NC} ${CYAN}http://${CONTAINER_IP}:${APP_PORT}${NC}"
echo ""
echo -e "  ${BOLD}Commands:${NC}"
echo -e "    pct enter $CTID    - Shell access"
echo -e "    pct stop $CTID     - Stop"
echo -e "    pct start $CTID    - Start"
echo ""
