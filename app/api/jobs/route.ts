import { NextResponse } from "next/server";
import OpenAI from "openai";
import { JOB_SOURCES } from "@/lib/jobSources";
import { fetchJSearchSource } from "@/lib/jsearch";
import { scoreJobsWithAI } from "@/lib/aiScorer";
import { isAuthenticated } from "@/lib/auth";
import { Job } from "@/types/job";

export const maxDuration = 60;

export async function GET() {
  if (!isAuthenticated()) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const rapidApiKey = process.env.RAPIDAPI_KEY;
  if (!rapidApiKey) {
    return NextResponse.json(
      { error: "RAPIDAPI_KEY not configured on server" },
      { status: 500 }
    );
  }

  const openaiKey = process.env.OPENAI_API_KEY;
  const openai = openaiKey ? new OpenAI({ apiKey: openaiKey }) : null;

  const allJobs: Partial<Job>[] = [];
  const feedErrors: string[] = [];
  let rateLimited = false;

  // Sequential fetches to reduce RapidAPI 429 rate-limit hits
  const results: Awaited<ReturnType<typeof fetchJSearchSource>>[] = [];
  for (const source of JOB_SOURCES) {
    results.push(await fetchJSearchSource(source, rapidApiKey));
    await new Promise((r) => setTimeout(r, 350));
  }

  for (let i = 0; i < results.length; i++) {
    const result = results[i];
    const source = JOB_SOURCES[i];

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
    seen.add(job.id);
    return true;
  });

  let scoredJobs: Job[];

  if (openai && deduped.length > 0) {
    scoredJobs = await scoreJobsWithAI(deduped, openai, 4);
  } else {
    if (!openaiKey && deduped.length > 0) {
      feedErrors.push("openai: not configured — jobs unscored");
    }
    scoredJobs = deduped.map(
      (job) =>
        ({
          ...job,
          matchScore: 0,
          matchReasons: [],
          unscored: true,
        }) as Job
    );
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
  });
}
