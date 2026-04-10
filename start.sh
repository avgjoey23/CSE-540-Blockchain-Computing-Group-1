#!/bin/bash

echo "Starting Hardhat node..."
cd contracts
npx hardhat node &
HARDHAT_PID=$!

# Wait for Hardhat to finish starting up before deploying
sleep 3

echo "Deploying contracts..."
npx hardhat run scripts/deploy.ts --network localhost

echo "Seeding test data..."
npx hardhat run scripts/seed.ts --network localhost

echo "Starting backend..."
cd ../backend
node server.js &
BACKEND_PID=$!

echo ""
echo "All services running. Press Ctrl+C to stop."

# When the script is killed, clean up both background processes
trap "kill $HARDHAT_PID $BACKEND_PID" EXIT

wait