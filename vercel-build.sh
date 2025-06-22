#!/bin/bash

# Install dependencies
pnpm install

# Build all packages
pnpm build

# Create .vercel directory if it doesn't exist
mkdir -p .vercel

# Copy the built files to the output directory
cp -r apps/http-backened/dist .vercel/output/functions

# Create the configuration file
cat > .vercel/output/config.json << EOF
{
  "version": 3,
  "routes": [
    {
      "src": "/(.*)",
      "dest": "/functions"
    }
  ]
}
EOF
