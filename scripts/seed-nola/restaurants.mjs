// New Orleans venues the seed user "finds" through the venue picker.
//
// Every venue is a real, long-running New Orleans spot known for at least one of the
// three seeded dishes. Addresses are the street addresses; coordinates are approximate
// (good to a block or so) and only need to land inside the city for proximity queries.
// Phone/website are left out on purpose rather than guessed.
//
// `placeId` is a synthetic, stable stand-in for a Google Place ID. It's what makes
// repeated runs (different users) converge on the SAME restaurant row instead of
// creating duplicates, because upsert_restaurant_from_google dedupes on it.
//
// Which dishes a venue serves, and how "popular" it is for that dish, lives in
// DISH_POOLS below. Popular venues get picked by most seed users, so their
// leaderboard entries reach the 2-rater threshold quickly. The long tail gets picked
// by only some users, which is what leaves "unrated by me, rated by others" venues
// for the Discover recommendations.

export const VENUES = {
    'dooky-chase': {
        name: "Dooky Chase's Restaurant",
        street: '2301 Orleans Ave',
        zip: '70119',
        neighborhood: 'Treme',
        lat: 29.96672,
        lng: -90.07845,
    },
    'willie-maes': {
        name: "Willie Mae's Scotch House",
        street: '2401 St Ann St',
        zip: '70119',
        neighborhood: 'Treme',
        lat: 29.96962,
        lng: -90.07862,
    },
    'lil-dizzys': {
        name: "Li'l Dizzy's Cafe",
        street: '1500 Esplanade Ave',
        zip: '70116',
        neighborhood: 'Treme',
        lat: 29.97012,
        lng: -90.06758,
    },
    'gumbo-shop': {
        name: 'Gumbo Shop',
        street: '630 St Peter St',
        zip: '70116',
        neighborhood: 'French Quarter',
        lat: 29.95768,
        lng: -90.06428,
    },
    'coops-place': {
        name: "Coop's Place",
        street: '1109 Decatur St',
        zip: '70116',
        neighborhood: 'French Quarter',
        lat: 29.96071,
        lng: -90.05908,
    },
    'johnnys-po-boys': {
        name: "Johnny's Po-Boys",
        street: '511 St Louis St',
        zip: '70130',
        neighborhood: 'French Quarter',
        lat: 29.95571,
        lng: -90.06552,
    },
    'killer-poboys': {
        name: 'Killer PoBoys',
        street: '219 Dauphine St',
        zip: '70112',
        neighborhood: 'French Quarter',
        lat: 29.95441,
        lng: -90.06912,
    },
    'mothers': {
        name: "Mother's Restaurant",
        street: '401 Poydras St',
        zip: '70130',
        neighborhood: 'Central Business District',
        lat: 29.94828,
        lng: -90.06681,
    },
    'commanders-palace': {
        name: "Commander's Palace",
        street: '1403 Washington Ave',
        zip: '70130',
        neighborhood: 'Garden District',
        lat: 29.92871,
        lng: -90.08431,
    },
    'hattie-bs': {
        name: "Hattie B's Hot Chicken",
        street: '1733 Magazine St',
        zip: '70130',
        neighborhood: 'Lower Garden District',
        lat: 29.93402,
        lng: -90.07261,
    },
    'mahonys': {
        name: "Mahony's Po-Boys & Seafood",
        street: '3454 Magazine St',
        zip: '70115',
        neighborhood: 'Uptown',
        lat: 29.92268,
        lng: -90.09271,
    },
    'guys-po-boys': {
        // Also exists in the dev database already (real Place ID); the search-first
        // step reuses that row instead of creating a duplicate.
        name: "Guy's Po-Boys",
        street: '5259 Magazine St',
        zip: '70115',
        neighborhood: 'Uptown',
        lat: 29.92051,
        lng: -90.10432,
    },
    'domilises': {
        name: "Domilise's Po-Boy & Bar",
        street: '5240 Annunciation St',
        zip: '70115',
        neighborhood: 'Uptown',
        lat: 29.91781,
        lng: -90.10628,
    },
    'parkway': {
        name: 'Parkway Bakery & Tavern',
        street: '538 Hagan Ave',
        zip: '70119',
        neighborhood: 'Mid-City',
        lat: 29.97881,
        lng: -90.09578,
    },
    'mandinas': {
        name: "Mandina's Restaurant",
        street: '3800 Canal St',
        zip: '70119',
        neighborhood: 'Mid-City',
        lat: 29.97372,
        lng: -90.09571,
    },
    'liuzzas-by-the-track': {
        name: "Liuzza's by the Track",
        street: '1518 N Lopez St',
        zip: '70119',
        neighborhood: 'Mid-City',
        lat: 29.98003,
        lng: -90.08498,
    },
    'mchardys': {
        name: "McHardy's Chicken & Fixin'",
        street: '1458 N Broad St',
        zip: '70119',
        neighborhood: 'Seventh Ward',
        lat: 29.97571,
        lng: -90.07192,
    },
    'manchu': {
        name: 'Manchu Food Store',
        street: '1413 N Claiborne Ave',
        zip: '70116',
        neighborhood: 'Seventh Ward',
        lat: 29.97069,
        lng: -90.06502,
    },
};

// dish_types.slug -> venues that serve it. weight 3 = a famous spot most users hit;
// weight 1 = long tail. Several venues sit in more than one pool (Dooky Chase's,
// Li'l Dizzy's, Coop's, Mother's, Liuzza's) so one restaurant fills several boards.
export const DISH_POOLS = {
    gumbo: [
        { venue: 'dooky-chase', weight: 3 },
        { venue: 'lil-dizzys', weight: 3 },
        { venue: 'gumbo-shop', weight: 3 },
        { venue: 'commanders-palace', weight: 1 },
        { venue: 'mothers', weight: 1 },
        { venue: 'coops-place', weight: 1 },
        { venue: 'mandinas', weight: 1 },
        { venue: 'liuzzas-by-the-track', weight: 1 },
    ],
    'po-boy': [
        { venue: 'parkway', weight: 3 },
        { venue: 'domilises', weight: 3 },
        { venue: 'johnnys-po-boys', weight: 3 },
        { venue: 'guys-po-boys', weight: 1 },
        { venue: 'killer-poboys', weight: 1 },
        { venue: 'mahonys', weight: 1 },
        { venue: 'mothers', weight: 1 },
        { venue: 'liuzzas-by-the-track', weight: 1 },
    ],
    'fried-chicken': [
        { venue: 'willie-maes', weight: 3 },
        { venue: 'dooky-chase', weight: 3 },
        { venue: 'mchardys', weight: 3 },
        { venue: 'lil-dizzys', weight: 1 },
        { venue: 'coops-place', weight: 1 },
        { venue: 'manchu', weight: 1 },
        { venue: 'hattie-bs', weight: 1 },
    ],
};

// Optional review text, the way a user types a one-liner in the notes box.
// Keyed by sentiment; the script only attaches a note to some ratings.
export const NOTES = {
    liked: {
        gumbo: [
            'Dark roux, deep flavor. Would order again.',
            'Loaded with sausage and the rice was perfect.',
            'Best bowl I had all week.',
        ],
        'po-boy': [
            'Bread shattered just right, generous fillings.',
            'Fully dressed and messy in the best way.',
            'Roast beef debris was unreal.',
        ],
        'fried-chicken': [
            'Crackly crust, juicy all the way through.',
            'Perfectly seasoned, worth the wait.',
            'Ordered a second round.',
        ],
    },
    okay: {
        gumbo: [
            'Solid but a little thin.',
            'Fine, nothing memorable.',
            'Needed more seasoning.',
        ],
        'po-boy': [
            'Decent, bread was a bit soft.',
            'Good not great.',
            'Fillings were skimpy for the price.',
        ],
        'fried-chicken': [
            'Crust was good, meat a little dry.',
            'Okay for a quick bite.',
            'Fine, but I have had better nearby.',
        ],
    },
    disliked: {
        gumbo: [
            'Tasted like it came from a can.',
            'Way too salty.',
            'Watery and bland.',
        ],
        'po-boy': [
            'Stale bread, soggy by the second bite.',
            'Mostly lettuce.',
            'Would not order again.',
        ],
        'fried-chicken': [
            'Greasy and underseasoned.',
            'Breading fell right off.',
            'Came out lukewarm.',
        ],
    },
};
