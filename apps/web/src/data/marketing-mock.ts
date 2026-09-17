export interface DishItem {
  id: string;
  name: string;
  variant: string;
  restaurant: string;
  neighborhood: string;
  city: string;
  cityId: string;
  category: string;
  imageUrl: string;
  rank: number;
  previousRank?: number;
  winRate: number;
  totalBattles: number;
  priceNote?: string;
  localTake: string;
  tags: string[];
}

export interface ComparisonRow {
  feature: string;
  forked: string;
  forkedHighlight?: boolean;
  beli: string;
  googleYelp: string;
  influencers: string;
}

export interface SubredditThread {
  id: string;
  subreddit: string;
  title: string;
  upvotes: string;
  commentCount: number;
  frequencyTag: string;
  originalPost: string;
  commentChaos: string;
  persona: {
    name: string;
    role: string;
    quote: string;
    location: string;
  };
}

export const DISHES_BY_CITY: Record<string, DishItem[]> = {
  nola: [
    {
      id: 'nola-1',
      name: 'Roast Beef Debris Po\'boy',
      variant: 'Roast Beef',
      restaurant: 'Parkway Bakery & Tavern',
      neighborhood: 'Mid-City',
      city: 'New Orleans',
      cityId: 'nola',
      category: 'poboy',
      imageUrl: 'https://images.unsplash.com/photo-1528735602780-2552fd46c7af?auto=format&fit=crop&w=800&q=80',
      rank: 1,
      previousRank: 1,
      winRate: 88,
      totalBattles: 1420,
      priceNote: '$14.50',
      localTake: 'Slow-cooked roast beef falling apart in dark rich gravy on crusty Leidenheimer bread. The benchmark by which all others are fought.',
      tags: ['Heavy Gravy', 'Crisp Bread', 'Debris Rich', 'Must Get Dressed']
    },
    {
      id: 'nola-2',
      name: 'Garlic Gravy Roast Beef Po\'boy',
      variant: 'Roast Beef',
      restaurant: 'Parasol\'s',
      neighborhood: 'Irish Channel',
      city: 'New Orleans',
      cityId: 'nola',
      category: 'poboy',
      imageUrl: 'https://images.unsplash.com/photo-1509722747041-616f39b57569?auto=format&fit=crop&w=800&q=80',
      rank: 2,
      previousRank: 3,
      winRate: 83,
      totalBattles: 1195,
      priceNote: '$13.75',
      localTake: 'Thicker, punchier garlic gravy that soaks halfway into the bread. The local purist favorite against Parkway.',
      tags: ['Garlic Heavy', 'Punchy Gravy', 'Corner Bar Spot']
    },
    {
      id: 'nola-3',
      name: 'Half Roast Beef / Half Fried Shrimp',
      variant: 'Fried Shrimp',
      restaurant: 'Domilise\'s Po-Boy & Bar',
      neighborhood: 'Uptown',
      city: 'New Orleans',
      cityId: 'nola',
      category: 'poboy',
      imageUrl: 'https://images.unsplash.com/photo-1621800043295-a73fe2f76e2c?auto=format&fit=crop&w=800&q=80',
      rank: 3,
      previousRank: 2,
      winRate: 79,
      totalBattles: 980,
      priceNote: '$16.00',
      localTake: 'Crisp hot shrimp piled with house-made roast beef gravy drizzle. A legendary combo that punches above its weight.',
      tags: ['Surf & Turf', 'Creole Mayo', 'Uptown Institution']
    },
    {
      id: 'nola-4',
      name: 'Pork Belly Po\'boy with Lime Slaw',
      variant: 'Pork Belly',
      restaurant: 'Killer Poboys',
      neighborhood: 'French Quarter',
      city: 'New Orleans',
      cityId: 'nola',
      category: 'poboy',
      imageUrl: 'https://images.unsplash.com/photo-1550547660-d9450f859349?auto=format&fit=crop&w=800&q=80',
      rank: 4,
      previousRank: 5,
      winRate: 74,
      totalBattles: 840,
      priceNote: '$15.00',
      localTake: 'Modern variant inside Erin Rose bar. Coriander glazed pork belly cut with tangy lime slaw. Traditionalists argue it, tastebuds surrender.',
      tags: ['Modern Twist', 'Bar Kitchen', 'Tangy Slaw']
    },
    {
      id: 'nola-5',
      name: 'Crispy Fried Oyster Po\'boy',
      variant: 'Fried Oyster',
      restaurant: 'Mahony\'s Po-Boys',
      neighborhood: 'Magazine St',
      city: 'New Orleans',
      cityId: 'nola',
      category: 'poboy',
      imageUrl: 'https://images.unsplash.com/photo-1565299585323-38d6b0865b47?auto=format&fit=crop&w=800&q=80',
      rank: 5,
      previousRank: 4,
      winRate: 71,
      totalBattles: 620,
      priceNote: '$18.50',
      localTake: 'Cornmeal crusted Gulf oysters flash-fried until plump and tender. Ordered fully dressed with hot sauce.',
      tags: ['Gulf Oysters', 'Flash Fried', 'Magazine St']
    },
    {
      id: 'nola-6',
      name: 'Patton\'s Hot Sausage Patty Po\'boy',
      variant: 'Hot Sausage',
      restaurant: 'Guy\'s Po-Boys',
      neighborhood: 'Uptown',
      city: 'New Orleans',
      cityId: 'nola',
      category: 'poboy',
      imageUrl: 'https://images.unsplash.com/photo-1541544741938-0af808871cc0?auto=format&fit=crop&w=800&q=80',
      rank: 6,
      previousRank: 7,
      winRate: 67,
      totalBattles: 510,
      priceNote: '$12.50',
      localTake: 'Griddled spicy beef patties with melted sharp cheese on pressed Leidenheimer. Zero tourists, 100% neighborhood staple.',
      tags: ['Spicy Patty', 'Local Secret', 'Budget Win']
    }
  ],
  nyc: [
    {
      id: 'nyc-1',
      name: 'Burrata & Hot Honey Slice',
      variant: 'Burrata & Hot Honey',
      restaurant: 'L\'Industrie Pizzeria',
      neighborhood: 'Williamsburg',
      city: 'New York City',
      cityId: 'nyc',
      category: 'pizza',
      imageUrl: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&w=800&q=80',
      rank: 1,
      previousRank: 2,
      winRate: 91,
      totalBattles: 2450,
      priceNote: '$5.50',
      localTake: 'Fermented dough with blistering char, cool creamy fresh burrata, hot chili honey drizzle, and fresh cut basil.',
      tags: ['Blistered Crust', 'Sweet Heat', 'Cult Favorite']
    },
    {
      id: 'nyc-2',
      name: 'Stone-Milled Pepperoni Cup Slice',
      variant: 'Pepperoni Cup',
      restaurant: 'Scarr\'s Pizza',
      neighborhood: 'Lower East Side',
      city: 'New York City',
      cityId: 'nyc',
      category: 'pizza',
      imageUrl: 'https://images.unsplash.com/photo-1534308983496-4fabb1a015ee?auto=format&fit=crop&w=800&q=80',
      rank: 2,
      previousRank: 1,
      winRate: 89,
      totalBattles: 2180,
      priceNote: '$5.25',
      localTake: 'Grain milled in the basement daily. Cupping charred pepperoni pools with chili oil on top of a nutty, crisp crust.',
      tags: ['Basement Milled', 'Cupping Pepperoni', 'LES Icon']
    },
    {
      id: 'nyc-3',
      name: 'Classic Plain Cheese New York Slice',
      variant: 'Plain Cheese',
      restaurant: 'Joe\'s Pizza',
      neighborhood: 'Greenwich Village',
      city: 'New York City',
      cityId: 'nyc',
      category: 'pizza',
      imageUrl: 'https://images.unsplash.com/photo-1574071318508-1cdbab80d002?auto=format&fit=crop&w=800&q=80',
      rank: 3,
      previousRank: 3,
      winRate: 84,
      totalBattles: 1980,
      priceNote: '$4.00',
      localTake: 'The archetype folding slice. Perfectly balanced acid in the tomato sauce, low moisture whole milk mozzarella, zero flop.',
      tags: ['No Flop', 'Archetype Slice', 'West 4th Classic']
    },
    {
      id: 'nyc-4',
      name: 'Hellboy Spicy Pepperoni Hot Honey',
      variant: 'Pepperoni Cup',
      restaurant: 'Paulie Gee\'s Slice Shop',
      neighborhood: 'Greenpoint',
      city: 'New York City',
      cityId: 'nyc',
      category: 'pizza',
      imageUrl: 'https://images.unsplash.com/photo-1593560708920-61dd98c46a4e?auto=format&fit=crop&w=800&q=80',
      rank: 4,
      previousRank: 4,
      winRate: 78,
      totalBattles: 1340,
      priceNote: '$5.00',
      localTake: 'Mike\'s Hot Honey on Berkshire soppressata cups with sesame seeded bottom crust option.',
      tags: ['Sesame Bottom', 'Spicy Soppressata', 'Retro Diner']
    },
    {
      id: 'nyc-5',
      name: 'Fuzzy Dunlop Sourdough Mushroom Slice',
      variant: 'Grandma/Sicilian',
      restaurant: 'Upside Pizza',
      neighborhood: 'Midtown',
      city: 'New York City',
      cityId: 'nyc',
      category: 'pizza',
      imageUrl: 'https://images.unsplash.com/photo-1571407970349-bc81e7e96d47?auto=format&fit=crop&w=800&q=80',
      rank: 5,
      previousRank: 6,
      winRate: 72,
      totalBattles: 910,
      priceNote: '$5.50',
      localTake: 'Rich mushroom cream base with fresh thyme and caramelized onions on naturally leavened dough.',
      tags: ['Sourdough', 'Caramelized Onion', 'Midtown Haven']
    }
  ],
  chicago: [
    {
      id: 'chi-1',
      name: 'Juicy Dipped Italian Beef with Hot Peppers',
      variant: 'Dipped Juicy',
      restaurant: 'Johnnie\'s Beef',
      neighborhood: 'Elmwood Park',
      city: 'Chicago',
      cityId: 'chicago',
      category: 'beef',
      imageUrl: 'https://images.unsplash.com/photo-1528735602780-2552fd46c7af?auto=format&fit=crop&w=800&q=80',
      rank: 1,
      previousRank: 1,
      winRate: 92,
      totalBattles: 1840,
      priceNote: '$9.25',
      localTake: 'Dunked entirely in seasoned au jus. Thin shaved beef with fiery giardiniera peppers. Unmatched across Chicago.',
      tags: ['Full Dip', 'Fiery Giardiniera', 'Charcoal Grilled']
    },
    {
      id: 'chi-2',
      name: 'Caramelized Cheese Crust Sausage Pie',
      variant: 'Caramelized Deep Dish',
      restaurant: 'Pequod\'s Pizza',
      neighborhood: 'Lincoln Park',
      city: 'Chicago',
      cityId: 'chicago',
      category: 'deepdish',
      imageUrl: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&w=800&q=80',
      rank: 2,
      previousRank: 2,
      winRate: 85,
      totalBattles: 1530,
      priceNote: '$24.00',
      localTake: 'Cast-iron blackened cheese perimeter that tastes like roasted cheese crackers with chunky sweet tomato sauce.',
      tags: ['Burnt Halo', 'Sweet Sauce', 'Cast Iron']
    },
    {
      id: 'chi-3',
      name: 'Crispy Sausage Thin Tavern-Style',
      variant: 'Tavern-Style Square Cut',
      restaurant: 'Vito & Nick\'s Pizzeria',
      neighborhood: 'Ashburn',
      city: 'Chicago',
      cityId: 'chicago',
      category: 'deepdish',
      imageUrl: 'https://images.unsplash.com/photo-1534308983496-4fabb1a015ee?auto=format&fit=crop&w=800&q=80',
      rank: 3,
      previousRank: 4,
      winRate: 81,
      totalBattles: 1120,
      priceNote: '$18.00',
      localTake: 'The real Chicagoan pizza: cracker crust, fennel-heavy crumbled raw sausage cooked onto the dough, cut into squares.',
      tags: ['Cracker Thin', 'Square Cut', 'South Side Legend']
    }
  ],
  nashville: [
    {
      id: 'nash-1',
      name: 'Medium-Hot Dark Quarter (Leg & Thigh)',
      variant: 'Medium Hot Quarter',
      restaurant: 'Prince\'s Hot Chicken Shack',
      neighborhood: 'North Nashville',
      city: 'Nashville',
      cityId: 'nashville',
      category: 'hotchicken',
      imageUrl: 'https://images.unsplash.com/photo-1626082927389-6cd097cdc6ec?auto=format&fit=crop&w=800&q=80',
      rank: 1,
      previousRank: 1,
      winRate: 90,
      totalBattles: 1610,
      priceNote: '$13.50',
      localTake: 'The origin of hot chicken. Cast-iron fried in spiced lard with a slow-creeping cayenne oil heat that lasts 30 minutes.',
      tags: ['Cast Iron Fried', 'Spiced Lard', 'Original Recipe']
    },
    {
      id: 'nash-2',
      name: 'Hot Dry-Rub Chicken Breast',
      variant: 'Hot Sandwich',
      restaurant: 'Bolton\'s Spicy Chicken & Fish',
      neighborhood: 'East Nashville',
      city: 'Nashville',
      cityId: 'nashville',
      category: 'hotchicken',
      imageUrl: 'https://images.unsplash.com/photo-1562967914-608f82629710?auto=format&fit=crop&w=800&q=80',
      rank: 2,
      previousRank: 2,
      winRate: 82,
      totalBattles: 1205,
      priceNote: '$12.00',
      localTake: 'Dry rub dusted heavy with ghost & habanero pepper flakes. Unforgiving heat for true spice believers.',
      tags: ['Dry Rub Dust', 'Smoky Char', 'No Mercy']
    }
  ]
};

export const COMPARISON_DATA: ComparisonRow[] = [
  {
    feature: 'Core unit of ranking',
    forked: 'The Dish + Specific Variant (e.g. Margherita at XYZ)',
    forkedHighlight: true,
    beli: 'The entire restaurant (apples-to-oranges BBQ vs Bagels)',
    googleYelp: 'The entire restaurant business entity',
    influencers: 'A general restaurant vibe check'
  },
  {
    feature: 'How dishes are ranked',
    forked: 'Head-to-head pairwise battles normalized across the city',
    forkedHighlight: true,
    beli: 'Restaurant-level pair picks (often comparing brunch vs steak)',
    googleYelp: '1–5 star decimal average (compressed to 4.1–4.5 blur)',
    influencers: 'Arbitrary 1–10 number from one person\'s tongue'
  },
  {
    feature: 'City-wide verdict',
    forked: 'Public, shareable dish scoreboard settled by locals',
    forkedHighlight: true,
    beli: 'Private friend feed / individual profile lists',
    googleYelp: 'Sort by "most reviewed" or proximity',
    influencers: 'Sponsored listicles & top-10 reels'
  },
  {
    feature: 'Hole-in-the-wall fairness',
    forked: 'A 3-star lunch spot with a legendary slice can hit #1',
    forkedHighlight: true,
    beli: 'Skews to trendy reservation culture and decor',
    googleYelp: 'Buries low-review or bad-parking spots in sub-4 stars',
    influencers: 'Only covers who gives free food / PR invites'
  },
  {
    feature: 'Time to log an order',
    forked: 'Under 10 seconds: Verdict tap + 2 quick battles',
    forkedHighlight: true,
    beli: 'Multiple prompts and restaurant tags',
    googleYelp: 'Lengthy paragraph review writing',
    influencers: 'N/A'
  },
  {
    feature: 'Paid & comped meals',
    forked: 'Strictly zero. No paid placement, no influencer bias',
    forkedHighlight: true,
    beli: 'Social influencer gamification',
    googleYelp: 'Sponsored search ads & review extortion rumors',
    influencers: 'Free meals, soft obligations to praise'
  }
];

export const SUBREDDIT_RECEIPTS: SubredditThread[] = [
  {
    id: 'thread-1',
    subreddit: 'r/AskNOLA',
    title: 'What is ACTUALLY the best roast beef po\'boy in town? Not the tourist trap answer.',
    upvotes: '642',
    commentCount: 218,
    frequencyTag: 'Asked 3x every week',
    originalPost: 'Visiting next week. Parkway is 4.5, Parasol\'s 4.4, Domilise\'s 4.3. Which one actually wins on roast beef gravy and crust?',
    commentChaos: '218 comments, 100 conflicting answers. 40 people shout Parkway, 35 scream tourist trap, 20 fight for Parasol\'s. 25 minutes of scrolling, zero clear answer.',
    persona: {
      name: 'Marcus T.',
      role: 'Local Mid-City Contributor',
      quote: 'Same question posted every single week. 200 conflicting comments just to end up right back where you started.',
      location: 'Mid-City, New Orleans'
    }
  },
  {
    id: 'thread-2',
    subreddit: 'NOLA Foodies (Facebook Group)',
    title: 'Domilise\'s vs. Parkway vs. Tracey\'s vs. Parasol\'s — who makes the definitive debris gravy?',
    upvotes: '1.2k likes',
    commentCount: 489,
    frequencyTag: 'Weekly recurring debate',
    originalPost: '40 identical threads this year alone. Can anyone give a straight answer without a 500-word essay?',
    commentChaos: '489 comments, 0 agreement. Arguments over gravy thickness, 2014 ownership drama, and mayo purism. Thread locked with no winner.',
    persona: {
      name: 'Yvette L.',
      role: 'Lifelong Local & Facebook Group Mod',
      quote: 'Hundreds of comments shouting the exact same names, nobody agreeing. Pure comment exhaustion.',
      location: 'Uptown, New Orleans'
    }
  },
  {
    id: 'thread-3',
    subreddit: 'r/NewOrleans',
    title: 'Fried Shrimp vs. Roast Beef: Can we stop having a 300-comment war every month?',
    upvotes: '831',
    commentCount: 314,
    frequencyTag: 'Monthly megathread cycle',
    originalPost: 'Locals fighting between roast beef debris and fried shrimp. Why is finding lunch always a 300-comment scavenger hunt?',
    commentChaos: '314 comments deep. People compare completely different sandwiches and argue over lines. A 20-minute rabbit hole with no lunch decided.',
    persona: {
      name: 'Antoine D.',
      role: 'Food Forum Contributor',
      quote: 'Reddit generates 300 comments of noise, never a verdict. You still don\'t know where to go.',
      location: 'Bywater, New Orleans'
    }
  }
];

export const FAQS = [
  {
    q: "Isn't this just Beli?",
    a: "No. Beli ranks whole restaurants on private feeds, comparing bagel shops to steakhouses. Forked ranks exact dishes (pizza vs. pizza) and publishes the city's public leaderboard."
  },
  {
    q: "Why not just look at Google Maps or Yelp?",
    a: "A 4.2 tells you nothing. Great food gets dragged down by parking and decor complaints. Forked ranks the plate, not the venue."
  },
  {
    q: "Why are there strictly no stars anywhere in Forked?",
    a: "Nobody knows what a 4.3 means. Taste works by comparison: 'Was this better than last week's?' Two quick battles produce an exact rank with zero fake decimals."
  },
  {
    q: "What if a dish leaderboard is brand new?",
    a: "You get personal rankings on your second log. As other locals vote, pairwise battles automatically aggregate into the public city leaderboard."
  },
  {
    q: "How does the city leaderboard ranking work?",
    a: "Pairwise tournament consensus (Elo model). If a local spot with 40 logs consistently beats tourist traps head-to-head, it rises to #1. Volume alone can't buy rank."
  },
  {
    q: "How long does it take to log something?",
    a: "Under 10 seconds. Select your dish, tap Bad/Okay/Great, and pick the winner in 2 quick battles. No essays, no mandatory photos."
  }
];
