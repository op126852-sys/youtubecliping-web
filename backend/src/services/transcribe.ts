import path from "path";
import { run } from "../utils/exec";

// Path to the helper Python script that does the actual faster-whisper call.
// Kept as a separate process (rather than an npm STT binding) so the heavy
// optional dependency lives entirely in Python-land, and so a missing
// dependency is a clean, catchable subprocess failure instead of crashing
// the Node process.
const SCRIPT_PATH = path.join(__dirname, "..", "..", "python", "transcribe.py");

const MISSING_DEPENDENCY_MARKER = "FASTER_WHISPER_NOT_INSTALLED";

/**
 * Runs local speech-to-text on `inputPath` and writes an SRT to `outputSrtPath`.
 *
 * Availability of faster-whisper is checked lazily, at call time, inside the
 * python subprocess itself — we deliberately do NOT import/require anything
 * whisper-related at Node module load time, so the server starts fine even
 * when faster-whisper isn't installed, and only jobs that actually request
 * auto-generate mode are affected.
 */
export async function transcribeToSrt(
  inputPath: string,
  outputSrtPath: string,
  lang: string
): Promise<void> {
  let result;
  try {
    result = await run("python3", [SCRIPT_PATH, inputPath, outputSrtPath, lang || "en"]);
  } catch {
    throw new Error(
      "Could not run python3 on the server. Auto-generated subtitles require Python 3 with faster-whisper installed."
    );
  }

  if (result.code !== 0) {
    if (result.stderr.includes(MISSING_DEPENDENCY_MARKER)) {
      throw new Error(
        "Auto-generated subtitles require faster-whisper installed on the server (pip install faster-whisper). See backend/README.md."
      );
    }
    throw new Error(`Speech-to-text transcription failed: ${result.stderr.slice(-500)}`);
  }
}
