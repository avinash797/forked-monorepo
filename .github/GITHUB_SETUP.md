# GitHub Project Setup Guide

This guide will help you set up the GitHub repository infrastructure for Forked.

---

## 🏷️ Step 1: Create Labels

Navigate to **Settings → Labels** in your GitHub repository and create these labels:

### Priority Labels
- `priority: critical` - 🔴 Red (#d73a4a) - Critical issues/features
- `priority: high` - 🟠 Orange (#d93f0b) - High priority
- `priority: medium` - 🟡 Yellow (#fbca04) - Medium priority
- `priority: low` - 🟢 Green (#0e8a16) - Low priority

### Type Labels
- `feature-request` - 💡 Light Blue (#0075ca) - New feature request
- `bug` - 🐛 Red (#d73a4a) - Bug report
- `task` - 📋 Gray (#6c757d) - Development task
- `documentation` - 📚 Blue (#0052cc) - Documentation changes
- `enhancement` - ✨ Teal (#1d76db) - Enhancement to existing feature
- `refactoring` - 🔧 Purple (#5319e7) - Code refactoring
- `testing` - 🧪 Pink (#e99695) - Testing related

### Phase Labels
- `mvp` - 🚀 Dark Blue (#0e4c92) - MVP phase feature
- `v1.0` - 🎯 Blue (#1d76db) - V1.0 phase feature
- `v2.0` - 🌟 Light Blue (#54aeff) - V2.0 phase feature

### Status Labels
- `status: blocked` - 🚫 Red (#b60205) - Blocked by dependency
- `status: in-progress` - 🔄 Yellow (#fbca04) - Currently being worked on
- `status: ready` - ✅ Green (#0e8a16) - Ready to work on
- `status: needs-review` - 👀 Purple (#5319e7) - Needs code review

### Area Labels
- `area: auth` - 🔐 Orange (#d93f0b) - Authentication related
- `area: ui` - 🎨 Pink (#e99695) - UI/UX related
- `area: database` - 🗄️ Gray (#6c757d) - Database related
- `area: api` - 🔌 Teal (#1d76db) - API related
- `area: infra` - ⚙️ Dark Gray (#495057) - Infrastructure/DevOps

### Special Labels
- `good first issue` - 🌱 Light Green (#7057ff) - Good for newcomers
- `help wanted` - 🙋 Pink (#d876e3) - Need help with this
- `duplicate` - ⚠️ Gray (#cfd3d7) - Duplicate issue
- `wontfix` - ❌ White (#ffffff) - Will not be fixed

---

## 🎯 Step 2: Create Milestones

Navigate to **Issues → Milestones** and create:

### MVP Milestone
- **Title:** MVP - Core Rating Functionality
- **Due Date:** [Set your target date]
- **Description:**
  ```
  Ship a functional dish rating app with core features:
  - Rate dishes with star ratings and photos
  - Browse top-rated dishes
  - Search for venues and dishes
  - GPS verification
  - Photo upload system

  Target: 80% project completion
  ```

### V1.0 Milestone
- **Title:** V1.0 - Full Feature Set
- **Due Date:** [Set your target date]
- **Description:**
  ```
  Complete all features from the product specification:
  - Gamification and charms
  - Advanced search and filters
  - User profiles and social features
  - Review management
  - Price tracking
  - Testing and production polish

  Target: 100% project completion
  ```

### V2.0 Milestone
- **Title:** V2.0 - Advanced Features
- **Due Date:** [TBD]
- **Description:**
  ```
  Future enhancements and ecosystem expansion:
  - Advanced social features
  - Restaurant partnerships
  - Smart recommendations
  - Advanced gamification

  Target: Innovation and growth features
  ```

---

## 📊 Step 3: Create GitHub Project Board

Navigate to **Projects** and create a new project:

### Board Setup
1. **Project Name:** Forked Development
2. **Template:** Board (Kanban)
3. **Description:** Track Forked app development from MVP to V2.0

### Columns to Create
1. **Backlog** - Not yet prioritized or scheduled
2. **Ready** - Prioritized and ready to start
3. **In Progress** - Currently being worked on
4. **In Review** - PR submitted, awaiting review
5. **Done** - Completed and merged

### Board Settings
- **Visibility:** Private (or Public if open source)
- **Automation:**
  - Move issues to "In Progress" when assigned
  - Move PRs to "In Review" when opened
  - Move to "Done" when PR merged or issue closed

---

## 🔀 Step 4: Branch Protection Rules

Navigate to **Settings → Branches → Add branch protection rule**:

### Protect `main` Branch
- **Branch name pattern:** `main`
- **Settings:**
  - ✅ Require a pull request before merging
    - ✅ Require approvals (1 minimum)
    - ✅ Dismiss stale pull request approvals when new commits are pushed
  - ✅ Require status checks to pass before merging
    - ✅ Require branches to be up to date before merging
    - **Status checks:** lint, typecheck (add test when implemented)
  - ✅ Require conversation resolution before merging
  - ✅ Do not allow bypassing the above settings (unless you're solo)

### Protect `develop` Branch (Optional)
- **Branch name pattern:** `develop`
- **Settings:**
  - ✅ Require a pull request before merging
  - ✅ Require status checks to pass before merging
    - **Status checks:** lint, typecheck

---

## 📋 Step 5: Create Initial Issues

Create these starter issues to track MVP features:

### Issue 1: Core Rating Flow
```markdown
Title: [MVP] Implement Core Rating Flow
Labels: feature-request, mvp, priority: critical, area: ui
Milestone: MVP - Core Rating Functionality

Description:
Implement the complete dish rating flow including venue selection,
dish selection, star rating input, photo upload, and submission.

See docs/ROADMAP.md for detailed requirements.
```

### Issue 2: Discovery & Browsing
```markdown
Title: [MVP] Implement Discovery & Browsing Screens
Labels: feature-request, mvp, priority: critical, area: ui
Milestone: MVP - Core Rating Functionality

Description:
Build home feed, dish detail pages, venue detail pages, and basic search.

See docs/ROADMAP.md for detailed requirements.
```

### Issue 3: Photo System
```markdown
Title: [MVP] Implement Photo Upload System
Labels: feature-request, mvp, priority: critical, area: api
Milestone: MVP - Core Rating Functionality

Description:
Integrate Supabase Storage, camera/image picker, and photo gallery display.

See docs/ROADMAP.md for detailed requirements.
```

_Continue creating issues for remaining MVP features..._

---

## 🔔 Step 6: Configure Notifications

Navigate to **Settings → Notifications**:

### Recommended Settings
- **Email notifications:**
  - ✅ Pull request reviews
  - ✅ Pull request pushes
  - ✅ Issues assigned to you
  - ✅ Mentions

- **Web notifications:**
  - ✅ All notifications

---

## 🤝 Step 7: Set Up Team (If Applicable)

Navigate to **Settings → Collaborators and teams**:

1. **Add collaborators:** Invite team members with appropriate permissions
2. **Create teams:** (e.g., "Core Team", "Contributors")
3. **Set permissions:**
   - **Admin:** Full access (for core maintainers)
   - **Write:** Can push to develop, create PRs (for developers)
   - **Read:** Can view and clone (for external contributors)

---

## 📝 Step 8: Configure Repository Settings

Navigate to **Settings → General**:

### Features to Enable
- ✅ Issues
- ✅ Projects
- ✅ Discussions (optional - for feature discussions)
- ✅ Wiki (optional - for extended documentation)

### Pull Requests
- ✅ Allow squash merging (recommended for clean history)
- ✅ Automatically delete head branches (keeps repo clean)
- ✅ Allow auto-merge

### Danger Zone
- Set default branch to `develop` (not `main`)

---

## 🔄 Step 9: Sync Markdown with GitHub

### Workflow for Keeping Docs in Sync

1. **Create issues from ROADMAP.md features:**
   - Each high-level feature becomes a GitHub issue
   - Tag with appropriate phase label (mvp, v1.0, v2.0)
   - Assign to milestone
   - Add to project board

2. **Update TODO.md from active issues:**
   - Pull current sprint issues from GitHub Project board
   - Keep TODO.md aligned with "In Progress" column
   - Update weekly

3. **Update PROGRESS.md from completed issues:**
   - When issues are closed, update completion percentages
   - Link to merged PRs for reference
   - Update progress metrics weekly

### Automation Ideas (Optional)
- Use GitHub Actions to auto-update PROGRESS.md when issues close
- Create a script to generate TODO.md from GitHub Project board
- Set up weekly automated reminders to update docs

---

## ✅ Checklist

Before you're done setting up GitHub, ensure:

- [ ] All labels created
- [ ] Milestones created with target dates
- [ ] Project board created and configured
- [ ] Branch protection rules set for `main` and `develop`
- [ ] Initial MVP issues created
- [ ] Team members added (if applicable)
- [ ] Repository settings configured
- [ ] CI workflow is running successfully
- [ ] ROADMAP.md, TODO.md, and PROGRESS.md exist in repo
- [ ] First issue assigned and moved to "Ready" or "In Progress"

---

## 🚀 You're Ready!

Your GitHub repository is now fully configured for tracking Forked's development.

**Next steps:**
1. Review and approve the tracking system
2. Create initial issues from ROADMAP.md
3. Assign first issue to yourself
4. Move it to "In Progress" on the project board
5. Start building the MVP!

---

**Questions?** Refer to [DEVELOPMENT.md](../docs/DEVELOPMENT.md) for workflow guidance.
