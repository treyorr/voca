# @treyorr/voca-client

Core TypeScript SDK for [Voca](https://voca.vc) WebRTC voice chat.

[![npm](https://img.shields.io/npm/v/@treyorr/voca-client)](https://www.npmjs.com/package/@treyorr/voca-client)

## Installation

```bash
npm install @treyorr/voca-client
# or
bun add @treyorr/voca-client
```

## Quick Start

### Create a Room

```typescript
import { VocaClient } from '@treyorr/voca-client';

// Create a new room and get a client
const client = await VocaClient.createRoom({
  serverUrl: 'wss://voca.vc', // or your self-hosted server
});

console.log('Share this room:', client.roomId);

// Connect to start voice chat
await client.connect();
```

### Join an Existing Room

```typescript
import { VocaClient } from '@treyorr/voca-client';

// Join a room by ID
const client = new VocaClient('abc123', {
  serverUrl: 'wss://voca.vc',
});

await client.connect();
```

## API

### `VocaClient.createRoom(config?)`

Creates a new room on the server and returns a connected client.

### `new VocaClient(roomId, config?)`

Join an existing room by ID.

### Config Options

| Option | Type | Description |
|--------|------|-------------|
| `serverUrl` | `string` | WebSocket server URL (e.g., `wss://voca.vc`) |
| `apiKey` | `string` | Optional API key for server auth |
| `reconnect.enabled` | `boolean` | Auto-reconnect on disconnect (default: true) |
| `reconnect.maxAttempts` | `number` | Max reconnection attempts (default: 5) |

### Methods

| Method | Returns | Description |
|--------|---------|-------------|
| `connect()` | `Promise<void>` | Connect to room and request mic access |
| `disconnect()` | `void` | Leave room and cleanup |
| `toggleMute()` | `boolean` | Toggle mute, returns new mute state |
| `on(event, callback)` | `() => void` | Subscribe to events |

### Events

| Event | Payload | Description |
|-------|---------|-------------|
| `status` | `ConnectionStatus` | Connection state changed |
| `error` | `VocaError` | Error occurred |
| `peer-joined` | `peerId: string` | New peer connected |
| `peer-left` | `peerId: string` | Peer disconnected |
| `peer-audio-level` | `(peerId, level)` | Peer speaking level (0-1) |
| `local-audio-level` | `level: number` | Your speaking level (0-1) |

## Framework Wrappers

For reactive state management, use our framework-specific packages:

- **Svelte 5**: [@treyorr/voca-svelte](https://npmjs.com/package/@treyorr/voca-svelte)
- **React**: [@treyorr/voca-react](https://npmjs.com/package/@treyorr/voca-react)

## License

MIT
