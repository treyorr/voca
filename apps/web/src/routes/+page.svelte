<script lang="ts">
  import { goto } from "$app/navigation";

  import { VocaClient } from "@treyorr/voca-svelte";

  let isCreating = $state(false);
  let error = $state<string | null>(null);

  async function createRoom() {
    isCreating = true;
    error = null;

    try {
      const client = await VocaClient.createRoom({
        serverUrl: import.meta.env.DEV ? "ws://localhost:3001" : undefined,
        apiKey: import.meta.env.VITE_VOCA_API_KEY,
      });
      goto(`/${client.roomId}`);
    } catch (err) {
      error = err instanceof Error ? err.message : "Unknown error";
      isCreating = false;
    }
  }
</script>

<svelte:head>
  <title>voca.vc</title>
</svelte:head>

<main class="min-h-screen flex flex-col items-center justify-center p-8">
  <div class="brutalist-box max-w-lg w-full text-center">
    <h1 class="text-4xl font-bold mb-4">voca.vc</h1>

    <p class="mb-8 text-sm">
      ephemeral voice rooms.<br />
      one click. no auth. pure p2p.
    </p>

    <button
      class="brutalist-button text-xl"
      onclick={createRoom}
      disabled={isCreating}
    >
      {#if isCreating}
        [ CREATING... ]
      {:else}
        [ CREATE ROOM ]
      {/if}
    </button>

    {#if error}
      <p class="mt-4 text-sm border border-black p-2 bg-black text-white">
        ERROR: {error}
      </p>
    {/if}
  </div>

  <footer class="mt-8 text-xs">
    <div class="brutalist-box inline-block">
      rooms auto-destruct when last peer disconnects
    </div>
    <div class="mt-4 flex gap-4 justify-center">
      <a href="/docs" class="hover:underline">[ DOCS ]</a>
      <a
        href="https://github.com/treyorr/voca"
        class="hover:underline"
        target="_blank">[ GITHUB ]</a
      >
    </div>
  </footer>
</main>
