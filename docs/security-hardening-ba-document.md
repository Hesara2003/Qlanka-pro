# Security Hardening Changes and Procedures - Business Analysis Document

## Project Context
**Project Name:** QueueLanka Pro
**System Type:** Microservices-based Queue Management System

---

## 1. 🎯 Business Objective
The primary business objective of implementing security hardening is to protect the organization's data, ensure customer privacy, and maintain the continuous availability of the QueueLanka Pro system. By proactively securing the application against external and internal threats, we prevent costly data breaches, maintain compliance with data protection regulations, and preserve customer trust in our digital services.

## 2. 📋 Security Enhancements Overview
Following the successful deployment of core features, the system underwent a comprehensive security hardening phase. The major improvements implemented include:
* **Strict Role-Based Access Control (RBAC):** Ensuring users only access features necessary for their job.
* **Comprehensive Input Validation:** Rejecting malicious or malformed data before it reaches the database.
* **Implementation of Security Headers:** Instructing web browsers to block common client-side attacks.
* **Vulnerability Remediation:** Conducting automated scans and fixing identified weaknesses in third-party libraries and custom code.

## 3. 🔐 RBAC Enforcement

### Defined Roles
* **Admin:** Full access to all system configurations, advanced ad-hoc reports, and organization-wide analytics.
* **Officer:** Limited access scoped to their assigned Service Center. Can manage active queues, call next tokens, and mark tokens as served/skipped.
* **User (Customer):** Can only book new appointments, view their own active tickets, and track live queue progress.

### Enforcement Mechanism
* Access control is enforced at both the Gateway layer (WSO2 API Manager / YARP) and the Microservice level. 
* Every request requires a valid, digitally signed authentication token (JWT) which contains the user's assigned role. If a user attempts to access an endpoint outside their role's permissions, the system immediately returns a `403 Forbidden` error.

## 4. 🛡️ Input Validation

### What is Validated
All data entering the system is strictly validated. This includes customer registration forms, appointment booking dates, search queries on the dashboard, and document uploads. 

### Why Validation is Important
Input validation acts as the first line of defense against injection attacks (like SQL Injection or Cross-Site Scripting). It ensures the system only processes expected, safe data and prevents attackers from manipulating the database or crashing the application.

### Examples of Validation Rules
* **Format Checking:** Email addresses must contain an "@" symbol and a valid domain.
* **Length Limits:** Customer names cannot exceed 100 characters; phone numbers must be exactly 10 digits.
* **Type Checking:** "Number of Customers" must be a positive integer, not text or negative values.
* **Sanitization:** Any HTML tags entered into text fields are automatically stripped out before saving.

## 5. 🌐 Security Headers

### Purpose of Security Headers
Security headers are instructions sent from our servers to the user's web browser. They tell the browser how to behave securely, effectively protecting the end-user without requiring them to install any antivirus software.

### Common Headers Used
* **Content-Security-Policy (CSP):** Restricts where the dashboard can load resources (like images or scripts) from, preventing attackers from injecting malicious scripts.
* **X-Frame-Options (DENY/SAMEORIGIN):** Prevents the QueueLanka Pro system from being embedded inside an attacker's fake website (Clickjacking protection).
* **Strict-Transport-Security (HSTS):** Forces the browser to strictly use encrypted HTTPS connections, preventing data interception on public Wi-Fi.

## 6. 🔍 Vulnerability Scan Results

### Summary of Scans
Automated Static Application Security Testing (SAST) and Software Composition Analysis (SCA) tools were integrated into the CI/CD pipeline to scan the codebase and third-party libraries.

### Types of Vulnerabilities Checked
* Outdated third-party packages with known flaws (CVEs).
* Hardcoded passwords or secret keys left in the code.
* Unhandled system errors that leak database information.

### Actions Taken
* **Package Updates:** All highlighted frontend Node packages and backend .NET NuGet packages were updated to their latest secure versions.
* **Secret Management:** Hardcoded database connection strings were removed and migrated to secure Azure Key Vaults.
* **Custom Error Pages:** Verbose error messages (stack traces) were disabled in production. Users now see a generic, friendly error message instead of system code.

## 7. 🧪 Validation & Testing Checklist
- [ ] Attempt to access the Admin Dashboard using an Officer account (Must result in Access Denied).
- [ ] Submit registration forms with extremely long text and special characters (Must be rejected).
- [ ] Inspect browser network traffic to confirm `Strict-Transport-Security` and `X-Frame-Options` headers are present.
- [ ] Leave an Admin session idle for 30 minutes; verify it automatically logs out.
- [ ] Run automated vulnerability scanners and ensure zero "Critical" or "High" severity alerts remain.

## 8. ⚠️ Risks & Edge Cases
* **Insider Threats:** RBAC prevents unauthorized access, but authorized personnel (like an Admin) could still misuse data. Logging and auditing are required to monitor for abnormal activity.
* **Zero-Day Vulnerabilities:** Newly discovered flaws in our third-party libraries (like React or .NET core) might exist before a patch is available.
* **Social Engineering:** Security hardening cannot prevent a user from voluntarily sharing their login password with a malicious actor.

## 9. 📘 Audit & Maintenance Guidelines

### Future Audits
* Conduct a professional third-party Penetration Test annually.
* Review all user accounts containing 'Admin' privileges every 3 months to ensure the access is still required.

### Monitoring Security
* Implement automated alerts for suspicious activities, such as 5 failed login attempts within a minute.
* Regularly monitor Gateway logs (via WSO2/YARP) to identify spikes in restricted endpoint access attempts.

### Updating Security Practices
* Keep vulnerability scanners updated with the latest threat definitions.
* Maintain a rapid-response plan to patch critical dependencies within 48 hours of a vulnerability being announced publicly.

## 10. 🧾 BA Summary
The completion of the security hardening phase ensures that QueueLanka Pro is robust, resilient, and enterprise-ready. By implementing strict Role-Based Access Controls, extensive input validation, and necessary security headers, we have significantly minimized the attack surface. Moving forward, continuous automated vulnerability scanning and regular security audits will maintain this secure posture throughout the system's operational lifecycle.

---

## 🎓 Academic / Viva Preparation section

**Q1: Why is Input Validation performed on both the Frontend (React) and the Backend (.NET Web API)? Why isn't the frontend enough?**
*Answer:* Frontend validation is primarily for User Experience (UX)—it gives the user immediate feedback if they type a phone number incorrectly. However, attackers can easily bypass the frontend and send malicious HTTP requests directly to the API using tools like Postman. Therefore, the Backend validation is the actual security barrier that protects the database, making "defense in depth" necessary.

**Q2: How does Role-Based Access Control (RBAC) scale when we add new Service Centers or hundreds of new Officers?**
*Answer:* In an RBAC system, permissions are tied to the *Role*, not the *User*. When we add 100 new Officers, we don't configure 100 individual sets of permissions. We simply assign them the "Officer" role, and they automatically inherit the correct security policies. This makes organizational scaling efficient and less prone to manual configuration errors.

**Q3: We implemented Security Headers like X-Frame-Options to prevent "Clickjacking." What exactly is Clickjacking from a business perspective?**
*Answer:* Clickjacking is when an attacker builds a malicious, invisible layer over our legitimate QueueLanka Pro website. A user might think they are clicking a button to "Book Appointment" on our site, but the invisible layer tricks them into clicking a hidden button that might, for example, authorize a password reset or transfer data. X-Frame-Options prevents our site from being loaded inside these malicious invisible frames.