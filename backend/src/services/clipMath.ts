export interface ClipPlan {
  count: number;
  length: number; // seconds, per clip
  starts: number[]; // seconds into the source video
  message?: string; // set when we deviated from the requested numClips
}

/**
 * Computes non-overlapping (or evenly-overlapping, if the video is too
 * short) clip start times spread across the whole video.
 *
 *   usableSpan = max(duration - clipLength, 0)
 *   start[i]   = round(i * usableSpan / (numClips - 1))   for numClips > 1
 *   start[0]   = 0                                        for numClips === 1
 *
 * If the video is shorter than (or equal to) the requested clip length, we
 * can't make `numClips` distinct clips of that length at all — clamp to a
 * single clip covering the full video and explain why via `message`.
 */
export function computeClipPlan(numClips: number, clipLength: number, duration: number): ClipPlan {
  if (duration <= clipLength) {
    return {
      count: 1,
      length: Math.max(duration, 0.1),
      starts: [0],
      message: `The video is only ${Math.round(duration)}s long, shorter than the requested ${clipLength}s clip length — created a single clip covering the full video instead of ${numClips}.`,
    };
  }

  const usableSpan = Math.max(duration - clipLength, 0);
  const starts: number[] = [];

  if (numClips === 1) {
    starts.push(0);
  } else {
    for (let i = 0; i < numClips; i++) {
      starts.push(Math.round((i * usableSpan) / (numClips - 1)));
    }
  }

  return { count: numClips, length: clipLength, starts };
}
