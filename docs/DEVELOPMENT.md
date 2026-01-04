# Forked - Development Guide

**Last Updated:** 2026-01-02

This guide covers the development workflow, coding standards, and contribution guidelines for the Forked project.

---

## 🚀 Getting Started

### Prerequisites

- Node.js 18+ and npm
- Expo CLI (`npm install -g expo-cli`)
- iOS Simulator (macOS) or Android Emulator
- Supabase account and project
- Git

### Initial Setup

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

    Then edit `.env` and add your Supabase credentials:

    ```
    EXPO_PUBLIC_SUPABASE_URL=your_supabase_url
    EXPO_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
    ```

4. **Run database migrations:**
    - Open your Supabase dashboard
    - Navigate to SQL Editor
    - Run each migration file in `supabase/migrations/` in order (000000 → 000010)

5. **Start the development server:**
    ```bash
    npm start
    ```

---

## 🏗️ Project Structure

```
forked/
├── app/                      # Expo Router pages
│   ├── (auth)/              # Auth screens (login, signup, etc.)
│   ├── (tabs)/              # Main app tabs (home, settings, etc.)
│   └── _layout.tsx          # Root layout with auth routing
├── components/              # Reusable UI components
│   ├── ui/                  # Base UI primitives
│   ├── themed-*.tsx         # Themed components
│   └── *.tsx                # Feature components
├── contexts/                # React contexts (auth, etc.)
├── hooks/                   # Custom React hooks
├── lib/                     # Utility libraries
│   ├── supabase.ts         # Supabase client
│   └── validators.ts       # Form validation
├── types/                   # TypeScript type definitions
├── constants/               # App constants (theme, config)
├── assets/                  # Images, fonts, etc.
├── supabase/               # Supabase configuration
│   └── migrations/         # Database migrations
└── docs/                    # Project documentation
    ├── ROADMAP.md          # Feature roadmap
    ├── TODO.md             # Active work tracking
    ├── PROGRESS.md         # Completion metrics
    └── app-idea.md         # Product specification
```

---

## 💻 Development Workflow

### Branch Strategy

We use a simplified Git Flow:

- **`main`**: Production-ready code (protected)
- **`develop`**: Integration branch for ongoing work (default branch)
- **`feature/*`**: New features (e.g., `feature/rating-flow`)
- **`bugfix/*`**: Bug fixes (e.g., `bugfix/login-error`)
- **`hotfix/*`**: Urgent production fixes

### Creating a Feature Branch

```bash
# Start from develop
git checkout develop
git pull origin develop

# Create feature branch
git checkout -b feature/your-feature-name

# Make changes, commit frequently
git add .
git commit -m "feat: add dish rating screen"

# Push to remote
git push origin feature/your-feature-name
```

### Commit Message Convention

Follow [Conventional Commits](https://www.conventionalcommits.org/):

- `feat:` - New feature
- `fix:` - Bug fix
- `docs:` - Documentation changes
- `style:` - Code style changes (formatting, no logic change)
- `refactor:` - Code refactoring
- `test:` - Adding or updating tests
- `chore:` - Maintenance tasks

**Examples:**

```
feat: add star rating component
fix: resolve GPS verification bug
docs: update ROADMAP with MVP features
style: format auth screens with prettier
refactor: extract review card to component
test: add unit tests for validators
chore: update dependencies
```

### Pull Request Process

1. **Create PR from feature branch to `develop`:**
    - Use the PR template (once created in `.github/`)
    - Fill out the description, checklist, and testing notes

2. **Ensure CI passes:**
    - Linting (ESLint)
    - Type checking (TypeScript)
    - Tests (once implemented)

3. **Request review:**
    - Tag relevant reviewers
    - Address feedback promptly

4. **Merge:**
    - Squash and merge for clean history
    - Delete feature branch after merge

---

## 🧪 Testing

### Running Tests

```bash
# Run all tests (once implemented)
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage
```

### Testing Strategy

- **Unit Tests:** For utility functions, validators, helpers
- **Component Tests:** For UI components (React Testing Library)
- **Integration Tests:** For API layer and data flows
- **E2E Tests:** For critical user flows (rating submission, auth)

**Target:** 70%+ code coverage for V1.0 release

---

## 🎨 Coding Standards

### TypeScript

- **Strict mode enabled** - No implicit `any`
- Use **interfaces** for object shapes
- Use **type** for unions, primitives, or complex types
- Export types from `types/` directory

### React

- **Functional components only** - No class components
- Use **hooks** for state and side effects
- Prefer **named exports** over default exports
- Keep components **small and focused** (< 200 lines)

### File Naming

- **Components:** PascalCase (e.g., `StarRating.tsx`, `DishCard.tsx`)
- **Utilities:** camelCase (e.g., `validators.ts`, `formatters.ts`)
- **Hooks:** camelCase with `use` prefix (e.g., `useAuth.ts`, `useDishes.ts`)
- **Types:** PascalCase (e.g., `database.ts`, `api.ts`)

### Code Organization

- **One component per file** (except small, related sub-components)
- **Co-locate related files** (component + styles + tests in same dir if complex)
- **Import order:** React → Third-party → Local absolute (`@/`) → Local relative

**Example:**

```typescript
import React, { useState } from 'react';
import { View, Text } from 'react-native';
import { useQuery } from '@tanstack/react-query';

import { ThemedView } from '@/components/themed-view';
import { useAuth } from '@/hooks/use-auth';

import { styles } from './styles';
```

### Theme Usage

- Use `useThemeColor` hook for dynamic colors
- Use `ThemedText` and `ThemedView` for basic elements
- Support both light and dark modes
- Reference colors from `constants/theme.ts`

---

## 📦 State Management

### Current Approach

- **Authentication:** Context API (`AuthContext`) - user session, profile data, charms
- **Theme:** Custom `ThemeProvider` (`context/theme-context.tsx`) - 4 theme variants with light/dark modes
- **Data Fetching:** **@tanstack/react-query** (ALL hooks migrated)
- **Rating Flow:** Context API (`RatingContext`) - temporary state during rating submission
- **Form State:** **react-hook-form** with **zod** validation

### React Query Integration ✅

**ALL data fetching uses React Query** for robust caching, automatic refetching, and optimistic updates.

**Hook Patterns:**

```typescript
// Query Hook (Read Operations)
export function useDishDetail(dishId: string | null) {
    return useQuery({
        queryKey: ['dish', dishId],
        queryFn: async () => {
            if (!dishId) throw new Error('No dish ID');
            const { data, error } = await supabase
                .from('dishes')
                .select('*, reviews(*)')
                .eq('id', dishId)
                .single();
            if (error) throw error;
            return data;
        },
        enabled: !!dishId,
    });
}

// Mutation Hook (Write Operations)
export function useCreateDish() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (input: CreateDishInput) => {
            const { data, error } = await supabase
                .from('dishes')
                .insert(input)
                .select()
                .single();
            if (error) throw error;
            return data;
        },
        onSuccess: (data, variables) => {
            queryClient.invalidateQueries({
                queryKey: ['dishes', variables.venue_id],
            });
        },
    });
}

// Infinite Query (Pagination)
export function useTopDishes(filters: TopDishesFilters) {
    return useInfiniteQuery({
        queryKey: ['top-dishes', filters],
        queryFn: async ({ pageParam = 0 }) => {
            const { data, error } = await supabase
                .from('dishes')
                .select('*')
                .range(pageParam, pageParam + filters.limit - 1);
            if (error) throw error;
            return data;
        },
        getNextPageParam: (lastPage, allPages) => {
            return lastPage.length === filters.limit
                ? allPages.length * filters.limit
                : undefined;
        },
        initialPageParam: 0,
    });
}
```

**Query Key Conventions:**

- Semantic and hierarchical: `['dish', dishId]`, `['dishes', venueId]`, `['reviews', dishId]`
- Mutations invalidate related queries automatically
- Use `enabled` option to prevent unnecessary fetches

**Benefits:**

- ✅ Automatic caching and background refetching
- ✅ Loading, error, and success states built-in
- ✅ Optimistic updates for better UX
- ✅ Deduplication of identical requests
- ✅ Garbage collection of unused cache

### Form Validation with react-hook-form + zod

**ALL forms use react-hook-form** with zod schemas for type-safe validation.

```typescript
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

const profileSchema = z.object({
    display_name: z.string().min(2).max(50),
    bio: z.string().max(500).optional(),
});

type ProfileFormData = z.infer<typeof profileSchema>;

export function ProfileEditScreen() {
    const {
        control,
        handleSubmit,
        formState: { errors, isSubmitting },
    } = useForm<ProfileFormData>({
        resolver: zodResolver(profileSchema),
        defaultValues: {
            display_name: user?.display_name || '',
            bio: user?.bio || '',
        },
    });

    const onSubmit = async (data: ProfileFormData) => {
        // Handle submission
    };

    return (
        <Controller
            control={control}
            name="display_name"
            render={({ field }) => (
                <ThemedTextInput
                    {...field}
                    error={errors.display_name?.message}
                />
            )}
        />
    );
}
```

### Adding New Contexts

1. Create in `contexts/` directory
2. Export both provider and hook
3. Wrap in appropriate layout file (`app/_layout.tsx`)
4. Document in this file

**Example:**

```typescript
// contexts/example-context.tsx
import { createContext, useContext, useState } from 'react';

const ExampleContext = createContext<ExampleContextType | undefined>(
    undefined
);

export function ExampleProvider({ children }: { children: React.ReactNode }) {
    const [state, setState] = useState<ExampleState>({});
    return (
        <ExampleContext.Provider value={{ state, setState }}>
            {children}
        </ExampleContext.Provider>
    );
}

export function useExample() {
    const context = useContext(ExampleContext);
    if (!context) {
        throw new Error('useExample must be used within ExampleProvider');
    }
    return context;
}
```

---

## 🔌 Supabase Integration

### Query Patterns (Using React Query)

**IMPORTANT:** All Supabase queries use React Query hooks. Never use manual `useState` + `useEffect` for data fetching.

```typescript
// Example: Fetch dishes for a venue
export function useVenueDishes(venueId: string | null) {
    return useQuery({
        queryKey: ['dishes', venueId],
        queryFn: async (): Promise<Dish[]> => {
            if (!venueId) return [];

            const { data, error } = await supabase
                .from('dishes')
                .select('*')
                .eq('venue_id', venueId)
                .eq('is_available', true)
                .order('name');

            if (error) throw error;
            return data || [];
        },
        enabled: !!venueId,
    });
}

// Example: Create a review (mutation)
export function useCreateReview() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (input: CreateReviewInput) => {
            const { data, error } = await supabase
                .from('reviews')
                .insert(input)
                .select()
                .single();
            if (error) throw error;
            return data;
        },
        onSuccess: (data, variables) => {
            // Invalidate related queries
            queryClient.invalidateQueries({
                queryKey: ['dish', variables.dish_id],
            });
            queryClient.invalidateQueries({
                queryKey: ['reviews', variables.dish_id],
            });
            queryClient.invalidateQueries({ queryKey: ['top-dishes'] });
        },
    });
}

// Usage in component
function DishDetailScreen() {
    const { dishId } = useParams();
    const { data: dishes, isLoading, error } = useVenueDishes(dishId);

    if (isLoading) return <LoadingSpinner />;
    if (error) return <ErrorMessage message={error.message} />;

    return <DishList dishes={dishes || []} />;
}
```

### RLS (Row Level Security)

- All tables have RLS enabled
- Policies defined in migration files
- Test policies thoroughly
- Don't bypass RLS in client code

### Storage

```typescript
// Example: Upload photo to Supabase Storage
export async function uploadPhoto(file: File, bucket: string) {
    const fileName = `${Date.now()}-${file.name}`;
    const { data, error } = await supabase.storage
        .from(bucket)
        .upload(fileName, file);

    if (error) throw error;
    return data;
}
```

---

## 🎯 Feature Development Checklist

When implementing a new feature:

- [ ] Review product spec in `docs/app-idea.md`
- [ ] Check if database migrations are needed
- [ ] Create feature branch from `develop`
- [ ] Update `docs/TODO.md` with tasks
- [ ] Implement feature with TypeScript types
- [ ] Add error handling and loading states
- [ ] Support light and dark themes
- [ ] Test on iOS and Android (or web)
- [ ] Write tests (unit, integration, or E2E)
- [ ] Update `docs/PROGRESS.md` when complete
- [ ] Create PR with filled-out template
- [ ] Request code review
- [ ] Merge and delete branch

---

## 🐛 Debugging

### Common Issues

**Issue:** "Supabase client not initialized"

- **Fix:** Ensure `.env` has correct `EXPO_PUBLIC_SUPABASE_URL` and `EXPO_PUBLIC_SUPABASE_ANON_KEY`

**Issue:** "RLS policy prevents query"

- **Fix:** Check Supabase RLS policies, ensure user is authenticated

**Issue:** "Images not loading"

- **Fix:** Check Supabase Storage policies, verify file paths are correct

### Debugging Tools

- **Expo DevTools:** Press `j` in terminal to open debugger
- **React Native Debugger:** Standalone debugging app
- **Supabase Dashboard:** View database data, logs, and RLS policies
- **VSCode Debugger:** Attach to Expo process

---

## 📊 Performance Best Practices

- **Optimize images:** Use Expo Image for lazy loading and caching
- **Lazy load screens:** Use React.lazy() for route-based code splitting
- **Memoize expensive computations:** Use `useMemo` and `useCallback`
- **Debounce search inputs:** Prevent excessive API calls
- **Paginate long lists:** Use infinite scroll with `react-query`
- **Cache API responses:** Use React Query's caching layer

---

## 🔐 Security Best Practices

- **Never commit secrets:** Use `.env` and add to `.gitignore`
- **Validate user input:** Use `lib/validators.ts`
- **Sanitize output:** Prevent XSS attacks
- **Use RLS policies:** Protect data at the database level
- **Verify GPS/photos server-side:** Don't trust client verification alone
- **Rate limit API calls:** Prevent abuse (implement in Supabase Edge Functions)

---

## 📝 Documentation

### When to Update Docs

- **ROADMAP.md:** When features are added/removed or priorities change
- **TODO.md:** Weekly or when sprint tasks change
- **PROGRESS.md:** After completing features or weekly
- **DEVELOPMENT.md:** When workflow changes or new patterns are introduced
- **app-idea.md:** When product requirements change (rare)

### Code Comments

- **Do:** Comment complex logic, algorithms, or non-obvious decisions
- **Don't:** Comment obvious code (e.g., `// Set name to userName`)
- **Use JSDoc:** For exported functions and components

**Example:**

```typescript
/**
 * Verifies if user's GPS coordinates are within specified distance of venue.
 * Uses Haversine formula for accurate distance calculation.
 *
 * @param reviewId - UUID of the review to verify
 * @param maxDistanceMeters - Maximum allowed distance in meters (default: 500)
 * @returns Boolean indicating if GPS verification passed
 */
export async function verifyReviewGPS(
    reviewId: string,
    maxDistanceMeters: number = 500
): Promise<boolean> {
    // Implementation...
}
```

---

## 🚢 Release Process

### MVP Release Checklist

- [ ] All MVP features complete (see ROADMAP.md)
- [ ] E2E tests passing for critical flows
- [ ] App tested on iOS and Android
- [ ] Privacy policy and terms of service ready
- [ ] App store assets prepared (icons, screenshots, descriptions)
- [ ] Submit to TestFlight (iOS) and Google Play Internal Testing
- [ ] Gather beta tester feedback
- [ ] Fix critical bugs
- [ ] Submit for App Store review

### Version Numbering

We use [Semantic Versioning](https://semver.org/):

- **Major (X.0.0):** Breaking changes or major feature releases
- **Minor (0.X.0):** New features, backwards-compatible
- **Patch (0.0.X):** Bug fixes, backwards-compatible

**Examples:**

- `0.1.0` - MVP Beta Release
- `1.0.0` - V1.0 Full Release
- `1.1.0` - Added advanced search
- `1.1.1` - Fixed login bug

---

## 🤝 Contributing

### For Team Members

1. Follow the branch strategy and commit conventions
2. Keep PRs focused and small (< 400 lines if possible)
3. Write descriptive PR descriptions
4. Respond to code review feedback
5. Update documentation when needed

### For External Contributors

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Write tests
5. Submit a PR with a clear description
6. Sign the CLA (if required)

---

## 📚 Resources

### Documentation

- [Expo Docs](https://docs.expo.dev/)
- [React Native Docs](https://reactnative.dev/docs/getting-started)
- [Supabase Docs](https://supabase.com/docs)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)

### Design

- [React Navigation Theming](https://reactnavigation.org/docs/themes)
- [iOS Human Interface Guidelines](https://developer.apple.com/design/human-interface-guidelines/)
- [Material Design](https://material.io/design)

### Tools

- [Expo Snack](https://snack.expo.dev/) - Test components online
- [React Native Debugger](https://github.com/jhen0409/react-native-debugger)
- [Supabase Dashboard](https://app.supabase.com/)

---

## 💬 Communication

### Daily Updates

- Post progress in team channel
- Mention blockers immediately

### Weekly Sync

- Review TODO.md and PROGRESS.md
- Discuss upcoming features and priorities
- Demo completed work

### Questions

- Use GitHub Discussions for feature discussions
- Use GitHub Issues for bug reports
- Use team chat for quick questions

---

## 📞 Support

For questions or issues:

- **Technical Issues:** Create a GitHub issue
- **Feature Requests:** Create a GitHub issue with `feature-request` label
- **Security Issues:** Email security@forked.app (or equivalent)

---

**Happy Coding!** 🍴
