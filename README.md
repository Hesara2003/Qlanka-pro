# Qlanka-pro

QueueLanka Pro is a smart queue management platform with token booking, live queue handling, admin analytics, and a full DevOps pipeline (CI/CD, testing, monitoring, performance).

---

## Repository Structure

```
Qlanka-pro/
├── frontend/   # React/Next.js client application
└── backend/    # Node.js / API server
```

---

## Branching Strategy

This project follows a **GitFlow-inspired** branching model to keep the codebase stable, organised, and sprint-ready.

### Branch Overview

| Branch | Purpose |
|---|---|
| `main` | Always stable and production/demo-ready. Only receives merges from `develop` at the end of each sprint. |
| `develop` | Integration branch. All feature branches merge here first. Represents the latest completed work. |
| `feature/<area>-<description>` | One branch per user story or subtask. Created from `develop`, merged back via Pull Request. |
| `hotfix/<bug-name>` | Urgent fixes applied directly on top of `main`. After fixing, merged into **both** `main` and `develop`. |

---

### Branch Naming Conventions

| Type | Pattern | Example |
|---|---|---|
| Feature | `feature/<area>-<short-description>` | `feature/auth-login`, `feature/centers-api`, `feature/booking-ui` |
| Hotfix | `hotfix/<bug-name>` | `hotfix/login-nullref`, `hotfix/token-overflow` |
| Sprint tag | `sprint-X-demo` | `sprint-1-demo`, `sprint-2-demo` |
| Final release | `v1.0-final` | `v1.0-final` |

---

### Step-by-Step Developer Workflow

#### 1. Start a new feature

Always branch off `develop`:

```bash
git checkout develop
git pull origin develop
git checkout -b feature/auth-login
```

#### 2. Work and commit

```bash
git add .
git commit -m "feat(auth): implement login endpoint"
git push origin feature/auth-login
```

#### 3. Open a Pull Request

- Go to GitHub → **Pull Requests** → **New Pull Request**
- **Base:** `develop` | **Compare:** `feature/auth-login`
- Add a description, link the related issue, and request a reviewer
- CI checks must pass before merging

#### 4. Merge into develop

Once approved and CI passes, merge via GitHub UI (or locally):

```bash
git checkout develop
git pull origin develop
git merge --no-ff feature/auth-login
git push origin develop

# Clean up the feature branch
git branch -d feature/auth-login
git push origin --delete feature/auth-login
```

#### 5. Sprint release — merge develop → main and tag

At the end of each sprint:

```bash
git checkout main
git pull origin main
git merge --no-ff develop
git push origin main

# Tag the sprint release
git tag -a sprint-1-demo -m "Sprint 1 demo release"
git push origin sprint-1-demo
```

Repeat for subsequent sprints: `sprint-2-demo`, `sprint-3-demo`, `sprint-4-demo`.

#### 6. Final release

```bash
git checkout main
git tag -a v1.0-final -m "Version 1.0 final release"
git push origin v1.0-final
```

---

### Hotfix Workflow

For urgent production bugs:

```bash
# Branch from main
git checkout main
git pull origin main
git checkout -b hotfix/login-nullref

# Fix, commit, push
git add .
git commit -m "fix(auth): handle null user reference on login"
git push origin hotfix/login-nullref

# Merge into main
git checkout main
git merge --no-ff hotfix/login-nullref
git push origin main

# Also merge into develop to keep it in sync
git checkout develop
git merge --no-ff hotfix/login-nullref
git push origin develop

# Clean up
git branch -d hotfix/login-nullref
git push origin --delete hotfix/login-nullref
```

---

### Protected Branches

Both `main` and `develop` are **protected branches**. Configure the following in **GitHub → Settings → Branches → Branch protection rules** for each:

- ✅ Require a pull request before merging
- ✅ Require at least 1 approving review
- ✅ Require status checks to pass before merging
- ✅ Do not allow bypassing the above settings
- ✅ Restrict who can push to matching branches

> **No direct pushes to `main` or `develop` are allowed.** All changes must go through a Pull Request.

---

### Sprint Release Schedule

| Tag | Description |
|---|---|
| `sprint-1-demo` | End of Sprint 1 |
| `sprint-2-demo` | End of Sprint 2 |
| `sprint-3-demo` | End of Sprint 3 |
| `sprint-4-demo` | End of Sprint 4 |
| `v1.0-final` | Final production release |
