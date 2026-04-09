# WSO2 Identity Server — Qlanka-Pro Setup Guide

WSO2 IS is deployed on Azure at `https://20.193.250.12:9443`.  
Admin console: `https://20.193.250.12:9443/carbon`

---

## 1. Initial Login

```
URL:      https://20.193.250.12:9443/carbon
Username: admin
Password: <admin password>
```

---

## 2. Create the Qlanka Application (Service Provider)

> This step registers Qlanka as an OAuth2 client so the backend can use the ROPC grant.

1. Navigate to **Identity → Service Providers → Add**
2. Name: `QlankaBackend`
3. Click **Register**
4. Go to **Inbound Authentication Configuration → OAuth/OpenID Connect** → **Configure**
5. Set:
   - **Grant Types**: ✅ `Resource Owner Password` (ROPC), ✅ `Refresh Token`
   - **Callback URL**: `https://your-frontend-url/auth/callback` *(not used for ROPC but required)*
   - **Allowed Audiences**: leave default or add your frontend URL
6. Click **Update**
7. Note the generated `Client ID` and `Client Secret` — place these in:
   - `backend/QueueLanka.Identity/appsettings.json` → `Wso2:ClientId` and `Wso2:ClientSecret`
   - Docker/Azure env vars: `Wso2__ClientId`, `Wso2__ClientSecret`

> **Current Client ID**: `bOhc0ENWBPxvw_sXu8fxHv_Rz2Aa`

---

## 3. Create Application Roles

> WSO2 IS uses **groups** for role-based access. Create groups matching the app roles.

Navigate to **Identity → User and Role Management → Roles → Add Role**:

| Role Name | Description                   |
|-----------|-------------------------------|
| `citizen` | End-user booking appointments |
| `officer`  | Service counter officer       |
| `admin`   | Platform administrator        |

---

## 4. Configure Role Claim in Access Token

> Without this, the `role` claim won't appear in the WSO2 access token.

1. Go to **Service Providers** → `QlankaBackend` → **Edit**
2. Under **Claim Configuration** → **Requested Claims** → **Add Claim URI**
3. Add:
   - `http://wso2.org/claims/role` → map to local claim `Role`
4. Under **Subject Claim URI**: set to `http://wso2.org/claims/username`
5. Enable **Always include claims in id token and userinfo** if needed

Alternatively, configure via the **Identity Server Management Console → OIDC Scopes**:
- Edit the `openid` scope to include the `role` claim.

---

## 5. Custom User Attribute: `centerId` (for Officers)

> Officers need a `centerId` attribute. This is stored in the Qlanka MySQL database, not in WSO2 IS.
> The backend reads `centerId` from MySQL and returns it alongside the WSO2 token in the login response.
> No WSO2 configuration is needed for this step.

---

## 6. SCIM2 API — User Provisioning on Registration

The backend calls WSO2 IS SCIM2 to create users when citizens register.  
This uses HTTP Basic Auth with the admin credentials.

**Test a SCIM2 user creation manually:**

```bash
curl -X POST https://20.193.250.12:9443/scim2/Users \
  -H "Authorization: Basic $(echo -n 'admin:<password>' | base64)" \
  -H "Content-Type: application/json" \
  -d '{
    "schemas": ["urn:ietf:params:scim:schemas:core:2.0:User"],
    "userName": "testcitizen",
    "password": "Test@1234",
    "emails": [{"value": "test@example.com", "primary": true}],
    "groups": [{"display": "citizen", "value": "citizen"}]
  }'
```

---

## 7. ROPC Token Test

**Test the ROPC flow directly:**

```bash
curl -X POST https://20.193.250.12:9443/oauth2/token \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "grant_type=password&username=<user>&password=<pass>&scope=openid profile&client_id=bOhc0ENWBPxvw_sXu8fxHv_Rz2Aa&client_secret=<secret>"
```

Expected response:
```json
{
  "access_token": "eyJ...",
  "refresh_token": "...",
  "expires_in": 3600,
  "token_type": "Bearer",
  "scope": "openid profile"
}
```

---

## 8. JWKS Endpoint (for backend JWT validation)

All backend services validate WSO2-issued JWTs against:

```
https://20.193.250.12:9443/oauth2/jwks
```

The OIDC discovery document is at:
```
https://20.193.250.12:9443/oauth2/token/.well-known/openid-configuration
```

---

## 9. Environment Variable Reference

| Variable | Service | Description |
|---|---|---|
| `Wso2__Enabled` | All | `true` to enable WSO2 mode |
| `Wso2__Authority` | All | WSO2 IS base URL for JWKS discovery |
| `Wso2__ValidIssuer` | All | Expected `iss` claim in tokens |
| `Wso2__Audience` | All | Expected `aud` claim (client_id) |
| `Wso2__ClientId` | Identity only | OAuth2 client ID |
| `Wso2__ClientSecret` | Identity only | OAuth2 client secret (**keep secret**) |
| `Wso2__BaseUrl` | Identity only | Base URL for SCIM2 calls |
| `Wso2__AdminUsername` | Identity only | WSO2 admin user for SCIM2 basic auth |
| `Wso2__AdminPassword` | Identity only | WSO2 admin password (**keep secret**) |
| `Wso2__AllowInvalidCertificate` | All | `true` only for self-signed certs in dev |

---

## 10. Secrets Management

> [!CAUTION]
> Never commit `ClientSecret` or `AdminPassword` to source control.

Store secrets in Azure:
- **Azure Key Vault** (recommended for production)
- **Azure Container Apps Secrets** or **App Service Application Settings**
- **Docker Swarm Secrets** for compose-based deployments

Set as environment variables using the double-underscore notation:
```
Wso2__ClientSecret=your_secret_here
Wso2__AdminPassword=your_admin_password
```
