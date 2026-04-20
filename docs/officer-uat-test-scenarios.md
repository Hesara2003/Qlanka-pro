# Officer User Flows - UAT Test Scenarios

## Project Context
**Project Name:** QueueLanka Pro
**System Type:** Microservices-based Queue Management System

---

## 1. 🎯 Business Objective
The primary business objective of the Officer workflows is to provide service center staff with a streamlined, error-free interface to manage physical queues digitally. By enabling Officers to efficiently "call", "serve", or "skip" customers, the system reduces physical crowding, decreases average customer wait times, and ensures a smooth, organized flow of operations on the service floor.

## 2. 🔄 Officer Workflow Overview
* **Call-Next Flow:** The officer signals availability. The system identifies the next customer in the queue based on priority and arrival time, assigns them to the officer's counter, and updates the public hall displays.
* **Serving Flow:** Once the customer arrives at the counter, the officer provides the required service. Upon completion, the officer marks the ticket as "Served", which closes the token lifecycle and records the service time for analytics.
* **Queue Management Flow (Skip/Cancel):** If a called customer does not approach the counter within a reasonable time (a "no-show"), the officer can mark them as "Skipped". If a ticket is identified as invalid, it can be cancelled to keep the queue moving.

## 3. 🧪 UAT Test Scenarios

### Scenario 1: Standard Customer Processing (End-to-End)
* **Preconditions:** The Officer is logged in and assigned to Counter A. There are 3 customers currently waiting in the queue.
* **Step-by-step actions:**
  1. Officer clicks the "Call Next" button.
  2. Officer waits for the customer to arrive and handles their request.
  3. Officer clicks the "Mark as Served" button.
* **Expected results:** System assigns the next ticket to Counter A. The UI updates to show the current ticket number. Upon clicking "Mark as Served", the ticket is archived, and the Officer's UI returns to an "Available" state.

### Scenario 2: Handling a No-Show Customer
* **Preconditions:** The Officer is logged in. The queue has waiting customers.
* **Step-by-step actions:**
  1. Officer clicks "Call Next".
  2. The customer does not appear at the counter.
  3. Officer clicks the "Skip" button.
  4. Officer provides a brief reason (if prompted) or confirms the skip.
* **Expected results:** The ticket status changes to "Skipped". The public display removes the token, and the Officer is immediately freed up to click "Call Next" again.

### Scenario 3: Handling an Empty Queue
* **Preconditions:** The Officer is logged in. The queue is currently completely empty (no waiting customers).
* **Step-by-step actions:**
  1. Officer looks at the dashboard.
  2. Officer attempts to click the "Call Next" button.
* **Expected results:** The "Call Next" button is either disabled (grayed out) or clicking it displays a friendly system message stating: "There are currently no waiting customers in the queue." No system crash occurs.

## 4. 📋 UAT Test Case Table

| Test Case ID | Scenario Name | Steps | Expected Result | Status |
| :--- | :--- | :--- | :--- | :--- |
| **UAT-OFF-01** | Standard Call & Serve | 1. Login<br>2. Click 'Call Next'<br>3. Click 'Mark as Served' | Customer assigned to counter. Ticket marked completed. Officer status resets to Available. | [ ] |
| **UAT-OFF-02** | Customer Skip | 1. Click 'Call Next'<br>2. Click 'Skip' | Ticket marked skipped. Officer status resets to Available. | [ ] |
| **UAT-OFF-03** | Empty Queue Handling | 1. Ensure queue is empty<br>2. Click 'Call Next' | Friendly message appears. System remains stable. No token is called. | [ ] |
| **UAT-OFF-04** | Active Token Persistence | 1. Click 'Call Next'<br>2. Refresh the browser page | The current active ticket remains assigned to the officer after page reload. | [ ] |

## 5. 📊 Validation Checklist
- [ ] Officers can only view and manage the queue for their specifically assigned Service Center.
- [ ] "Call Next" correctly fetches the oldest waiting ticket (FIFO - First In, First Out).
- [ ] Public display boards reflect the token called by the Officer in near real-time.
- [ ] The system logs the exact timestamp when a token is called and when it is served.
- [ ] Officers cannot call a new token while currently serving an active one.

## 6. ⚠️ Edge Cases & Negative Scenarios
* **Double-Clicking:** An officer aggressively double-clicks the "Call Next" button. The system must prevent calling two customers simultaneously (Button debounce/API idempotency).
* **Network Disconnection:** An officer clicks "Mark as Served" but their Wi-Fi drops. The UI should display a "Network Error - Try Again" warning rather than assuming the action succeeded.
* **System Errors (Gateway Timeout):** If the API Gateway is temporarily down when clicking "Skip", the officer must receive clear feedback and the ticket must not be lost in transit.

## 7. 🧾 BA Summary
The Officer Workflow is the most highly utilized operational component of the QueueLanka Pro system. Through these UAT scenarios, we validate that the officers are empowered to handle both standard and exceptional customer interactions efficiently. Ensuring system stability during rapid actions, network hiccups, and empty queue states guarantees that the physical service center maintains operational rhythm without software interruptions.

---

## 🎓 Academic / Viva Preparation section

### 🌟 3 Critical Scenarios to Highlight in Your Viva
1. **The Empty Queue Handling (UAT-OFF-03):** Shows you understand exception handling and user experience.
2. **Double-Click/Network Disconnect Edge Cases:** Proves you think beyond "happy path" testing and consider real-world physical constraints.
3. **Active Token Persistence (UAT-OFF-04):** Demonstrates understanding of web statelessness and the need for robust state management if the browser crashes or refreshes.

### ❓ Possible Viva Questions & Answers

**Q1: Why do we need UAT purely for "Officer Workflows" when the developers already did Unit Testing?**
*Answer:* Unit tests verify that the code mathematically and logically works in isolation. User Acceptance Testing (UAT) verifies that the software actually meets the business requirements and is usable in a real-world environment. A developer might confirm a database row updates, but UAT confirms the Officer finds the "Call Next" button intuitive and the workflow matches human behavior.

**Q2: In your UAT Table, you listed "Active Token Persistence" upon browser refresh. Why is this conceptually important in a web application?**
*Answer:* Web applications are inherently stateless. If an Officer accidentally closes their browser tab or refreshes the page while serving "Ticket #105", losing that context would disrupt the physical queue. Testing this ensures the system correctly fetches the Officer's active state from the backend (API) instead of relying solely on temporary browser memory.

**Q3: How does the system resolve a scenario where two officers click "Call Next" at the exact same millisecond?**
*Answer:* This relates to database concurrency and race conditions. Although it's a technical implementation, as a BA, I require that the system must handle it securely. The backend microservices should use mechanisms like transactional locking or optimistic concurrency. Only one officer will get the token, and the other officer's request will seamlessly fetch the next available token in the line, without displaying an error to the user.