#!/bin/bash

echo "===================================="
echo "Hospital CRM - Azure PostgreSQL"
echo "===================================="
echo ""

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if backend dependencies are installed
if [ ! -d "backend/node_modules" ]; then
    echo -e "${YELLOW}Installing backend dependencies...${NC}"
    cd backend && npm install && cd ..
fi

# Check if frontend dependencies are installed
if [ ! -d "node_modules" ]; then
    echo -e "${YELLOW}Installing frontend dependencies...${NC}"
    npm install
fi

# Start backend server
echo -e "${BLUE}Starting backend server on port 3001...${NC}"
cd backend && npm start &
BACKEND_PID=$!
cd ..

# Wait for backend to start
sleep 3

# Start frontend
echo -e "${BLUE}Starting frontend on port 3000...${NC}"
npm run dev &
FRONTEND_PID=$!

echo ""
echo -e "${GREEN}===================================="
echo -e "Application is running!"
echo -e "====================================${NC}"
echo ""
echo -e "${BLUE}Frontend:${NC} http://localhost:3000"
echo -e "${BLUE}Backend API:${NC} http://localhost:3001/api/health"
echo -e "${BLUE}Database:${NC} Azure PostgreSQL (valantdb)"
echo ""
echo -e "${YELLOW}Admin Login:${NC}"
echo "Email: admin@hospital.com"
echo "Password: admin123"
echo ""
echo "Press Ctrl+C to stop the application"

# Function to handle shutdown
cleanup() {
    echo ""
    echo -e "${YELLOW}Shutting down...${NC}"
    kill $BACKEND_PID 2>/dev/null
    kill $FRONTEND_PID 2>/dev/null
    exit 0
}

# Set up trap to handle Ctrl+C
trap cleanup INT

# Wait for processes
wait