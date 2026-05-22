import { Job, JobStatusesMap } from "@/types/job";
import {
  loadProfile,
  mergeJobsWithProfile,
  saveJobStatusEntry,
} from "@/lib/profileStore";

/** @deprecated Use profileStore — kept for imports */
export function loadJobStatuses(): JobStatusesMap {
  return loadProfile().statuses;
}

export function saveJobStatus(
  jobId: string,
  entry: JobStatusesMap[string]
): void {
  saveJobStatusEntry(jobId, entry);
}

export function mergeJobsWithStorage(jobs: Job[]): Job[] {
  return mergeJobsWithProfile(jobs, loadProfile());
}
