import express, { NextFunction, Request, Response } from "express";
import cors from "cors";
import { healthRouter } from "./routes/health";
import { jobsRouter } from "./routes/jobs";

const app = express();

const FRONTEND_ORIGIN = process.env.FRONTEND_ORIGIN || "http://localhost:5173";

app.use(
  cors({
    origin: FRONTEND_ORIGIN,
    credentials: false,
  })
);
app.use(express.json());

app.use("/api", healthRouter);
app.use("/api", jobsRouter);

// Anything under /api that didn't match a route above.
app.use("/api", (_req: Request, res: Response) => {
  res.status(404).json({ error: "not found" });
});

// Express error handler — keeps a bug in a route handler from crashing the
// process; always responds with the contract's { error } shape.
// eslint-disable-next-line @typescript-eslint/no-unused-vars
app.use((err: unknown, _req: Request, res: Response, _next: NextFunction) => {
  console.error("Unhandled route error:", err);
  if (!res.headersSent) {
    res.status(500).json({ error: "Internal server error." });
  }
});

const PORT = Number(process.env.PORT) || 8787;

app.listen(PORT, () => {
  console.log(`YouTube Clip Studio backend listening on http://localhost:${PORT}`);
  console.log(`Allowing CORS origin: ${FRONTEND_ORIGIN}`);
});

// Defense in depth: a bug in the async job worker should never take the
// whole server down. processJob() already catches everything internally
// and marks the job failed, but these guards are the last line of defense.
process.on("unhandledRejection", (reason) => {
  console.error("Unhandled promise rejection:", reason);
});
process.on("uncaughtException", (err) => {
  console.error("Uncaught exception:", err);
});
