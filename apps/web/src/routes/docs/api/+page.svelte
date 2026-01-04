<h1 class="text-3xl font-bold mb-6">API Reference</h1>

<h2 class="text-2xl font-bold mt-8 mb-4" id="voca-client">
  @treyorr/voca-client
</h2>

<h3 class="text-lg font-bold mt-6 mb-2">VocaClient.createRoom(config?)</h3>

<p class="mb-2">
  Creates a new room on the server and returns a client instance.
</p>

<div class="brutalist-box mb-4">
  <pre
    class="bg-black text-white p-3 text-sm overflow-x-auto">{`const client = await VocaClient.createRoom({
  serverUrl: 'https://voca.vc',
  apiKey: 'your-api-key',
});
console.log(client.roomId); // e.g. "abc123"`}</pre>
</div>

<h3 class="text-lg font-bold mt-6 mb-2">new VocaClient(roomId, config?)</h3>

<p class="mb-2">Join an existing room by ID.</p>

<div class="brutalist-box mb-4">
  <pre
    class="bg-black text-white p-3 text-sm overflow-x-auto">{`const client = new VocaClient('abc123', config);`}</pre>
</div>

<h4 class="font-bold mt-4 mb-2">Config Options</h4>
<table class="w-full text-sm border-2 border-black mb-6">
  <thead class="bg-black text-white">
    <tr>
      <th class="p-2 text-left">Option</th>
      <th class="p-2 text-left">Type</th>
      <th class="p-2 text-left">Description</th>
    </tr>
  </thead>
  <tbody>
    <tr class="border-t border-black">
      <td class="p-2 font-mono">serverUrl</td>
      <td class="p-2">string</td>
      <td class="p-2">Server URL (https://voca.vc or your own)</td>
    </tr>
    <tr class="border-t border-black">
      <td class="p-2 font-mono">apiKey</td>
      <td class="p-2">string</td>
      <td class="p-2">API key for authentication</td>
    </tr>
    <tr class="border-t border-black">
      <td class="p-2 font-mono">reconnect</td>
      <td class="p-2">object</td>
      <td class="p-2">{`{ enabled, maxAttempts, baseDelayMs }`}</td>
    </tr>
  </tbody>
</table>

<h4 class="font-bold mt-4 mb-2">Methods</h4>
<table class="w-full text-sm border-2 border-black mb-6">
  <thead class="bg-black text-white">
    <tr>
      <th class="p-2 text-left">Method</th>
      <th class="p-2 text-left">Returns</th>
      <th class="p-2 text-left">Description</th>
    </tr>
  </thead>
  <tbody>
    <tr class="border-t border-black">
      <td class="p-2 font-mono">connect()</td>
      <td class="p-2">Promise</td>
      <td class="p-2">Connect to room</td>
    </tr>
    <tr class="border-t border-black">
      <td class="p-2 font-mono">disconnect()</td>
      <td class="p-2">void</td>
      <td class="p-2">Leave room</td>
    </tr>
    <tr class="border-t border-black">
      <td class="p-2 font-mono">toggleMute()</td>
      <td class="p-2">boolean</td>
      <td class="p-2">Toggle mute, returns new state</td>
    </tr>
    <tr class="border-t border-black">
      <td class="p-2 font-mono">on(event, callback)</td>
      <td class="p-2">Function</td>
      <td class="p-2">Subscribe to events, returns unsubscribe</td>
    </tr>
  </tbody>
</table>

<h4 class="font-bold mt-4 mb-2">Events</h4>
<table class="w-full text-sm border-2 border-black mb-6">
  <thead class="bg-black text-white">
    <tr>
      <th class="p-2 text-left">Event</th>
      <th class="p-2 text-left">Payload</th>
    </tr>
  </thead>
  <tbody>
    <tr class="border-t border-black">
      <td class="p-2 font-mono">status</td>
      <td class="p-2"
        >'connecting' | 'connected' | 'reconnecting' | 'disconnected' | 'error'
        | 'full'</td
      >
    </tr>
    <tr class="border-t border-black">
      <td class="p-2 font-mono">error</td>
      <td class="p-2">{`{ code: VocaErrorCode, message: string }`}</td>
    </tr>
    <tr class="border-t border-black">
      <td class="p-2 font-mono">warning</td>
      <td class="p-2">{`{ code: string, message: string }`}</td>
    </tr>
    <tr class="border-t border-black">
      <td class="p-2 font-mono">peer-joined</td>
      <td class="p-2">peerId: string</td>
    </tr>
    <tr class="border-t border-black">
      <td class="p-2 font-mono">peer-left</td>
      <td class="p-2">peerId: string</td>
    </tr>
    <tr class="border-t border-black">
      <td class="p-2 font-mono">peer-audio-level</td>
      <td class="p-2">(peerId: string, level: number)</td>
    </tr>
    <tr class="border-t border-black">
      <td class="p-2 font-mono">local-audio-level</td>
      <td class="p-2">level: number (0-1)</td>
    </tr>
  </tbody>
</table>

<h2
  class="text-2xl font-bold mt-12 mb-4 pt-4 border-t-2 border-black"
  id="error-codes"
>
  Error Codes
</h2>

<table class="w-full text-sm border-2 border-black">
  <thead class="bg-black text-white">
    <tr>
      <th class="p-2 text-left">Code</th>
      <th class="p-2 text-left">Description</th>
    </tr>
  </thead>
  <tbody>
    <tr class="border-t border-black">
      <td class="p-2 font-mono">ROOM_FULL</td>
      <td class="p-2">Room has reached max capacity</td>
    </tr>
    <tr class="border-t border-black">
      <td class="p-2 font-mono">ROOM_NOT_FOUND</td>
      <td class="p-2">Room does not exist</td>
    </tr>
    <tr class="border-t border-black">
      <td class="p-2 font-mono">CONNECTION_FAILED</td>
      <td class="p-2">Failed to establish connection</td>
    </tr>
    <tr class="border-t border-black">
      <td class="p-2 font-mono">WEBSOCKET_ERROR</td>
      <td class="p-2">WebSocket connection error</td>
    </tr>
    <tr class="border-t border-black">
      <td class="p-2 font-mono">MICROPHONE_NOT_FOUND</td>
      <td class="p-2">No microphone detected</td>
    </tr>
    <tr class="border-t border-black">
      <td class="p-2 font-mono">MICROPHONE_PERMISSION_DENIED</td>
      <td class="p-2">User denied microphone access</td>
    </tr>
    <tr class="border-t border-black">
      <td class="p-2 font-mono">INSECURE_CONTEXT</td>
      <td class="p-2">HTTPS required</td>
    </tr>
  </tbody>
</table>
