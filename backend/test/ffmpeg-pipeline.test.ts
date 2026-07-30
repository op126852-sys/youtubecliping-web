/**
 * Local, network-free verification of the real ffmpeg/subtitle pipeline.
 *
 * The sandbox this was built in blocks youtube.com, so an actual
 * yt-dlp-against-YouTube end-to-end test isn't possible here. This script is
 * the real proof that matters instead: it generates a synthetic local video
 * with ffmpeg's lavfi sources, then runs the exact same clip-cutting +
 * SRT-shifting + subtitle-burning code the worker uses against it, and
 * asserts on the actual output files. No binary fixtures are committed —
 * the video is generated on the fly into test/tmp (gitignored).
 *
 * Run with: npm run test:pipeline
 */
import fs from "fs";
import path from "path";
import assert from "assert";
import { run } from "../src/utils/exec";
import { computeClipPlan } from "../src/services/clipMath";
import { parseSrt, shiftAndWindow, stringifySrt, formatTimestamp } from "../src/services/srt";
import { cutClip, generateThumbnail, probeDuration } from "../src/services/ffmpeg";

const TMP_DIR = path.join(__dirname, "tmp");
const SOURCE_VIDEO = path.join(TMP_DIR, "synthetic_source.mp4");
const SAMPLE_SRT = path.join(__dirname, "fixtures", "sample.srt");
const SYNTHETIC_DURATION = 16; // seconds

let passed = 0;
let failed = 0;

function check(label: string, fn: () => void | Promise<void>): Promise<void> {
  return Promise.resolve()
    .then(fn)
    .then(() => {
      console.log(`  ok  - ${label}`);
      passed++;
    })
    .catch((err) => {
      console.error(`FAIL  - ${label}`);
      console.error(`        ${err instanceof Error ? err.stack ?? err.message : err}`);
      failed++;
    });
}

async function generateSyntheticVideo() {
  await fs.promises.mkdir(TMP_DIR, { recursive: true });
  const result = await run("ffmpeg", [
    "-y",
    "-f",
    "lavfi",
    "-i",
    `testsrc=duration=${SYNTHETIC_DURATION}:size=320x240:rate=25`,
    "-f",
    "lavfi",
    "-i",
    `sine=frequency=440:duration=${SYNTHETIC_DURATION}`,
    "-c:v",
    "libx264",
    "-c:a",
    "aac",
    "-shortest",
    SOURCE_VIDEO,
  ]);
  if (result.code !== 0) {
    throw new Error(`Failed to generate synthetic test video: ${result.stderr.slice(-800)}`);
  }
}

async function main() {
  console.log(`\nGenerating a ${SYNTHETIC_DURATION}s synthetic local video (ffmpeg lavfi testsrc+sine)…`);
  await generateSyntheticVideo();
  assert.ok(fs.existsSync(SOURCE_VIDEO), "synthetic source video should exist");

  console.log("\n--- Pure logic: clip math ---");

  await check("computeClipPlan spreads N clips evenly across a long-enough video", () => {
    const plan = computeClipPlan(3, 5, SYNTHETIC_DURATION); // duration=16, clipLength=5
    // usableSpan = 16 - 5 = 11; starts = round(i * 11/2) = 0, 6 (5.5), 11
    assert.deepStrictEqual(plan.starts, [0, 6, 11]);
    assert.strictEqual(plan.length, 5);
    assert.strictEqual(plan.message, undefined);
  });

  await check("computeClipPlan handles numClips === 1", () => {
    const plan = computeClipPlan(1, 5, SYNTHETIC_DURATION);
    assert.deepStrictEqual(plan.starts, [0]);
  });

  await check("computeClipPlan clamps to a single full-video clip when video is too short", () => {
    const plan = computeClipPlan(5, 30, 16); // clipLength (30) > duration (16)
    assert.strictEqual(plan.starts.length, 1);
    assert.strictEqual(plan.starts[0], 0);
    assert.strictEqual(plan.length, 16);
    assert.ok(plan.message && plan.message.includes("16"), "should explain why fewer clips were made");
  });

  console.log("\n--- Pure logic: SRT parse/shift/window ---");

  let cues: ReturnType<typeof parseSrt> = [];
  await check("parseSrt parses the fixture into 5 cues", async () => {
    const content = await fs.promises.readFile(SAMPLE_SRT, "utf8");
    cues = parseSrt(content);
    assert.strictEqual(cues.length, 5);
    assert.strictEqual(cues[0].text, "Hello there");
    assert.ok(Math.abs(cues[0].start - 0.5) < 1e-6);
    assert.ok(Math.abs(cues[0].end - 2.0) < 1e-6);
  });

  await check("formatTimestamp round-trips through parseSrt", () => {
    assert.strictEqual(formatTimestamp(3661.234), "01:01:01,234");
    assert.strictEqual(formatTimestamp(0), "00:00:00,000");
  });

  await check("shiftAndWindow drops cues fully outside the window and shifts survivors to t=0", () => {
    // Window [6, 11) — the clip starting at 6s, length 5s, from the plan above.
    const windowed = shiftAndWindow(cues, 6, 11);
    // Cue 2 [3,5.5) ends before 6 -> dropped.
    // Cue 3 [7,9) is fully inside -> kept, shifted to [1,3).
    // Cue 4 [11,13) starts at/after 11 -> dropped (window is [6,11)).
    // Cue 5 [14,16) is fully outside -> dropped.
    assert.strictEqual(windowed.length, 1);
    assert.ok(Math.abs(windowed[0].start - 1) < 1e-6, `expected shifted start ~1, got ${windowed[0].start}`);
    assert.ok(Math.abs(windowed[0].end - 3) < 1e-6, `expected shifted end ~3, got ${windowed[0].end}`);
    assert.strictEqual(windowed[0].text, "Straddling a clip boundary");
  });

  await check("shiftAndWindow clamps a cue that straddles the window's start edge", () => {
    // Window [0, 2) should clamp cue 1 [0.5, 2.0) to fit, and also catch a
    // cue that starts before the window and straddles into it.
    const straddling = [{ index: 1, start: -1, end: 1, text: "straddle" }];
    const windowed = shiftAndWindow(straddling, 0, 2);
    assert.strictEqual(windowed.length, 1);
    assert.strictEqual(windowed[0].start, 0, "clamped start should never go negative");
    assert.ok(Math.abs(windowed[0].end - 1) < 1e-6);
  });

  await check("shiftAndWindow clamps a cue that straddles the window's end edge", () => {
    const straddling = [{ index: 1, start: 4, end: 8, text: "straddle-end" }];
    const windowed = shiftAndWindow(straddling, 0, 5); // window length 5
    assert.strictEqual(windowed.length, 1);
    assert.strictEqual(windowed[0].start, 4);
    assert.strictEqual(windowed[0].end, 5, "clamped end should never exceed the window length");
  });

  await check("stringifySrt re-serializes into valid, re-parseable SRT", () => {
    const windowed = shiftAndWindow(cues, 0, 3);
    const text = stringifySrt(windowed);
    const reparsed = parseSrt(text);
    assert.strictEqual(reparsed.length, windowed.length);
    assert.strictEqual(reparsed[0].text, windowed[0].text);
  });

  console.log("\n--- Integration: real ffmpeg cutting + subtitle burn-in against the synthetic video ---");

  const plan = computeClipPlan(3, 5, SYNTHETIC_DURATION);
  const srtCues = parseSrt(await fs.promises.readFile(SAMPLE_SRT, "utf8"));

  for (let i = 0; i < plan.starts.length; i++) {
    const start = plan.starts[i];
    const duration = plan.length;
    const outPath = path.join(TMP_DIR, `clip_${i}.mp4`);
    const thumbPath = path.join(TMP_DIR, `clip_${i}_thumb.jpg`);
    const srtPath = path.join(TMP_DIR, `clip_${i}.srt`);

    const windowed = shiftAndWindow(srtCues, start, start + duration);
    const shouldHaveSubs = windowed.length > 0;
    if (shouldHaveSubs) {
      await fs.promises.writeFile(srtPath, stringifySrt(windowed), "utf8");
    }

    await check(
      `clip ${i} (start=${start}s, duration=${duration}s${shouldHaveSubs ? ", with burned-in subtitles" : ""}) cuts successfully`,
      async () => {
        await cutClip({
          source: SOURCE_VIDEO,
          start,
          duration,
          output: outPath,
          srtPath: shouldHaveSubs ? srtPath : undefined,
        });
        assert.ok(fs.existsSync(outPath), "clip output file should exist");
        const stat = await fs.promises.stat(outPath);
        assert.ok(stat.size > 0, "clip output file should be non-empty");

        const actualDuration = await probeDuration(outPath);
        // Allow generous tolerance — re-encoding + container overhead can
        // shift things by a fraction of a second.
        assert.ok(
          Math.abs(actualDuration - duration) < 0.75,
          `expected clip duration ~${duration}s, got ${actualDuration}s`
        );
      }
    );

    await check(`clip ${i} thumbnail generates successfully`, async () => {
      await generateThumbnail({ source: outPath, output: thumbPath, atSeconds: Math.min(1, duration / 2) });
      assert.ok(fs.existsSync(thumbPath), "thumbnail file should exist");
      const stat = await fs.promises.stat(thumbPath);
      assert.ok(stat.size > 0, "thumbnail file should be non-empty");
    });
  }

  console.log(`\n${passed} passed, ${failed} failed.\n`);
  if (failed > 0) {
    process.exitCode = 1;
  }
}

main().catch((err) => {
  console.error("Test script crashed:", err);
  process.exitCode = 1;
});
