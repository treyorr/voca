/**
 * Voca WebRTC State Manager
 * 
 * Svelte 5 runes-based wrapper around @treyorr/voca-client SDK.
 */

import { VocaClient, validatePassword, type ConnectionStatus, type Peer, type VocaConfig } from '@treyorr/voca-client';

export { VocaClient, validatePassword };
export type { ConnectionStatus, Peer, VocaConfig };

export class VocaRoom {
    // Reactive state
    peers = $state<Map<string, Peer>>(new Map());
    localStream = $state<MediaStream | null>(null);
    isMuted = $state(false);
    isConnected = $state(false);
    error = $state<string | null>(null);
    localAudioLevel = $state(0);

    status = $state<ConnectionStatus>('connecting');
    errorCode = $state<string | null>(null);
    roomCapacity = $state(6);
    peerCount = $state(1); // Start at 1 (self)

    private client: VocaClient;

    constructor(roomId: string, config: VocaConfig = {}) {
        this.client = new VocaClient(roomId, config);
        this.setupListeners();
    }

    private setupListeners() {
        this.client.on('status', (s: ConnectionStatus) => {
            this.status = s;
            this.isConnected = s === 'connected';
        });

        this.client.on('error', (e: { code: string; message: string }) => {
            this.errorCode = e.code;
            this.error = e.message;
        });

        this.client.on('peer-joined', () => this.updatePeers());
        this.client.on('peer-left', () => this.updatePeers());
        this.client.on('track', () => this.updatePeers()); // Updates stream references

        this.client.on('peer-audio-level', (id: string, level: number) => {
            // Trigger reactivity by creating a new Map reference
            // The underlying peer objects are mutation in the SDK, so we just need to let Svelte know something changed
            // Optimization: In a real app we might want granular reactivity per peer, but this matches original behavior
            this.peers = new Map(this.client.peers);
        });

        this.client.on('local-audio-level', (level: number) => {
            this.localAudioLevel = level;
        });
    }

    private updatePeers() {
        this.peers = new Map(this.client.peers);
        this.peerCount = this.peers.size + 1;
    }

    async connect(): Promise<void> {
        try {
            await this.client.connect();
            this.localStream = this.client.localStream;
        } catch (err) {
            // Error handling is done via events mostly, but connect() throws
            console.error('Connection failed', err);
        }
    }

    disconnect() {
        this.client.disconnect();
        this.peers = new Map();
        this.localStream = null;
        this.isConnected = false;
    }

    toggleMute() {
        this.isMuted = this.client.toggleMute();
    }

    getPulseStyle(level: number) {
        return `--pulse: ${1 + Math.round(level * 7)}px`;
    }

    getStatusLabel() {
        const labels: Record<string, string> = {
            connecting: 'CONNECTING...',
            connected: 'CONNECTED',
            reconnecting: 'RECONNECTING...',
            full: 'ROOM FULL',
            error: 'ERROR',
            disconnected: 'DISCONNECTED'
        };
        return labels[this.status] ?? 'UNKNOWN';
    }
}
