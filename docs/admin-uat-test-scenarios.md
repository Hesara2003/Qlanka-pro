# Admin User Flows - UAT Test Scenarios

## Project Context
**Project Name:** QueueLanka Pro
**System Type:** Microservices-based Queue Management System

---

## 1. 🎯 Business Objective
The primary business objective of the Admin workflows is to provide authorized personnel with a secure and centralized management interface to oversee the entire QueueLanka Pro system. These workflows ensure that administrators can efficiently manage staff access (RBAC), configure system-wide rules, and proactively monitor overall operational health, thereby ensuring continuous, secure, and optimal service delivery across all centers.

## 2. 🔄 Admin Workflow Overview
* **User Management Flow:** Creating new accounts (Counter Officers, branch managers), updating their details, assigning appropriate roles, and deactivating accounts when staff leave.
* **System Configuration Flow:** Updating global or branch-specific settings such as operational hours, queue limits, or service categories.
* **Monitoring & Control Flow:** Accessing high-level analytics, viewing real-time dashboards, and generating audit reports to ensure system compliance and performance.

## 3. 🧪 UAT Test Scenarios

### Scenario 1: Creating a New Officer User
* **Preconditions:** The Admin user is logged into the Admin Portal.
* **Step-by-step actions:**
  1. Navigate to "User Management" from the sidebar.
  2. Click on the "Add New User" button.
  3. Fill in required details (Name, Email, Contact).
  4. Select the "Officer" role from the Role dropdown and assign them to "Colombo Center".
  5. Click "Save User".
* **Expected results:** System displays a "User created successfully" message. The new user appears in the user list table, and a temporary password or welcome email is dispatched to the new user.

### Scenario 2: Editing User Details and Changing Roles
* **Preconditions:** The user account "John Doe (Officer)" exists in the system.
* **Step-by-step actions:**
  1. Navigate to "User Management".
  2. Search for "John Doe" and click the "Edit" icon.
  3. Change the Role from "Officer" to "Admin".
  4. Update the contact number.
  5. Click "Update Server".
* **Expected results:** System saves the changes. The user list immediately reflects John Doe's new role as "Admin". A notification is sent to the user regarding the permission upgrade.

### Scenario 3: Disabling/Deleting a User Account
* **Preconditions:** The Admin identifies an Officer who has resigned. 
* **Step-by-step actions:**
  1. In "User Management", locate the resigning Officer's account.
  2. Click the "Deactivate" (or Delete) button.
  3. Confirm the action in the warning prompt.
* **Expected results:** The account status changes to "Inactive." The former Officer is immediately stripped of their active JWT token and cannot log into the system.

### Scenario 4: Updating System Settings
* **Preconditions:** The Admin wants to adjust the maximum queue tokens allowed per day for a specific branch.
* **Step-by-step actions:**
  1. Navigate to "System Settings" -> "Branch Configurations".
  2. Select the relevant Service Center.
  3. Change "Max Daily Tokens" from 500 to 600.
  4. Click "Apply Changes".
* **Expected results:** Success message appears. The new limit is pushed to the Gateway/Queue microservice, instantly allowing 100 more tokens to be issued for that branch.

### Scenario 5: Accessing Dashboard and Generating Reports
* **Preconditions:** The system has active queue data from the current day.
* **Step-by-step actions:**
  1. Navigate to "Analytics Dashboard".
  2. Review real-time KPIs (Total Served, Wait Times).
  3. Navigate to "Reports", select "Daily Summary", and click "Download PDF".
* **Expected results:** The dashboard loads within 3 seconds showcasing accurate statistics. The downloaded PDF file opens correctly and matches the on-screen data.

## 4. 📋 UAT Test Case Table

| Test Case ID | Scenario Name | Steps | Expected Result | Status |
| :--- | :--- | :--- | :--- | :--- |
| **UAT-ADM-01** | Create New Officer | 1. Go to User Management<br>2. Fill details & select Officer role<br>3. Save | Officer account is created, listed in grid, and welcome email dispatched. | [ ] |
| **UAT-ADM-02** | Update User Role | 1. Edit existing user<br>2. Change Role<br>3. Save | Role is updated immediately, changing user's system privileges. | [ ] |
| **UAT-ADM-03** | Deactivate User | 1. Select User<br>2. Click Deactivate<br>3. Confirm | User status becomes Inactive. Login is blocked. | [ ] |
| **UAT-ADM-04** | Prevent Self-Deletion | 1. Admin views their own profile<br>2. Attempt to Deactivate | Deactivate button is hidden or raises an error preventing self-lockout. | [ ] |
| **UAT-ADM-05** | Update Global Settings | 1. Go to Settings<br>2. Modify parameter<br>3. Save | Settings are updated and applied globally without system downtime. | [ ] |
| **UAT-ADM-06** | Invalid User Creation | 1. Create User<br>2. Provide existing email<br>3. Save | "Email already exists" error is displayed. Account creation fails. | [ ] |

## 5. 📊 Validation Checklist
- [ ] Only users with the explicit "Admin" role can access the User Management and System Settings modules.
- [ ] Email addresses are validated for standard formatting (e.g., user@domain.com) during creation.
- [ ] Required fields (Name, Email, Role) cannot be left blank when creating/updating a user.
- [ ] Actions like Deactivation trigger a secondary confirmation prompt to prevent accidental clicks.
- [ ] The system logs all administrative actions (e.g., "Admin A changed settings at 10:00 AM") for audit purposes.

## 6. ⚠️ Edge Cases & Negative Scenarios
* **Duplicate User Creation:** Attempting to create a user using an email address that is already registered in the system. The system must gracefully reject the request with a clear error message.
* **Self-Deactivation/Lockout:** An Admin attempts to delete or deactivate their own currently active account. The system should block this to prevent a scenario where a system has zero active admins.
* **Unauthorized Access Attempts:** A user with an "Officer" role tries to manually change the URL to access `/admin/settings`. The API Gateway and Frontend should catch this and redirect them with a `403 Forbidden` error.

## 7. 🧾 BA Summary
The Admin UAT scenarios are designed to validate the robustness and security of the system's management layer. Since administrative actions control the entire queuing environment and staff access rules, the testing focuses heavily on data validation, Role-Based Access Control (RBAC) enforcement, and error prevention. Successfully passing these UAT cases guarantees that administrators have reliable, secure tools to manage organizational scalability and platform health.

---

## 🎓 Academic / Viva Preparation section

### 🌟 3 Critical Scenarios to Highlight in Your Viva
1. **Self-Lockout Prevention (UAT-ADM-04):** Highlights your foresight into real-world administrative disasters securely prevented by UI/API rules.
2. **Unauthorized URL Access (Negative Testing):** Demonstrates that you are testing RBAC not just by clicking links, but by actively trying to bypass the UI.
3. **Duplicate User Creation (UAT-ADM-06):** Emphasizes database integrity and proper exception handling in the API.

### ❓ Possible Viva Questions & Answers

**Q1: In your UAT, you mention "Deactivate User" rather than "Delete User". Why is soft-deletion preferred in enterprise systems like QueueLanka Pro?**
*Answer:* In enterprise systems, users (like Officers) are linked to historical data, such as tokens they served or actions they performed. Hard-deleting their record from the database would break referential integrity and ruin historical reports. By "soft-deleting" or "deactivating", we disable their login access while safely preserving all historical metrics for auditing.

**Q2: How do you validate that an Admin's change to a System Setting actually works across a Microservices architecture?**
*Answer:* Because the system uses microservices (like a dedicated Queue Service and a Gateway), an Admin updating a setting must be reflected globally. During UAT, after the Admin updates a setting (e.g., maximum queue size) on the dashboard, we immediately switch to a Customer/User workflow to verify that the Queue service is enforcing the newly updated rule. 

**Q3: When testing error handling (like duplicate emails), why is it important to ensure the system returns a friendly message rather than a database error?**
*Answer:* Exposing raw database errors (like a SQL constraint violation trace) is a major security vulnerability, as it provides attackers with clues about our database structure. Furthermore, from a usability standard, an Admin needs a clear, actionable message (e.g., "This email is already in use") to quickly resolve their task, rather than guessing what went wrong.