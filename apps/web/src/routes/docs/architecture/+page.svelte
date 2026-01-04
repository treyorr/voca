<h1 class="text-3xl font-bold mb-6">Architecture</h1>

<p class="mb-4">
  Voca is built as a lightweight, self-hostable WebRTC signaling server with framework-agnostic SDKs.
</p>

<h2 class="text-2xl font-bold mt-8 mb-4">System Overview</h2>

<div class="brutalist-box mb-6">
  <pre class="text-sm font-mono">{`┌─────────────┐     WebSocket       ┌──────────────────┐
│   Browser   │◄───────────────────►│  Signaling       │
│  (SDK)      │                     │  Server (Rust)   │
└─────────────┘                     └──────────────────┘
       │                                     │
       │  WebRTC (P2P)                       │ In-Memory
       │                                     │ Room State
       ▼                                     ▼
┌─────────────┐                     ┌──────────────────┐
│   Browser   │                     │  DashMap         │
│  (SDK)      │                     │  (Rooms/Peers)   │
└─────────────┘                     └──────────────────┘`}</pre>
</div>

<h2 class="text-2xl font-bold mt-8 mb-4">Components</h2>

<div class="space-y-4 mb-6">
  <div class="brutalist-box">
    <h3 class="font-bold mb-2">Signaling Server (Rust)</h3>
    <ul class="text-sm list-disc ml-6 space-y-1">
      <li>WebSocket server for signaling</li>
      <li>Room management & peer coordination</li>
      <li>Optional API key authentication</li>
      <li>In-memory state (no database required)</li>
    </ul>
  </div>

  <div class="brutalist-box">
    <h3 class="font-bold mb-2">SDK Packages</h3>
    <ul class="text-sm list-disc ml-6 space-y-1">
      <li><span class="font-mono">@treyorr/voca-client</span> - Core TypeScript SDK</li>
      <li><span class="font-mono">@treyorr/voca-svelte</span> - Svelte 5 runes wrapper</li>
      <li><span class="font-mono">@treyorr/voca-react</span> - React hooks wrapper</li>
    </ul>
  </div>

  <div class="brutalist-box">
    <h3 class="font-bold mb-2">WebRTC Connection</h3>
    <ul class="text-sm list-disc ml-6 space-y-1">
      <li>Peer-to-peer audio streams</li>
      <li>Uses public STUN servers (Google)</li>
      <li>No media server required</li>
      <li>Works for 90%+ of networks without TURN</li>
    </ul>
  </div>
</div>

<h2 class="text-2xl font-bold mt-8 mb-4">Scalability</h2>

<div class="brutalist-box mb-6">
  <p class="text-sm mb-2"><strong>Per Server Instance:</strong></p>
  <ul class="text-sm list-disc ml-6 space-y-1">
    <li>10000 concurrent rooms by default (configurable)</li>
    <li>6 peers per room by default (configurable)</li>
    <li>Minimal CPU/memory (Rust + no media processing)</li>
  </ul>
  
  <p class="text-sm mt-4 mb-2"><strong>Scaling Strategy:</strong></p>
  <ul class="text-sm list-disc ml-6 space-y-1">
    <li>Horizontal: Run multiple signaling servers</li>
    <li>Load balance by room ID (consistent hashing)</li>
    <li>No shared state needed between servers</li>
  </ul>
</div>
