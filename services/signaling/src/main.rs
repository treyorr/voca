mod handlers;
mod state;
mod types;

use axum::{
    routing::{get, post},
    Router,
};
use dashmap::DashMap;
use std::{net::SocketAddr, sync::Arc};
use tower_governor::{
    governor::GovernorConfigBuilder, key_extractor::PeerIpKeyExtractor, GovernorLayer,
};
use tower_http::cors::CorsLayer;
use tracing::info;
use tracing_subscriber::{layer::SubscriberExt, util::SubscriberInitExt};

use crate::handlers::{admin_logs, admin_metrics, admin_rooms, check_room, create_room, ws_handler};
use crate::state::{AppState, MAX_GLOBAL_ROOMS, MAX_PEERS_PER_ROOM};

#[tokio::main]
async fn main() {
    // Logging Setup
    let log_dir = std::env::var("VOCA_LOG_DIR").ok();
    let format = std::env::var("RUST_LOG_FORMAT").unwrap_or_else(|_| "text".to_string());
    let filter = tracing_subscriber::EnvFilter::try_from_default_env()
        .unwrap_or_else(|_| tracing_subscriber::EnvFilter::new("info"));

    if let Some(ref dir) = log_dir {
        let file_appender = tracing_appender::rolling::daily(dir, "voca.log");
        let (non_blocking, _guard) = tracing_appender::non_blocking(file_appender);

        let layer = tracing_subscriber::fmt::layer().with_writer(non_blocking);
        let registry = tracing_subscriber::registry().with(filter);

        if format == "json" {
            registry.with(layer.json()).init();
        } else {
            registry.with(layer).init();
        }
        std::mem::forget(_guard);
    } else {
        let registry = tracing_subscriber::registry().with(filter);
        if format == "json" {
            registry
                .with(tracing_subscriber::fmt::layer().json())
                .init();
        } else {
            registry.with(tracing_subscriber::fmt::layer()).init();
        }
    }

    let admin_token = std::env::var("VOCA_ADMIN_TOKEN").unwrap_or_else(|_| "changeme".to_string());
    let api_key = std::env::var("VOCA_API_KEY").ok();
    
    // Read configurable limits from environment
    let max_peers_per_room = std::env::var("VOCA_MAX_PEERS_PER_ROOM")
        .ok()
        .and_then(|s| s.parse::<usize>().ok())
        .unwrap_or(MAX_PEERS_PER_ROOM);
    
    let max_global_rooms = std::env::var("VOCA_MAX_GLOBAL_ROOMS")
        .ok()
        .and_then(|s| s.parse::<usize>().ok())
        .unwrap_or(MAX_GLOBAL_ROOMS);

    info!(
        event = "startup",
        max_peers_per_room = max_peers_per_room,
        max_global_rooms = max_global_rooms,
        "Starting signaling server"
    );

    let state = AppState {
        rooms: Arc::new(DashMap::new()),
        rooms_created_today: Arc::new(std::sync::atomic::AtomicU64::new(0)),
        connections_today: Arc::new(std::sync::atomic::AtomicU64::new(0)),
        start_time: std::time::Instant::now(),
        admin_token,
        api_key,
        log_dir,
        max_peers_per_room,
        max_global_rooms,
    };

    // Rate limiting: 5 room creations per minute per IP
    let governor_conf = Arc::new(
        GovernorConfigBuilder::default()
            .per_second(12) // Refill rate: 1 token per 12 seconds = 5 per minute
            .burst_size(5)
            .key_extractor(PeerIpKeyExtractor)
            .finish()
            .unwrap(),
    );
    let governor_limiter = governor_conf.limiter().clone();
    let rate_limit_layer = GovernorLayer::new(governor_conf.clone());

    // Spawn background task to clean up rate limiter
    tokio::spawn(async move {
        loop {
            tokio::time::sleep(std::time::Duration::from_secs(60)).await;
            governor_limiter.retain_recent();
        }
    });

    // Spawn background task to clean up empty rooms
    let rooms = state.rooms.clone();
    tokio::spawn(async move {
        loop {
            tokio::time::sleep(std::time::Duration::from_secs(60)).await;
            
            let mut rooms_to_remove = Vec::new();
            
            // Identify empty rooms older than 5 minutes
            for entry in rooms.iter() {
                if entry.value().peers.is_empty() && entry.value().created_at.elapsed() > std::time::Duration::from_secs(300) {
                    rooms_to_remove.push(entry.key().clone());
                }
            }
            
            // Remove them
            for key in rooms_to_remove {
                info!(event = "room_cleanup", room_id = %key.room_id, app_id = %key.app_id, "Removing empty stale room");
                rooms.remove(&key);
            }
        }
    });

    // Routes with rate limiting on room creation
    let room_routes = Router::new()
        .route("/api/room", post(create_room))
        .layer(rate_limit_layer);

    let app = Router::new()
        .merge(room_routes)
        .route("/api/room/{room}", get(check_room))
        .route("/api/admin/rooms", get(admin_rooms))
        .route("/api/admin/metrics", get(admin_metrics))
        .route("/api/admin/logs", get(admin_logs))
        .route("/ws/{room}", get(ws_handler))
        .layer(CorsLayer::permissive())
        .with_state(state);

    let addr = SocketAddr::from(([0, 0, 0, 0], 3001));
    info!(event = "listening", address = %addr, "Signaling server listening");

    let listener = tokio::net::TcpListener::bind(addr).await.unwrap();
    axum::serve(
        listener,
        app.into_make_service_with_connect_info::<SocketAddr>(),
    )
    .await
    .unwrap();
}
