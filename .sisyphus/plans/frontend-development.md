# roboplc-middleware Frontend Development Plan

## TL;DR

> **Quick Summary**: Build a complete frontend UI with Fastify proxy service for roboplc-middleware TCP JSON-RPC communication, enabling signal group read/write operations with real-time display and operation history.
> 
> **Deliverables**:
> - Fastify proxy service (web_demo/proxy) - HTTP to TCP JSON-RPC bridge
> - Next.js frontend (web_demo/frontend) - Ant Design UI for device control
> - Complete integration with RustCode middleware (no modifications to RustCode)
> 
> **Estimated Effort**: Medium
> **Parallel Execution**: YES - 4 waves
> **Critical Path**: Proxy Setup → TCP Client → API Routes → Frontend Components → Integration

---

## Context

### Original Request
Build a frontend page for roboplc-middleware that communicates via TCP JSON-RPC commands (read_signal_group, write_signal_group), providing point position setting and sending functionality with a beautiful UI.

### Interview Summary
**Key Discussions**:
- Frontend Framework: Next.js (React) + Ant Design
- Communication: Fastify proxy service bridging HTTP → TCP JSON-RPC
- Features: Real-time data display, point preset management, operation history, device status monitoring
- Deployment: All code in web_demo directory, no modifications to RustCode project
- Testing: Manual testing only

**Research Findings**:
- TCP Protocol: Simple JSON request/response over TCP (not newline-delimited, send JSON then shutdown write)
- Request Format: `{"jsonrpc":"2.0","method":"read_signal_group","params":{...},"id":1}`
- Response Format: `{"jsonrpc":"2.0","result":{...},"id":1}` or error object
- Device: "Test-Dobot", Signal Group: "position_and_euler"
- Fields: x_value, y_value, z_value, rx, ry, rz (all f64)

### Metis Review
**Identified Gaps** (addressed):
- TCP framing: Researched RustCode implementation - uses simple JSON send/receive with write shutdown
- Error handling: Will implement proper HTTP status codes (503 for TCP failure, 400 for validation)
- Input validation: Will validate numeric ranges before sending
- Real-time definition: 5-second polling interval for MVP

---

## Work Objectives

### Core Objective
Create a production-ready frontend interface for roboplc-middleware that allows operators to read/write robot arm position values through an intuitive UI.

### Concrete Deliverables
- `web_demo/proxy/` - Fastify HTTP proxy service (port 3001)
- `web_demo/frontend/` - Next.js application (port 3000)
- API endpoints: GET /api/signals/read, POST /api/signals/write, GET /api/devices/status
- UI Components: Signal values table, write form, operation history, device status

### Definition of Done
- [ ] Proxy successfully connects to RustCode TCP JSON-RPC (port 8080)
- [ ] Frontend displays current signal values in table
- [ ] Frontend can write new position values
- [ ] Operation history shows last 100 operations
- [ ] Error states display user-friendly messages
- [ ] Manual testing confirms all features work

### Must Have
- TCP JSON-RPC communication through proxy
- Read signal group values (x, y, z, rx, ry, rz)
- Write signal group values
- Operation history (in-memory, last 100)
- Device status monitoring
- 5-second auto-refresh for real-time display

### Must NOT Have (Guardrails)
- Database persistence
- WebSocket implementation (polling only for MVP)
- Authentication/authorization system
- Multi-device support (hardcode "Test-Dobot")
- Signal group discovery (hardcode "position_and_euler")
- Any modifications to RustCode project
- Automated test suite (manual testing only)

---

## Verification Strategy (MANDATORY)

> **ZERO HUMAN INTERVENTION** — ALL verification is agent-executed. No exceptions.

### Test Decision
- **Infrastructure exists**: NO (web_demo is empty)
- **Automated tests**: None (manual testing per user requirement)
- **Framework**: N/A

### QA Policy
Every task MUST include agent-executed QA scenarios.
Evidence saved to `.sisyphus/evidence/task-{N}-{scenario-slug}.{ext}`.

- **Proxy API**: Use Bash (curl) — Send requests, assert status + response fields
- **Frontend UI**: Use Playwright (playwright skill) — Navigate, interact, assert DOM, screenshot
- **TCP Communication**: Use Bash (netcat/custom script) — Verify JSON-RPC format

---

## Execution Strategy

### Parallel Execution Waves

```
Wave 1 (Start Immediately — proxy foundation):
├── Task 1: Project scaffolding [quick]
├── Task 2: TCP client implementation [deep]
├── Task 3: Proxy health endpoint [quick]
└── Task 4: Frontend scaffolding [quick]

Wave 2 (After Wave 1 — API routes + UI foundation):
├── Task 5: Read signal endpoint [unspecified-high]
├── Task 6: Write signal endpoint [unspecified-high]
├── Task 7: Device status endpoint [quick]
├── Task 8: Signal values table component [visual-engineering]
└── Task 9: Write form component [visual-engineering]

Wave 3 (After Wave 2 — integration + features):
├── Task 10: Auto-refresh polling hook [quick]
├── Task 11: Operation history component [visual-engineering]
├── Task 12: Device status indicator [visual-engineering]
├── Task 13: Point preset management [unspecified-high]
└── Task 14: Error handling UI [unspecified-high]

Wave 4 (After Wave 3 — final integration):
├── Task 15: Frontend-proxy integration [deep]
├── Task 16: End-to-end manual QA [unspecified-high]
└── Task 17: Documentation [writing]
```

### Dependency Matrix

| Task | Depends On | Blocks |
|------|------------|--------|
| 1 | — | 2, 3, 4 |
| 2 | 1 | 5, 6 |
| 3 | 1 | 16 |
| 4 | 1 | 8, 9 |
| 5 | 2 | 10, 15 |
| 6 | 2 | 13, 15 |
| 7 | 2 | 12 |
| 8 | 4, 5 | 10 |
| 9 | 4, 6 | 13 |
| 10 | 5, 8 | 15 |
| 11 | 5, 6 | 15 |
| 12 | 7 | 15 |
| 13 | 6, 9 | 15 |
| 14 | 5, 6 | 15 |
| 15 | 5, 6, 7, 10, 11, 12, 13, 14 | 16 |
| 16 | 15 | 17 |
| 17 | 16 | — |

### Agent Dispatch Summary

- **Wave 1**: 4 tasks — T1 → `quick`, T2 → `deep`, T3 → `quick`, T4 → `quick`
- **Wave 2**: 5 tasks — T5, T6 → `unspecified-high`, T7 → `quick`, T8, T9 → `visual-engineering`
- **Wave 3**: 5 tasks — T10 → `quick`, T11, T12 → `visual-engineering`, T13, T14 → `unspecified-high`
- **Wave 4**: 3 tasks — T15 → `deep`, T16 → `unspecified-high`, T17 → `writing`

---

## TODOs

- [x] 1. Project Scaffolding

  **What to do**:
  - Create web_demo/proxy directory with Fastify project structure
  - Create web_demo/frontend directory with Next.js 14 project
  - Initialize package.json files with required dependencies
  - Setup TypeScript configuration for both projects

  **Must NOT do**:
  - Do not create any files in RustCode directory
  - Do not install unnecessary dependencies

  **Recommended Agent Profile**:
  - **Category**: `quick`
    - Reason: Standard project initialization, well-defined structure
  - **Skills**: []
    - No special skills needed for scaffolding

  **Parallelization**:
  - **Can Run In Parallel**: NO (foundation task)
  - **Parallel Group**: Wave 1
  - **Blocks**: 2, 3, 4
  - **Blocked By**: None

  **References**:
  - `/home/lipschitz/Documents/Code/RustCode/demo/jsonrpc_client.rs:306-335` - TCP connection pattern
  - `/home/lipschitz/Documents/Code/RustCode/config.toml:1-58` - Device configuration (Test-Dobot, position_and_euler)

  **Acceptance Criteria**:
  - [ ] web_demo/proxy/package.json exists with fastify, typescript dependencies
  - [ ] web_demo/frontend/package.json exists with next, antd dependencies
  - [ ] Both tsconfig.json files configured
  - [ ] Directory structure follows best practices

  **QA Scenarios**:
  ```
  Scenario: Project structure is valid
    Tool: Bash
    Steps:
      1. ls -la web_demo/proxy/package.json
      2. ls -la web_demo/frontend/package.json
      3. cat web_demo/proxy/package.json | grep -E '"fastify"|"typescript"'
      4. cat web_demo/frontend/package.json | grep -E '"next"|"antd"'
    Expected Result: All files exist, dependencies listed
    Evidence: .sisyphus/evidence/task-1-scaffolding.txt
  ```

  **Commit**: YES
  - Message: `feat: initialize project structure`
  - Files: web_demo/proxy/package.json, web_demo/frontend/package.json

- [x] 2. TCP Client Implementation

  **What to do**:
  - Implement TCP client that connects to RustCode JSON-RPC (port 8080)
  - Handle connection lifecycle: connect, send, receive, reconnect
  - Implement JSON-RPC request/response handling
  - Add timeout handling (10s read timeout, 5s connect timeout)
  - Implement request ID tracking for correlation

  **Must NOT do**:
  - Do not modify RustCode
  - Do not add WebSocket support

  **Recommended Agent Profile**:
  - **Category**: `deep`
    - Reason: Core infrastructure with complex connection handling
  - **Skills**: [`systematic-debugging`]
    - `systematic-debugging`: For troubleshooting TCP connection issues

  **Parallelization**:
  - **Can Run In Parallel**: NO
  - **Parallel Group**: Wave 1
  - **Blocks**: 5, 6, 7
  - **Blocked By**: 1

  **References**:
  - `/home/lipschitz/Documents/Code/RustCode/demo/jsonrpc_client.rs:306-335` - TCP connection pattern (connect, write, shutdown, read)
  - `/home/lipschitz/Documents/Code/RustCode/src/workers/rpc/connection.rs:17-63` - Server-side handling (timeout patterns)
  - `/home/lipschitz/Documents/Code/RustCode/src/workers/rpc/types.rs:15-38` - JSON-RPC method format

  **Acceptance Criteria**:
  - [ ] TCP client connects to localhost:8080
  - [ ] Sends JSON-RPC request and receives response
  - [ ] Handles connection failures gracefully
  - [ ] Implements 3-retry reconnection logic

  **QA Scenarios**:
  ```
  Scenario: TCP client connects and sends request
    Tool: Bash (with mock TCP server or actual RustCode running)
    Preconditions: RustCode running on port 8080 OR mock server
    Steps:
      1. Run TCP client test script
      2. Send ping request: {"jsonrpc":"2.0","method":"ping","params":{},"id":1}
      3. Verify response: {"jsonrpc":"2.0","result":{"success":true},"id":1}
    Expected Result: Response received within 2s
    Evidence: .sisyphus/evidence/task-2-tcp-client.txt

  Scenario: TCP connection failure handling
    Tool: Bash
    Preconditions: No server running on port 8080
    Steps:
      1. Attempt to connect
      2. Verify error is caught and reported
      3. Verify retry logic executes
    Expected Result: Error message, 3 retries attempted
    Evidence: .sisyphus/evidence/task-2-tcp-failure.txt
  ```

  **Commit**: YES
  - Message: `feat(proxy): implement TCP JSON-RPC client`
  - Files: web_demo/proxy/src/tcp-client.ts

- [x] 3. Proxy Health Endpoint

  **What to do**:
  - Create Fastify server with health check endpoint
  - Implement GET /health returning TCP connection status
  - Add CORS configuration for frontend
  - Setup basic logging

  **Must NOT do**:
  - Do not expose internal state beyond connection status

  **Recommended Agent Profile**:
  - **Category**: `quick`
    - Reason: Simple endpoint, standard Fastify setup
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES (with Task 2)
  - **Parallel Group**: Wave 1
  - **Blocks**: 16
  - **Blocked By**: 1

  **References**:
  - Fastify documentation patterns
  - Standard health check patterns

  **Acceptance Criteria**:
  - [ ] GET /health returns 200 OK
  - [ ] Response includes tcp_connected boolean
  - [ ] CORS allows localhost:3000

  **QA Scenarios**:
  ```
  Scenario: Health endpoint responds
    Tool: Bash (curl)
    Steps:
      1. curl -s http://localhost:3001/health
    Expected Result: {"status":"ok","tcp_connected":true|false}
    Evidence: .sisyphus/evidence/task-3-health.txt
  ```

  **Commit**: YES
  - Message: `feat(proxy): add health endpoint`
  - Files: web_demo/proxy/src/server.ts, web_demo/proxy/src/routes/health.ts

- [x] 4. Frontend Scaffolding

  **What to do**:
  - Initialize Next.js 14 with App Router
  - Install and configure Ant Design
  - Create basic layout with header and main content area
  - Setup API client configuration

  **Must NOT do**:
  - Do not add authentication
  - Do not add complex routing

  **Recommended Agent Profile**:
  - **Category**: `quick`
    - Reason: Standard Next.js setup with Ant Design
  - **Skills**: [`frontend-ui-ux`]
    - `frontend-ui-ux`: For proper Ant Design integration

  **Parallelization**:
  - **Can Run In Parallel**: YES (with Tasks 2, 3)
  - **Parallel Group**: Wave 1
  - **Blocks**: 8, 9
  - **Blocked By**: 1

  **References**:
  - Ant Design documentation
  - Next.js 14 App Router patterns

  **Acceptance Criteria**:
  - [ ] npm run dev starts dev server on port 3000
  - [ ] Ant Design components render correctly
  - [ ] Basic layout with header visible

  **QA Scenarios**:
  ```
  Scenario: Frontend starts and renders
    Tool: Playwright
    Steps:
      1. Navigate to http://localhost:3000
      2. Wait for page load
      3. Assert header element visible
    Expected Result: Page loads without errors
    Evidence: .sisyphus/evidence/task-4-frontend-init.png
  ```

  **Commit**: YES
  - Message: `feat(frontend): initialize Next.js with Ant Design`
  - Files: web_demo/frontend/src/app/layout.tsx, web_demo/frontend/src/app/page.tsx

- [x] 5. Read Signal Endpoint

  **What to do**:
  - Implement GET /api/signals/read endpoint in proxy
  - Send read_signal_group JSON-RPC to RustCode
  - Parse response and return signal values
  - Handle errors (device not found, timeout, etc.)

  **Must NOT do**:
  - Do not cache responses
  - Do not add database persistence

  **Recommended Agent Profile**:
  - **Category**: `unspecified-high`
    - Reason: API implementation with error handling
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES (with Tasks 6, 7)
  - **Parallel Group**: Wave 2
  - **Blocks**: 10, 15
  - **Blocked By**: 2

  **References**:
  - `/home/lipschitz/Documents/Code/RustCode/src/workers/rpc/types.rs:29-31` - ReadSignalGroup method format
  - `/home/lipschitz/Documents/Code/RustCode/demo/jsonrpc_client.rs:131-155` - Read request example
  - `/home/lipschitz/Documents/Code/RustCode/config.toml:13-58` - Device ID "Test-Dobot", group "position_and_euler"

  **Acceptance Criteria**:
  - [ ] GET /api/signals/read returns HTTP 200 on success
  - [ ] Response includes all 6 fields (x_value, y_value, z_value, rx, ry, rz)
  - [ ] Returns HTTP 503 when TCP connection fails
  - [ ] Response format: {"success":true,"data":{...}}

  **QA Scenarios**:
  ```
  Scenario: Read signal group success
    Tool: Bash (curl)
    Preconditions: RustCode running, device connected
    Steps:
      1. curl -s http://localhost:3001/api/signals/read | jq .
    Expected Result: {"success":true,"data":{"x_value":N,"y_value":N,...}}
    Evidence: .sisyphus/evidence/task-5-read-success.txt

  Scenario: Read signal group TCP failure
    Tool: Bash (curl)
    Preconditions: RustCode not running
    Steps:
      1. curl -s -w "\n%{http_code}" http://localhost:3001/api/signals/read
    Expected Result: HTTP 503, error message
    Evidence: .sisyphus/evidence/task-5-read-failure.txt
  ```

  **Commit**: YES
  - Message: `feat(proxy): add read signal endpoint`
  - Files: web_demo/proxy/src/routes/signals.ts

- [x] 6. Write Signal Endpoint

  **What to do**:
  - Implement POST /api/signals/write endpoint in proxy
  - Validate input: all 6 fields must be valid numbers
  - Send write_signal_group JSON-RPC to RustCode
  - Return success/error response
  - Add operation to history

  **Must NOT do**:
  - Do not write to database
  - Do not validate value ranges beyond type checking

  **Recommended Agent Profile**:
  - **Category**: `unspecified-high`
    - Reason: API implementation with validation and history
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES (with Tasks 5, 7)
  - **Parallel Group**: Wave 2
  - **Blocks**: 13, 15
  - **Blocked By**: 2

  **References**:
  - `/home/lipschitz/Documents/Code/RustCode/src/workers/rpc/types.rs:33-37` - WriteSignalGroup method format
  - `/home/lipschitz/Documents/Code/RustCode/demo/jsonrpc_client.rs:159-192` - Write request example

  **Acceptance Criteria**:
  - [ ] POST /api/signals/write validates all 6 fields
  - [ ] Returns HTTP 400 for invalid input (non-numeric, missing fields)
  - [ ] Returns HTTP 200 on successful write
  - [ ] Operation logged to history

  **QA Scenarios**:
  ```
  Scenario: Write signal group success
    Tool: Bash (curl)
    Preconditions: RustCode running, device connected
    Steps:
      1. curl -s -X POST http://localhost:3001/api/signals/write \
           -H "Content-Type: application/json" \
           -d '{"x_value":100,"y_value":200,"z_value":300,"rx":0,"ry":0,"rz":0}'
    Expected Result: {"success":true}
    Evidence: .sisyphus/evidence/task-6-write-success.txt

  Scenario: Write signal group validation error
    Tool: Bash (curl)
    Steps:
      1. curl -s -X POST http://localhost:3001/api/signals/write \
           -H "Content-Type: application/json" \
           -d '{"x_value":"invalid"}'
    Expected Result: HTTP 400, validation error message
    Evidence: .sisyphus/evidence/task-6-write-validation.txt
  ```

  **Commit**: YES
  - Message: `feat(proxy): add write signal endpoint`
  - Files: web_demo/proxy/src/routes/signals.ts, web_demo/proxy/src/services/history.ts

- [x] 7. Device Status Endpoint

  **What to do**:
  - Implement GET /api/devices/status endpoint
  - Query RustCode HTTP API (port 8081) for device status
  - Return connection status, error count, last communication time

  **Must NOT do**:
  - Do not duplicate HTTP API functionality

  **Recommended Agent Profile**:
  - **Category**: `quick`
    - Reason: Simple proxy to existing HTTP API
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES (with Tasks 5, 6)
  - **Parallel Group**: Wave 2
  - **Blocks**: 12
  - **Blocked By**: 2

  **References**:
  - `/home/lipschitz/Documents/Code/RustCode/src/workers/http_worker.rs:25-63` - HTTP API endpoints
  - `/home/lipschitz/Documents/Code/RustCode/docs/http-api.md:29-40` - Device list response format

  **Acceptance Criteria**:
  - [ ] GET /api/devices/status returns device list
  - [ ] Response includes connected status for each device
  - [ ] Handles HTTP API unavailability gracefully

  **QA Scenarios**:
  ```
  Scenario: Device status retrieved
    Tool: Bash (curl)
    Preconditions: RustCode running with HTTP API on 8081
    Steps:
      1. curl -s http://localhost:3001/api/devices/status | jq .
    Expected Result: {"devices":[{"id":"Test-Dobot","connected":true,...}]}
    Evidence: .sisyphus/evidence/task-7-device-status.txt
  ```

  **Commit**: YES
  - Message: `feat(proxy): add device status endpoint`
  - Files: web_demo/proxy/src/routes/devices.ts

- [x] 8. Signal Values Table Component

  **What to do**:
  - Create React component using Ant Design Table
  - Display all 6 signal fields with values
  - Show last updated timestamp
  - Add loading state during fetch
  - Add refresh button for manual refresh

  **Must NOT do**:
  - Do not add auto-refresh yet (Task 10)
  - Do not add editing functionality

  **Recommended Agent Profile**:
  - **Category**: `visual-engineering`
    - Reason: UI component with Ant Design
  - **Skills**: [`frontend-ui-ux`]
    - `frontend-ui-ux`: For proper Ant Design Table integration

  **Parallelization**:
  - **Can Run In Parallel**: YES (with Tasks 9)
  - **Parallel Group**: Wave 2
  - **Blocks**: 10
  - **Blocked By**: 4

  **References**:
  - `/home/lipschitz/Documents/Code/RustCode/config.toml:30-58` - Signal fields definition

  **Acceptance Criteria**:
  - [ ] Table displays 6 rows for each field
  - [ ] Shows field name, current value, unit
  - [ ] Last updated timestamp visible
  - [ ] Loading spinner during fetch

  **QA Scenarios**:
  ```
  Scenario: Signal values table renders
    Tool: Playwright
    Preconditions: Proxy running, API returning data
    Steps:
      1. Navigate to http://localhost:3000
      2. Wait for table with class "signal-values-table"
      3. Assert 6 data rows visible
      4. Assert timestamp element visible
    Expected Result: Table shows all 6 signal values
    Evidence: .sisyphus/evidence/task-8-signal-table.png
  ```

  **Commit**: YES
  - Message: `feat(frontend): add signal values table`
  - Files: web_demo/frontend/src/components/SignalValuesTable.tsx

- [x] 9. Write Form Component

  **What to do**:
  - Create form with 6 numeric inputs (x, y, z, rx, ry, rz)
  - Add Ant Design Form with validation
  - Add submit button with loading state
  - Display success/error messages after submit
  - Clear form on success

  **Must NOT do**:
  - Do not add preset management yet (Task 13)
  - Do not validate ranges beyond type checking

  **Recommended Agent Profile**:
  - **Category**: `visual-engineering`
    - Reason: UI form with validation
  - **Skills**: [`frontend-ui-ux`]
    - `frontend-ui-ux`: For proper Ant Design Form integration

  **Parallelization**:
  - **Can Run In Parallel**: YES (with Task 8)
  - **Parallel Group**: Wave 2
  - **Blocks**: 13
  - **Blocked By**: 4

  **References**:
  - Ant Design Form documentation
  - Signal fields from config

  **Acceptance Criteria**:
  - [ ] Form has 6 numeric input fields
  - [ ] Validation prevents non-numeric input
  - [ ] Submit button shows loading during request
  - [ ] Success message appears on successful write
  - [ ] Error message appears on failure

  **QA Scenarios**:
  ```
  Scenario: Write form submission success
    Tool: Playwright
    Preconditions: Proxy running, device connected
    Steps:
      1. Navigate to http://localhost:3000
      2. Fill x_value input with "100"
      3. Click "Write" button
      4. Wait for success message
    Expected Result: Success message visible
    Evidence: .sisyphus/evidence/task-9-write-form-success.png

  Scenario: Write form validation
    Tool: Playwright
    Steps:
      1. Navigate to http://localhost:3000
      2. Fill x_value input with "abc"
      3. Assert validation error visible
    Expected Result: "Please input valid number" error
    Evidence: .sisyphus/evidence/task-9-write-form-validation.png
  ```

**Commit**: YES
  - Message: `feat(frontend): add write form`
  - Files: web_demo/frontend/src/components/WriteForm.tsx

- [x] 10. Auto-Refresh Polling Hook

  **What to do**:
  - Create custom React hook for polling signal values
  - Implement 5-second interval polling
  - Add pause/resume functionality
  - Handle cleanup on unmount
  - Show connection status indicator

  **Must NOT do**:
  - Do not use WebSocket
  - Do not poll faster than 5 seconds

  **Recommended Agent Profile**:
  - **Category**: `quick`
    - Reason: Standard React hook implementation
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES (with Tasks 11, 12, 13, 14)
  - **Parallel Group**: Wave 3
  - **Blocks**: 15
  - **Blocked By**: 5, 8

  **References**:
  - React useEffect cleanup patterns
  - Polling best practices

  **Acceptance Criteria**:
  - [ ] Polls every 5 seconds when active
  - [ ] Updates signal values in table
  - [ ] Shows "refreshing" indicator during fetch
  - [ ] Stops polling on unmount

  **QA Scenarios**:
  ```
  Scenario: Auto-refresh updates values
    Tool: Playwright
    Preconditions: Device values changing
    Steps:
      1. Navigate to page
      2. Note initial x_value
      3. Wait 6 seconds
      4. Assert timestamp updated
    Expected Result: Timestamp changes within 6s
    Evidence: .sisyphus/evidence/task-10-auto-refresh.png
  ```

  **Commit**: YES
  - Message: `feat(frontend): add auto-refresh polling`
  - Files: web_demo/frontend/src/hooks/useSignalPolling.ts

- [x] 11. Operation History Component

  **What to do**:
  - Create component to display operation history
  - Show list of last 100 operations (in-memory)
  - Display: timestamp, operation type, values, status
  - Add clear history button
  - Use Ant Design Timeline or List

  **Must NOT do**:
  - Do not persist to database
  - Do not add search/filter functionality

  **Recommended Agent Profile**:
  - **Category**: `visual-engineering`
    - Reason: UI component with Ant Design
  - **Skills**: [`frontend-ui-ux`]
    - `frontend-ui-ux`: For proper Ant Design List/Timeline integration

  **Parallelization**:
  - **Can Run In Parallel**: YES (with Tasks 10, 12, 13, 14)
  - **Parallel Group**: Wave 3
  - **Blocks**: 15
  - **Blocked By**: 5, 6

  **References**:
  - Ant Design List/Timeline documentation

  **Acceptance Criteria**:
  - [ ] Shows chronological list of operations
  - [ ] Each entry shows timestamp, type (read/write), values
  - [ ] Clear button removes all history
  - [ ] Limits to 100 entries (oldest removed)

  **QA Scenarios**:
  ```
  Scenario: Operation history shows writes
    Tool: Playwright
    Preconditions: Several write operations performed
    Steps:
      1. Navigate to page
      2. Perform write operation
      3. Scroll to history section
      4. Assert new entry visible at top
    Expected Result: History shows recent operation
    Evidence: .sisyphus/evidence/task-11-history.png
  ```

  **Commit**: YES
  - Message: `feat(frontend): add operation history`
  - Files: web_demo/frontend/src/components/OperationHistory.tsx, web_demo/frontend/src/hooks/useOperationHistory.ts

- [x] 12. Device Status Indicator

  **What to do**:
  - Create component showing device connection status
  - Display: device ID, connection state (green/red dot), error count
  - Show last communication time
  - Auto-update from /api/devices/status

  **Must NOT do**:
  - Do not add device management features

  **Recommended Agent Profile**:
  - **Category**: `visual-engineering`
    - Reason: UI component with status visualization
  - **Skills**: [`frontend-ui-ux`]
    - `frontend-ui-ux`: For proper status indicator design

  **Parallelization**:
  - **Can Run In Parallel**: YES (with Tasks 10, 11, 13, 14)
  - **Parallel Group**: Wave 3
  - **Blocks**: 15
  - **Blocked By**: 7

  **References**:
  - `/home/lipschitz/Documents/Code/RustCode/docs/http-api.md:26-55` - Device status response format

  **Acceptance Criteria**:
  - [ ] Shows device name "Test-Dobot"
  - [ ] Green dot when connected, red when disconnected
  - [ ] Shows error count
  - [ ] Shows last communication time

  **QA Scenarios**:
  ```
  Scenario: Status indicator shows connected
    Tool: Playwright
    Preconditions: Device connected
    Steps:
      1. Navigate to page
      2. Assert green status dot visible
      3. Assert "Connected" text visible
    Expected Result: Green indicator with "Connected"
    Evidence: .sisyphus/evidence/task-12-status-connected.png
  ```

  **Commit**: YES
  - Message: `feat(frontend): add device status indicator`
  - Files: web_demo/frontend/src/components/DeviceStatus.tsx

- [x] 13. Point Preset Management

  **What to do**:
  - Create component for saving/loading point presets
  - Add "Save Current" button to save current values as preset
  - Show list of saved presets with names
  - Add "Load" button for each preset
  - Store presets in localStorage

  **Must NOT do**:
  - Do not store in database
  - Do not add preset editing (delete and recreate)

  **Recommended Agent Profile**:
  - **Category**: `unspecified-high`
    - Reason: State management with localStorage
  - **Skills**: [`frontend-ui-ux`]
    - `frontend-ui-ux`: For proper UI design

  **Parallelization**:
  - **Can Run In Parallel**: YES (with Tasks 10, 11, 12, 14)
  - **Parallel Group**: Wave 3
  - **Blocks**: 15
  - **Blocked By**: 6, 9

  **References**:
  - localStorage API
  - Ant Design Dropdown/Menu for preset selection

  **Acceptance Criteria**:
  - [ ] "Save Preset" button opens name input dialog
  - [ ] Presets persist in localStorage
  - [ ] Preset list shows all saved presets
  - [ ] "Load" fills write form with preset values
  - [ ] "Delete" removes preset

  **QA Scenarios**:
  ```
  Scenario: Save and load preset
    Tool: Playwright
    Steps:
      1. Navigate to page
      2. Fill write form with values
      3. Click "Save Preset"
      4. Enter name "Test Position 1"
      5. Clear write form
      6. Click preset "Test Position 1"
      7. Click "Load"
    Expected Result: Form filled with saved values
    Evidence: .sisyphus/evidence/task-13-preset.png
  ```

  **Commit**: YES
  - Message: `feat(frontend): add point preset management`
  - Files: web_demo/frontend/src/components/PointPresets.tsx, web_demo/frontend/src/hooks/usePresets.ts

- [x] 14. Error Handling UI

  **What to do**:
  - Add global error boundary for React errors
  - Create error toast/notification for API errors
  - Add "Disconnected" banner when TCP connection fails
  - Show retry button for failed operations
  - Disable write form when device disconnected

  **Must NOT do**:
  - Do not add error logging to external service

  **Recommended Agent Profile**:
  - **Category**: `unspecified-high`
    - Reason: Error handling across multiple components
  - **Skills**: [`frontend-ui-ux`]
    - `frontend-ui-ux`: For proper error UI design

  **Parallelization**:
  - **Can Run In Parallel**: YES (with Tasks 10, 11, 12, 13)
  - **Parallel Group**: Wave 3
  - **Blocks**: 15
  - **Blocked By**: 5, 6

  **References**:
  - Ant Design Message/Notification for toasts
  - React Error Boundary patterns

  **Acceptance Criteria**:
  - [ ] Disconnected banner shows when TCP fails
  - [ ] Error toasts show for API errors
  - [ ] Write form disabled when disconnected
  - [ ] Retry button available for failed operations

  **QA Scenarios**:
  ```
  Scenario: Disconnected banner shows
    Tool: Playwright
    Preconditions: RustCode not running
    Steps:
      1. Start frontend without backend
      2. Navigate to page
      3. Assert "Disconnected" banner visible
      4. Assert write form disabled
    Expected Result: Banner visible, form disabled
    Evidence: .sisyphus/evidence/task-14-error-ui.png
  ```

  **Commit**: YES
  - Message: `feat(frontend): add error handling UI`
  - Files: web_demo/frontend/src/components/ErrorBanner.tsx, web_demo/frontend/src/components/ErrorBoundary.tsx

- [x] 15. Frontend-Proxy Integration

  **What to do**:
  - Configure frontend to use proxy API
  - Ensure CORS working correctly
  - Test all API endpoints from frontend
  - Verify data flow: frontend → proxy → TCP → RustCode
  - Test error scenarios end-to-end

  **Must NOT do**:
  - Do not hardcode URLs (use environment variables)

  **Recommended Agent Profile**:
  - **Category**: `deep`
    - Reason: Integration across multiple systems
  - **Skills**: [`systematic-debugging`]
    - `systematic-debugging`: For troubleshooting integration issues

  **Parallelization**:
  - **Can Run In Parallel**: NO
  - **Parallel Group**: Wave 4
  - **Blocks**: 16
  - **Blocked By**: 5, 6, 7, 10, 11, 12, 13, 14

  **References**:
  - All previous tasks' API contracts

  **Acceptance Criteria**:
  - [ ] Frontend reads signals successfully
  - [ ] Frontend writes signals successfully
  - [ ] Device status updates correctly
  - [ ] Error messages display correctly
  - [ ] All features work together

  **QA Scenarios**:
  ```
  Scenario: Full read-write cycle
    Tool: Playwright
    Preconditions: All services running
    Steps:
      1. Navigate to http://localhost:3000
      2. Note current signal values
      3. Enter new values in write form
      4. Click "Write"
      5. Wait for success message
      6. Wait for auto-refresh (5s)
      7. Assert values updated in table
    Expected Result: Table shows new values
    Evidence: .sisyphus/evidence/task-15-integration.png
  ```

  **Commit**: YES
  - Message: `feat: integrate frontend with proxy`
  - Files: web_demo/frontend/src/lib/api.ts, web_demo/frontend/.env.local

- [x] 16. End-to-End Manual QA

  **What to do**:
  - Start all services (RustCode, proxy, frontend)
  - Test all user scenarios manually
  - Verify all features work as expected
  - Test error scenarios
  - Capture evidence screenshots

  **Must NOT do**:
  - Do not skip any test scenarios

  **Recommended Agent Profile**:
  - **Category**: `unspecified-high`
    - Reason: Comprehensive testing required
  - **Skills**: [`playwright`]
    - `playwright`: For UI testing and screenshots

  **Parallelization**:
  - **Can Run In Parallel**: NO
  - **Parallel Group**: Wave 4
  - **Blocks**: 17
  - **Blocked By**: 15

  **References**:
  - All acceptance criteria from previous tasks

  **Acceptance Criteria**:
  - [ ] All happy path scenarios pass
  - [ ] All error scenarios handled gracefully
  - [ ] UI responsive and intuitive
  - [ ] No console errors

  **QA Scenarios**:
  ```
  Scenario: Complete user journey
    Tool: Playwright + Manual
    Steps:
      1. Start all services
      2. Open browser to http://localhost:3000
      3. Verify signal values displayed
      4. Save current values as preset
      5. Write new values
      6. Verify history updated
      7. Load preset
      8. Disconnect RustCode, verify error handling
      9. Reconnect, verify recovery
    Expected Result: All steps complete successfully
    Evidence: .sisyphus/evidence/task-16-e2e/
  ```

  **Commit**: NO (testing only)

- [x] 17. Documentation

  **What to do**:
  - Create README.md with setup instructions
  - Document environment variables
  - Document API endpoints
  - Add usage examples
  - Document architecture

  **Must NOT do**:
  - Do not include sensitive information

  **Recommended Agent Profile**:
  - **Category**: `writing`
    - Reason: Documentation writing
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: NO
  - **Parallel Group**: Wave 4
  - **Blocks**: None
  - **Blocked By**: 16

  **References**:
  - All project files and configurations

  **Acceptance Criteria**:
  - [ ] README.md exists with setup instructions
  - [ ] API documentation complete
  - [ ] Architecture diagram included
  - [ ] Usage examples clear

  **QA Scenarios**:
  ```
  Scenario: Documentation is complete
    Tool: Bash
    Steps:
      1. cat web_demo/README.md
      2. Verify setup instructions present
      3. Verify API endpoints documented
    Expected Result: README contains all required sections
    Evidence: .sisyphus/evidence/task-17-docs.txt
  ```

  **Commit**: YES
  - Message: `docs: add README and documentation`
  - Files: web_demo/README.md, web_demo/docs/API.md

---

## Final Verification Wave

- [x] F1. **Proxy Health Check**
  ```bash
  curl -s http://localhost:3001/health | jq .
  # Expected: {"status":"ok","tcp_connected":true}
  ```

- [x] F2. **Read Signal Group**
  ```bash
  curl -s http://localhost:3001/api/signals/read | jq .
  # Expected: {"success":true,"data":{"x_value":...,"y_value":...,...}}
  ```

- [x] F3. **Write Signal Group**
  ```bash
  curl -s -X POST http://localhost:3001/api/signals/write \
    -H "Content-Type: application/json" \
    -d '{"x_value":100,"y_value":200,"z_value":300,"rx":0,"ry":0,"rz":0}' | jq .
  # Expected: {"success":true}
  ```

- [x] F4. **Frontend Load**
  - Playwright: Navigate to http://localhost:3000
  - Assert: Table with class "signal-values" visible
  - Assert: All 6 field values displayed
  - Screenshot: `.sisyphus/evidence/final-frontend.png`

---

## Commit Strategy

- **Commit 1**: `feat(proxy): initialize project structure` — package.json, tsconfig.json
- **Commit 2**: `feat(proxy): implement TCP client` — tcp-client.ts
- **Commit 3**: `feat(proxy): add API routes` — routes/*.ts
- **Commit 4**: `feat(frontend): initialize Next.js project` — package.json, layout
- **Commit 5**: `feat(frontend): add signal components` — components/*.tsx
- **Commit 6**: `feat(frontend): add operation history` — history component
- **Commit 7**: `docs: add README` — setup instructions

---

## Success Criteria

### Verification Commands
```bash
# Proxy health
curl http://localhost:3001/health

# Read signals
curl http://localhost:3001/api/signals/read

# Write signals
curl -X POST http://localhost:3001/api/signals/write \
  -H "Content-Type: application/json" \
  -d '{"x_value":353.0445,"y_value":174.1174,"z_value":335.9194,"rx":-177.8,"ry":-5.13,"rz":-45.8}'
```

### Final Checklist
- [ ] Proxy connects to RustCode TCP JSON-RPC (port 8080)
- [ ] GET /api/signals/read returns signal values
- [ ] POST /api/signals/write updates device
- [ ] Frontend displays values in Ant Design Table
- [ ] Write form validates and submits values
- [ ] Operation history shows last 100 operations
- [ ] Device status indicator shows connection state
- [ ] Error messages display when TCP connection fails
- [ ] Auto-refresh updates values every 5 seconds
- [ ] No modifications to RustCode project