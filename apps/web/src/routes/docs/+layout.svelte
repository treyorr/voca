<script lang="ts">
  import { page } from '$app/state';
  
  // Use $derived for reactive current path
  const currentPath = $derived(page.url.pathname);
  
  const isActive = (path: string) => {
    if (currentPath === path) return true;
    if (path !== '/docs' && currentPath.startsWith(path + '/')) return true;
    return false;
  };
</script>

<svelte:head>
  <title>Docs | voca.vc</title>
</svelte:head>

<div class="min-h-screen flex flex-col md:flex-row">
  <!-- Sidebar Navigation -->
  <nav class="w-full md:w-64 border-b-4 md:border-b-0 md:border-r-4 border-black p-4 md:p-6">
    <a href="/" class="block font-bold text-xl mb-6">← voca.vc</a>
    
    <ul class="space-y-2">
      <li>
        <a 
          href="/docs" 
          class="block px-3 py-2 border-2 border-black {isActive('/docs') && currentPath === '/docs' ? 'bg-black text-white' : 'hover:bg-black hover:text-white'}"
        >
          Overview
        </a>
      </li>
      <li>
        <a 
          href="/docs/getting-started" 
          class="block px-3 py-2 border-2 border-black {isActive('/docs/getting-started') ? 'bg-black text-white' : 'hover:bg-black hover:text-white'}"
        >
          Getting Started
        </a>
      </li>
      <li>
        <a 
          href="/docs/api" 
          class="block px-3 py-2 border-2 border-black {isActive('/docs/api') ? 'bg-black text-white' : 'hover:bg-black hover:text-white'}"
        >
          API Reference
        </a>
      </li>
      <li>
        <a 
          href="/docs/architecture" 
          class="block px-3 py-2 border-2 border-black {isActive('/docs/architecture') ? 'bg-black text-white' : 'hover:bg-black hover:text-white'}"
        >
          Architecture
        </a>
      </li>
      <li>
        <a 
          href="/docs/self-hosting" 
          class="block px-3 py-2 border-2 border-black {isActive('/docs/self-hosting') ? 'bg-black text-white' : 'hover:bg-black hover:text-white'}"
        >
          Self-Hosting
        </a>
      </li>
    </ul>

    <div class="mt-8 pt-4 border-t-2 border-black">
      <p class="text-xs font-bold mb-2">PACKAGES</p>
      <div class="space-y-1 text-sm">
        <a href="https://npmjs.com/package/@voca/client" class="block hover:underline" target="_blank">@voca/client</a>
        <a href="https://npmjs.com/package/@voca/svelte" class="block hover:underline" target="_blank">@voca/svelte</a>
        <a href="https://npmjs.com/package/@voca/react" class="block hover:underline" target="_blank">@voca/react</a>
      </div>
    </div>
  </nav>

  <!-- Main Content -->
  <main class="flex-1 p-6 md:p-8 max-w-4xl">
    {@render children()}
  </main>
</div>
