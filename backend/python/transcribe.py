#!/usr/bin/env python3
"""
Helper invoked by src/services/transcribe.ts to run local speech-to-text via
faster-whisper and write the result as an SRT file.

Usage:
    python3 transcribe.py <input_media_path> <output_srt_path> <lang>

faster-whisper is an OPTIONAL dependency (see backend/README.md). It is
imported lazily inside main(), never at module load time, so:
  - the Node server never needs Python/faster-whisper just to boot up.
  - a missing dependency is reported cleanly (exit code 3, with a
    machine-recognizable marker on stderr) instead of crashing anything.
"""

import sys


MISSING_DEPENDENCY_MARKER = "FASTER_WHISPER_NOT_INSTALLED"


def format_timestamp(total_seconds: float) -> str:
    total_seconds = max(total_seconds, 0.0)
    hours = int(total_seconds // 3600)
    minutes = int((total_seconds % 3600) // 60)
    seconds = int(total_seconds % 60)
    millis = int(round((total_seconds - int(total_seconds)) * 1000))
    return f"{hours:02d}:{minutes:02d}:{seconds:02d},{millis:03d}"


def main() -> int:
    if len(sys.argv) < 4:
        print("usage: transcribe.py <input> <output.srt> <lang>", file=sys.stderr)
        return 2

    input_path, output_path, lang = sys.argv[1], sys.argv[2], sys.argv[3]

    try:
        from faster_whisper import WhisperModel
    except ImportError:
        print(MISSING_DEPENDENCY_MARKER, file=sys.stderr)
        return 3

    try:
        # "base" is a reasonable size/accuracy/speed tradeoff for a server
        # with no guaranteed GPU; int8 keeps CPU inference fast.
        model = WhisperModel("base", device="cpu", compute_type="int8")
        language = None if not lang or lang.lower() == "auto" else lang
        segments, _info = model.transcribe(input_path, language=language)

        with open(output_path, "w", encoding="utf-8") as f:
            index = 1
            for segment in segments:
                text = segment.text.strip()
                if not text:
                    continue
                f.write(f"{index}\n")
                f.write(f"{format_timestamp(segment.start)} --> {format_timestamp(segment.end)}\n")
                f.write(f"{text}\n\n")
                index += 1
    except Exception as exc:  # noqa: BLE001 - surface any failure to the caller
        print(f"transcription failed: {exc}", file=sys.stderr)
        return 1

    return 0


if __name__ == "__main__":
    sys.exit(main())
