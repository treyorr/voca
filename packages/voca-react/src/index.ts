/**
 * @treyorr/voca-react
 * 
 * React hooks for Voca WebRTC voice chat.
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import { VocaClient, validatePassword, type Peer, type ConnectionStatus, type VocaConfig } from '@treyorr/voca-client';

export type { Peer, ConnectionStatus, VocaConfig };

export interface UseVocaRoomResult {
    /** Current connection status */
    status: ConnectionStatus;
    /** Map of connected peers */
    peers: Map<string, Peer>;
    /** Local media stream */
    localStream: MediaStream | null;
    /** Whether local audio is muted */
    isMuted: boolean;
    /** Local audio level (0-1) */
    localAudioLevel: number;
    /** Toggle local audio mute */
    toggleMute: () => void;
    /** Disconnect from room */
    disconnect: () => void;
}

/**
 * React hook for joining a Voca voice room.
 * 
 * @param roomId - Room ID to join
 * @param config - VocaClient configuration
 * @returns Room state and controls
 * 
 * @example
 * ```tsx
 * function VoiceRoom({ roomId }: { roomId: string }) {
 *     const { status, peers, isMuted, toggleMute } = useVocaRoom(roomId);
 *     
 *     return (
 *         <div>
 *             <p>Status: {status}</p>
 *             <p>Peers: {peers.size}</p>
 *             <button onClick={toggleMute}>{isMuted ? 'Unmute' : 'Mute'}</button>
 *         </div>
 *     );
 * }
 * ```
 */
export function useVocaRoom(roomId: string, config?: VocaConfig): UseVocaRoomResult {
    const [status, setStatus] = useState<ConnectionStatus>('connecting');
    const [peers, setPeers] = useState<Map<string, Peer>>(new Map());
    const [localStream, setLocalStream] = useState<MediaStream | null>(null);
    const [isMuted, setIsMuted] = useState(false);
    const [localAudioLevel, setLocalAudioLevel] = useState(0);

    // Create client instance - memoized to prevent recreation on re-renders
    const client = useMemo(() => new VocaClient(roomId, config), [roomId, JSON.stringify(config)]);

    useEffect(() => {
        // Set up event listeners
        const unsubStatus = client.on('status', setStatus);
        const unsubPeerJoin = client.on('peer-joined', () => setPeers(new Map(client.peers)));
        const unsubPeerLeft = client.on('peer-left', () => setPeers(new Map(client.peers)));
        const unsubPeerAudio = client.on('peer-audio-level', () => setPeers(new Map(client.peers)));
        const unsubLocalAudio = client.on('local-audio-level', setLocalAudioLevel);

        // Connect to room
        client.connect()
            .then(() => setLocalStream(client.localStream))
            .catch(() => { }); // Errors handled via status event

        // Cleanup on unmount
        return () => {
            unsubStatus();
            unsubPeerJoin();
            unsubPeerLeft();
            unsubPeerAudio();
            unsubLocalAudio();
            client.disconnect();
        };
    }, [client]);

    const toggleMute = useCallback(() => {
        setIsMuted(client.toggleMute());
    }, [client]);

    const disconnect = useCallback(() => {
        client.disconnect();
    }, [client]);

    return {
        status,
        peers,
        localStream,
        isMuted,
        localAudioLevel,
        toggleMute,
        disconnect,
    };
}

export { VocaClient, validatePassword };
