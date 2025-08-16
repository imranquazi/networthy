#!/bin/bash

# NETWORTHY Test Runner Script
# This script runs all tests for both backend and frontend

set -e  # Exit on any error

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

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Function to check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Function to check Node.js version
check_node_version() {
    if ! command_exists node; then
        print_error "Node.js is not installed. Please install Node.js 18 or higher."
        exit 1
    fi

    NODE_VERSION=$(node --version | cut -d'v' -f2 | cut -d'.' -f1)
    if [ "$NODE_VERSION" -lt 18 ]; then
        print_error "Node.js version 18 or higher is required. Current version: $(node --version)"
        exit 1
    fi

    print_success "Node.js version: $(node --version)"
}

# Function to run backend tests
run_backend_tests() {
    print_status "Running backend tests..."
    
    cd backend
    
    # Check if dependencies are installed
    if [ ! -d "node_modules" ]; then
        print_warning "Backend dependencies not found. Installing..."
        npm install
    fi
    
    # Run unit tests
    print_status "Running backend unit tests..."
    npm test
    
    # Run integration tests
    print_status "Running backend integration tests..."
    npm run test:integration
    
    # Run E2E tests
    print_status "Running backend E2E tests..."
    npm run test:e2e
    
    # Generate coverage report
    print_status "Generating backend coverage report..."
    npm run test:coverage
    
    cd ..
    print_success "Backend tests completed!"
}

# Function to run frontend tests
run_frontend_tests() {
    print_status "Running frontend tests..."
    
    cd frontend
    
    # Check if dependencies are installed
    if [ ! -d "node_modules" ]; then
        print_warning "Frontend dependencies not found. Installing..."
        npm install
    fi
    
    # Run unit tests
    print_status "Running frontend unit tests..."
    npm test
    
    # Check if Playwright is installed
    if ! command_exists npx; then
        print_error "npx is not available. Please install npm."
        exit 1
    fi
    
    # Install Playwright browsers if not already installed
    if [ ! -d "node_modules/.cache/ms-playwright" ]; then
        print_status "Installing Playwright browsers..."
        npx playwright install
    fi
    
    # Run E2E tests
    print_status "Running frontend E2E tests..."
    npm run test:e2e
    
    cd ..
    print_success "Frontend tests completed!"
}

# Function to run all tests
run_all_tests() {
    print_status "Running all tests for NETWORTHY..."
    
    # Check Node.js version
    check_node_version
    
    # Run backend tests
    run_backend_tests
    
    # Run frontend tests
    run_frontend_tests
    
    print_success "All tests completed successfully!"
}

# Function to run tests with coverage
run_tests_with_coverage() {
    print_status "Running tests with coverage..."
    
    check_node_version
    
    # Backend coverage
    cd backend
    if [ ! -d "node_modules" ]; then
        npm install
    fi
    npm run test:coverage
    cd ..
    
    # Frontend coverage
    cd frontend
    if [ ! -d "node_modules" ]; then
        npm install
    fi
    npm run test:coverage
    cd ..
    
    print_success "Coverage reports generated!"
    print_status "Backend coverage: backend/coverage/lcov-report/index.html"
    print_status "Frontend coverage: frontend/coverage/lcov-report/index.html"
}

# Function to run tests in watch mode
run_tests_watch() {
    print_status "Running tests in watch mode..."
    
    check_node_version
    
    # Start backend tests in watch mode
    cd backend
    if [ ! -d "node_modules" ]; then
        npm install
    fi
    npm run test:watch &
    BACKEND_PID=$!
    cd ..
    
    # Start frontend tests in watch mode
    cd frontend
    if [ ! -d "node_modules" ]; then
        npm install
    fi
    npm run test:watch &
    FRONTEND_PID=$!
    cd ..
    
    print_status "Tests running in watch mode. Press Ctrl+C to stop."
    
    # Wait for user to stop
    wait
}

# Function to run E2E tests only
run_e2e_tests() {
    print_status "Running E2E tests only..."
    
    check_node_version
    
    # Backend E2E tests
    cd backend
    if [ ! -d "node_modules" ]; then
        npm install
    fi
    npm run test:e2e
    cd ..
    
    # Frontend E2E tests
    cd frontend
    if [ ! -d "node_modules" ]; then
        npm install
    fi
    npm run test:e2e
    cd ..
    
    print_success "E2E tests completed!"
}

# Function to show help
show_help() {
    echo "NETWORTHY Test Runner"
    echo ""
    echo "Usage: $0 [OPTION]"
    echo ""
    echo "Options:"
    echo "  all              Run all tests (default)"
    echo "  backend          Run backend tests only"
    echo "  frontend         Run frontend tests only"
    echo "  e2e              Run E2E tests only"
    echo "  coverage         Run tests with coverage reports"
    echo "  watch            Run tests in watch mode"
    echo "  help             Show this help message"
    echo ""
    echo "Examples:"
    echo "  $0               # Run all tests"
    echo "  $0 backend       # Run backend tests only"
    echo "  $0 coverage      # Run tests with coverage"
    echo "  $0 watch         # Run tests in watch mode"
}

# Main script logic
case "${1:-all}" in
    "all")
        run_all_tests
        ;;
    "backend")
        check_node_version
        run_backend_tests
        ;;
    "frontend")
        check_node_version
        run_frontend_tests
        ;;
    "e2e")
        run_e2e_tests
        ;;
    "coverage")
        run_tests_with_coverage
        ;;
    "watch")
        run_tests_watch
        ;;
    "help"|"-h"|"--help")
        show_help
        ;;
    *)
        print_error "Unknown option: $1"
        show_help
        exit 1
        ;;
esac

