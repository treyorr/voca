# @treyorr/voca-react

React hooks for [Voca](https://voca.vc) WebRTC voice chat.

[![npm](https://img.shields.io/npm/v/@treyorr/voca-react)](https://www.npmjs.com/package/@treyorr/voca-react)

## Installation

```bash
npm install @treyorr/voca-react
```

## Prerequisites

You need a Voca server to connect to:
- **Free**: Use `wss://voca.vc` with an API key from [voca.vc/docs](https://voca.vc/docs)
- **Self-hosted**: Run your own server (see [self-hosting guide](https://voca.vc/docs/self-hosting))

## What This Package Provides

- `useVocaRoom(roomId, config)` - React hook for joining a room with reactive state
- `VocaClient` - Re-exported for room creation

## Usage

### Full Example: Create Room → Join → Voice Chat

```tsx
import { useState } from 'react';
import { VocaClient, useVocaRoom } from '@treyorr/voca-react';

const SERVER_URL = 'wss://voca.vc';
const API_KEY = 'your-api-key'; // Get from voca.vc/docs

function App() {
  const [roomId, setRoomId] = useState<string | null>(null);

  async function createRoom() {
    // Create a room on the server
    const client = await VocaClient.createRoom({
      serverUrl: SERVER_URL,
      apiKey: API_KEY,
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
    serverUrl: SERVER_URL,
    apiKey: API_KEY,
  });

  return (
    <div>
      <p>Room: {roomId}</p>
      <p>Status: {status}</p>
      <p>Peers: {peers.size + 1}</p>
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
  const { status, peers, isMuted, toggleMute } = useVocaRoom(roomId, {
    serverUrl: 'wss://voca.vc',
    apiKey: 'your-api-key',
  });

  return (
    <div>
      <p>Status: {status}</p>
      <p>Peers: {peers.size}</p>
      <button onClick={toggleMute}>{isMuted ? 'Unmute' : 'Mute'}</button>
    </div>
  );
}
```

## useVocaRoom API

### Parameters

| Parameter | Required | Description |
|-----------|----------|-------------|
| `roomId` | Yes | Room ID to join |
| `config.serverUrl` | Yes | WebSocket URL (`wss://voca.vc` or self-hosted) |
| `config.apiKey` | No* | API key (*required for voca.vc) |

### Returns

| Property | Type | Description |
|----------|------|-------------|
| `status` | `ConnectionStatus` | `'connecting'`, `'connected'`, `'error'`, etc. |
| `peers` | `Map<string, Peer>` | Connected peers |
| `localStream` | `MediaStream \| null` | Your audio stream |
| `isMuted` | `boolean` | Your mute state |
| `localAudioLevel` | `number` | Your audio level (0-1) |
| `toggleMute` | `() => void` | Toggle your microphone |
| `disconnect` | `() => void` | Leave the room |

## Requirements

- React 18+

## License

MIT
