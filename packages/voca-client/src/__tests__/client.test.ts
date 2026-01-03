import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { VocaClient } from '../index';

// Mock WebSocket
class MockWebSocket {
    static OPEN = 1;
    static CLOSED = 3;

    readyState = MockWebSocket.OPEN;
    onopen: (() => void) | null = null;
    onclose: (() => void) | null = null;
    onmessage: ((e: { data: string }) => void) | null = null;
    onerror: (() => void) | null = null;

    constructor(public url: string) {
        // Simulate async connection
        setTimeout(() => this.onopen?.(), 0);
    }

    send = vi.fn();
    close = vi.fn(() => {
        this.readyState = MockWebSocket.CLOSED;
        this.onclose?.();
    });
}

// Mock navigator.mediaDevices
const createMockMediaStream = () => {
    const trackState = { enabled: true };
    const mockTrack = {
        stop: vi.fn(),
    };
    Object.defineProperty(mockTrack, 'enabled', {
        get: () => trackState.enabled,
        set: (v: boolean) => { trackState.enabled = v; },
    });

    return {
        getTracks: () => [mockTrack],
        getAudioTracks: () => [mockTrack],
    };
};

const mockGetUserMedia = vi.fn().mockImplementation(() => Promise.resolve(createMockMediaStream()));

// Mock AudioContext
class MockAudioContext {
    state = 'running';
    createMediaStreamSource = vi.fn(() => ({ connect: vi.fn() }));
    createAnalyser = vi.fn(() => ({
        fftSize: 256,
        frequencyBinCount: 128,
        getByteFrequencyData: vi.fn(),
    }));
    close = vi.fn().mockResolvedValue(undefined);
}

// Setup global mocks
beforeEach(() => {
    vi.stubGlobal('WebSocket', MockWebSocket);
    vi.stubGlobal('navigator', {
        mediaDevices: { getUserMedia: mockGetUserMedia },
    });
    vi.stubGlobal('AudioContext', MockAudioContext);
    vi.stubGlobal('window', {
        location: { protocol: 'https:', host: 'localhost:3001', origin: 'https://localhost:3001' },
        isSecureContext: true,
        AudioContext: MockAudioContext,
    });
    vi.stubGlobal('requestAnimationFrame', vi.fn());
    vi.stubGlobal('cancelAnimationFrame', vi.fn());
});

afterEach(() => {
    vi.restoreAllMocks();
});

describe('VocaClient', () => {
    describe('constructor', () => {
        it('should create a client with roomId', () => {
            const client = new VocaClient('test-room');
            expect(client.roomId).toBe('test-room');
            expect(client.status).toBe('connecting');
        });

        it('should accept custom config', () => {
            const client = new VocaClient('test-room', {
                serverUrl: 'wss://custom.server.com',
            });
            expect(client.roomId).toBe('test-room');
        });

        it('should accept custom config with apiKey', () => {
            const client = new VocaClient('test-room', {
                serverUrl: 'wss://test.com',
                apiKey: 'secret',
                iceServers: []
            });
            expect(client).toBeDefined();
        });

        it('should include apiKey in WebSocket URL', async () => {
            const client = new VocaClient('test-room', {
                serverUrl: 'wss://test.com',
                apiKey: 'secret'
            });

            // Access private method via any cast
            const url = (client as any).getServerUrl();
            expect(url).toContain('apiKey=secret');
        });
    });

    describe('createRoom', () => {
        const mockFetch = vi.fn();

        beforeEach(() => {
            mockFetch.mockReset();
            vi.stubGlobal('fetch', mockFetch);
        });

        it('should create a room via API and return client', async () => {
            mockFetch.mockResolvedValue({
                ok: true,
                json: () => Promise.resolve({ room: 'new-room-123' }),
            });

            const client = await VocaClient.createRoom({
                serverUrl: 'wss://test.server.com',
            });

            expect(mockFetch).toHaveBeenCalledWith(
                'https://test.server.com/api/room',
                {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ serverUrl: 'wss://test.server.com' })
                }
            );
            expect(client.roomId).toBe('new-room-123');
        });

        it('should include x-api-key header when apiKey is configured', async () => {
            mockFetch.mockResolvedValue({
                ok: true,
                json: () => Promise.resolve({ room: 'api-room' }),
            });

            await VocaClient.createRoom({
                serverUrl: 'wss://test.server.com',
                apiKey: 'secret'
            });

            expect(mockFetch).toHaveBeenCalledWith(
                expect.stringContaining('/api/room'),
                expect.objectContaining({
                    headers: expect.objectContaining({
                        'x-api-key': 'secret'
                    })
                })
            );
        });

        it('should throw on API error', async () => {
            mockFetch.mockResolvedValue({
                ok: false,
                json: () => Promise.resolve({ message: 'Rate limited' }),
            });

            await expect(VocaClient.createRoom({
                serverUrl: 'wss://test.server.com',
            })).rejects.toThrow('Rate limited');
        });
    });

    describe('connect', () => {
        it('should emit status events during connection', async () => {
            const client = new VocaClient('test-room', {
                serverUrl: 'ws://localhost:3001',
            });

            const statusEvents: string[] = [];
            client.on('status', (status) => statusEvents.push(status));

            // Start connecting
            const connectPromise = client.connect();

            // Wait for async WebSocket open
            await new Promise((r) => setTimeout(r, 10));

            expect(statusEvents).toContain('connecting');
            expect(statusEvents).toContain('connected');
        });
    });

    describe('disconnect', () => {
        it('should clean up resources on disconnect', async () => {
            const client = new VocaClient('test-room', {
                serverUrl: 'ws://localhost:3001',
            });

            await client.connect();
            await new Promise((r) => setTimeout(r, 10));

            client.disconnect();

            expect(client.status).toBe('disconnected');
        });
    });

    describe('toggleMute', () => {
        it('should return mute state when called', async () => {
            const client = new VocaClient('test-room', {
                serverUrl: 'ws://localhost:3001',
            });

            await client.connect();
            await new Promise((r) => setTimeout(r, 10));

            // toggleMute returns the new mute state
            const state = client.toggleMute();
            expect(typeof state).toBe('boolean');
        });
    });

    describe('event emitter', () => {
        it('should allow subscribing to events', () => {
            const client = new VocaClient('test-room');
            const callback = vi.fn();

            const unsubscribe = client.on('status', callback);

            expect(typeof unsubscribe).toBe('function');
        });
    });
});
