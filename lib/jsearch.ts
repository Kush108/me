import crypto from "crypto";
import { Job } from "@/types/job";
import {
  JSEARCH_BASE_URL,
  JSEARCH_HOST,
  JobSource,
} from "@/lib/jobSources";

export interface JSearchFetchResult {
  jobs: Partial<Job>[];
  rateLimited: boolean;
  error?: string;
}

interface JSearchJobRow {
  job_id?: string;
  job_title?: string;
  employer_name?: string;
  job_city?: string;
  job_state?: string;
  job_country?: string;
  job_description?: string;
  job_apply_link?: string;
  job_google_link?: string;
  job_posted_at_datetime_utc?: string;
  job_posted_at_timestamp?: number;
}

interface JSearchResponse {
  status?: string;
  data?: JSearchJobRow[];
  message?: string;
}

function buildSearchQuery(source: JobSource): string {
  return `${source.query} ${source.location}`.trim();
}

function formatLocation(row: JSearchJobRow): string {
  const parts = [row.job_city, row.job_state, row.job_country].filter(
    Boolean
  );
  return parts.join(", ") || "See posting";
}

function parsePostedDate(row: JSearchJobRow): string {
  if (row.job_posted_at_datetime_utc) {
    const d = new Date(row.job_posted_at_datetime_utc);
    if (!Number.isNaN(d.getTime())) return d.toISOString();
  }
  if (row.job_posted_at_timestamp) {
    const d = new Date(row.job_posted_at_timestamp * 1000);
    if (!Number.isNaN(d.getTime())) return d.toISOString();
  }
  return new Date().toISOString();
}

function mapRowToJob(row: JSearchJobRow, source: JobSource): Partial<Job> | null {
  const title = row.job_title?.trim();
  const url = row.job_apply_link || row.job_google_link;
  if (!title || !url) return null;

  const idSource = row.job_id || url;
  const description = (row.job_description || "")
    .replace(/<[^>]*>/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  return {
    id: crypto.createHash("md5").update(idSource).digest("hex"),
    title,
    company: row.employer_name?.trim() || "Unknown employer",
    location: formatLocation(row),
    description: description || title,
    url,
    source: source.id,
    sourceName: source.name,
    postedDate: parsePostedDate(row),
    status: "new",
    matchScore: 0,
    matchReasons: [],
    unscored: true,
  };
}

export async function fetchJSearchSource(
  source: JobSource,
  apiKey: string
): Promise<JSearchFetchResult> {
  const params = new URLSearchParams({
    query: buildSearchQuery(source),
    page: "1",
    num_pages: "1",
    date_posted: "week",
    country: "ca",
  });

  const headers = {
    "Content-Type": "application/json",
    "x-rapidapi-host": JSEARCH_HOST,
    "x-rapidapi-key": apiKey,
  };

  const queryString = params.toString();
  const endpoints = [
    `${JSEARCH_BASE_URL}?${queryString}`,
    `https://jsearch.p.rapidapi.com/search-v2?${queryString}`,
  ];

  let response: Response | null = null;
  for (const url of endpoints) {
    const attempt = await fetch(url, {
      method: "GET",
      headers,
      cache: "no-store",
    });
    if (attempt.status === 404 && url === endpoints[0]) {
      continue;
    }
    response = attempt;
    break;
  }

  if (!response) {
    return { jobs: [], rateLimited: false, error: "fetch_failed" };
  }

  if (response.status === 429) {
    return { jobs: [], rateLimited: true, error: "rate_limited" };
  }

  if (!response.ok) {
    return {
      jobs: [],
      rateLimited: false,
      error: `HTTP ${response.status}`,
    };
  }

  let body: JSearchResponse;
  try {
    body = await response.json();
  } catch {
    return { jobs: [], rateLimited: false, error: "invalid_json" };
  }

  const rows = body.data ?? [];
  const jobs = rows
    .map((row) => mapRowToJob(row, source))
    .filter((j): j is Partial<Job> => j !== null);

  return { jobs, rateLimited: false };
}
