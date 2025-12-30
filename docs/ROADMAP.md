# Forked - Product Roadmap

**Last Updated:** 2025-12-26

## Overview

This roadmap tracks the development of Forked from its current foundation (30% complete) through MVP launch and beyond. The project is organized into three phases:

- **MVP (Minimum Viable Product)**: Core rating functionality - ship a usable product
- **V1.0 (First Full Release)**: Complete feature set from product spec
- **V2.0 (Future Enhancements)**: Advanced features and polish

---

## Current Status: 57% Complete (+20% from Discovery & Browsing)

### ✅ Completed (Foundation + MVP Features #1 & #2)

- Authentication system (signup, login, password reset, profile management)
- Database schema (17 migrations: 11 tables + 1 storage bucket + seed data)
- UI component library (themed components, navigation structure)
- App architecture (Expo Router, TypeScript, theme system)
- User profile viewing
- **Core Rating Flow** (venue search, dish selection, rating submission with 0-10 scale) 🎉
- **Photo System** (camera, gallery, Supabase Storage upload, photo gallery display)
- **GPS Verification** (location services, distance calculation)
- **Discovery & Browsing** (home feed, search, dish/venue detail pages) 🎉

### 🚧 In Progress

- Review display enhancements (helpful votes, sorting)

### ❌ Not Started

- Review display & interaction
- Advanced search & filters
- User profiles & social features
- Gamification UI

---

## 📱 MVP Phase - Target: 80% Complete

**Goal:** Ship a functional dish rating app with core verification features.

**Target Completion:** [Set your target date]

### MVP Features (Priority Order)

#### 1. Core Rating Flow (Critical - 25% of MVP) ✅ COMPLETE

**Status:** ✅ Complete | **Progress:** 100% | **Completed:** 2025-12-26

- [x] "Rate a Dish" entry point on home screen (FloatingActionButton)
- [x] Venue selection screen (search + GPS proximity)
- [x] Dish selection screen (browse existing or add new)
- [x] Rating submission screen (0-10 numeric rating, photo, review text)
- [x] Photo capture/upload functionality (camera + gallery)
- [x] GPS location detection and verification (with Haversine distance)
- [x] Review confirmation and submission to Supabase
- [x] Supabase Storage bucket configuration with RLS policies

**Success Criteria:** ✅ ALL MET

- ✅ User can find a nearby venue
- ✅ User can select or create a dish
- ✅ User can rate with 0-10 scale + photo (required) + optional text
- ✅ Review saves to database with GPS verification status

**Implementation Details:**
- 24 files created (5 screens, 6 components, 5 hooks, 1 context, types, migration)
- Modal presentation for clean UX
- Distance-based venue sorting
- Photo requirement enforced before submission
- GPS warning displayed but non-blocking

---

#### 2. Discovery & Browsing (Critical - 20% of MVP) ✅ COMPLETE

**Status:** ✅ Complete | **Progress:** 100% | **Completed:** 2025-12-29

- [x] Home feed showing top-rated dishes with pagination and pull-to-refresh
- [x] Dish detail page (ratings, photos, reviews, venue info)
- [x] Venue detail page (all dishes, location, reviews, photos)
- [x] Basic search (by dish name or venue name)
- [x] Loading states and empty states for all screens
- [ ] Advanced filters (location radius, price range) - deferred to V1.0

**Success Criteria:** ✅ ALL MET

- ✅ User can browse top dishes on home screen
- ✅ User can view all reviews for a dish
- ✅ User can find specific dishes or venues via search

**Implementation Details:**
- 4 new screens (browse layout, search, dish detail, venue detail)
- 5 browse components (ReviewCard, DishCardWithRating, PhotoGallery, SectionHeader, EmptyState)
- 4 new hooks (useTopDishes, useSearch, useDishDetail, useVenueDetail)
- Pull-to-refresh and infinite scroll
- Loading skeletons for better UX

---

#### 3. Photo System (Critical - 15% of MVP) ✅ COMPLETE

**Status:** ✅ Complete | **Progress:** 100% | **Completed:** 2025-12-29

- [x] Photo upload to Supabase Storage (review-photos bucket)
- [x] Camera integration (Expo ImagePicker - camera + gallery)
- [x] Photo picker component with preview and delete
- [x] Photo requirement enforcement (required for ratings)
- [x] Storage bucket RLS policies configured
- [x] Photo gallery display on dish detail pages
- [ ] Basic image compression/optimization (deferred to V1.0)
- [ ] Photo moderation status display (deferred to V1.0)

**Success Criteria:** ✅ ALL MET

- ✅ User can take or upload photos during rating
- ✅ Photos stored securely in Supabase Storage
- ✅ Photos display in review lists and galleries

---

#### 4. Review Display & Interaction (Important - 15% of MVP)

**Status:** 🚧 Partial | **Progress:** 60%

- [x] Review list component (display all reviews for a dish)
- [x] Review card component (0-10 rating, text, photos, user info)
- [ ] Helpful votes functionality (upvote/downvote reviews)
- [ ] Sort reviews (most helpful, most recent, highest/lowest rating)
- [ ] User's own review display (with edit option)

**Success Criteria:**

- ✅ All reviews display correctly on dish pages
- ⏳ Users can vote on review helpfulness (upcoming)
- ⏳ Review sorting works correctly (upcoming)

---

#### 5. Data Layer & API (Critical - 15% of MVP)

**Status:** 🚧 Partial | **Progress:** 80%

- [x] Supabase query functions (dishes, venues, reviews, photos)
- [x] Custom hooks for data fetching (useTopDishes, useSearch, useDishDetail, etc.)
- [x] Context/state management for global app state (RatingContext, AuthContext)
- [x] Error handling and loading states
- [ ] React Query setup for data fetching and caching (deferred to V1.0)
- [ ] Optimistic updates for better UX (deferred to V1.0)

**Success Criteria:**

- ✅ All data fetches from Supabase efficiently
- ✅ Loading states display correctly
- ✅ Errors handled gracefully
- ⏳ App feels fast with proper caching (upcoming with React Query)

---

#### 6. Basic UI Components (Important - 10% of MVP) ✅ COMPLETE

**Status:** ✅ Complete | **Progress:** 100% | **Completed:** 2025-12-29

- [x] NumericRating component (0-10 scale input and display variants)
- [x] DishCard component (for lists/grids)
- [x] DishCardWithRating component (enhanced with ratings display)
- [x] VenueCard component (for lists/grids)
- [x] ReviewCard component (user review display)
- [x] PhotoGallery component (grid-based photo viewer with modal)
- [x] EmptyState component (for no data scenarios)
- [x] SectionHeader component (consistent section titles)
- [x] Loading skeletons for better UX

**Success Criteria:** ✅ ALL MET

- ✅ Reusable components work across all screens
- ✅ Consistent design language
- ✅ Proper theme support (light/dark mode)

---

### MVP Nice-to-Haves (If Time Permits)

- [ ] Pull-to-refresh on feed screens
- [ ] Infinite scroll/pagination for long lists
- [ ] Image zoom/lightbox for photos
- [ ] Share review functionality
- [ ] Basic analytics tracking (screen views, rating submissions)

---

## 🚀 V1.0 Phase - Target: 100% Complete

**Goal:** Complete all features from the original product specification.

**Target Completion:** [Set your target date]

### V1.0 Features

#### 7. Gamification & Charms (10% of V1.0)

**Status:** Not Started | **Progress:** 0%

- [ ] Charm/badge display in user profile
- [ ] Charm unlock notifications
- [ ] Progress tracking UI for incremental charms
- [ ] Charm detail modal (description, unlock criteria, rarity)
- [ ] "Charms" tab in user profile
- [ ] Leaderboard or achievement showcase

**Success Criteria:**

- Charms auto-award based on database triggers
- Users see their earned badges
- Progress toward next charm is visible

---

#### 8. Advanced Search & Filters (10% of V1.0)

**Status:** Not Started | **Progress:** 0%

- [ ] Search by dish type (cross-venue queries using dish_types table)
- [ ] Advanced filters (price range, dietary restrictions, spice level)
- [ ] Location-based search (by city, neighborhood, radius)
- [ ] Sort options (rating, price, distance, popularity)
- [ ] Search history and saved searches

**Success Criteria:**

- User can find "all Gumbos in New Orleans"
- Filters work correctly and are performant
- Search results are relevant and accurate

---

#### 9. User Profiles & Social Features (8% of V1.0)

**Status:** Not Started | **Progress:** 0%

- [ ] Public user profile page (view other users)
- [ ] User's review history
- [ ] User statistics (total reviews, avg rating given, charms)
- [ ] Follow/unfollow users (optional)
- [ ] Activity feed (optional)
- [ ] Profile editing (bio, location, profile photo)

**Success Criteria:**

- Tapping a username shows their public profile
- Profile displays all user reviews and stats
- Profile editing saves correctly

---

#### 10. Review Management (7% of V1.0)

**Status:** Not Started | **Progress:** 0%

- [ ] Edit review functionality
- [ ] Delete review functionality
- [ ] View edit history for a review
- [ ] Report review (moderation workflow)
- [ ] Flag inappropriate photos

**Success Criteria:**

- Users can edit their own reviews
- Edit history tracked in database
- Moderation flags work correctly

---

#### 11. Venue & Dish Management (8% of V1.0)

**Status:** Not Started | **Progress:** 0%

- [ ] Add new venue flow (name, address, cuisine, hours)
- [ ] Add new dish flow (name, category, price, dietary tags)
- [ ] Edit venue/dish information
- [ ] Suggest corrections to venue/dish info
- [ ] Venue/dish approval workflow (if needed)

**Success Criteria:**

- Users can add missing venues/dishes
- Data validation prevents duplicates
- Submissions are moderated (if required)

---

#### 12. Price Tracking & History (5% of V1.0)

**Status:** Not Started | **Progress:** 0%

- [ ] Price history display on dish pages (chart or list)
- [ ] Report price change functionality
- [ ] Price verification workflow (crowd-sourced)
- [ ] Price trend indicators (increasing/decreasing)

**Success Criteria:**

- Users see price changes over time
- Users can report current prices
- Price updates trigger verification flow

---

#### 13. Verification Systems (7% of V1.0)

**Status:** Not Started | **Progress:** 0%

- [ ] AI photo verification integration (dish type detection)
- [ ] GPS verification UI (show verification status)
- [ ] Moderation queue for flagged content
- [ ] Admin dashboard for content moderation (optional)
- [ ] Verified user badge/status

**Success Criteria:**

- AI validates photos match dish type
- GPS verification prevents armchair reviews
- Moderators can approve/reject flagged content

---

#### 14. Testing & Quality Assurance (10% of V1.0)

**Status:** Not Started | **Progress:** 0%

- [ ] Unit tests for utility functions
- [ ] Component tests for UI components
- [ ] Integration tests for API layer
- [ ] E2E tests for critical flows (signup, rating submission)
- [ ] Test coverage reporting
- [ ] CI/CD pipeline with automated testing

**Success Criteria:**

- > 70% code coverage
- All critical flows have E2E tests
- Tests run automatically on PRs

---

#### 15. Production Polish (10% of V1.0)

**Status:** Not Started | **Progress:** 0%

- [ ] Error boundaries for crash prevention
- [ ] Offline support and data sync
- [ ] Loading skeletons for better perceived performance
- [ ] Haptic feedback for interactions
- [ ] Accessibility improvements (screen reader, contrast)
- [ ] Performance optimization (image lazy loading, code splitting)
- [ ] Analytics integration (track user behavior)
- [ ] Crash reporting (Sentry or similar)

**Success Criteria:**

- App doesn't crash on common errors
- Works in low/no connectivity
- Meets accessibility standards
- Performance metrics are good

---

## 🌟 V2.0 Phase - Future Enhancements

**Goal:** Advanced features and ecosystem expansion.

**Target Completion:** [TBD]

### V2.0 Feature Ideas

#### 16. Advanced Social Features

- [ ] User following system
- [ ] Activity feed (friends' recent reviews)
- [ ] Share to social media (Instagram, Twitter, etc.)
- [ ] In-app messaging or comments
- [ ] Review replies/discussions

---

#### 17. Restaurant Partnerships

- [ ] Restaurant claim/verification
- [ ] Restaurant analytics dashboard
- [ ] Menu management for restaurants
- [ ] Exclusive tastings for high-reputation users
- [ ] Restaurant promotions/deals

---

#### 18. Smart Recommendations

- [ ] Personalized dish recommendations (ML-based)
- [ ] "Similar dishes" suggestions
- [ ] Taste preference profiling
- [ ] "Best value" rankings (price-to-rating ratio)

---

#### 19. Advanced Gamification

- [ ] Seasonal challenges
- [ ] Community events (e.g., "Pizza Week")
- [ ] Referral system and rewards
- [ ] Premium/paid charms or features
- [ ] Local legend leaderboards

---

#### 20. Additional Features

- [ ] Price alerts ("notify when under $X")
- [ ] Dietary restriction deep filtering
- [ ] Seasonal dish tracking
- [ ] Historical price trend visualizations
- [ ] API for third-party integrations
- [ ] Web app version
- [ ] Widget for iOS/Android home screen

---

## Progress Metrics

### Overall Progress by Phase

| Phase          | Features Complete | Total Features | Progress |
| -------------- | ----------------- | -------------- | -------- |
| **Foundation** | 5/5               | 5              | 100% ✅  |
| **MVP**        | 3/6               | 6              | 50% 🚧   |
| **V1.0**       | 0/9               | 9              | 0%       |
| **V2.0**       | 0/5               | 5              | 0%       |
| **TOTAL**      | 8/25              | 25             | **32%**  |

### MVP Progress Breakdown

| Feature              | Priority  | Status      | Progress |
| -------------------- | --------- | ----------- | -------- |
| Core Rating Flow     | Critical  | ✅ Complete | 100%     |
| Discovery & Browsing | Critical  | ✅ Complete | 100%     |
| Photo System         | Critical  | ✅ Complete | 100%     |
| Review Display       | Important | 🚧 Partial  | 60%      |
| Data Layer & API     | Critical  | 🚧 Partial  | 80%      |
| Basic UI Components  | Important | ✅ Complete | 100%     |

---

## Update Schedule

This roadmap should be reviewed and updated:

- **Weekly** during active MVP development
- **Bi-weekly** during V1.0 development
- **Monthly** during V2.0 planning

---

## Notes

- Progress percentages are estimates based on feature completion
- Priorities may shift based on user feedback and testing
- MVP target is a shippable product with core functionality
- V1.0 completes the full product specification
- V2.0 is exploratory and subject to change based on market response

---

**Next Steps:**

1. ✅ ~~Review and approve this roadmap~~
2. ✅ ~~Begin MVP Feature #1: Core Rating Flow~~ (Complete)
3. ✅ ~~Begin MVP Feature #2: Discovery & Browsing~~ (Complete)
4. Complete MVP Feature #4: Review Display & Interaction (helpful votes, sorting)
5. Set target dates for MVP beta release
6. Update progress weekly in this file
