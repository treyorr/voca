<script lang="ts">
    import { Settings, X, Upload, Trash2, Play } from "@lucide/svelte";
    import {
        getVolume,
        setVolume,
        getCustomSound,
        setCustomSound,
        removeCustomSound,
        fileToDataUrl,
        playJoinSound,
        playLeaveSound,
    } from "$lib/sounds";
    import { onMount } from "svelte";

    let open = $state(false);
    let volume = $state(0.5);
    let hasJoinSound = $state(false);
    let hasLeaveSound = $state(false);

    onMount(() => {
        volume = getVolume();
        hasJoinSound = !!getCustomSound("join");
        hasLeaveSound = !!getCustomSound("leave");
    });

    function onVolumeChange(e: Event) {
        const v = parseFloat((e.target as HTMLInputElement).value);
        volume = v;
        setVolume(v);
    }

    async function uploadSound(type: "join" | "leave") {
        const input = document.createElement("input");
        input.type = "file";
        input.accept = "audio/*";
        input.onchange = async () => {
            const file = input.files?.[0];
            if (!file) return;
            const dataUrl = await fileToDataUrl(file);
            if (!dataUrl) {
                alert("File too large. Max 512 KB.");
                return;
            }
            setCustomSound(type, dataUrl);
            if (type === "join") hasJoinSound = true;
            else hasLeaveSound = true;
        };
        input.click();
    }

    function clearSound(type: "join" | "leave") {
        removeCustomSound(type);
        if (type === "join") hasJoinSound = false;
        else hasLeaveSound = false;
    }

    function preview(type: "join" | "leave") {
        if (type === "join") playJoinSound();
        else playLeaveSound();
    }
</script>

<!-- Gear icon button -->
<button
    type="button"
    class="settings-toggle"
    aria-label="Sound settings"
    onclick={() => (open = true)}
>
    <Settings class="theme-icon" strokeWidth={1.8} />
</button>

<!-- Modal backdrop + dialog -->
{#if open}
    <div
        class="fixed inset-0 z-[200] flex items-center justify-center p-4 modal-overlay backdrop-blur-md"
        role="presentation"
        onclick={(e) => {
            if (e.target === e.currentTarget) open = false;
        }}
        onkeydown={(e) => {
            if (e.key === "Escape") open = false;
        }}
    >
        <div
            class="border-2 border-voca-border bg-voca-bg text-voca-fg p-6 max-w-sm w-full"
            role="dialog"
            aria-label="Sound settings"
        >
            <div class="flex justify-between items-center mb-6">
                <h2 class="text-lg font-bold">SOUND SETTINGS</h2>
                <button
                    type="button"
                    class="brutalist-button !p-1"
                    onclick={() => (open = false)}
                    aria-label="Close"
                >
                    <X size={16} strokeWidth={2} />
                </button>
            </div>

            <!-- Volume -->
            <label class="block text-xs font-bold mb-1">
                VOLUME: {Math.round(volume * 100)}%
                <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.05"
                    value={volume}
                    oninput={onVolumeChange}
                    class="w-full mb-6 accent-voca-fg"
                />
            </label>

            <!-- Join sound -->
            <div class="mb-4">
                <p class="text-xs font-bold mb-2">JOIN SOUND</p>
                <div class="flex gap-2">
                    <button
                        type="button"
                        class="brutalist-button text-xs flex-1"
                        onclick={() => uploadSound("join")}
                    >
                        <span class="inline-flex items-center gap-1">
                            <Upload size={12} />
                            {hasJoinSound ? "REPLACE" : "UPLOAD"}
                        </span>
                    </button>
                    <button
                        type="button"
                        class="brutalist-button text-xs"
                        onclick={() => preview("join")}
                        aria-label="Preview join sound"
                    >
                        <Play size={12} />
                    </button>
                    {#if hasJoinSound}
                        <button
                            type="button"
                            class="brutalist-button text-xs"
                            onclick={() => clearSound("join")}
                            aria-label="Remove custom join sound"
                        >
                            <Trash2 size={12} />
                        </button>
                    {/if}
                </div>
                <p class="text-xs opacity-50 mt-1">
                    {hasJoinSound ? "Custom sound set" : "Using default tone"}
                </p>
            </div>

            <!-- Leave sound -->
            <div class="mb-2">
                <p class="text-xs font-bold mb-2">LEAVE SOUND</p>
                <div class="flex gap-2">
                    <button
                        type="button"
                        class="brutalist-button text-xs flex-1"
                        onclick={() => uploadSound("leave")}
                    >
                        <span class="inline-flex items-center gap-1">
                            <Upload size={12} />
                            {hasLeaveSound ? "REPLACE" : "UPLOAD"}
                        </span>
                    </button>
                    <button
                        type="button"
                        class="brutalist-button text-xs"
                        onclick={() => preview("leave")}
                        aria-label="Preview leave sound"
                    >
                        <Play size={12} />
                    </button>
                    {#if hasLeaveSound}
                        <button
                            type="button"
                            class="brutalist-button text-xs"
                            onclick={() => clearSound("leave")}
                            aria-label="Remove custom leave sound"
                        >
                            <Trash2 size={12} />
                        </button>
                    {/if}
                </div>
                <p class="text-xs opacity-50 mt-1">
                    {hasLeaveSound ? "Custom sound set" : "Using default tone"}
                </p>
            </div>

            <p class="text-xs opacity-40 mt-4">
                Max file size: 512 KB. Accepts mp3, wav, ogg.
            </p>
        </div>
    </div>
{/if}

<style>
    .settings-toggle {
        position: fixed;
        top: 0.75rem;
        left: 0.75rem;
        border: 1px solid var(--color-voca-border);
        background: var(--color-voca-bg);
        color: var(--color-voca-fg);
        width: 2rem;
        height: 2rem;
        padding: 0;
        cursor: pointer;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        z-index: 120;
    }

    @media (hover: hover) {
        .settings-toggle:hover {
            background: var(--color-voca-fg);
            color: var(--color-voca-bg);
        }
    }
</style>
