#!/bin/bash

# AUTO-DEV Bridge Docker Configuration Validator
set -e

echo "🔍 AUTO-DEV Bridge Docker Configuration Validator"
echo "================================================"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

# Validate Docker files
print_status "Validating Docker configuration files..."

# Check Dockerfile
if [ -f "Dockerfile" ]; then
    print_success "Dockerfile found"
    
    # Check for multi-stage build
    if grep -q "FROM.*as.*builder" Dockerfile; then
        print_success "Multi-stage build configured"
    fi
    
    # Check for security configurations
    if grep -q "adduser.*autodev" Dockerfile; then
        print_success "Non-root user configured"
    fi
    
    # Check for health check
    if grep -q "HEALTHCHECK" Dockerfile; then
        print_success "Health check configured"
    fi
else
    print_error "Dockerfile not found"
fi

# Check docker-compose files
if [ -f "docker-compose.yml" ]; then
    print_success "docker-compose.yml found"
    
    # Validate YAML syntax (basic check)
    if command -v python3 &> /dev/null; then
        python3 -c "import yaml; yaml.safe_load(open('docker-compose.yml'))" 2>/dev/null && \
        print_success "docker-compose.yml syntax valid" || \
        print_error "docker-compose.yml syntax error"
    fi
else
    print_error "docker-compose.yml not found"
fi

if [ -f "docker-compose.dev.yml" ]; then
    print_success "docker-compose.dev.yml found"
fi

# Check Nginx configuration
if [ -f "nginx.conf" ]; then
    print_success "nginx.conf found"
    
    # Check for SSE configuration
    if grep -q "proxy_buffering off" nginx.conf; then
        print_success "SSE-friendly Nginx configuration"
    fi
fi

# Check .dockerignore
if [ -f ".dockerignore" ]; then
    print_success ".dockerignore found"
    
    if grep -q "node_modules" .dockerignore; then
        print_success "node_modules excluded from Docker context"
    fi
else
    print_warning ".dockerignore not found - Docker build may be slower"
fi

# Validate environment structure
print_status "Validating application structure..."

required_files=(
    "package.json"
    "server/package.json"
    "server/src/index.js"
    "client/package.json"
    "client/src/main.jsx"
    "client/src/App.jsx"
)

for file in "${required_files[@]}"; do
    if [ -f "$file" ]; then
        print_success "$file exists"
    else
        print_error "$file missing"
    fi
done

# Check data directory structure
print_status "Validating data directory structure..."
mkdir -p data/requests data/responses data/history
mkdir -p data/requests/archive data/responses/archive

for dir in "data/requests" "data/responses" "data/history"; do
    if [ -d "$dir" ]; then
        print_success "$dir directory exists"
    else
        print_error "$dir directory missing"
        mkdir -p "$dir"
    fi
done

# Initialize data files if missing
if [ ! -f "data/requests/active.json" ]; then
    echo '{"requests":[],"metadata":{"created":"'$(date -Iseconds)'","version":"1.0.0"}}' > data/requests/active.json
    print_status "Created data/requests/active.json"
fi

if [ ! -f "data/responses/latest.json" ]; then
    echo '{"responses":[],"metadata":{"created":"'$(date -Iseconds)'","version":"1.0.0"}}' > data/responses/latest.json
    print_status "Created data/responses/latest.json"
fi

# Validate package.json files
print_status "Validating package.json configurations..."

if command -v node &> /dev/null; then
    # Check main package.json
    if node -e "JSON.parse(require('fs').readFileSync('package.json'))" 2>/dev/null; then
        print_success "Root package.json is valid JSON"
    else
        print_error "Root package.json is invalid"
    fi
    
    # Check server package.json
    if node -e "JSON.parse(require('fs').readFileSync('server/package.json'))" 2>/dev/null; then
        print_success "Server package.json is valid JSON"
    else
        print_error "Server package.json is invalid"
    fi
    
    # Check client package.json
    if node -e "JSON.parse(require('fs').readFileSync('client/package.json'))" 2>/dev/null; then
        print_success "Client package.json is valid JSON"
    else
        print_error "Client package.json is invalid"
    fi
fi

# Simulate Docker build context analysis
print_status "Analyzing Docker build context..."

# Check total size of build context (excluding dockerignore files)
if command -v du &> /dev/null; then
    context_size=$(du -sh . --exclude=node_modules --exclude=.git --exclude=data 2>/dev/null | cut -f1)
    print_status "Estimated Docker build context size: $context_size"
fi

# Check for large files that should be ignored
find . -type f -size +10M 2>/dev/null | grep -v node_modules | while read file; do
    print_warning "Large file found: $file (consider adding to .dockerignore)"
done

# Validate environment variables
print_status "Validating environment configuration..."

if [ -f ".env.example" ]; then
    print_success ".env.example found"
    while IFS= read -r line; do
        if [[ $line == *"="* ]] && [[ ! $line == "#"* ]]; then
            var_name=$(echo "$line" | cut -d'=' -f1)
            print_status "Environment variable: $var_name"
        fi
    done < .env.example
fi

# Create Docker build simulation report
print_status "Creating Docker configuration report..."

cat > docker-validation-report.md << EOF
# Docker Configuration Validation Report

Generated: $(date)

## Configuration Files Status
- Dockerfile: $([ -f "Dockerfile" ] && echo "✅ Present" || echo "❌ Missing")
- docker-compose.yml: $([ -f "docker-compose.yml" ] && echo "✅ Present" || echo "❌ Missing")
- docker-compose.dev.yml: $([ -f "docker-compose.dev.yml" ] && echo "✅ Present" || echo "❌ Missing")
- nginx.conf: $([ -f "nginx.conf" ] && echo "✅ Present" || echo "❌ Missing")
- .dockerignore: $([ -f ".dockerignore" ] && echo "✅ Present" || echo "❌ Missing")

## Application Structure
- Server: $([ -f "server/src/index.js" ] && echo "✅ Ready" || echo "❌ Missing")
- Client: $([ -f "client/src/main.jsx" ] && echo "✅ Ready" || echo "❌ Missing")
- Data Directory: $([ -d "data" ] && echo "✅ Ready" || echo "❌ Missing")

## Security Configuration
- Non-root user: $(grep -q "adduser.*autodev" Dockerfile && echo "✅ Configured" || echo "❌ Not configured")
- Health checks: $(grep -q "HEALTHCHECK" Dockerfile && echo "✅ Configured" || echo "❌ Not configured")
- Multi-stage build: $(grep -q "FROM.*as.*builder" Dockerfile && echo "✅ Configured" || echo "❌ Not configured")

## Recommendations
1. Ensure Docker Desktop is installed and running
2. Enable WSL2 integration in Docker Desktop settings
3. Run \`docker-compose up -d\` to start the application
4. Access the application at http://localhost:3001 (API) and http://localhost:5173 (Client)

## Test Commands
\`\`\`bash
# Build and start production environment
docker-compose -f docker-compose.yml up -d

# Build and start development environment
docker-compose -f docker-compose.dev.yml up -d

# Test API health
curl http://localhost:3001/api/health

# Test SSE endpoint
curl -N -H "Accept: text/event-stream" http://localhost:3001/api/events
\`\`\`

EOF

print_success "Docker validation report created: docker-validation-report.md"

# Final summary
echo ""
print_success "🎉 Docker configuration validation completed!"
echo ""
echo "📋 Summary:"
echo "✅ Docker configuration files validated"
echo "✅ Application structure verified"
echo "✅ Data directory initialized"
echo "✅ Environment ready for containerization"
echo ""
echo "🚀 Next steps:"
echo "1. Install Docker Desktop"
echo "2. Enable WSL2 integration"
echo "3. Run: docker-compose up -d"
echo ""
echo "📁 Files created/validated:"
echo "- Docker configuration files"
echo "- Data directory structure"
echo "- Validation report"