<script lang="ts">
  import { goto } from "$app/navigation";
  import { VocaClient, validatePassword } from "@treyorr/voca-svelte";

  let isCreating = $state(false);
  let error = $state<string | null>(null);
  let password = $state("");
  let showPasswordInput = $state(false);

  const serverUrl = import.meta.env.DEV ? "http://localhost:3001" : undefined;
  const apiKey = import.meta.env.VITE_VOCA_API_KEY || "";

  async function createRoom() {
    const trimmedPassword = password.trim();

    // UI-specific validation: require password if input is shown
    if (showPasswordInput && !trimmedPassword) {
      error = "Please enter a password or click '- remove password'";
      return;
    }

    // SDK validation: check format
    const validationError = validatePassword(trimmedPassword);
    if (validationError) {
      error = validationError;
      return;
    }

    isCreating = true;
    error = null;

    try {
      const client = await VocaClient.createRoom({
        serverUrl,
        apiKey,
        password: trimmedPassword || undefined,
      });
      goto(
        `/${client.roomId}${trimmedPassword ? `?password=${encodeURIComponent(trimmedPassword)}` : ""}`,
      );
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
      class="brutalist-button text-xl mb-4"
      onclick={createRoom}
      disabled={isCreating}
    >
      {#if isCreating}
        [ CREATING... ]
      {:else}
        [ CREATE ROOM ]
      {/if}
    </button>
    <br />
    <button
      type="button"
      class="text-xs underline opacity-60 hover:opacity-100"
      onclick={() => (showPasswordInput = !showPasswordInput)}
    >
      {showPasswordInput ? "- remove password" : "+ add password"}
    </button>

    {#if showPasswordInput}
      <div class="mt-4">
        <input
          type="text"
          bind:value={password}
          placeholder="4-12 chars, letters/numbers only"
          class="w-full border-2 border-black px-3 py-2 text-sm font-mono"
          disabled={isCreating}
          maxlength="12"
        />
      </div>
    {/if}

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
