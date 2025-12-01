FROM rust:1.86-slim

SHELL ["bash", "-c"]

# Install system dependencies
RUN apt-get update && apt-get install -y \
    pkg-config \
    protobuf-compiler \
    clang \
    make \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Install Linera CLI
RUN cargo install --locked linera-service@0.15.5 linera-storage-service@0.15.5

# Install Node.js via nvm
RUN curl https://raw.githubusercontent.com/creationix/nvm/v0.40.3/install.sh | bash \
    && . ~/.nvm/nvm.sh \
    && nvm install lts/krypton \
    && npm install -g pnpm

# Add wasm32 target for building Linera contracts
RUN rustup target add wasm32-unknown-unknown

# Set working directory
WORKDIR /build

# Health check to verify frontend is running
HEALTHCHECK --interval=30s --timeout=10s --start-period=120s --retries=3 \
    CMD curl -f http://localhost:5173 || exit 1

# Run the deployment script
ENTRYPOINT ["bash", "/build/run.bash"]
