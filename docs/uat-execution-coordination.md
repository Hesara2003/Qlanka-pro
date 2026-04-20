# UAT Execution and Stakeholder Coordination

## Project Context
**Project Name:** QueueLanka Pro
**System Type:** Microservices-based Queue Management System

---

## 1. 🎯 Business Objective
The primary business objective of User Acceptance Testing (UAT) execution is to validate that the QueueLanka Pro system actively solves the business problems it was designed to address. UAT shifts the focus from technical functionality (does the code work?) to business usability (can the staff and customers actually use the software to manage queues effectively?). Involving stakeholders ensures the final product aligns with user expectations, operates correctly under real-world conditions, and is officially approved for production deployment (or academic grading).

## 2. 👥 Stakeholder Identification
To ensure comprehensive feedback, the UAT sessions require the active participation of the following stakeholders:
* **System Administrators (Admin Users):** To test global configuration, user management, and high-level reports.
* **Counter Officers (Service Staff):** To validate the speed, responsiveness, and usability of the daily queue management interface.
* **End Users (Customers/Mock Patients):** To test the intuitiveness of booking appointments and tracking live queues on mobile devices.
* **Project Evaluators (Lecturers/Business Sponsors):** To assess the overall system architecture, business value delivery, and adherence to initial project requirements.

## 3. 📅 UAT Execution Plan
**Phase 1: Preparation (1 Week Before)**
* Ensure the Staging/UAT environment is live and loaded with realistic test data (not "Test User 1", but actual mock names and branch locations).
* Print or digitally distribute the established UAT Test Case documents to the invited stakeholders.
* Create temporary login credentials for all participating roles.

**Phase 2: Scheduling & Logistics**
* **Session 1 (Morning):** Admin and Officer workflow validation (60 mins).
* **Session 2 (Afternoon):** Customer booking flows and Negative/Error testing (60 mins).
* **Environment:** Ensure stable internet access and have both desktop (Admin/Officer) and mobile devices (Customer) available for testing.

**Phase 3: Roles and Responsibilities**
* **Business Analyst (You):** Facilitate the session, guide users through the workflow, and record all feedback/defects.
* **Stakeholders (Users):** Execute the actions listed in the test scripts and provide honest usability feedback.

## 4. 🧪 UAT Session Execution Process
1. **Briefing (10 mins):** Welcome the stakeholders. Briefly explain the purpose of the session (e.g., "Today we are testing the counter officer's 'Call Next' workflow. We want to see if the buttons make sense and if the system responds fast enough").
2. **Demonstration (15 mins):** (Specifically for Lecturer Demos) Walk through a perfect "Happy Path" transaction from start to finish to orient the audience before they test it themselves.
3. **Execution (30 mins):** Hand over the mouse/device to the stakeholders. Ask them to follow the UAT scripts step-by-step. Let them click the buttons; do not drive the mouse for them.
4. **Observation & Logging:** Watch where they hesitate or get confused. If they encounter an error or a confusing UI element, immediately log it in the UAT Results tracker.

## 5. 📋 Critical Test Coverage Assurance
During execution, the BA must ensure the following critical paths are undeniably executed and witnessed by the stakeholders:
* **Admin Flows:** Successfully creating a new user and watching the RBAC system enforce restrictions.
* **Officer Flows:** The complete lifecycle of a token (Booking -> Calling -> Serving), verifying real-time WebSocket updates on the public dashboard.
* **Reports & Analytics:** Generating a report with multiple filters and reconciling the numbers against known mock data.
* **Error/Exception Scenarios:** Intentionally feeding the system bad data (e.g., double bookings, empty queues) to prove it fails safely without crashing.

## 6. 📊 UAT Results Recording

| Test Case ID | Scenario | Expected Result | Actual Result | Status | Comments / Defect ID |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **UAT-OFF-01** | Call Next Customer | Next ticket assigned to Counter A. | Ticket assigned successfully. | PASS | UI is clear and responsive. |
| **UAT-OFF-02** | Handle Empty Queue | Toast notification "Queue is empty." | System froze; required page refresh. | FAIL | **BUG-041** High Priority |
| **UAT-CUS-01** | Mobile Booking | Token generated and SMS sent. | Token generated, but SMS delayed by 2 mins. | PASS* | Acceptable, but note for future optimization. |
| **UAT-ADM-01** | Generate Wait Time Report | Accurate PDF downloads. | PDF downloaded with correct data. | PASS | Formatting is perfectly aligned. |

## 7. ⚠️ Issue Tracking & Handling
* **Identification:** When a stakeholder discovers a flaw (e.g., UAT-OFF-02 above), the BA immediately logs it.
* **Prioritization:** 
  * *Critical:* System crashes, security bypasses (Must fix before Go-Live/Grading).
  * *High:* Major feature broken but a workaround exists (Fix quickly).
  * *Low:* Typo in a button or minor color flaw (Fix in next sprint).
* **Communication:** Log the issue in Jira/Trello, assign it to a developer, and notify the stakeholder once the fix is deployed to the Staging environment for re-testing.

## 8. 📘 Lecturer Demo Guidance
* **Start with the "Why":** Don't immediately open the code or the UI. Start by stating the business problem QueueLanka Pro solves (reducing physical waiting time).
* **Follow the User Journey:** Do not jump randomly between screens. Act as the Customer booking a ticket, then switch tabs and act as the Officer serving that exact ticket. Tell a story.
* **Highlight the Architecture:** While demonstrating the real-time public dashboard updating, mention that this is powered by SignalR/WebSockets routing through the WSO2 API Gateway.
* **Handling Questions:** If the lecturer asks a question or requests a negative test (e.g., "What happens if I type letters here?"), calmly execute it. Because you tested the Error Flows (UAT-ERR-05), the system will handle it gracefully.

## 9. ✅ UAT Sign-off Criteria
UAT execution is officially complete and the system is ready for delivery when:
1. 100% of all Critical and High-priority test cases mark as "PASS".
2. Any remaining defects are classified as "Low" severity and acknowledged to be fixed post-launch.
3. The primary Stakeholders (or evaluating Lecturers) verbally or digitally approve the system's behavior based on the demonstrated results.

## 10. 🧾 BA Summary
The execution of User Acceptance Testing represents the critical bridge between software development and business deployment. By meticulously coordinating with actual end-users and stakeholders, facilitating structured testing sessions, and transparently tracking defects, the UAT phase guarantees that QueueLanka Pro operates exactly as envisioned. It ensures the final product is not merely technically functional, but genuinely usable, secure, and ready to deliver immediate value to service centers.

---

## 🎓 Academic / Viva Preparation section

### 🎙️ 3 Key Things to Say During the UAT Demo
1. *"As you can see, we didn't just build features; we built workflows. Notice how the real-time dashboard updates instantly when the Officer clicks 'Call', proving our WebSocket integration works under load."*
2. *"While the 'happy path' works flawlessly, I also want to demonstrate our system's resilience. If I attempt to book two active tickets simultaneously, the system's business logic actively blocks it to prevent queue manipulation."*
3. *"All administrative actions you see here are heavily protected by Role-Based Access Control. If an Officer attempted to access this exact URL, the API Gateway would reject them via the JWT validation."*

### ❓ Possible Viva Questions & Answers

**Q1: What is the main difference between System Testing (done by Developers) and User Acceptance Testing (done by Stakeholders)?**
*Answer:* System testing verifies that the code meets technical specifications—it ensures the database saves the data without crashing. User Acceptance Testing (UAT) verifies that the software meets *business* specifications. During UAT, we hand the system to the actual users to prove the application is intuitive, solves their daily problems, and behaves correctly in real-world scenarios.

**Q2: During UAT, a stakeholder clicked a button, and the system crashed. As a BA, what are your immediate next steps?**
*Answer:* First, I would apologize to the stakeholder and ask them precisely what they clicked leading up to the crash to ensure I can reproduce it. I would immediately log this in our UAT Results tracker as a "FAIL" and raise a "Critical Defect" ticket in Jira for the development team. Most importantly, I will block the project's "Go-Live" or final sign-off until that specific bug is fixed and re-tested by the stakeholder.

**Q3: How do you manage a stakeholder who refuses to sign off on UAT because they want a completely new feature added right now?**
*Answer:* This is a classic case of "Scope Creep". I would acknowledge their request and agree that it's a great idea for the product's future. However, I would kindly remind them that UAT is exclusively for testing the requirements we agreed upon at the start of this specific sprint/project. I would document their new idea in the product backlog for "Phase 2," and request sign-off based purely on the successful execution of the current agreed-upon test cases.