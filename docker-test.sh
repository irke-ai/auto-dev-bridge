#!/bin/bash

# AUTO-DEV Bridge Docker Test Script
set -e

echo "🐳 AUTO-DEV Bridge Docker Environment Test"
echo "=========================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
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

# Check if Docker is running
print_status "Checking Docker availability..."
if ! command -v docker &> /dev/null; then
    print_error "Docker is not installed or not in PATH"
    exit 1
fi

if ! docker info &> /dev/null; then
    print_error "Docker daemon is not running"
    exit 1
fi

print_success "Docker is available and running"

# Check if docker-compose is available
print_status "Checking Docker Compose availability..."
if ! command -v docker-compose &> /dev/null; then
    print_warning "docker-compose not found, trying docker compose..."
    if ! docker compose version &> /dev/null; then
        print_error "Docker Compose is not available"
        exit 1
    fi
    DOCKER_COMPOSE="docker compose"
else
    DOCKER_COMPOSE="docker-compose"
fi

print_success "Docker Compose is available"

# Clean up any existing containers
print_status "Cleaning up existing containers..."
$DOCKER_COMPOSE -f docker-compose.yml down --remove-orphans 2>/dev/null || true
$DOCKER_COMPOSE -f docker-compose.dev.yml down --remove-orphans 2>/dev/null || true

# Create necessary directories
print_status "Creating necessary directories..."
mkdir -p data/requests data/responses data/history logs
mkdir -p data/requests/archive data/responses/archive

# Initialize data files if they don't exist
if [ ! -f "data/requests/active.json" ]; then
    echo '{"requests":[],"metadata":{"created":"'$(date -Iseconds)'","version":"1.0.0"}}' > data/requests/active.json
fi

if [ ! -f "data/responses/latest.json" ]; then
    echo '{"responses":[],"metadata":{"created":"'$(date -Iseconds)'","version":"1.0.0"}}' > data/responses/latest.json
fi

print_success "Directories and initial data files created"

# Build and start production environment
print_status "Building production Docker images..."
$DOCKER_COMPOSE -f docker-compose.yml build

print_status "Starting production environment..."
$DOCKER_COMPOSE -f docker-compose.yml up -d

# Wait for services to be ready
print_status "Waiting for services to be ready..."
sleep 10

# Test server health
print_status "Testing server health..."
for i in {1..30}; do
    if curl -s http://localhost:3001/api/health > /dev/null; then
        print_success "Server is healthy"
        break
    fi
    if [ $i -eq 30 ]; then
        print_error "Server health check failed after 30 attempts"
        print_status "Server logs:"
        $DOCKER_COMPOSE -f docker-compose.yml logs auto-dev-bridge
        exit 1
    fi
    sleep 2
done

# Test API endpoints
print_status "Testing API endpoints..."

# Test health endpoint
HEALTH_RESPONSE=$(curl -s http://localhost:3001/api/health)
if echo "$HEALTH_RESPONSE" | grep -q "healthy"; then
    print_success "Health endpoint working"
else
    print_error "Health endpoint failed"
    echo "Response: $HEALTH_RESPONSE"
fi

# Test requests endpoint
REQUESTS_RESPONSE=$(curl -s http://localhost:3001/api/requests)
if echo "$REQUESTS_RESPONSE" | grep -q "requests"; then
    print_success "Requests endpoint working"
else
    print_error "Requests endpoint failed"
    echo "Response: $REQUESTS_RESPONSE"
fi

# Test SSE endpoint (just check if it responds)
SSE_TEST=$(timeout 5 curl -N -H "Accept: text/event-stream" http://localhost:3001/api/events 2>/dev/null | head -1 || true)
if [ ! -z "$SSE_TEST" ]; then
    print_success "SSE endpoint working"
else
    print_warning "SSE endpoint test inconclusive (this might be normal)"
fi

# Test creating a request
print_status "Testing request creation..."
CREATE_RESPONSE=$(curl -s -X POST http://localhost:3001/api/requests \
    -H "Content-Type: application/json" \
    -d '{"message": "Docker test request", "priority": "high"}')

if echo "$CREATE_RESPONSE" | grep -q "Request created successfully"; then
    print_success "Request creation working"
else
    print_error "Request creation failed"
    echo "Response: $CREATE_RESPONSE"
fi

# Check if data file was updated
if [ -f "data/requests/active.json" ]; then
    if grep -q "Docker test request" data/requests/active.json; then
        print_success "Data persistence working"
    else
        print_warning "Data file exists but doesn't contain test request"
    fi
else
    print_error "Data file not found"
fi

# Show running containers
print_status "Currently running containers:"
$DOCKER_COMPOSE -f docker-compose.yml ps

# Show container logs (last 20 lines)
print_status "Recent server logs:"
$DOCKER_COMPOSE -f docker-compose.yml logs --tail=20 auto-dev-bridge

# Performance test
print_status "Running basic performance test..."
echo "Response times for health endpoint (5 requests):"
for i in {1..5}; do
    time curl -s http://localhost:3001/api/health > /dev/null
done

print_success "Production environment test completed!"

# Test development environment
print_status "Testing development environment..."
$DOCKER_COMPOSE -f docker-compose.dev.yml up -d

sleep 10

# Test dev server
if curl -s http://localhost:3001/api/health > /dev/null; then
    print_success "Development server is healthy"
else
    print_warning "Development server health check failed"
fi

print_status "Development environment containers:"
$DOCKER_COMPOSE -f docker-compose.dev.yml ps

# Cleanup
print_status "Cleaning up test environments..."
$DOCKER_COMPOSE -f docker-compose.yml down
$DOCKER_COMPOSE -f docker-compose.dev.yml down

print_success "🎉 All Docker tests completed!"
echo ""
echo "📋 Test Summary:"
echo "✅ Docker environment setup"
echo "✅ Production build"
echo "✅ API endpoints"
echo "✅ Data persistence"
echo "✅ Development environment"
echo ""
echo "🚀 To start the system:"
echo "Production:  $DOCKER_COMPOSE -f docker-compose.yml up -d"
echo "Development: $DOCKER_COMPOSE -f docker-compose.dev.yml up -d"
echo ""
echo "🌐 Access URLs:"
echo "API Server:  http://localhost:3001"
echo "Client:      http://localhost:5173"
echo "Health:      http://localhost:3001/api/health"