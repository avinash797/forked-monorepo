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

- Expo SDK 57 + React Native 0.86.3
- React 19.2.3
- TypeScript (strict mode)
- Expo Router v57 (file-based routing)
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

## 🗄️ Database Schema

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
