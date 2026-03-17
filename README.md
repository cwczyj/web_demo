# RoboPLC Middleware Frontend

A modern web interface for controlling and monitoring RoboPLC devices via JSON-RPC over TCP.

## Architecture

```
┌─────────────────┐    HTTP     ┌─────────────────┐    TCP      ┌─────────────────┐
│   Next.js UI    │ ─────────>  │  Fastify Proxy  │ ─────────>  │  RustCode RPC   │
│   (Port 3000)   │             │   (Port 3001)   │             │   (Port 8080)   │
│   Ant Design    │             │                 │             │                 │
└─────────────────┘             └─────────────────┘             └─────────────────┘
                                        │
                                        │ HTTP
                                        ▼
                                ┌─────────────────┐
                                │ RustCode HTTP   │
                                │   (Port 8081)   │
                                │ Device Status   │
                                └─────────────────┘
```

## Features

- **Signal Values Display**: Real-time display of position and euler values (x, y, z, rx, ry, rz)
- **Write Operations**: Send position values to the robot arm
- **Operation History**: Track all read/write operations (last 100)
- **Point Presets**: Save and load position presets (localStorage)
- **Device Status**: Monitor device connection status
- **Auto-Refresh**: 5-second polling for real-time updates
- **Error Handling**: Connection status banner and error messages

## Prerequisites

- Node.js 18+
- RustCode middleware running on:
  - TCP JSON-RPC: port 8080
  - HTTP API: port 8081

## Quick Start

### 1. Install Dependencies

```bash
# Proxy
cd proxy
npm install

# Frontend
cd ../frontend
npm install
```

### 2. Start the Proxy Server

```bash
cd proxy
npm run dev
```

The proxy will start on port 3001.

### 3. Start the Frontend

```bash
cd frontend
npm run dev
```

The frontend will start on port 3000.

### 4. Open in Browser

Navigate to http://localhost:3000

## API Endpoints

### Proxy Server (Port 3001)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /api/health | Health check with TCP status |
| GET | /api/signals/read | Read current signal values |
| POST | /api/signals/write | Write signal values |
| GET | /api/signals/history | Get operation history |
| DELETE | /api/signals/history | Clear operation history |
| GET | /api/devices/status | Get device connection status |

### Example Requests

**Read Signal Values:**
```bash
curl http://localhost:3001/api/signals/read
```

**Write Signal Values:**
```bash
curl -X POST http://localhost:3001/api/signals/write \
  -H "Content-Type: application/json" \
  -d '{"x_value":100,"y_value":200,"z_value":300,"rx":0,"ry":0,"rz":0}'
```

## Configuration

### Environment Variables

**Proxy (.env):**
```
PORT=3001
TCP_HOST=localhost
TCP_PORT=8080
RUSTCODE_HTTP_URL=http://localhost:8081
```

**Frontend (.env.local):**
```
NEXT_PUBLIC_PROXY_URL=http://localhost:3001
```

## Project Structure

```
web_demo/
├── proxy/                    # Fastify proxy service
│   ├── src/
│   │   ├── index.ts         # Server entry point
│   │   ├── routes/
│   │   │   ├── health.ts    # Health endpoints
│   │   │   ├── signals.ts   # Signal read/write/history
│   │   │   └── devices.ts   # Device status
│   │   └── services/
│   │       ├── tcp-client.ts   # TCP JSON-RPC client
│   │       └── history.ts      # Operation history
│   ├── package.json
│   └── tsconfig.json
│
├── frontend/                 # Next.js application
│   ├── src/
│   │   ├── app/
│   │   │   ├── layout.tsx   # Root layout with Ant Design
│   │   │   └── page.tsx     # Main dashboard page
│   │   ├── components/
│   │   │   ├── SignalValuesTable.tsx
│   │   │   ├── WriteForm.tsx
│   │   │   ├── OperationHistory.tsx
│   │   │   ├── DeviceStatus.tsx
│   │   │   ├── PointPresets.tsx
│   │   │   └── ErrorBanner.tsx
│   │   └── hooks/
│   │       ├── useSignalValues.ts
│   │       ├── usePolling.ts
│   │       ├── useDeviceStatus.ts
│   │       ├── useOperationHistory.ts
│   │       └── usePresets.ts
│   ├── package.json
│   ├── tsconfig.json
│   └── next.config.mjs
│
└── README.md
```

## Signal Fields

| Field | Description | Unit | Type |
|-------|-------------|------|------|
| x_value | X Position | mm | f64 |
| y_value | Y Position | mm | f64 |
| z_value | Z Position | mm | f64 |
| rx | Rotation X | ° | f64 |
| ry | Rotation Y | ° | f64 |
| rz | Rotation Z | ° | f64 |

## JSON-RPC Protocol

The proxy communicates with RustCode via TCP JSON-RPC:

**Request Format:**
```json
{
  "jsonrpc": "2.0",
  "method": "read_signal_group",
  "params": {
    "device_id": "Test-Dobot",
    "group_name": "position_and_euler"
  },
  "id": 1
}
```

**Response Format:**
```json
{
  "jsonrpc": "2.0",
  "result": {
    "success": true,
    "data": {
      "x_value": 353.0445,
      "y_value": 174.1174,
      "z_value": 335.9194,
      "rx": -177.8,
      "ry": -5.13,
      "rz": -45.8
    }
  },
  "id": 1
}
```

## Troubleshooting

### Connection Issues

1. Verify RustCode is running on ports 8080 (TCP) and 8081 (HTTP)
2. Check proxy logs: `npm run dev` shows connection status
3. Use health endpoint: `curl http://localhost:3001/api/health`

### Build Errors

```bash
# Clean and rebuild
cd proxy && npm run clean && npm run build
cd ../frontend && rm -rf .next && npm run build
```

## License

MIT