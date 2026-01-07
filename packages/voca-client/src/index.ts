import { createNanoEvents } from 'nanoevents';
import { VocaErrorCode, VocaErrorMessages, type VocaError, createVocaError } from './errors';
export { VocaErrorCode, VocaErrorMessages, type VocaError, createVocaError } from './errors';

export type ConnectionStatus = 'connecting' | 'connected' | 'reconnecting' | 'full' | 'error' | 'disconnected';

export interface VocaConfig {
    debug?: boolean;
    iceServers?: RTCIceServer[];
    serverUrl?: string; // e.g. "ws://localhost:3001" or "wss://voca.vc"
    apiKey?: string; // optional API key for signaling server auth
    password?: string; // optional room password for protected rooms
    /**
     * Reconnection options. Enabled by default.
     */
    reconnect?: {
        /** Enable automatic reconnection. Default: true */
        enabled?: boolean;
        /** Maximum reconnection attempts. Default: 5 */
        maxAttempts?: number;
        /** Base delay in milliseconds. Default: 1000 */
        baseDelayMs?: number;
    };
}

export interface Peer {
    id: string;
    connection: RTCPeerConnection;
    audioLevel: number;
    stream?: MediaStream;
}

type SignalMessage = {
    from: string;
    type: 'hello' | 'welcome' | 'join' | 'leave' | 'offer' | 'answer' | 'ice' | 'ping' | 'pong' | 'error';
    peer_id?: string;
    to?: string;
    sdp?: string;
    candidate?: string;
    code?: string;
    message?: string;
    // Protocol versioning
    version?: string;
    client?: string;
};

interface VocaEvents {
    'status': (status: ConnectionStatus) => void;
    'error': (error: VocaError) => void;
    'warning': (warning: { code: string; message: string }) => void;
    'peer-joined': (peerId: string) => void;
    'peer-left': (peerId: string) => void;
    'peer-audio-level': (peerId: string, level: number) => void;
    'local-audio-level': (level: number) => void;
    'track': (peerId: string, track: MediaStreamTrack, stream: MediaStream) => void;
}

/**
 * Validate password format for room creation.
 * Returns null if valid, or an error message if invalid.
 * 
 * @param password - The password to validate
 * @returns Error message if invalid, null if valid
 */
export function validatePassword(password: string): string | null {
    if (!password) return null; // Empty is valid (no password)
    if (password.length < 4 || password.length > 12) {
        return 'Password must be 4-12 characters';
    }
    if (!/^[a-zA-Z0-9]+$/.test(password)) {
        return 'Password must contain only letters and numbers';
    }
    return null;
}

const DEFAULT_ICE_SERVERS: RTCIceServer[] = [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
];

export class VocaClient {
    public peers: Map<string, Peer> = new Map();
    public localStream: MediaStream | null = null;
    public isMuted: boolean = false;
    public status: ConnectionStatus = 'connecting';
    public roomId: string;

    private events = createNanoEvents<VocaEvents>();
    private ws: WebSocket | null = null;
    private audioContext: AudioContext | null = null;
    private analyser: AnalyserNode | null = null;
    private animationFrame: number | null = null;
    private iceServers: RTCIceServer[] = DEFAULT_ICE_SERVERS;
    private config: VocaConfig;

    // Reconnection state
    private reconnectAttempts = 0;
    private reconnectTimeout: ReturnType<typeof setTimeout> | null = null;
    private shouldReconnect = true;

    // Audio analysis nodes per peer (for cleanup)
    private peerAnalysers: Map<string, { source: MediaStreamAudioSourceNode; analyser: AnalyserNode }> = new Map();

    /**
     * Create a new room and return a VocaClient connected to it.
     * This is a convenience method that handles room creation via the API.
     * 
     * @param config - VocaClient configuration (serverUrl required for non-browser environments)
     * @returns Promise<VocaClient> - A new client instance for the created room
     */
    static async createRoom(config: VocaConfig = {}): Promise<VocaClient> {
        const httpUrl = VocaClient.getHttpUrl(config.serverUrl);

        if (!httpUrl) {
            throw new Error('VocaConfig.serverUrl is required in non-browser environments');
        }

        const headers: HeadersInit = {
            'Content-Type': 'application/json',
        };

        if (config.apiKey) {
            headers['x-api-key'] = config.apiKey;
        }

        // Build URL with optional password query param
        let url = `${httpUrl}/api/room`;
        const params = new URLSearchParams();
        if (config.password) {
            params.append('password', config.password);
        }
        if (params.toString()) {
            url += `?${params.toString()}`;
        }

        const response = await fetch(url, {
            method: 'POST',
            headers,
        });

        if (!response.ok) {
            const error = await response.json().catch(() => ({ error: 'unknown', message: 'Failed to create room' }));
            throw new Error(error.message || 'Failed to create room');
        }

        const { room, password } = await response.json();
        // Use the password from response (in case server modified it) or from config
        const roomConfig = { ...config, password: password || config.password };
        return new VocaClient(room, roomConfig);
    }

    /**
     * Derive an HTTP/HTTPS URL from any input format.
     * Accepts: https://, http://, wss://, ws://
     * Returns: https:// or http:// URL
     */
    private static getHttpUrl(serverUrl?: string): string {
        if (!serverUrl) {
            if (typeof window !== 'undefined') {
                return `${window.location.protocol}//${window.location.host}`;
            }
            return '';
        }
        // Normalize to HTTP(S)
        if (serverUrl.startsWith('wss://')) return serverUrl.replace('wss://', 'https://');
        if (serverUrl.startsWith('ws://')) return serverUrl.replace('ws://', 'http://');
        return serverUrl;
    }

    /**
     * Derive a WebSocket URL from any input format.
     * Accepts: https://, http://, wss://, ws://
     * Returns: wss:// or ws:// URL
     */
    private static getWsUrl(serverUrl?: string): string {
        if (!serverUrl) {
            if (typeof window !== 'undefined') {
                const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
                return `${protocol}//${window.location.host}`;
            }
            throw new Error('VocaConfig.serverUrl is required in non-browser environments');
        }
        // Normalize to WS(S)
        if (serverUrl.startsWith('https://')) return serverUrl.replace('https://', 'wss://');
        if (serverUrl.startsWith('http://')) return serverUrl.replace('http://', 'ws://');
        return serverUrl;
    }

    constructor(roomId: string, config: VocaConfig = {}) {
        this.roomId = roomId;
        this.config = config;
        if (config.iceServers) this.iceServers = config.iceServers;
    }

    public on<E extends keyof VocaEvents>(event: E, callback: VocaEvents[E]) {
        return this.events.on(event, callback);
    }

    public async connect(): Promise<void> {
        this.status = 'connecting';
        this.events.emit('status', 'connecting');

        try {
            // Use default STUN servers (Google's public STUN servers)
            await this.setupMediaAndAudio();
            this.connectSocket();
        } catch (err) {
            this.handleError(VocaErrorCode.CONNECTION_FAILED, err instanceof Error ? err.message : 'Failed to connect');
            throw err;
        }
    }

    public disconnect() {
        // Prevent reconnection attempts
        this.shouldReconnect = false;
        if (this.reconnectTimeout) {
            clearTimeout(this.reconnectTimeout);
            this.reconnectTimeout = null;
        }

        if (this.animationFrame) cancelAnimationFrame(this.animationFrame);
        this.peers.forEach((p) => p.connection.close());
        this.peers.clear();
        this.ws?.close();
        this.localStream?.getTracks().forEach((t) => t.stop());
        if (this.audioContext && this.audioContext.state !== 'closed') {
            this.audioContext.close().catch(e => console.warn('Error closing AudioContext', e));
        }
        this.status = 'disconnected';
        this.events.emit('status', 'disconnected');
    }

    public toggleMute() {
        const track = this.localStream?.getAudioTracks()[0];
        if (track) {
            track.enabled = !track.enabled;
            this.isMuted = !track.enabled;
        }
        return this.isMuted;
    }



    private async setupMediaAndAudio() {
        // Only verify secure context in browsers
        if (typeof window !== 'undefined' && !window.isSecureContext) {
            throw new Error(VocaErrorMessages[VocaErrorCode.INSECURE_CONTEXT]);
        }

        try {
            this.localStream = await navigator.mediaDevices.getUserMedia({
                audio: {
                    echoCancellation: true,
                    noiseSuppression: true,
                    autoGainControl: true,
                    latency: 0,
                    channelCount: 1
                } as any,
                video: false,
            });
        } catch (err) {
            try {
                this.localStream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
            } catch (retryErr: any) {
                if (retryErr.name === 'NotFoundError' || retryErr.message.includes('Requested device not found')) {
                    throw new Error(VocaErrorMessages[VocaErrorCode.MICROPHONE_NOT_FOUND]);
                }
                if (retryErr.name === 'NotAllowedError' || retryErr.message.includes('Permission denied')) {
                    throw new Error(VocaErrorMessages[VocaErrorCode.MICROPHONE_PERMISSION_DENIED]);
                }
                throw retryErr;
            }
        }

        this.setupAudioAnalysis(this.localStream!);
    }

    private setupAudioAnalysis(stream: MediaStream) {
        const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
        this.audioContext = new AudioContextClass();
        const source = this.audioContext.createMediaStreamSource(stream);
        this.analyser = this.audioContext.createAnalyser();
        this.analyser.fftSize = 256;
        source.connect(this.analyser);

        const dataArray = new Uint8Array(this.analyser.frequencyBinCount);
        const update = () => {
            if (!this.analyser) return;
            this.analyser.getByteFrequencyData(dataArray);
            const avg = dataArray.reduce((a, b) => a + b, 0) / dataArray.length;
            const level = Math.min(avg / 128, 1);
            this.events.emit('local-audio-level', level);
            this.animationFrame = requestAnimationFrame(update);
        };
        update();
    }

    /**
     * Build the full WebSocket URL for connecting to a room.
     */
    private getSocketUrl(): string {
        const wsUrl = VocaClient.getWsUrl(this.config.serverUrl);

        // Build URL: base + path + query params
        let fullUrl = `${wsUrl}/ws/${this.roomId}`;

        const params = new URLSearchParams();

        // Append apiKey if present
        if (this.config.apiKey) {
            params.append('apiKey', this.config.apiKey);
        }

        // Append password if present
        if (this.config.password) {
            params.append('password', this.config.password);
        }

        if (params.toString()) {
            fullUrl += `?${params.toString()}`;
        }

        return fullUrl;
    }

    private connectSocket() {
        const socketUrl = this.getSocketUrl();

        this.ws = new WebSocket(socketUrl);

        this.ws.onopen = () => {
            // Send hello message with version info
            this.send({ type: 'hello', version: '1.0', client: '@treyorr/voca-client' });
            this.status = 'connected';
            this.events.emit('status', 'connected');
            // Reset reconnect attempts on successful connection
            this.reconnectAttempts = 0;
        };

        this.ws.onclose = () => {
            // Don't reconnect on terminal states
            if (this.status === 'full' || this.status === 'error') {
                return;
            }

            const reconnectEnabled = this.config.reconnect?.enabled !== false;
            const maxAttempts = this.config.reconnect?.maxAttempts ?? 5;
            const baseDelay = this.config.reconnect?.baseDelayMs ?? 1000;

            if (reconnectEnabled && this.shouldReconnect && this.reconnectAttempts < maxAttempts) {
                this.status = 'reconnecting';
                this.events.emit('status', 'reconnecting');

                // Exponential backoff: 1s, 2s, 4s, 8s, 16s (capped at 30s)
                const delay = Math.min(baseDelay * Math.pow(2, this.reconnectAttempts), 30000);
                this.reconnectAttempts++;

                this.reconnectTimeout = setTimeout(() => {
                    this.connectSocket();
                }, delay);
            } else {
                this.status = 'disconnected';
                this.events.emit('status', 'disconnected');
            }
        };

        this.ws.onerror = () => this.handleError(VocaErrorCode.WEBSOCKET_ERROR, 'WebSocket connection failed');

        this.ws.onmessage = (e) => {
            const msg: SignalMessage = JSON.parse(e.data);
            this.handleSignal(msg);
        };
    }

    private async handleSignal(msg: SignalMessage) {
        switch (msg.type) {
            case 'welcome':
                // Protocol handshake complete - peer_id is managed server-side
                console.debug('[Voca] Protocol version:', msg.version, 'Peer ID:', msg.peer_id);
                break;
            case 'join':
                await this.createPeer(msg.from, true);
                break;
            case 'offer':
                await this.createPeer(msg.from, false, msg.sdp);
                break;
            case 'answer':
                const peer = this.peers.get(msg.from);
                if (peer) {
                    await peer.connection.setRemoteDescription({ type: 'answer', sdp: msg.sdp! });
                }
                break;
            case 'ice':
                const p = this.peers.get(msg.from);
                if (p) {
                    try {
                        await p.connection.addIceCandidate(JSON.parse(msg.candidate!));
                    } catch (e) {
                        console.warn('[Voca] Invalid ICE candidate:', e);
                    }
                }
                break;
            case 'ping':
                this.send({ type: 'pong' });
                break;
            case 'leave':
                this.removePeer(msg.from);
                break;
            case 'error':
                this.handleError(msg.code ?? 'unknown', msg.message ?? 'Unknown error');
                break;
        }
    }

    private async createPeer(peerId: string, isInitiator: boolean, remoteSdp?: string) {
        const pc = new RTCPeerConnection({ iceServers: this.iceServers });

        pc.onicecandidate = (e) => {
            if (e.candidate) this.send({ type: 'ice', to: peerId, candidate: JSON.stringify(e.candidate) });
        };

        pc.ontrack = (e) => {
            // Emit track event so UI can handle the audio element/stream
            this.events.emit('track', peerId, e.track, e.streams[0]);
            this.setupRemoteAudio(peerId, e.streams[0]);
            const peer = this.peers.get(peerId);
            if (peer) peer.stream = e.streams[0];
        };

        // Add local tracks
        this.localStream?.getTracks().forEach((track) => pc.addTrack(track, this.localStream!));

        this.peers.set(peerId, { id: peerId, connection: pc, audioLevel: 0 });
        this.events.emit('peer-joined', peerId);

        if (isInitiator) {
            const offer = await pc.createOffer();
            await pc.setLocalDescription(offer);
            this.send({ type: 'offer', to: peerId, sdp: offer.sdp });
        } else if (remoteSdp) {
            await pc.setRemoteDescription({ type: 'offer', sdp: remoteSdp });
            const answer = await pc.createAnswer();
            await pc.setLocalDescription(answer);
            this.send({ type: 'answer', to: peerId, sdp: answer.sdp });
        }
    }

    private removePeer(peerId: string) {
        const peer = this.peers.get(peerId);
        peer?.connection.close();
        this.peers.delete(peerId);

        // Clean up audio analysis nodes
        const audio = this.peerAnalysers.get(peerId);
        if (audio) {
            audio.source.disconnect();
            audio.analyser.disconnect();
            this.peerAnalysers.delete(peerId);
        }

        this.events.emit('peer-left', peerId);
    }

    private setupRemoteAudio(peerId: string, stream: MediaStream) {
        if (!this.audioContext) {
            const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
            this.audioContext = new AudioContextClass();
        }

        const source = this.audioContext.createMediaStreamSource(stream);
        const analyser = this.audioContext.createAnalyser();
        analyser.fftSize = 256;
        source.connect(analyser);

        // CRITICAL: Connect to speakers so audio is actually played!
        source.connect(this.audioContext.destination);

        // Store for cleanup when peer leaves
        this.peerAnalysers.set(peerId, { source, analyser });

        const data = new Uint8Array(analyser.frequencyBinCount);
        const update = () => {
            const peer = this.peers.get(peerId);
            if (!peer) return;

            analyser.getByteFrequencyData(data);
            const avg = data.reduce((a, b) => a + b, 0) / data.length;
            const level = Math.min(avg / 128, 1);

            this.events.emit('peer-audio-level', peerId, level);

            // Store in peer object as well for convenience
            peer.audioLevel = level;

            requestAnimationFrame(update);
        };
        update();
    }

    private send(msg: Partial<SignalMessage>) {
        if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
            // Queue or drop - for now we drop since this is a signaling race condition
            return;
        }
        this.ws.send(JSON.stringify({ from: '', ...msg }));
    }

    private handleError(code: VocaErrorCode | string, message: string) {
        this.status = code === VocaErrorCode.ROOM_FULL || code === 'room_full' ? 'full' : 'error';
        this.events.emit('status', this.status);
        this.events.emit('error', { code: code as VocaErrorCode, message });
    }
}
