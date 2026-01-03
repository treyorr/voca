# @treyorr/voca-client

Core TypeScript SDK for Voca WebRTC signaling.

## Installation

```bash
npm install @treyorr/voca-client
```

## Quick Start

### Option 1: Create a New Room

```typescript
import { VocaClient } from '@treyorr/voca-client';

// Create a room and get a connected client
const client = await VocaClient.createRoom({
  serverUrl: 'wss://your-server.com',
});

console.log('Room ID:', client.roomId); // Share this with others
await client.connect();
```

### Option 2: Join an Existing Room

```typescript
import { VocaClient } from '@treyorr/voca-client';

const client = new VocaClient('abc123', {
  serverUrl: 'wss://your-server.com',
});

await client.connect();
```

## Common Use Cases

### Voice Chat App (Create + Share Link)
```typescript
const client = await VocaClient.createRoom();
const inviteLink = `https://myapp.com/room/${client.roomId}`;
// Share inviteLink with friends
await client.connect();
```

### Game Lobby (Join by Code)
```typescript
const roomCode = prompt('Enter room code:');
const client = new VocaClient(roomCode);
await client.connect();
```

### Check if Room is Full Before Joining
```typescript
const response = await fetch(`/api/room/${roomId}`);
const { exists, full, peers, capacity } = await response.json();

if (!exists) {
  alert('Room not found');
} else if (full) {
  alert(`Room is full (${peers}/${capacity})`);
} else {
  const client = new VocaClient(roomId);
  await client.connect();
}
```

## API Reference

### `VocaClient.createRoom(config?)`

Creates a new room on the server and returns a client instance.

```typescript
const client = await VocaClient.createRoom({
  serverUrl: 'wss://your-server.com', // Required in Node.js
});
```

### `new VocaClient(roomId, config?)`

Creates a client for joining an existing room.

### Config Options

| Option | Type | Description |
|--------|------|-------------|
| `serverUrl` | string | WebSocket server URL |
| `turnApiKey` | string | TURN API key for NAT traversal |
| `reconnect.enabled` | boolean | Enable auto-reconnect (default: true) |
| `reconnect.maxAttempts` | number | Max reconnection attempts (default: 5) |
| `reconnect.baseDelayMs` | number | Base delay for exponential backoff |

### Methods

| Method | Returns | Description |
|--------|---------|-------------|
| `connect()` | Promise | Connect to room |
| `disconnect()` | void | Leave room |
| `toggleMute()` | boolean | Toggle mute, returns new state |
| `on(event, callback)` | Function | Subscribe to events |

### Events

- `status` - Connection status changes
- `error` - Error events with typed codes
- `warning` - Non-fatal warnings
- `peer-joined` - Peer joined the room
- `peer-left` - Peer left the room
- `peer-audio-level` - Peer audio level (0-1)
- `local-audio-level` - Local audio level (0-1)

## License

MIT
