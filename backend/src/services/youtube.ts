import fs from "fs";
import path from "path";
import { run } from "../utils/exec";

export interface VideoInfo {
  title: string;
  duration: number; // seconds
  thumbnail?: string;
}

const VIDEO_EXTENSIONS = [".mp4", ".mkv", ".webm"];

/** Strip yt-dlp's verbose "ERROR: [youtube] ..." noise down to something a user can read. */
function cleanYtDlpError(stderr: string): string | undefined {
  const lines = stderr
    .split("\n")
    .map((l) => l.trim())
    .filter((l) => l.length > 0);
  const errorLine = lines.find((l) => l.startsWith("ERROR:")) ?? lines[lines.length - 1];
  if (!errorLine) return undefined;
  return errorLine.replace(/^ERROR:\s*/, "").slice(0, 300);
}

/** Fetch video metadata (title/duration/thumbnail) without downloading the media. */
export async function getVideoInfo(url: string): Promise<VideoInfo> {
  let result;
  try {
    result = await run("yt-dlp", ["--dump-single-json", "--no-warnings", "--no-playlist", url]);
  } catch (err) {
    throw new Error(
      "Could not run yt-dlp on the server. Make sure yt-dlp is installed and on PATH."
    );
  }

  if (result.code !== 0) {
    throw new Error(cleanYtDlpError(result.stderr) ?? "Failed to fetch video info from YouTube.");
  }

  let data: any;
  try {
    data = JSON.parse(result.stdout);
  } catch {
    throw new Error("Failed to parse video info returned by yt-dlp.");
  }

  return {
    title: typeof data.title === "string" ? data.title : "Untitled video",
    duration: Number(data.duration) || 0,
    thumbnail: typeof data.thumbnail === "string" ? data.thumbnail : undefined,
  };
}

/** Download the source video into outDir as source.<ext>, returns the full path. */
export async function downloadVideo(url: string, outDir: string): Promise<string> {
  const outTemplate = path.join(outDir, "source.%(ext)s");

  let result;
  try {
    result = await run("yt-dlp", [
      "-f",
      "bv*[ext=mp4]+ba[ext=m4a]/b[ext=mp4]/best",
      "--no-playlist",
      "--merge-output-format",
      "mp4",
      "-o",
      outTemplate,
      url,
    ]);
  } catch {
    throw new Error(
      "Could not run yt-dlp on the server. Make sure yt-dlp is installed and on PATH."
    );
  }

  if (result.code !== 0) {
    throw new Error(cleanYtDlpError(result.stderr) ?? "Failed to download the video.");
  }

  const files = await fs.promises.readdir(outDir);
  const videoFile = files.find(
    (f) => f.startsWith("source.") && VIDEO_EXTENSIONS.includes(path.extname(f).toLowerCase())
  );
  if (!videoFile) {
    throw new Error("yt-dlp reported success but the downloaded video file could not be found.");
  }
  return path.join(outDir, videoFile);
}

/**
 * Best-effort: fetch YouTube's own (or auto-generated) captions for the
 * whole video, converted to SRT. Returns undefined (not a thrown error) if
 * no captions are available in the requested language — that's a normal,
 * non-fatal outcome, not a job failure.
 */
export async function downloadYoutubeSubtitles(
  url: string,
  outDir: string,
  lang: string
): Promise<string | undefined> {
  const outTemplate = path.join(outDir, "source.%(ext)s");

  let result;
  try {
    result = await run("yt-dlp", [
      "--write-subs",
      "--write-auto-subs",
      "--sub-langs",
      lang,
      "--convert-subs",
      "srt",
      "--skip-download",
      "--no-playlist",
      "-o",
      outTemplate,
      url,
    ]);
  } catch {
    return undefined;
  }

  if (result.code !== 0) return undefined;

  const files = await fs.promises.readdir(outDir);
  const srtFile = files.find((f) => f.startsWith("source.") && f.toLowerCase().endsWith(".srt"));
  return srtFile ? path.join(outDir, srtFile) : undefined;
}
