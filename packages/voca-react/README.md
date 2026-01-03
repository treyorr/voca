# @treyorr/voca-react

React hooks for [Voca](https://voca.vc) WebRTC voice chat.

[![npm](https://img.shields.io/npm/v/@treyorr/voca-react)](https://www.npmjs.com/package/@treyorr/voca-react)

## Installation

```bash
npm install @treyorr/voca-react
# or
bun add @treyorr/voca-react
```

## Quick Start

### Create and Join a Room

```tsx
import { useState } from 'react';
import { VocaClient, useVocaRoom } from '@treyorr/voca-react';

function App() {
  const [roomId, setRoomId] = useState<string | null>(null);

  async function createRoom() {
    const client = await VocaClient.createRoom({
      serverUrl: 'wss://voca.vc',
    });
    setRoomId(client.roomId);
  }

  if (!roomId) {
    return <button onClick={createRoom}>Create Room</button>;
  }

  return <VoiceRoom roomId={roomId} />;
}

function VoiceRoom({ roomId }: { roomId: string }) {
  const { status, peers, isMuted, toggleMute, localAudioLevel } = useVocaRoom(roomId, {
    serverUrl: 'wss://voca.vc',
  });

  return (
    <div>
      <p>Status: {status}</p>
      <p>Peers: {peers.size}</p>
      <p>Audio Level: {Math.round(localAudioLevel * 100)}%</p>
      <button onClick={toggleMute}>
        {isMuted ? 'Unmute' : 'Mute'}
      </button>
    </div>
  );
}
```

### Join an Existing Room

```tsx
import { useVocaRoom } from '@treyorr/voca-react';

function VoiceRoom({ roomId }: { roomId: string }) {
  const { status, peers, isMuted, toggleMute } = useVocaRoom(roomId);

  return (
    <div>
      <p>Status: {status}</p>
      <p>Peers: {peers.size}</p>
      <button onClick={toggleMute}>
        {isMuted ? 'Unmute' : 'Mute'}
      </button>
    </div>
  );
}
```

## API

### `useVocaRoom(roomId, config?)`

React hook that manages voice room connection and state.

#### Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| `roomId` | `string` | Room ID to join |
| `config` | `VocaConfig` | Optional configuration |

#### Returns

| Property | Type | Description |
|----------|------|-------------|
| `status` | `ConnectionStatus` | `'connecting' \| 'connected' \| 'reconnecting' \| 'error' \| 'full' \| 'disconnected'` |
| `peers` | `Map<string, Peer>` | Connected peers with audio levels |
| `localStream` | `MediaStream \| null` | Your audio stream |
| `isMuted` | `boolean` | Whether you're muted |
| `localAudioLevel` | `number` | Your speaking level (0-1) |
| `toggleMute` | `() => void` | Toggle your mute state |
| `disconnect` | `() => void` | Leave the room |

### `VocaClient`

Re-exported from `@treyorr/voca-client` for room creation:

```typescript
const client = await VocaClient.createRoom({ serverUrl: 'wss://voca.vc' });
```

## Requirements

- React 18+

## License

MIT
