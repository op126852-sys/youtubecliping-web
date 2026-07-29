import { run } from "../utils/exec";

/**
 * Escape a filesystem path for safe use inside an ffmpeg filtergraph value
 * (e.g. `subtitles=<this>`). Per ffmpeg's own quoting rules, wrapping a
 * value in single quotes protects everything inside it — including ':',
 * which would otherwise be parsed as a filter-option separator — except a
 * literal backslash or single quote, which must themselves be escaped by
 * prefixing with '\'. A literal `'` is embedded by closing the quote,
 * emitting an escaped quote, and reopening the quote (`'\''`).
 *
 * Our own generated paths (uuid-based, under storage/) never actually
 * contain ':', '\', or "'", but this is defensive/correct regardless.
 */
export function escapeFilterPath(filePath: string): string {
  const escaped = filePath.replace(/\\/g, "\\\\").replace(/'/g, "'\\''");
  return `'${escaped}'`;
}

export async function probeDuration(filePath: string): Promise<number> {
  let result;
  try {
    result = await run("ffprobe", [
      "-v",
      "error",
      "-show_entries",
      "format=duration",
      "-of",
      "json",
      filePath,
    ]);
  } catch {
    throw new Error("Could not run ffprobe on the server. Make sure ffmpeg/ffprobe is on PATH.");
  }
  if (result.code !== 0) {
    throw new Error(`ffprobe failed to read duration: ${result.stderr.slice(-500)}`);
  }
  const data = JSON.parse(result.stdout);
  const duration = parseFloat(data?.format?.duration);
  if (!Number.isFinite(duration)) {
    throw new Error("ffprobe returned an unreadable duration.");
  }
  return duration;
}

export interface CutClipOptions {
  source: string;
  start: number; // seconds
  duration: number; // seconds
  output: string;
  srtPath?: string; // already shifted/windowed for this clip
}

/**
 * Cuts `[start, start+duration)` out of `source` into `output`. Always
 * re-encodes (rather than -c copy) so that: (a) cuts land exactly on the
 * requested boundaries regardless of keyframe placement, and (b) the same
 * code path works whether or not we're burning subtitles in.
 */
export async function cutClip(opts: CutClipOptions): Promise<void> {
  const args = ["-y", "-ss", String(opts.start), "-i", opts.source, "-t", String(opts.duration)];

  if (opts.srtPath) {
    args.push("-vf", `subtitles=${escapeFilterPath(opts.srtPath)}`);
  }

  args.push(
    "-c:v",
    "libx264",
    "-preset",
    "veryfast",
    "-c:a",
    "aac",
    "-movflags",
    "+faststart",
    opts.output
  );

  let result;
  try {
    result = await run("ffmpeg", args);
  } catch {
    throw new Error("Could not run ffmpeg on the server. Make sure ffmpeg is installed and on PATH.");
  }
  if (result.code !== 0) {
    throw new Error(`ffmpeg failed to cut clip: ${result.stderr.slice(-800)}`);
  }
}

export interface ThumbnailOptions {
  source: string;
  output: string;
  atSeconds?: number;
}

export async function generateThumbnail(opts: ThumbnailOptions): Promise<void> {
  const at = Math.max(opts.atSeconds ?? 0, 0);
  let result;
  try {
    result = await run("ffmpeg", [
      "-y",
      "-ss",
      String(at),
      "-i",
      opts.source,
      "-frames:v",
      "1",
      "-q:v",
      "3",
      opts.output,
    ]);
  } catch {
    throw new Error("Could not run ffmpeg on the server. Make sure ffmpeg is installed and on PATH.");
  }
  if (result.code !== 0) {
    throw new Error(`ffmpeg failed to generate thumbnail: ${result.stderr.slice(-500)}`);
  }
}
