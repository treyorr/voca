<h1 class="text-3xl font-bold mb-6">Self-Hosting</h1>

<p class="mb-4">
  Run your own Voca signaling server. Just the Rust server—no UI, no database, no external dependencies.<br />
  Build your own apps on top using the SDK.
</p>

<h2 class="text-2xl font-bold mt-8 mb-4">Quick Start (Docker)</h2>

<div class="brutalist-box mb-6">
  <p class="font-bold text-sm mb-2">1. Pull & Run</p>
  <pre class="bg-black text-white p-3 text-sm overflow-x-auto">{`docker run -p 3001:3001 \\
  -e VOCA_ADMIN_TOKEN=your-secret-token \\
  ghcr.io/treyorr/voca-signaling:latest`}</pre>
</div>

<div class="brutalist-box mb-6">
  <p class="font-bold text-sm mb-2">2. Point SDK to Your Server</p>
  <pre class="bg-black text-white p-3 text-sm overflow-x-auto">{`const client = new VocaClient(roomId, {
  serverUrl: 'wss://your-domain.com',
});`}</pre>
</div>

<h2 class="text-2xl font-bold mt-8 mb-4">Environment Variables</h2>

<table class="w-full text-sm border-2 border-black mb-6">
  <thead class="bg-black text-white">
    <tr>
      <th class="p-2 text-left">Variable</th>
      <th class="p-2 text-left">Required</th>
      <th class="p-2 text-left">Description</th>
    </tr>
  </thead>
  <tbody>
    <tr class="border-t border-black">
      <td class="p-2 font-mono">VOCA_ADMIN_TOKEN</td>
      <td class="p-2">YES</td>
      <td class="p-2">Token for admin API endpoints</td>
    </tr>
    <tr class="border-t border-black">
      <td class="p-2 font-mono">VOCA_API_KEY</td>
      <td class="p-2">NO</td>
      <td class="p-2">Optional API key for room creation</td>
    </tr>
    <tr class="border-t border-black">
      <td class="p-2 font-mono">VOCA_MAX_PEERS_PER_ROOM</td>
      <td class="p-2">NO</td>
      <td class="p-2">Default: 6</td>
    </tr>
    <tr class="border-t border-black">
      <td class="p-2 font-mono">VOCA_MAX_GLOBAL_ROOMS</td>
      <td class="p-2">NO</td>
      <td class="p-2">Default: 500</td>
    </tr>
    <tr class="border-t border-black">
      <td class="p-2 font-mono">VOCA_LOG_DIR</td>
      <td class="p-2">NO</td>
      <td class="p-2">Log file directory</td>
    </tr>
    <tr class="border-t border-black">
      <td class="p-2 font-mono">RUST_LOG</td>
      <td class="p-2">NO</td>
      <td class="p-2">Logging level: info, debug, trace</td>
    </tr>
  </tbody>
</table>

<h2 class="text-2xl font-bold mt-8 mb-4">Docker Compose</h2>

<div class="brutalist-box mb-6">
  <p class="font-bold text-sm mb-2">docker-compose.yml</p>
  <pre class="bg-black text-white p-3 text-sm overflow-x-auto">{`services:
  signaling:
    image: ghcr.io/treyorr/voca-signaling:latest
    ports:
      - "3001:3001"
    environment:
      VOCA_ADMIN_TOKEN: \${VOCA_ADMIN_TOKEN}
      VOCA_API_KEY: \${VOCA_API_KEY}
      VOCA_MAX_PEERS_PER_ROOM: 6
      VOCA_MAX_GLOBAL_ROOMS: 500
      RUST_LOG: info
    restart: unless-stopped`}</pre>
</div>

<h2 class="text-2xl font-bold mt-8 mb-4">Building from Source</h2>

<div class="brutalist-box mb-6">
  <pre class="bg-black text-white p-3 text-sm overflow-x-auto">{`# Clone repo
git clone https://github.com/treyorr/voca
cd voca/services/signaling

# Build
cargo build --release

# Run
export VOCA_ADMIN_TOKEN=your-secret
./target/release/signaling`}</pre>
</div>

<h2 class="text-2xl font-bold mt-8 mb-4">Admin API</h2>

<p class="mb-4">
  The server provides REST API endpoints for monitoring. All admin endpoints require Bearer authentication.
</p>

<div class="brutalist-box mb-6">
  <h3 class="font-bold mb-2">Available Endpoints</h3>
  <pre class="bg-black text-white p-3 text-sm overflow-x-auto">{`# List active rooms
curl -H "Authorization: Bearer \${VOCA_ADMIN_TOKEN}" \\
  https://your-domain.com/api/admin/rooms

# Server metrics
curl -H "Authorization: Bearer \${VOCA_ADMIN_TOKEN}" \\
  https://your-domain.com/api/admin/metrics

# Recent logs (if VOCA_LOG_DIR is set)
curl -H "Authorization: Bearer \${VOCA_ADMIN_TOKEN}" \\
  https://your-domain.com/api/admin/logs`}</pre>
</div>

<h2 class="text-2xl font-bold mt-8 mb-4">HTTPS/WSS Setup</h2>

<div class="brutalist-box mb-6">
  <p class="text-sm mb-2">
    Use a reverse proxy (Caddy, Nginx, Traefik) for TLS termination:
  </p>
  <pre class="bg-black text-white p-3 text-sm overflow-x-auto">{`# Caddyfile
voca.yourdomain.com {
    reverse_proxy localhost:3001
}`}</pre>
</div>

<h2 class="text-2xl font-bold mt-8 mb-4">Health Check</h2>

<div class="brutalist-box mb-6">
  <pre class="bg-black text-white p-3 text-sm overflow-x-auto">{`curl https://your-domain.com/health`}</pre>
</div>

