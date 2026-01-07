/**
 * Voca Error Codes
 * 
 * Unified error codes used across all Voca SDKs and the signaling server.
 */

export const VocaErrorCode = {
    // Room errors
    ROOM_NOT_FOUND: 'room_not_found',
    ROOM_FULL: 'room_full',
    MAX_ROOMS_REACHED: 'max_rooms_reached',
    INVALID_ROOM_ID: 'invalid_room_id',

    // Connection errors
    CONNECTION_FAILED: 'connection_failed',
    WEBSOCKET_ERROR: 'websocket_error',
    HEARTBEAT_TIMEOUT: 'heartbeat_timeout',

    // Media errors
    MICROPHONE_NOT_FOUND: 'microphone_not_found',
    MICROPHONE_PERMISSION_DENIED: 'microphone_permission_denied',
    INSECURE_CONTEXT: 'insecure_context',

    // Signaling errors
    INVALID_MESSAGE: 'invalid_message',
    PEER_NOT_FOUND: 'peer_not_found',

    // Password errors
    INVALID_PASSWORD: 'invalid_password',
    PASSWORD_REQUIRED: 'password_required',
} as const;

export type VocaErrorCode = typeof VocaErrorCode[keyof typeof VocaErrorCode];

/**
 * Human-readable error messages for each error code
 */
export const VocaErrorMessages: Record<VocaErrorCode, string> = {
    [VocaErrorCode.ROOM_NOT_FOUND]: 'Room not found',
    [VocaErrorCode.ROOM_FULL]: 'Room is at maximum capacity',
    [VocaErrorCode.MAX_ROOMS_REACHED]: 'Maximum number of rooms reached',
    [VocaErrorCode.INVALID_ROOM_ID]: 'Invalid room ID format',
    [VocaErrorCode.CONNECTION_FAILED]: 'Failed to connect to signaling server',
    [VocaErrorCode.WEBSOCKET_ERROR]: 'WebSocket connection error',
    [VocaErrorCode.HEARTBEAT_TIMEOUT]: 'Connection lost due to heartbeat timeout',
    [VocaErrorCode.MICROPHONE_NOT_FOUND]: 'No microphone found. Please connect a microphone and try again.',
    [VocaErrorCode.MICROPHONE_PERMISSION_DENIED]: 'Microphone permission denied. Please allow microphone access.',
    [VocaErrorCode.INSECURE_CONTEXT]: 'HTTPS is required for microphone access',
    [VocaErrorCode.INVALID_MESSAGE]: 'Invalid signaling message received',
    [VocaErrorCode.PEER_NOT_FOUND]: 'Peer not found in room',
    [VocaErrorCode.INVALID_PASSWORD]: 'Incorrect password',
    [VocaErrorCode.PASSWORD_REQUIRED]: 'This room requires a password',
};

/**
 * Voca error with code and message
 */
export interface VocaError {
    code: VocaErrorCode;
    message: string;
}

/**
 * Create a VocaError from a code
 */
export function createVocaError(code: VocaErrorCode, customMessage?: string): VocaError {
    return {
        code,
        message: customMessage ?? VocaErrorMessages[code],
    };
}
