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
CYAN='\033[0;36m'
BOLD='\033[1m'
NC='\033[0m'

# Configuration
CTID=""
CT_HOSTNAME="familily"
DISK_SIZE="4"
RAM="1024"
CORES="2"
TEMPLATE="debian-12-standard"
APP_PORT=3000

log_info() { echo -e "${BLUE}[INFO]${NC} $1"; }
log_success() { echo -e "${GREEN}[OK]${NC} $1"; }
log_warn() { echo -e "${YELLOW}[WARN]${NC} $1"; }
log_error() { echo -e "${RED}[ERROR]${NC} $1"; exit 1; }

# Banner
clear
echo -e "${BLUE}"
echo "╔═══════════════════════════════════════════╗"
echo "║     Familily - Proxmox LXC Creator        ║"
echo "║     Family Calendar & Organizer           ║"
echo "╚═══════════════════════════════════════════╝"
echo -e "${NC}"

# Check if running on Proxmox
if ! command -v pct &> /dev/null; then
    log_error "This script must be run on a Proxmox host"
fi

# Function to display a selection menu
select_option() {
    local prompt="$1"
    shift
    local options=("$@")
    local selected=0
    local key

    # Hide cursor
    tput civis

    while true; do
        # Move cursor up to redraw
        if [ $selected -gt 0 ] || [ "${first_draw:-1}" -eq 0 ]; then
            tput cuu $((${#options[@]} + 1))
        fi
        first_draw=0

        echo -e "${BOLD}$prompt${NC}"
        for i in "${!options[@]}"; do
            if [ $i -eq $selected ]; then
                echo -e "  ${CYAN}▸ ${options[$i]}${NC}"
            else
                echo -e "    ${options[$i]}"
            fi
        done

        # Read single keypress
        read -rsn1 key
        case "$key" in
            A) # Up arrow
                ((selected--)) || true
                [ $selected -lt 0 ] && selected=$((${#options[@]} - 1))
                ;;
            B) # Down arrow
                ((selected++)) || true
                [ $selected -ge ${#options[@]} ] && selected=0
                ;;
            "") # Enter
                break
                ;;
        esac
    done

    # Show cursor
    tput cnorm
    echo "$selected"
}

# Function to prompt for input with default
prompt_input() {
    local prompt="$1"
    local default="$2"
    local result

    echo -ne "${BOLD}$prompt${NC} [${CYAN}$default${NC}]: "
    read result
    echo "${result:-$default}"
}

echo -e "${BOLD}Let's set up your Familily container!${NC}\n"

# ─────────────────────────────────────────────────────────────
# Step 1: Container ID
# ─────────────────────────────────────────────────────────────
NEXT_CTID=$(pvesh get /cluster/nextid)
CTID=$(prompt_input "Container ID" "$NEXT_CTID")

# Check if CTID already exists
if pct status $CTID &>/dev/null; then
    log_error "Container $CTID already exists. Please choose a different ID."
fi

# ─────────────────────────────────────────────────────────────
# Step 2: Hostname
# ─────────────────────────────────────────────────────────────
CT_HOSTNAME=$(prompt_input "Hostname" "$CT_HOSTNAME")

# ─────────────────────────────────────────────────────────────
# Step 3: Template Storage (for vztmpl)
# ─────────────────────────────────────────────────────────────
echo ""
log_info "Scanning for template storages..."

# Get storages that support templates
mapfile -t TEMPLATE_STORAGES < <(pvesm status --content vztmpl 2>/dev/null | awk 'NR>1 && $3=="active" {print $1}')

if [ ${#TEMPLATE_STORAGES[@]} -eq 0 ]; then
    log_error "No storage found that supports templates (vztmpl)."
elif [ ${#TEMPLATE_STORAGES[@]} -eq 1 ]; then
    TEMPLATE_STORAGE="${TEMPLATE_STORAGES[0]}"
    log_success "Template storage: $TEMPLATE_STORAGE"
else
    echo ""
    result=$(select_option "Select template storage:" "${TEMPLATE_STORAGES[@]}")
    TEMPLATE_STORAGE="${TEMPLATE_STORAGES[$result]}"
    echo ""
    log_success "Template storage: $TEMPLATE_STORAGE"
fi

# ─────────────────────────────────────────────────────────────
# Step 4: Disk Storage (for rootdir)
# ─────────────────────────────────────────────────────────────
log_info "Scanning for disk storages..."

# Get storages that support container rootdir
mapfile -t DISK_STORAGES < <(pvesm status --content rootdir 2>/dev/null | awk 'NR>1 && $3=="active" {print $1}')

if [ ${#DISK_STORAGES[@]} -eq 0 ]; then
    log_error "No storage found that supports containers (rootdir)."
elif [ ${#DISK_STORAGES[@]} -eq 1 ]; then
    STORAGE="${DISK_STORAGES[0]}"
    log_success "Disk storage: $STORAGE"
else
    echo ""
    result=$(select_option "Select disk storage:" "${DISK_STORAGES[@]}")
    STORAGE="${DISK_STORAGES[$result]}"
    echo ""
    log_success "Disk storage: $STORAGE"
fi

# ─────────────────────────────────────────────────────────────
# Step 5: Resources
# ─────────────────────────────────────────────────────────────
echo ""
DISK_SIZE=$(prompt_input "Disk size (GB)" "$DISK_SIZE")
RAM=$(prompt_input "RAM (MB)" "$RAM")
CORES=$(prompt_input "CPU cores" "$CORES")

# ─────────────────────────────────────────────────────────────
# Summary & Confirmation
# ─────────────────────────────────────────────────────────────
echo ""
echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BOLD}Configuration Summary:${NC}"
echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "  Container ID:      ${CYAN}$CTID${NC}"
echo -e "  Hostname:          ${CYAN}$CT_HOSTNAME${NC}"
echo -e "  Template Storage:  ${CYAN}$TEMPLATE_STORAGE${NC}"
echo -e "  Disk Storage:      ${CYAN}$STORAGE${NC}"
echo -e "  Disk Size:         ${CYAN}${DISK_SIZE}GB${NC}"
echo -e "  RAM:               ${CYAN}${RAM}MB${NC}"
echo -e "  CPU Cores:         ${CYAN}$CORES${NC}"
echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

echo -ne "${BOLD}Proceed with installation?${NC} [Y/n]: "
read confirm
if [[ "${confirm,,}" == "n" ]]; then
    echo "Installation cancelled."
    exit 0
fi

echo ""

# ─────────────────────────────────────────────────────────────
# Download Template
# ─────────────────────────────────────────────────────────────
log_info "Checking for Debian 12 template..."
TEMPLATE_PATH=$(pveam list $TEMPLATE_STORAGE 2>/dev/null | grep -o "${TEMPLATE}.*\.tar\.\(gz\|zst\)" | head -1 || true)

if [ -z "$TEMPLATE_PATH" ]; then
    log_info "Downloading Debian 12 template..."
    pveam update
    TEMPLATE_FILE=$(pveam available --section system | grep "debian-12-standard" | awk '{print $2}' | head -1)
    if [ -z "$TEMPLATE_FILE" ]; then
        log_error "Could not find Debian 12 template."
    fi
    pveam download $TEMPLATE_STORAGE $TEMPLATE_FILE
    TEMPLATE_PATH=$TEMPLATE_FILE
fi
log_success "Template ready: $TEMPLATE_PATH"

# ─────────────────────────────────────────────────────────────
# Create Container
# ─────────────────────────────────────────────────────────────
log_info "Creating LXC container..."
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
# Start & Configure
# ─────────────────────────────────────────────────────────────
log_info "Starting container..."
pct start $CTID
sleep 5

log_info "Waiting for network..."
for i in {1..30}; do
    if pct exec $CTID -- ping -c 1 google.com &>/dev/null; then
        log_success "Network ready"
        break
    fi
    sleep 2
done

log_info "Installing Familily (this takes a few minutes)..."
pct exec $CTID -- bash -c "apt-get update -qq && apt-get install -y -qq curl"
pct exec $CTID -- bash -c "curl -fsSL https://raw.githubusercontent.com/PierrePetite/familily/main/scripts/install-lxc.sh | bash"

# Get container IP
CONTAINER_IP=$(pct exec $CTID -- hostname -I | awk '{print $1}')

# ─────────────────────────────────────────────────────────────
# Done!
# ─────────────────────────────────────────────────────────────
echo ""
echo -e "${GREEN}╔═══════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║      Installation Complete! 🎉            ║${NC}"
echo -e "${GREEN}╚═══════════════════════════════════════════╝${NC}"
echo ""
echo -e "  ${BOLD}Access Familily:${NC}  ${CYAN}http://${CONTAINER_IP}:${APP_PORT}${NC}"
echo ""
echo -e "  ${BOLD}Container Commands:${NC}"
echo -e "    pct enter $CTID      - Enter shell"
echo -e "    pct stop $CTID       - Stop container"
echo -e "    pct start $CTID      - Start container"
echo ""
echo -e "  ${BOLD}Inside Container:${NC}"
echo -e "    systemctl status familily   - Check status"
echo -e "    journalctl -u familily -f   - View logs"
echo ""
log_success "Open the URL above to start the setup wizard!"
