import { NextResponse } from "next/server";
import { JOB_FEEDS } from "@/lib/jobSources";
import { parseRssFeed } from "@/lib/rssParser";
import { scoreJob } from "@/lib/scorer";
import { isAuthenticated } from "@/lib/auth";
import { Job } from "@/types/job";

export async function GET() {
  if (!isAuthenticated()) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const allJobs: Job[] = [];
  const feedErrors: string[] = [];

  await Promise.all(
    JOB_FEEDS.map(async (feed) => {
      try {
        const response = await fetch(feed.url, {
          next: { revalidate: 1800 },
          headers: {
            "User-Agent": "Mozilla/5.0 (compatible; JobBot/1.0)",
            Accept: "application/rss+xml, application/xml, text/xml, */*",
          },
        });

        if (!response.ok) {
          feedErrors.push(`${feed.id}: HTTP ${response.status}`);
          return;
        }

        const xml = await response.text();
        const jobs = await parseRssFeed(xml, feed);
        const scoredJobs = jobs.map((job) => scoreJob(job));
        allJobs.push(...scoredJobs);
      } catch (e) {
        console.error(`Feed error [${feed.id}]:`, e);
        feedErrors.push(`${feed.id}: fetch failed`);
      }
    })
  );

  const seen = new Set<string>();
  const deduped = allJobs.filter((job) => {
    if (seen.has(job.id)) return false;
    seen.add(job.id);
    return true;
  });

  deduped.sort(
    (a, b) =>
      b.matchScore - a.matchScore ||
      new Date(b.postedDate).getTime() - new Date(a.postedDate).getTime()
  );

  return NextResponse.json({
    jobs: deduped,
    fetchedAt: new Date().toISOString(),
    feedErrors: feedErrors.length ? feedErrors : undefined,
  });
}
