<script lang="ts">
    let token = $state("");
    let isLoggedIn = $state(false);
    let error = $state<string | null>(null);
    let metrics = $state<{
        active_rooms: number;
        active_connections: number;
        rooms_created_today: number;
        connections_today: number;
        uptime_seconds: number;
    } | null>(null);
    let rooms = $state<{ id: string; peers: number }[]>([]);
    let logs = $state<string[]>([]);
    let loading = $state(false);
    let activeTab = $state<'rooms' | 'logs'>('rooms');

    function formatUptime(seconds: number) {
        const h = Math.floor(seconds / 3600);
        const m = Math.floor((seconds % 3600) / 60);
        const s = seconds % 60;
        return `${h}h ${m}m ${s}s`;
    }

    async function login() {
        if (!token.trim()) {
            error = "Please enter the admin token";
            return;
        }

        loading = true;
        error = null;

        try {
            const apiHost = import.meta.env.DEV ? "http://localhost:3001" : "";
            const response = await fetch(`${apiHost}/api/admin/rooms`, {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });

            if (response.status === 401) {
                error = "Invalid token";
                loading = false;
                return;
            }

            if (!response.ok) {
                error = "Failed to fetch rooms";
                loading = false;
                return;
            }

            const data = await response.json();
            rooms = data.rooms;
            isLoggedIn = true;
            sessionStorage.setItem("voca_admin_token", token);

            // Fetch metrics initially too
             try {
                const mRes = await fetch(`${apiHost}/api/admin/metrics`, {
                    headers: { Authorization: `Bearer ${token}` },
                });
                if (mRes.ok) metrics = await mRes.json();
            } catch {}

            // Start auto-refresh
            startRefresh();
        } catch {
            error = "Connection failed";
        }
        loading = false;
    }

    async function fetchRooms() {
        const savedToken = sessionStorage.getItem("voca_admin_token");
        if (!savedToken) return;

        try {
            const apiHost = import.meta.env.DEV ? "http://localhost:3001" : "";
            const response = await fetch(`${apiHost}/api/admin/rooms`, {
                headers: {
                    Authorization: `Bearer ${savedToken}`,
                },
            });

            if (response.ok) {
                const data = await response.json();
                rooms = data.rooms;
            }

            const metricsRes = await fetch(`${apiHost}/api/admin/metrics`, {
                headers: { Authorization: `Bearer ${savedToken}` },
            });
            if (metricsRes.ok) {
                metrics = await metricsRes.json();
            }

            // Fetch logs if on logs tab
            if (activeTab === 'logs') {
                const logsRes = await fetch(`${apiHost}/api/admin/logs`, {
                    headers: { Authorization: `Bearer ${savedToken}` },
                });
                if (logsRes.ok) {
                    const data = await logsRes.json();
                    logs = data.logs || [];
                }
            }
        } catch {
            // Silent fail on refresh
        }
    }

    let refreshInterval: number | null = null;

    function startRefresh() {
        if (refreshInterval) clearInterval(refreshInterval);
        refreshInterval = setInterval(fetchRooms, 5000) as unknown as number;
    }

    function logout() {
        isLoggedIn = false;
        token = "";
        rooms = [];
        sessionStorage.removeItem("voca_admin_token");
        if (refreshInterval) clearInterval(refreshInterval);
    }

    // Check for existing session on mount
    import { onMount, onDestroy } from "svelte";
    onMount(() => {
        const saved = sessionStorage.getItem("voca_admin_token");
        if (saved) {
            token = saved;
            login();
        }
    });

    onDestroy(() => {
        if (refreshInterval) clearInterval(refreshInterval);
    });
</script>

<svelte:head>
    <title>voca.vc/admin</title>
</svelte:head>

<main class="min-h-screen p-8">
    <header class="brutalist-box flex justify-between items-center">
        <h1 class="text-xl font-bold">ADMIN</h1>
        {#if isLoggedIn}
            <div class="flex items-center gap-4">
                <!-- Tab Navigation -->
                <div class="flex gap-2">
                    <button
                        class="brutalist-button {activeTab === 'rooms' ? 'bg-black text-white' : ''}"
                        onclick={() => activeTab = 'rooms'}
                    >
                        [ ROOMS ]
                    </button>
                    <button
                        class="brutalist-button {activeTab === 'logs' ? 'bg-black text-white' : ''}"
                        onclick={() => { activeTab = 'logs'; fetchRooms(); }}
                    >
                        [ LOGS ]
                    </button>
                </div>
                <button class="brutalist-button text-sm" onclick={logout}>
                    [ LOGOUT ]
                </button>
            </div>
        {/if}
    </header>

    {#if !isLoggedIn}
        <div class="brutalist-box mt-4 max-w-md">
            <h2 class="font-bold mb-4">LOGIN</h2>
            <input
                type="password"
                bind:value={token}
                placeholder="ADMIN TOKEN"
                class="brutalist-input w-full mb-4"
                onkeydown={(e) => e.key === "Enter" && login()}
            />
            <button
                class="brutalist-button w-full"
                onclick={login}
                disabled={loading}
            >
                {loading ? "[ CHECKING... ]" : "[ LOGIN ]"}
            </button>
            {#if error}
                <p class="mt-4 text-sm bg-black text-white p-2">
                    ERROR: {error}
                </p>
            {/if}
        </div>
    {:else}
        {#if activeTab === 'rooms'}
            <div class="brutalist-box mt-4">
                <h2 class="font-bold mb-4">SYSTEM METRICS</h2>
                {#if metrics}
                    <div class="grid grid-cols-2 gap-4 mb-8">
                        <div class="p-2 border border-black">
                            <p class="text-xs text-gray-500">ACTIVE ROOMS</p>
                            <p class="text-xl font-bold">{metrics.active_rooms}</p>
                        </div>
                        <div class="p-2 border border-black">
                            <p class="text-xs text-gray-500">ACTIVE CONNECTIONS</p>
                            <p class="text-xl font-bold">{metrics.active_connections}</p>
                        </div>
                        <div class="p-2 border border-black">
                            <p class="text-xs text-gray-500">ROOMS TODAY</p>
                            <p class="text-xl font-bold">{metrics.rooms_created_today}</p>
                        </div>
                        <div class="p-2 border border-black">
                            <p class="text-xs text-gray-500">CONNECTIONS TODAY</p>
                            <p class="text-xl font-bold">{metrics.connections_today}</p>
                        </div>
                        <div class="col-span-2 p-2 border border-black">
                            <p class="text-xs text-gray-500">UPTIME</p>
                            <p class="font-mono">{formatUptime(metrics.uptime_seconds)}</p>
                        </div>
                    </div>
                {/if}

                <h2 class="font-bold mb-4">ACTIVE ROOMS ({rooms.length})</h2>
                {#if rooms.length === 0}
                    <p class="text-sm">No active rooms</p>
                {:else}
                    <table class="w-full text-left">
                        <thead>
                            <tr class="border-b border-black">
                                <th class="p-2">ROOM ID</th>
                                <th class="p-2">PEERS</th>
                                <th class="p-2">LINK</th>
                            </tr>
                        </thead>
                        <tbody>
                            {#each rooms as room}
                                <tr class="border-b border-black">
                                    <td class="p-2 font-mono">{room.id}</td>
                                    <td class="p-2">{room.peers}</td>
                                    <td class="p-2">
                                        <a href="/{room.id}" class="underline"
                                            >[ JOIN ]</a
                                        >
                                    </td>
                                </tr>
                            {/each}
                        </tbody>
                    </table>
                {/if}
                <p class="text-xs mt-4">Auto-refreshes every 5 seconds</p>
            </div>
        {/if}

        {#if activeTab === 'logs'}
        <!-- Logs Viewer -->
        <div class="brutalist-box mt-4">
            <h2 class="font-bold mb-4">SERVER LOGS (Last 500 lines)</h2>
            {#if logs.length === 0}
                <p class="text-sm">No logs available or log directory not configured.</p>
            {:else}
                <pre class="text-xs overflow-auto max-h-[600px] bg-black text-green-400 p-4 font-mono">{logs.join('\n')}</pre>
            {/if}
        </div>
        {/if}
    {/if}
</main>
