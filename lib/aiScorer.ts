import OpenAI from "openai";
import { Job } from "@/types/job";
import { MY_PROFILE } from "@/lib/profile";
import type { ScoreCacheEntry } from "@/lib/profileStore";

export const CANDIDATE_PROFILE = `${MY_PROFILE.name} — ${MY_PROFILE.targetRoles.slice(0, 4).join(", ")}. ${MY_PROFILE.summary.replace(/\s+/g, " ").trim().slice(0, 500)}`;

const SYSTEM_PROMPT = `You are a job match scorer. Given a job posting and a candidate profile, return ONLY a JSON object with: score (0-100 integer), reason (one sentence), strengths (array of 2-3 matching points), gaps (array of 0-2 missing points). No markdown, no preamble.`;

export interface AiScoreResult {
  score: number;
  reason: string;
  strengths: string[];
  gaps: string[];
}

function clampScore(n: number): number {
  return Math.max(0, Math.min(100, Math.round(n)));
}

function parseAiScore(raw: string): AiScoreResult | null {
  try {
    const clean = raw.replace(/```json|```/g, "").trim();
    const parsed = JSON.parse(clean) as {
      score?: number;
      reason?: string;
      strengths?: string[];
      gaps?: string[];
    };
    if (typeof parsed.score !== "number") return null;
    return {
      score: clampScore(parsed.score),
      reason: String(parsed.reason || "").trim(),
      strengths: Array.isArray(parsed.strengths)
        ? parsed.strengths.map(String).slice(0, 3)
        : [],
      gaps: Array.isArray(parsed.gaps) ? parsed.gaps.map(String).slice(0, 2) : [],
    };
  } catch {
    return null;
  }
}

export async function scoreJobWithAI(
  job: Partial<Job>,
  openai: OpenAI
): Promise<AiScoreResult | null> {
  const description = (job.description || "").slice(0, 2500);

  const userPrompt = `CANDIDATE PROFILE:
${CANDIDATE_PROFILE}

JOB TITLE: ${job.title}
COMPANY: ${job.company}
LOCATION: ${job.location}

JOB DESCRIPTION:
${description}`;

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: userPrompt },
      ],
      temperature: 0.3,
      max_tokens: 300,
      response_format: { type: "json_object" },
    });

    const content = completion.choices[0]?.message?.content;
    if (!content) return null;
    return parseAiScore(content);
  } catch (e) {
    console.error("OpenAI score error:", e);
    return null;
  }
}

/** Score jobs with limited concurrency to stay within serverless timeouts */
export async function scoreJobsWithAI(
  jobs: Partial<Job>[],
  openai: OpenAI,
  concurrency = 4
): Promise<Job[]> {
  const results: Job[] = [];

  for (let i = 0; i < jobs.length; i += concurrency) {
    const chunk = jobs.slice(i, i + concurrency);
    const scored = await Promise.all(
      chunk.map(async (job) => {
        const ai = await scoreJobWithAI(job, openai);
        if (!ai) {
          return {
            ...job,
            matchScore: 0,
            matchReasons: [],
            matchNote: undefined,
            unscored: true,
          } as Job;
        }

        const matchReasons = [
          ...ai.strengths,
          ...ai.gaps.map((g) => `Gap: ${g}`),
        ].slice(0, 8);

        return {
          ...job,
          matchScore: ai.score,
          matchReasons,
          matchNote: ai.reason,
          unscored: false,
        } as Job;
      })
    );
    results.push(...scored);
  }

  return results;
}

/** Apply client score cache — skips OpenAI for known job IDs */
export function applyCachedScores(
  jobs: Partial<Job>[],
  scoreCache: Record<string, ScoreCacheEntry>
): Partial<Job>[] {
  return jobs.map((job) => {
    if (!job.id) return job;
    const cached = scoreCache[job.id];
    if (!cached) return job;
    return {
      ...job,
      matchScore: cached.matchScore,
      matchReasons: cached.matchReasons,
      matchNote: cached.matchNote,
      unscored: false,
    };
  });
}
