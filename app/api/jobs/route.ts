import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";
import { getActiveJobSources } from "@/lib/jobSources";
import { fetchJSearchSource } from "@/lib/jsearch";
import { scoreJobsWithAI, applyCachedScores } from "@/lib/aiScorer";
import { isAuthenticated } from "@/lib/auth";
import { Job } from "@/types/job";
import type { ScoreCacheEntry } from "@/lib/profileStore";

export const maxDuration = 60;

interface JobsRequestBody {
  excludeIds?: string[];
  scoreCache?: Record<string, ScoreCacheEntry>;
  sourcePages?: Record<string, number>;
  refreshGeneration?: number;
  fresh?: boolean;
}

async function runJobFetch(body: JobsRequestBody) {
  const rapidApiKey = process.env.RAPIDAPI_KEY;
  if (!rapidApiKey) {
    return NextResponse.json(
      { error: "RAPIDAPI_KEY not configured on server" },
      { status: 500 }
    );
  }

  const openaiKey = process.env.OPENAI_API_KEY;
  const openai = openaiKey ? new OpenAI({ apiKey: openaiKey }) : null;

  const excludeSet = new Set(body.excludeIds ?? []);
  const scoreCache = body.scoreCache ?? {};
  const refreshGen = body.refreshGeneration ?? 0;
  const sources = getActiveJobSources(refreshGen);

  const allJobs: Partial<Job>[] = [];
  const feedErrors: string[] = [];
  let rateLimited = false;

  const results: Awaited<ReturnType<typeof fetchJSearchSource>>[] = [];
  for (const source of sources) {
    const page = body.sourcePages?.[source.id] ?? 1;
    results.push(
      await fetchJSearchSource(source, rapidApiKey, {
        page,
        datePosted: body.fresh ? "today" : "week",
      })
    );
    await new Promise((r) => setTimeout(r, 350));
  }

  for (let i = 0; i < results.length; i++) {
    const result = results[i];
    const source = sources[i];

    if (result.rateLimited) {
      rateLimited = true;
      continue;
    }

    if (result.error) {
      feedErrors.push(`${source.id}: ${result.error}`);
      continue;
    }

    allJobs.push(...result.jobs);
  }

  const seen = new Set<string>();
  const deduped = allJobs.filter((job) => {
    if (!job.id || seen.has(job.id)) return false;
    if (excludeSet.has(job.id)) return false;
    seen.add(job.id);
    return true;
  });

  let scoredJobs: Job[];

  const withCachedScores = applyCachedScores(deduped, scoreCache);
  const needsScoring = withCachedScores.filter((j) => j.unscored);

  if (openai && needsScoring.length > 0) {
    const newlyScored = await scoreJobsWithAI(needsScoring, openai, 4);
    const scoredMap = new Map(newlyScored.map((j) => [j.id, j]));
    scoredJobs = withCachedScores.map((j) => {
      const id = j.id;
      if (!id) return j as Job;
      return scoredMap.get(id) ?? (j as Job);
    });
  } else {
    if (!openaiKey && needsScoring.length > 0) {
      feedErrors.push("openai: not configured — new jobs unscored");
    }
    scoredJobs = withCachedScores.map((j) => j as Job);
  }

  scoredJobs.sort((a, b) => {
    if (a.unscored && !b.unscored) return 1;
    if (!a.unscored && b.unscored) return -1;
    return (
      b.matchScore - a.matchScore ||
      new Date(b.postedDate).getTime() - new Date(a.postedDate).getTime()
    );
  });

  return NextResponse.json({
    jobs: scoredJobs,
    fetchedAt: new Date().toISOString(),
    feedErrors: rateLimited
      ? undefined
      : feedErrors.length
        ? feedErrors
        : undefined,
    rateLimited: rateLimited || undefined,
    meta: {
      sourcesQueried: sources.map((s) => s.id),
      excludedCount: excludeSet.size,
      newCount: scoredJobs.length,
      scoredFromCache: withCachedScores.length - needsScoring.length,
      newlyScored: needsScoring.length,
    },
  });
}

export async function GET() {
  if (!isAuthenticated()) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  return runJobFetch({ fresh: false });
}

export async function POST(req: NextRequest) {
  if (!isAuthenticated()) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: JobsRequestBody = {};
  try {
    body = await req.json();
  } catch {
    body = {};
  }

  return runJobFetch(body);
}
