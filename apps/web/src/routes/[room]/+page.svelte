<script lang="ts">
  import { page } from "$app/state";
  import { goto } from "$app/navigation";
  import { VocaRoom } from "@treyorr/voca-svelte";
  import { onMount, onDestroy } from "svelte";

  const roomId = $derived(page.params.room);
  let room = $state<VocaRoom | null>(null);

  // Server URL - SDK auto-converts http to ws
  const serverUrl = import.meta.env.DEV ? "http://localhost:3001" : undefined;

  onMount(() => {
    if (!roomId) {
      goto("/");
      return;
    }

    // Initialize and connect using only the SDK
    room = new VocaRoom(roomId, { serverUrl });
  });

  onDestroy(() => {
    room?.disconnect();
  });

  function leaveRoom() {
    room?.disconnect();
    goto("/");
  }

  function copyLink() {
    navigator.clipboard.writeText(window.location.href);
  }

  function retryConnection() {
    if (!roomId) return;
    room?.disconnect();
    room = new VocaRoom(roomId, { serverUrl });
  }
</script>

<svelte:head>
  <title>voca.vc/{roomId}</title>
</svelte:head>

<!-- Error Overlay -->
{#if room?.status === "full" || room?.status === "error"}
  <div
    class="fixed inset-0 bg-black/95 flex items-center justify-center z-[100] p-4"
  >
    <div class="bg-white border-4 border-black p-8 max-w-md w-full text-center">
      <h1 class="text-4xl font-bold mb-4 font-mono">
        {#if room.status === "full"}
          ROOM FULL
        {:else}
          ERROR
        {/if}
      </h1>
      <p class="text-sm mb-4">
        {room.error ?? "An unexpected error occurred"}
      </p>
      <div class="bg-black text-white px-2 py-1 text-xs mb-4 inline-block">
        {room.errorCode ?? "UNKNOWN"}
      </div>
      <div class="flex gap-2 justify-center flex-wrap">
        {#if room.status !== "full"}
          <button class="brutalist-button" onclick={retryConnection}>
            [ RETRY ]
          </button>
        {/if}
        <button class="brutalist-button" onclick={leaveRoom}>
          [ GO HOME ]
        </button>
      </div>
    </div>
  </div>
{/if}

<main class="min-h-screen p-4 sm:p-8 pb-20">
  <header
    class="brutalist-box flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3"
  >
    <div class="min-w-0">
      <h1 class="text-lg sm:text-xl font-bold truncate">
        voca.vc/<span class="font-normal">{roomId}</span>
      </h1>
    </div>
    <div class="flex gap-2 flex-shrink-0">
      <button
        class="brutalist-button text-xs sm:text-sm flex-1 sm:flex-none"
        onclick={copyLink}
      >
        [ COPY ]
      </button>
      <button
        class="brutalist-button text-xs sm:text-sm flex-1 sm:flex-none"
        onclick={leaveRoom}
      >
        [ LEAVE ]
      </button>
    </div>
  </header>

  {#if room?.status === "connecting"}
    <div class="brutalist-box mt-4">
      <p>CONNECTING...</p>
      <p class="text-xs mt-2">Requesting microphone access...</p>
    </div>
  {:else if room?.status === "connected"}
    <div
      class="mt-4 mx-2 grid gap-2 sm:gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3"
    >
      <!-- Local peer (you) -->
      <div class="peer-box" style={room?.getPulseStyle(room.localAudioLevel)}>
        <div class="flex-1 min-w-0">
          <p class="font-bold text-sm sm:text-base">YOU</p>
          <p class="text-xs">
            {#if room?.isMuted}
              [MUTED]
            {:else}
              [LIVE]
            {/if}
          </p>
        </div>
        <button
          class="brutalist-button text-xs flex-shrink-0"
          onclick={() => room?.toggleMute()}
        >
          {#if room?.isMuted}
            [ UNMUTE ]
          {:else}
            [ MUTE ]
          {/if}
        </button>
      </div>

      <!-- Remote peers -->
      {#each Array.from(room?.peers.entries() ?? []) as [peerId, peer]}
        <div class="peer-box" style={room?.getPulseStyle(peer.audioLevel)}>
          <div class="flex-1 min-w-0">
            <p class="font-bold text-sm sm:text-base">PEER</p>
            <p class="text-xs font-mono truncate">{peerId.slice(0, 6)}</p>
          </div>
          <div class="text-xs flex-shrink-0">[CONNECTED]</div>
        </div>
      {/each}
    </div>

    {#if (room?.peers.size ?? 0) === 0}
      <div class="brutalist-box mt-4 text-center">
        <p class="text-sm">No peers connected yet.</p>
        <p class="text-xs mt-2">Share the link to invite others.</p>
        <pre
          class="mt-4 text-xs bg-black text-white p-2 inline-block">{typeof window !==
          "undefined"
            ? window.location.href
            : `voca.vc/${roomId}`}</pre>
      </div>
    {/if}
  {/if}

  <footer
    class="fixed bottom-0 left-0 right-0 p-4 text-xs text-center border-t border-black bg-white"
  >
    <pre>STATUS: {room?.getStatusLabel() ??
        "LOADING"} | PEERS: {room?.peerCount ?? 1}/{room?.roomCapacity ??
        6} | ROOM: {roomId}</pre>
  </footer>
</main>
