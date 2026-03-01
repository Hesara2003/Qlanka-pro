# Branching Strategy

This project follows a **Jira-friendly GitFlow** branching model, linking every branch directly to a Jira ticket for full traceability across tickets, branches, PRs, commits, and releases.

---

## 🌳 Main Branches

| Branch | Purpose |
|---|---|
| `main` | Always production-ready. Only receives code via Pull Requests. Each merge represents a release or stable version. |
| `develop` | Integration branch for the upcoming release. All features and fixes merge here first. This is where QA/testing happens. |

---

## 🌿 Working Branches (Linked to Jira Tickets)

Create one branch per Jira issue using the formats below.

### ✨ Feature Branches — new features

```
feature/JIRA-123-user-login
```

### 🐛 Bugfix Branches — non-urgent bugs

```
bugfix/JIRA-456-fix-null-pointer
```

### 🚑 Hotfix Branches — urgent production fixes (branch from `main`)

```
hotfix/JIRA-789-crash-on-startup
```

---

## 🔗 How This Connects to Jira

Given a Jira ticket such as **SCRUM-37 – Design token booking API**, the corresponding branch is:

```
feature/SCRUM-37-token-booking-api
```

**Benefits:**

- Jira automatically links commits and PRs to the ticket
- Progress is visible per issue
- Clean traceability: **Ticket → Branch → PR → Commit → Release**

---

## 🔁 Typical Workflow

### 1. Start from `develop` and create your branch

```bash
git checkout develop
git pull origin develop
git checkout -b feature/SCRUM-37-token-booking-api
```

### 2. Commit with the Jira issue key in the message

```bash
git add .
git commit -m "SCRUM-37: Implement token booking API"
git push origin feature/SCRUM-37-token-booking-api
```

### 3. Open a Pull Request → `develop`

- **Base:** `develop` | **Compare:** `feature/SCRUM-37-token-booking-api`
- Include the Jira issue key in the PR title (e.g. `SCRUM-37: Add token booking endpoint`)
- Request a reviewer — CI checks must pass before merging

### 4. After review + tests → merge into `develop`

```bash
git checkout develop
git pull origin develop
git merge --no-ff feature/SCRUM-37-token-booking-api
git push origin develop

# Clean up
git branch -d feature/SCRUM-37-token-booking-api
git push origin --delete feature/SCRUM-37-token-booking-api
```

### 5. When the release is ready — merge `develop` → `main`

```bash
git checkout main
git pull origin main
git merge --no-ff develop
git push origin main

# Tag the release
git tag -a sprint-1-demo -m "Sprint 1 demo release"
git push origin sprint-1-demo
```

---

## 🚨 Hotfix Flow (If Production Breaks)

```bash
# Branch from main
git checkout main
git pull origin main
git checkout -b hotfix/SCRUM-99-fix-payment-crash

# Fix, commit, push
git add .
git commit -m "SCRUM-99: Fix payment crash on checkout"
git push origin hotfix/SCRUM-99-fix-payment-crash

# PR → main, then merge into main
git checkout main
git merge --no-ff hotfix/SCRUM-99-fix-payment-crash
git push origin main

# Also merge back into develop to keep it in sync
git checkout develop
git merge --no-ff hotfix/SCRUM-99-fix-payment-crash
git push origin develop

# Clean up
git branch -d hotfix/SCRUM-99-fix-payment-crash
git push origin --delete hotfix/SCRUM-99-fix-payment-crash
```

---

## 📛 Naming Rules (Important for Jira)

Always include the **Jira Issue Key** in:

| Where | Required | Example |
|---|---|---|
| Branch name | ✅ | `feature/SCRUM-37-token-booking-api` |
| Commit message | ✅ | `SCRUM-37: Implement token booking API` |
| PR title | ✅ | `SCRUM-37: Add token booking endpoint` |

---

## 🔒 Protected Branches

Both `main` and `develop` are **protected branches**. Configure the following in **GitHub → Settings → Branches → Branch protection rules**:

- ✅ Require a pull request before merging
- ✅ Require at least 1 approving review
- ✅ Require status checks to pass before merging
- ✅ Do not allow bypassing the above settings
- ✅ Restrict who can push to matching branches

> **No direct pushes to `main` or `develop` are allowed.** All changes must go through a Pull Request.

---

## Sprint Release Schedule

| Tag | Description |
|---|---|
| `sprint-1-demo` | End of Sprint 1 |
| `sprint-2-demo` | End of Sprint 2 |
| `sprint-3-demo` | End of Sprint 3 |
| `sprint-4-demo` | End of Sprint 4 |
| `v1.0-final` | Final production release |
