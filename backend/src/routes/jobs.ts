import fs from "fs";
import { Router } from "express";
import { validateClipOptions } from "../services/validation";
import { createJob, getJob, deleteJob } from "../store/jobStore";
import { processJob } from "../services/worker";
import { clipVideoPath, clipThumbPath, jobDir } from "../paths";

export const jobsRouter = Router();

jobsRouter.post("/jobs", (req, res) => {
  const result = validateClipOptions(req.body);
  if (!result.ok) {
    res.status(400).json({ error: result.error, field: result.field });
    return;
  }

  const job = createJob(result.value);

  // Return immediately — never block the response on the pipeline. Any
  // failure inside processJob is caught internally and turns into a
  // `failed` job status, but we belt-and-suspenders it here too so a bug
  // in that error handling can never become an unhandled rejection.
  setImmediate(() => {
    processJob(job.id).catch((err) => {
      console.error(`Unexpected error processing job ${job.id}:`, err);
    });
  });

  res.status(202).json({ jobId: job.id });
});

jobsRouter.get("/jobs/:id", (req, res) => {
  const job = getJob(req.params.id);
  if (!job) {
    res.status(404).json({ error: "job not found" });
    return;
  }
  res.json(job);
});

jobsRouter.get("/jobs/:id/clips/:clipId/download", (req, res) => {
  const job = getJob(req.params.id);
  if (!job) {
    res.status(404).json({ error: "job not found" });
    return;
  }
  const clip = job.clips.find((c) => c.id === req.params.clipId);
  if (!clip) {
    res.status(404).json({ error: "clip not found" });
    return;
  }

  const filePath = clipVideoPath(job.id, clip.id);
  if (!fs.existsSync(filePath)) {
    res.status(404).json({ error: "clip file not found" });
    return;
  }

  res.setHeader("Content-Type", "video/mp4");
  res.setHeader("Content-Disposition", `attachment; filename="clip-${clip.index + 1}.mp4"`);

  const stream = fs.createReadStream(filePath);
  stream.on("error", () => {
    if (!res.headersSent) {
      res.status(404).json({ error: "clip file not found" });
    } else {
      res.end();
    }
  });
  stream.pipe(res);
});

jobsRouter.get("/jobs/:id/clips/:clipId/thumbnail", (req, res) => {
  const job = getJob(req.params.id);
  if (!job) {
    res.status(404).json({ error: "job not found" });
    return;
  }
  const clip = job.clips.find((c) => c.id === req.params.clipId);
  if (!clip) {
    res.status(404).json({ error: "clip not found" });
    return;
  }

  const filePath = clipThumbPath(job.id, clip.id);
  if (!fs.existsSync(filePath)) {
    res.status(404).json({ error: "thumbnail not found" });
    return;
  }

  res.setHeader("Content-Type", "image/jpeg");
  const stream = fs.createReadStream(filePath);
  stream.on("error", () => {
    if (!res.headersSent) {
      res.status(404).json({ error: "thumbnail not found" });
    } else {
      res.end();
    }
  });
  stream.pipe(res);
});

jobsRouter.delete("/jobs/:id", async (req, res) => {
  const job = getJob(req.params.id);
  if (!job) {
    res.status(404).json({ error: "job not found" });
    return;
  }

  deleteJob(job.id);

  try {
    await fs.promises.rm(jobDir(job.id), { recursive: true, force: true });
  } catch (err) {
    console.error(`Failed to clean up storage for job ${job.id}:`, err);
  }

  res.status(204).end();
});
