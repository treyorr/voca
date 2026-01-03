<script lang="ts">
    import { writable } from "svelte/store";

    let { command = "" }: { command: string } = $props();

    type PackageManager = "bun" | "npm" | "pnpm" | "yarn";

    // Persist selection in localStorage
    const stored =
        typeof window !== "undefined"
            ? localStorage.getItem("preferred-pm")
            : null;
    const selected = writable<PackageManager>(
        (stored as PackageManager) || "bun",
    );

    $effect(() => {
        if (typeof window !== "undefined") {
            localStorage.setItem("preferred-pm", $selected);
        }
    });

    const managers: PackageManager[] = ["bun", "npm", "pnpm", "yarn"];

    function getCommand(pm: PackageManager, cmd: string): string {
        // Handle install commands
        if (cmd.startsWith("install ") || cmd === "install") {
            const pkg = cmd.replace("install", "").trim();
            switch (pm) {
                case "bun":
                    return pkg ? `bun install ${pkg}` : "bun install";
                case "npm":
                    return pkg ? `npm install ${pkg}` : "npm install";
                case "pnpm":
                    return pkg ? `pnpm add ${pkg}` : "pnpm install";
                case "yarn":
                    return pkg ? `yarn add ${pkg}` : "yarn install";
            }
        }

        // Handle run commands
        if (cmd.startsWith("run ")) {
            const script = cmd.replace("run", "").trim();
            switch (pm) {
                case "bun":
                    return `bun run ${script}`;
                case "npm":
                    return `npm run ${script}`;
                case "pnpm":
                    return `pnpm run ${script}`;
                case "yarn":
                    return `yarn ${script}`;
            }
        }

        // Handle add/install package
        if (!cmd.includes(" ")) {
            // Assume it's a package name
            switch (pm) {
                case "bun":
                    return `bun add ${cmd}`;
                case "npm":
                    return `npm install ${cmd}`;
                case "pnpm":
                    return `pnpm add ${cmd}`;
                case "yarn":
                    return `yarn add ${cmd}`;
            }
        }

        // Fallback: return as-is with pm prefix
        return `${pm} ${cmd}`;
    }
</script>

<div class="pm-switcher">
    <div class="tabs">
        {#each managers as pm}
            <button
                class:active={$selected === pm}
                onclick={() => selected.set(pm)}
            >
                {pm}
            </button>
        {/each}
    </div>
    <pre><code>{getCommand($selected, command)}</code></pre>
</div>

<style>
    .pm-switcher {
        margin: 1rem 0;
        border: 1px solid var(--border-color, #334155);
        border-radius: 8px;
        overflow: hidden;
        background: var(--code-bg, #0f172a);
    }

    .tabs {
        display: flex;
        gap: 0;
        background: var(--tabs-bg, #1e293b);
        border-bottom: 1px solid var(--border-color, #334155);
    }

    button {
        padding: 0.5rem 1rem;
        border: none;
        background: transparent;
        color: var(--text-muted, #94a3b8);
        font-family: ui-monospace, "Cascadia Code", monospace;
        font-size: 0.875rem;
        cursor: pointer;
        transition: all 0.15s;
        border-right: 1px solid var(--border-color, #334155);
    }

    button:last-child {
        border-right: none;
    }

    button:hover {
        background: var(--button-hover-bg, #2d3748);
        color: var(--text-primary, #f1f5f9);
    }

    button.active {
        background: var(--code-bg, #0f172a);
        color: var(--accent-color, #60a5fa);
        font-weight: 500;
    }

    pre {
        margin: 0;
        padding: 1rem;
        overflow-x: auto;
    }

    code {
        font-family: ui-monospace, "Cascadia Code", monospace;
        font-size: 0.875rem;
        color: var(--code-text, #e2e8f0);
    }
</style>
