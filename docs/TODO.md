# Forked - Active TODO List

**Last Updated:** 2025-12-26

This file tracks active work items and immediate next steps. For the full roadmap, see [ROADMAP.md](./ROADMAP.md).

---

## ✅ Recently Completed: MVP Feature #1 - Core Rating Flow

**Goal:** Enable users to rate dishes with photos and GPS verification

**Status:** ✅ Complete (2025-12-26)

- [x] Design rating flow screens (wireframes/mockups)
- [x] Create StarRating component
- [x] Build "Rate a Dish" home screen entry point (FloatingActionButton)
- [x] Implement venue selection screen with search and GPS proximity
- [x] Implement dish selection screen with create dish capability
- [x] Implement rating submission screen
- [x] Add photo upload functionality (camera + gallery)
- [x] Integrate GPS location detection and verification
- [x] Configure Supabase Storage bucket with RLS policies
- [x] Connect to Supabase (submit review)
- [x] Test end-to-end rating flow

**Deliverables:**
- 24 files created (5 screens, 6 components, 5 hooks, 1 context, types, migration)
- Photo system fully functional
- GPS verification with distance calculation
- Complete modal flow from venue search to success

---

## 🎯 Current Sprint: MVP Feature #2 - Discovery & Browsing

**Goal:** Allow users to browse and discover rated dishes

**Status:** Not Started

### High Priority Tasks

- [ ] Design home feed UI/UX
- [ ] Create ReviewCard component
- [ ] Implement home feed with review list
- [ ] Create dish detail page
- [ ] Create venue detail page
- [ ] Add basic search functionality
- [ ] Implement review sorting (newest, highest rated, nearby)
- [ ] Add photo gallery display
- [ ] Connect helpful votes interaction

### Next Steps

1. Start with home feed design (review list on main screen)
2. Build ReviewCard component showing dish photo, rating, venue
3. Create dish detail page to view all reviews for a dish
4. Add navigation from review cards to detail pages

---

## 📋 Backlog (High Priority)

### MVP Features Waiting to Start

1. **Review Display & Interaction** (Part of Discovery)

   - Helpful votes UI and interaction
   - Review sorting options (newest, top-rated, nearby)
   - Review flagging/reporting

2. **Advanced Data Layer**

   - React Query setup for caching
   - Optimistic updates
   - Offline support

3. **Enhanced UI Components**
   - ReviewCard with all metadata ✅ (needed for Discovery)
   - PhotoGallery with lightbox
   - Loading skeletons
   - Error boundaries

### Completed Components (from Core Rating Flow)

- ✅ StarRating
- ✅ VenueCard
- ✅ DishCard
- ✅ PhotoPicker
- ✅ SearchInput
- ✅ LocationStatusBanner

### Completed Systems

- ✅ Photo System (Supabase Storage, Camera/ImagePicker)
- ✅ GPS/Location Services
- ✅ Basic Supabase query hooks

---

## 🐛 Known Issues

_None reported yet_

**Note:** Test Core Rating Flow on physical device before marking as production-ready.

---

## 💡 Ideas / Future Considerations

- ✅ ~~Evaluate React Query vs. SWR for data fetching~~ (Deferred to V1.0)
- ✅ ~~Consider using Expo Image for better image performance~~ (Using Expo ImagePicker)
- Research AI photo verification APIs (Google Vision, AWS Rekognition, etc.)
- Plan for app store submission requirements
- Consider analytics platform (Amplitude, Mixpanel, PostHog)
- Add image compression/optimization before upload (V1.0)
- Implement pull-to-refresh on feed
- Add infinite scroll for review lists

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
