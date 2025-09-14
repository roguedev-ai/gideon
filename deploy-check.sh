#!/bin/bash

# 🚀 Gideon AI Chat MCP Studio - Prerequisites & Deployment Script
# Version: 1.0.0
# Description: Automated deployment preparation for Gideon
# Author: Gideon Development Team
# Date: 2025-01-13

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Default settings
VERBOSE=false
AUTO_INSTALL=true
RECOMMENDED_MEMORY=4
RECOMMENDED_DISK=20
REQUIRED_DOCKER_VERSION="20.10.0"
REQUIRED_COMPOSE_VERSION="2.0.0"

# Print banner
print_banner() {
    echo -e "${CYAN}"
    echo "╔══════════════════════════════════════════════════════════════════════════════╗"
    echo "║                              🤖 GIDEON AI CHAT MCP STUDIO                     ║"
    echo "║                         Prerequisites & Deployment Checker                    ║"
    echo "║                                                                              ║"
    echo "║  Production-Ready AI Chat Platform with MCP Integration                     ║"
    echo "║  Complete Frontend + Backend + Database Solution                            ║"
    echo "╚══════════════════════════════════════════════════════════════════════════════╝${NC}"
    echo ""
}

# Print section header
print_section() {
    echo -e "${BLUE}┌─ $1${NC}"
    echo -e "${BLUE}└────────────────────────────────────────────────────────────────────────────────${NC}"
}

# Print success message
print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

# Print error message
print_error() {
    echo -e "${RED}❌ $1${NC}"
}

# Print warning message
print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

# Print info message
print_info() {
    echo -e "${PURPLE}ℹ️  $1${NC}"
}

# Check operating system
check_os() {
    print_section "Operating System Check"

    if [[ "$OSTYPE" == "linux-gnu"* ]]; then
        OS="Linux"
        if [ -f /etc/os-release ]; then
            . /etc/os-release
            OS_NAME=$NAME
            OS_VERSION=$VERSION
        else
            OS_NAME="Linux"
            OS_VERSION="Unknown"
        fi
        print_success "Detected: $OS_NAME $OS_VERSION"

    elif [[ "$OSTYPE" == "darwin"* ]]; then
        OS="macOS"
        OS_VERSION=$(sw_vers -productVersion)
        print_success "Detected: macOS $OS_VERSION"

    elif [[ "$OSTYPE" == "msys" ]] || [[ "$OSTYPE" == "win32" ]]; then
        OS="Windows"
        OS_VERSION=$(ver)
        print_warning "Windows detected. Recommended: WSL2 or Ubuntu Linux for production deployment"
        print_info "Alternative: Use Docker Desktop for Windows"
    else
        OS="Unknown"
        print_warning "Unknown OS: $OSTYPE"
        print_info "Gideon deployment tested on Linux and macOS"
    fi

    echo ""
}

# Check system resources
check_resources() {
    print_section "System Resources Check"

    # Check available memory
    if [[ "$OS" == "Linux" ]] || [[ "$OS" == "macOS" ]]; then
        if [[ "$OS" == "Linux" ]]; then
            TOTAL_MEMORY=$(free -g | awk 'NR==2{printf "%.0f", $2}')
        elif [[ "$OS" == "macOS" ]]; then
            TOTAL_MEMORY=$(echo "$(sysctl -n hw.memsize) / 1024 / 1024 / 1024" | bc)
        fi

        if [ "$TOTAL_MEMORY" -ge "$RECOMMENDED_MEMORY" ]; then
            print_success "Memory: ${TOTAL_MEMORY}GB available (Recommended: ${RECOMMENDED_MEMORY}GB+)"
        else
            print_warning "Memory: ${TOTAL_MEMORY}GB available (Recommended: ${RECOMMENDED_MEMORY}GB+)"
            print_info "Consider upgrading RAM for optimal performance"
        fi
    fi

    # Check disk space
    if [[ "$OS" == "Linux" ]]; then
        DISK_SPACE=$(df -BG . | tail -1 | awk '{print $4}' | sed 's/G//')
        if [ "$DISK_SPACE" -ge "$RECOMMENDED_DISK" ]; then
            print_success "Disk Space: ${DISK_SPACE}GB available (Recommended: ${RECOMMENDED_DISK}GB+)"
        else
            print_warning "Disk Space: Only ${DISK_SPACE}GB available (Recommended: ${RECOMMENDED_DISK}GB+)"
        fi
    elif [[ "$OS" == "macOS" ]]; then
        DISK_SPACE=$(df -h . | tail -1 | awk '{print $4}' | sed 's/Gi//')
        print_info "Disk Space: ${DISK_SPACE}G available (macOS)"
    fi

    echo ""
}

# Check Docker installation
check_docker() {
    print_section "Docker Installation Check"

    if command -v docker &> /dev/null; then
        DOCKER_VERSION=$(docker --version | sed 's/Docker version //' | cut -d',' -f1 | cut -d' ' -f1)
        print_success "Docker installed: $DOCKER_VERSION"

        # Compare versions
        if printf '%s\n' "$REQUIRED_DOCKER_VERSION" "$DOCKER_VERSION" | sort -V | head -n1 | grep -q "^$REQUIRED_DOCKER_VERSION$"; then
            print_success "Docker version meets requirements (≥ $REQUIRED_DOCKER_VERSION)"
        else
            print_warning "Docker version might be outdated. Recommended: ≥ $REQUIRED_DOCKER_VERSION"
        fi
    else
        print_error "Docker not installed"
        print_info "Please install Docker:"
        if [[ "$OS" == "Linux" ]]; then
            echo "  Ubuntu/Debian: sudo apt update && sudo apt install docker.io"
            echo "  CentOS/RHEL: sudo yum install docker"
            echo "  Official: curl -fsSL https://get.docker.com | sh"
        elif [[ "$OS" == "macOS" ]]; then
            echo "  Install Docker Desktop from: https://docker.com/desktop"
        fi

        if [[ "$AUTO_INSTALL" == "true" && "$OS" == "Linux" ]]; then
            print_info "Attempting automatic installation..."
            if command -v apt &> /dev/null; then
                sudo apt update && sudo apt install -y docker.io docker-compose
            else
                print_error "Cannot auto-install on this Linux distribution"
            fi
        fi

        echo ""
        return 1
    fi

    echo ""
}

# Check Docker Compose
check_docker_compose() {
    print_section "Docker Compose Check"

    # Check for docker compose (v2) first
    if docker compose version &> /dev/null; then
        COMPOSE_VERSION=$(docker compose version | sed 's/Docker Compose version //' | cut -d',' -f1)
        COMPOSE_TYPE="Docker Compose v2 (built-in)"
        print_success "Docker Compose v2 found: $COMPOSE_VERSION"

    # Check for docker-compose (v1)
    elif command -v docker-compose &> /dev/null; then
        COMPOSE_VERSION=$(docker-compose --version | sed 's/docker-compose version //' | cut -d',' -f1)
        COMPOSE_TYPE="Docker Compose v1"
        print_success "Docker Compose found: $COMPOSE_VERSION"

        if printf '%s\n' "$REQUIRED_COMPOSE_VERSION" "$COMPOSE_VERSION" | sort -V | head -n1 | grep -q "^$REQUIRED_COMPOSE_VERSION$"; then
            print_success "Docker Compose version meets requirements (≥ $REQUIRED_COMPOSE_VERSION)"
        else
            print_warning "Docker Compose might be outdated. Consider upgrading to v2"
        fi
    else
        print_error "Docker Compose not found"
        print_info "Please install Docker Compose:"
        echo "  - Included with Docker Desktop"
        echo "  - Or install standalone: pip install docker-compose"
        echo ""

        return 1
    fi

    echo ""
}

# Check Docker daemon
check_docker_daemon() {
    print_section "Docker Daemon Check"

    if docker info &> /dev/null; then
        print_success "Docker daemon is running"
    else
        print_error "Docker daemon is not running"
        print_info "Please start Docker:"
        if [[ "$OS" == "Linux" ]]; then
            echo "  sudo systemctl start docker"
            echo "  sudo usermod -aG docker $USER  # Add user to docker group"
        elif [[ "$OS" == "macOS" ]]; then
            echo "  Start Docker Desktop application"
        fi

        if [[ "$AUTO_INSTALL" == "true" ]];
        then
            if [[ "$OS" == "Linux" ]]; then
                sudo systemctl start docker
                print_success "Docker daemon started"
            fi
        fi

        echo ""
        return 1
    fi

    echo ""
}

# Check git
check_git() {
    print_section "Git Check"

    if command -v git &> /dev/null; then
        GIT_VERSION=$(git --version | awk '{print $3}')
        print_success "Git installed: $GIT_VERSION"
    else
        print_warning "Git not installed"
        print_info "Installing git..."
        if [[ "$AUTO_INSTALL" == "true" ]]; then
            if [[ "$OS" == "Linux" ]]; then
                if command -v apt &> /dev/null; then
                    sudo apt update && sudo apt install -y git
                elif command -v yum &> /dev/null; then
                    sudo yum install -y git
                fi
            elif [[ "$OS" == "macOS" ]]; then
                if command -v brew &> /dev/null; then
                    brew install git
                else
                    print_info "Install Homebrew: /bin/bash -c $(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
                fi
            fi
        fi
    fi

    echo ""
}

# Check ports availability
check_ports() {
    print_section "Port Availability Check"

    REQUIRED_PORTS=(3000 8000 5432 6379)  # Frontend, API, PostgreSQL, Redis

    for port in "${REQUIRED_PORTS[@]}"; do
        if lsof -Pi :$port -sTCP:LISTEN -t >/dev/null ; then
            print_warning "Port $port is in use"
        else
            print_success "Port $port is available"
        fi
    done

    echo ""
}

# Validate Gideon project
validate_project() {
    print_section "Gideon Project Validation"

    # Check for required files
    required_files=(
        "docker-compose.yml"
        "backend/requirements.txt"
        "frontend/package.json"
        "init-db/init.sql"
        "README.md"
    )

    missing_files=()
    for file in "${required_files[@]}"; do
        if [[ -f "$file" ]]; then
            print_success "Found: $file"
        else
            missing_files+=("$file")
            print_error "Missing: $file"
        fi
    done

    if [ ${#missing_files[@]} -eq 0 ]; then
        print_success "All required project files present"
    else
        print_error "Missing project files: ${missing_files[*]}"
        print_info "Ensure you're in the root directory of the Gideon project"
        return 1
    fi

    echo ""
}

# Test build
test_build() {
    print_section "Build Test"

    print_info "Testing Docker Compose configuration..."
    if docker compose config &> /dev/null; then
        print_success "Docker Compose configuration is valid"
    else
        print_error "Invalid Docker Compose configuration"
        return 1
    fi

    echo ""
}

# Show next steps
show_next_steps() {
    print_section "🚀 Deployment Ready!"

    echo -e "${GREEN}"
    echo "╔══════════════════════════════════════════════════════════════════════════════╗"
    echo "║                           🎯 NEXT STEPS                                     ║"
    echo "╚══════════════════════════════════════════════════════════════════════════════╝"
    echo ""
    echo "1. 🎉 Prerequisites Check: COMPLETE"
    echo "2. 🚀 Deploy Gideon:"
    echo ""
    echo "   # Deploy all services"
    echo -e "${CYAN}   docker-compose up -d${NC}"
    echo ""
    echo "   # Or with logging for debugging"
    echo -e "${CYAN}   docker-compose up${NC}"
    echo ""
    echo "   # Check deployment status"
    echo -e "${CYAN}   docker-compose ps${NC}"
    echo ""
    echo "3. 🌐 Access your application:"
    echo ""
    echo "   📱 Frontend (Web App):    http://localhost:3000"
    echo "   🔧 API Documentation:     http://localhost:8000/docs"
    echo "   ❤️  Health Check:         http://localhost:8000/health"
    echo ""
    echo "4. 🧪 Test the deployment:"
    echo "   ./test-backend.py"
    echo ""
    echo "5. ⚙️  Configure (optional):"
    echo "   - Edit docker-compose.yml for custom settings"
    echo "   - Add SSL certificates for production"
    echo "   - Configure reverse proxy (nginx)"
    echo ""
    echo -e "${BLUE}══════════════════════════════════════════════════════════════════════════════════${NC}"
    echo ""
}

# Main function
main() {
    print_banner

    echo "Script: $0"
    echo "Date: $(date)"
    echo "User: $(whoami)"
    echo ""

    check_os
    check_resources
    check_git
    check_docker
    check_docker_compose
    check_docker_daemon
    check_ports
    validate_project
    test_build

    # Show summary
    print_section "📋 Summary"
    echo -e "${BLUE}Gideon AI Chat MCP Studio - Prerequisites Check Complete!${NC}"
    echo ""
    echo "✅ All checks passed: Ready for deployment"
    echo "⚠️  Warnings found: Review recommended improvements"
    echo "❌ Critical issues: Address before deployment"
    echo ""

    show_next_steps
}

# Parse arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        -v|--verbose)
            VERBOSE=true
            shift
            ;;
        --no-auto-install)
            AUTO_INSTALL=false
            shift
            ;;
        -h|--help)
            echo "Gideon Prerequisites Script"
            echo ""
            echo "Usage: $0 [OPTIONS]"
            echo ""
            echo "Options:"
            echo "  -v, --verbose          Show detailed output"
            echo "  --no-auto-install      Don't attempt automatic installation"
            echo "  -h, --help            Show this help message"
            echo ""
            exit 0
            ;;
        *)
            echo "Unknown option: $1"
            echo "Use -h for help"
            exit 1
            ;;
    esac
done

# Run main function
main "$@"
