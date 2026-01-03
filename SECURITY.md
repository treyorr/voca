# Security Policy

## Supported Versions

We release patches for security vulnerabilities. Currently supported versions:

| Version | Supported          |
| ------- | ------------------ |
| 0.0.x   | :white_check_mark: |

## Reporting a Vulnerability

**Please do not report security vulnerabilities through public GitHub issues.**

If you discover a security vulnerability, please email **treyorr20@gmail.com** or open a private security advisory on GitHub with:

- Description of the vulnerability
- Steps to reproduce
- Potential impact
- Suggested fix (if any)

You should receive a response within 48 hours. If the issue is confirmed, we will:

1. Release a fix as soon as possible
2. Credit you in the security advisory (unless you prefer to remain anonymous)

## Security Best Practices for Self-Hosting

When self-hosting Voca, please ensure:

- **Use strong admin tokens**: Set `VOCA_ADMIN_TOKEN` to a cryptographically random string
- **Enable HTTPS/WSS**: Use a reverse proxy (Caddy, nginx) with valid TLS certificates
- **Keep dependencies updated**: Regularly run `npm audit` and `cargo audit`
- **Restrict admin endpoints**: Use firewall rules to limit access to `/api/admin/*` endpoints
- **Monitor logs**: If using `VOCA_LOG_DIR`, ensure logs are rotated and secured

## Known Limitations

- WebRTC connections are P2P and encrypted, but room IDs are guessable 6-character strings
- No built-in rate limiting beyond what's in the signaling server (5 rooms/min per IP)
- Admin API endpoints are protected only by Bearer token authentication
