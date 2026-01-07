use axum::{
    extract::{ws::{Message, WebSocket}, Path, Query, State, WebSocketUpgrade},
    http::{StatusCode, HeaderMap},
    response::{IntoResponse, Json},
};
use axum_extra::{headers::{authorization::Bearer, Authorization}, TypedHeader};
use futures::{SinkExt, StreamExt};
use std::{collections::HashMap, sync::Arc, time::{Duration, Instant}};
use tokio::sync::broadcast;
use tracing::{info, warn};

use crate::state::{AppState, RoomKey, RoomState, generate_unique_slug, generate_peer_id};
use crate::types::{AdminRoomsResponse, CreateRoomResponse, RoomInfo, SignalMessage, SignalPayload};

const HEARTBEAT_INTERVAL: Duration = Duration::from_secs(15);
const HEARTBEAT_TIMEOUT: Duration = Duration::from_secs(30);

fn get_app_id(params: &HashMap<String, String>) -> String {
    params.get("appId").cloned().unwrap_or_else(|| "public".to_string())
}

/// Validate room ID format: 4-32 alphanumeric characters or hyphens
fn validate_room_id(room_id: &str) -> Result<(), &'static str> {
    if room_id.len() < 4 || room_id.len() > 32 {
        return Err("invalid_room_id_length");
    }
    if !room_id.chars().all(|c| c.is_ascii_alphanumeric() || c == '-') {
        return Err("invalid_room_id_chars");
    }
    Ok(())
}

fn validate_api_key(
    state_key: &Option<String>,
    headers: Option<&HeaderMap>,
    query_key: Option<&String>,
) -> bool {
    let server_key = match state_key {
        Some(k) => k,
        None => return true,
    };

    // Check header (for HTTP)
    if let Some(headers) = headers {
        if let Some(val) = headers.get("x-api-key") {
            if let Ok(val_str) = val.to_str() {
                if val_str == server_key {
                    return true;
                }
            }
        }
    }

    // Check query param (for WebSocket)
    if let Some(q_key) = query_key {
        if q_key == server_key {
            return true;
        }
    }

    false
}

pub async fn create_room(
    State(state): State<AppState>,
    headers: HeaderMap,
    Query(params): Query<HashMap<String, String>>,
) -> impl IntoResponse {
    // Check API Key
    if !validate_api_key(&state.api_key, Some(&headers), None) {
        return (StatusCode::UNAUTHORIZED, "Invalid API Key").into_response();
    }

    let app_id = get_app_id(&params);

    // Check global room limit
    if state.rooms.len() >= state.max_global_rooms {
        return (
            StatusCode::TOO_MANY_REQUESTS,
            Json(serde_json::json!({
                "error": "max_rooms_reached",
                "message": "Maximum number of global rooms reached"
            })),
        )
            .into_response();
    }

    // Generate unique slug with collision check
    let slug = match generate_unique_slug(&state.rooms, &app_id) {
        Some(s) => s,
        None => {
            return (
                StatusCode::INTERNAL_SERVER_ERROR,
                Json(serde_json::json!({
                    "error": "slug_generation_failed",
                    "message": "Failed to generate unique room ID"
                })),
            )
                .into_response();
    }
    };

    // Parse optional max_peers from query params
    let max_peers = params.get("max_peers")
        .and_then(|s| s.parse::<usize>().ok());

    // Parse optional password from query params
    let password = params.get("password").cloned();
    
    // Validate password format if provided
    if let Some(ref pwd) = password {
        if pwd.len() < 4 || pwd.len() > 12 {
            return (
                StatusCode::BAD_REQUEST,
                Json(serde_json::json!({
                    "error": "invalid_password",
                    "message": "Password must be 4-12 characters"
                })),
            )
                .into_response();
        }
        if !pwd.chars().all(|c| c.is_ascii_alphanumeric()) {
            return (
                StatusCode::BAD_REQUEST,
                Json(serde_json::json!({
                    "error": "invalid_password",
                    "message": "Password must contain only letters and numbers"
                })),
            )
                .into_response();
        }
    }

    // Pre-create the room with capacity and password
    let key = RoomKey {
        app_id: app_id.clone(),
        room_id: slug.clone(),
    };
    state.rooms.insert(key, RoomState::with_capacity(max_peers.unwrap_or(state.max_peers_per_room), password.clone()));

    // Increment metrics counter
    state.rooms_created_today.fetch_add(1, std::sync::atomic::Ordering::Relaxed);

    info!(
        event = "room_created",
        room_id = slug,
        app_id = app_id,
        max_peers = max_peers,
        has_password = password.is_some(),
        total_rooms = state.rooms.len(),
        "Room created"
    );
    Json(CreateRoomResponse { room: slug, password }).into_response()
}

pub async fn check_room(
    Path(room): Path<String>,
    Query(params): Query<HashMap<String, String>>,
    State(state): State<AppState>,
) -> impl IntoResponse {
    // Validate room ID format
    if let Err(code) = validate_room_id(&room) {
        return (
            StatusCode::BAD_REQUEST,
            Json(serde_json::json!({
                "error": code,
                "message": "Invalid room ID format"
            })),
        )
            .into_response();
    }
    
    let app_id = get_app_id(&params);
    let key = RoomKey {
        app_id,
        room_id: room,
    };

    match state.rooms.get(&key) {
        Some(room_state) => {
            let peer_count = room_state.peers.len();
            let max_peers = room_state.max_peers;
            let is_full = peer_count >= max_peers;
            let password_required = room_state.password.is_some();
            Json(serde_json::json!({
                "exists": true,
                "peers": peer_count,
                "capacity": max_peers,
                "full": is_full,
                "password_required": password_required
            }))
            .into_response()
        }
        None => StatusCode::NOT_FOUND.into_response(),
    }
}

pub async fn admin_rooms(
    TypedHeader(auth): TypedHeader<Authorization<Bearer>>,
    State(state): State<AppState>,
) -> impl IntoResponse {
    if auth.token() != state.admin_token {
        return (StatusCode::UNAUTHORIZED, "Invalid token").into_response();
    }

    let rooms: Vec<RoomInfo> = state
        .rooms
        .iter()
        .map(|entry| RoomInfo {
            id: entry.key().room_id.clone(),
            app_id: entry.key().app_id.clone(),
            peers: entry.value().peers.len(),
            capacity: state.max_peers_per_room,
        })
        .collect();

    Json(AdminRoomsResponse {
        total_rooms: rooms.len(),
        max_rooms: state.max_global_rooms,
        rooms,
    })
    .into_response()
}

pub async fn admin_metrics(
    TypedHeader(auth): TypedHeader<Authorization<Bearer>>,
    State(state): State<AppState>,
) -> impl IntoResponse {
    if auth.token() != state.admin_token {
        return (StatusCode::UNAUTHORIZED, "Invalid token").into_response();
    }

    // Count total active connections across all rooms
    let active_connections: usize = state.rooms.iter().map(|r| r.value().peers.len()).sum();

    Json(crate::types::MetricsResponse {
        active_rooms: state.rooms.len(),
        active_connections,
        rooms_created_today: state.rooms_created_today.load(std::sync::atomic::Ordering::Relaxed),
        connections_today: state.connections_today.load(std::sync::atomic::Ordering::Relaxed),
        uptime_seconds: state.start_time.elapsed().as_secs(),
    })
    .into_response()
}

pub async fn admin_logs(
    TypedHeader(auth): TypedHeader<Authorization<Bearer>>,
    State(state): State<AppState>,
) -> impl IntoResponse {
    if auth.token() != state.admin_token {
        return (StatusCode::UNAUTHORIZED, "Invalid token").into_response();
    }

    // If no log_dir configured, return empty
    let log_dir = match &state.log_dir {
        Some(dir) => dir,
        None => return Json(serde_json::json!({ "logs": [] })).into_response(),
    };

    // Read the most recent log file
    let log_path = std::path::Path::new(log_dir);
    
    // Find the most recent voca.log file
    let log_files = match std::fs::read_dir(log_path) {
        Ok(entries) => {
            let mut files: Vec<_> = entries
                .filter_map(|e| e.ok())
                .filter(|e| {
                    e.file_name()
                        .to_string_lossy()
                        .starts_with("voca.log")
                })
                .collect();
            files.sort_by_key(|e| e.metadata().ok().and_then(|m| m.modified().ok()));
            files.reverse();
            files
        }
        Err(_) => return Json(serde_json::json!({ "logs": [] })).into_response(),
    };

    let log_file = match log_files.first() {
        Some(f) => f.path(),
        None => return Json(serde_json::json!({ "logs": [] })).into_response(),
    };

    // Read last 500 lines
    let content = match std::fs::read_to_string(&log_file) {
        Ok(c) => c,
        Err(_) => return Json(serde_json::json!({ "logs": [] })).into_response(),
    };

    let lines: Vec<&str> = content.lines().collect();
    let recent_lines: Vec<String> = lines
        .iter()
        .rev()
        .take(500)
        .rev()
        .map(|s| s.to_string())
        .collect();

    Json(serde_json::json!({ "logs": recent_lines })).into_response()
}


/// Helper to send an error message over WebSocket and close
async fn send_error_and_close(mut socket: WebSocket, code: &str, message: &str) {
    let error_msg = SignalMessage {
        from: "server".to_string(),
        payload: SignalPayload::Error {
            code: code.to_string(),
            message: message.to_string(),
        },
    };
    if let Ok(json) = serde_json::to_string(&error_msg) {
        let _ = socket.send(Message::Text(json.into())).await;
    }
    let _ = socket.close().await;
}

pub async fn ws_handler(
    ws: WebSocketUpgrade,
    Path(room): Path<String>,
    Query(params): Query<HashMap<String, String>>,
    State(state): State<AppState>,
) -> impl IntoResponse {
    // Validate room ID format
    if let Err(code) = validate_room_id(&room) {
        return (
            StatusCode::BAD_REQUEST,
            Json(serde_json::json!({
                "error": code,
                "message": "Invalid room ID format"
            })),
        )
            .into_response();
    }
    
    let app_id = get_app_id(&params);
    let key = RoomKey {
        app_id: app_id.clone(),
        room_id: room.clone(),
    };

    // Check if room exists
    let room_ref = match state.rooms.get(&key) {
        Some(r) => r,
        None => return StatusCode::NOT_FOUND.into_response(),
    };

    // Check password and capacity, but accept connection to send proper error
    let password_error: Option<(&str, &str)> = if let Some(room_password) = &room_ref.password {
        let provided_password = params.get("password");
        match provided_password {
            Some(pwd) if pwd == room_password => None,
            Some(_) => Some(("invalid_password", "Incorrect password")),
            None => Some(("password_required", "This room requires a password")),
        }
    } else {
        None
    };

    // Check capacity
    let room_max_peers = room_ref.max_peers;
    let is_full = room_ref.peers.len() >= room_max_peers;
    drop(room_ref);

    // Accept WebSocket connection and send any errors over the connection
    // This allows the SDK to properly receive and handle these errors
    if let Some((code, message)) = password_error {
        return ws.on_upgrade(move |socket| send_error_and_close(socket, code, message)).into_response();
    }

    if is_full {
        return ws.on_upgrade(move |socket| send_error_and_close(socket, "room_full", "Room is at maximum capacity")).into_response();
    }

    ws.on_upgrade(move |socket| handle_socket(socket, key, state))
}

async fn handle_socket(socket: WebSocket, key: RoomKey, state: AppState) {
    let peer_id = generate_peer_id();

    // Register peer in room
    {
        let mut room_ref = match state.rooms.get_mut(&key) {
            Some(r) => r,
            None => {
                warn!(event = "room_missing", room_id = key.room_id, app_id = key.app_id, "Room disappeared");
                return;
            }
        };

        // Double-check capacity (race condition protection)
        if room_ref.peers.len() >= state.max_peers_per_room {
            warn!(
                event = "room_full_race",
                room_id = key.room_id,
                app_id = key.app_id,
                peer_id = peer_id,
                "Room full (race condition)"
            );
            return;
        }

        room_ref.peers.insert(peer_id.clone());
    }

    // Increment connections counter
    state.connections_today.fetch_add(1, std::sync::atomic::Ordering::Relaxed);

    info!(
        event = "peer_joining",
        peer_id = peer_id,
        room_id = key.room_id,
        app_id = key.app_id,
        "Peer joining room"
    );

    // Get broadcast channel
    let tx = {
        let room_ref = match state.rooms.get(&key) {
            Some(r) => r,
            None => return,
        };
        room_ref.tx.clone()
    };
    let rx = tx.subscribe();

    let (mut ws_tx, ws_rx) = socket.split();

    // Send Welcome message with protocol version and assigned peer_id
    let welcome = SignalMessage {
        from: "server".to_string(),
        payload: SignalPayload::Welcome {
            version: "0.3.0".to_string(),
            peer_id: peer_id.clone(),
        },
    };
    if let Ok(json) = serde_json::to_string(&welcome) {
        let _ = ws_tx.send(Message::Text(json.into())).await;
    }

    // Announce join to room
    let join_msg = SignalMessage {
        from: peer_id.clone(),
        payload: SignalPayload::Join {
            peer_id: peer_id.clone(),
        },
    };
    let _ = tx.send(join_msg);

    // Track heartbeat state
    let last_pong = Arc::new(tokio::sync::Mutex::new(Instant::now()));
    
    // Use a oneshot channel to signal heartbeat timeout
    let (timeout_tx, timeout_rx) = tokio::sync::oneshot::channel::<()>();
    let timeout_tx = Arc::new(tokio::sync::Mutex::new(Some(timeout_tx)));

    // Spawn forwarding task (Heartbeats + Broadcasts)
    let forward_job = tokio::spawn(run_forward_task(
        ws_tx,
        rx,
        peer_id.clone(),
        last_pong.clone(),
        timeout_tx,
    ));

    // Run receive loop (Incoming WebSocket messages)
    let receive_job = run_receive_loop(
        ws_rx,
        tx.clone(),
        timeout_rx, 
        peer_id.clone(),
        last_pong,
    );
    
    // Wait for receive loop to finish (either connection closed, error, or timeout signal)
    receive_job.await;

    // Cleanup
    forward_job.abort();

    // Remove peer from room
    if let Some(mut room_ref) = state.rooms.get_mut(&key) {
        room_ref.peers.remove(&peer_id);
    }

    // Announce leave
    let leave_msg = SignalMessage {
        from: peer_id.clone(),
        payload: SignalPayload::Leave {
            peer_id: peer_id.clone(),
        },
    };
    let _ = tx.send(leave_msg);

    tokio::time::sleep(Duration::from_millis(50)).await;

    // Cleanup empty room
    let should_remove = state
        .rooms
        .get(&key)
        .map(|r| r.peers.is_empty())
        .unwrap_or(false);

    if should_remove {
        info!(
            event = "room_ended",
            room_id = key.room_id,
            app_id = key.app_id,
            "Room removed (no peers left)"
        );
        state.rooms.remove(&key);
    } else {
        let remaining = state
            .rooms
            .get(&key)
            .map(|r| r.peers.len())
            .unwrap_or(0);
        info!(
            event = "peer_left",
            peer_id = peer_id,
            room_id = key.room_id,
            app_id = key.app_id,
            remaining_peers = remaining,
            "Peer left room"
        );
    }
}

// ----------------------
// Helper Functions for handle_socket
// ----------------------

use futures::stream::{SplitSink, SplitStream};

async fn run_forward_task(
    mut ws_tx: SplitSink<WebSocket, Message>,
    mut rx: broadcast::Receiver<SignalMessage>,
    peer_id: String,
    last_pong: Arc<tokio::sync::Mutex<Instant>>,
    timeout_tx: Arc<tokio::sync::Mutex<Option<tokio::sync::oneshot::Sender<()>>>>,
) {
    let mut ping_interval = tokio::time::interval(HEARTBEAT_INTERVAL);

    loop {
        tokio::select! {
            _ = ping_interval.tick() => {
                // Send ping
                let ping = SignalMessage {
                    from: "server".to_string(),
                    payload: SignalPayload::Ping,
                };
                if let Ok(json) = serde_json::to_string(&ping) {
                    if ws_tx.send(Message::Text(json.into())).await.is_err() {
                        break;
                    }
                }

                // Check timeout
                let last = *last_pong.lock().await;
                if last.elapsed() > HEARTBEAT_TIMEOUT {
                    warn!(event = "heartbeat_timeout", peer_id = peer_id, "Peer heartbeat timeout");
                    
                    // Signal timeout to main loop
                    if let Some(tx) = timeout_tx.lock().await.take() {
                        let _ = tx.send(());
                    }
                    // Force close
                    let _ = ws_tx.close().await;
                    break;
                }
            }
            msg = rx.recv() => {
                match msg {
                    Ok(msg) => {
                        // Don't send messages back to sender
                        if msg.from == peer_id { continue; }

                        // Check targeting
                        match &msg.payload {
                            SignalPayload::Offer { to, .. } | 
                            SignalPayload::Answer { to, .. } | 
                            SignalPayload::Ice { to, .. } => {
                                if to != &peer_id { continue; }
                            }
                            SignalPayload::Ping | SignalPayload::Pong => continue,
                            _ => {}
                        }

                        if let Ok(json) = serde_json::to_string(&msg) {
                            if ws_tx.send(Message::Text(json.into())).await.is_err() {
                                break;
                            }
                        }
                    }
                    Err(_) => break,
                }
            }
        }
    }
}

async fn run_receive_loop(
    mut ws_rx: SplitStream<WebSocket>,
    tx: broadcast::Sender<SignalMessage>,
    mut timeout_rx: tokio::sync::oneshot::Receiver<()>,
    peer_id: String,
    last_pong: Arc<tokio::sync::Mutex<Instant>>,
) {
     loop {
        tokio::select! {
            // Heartbeat timeout signal
            _ = &mut timeout_rx => {
                info!(event = "heartbeat_disconnect", peer_id = peer_id, "Disconnecting peer due to heartbeat timeout");
                break;
            }
            // Incoming WebSocket messages
            msg = ws_rx.next() => {
                match msg {
                    Some(Ok(Message::Text(text))) => {
                        if let Ok(mut signal) = serde_json::from_str::<SignalMessage>(&text) {
                            if matches!(signal.payload, SignalPayload::Pong) {
                                *last_pong.lock().await = Instant::now();
                                continue;
                            }
                            // Handle Hello message - log client info, don't broadcast
                            if let SignalPayload::Hello { ref version, ref client } = signal.payload {
                                info!(
                                    event = "client_hello",
                                    peer_id = peer_id,
                                    client_version = %version,
                                    client_name = %client,
                                    "Client connected"
                                );
                                continue;
                            }
                            signal.from = peer_id.clone();
                            let _ = tx.send(signal);
                        }
                    }
                    Some(Ok(_)) => continue,
                    Some(Err(_)) | None => break,
                }
            }
        }
    }
}
