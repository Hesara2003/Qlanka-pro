# SCRUM-165 - JMeter Scenario Design (Booking, Polling, WebSocket)

## Goal
Identify realistic user flows for performance testing and define JMeter plan designs for:
- Booking surge
- Queue polling
- WebSocket updates

## Flow 1: Booking Surge
### User behavior model
- Citizens authenticate and attempt bookings in concentrated windows.
- Arrival pattern: ramp to high concurrency over 30-45 seconds.
- Realistic outcomes include successful booking, conflict (duplicate/full), and gateway throttling.

### JMeter design
- Thread Group: `bookingThreads=50`, `bookingRampUp=45`, hold 300s.
- Steps:
1. Login (`POST /api/auth/login`)
2. Think time (1.2s)
3. Booking attempt (`POST /api/appointment/book`)
- Assertion policy: accept `200`, `409`, `429` to reflect real surge behavior.

## Flow 2: Queue Polling
### User behavior model
- Authenticated users repeatedly check queue and booking state.
- Poll interval around 3 seconds; sustained session traffic.

### JMeter design
- Thread Group: `pollingThreads=75`, `pollingRampUp=60`, hold 300s.
- Steps:
1. Login
2. Poll tokens (`GET /api/token/my-tokens`)
3. Poll bookings (`GET /api/appointment/my-bookings`)
4. Wait `pollingIntervalMs` before next poll cycle

## Flow 3: WebSocket Updates
### User behavior model
- Connected users subscribe to center/counter updates while backend actions trigger events.
- Long-lived sessions, connect stability more important than request throughput.

### JMeter design
- Thread Group: `wsThreads=50`, `wsRampUp=30`, hold 300s.
- Steps:
1. Login for JWT
2. Negotiate (`POST /hubs/queue/negotiate`)
3. Open websocket, perform SignalR handshake
4. Join center group (`JoinCenterGroup(centerId)`)
5. Keep connection open for observation window

## Realism Controls
- Dataset-driven credentials and center/counter IDs from CSV.
- Explicit think times and poll intervals.
- Separate profiles for surge vs sustained polling vs long-lived websocket sessions.

## Output Requirements
Each scenario produces a `.jtl` raw result for SCRUM-168/SCRUM-169 analysis.
