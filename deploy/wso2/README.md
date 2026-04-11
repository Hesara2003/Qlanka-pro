# Qlanka-Pro WSO2 Integration Guide

This document reflects the current implementation in this repository for both:

- WSO2 Identity Server (authentication + user provisioning)
- WSO2 API Manager (API publishing/governance artifacts)

Current environment values in code and docs point to:

- Base URL: https://20.193.250.12:9443
- Carbon console: https://20.193.250.12:9443/carbon
- Publisher: https://20.193.250.12:9443/publisher/
- Dev Portal: https://20.193.250.12:9443/devportal/
- Admin Portal: https://20.193.250.12:9443/admin/

## 1. What The Codebase Currently Does

### 1.1 Authentication mode

All backend services run a dual JWT strategy:

- `DynamicJwt` policy chooses `Wso2Jwt` or `LocalJwt`
- WSO2 token detection uses issuer and token payload hints (for example `azp`)
- If `Wso2:Enabled=false`, services fall back to local symmetric JWT validation

Services using this pattern:

- QueueLanka.Gateway
- QueueLanka.Identity
- QueueLanka.Queue
- QueueLanka.ServiceCenter

### 1.2 Login flow

Identity login endpoint: `POST /api/auth/login`

Runtime flow in Identity service:

1. Validate local user/password in MySQL (BCrypt)
2. Exchange credentials with WSO2 at `POST /oauth2/token` using ROPC
3. Return WSO2 `access_token` and `refresh_token` to frontend
4. Return `counterId` for officers from queue database lookup

### 1.3 Registration and SCIM2 provisioning

Identity registration endpoint: `POST /api/auth/register`

Runtime behavior:

1. Create user in local identity MySQL
2. Call WSO2 SCIM2 `POST /scim2/Users`
3. Assign role via SCIM `groups` (`citizen`, `officer`, `admin`)
4. If role is officer and `centerId` exists, send custom schema payload:
   `urn:scim:wso2:qlanka:1.0` with `centerId`
5. SCIM2 failures are logged and treated as non-fatal (manual sync may be required)

### 1.4 Frontend token/claim handling

Frontend auth context is WSO2-aware:

- Handles role claims from `roles`, `role`, and legacy .NET claim URI
- Filters WSO2 internal roles and keeps app roles (`citizen|officer|admin`)
- Does not depend on WSO2 token for `centerId`; uses login API response value

## 2. WSO2 Identity Server Setup

### 2.1 Create Service Provider

Create a service provider (for example `QlankaBackend`) and configure OAuth2/OIDC:

- Enable grant types:
  - Resource Owner Password (ROPC)
  - Refresh Token
- Save generated `Client ID` and `Client Secret`

Use those in Identity configuration:

- `Wso2:ClientId`
- `Wso2:ClientSecret`

### 2.2 Required groups/roles

Create groups in WSO2 matching application roles exactly:

- `citizen`
- `officer`
- `admin`

Identity SCIM provisioning sends these as SCIM group values.

### 2.3 Role claim in access token

Backend authorization policies expect role claims. Ensure tokens include role claim mapping.

Recommended:

- Include `http://wso2.org/claims/role` in the OIDC scope/claim mapping for the service provider
- Keep subject claim stable (commonly username)

### 2.4 Optional custom officer claim schema

If you want `centerId` stored in WSO2 user attributes as well, define corresponding extension schema support for:

- `urn:scim:wso2:qlanka:1.0`
- attribute: `centerId`

Note: the current frontend logic does not require `centerId` in WSO2 token; it uses API response data.

## 3. API Manager Integration In Repo

The repository includes an APIM import-ready OpenAPI contract:

- `officer-api.yaml`

Notable WSO2 extensions in that file:

- `x-wso2-application-security`
- `x-wso2-production-endpoints`
- `x-wso2-sandbox-endpoints`
- `x-wso2-basePath: /officer/v1`
- OAuth2 security scheme with authorization URL under current IS host

This file is the source artifact for publishing officer-facing API surfaces in APIM.

## 4. Configuration Matrix (From Current Code)

### 4.1 Common WSO2 keys (all auth-validating services)

| Key | Purpose |
|---|---|
| `Wso2:Enabled` | Enable WSO2 token validation path |
| `Wso2:Authority` | OIDC authority for metadata/JWKS discovery |
| `Wso2:ValidIssuer` | Expected `iss` claim |
| `Wso2:Audience` | Expected audience (`aud`) |
| `Wso2:RequireHttpsMetadata` | Enforce HTTPS metadata retrieval |
| `Wso2:AllowInvalidCertificate` | Dev-only bypass for self-signed certs |

### 4.2 Identity-only keys (ROPC + SCIM2 client)

| Key | Purpose |
|---|---|
| `Wso2:ClientId` | OAuth2 client id for token exchange |
| `Wso2:ClientSecret` | OAuth2 client secret for token exchange |
| `Wso2:BaseUrl` | Base URL used for `/oauth2/token` and `/scim2/Users` calls |
| `Wso2:AdminUsername` | Basic auth user for SCIM2 provisioning |
| `Wso2:AdminPassword` | Basic auth password for SCIM2 provisioning |

### 4.3 Environment variable equivalents

Use ASP.NET double underscore mapping:

- `Wso2__Enabled`
- `Wso2__Authority`
- `Wso2__ValidIssuer`
- `Wso2__Audience`
- `Wso2__RequireHttpsMetadata`
- `Wso2__AllowInvalidCertificate`
- `Wso2__ClientId`
- `Wso2__ClientSecret`
- `Wso2__BaseUrl`
- `Wso2__AdminUsername`
- `Wso2__AdminPassword`

## 5. Known Runtime Values In This Repo

Current appsettings files include:

- `Audience`: `bOhc0ENWBPxvw_sXu8fxHv_Rz2Aa`
- `ValidIssuer`: `https://20.193.250.12:9443/oauth2/token`

Authority currently appears in two forms in config:

- Base host form: `https://20.193.250.12:9443`
- Token-path form: `https://20.193.250.12:9443/oauth2/token`

Keep this consistent per environment to avoid metadata/issuer mismatches.

## 6. Smoke Tests You Can Run

### 6.1 ROPC test

```bash
curl -X POST "https://20.193.250.12:9443/oauth2/token" \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "grant_type=password&username=<username>&password=<password>&scope=openid profile&client_id=<client_id>&client_secret=<client_secret>"
```

### 6.2 SCIM2 create user test

```bash
curl -X POST "https://20.193.250.12:9443/scim2/Users" \
  -H "Authorization: Basic <base64(admin:password)>" \
  -H "Content-Type: application/json" \
  -d '{
    "schemas": ["urn:ietf:params:scim:schemas:core:2.0:User"],
    "userName": "testcitizen",
    "password": "Test@1234",
    "emails": [{"value": "test@example.com", "primary": true}],
    "groups": [{"display": "citizen", "value": "citizen"}]
  }'
```

### 6.3 Service-level login test

```bash
curl -X POST "http://localhost:5001/api/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"username":"<username>","password":"<password>"}'
```

## 7. Troubleshooting

### 7.1 `WSO2_UNAVAILABLE` from Identity

Meaning: Identity service cannot reach WSO2 token endpoint.

Check:

- `Wso2:BaseUrl` reachability
- TLS certificate validity
- `Wso2:AllowInvalidCertificate` only for non-production self-signed setups

### 7.2 `401/400` during login with valid local user

Meaning: local password passed but WSO2 ROPC rejected credentials/client.

Check:

- WSO2 user exists (or SCIM sync completed)
- ROPC grant enabled for service provider
- `Wso2:ClientId` / `Wso2:ClientSecret`

### 7.3 Token accepted by one service and rejected by another

Check consistency of these keys across Gateway, Identity, Queue, ServiceCenter:

- `Wso2:Authority`
- `Wso2:ValidIssuer`
- `Wso2:Audience`
- `Wso2:RequireHttpsMetadata`

## 8. Security Notes

- Never commit real values for `Wso2:ClientSecret` or `Wso2:AdminPassword`
- Store secrets in environment/secret stores (Key Vault, Container Apps secrets, etc.)
- Rotate any credentials that were ever committed to source history
- Keep `AllowInvalidCertificate=false` in production
