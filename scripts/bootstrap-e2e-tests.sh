#!/bin/bash

# Playwright E2E Test Bootstrap Script
# This script sets up and runs the Playwright end-to-end tests

set -e  # Exit on any error

echo "🚀 Starting Playwright E2E Test Bootstrap..."

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_step() {
    echo -e "\n${BLUE}📋 $1${NC}"
}

print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

# Check if we're in the right directory
if [ ! -d "apps/test-app" ]; then
    print_error "Test app directory not found. Please run this script from the project root."
    exit 1
fi

# Step 1: Install dependencies
print_step "Installing dependencies..."
pnpm install
print_success "Dependencies installed"

# Step 2: Install Playwright browsers
print_step "Installing Playwright browsers..."
npx playwright install
print_success "Playwright browsers ready"

# Step 3: Install test app dependencies
print_step "Installing test app dependencies..."
cd apps/test-app
pnpm install
cd ../..
print_success "Test app dependencies ready"

# Step 4: Start test app in background
print_step "Starting test app..."
cd apps/test-app
pnpm dev &
TEST_APP_PID=$!
cd ../..

# Wait for app to start
sleep 10
print_success "Test app started (PID: $TEST_APP_PID)"

# Step 5: Run Playwright tests
print_step "Running Playwright tests..."
npx playwright test --reporter=list
TEST_EXIT_CODE=$?

# Step 6: Cleanup
print_step "Cleaning up..."
kill $TEST_APP_PID 2>/dev/null || true
print_success "Test app stopped"

# Step 7: Show results
print_step "Test Results"
if [ $TEST_EXIT_CODE -eq 0 ]; then
    print_success "All tests passed!"
else
    print_error "Some tests failed"
fi

echo -e "\n${BLUE}📊 To view detailed results, run: npx playwright show-report${NC}"
echo -e "${BLUE}🔧 To run tests in debug mode: npx playwright test --debug${NC}"
echo -e "${BLUE}🌐 To run tests with UI: npx playwright test --ui${NC}"

echo -e "\n🎉 Bootstrap process completed!"

exit $TEST_EXIT_CODE 