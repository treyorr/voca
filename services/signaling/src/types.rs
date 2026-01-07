use serde::{Deserialize, Serialize};

#[derive(Clone, Debug, Serialize, Deserialize)]
pub struct SignalMessage {
    pub from: String,
    #[serde(flatten)]
    pub payload: SignalPayload,
}

#[derive(Clone, Debug, Serialize, Deserialize)]
#[serde(tag = "type", rename_all = "lowercase")]
pub enum SignalPayload {
    /// Client sends hello on connect with version info
    Hello { version: String, client: String },
    /// Server responds with welcome and assigned peer_id
    Welcome { version: String, peer_id: String },
    Join { peer_id: String },
    Leave { peer_id: String },
    Offer { to: String, sdp: String },
    Answer { to: String, sdp: String },
    Ice { to: String, candidate: String },
    Ping,
    Pong,
    Error { code: String, message: String },
}

#[derive(Serialize)]
pub struct CreateRoomResponse {
    pub room: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub password: Option<String>,
}

#[derive(Serialize)]
pub struct RoomInfo {
    pub id: String,
    pub app_id: String,
    pub peers: usize,
    pub capacity: usize,
}

#[derive(Serialize)]
pub struct AdminRoomsResponse {
    pub rooms: Vec<RoomInfo>,
    pub total_rooms: usize,
    pub max_rooms: usize,
}

#[derive(Serialize)]
pub struct MetricsResponse {
    pub active_rooms: usize,
    pub active_connections: usize,
    pub rooms_created_today: u64,
    pub connections_today: u64,
    pub uptime_seconds: u64,
}
