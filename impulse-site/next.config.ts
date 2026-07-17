import type { NextConfig } from "next";

// Old-site URLs that don't exist 1:1 on the new site get a permanent (301)
// redirect so their Google rankings transfer instead of 404ing. Suburb pages
// (/electrician-*), /services/outdoor-lighting, /services/commercial-electrical
// and the how-to-choose guide keep their exact old URLs, so they need no
// entry here. Crawl the old site before launch (Search Console → Pages, or
// Screaming Frog) and add any URL not covered to this list.
const legacyRedirects = [
  {
    source: "/24-hours-call-out-mornington-peninsula",
    destination: "/services/emergency-electrician",
    permanent: true,
  },
];

const nextConfig: NextConfig = {
  // This app lives in a subdirectory of the repo; without this, Turbopack
  // guesses the workspace root from the parent lockfile.
  turbopack: {
    root: __dirname,
  },
  async redirects() {
    return legacyRedirects;
  },
};

export default nextConfig;
