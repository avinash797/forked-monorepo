# Forked - Dish-Level Restaurant Ratings

**A dish-level rating system that allows users to rate individual dishes at restaurants, creating rankings for specific dishes (e.g., "Best Gumbo in New Orleans" or "Best Lobster Roll in Portland, Maine").**

---

## 📱 About Forked

Forked solves the problem of venue-based ratings where a restaurant's overall vibe might boost ratings despite mediocre food. Instead of rating restaurants, users rate **individual dishes** with photo verification and GPS location tracking.

**Key Features:**
- Rate individual dishes (not venues)
- Photo-required submissions for authenticity
- GPS verification to prevent armchair reviews
- Gamification with charms and badges
- Cross-venue dish queries (e.g., "all Gumbos in New Orleans")

**Tech Stack:**
- Expo SDK 54 + React Native 0.81.5
- React 19.1.0
- TypeScript (strict mode)
- Expo Router v6 (file-based routing)
- Supabase (PostgreSQL database + authentication + storage)

---

## 🚀 Getting Started

### Prerequisites

- Node.js 18+ and npm
- Expo CLI: `npm install -g expo-cli`
- iOS Simulator (macOS) or Android Emulator
- Supabase account and project

### Installation

1. **Clone the repository:**
   ```bash
   git clone <repository-url>
   cd forked
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Set up environment variables:**
   ```bash
   cp .env.example .env
   ```
   Edit `.env` and add your Supabase credentials:
   ```
   EXPO_PUBLIC_SUPABASE_URL=your_supabase_url
   EXPO_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

4. **Run database migrations:**
   - Open your Supabase dashboard → SQL Editor
   - Run each migration file in `supabase/migrations/` in order (000000 → 000010)

5. **Start the development server:**
   ```bash
   npm start
   ```

   Then open in:
   - [iOS Simulator](https://docs.expo.dev/workflow/ios-simulator/)
   - [Android Emulator](https://docs.expo.dev/workflow/android-studio-emulator/)
   - [Web Browser](http://localhost:8081)

---

## 📊 Project Status

**Current Progress: 30% Complete**

- ✅ **Foundation (100%)**: Authentication, database schema, UI components, app architecture
- 🚧 **MVP (0%)**: Core rating flow, discovery, photos, reviews - *IN PLANNING*
- ⏳ **V1.0 (0%)**: Gamification, advanced search, verification, testing
- 🌟 **V2.0 (0%)**: Social features, partnerships, smart recommendations

See [docs/ROADMAP.md](./docs/ROADMAP.md) for the full feature roadmap.

---

## 📚 Documentation

### For Developers
- **[DEVELOPMENT.md](./docs/DEVELOPMENT.md)** - Development workflow, coding standards, contribution guide
- **[ROADMAP.md](./docs/ROADMAP.md)** - Feature roadmap organized by MVP/V1.0/V2.0 phases
- **[TODO.md](./docs/TODO.md)** - Active work tracking for current sprint
- **[PROGRESS.md](./docs/PROGRESS.md)** - Completion metrics and historical progress
- **[TRACKING_SYSTEM.md](./docs/TRACKING_SYSTEM.md)** - Overview of project management system
- **[CLAUDE.md](./CLAUDE.md)** - Claude Code project instructions

### For Product & Design
- **[app-idea.md](./docs/app-idea.md)** - Original product specification and vision

### For Contributors
- **[GITHUB_SETUP.md](./.github/GITHUB_SETUP.md)** - GitHub infrastructure setup guide
- **Issue Templates:** Feature requests, bug reports, tasks
- **PR Template:** Pull request checklist

---

## 🏗️ Project Structure

```
forked/
├── app/                      # Expo Router pages
│   ├── (auth)/              # Auth screens (login, signup, etc.)
│   ├── (tabs)/              # Main app tabs (home, settings, etc.)
│   └── _layout.tsx          # Root layout with auth routing
├── components/              # Reusable UI components
├── contexts/                # React contexts (auth, etc.)
├── hooks/                   # Custom React hooks
├── lib/                     # Utility libraries (Supabase, validators)
├── types/                   # TypeScript type definitions
├── constants/               # App constants (theme, config)
├── supabase/               # Supabase configuration & migrations
├── docs/                    # Project documentation
└── .github/                 # GitHub templates and workflows
```

---

## 🗄️ Database Schema

**11 tables with comprehensive RLS policies:**

1. **Profiles** - User profiles extending auth.users
2. **Venues** - Restaurants/eateries
3. **Dishes** - Menu items tied to venues
4. **Dish Types** - Normalized dish categories (for cross-venue queries)
5. **Reviews** - Dish ratings with GPS and photo verification
6. **Photos** - Polymorphic photo associations (review/dish/venue)
7. **Price History** - Track price changes over time
8. **Helpful Votes** - Review helpfulness tracking
9. **Charms** - Gamification badges/achievements
10. **User Charms** - User-earned achievements with progress tracking

See migration files in `supabase/migrations/` for full schema.

---

## 🧪 Available Scripts

```bash
npm start           # Start Expo dev server
npm run android     # Start and open Android emulator
npm run ios         # Start and open iOS simulator
npm run web         # Start web version
npm run lint        # Run ESLint
npm run reset-project  # Reset to blank project (careful!)
```

---

## 🤝 Contributing

We welcome contributions! Please follow these steps:

1. Read [DEVELOPMENT.md](./docs/DEVELOPMENT.md) for workflow and coding standards
2. Check [ROADMAP.md](./docs/ROADMAP.md) for prioritized features
3. Create a feature branch from `develop`
4. Make your changes with tests
5. Submit a PR using the template
6. Wait for code review

See [.github/GITHUB_SETUP.md](./.github/GITHUB_SETUP.md) for GitHub configuration.

---

## 📋 What's Next?

**Immediate priorities (MVP Phase):**

1. **Core Rating Flow** - Rate a dish screen with venue/dish selection, star rating, photo upload
2. **Discovery & Browsing** - Home feed, dish/venue detail pages, search
3. **Photo System** - Camera integration, Supabase Storage, gallery display
4. **Review Display** - Review lists, helpful votes, sorting
5. **Data Layer** - Supabase queries, React Query setup, state management

See [docs/TODO.md](./docs/TODO.md) for active work items.

---

## 📖 Learn More

- **Expo Documentation:** [https://docs.expo.dev/](https://docs.expo.dev/)
- **React Native Docs:** [https://reactnative.dev/](https://reactnative.dev/)
- **Supabase Docs:** [https://supabase.com/docs](https://supabase.com/docs)
- **Expo Router:** [https://docs.expo.dev/router/introduction/](https://docs.expo.dev/router/introduction/)

---

## 📞 Support

- **Technical Issues:** Create a [GitHub issue](<your-repo-url>/issues)
- **Feature Requests:** Use the [feature request template](./.github/ISSUE_TEMPLATE/feature_request.md)
- **Bug Reports:** Use the [bug report template](./.github/ISSUE_TEMPLATE/bug_report.md)

---

## 📄 License

[Add your license here - e.g., MIT, Apache 2.0, etc.]

---

**Built with ❤️ using Expo and Supabase**
