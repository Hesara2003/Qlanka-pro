# Gateway Security Policies and Configuration Guide

This guide documents the implemented gateway authentication and rate limiting policies, their current configuration, and how to maintain them safely.

## Scope and source of truth

Primary implementation files:

- `backend/QueueLanka.Gateway/Program.cs`
- `backend/QueueLanka.Gateway/appsettings.json`
- `backend/QueueLanka.Gateway/appsettings.Development.json`

Gateway routing and route-level policy overrides are defined in the `ReverseProxy` section of gateway appsettings.

## Implemented authentication policies

### 1. JWT bearer authentication

The gateway uses JWT bearer authentication with these validation settings:

- Validate issuer: enabled
- Validate audience: enabled
- Validate token lifetime: enabled
- Validate issuer signing key: enabled
- Clock skew: zero (`TimeSpan.Zero`)

Configuration keys:

- `Jwt:Secret` (must be at least 32 bytes)
- `Jwt:Issuer` (default fallback: `queuelanka-api`)
- `Jwt:Audience` (default fallback: `queuelanka-client`)

Important behavior:

- If `Jwt:Secret` is missing, the gateway logs a warning and uses a temporary fallback key to avoid startup failure.
- If the effective secret is shorter than 32 bytes, startup fails with `InvalidOperationException`.

Production recommendation:

- Always provide `Jwt__Secret` via environment/secret store.
- Treat fallback key usage as misconfiguration and correct immediately.

### 2. Default authorization policy

The gateway uses a fallback authorization policy controlled by:

- `GatewayPolicies:Authentication:RequireAuthenticatedUserByDefault`

Current default value is `true`, which means:

- All proxied routes require authenticated users by default unless explicitly overridden.

### 3. Public route exception

The identity authentication route is intentionally public in reverse-proxy configuration:

- Route id: `identity-route`
- Path: `/api/auth/{**catch-all}`
- Override: `AuthorizationPolicy: public-access`

The `public-access` policy is defined in code and allows all requests.

### 4. Anonymous health and metrics endpoints

Gateway-local endpoints mapped in code are anonymous:

- `/`
- `/health`
- `/metrics`

## Implemented rate limiting policies

### 1. Global limiter shape

A global partitioned rate limiter is configured, but enforcement is applied only to the booking endpoint.

### 2. Endpoint currently limited

Rate limiting applies only when both conditions match exactly:

- Method equals configured booking method (default `POST`)
- Path equals configured booking path (default `/api/appointment/book`)

All other requests use `NoLimiter` and are not throttled by this policy.

### 3. Partition key and client identification

For booking requests, the limiter key is derived per client IP using this precedence:

1. First IP in `X-Forwarded-For`
2. `X-Real-IP`
3. Connection remote IP
4. Fallback `unknown-ip`

Partition key format:

- `booking:{clientIp}`

### 4. Limiter algorithm and defaults

Current algorithm is fixed-window with:

- `PermitLimit`: 5
- `WindowMinutes`: 1
- `QueueLimit`: 0
- `AutoReplenishment`: true
- Rejection status code: 429

Configuration keys:

- `GatewayPolicies:RateLimiting:Booking:Method`
- `GatewayPolicies:RateLimiting:Booking:Path`
- `GatewayPolicies:RateLimiting:Booking:PermitLimit`
- `GatewayPolicies:RateLimiting:Booking:WindowMinutes`
- `GatewayPolicies:RateLimiting:Booking:RejectionStatusCode`

## Configuration details

### Appsettings defaults

Both gateway appsettings files currently define:

- `GatewayPolicies:Authentication:RequireAuthenticatedUserByDefault = true`
- Booking rate limit of 5 requests per 1 minute with 429 rejection

### Environment variable mapping

Use double underscore (`__`) for nested keys in environment variables.

Examples:

- `Jwt__Secret`
- `Jwt__Issuer`
- `Jwt__Audience`
- `GatewayPolicies__Authentication__RequireAuthenticatedUserByDefault`
- `GatewayPolicies__RateLimiting__Booking__PermitLimit`
- `GatewayPolicies__RateLimiting__Booking__WindowMinutes`

### Forwarded headers and proxy trust

Because the rate limiter relies on forwarded IP headers, ensure trusted proxy configuration is correct:

- `ForwardedHeaders:TrustedProxies`

Incorrect trust settings can cause inaccurate client-IP partitioning and ineffective throttling.

## Maintenance instructions

### A. Maintaining authentication policy

1. Keep `RequireAuthenticatedUserByDefault` set to `true` unless there is a documented exception.
2. For any new public endpoint, add an explicit allow policy instead of weakening global defaults.
3. When adding a new route to `ReverseProxy:Routes`, decide and document whether it is public or protected.
4. Validate JWT issuer/audience/secret values in each environment before deployment.
5. Monitor startup logs for JWT fallback warning and treat it as an operational incident.

### B. Maintaining rate limiting policy

1. Confirm whether new high-risk endpoints need throttling.
2. If you need to throttle additional endpoints, extend limiter matching logic in gateway code.
3. Tune permit/window values based on observed traffic and abuse patterns.
4. Keep rejection status code as 429 unless a specific integration requires otherwise.
5. Validate behavior behind your real proxy chain so client IP extraction is correct.

### C. Safe change procedure

1. Update configuration in appsettings and/or environment variables.
2. If behavior changes are required, update `Program.cs` accordingly.
3. Deploy to a non-production environment.
4. Verify:
   - Protected routes reject missing/invalid JWT with 401.
   - Public auth route remains reachable without JWT.
   - Booking endpoint returns 429 when request rate exceeds threshold.
5. Roll out to production with release notes that include policy deltas.

## Verification checklist

Authentication checks:

- Call a protected route without token -> expect 401.
- Call `/api/auth/login` without token -> route remains accessible.
- Call protected route with invalid/expired token -> expect 401.

Rate limiting checks:

- Send more than 5 `POST /api/appointment/book` requests from same client IP within 1 minute -> expect 429 on excess requests.
- Call non-booking endpoints at similar rate -> no gateway throttling from this policy.

Operational checks:

- Confirm no JWT fallback warning in production logs.
- Confirm forwarded header trust list matches deployed ingress/proxy topology.

## Quick reference

- Authentication and authorization wiring: `backend/QueueLanka.Gateway/Program.cs`
- Rate limiter logic: `backend/QueueLanka.Gateway/Program.cs`
- Default policy values: `backend/QueueLanka.Gateway/appsettings.json`
- Development overrides: `backend/QueueLanka.Gateway/appsettings.Development.json`
