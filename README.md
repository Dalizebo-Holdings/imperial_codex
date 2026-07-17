# Imperial Codex

A strategic operating system and Digital Citadel for Dalizebo Holdings — a Next.js web application that serves as the single source of truth for all operational logic, strategic decisions, capital allocation, and recursive automation across the organisation.

## Overview

The Imperial Codex is built on a multidimensional framework of:
- **207 Strategic Pillars** — The foundational rules of the organisation
- **36 Integrated Operating Systems** — The primary decision framework
- **277 Integrations** — Connections between OS modules
- **104 Recursive Loops** — Automated logic chains (the Heartbeat)
- **345 Library Entries** — Strategic knowledge base

Every output the system produces must adhere to the **5-Part Strike Hierarchy**. The system is governed by **Kernel v16.2** and enforces a clearance-gated security model before yielding sensitive data.

## Documentation

| Document | Description |
|----------|-------------|
| [Deployment Guide](docs/deployment.md) | Deploy Imperial Codex v16 to Vercel with Supabase |
| [Service Integration Guide](docs/service-integration.md) | Comprehensive service integration architecture (AWS, Docker, GitHub, Qdrant, Pinecone, Redis) |
| [Monitoring Guide](docs/monitoring.md) | Monitoring and observability setup |

## Quick Start

### Prerequisites

- Node.js 20+
- Supabase account
- OpenAI API key
- Anthropic API key

### Development

```bash
# Install dependencies
npm install

# Copy environment variables
cp .env.example .env.local

# Run development server
npm run dev
```

### Docker

```bash
# Start development environment
docker-compose up

# Build production image
docker build -t imperial-codex .
```

## Architecture

```
Browser → Next.js App Router → Service Layer → Data Layer
                                            ├─ Supabase (PostgreSQL)
                                            ├─ Redis (cache)
                                            ├─ Qdrant (vector search)
                                            └─ Pinecone (vector search)
```

## Services

| Service | Purpose |
|---------|---------|
| AWS | Cloud infrastructure (compute, storage, networking) |
| Docker | Containerization for local development |
| Supabase | Primary persistence layer (PostgreSQL) |
| Vercel | Deployment and hosting platform |
| GitHub | Version control and CI/CD |
| Qdrant | High-performance vector search |
| Pinecone | Scalable vector search |
| Redis | Caching and session management |

## Features

- **AI Chat Assistant** — Streaming GPT-4o chat widget with tool-use access to all Codex data
- **Autonomous Background Agent** — Evaluates Recursive Loops every 15 minutes, generates daily summaries
- **AI-Powered Strike Output** — Claude-powered generation with structural validation
- **Clearance-Gated Security** — Level 0-2 clearance model for sensitive data protection
- **Capital Allocation Mandate** — Enforces 40/40/20 allocation across financial OS modules

## Development

### Project Structure

```
imperial_codex/
├── core/              # Kernel, Pillars, Library, and other core data
├── os-modules/        # 36 Integrated Operating Systems
├── vault/             # Encrypted secrets and API hooks
├── instruments/       # Generated DH-RES documents
├── docs/              # Documentation
├── src/
│   ├── app/           # Next.js App Router (API routes, pages)
│   ├── lib/           # Application logic (services, repositories)
│   └── components/    # React components
├── supabase/          # Supabase migrations
├── infrastructure/    # AWS Infrastructure-as-Code (Terraform)
└── .kiro/             # AI assistant configuration
```

### Testing

```bash
# Run all tests
npm test

# Run specific test file
npm test src/lib/kernel/__tests__/KernelLoader.test.ts

# Run property-based tests
npm test src/__tests__/properties/
```

### Build

```bash
# Build for production
npm run build

# Start production server
npm start
```

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is proprietary to Dalizebo Holdings. All rights reserved.

## Support

For support, please contact the Imperial Codex team or open an issue in the repository.