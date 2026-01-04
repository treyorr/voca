<script lang="ts">
  let selectedSdk = $state<"core" | "svelte" | "react">("core");
</script>

<h1 class="text-3xl font-bold mb-6">Getting Started</h1>

<p class="mb-6">
  Choose your framework and follow the steps to add voice chat to your app.
</p>

<!-- SDK Selector -->
<div class="flex gap-2 mb-8">
  <button
    class="brutalist-button text-sm {selectedSdk === 'core'
      ? 'bg-black text-white'
      : ''}"
    onclick={() => (selectedSdk = "core")}
  >
    Core SDK
  </button>
  <button
    class="brutalist-button text-sm {selectedSdk === 'svelte'
      ? 'bg-black text-white'
      : ''}"
    onclick={() => (selectedSdk = "svelte")}
  >
    Svelte 5
  </button>
  <button
    class="brutalist-button text-sm {selectedSdk === 'react'
      ? 'bg-black text-white'
      : ''}"
    onclick={() => (selectedSdk = "react")}
  >
    React
  </button>
</div>

<!-- Step 1: Install -->
<h2 class="text-xl font-bold mt-8 mb-4">1. Install the SDK</h2>

<div class="brutalist-box mb-6">
  {#if selectedSdk === "core"}
    <pre
      class="bg-black text-white p-3 text-sm">npm install @treyorr/voca-client</pre>
  {:else if selectedSdk === "svelte"}
    <pre
      class="bg-black text-white p-3 text-sm">npm install @treyorr/voca-svelte</pre>
  {:else}
    <pre
      class="bg-black text-white p-3 text-sm">npm install @treyorr/voca-react</pre>
  {/if}
</div>

<!-- Step 2: Create Room -->
<h2 class="text-xl font-bold mt-8 mb-4">2. Create a Room</h2>

<p class="mb-4">Create a room to get a shareable room ID:</p>

<div class="brutalist-box mb-6">
  {#if selectedSdk === "core"}
    <pre
      class="bg-black text-white p-3 text-sm overflow-x-auto">{`import { VocaClient } from '@treyorr/voca-client';

const client = await VocaClient.createRoom({
  serverUrl: 'https://voca.vc',  // or wss://
  apiKey: 'your-api-key',
});

// Share this room ID with others
console.log('Room ID:', client.roomId);

// Connect to start voice chat
await client.connect();`}</pre>
  {:else if selectedSdk === "svelte"}
    <pre
      class="bg-black text-white p-3 text-sm overflow-x-auto">{`<script lang="ts">
  import { VocaClient, VocaRoom } from '@treyorr/voca-svelte';
  import { onDestroy } from 'svelte';

  let room = $state<VocaRoom | null>(null);

  async function createRoom() {
    const client = await VocaClient.createRoom({
      serverUrl: 'https://voca.vc',
      apiKey: 'your-api-key',
    });
    
    room = new VocaRoom(client.roomId, {
      serverUrl: 'https://voca.vc',
      apiKey: 'your-api-key',
    });
    await room.connect();
  }

  onDestroy(() => room?.disconnect());
</script>

{#if room?.isConnected}
  <p>Connected! Peers: {room.peerCount}</p>
  <button onclick={() => room?.toggleMute()}>
    {room.isMuted ? 'Unmute' : 'Mute'}
  </button>
{:else}
  <button onclick={createRoom}>Create Room</button>
{/if}`}</pre>
  {:else}
    <pre
      class="bg-black text-white p-3 text-sm overflow-x-auto">{`import { useState } from 'react';
import { VocaClient, useVocaRoom } from '@treyorr/voca-react';

function App() {
  const [roomId, setRoomId] = useState<string | null>(null);

  async function createRoom() {
    const client = await VocaClient.createRoom({
      serverUrl: 'https://voca.vc',
      apiKey: 'your-api-key',
    });
    setRoomId(client.roomId);
  }

  if (!roomId) {
    return <button onClick={createRoom}>Create Room</button>;
  }

  return <VoiceRoom roomId={roomId} />;
}

function VoiceRoom({ roomId }: { roomId: string }) {
  const { status, peers, isMuted, toggleMute } = useVocaRoom(roomId, {
    serverUrl: 'https://voca.vc',
    apiKey: 'your-api-key',
  });

  return (
    <div>
      <p>Status: {status}</p>
      <p>Peers: {peers.size}</p>
      <button onClick={toggleMute}>
        {isMuted ? 'Unmute' : 'Mute'}
      </button>
    </div>
  );
}`}</pre>
  {/if}
</div>

<!-- Step 3: Join Room -->
<h2 class="text-xl font-bold mt-8 mb-4">3. Join an Existing Room</h2>

<p class="mb-4">When someone shares a room ID with you:</p>

<div class="brutalist-box mb-6">
  {#if selectedSdk === "core"}
    <pre
      class="bg-black text-white p-3 text-sm overflow-x-auto">{`import { VocaClient } from '@treyorr/voca-client';

const client = new VocaClient('room-id-here', {
  serverUrl: 'https://voca.vc',
  apiKey: 'your-api-key',
});

await client.connect();

// Listen for events
client.on('peer-joined', (peerId) => console.log('Peer joined:', peerId));
client.on('peer-left', (peerId) => console.log('Peer left:', peerId));`}</pre>
  {:else if selectedSdk === "svelte"}
    <pre
      class="bg-black text-white p-3 text-sm overflow-x-auto">{`<script lang="ts">
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

{#each Array.from(room.peers.entries()) as [id, peer]}
  <div>Peer {id.slice(0, 6)} - Level: {peer.audioLevel}</div>
{/each}`}</pre>
  {:else}
    <pre
      class="bg-black text-white p-3 text-sm overflow-x-auto">{`import { useVocaRoom } from '@treyorr/voca-react';

function VoiceRoom({ roomId }: { roomId: string }) {
  const {
    status,
    peers,
    isMuted,
    localAudioLevel,
    toggleMute,
    disconnect,
  } = useVocaRoom(roomId, {
    serverUrl: 'https://voca.vc',
    apiKey: 'your-api-key',
  });

  return (
    <div>
      <p>Status: {status}</p>
      <p>Your audio level: {Math.round(localAudioLevel * 100)}%</p>
      
      {Array.from(peers.entries()).map(([id, peer]) => (
        <div key={id}>
          Peer {id.slice(0, 6)} - Level: {peer.audioLevel}
        </div>
      ))}

      <button onClick={toggleMute}>
        {isMuted ? 'Unmute' : 'Mute'}
      </button>
      <button onClick={disconnect}>Leave</button>
    </div>
  );
}`}</pre>
  {/if}
</div>

<!-- Note about API key -->
<div class="brutalist-box mt-8">
  <h3 class="font-bold mb-2">📌 Get Your API Key</h3>
  <p class="text-sm">
    The hosted service at <strong>voca.vc</strong> is free to use. You can also
    <a href="/docs/self-hosting" class="underline">self-host</a> for full control.
  </p>
</div>
