# Forked Tracking System Overview

**Created:** 2025-12-25

This document explains the project management and tracking system for Forked.

---

## 📋 System Components

The tracking system consists of **two layers** working together:

### 1. Markdown Files (Local, Version-Controlled)

Fast, offline-friendly documentation in the `docs/` directory.

### 2. GitHub Infrastructure (Cloud-Based, Collaborative)

Issue tracking, project boards, and CI/CD automation.

---

## 📂 Markdown Files

### [ROADMAP.md](./ROADMAP.md)

**Purpose:** High-level feature roadmap organized by phases (MVP → V1.0 → V2.0)

**What it contains:**

- Current project status (85% complete)
- MVP v0.1 pivot direction and implementation phases
- The 5 screens and their status
- Launch strategy (NOLA cold-start)
- Progress metrics and completion tracking
- Success criteria for launch

**When to update:**

- When features are added/removed
- When priorities change
- Weekly during active MVP development
- After completing major features

**Who uses it:**

- Product owners to track vision and scope
- Developers to understand big-picture priorities
- Stakeholders to see progress toward release

---

### [TODO.md](./TODO.md)

**Purpose:** Active work tracking for current sprint (1-2 weeks)

**What it contains:**

- Current sprint goals and status
- Tasks in progress
- Next 1-2 sprints in backlog
- Known issues
- Ideas for future consideration

**When to update:**

- Daily as tasks progress
- Weekly sprint planning
- When starting/completing tasks
- When blockers are discovered

**Who uses it:**

- Developers for day-to-day work tracking
- Team leads for sprint planning
- Anyone wondering "what's being worked on right now?"

---

### [PROGRESS.md](./PROGRESS.md)

**Purpose:** Completion metrics and historical progress tracking

**What it contains:**

- Overall project completion percentage (currently 85%)
- Progress by phase (Backend 100%, Hooks 100%, Screens 85%, Components 70%, Rating Flow 100%)
- Progress by feature area
- Historical weekly updates
- Key metrics (files, LOC, tables, components)
- Milestone tracking

**When to update:**

- Weekly during active development
- After completing features
- When milestones are reached
- Monthly for V2.0 planning

**Who uses it:**

- Project managers to report progress
- Developers to celebrate wins
- Stakeholders to track velocity

---

### [DEVELOPMENT.md](./DEVELOPMENT.md)

**Purpose:** Developer workflow and contribution guide

**What it contains:**

- Getting started guide
- Project structure explanation
- Development workflow (branching, commits, PRs)
- Coding standards and conventions
- Testing strategy
- Supabase integration patterns
- Debugging tips
- Performance and security best practices
- Release process

**When to update:**

- When workflow changes
- When new patterns are introduced
- When tooling is added/updated
- Quarterly review for accuracy

**Who uses it:**

- New developers onboarding
- Contributors following conventions
- Anyone setting up the project locally

---

### [forked_v0.1_spec.md](./forked_v0.1_spec.md)

**Purpose:** MVP v0.1 product specification (reference document)

**What it contains:**

- Core concept: Elo-based "This vs That" dish comparisons
- The 5 screens specification
- ELO algorithm and confidence scoring
- Verification layer (photo, GPS, time window)
- Launch dishes (5 NOLA dish types)
- Cold-start strategy for New Orleans
- Success metrics

**When to update:**

- RARELY - only when product requirements fundamentally change
- Product vision shifts
- Major pivots

**Who uses it:**

- Everyone to understand the product vision
- Product owners for requirements
- Designers for UX guidance
- Developers for context

---

## 🐙 GitHub Infrastructure

### Issue Templates (`.github/ISSUE_TEMPLATE/`)

**feature_request.md**

- For proposing new features
- Includes phase assignment (MVP/V1.0/V2.0)
- Tracks problem statement, solution, technical considerations

**bug_report.md**

- For reporting bugs
- Includes severity levels, reproduction steps, environment details
- Tracks frequency and impact

**task.md**

- For development tasks
- Includes acceptance criteria, effort estimates, dependencies
- Links to parent features

**When to use:**

- Create issues directly from ROADMAP.md features
- Bug reports from testing or user feedback
- Break down large features into smaller tasks

---

### Pull Request Template (`.github/PULL_REQUEST_TEMPLATE.md`)

**Purpose:** Standardize PR descriptions and checklists

**What it includes:**

- Description and related issues
- Type of change (feature, bug, refactor, etc.)
- Testing checklist
- Code quality checklist
- Documentation checklist
- Security considerations

**When to use:**

- Every PR to `develop` or `main`
- Ensures consistent quality and documentation

---

### CI Workflow (`.github/workflows/ci.yml`)

**Purpose:** Automated code quality checks

**What it does:**

- Runs ESLint on every PR
- Runs TypeScript type checking
- (Future) Runs automated tests
- (Future) Uploads code coverage

**When it runs:**

- On every push to `develop` or `main`
- On every pull request

---

### GitHub Setup Guide (`.github/GITHUB_SETUP.md`)

**Purpose:** Step-by-step guide to configure GitHub repository

**What it covers:**

- Creating labels (priority, type, phase, status, area)
- Setting up milestones (MVP, V1.0, V2.0)
- Creating project board (Kanban-style)
- Branch protection rules
- Creating initial issues
- Configuring notifications
- Team setup

**When to use:**

- Initial repository setup
- Onboarding new maintainers
- Reference when configuring new repos

---

## 🔄 How to Keep Markdown and GitHub in Sync

### Weekly Workflow

**Monday - Sprint Planning:**

1. Review ROADMAP.md to prioritize features
2. Create/update GitHub issues for current sprint
3. Move issues to "Ready" on project board
4. Update TODO.md with current sprint tasks
5. Assign issues to team members

**During the Week - Daily Updates:**

1. Move assigned issues to "In Progress" when starting
2. Update TODO.md task status ([ ] → [~] → [x])
3. Create PRs when features are ready
4. Move PRs to "In Review" on project board
5. Merge PRs after approval
6. Move issues to "Done" on project board

**Friday - Weekly Review:**

1. Update PROGRESS.md with completed features
2. Calculate new completion percentages
3. Update ROADMAP.md progress metrics
4. Review and groom backlog
5. Close completed issues
6. Celebrate wins!

---

## 📊 Progress Calculation

### Overall Progress Formula

**Overall % = weighted average of (Backend, Hooks, Screens, Components, Rating Flow, Venue Search)**

**Current Calculation:**

- Backend (Database/RPC): 100%
- Data Layer (Hooks): 100%
- Core Screens: 85%
- Components: 70%
- Rating Flow: 100%
- Venue Search: 100%
- **Overall: ~85%**

### Feature Progress Tracking

Each feature area tracks completion as:

- 0% - Not started
- 25% - Designed/Planned
- 50% - In progress
- 75% - Implemented, needs testing
- 100% - Complete, tested, merged

---

## 🎯 Quick Reference

### "I want to..."

**...see the big picture and long-term plan**
→ Read [ROADMAP.md](./ROADMAP.md)

**...know what's being worked on right now**
→ Read [TODO.md](./TODO.md)

**...check overall progress**
→ Read [PROGRESS.md](./PROGRESS.md)

**...understand the product vision**
→ Read [app-idea.md](./app-idea.md)

**...set up the project locally**
→ Read [DEVELOPMENT.md](./DEVELOPMENT.md)

**...create a feature request**
→ Use GitHub issue template: `feature_request.md`

**...report a bug**
→ Use GitHub issue template: `bug_report.md`

**...submit a PR**
→ Use GitHub PR template

**...set up GitHub infrastructure**
→ Follow [GITHUB_SETUP.md](../.github/GITHUB_SETUP.md)

---

## ✅ Best Practices

### For Solo Developers

1. **Keep it simple:** Update TODO.md daily, PROGRESS.md weekly
2. **Use GitHub sparingly:** Create issues for major features only
3. **Focus on ROADMAP.md:** This is your north star
4. **Celebrate progress:** Update PROGRESS.md to see how far you've come

### For Small Teams (2-5 people)

1. **Use both systems:** Markdown for planning, GitHub for execution
2. **Weekly syncs:** Review PROGRESS.md and TODO.md together
3. **Create issues:** Break ROADMAP features into GitHub issues
4. **Use project board:** Visualize work in progress
5. **Automate what you can:** Let CI handle linting and type checking

### For Larger Teams (5+ people)

1. **GitHub-first:** Make GitHub the source of truth
2. **Sync markdown weekly:** Auto-generate from GitHub data if possible
3. **Use milestones:** Track progress with GitHub milestones
4. **Enforce PR reviews:** Require approvals before merging
5. **Sprint planning:** Use GitHub project board for sprint planning

---

## 🚀 Getting Started with the Tracking System

### Step 1: Review the Roadmap

Read [ROADMAP.md](./ROADMAP.md) to understand the feature plan.

### Step 2: Set Up GitHub (Optional)

Follow [GITHUB_SETUP.md](../.github/GITHUB_SETUP.md) to configure labels, milestones, and project board.

### Step 3: Start Your First Sprint

1. Pick the first MVP feature from ROADMAP.md
2. Add tasks to TODO.md
3. (Optional) Create GitHub issue
4. Start coding!

### Step 4: Track Your Progress

1. Update TODO.md as you work
2. When feature is complete, update PROGRESS.md
3. Update ROADMAP.md progress percentage
4. Move to next feature!

---

## 📞 Questions?

- **Tracking system questions:** Review this document or [DEVELOPMENT.md](./DEVELOPMENT.md)
- **Technical questions:** Check [DEVELOPMENT.md](./DEVELOPMENT.md)
- **Product questions:** Check [app-idea.md](./app-idea.md)
- **GitHub setup:** Check [GITHUB_SETUP.md](../.github/GITHUB_SETUP.md)

---

**Happy tracking!** 📊
