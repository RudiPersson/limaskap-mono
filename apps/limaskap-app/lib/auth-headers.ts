import { headers } from "next/headers";

/**
 * Extracts essential authentication headers for server-side API calls
 * Based on better-auth community best practices
 */
export async function getAuthHeaders(): Promise<Record<string, string>> {
    const currentHeaders = await headers();
    const cookie = currentHeaders.get("cookie");

    // Only forward the cookie header which contains the better-auth session token
    if (!cookie) return {};

    return { cookie };
}
