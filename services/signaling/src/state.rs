use std::{collections::HashSet, sync::{Arc, atomic::AtomicU64}};
use tokio::sync::broadcast;
use dashmap::DashMap;
use nanoid::nanoid;
use crate::types::SignalMessage;

// === LIMITS ===
pub const MAX_PEERS_PER_ROOM: usize = 6;
pub const MAX_GLOBAL_ROOMS: usize = 500;

const ROOM_SLUG_ALPHABET: [char; 36] = [
    'a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j', 'k', 'l', 'm', 'n', 'o', 'p', 'q', 'r', 's',
    't', 'u', 'v', 'w', 'x', 'y', 'z', '0', '1', '2', '3', '4', '5', '6', '7', '8', '9',
];

/// Tracks room state including peers and broadcast channel
pub struct RoomState {
    pub tx: broadcast::Sender<SignalMessage>,
    pub peers: HashSet<String>,
    pub created_at: std::time::Instant,
    pub max_peers: usize,
}

impl RoomState {
    pub fn with_capacity(max_peers: usize) -> Self {
        let (tx, _) = broadcast::channel::<SignalMessage>(32);
        Self {
            tx,
            peers: HashSet::new(),
            created_at: std::time::Instant::now(),
            max_peers: max_peers.min(MAX_PEERS_PER_ROOM), // Cap at global max
        }
    }
}

#[derive(Clone, PartialEq, Eq, Hash, Debug)]
pub struct RoomKey {
    pub app_id: String,
    pub room_id: String,
}

#[derive(Clone)]
pub struct AppState {
    pub rooms: Arc<DashMap<RoomKey, RoomState>>,
    pub admin_token: String,
    pub api_key: Option<String>,
    // Metrics
    pub rooms_created_today: Arc<AtomicU64>,
    pub connections_today: Arc<AtomicU64>,
    pub start_time: std::time::Instant,
    // Logging
    pub log_dir: Option<String>,
    // Configurable limits
    pub max_peers_per_room: usize,
    pub max_global_rooms: usize,
}

/// Generate a unique 6-character room slug with collision checking
pub fn generate_unique_slug(rooms: &DashMap<RoomKey, RoomState>, app_id: &str) -> Option<String> {
    // Try up to 10 times to find a unique slug
    for _ in 0..10 {
        let slug = nanoid!(6, &ROOM_SLUG_ALPHABET);
        let key = RoomKey {
            app_id: app_id.to_string(),
            room_id: slug.clone(),
        };
        if !rooms.contains_key(&key) {
            return Some(slug);
        }
    }
    None
}

/// Generate a random peer ID
pub fn generate_peer_id() -> String {
    nanoid!(8, &ROOM_SLUG_ALPHABET)
}
