# Frontend Development Learnings

## Task 1: Project Scaffolding - Completed 2024-03-17

### Proxy (Fastify) Project Setup
- **Fastify version**: ^5.0.0 (latest stable)
- **CORS plugin**: @fastify/cors ^10.0.0
- **TypeScript config**: NodeNext module resolution for ES2022
- **Dev tools**: tsx for fast dev, rimraf for clean builds
- **Target ports**: TCP 8080 (JSON-RPC), HTTP 8081 (API)

### Frontend (Next.js 14) Project Setup
- **Next.js version**: 14.2.18 (specific version for reproducibility)
- **React**: ^18.2.0
- **UI Framework**: Ant Design 5.22.0 with @ant-design/nextjs-registry
- **TypeScript config**: Bundler module resolution for Next.js
- **Proxy rewrite**: /api/proxy/* → localhost:3001/api/*

### Key Configuration Decisions
1. Used exact versions for core dependencies (next, fastify) to ensure reproducibility
2. Set proxy rewrite in next.config.mjs for clean API routing
3. Created placeholder .gitkeep files for empty directories
4. TCP communication pattern noted: JSON send/receive with write shutdown (not newline-delimited)

### Directory Structure
```
web_demo/
├── proxy/
│   ├── package.json
│   ├── tsconfig.json
│   └── src/
│       ├── index.ts
│       ├── routes/
│       │   └── health.ts
│       └── services/
│           └── roboplc.ts
└── frontend/
    ├── package.json
    ├── tsconfig.json
    ├── next.config.mjs
    ├── next-env.d.ts
    └── src/
        ├── app/
        │   ├── layout.tsx
        │   └── page.tsx
        ├── components/
        ├── hooks/
        └── lib/
```

## Task 2: TCP Client Implementation - Completed 2026-03-17

### TCP Client for RoboPLC JSON-RPC
- **File**: `proxy/src/services/tcp-client.ts`
- **Module**: `import * as net from 'net'` (NodeNext requires namespace import for net)
- **Protocol**: Write-shutdown pattern (NOT newline-delimited)
  - Client sends JSON, then calls `socket.end()` to signal done sending
  - Server reads until EOF, processes request, sends response
- **Timeouts**: 5s connect, 10s read (configurable)
- **Retry**: 3 attempts with exponential backoff (100ms, 200ms, 400ms)

### Key Implementation Details
1. Each request creates a new socket (no persistent connection)
2. `socket.end()` shuts down write side - critical protocol detail
3. Response accumulated in buffer until `close` event
4. JSON-RPC error responses thrown as `JsonRpcError` class (not retried)
5. Connection/timeout errors trigger retry logic

### Exports
- `TcpClient` class - configurable TCP client
- `JsonRpcError` class - application-level error handling
- `roboplcTcpClient` - pre-configured singleton instance
