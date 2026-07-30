import { spawn } from "child_process";

export interface ExecResult {
  stdout: string;
  stderr: string;
  code: number;
}

/**
 * Run an external binary and collect its stdout/stderr. Never rejects on a
 * non-zero exit code (callers inspect `.code` themselves) — only rejects if
 * the binary itself could not be spawned (e.g. not found on PATH), which
 * callers should catch and translate into a friendly job error.
 */
export function run(cmd: string, args: string[], opts?: { cwd?: string }): Promise<ExecResult> {
  return new Promise((resolve, reject) => {
    let child;
    try {
      child = spawn(cmd, args, { cwd: opts?.cwd });
    } catch (err) {
      reject(err);
      return;
    }

    let stdout = "";
    let stderr = "";

    child.stdout?.on("data", (d) => {
      stdout += d.toString();
    });
    child.stderr?.on("data", (d) => {
      stderr += d.toString();
    });

    child.on("error", (err) => {
      // e.g. ENOENT — binary not on PATH
      reject(err);
    });

    child.on("close", (code) => {
      resolve({ stdout, stderr, code: code ?? -1 });
    });
  });
}
