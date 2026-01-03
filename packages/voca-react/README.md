# @treyorr/voca-react

React hooks for Voca WebRTC voice chat.

## Installation

```bash
npm install @treyorr/voca-react
```

## Quick Start

### Create a Room
```tsx
import { VocaClient } from '@treyorr/voca-react';

async function createRoom() {
  const client = await VocaClient.createRoom();
  window.location.href = `/room/${client.roomId}`;
}
```

### Join a Room
```tsx
import { useVocaRoom } from '@treyorr/voca-react';

function VoiceRoom({ roomId }: { roomId: string }) {
  const { status, peers, isMuted, toggleMute, disconnect } = useVocaRoom(roomId);

  return (
    <div>
      <p>Status: {status}</p>
      <p>Peers: {peers.size}</p>
      <button onClick={toggleMute}>{isMuted ? 'Unmute' : 'Mute'}</button>
      <button onClick={disconnect}>Leave</button>
    </div>
  );
}
```

## API

### `useVocaRoom(roomId, config?)`

React hook that manages voice room connection.

Returns:
- `status` - Connection status
- `peers` - Map of connected peers
- `localStream` - Local MediaStream
- `isMuted` - Mute state
- `localAudioLevel` - Audio level (0-1)
- `toggleMute()` - Toggle mute
- `disconnect()` - Leave room

### `VocaClient.createRoom(config?)`

Creates a new room and returns a client instance.

## License

MIT
