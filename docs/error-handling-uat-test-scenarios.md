# Error and Exception Flows - UAT Test Scenarios

## Project Context
**Project Name:** QueueLanka Pro
**System Type:** Microservices-based Queue Management System

---

## 1. 🎯 Business Objective
The primary business objective of testing Error and Exception Flows is to guarantee system resilience, data integrity, and end-user trust. While "happy path" testing proves the system works when used perfectly, real-world users inevitably make mistakes, networks drop, and servers experience latency. Validating that QueueLanka Pro handles these inevitable failures gracefully—without crashing, without corrupting data, and by providing clear instructions to the user—is what separates a fragile academic project from an enterprise-grade product.

## 2. 🔄 Error & Exception Flow Overview
* **Error Handling:** How the UI communicates to the user when they do something wrong (e.g., clicking a button twice) or when the server rejects a request.
* **Validation Failures:** The immediate rejection of malformed or incomplete data *before* it is sent to the database (e.g., entering letters into a phone number field).
* **Exception Cases:** Unexpected system-level failures (e.g., the database goes offline or the WSO2 API Gateway times out). 
* **Importance:** Proper handling of these flows prevents users from being left on a blank, frozen screen, stops malicious data injection, and protects the backend infrastructure from being overwhelmed by bad requests.

## 3. 👥 Role-Based Coverage
To ensure comprehensive testing, scenarios are divided into the three primary user roles:
* **End User / Customer:** Facing external network conditions, mobile devices, and potential input errors during booking.
* **Officer:** Facing high-speed, repetitive operational actions where double-clicks or sudden queue state changes are common.
* **Admin:** Facing complex data configurations, large report generations, and security/access boundaries.

## 4. 🧪 UAT Test Scenarios

### Admin Role Scenarios
**Scenario 1: Large Report Generation Timeout (Exception Handling)**
* **User Role:** Admin
* **Preconditions:** The system has 5 years of dense historical data.
* **Step-by-step actions:**
  1. Admin attempts to generate a comprehensive report spanning all 5 years across all branches simultaneously.
  2. The database query takes longer than the YARP Gateway's configured 30-second timeout limit.
* **Expected Result:** The system does *not* show a blank white screen or a raw "504 Gateway Timeout" code. The UI gracefully intercepts the timeout and displays a friendly modal: "The requested data is too large to process immediately. Please narrow your date range and try again."

**Scenario 2: Unauthorized Endpoint Access (Security Error)**
* **User Role:** Admin (Attempting Officer Action)
* **Preconditions:** Admin is logged in.
* **Step-by-step actions:**
  1. The Admin manually modifies their browser URL to access the Officer's specific `/counter/call-next` endpoint.
* **Expected Result:** The WSO2 API Manager intercepts the request, notes the missing "Officer" role claim in the JWT, and immediately redirects the Admin back to the dashboard with an "Access Denied: You do not have permission to view this page" notification.

### Officer Role Scenarios
**Scenario 3: Empty Queue Action (Logic Error)**
* **User Role:** Officer
* **Preconditions:** The waiting queue for the assigned Service Center is completely empty.
* **Step-by-step actions:**
  1. The Officer clicks the "Call Next" button.
* **Expected Result:** The system does not attempt to assign a "null" ticket. The button is either disabled, or upon clicking, a toast notification appears stating "No customers are currently waiting in the queue."

**Scenario 4: Session Expiration / Expired Token (Authentication Error)**
* **User Role:** Officer
* **Preconditions:** The Officer leaves their workstation logged in and goes on a 1-hour lunch break. The system's JWT token lifespan is 30 minutes.
* **Step-by-step actions:**
  1. The Officer returns and attempts to click "Mark as Served" on a stale ticket.
* **Expected Result:** The API returns a `401 Unauthorized` due to the expired token. The React frontend intercepts this, immediately logs the user out, redirects them to the Login screen, and displays "Your session has expired for security reasons. Please log in again."

### End User / Customer Scenarios
**Scenario 5: Invalid Input Format during Booking (Validation Failure)**
* **User Role:** Customer
* **Preconditions:** The customer is on the Appointment Booking screen.
* **Step-by-step actions:**
  1. The customer fills out their Name correctly.
  2. In the "Phone Number" field, they type "123-ABC-7890".
  3. They click "Confirm Booking".
* **Expected Result:** The form does not submit. The Phone Number field is highlighted in red, and a validation message appears below it stating "Please enter a valid 10-digit numeric phone number."

**Scenario 6: Double Booking Attempt (Conflict Error)**
* **User Role:** Customer
* **Preconditions:** The customer already holds an active, unserved token for the "Colombo Center" today.
* **Step-by-step actions:**
  1. The customer navigates to the booking screen again.
  2. They attempt to book a second ticket for the same center on the same day.
* **Expected Result:** The API rejects the creation. The UI displays an error: "You already have an active appointment for this center today. Please wait to be served."

## 5. 📋 UAT Test Case Table

| Test Case ID | Role | Scenario Name | Steps | Expected Result | Status |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **UAT-ERR-01** | Admin | Report Timeout | Request massive date range | Friendly "Data too large" message; no raw HTTP 504 shown. | [ ] |
| **UAT-ERR-02** | Admin | Restricted URL | Navigate to `/officer/call` | Redirected with "Access Denied" (403 Forbidden). | [ ] |
| **UAT-ERR-03** | Officer | Empty Queue Call | Click 'Call Next' on empty queue | "No customers waiting" toast notification. System stays stable. | [ ] |
| **UAT-ERR-04** | Officer | Expired Session | Click action after 1 hour idle | User safely logged out and redirected to login screen. | [ ] |
| **UAT-ERR-05** | Customer | Invalid Phone Format | Enter letters in phone field | Immediate UI validation error; form submission blocked. | [ ] |
| **UAT-ERR-06** | Customer | Duplicate Booking | Attempt 2nd active booking | Request blocked; "Active appointment already exists" message. | [ ] |
| **UAT-ERR-07** | Any | Database Offline | Attempt any read/write action while DB down | "Our services are currently experiencing issues. Please try again later." | [ ] |

## 6. ⚠️ Validation Failures Documented
* **Empty Input Fields:** Submitting a form without a mandatory field (e.g., Customer Name) highlights the field and blocks submission.
* **Invalid Dates:** Selecting a "Date of Birth" in the future, or a "Report End Date" earlier than the "Start Date".
* **Invalid Formats:** Email addresses lacking an "@" symbol or domain; Phone numbers containing alphabetic characters.
* **Invalid Numeric Values:** Entering a negative number for "Expected Service Duration" in Admin settings.

## 7. 🚨 Exception Cases Documented
* **API / Database Unavailable:** The core microservice or database goes offline. The system must catch the connection refusal and display a generic, user-friendly maintenance page.
* **WebSocket Update Failure:** If the real-time SignalR/WebSocket connection drops, the UI should display a subtle "Reconnecting to live queue..." banner rather than silently failing to update the dashboard.
* **Export Failure:** If the server fails to generate a PDF due to memory constraints, the UI must inform the user the download failed, rather than leaving them waiting indefinitely.

## 8. 📊 Validation Checklist
- [ ] Error messages are written in plain English, avoiding technical terminology or stack traces.
- [ ] No action causing a validation error or exception results in a frozen "white screen of death."
- [ ] Unauthorized access attempts (401/403) consistently redirect the user to a safe landing page or login screen.
- [ ] Submitting a form rapidly multiple times (double-clicking) is prevented by UI disabling (debouncing).
- [ ] When the system recovers from a temporary network drop, real-time dashboards automatically resync.

## 9. 🧾 BA Summary
Developing the UAT scenarios for error and exception handling ensures that QueueLanka Pro behaves predictably even in unpredictable circumstances. By rigorously testing how the system responds to bad data, expired sessions, and infrastructure timeouts, we validate the application's resilience. A system that actively guides its users through mistakes and safely shields its backend from malformed requests is the hallmark of a mature, production-ready enterprise solution.

---

## 🎓 Academic / Viva Preparation section

### 🌟 5 Critical Negative Test Scenarios for Your Viva
1. **The "Empty Queue Call" (UAT-ERR-03):** Proves you understand state management and preventing null-reference exceptions in operational flows.
2. **Expired Session Handling (UAT-ERR-04):** Shows strong awareness of stateless security (JWT) and User Experience (UX) recovery.
3. **Double Booking Conflict (UAT-ERR-06):** Demonstrates testing of business logic constraints, not just technical errors.
4. **Large Report Timeout (UAT-ERR-01):** Highlights awareness of Microservices architecture (API Gateways timing out) and how to handle it gracefully on the frontend.
5. **Database Availability Exception (UAT-ERR-07):** Proves you understand how to mask internal infrastructure failures from the end-user for security and professionalism.

### ❓ Possible Viva Questions & Answers

**Q1: If the database suddenly goes offline, why is it critical that the user sees "Service experiencing issues" rather than the actual "SQL Connection Refused" error generated by the code?**
*Answer:* As a Business Analyst, this is a major security and UX concern. Displaying a raw SQL error exposes our internal technology stack (e.g., database versions, internal IP addresses, table names) to potential attackers. From a UX perspective, technical errors confuse the user. A generic, friendly message maintains professional trust and system security.

**Q2: How does the system handle a situation where a Customer's mobile network drops exactly when they click "Book Appointment"?**
*Answer:* This relates to idempotency and exception handling. If the network drops, the frontend should realize it did not receive an HTTP 200 OK response from the Gateway. The UI should display a "Network Error" message. If the user clicks book again, the backend Business Logic (which prevents duplicate active tokens) ensures they don't accidentally book two tickets if the first request secretly went through.

**Q3: We test "Validation Failures" heavily on the UI (React). If the UI catches an invalid email format, why do we need to test if the API (backend) catches it as well?**
*Answer:* UI validation is purely for user convenience—it provides instant feedback. However, the UI is not a security boundary. A malicious user can bypass the React application entirely and send a raw, malformed HTTP POST request straight to the API Gateway. Therefore, the backend API must *always* re-validate the data before inserting it into the database to ensure data integrity and prevent injection attacks.