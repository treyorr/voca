<h1 class="text-3xl font-bold mb-6">Getting Started</h1>

<h2 class="text-xl font-bold mt-8 mb-4">1. Install the SDK</h2>

<p class="mb-2">Choose your framework:</p>

<div class="space-y-2 mb-6">
  <div class="brutalist-box">
    <p class="font-bold text-sm mb-1">Core (any framework)</p>
    <pre
      class="bg-black text-white p-2 text-sm">npm install @treyorr/voca-client</pre>
  </div>
  <div class="brutalist-box">
    <p class="font-bold text-sm mb-1">Svelte 5</p>
    <pre
      class="bg-black text-white p-2 text-sm">npm install @treyorr/voca-svelte</pre>
  </div>
  <div class="brutalist-box">
    <p class="font-bold text-sm mb-1">React</p>
    <pre
      class="bg-black text-white p-2 text-sm">npm install @treyorr/voca-react</pre>
  </div>
</div>

<h2 class="text-xl font-bold mt-8 mb-4">2. Create a Room</h2>

<p class="mb-4">Before users can join a voice chat, create a room:</p>

<div class="brutalist-box mb-6">
  <p class="font-bold text-sm mb-2">Create Room & Get Shareable Link</p>
  <pre
    class="bg-black text-white p-3 text-sm overflow-x-auto">{`import { VocaClient } from '@treyorr/voca-client';

// Create a new room
const client = await VocaClient.createRoom({
  serverUrl: 'https://voca.vc',
  apiKey: 'your-api-key', // Get from voca.vc/docs
});

// Get the room ID to share
const roomId = client.roomId;
const inviteLink = \`https://myapp.com/room/\${roomId}\`;

// Connect to start voice chat
await client.connect();`}</pre>
</div>

<h2 class="text-xl font-bold mt-8 mb-4">3. Join an Existing Room</h2>

<p class="mb-4">When a user clicks an invite link, join that room:</p>

<div class="brutalist-box mb-6">
  <p class="font-bold text-sm mb-2">React Example</p>
  <pre
    class="bg-black text-white p-3 text-sm overflow-x-auto">{`import { useVocaRoom } from '@treyorr/voca-react';

function VoiceRoom({ roomId }) {
  const { status, peers, toggleMute, isMuted } = useVocaRoom(roomId, {
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
</div>

<h2 class="text-xl font-bold mt-8 mb-4">4. Listen to Events</h2>

<p class="mb-4">Monitor room activity and audio levels:</p>

<div class="brutalist-box mb-6">
  <pre
    class="bg-black text-white p-3 text-sm overflow-x-auto">{`client.on('peer-joined', (peerId) => {
  console.log('User joined:', peerId);
});

client.on('peer-left', (peerId) => {
  console.log('User left:', peerId);
});

client.on('peer-audio-level', (peerId, level) => {
  // level is 0-1, use for volume indicator UI
  updateVolumeIndicator(peerId, level);
});`}</pre>
</div>
