import { type NextRequest, NextResponse } from "next/server";
import { rootDomain } from "@/lib/utils";

// Reserved subdomains that should not be treated as tenants
const RESERVED_SUBDOMAINS = [
  "api",
  "www",
  "admin",
  "app",
  "mail",
  "ftp",
  "cdn",
  "static",
];

function extractSubdomain(request: NextRequest): string | null {
  const host = request.headers.get("host") || "";
  const hostname = host.split(":")[0];

  // Local development environment
  if (hostname.includes("localhost") || hostname.includes("127.0.0.1")) {
    // Extract subdomain from hostname only (not from query parameters)
    if (hostname.includes(".localhost")) {
      return hostname.split(".")[0];
    }

    return null;
  }

  // Production environment
  const rootDomainFormatted = rootDomain.split(":")[0];

  // Handle preview deployment URLs (tenant---branch-name.vercel.app)
  if (hostname.includes("---") && hostname.endsWith(".vercel.app")) {
    const parts = hostname.split("---");
    return parts.length > 0 ? parts[0] : null;
  }

  // Regular subdomain detection
  const isSubdomain =
    hostname !== rootDomainFormatted &&
    hostname !== `www.${rootDomainFormatted}` &&
    hostname.endsWith(`.${rootDomainFormatted}`);

  return isSubdomain ? hostname.replace(`.${rootDomainFormatted}`, "") : null;
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const subdomain = extractSubdomain(request);

  // Debug logging in development
  if (process.env.NODE_ENV === "development") {
    console.log(`Middleware: subdomain="${subdomain}", pathname="${pathname}"`);
  }

  if (subdomain && !RESERVED_SUBDOMAINS.includes(subdomain)) {
    // For the root path on a subdomain, rewrite to the subdomain page
    if (pathname === "/") {
      const url = request.nextUrl.clone();
      url.pathname = `/s/${subdomain}`;
      return NextResponse.rewrite(url);
    }

    // For other paths on subdomain (like /thank-you)
    const url = request.nextUrl.clone();
    url.pathname = `/s/${subdomain}${pathname}`;
    return NextResponse.rewrite(url);
  }

  // On the root domain, allow normal access
  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all paths except for:
     * 1. /api routes
     * 2. /_next (Next.js internals)
     * 3. all root files inside /public (e.g. /favicon.ico)
     */
    "/((?!api|_next|[\\w-]+\\.\\w+).*)",
  ],
};
