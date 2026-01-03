# voca.vc

**Open-source WebRTC voice chat.** Ephemeral rooms. No auth. Pure P2P.

[![npm](https://img.shields.io/npm/v/@voca/client)](https://www.npmjs.com/package/@voca/client)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)

## Features

- 🔒 **Zero Persistence** — No data stored, no accounts
- 🌐 **Pure P2P** — Audio never touches the server (WebRTC mesh)
- ⚡ **Instant** — One-click room creation
- 🔐 **Encrypted** — DTLS-SRTP for all audio
- 📱 **Responsive** — Works on desktop and mobile

## SDK Packages

| Package | Description |
|---------|-------------|
| [@voca/client](https://npmjs.com/package/@voca/client) | Core TypeScript SDK |
| [@voca/react](https://npmjs.com/package/@voca/react) | React hooks |
| [@voca/svelte](https://npmjs.com/package/@voca/svelte) | Svelte 5 runes wrapper |

### Quick Install

```bash
bun install @voca/client
# or for frameworks:
bun install @voca/react    # React
bun install @voca/svelte   # Svelte 5
```

### Usage Example (React)

```tsx
import { useVocaRoom } from '@voca/react';

function VoiceRoom({ roomId }) {
  const { status, peers, toggleMute, isMuted } = useVocaRoom(roomId);
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
| `POST /api/room` | - | Create room → `{"room": "abc123"}` |
| `GET /api/room/{id}` | - | Check if room exists |
| `GET /ws/{id}` | - | WebSocket signaling |
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

