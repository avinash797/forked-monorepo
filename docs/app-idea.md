# Forked - Product Specification

## Core Concept

A dish-level rating system that allows users to rate individual dishes at restaurants, creating rankings for specific dishes (e.g., "Best Gumbo in New Orleans" or "Best Lobster Roll in Portland, Maine"). This solves the problem of venue-based ratings where a restaurant's overall vibe might boost ratings despite mediocre food.

## Key Differentiators

- **Dish-level focus**: Unlike traditional venue-based reviews, users rate specific dishes
- **Verification layer**: Ensures authentic, reliable ratings
- **Photo-centric**: Visual submissions showcase actual dishes
- **Gamification**: User charms and badges encourage participation
- **Merit-based**: Chain restaurants compete equally with independent spots - no favoritism based on legacy or brand

## Core Features

### 1. Rating System

- Users rate individual dishes (not venues)
- Star rating system (1-5 scale)
- Photo submission (required for verification)
- Optional written review
- Location verification via GPS

### 2. User Charms/Badges

Gamification elements to encourage engagement:

- **The OG**: Early adopter status
- **Taco King**: Dish-specific expertise
- **Influencer**: High engagement/helpful reviews
- **Night Owl**: Late-night dining coverage
- **Spice Lord**: Spicy food specialist
- Additional dish-specific badges: "Gumbo Guru," "Ramen Ronin," "Pizza Prophet"
- **Local Legend**: Comprehensive coverage of a city

**Progression System**:

- Start with basic charms
- Unlock prestigious ones through consistent, quality contributions
- Build micro-communities around specific dish types

### 3. Verification Layer

Multiple verification methods to ensure authenticity:

**Location Verification**:

- GPS confirmation that user was at the restaurant during submission
- Prevents armchair reviews

**Photo Verification**:

- Required photo of the dish
- AI validation to verify dish type matches rating (e.g., is this actually gumbo?)

**Cross-Validation Scoring**:

- Give more weight to users whose ratings align with verified user consensus
- New users start with less influence, build credibility over time

**Temporal Pattern Detection**:

- Flag suspicious activity (e.g., multiple reviews across cities in impossible timeframes)

### 4. Search & Discovery

- Search by dish type (e.g., "Gumbo in New Orleans")
- Filter by location, price range, dietary restrictions
- Rankings driven by verified user ratings
- Visual browsing through user-submitted photos

## Data Architecture

### Core Data Entities

#### Users Table

- User ID (primary key)
- Username/Display name
- Email (authentication)
- Location (home city/region)
- Account creation date
- Verification status (phone verified, email verified)
- Charms earned (array of charm IDs with timestamps)
- Reputation score (calculated from review quality, consistency)
- Profile photo
- Bio (optional)

#### Restaurants/Venues Table

- Venue ID (primary key)
- Name
- Address (structured: street, city, state, zip, country)
- Coordinates (lat/long for location verification)
- Cuisine type(s) (array: Creole, Seafood, etc.)
- Chain indicator (boolean + parent chain ID if applicable)
- Hours of operation
- Price range ($ to $$$$)
- Photos (venue exterior/interior)
- Date added to platform

#### Dishes Table

- Dish ID (primary key)
- Venue ID (foreign key)
- Dish name (e.g., "Gumbo")
- Dish category (appetizer, entree, dessert, etc.)
- Variety/specification (optional: "Seafood," "Chicken & Sausage," "Vegan")
- Current price (cached value for quick access)
- Description (optional, from restaurant)
- Dietary tags (vegetarian, vegan, gluten-free, spicy level, etc.)
- Date added

**Important**: A dish is always tied to a specific venue. "Gumbo" at Restaurant A is a different entity than "Gumbo" at Restaurant B.

#### Dish Types Table

- Dish Type ID (primary key)
- Name (e.g., "Gumbo", "Lobster Roll")
- Category
- Description

**Purpose**: Normalization table allowing efficient queries like "all Gumbos in New Orleans"

#### Ratings/Reviews Table

- Rating ID (primary key)
- User ID (foreign key)
- Dish ID (foreign key)
- Venue ID (for redundancy/quick queries)
- Star rating (1-5)
- Review text (optional)
- Photos (array of photo URLs)
- Timestamp
- Location coordinates (where review was submitted - for verification)
- Verification flags:
    - GPS verified (was user at location?)
    - Photo verified (AI confirmed dish type?)
    - Human review flag (if needed for quality check)
- Helpful votes (count of other users who found this useful)
- Edit history (if edits allowed)

#### Photos Table

- Photo ID (primary key)
- Uploaded by (User ID)
- Associated with (Dish ID, Venue ID, or Rating ID)
- Upload timestamp
- URL/storage path
- Moderation status (pending, approved, flagged)
- EXIF data (optional: camera, location metadata)

#### Price History Table

- Price History ID (primary key)
- Dish ID (foreign key)
- Price
- Recorded date/timestamp
- Reported by (User ID - optional, null for restaurant-reported)
- Source (user-reported, restaurant-updated, admin-verified)
- Currency (USD, etc.)

**Rationale for separate table**:

- Track price trends over time
- Maintain data integrity (Dish table stays clean)
- Enable crowd-sourced price accuracy
- Optimize query efficiency
- Enable future features (price alerts, value rankings)

#### Charms/Badges Table

- Charm ID (primary key)
- Name ("The OG," "Taco King", etc.)
- Description
- Icon/image
- Unlock criteria (JSON defining requirements)
- Rarity tier (common, rare, legendary, etc.)

### Key Relationships

- **User** → rates a → **Dish** → at a → **Venue**
- Dish references Dish Type for normalization
- Photos tied to User AND Rating/Dish/Venue
- Price History tracks changes for each Dish

## User Flows

### Primary Flow: Submitting a Rating

1. **Entry Point**: User opens app → "Rate a Dish"

2. **Location Detection**:
    - App automatically detects nearby restaurants (GPS + venue database)
    - Shows venues within ~0.5 mile radius
    - User selects restaurant OR searches by name

3. **Dish Selection**:
    - If venue exists: Show existing dishes at venue
    - User scrolls/searches for their dish
    - If dish doesn't exist: "Add new dish" button

4. **New Dish Flow** (if needed):
    - Dish name (text input)
    - Category (dropdown: appetizer, entree, etc.)
    - Variety (optional: "seafood", "spicy", etc.)
    - Price (number input)
    - Dietary tags (multi-select: vegetarian, vegan, gluten-free, spicy level)

5. **Rating Submission**:
    - Star rating (1-5, required)
    - Photo upload (required for verification)
    - Written review (optional)
    - Price confirmation ("Is this still $X?")

6. **Verification Layer** (backend, invisible):
    - GPS verification: Was user at location?
    - Photo AI check: Does this match the dish category?
    - Flag for manual review if verification fails

### Secondary Flow: Adding New Venue

If restaurant doesn't exist in database:

- "My restaurant isn't listed" button
- Venue name (text)
- Address (auto-fill from GPS + manual correction)
- Cuisine type(s) (multi-select)
- Proceed to dish rating flow

## Go-to-Market Strategy

### Initial User Acquisition (Seeding Strategy)

**Target Users for Paid Seeding**:

1. **College Students**
    - Eat out frequently
    - Price-conscious (care about finding actually good food)
    - Social media native
    - Structure: Campus ambassador program with pay-per-verified-submission

2. **Food Critics**
    - Provide credibility and reach
    - Hybrid model: Pay for initial seed content + premium "Verified Critic" status
    - Reviews carry multiplier effect on visibility

3. **Influencers**
    - Built-in audience for awareness
    - Similar hybrid model as critics

### Launch Strategy

**Hyper-Local Saturation**:

- Launch in ONE city first (e.g., New Orleans)
- Deep coverage of top 20-30 dishes the city is known for
- Creates immediately usable product
- Generates concentrated word-of-mouth
- Sets quality standards and cultural tone

**Transition from Paid to Organic**:

- Need mechanisms to prevent paid users from dominating rankings indefinitely
- Early contributors should be rewarded but not create unfair advantage
- Paid users set examples for quality submissions

## Strategic Decisions

### Chain vs. Independent Restaurants

- Treat each chain location as its own entity
- No favoritism based on legacy or brand
- Merit-based rankings only - chain can beat independent if food is better

### Dish Variations

- Optional variety property for each menu item
- Allows rating "Seafood Gumbo" vs "Chicken & Sausage Gumbo" separately
- Restaurant with just "Gumbo" keeps it simple
- Consider allowing user-generated tags for variations

### Initial Supply Problem

- Pay power users (critics, students, influencers) to rate dishes
- Saturate one launch city completely
- Enforce strict verification from day one to set quality standards

## Open Questions for Development

### Rating System

1. Rating scale: 1-5 stars confirmed, or consider alternatives (1-10, binary)?
2. Review editing: Allow edits after submission or lock once posted?
3. Photo requirements: Mandatory for all ratings or optional?
4. Review length: Minimum/maximum character counts?

### Data Collection

1. Price validation: Flag drastically different price reports for verification?
2. Duplicate detection: How to handle similar dish entries (e.g., "Gumbo" vs "Traditional Gumbo")?
3. Moderation queue: New venues/dishes approved first or appear immediately with async verification?

### Feature Prioritization

1. Which charms to launch with vs. add later?
2. What verification checks are MVP vs. nice-to-have?
3. Social features: Following users, sharing ratings, etc.?

## Future Feature Possibilities

- Price alerts ("notify when this dish drops below $X")
- "Best value" rankings (price-to-rating ratios)
- Dietary restriction filters
- Seasonal dish tracking
- User following/social features
- Restaurant partnerships for exclusive tastings
- Historical price trend visualizations

## Next Steps

1. Finalize open questions on rating system and data collection
2. Design technical stack and API architecture
3. Create detailed UI/UX mockups for core flows
4. Develop verification system (GPS + photo AI)
5. Build MVP database schema
6. Select launch city and begin power user recruitment
