import { Job, JobStatusesMap } from "@/types/job";

const STORAGE_KEY = "jobStatuses";

export function loadJobStatuses(): JobStatusesMap {
  if (typeof window === "undefined") return {};
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}");
  } catch {
    return {};
  }
}

export function saveJobStatus(
  jobId: string,
  entry: JobStatusesMap[string]
): void {
  const all = loadJobStatuses();
  all[jobId] = { ...all[jobId], ...entry };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(all));
}

export function mergeJobsWithStorage(jobs: Job[]): Job[] {
  const statuses = loadJobStatuses();
  return jobs.map((job) => {
    const saved = statuses[job.id];
    if (!saved) return job;
    return {
      ...job,
      status: saved.status ?? job.status,
      tailoredSummary: saved.tailoredSummary ?? job.tailoredSummary,
      tailoredCoverLetter:
        saved.tailoredCoverLetter ?? job.tailoredCoverLetter,
      tailoredAt: saved.tailoredAt ?? job.tailoredAt,
    };
  });
}
