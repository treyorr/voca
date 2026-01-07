# voca.vc

**Open-source WebRTC voice chat.** Ephemeral rooms. No auth. Pure P2P.

[![CI](https://github.com/treyorr/voca/actions/workflows/ci.yml/badge.svg)](https://github.com/treyorr/voca/actions/workflows/ci.yml)
[![npm @treyorr/voca-client](https://img.shields.io/npm/v/@treyorr/voca-client?label=voca-client)](https://www.npmjs.com/package/@treyorr/voca-client)
[![npm @treyorr/voca-svelte](https://img.shields.io/npm/v/@treyorr/voca-svelte?label=voca-svelte)](https://www.npmjs.com/package/@treyorr/voca-svelte)
[![npm @treyorr/voca-react](https://img.shields.io/npm/v/@treyorr/voca-react?label=voca-react)](https://www.npmjs.com/package/@treyorr/voca-react)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)

## Features

- 🔒 **Zero Persistence** — No data stored, no accounts
- 🌐 **Pure P2P** — Audio never touches the server (WebRTC mesh)
- ⚡ **Instant** — One-click room creation
- 🔐 **Encrypted** — DTLS-SRTP for all audio
- 🔑 **Optional Passwords** — Protect rooms with alphanumeric passwords
- 📱 **Responsive** — Works on desktop and mobile

## SDK Packages

| Package | Description |
|---------|-------------|
| [@treyorr/voca-client](https://npmjs.com/package/@treyorr/voca-client) | Core TypeScript SDK |
| [@treyorr/voca-react](https://npmjs.com/package/@treyorr/voca-react) | React hooks |
| [@treyorr/voca-svelte](https://npmjs.com/package/@treyorr/voca-svelte) | Svelte 5 runes wrapper |

### Quick Install

```bash
bun install @treyorr/voca-client
# or for frameworks:
bun install @treyorr/voca-react    # React
bun install @treyorr/voca-svelte   # Svelte 5
```

### Usage Example (React)

```tsx
import { useVocaRoom } from '@treyorr/voca-react';

function VoiceRoom({ roomId }) {
  const { status, peers, toggleMute, isMuted } = useVocaRoom(roomId, {
    password: 'secret123' // Optional: protect room with password
  });
  return (
    <button onClick={toggleMute}>{isMuted ? 'Unmute' : 'Mute'}</button>
  );
}
```

📖 **[Full Documentation →](https://voca.vc/docs)**

---

## Self-Hosting

Voca is designed for easy self-hosting with Docker. No database or external dependencies required.

📖 **[Self-Hosting Guide →](https://voca.vc/docs/self-hosting)**

---

## Development

### With mise (recommended)

```bash
mise run dev
```

### Manual

```bash
# Terminal 1: Signaling server
cd services/signaling && RUST_LOG=info cargo run

# Terminal 2: Web frontend
cd apps/web && bun install && bun run dev
```

Open http://localhost:5173

---

## API

| Endpoint | Auth | Description |
|----------|------|-------------|
| `POST /api/room?password=<pwd>` | - | Create room (optional password) → `{"room": "abc123", "password": "pwd"}` |
| `GET /api/room/{id}` | - | Check if room exists → `{"exists": true, "password_required": false}` |
| `GET /ws/{id}?password=<pwd>` | - | WebSocket signaling (password required if room protected) |
| `GET /api/admin/rooms` | Bearer | List all rooms |
| `GET /api/admin/metrics` | Bearer | Usage metrics |

---

## Contributing

1. Fork the repo
2. Create a branch: `git checkout -b my-feature`
3. Make your changes and run `mise run lint`
4. Submit a PR

Please read our [Code of Conduct](./CODE_OF_CONDUCT.md) first.

---

## Documentation

- [voca.vc/docs](https://voca.vc/docs) — Full SDK and Self-Hosting documentation

---

## License

[MIT](./LICENSE)

