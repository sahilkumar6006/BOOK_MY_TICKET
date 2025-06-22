#!/bin/bash
# Install pnpm if not already installed
if ! command -v pnpm &> /dev/null; then
    npm install -g pnpm@latest
fi

# Install dependencies
pnpm install

# Build the project
pnpm build

# Create output directory
mkdir -p .vercel/output/static

# Copy the built files to the output directory
cp -r apps/http-backened/dist/* .vercel/output/static/

# Create the function configuration
mkdir -p .vercel/output/functions
cat > .vercel/output/functions/index.func/.vc-config.json << EOF
{
  "runtime": "nodejs18.x",
  "handler": "index.js",
  "launcherType": "Nodejs",
  "shouldAddHelpers": true,
  "shouldAddSourcemapSupport": true
}
EOF
