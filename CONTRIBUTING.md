# Contributing to Voca

Thank you for your interest in contributing to Voca! This document provides guidelines for contributing to the project.

## Development Setup

### Prerequisites

- [mise](https://mise.jdx.dev/) - Dev environment manager (handles Rust, Bun, etc.)
- Or manually install:
  - Rust 1.92+
  - Bun 1.3.5+

### Getting Started

1. **Clone the repository**
   ```bash
   git clone https://github.com/treyorr/voca.git
   cd voca
   ```

2. **Install dependencies**
   ```bash
   # Using mise (recommended)
   mise install
   bun install

   # Or manually
   bun install
   ```

3. **Start development servers**
   ```bash
   # Using mise
   mise run dev

   # Or manually
   # Terminal 1: Signaling server
   cd services/signaling && RUST_LOG=info cargo run

   # Terminal 2: Web frontend
   cd apps/web && bun run dev
   ```

4. **Open your browser**
   - Frontend: http://localhost:5173
   - Signaling: http://localhost:3001

## Project Structure

```
voca/
├── services/signaling/    # Rust WebSocket signaling server
├── apps/web/              # SvelteKit web application
├── packages/
│   ├── voca-client/       # Core TypeScript SDK
│   ├── voca-react/        # React hooks wrapper
│   └── voca-svelte/       # Svelte runes wrapper
└── mise.toml              # Development tasks
```

## Making Changes

### Code Style

**TypeScript/JavaScript:**
- Use TypeScript for all new code
- Follow existing code style (2-space indentation)
- Run `npm run lint` before committing

**Rust:**
- Follow Rust conventions (`cargo fmt`, `cargo clippy`)
- Use `rustfmt` for formatting

**Svelte:**
- Use Svelte 5 runes (`$state`, `$derived`, `$effect`)
- Avoid legacy reactivity syntax

### Running Tests

```bash
# Client SDK tests
cd packages/voca-client && npm test

# Lint all code
mise run lint

# Build all packages
mise run build-packages
```

### Commit Messages

Use clear, descriptive commit messages:

```
Add feature: [brief description]
Fix: [what was broken]
Docs: [what was updated]
Refactor: [what was improved]
```

## Pull Request Process

1. **Fork the repository** and create a branch from `main`
2. **Make your changes** following the code style guidelines
3. **Test your changes** thoroughly
4. **Update documentation** if needed (README, docs pages, etc.)
5. **Submit a pull request** with:
   - Clear description of changes
   - Any related issue numbers
   - Screenshots/videos for UI changes

### PR Requirements

- [ ] Code builds successfully (`mise run build-packages`)
- [ ] Tests pass (`npm test` in relevant packages)
- [ ] No linting errors (`mise run lint`)
- [ ] Documentation updated if needed

## Types of Contributions

### Bug Reports

Open an issue with:
- Clear description of the bug
- Steps to reproduce
- Expected vs actual behavior
- Browser/OS information
- Console errors (if applicable)

### Feature Requests

Open an issue describing:
- The problem you're trying to solve
- Your proposed solution
- Any alternatives you've considered

### Code Contributions

We welcome:
- Bug fixes
- New features (discuss in an issue first for large changes)
- Documentation improvements
- Test coverage improvements
- Performance optimizations

### What We're Looking For

- **Keep it simple**: Voca is intentionally minimal
- **No dependencies**: Avoid adding new dependencies unless absolutely necessary
- **Privacy-first**: No tracking, no analytics, no data collection
- **Self-hostable**: Changes should work for self-hosters

## Development Tips

### Useful Commands

```bash
# Start dev servers
mise run dev

# Build all packages
mise run build-packages

# Lint everything
mise run lint

# Build Docker images locally
docker build -f services/signaling/Dockerfile -t voca-signaling .
docker build -f apps/web/Dockerfile -t voca-web .
```

### Debugging

- **Signaling Server**: Check `RUST_LOG=debug cargo run` for detailed logs
- **Web App**: Use browser DevTools, check WebSocket messages
- **WebRTC**: Use `chrome://webrtc-internals` to debug connections

## Questions?

- Open a GitHub Discussion
- Check existing issues
- Read the docs at https://voca.vc/docs

## Release Process (Maintainers Only)

We use manual versioning and GitHub Releases to publish packages:

1. **Bump versions** in all package.json files:
   - `packages/voca-client/package.json`
   - `packages/voca-react/package.json`
   - `packages/voca-svelte/package.json`

2. **Commit and push**:
   ```bash
   git add packages/*/package.json
   git commit -m "chore: bump version to 0.1.0"
   git push origin main
   ```

3. **Create GitHub Release**:
   - Go to https://github.com/treyorr/voca/releases/new
   - Create a new tag (e.g., `v0.1.0`)
   - Title: `v0.1.0`
   - Describe what changed
   - Click "Publish release"

4. **Automatic npm publish**:
   - GitHub Actions will automatically build and publish to npm
   - Check the Actions tab to monitor progress

## Code of Conduct

Be respectful, inclusive, and constructive. We're all here to build something cool together.

## License

By contributing, you agree that your contributions will be licensed under the MIT License.
