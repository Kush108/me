import { Job } from "@/types/job";
import { MATCH_KEYWORDS } from "./jobSources";

export function scoreJob(job: Partial<Job>): Job {
  const text =
    `${job.title} ${job.company} ${job.description} ${job.location}`.toLowerCase();
  let score = 0;
  const reasons: string[] = [];

  for (const kw of MATCH_KEYWORDS.high) {
    if (text.includes(kw.toLowerCase())) {
      score += 10;
      reasons.push(kw);
    }
  }
  for (const kw of MATCH_KEYWORDS.medium) {
    if (text.includes(kw.toLowerCase())) {
      score += 5;
      reasons.push(kw);
    }
  }
  for (const kw of MATCH_KEYWORDS.low) {
    if (text.includes(kw.toLowerCase())) {
      score += 2;
    }
  }

  const preferredEmployers = [
    "government",
    "city of edmonton",
    "alberta",
    "nait",
    "atb",
    "telus",
  ];
  if (preferredEmployers.some((e) => text.includes(e))) score += 15;

  score = Math.min(score, 100);

  return {
    ...job,
    matchScore: score,
    matchReasons: [...new Set(reasons)].slice(0, 8),
  } as Job;
}
