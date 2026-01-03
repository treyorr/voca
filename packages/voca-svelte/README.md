# @voca/svelte

Svelte 5 Runes wrapper for Voca WebRTC voice chat.

## Installation

```bash
npm install @voca/svelte
```

## Quick Start

### Create a Room
```typescript
import { VocaClient } from '@voca/client';

async function createRoom() {
  const client = await VocaClient.createRoom();
  goto(`/room/${client.roomId}`);
}
```

### Join a Room
```svelte
<script lang="ts">
  import { VocaRoom } from '@voca/svelte';

  const room = new VocaRoom('my-room');
  
  $effect(() => {
    room.connect();
    return () => room.disconnect();
  });
</script>

<p>Status: {room.status}</p>
<p>Peers: {room.peers.size}</p>

<button onclick={() => room.toggleMute()}>
  {room.isMuted ? 'Unmute' : 'Mute'}
</button>
```

## API

### `new VocaRoom(roomId, config?)`

Creates a reactive room instance with Svelte 5 runes.

### Reactive Properties

- `room.status` - Connection status
- `room.peers` - Map of connected peers
- `room.isMuted` - Mute state
- `room.localAudioLevel` - Local audio level (0-1)
- `room.localStream` - Local MediaStream

### Methods

- `room.connect()` - Connect to room
- `room.disconnect()` - Disconnect from room
- `room.toggleMute()` - Toggle mute

## License

MIT
