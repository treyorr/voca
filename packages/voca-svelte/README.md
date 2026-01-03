# @treyorr/voca-svelte

Svelte 5 wrapper for [Voca](https://voca.vc) WebRTC voice chat with reactive runes.

[![npm](https://img.shields.io/npm/v/@treyorr/voca-svelte)](https://www.npmjs.com/package/@treyorr/voca-svelte)

## Installation

```bash
npm install @treyorr/voca-svelte
# or
bun add @treyorr/voca-svelte
```

## Quick Start

### Create and Join a Room

```svelte
<script lang="ts">
  import { VocaClient, VocaRoom } from '@treyorr/voca-svelte';
  import { onMount, onDestroy } from 'svelte';

  let room = $state<VocaRoom | null>(null);

  async function createAndJoin() {
    // Create a new room using the core client
    const client = await VocaClient.createRoom({
      serverUrl: 'wss://voca.vc',
    });
    
    // Use VocaRoom for reactive Svelte state
    room = new VocaRoom(client.roomId, {
      serverUrl: 'wss://voca.vc',
    });
    await room.connect();
  }

  onDestroy(() => room?.disconnect());
</script>

{#if room?.isConnected}
  <p>Status: {room.status}</p>
  <p>Peers: {room.peerCount}</p>
  <button onclick={() => room?.toggleMute()}>
    {room.isMuted ? 'Unmute' : 'Mute'}
  </button>
{:else}
  <button onclick={createAndJoin}>Create Room</button>
{/if}
```

### Join an Existing Room

```svelte
<script lang="ts">
  import { VocaRoom } from '@treyorr/voca-svelte';
  import { onMount, onDestroy } from 'svelte';

  let { roomId } = $props<{ roomId: string }>();
  
  let room = new VocaRoom(roomId, {
    serverUrl: 'wss://voca.vc',
  });

  onMount(() => room.connect());
  onDestroy(() => room.disconnect());
</script>

<p>Room: {roomId}</p>
<p>Status: {room.status}</p>
```

## API

### `VocaRoom`

Reactive wrapper around `VocaClient` with Svelte 5 runes.

#### Reactive State (runes)

| Property | Type | Description |
|----------|------|-------------|
| `status` | `ConnectionStatus` | Current connection state |
| `isConnected` | `boolean` | Whether connected to room |
| `peers` | `Map<string, Peer>` | Connected peers |
| `peerCount` | `number` | Number of peers + you |
| `isMuted` | `boolean` | Local audio mute state |
| `localAudioLevel` | `number` | Your speaking level (0-1) |
| `error` | `string \| null` | Error message if any |
| `errorCode` | `string \| null` | Error code if any |

#### Methods

| Method | Description |
|--------|-------------|
| `connect()` | Connect to room |
| `disconnect()` | Leave room |
| `toggleMute()` | Toggle local audio |
| `getPulseStyle(level)` | Get CSS for audio pulse animation |
| `getStatusLabel()` | Get human-readable status |

### `VocaClient`

Re-exported from `@treyorr/voca-client` for room creation:

```typescript
const client = await VocaClient.createRoom({ serverUrl: 'wss://voca.vc' });
```

## Requirements

- Svelte 5 (uses runes: `$state`, `$props`, `$derived`)

## License

MIT
