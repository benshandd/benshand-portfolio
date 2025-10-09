export class RateLimitError extends Error {
  constructor(public readonly retryAfterSeconds: number) {
    super("Too many requests");
    this.name = "RateLimitError";
  }
}

type RateLimitEntry = {
  count: number;
  expiresAt: number;
};

type RateLimitStore = Map<string, RateLimitEntry>;

declare global {
  var __rateLimitStore: RateLimitStore | undefined;
}

const store: RateLimitStore = (globalThis.__rateLimitStore ??= new Map());

export interface RateLimitOptions {
  key: string;
  limit: number;
  windowMs: number;
}

export function enforceRateLimit({ key, limit, windowMs }: RateLimitOptions) {
  const now = Date.now();
  const entry = store.get(key);
  if (!entry || entry.expiresAt < now) {
    store.set(key, { count: 1, expiresAt: now + windowMs });
    return;
  }

  if (entry.count >= limit) {
    const retryAfter = Math.max(1, Math.ceil((entry.expiresAt - now) / 1000));
    throw new RateLimitError(retryAfter);
  }

  entry.count += 1;
}

export function resolveRequestKey(request: Request, fallback = "anonymous") {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) {
    return forwarded.split(",")[0]?.trim() || fallback;
  }
  const realIp = request.headers.get("x-real-ip");
  if (realIp) {
    return realIp;
  }
  return fallback;
}

export async function resolveServerActionKey(fallback = "anonymous") {
  try {
    const { headers } = await import("next/headers");
    const headerList = await headers();
    const forwarded = headerList.get("x-forwarded-for");
    if (forwarded) {
      return forwarded.split(",")[0]?.trim() || fallback;
    }
    const realIp = headerList.get("x-real-ip");
    if (realIp) {
      return realIp;
    }
  } catch {
    // ignore
  }
  return fallback;
}
