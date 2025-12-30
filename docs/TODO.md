# Forked - Active TODO List

**Last Updated:** 2025-12-29

This file tracks active work items and immediate next steps. For the full roadmap, see [ROADMAP.md](./ROADMAP.md).

---

## ✅ Recently Completed

### MVP Feature #2 - Discovery & Browsing

**Goal:** Allow users to browse and discover rated dishes

**Status:** ✅ Complete (2025-12-29)

- [x] Design home feed UI/UX
- [x] Create ReviewCard component
- [x] Implement home feed with review list, pagination, and pull-to-refresh
- [x] Create dish detail page with reviews, photos, and venue info
- [x] Create venue detail page with all dishes and reviews
- [x] Add basic search functionality for dishes and venues
- [x] Implement loading states and empty states
- [x] Add photo gallery display
- [x] Build browse components (DishCardWithRating, PhotoGallery, SectionHeader, EmptyState)
- [x] Create custom hooks (useTopDishes, useSearch, useDishDetail, useVenueDetail)

**Deliverables:**
- 13 files created (4 screens, 5 components, 4 hooks)
- Home feed fully functional with pagination
- Search working for dishes and venues
- Complete browse and detail screens
- **Rating system changed from 1-5 stars to 0-10 numeric scale**

---

### MVP Feature #1 - Core Rating Flow

**Goal:** Enable users to rate dishes with photos and GPS verification

**Status:** ✅ Complete (2025-12-26)

- [x] Complete rating flow with 0-10 numeric rating scale
- [x] Photo system fully functional
- [x] GPS verification with distance calculation
- [x] Complete modal flow from venue search to success

**Deliverables:**
- 24 files created (5 screens, 6 components, 5 hooks, 1 context, types, migration)

---

## 🎯 Current Sprint: Review Interactions & Enhancements

**Goal:** Add helpful votes, review sorting, and user review management

**Status:** In Progress

### High Priority Tasks

- [ ] Implement helpful votes functionality
  - [ ] Add upvote/downvote UI to ReviewCard
  - [ ] Create useHelpfulVotes hook
  - [ ] Connect to helpful_votes table in Supabase
  - [ ] Handle vote creation, update, and deletion
  - [ ] Show vote counts on reviews
  - [ ] Prevent self-voting (enforce RLS policy)

- [ ] Implement review sorting
  - [ ] Add sort dropdown/picker component
  - [ ] Support "Most Helpful", "Most Recent", "Highest Rating", "Lowest Rating"
  - [ ] Update useDishDetail hook to accept sort parameter
  - [ ] Persist sort preference (optional)

- [ ] User's own review management
  - [ ] Highlight user's own review in review list
  - [ ] Add "Edit" button to user's review
  - [ ] Create edit review screen/modal
  - [ ] Implement review deletion with confirmation

### Next Steps

1. Start with helpful votes UI in ReviewCard
2. Create useHelpfulVotes hook for data management
3. Add sort dropdown to dish detail page
4. Implement user review highlighting and edit functionality

---

## 📋 Backlog (High Priority)

### MVP Features Waiting to Start

1. **Advanced Data Layer** (Deferred to V1.0)
   - React Query setup for caching
   - Optimistic updates
   - Offline support

2. **Testing & Quality** (Deferred to V1.0)
   - Unit tests for hooks and utilities
   - Component tests for UI
   - E2E tests for critical flows

3. **Production Polish** (Deferred to V1.0)
   - Error boundaries
   - Performance optimization
   - Analytics integration

### Completed Components

**Rating Flow:**
- ✅ NumericRating (0-10 scale input)
- ✅ VenueCard
- ✅ DishCard
- ✅ PhotoPicker
- ✅ SearchInput
- ✅ LocationStatusBanner

**Browse/Discovery:**
- ✅ ReviewCard
- ✅ DishCardWithRating
- ✅ PhotoGallery
- ✅ SectionHeader
- ✅ EmptyState

### Completed Systems

- ✅ Photo System (Supabase Storage, Camera/ImagePicker, Gallery Display)
- ✅ GPS/Location Services
- ✅ Custom Supabase query hooks (14 hooks total)
- ✅ Browse & Search functionality
- ✅ Home feed with pagination

---

## 🐛 Known Issues

_None reported yet_

**Note:** Test Core Rating Flow on physical device before marking as production-ready.

---

## 💡 Ideas / Future Considerations

- ✅ ~~Evaluate React Query vs. SWR for data fetching~~ (Deferred to V1.0)
- ✅ ~~Consider using Expo Image for better image performance~~ (Using Expo ImagePicker)
- ✅ ~~Implement pull-to-refresh on feed~~ (Complete)
- ✅ ~~Add pagination for review lists~~ (Complete via Load More)
- Research AI photo verification APIs (Google Vision, AWS Rekognition, etc.)
- Plan for app store submission requirements
- Consider analytics platform (Amplitude, Mixpanel, PostHog)
- Add image compression/optimization before upload (V1.0)
- Implement infinite scroll/virtualized lists for better performance (V1.0)
- Add review flagging/reporting (V1.0)

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
