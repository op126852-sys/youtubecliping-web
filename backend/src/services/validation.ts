import { ClipOptions, SubtitleMode } from "../types";

export type ValidationResult =
  | { ok: true; value: ClipOptions }
  | { ok: false; error: string; field?: string };

// youtube.com/watch?v=..., youtu.be/..., youtube.com/shorts/... (with or
// without scheme/www, trailing query params, etc.)
const YOUTUBE_URL_RE =
  /^(https?:\/\/)?(www\.|m\.)?(youtube\.com\/(watch\?v=|shorts\/)[\w-]{6,}|youtu\.be\/[\w-]{6,})/i;

const SUBTITLE_MODES: SubtitleMode[] = ["none", "youtube", "auto-generate"];

export function validateClipOptions(body: unknown): ValidationResult {
  if (!body || typeof body !== "object") {
    return { ok: false, error: "Request body must be a JSON object." };
  }

  const { url, numClips, clipLength, subtitles, subtitleLang } = body as Record<string, unknown>;

  if (typeof url !== "string" || url.trim().length === 0) {
    return { ok: false, error: "A video URL is required.", field: "url" };
  }
  if (!YOUTUBE_URL_RE.test(url.trim())) {
    return {
      ok: false,
      error: "That doesn't look like a YouTube link.",
      field: "url",
    };
  }

  if (typeof numClips !== "number" || !Number.isInteger(numClips) || numClips < 1 || numClips > 10) {
    return {
      ok: false,
      error: "Number of clips must be a whole number between 1 and 10.",
      field: "numClips",
    };
  }

  if (
    typeof clipLength !== "number" ||
    !Number.isInteger(clipLength) ||
    clipLength < 5 ||
    clipLength > 180
  ) {
    return {
      ok: false,
      error: "Clip length must be a whole number of seconds between 5 and 180.",
      field: "clipLength",
    };
  }

  if (typeof subtitles !== "string" || !SUBTITLE_MODES.includes(subtitles as SubtitleMode)) {
    return {
      ok: false,
      error: "Subtitles mode must be one of: none, youtube, auto-generate.",
      field: "subtitles",
    };
  }

  if (subtitleLang !== undefined && (typeof subtitleLang !== "string" || subtitleLang.trim().length === 0)) {
    return {
      ok: false,
      error: "subtitleLang must be a non-empty string when provided.",
      field: "subtitleLang",
    };
  }

  return {
    ok: true,
    value: {
      url: url.trim(),
      numClips,
      clipLength,
      subtitles: subtitles as SubtitleMode,
      subtitleLang: typeof subtitleLang === "string" ? subtitleLang.trim() : undefined,
    },
  };
}
