const DEFAULT_PRODUCTION_URL = "https://algomind.pro";
const DEFAULT_DEVELOPMENT_URL = "http://localhost:3000";

function normalizeSiteUrl(url: string) {
    return url.endsWith("/") ? url.slice(0, -1) : url;
}

function resolveSiteUrl() {
    const fromEnv = process.env.NEXT_PUBLIC_SITE_URL;
    if (fromEnv) return normalizeSiteUrl(fromEnv);

    return process.env.NODE_ENV === "development"
        ? DEFAULT_DEVELOPMENT_URL
        : DEFAULT_PRODUCTION_URL;
}

export const siteConfig = {
    name: "Algomind",
    description:
        "Master algorithms and data structures with spaced repetition built for software engineers.",
    url: resolveSiteUrl(),
    ogImage: "/opengraph-image",
    keywords: [
        "spaced repetition",
        "algorithms",
        "data structures",
        "leetcode",
        "coding interview prep",
        "sm-2",
        "algorithm learning",
    ],
};
