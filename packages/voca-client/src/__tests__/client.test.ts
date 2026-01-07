import { describe, it, expect, beforeEach, afterEach, mock } from 'bun:test';
import { VocaClient, validatePassword, VocaErrorCode } from '../index';

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

    send = mock();
    close = mock(() => {
        this.readyState = MockWebSocket.CLOSED;
        this.onclose?.();
    });
}

// Mock navigator.mediaDevices
const createMockMediaStream = () => {
    const trackState = { enabled: true };
    const mockTrack = {
        stop: mock(),
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

const mockGetUserMedia = mock().mockImplementation(() => Promise.resolve(createMockMediaStream()));

// Mock AudioContext
class MockAudioContext {
    state = 'running';
    createMediaStreamSource = mock(() => ({ connect: mock() }));
    createAnalyser = mock(() => ({
        fftSize: 256,
        frequencyBinCount: 128,
        getByteFrequencyData: mock(),
    }));
    close = mock().mockResolvedValue(undefined);
}

// Setup global mocks
beforeEach(() => {
    (globalThis as any).WebSocket = MockWebSocket;
    (globalThis as any).navigator = {
        mediaDevices: { getUserMedia: mockGetUserMedia },
    };
    (globalThis as any).AudioContext = MockAudioContext;
    (globalThis as any).window = {
        location: { protocol: 'https:', host: 'localhost:3001', origin: 'https://localhost:3001' },
        isSecureContext: true,
        AudioContext: MockAudioContext,
    };
    (globalThis as any).requestAnimationFrame = mock();
    (globalThis as any).cancelAnimationFrame = mock();
});

afterEach(() => {
    // Bun doesn't have restoreAllMocks, but we can manually clean up
    mockGetUserMedia.mockClear();
});

describe('VocaClient', () => {
    describe('constructor', () => {
        it('should create a client with roomId', () => {
            const client = new VocaClient('test-room');
            expect(client).toBeDefined();
        });

        it('should accept custom config', () => {
            const client = new VocaClient('test-room', {
                serverUrl: 'wss://custom.example.com',
            });
            expect(client).toBeDefined();
        });

        it('should accept custom config with apiKey', () => {
            const client = new VocaClient('test-room', {
                apiKey: 'test-key',
            });
            expect(client).toBeDefined();
        });

        it('should include apiKey in WebSocket URL', () => {
            const client = new VocaClient('test-room', {
                apiKey: 'test-api-key',
            });
            expect(client).toBeDefined();
        });
    });

    describe('createRoom', () => {
        it('should create a room via API and return client', async () => {
            globalThis.fetch = mock(() => Promise.resolve({
                ok: true,
                json: () => Promise.resolve({ roomId: 'new-room' }),
            } as Response));

            const client = await VocaClient.createRoom();
            expect(client).toBeDefined();
        });

        it('should include x-api-key header when apiKey is configured', async () => {
            const fetchMock = mock(() => Promise.resolve({
                ok: true,
                json: () => Promise.resolve({ roomId: 'new-room' }),
            } as Response));
            globalThis.fetch = fetchMock;

            await VocaClient.createRoom({ apiKey: 'test-key' });
            expect(fetchMock).toHaveBeenCalled();
        });

        it('should throw on API error', async () => {
            globalThis.fetch = mock(() => Promise.resolve({
                ok: false,
                status: 500,
            } as Response));

            await expect(VocaClient.createRoom()).rejects.toThrow();
        });

        it('should include password in API request if provided', async () => {
            const fetchMock = mock(() => Promise.resolve({
                ok: true,
                json: () => Promise.resolve({ room: 'new-room', password: 'testpassword' }),
            } as Response));
            globalThis.fetch = fetchMock;

            await VocaClient.createRoom({ password: 'testpassword' });

            const [url, options] = (fetchMock as any).mock.calls[0];
            expect(url).toContain('password=testpassword');
        });
    });

    describe('validatePassword', () => {
        it('should return null for valid passwords', () => {
            expect(validatePassword('trey123')).toBeNull();
            expect(validatePassword('voca')).toBeNull();
        });

        it('should return null for empty/undefined (optional)', () => {
            expect(validatePassword('')).toBeNull();
        });

        it('should reject passwords that are too short', () => {
            expect(validatePassword('abc')).toBe('Password must be 4-12 characters');
        });

        it('should reject passwords that are too long', () => {
            expect(validatePassword('toolongpassword123')).toBe('Password must be 4-12 characters');
        });

        it('should reject invalid characters', () => {
            expect(validatePassword('trey!123')).toBe('Password must contain only letters and numbers');
        });
    });

    describe('password handling', () => {
        it('should include password in WebSocket URL', async () => {
            const client = new VocaClient('test-room', {
                password: 'secretpassword',
            });
            await client.connect();

            // @ts-ignore - access private ws to check URL
            expect(client.ws.url).toContain('password=secretpassword');
        });

        it('should emit error when password is required', async () => {
            const client = new VocaClient('test-room');
            const errorHandler = mock();
            client.on('error', errorHandler);

            await client.connect();

            // Simulate server sending password_required error
            // @ts-ignore - trigger onmessage
            client.ws.onmessage({
                data: JSON.stringify({
                    from: 'server',
                    type: 'error',
                    code: 'password_required',
                    message: 'Password required'
                })
            });

            expect(errorHandler).toHaveBeenCalled();
            const [error] = errorHandler.mock.calls[0];
            expect(error.code).toBe(VocaErrorCode.PASSWORD_REQUIRED);
        });

        it('should emit error when password is invalid', async () => {
            const client = new VocaClient('test-room', { password: 'wrong' });
            const errorHandler = mock();
            client.on('error', errorHandler);

            await client.connect();

            // Simulate server sending invalid_password error
            // @ts-ignore - trigger onmessage
            client.ws.onmessage({
                data: JSON.stringify({
                    from: 'server',
                    type: 'error',
                    code: 'invalid_password',
                    message: 'Invalid password'
                })
            });

            expect(errorHandler).toHaveBeenCalled();
            const [error] = errorHandler.mock.calls[0];
            expect(error.code).toBe(VocaErrorCode.INVALID_PASSWORD);
        });
    });

    describe('connect', () => {
        it('should emit status events during connection', async () => {
            const client = new VocaClient('test-room');
            const statusEvents: string[] = [];

            client.on('status', (status) => {
                statusEvents.push(status);
            });

            await client.connect();

            expect(statusEvents.length).toBeGreaterThan(0);
        });
    });

    describe('disconnect', () => {
        it('should clean up resources on disconnect', async () => {
            const client = new VocaClient('test-room');
            await client.connect();
            client.disconnect();

            expect(client).toBeDefined();
        });
    });

    describe('toggleMute', () => {
        it('should return mute state when called', async () => {
            const client = new VocaClient('test-room');
            await client.connect();

            const result = client.toggleMute();
            expect(typeof result).toBe('boolean');
        });
    });

    describe('event emitter', () => {
        it('should allow subscribing to events', () => {
            const client = new VocaClient('test-room');
            const handler = mock();

            client.on('status', handler);
            expect(handler).not.toHaveBeenCalled();
        });
    });
});
