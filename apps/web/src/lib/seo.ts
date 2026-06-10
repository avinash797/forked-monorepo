import type { Metadata } from "next";
import type { LeaderboardEntry } from "@/types/rpc.types";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://forkedapp.com";
const SITE_NAME = "Forked";
const SITE_DESCRIPTION =
  "Not restaurant ratings. Dish ratings. Find the best specific dish in your city, powered by real people and Elo-ranked battles.";

export function buildMetadata(
  overrides: Partial<Metadata> & { canonicalPath?: string } = {},
): Metadata {
  const { canonicalPath, ...metadataOverrides } = overrides;

  return {
    title:
      metadataOverrides.title ||
      `${SITE_NAME} — Find the Best Dish in Your City`,
    description: metadataOverrides.description || SITE_DESCRIPTION,
    metadataBase: new URL(SITE_URL),
    ...(canonicalPath ? { alternates: { canonical: canonicalPath } } : {}),
    openGraph: {
      type: "website",
      siteName: SITE_NAME,
      title:
        (metadataOverrides.openGraph as Record<string, string>)?.title ||
        (metadataOverrides.title as string) ||
        `${SITE_NAME} — Find the Best Dish in Your City`,
      description:
        (metadataOverrides.openGraph as Record<string, string>)?.description ||
        (metadataOverrides.description as string) ||
        SITE_DESCRIPTION,
      url: SITE_URL,
      ...metadataOverrides.openGraph,
    },
    twitter: {
      card: "summary_large_image",
      title:
        (metadataOverrides.twitter as Record<string, string>)?.title ||
        (metadataOverrides.title as string) ||
        SITE_NAME,
      description:
        (metadataOverrides.twitter as Record<string, string>)?.description ||
        (metadataOverrides.description as string) ||
        SITE_DESCRIPTION,
      ...metadataOverrides.twitter,
    },
    robots: {
      index: true,
      follow: true,
    },
    ...metadataOverrides,
  };
}

export function buildWebsiteJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: SITE_NAME,
    url: SITE_URL,
    description: SITE_DESCRIPTION,
    potentialAction: {
      "@type": "SearchAction",
      target: {
        "@type": "EntryPoint",
        urlTemplate: `${SITE_URL}/leaderboard/{city}/{dishType}`,
      },
      "query-input": "required name=city required name=dishType",
    },
  };
}

export function buildOrganizationJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: SITE_NAME,
    url: SITE_URL,
    logo: `${SITE_URL}/images/fork-logo/fork-gold.png`,
    description: SITE_DESCRIPTION,
    foundingLocation: {
      "@type": "Place",
      name: "New Orleans, Louisiana",
    },
  };
}

export function buildArticleJsonLd({
  title,
  description,
  slug,
  publishedAt,
  modifiedAt,
  authorName,
  categoryName,
  imageUrl,
}: {
  title: string;
  description: string;
  slug: string;
  publishedAt: string;
  modifiedAt?: string | null;
  authorName: string;
  categoryName: string;
  imageUrl?: string | null;
}) {
  return {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: title,
    description,
    url: `${SITE_URL}/blog/${slug}`,
    datePublished: publishedAt,
    dateModified: modifiedAt ?? publishedAt,
    author: {
      "@type": "Person",
      name: authorName,
    },
    publisher: {
      "@type": "Organization",
      name: SITE_NAME,
      url: SITE_URL,
      logo: {
        "@type": "ImageObject",
        url: `${SITE_URL}/images/fork-logo/fork-gold.png`,
      },
    },
    articleSection: categoryName,
    ...(imageUrl
      ? {
          image: {
            "@type": "ImageObject",
            url: imageUrl,
          },
        }
      : {}),
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": `${SITE_URL}/blog/${slug}`,
    },
  };
}

export function buildBlogListingJsonLd({
  posts,
}: {
  posts: {
    title: string;
    slug: string;
    excerpt?: string | null;
  }[];
}) {
  return {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: "Forked Blog",
    description:
      "Articles about food, dish rankings, and city guides from Forked.",
    numberOfItems: posts.length,
    itemListElement: posts.map((post, index) => ({
      "@type": "ListItem",
      position: index + 1,
      item: {
        "@type": "BlogPosting",
        headline: post.title,
        url: `${SITE_URL}/blog/${post.slug}`,
        ...(post.excerpt ? { description: post.excerpt } : {}),
      },
    })),
  };
}

export function buildLeaderboardJsonLd({
  city,
  dishType,
  entries,
}: {
  city: string;
  dishType: string;
  entries: LeaderboardEntry[];
}) {
  return {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: `Best ${dishType} in ${city}`,
    description: `Ranked list of the best ${dishType.toLowerCase()} in ${city}, powered by Elo-rated dish battles on Forked.`,
    numberOfItems: entries.length,
    itemListElement: entries.map((entry) => ({
      "@type": "ListItem",
      position: entry.rank,
      item: {
        "@type": "Restaurant",
        name: entry.restaurant_name,
        address: {
          "@type": "PostalAddress",
          addressLocality: city,
          addressRegion: entry.address,
        },
        aggregateRating: {
          "@type": "AggregateRating",
          ratingValue: entry.bayesian_score.toFixed(1),
          bestRating: "10",
          worstRating: "1",
          ratingCount: entry.total_ratings,
        },
      },
    })),
  };
}
