# QueueLanka Pro - API Documentation

## Project Context
**Project Name:** QueueLanka Pro
**System Type:** Microservices-based Queue Management System

---

## 1. 🎯 Business Objective
The primary business objective of this API Documentation is to provide a clear, standardized contract for how different components of the QueueLanka Pro system (such as the React frontend, mobile clients, and third-party integrators) interact with the backend services. Well-documented APIs ensure seamless integration, reduce developer onboarding time, simplify troubleshooting, and maintain a secure, decoupled architecture where independent teams can work without breaking system functionality.

## 2. 🌐 API Overview
QueueLanka Pro utilizes a distributed microservices architecture. Instead of communicating directly with individual backend services (.NET Web APIs), all client applications route their requests through a central **WSO2 API Manager**, which acts as the front door. The WSO2 Gateway handles rate-limiting and token validation before securely forwarding requests to the internal **YARP Gateway**, which routes them to the correct microservice.

**API Categories:**
* **Public APIs:** Accessible without authentication (e.g., viewing open branches).
* **User APIs:** Require a customer account (e.g., booking a ticket).
* **Officer APIs:** Restricted to service center staff (e.g., calling the next token).
* **Admin APIs:** Restricted to system administrators (e.g., generating system-wide reports).

## 3. 🔐 Authentication Method
All secured endpoints in the QueueLanka Pro system utilize **OAuth2 Authentication** via JSON Web Tokens (JWT).

### Obtaining an Access Token
Clients must authenticate by sending their credentials to the Identity Service. Upon successful verification, the service returns a signed JWT containing the user's role and privileges.

### Using the Token
For all subsequent requests to secured endpoints, the client must include this JWT in the HTTP headers using the `Bearer` schema.

**Header Format:**
```text
Authorization: Bearer <your_jwt_token_here>
```

---

## 4. 📡 API Endpoints Documentation

### 4.1 Identity Service

#### User Login
* **Endpoint Name:** Authenticate User
* **HTTP Method:** `POST`
* **URL:** `/api/v1/identity/login`
* **Description:** Validates user credentials and returns an access token.
* **Authorization:** Public

**Request:**
* **Headers:** `Content-Type: application/json`
* **Body:**
```json
{
  "email": "officer@queuelanka.com",
  "password": "SecurePassword123!"
}
```

**Success Response (200 OK):**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "expiresIn": 3600,
  "user": {
    "id": "u-101",
    "name": "Kamal Perera",
    "role": "Officer"
  }
}
```

**Error Response (401 Unauthorized):**
```json
{
  "error": "invalid_credentials",
  "message": "The email or password provided is incorrect."
}
```

### 4.2 Service Center Service

#### Get Active Centers
* **Endpoint Name:** List Service Centers
* **HTTP Method:** `GET`
* **URL:** `/api/v1/centers`
* **Description:** Retrieves a list of all currently operational service centers.
* **Authorization:** Public

**Request:**
* **Headers:** None
* **Parameters:** None

**Success Response (200 OK):**
```json
[
  {
    "centerId": "c-001",
    "name": "Colombo Main Branch",
    "isOpen": true,
    "currentQueueLength": 15
  }
]
```

### 4.3 Queue Service

#### Book Appointment (Token)
* **Endpoint Name:** Generate Token
* **HTTP Method:** `POST`
* **URL:** `/api/v1/queue/book`
* **Description:** Books a spot in the queue for a specified service center.
* **Authorization:** User

**Request:**
* **Headers:** `Authorization: Bearer <token>`, `Content-Type: application/json`
* **Body:**
```json
{
  "centerId": "c-001",
  "serviceType": "General Inquiry"
}
```

**Success Response (201 Created):**
```json
{
  "tokenId": "T-1045",
  "estimatedWaitTimeMins": 25,
  "status": "Waiting"
}
```

#### Call Next Customer
* **Endpoint Name:** Call Next Token
* **HTTP Method:** `POST`
* **URL:** `/api/v1/queue/call-next`
* **Description:** Pulls the oldest waiting token from the queue and assigns it to the officer's counter.
* **Authorization:** Officer

**Request:**
* **Headers:** `Authorization: Bearer <token>`, `Content-Type: application/json`
* **Body:**
```json
{
  "counterNumber": 3
}
```

**Success Response (200 OK):**
```json
{
  "tokenId": "T-1045",
  "customerName": "Nimal Silva",
  "message": "Customer T-1045 assigned to Counter 3"
}
```

### 4.4 Reports & Analytics Service

#### Get Wait Time Report
* **Endpoint Name:** Average Wait Time Analytics
* **HTTP Method:** `GET`
* **URL:** `/api/v1/reports/wait-times`
* **Description:** Aggregates wait time data across a specific date range.
* **Authorization:** Admin

**Request:**
* **Headers:** `Authorization: Bearer <token>`
* **Parameters:** `?startDate=2026-04-01&endDate=2026-04-20&centerId=c-001`

**Success Response (200 OK):**
```json
{
  "centerId": "c-001",
  "averageWaitTimeMins": 12.5,
  "totalServed": 450,
  "dateRange": "2026-04-01 to 2026-04-20"
}
```

---

## 5. 📘 Example API Calls

**cURL Example: Booking a Ticket (Queue Service)**
```bash
curl -X POST https://api.queuelanka.com/api/v1/queue/book \
  -H "Authorization: Bearer eyJhbGci..." \
  -H "Content-Type: application/json" \
  -d '{
        "centerId": "c-001",
        "serviceType": "General Inquiry"
      }'
```

**cURL Example: Viewing Service Centers**
```bash
curl -X GET https://api.queuelanka.com/api/v1/centers
```

---

## 6. 📊 Error Handling
The QueueLanka Pro APIs use standard HTTP status codes to indicate the success or failure of an API request.

* **200 OK / 201 Created:** The request was successful.
* **400 Bad Request:** The request was malformed (e.g., missing a required JSON field).
* **401 Unauthorized:** The client did not provide a valid authentication token.
* **403 Forbidden:** The client is authenticated but does not have the required Role (e.g., a User trying to hit an Admin endpoint).
* **404 Not Found:** The requested resource (e.g., a specific Token ID) does not exist in the database.
* **500 Internal Server Error:** An unexpected failure occurred on the server (e.g., database connection lost).

**Standard Error Response Format:**
```json
{
  "status": 403,
  "error": "Forbidden",
  "message": "You do not have permission to execute this action.",
  "timestamp": "2026-04-20T10:00:00Z"
}
```

## 7. 📋 Validation Checklist
- [ ] Ensure all API responses return `application/json` content types.
- [ ] Verify that unauthorized requests receive a `401` and not a `500` stack trace.
- [ ] Confirm WSO2 API Manager is enforcing rate limits (e.g., max 100 requests/minute per client).
- [ ] Ensure all dates and timestamps output by the API follow the ISO 8601 format (`YYYY-MM-DDThh:mm:ssZ`).
- [ ] Validate that JWT tokens expire correctly and cannot be reused indefinitely.

## 8. ⚠️ Notes & Best Practices
* **HTTPS Only:** For security, the WSO2 Gateway rejects any request made over plain HTTP. All API interactions must use encrypted HTTPS.
* **Pagination:** When requesting large datasets from the Reports API, implement URL parameters (`?page=1&limit=50`) to prevent overwhelming the database and network payload.
* **Idempotency:** Action endpoints like `/call-next` should handle duplicate rapid requests safely ensuring only one token is ever assigned.
* **Secret Management:** Never hardcode your API credentials or Bearer tokens into your client-side frontend code.

## 9. 🧾 Summary
This API Documentation establishes a firm standard for interacting with the QueueLanka Pro backend microservices. By centralizing requests through the WSO2 and YARP gateways, standardizing JSON payloads, and strictly enforcing OAuth2 Role-Based Access Control, the platform ensures secure, scalable, and predictable data exchange. Conforming to these documented endpoints guarantees reliable integration across all web, mobile, and administrative clients.