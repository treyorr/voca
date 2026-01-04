# @treyorr/voca-svelte

Svelte 5 wrapper for [Voca](https://voca.vc) WebRTC voice chat.

[![npm](https://img.shields.io/npm/v/@treyorr/voca-svelte)](https://www.npmjs.com/package/@treyorr/voca-svelte)

## Installation

```bash
npm install @treyorr/voca-svelte
```

## Prerequisites

You need a Voca server to connect to:
- **Free**: Use `https://voca.vc` with an API key from [voca.vc/docs](https://voca.vc/docs)
- **Self-hosted**: Run your own server (see [self-hosting guide](https://voca.vc/docs/self-hosting))

## What This Package Provides

This package provides **reactive Svelte 5 state** around the core `@treyorr/voca-client`:

- `VocaRoom` - A class with reactive `$state` properties for Svelte components
- `VocaClient` - Re-exported for room creation

## Usage

### Full Example: Create Room → Join → Voice Chat

```svelte
<script lang="ts">
  import { VocaClient, VocaRoom } from '@treyorr/voca-svelte';
  import { onDestroy } from 'svelte';

  const SERVER_URL = 'https://voca.vc';
  const API_KEY = 'your-api-key'; // Get from voca.vc/docs

  let room = $state<VocaRoom | null>(null);
  let roomId = $state<string | null>(null);

  async function createRoom() {
    // Step 1: Create a room on the server
    const client = await VocaClient.createRoom({
      serverUrl: SERVER_URL,
      apiKey: API_KEY,
    });
    roomId = client.roomId;

    // Step 2: Create reactive VocaRoom and connect
    room = new VocaRoom(roomId, { serverUrl: SERVER_URL, apiKey: API_KEY });
    await room.connect();
  }

  onDestroy(() => room?.disconnect());
</script>

{#if room?.isConnected}
  <p>Room: {roomId}</p>
  <p>Status: {room.status}</p>
  <p>Peers: {room.peerCount}</p>
  <button onclick={() => room?.toggleMute()}>
    {room.isMuted ? 'Unmute' : 'Mute'}
  </button>
{:else}
  <button onclick={createRoom}>Create Room</button>
{/if}
```

### Join an Existing Room

```svelte
<script lang="ts">
  import { VocaRoom } from '@treyorr/voca-svelte';
  import { onMount, onDestroy } from 'svelte';

  let { roomId } = $props<{ roomId: string }>();

  const room = new VocaRoom(roomId, {
    serverUrl: 'https://voca.vc',
    apiKey: 'your-api-key',
  });

  onMount(() => room.connect());
  onDestroy(() => room.disconnect());
</script>

<p>Status: {room.status}</p>
<p>Peers: {room.peerCount}</p>
```

## VocaRoom API

### Reactive Properties (Svelte 5 runes)

| Property | Type | Description |
|----------|------|-------------|
| `status` | `ConnectionStatus` | `'connecting'`, `'connected'`, `'error'`, etc. |
| `isConnected` | `boolean` | Whether connected |
| `peers` | `Map<string, Peer>` | Connected peers |
| `peerCount` | `number` | Total participants (including you) |
| `isMuted` | `boolean` | Your mute state |
| `localAudioLevel` | `number` | Your audio level (0-1) |
| `error` | `string \| null` | Error message |

### Methods

| Method | Description |
|--------|-------------|
| `connect()` | Connect to room |
| `disconnect()` | Leave room |
| `toggleMute()` | Toggle your microphone |

## Requirements

- Svelte 5+ (uses `$state`, `$props`, `$derived` runes)

## License

MIT
