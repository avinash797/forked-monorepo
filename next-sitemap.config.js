/** @type {import('next-sitemap').IConfig} */
module.exports = {
  siteUrl: process.env.NEXT_PUBLIC_SITE_URL || "https://getforked.app",
  generateRobotsTxt: true,
  robotsTxtOptions: {
    policies: [
      { userAgent: "*", allow: "/" },
      { userAgent: "*", disallow: ["/admin/*", "/auth/*", "/api/*"] },
    ],
    additionalSitemaps: [],
  },
  exclude: ["/admin/*", "/auth/*", "/api/*"],
};
