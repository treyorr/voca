<script lang="ts">
  import { page } from "$app/state";

  let { children } = $props();

  // Use $derived for reactive current path
  const currentPath = $derived(page.url.pathname);

  const isActive = (path: string) => {
    if (currentPath === path) return true;
    if (path !== "/docs" && currentPath.startsWith(path + "/")) return true;
    return false;
  };
</script>

<svelte:head>
  <title>Docs | voca.vc</title>
</svelte:head>

<div class="min-h-screen flex flex-col md:flex-row">
  <!-- Sidebar Navigation -->
  <nav
    class="w-full md:w-64 border-b-4 md:border-b-0 md:border-r-4 border-voca-border p-4 md:p-6"
  >
    <a href="/" class="block font-bold text-xl mb-6">← voca.vc</a>

    <ul class="space-y-2">
      <li>
        <a
          href="/docs"
          class="block px-3 py-2 border-2 border-voca-border {isActive(
            '/docs',
          ) && currentPath === '/docs'
            ? 'bg-voca-fg text-voca-bg'
            : 'hover:bg-voca-fg hover:text-voca-bg'}"
        >
          Overview
        </a>
      </li>
      <li>
        <a
          href="/docs/getting-started"
          class="block px-3 py-2 border-2 border-voca-border {isActive(
            '/docs/getting-started',
          )
            ? 'bg-voca-fg text-voca-bg'
            : 'hover:bg-voca-fg hover:text-voca-bg'}"
        >
          Getting Started
        </a>
      </li>
      <li>
        <a
          href="/docs/api"
          class="block px-3 py-2 border-2 border-voca-border {isActive(
            '/docs/api',
          )
            ? 'bg-voca-fg text-voca-bg'
            : 'hover:bg-voca-fg hover:text-voca-bg'}"
        >
          API Reference
        </a>
      </li>
      <li>
        <a
          href="/docs/architecture"
          class="block px-3 py-2 border-2 border-voca-border {isActive(
            '/docs/architecture',
          )
            ? 'bg-voca-fg text-voca-bg'
            : 'hover:bg-voca-fg hover:text-voca-bg'}"
        >
          Architecture
        </a>
      </li>
      <li>
        <a
          href="/docs/self-hosting"
          class="block px-3 py-2 border-2 border-voca-border {isActive(
            '/docs/self-hosting',
          )
            ? 'bg-voca-fg text-voca-bg'
            : 'hover:bg-voca-fg hover:text-voca-bg'}"
        >
          Self-Hosting
        </a>
      </li>
    </ul>

    <div class="mt-8 pt-4 border-t-2 border-voca-border">
      <p class="text-xs font-bold mb-2">PACKAGES</p>
      <div class="space-y-1 text-sm">
        <a
          href="https://npmjs.com/package/@treyorr/voca-client"
          class="block hover:underline"
          target="_blank">@treyorr/voca-client</a
        >
        <a
          href="https://npmjs.com/package/@treyorr/voca-svelte"
          class="block hover:underline"
          target="_blank">@treyorr/voca-svelte</a
        >
        <a
          href="https://npmjs.com/package/@treyorr/voca-react"
          class="block hover:underline"
          target="_blank">@treyorr/voca-react</a
        >
      </div>
    </div>
  </nav>

  <!-- Main Content -->
  <main class="flex-1 p-6 md:p-8 max-w-4xl">
    {@render children?.()}
  </main>
</div>
