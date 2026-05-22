import { Job } from "@/types/job";

const CACHE_KEY = "jobOpsJobsCache";
const TTL_MS = 2 * 60 * 60 * 1000; // 2 hours

export interface JobsCachePayload {
  jobs: Job[];
  fetchedAt: string;
  feedErrors?: string[];
  rateLimited?: boolean;
}

export function isJobsCacheStale(): boolean {
  if (typeof window === "undefined") return true;
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (!raw) return true;
    const parsed = JSON.parse(raw) as JobsCachePayload & { cachedAt?: string };
    const cachedAt = parsed.cachedAt
      ? new Date(parsed.cachedAt).getTime()
      : new Date(parsed.fetchedAt).getTime();
    return Date.now() - cachedAt > TTL_MS;
  } catch {
    return true;
  }
}

export function getJobsCache(): JobsCachePayload | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as JobsCachePayload & { cachedAt?: string };
    if (isJobsCacheStale()) {
      localStorage.removeItem(CACHE_KEY);
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

export function setJobsCache(payload: JobsCachePayload): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(
    CACHE_KEY,
    JSON.stringify({ ...payload, cachedAt: new Date().toISOString() })
  );
}

export function clearJobsCache(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(CACHE_KEY);
}
