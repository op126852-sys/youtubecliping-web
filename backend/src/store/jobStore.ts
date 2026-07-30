import { randomUUID } from "crypto";
import { ClipOptions, Job } from "../types";

// In-memory job store. No database per the contract's scope — jobs vanish on
// server restart, which is fine for this anonymous, job-ID-based v1.
const jobs = new Map<string, Job>();

export function createJob(options: ClipOptions): Job {
  const now = new Date().toISOString();
  const job: Job = {
    id: randomUUID(),
    status: "queued",
    progress: 0,
    message: "Queued.",
    sourceUrl: options.url,
    options,
    clips: [],
    createdAt: now,
    updatedAt: now,
  };
  jobs.set(job.id, job);
  return job;
}

export function getJob(id: string): Job | undefined {
  return jobs.get(id);
}

export function updateJob(id: string, patch: Partial<Job>): Job | undefined {
  const existing = jobs.get(id);
  if (!existing) return undefined;
  const updated: Job = { ...existing, ...patch, updatedAt: new Date().toISOString() };
  jobs.set(id, updated);
  return updated;
}

export function deleteJob(id: string): boolean {
  return jobs.delete(id);
}
