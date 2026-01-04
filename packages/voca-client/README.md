# @treyorr/voca-client

Core TypeScript SDK for [Voca](https://voca.vc) WebRTC voice chat.

[![npm](https://img.shields.io/npm/v/@treyorr/voca-client)](https://www.npmjs.com/package/@treyorr/voca-client)

## Installation

```bash
npm install @treyorr/voca-client
```

## Prerequisites

To use Voca, you need a signaling server. You have two options:

1. **Use voca.vc (free)** - Get your API key from [voca.vc/docs](https://voca.vc/docs)
2. **Self-host** - Run your own signaling server (see [self-hosting guide](https://voca.vc/docs/self-hosting))

## Quick Start

```typescript
import { VocaClient } from '@treyorr/voca-client';

// Create a new room
const client = await VocaClient.createRoom({
  serverUrl: 'https://voca.vc',
  apiKey: 'your-api-key', // Get this from voca.vc/docs
});

console.log('Share this room ID:', client.roomId);

// Connect to start voice chat
await client.connect();
```

## Joining an Existing Room

```typescript
const client = new VocaClient('room-id-here', {
  serverUrl: 'https://voca.vc',
  apiKey: 'your-api-key',
});

await client.connect();
```

## Configuration

| Option | Required | Description |
|--------|----------|-------------|
| `serverUrl` | **Yes** | Server URL (`https://voca.vc` or `wss://voca.vc` or your self-hosted server) |
| `apiKey` | No* | API key for authentication (*required for voca.vc) |
| `reconnect.enabled` | No | Auto-reconnect on disconnect (default: `true`) |
| `reconnect.maxAttempts` | No | Max reconnection attempts (default: `5`) |

## Methods

| Method | Description |
|--------|-------------|
| `VocaClient.createRoom(config)` | Create a new room, returns connected client |
| `new VocaClient(roomId, config)` | Join an existing room by ID |
| `connect()` | Connect to room and request microphone |
| `disconnect()` | Leave room and cleanup |
| `toggleMute()` | Toggle mute, returns new state |
| `on(event, callback)` | Subscribe to events |

## Events

| Event | Payload | Description |
|-------|---------|-------------|
| `status` | `ConnectionStatus` | Connection state changed |
| `error` | `{ code, message }` | Error occurred |
| `peer-joined` | `peerId` | New peer connected |
| `peer-left` | `peerId` | Peer disconnected |
| `peer-audio-level` | `(peerId, level)` | Peer's audio level (0-1) |
| `local-audio-level` | `level` | Your audio level (0-1) |

## Framework Wrappers

For reactive state management, use:

- **Svelte 5**: [@treyorr/voca-svelte](https://npmjs.com/package/@treyorr/voca-svelte)
- **React**: [@treyorr/voca-react](https://npmjs.com/package/@treyorr/voca-react)

These packages wrap `VocaClient` with framework-specific reactivity.

## License

MIT
