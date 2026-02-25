import { POST as postWebhook } from "../route";

export const runtime = "nodejs";

export async function POST(request: Request) {
  return postWebhook(request);
}
