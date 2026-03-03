<script lang="ts">
  import { page } from "$app/state";
  import { goto } from "$app/navigation";
  import { VocaRoom } from "@treyorr/voca-svelte";
  import { onMount, onDestroy } from "svelte";
  import { playJoinSound, playLeaveSound } from "$lib/sounds";

  const roomId = $derived(page.params.room);
  let room = $state<VocaRoom | null>(null);
  let passwordInput = $state("");
  let roomPassword = $state<string | undefined>(undefined);

  // Track peer count to play join/leave sounds
  let prevPeerSize = -1; // -1 = not yet initialized (skip initial load)
  $effect(() => {
    const currentSize = room?.peers.size ?? 0;
    if (room?.status === "connected") {
      if (prevPeerSize === -1) {
        // First time seeing peers after connect — don't play sounds
        prevPeerSize = currentSize;
      } else if (currentSize > prevPeerSize) {
        playJoinSound();
      } else if (currentSize < prevPeerSize) {
        playLeaveSound();
      }
      prevPeerSize = currentSize;
    }
  });

  // Config - SDK auto-converts http to ws
  const serverUrl = import.meta.env.DEV ? "http://localhost:3001" : undefined;
  const apiKey = import.meta.env.VITE_VOCA_API_KEY || "";

  // Derived state for password errors
  const needsPassword = $derived(
    room?.errorCode === "password_required" ||
      room?.errorCode === "invalid_password",
  );
  const isPasswordWrong = $derived(room?.errorCode === "invalid_password");

  onMount(() => {
    if (!roomId) {
      goto("/");
      return;
    }

    // Extract password from URL if present
    const urlParams = new URLSearchParams(window.location.search);
    const urlPassword = urlParams.get("password");

    if (urlPassword) {
      roomPassword = urlPassword;
    }

    connectToRoom(urlPassword ?? undefined);
  });

  function connectToRoom(password?: string) {
    room?.disconnect();
    room = new VocaRoom(roomId, { serverUrl, apiKey, password });
    room.connect().catch(() => {
      // Errors handled via reactive state
    });
  }

  function submitPassword() {
    const password = passwordInput.trim();
    if (!password) return;
    roomPassword = password;
    passwordInput = "";

    // Update URL with the correct password
    const url = new URL(window.location.href);
    url.searchParams.set("password", password);
    window.history.replaceState({}, "", url.toString());

    connectToRoom(password);
  }

  onDestroy(() => {
    room?.disconnect();
  });

  function leaveRoom() {
    room?.disconnect();
    goto("/");
  }

  function copyLink() {
    const url = new URL(window.location.href);
    if (roomPassword) {
      url.searchParams.set("password", roomPassword);
    }
    navigator.clipboard.writeText(url.toString());
  }

  function retryConnection() {
    connectToRoom(roomPassword);
  }
</script>

<svelte:head>
  <title>voca.vc/{roomId}</title>
</svelte:head>

<!-- Password Modal - shown when password is required or incorrect -->
{#if needsPassword}
  <div
    class="fixed inset-0 flex items-center justify-center z-[100] p-4 modal-overlay backdrop-blur-md"
  >
    <div
      class="border-4 border-voca-border bg-voca-bg text-voca-fg p-8 max-w-md w-full"
    >
      <h1 class="text-2xl font-bold mb-4 font-mono">
        {isPasswordWrong ? "INCORRECT PASSWORD" : "PASSWORD REQUIRED"}
      </h1>
      <p class="text-sm mb-4">
        {isPasswordWrong
          ? "The password you entered is incorrect. Please try again."
          : "This room is password-protected. Enter the password to join."}
      </p>
      <form
        onsubmit={(e) => {
          e.preventDefault();
          submitPassword();
        }}
      >
        <input
          type="password"
          bind:value={passwordInput}
          placeholder="Enter password"
          class="brutalist-input w-full mb-4"
          autofocus
        />
        <div class="flex gap-2">
          <button type="submit" class="brutalist-button flex-1">
            [ JOIN ]
          </button>
          <button
            type="button"
            class="brutalist-button flex-1"
            onclick={() => goto("/")}
          >
            [ CANCEL ]
          </button>
        </div>
      </form>
    </div>
  </div>
{/if}

<!-- Error Overlay (non-password errors) -->
{#if room?.status === "error" && !needsPassword}
  <div
    class="fixed inset-0 flex items-center justify-center z-[100] p-4 modal-overlay backdrop-blur-md"
  >
    <div
      class="border-4 border-voca-border bg-voca-bg text-voca-fg p-8 max-w-md w-full text-center"
    >
      <h1 class="text-4xl font-bold mb-4 font-mono">ERROR</h1>
      <p class="text-sm mb-4">
        {room.error ?? "An unexpected error occurred"}
      </p>
      <div class="bg-voca-fg text-voca-bg px-2 py-1 text-xs mb-4 inline-block">
        {room.errorCode ?? "UNKNOWN"}
      </div>
      <div class="flex gap-2 justify-center flex-wrap">
        <button class="brutalist-button" onclick={retryConnection}>
          [ RETRY ]
        </button>
        <button class="brutalist-button" onclick={leaveRoom}>
          [ GO HOME ]
        </button>
      </div>
    </div>
  </div>
{/if}

<!-- Room Full Overlay -->
{#if room?.status === "full"}
  <div
    class="fixed inset-0 flex items-center justify-center z-[100] p-4 modal-overlay backdrop-blur-md"
  >
    <div
      class="border-4 border-voca-border bg-voca-bg text-voca-fg p-8 max-w-md w-full text-center"
    >
      <h1 class="text-4xl font-bold mb-4 font-mono">ROOM FULL</h1>
      <p class="text-sm mb-4">
        {room.error ?? "This room is at maximum capacity"}
      </p>
      <div class="flex gap-2 justify-center">
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
            <div class="flex items-center gap-2">
              <p class="font-bold text-sm sm:text-base">PEER</p>
              <span class="font-mono text-xs opacity-70">
                {peerId.slice(0, 6)}
              </span>
            </div>
            <p class="text-xs">
              {#if peer.remoteMuted}
                [SELF-MUTED]
              {:else}
                [LIVE]
              {/if}
            </p>
          </div>
          <button
            class="brutalist-button text-xs flex-shrink-0"
            onclick={() => room?.togglePeerMute(peerId)}
          >
            {#if peer.localMuted}
              [ UNMUTE ]
            {:else}
              [ MUTE ]
            {/if}
          </button>
        </div>
      {/each}
    </div>

    {#if (room?.peers.size ?? 0) === 0}
      <div class="brutalist-box mt-4 text-center">
        <p class="text-sm">No peers connected yet.</p>
        <p class="text-xs mt-2">Share the link to invite others.</p>
        <pre
          class="mt-4 text-xs bg-voca-fg text-voca-bg p-2 inline-block">{typeof window !==
          "undefined"
            ? window.location.href
            : `voca.vc/${roomId}`}</pre>
      </div>
    {/if}
  {/if}

  <footer
    class="fixed bottom-0 left-0 right-0 p-4 text-xs text-center border-t border-voca-border bg-voca-bg text-voca-fg"
  >
    <pre>STATUS: {room?.getStatusLabel() ??
        "LOADING"} | PEERS: {room?.peerCount ?? 1}/{room?.roomCapacity ??
        6} | ROOM: {roomId}{roomPassword ? " | 🔒" : ""}</pre>
  </footer>
</main>
