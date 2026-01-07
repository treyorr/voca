# Agent Guidelines for Voca Development

This file provides context and guidelines for AI agents working on the Voca codebase.

## Project Overview

Voca is an open-source WebRTC voice chat platform with:
- **Backend**: Rust signaling server (`services/signaling`)
- **Frontend**: SvelteKit web app (`apps/web`)
- **SDKs**: TypeScript packages for client, React, and Svelte (`packages/`)

## Architecture

```
voca/
├── services/signaling/     # Rust WebRTC signaling server
│   └── src/
│       ├── handlers.rs     # HTTP/WebSocket handlers
│       ├── state.rs        # Room state management
│       └── types.rs        # API types and responses
├── packages/
│   ├── voca-client/        # Core TypeScript SDK
│   ├── voca-react/         # React hooks wrapper
│   └── voca-svelte/        # Svelte 5 runes wrapper
└── apps/web/               # SvelteKit website + docs
    └── src/routes/
        ├── docs/           # Documentation pages
        └── [room]/         # Room UI
```

## Critical Documentation Update Checklist

When adding new features or making API changes, **ALWAYS** update documentation in this order:

### 1. Backend Changes (Rust)
- [ ] Update `services/signaling/src/handlers.rs` for API endpoints
- [ ] Update `services/signaling/src/types.rs` for request/response types
- [ ] Update `services/signaling/src/state.rs` for state management

### 2. SDK Changes (TypeScript)
- [ ] Update `packages/voca-client/src/index.ts` for core SDK
- [ ] Update `packages/voca-client/src/errors.ts` for new error codes
- [ ] Export new functions from `packages/voca-react/src/index.ts`
- [ ] Export new functions from `packages/voca-svelte/src/lib/index.svelte.ts`

### 3. Documentation Updates (REQUIRED)
- [ ] **Main README** (`/README.md`) - Update features, API table, examples
- [ ] **Package READMEs**:
  - [ ] `packages/voca-client/README.md` - Core SDK examples and API
  - [ ] `packages/voca-react/README.md` - React hook examples
  - [ ] `packages/voca-svelte/README.md` - Svelte wrapper examples
- [ ] **Website Docs** (`apps/web/src/routes/docs/api/+page.svelte`):
  - [ ] Update config options table
  - [ ] Update methods/functions table
  - [ ] Update error codes table
  - [ ] Update code examples

### 4. Build & Verify
- [ ] Run `cargo build` in `services/signaling`
- [ ] Run `bun run build` in each package directory
- [ ] Run `mise run lint` to verify no errors

## Common Patterns

### Adding a New Config Option

1. Add to `VocaConfig` interface in `packages/voca-client/src/index.ts`
2. Update constructor in `VocaClient` class
3. Update all package READMEs with the new option
4. Update `apps/web/src/routes/docs/api/+page.svelte` config table
5. Update main `README.md` if user-facing

### Adding a New Error Code

1. Add to `VocaErrorCode` in `packages/voca-client/src/errors.ts`
2. Add message to `VocaErrorMessages`
3. Update backend handlers to return the error code
4. Update `apps/web/src/routes/docs/api/+page.svelte` error codes table
5. Export from React and Svelte wrappers if needed

### Adding a New API Endpoint

1. Add handler in `services/signaling/src/handlers.rs`
2. Add types in `services/signaling/src/types.rs`
3. Update main `README.md` API table
4. Update `apps/web/src/routes/docs/api/+page.svelte`
5. Add SDK method if needed (follow config option pattern)

### Adding a Utility Function

1. Add to `packages/voca-client/src/index.ts` with JSDoc
2. Export from `packages/voca-react/src/index.ts`
3. Export from `packages/voca-svelte/src/lib/index.svelte.ts`
4. Update all three package READMEs with usage example
5. Update `apps/web/src/routes/docs/api/+page.svelte` utility functions table

## Code Style Guidelines

### Rust (Backend)
- Use `tracing::info!` for logging with structured fields
- Return proper HTTP status codes (400, 401, 404, 409, 500)
- Validate input before processing
- Use `serde_json::json!` for error responses

### TypeScript (SDK)
- Export all public types and functions
- Use JSDoc comments for public APIs
- Validate inputs and throw descriptive errors
- Emit events for state changes

### Svelte (Frontend)
- Use Svelte 5 runes (`$state`, `$derived`, `$props`)
- Keep components simple and focused
- Use brutalist design system classes
- Handle errors gracefully with user-friendly messages

## Testing Checklist

When implementing features:
- [ ] Test with password-protected rooms
- [ ] Test without password (backward compatibility)
- [ ] Test error cases (wrong password, missing password)
- [ ] Test on both desktop and mobile
- [ ] Verify all documentation examples work

## Build Commands

```bash
# Backend
cd services/signaling && cargo build

# SDK packages
cd packages/voca-client && bun run build
cd packages/voca-react && bun run build
cd packages/voca-svelte && bun run build

# Web app
cd apps/web && bun run build

# Run everything
mise run dev
```

## Important Notes

- **Always update documentation** - This is not optional
- **Maintain backward compatibility** - Existing code should continue to work
- **Validate on both client and server** - Defense in depth
- **Keep examples simple** - Show the most common use case
- **Export from all wrappers** - React and Svelte should re-export core SDK utilities

## Documentation Philosophy

Documentation should be:
1. **Discoverable** - Users should find it in multiple places (main README, package README, website)
2. **Consistent** - Same feature described the same way everywhere
3. **Example-driven** - Show code first, explain second
4. **Complete** - Cover all options, methods, and error codes

## When in Doubt

If you're unsure whether to update documentation:
- **YES** - Update it. Over-documentation is better than under-documentation.
- Check all 6 documentation locations (main README + 3 package READMEs + website docs)
- Add code examples showing the new feature in action
- Update tables (config options, methods, error codes) if applicable
