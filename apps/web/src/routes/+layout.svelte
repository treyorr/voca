<script lang="ts">
  import { onMount } from "svelte";
  import { applyTheme, getThemePreference } from "$lib/theme";

  import "../app.css";

  let { children } = $props();

  onMount(() => {
    applyTheme(getThemePreference());

    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    const handlePreferenceChange = () => {
      if (getThemePreference() === "system") applyTheme("system");
    };

    mediaQuery.addEventListener("change", handlePreferenceChange);
    return () => mediaQuery.removeEventListener("change", handlePreferenceChange);
  });
</script>

{@render children()}
