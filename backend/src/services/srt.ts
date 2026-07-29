// Minimal hand-rolled SRT parse/shift/window utility. No npm dependency —
// SRT is simple enough to parse by hand, and this is exactly the piece the
// task calls out as the trickiest bit to get right:
//
// When we `ffmpeg -ss <startTime> -i source ...` to cut a clip, the filter
// graph's timeline resets to 0 for that clip. But the SRT we got from
// yt-dlp (or whisper) has timestamps relative to the *original full video*.
// So before burning subtitles into clip N, we must:
//   1. Drop cues entirely outside [startTime, startTime + duration]
//   2. Shift the surviving cues' start/end by -startTime
//   3. Clamp any cue that straddles a window edge to stay inside [0, duration]

export interface SrtCue {
  index: number;
  start: number; // seconds, float
  end: number; // seconds, float
}

export interface SrtCueWithText extends SrtCue {
  text: string;
}

const TIMESTAMP_RE = /(\d{1,2}):(\d{2}):(\d{2})[.,](\d{1,3})/;
const TIMESTAMP_LINE_RE = new RegExp(`${TIMESTAMP_RE.source}\\s*-->\\s*${TIMESTAMP_RE.source}`);

function parseTimestamp(h: string, m: string, s: string, ms: string): number {
  const millis = ms.padEnd(3, "0").slice(0, 3);
  return (
    parseInt(h, 10) * 3600 +
    parseInt(m, 10) * 60 +
    parseInt(s, 10) +
    parseInt(millis, 10) / 1000
  );
}

export function formatTimestamp(totalSeconds: number): string {
  const clamped = Math.max(0, totalSeconds);
  const h = Math.floor(clamped / 3600);
  const m = Math.floor((clamped % 3600) / 60);
  const s = Math.floor(clamped % 60);
  const ms = Math.round((clamped - Math.floor(clamped)) * 1000);
  const pad = (n: number, len = 2) => String(n).padStart(len, "0");
  return `${pad(h)}:${pad(m)}:${pad(s)},${pad(ms, 3)}`;
}

/** Parse raw SRT text into cues. Tolerant of \r\n, BOM, and stray blank lines. */
export function parseSrt(content: string): SrtCueWithText[] {
  const normalized = content.replace(/^﻿/, "").replace(/\r\n/g, "\n");
  const blocks = normalized.split(/\n\s*\n/).map((b) => b.trim()).filter(Boolean);

  const cues: SrtCueWithText[] = [];
  let fallbackIndex = 1;

  for (const block of blocks) {
    const lines = block.split("\n");
    if (lines.length < 2) continue;

    // First line is usually a numeric index, but be tolerant if it's missing
    // and the timestamp line comes first.
    let cursor = 0;
    let index = fallbackIndex;
    if (/^\d+$/.test(lines[0].trim())) {
      index = parseInt(lines[0].trim(), 10);
      cursor = 1;
    }

    const timeLine = lines[cursor];
    if (!timeLine) continue;
    const match = timeLine.match(TIMESTAMP_LINE_RE);
    if (!match) continue;

    const start = parseTimestamp(match[1], match[2], match[3], match[4]);
    const end = parseTimestamp(match[5], match[6], match[7], match[8]);
    const text = lines.slice(cursor + 1).join("\n").trim();

    cues.push({ index, start, end, text });
    fallbackIndex++;
  }

  return cues;
}

/**
 * Keep only cues overlapping [windowStart, windowEnd), shift them so
 * windowStart becomes t=0, and clamp any cue that straddles either edge so
 * it never runs before 0 or past the clip's own duration.
 */
export function shiftAndWindow(
  cues: SrtCueWithText[],
  windowStart: number,
  windowEnd: number
): SrtCueWithText[] {
  const windowLength = Math.max(windowEnd - windowStart, 0);
  const result: SrtCueWithText[] = [];
  let nextIndex = 1;

  for (const cue of cues) {
    if (cue.end <= windowStart || cue.start >= windowEnd) continue; // no overlap

    const shiftedStart = Math.max(cue.start - windowStart, 0);
    const shiftedEnd = Math.min(cue.end - windowStart, windowLength);
    if (shiftedEnd <= shiftedStart) continue;

    result.push({
      index: nextIndex++,
      start: shiftedStart,
      end: shiftedEnd,
      text: cue.text,
    });
  }

  return result;
}

export function stringifySrt(cues: SrtCueWithText[]): string {
  return cues
    .map(
      (cue) =>
        `${cue.index}\n${formatTimestamp(cue.start)} --> ${formatTimestamp(cue.end)}\n${cue.text}\n`
    )
    .join("\n");
}
