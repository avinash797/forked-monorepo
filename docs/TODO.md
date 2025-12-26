# Forked - Active TODO List

**Last Updated:** 2025-12-25

This file tracks active work items and immediate next steps. For the full roadmap, see [ROADMAP.md](./ROADMAP.md).

---

## 🎯 Current Sprint: Setting Up Tracking System

**Goal:** Establish project management infrastructure

**Status:** In Progress

- [x] Create ROADMAP.md with MVP/V1/V2 phases
- [x] Create TODO.md for active work tracking
- [x] Create PROGRESS.md for completion metrics
- [x] Create DEVELOPMENT.md for workflow guidelines
- [x] Set up GitHub infrastructure (.github/ templates)
- [x] Create initial GitHub labels and milestones
- [x] Review and approve tracking system with team

---

## 🔥 Up Next: MVP Feature #1 - Core Rating Flow

**Status:** Blocked (waiting for tracking system approval)

### Tasks

- [ ] Design rating flow screens (wireframes/mockups)
- [ ] Create StarRating component
- [ ] Build "Rate a Dish" home screen entry point
- [ ] Implement venue selection screen
- [ ] Implement dish selection screen
- [ ] Implement rating submission screen
- [ ] Add photo upload functionality
- [ ] Integrate GPS location detection
- [ ] Connect to Supabase (submit review)
- [ ] Test end-to-end rating flow

---

## 📋 Backlog (High Priority)

### MVP Features Waiting to Start

1. **Discovery & Browsing**

   - Home feed with top dishes
   - Dish detail page
   - Venue detail page
   - Basic search functionality

2. **Photo System**

   - Supabase Storage integration
   - Camera/ImagePicker integration
   - Photo gallery component

3. **Review Display**

   - Review list component
   - Helpful votes UI
   - Review sorting

4. **Data Layer**

   - Supabase query functions
   - React Query setup
   - State management

5. **UI Components**
   - DishCard
   - VenueCard
   - ReviewCard
   - PhotoGallery
   - Loading/Error states

---

## 🐛 Known Issues

_None reported yet_

---

## 💡 Ideas / Future Considerations

- Consider using Expo Image for better image performance
- Evaluate React Query vs. SWR for data fetching
- Research AI photo verification APIs (Google Vision, AWS Rekognition, etc.)
- Plan for app store submission requirements
- Consider analytics platform (Amplitude, Mixpanel, PostHog)

---

## 📝 Notes

- Keep this file focused on **current sprint + next 1-2 sprints**
- Move completed items to PROGRESS.md for historical tracking
- Update weekly or as tasks change
- Link to relevant GitHub issues when they exist

---

## Task Status Legend

- `[ ]` - Not started
- `[~]` - In progress
- `[x]` - Completed
- `[!]` - Blocked
- `[-]` - Cancelled/Won't do
